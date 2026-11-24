"""First Project 2 section: beneficiary timing and the amended payment mandate."""
from datetime import date
from decimal import Decimal
import json

import pandas as pd
import streamlit as st

from payment_policy import (BASE_ANNUAL_AMOUNTS, STARTING_AGES, add_months,
                            annual_payment_amounts, graduation_timing)

st.set_page_config(page_title='Trust support planner | Project 2',
                   page_icon=':material/family_restroom:', layout='wide')
st.caption('OpenAI Codex assisted with code, tests and drafting. The analysis and decisions are the student’s own.')
st.caption('For educational and research purposes only; not investment advice. No guarantee of future results.')
st.title('Trust support planner')
st.markdown('**College first. Sustainable lifelong support. Flexible adult distributions.**')
st.info('Working payment-policy section. Portfolio construction, funding tests, stress runs and the final '
        'committee recommendation have not yet been implemented. This page does not establish mandate compliance.')

st.subheader('What should the trust fund?')
st.caption('Enter annual amounts per child in purchasing power at model start. All active benefits '
           'are CPI-linked from model start, including the years before the first payment.')
college_annual = st.number_input('College allowance per child per year ($ at model start)',
    min_value=1.0, value=50_000.0, step=1_000.0, format='%.2f', key='college_annual')
adult_enabled = st.toggle('Include sustainable adult support', value=True, key='adult_support_enabled',
    help='Adult support begins at graduation. Turn off to explore a college-only scenario.')
adult_minimum = st.session_state.get('adult_minimum', 20_000.0)
adult_target = st.session_state.get('adult_target', 200_000.0)
if adult_enabled:
    minimum_column, target_column = st.columns(2)
    with minimum_column:
        adult_minimum = st.number_input('Adult minimum per child per year ($ at model start)',
            min_value=0.0, value=20_000.0, step=1_000.0, format='%.2f',
            key='adult_minimum', persist_state='session')
    with target_column:
        adult_target = st.number_input('Adult support goal per child per year ($ at model start)',
            min_value=0.0, value=200_000.0, step=1_000.0, format='%.2f',
            key='adult_target', persist_state='session')
try:
    annual_amounts = annual_payment_amounts(college_annual, adult_enabled, adult_minimum, adult_target)
except ValueError as exc:
    st.error(str(exc))
    st.stop()

reference_payment_settings = adult_enabled and annual_amounts == BASE_ANNUAL_AMOUNTS
if not adult_enabled:
    st.info('College-only scenario: no adult payments are included. This changes the Project 2 '
            'trust payment mandate; it is not a passing result for that mandate.')
elif not reference_payment_settings:
    st.info('Custom payment scenario: these amounts differ from the Project 2 trust case '
            '($50,000 college, $20,000 adult minimum and $200,000 adult goal per child annually). '
            'Changing an amount does not establish compliance with that case.')

st.subheader('When does each child become eligible?')
st.markdown('Adult support begins at graduation, rather than at a fixed age. '
            'Set each degree length separately: 3, 3.5, 4, 4.5 years, or another positive half-year increment.')
scenario_start = st.date_input('Optional model start date', value=None,
    min_value=date(1900, 1, 1), max_value=date(2100, 12, 31), key='model_start',
    help='Dates are illustrative until a start date is selected. Starting ages are treated as exact at this date; actual birthdays are not supplied.')
st.caption('Existing classroom assumptions: starting ages 8, 6, 4 and 2; college entry at age 18. '
           'Changing degree length changes the expected graduation and adult-eligibility dates. '
           'It does not certify actual graduation.')

timings = []
semester_payments = []
for index, (age, column) in enumerate(zip(STARTING_AGES, st.columns(4, border=True)), start=1):
    with column:
        st.subheader(f'Child {index}')
        st.caption(f'Age {age} at model start')
        duration = st.number_input(f'Child {index} degree length (years)', min_value=0.5,
                                   value=4.0, step=0.5, format='%.1f', key=f'degree_years_{index}')
        try:
            timing = graduation_timing(age, duration)
            start = add_months(scenario_start, timing['college_start_month']) if scenario_start else None
            graduation = add_months(scenario_start, timing['graduation_month']) if scenario_start else None
            first_adult_payment = add_months(scenario_start, timing['first_adult_payment_month']) if scenario_start and adult_enabled else None
            child_semesters = [
                {'Child': f'Child {index}', 'Semester': semester,
                 'Month from model start': month,
                 'Payment date': add_months(scenario_start, month).isoformat() if scenario_start else None,
                 'Amount in model-start dollars': str(annual_amounts['college'] / 2)}
                for semester, month in enumerate(timing['college_semester_payment_months'], start=1)
            ]
        except (ValueError, OverflowError) as exc:
            st.error(str(exc))
            st.stop()
        st.metric('Adult eligibility age' if adult_enabled else 'Graduation age', f"{timing['graduation_age']:g}")
        st.caption(f"Graduation: {graduation.isoformat()}" if graduation else
                   f"Graduation: {timing['graduation_month'] / 12:g} years after model start")
        timings.append({'Child': f'Child {index}', 'Starting age': age, 'Degree length (years)': duration,
                        'Graduation / adult eligibility age' if adult_enabled else 'Graduation age': timing['graduation_age'],
                        'Funded college semesters': timing['degree_months'] // 6,
                        'College start date': start.isoformat() if start else 'Select model start date',
                        'Graduation / adult eligibility date' if adult_enabled else 'Graduation date': graduation.isoformat() if graduation else 'Select model start date',
                        'Adult support included': adult_enabled,
                        'Adult eligibility month from model start': timing['adult_eligibility_month'] if adult_enabled else None,
                        'First adult payment month from model start': timing['first_adult_payment_month'] if adult_enabled else None,
                        'First adult payment date': first_adult_payment.isoformat() if first_adult_payment else
                            ('Select model start date' if adult_enabled else 'Not included')})
        semester_payments.extend(child_semesters)

