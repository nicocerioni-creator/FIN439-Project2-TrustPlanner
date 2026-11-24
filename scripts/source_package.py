"""Allowlisted source selection and value-redacting secret checks. Standard library only."""
from pathlib import Path
import re

ROOT_FILES = {
    '.gitignore', 'README.md', 'RESUME.md', 'Trust Planner.code-workspace',
    'academic_calendar.py', 'payment_policy.py', 'streamlit_app.py', 'requirements.txt',
    'run_web.py', 'setup_web.py', 'reproduce_analysis.py', 'reproduce_payment_plan.py', 'reproduce_submission.py', 'run_changed_input.py', 'prepare_github_upload.py',
}
SOURCE_DIRS = {'backend', 'frontend', 'docs', 'tests', 'scripts', '.vscode'}
BLOCK_DIRS = {'.git', '.next', 'node_modules', '__pycache__', '.venv-web', '.venv',
              'secrets', 'credentials', 'backups', 'dist', 'v0UpdatedFrontEnd'}
SUFFIXES = {'.py', '.ts', '.tsx', '.js', '.mjs', '.css', '.md', '.txt', '.json',
            '.svg', '.ico', '.png', '.jpg', '.jpeg', '.toml'}
# Match values but report ONLY rule/line metadata, never matching text.
RULES = [
    ('private-key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')),
    ('github-token', re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b')),
    ('provider-token', re.compile(r'\b(?:sk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|xox[baprs]-[A-Za-z0-9-]{20,})\b')),
    ('literal-credential', re.compile(r'''(?i)["']?(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)["']?\s*[:=]\s*["']([A-Za-z0-9_./+=-]{16,})["']''')),
    ('public-secret-variable', re.compile(r'NEXT_PUBLIC_[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*[:=]')),
]
PLACEHOLDERS = ('example', 'placeholder', 'your_', 'replace_', 'test_', 'dummy', 'redacted', 'not-a-real')


def forbidden_name(path):
    parts = [p.lower() for p in path.parts]
    name = parts[-1]
    if path.suffix.lower() in {'.json','.html','.csv'} and name.startswith(('trust_planner_settings','trust_analysis_settings','portfolio_funding_analysis','funding_projection','college_reserve','college_payment_plan','payment_assumptions','investment_growth_simulation','trust_results_summary','trust_evidence_record','college_calendar')):
        return True
    return (any(p in BLOCK_DIRS or p.startswith('.env') for p in parts)
            or name in {'.netrc', '.npmrc'}
            or bool(re.search(r'(?:api[-_]?keys?|secrets?|tokens?)(?:[._-]|$)', name))
            or any(word in name for word in ('credential', 'service-account'))
            or path.suffix.lower() in {'.pem', '.key', '.p12', '.pfx', '.log'})


def selected_files(root):
    """No broad archive of the course repo; never read credential-file contents."""
    candidates = [root / name for name in ROOT_FILES if (root / name).is_file()]
    for name in sorted(SOURCE_DIRS):
        folder = root / name
        if not folder.exists():
            continue
        # Prune excluded folders before entering them.
        import os
        for base, dirs, files in os.walk(folder, followlinks=False):
            dirs[:] = [d for d in dirs if not forbidden_name(Path(base).relative_to(root) / d)
                       and not (Path(base) / d).is_symlink()]
            for name in files:
                path = Path(base) / name
                rel = path.relative_to(root)
                if not forbidden_name(rel) and (path.suffix.lower() in SUFFIXES or name == 'AGENTS.md'):
                    candidates.append(path)
    payment_output = root / 'outputs/payment-plan.json'
    if payment_output.is_file(): candidates.append(payment_output)
    for name in ('data/market/prices.csv','data/market/manifest.json'):
        public = root / name
        if public.is_file(): candidates.append(public)
    chosen = []
    for path in sorted(set(candidates)):
        if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Source packaging refuses symlinks or paths outside the project.')
        chosen.append(path)
    return chosen


def secret_findings(data):
    text = data.decode('utf-8', errors='replace')
    findings = []
    for name, pattern in RULES:
        for match in pattern.finditer(text):
            if name == 'literal-credential' and any(p in match[1].lower() for p in PLACEHOLDERS):
                continue
            findings.append({'rule': name, 'line': text.count('\n', 0, match.start()) + 1})
    return findings


def audit(root, files):
    results = []
    for source in files:
        for finding in secret_findings(source.read_bytes()):
            results.append({'file': source.relative_to(root).as_posix(), **finding})
    return results
