OpenAI Codex assisted with programming, testing, setup and drafting; v0 supplied interface design. The analysis and final decisions are Nicolas Cerioni’s own.

Educational and research use only; not investment advice. Historical returns and scenario projections do not guarantee future results.

# FIN439 Project 2 — Trust Planner

An interactive trust-planning app with a **Python/FastAPI backend** and a Next.js interface. It compares portfolio allocations, college payments and long-term family support. **No API key, paid data subscription, payment account or `.env` file is needed.**

## Install and run — step by step

You need an internet connection for the first setup. The main calculations use the included market snapshot; the optional published-CPI lookup also needs internet.

1. **Install the prerequisites.** Install [Python](https://www.python.org/downloads/) and [Node.js](https://nodejs.org/en/download). Python 3.11 and Node.js 24 are the tested versions. Node.js must be at least20.9; Python must be at least3.11. If using Windows, enable **Add Python to PATH** in the installer. VS Code is recommended but optional.
2. **Download the project.** On [this repository](https://github.com/nicocerioni-creator/FIN439-Project2-TrustPlanner), click the green **Code** button → **Download ZIP**. Unzip it. Open the extracted `FIN439-Project2-TrustPlanner-main` folder in VS Code using **File → Open Folder**. You should see `setup_web.py`, `run_web.py`, `backend` and `frontend` directly inside that folder.
3. **Open a terminal in that folder.** In VS Code choose **Terminal → New Terminal**. You do not need to activate a virtual environment manually.
4. **Install the app’s dependencies once.** On Mac/Linux, paste this command and press Enter:

   ```sh
   python3 setup_web.py
   ```

   On Windows use:

   ```powershell
   py -3.11 setup_web.py
   ```

   Wait for **Installed. Start the app with…**. This creates a separate `.venv-web` environment and installs the pinned dependencies. It does not change your system Python packages.
5. **Start the app.** On Mac/Linux run:

   ```sh
   python3 run_web.py
   ```

   On Windows run:

   ```powershell
   py -3.11 run_web.py
   ```

6. **Open the website.** Go to **http://127.0.0.1:3000** in your browser. Leave the terminal open while using the app. The Python API documentation is at http://127.0.0.1:8000/docs.
7. **Save before closing.** Use **Evidence & exports → Save complete plan**. Settings survive page navigation, but a browser refresh can clear unsaved work. Press **Control+C** in the terminal to stop the app. Next time, repeat only steps5–6. Reopen your saved plan in Evidence & exports.

### If something goes wrong

| Message or symptom | What to do |
|---|---|
| `python3` not found | Install Python, reopen your terminal, then retry. On Windows use the `py -3.11` commands above. |
| `npm` or `node` not found | Install Node.js, reopen the terminal, then retry step4. |
| `setup_web.py` cannot be found | Open the extracted project folder, not its parent. `setup_web.py` must be visible in that folder. |
| Port3000 or8000 is in use | Stop the earlier app with Control+C. Or run `python3 run_web.py --ui-port 3001 --api-port 8001` and open http://127.0.0.1:3001. |
| Python service unavailable | Keep the launcher terminal open. Read its error, stop it with Control+C, and repeat step5. |
| Setup stops while downloading dependencies | Check internet access and the Python/Node versions. Retry step4; do not paste API keys or passwords into the app. |
| Data quarantined | Use a decision/model date consistent with the saved snapshot. The reference decision date is November23,2026; the snapshot was captured October22,2026 with final prices September30,2026. |

## Open the submission reference case

1. Open **Evidence & exports → Reopen saved complete plan**.
2. Select **`docs/reference-plan.json`** from the downloaded project.
3. In **Portfolio & stress**, estimate/link the allocation. In **Funding & cash flows**, calculate the funding plan. Return to Portfolio to evaluate the stress cases.
4. Review **Evidence & exports** for the selected-path nominal and purchasing-power-adjusted balances.

The reference is a fictional classroom trust:10million opening assets; children aged8/6/4/2; college50000 per child/year; adult minimum20000 and goal200000;2% annual inflation scenario; Balanced Growth;36 monthly observations; zero optional baseline expenses. The horizon ends at the youngest child’s80th birthday, with scheduled final-day payments included. Future inflation and returns remain assumptions.

## Reproduce the submitted results with one command

After setup, from the project folder run:

```sh
python3 reproduce_submission.py
```

On Windows use `py -3.11 reproduce_submission.py`. The script switches to `.venv-web` automatically. It reads the exact reference settings and writes `outputs/analysis.json`, `outputs/college-calendar.json` and `docs/visible-output.md`. The designated experiment has a separate guarded command and requires the verified pre-run prediction commit; it is never silently substituted for this reference run.

- [Decision memo](docs/decision-memo.md)
- [Validation, AI use and Locked Changed-Input Record](docs/validation-and-ai-use.md)
- [Visible executed results](docs/visible-output.md)
- [Submission manifest and video links](docs/submission-manifest.md)
- [Student’s unedited prediction](docs/ai-off-prediction.txt)

Submission records are being frozen. The manifest distinguishes verified artifacts from items still awaiting recording or upload. An honest reject or research-only decision is valid; a completed model path is not proof that a committee should invest real money.

## What the model does

- Pays college on August1 and January1 through graduation, including partial/five-year degrees; adult support begins one month after graduation.
- Indexes benefits monthly from model start; future CPI is a scenario. The optional published CPI-U audit is separate.
- Protects the full undiscounted college obligation using an SGOV classroom proxy; evaluates minimum, goal and adaptive support paths with reconciled ledgers.
- Compares equal weight, inverse volatility, VOO benchmark proxy and a constrained portfolio, with failed-rule explanations.
- Applies a dated12-month VOO trend signal, snapshot/staleness gates,25% maximum historical volatility and33% proposed one-way annual turnover budget.
- Shows standard/custom allocation weights and historical risk/return previews; Monte Carlo is an explicit investment-only bootstrap, not a solvency probability.
- Tests losses, inflation, lower returns/costs, longevity, estimation windows, opening trading costs and tighter constraints. No trade executes.

The original labs are preserved in the [older labs repository](https://github.com/nicocerioni-creator/FIN439-Apps-Project-2-Educational-ONLY-). This repository contains the final app and Project2 submission materials. The retained Streamlit files are a historical fallback; the installation steps above launch the current Python-backed web app.

## Technical checks

```sh
.venv-web/bin/python -m unittest discover -s backend/tests -v
npm run build --prefix frontend
python3 prepare_github_upload.py --check
```

The preserved Streamlit test suite additionally needs the original course Streamlit environment; it is not a dependency of the main web app. Detailed executed checks and the clean-start result are in `docs/validation-and-ai-use.md`.
