# Next functional module — funding and CPI

Planning update: November 23, 2026. Codex assisted with source review and this plan; mandate choices remain the student's. Educational/research use only; not investment advice or a guarantee.

## Current boundary

The implemented API v2 calculates remaining college payments and graduation/first-adult-payment timing in model-start dollars. It has no CPI data or asset-funding engine. Calendar/custom-family checks passed in the preceding session. No new app code, dependencies, original labs, prediction or investment experiment changed in this planning step.

## Two decisions approved and implemented

1. College reserve valuation: full undiscounted remaining allowance in current purchasing power, or a discounted present value with explicit low-risk rates and backing assets. The user approved the undiscounted method; API2.1.0 implements it. For the undated default demo, the real obligation is $800,000. This is not a guaranteed asset requirement; asset inflation performance, liquidity and funding shortfalls need separate checks. If discounted valuation is chosen, the rate must not be silently equated to the risky portfolio's expected return.
2. Monthly CPI timing: proposed first-day-of-month update before payments, using observations published before that day; model-start baseline uses observations published before the start date. The user approved this prior-day cutoff; it is now implemented, with the baseline effective until the first update after model start.

## Source reuse review

- Original mandate inspected: ../Lab 13/Lab 13 CIO Mandate and Discussion.md. Keep it unchanged and retain the amendment record in purpose-and-payment-policy.md.
- ../Lab 17/Lab 17 Data Card - CPIAUCSL.md documents a monthly SEASONALLY ADJUSTED series, CPIAUCSL. Its historical observations must not be silently substituted for the approved unadjusted benefit series.
- Correct benefit series: BLS CUUR0000SA0 / FRED CPIAUCNS, monthly CPI-U, U.S. city average, all items, not seasonally adjusted. Source: https://www.bls.gov/cpi/factsheets/cpi-series-ids.htm and https://fred.stlouisfed.org/series/CPIAUCNS . Checked November 23, 2026.
- ../Lab 17/asof_cpi.py contains select_asof(..., prior_day_only=False), an existing point-in-time selection pattern. Its main entry point reads the old CPIAUCSL history. Reuse the selection concept in new project code with correct series/provenance; do not relabel the old observations or edit the completed lab. Preserve data quarantine until actual decision dates and release admission are verified. Observation month is not publication date.
- ../Lab 15/portfolio.py exposes covariance, expected-return/volatility, benchmark/equal/inverse-volatility and constrained-search helpers. These are candidates for later review, not an approved return forecast or allocation. No investment simulation or designated experiment was run.
- BLS escalation guidance: https://www.bls.gov/cpi/factsheets/escalation.htm . Future CPI paths must remain explicit scenarios; latest downloaded history is not automatically a valid historical vintage.

## Build sequence

1. CPI-adjusted obligations: retain model-start-dollar amounts alongside nominal scenario payments. Scale every active amount by applicable CPI / model-start CPI. Preserve proportional deflation. Historical rows need publication/vintage admission and source audit; future rows need explicit scenario labels. No silent default inflation forecast.
2. College reserve: value every remaining semester under the approved method, including any obligations beyond the adult-analysis cutoff. Show required reserve, eligible assets, shortfall and backing/liquidity assumptions. Avoid double-counting reserve assets as freely available adult-support capital.
3. Adult-support funding: preserve graduation eligibility, first payment one month later, monthly review, minimum and goal, and college-first priority. Quantitative cut/restoration formula, beneficiary sharing, within-month ordering, costs/taxes/returns and terminal-payment rules still need agreement before a funding verdict. If college plus minimum cannot be funded, show infeasibility rather than waive the mandate.
4. Portfolio and stress checks after definitions are settled. Full rubric audit follows the user's functional satisfaction, as requested. The broad contribution-based college-savings planner remains deferred.

The student's own AI-off prediction must be authored and committed on GitHub BEFORE the designated changed-input investment experiment. Neither activity occurred during this review.

## Implemented current step

