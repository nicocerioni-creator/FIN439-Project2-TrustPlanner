"""Reproduce the current reference payment schedule, not a final investment decision."""
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent


def main():
    try:
        from backend.main import PaymentRequest, payment_schedule
    except ModuleNotFoundError:
        python = ROOT / '.venv-web' / ('Scripts/python.exe' if sys.platform == 'win32' else 'bin/python')
        if not python.exists() or Path(sys.prefix).resolve() == (ROOT / '.venv-web').resolve():
            raise SystemExit('Install the app first with python3 setup_web.py.')
        raise SystemExit(subprocess.run([str(python), str(Path(__file__).resolve())], cwd=ROOT).returncode)
    output = ROOT / 'outputs/payment-plan.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payment_schedule(PaymentRequest(family_mode='demo')), indent=2) + '\n')
    print(f'Saved {output}\nReference payment section only; no investment experiment or funding verdict.')


if __name__ == '__main__':
    main()
