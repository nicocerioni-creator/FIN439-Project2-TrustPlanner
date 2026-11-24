OpenAI Codex assisted with architecture, implementation and this handoff. The analysis and decisions are the student's own.

Educational and research purposes only; not investment or other professional advice. No guarantee of future results.

# Frontend handoff — implemented local stack

On November 23, 2026, the user approved switching to Next.js/FastAPI, then supplied a v0 redesign in v0UpdatedFrontEnd. That redesign is now integrated into the working frontend and connected to the Python API. A later authorized functional update introduced API version 2.0.0 for configurable families and the August/January academic calendar. The source export and pre-change backup are preserved. No public deployment has been performed. See v0-integration-validation.md for the UI-only boundary and checks.

## Start here

- [VS Code, installation and v0 guide](web-setup-and-v0-guide.md)
- [Ready-to-paste v0 prompt](V0-PROMPT.txt)
- `v0-frontend-handoff.zip` in the project root: importable frontend/API handoff, excluding environments, installed packages and secrets.
- `Trust Planner.code-workspace`: open this in VS Code.
- Run `python3 run_web.py` from the root; UI at http://127.0.0.1:3000 and Python API docs at http://127.0.0.1:8000/docs.

## Actual architecture

| Layer | Files and responsibilities |
|---|---|
| Next.js/React/TypeScript | frontend/app/page.tsx wires the live state hook to frontend/components/planner/: forms, navigation, timeline, tables, loading/error/stale states and exports |
| CSS and Tailwind | frontend/app/globals.css and postcss.config.mjs: current design and enabled Tailwind processing |
| API adapter | frontend/lib/api.ts: PaymentInput/PaymentResult types, GET/POST calls, error handling |
| Same-origin routing | frontend/next.config.ts: /api/* forwards to server-side BACKEND_URL, default http://127.0.0.1:8000 |
| Separate design view | frontend/app/design-preview/page.tsx: explicitly labelled fixture-only preview, never a live API fallback |
| FastAPI | backend/main.py: request validation, reference case, payment schedules, funding/adaptive/portfolio/stress evaluation |
| Academic calendar | academic_calendar.py: fall/spring dates, entry/graduation overrides and remaining-semester filtering |
| Shared policy functions | payment_policy.py: preserved original helpers; the new API reuses Decimal amount validation |
| Retained fallback | streamlit_app.py, unchanged during the migration, using the same core policy functions |

React formats supplied values and timeline positions; it does not calculate investment results or reserve valuations. No running model API, authentication or database is needed. The local services listen only on loopback.

## Implemented endpoints

| Endpoint | Result |
|---|---|
| GET /api/health | API status/version |
| GET /api/v1/reference-case | Reference request inputs, trust context, policy and unresolved decisions |
| POST /api/v1/payment-schedule | Validated timelines, full college semester schedule/obligation, active annual amounts and first adult-payment dates |
| POST /api/v1/college-reserve | API2.1.0: full undiscounted CPI-adjusted college reserve, optional asset comparison/future-CPI scenario and public-data provenance |
| POST /api/v1/funding-projection | API2.2.0: explicit deterministic monthly college/support cash-flow scenarios, independent minimum/goal paths, annual/monthly ledgers and accounting conventions |
| POST /api/v1/evaluate | API3.0.0: validated portfolio/baseline/data-admission/funding/stress comparisons and draft decision support |

Actual machine-readable contracts/examples are [api/openapi.json](api/openapi.json), [api/reference-case.json](api/reference-case.json) and [api/payment-schedule.example.json](api/payment-schedule.example.json). Payment/funding money fields are decimal strings; portfolio estimates and trade-cost metrics use JSON numbers as specified in the schema. Dates are ISO strings or null. Preserve the field names and nullable dates in any redesign.

The input snapshot may retain configured adult amounts when support is off, so toggling back on restores them. The effective annual_amounts_model_start_dollars and payment dates correctly remove inactive adult obligations. Both fields have distinct purposes; do not treat retained inputs as active payments.

The v2 request adds family_mode, starting_ages, first_college_years and graduation_dates. All per-child arrays must have equal lengths. The reference endpoint returns demo mode; custom families may have 0–50 children, with whole-year ages 0–100. These are technical input bounds. Demo mode enforces the original family, amounts, four-year degrees and no overrides; choose custom mode to edit. Dates/month offsets/approximate graduation ages are null until a model start date is selected. Older children require that date so elapsed semester dates can be excluded. planning_horizon_months follows the youngest child to age 80 (null for an empty family), with separate funding and portfolio endpoints for later calculations.

The schema limits degree lengths to 100 years to bound request size. This is a technical input limit, not a mandate recommendation. Model start dates retain 1900–2100. Monthly first-day/prior-day CPI timing is now confirmed. Optional future CPI is a labelled user scenario; no forecast is silently substituted.

## v0 integration rules

Import the prepared ZIP and paste V0-PROMPT.txt. Preserve lib/api.ts and the Python API contract. Download the generated source into a separate folder for review before integrating it into frontend/. A v0 cloud preview cannot call the loopback API on this Mac; any design fixture must be clearly labelled and must not silently replace failed live calls.

No financial formulas, compliance verdicts, portfolio recommendations or paid AI integrations should be generated as part of a visual redesign. Keep the scope notice, educational-use statement and accurate AI attribution. Keep exports disabled when results are stale or a request failed.

A visually complete page is not the final graded investment app. All eight saved requirements, the three distinct videos, reproducibility, visible output and the student's committed AI-off prediction sequence remain in force. The broader college-savings contribution planner remains deferred unless time permits.

## Official sources

Checked November 23, 2026: [v0 full-stack guide](https://v0.app/docs/full-stack-apps), [v0 GitHub handoff](https://v0.app/docs/github), [Vercel Python support](https://vercel.com/changelog/python-on-vercel-is-now-generally-available), [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/). The frontend's generated AGENTS.md also requires consulting the installed Next.js docs before framework changes.

## API2.1.0 reserve and credential boundary

ReserveRequest nests the current PaymentInput plus valuation_date, optional reserve_assets and optional future_cpi_annual_percent (decimal strings). It returns an accounting reserve comparison, indexed annual amounts, actual CPI vintage provenance, optional scenario college payments and an explicit limited scope. See api/college-reserve.example.json. frontend/components/planner/reserve-calculator.tsx sends requests through lib/api.ts; all finance/CPI calculations run in Python. It has separate stale/error/export guards and resets on navigation.

No API keys are required. Do not add owner credentials, public-prefixed secret variables, paid APIs, trial/overage accounts or key fields to source/export fixtures. Optional user keys may be introduced only for providers verified to require no payment. Use prepare_github_upload.py for scanned, allowlisted source packages. See security-and-free-data.md.

## API2.2.0 funding view

New FundingRequest/FundingResult types and calculateFundingProjection are in lib/api.ts. FundingView is mounted in PlannerApp even when hidden by navigation, preserving local draft/results. It requires explicit rates, opening custom balance, reserve rule and terminal-day choice; no default forecast or calculation on mount. The API returns accounting partitions and independent fixed-payment paths, conditional shortfalls, reconciled ledgers, annual summaries and conventions. UI chart arithmetic only positions backend values. Stale/error/family-draft guards protect the separate funding export. Future model starts are supported as wholly explicit scenarios, not actual CPI history. API3.0.0 implements these comparisons with explicit editable research assumptions. Preserve the new navigation/types/component and free/keyless boundary in future visual changes.

## API3.0.0 functional review build

Preserve AdaptivePolicy, PortfolioSettings, StressSettings, EvaluationRequest/Result, validateFundingPlan, validateAnalysisPlan, getInvestmentData and evaluatePortfolio in lib/api.ts. Funding and Portfolio views stay mounted-hidden to preserve navigation state. Validated JSON import restores global family and funding; old results remain stale until recalculated. The complete contract and synthetic analysis fixture are in handoff/api/. No browser finance formulas or silent fixture fallback. GET /api/v1/investment-data describes the frozen public snapshot; POST /api/v1/validate-funding-plan and /validate-analysis-plan validate saved settings without running portfolio analysis. See functional-review-guide.md for conventions and review steps.

## API3.1.0 college usability update

College reserve navigation is now **College overview**. Preserve its summary, remaining payment-years and semester counts per child, and the nominal date-grouped calendar. POST /api/v1/college-payment-plan accepts payment_inputs plus annual_inflation_percent and returns all nominal amounts/group totals from Python. remaining_funded_degree_years is now supplied on PaymentResult beneficiaries. InflationSetting is shared through PlannerApp with Funding, including imports; do not create independent conflicting CPI assumptions. Both views remain mounted-hidden.

ReserveCalculator moved to Funding as an optional published-CPI audit: today is automatic, manual asset/date inputs are removed, unavailable model-start ranges are explained before a request. Funding explains that the college reserve is within the one trust balance. Do not reintroduce the standalone valuation workflow. See college-payment-plan.example.json, updated OpenAPI and functional-review-guide.md.

College inflation refresh fix: preserve the automatic debounced Python request when shared inflation/family inputs change, request-generation guards, pending values and editable inflation during calculation. Do not restore a manual-only update. The per-child table and grouped calendar must use the same latest backend response.

College button integration fix: preserve PlanSession.onRefreshPaymentPlan (awaitable) and the College button’s family-validation → nominal-recalculation sequence. Unapplied family edits must not disable the button when entered date/inflation are present. Retain precise validation and mid-request edit guards; do not require navigation back to Family to submit a draft.

Calendar-source totals: preserve summarizeCollegePayments in lib/college-payment-totals.ts. The user explicitly requested summing nominal calendar lines for the child column. It performs display aggregation only, in exact integer cents; inflation/payment modelling remains Python. Child/grand/date totals and exports use this one result across all pages, not separately cached/precomputed child summaries. Keep atomic projection+stamp updates, new-stamp table keys and CPI-only direct refresh without unnecessary family validation.

## API4.0.0 Funding redesign — previous contract

FundingView now accepts capital-context/PortfolioSelection callbacks via PlannerApp. Preserve the return-source radio, optional0 expenses, plain-language support policy and Advanced disclosure. Birthday inclusion and college protection are fixed, not editable selectors. No opening shocks on Funding; they remain in Portfolio stress.

POST /api/v1/portfolio-estimate accepts InvestmentContext+PortfolioSettings without return assumptions and supplies candidate portion weights/balances and historical rates. Portfolio can estimate/link before Funding has rates. FundingRequest.portfolio_source stores settings; Python re-derives returns/trade cost, returns original inputs plus effective calculation_inputs and investment_source. Do not add cached trade costs to the user's setup cost. Invalidate linked sources when capital/family/setup costs change. UI imports explicitly migrate old cutoff/transfer/shock settings to the confirmed rules. Full stress/analysis and exact replay honor linked sources. See portfolio-estimate.example.json and latest OpenAPI.


## API4.2.0 standard/custom cases — latest contract

Preserve PortfolioCases and adjustPortfolioWeight, three standard-case cards plus Custom, automatic /portfolio-cases previews (200ms) and custom /portfolio-estimate previews (120ms). Show all seven whole-trust weights and historical mean-return/volatility graph; previews must never call /evaluate, /funding-projection or /portfolio-simulation. Suppress stale responses and show invalid hard checks without linking. Explicit estimate/link is separate. Standard case settings fix long-term concentration40%; Custom uses100%, keeping all other hard checks. No allocation-method/cap widget or research/CAGR checkboxes. SGOV assumption stays documented and passed true; Funding's existing source choice controls historical/manual cash-flow returns. Preserve the existing four output sections.

/portfolio-simulation is explicit only: joint circular12-month bootstrap, reproducible seed, max20000 paths, investment-only nominal$100 before distributions, mean/median/10th/90th outcomes. Do not present it as a solvency forecast or historical uncertainty confidence interval. Keep private simulation exports excluded from publication. See latest OpenAPI and synthetic case/simulation examples.


## API4.3.0 Evidence — latest contract

Preserve CalculationRecord/FundingRecord/PortfolioRecord/CollegeRecord callbacks and the shared state in PlannerApp. Evidence remains mounted-hidden. Current/stale/loading/error guards and family/CPI/analysis-to-Funding matching must protect every display and export. Use existing Funding paths for nominal/real terminal values; a stopped or incomplete path has no age80 terminal result. Do not recalculate financial forecasts in the browser.

Maintain status/dashboard, selectable path, Save/reopen validated analysis envelope version3, escaped printable HTML summary, nominal CSV calendar, advanced full-record and payment-only JSON. Imported saved results are historical, not current computed outputs. Preserve compatible Portfolio reload and reproduce_analysis.py. Private export names must stay excluded from source packages. Backend unresolved_policy remains an empty compatibility field; model_assumptions and the adopted Trust & portfolio mandate replace it. No new dependencies required.
