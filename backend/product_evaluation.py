"""Portfolio comparisons, conditional cash flows and explicit robustness scenarios."""
from copy import deepcopy
from datetime import date
from decimal import Decimal
from backend.portfolio_engine import analyze
from backend.portfolio_sensitivity import sensitivities
from backend.funding_projection import project_funding


def run_funding(schedule, values):
    for key in ('college_annual_return_percent','support_annual_return_percent'):
        if not -100<float(values[key])<=100:raise ValueError('Historical return proxy is outside supported scenario bounds; enter manual return assumptions.')
    if not 0<=float(values['annual_cost_percent'])<100 or not -50<=float(values['annual_cpi_change_percent'])<=100:
        raise ValueError('The changed cost/CPI assumption is outside supported scenario bounds.')
    return project_funding(schedule, values['opening_balance'], values['college_annual_return_percent'],
        values['support_annual_return_percent'],values['annual_cost_percent'],values['annual_cpi_change_percent'],
        values['reserve_transfer_rule'],values['include_horizon_day_payments'],values.get('adaptive_policy'),
        values.get('opening_transaction_cost',0),values.get('initial_college_shock_percent',0),values.get('initial_support_shock_percent',0))


def compact(result):
    return {k:{n:v for n,v in p.items() if n not in ('monthly_ledger','annual_summary','adaptive_reviews')} for k,p in result['paths'].items()}


