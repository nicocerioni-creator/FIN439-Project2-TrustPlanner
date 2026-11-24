OpenAI Codex assisted with implementation, calculations, checks and this guide; v0 supplied the interface design. The analysis and decisions are the student's own.

Educational/research use only; not investment advice. No guarantee of future results.

# Review the working app

Updated November 23, 2026 — API4.3.0. This is the functional review build. The graded submission and commercial product are separate milestones.

1. Open `Trust Planner.code-workspace` in VS Code. In its terminal run `python3 run_web.py`, then visit http://127.0.0.1:3000. Stop an existing launcher with Ctrl+C before starting another. No API keys are needed.
2. In **Family & payments**, choose Demo family or Your family, set a model start date, edit the children/amounts and press **Update payment plan**. Demo preserves the original four children and payment amounts. Custom supports college-only families. All remaining semesters are covered, August1/January1; adult support starts one month after graduation.
3. In **College overview**, enter **Expected annual inflation (CPI, %)** ; totals refresh automatically after a short pause. **Update college payments** also applies any pending Family & payments edits first, then refreshes college totals on this page. You do not need to return to Family to submit those edits. A genuinely missing model start date must still be entered. View the total future-dollar obligation, remaining payment-years/semesters per child, and the calendar grouped by date with the total due and each child’s nominal payment. This inflation setting is shared with Funding. Base purchasing-power amounts remain clearly labelled.
4. In **Funding & cash flows**, enter the total opening balance (demo10million) and shared inflation. Costs are optional and default0. The college fund and long-term investments are portions of this one balance. College-first protection is automatic, and payments on the youngest80th birthday are always included. There are no transfer/cutoff dropdowns or opening-shock fields.
5. Choose the return source. The default is **Use the portfolio candidate's historical estimates**: open **Portfolio & stress**, enter a decision date no later than model start, confirm the SGOV proxy and review the estimation window/constraints, then use **Estimate and link returns to Funding**. This step needs no manual return assumptions or cash-flow projection. The college return uses SGOV; the long-term return uses residual weights after earmarking college assets. View both holdings/amounts/rates, then return to Funding. Alternatively choose **Enter my own return assumptions** and enter both rates explicitly. Historical estimates are forward scenario assumptions, not forecasts. Changing the opening assets, setup costs or family invalidates the linked estimate.

In Funding, review **Optional costs and expenses** and **Adult-support payment policy**, then **Calculate funding plan**. Costs start at0; one-time setup expenses are dollars and annual extra management/administration costs are a percentage. ETF expenses embedded in historical returns should not be charged again; taxes are not calculated. The support affordability toggle is explained in plain language, with the existing growth/cushion/ending-balance/restoration settings under Advanced. Adult-off scenarios hide payment-policy controls. Linked rates and opening trade costs are re-derived by Python for the current inputs, without applying trade costs twice. Results show actual assumptions used, college/support allocation, outcomes and ledgers. In Portfolio, full baseline/funding/stress evaluation becomes available once the funding setup is complete. If Funding is linked, those comparisons use each portfolio's historical return estimates.

6. Inspect the data card, baseline and candidate weights, failed checks, adverse cases and draft decision support. **Inspect candidate in Funding & cash flows** copies the exact candidate assumptions there; calculate again to see its detailed ledger. The pilot ceiling is your proposal, not a tested allocation blend or an approved trade.
7. **Save analysis settings** keeps the entire family/funding/portfolio/stress setup together. **Load saved analysis** restores it after a refresh or future session. Recalculate after loading. **Download complete analysis JSON** includes current computed results. Funding also offers a funding-only settings file and detailed ledger export. Save before closing: page-session state is not permanent browser storage.

For a first review, use your intended explicit assumptions. Empty rates do not receive invented defaults. The app rejects incompatible dates or invalid inputs and disables exports after edits/errors until a successful new calculation. The separately labelled design preview cannot calculate or export.

## College reserve and date handling

The college reserve now lives inside Funding. It is earmarked from the total opening trust balance, including the demo10million; it is not extra money. Calculate Funding to see the opening college/support split and any gap. The intended backing is cash or eligible short-term cash-like assets within the trust; the accounting model does not verify actual holdings. Portfolio separately requires explicit SGOV-proxy confirmation.

