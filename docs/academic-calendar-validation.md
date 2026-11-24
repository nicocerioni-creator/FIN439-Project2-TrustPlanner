# Academic calendar and configurable family — November 23, 2026

Codex assisted with implementation, checks and documentation; policy choices are the student's. Educational/research use only; not investment advice or a guarantee.

This functional update follows the completed UI-only v0 integration. User authorized August 1 fall/January 1 spring payments, an adjustable family with a retained demo, first fall on/after age 18 plus first-year override, and editable estimated May 31/December 31 graduation. API version is now 2.0.0; the original endpoint paths remain /api/v1/ for local compatibility. Request/response types and examples were regenerated together. No package/dependency changes.

## Implemented and checked

| Check | Result |
|---|---|
| 15 original policy/Streamlit checks | PASS; original files unchanged |
| 6 new pure academic-calendar checks | PASS: early/late birthdays, 5/7-month semester gaps, spring/fall finals, date overrides, due-today inclusion and undated behavior |
| 9 API checks | PASS: dates, reference totals, custom 0/1/5-child cases, older-child remaining obligations, readonly demo enforcement and invalid/misaligned inputs |
| Next.js production build / TypeScript | PASS |
| Live proxy health | API 2.0.0 connected |
| Browser family flows | PASS: demo controls readonly; add fifth child; edit oldest age; remove fifth child; visit demo and restore custom age; calculate dated custom schedule; return to reference demo |
| Protected original helper/fallback/tests | Saved hashes match |

Commands from the root: `.venv-web/bin/python -m unittest discover -s backend/tests -v`; `../../../.venv/bin/python -m unittest discover -s tests -v`. Build: `npm run build` from frontend/. These 30 checks are ordinary payment correctness fixtures, not the designated changed-input investment experiment.

For model start September 1, 2026, an age-8 child defaults to first college payment August 1, 2037. A four-year degree ends with the January 1, 2041 payment, estimated graduation May 31, 2041 and first adult payment June 30, 2041. A five-year degree covers ten semesters through January 1, 2042, with graduation May 31, 2042 and first adult payment June 30, 2042. A 3.5-year degree ends with a fall semester and December 31 graduation. Exact birthdays are inferred from ages assumed exact at model start.

Undated schedules retain counts and amounts but do not invent dates/month offsets. Children over 18 and calendar overrides require a model date. Past semesters are excluded from the remaining college total; due-on-start payments remain included. No assertion about paid arrears is made. Graduation overrides are constrained to the final funded semester to keep funding-through-graduation coherent; additional semesters require a longer degree.

The demo remains four ages 8/6/4/2, four-year degrees, $50,000 annual college allowance and enabled $20,000/$200,000 adult minimum/goal. Its undated reproduction remains $800,000 / 32 semesters. Custom families have technical bounds of 0–50 children, ages 0–100 in whole years and half-year degree lengths up to 100 years. Empty family produces zero obligations and no youngest-age horizon. Custom drafts are retained only in page memory, not after refresh.

All monetary outputs remain model-start dollars. CPI-U/monthly updates, monthly adult reviews and the dynamic youngest-age-80 horizon are recorded as confirmed policy; no future CPI, adult adjustment formula, funding sufficiency, assets, allocation or investment returns are calculated. /evaluate still returns explicit HTTP 501. Original labs, raw v0 export, payment_policy.py, Streamlit fallback and original tests are preserved. No public deployment/push, prediction authorship or locked experiment run occurred. Local launcher was restarted to load Python changes and left running at UI3000/API8000.
