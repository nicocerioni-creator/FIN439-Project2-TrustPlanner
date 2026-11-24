> **Latest API3.1.0 review workflow:** [Open the functional review guide](functional-review-guide.md) for adaptive support, portfolio/stress comparisons, saved plans and exact-input replay. Earlier setup/migration sections below remain useful; historical incomplete-feature notes are superseded by that guide.

OpenAI Codex assisted with setup, code, tests and documentation. The analysis and decisions are the student's own.

For educational and research purposes only; not investment advice. No guarantee of future results.

# Work in VS Code with Next.js and FastAPI

## What is ready

The existing payment-planning features run in a local Next.js/React/TypeScript interface connected to Python/FastAPI. Tailwind CSS is installed and configured. The user-supplied v0 redesign from `v0UpdatedFrontEnd/` is now integrated into the working frontend. No automated v0 account connection or public deployment was performed. The live app uses the existing Python API; the separate `/design-preview` route is clearly labelled illustrative and cannot calculate or export a live result.

Current functions: a protected Demo family and adjustable Your family (add/remove children, ages and independent degree lengths); August 1 / January 1 payments; editable first fall year and estimated May 31 / December 31 graduation dates; optional model start date; editable college allowance; adult-support toggle/minimum/goal; graduation and first adult-payment timing; semester-start payment schedule; full college obligation in model-start dollars; CPI/deflation policy; validation; and JSON exports. The CPI-adjusted college accounting reserve and optional future-CPI college scenario are now implemented. Connected deterministic monthly funding scenarios are now implemented; adaptive adult-support rules, portfolio comparisons, stresses and final committee recommendations remain unfinished.

The original Streamlit app and labs are preserved. The dedicated `.venv-web` environment keeps new Python dependencies separate from the shared course environment.

## Open and run

1. Open `Trust Planner.code-workspace` from this project's main folder in VS Code. You can double-click it in Finder or choose **File → Open Workspace from File** in VS Code.
2. Choose **Terminal → New Terminal**. The workspace opens the terminal in the correct project folder.
3. Run:

```sh
python3 run_web.py
```

4. Open **http://127.0.0.1:3000**. Python API documentation is at **http://127.0.0.1:8000/docs**.

Leave the launcher terminal open; **Ctrl+C stops both services**. You can also choose **Terminal → Run Task → Trust planner: run web app**. If the app is already running from Codex, use that preview; starting a second copy on the same ports will produce a clear port-in-use error.

Frontend edits hot-reload. For changes to the Python API or finance code, stop the launcher and run it again. No environment activation is required: the launcher selects `.venv-web` automatically. Changing the server-side proxy destination requires restarting Next.js.

## Use the family and calendar controls

1. Open **Family & payments**. **Demo family** retains the original four ages (8, 6, 4, 2), $50,000 college allowance and enabled $20,000/$200,000 adult minimum/goal. Its benefit and family controls are read-only.
2. Select **Your family** to add/remove children, change whole-year ages, degree lengths and amounts, or switch adult support off. Returning to Demo family retains custom edits for this page session. Refreshing the page still resets inputs.
3. Choose a **Model start date** to calculate dates. Ages are assumed exact on that date. Entry defaults to the first August 1 on or after age 18; semesters alternate August 1 and January 1.
4. Expand a child's **College calendar overrides** to enter a first fall payment year or graduation date. The estimate is May 31 after a spring final semester or December 31 after a fall final semester. A graduation override must lie within the last funded semester; increase degree length if another semester needs funding.
5. Click **Update payment plan**. Review the dates/table, College reserve schedule and Evidence & exports. Past semester dates are excluded; payments due on model start remain included. Each remaining semester receives half the annual allowance in model-start dollars.
6. Adult eligibility starts at graduation; its first monthly payment is one month later (clamped for shorter months). This section does not yet decide whether the assets can fund those payments.

## Install on another computer

Prerequisites: Python 3.11 or newer and Node.js 20.9 or newer. Node 24.19.0 and Python 3.11.7 were used on this Mac. The pinned Python packages and npm lockfile record this installation.

From the project folder:

```sh
python3 setup_web.py
python3 run_web.py
```

The setup script creates `.venv-web`, installs `backend/requirements.lock.txt`, and runs `npm ci` inside `frontend`. These installation steps require internet access. The v0 design's Geist/Newsreader fonts also download at initial development/build time through Next.js and are self-hosted in the built app. The app uses local services and no API keys. The VS Code workspace uses macOS/Linux interpreter paths; on Windows, select `.venv-web\Scripts\python.exe` manually.

