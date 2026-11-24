"""Install the local web app into its own environment; never changes the course environment."""
from pathlib import Path
import shutil
import subprocess
import sys
import venv

ROOT = Path(__file__).resolve().parent


def main():
    if sys.version_info < (3, 11):
        raise SystemExit('Python 3.11 or newer is required.')
    npm = shutil.which('npm')
    if not npm:
        raise SystemExit('Install Node.js 20.9 or newer, then run this command again.')
    environment = ROOT / '.venv-web'
    if not environment.exists():
        print('Creating the dedicated Python web environment...', flush=True)
        venv.EnvBuilder(with_pip=True).create(environment)
    python = environment / ('Scripts/python.exe' if sys.platform == 'win32' else 'bin/python')
    subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(ROOT / 'backend/requirements.lock.txt')], check=True)
    subprocess.run([npm, 'ci', '--no-fund'], cwd=ROOT / 'frontend', check=True)
    print('\nInstalled. Start the app with: python3 run_web.py', flush=True)


if __name__ == '__main__':
    try:
        main()
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f'Setup stopped because a dependency command failed (exit {exc.returncode}).') from exc