The separate assets-designated input was removed from the interface. The optional published-CPI audit is an expandable section in Funding, automatically as of today in Eastern time, with no manual valuation-date input. “As of today” means measuring the purchasing power of obligations still due today or later. Future model starts and starts outside the published-CPI range receive an explanation before any lookup, while future scenario calculations remain available. Source failures still show an honest retry error. This historical audit does not change the scenario or opening balance.

The per-child future-dollar column, overall total and export sum the exact same payment entries as the calendar, across every calendar page, using integer cents. They refresh together from one completed calculation. A CPI-only update uses one calendar request; pending family changes are applied first only when needed.

The college calendar uses monthly first-day inflation resets from model start, per-child cent rounding and all remaining semesters, including those beyond the funding horizon. It matches Funding college amounts under the same inflation setting. A scheduled amount is not evidence that a stopped funding path can pay it. Years of payments left = remaining covered semesters divided by2; it excludes waiting before college, rather than claiming to be time until graduation. The existing reserve API is retained for compatibility.

## What the adaptive support rule does

College remains first priority. Each monthly review protects the undiscounted CPI-adjusted reserve, then budgets remaining minimum support for every beneficiary, including those not yet eligible. It also budgets anticipated college reserve top-ups and an optional terminal support balance. Positive future reserve surpluses are ignored in this affordability budget, conservatively.

The entered real planning discount is converted to nominal with your CPI assumption and capped at the scenario's net support growth. Thus a zero planning rate does not ignore negative real growth. Benefits are calculated on the existing monthly CPI reset schedule and cent-rounded; a small event-level rounding margin applies when growth/cost/CPI vary. The safety cushion scales the remaining liability budget; it is not a permanent initial-principal floor.

Available support capital after the reserve is divided between the future minimum budget and the extra cost of the goal. The same fraction of the minimum-to-goal gap applies to every eligible child. Reductions apply at review immediately; restoration is limited by the entered monthly percentage-point cap. If minimum support is infeasible, the app reports the gap; it does not authorize suspension or claim the mandate passes. Any actual scheduled shortfall stops that path and retains the unpaid record. Advanced affordability assumptions remain editable scenario controls; calibration and real-world backing still require review.

## Portfolio estimates and limits

The bundled seven-fund snapshot is a copy of preserved Lab15 public data: VOO, QQQ, SCHD, PAVE, XLE, XLV and SGOV. Prices cover September2021–September2026; the complete snapshot became available October22,2026. It is dated research data, not a live feed or a vintage-safe historical strategy backtest. The default60-day staleness limit is editable and recorded. A decision on/before capture, after model start, or beyond staleness is quarantined before any portfolio search.

An optional CSV can replace it: exact header `Date,VOO,QQQ,SCHD,PAVE,XLE,XLV,SGOV`, consecutive complete monthly adjusted prices and explicit snapshot availability/provenance confirmation. User-asserted provenance is recorded, not independently verified. No paid API is used.

Equal weight, inverse volatility and a VOO benchmark proxy are shown alongside the constrained candidate. All use the same admitted sample. Arithmetic annual mean drives the objective; monthly covariance annualized by12 drives volatility. The candidate searches an explicit10-percentage-point long-only grid. It minimizes estimated volatility among mixes meeting the return target, otherwise selects the highest-return feasible grid mix. No feasible grid mix is not proof that every possible continuous allocation is infeasible.

Hard checks enforce weights, selected volatility up to25%, annual proposed-trade turnover budget up to33%, SGOV proxy reserve coverage after transaction costs, single-fund cap, and the signal's risk-off equity cap. The signal is trailing12-month VOO return: nonpositive restricts equity to the entered cap. It is a research hypothesis, not a validated predictive claim. Initial funding is excluded from turnover only when explicitly selected. Future trading/rebalancing and liquidation still require monitoring; the app does not prove future annual turnover or risk-limit compliance.

SGOV is an explicitly confirmed government-bill model proxy; it does not guarantee CPI matching or exact liquidity. Baselines without enough reserve backing show a failed check and no aligned funding projection. Optional historical-return funding removes the designated reserve slice before computing residual support returns; transaction costs reduce opening assets once. Embedded fund expenses should not be charged twice.

Five editable robustness cases cover immediate losses, persistent higher CPI, lower returns/higher costs, combined adversity and longer life. They are scenarios, not probabilities. Invalid cases are reported. Stress-disabled results explicitly say resilience was not evaluated. Draft pilot/rejection support includes conditions, stop/reversal triggers and a committee ask; adoption remains the student's decision.

## Reproduce and share

