# Credentials, free data and GitHub source packaging

User policy confirmed November 23, 2026: no owner API keys may appear in the app, browser bundles, exported results, handoffs or GitHub upload. Optional user-provided keys are permitted only for genuinely free services requiring no payment. Paid services, credit-card requirements, trial credits that later require payment and paid-overage integrations are outside this project's scope.

## Current implementation

- The app is **keyless**. No owner or user API key is required, loaded or embedded. No key-upload form is implemented because the current functions do not need one. No account, billing or paid fallback integration is installed by this change.
- CPI uses the public ALFRED CSV endpoint for CPIAUCNS, corresponding to BLS CUUR0000SA0. Downloads happen in Python and use no API-key header/query parameter. Only the fixed HTTPS ALFRED destination is allowed; users cannot supply arbitrary provider URLs. Downloads have timeout/size limits and a bounded hourly cache.
- Source is free Federal Reserve data access, checked November 23, 2026: [FRED legal/use guidance](https://fred.stlouisfed.org/legal/) describes its free data API. The implementation uses public CSV downloads rather than requiring an API account. Source unavailability produces an error, with no paid-service or sample-data fallback.
- run_web.py passes only necessary system variables to its child services, excluding unrelated shell secrets and public-prefixed environment variables. Backend credentials are not rendered into HTML, frontend props or responses. The local app remains loopback-only.
- API validation responses omit rejected input values. The UI displays concise error messages; upstream exceptions/headers are not echoed. Financial API responses use Cache-Control: no-store. Default access logs record method/path/status, not request bodies.
- Payment/reserve exports contain calculation inputs, amounts and public CPI provenance, never credentials. They can still contain a user's entered financial assumptions; the app does not upload these files anywhere automatically.

## Prepare GitHub source

From Project 2 Final:

```sh
python3 prepare_github_upload.py --check
python3 prepare_github_upload.py
```

The second command creates a timestamped **dist/github-source-…zip**, with an internal UPLOAD-MANIFEST.json recording included paths, byte counts and SHA256 hashes. It does not stage, commit, upload or push anything. Extract that package to the intended repository; do not upload a ZIP of the whole course folder. dist/ is ignored.

Packaging uses an explicit source allowlist, excluding .env variants, credentials/secrets/token files, private-key files, environments, installed packages, build output, backups, raw v0 exports, Git history and unrelated coursework. It refuses symlinked source files and paths outside the project. It scans the exact bytes before writing the archive and blocks common token formats, private-key blocks, quoted credential assignments and public secret-variable assignments. Diagnostics report file/rule/line only and never print the matching value. If checks fail, no new package is created; an old package is not refreshed.

.gitignore excludes environment/credential files, but ignore rules do not remove an already tracked file or historical commit. The current working final-project path had no tracked files when inspected; no claim was made that the unrelated parent course repository or a remote repository's full history was audited. Use the scanned, history-free package for the upcoming source upload. Automated pattern checks reduce risk but cannot identify every possible credential format; do not paste credentials into source or documentation.

## Future optional user keys

Before adding a provider, verify official terms show no required payment method, paid usage, automatic upgrade or payable overage. If it fails that requirement, do not integrate it. Prefer keyless public sources. Any later user-key form must use masked input, transmit only to its intended backend/provider, retain the key only for the active user session and exclude it from logs, analytics, error messages, localStorage, exports and source packages. Do not share one user's key with other users. A masked input alone does not hide a credential embedded in browser JavaScript; Next.js explains [browser exposure of public-prefixed variables](https://nextjs.org/docs/app/guides/environment-variables).

## Checks

Synthetic checks verify .env/credentials/build/raw-export exclusion, token blocking with value-redacted diagnostics, symlink rejection and validation-response redaction. No real credential file was opened just to inspect its contents. Original labs and original fallback code/tests remain preserved. No GitHub upload/push, AI-off prediction authorship or designated changed-input investment experiment occurred.

Final source scan passed;13 built browser JavaScript bundles also had zero matching credential patterns. This is a bounded pattern check, not a claim to audit unknown remote Git history.
