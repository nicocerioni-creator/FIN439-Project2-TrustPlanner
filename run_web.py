"""One launcher for the Next.js UI and FastAPI service, with cleanup on Ctrl+C."""
import argparse
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent


def assert_port_available(port):
    with socket.socket() as connection:
        connection.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            connection.bind(('127.0.0.1', port))
        except OSError as exc:
            raise SystemExit(f'Port {port} is in use. Stop that app or pass different --ui-port / --api-port values.') from exc


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ui-port', type=int, default=3000)
    parser.add_argument('--api-port', type=int, default=8000)
    parser.add_argument('--production', action='store_true', help='Serve a completed npm run build instead of the dev server.')
    options = parser.parse_args()
    if options.ui_port == options.api_port:
        raise SystemExit('The UI and API need different ports.')
    python = ROOT / '.venv-web' / ('Scripts/python.exe' if sys.platform == 'win32' else 'bin/python')
    npm = shutil.which('npm')
    if not python.exists() or not npm or not (ROOT / 'frontend/node_modules').exists():
        raise SystemExit('Dependencies are missing. Run python3 setup_web.py first.')
    if options.production and not (ROOT / 'frontend/.next/BUILD_ID').exists():
        raise SystemExit('Build the frontend first: cd frontend && npm run build')
    for port in (options.ui_port, options.api_port):
        assert_port_available(port)
    # This app is keyless. Do not pass unrelated shell credentials or NEXT_PUBLIC
    # variables into either child process. Future integrations need explicit review.
    allowed_environment = {'PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'TEMP',
                           'TMP', 'SystemRoot', 'SYSTEMROOT', 'COMSPEC', 'PATHEXT',
                           'LANG', 'LC_ALL', 'TERM', 'COLORTERM', 'SSL_CERT_FILE',
                           'SSL_CERT_DIR', 'PYTHONUNBUFFERED', 'NO_COLOR'}
    environment = {name: value for name, value in os.environ.items()
                   if name in allowed_environment or name.startswith('LC_')}
    environment['BACKEND_URL'] = f'http://127.0.0.1:{options.api_port}'
    environment['NEXT_TELEMETRY_DISABLED'] = '1'
    children = []

    def stop(*_):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    try:
        api = subprocess.Popen([str(python), '-m', 'uvicorn', 'backend.main:app',
                                '--host', '127.0.0.1', '--port', str(options.api_port)],
                               cwd=ROOT, env=environment, start_new_session=os.name != 'nt')
        children.append(api)
        ready = False
        for _ in range(100):
            if api.poll() is not None:
                raise RuntimeError('The Python API exited. Check the error above.')
            try:
                with urllib.request.urlopen(f'{environment["BACKEND_URL"]}/api/health', timeout=1) as response:
                    if response.status == 200:
                        ready = True
                        break
            except (urllib.error.URLError, TimeoutError):
                time.sleep(0.1)
        if not ready:
            raise RuntimeError('The Python API did not become ready.')
        ui = subprocess.Popen([npm, 'run', 'start' if options.production else 'dev', '--',
                               '--port', str(options.ui_port)], cwd=ROOT / 'frontend',
                              env=environment, start_new_session=os.name != 'nt')
        children.append(ui)
        print(f'\nTrust planner: http://127.0.0.1:{options.ui_port}\nPython API docs: {environment["BACKEND_URL"]}/docs\n'
              'Keep this terminal open. Ctrl+C stops both services.\n', flush=True)
        while all(child.poll() is None for child in children):
            time.sleep(0.5)
        raise RuntimeError('One web service stopped; see the terminal output above.')
    except KeyboardInterrupt:
        print('\nStopping the UI and API...', flush=True)
    finally:
        for child in reversed(children):
            if child.poll() is None:
                if os.name == 'nt':
                    child.terminate()
                else:
                    try:
                        os.killpg(child.pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
        for child in children:
            try:
                child.wait(timeout=8)
            except subprocess.TimeoutExpired:
                if os.name == 'nt':
                    child.kill()
                else:
                    os.killpg(child.pid, signal.SIGKILL)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as exc:
        raise SystemExit(str(exc)) from exc
