# Project 2 — requirements and working plan

Recorded: November 17, 2026. Source: Nicolas's assignment text and instructions in this conversation. This is a planning record, not a completed submission or investment recommendation. Educational and research purposes only; not investment or other professional advice; no guarantee of future results.

## Deadline and scope

- User-confirmed Brightspace deadline: Monday, November 23, 2026, 11:59 PM Eastern time (America/Indiana/Indianapolis). The header itself has not been inspected; the user supplied this confirmation.
- Repository: https://github.com/nicocerioni-creator/FIN439-Project2-TrustPlanner
- Project: Investment Management Application. Act as a portfolio analyst; build an app a committee could adopt and recommend adopt, allocate to, rebalance, pilot, or reject under the mandate. An honest rejection of a failed process is responsive.
- First discuss and settle the mandate, then build. User explicitly requested discussing changes to the existing Lab 13 mandate before implementation.
- Confirmed priority, refined in mandate discussion: college payments are the highest-priority distributions; adult support is a secondary, reducible $200,000 annual target per eligible beneficiary with a hard $20,000 annual minimum each ($80,000 once all four qualify). Full suspension is not allowed. Protect long-term trust health and enforce risk limits rather than chasing the 10% return target. Report infeasibility without silently relaxing hard limits. Future support capacity ranks immediately after college funding; principal may fluctuate or decline, with no separate requirement to preserve original nominal or inflation-adjusted principal. Numerical funding tests remain open. See purpose-and-payment-policy.md.
- User wants a beautiful, reliable app that can become a foundation for a product for amateur investors. Submission readiness and commercial readiness are separate milestones; a classroom result is not proof a product is ready to sell.
- The detailed rubric will be supplied later. It has not been received. The user reports a strict 300-point analytic rubric; do not invent its point allocations.

## All eight base requirements

