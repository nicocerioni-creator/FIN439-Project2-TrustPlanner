OpenAI Codex assisted with code, tests and drafting. The analysis and decisions are the student's own.

For educational and research purposes only; not investment advice. No guarantee of future results.

# Trust support planner — Project 2 in development

This is the initial payment-policy and beneficiary-timing section, not the completed committee app. Portfolio
selection, the two baselines, risk/funding checks, stress runs and the submission artifacts
are still being designed. No portfolio recommendation or funding result is available yet.

## Run the current app

With the existing shared environment on the author's Mac, run from this folder:

```sh
../../../.venv/bin/python -m streamlit run streamlit_app.py
```

For a separate checkout, use Python 3.11 or newer, create/activate a virtual environment,
install `requirements.txt`, then run `python -m streamlit run streamlit_app.py`.
The final package still needs its one-command result reproduction and clean-user check.

Each child has a separate degree-length input in half-year increments. Existing classroom
starting ages are 8, 6, 4 and 2, with college entry at age 18. Adult eligibility starts at
graduation. An optional model start date produces illustrative calendar dates, treating
the starting ages as exact; actual birthdates and enrollment dates are not supplied.
No model start date is silently selected. Inputs are session-only unless downloaded.
College funding continues until graduation; a one-semester academic year receives half
the applicable CPI-linked annual allowance. Each college semester is paid at its start.
Adult eligibility begins at graduation; the first monthly adult payment is one month
later. The tables show funded semester counts, semester dates and first adult-payment dates.
The protected college obligation covers every remaining semester through graduation,
including degrees longer than four years. The app displays its total in model-start
dollars; it does not yet value the assets required to fund those payments.

All benefit amounts are CPI-linked under the amended mandate. The inflation reference
is model start: entered amounts represent purchasing power at that point, including
inflation adjustments before the first payment. The exact CPI reference observation,
series and CPI adjustment timing remain open. Benefit amounts fall proportionately if
CPI falls; no nominal floor is imposed on the original dollar amounts. No live CPI is fetched
and no future inflation forecast is presented as known. The pure CPI-ratio calculation
is tested separately in `payment_policy.py`; it is not a finished cash-flow projection.

The college allowance is editable. Adult support defaults to enabled and can be toggled
off for a college-only scenario. When enabled, its annual minimum and goal are editable;
the goal must be at least the minimum. Turning support off removes adult obligations,
and turning it back on retains the entered amounts during the session. The reference
trust settings remain $50,000 college, $20,000 adult minimum and $200,000 adult goal
per child annually. Custom amounts and college-only settings are labelled as alternative
scenarios; they do not establish compliance with the reference trust mandate.
Download `payment_assumptions.json` from the app to save active amounts, support mode,
CPI reference basis and graduation assumptions. The file is not a funding result.

Priority: complete the trust application and required project evidence first. A broader
college-savings planner with starting balances and contributions is deferred unless time permits.

Run current tests:

```sh
python -m unittest discover -s tests -v
```

The app uses existing Streamlit/pandas dependencies and no API keys or model API calls.
Original lab files are preserved. Current decisions and remaining requirements are in
`docs/project-requirements-and-plan.md`, `docs/mandate-review.md`, and
`docs/purpose-and-payment-policy.md`. Planning does not authorize an AI-written pre-run
prediction for the Locked Changed-Input Record; that prediction must be the student's own.
