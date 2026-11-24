# Local web migration validation — November 23, 2026

OpenAI Codex assisted with implementation, setup, testing and documentation. The analysis and decisions are the student's own. Educational and research purposes only; not investment advice; no guarantee of future results.

## Scope

The user explicitly authorized the frontend/backend switch and necessary installations. Migrated the existing Streamlit PAYMENT SECTION to Next.js/FastAPI, preserving the original Streamlit file, shared course environment and lab folders. This does not complete the investment management project, define unresolved mandate rules or satisfy the final submission checklist by itself.

Installed locally: Next.js 16.4.6, React/React DOM 19.3.1, Tailwind/PostCSS 4.3.5, TypeScript and Lucide; FastAPI 0.165.0, Uvicorn 0.54.0, Pydantic 2.14.4, HTTPX 0.28.1 and transitive dependencies in `.venv-web`. npm and pip lockfiles record exact resolved dependencies. Node 24.19.0 and the Python extension were already installed. Installed the official VS Code Tailwind extension 0.16.0; created/opened the project workspace. No model API, key or paid integration is needed.

## Checks and results

| Check | Observed result |
|---|---|
| Existing policy/Streamlit suite | 15 tests pass in the unchanged shared course environment |
| New API suite | 5 tests pass in the dedicated Python 3.11.7 environment |
| Production build | `npm run build` passes, including TypeScript checking |
| Dependency checks | `pip check` reports no broken requirements; npm install/ci reports zero known vulnerabilities at the time run |
| Real local requests | UI GET, reference-case GET and payment POST through Next.js return success; default obligation $800,000 / 32 semesters |
| Browser interaction | Native Safari QA verified reference rendering, five-year degree, college-only mode, stale/export state, validation errors, navigation and JSON download |
| Responsive layout | Inspected a 390×844 viewport and mobile menu; restored normal browser mode afterward |
| Downloaded record | Read the actual downloaded JSON: college-only fixture had zero active adult amounts and 34 semester rows; no fallback result was fabricated |
| Reference reproduction | `python3 reproduce_payment_plan.py` writes the actual reference payment record to outputs/payment-plan.json |
| Production launcher | `python3 run_web.py --production` and same-origin API routing pass |
| Configuration/docs | Workspace/task/schema/output JSON parses; local Markdown links in the main setup documents resolve |
| Existing repository clone | `Part-2-of-FIN439` remains clean; no lab/repository publication performed |

These are 20 unique unit/AppTest checks in total, plus browser, installer, build and HTTP checks. Ordinary development fixtures are not the designated changed-input investment experiment.

## Clean setup check

Copied source without `.venv-web`, node_modules or build outputs into a new temporary folder and ran the documented `python3 setup_web.py`. The clean install created a Python 3.14 environment from the system interpreter and installed the pinned Python/npm dependencies successfully. Launched it with custom ports 3001/8001, verified UI and proxied API responses, checked the reference $800,000/32-semester result, and ran payment reproduction successfully. Both temporary services were then stopped.

First cold-setup/launcher failure: none observed. This was a separate clean folder on the same Mac, not an independently tested Windows/Linux machine. The main working environment remains Python 3.11.7.

An earlier API-test assertion expected the textual decimal representation `825000.0`; the mathematically equal API value was `825000`. Corrected the test to compare Decimal values. Browser review also identified retained scroll position across views; navigation now returns to the top. These issues were addressed before handoff.

## Limits and protected work

- The API exposes reference inputs and payment schedules; `/api/v1/evaluate` deliberately returns HTTP 501, not a funding or portfolio result.
- All displayed schedule money is model-start purchasing power. Future nominal CPI paths, reserve-asset valuation and funding sufficiency are not implemented.
- The UI starts with no selected model date. Actual birthdays/enrollment dates are not supplied.
- The new API bounds degree requests at 100 years for resource safety, not as a mandate recommendation; dates retain 1900–2100.
- v0 did not generate the current interface. The ZIP/prompt are prepared for the user's separate design pass. No v0 login, external code upload, public deployment or repository push was performed.
- No AI-off prediction was authored and no designated changed-input investment experiment was run. Original labs and completed assignments were not edited.

Local test servers were stopped after verification. Run `python3 run_web.py` in the VS Code workspace to start both services.
