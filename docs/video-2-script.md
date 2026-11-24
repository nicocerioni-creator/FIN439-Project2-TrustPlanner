# Video 2 — narration with exact file and line cues

**Maximum: 5:00. Target: about 4:15.** The narration is approximately the same length as the previous version. This is a recording script, not a verified transcript.

**Do not read the SCREEN CUE instructions aloud.** They tell you what to display while reading the paragraph immediately below them. In VS Code, **Control+G** opens Go to Line; enter the number and press Return. Keep the text large enough to read. You do not need to explain every line or scroll through entire files.

## 1. README and opening statements

**SCREEN CUE — `README.md`, line 5.** Start with the project title/architecture visible. Say the two required opening statements first:

> I used OpenAI Codex to help program, test and document this app, and v0 to help design the interface. The analysis and final decision are my own. This project is for education and research, not investment advice, and it does not guarantee future results.

**SCREEN CUE — stay in `README.md`, line 9: “Install and run — step by step.”**

> The interface is Next.js, but the financial engine is Python and FastAPI. The README gives numbered installation steps. The launcher starts both services. No API key or payment account is required. Requests are validated before calculation; failed or stale inputs do not inherit an older successful result.

## 2. API and payment inputs

**SCREEN CUE — `backend/main.py`, line 23: `class PaymentRequest`.** Show the family, allowance and date fields. While continuing this paragraph, move to **line 149: `payment_schedule()`** to show where the validated payment schedule is assembled.

> The payment request defines family ages, degree lengths, allowances and dates. College payments fall on August first and January first through graduation. Adult payments begin one month after graduation. Amounts start in model-start purchasing power and use monthly CPI indexing. Future inflation is an explicit scenario, separate from the optional published CPI audit.

## 3. Data admission and portfolio calculations

**SCREEN CUE — `backend/portfolio_engine.py`, line 49: `prepare_data()`.** The admission reasons/date checks are just below this function heading.

> This file first admits the price panel. The entire snapshot and its final observation must predate the decision. It checks data age, missing observations and model-start timing. The bundled file has a recorded hash and capture date.

**SCREEN CUE — same file, line 79.** Show monthly returns at **79**, means at **82**, and annualized sample covariance at **83**. The CAGR helper begins at **91**.

> Monthly returns are current price divided by previous price minus one. Annual arithmetic return is twelve times the monthly mean. Monthly sample covariance is annualized by twelve, and portfolio volatility is the square root of weighted covariance. Historical CAGR compounds monthly constant-weight returns; it is different from the arithmetic estimate used for the target.

**SCREEN CUE — same file, line 115: `metrics()`.** Show the hard checks below it. Then move to **line 148: `visit()`** for the grid-search checks while finishing the paragraph.

> The seven-fund long-only search uses ten-percentage-point weight increments. It checks college backing, volatility, turnover, concentration and the trend-based equity cap. The signal is trailing twelve-month VOO return. The app compares equal weight, inverse volatility, the VOO proxy and the constrained candidate, showing each failed rule. The grid is not a continuous global optimum.

## 4. Funding and adaptive payments

**SCREEN CUE — `backend/funding_projection.py`, line 22: `project_funding()`.** Say the first two sentences below. Then show **line 179** for the recorded shortfall and **line 208** for the reconciliation equation while reading the last two sentences.

> The trust is one balance with college and long-term portions. Decimal cent accounting reconciles growth, costs, transfers and payments. A hard payment shortfall stops a path and records the date. It is not silently converted into an age-eighty ending value.

**SCREEN CUE — `backend/adaptive_support.py`, line 42: `review()`.** Show the minimum budget and affordable share. The future-liability budget used here is built by `liability_budget()` at **line 5**; you do not need a second stop there.

> The adaptive budget protects future college top-ups and adult minima. It uses a common fraction of the gap between minimum and goal, reviewed monthly.

## 5. Stress cases, sensitivity and decision rules

**SCREEN CUE — `backend/product_evaluation.py`, line 52: the funding-stress `cases` list.** Read the first sentence below, then move to **line 78** to show the reject/research-only/pilot decision branches while reading the second sentence.

> Funding stresses include losses, inflation, lower returns and costs, combined adversity and longevity. A disabled or invalid robustness review cannot authorize live capital.

**SCREEN CUE — `backend/portfolio_sensitivity.py`, line 5: `sensitivities()`.** The five one-at-a-time cases are immediately below the heading; missing-window handling is near the bottom of this short file.

> Separate sensitivity checks re-estimate short and long windows and tighten cost or allocation constraints. Missing long-window observations are reported invalid rather than replaced with a convenient shorter window.

## 6. Reproduction and the locked experiment

**SCREEN CUE — `reproduce_submission.py`, line 68: `main()`.** Show the reference-plan read and output writes. Then move to **line 15: `require_prediction_lock()`** for the publication/hash guard.

> The reproduction command uses the exact reference settings. The changed-input command checks the verified prediction commit and frozen file hashes.

**SCREEN CUE — `run_changed_input.py`, line 11: `main()`.** Keep **lines 12–16** visible: the lock check, the baseline two-percent check, and the single change to four percent. The run timestamps and result hashes are recorded below, starting at **line 23**.

> It changes only annual inflation from two to four percent. The original student prediction is never rewritten. Exact JSON outputs, a visible Markdown report and the comparison hashes make the final numbers auditable.

**SCREEN CUE — `docs/locked-input-audit.json`, line 2.** The prediction commit is on **line 2**, commit/publication-verification times on **lines 6–7**, and frozen prediction/reference hashes on **lines 8–9**. Leave this record visible for the closing paragraph; you do not need to read the hashes aloud.

> The main limitation is extrapolating fixed return assumptions far beyond the historical window. Future rebalancing, individual taxes and actual reserve liquidation are not simulated. That is why the committee decision authorizes research use and zero percent live allocation.

---

**Final reminder:** follow the ten tabs in the requested order. Only speak the quoted narration. The line numbers were checked against the current recording files; use the named function as a backup if your editor has unsaved changes that shift a line.
