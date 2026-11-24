"""Create a scanned, allowlisted GitHub source ZIP. Never stages, commits or pushes."""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
from io import BytesIO
from pathlib import Path
import zipfile
from scripts.source_package import selected_files, audit

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Scan source only; create no package.')
    parser.add_argument('--include-results',action='store_true',help='Explicitly include reviewed outputs/analysis.json and analysis-summary.md.')
    options = parser.parse_args()
    sources = selected_files(ROOT)
    if options.include_results:
        required=('outputs/analysis.json','outputs/analysis-summary.md')
        optional=('outputs/college-calendar.json','outputs/changed-input.json','outputs/changed-college-calendar.json','outputs/changed-input-comparison.json')
        for name in (*required,*(n for n in optional if (ROOT/n).is_file())):
            result=ROOT/name
            if not result.is_file(): raise SystemExit('Run the saved-plan replay before including reviewed results.')
            if result.is_symlink(): raise SystemExit('Result symlinks are not permitted.')
            sources.append(result)
    findings = audit(ROOT, sources)
    if findings:
        # Do not echo matching values, snippets or exception strings.
        for f in findings: print(f"BLOCKED: {f['file']} line {f['line']} ({f['rule']})")
        raise SystemExit('Source check failed. No new upload package was created. Any older package is not refreshed.')
    print(f'Source check passed: {len(sources)} allowlisted files; no matching secret patterns.')
    if options.check: return
    # Verify the exact in-memory bytes before creating any upload artifact.
    from scripts.source_package import secret_findings
    verified = []
    for source in sources:
        data = source.read_bytes()
        if secret_findings(data):
            raise SystemExit('Source changed during packaging. No new upload package was created.')
        verified.append((source.relative_to(ROOT).as_posix(), data))
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    entries = []
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as z:
        for rel, data in verified:
            z.writestr(rel, data)
            entries.append({'path': rel, 'bytes': len(data), 'sha256': sha256(data).hexdigest()})
        manifest = {'purpose': 'Scanned source package; no credentials, Git history, environments, builds or raw v0 export',
                    'generated_utc': stamp, 'files': entries}
        z.writestr('UPLOAD-MANIFEST.json', json.dumps(manifest, indent=2) + '\n')
    output = ROOT / 'dist'
    output.mkdir(exist_ok=True)
    archive = output / f'github-source-{stamp}.zip'
    with archive.open('xb') as f:
        f.write(buffer.getvalue())
    print(f'Created {archive}\nUse this package, not a ZIP of the whole course folder. No GitHub upload was performed.')


if __name__ == '__main__': main()
