# Latest adoption — Evidence review, November23,2026

User explicitly accepted the Evidence recommendations. Adopt the existing long-only seven-fund classroom implementation, SGOV college-backing proxy with full CPI-adjusted protection/top-ups, historical sample-covariance risk and one-way proposed-turnover checks, and rejection/review for failed proposed allocations. Retain the advanced support defaults as editable scenario baselines, not validated optimal calibration. Future CPI remains a scenario; actual liquidity matching and future monitoring/rebalancing are not asserted as verified. Original Lab13 permission for derivatives/shorting is not exercised; original labs remain unchanged. Current API4.3.0 separates these adopted conventions from model limitations and removes the obsolete unresolved-choice list. Older sections below record the discussion history and are superseded where inconsistent.

---

# Mandate review — working draft, not yet approved

AI-assisted planning: Codex inspected prior labs and organized requirements; the student's analysis and decision remain their own. Educational and research purposes only; not investment or professional advice.

## Source and status

Original: ../Lab 13/Lab 13 CIO Mandate and Discussion.md, section 'Project 2 Mandate (My Client’s Mandate) - AI Allowed'. The same section was inspected on origin/main under 'Portfolio Mandate (Lab 13)' on November 17, 2026. Prior lab source files are preserved.

Nicolas has asked to DISCUSS CHANGES before building. Confirmed amendments: college payments are the highest-priority distributions; adult support is a secondary target that can be reduced to protect the trust; long-term funding health and risk limits take priority over pursuing the 10% return target. See purpose-and-payment-policy.md for the current agreed direction. The user subsequently confirmed that sufficient future support funding ranks immediately after college funding; principal may fluctuate or decline over the multi-decade horizon, with no separate original-principal preservation requirement. Quantitative funding tests and other operational definitions remain open.

## Existing family-trust mandate

| Item | Prior mandate | Status / interpretation |
|---|---|---|
| Initial capital | $10 million | Starting model capital; confirm case retained. |
| Beneficiaries | Four children, ages 8, 6, 4, 2 at the original model start | Classroom starting ages, not independently verified current personal data. No personal identifiers needed. |
| Objective | Lifetime support | A 20-year initial planning period does not establish lifetime sustainability. |
| Return | 'Guaranteed' 10% nominal annually in original request | Prior lab correctly treats guarantee as unverifiable. 10% is a target; user now prioritizes payments and risk limits. Must settle compounded horizon and net-cost convention. |
| Benchmark | S&P 500 Total Return Index | Comparison benchmark, not a required portfolio weight. If a VOO proxy is used, label it as a proxy and explain fees/tracking. |
| College | Originally $50,000 per child per year at ages 18 through 21 | Highest priority; now CPI-linked. On November 23, 2026, user confirmed funding until graduation, including beyond four years, half the applicable annual allowance for a one-semester academic year, and payment at semester start. Fixed annual allowance is confirmed; fall payments August 1 and spring January 1, each half the annual allowance. |
| Adult support | Originally $200,000 per child annually from age 22, paid monthly for life | AMENDED: secondary target, not an unconditional entitlement; may be reduced when necessary to protect college funding and long-term trust health. Original schedule otherwise remains the starting point. A hard minimum of $20,000 annually per eligible beneficiary is now confirmed ($80,000 once all four qualify); full suspension is not allowed. Eligibility is now graduation-based, replacing age 22; degree length is individually adjustable in half-year increments. Monthly payment schedule retained. All benefit amounts are now CPI-linked; their stated amounts are starting-dollar values. Reduction/restoration triggers are not yet defined. |
| Inflation | Originally fixed nominal benefits | AMENDED: all active benefit amounts are expressed in model-start purchasing power and CPI-linked from model start, including before first receipt. Benefits fall proportionately with falling CPI. Basis and deflation rule confirmed November 23; monthly CPI-U (U.S. city average, all items, not seasonally adjusted) using only released observations is confirmed; within-month mechanics and future paths remain open. |
| Risk limit | Annualized return volatility <=25% | Must define frequency, lookback, net/gross returns, review timing, breach response; not a maximum-loss guarantee. |
| Turnover limit | Annual turnover <=33% | Must define one-way/two-way convention, drift, rolling/calendar window, flow treatment, initial deployment and breach response. |
| Instruments | Short sales and derivatives permitted | Permission is not a requirement. A long-only ETF implementation is a proposed simplification, not an approved mandate amendment. |

