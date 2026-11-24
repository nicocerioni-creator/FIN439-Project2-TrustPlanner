# Connected funding projection — step1

November23,2026. Codex assisted with implementation and testing; decisions and analysis remain the student's. Educational/research use only; not investment advice or a guarantee.

## Implemented

API2.2.0 adds POST /api/v1/funding-projection, FundingRequest, backend/funding_projection.py, coordinated TypeScript types and Funding & cash flows navigation/view. The opening trust balance includes the college reserve; it is never added a second time. Allocate up to the full undiscounted remaining real college obligation from opening assets, with the remainder assigned to support. Demo opening balance is10million; custom balance is entered by the user. Existing original labs/helpers/Streamlit fallback remain unchanged.

Every return, cost and CPI assumption is required explicitly; there is no default10% return or future inflation. College/support accounts have separate effective annual nominal gross-return assumptions and a common annual asset-based cost assumption. Gross growth and costs accrue between dated events using actual days /365.2425 and cent rounding. College is paid August1/January1; adult payments begin one month after graduation, then recur monthly anchored to the first payment's day (clamped in shorter months). No past arrears are reconstructed.

The CPI ratio begins at1 in model-start purchasing-power units and compounds one monthly step on each subsequent first day. This is an entirely assumed forward path; no published future CPI or historical-market reconstruction is claimed. It works for a past, current or future model start, unlike the separate published-CPI reserve lookup. Inputs have technical bounds: annual returns greater than-100% through100%, costs0% to below100%, future CPI-50% through100%. These are request-size/numerical bounds, not recommendations.

Reserve transfers are an explicit required scenario choice: top up/release at monthly CPI updates and before distributions (also reconcile at the final date), or leave the accounts separate and flag coverage gaps. No default mandate amendment is silently selected; a chat question about preferred reserve transfers remains pending unless subsequently answered. In either mode, amounts needed for an unfilled college requirement are unavailable for adult withdrawals. The two accounts are bookkeeping partitions, not selected investments or verified eligible/liquid holdings.

The final-day treatment at youngest80 is also required explicitly: include payments due that day or stop the previous day. College obligations beyond that cutoff remain reserved and are flagged. The finite horizon is not lifetime solvency.

Adult-on runs independent fixed minimum and goal paths with identical starting assets/assumptions. Adult-off runs one college-only path. The simulation does not invent an adaptive reduction/restoration policy. Each path stops at its first distribution that cannot be paid fully, reporting scheduled/paid/unpaid amounts, the exact date and any hard-minimum shortfall. Unpaid college due remains part of the final reserve requirement. Aggregate partial adult payments do not infer a sharing formula among children. A goal shortfall while the minimum remains affordable is distinguished from a floor breach. Balances never go negative or silently borrow money.

Every monthly row and full path must reconcile exactly: opening +gross growth−costs−college paid−adult paid=closing. College/support transfers do not change total assets. Annual summaries, nominal/model-start-dollar balances, conditional outcomes, reserve-gap/minimum-breach dates, comparison chart, paginated monthly ledger and full JSON export are available. Funding inputs/results stay mounted across navigation; edits, failed requests or changed family inputs block exports. Refresh still resets page-session state. The published-CPI reserve calculator remains a separate quick comparison and explicitly points to the connected model.

## Verification

-25 backend/API tests pass:9 payment API,8 CPI/reserve/date-range and8 new funding checks.
-24 root checks pass:15 original policy/Streamlit,6 calendar,3 source packaging. Total49 Python correctness checks.
-New funding checks: one opening balance and no double-counting; exact ledger reconciliation; college semester cash flows; independent minimum/goal paths; goal failure distinct from minimum failure; CPI top-up/deflation release/separate-account gaps; retained unpaid college due; exact first adult date and shared-date college priority; explicit terminal-day handling and retained beyond-horizon obligations; gross return/cost accrual; required/invalid assumptions; future-start scenario and credential-value rejection.
-Production Next build/TypeScript pass. `node frontend/scripts/check-funding-ui.js` checks explicit form inputs, correct request snapshot, rendered outcomes, exact JSON export, stale/error/global-stale export guards and illustrative-preview isolation with a mocked API response. This is component-level testing, not browser automation.
-Live local proxy/API fixture passes, including no-store headers and independent path outcomes. docs/api/funding-projection.example.json is a deliberately synthetic one-year unit example: one already-graduated age79 beneficiary,120 opening assets,120/1200 annual adult amounts, zero returns/costs/CPI. It is not a reference-trust forecast, allocation, changed-input investment run or student prediction.
-Interactive browser access host was unavailable; no live visual/browser-pass claim is made for this new view. Existing interface patterns are reused.

Commands: `.venv-web/bin/python -m unittest discover -s backend/tests -v`; `../../../.venv/bin/python -m unittest discover -s tests -v`; `npm run build` in frontend/; `node frontend/scripts/check-funding-ui.js` from root. Source and browser-bundle pattern scans and protected original hashes are checked before packaging.

## Remaining boundary

No portfolio/asset-selection engine, investment signal, volatility/turnover verdict, stress probabilities, adaptive adult rule, contributions or tax engine. /evaluate remains501 for unfinished portfolio/adaptive decisions. One-command reference payment reproduction remains payment-only; final graded decision reproduction still needs the later investment module. No keys, paid APIs, installations, dependency changes, source-lab edits, public deployment/GitHub push, AI-off prediction authorship or designated changed-input investment experiment occurred.