def evaluate_product(schedule, funding, settings, stress, use_history):
    required=float(schedule['college_obligation_model_start_dollars']);opening=float(funding['opening_balance'])
    portfolios=analyze(settings|{'model_start_date':schedule['inputs']['model_start_date']},opening,required,float(funding.get('opening_transaction_cost',0)))
    if portfolios['status']=='data_quarantine':
        return {**portfolios,'funding':None,'stress_tests':[],'portfolio_sensitivities':[], 'recommendation':{
            'action':'Reject this data/decision combination','conditions':portfolios['data_card']['reasons'],
            'allocation_range_percent_of_support_capital':[0,0],
            'reversal_triggers':['Do not allocate while data are quarantined.'],
            'committee_ask':'Reject this run; choose a valid forward decision date or supply a knowable snapshot before rerunning.'}}
    chosen=None;chosen_inputs=None
    for p in portfolios['portfolios']:
        if not p['hard_checks']['college_reserve_proxy_coverage']:
            p['funding_summary']=None;p['funding_note']='No aligned funding run: portfolio does not back the full college reserve under the selected SGOV-proxy assumption.'
            continue
        values=deepcopy(funding)
        values['opening_transaction_cost']=str(Decimal(str(values.get('opening_transaction_cost',0)))+Decimal(str(p['proposed_transaction_cost'])))
        if use_history:
            values['college_annual_return_percent']=str(p['college_scenario_return_percent'])
            values['support_annual_return_percent']=str(p['support_scenario_return_percent'])
        try:
            result=run_funding(schedule,values);p['funding_summary']=compact(result)
            p['funding_note']='Uses historical-return proxies as forward assumptions.' if use_history else 'Uses the manually entered forward return assumptions.'
            if p is portfolios['candidate']:chosen=result;chosen_inputs=values
        except ValueError as exc:
            p['funding_summary']=None;p['funding_note']=str(exc)
    tests=[]
    if chosen is not None and stress['enabled']:
        cases=[('Immediate market loss', {'initial_support_shock_percent':str(stress['support_loss_percent']),
                  'initial_college_shock_percent':str(stress['college_loss_percent'])},0),
               ('Persistent higher inflation',{'annual_cpi_change_percent':str(Decimal(str(chosen_inputs['annual_cpi_change_percent']))+Decimal(str(stress['inflation_increase_points'])))},0),
               ('Persistent lower returns and higher costs',{
                  'support_annual_return_percent':str(Decimal(str(chosen_inputs['support_annual_return_percent']))-Decimal(str(stress['return_reduction_points']))),
                  'college_annual_return_percent':str(Decimal(str(chosen_inputs['college_annual_return_percent']))-Decimal(str(stress['return_reduction_points']))),
                  'annual_cost_percent':str(Decimal(str(chosen_inputs['annual_cost_percent']))+Decimal(str(stress['cost_increase_points'])))},0),
               ('Combined adverse scenario',{
                  'initial_support_shock_percent':str(stress['support_loss_percent']), 'initial_college_shock_percent':str(stress['college_loss_percent']),
                  'annual_cpi_change_percent':str(Decimal(str(chosen_inputs['annual_cpi_change_percent']))+Decimal(str(stress['inflation_increase_points']))),
                  'support_annual_return_percent':str(Decimal(str(chosen_inputs['support_annual_return_percent']))-Decimal(str(stress['return_reduction_points']))),
                  'college_annual_return_percent':str(Decimal(str(chosen_inputs['college_annual_return_percent']))-Decimal(str(stress['return_reduction_points']))),
                  'annual_cost_percent':str(Decimal(str(chosen_inputs['annual_cost_percent']))+Decimal(str(stress['cost_increase_points'])))},0),
               ('Longer-life horizon',{},int(stress['longevity_extension_years']))]
        for label, changes, extension in cases:
            plan=deepcopy(schedule);plan['planning_horizon_months']+=extension*12
            values={**chosen_inputs,**changes}
            try:
                result=run_funding(plan,values)
                tests.append({'name':label,'status':'calculated','horizon_date':result['horizon_date'],
                    'changed_assumptions':changes,'extra_horizon_years':extension,'paths':compact(result)})
            except ValueError as exc:tests.append({'name':label,'status':'invalid_scenario','reason':str(exc)})
    candidate=portfolios['candidate']
    sensitivity=sensitivities(settings|{'model_start_date':schedule['inputs']['model_start_date']},opening,required,float(funding.get('opening_transaction_cost',0)),stress,candidate) if stress['enabled'] and candidate else []
    selected_path = chosen['paths'].get('adaptive') or chosen['paths'].get('minimum') or chosen['paths'].get('college_only') if chosen else None
    failures=[p for t in tests if t.get('paths') for name,p in t['paths'].items() if name in ('adaptive','minimum','college_only') and p['first_payment_shortfall']]
    if candidate is None:
        action='Reject the current grid candidate set';conditions=['No candidate on the10% grid satisfies every selected hard check. Do not relax risk limits silently.']
    elif selected_path is None or selected_path['first_payment_shortfall']:
        action='Reject the current funding assumptions';conditions=['The selected funding path could not complete; inspect minimum and college shortfalls before implementation.']
    elif not stress['enabled'] or any(t['status']!='calculated' for t in tests) or any(t['status'] in ('invalid_scenario','data_quarantine') for t in sensitivity):
        action='Reject live allocation pending a complete valid robustness review';conditions=['Required robustness evidence is disabled, unavailable or invalid. Retain0% live allocation until the checks are completed.']
    elif failures:
        action='Reject live allocation under the tested adverse assumptions';conditions=['At least one adverse case misses a protected college or minimum-support payment. Revise the process before authorizing capital.']
    elif any(t['candidate'] is None for t in sensitivity):
        action='Reject allocation policy pending sensitivity review';conditions=['At least one portfolio sensitivity has no feasible grid allocation. Review the interacting limits without silently relaxing them.']
    elif float(settings['pilot_max_percent'])<=0:
        action='Adopt the research monitoring process; authorize0% live allocation';conditions=['The reference and tested protected-payment paths completed under assumptions; this is not proof of future solvency.',
            'The entered live pilot ceiling is0%. No investment capital is authorized.',
            'Review estimation-window sensitivity, actual reserve liquidity and an out-of-sample monitoring policy before approving any live pilot.']
    else:
        action='Review a conditional pilot; no automatic adoption'
        conditions=['The selected cash-flow path completed under assumptions; this is not proof of future solvency.',
            ('Robustness scenarios were disabled; stress resilience has not been evaluated.' if not stress['enabled'] else
             'Some stress settings were invalid; inspect these cases before proceeding.' if any(t['status']!='calculated' for t in tests) else
             'Adverse minimum-support failures remain.' if failures else 'No minimum-support shortfall was observed in the calculated stress cases; untested outcomes remain.'),
            'The pilot ceiling is a user-entered proposal, not an evaluated blend with other holdings. The return target is met by the historical estimate only.' if candidate['return_objective_met'] else 'The historical return estimate does not meet the selected return objective.']
    if candidate and not candidate['return_objective_met']:
        conditions.append('The historical arithmetic return estimate does not meet the selected nominal return target; risk and protected payments take priority.')
    return {**portfolios,'funding':chosen,'candidate_funding_inputs':({**funding,'college_annual_return_percent':str(candidate['college_scenario_return_percent']),'support_annual_return_percent':str(candidate['support_scenario_return_percent']),'portfolio_source':settings} if use_history and candidate and chosen else chosen_inputs),'stress_tests':tests,'portfolio_sensitivities':sensitivity,
        'recommendation':{'action':action,'allocation_range_percent_of_support_capital':[0,0 if action.startswith('Reject') else float(settings['pilot_max_percent'])],
            'proposed_weights':candidate['weights'] if candidate else None,'conditions':conditions,
            'reversal_triggers':['Any college reserve backing gap or hard minimum missed payment.',
                'Updated volatility exceeds limit, annual turnover budget exhausted, or data is quarantined/stale.',
                'New information changes the investment thesis, costs or funding assumptions.'],
            'committee_ask':('Reject live allocation and require correction of the failed checks before review.' if action.startswith('Reject') else 'Adopt the app for research monitoring only; approve0% live allocation. Return to committee with validated reserve liquidity, prospective evidence and a proposed nonzero pilot before investing.' if float(settings['pilot_max_percent'])<=0 else 'Review candidate weights, reserve backing, support policy and adverse failures. Approve only the entered limited pilot ceiling with the stated reversal triggers; no automatic trade is executed.'),
            'student_review_required':True},
        'limitations':['Historical adjusted-price estimates are not forecasts or a vintage-safe historical strategy backtest.',
          'SGOV is a modelling proxy, not a guarantee of CPI-linked liabilities or timely liquidation.',
          'Turnover is the proposed transition plus entered annual usage; future trading must be separately monitored.',
          'Shock magnitudes are editable scenarios, not event probabilities or empirical predictions. The locked student experiment is separate and remains unrun.']}