November 23 app-scope decision: retain the original trust project as the priority; add the general college-savings planner only if time permits. The payment interface now supports an adult-support toggle and editable college allowance, adult minimum and adult goal. Reference trust settings remain the defaults; college-only and changed-amount scenarios are labelled as alternatives and do not establish reference-mandate compliance. The general savings planner's starting-balance/contribution features have not been implemented.

Payment timing confirmed November 23: college at semester start; first adult payment one month after graduation, then monthly. The app calculates these dates and semester counts. These are timing and model-start-dollar schedules, not CPI forecasts or funding-sufficiency results.

College reserve coverage subsequently confirmed: protect all remaining college payments for every beneficiary through graduation, including all five years of a five-year degree. No shorter rolling window is approved. The app displays the full scheduled obligation in model-start dollars; reserve asset selection, valuation, discounting and future CPI conventions remain open.

Frontend migration: user subsequently explicitly approved Next.js/FastAPI and necessary installations. The current payment section is implemented in that local stack, with Streamlit and original labs retained. See frontend-handoff.md, web-setup-and-v0-guide.md and web-migration-validation.md. A v0 redesign prompt/import ZIP is prepared; no v0 generation or public deployment has occurred. The saved Python-web-app interpretation and remaining grading requirements are not silently waived.

Latest November 23 update: user supplied v0UpdatedFrontEnd and requested UI-only integration. The redesign is now integrated into frontend/, using the unchanged Python backend/API adapter. See v0-integration-validation.md. User also confirmed a fixed college allowance (not reimbursement) and a funding-analysis horizon ending when the youngest reaches 80: 78 years from model start. Those confirmations are recorded for the next functional stage; they do not change the lifetime-support objective or authorize unapproved return/CPI assumptions. Formal rubric audit follows functional review as requested; preserve all saved requirements in the meantime.

## Prior Lab 15 choices available for discussion

- Candidate universe: VOO, QQQ, SCHD, PAVE, XLE, XLV, SGOV. Six equity funds plus a short Treasury reserve candidate. Overlap and sector concentration matter; seven tickers are not seven independent exposures.
- Historical saved dataset: 61 monthly adjusted-price observations, September 2021–September 2026, yielding 60 monthly returns. Vendor-adjusted history can be revised; it is not automatically proof of a vintage point-in-time backtest.
- Prior proposed volatility convention: sample standard deviation of 60 monthly returns times sqrt(12), evaluated monthly. Confirm whether to retain it and how to respond to breaches.
- Prior lab distinguished historical arithmetic mean estimates from historical compounded returns. Neither is a reliable future forecast or guarantee.
- SGOV was designated reserve-eligible only as a classroom assumption. No trust reserve percentage was approved. Do NOT import Meridian's 3% reserve rule into the trust mandate as if it were a client rule.

## Important implementation gap

Lab 13 mandate.py and the Lab 15 default app use the separate MERIDIAN classroom case. Lab 15's engine can be reused, but its default 6.5% objective, 3% reserve convention, and other Meridian assumptions do not define this client's trust mandate. Prior documentation expressly says the app does not verify the full trust mandate, enforce the trust volatility ceiling, or model future trust payouts. A seven-fund optimizer alone is therefore not a completed Project 2 trust process.

## Decisions to discuss before implementation

