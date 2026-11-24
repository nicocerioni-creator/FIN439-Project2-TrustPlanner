# v0 frontend integration — November 23, 2026

OpenAI Codex reviewed and integrated the user-supplied v0 interface. v0 supplied the visual/component redesign. The analysis and decisions remain the student's own. Educational and research purposes only; not investment advice or a guarantee of future results.

## Completed UI integration

Source export: `v0UpdatedFrontEnd/`, preserved unchanged. Working application: `frontend/`. Imported the app layout/styles, modular planner components, live state hook, formatters, SVG icon, and separate illustrative preview. The export used the same dependency list, versions, API adapter and Next.js proxy configuration as the working project; no package installation or dependency change was needed.

The live route `/` still calls the existing Python API. `/design-preview` uses the frozen reference response in a clearly labelled separate view; it does not calculate or export results. It is never substituted automatically for an API error. Small integration fixes retain navigation-to-top, prevent a stale successful result from masking an unavailable service indicator, and explain failed-request export blocking.

## Protected model boundary

Before copying files, saved hashes of backend Python/tests/dependency files, payment_policy.py, original Streamlit/tests/requirements, and frontend API adapter/proxy/package/lockfiles. All protected hashes still match after integration. Model outputs and API response fields are unchanged. The API test suite still passes. Original labs and the user-supplied export were not edited.

Pre-integration frontend backup: `backups/frontend-before-v0-20261123-133424.zip`. Hash record: `backups/v0-integration-protected-hashes.json`. Backups are ignored by Git.

## Verification

- Production Next.js build and TypeScript checks pass, including live and illustrative routes.
- Five existing API tests pass. Source hashes verify the untouched model and existing Streamlit checks; the UI-only change does not modify those tests.
- Live browser QA in Chrome: reference response $800,000 / 32 semesters; five-year degree $850,000 / 34 semesters; stale-result indication before update; invalid adult goal rejected; adult-support toggle and retained values; college-only alternative; navigation; child filter showing 10 of 34 semesters; actual JSON download.
- Read the downloaded JSON and compared it to the backend response for the identical inputs: exact match. No browser-side financial result replaced Python output.
- Real local GETs and API proxy succeed; separate preview HTML contains its illustrative label.
- Returned the browser to the reference inputs after correctness checks. Existing user-owned app servers were preserved; no extra server was started or stopped.

Browser testing used ordinary payment correctness fixtures already represented in the API tests. It did not run the designated changed-input investment experiment. No AI-off prediction was authored, no repository push occurred and no public deployment was performed.

## Transition to functionality

During integration the user confirmed a FIXED college allowance, not reimbursement, and an analysis horizon until the youngest reaches 80. Starting ages imply 78 years / 936 months; oldest reaches 86. This is a planning cutoff, not proof of lifetime funding. These new choices are documented for the next functional stage; the backend remains unchanged during UI integration.

User subsequently selected MONTHLY CPI-U updates, U.S. city average, all items, not seasonally adjusted, using the latest observation published by reference/update dates. User also selected MONTHLY adult-support-level reviews, separate from CPI indexing. These are confirmed mandate decisions queued for the next functional stage, not new backend calculations implemented during UI integration. Exact within-month dates, future scenario paths and quantitative cut/restoration rules remain open. [BLS guidance](https://www.bls.gov/cpi/factsheets/escalation.htm) explains the series-selection/update details required for payment escalation; [BLS seasonal-adjustment guidance](https://www.bls.gov/cpi/seasonal-adjustment/using-seasonally-adjusted-data.htm) advises against seasonally adjusted indexes for escalation agreements. Monthly frequency is the user's choice, not a claim that BLS requires it.

Continue functional development before the full rubric audit, as requested. Preserve the saved eight requirements, distinct video requirements, final Markdown artifacts and the locked-prediction sequence throughout development. The detailed rubric remains pending in the saved record.
