# Final Project2 requirement audit

Audit basis: the eight base requirements and the Project2-specific instructions supplied by Nicolas. No detailed300-point allocation was provided, so no invented point score is claimed.

| Requirement | Finding | Evidence |
|---|---|---|
| Interactive Python web app a stranger can launch |PASS on a fresh macOS clone: pinned install, UI/API launch, exact reference response through Next→FastAPI |README; docs/cold-start-check.json; backend/main.py |
| Lab13 mandate/objective/universe/benchmark/risk/limits |PASS for the explicitly amended classroom scope; original labs preserved |docs/mandate-review.md; docs/decision-memo.md; frontend mandate; old public labs repository |
| Two baselines and constrained portfolio with verdicts |PASS: equal weight/inverse volatility/candidate, plus VOO proxy; each failed rule exposed |docs/visible-output.md; app Portfolio comparison; outputs/analysis.json |
| Point-in-time signal and data card |PASS: dated VOO trend, available snapshot, date/staleness gates and source hash |data/market/manifest.json; app data card; validation report |
| Stress estimates/window/costs/constraints and stop condition |PASS: five funding cases plus five allocation sensitivities; invalid/infeasible conditions reject; payment shortfall stops path |backend/product_evaluation.py; backend/portfolio_sensitivity.py; visible results |
| Locked Changed-Input Record |PASS: student text publicly committed before experiment; one input2%→4%; actual/expected/decision effect/diagnosis and hashes preserved |docs/ai-off-prediction.txt; docs/locked-input-audit.json; docs/validation-and-ai-use.md |
| Recommendation/range/monitored triggers/committee ask |PASS: adopt research process, authorize0–0% live capital, stated conditions and reversal triggers |Memo; visible output; app committee section |
| Opening AI and educational statements |PASS in README/memo; supplied at start of all draft scripts. Actual recordings still need verification |README; memo; docs/video-*-script.md |
| Three YouTube links, duration limits and actual transcripts |PENDING STUDENT RECORDINGS/URLS; scripts are not represented as verified transcripts |docs/submission-manifest.md; recording guide |
| Viewer access and cross-artifact consistency |Repository access checked without authentication; video access/duration/captions pending actual links |Manifest and validation report |
| Same Markdown files attached to Brightspace |PENDING FINAL SUBMISSION; no receipt claimed |Final decision-memo.md, validation-and-ai-use.md and manifest |
| No credentials/private client data |Scanned allowlisted source and reviewed fictional trust outputs; no .env/API key required. No unrelated course folder is uploaded |prepare_github_upload.py; scripts/source_package.py |

The app is a research/planning process, not an approved live-money management service. The committee action is not a nonzero pilot, and the high long-horizon balances are not forecasts. Videos and Brightspace remain genuine outstanding requirements.

## Six published evidence areas

The public course submission architecture names these areas; the detailed performance descriptors/300-point mapping file is referenced there but was not present in the public course tree inspected. This is an evidence audit, not an invented rubric score.

| Area | Evidence prepared | Remaining ownership evidence |
|---|---|---|
| Problem definition and decision usefulness |Memo, stated trust priorities, explicit research-only decision |Video1 reflection and Video3 defense |
| Data integrity and traceability |Frozen source manifest, time gates, hashes and readable data card |Explain boundary accurately in videos |
| Financial soundness and judgment |Return/CAGR distinction, priority/risk limits, adverse goal failure, limitations |Student committee defense |
| Technical execution and usability |Fresh installation/start, Python engine, working interactive UI and outputs |Video2 code walkthrough |
| Validation, sensitivity, and reproducibility |79Python checks,7frontend checks, five+five stresses, locked record and exact replay |Actual Video1 checked-output demonstration and Video2 explanation |
| Professional communication |Markdown memo/validation, visible results, manifest and reviewed draft scripts |Actual recordings, substantive transcript corrections and access checks |

Source: https://github.com/CinderZhang/FIN43900-Fall2026/blob/main/PROJECT-SUBMISSION-ARCHITECTURE.md . The generative-AI runtime component/launch-post additions in that architecture apply to the capstone, not this Project2 app.