## Where to edit

| Location | Purpose |
|---|---|
| `frontend/app/page.tsx` | Live page entry point connecting the state hook to the UI |
| `frontend/components/planner/` | v0-designed navigation, forms, timeline, reserve/filter tables, evidence and status components |
| `frontend/hooks/use-payment-plan.ts` | Live API state, validation-error handling, stale-result/export protection |
| `frontend/app/globals.css` | Current visual design; Tailwind is also available |
| `frontend/lib/api.ts` | Request/response types and the connection to Python |
| `frontend/next.config.ts` | Same-origin `/api/` proxy to FastAPI |
| `backend/main.py` | API request validation and payment-schedule responses |
| `academic_calendar.py` | New academic dates, graduation overrides and remaining-semester filtering |
| `payment_policy.py` | Preserved original finance/policy helpers |
| `docs/api/openapi.json` | Exported real API schema |
| `docs/api/payment-schedule.example.json` | Real reference schedule; not an investment experiment |
| `run_web.py` | One launcher for both services |

Do not move finance formulas into React or overwrite original lab folders. API degree inputs are bounded at 100 years to limit request size; that is a technical safety bound, not a trust mandate or recommended degree duration. Dates retain the original 1900–2100 model-start range. Money travels as decimal strings to retain exact Python amounts.

## Give the interface to v0

1. Open v0 and create a new design project/chat. Do not connect it to the existing public course repository for this first design pass.
2. Import/upload **`v0-frontend-handoff.zip`** from this project folder. It contains only frontend source, the npm lockfile, the API reference files and the design prompt. It excludes environments, installed packages, personal keys, labs and Git history.
3. Open **`docs/V0-PROMPT.txt`**, select all, and paste it into v0.
4. Iterate on typography, layout, navigation and charts while preserving the adapter and API field names.
5. Download the complete generated project into a **separate new folder**. Do not overwrite the working frontend immediately. Keep the current project as your working reference and bring the exported source back to Codex for review/integration in VS Code.

The v0 cloud preview cannot call `127.0.0.1:8000` on your Mac. That is expected. The prompt permits a clearly labelled design-only reference fixture for preview, while the local app keeps real API calls. A hosted UI requires an appropriately hosted backend or combined deployment; that is a separate step from this local migration. No public deployment has been performed.

If v0 introduces new dependencies, review its package manifest before installing. API changes require coordinated TypeScript/Python updates and regenerated contract exports; a visual redesign should not require those changes.

## Useful checks and reproduction

Backend API fixtures:

```sh
.venv-web/bin/python -m unittest discover -s backend/tests -v
```

Shared pure policy checks in the new environment:

```sh
.venv-web/bin/python -m unittest discover -s tests -p 'test_payment_policy.py' -v
```

The24 root checks (15 preserved policy/Streamlit,6 calendar,3 packaging) run with the course environment; the API suite above has25 checks (49 Python checks overall):

```sh
../../../.venv/bin/python -m unittest discover -s tests -v
```

Frontend production build:

```sh
cd frontend
npm run build
```

From the project root, `python3 run_web.py --production` serves that build. The default launcher is the development server. For custom development ports use `python3 run_web.py --ui-port 3001 --api-port 8001`. The current production build embeds its proxy destination at build time; rebuild with the desired `BACKEND_URL` if changing the API port in production mode.

To reproduce the reference payment schedule without running the UI:

```sh
python3 reproduce_payment_plan.py
```

This writes `outputs/payment-plan.json`. It reproduces the CURRENT PAYMENT SECTION, not a final trust investment decision. The scheduled reference college obligation is $800,000 in model-start dollars, across 32 semesters. It is not a nominal future total or reserve-asset valuation.

No test or design fixture above is the designated changed-input investment experiment. That experiment remains locked until the student authors and commits their own AI-off prediction on GitHub.

## Troubleshooting