| Requirement | Evidence the final package must contain |
|---|---|
| A running app | Python web app a stranger launches from README and operates without the author. A notebook or one-shot script alone is insufficient. |
| Lab 13 mandate | Objective, universe, benchmark, risk measure, and enforceable limits. Document all amendments and identify unresolved interpretations. |
| Two baselines and constrained portfolio | Equal weight plus another transparent baseline beside the constrained portfolio; each has a pass/fail verdict identifying violated mandate rules in the app. |
| Point-in-time signal | At least one signal with a data card, source/as-of/release-availability boundary, and explicit use in the decision. |
| Stress analysis | Stress estimates, estimation window, costs, and constraints; specify the condition that stops the process. |
| Locked Changed-Input Record | User's own AI-off prediction committed to GitHub BEFORE the changed-input run, then actual result and comparison. |
| Recommendation | A recommendation with allocation range, conditions, reversal triggers, monitored triggers, and committee ask. Do not guarantee returns. |
| Opening statements | README, decision memo, and EACH video open with AI attribution (which AI and what it did; analysis and decision are the student's) and education/not-investment-advice statement. |

## User's required reproducibility and consistency

- README includes one command that produces the result. Specify a clean-user dependency/environment setup and a separate clear app startup if needed; a reproducibility command is not a substitute for a working interactive app.
- Material decision numbers, inputs, as-of date, mandate verdict, and recommendation must be readable directly on GitHub without executing code.
- The memo and visible output must match on numbers, dates, assumptions, and conditions. Use shared calculation/export sources where practical and verify the frozen package for conflicts.
- Include the baseline comparisons, mandate checks, stress runs, and locked input-change record.
- All three video links must work; each video answers its assigned question. Never mark access confirmed without testing it.

## Submission artifacts

- GitHub repository with README, runnable source, dependency/environment file, visible executed output, content-equivalent documentation, and .env.example only if needed. No paid model integration or credentials required by default; prior no-key preference persists unless changed.
- docs/decision-memo.md.
- docs/validation-and-ai-use.md, including sources and as-of boundary, tests and results, limitations, named material AI uses and dispositions, actual exposed tool/model/version and interaction dates, and complete Locked Changed-Input Record. Do not invent model/version metadata that is not exposed.
- Submission manifest as Markdown in docs/: every artifact location is a GitHub URL except the YouTube video URLs. Include optional deployment, titles/durations, timestamp indices, access confirmation, and frozen-file checklist.
- Video 1 <= 3:00: how the system AND the student's thinking changed, plus an AI output actually checked. Include transcript-video-1.txt or link the transcript in the repository.
- Video 2 <= 5:00: code walkthrough, including calculations and decision logic. Include transcript-video-2.txt or a repository transcript link.
- Video 3 <= 5:00: committee presentation, OPENING WITH THE APP RUNNING LIVE. Include transcript-video-3.txt or a repository transcript link.
- Videos are YouTube links with captions/transcripts enabled, not video file submissions. The instructor must be able to access private repos and unlisted videos logged out as applicable; verify actual viewer access rather than relying on the owner's session.
- Attach the SAME final Markdown files to Brightspace. Edition A and Edition B are kept privately for comparison and are not submitted.

## Project-specific overrides of the generic checklist

The pasted generic checklist mentions Edition A receipt submission, Research-Evolution.pdf, Decision-Memo.pdf or a deck, and Validation-and-AI-Use.pdf. The Project 2-specific instructions override those generic rows:

- Skip the 'Before AI' submission and research-evolution item.
- Use Markdown written submissions in docs/, not PDFs.
- Keep Edition A/B for comparison; do not submit them.
- The generic decision-memo limit is two pages, or eight main slides for the generic deck option. For this Markdown project, keep the memo concise at roughly two-page reading length until the rubric clarifies how length is evaluated; do not treat a guessed word count as an official requirement.
- Preserve the remaining applicable checklist items, especially the human-authored locked prediction. Skipping the Edition A 'Before AI' submission does NOT waive the locked prediction.
- If a common starter is used, analysis.py is intentionally unfinished; never copy visible_output.example.json into the output path with placeholders intact.

## Locked Changed-Input Record — sequencing constraint

Do not run the designated changed-input experiment or generate its result before the user writes the AI-off prediction and it is committed on GitHub. AI must not write the student's prediction or falsely reconstruct it afterward.

The record must identify: pre-run immutable commit/snapshot; old and new values with units; user's expected direction; actual direction; decision effect; and diagnosis if prediction and result diverge. The blank structure can be prepared later, but the prediction remains the user's own work.

## Cold-check acceptance gate

- A fresh user follows README successfully; record the FIRST failure and its resolution or limitation honestly.
- The app runs as an interactive Python web app.
- All baselines and portfolio verdicts are displayed with failing rule details.
- Visible output has material inputs, as-of dates, and decision with no execution required.
- Point-in-time signal cannot use information released after the decision timestamp.
- Stress results and stop/reversal conditions are explicit.
- No conflict among memo, visible output, transcripts, validation record, and mandate.
- Correct substantive transcript terms, tickers, names, attribution, and material numbers; filler perfection is unnecessary.
- Verify stable repository links and each YouTube link as a viewer without owner-only access.
- No credentials, passwords, keys, tokens, .env, private client data, or personal contacts unnecessarily exposed. Existing SEC contact visibility was raised by the user; do not copy a personal SEC contact into a new public app.
- Every recommendation states conditions, reversal trigger, and committee ask.

## Proposed sequence, not a frozen design

1. Discuss amendments to the Lab 13 mandate and write its operational definitions.
2. Audit reusable lab engines/data and establish the portfolio decision and clean common assumptions.
3. Implement the constrained portfolio, equal-weight baseline and second transparent baseline with identical evaluation conventions.
4. Admit one relevant point-in-time signal with its data card, then build the interactive interface using the developing-with-streamlit skill.
5. Add stress cases across all required dimensions and explicit stop conditions.
6. User authors and commits the AI-off changed-input prediction; only then execute the designated run and record results.
7. Generate consistent GitHub-visible numbers, memo, validation record and manifest.
8. Record distinct videos and transcripts; validate access, duration and numerical consistency; cold-run and freeze submission before the deadline.

No implementation choices, portfolio weights, allocation recommendation, or mandate amendments have been approved merely by saving this plan. No new app code, dependency installation, deployment, or repository publication was performed in this requirements-saving step.

## Graduation and inflation amendment / pause checkpoint

Adult eligibility now starts at each child’s college graduation, not fixed age 22. Each child has an individual degree-length input in half-year increments. All active benefit amounts (college allowance, adult minimum, adult target) are CPI-linked from model start and fall proportionately with falling CPI. Their stated dollar figures represent purchasing power at model start. On November 23, 2026, user confirmed college funding until graduation, half the applicable annual allowance for a one-semester academic year, payment at semester start, and first monthly adult payment one month after graduation. Monthly CPI-U and released-observation availability are confirmed; within-month update mechanics and future scenarios remain open.

Historical November 17 checkpoint: the initial local Streamlit payment-timing section was implemented in streamlit_app.py, with payment_policy.py and eight passing unit/AppTest checks, before the user paused for class. User resumed November 23. The payment section has now been extended as described below; the portfolio process remains incomplete.

## November 23 resume and requested college-savings extension

User resumed the project and requested a college-savings financial planner with an editable starting balance, monthly/yearly contributions, and return estimates informed by risk tolerance and invested funds. User then explicitly prioritized the original trust application and deferred this broader planner unless time permits. Preserve the required trust mandate and grading evidence. Distinguish user-selected return scenarios, historical fund estimates, and forward-looking assumptions; no return estimate is guaranteed and risk tolerance does not itself determine an expected return. Starting-balance/contribution features have not been implemented.

Current November 23 implementation: editable college allowance; optional adult support with editable minimum and goal; model-start CPI basis and proportional deflation treatment; semester payment schedule; graduation eligibility and first adult-payment dates; downloadable active policy and timing assumptions. Reference trust settings remain the defaults, and alternative payment scenarios are explicitly labelled. Fourteen unit/AppTest checks pass. No packages installed, original labs changed, server launched, final project published, prediction written, or designated changed-input experiment executed. Funding projections and portfolio decisions remain unfinished.

Subsequent November 23 update: user confirmed protected college coverage must include ALL remaining college payments through graduation. Added the model-start-dollar obligation total to the app/download and a five-year-degree check; 15 tests now pass. Reserve valuation/backing assets remain undefined. User proposed a v0/Next.js/FastAPI interface; docs/frontend-handoff.md records the architecture assessment and a ready-to-paste v0 brief. No new frontend/backend runtime, package installation, external generation or deployment has been performed. The proposal does not waive any saved project requirement or the locked-prediction sequence.

Latest November 23 update, superseding the proposal-only status above: user explicitly approved the switch and necessary installations. Implemented a working local Next.js/React/TypeScript/Tailwind frontend and Python/FastAPI backend for all existing payment-section features. Dedicated environment and lockfiles preserve the course environment; Streamlit and original labs remain unchanged. Created the VS Code workspace/task, one-command launcher/setup, API contract, reference payment reproduction and v0 prompt/import ZIP. Twenty unique existing/new tests, production build, browser checks and clean-folder installation/launch passed. See docs/web-setup-and-v0-guide.md and docs/web-migration-validation.md. No v0 generation or public deployment occurred. Remaining grading/funding work and the prediction lock are unchanged.

Subsequent v0 integration: user supplied v0UpdatedFrontEnd and requested the visual changes be integrated without changing the model. Imported the modular frontend, preserving source export and a pre-change backup. Verified protected backend/finance/API/config/dependency hashes, API checks, production build and live browser flows/JSON export. No backend or model changes occurred during integration. User wants functionality developed/reviewed next, then a comprehensive rubric audit after functional satisfaction. Two newly confirmed rules for the next functional stage are fixed college allowances and an analysis horizon until youngest age 80 (78 years / 936 months from model start). See v0-integration-validation.md and purpose-and-payment-policy.md; future CPI conventions and payment reduction/restoration rules still need agreement.

Additional confirmed decisions: update active benefits MONTHLY using CPI-U (U.S. city average, all items, not seasonally adjusted), with only observations published by the reference/update date; separately review adult-support levels MONTHLY. Exact within-month update dates, future inflation scenarios, reserve valuation and quantitative reduction/restoration rules remain open. These decisions are queued for the next functional module, not silently implemented as part of the UI-only integration.

## Latest functional update — November 23

Implemented API v2.0.0 and the integrated frontend: protected reference Demo family; custom add/remove children, ages and degrees; August 1 fall / January 1 spring payments; default first fall on or after age 18 with first-year override; estimated May 31 / December 31 graduation with date override; adult first payment one month later. Model date is required for actual calendar timing, older children or overrides. Past semester dates are excluded; due-today dates included. Every remaining semester through graduation is covered at half the annual allowance. The youngest-age-80 horizon and confirmed fixed-allowance/monthly CPI-U/monthly adult-review rules are reflected in API metadata, without inventing funding projections. Original labs and Streamlit helpers remain preserved. All 30 correctness checks and the frontend production build pass; browser custom/demo flows pass. See academic-calendar-validation.md. Reserve valuation, future CPI scenarios and adult affordability rules still need decisions; the rubric audit follows functional satisfaction. The student's AI-off prediction and designated experiment remain untouched.

## Subsequent API2.1.0 update

User approved full undiscounted CPI-adjusted college reserve and first-day monthly/prior-day CPI publication cutoffs. Implemented free/keyless correct-series ALFRED lookup, college reserve/optional designated-assets shortfall, optional explicit future-CPI college scenario, UI provenance and guarded export. No paid APIs/keys/trials/overage permitted; owner secrets excluded from UI/exports/source packages. Safe GitHub packaging uses prepare_github_upload.py (no upload/push). All40 correctness checks and build pass. Original labs, prediction and designated experiment remain untouched. Adult affordability, reserve backing eligibility/liquidity and portfolio/risk rules remain open. See cpi-reserve-validation.md and security-and-free-data.md.

## Step1 implemented — connected deterministic funding

API2.2.0 and Funding & cash flows now connect a single opening balance (demo10million) with college/support accounts, explicit gross return/CPI/cost assumptions, dated payments, separate fixed minimum/goal paths, monthly/annual reconciled ledgers, shortfall dates and JSON export. College obligations beyond the cutoff remain reserved. The reserve-transfer rule and final-day treatment are required explicit scenario settings; no unapproved adaptive adult formula or asset eligibility rule is inferred. Future starts use a wholly assumed normalized CPI path; the published-CPI lookup remains separate. See funding-projection-validation.md.49 Python checks, component wiring and production build passed; browser host unavailable, so no interactive visual-pass claim. All sources/keyless/credential exclusions and original labs are preserved; no dependency install, push, prediction authorship or designated experiment. Next: agree adaptive adult reduction/restoration/sharing and backing eligibility, then portfolio/risk/PIT/stress work. The full rubric audit remains after functional satisfaction.


## Latest API3.0.0 functional review build

Adaptive monthly support, portfolio/baseline/PIT checks, five stress cases and saved-plan replay are implemented as editable research proposals. See [functional-review-guide.md](functional-review-guide.md) and [functional-review-validation.md](functional-review-validation.md) for current mechanics and checks. Prior incomplete-feature notes above describe historical stages. Implementation does not silently adopt unresolved mandate interpretations. The comprehensive rubric audit follows user functional review; prediction authorship/commit and the designated experiment remain untouched. Final submission artifacts/videos are still unfinished.