Keyless ALFRED CPIAUCNS lookup with vintage validation/provenance, full undiscounted college reserve, optional designated-asset comparison/shortfall and optional explicit future-CPI college scenario are implemented. All40 checks/build passed. See cpi-reserve-validation.md and security-and-free-data.md. Next substantive policy work is reserve asset eligibility/liquidity and quantitative monthly adult affordability/cut/restoration/sharing. Those remain open; no full monthly adult cash-flow model or portfolio verdict exists.

## Current execution order after user review

User asked what remains after clarification that designated college assets currently only compare against the reserve and future CPI only projects payment sizes. The major next deliverable is a connected trust cash-flow engine, not another independent calculator.

1. Connect one opening trust balance (demo10million) to explicitly assigned college reserve assets and the remaining support capital, with no double-counting. Define reserve-eligible holdings and liquidity/shortfall treatment. The current assets field does not yet allocate or grow money.
2. Build monthly balances through youngest80, with dated college payments, graduation-based adult payments, CPI, explicit investment-return/fee assumptions and withdrawals. Show separate minimum-support and goal-support paths first, with real/nominal balances and shortfall dates. These are comparison scenarios, not an approved adaptive policy or solvency guarantee. Do not default the10% target to a promised return.
3. Set quantitative monthly adult affordability/reduction/restoration and beneficiary-sharing rules, preserving college priority and the hard real minimum; flag infeasibility rather than silently cutting the floor. Numerical triggers remain unapproved.
4. Implement actual investment universe/estimates, benchmark, equal-weight plus second transparent baseline and constrained candidate; define25% volatility and33% turnover measurement and display rule-level pass/fail. Admit an actual point-in-time investment signal. Benefit CPI indexation alone is not yet evidence of a portfolio decision signal.
5. Stress market losses, inflation, returns/costs and timing jointly; report reserve breaches, minimum shortfalls, drawdowns, stop/reversal conditions and sensitivity. Finite horizon is not proof of lifetime solvency.
6. Improve saved-plan import/export/persistence and input flow once the connected model works. Existing refresh/navigation resets must remain clear. Broad contribution-based college-savings planner/future-start scenario support remain secondary to the original trust case and submission.
7. After functional satisfaction perform full rubric audit, then complete visible decision output, consistent memo/validation/manifest, one-command reproduction/cold check, three distinct videos/transcripts/links, secure source upload and final submission artifacts. Detailed rubric remains unreceived in the saved record; no invented point allocations.

The student's AI-off prediction must be written and committed before the designated changed-input experiment. No policy numbers, forecasts, portfolios, prediction or experiment were generated during this roadmap review. Full current deadline remains November23,2026 at11:59PM Eastern.

## Step1 implemented — connected deterministic funding

API2.2.0 and Funding & cash flows now connect a single opening balance (demo10million) with college/support accounts, explicit gross return/CPI/cost assumptions, dated payments, separate fixed minimum/goal paths, monthly/annual reconciled ledgers, shortfall dates and JSON export. College obligations beyond the cutoff remain reserved. The reserve-transfer rule and final-day treatment are required explicit scenario settings; no unapproved adaptive adult formula or asset eligibility rule is inferred. Future starts use a wholly assumed normalized CPI path; the published-CPI lookup remains separate. See funding-projection-validation.md.49 Python checks, component wiring and production build passed; browser host unavailable, so no interactive visual-pass claim. All sources/keyless/credential exclusions and original labs are preserved; no dependency install, push, prediction authorship or designated experiment. Next: agree adaptive adult reduction/restoration/sharing and backing eligibility, then portfolio/risk/PIT/stress work. The full rubric audit remains after functional satisfaction.


## Latest API3.0.0 functional review build

Adaptive monthly support, portfolio/baseline/PIT checks, five stress cases and saved-plan replay are implemented as editable research proposals. See [functional-review-guide.md](functional-review-guide.md) and [functional-review-validation.md](functional-review-validation.md) for current mechanics and checks. Prior incomplete-feature notes above describe historical stages. Implementation does not silently adopt unresolved mandate interpretations. The comprehensive rubric audit follows user functional review; prediction authorship/commit and the designated experiment remain untouched. Final submission artifacts/videos are still unfinished.