- **Port already in use:** use the app already running, stop its launcher with Ctrl+C, or select other ports. The launcher does not stop unrelated processes.
- **Cannot connect / backend unavailable:** check the launcher terminal. Start both services with `python3 run_web.py`; opening the Next.js frontend alone is insufficient.
- **Results are out of date:** click Update payment plan after editing. Exports are disabled until the current inputs have been successfully calculated.
- **A smaller adult goal is rejected:** with support enabled, the goal must be at least the minimum. College-only mode removes active adult obligations while retaining the entered amounts for later.
- **Refresh resets my inputs:** inputs are currently page-session only, matching the working app's saved scope. Download assumptions before closing or refreshing; file import/persistent user accounts are not implemented.

## Sources

[Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Tailwind PostCSS setup](https://tailwindcss.com/docs/installation/using-postcss), [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/), and [v0 GitHub handoff](https://v0.app/docs/github). Checked November 23, 2026.

## Calculate CPI-adjusted college reserves

1. In Family & payments select a model start date and click Update payment plan.
2. Open College reserve. Under Value the college reserve choose a valuation date from model start through today. Historical CPI lookup requires February1913 or later.
3. Optionally enter assets designated specifically for college, valued on that date. The app will compare them with the full undiscounted reserve and report a shortfall or surplus. Asset eligibility and liquidity still require separate rules.
4. Optionally enter a future annual CPI-change scenario. Leave it blank for no future nominal forecast. This field is an assumption, not a predicted return or known future inflation.
5. Click Calculate college reserve. Review baseline/effective observation months and prior-day vintage cutoffs. The start-month baseline applies until the next first-day update.
6. Download reserve & CPI record after a successful current calculation. Edits or errors disable the export. Reserve form values are currently reset when you leave this view; export before navigating away.

No key is required. The lookup uses public ALFRED CSV downloads; a data outage shows an error and does not invoke paid services.

## Prepare the GitHub source package

Run `python3 prepare_github_upload.py --check`, then `python3 prepare_github_upload.py`. Use the timestamped ZIP in dist/ containing an internal hash manifest. It excludes credential/environment files, installed dependencies, build output, backups, raw v0 source and Git history. No commit/upload/push occurs. See security-and-free-data.md. Do not ZIP the whole course directory or upload a .env file.

## Why the reserve date depends on model start

Model start is the beginning of the whole financial plan, not a graduation date. Reserve valuation is the date on which you measure the college-designated assets and remaining obligations. For the published-CPI calculation, valuation must be on/after model start and no later than today (Eastern). Both dates may be the same. Future college payments are included in that current reserve; they do not force the valuation date into the future.

A future model start produces no valid published-CPI valuation range yet. The interface now explains that conflict before submission and disables the calculator. To calculate today's reserve, choose today or an earlier model start in Family & payments, then update the plan. Do not change the model start to a graduation date unless that is also when the entire plan actually begins. No model date is changed automatically. A future-start scenario valuation is not implemented; the existing optional future-CPI field projects payments after a valid current/historical valuation, rather than supplying a future historical baseline.

## Project the connected trust balance

1. In Family & payments choose the model start date and update the plan. Ages and purchasing-power amounts are anchored to that date. A forward scenario may use a future start; the published-CPI snapshot calculator remains limited to known dates.
2. Open Funding & cash flows. Demo opening assets are10million; choose Your family to enter a custom opening balance. This total already includes college assets.
3. Enter separate effective annual gross returns for college and support assets, one annual asset-based cost rate, and an annual future CPI-change assumption. All are explicit scenario inputs; enter0 explicitly where intended. No rate is preset as a forecast.
4. Choose the scenario reserve rule: top up/release at CPI resets and before payments, or keep accounts separate and flag coverage gaps. Choose whether a payment due exactly on the youngest's80th birthday is included. These settings are explicit conventions, not hidden policies.
5. Calculate. Review the opening split, independent minimum/goal outcomes, real-balance chart and exact first shortfall dates. A completed cash-flow path does not prove risk-limit compliance or lifetime solvency. A goal shortfall can precede a minimum shortfall.
6. Inspect the annual summary or paginated monthly ledger. The accounts sum to the total, and account transfers never create returns or extra money. If any distribution is unpaid, that path stops and records the unmet amount rather than inventing an adult-cut formula.
7. Download funding projection JSON to retain the full inputs, conventions and ledgers. Funding state survives navigation within the page, while refresh resets it. The separate quick reserve comparison does not supply this projection's rates or assets automatically.

For developer checks run `node frontend/scripts/check-funding-ui.js` from the project root. It uses installed React/TypeScript and the synthetic API fixture; no browser, paid API or added package is required.
