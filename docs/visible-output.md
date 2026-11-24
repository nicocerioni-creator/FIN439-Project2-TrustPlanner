OpenAI Codex assisted with programming, calculations, tests and this generated report; v0 contributed interface design. The analysis and final decisions are Nicolas Cerioni’s own.

Educational and research use only; not investment advice or a guarantee.

# Frozen reference results

Decision/model start: **2026-11-23**. Opening trust: **$10,000,000.00**. Annual inflation scenario: **2%**.
Data captured: 2026-10-22; last price: 2026-09-30; estimation window: 36 monthly returns. Admission: admit_for_this_forward_decision.
Data SHA256: `fb4a6dfc9eb6d1688cd9d5584f2a796cad48032d41cb93d43d3d3fb5e26e1719`.
Limits: volatility≤25%; proposed one-way annual turnover≤33%; initial allocation excluded=True. Opening transaction cost=0bp; annual additional cost=0%; setup cost=$0.00.

Committee decision: **Adopt the research monitoring process; authorize0% live allocation**.
Authorized/proposed allocation range: **[0, 0.0]% of long-term capital**. No automatic trade.

| Portfolio | Arithmetic return | Historical CAGR | Historical volatility | Mandate verdict |
|---|---:|---:|---:|---|
| Equal weight | 16.57% | 17.37% | 9.59% | long_term_equity_limit |
| Inverse volatility | 5.48% | 5.62% | 0.85% | Pass under model assumptions |
| VOO benchmark proxy | 21.49% | 22.85% | 12.45% | college_reserve_proxy_coverage, long_term_equity_limit, long_term_equity_fund_limit |
| Constrained candidate | 9.94% | 10.34% | 3.50% | Pass under model assumptions |

## Candidate and payment assumptions

Whole-trust weights: VOO 0.0%, QQQ 20.0%, SCHD 0.0%, PAVE 0.0%, XLE 10.0%, XLV 0.0%, SGOV 70.0%.
College SGOV historical return proxy: 4.5312% annually. Residual long-term return proxy: 10.8519% annually.
College allowance $50,000.00; adult minimum $20,000.00; adult goal $200,000.00, each annual/per child in model-start dollars.
Total remaining nominal college payments: **$1,087,852.76**. First: 2037-08-01; last: 2047-01-01.

## Funding paths

| Path | Status | Last included/stopping date | Nominal balance at that date | Purchasing power at that date |
|---|---|---|---:|---:|
| minimum | completed_horizon | 2104-11-23 | $28,250,081,408.50 | $6,028,458,925.73 |
| goal | completed_horizon | 2104-11-23 | $21,985,019,838.05 | $4,691,518,837.01 |
| adaptive | completed_horizon | 2104-11-23 | $22,207,221,402.02 | $4,738,935,797.77 |

A stopped path has no age80 ending value. Completed paths end at 2104-11-23. These are conditional constant-return scenarios; multi-billion-dollar long-horizon outputs are not forecasts.

## Adverse funding cases

| Case | Path | Status | First protected-payment shortfall |
|---|---|---|---|
| Immediate market loss | minimum | completed_horizon | Not observed before cutoff/stop |
| Immediate market loss | goal | completed_horizon | Not observed before cutoff/stop |
| Immediate market loss | adaptive | completed_horizon | Not observed before cutoff/stop |
| Persistent higher inflation | minimum | completed_horizon | Not observed before cutoff/stop |
| Persistent higher inflation | goal | completed_horizon | Not observed before cutoff/stop |
| Persistent higher inflation | adaptive | completed_horizon | Not observed before cutoff/stop |
| Persistent lower returns and higher costs | minimum | completed_horizon | Not observed before cutoff/stop |
| Persistent lower returns and higher costs | goal | completed_horizon | Not observed before cutoff/stop |
| Persistent lower returns and higher costs | adaptive | completed_horizon | Not observed before cutoff/stop |
| Combined adverse scenario | minimum | completed_horizon | Not observed before cutoff/stop |
| Combined adverse scenario | goal | stopped_at_payment_shortfall | 2059-11-30 |
| Combined adverse scenario | adaptive | completed_horizon | Not observed before cutoff/stop |
| Longer-life horizon | minimum | completed_horizon | Not observed before cutoff/stop |
| Longer-life horizon | goal | completed_horizon | Not observed before cutoff/stop |
| Longer-life horizon | adaptive | completed_horizon | Not observed before cutoff/stop |

## Estimation, cost and constraint sensitivity

| Case | Change | Candidate | Largest weight change |
|---|---|---|---:|
| Shorter estimation window | {'estimation_months': 12} | Feasible | 10.0pp |
| Longer estimation window | {'estimation_months': 60} | Feasible | 10.0pp |
| Higher opening trading costs | {'transaction_cost_bps': '25.0'} | Feasible | 0.0pp |
| Tighter volatility constraint | {'volatility_limit_percent': '10.0'} | Feasible | 0.0pp |
| Tighter whole-trust single-fund cap | {'max_fund_weight_percent': '60.0'} | Feasible | 30.0pp |

## Conditions and reversal triggers

- The reference and tested protected-payment paths completed under assumptions; this is not proof of future solvency.
- The entered live pilot ceiling is0%. No investment capital is authorized.
- Review estimation-window sensitivity, actual reserve liquidity and an out-of-sample monitoring policy before approving any live pilot.
- The historical arithmetic return estimate does not meet the selected nominal return target; risk and protected payments take priority.

- Any college reserve backing gap or hard minimum missed payment.
- Updated volatility exceeds limit, annual turnover budget exhausted, or data is quarantined/stale.
- New information changes the investment thesis, costs or funding assumptions.

Adopt the app for research monitoring only; approve0% live allocation. Return to committee with validated reserve liquidity, prospective evidence and a proposed nonzero pilot before investing.

The quantitative result supports the stated decision only under these assumptions. Future inflation, reserve liquidity, calibration and future monitoring remain limitations. See validation-and-ai-use.md and locked-changed-input-record.md.