1. What amendments to the trust case does Nicolas actually want? Keep a written old/new/rationale record. The assignment explicitly requires the Lab 13 mandate; material replacement may require instructor clarification.
2. What is the app's main decision: approve a constrained allocation, evaluate ability to fund distributions, or both? A practical design can compare allocations while separately checking payment funding under explicit scenarios.
3. Retain the seven ETFs or revise the universe? Decide long-only scope and whether any new bond exposure serves the mandate before choosing weights.
4. Define return target measurement and costs; distinguish forecast assumptions, historical realized CAGR and weighted arithmetic estimates.
5. Define payment timing, reserve policy, funding stress horizon, and a stop condition. Do not claim a short horizon proves lifelong payments.
6. Define volatility measurement and breach handling; define turnover consistently for both baselines and the constrained portfolio.
7. Choose the second transparent baseline, signal and allocation limits AFTER these mandate decisions. A benchmark is not automatically a compliant baseline.

## Commercial direction

Use the graded family-trust case as a possible worked example inside a reusable investor interface. Prioritize a coherent mandate and trustworthy calculations before cosmetic work. Future commercial use needs separate assessment of data-use rights, security/privacy, operations, disclosures and applicable investment-advice boundaries. The current class project is not certified sale-ready.

## Latest functional update — November 23

Implemented API v2.0.0 and the integrated frontend: protected reference Demo family; custom add/remove children, ages and degrees; August 1 fall / January 1 spring payments; default first fall on or after age 18 with first-year override; estimated May 31 / December 31 graduation with date override; adult first payment one month later. Model date is required for actual calendar timing, older children or overrides. Past semester dates are excluded; due-today dates included. Every remaining semester through graduation is covered at half the annual allowance. The youngest-age-80 horizon and confirmed fixed-allowance/monthly CPI-U/monthly adult-review rules are reflected in API metadata, without inventing funding projections. Original labs and Streamlit helpers remain preserved. All 30 correctness checks and the frontend production build pass; browser custom/demo flows pass. See academic-calendar-validation.md. Reserve valuation, future CPI scenarios and adult affordability rules still need decisions; the rubric audit follows functional satisfaction. The student's AI-off prediction and designated experiment remain untouched.

## Subsequent API2.1.0 update

User approved full undiscounted CPI-adjusted college reserve and first-day monthly/prior-day CPI publication cutoffs. Implemented free/keyless correct-series ALFRED lookup, college reserve/optional designated-assets shortfall, optional explicit future-CPI college scenario, UI provenance and guarded export. No paid APIs/keys/trials/overage permitted; owner secrets excluded from UI/exports/source packages. Safe GitHub packaging uses prepare_github_upload.py (no upload/push). All40 correctness checks and build pass. Original labs, prediction and designated experiment remain untouched. Adult affordability, reserve backing eligibility/liquidity and portfolio/risk rules remain open. See cpi-reserve-validation.md and security-and-free-data.md.

## Step1 implemented — connected deterministic funding

API2.2.0 and Funding & cash flows now connect a single opening balance (demo10million) with college/support accounts, explicit gross return/CPI/cost assumptions, dated payments, separate fixed minimum/goal paths, monthly/annual reconciled ledgers, shortfall dates and JSON export. College obligations beyond the cutoff remain reserved. The reserve-transfer rule and final-day treatment are required explicit scenario settings; no unapproved adaptive adult formula or asset eligibility rule is inferred. Future starts use a wholly assumed normalized CPI path; the published-CPI lookup remains separate. See funding-projection-validation.md.49 Python checks, component wiring and production build passed; browser host unavailable, so no interactive visual-pass claim. All sources/keyless/credential exclusions and original labs are preserved; no dependency install, push, prediction authorship or designated experiment. Next: agree adaptive adult reduction/restoration/sharing and backing eligibility, then portfolio/risk/PIT/stress work. The full rubric audit remains after functional satisfaction.


## Latest API3.0.0 functional review build

Adaptive monthly support, portfolio/baseline/PIT checks, five stress cases and saved-plan replay are implemented as editable research proposals. See [functional-review-guide.md](functional-review-guide.md) and [functional-review-validation.md](functional-review-validation.md) for current mechanics and checks. Prior incomplete-feature notes above describe historical stages. Implementation does not silently adopt unresolved mandate interpretations. The comprehensive rubric audit follows user functional review; prediction authorship/commit and the designated experiment remain untouched. Final submission artifacts/videos are still unfinished.
