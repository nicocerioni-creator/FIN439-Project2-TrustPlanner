# Video2 draft narration — code walkthrough

This is a draft script, not a verified transcript. Maximum5:00. Suggested target4:15.

**Opening statements — say these first:**

“I used OpenAI Codex to help program, test and document this app, and v0 to help design the interface. The analysis and final decision are my own. This project is for education and research, not investment advice, and it does not guarantee future results.”

**Show the architecture/README, then backend/main.py:**

“The interface is Next.js, but the financial engine is Python and FastAPI. The README gives numbered installation steps. The launcher starts both services. No API key or payment account is required. Requests are validated before calculation; failed or stale inputs do not inherit an older successful result.

The payment request defines family ages, degree lengths, allowances and dates. College payments fall on August first and January first through graduation. Adult payments begin one month after graduation. Amounts start in model-start purchasing power and use monthly CPI indexing. Future inflation is an explicit scenario, separate from the optional published CPI audit.

**Show backend/portfolio_engine.py:**

“This file first admits the price panel. The entire snapshot and its final observation must predate the decision. It checks data age, missing observations and model-start timing. The bundled file has a recorded hash and capture date.

Monthly returns are current price divided by previous price minus one. Annual arithmetic return is twelve times the monthly mean. Monthly sample covariance is annualized by twelve, and portfolio volatility is the square root of weighted covariance. Historical CAGR compounds monthly constant-weight returns; it is different from the arithmetic estimate used for the target.

The seven-fund long-only search uses ten-percentage-point weight increments. It checks college backing, volatility, turnover, concentration and the trend-based equity cap. The signal is trailing twelve-month VOO return. The app compares equal weight, inverse volatility, the VOO proxy and the constrained candidate, showing each failed rule. The grid is not a continuous global optimum.

**Show backend/funding_projection.py and backend/adaptive_support.py:**

“The trust is one balance with college and long-term portions. Decimal cent accounting reconciles growth, costs, transfers and payments. The adaptive budget protects future college top-ups and adult minima. It uses a common fraction of the gap between minimum and goal, reviewed monthly. A hard payment shortfall stops a path and records the date. It is not silently converted into an age-eighty ending value.

**Show backend/product_evaluation.py and backend/portfolio_sensitivity.py:**

“Funding stresses include losses, inflation, lower returns and costs, combined adversity and longevity. Separate sensitivity checks re-estimate short and long windows and tighten cost or allocation constraints. Missing long-window observations are reported invalid rather than replaced with a convenient shorter window. A disabled or invalid robustness review cannot authorize live capital.

**Show reproduce_submission.py, run_changed_input.py and docs/locked-input-audit.json:**

“The reproduction command uses the exact reference settings. The changed-input command checks the verified prediction commit and frozen file hashes. It changes only annual inflation from two to four percent. The original student prediction is never rewritten. Exact JSON outputs, a visible Markdown report and the comparison hashes make the final numbers auditable.

The main limitation is extrapolating fixed return assumptions far beyond the historical window. Future rebalancing, individual taxes and actual reserve liquidation are not simulated. That is why the committee decision authorizes research use and zero percent live allocation.”