After setup, replay a saved settings file or complete analysis export without changing inputs:

```sh
python3 reproduce_analysis.py "/path/to/trust_analysis_settings.json"
```

This creates `outputs/analysis.json` and `outputs/analysis-summary.md`. It does not execute the separate designated changed-input experiment. The student must author and commit that prediction first. The undated payment-only reference remains `python3 reproduce_payment_plan.py`.

Safe source package:

```sh
python3 prepare_github_upload.py --check
python3 prepare_github_upload.py
```

User financial exports and generated analysis results are excluded by default. After explicitly reviewing them, `python3 prepare_github_upload.py --include-results` includes the two exact replay outputs. Neither command uploads or pushes. No owner keys, .env files, Git history, raw v0 export or unrelated labs are included. Automated secret patterns are a safeguard, not proof of a remote Git history audit.

## What still needs your work

Review functionality and tell Codex what to change. Then complete the comprehensive rubric audit, student-authored/committed prediction and designated run, final decision/memo and matching visible output, three videos/transcripts, viewer-access checks and submission manifest. The general college-savings contribution planner remains deferred. No public deployment or GitHub push has occurred.


## Standard cases and Custom preview (API4.2.0)

Apply a dated family plan and enter starting assets in Funding, then open Portfolio & stress and enter a valid investment decision date. Lower Risk, Balanced Growth and Aggressive Growth are standard research cases, not mandates or guaranteed outcomes. Selecting a case shows all seven whole-trust weights and its historical return/risk point without another estimate click.

Choose Custom case to start from the selected weights. Move sliders or edit percentages; equity changes use/replenish SGOV, while changing SGOV scales the equity mix. The total stays100%. Python refreshes the historical arithmetic return and annualized volatility after a brief pause (120ms debounce). The chart compares the three standard points and current Custom point. Invalid cases show their failed checks and cannot be linked to Funding. No full Funding, stress or Monte Carlo run occurs during preview. Use Estimate and link returns to Funding when ready, then calculate Funding and full stress explicitly.

The allocation-method dropdown and editable per-equity-fund concentration control are removed. Standard cases retain35/70/100% long-term equity ceilings and a40% per-equity-fund limit; Custom removes only this preset concentration cap. All hard college/volatility/turnover/trend limits remain. Lower Risk may hold all SGOV. Fund overlap remains a limitation.

The SGOV acknowledgement is a note, not a checkbox. Historical versus manual forward returns are selected once in Funding; Portfolio's full cash-flow comparisons follow that selection. ETF expenses are embedded in adjusted prices; additional expenses are separate. Historical means, CAGR and Sharpe are estimates, not forecasts.

The separate Monte Carlo chart resamples jointly observed12-month blocks and shows investment-only nominal growth of$100 before benefits/contributions/taxes. Percentile bands are simulated scenarios, not guaranteed ranges or trust-solvency probabilities. Interactive runs cap at20000 paths; one million paths would not fix historical bias.


## Evidence & exports (API4.3.0)

Apply the dated family plan, enter capital/inflation in Funding, estimate/link the chosen portfolio or enter manual returns, and calculate Funding. Evaluate Portfolio & stress explicitly when ready. Evidence shows each calculation’s current status; it never starts a new full model run merely to populate the dashboard.

Choose a payment path in the summary to inspect ending nominal and model-start purchasing-power balances. These are after scheduled payments through youngest80; a stopped path shows its shortfall and has no age80 value. First/last college dates include all remaining semesters; college beyond the funding horizon remains reserved. Changed family, inflation or Funding settings invalidate dependent results.

Save complete plan validates all analysis inputs and downloads a version3 JSON envelope containing settings and current available results. Reopen it here or in Portfolio. Imported results remain a historical record; refresh current calculations. The existing reproduce_analysis.py command accepts this envelope. The readable summary is an escaped standalone HTML file; use Print to save PDF. Payment calendar is CSV with dates/children/semesters/nominal amounts from the same College calculation. Advanced exports retain full calculation JSON and payment-only JSON. No owner credentials or paid source is involved.

The former unresolved-policy list is replaced with the adopted Trust & portfolio mandate and an assumptions disclosure. SGOV proxy and full college top-ups, long-only universe, historical risk/proposed-turnover checks and rejection of failed proposals are adopted modelling conventions. Advanced values stay editable baseline assumptions. Future CPI/returns, liquidity matching and future monitoring remain limitations, not completed empirical validation.
