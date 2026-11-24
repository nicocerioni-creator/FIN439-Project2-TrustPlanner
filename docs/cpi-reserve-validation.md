# CPI and college reserve validation — November 23, 2026

Codex assisted with implementation and checks; decisions and analysis are the student's. Educational/research use only; not investment advice or a guarantee.

Confirmed: full undiscounted remaining college allowance, CPI-adjusted; monthly first-day updates before payments with prior-day publication cutoffs; baseline uses a vintage before model start. The start-month baseline remains effective until the next first-day reset. API2.1.0 adds POST /api/v1/college-reserve while preserving the existing payment endpoint. /evaluate remains501 for unfinished portfolio/overall funding decisions.

College reserve calculation includes all remaining semesters (including any beyond the analysis horizon), excludes dates before valuation, includes due-today payments, and uses the CPI ratio from model start. Each semester is rounded to cents before summation; indexed annual amounts are rounded separately. Asset comparison uses user-reported college-designated assets only; eligibility/liquidity and inflation backing are not verified. Passing this accounting comparison is not full trust compliance or lifetime solvency.

Future annual CPI change is optional and blank by default. If supplied, it is explicitly a scenario, compounded at monthly first-day resets after the effective reference month. No future observed CPI or investment return is fabricated. A blank scenario yields no nominal forecast. Deflation lowers amounts proportionately. Adult annual minimum/goal are CPI-indexed for display; adult affordability/cut/restoration rules and a full monthly adult cash-flow engine remain unfinished.

## Checks

- 16 API/CPI/reserve checks PASS (9 existing API +7 new): full reserve and shortfall, baseline/month boundary, deflation, due-today/past filtering, scenario reconciliation, disabled-adult zero, vintage/series/missing-value validation, invalid inputs, free-source failure and rejected-credential redaction.
- 24 root checks PASS (15 preserved policy/Streamlit +6 calendar +3 packaging). Total40.
- Production Next.js build/TypeScript PASS. Original helper/fallback/tests and dependency lock hashes preserved. No new dependencies.
- Live API and proxy: unkeyed ALFRED downloads work; API2.1.0. Generated docs/api schema/reference/payment/reserve examples.
- Browser: model date, reserve assets/date, live CPI reserve/shortfall, blank future scenario, explicit2% illustrative scenario, stale-result export blocking and restored blank reserve inputs. The UI result agrees with the API fixture. No investment experiment or portfolio simulation was run.

## Live public-data fixture

Model start September1,2026; valuation November23,2026; college assets750000 (synthetic correctness input). Baseline cutoff August31 yields July CPI333.918. Effective monthly update November1 uses cutoff October31, yielding September CPI336.940. October CPI337.511, although available on November23, is not admitted to the earlier November1 update. Remaining obligation800000 model-start dollars /32semesters, accounting reserve807240.00 after per-semester cent rounding, shortfall57240.00.

The CPI values were cross-checked against official sources: [July release](https://www.dol.gov/newsroom/economicdata/cpi_08122026.pdf) reports333.918; [September release](https://www.bls.gov/news.release/archives/cpi_10142026.htm) reports August334.980 and September336.940; [October release](https://www.bls.gov/news.release/CPI.htm) reports October337.511 at the check date. Each response records requested cutoff, returned vintage, observation month, public URL and full-source SHA256. Earlier returned vintages are disclosed; later vintages, wrong-series data and malformed/nonpositive values are rejected. Missing values remain missing and are reported; lookup selects the latest numeric observation present in the admitted snapshot without interpolating a missing value. A returned earlier vintage is conservative and may be stale, rather than proof that a newer value never existed.

Commands: `.venv-web/bin/python -m unittest discover -s backend/tests -v`; `../../../.venv/bin/python -m unittest discover -s tests -v`; `npm run build` in frontend/. Source packaging: `python3 prepare_github_upload.py --check` and `python3 prepare_github_upload.py`.

No owner/user credentials were required. See security-and-free-data.md. No original labs edited, public deployment/GitHub push, student prediction authored or designated changed-input investment experiment run.

Final source scan passed;13 built browser JavaScript bundles also had zero matching credential patterns. This is a bounded pattern check, not a claim to audit unknown remote Git history.

## Date-range regression fix

A future model start (fixture May31,2027 against Nov23,2026 today) leaves no published-CPI valuation dates. Frontend now explains/blocks this case, caps the date at today in Eastern, and distinguishes model start/graduation/valuation dates. Backend returns a specific422 before CPI requests. Eight relevant reserve/CPI/API checks pass, including the new future-start regression. Rendered React markup checks verify future-start warning/disabled submit, valid lower/upper date bounds/enabled submit, and pre-CPI-start guidance; production build/TypeScript passes. Browser verification was interrupted by concurrent use, not reported as passed. Earlier40-suite validation remains historical; this adds one regression without rerunning unrelated root checks. Future-start scenario valuation remains unimplemented; no dates are silently changed and no future actual CPI is invented.