st.dataframe(pd.DataFrame(timings), hide_index=True,
             alt='Individual college lengths and the resulting graduation-based adult eligibility ages and dates.')
st.caption('College funding continues until graduation, including degrees longer than four years. '
           'A one-semester academic year receives half the applicable CPI-linked annual allowance. '
           'College is paid at each semester start. When enabled, adult support becomes eligible at '
           'graduation, with the first monthly payment one month later and subsequent payments monthly. '
           'The classroom timeline models semesters every six months from college entry at age 18.')

college_obligation = sum((Decimal(row['Amount in model-start dollars'])
                          for row in semester_payments), Decimal(0))
st.metric('College payments to protect (model-start dollars)', f'${college_obligation:,.2f}')
st.caption('Protect the full scheduled college allowance for every remaining semester through graduation. '
           'This schedule begins at model start, before college payments. The total is in model-start '
           'purchasing power; future nominal payments and the assets required to fund them are not yet valued.')

with st.expander('College semester payment dates'):
    st.dataframe(pd.DataFrame(semester_payments), hide_index=True,
                 alt='College payments at semester starts through graduation, in model-start dollars.')
    st.caption('These are model-start purchasing-power amounts, not projected nominal payments. '
               'Calendar dates require a model start date; the CPI observation and update schedule '
               'must be defined before converting future payments to nominal dollars.')

st.subheader('CPI-linked payment policy')
benefit_rows = [
    {'Payment': 'College annual allowance', 'Model-start dollars per child': f"${annual_amounts['college']:,.2f}",
     'Policy': 'Highest-priority payment; CPI-linked until graduation'},
    {'Payment': 'College single-semester allowance', 'Model-start dollars per child': f"${annual_amounts['college'] / 2:,.2f}",
     'Policy': 'Half of the applicable CPI-linked annual allowance'},
]
if adult_enabled:
    benefit_rows.extend([
        {'Payment': 'Adult annual minimum', 'Model-start dollars per child': f"${annual_amounts['adult_minimum']:,.2f}",
         'Policy': 'Required floor once eligible; CPI-linked'},
        {'Payment': 'Adult annual target', 'Model-start dollars per child': f"${annual_amounts['adult_target']:,.2f}",
         'Policy': 'Flexible amount above the floor; CPI-linked'},
    ])
st.table(pd.DataFrame(benefit_rows), hide_index=True,
         alt='Current benefit amounts in model-start purchasing power, including semester proration.')
st.markdown('**Indexing formula:** starting payment × payment-period CPI ÷ reference-period CPI.')
st.caption('The CPI reference basis is model start for all active benefits. Benefits rise or fall '
           'proportionately with CPI; there is no nominal floor at the original dollar amount. No fixed inflation forecast '
           'is substituted for CPI. Exact reference observation, CPI series, release lag, '
           'and adjustment frequency remain to be specified before projecting payments. '
           'Future CPI is unknown; any future CPI path will be labelled as a scenario assumption.')
st.warning('Funding adequacy has not been evaluated. If college obligations and any enabled minimum adult '
           'payments cannot be funded within the mandate, the final process must flag the shortfall for review.')

st.download_button('Download current payment assumptions', json.dumps({
    'status': 'Draft payment assumptions, not a funding or mandate-compliance result',
    'model_start_date': scenario_start.isoformat() if scenario_start else None,
    'starting_ages_assumed_exact': True, 'college_entry_age': 18,
    'adult_trigger': 'graduation' if adult_enabled else None,
    'adult_support_enabled': adult_enabled,
    'matches_reference_payment_settings_only': reference_payment_settings,
    'annual_amounts_model_start_dollars': {key: str(value) for key, value in annual_amounts.items()},
    'cpi_indexation_basis': 'model_start',
    'deflation_treatment': 'benefits_fall_proportionately_with_cpi',
    'cpi_linked_benefits': ['college', 'adult_minimum', 'adult_target'] if adult_enabled else ['college'],
    'college_funding_end': 'graduation', 'one_semester_annual_fraction': 0.5,
    'college_reserve_coverage': 'all_remaining_college_payments_through_graduation',
    'college_obligation_model_start_dollars': str(college_obligation),
    'college_payment_timing': 'semester_start',
    'college_semester_payments': semester_payments,
    'adult_first_payment': 'one_month_after_graduation' if adult_enabled else None,
    'adult_payment_frequency': 'monthly' if adult_enabled else None,
    'beneficiaries': timings,
}, indent=2), file_name='payment_assumptions.json', mime='application/json')
