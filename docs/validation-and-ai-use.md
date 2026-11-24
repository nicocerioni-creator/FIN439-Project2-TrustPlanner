OpenAI Codex assisted with programming, calculations, tests and drafting; v0 supplied interface design. The analysis and final decisions are Nicolas Cerioni’s own.

Educational and research use only; not investment advice or a guarantee.

# Validation and AI use

## Scope and decision

**Adopt the research-monitoring process; authorize0% live allocation.** This is the app’s generated recommendation and the memo’s committee ask. Reference and changed-run exact results are public under outputs/. Completed paths are conditional, not guarantees of future risk compliance or lifetime solvency.

## Sources and point-in-time boundary

| Item | Boundary and use |
|---|---|
| Frozen market data |61monthly adjusted prices, September2021–September2026; captured October22,2026.36returns from October31,2023–September30,2026 are used. Exact download URLs/timestamps and SHA256 are in [data/market/manifest.json](../data/market/manifest.json). |
| Decision |November23,2026; the entire snapshot must be available before the decision and no price may be dated on/after it. Snapshot age54days is within60. A decision after model start is quarantined. |
| Signal |VOO trailing12-month adjusted-price return,+15.7669%, ending September30,2026. Positive signal permits risk-on exposure; nonpositive signal restricts whole-trust equities to the entered40% risk-off cap. This is an unvalidated research hypothesis. |
| Benchmark/universe |VOO,QQQ,SCHD,PAVE,XLE,XLV,SGOV; VOO is an ETF proxy, not the index itself. Fund context links are in the manifest. Original mandate/lab sources remain in the [older repository](https://github.com/nicocerioni-creator/FIN439-Apps-Project-2-Educational-ONLY-). |
| CPI |Benefits use CPI-U, U.S. city average/all items/not seasonally adjusted for the optional published audit (CPIAUCNS/BLS CUUR0000SA0). Archived prior-day ALFRED vintages and first-day resets prevent same-day lookahead. The reference projection instead uses explicit2% future inflation, normalized to model-start purchasing power; it does not claim to know future CPI. |
| Source revisions |Vendor adjusted history may be revised. One snapshot supports this forward decision, not a vintage-safe historical strategy backtest. No missing observations are silently filled. |

Market SHA256: `fb4a6dfc9eb6d1688cd9d5584f2a796cad48032d41cb93d43d3d3fb5e26e1719`. The reference settings are [reference-plan.json](reference-plan.json); its SHA256 is `7b311e01c80299bb72dcab58fb2ac46845aa129d6905d49211baa0d0d35c098f`.

## Formulas, controls and numerical checks

Monthly simple return is price_t/price_(t−1)−1. Arithmetic annual return is12×monthly sample mean. Sample monthly covariance is annualized×12; portfolio volatility is sqrt(wΣw). Historical CAGR compounds monthly rebalanced portfolio returns. Different annualization/compounding definitions explain why arithmetic9.94% and CAGR10.34% differ. Sharpe proxy is historical annual arithmetic excess over SGOV’s arithmetic return divided by total volatility.

The search is an8008-combination,10-percentage-point whole-trust grid, not a continuous/global optimum. Standard-case concentration and equity ceilings are explicit. Current starting weights are an initial parking assumption; proposed candidate weights are separate. Opening transaction costs are charged once. The reserve is inside the trust, not additional assets. Future adult minima across beneficiaries and reserve top-ups enter the adaptive liability budget; a common minimum-to-goal fraction is reviewed monthly.0% real planning discount/0% cushion/$0 terminal goal/100restoration points are explicit baseline assumptions, not empirically optimal parameters.

Cash-flow ledgers use Decimal cent rounding and reconcile opening assets+growth−costs−payments=ending assets. Dashboard/export terminal balances use existing Python results; stopped paths have no age80 result. Family/CPI/capital changes invalidate dependent snapshots; failed requests never substitute a successful old result. Full results include original and effective inputs, provenance and typed inputs for replay.

## Executed tests and clean start

- **55backend/API tests PASS**: calendar/CPI/PIT, reserve, cash-flow conservation, future minima, adaptive support, fixed policy, portfolio checks, bootstrap, sensitivity, source redaction and committee gating.
- **24preserved root tests PASS** in the original course environment, including Streamlit fallback. The main web environment intentionally does not require Streamlit.
- **Seven frontend checks PASS**: Funding, Portfolio, College, live family refresh, live Funding↔Portfolio↔Evidence linkage, custom-case preview and Evidence exports/reopen/shortfall/freshness. These use labelled synthetic fixtures, not the locked investment experiment.
- Production Next build/TypeScript PASS. Protected helper/fallback/test/dependency hashes remain unchanged. Source and built-JS secret-pattern scans are run before publication; no owner key or .env is submitted.
- **Fresh clone setup/launch PASS** on macOS ARM64, Python3.11.7/Node24.19.0: new virtual environment and npm ci from the pinned files, with download caches reused. No first setup failure was observed. Prerequisites were already installed. Fresh UI3101/API8101 returnedHTTP200; full reference through the Next proxy exactly equalled frozen Python JSON. Windows/Linux are not claimed as executed tests. See [cold-start-check.json](cold-start-check.json).
- A partial-clone repository inspection encountered a Git object/promisor error; a separate ordinary full clone succeeded. This preparatory Git issue did not affect the clean app installation test. A local occupied development port was resolved by stopping the old app; alternate ports are documented in README.
- Native Safari verified dashboard/download layouts and missing-input guards. Populated financial records were verified through real React components and live Python APIs; no claim is made that every financial path was manually clicked in a browser.

## Stress evidence and failure response

The five funding cases test immediate losses (college−1%,long-term−35%), persistent CPI+2points, returns−3points plus annual costs+0.5points, their combination, and10extra years. The separate allocation sensitivity recomputes12/60-month windows, opening trading costs+25bp, volatility ceiling10%, and whole-trust single-fund cap60%. Tighter settings never loosen a baseline limit. Missing windows are reported invalid; no silent substitution occurs.

The combined case stops the fixed goal path on2059-11-30. Adaptive and minimum paths complete all tested horizons; the combined adaptive real ending balance is$1,515,686.39. No guarantee follows from the selected cases. Invalid data, infeasible hard checks or protected-payment failures reject allocation. A0% pilot ceiling yields research-only adoption, not a misleading0–0% investment pilot. Stop/reversal triggers and the exact committee ask are in visible-output.md.

## Locked Changed-Input Record

| Required element | Evidence |
|---|---|
| Student AI-off prediction |[ai-off-prediction.txt](ai-off-prediction.txt), copied verbatim from Nicolas’s supplied text. Codex did not author or edit it. |
| Immutable pre-run commit |[`81479f8587d1f0492504fdabe6ad245a514e63aa`](https://github.com/nicocerioni-creator/FIN439-Project2-TrustPlanner/commit/81479f8587d1f0492504fdabe6ad245a514e63aa); includes app code, reference settings and prediction. |
| Commit time |2026-11-24T01:33:53Z |
| Public verification before run |2026-11-24T01:34:35.511005+00:00; unauthenticated GitHub commit and raw-file requests matched bytes. See [locked-input-audit.json](locked-input-audit.json). |
| Prediction SHA256 |`08ce70d6a1ec0fb284404d8623242cfac6c5db51009d68f02d382304d2a1cf76` |
| Only changed input |`funding.annual_cpi_change_percent`:2%→4% per year; all other input fields unchanged. |
| Run started/completedUTC |2026-11-24T01:35:30.301580+00:00 / 2026-11-24T01:35:36.201097+00:00 |
| Actual college cost |$1,087,852.76→$1,474,000.59,+$386,147.83 nominal. |
| Adaptive nominal ending balance |$22,207,221,402.02→$17,474,144,094.13. |
| Adaptive ending purchasing power |$4,738,935,797.77→$819,965,249.80. |
| Payments/decision effect |Minimum,goal,adaptive base paths complete both runs. Weights and nominal return proxies are unchanged; recommendation stays research-only with0% live allocation. |
| Exact files |[baseline](../outputs/analysis.json),[changed](../outputs/changed-input.json),[comparison and result hashes](../outputs/changed-input-comparison.json). |

**Expected versus actual:** the student's conditional claim—unchanged nominal returns with higher inflation reduce real purchasing power—is supported; higher nominal college costs are also supported. The claim that Treasury returns automatically increase with inflation is **not supported by this experiment**. The model treats inflation and nominal return assumptions separately; changing CPI does not re-estimate yields. SGOV holds0–3month Treasury bills, not CPI-indexed TIPS. [iShares SGOV](https://www.ishares.com/us/products/314116/ishares-0-3-month-treasury-bond-etf) describes its bill exposure; [TreasuryDirect](https://www.treasurydirect.gov/marketable-securities/tips/) explains TIPS principal indexation. These sources clarify the diagnosis; their current yields are not substituted into the frozen data. Real-world future rate responses are not identified by this one-factor model. “Harder to fund” appears as reduced financial headroom here, not an observed minimum-payment default in either base run.

The original prediction remains unchanged. The runner executed from the isolated pre-run code snapshot after publication verification. Automated fixtures predating this record are software tests, not a reconstructed personal prediction or a disguised designated run.

## Material AI uses and dispositions

| Date/tool | Material use | Human/validation disposition |
|---|---|---|
| November17–23,2026,OpenAI Codex |Requirements organization, mandate discussion, Python/Next integration, calculations, tests, documentation and audit. |User selected payment priorities, CPI rules, horizon, interface choices and reference case; code/results were checked with automated and live integration tests. |
| November23,2026,v0 by Vercel |Exported React/Tailwind interface used as design input. |User supplied v0UpdatedFrontEnd; Codex integrated it with the real Python API, preserving original labs. |
| November23,2026,OpenAI Codex |Historical CAGR linkage and initial sparse/default UI. |User challenged all-SGOV ambiguity and reserve usability; starting/proposed weights were separated, return source clarified, shared calendar sums and stale-state regression checks added. |
| November23,2026,OpenAI Codex final audit |Identified missing window/constraint stress coverage and vague zero-ceiling pilot wording. |Added explicit sensitivity checks and research-only0% decision; original prediction was committed first and tested without rewriting it. |
| November23,2026,student |Authored the locked prediction and chose final reference assumptions. |Verbatim text retained, immutable pre-run publication verified, actual disagreement diagnosed above. |

This session identifies Codex as a GPT-6-based coding agent; its exact internal model build/version is not exposed. The v0 model/version is not exposed. No specific hidden build, token count or unsupported model identifier is invented. The app has no paid AI API integration; AI assistance occurred during development.

## Limitations and submission status

Short in-sample history, overlapping U.S. equity exposures, grid granularity, static future returns, unverified actual reserve liquidity, selected stress cases and a finite horizon limit the decision. There is no prospective strategy test, dynamic future trading/turnover enforcement, individual tax model, contributions model or lifetime-solvency proof. Monte Carlo jointly resamples12-month blocks for investment-only indexed growth; more paths reduce sampling noise, not historical bias. It is not a trust payment-success probability.

All three YouTube URLs and actual durations are recorded in the manifest. Supplied Video 2/3 caption exports and substantive review notes are linked in docs/video-transcripts.md. Player metadata indicates unauthenticated playability and English caption availability for all three. Video 1 transcript review and full audiovisual checks remain incomplete. Video 3 is retained unchanged at 7:01 by student choice, exceeding the 5:00 limit; no instructor waiver is claimed. The review notes distinguish spoken inaccuracies from the frozen written results. No YouTube video or account was edited. Written submissions are these Markdown files; EditionA/B, BeforeAI and research-evolution PDFs are not submitted for Project2.
