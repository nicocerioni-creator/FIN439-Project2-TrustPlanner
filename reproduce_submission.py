"""Replay the frozen reference case; financial calculations stay in the Python engine."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parent

def json_write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2)+'\n')

def require_prediction_lock():
    path=ROOT/'docs/locked-input-audit.json'
    if not path.exists():raise SystemExit('The published pre-run prediction has not been verified. Do not run the designated change yet.')
    lock=json.loads(path.read_text())
    if not lock.get('prediction_publication_verified') or len(lock.get('prediction_commit',''))!=40:
        raise SystemExit('Missing verified immutable prediction commit.')
    for file,key in [('docs/ai-off-prediction.txt','prediction_sha256'),('docs/reference-plan.json','reference_plan_sha256')]:
        if hashlib.sha256((ROOT/file).read_bytes()).hexdigest()!=lock[key]:raise SystemExit('Frozen prediction/reference hash changed. Stop; preserve the original record.')
    return lock

def compute(inputs):
    from backend.main import EvaluationRequest,payment_schedule,API_VERSION,eastern_today
    from backend.product_evaluation import evaluate_product
    from backend.college_plan import college_payment_plan
    request=EvaluationRequest.model_validate(inputs)
    if request.portfolio.decision_date>eastern_today():raise ValueError('Decision date cannot be in the future.')
    body=request.model_dump(mode='json');schedule=payment_schedule(request.funding.payment_inputs)
    value=evaluate_product(schedule,body['funding'],body['portfolio'],body['stress'],body['use_historical_proxy_returns'] or bool(body['funding'].get('portfolio_source')))
    calendar=college_payment_plan(schedule,request.funding.annual_cpi_change_percent)
    return {'api_version':API_VERSION,'inputs':body,**value},calendar

def money(value):return '${:,.2f}'.format(float(value))

def summary(value,calendar):
    candidate=value['candidate'];request=value['inputs'];fund=request['funding'];card=value['data_card']
    lines=['OpenAI Codex assisted with programming, calculations, tests and this generated report; v0 contributed interface design. The analysis and final decisions are Nicolas Cerioni’s own.',
      '', 'Educational and research use only; not investment advice or a guarantee.', '', '# Frozen reference results', '',
      f"Decision/model start: **{request['portfolio']['decision_date']}**. Opening trust: **{money(fund['opening_balance'])}**. Annual inflation scenario: **{fund['annual_cpi_change_percent']}%**.",
      f"Data captured: {card['snapshot_available_on']}; last price: {card['last_price_date']}; estimation window: {request['portfolio']['estimation_months']} monthly returns. Admission: {card['admission']}.",
      f"Data SHA256: `{card['sha256']}`.", '',f"Committee decision: **{value['recommendation']['action']}**.",
      f"Authorized/proposed allocation range: **{value['recommendation'].get('allocation_range_percent_of_support_capital',[0,0])}% of long-term capital**. No automatic trade.", '',
      '| Portfolio | Arithmetic return | Historical CAGR | Historical volatility | Mandate verdict |', '|---|---:|---:|---:|---|']
    for p in value['portfolios']:lines.append(f"| {p['name']} | {p['historical_arithmetic_return_percent']:.2f}% | {p['historical_constant_mix_cagr_percent']:.2f}% | {p['annualized_sample_volatility_percent']:.2f}% | {', '.join(p['failed_rules']) or 'Pass under model assumptions'} |")
    if candidate:
      lines+=['','## Candidate and payment assumptions','', 'Whole-trust weights: '+', '.join(f'{t} {w:.1f}%' for t,w in candidate['weights'].items())+'.',
       f"College SGOV historical return proxy: {candidate['college_scenario_return_percent']:.4f}% annually. Residual long-term return proxy: {candidate['support_scenario_return_percent']:.4f}% annually.",
       f"College allowance {money(fund['payment_inputs']['college_annual'])}; adult minimum {money(fund['payment_inputs']['adult_minimum'])}; adult goal {money(fund['payment_inputs']['adult_target'])}, each annual/per child in model-start dollars.",
       f"Total remaining nominal college payments: **{money(calendar['total_nominal_dollars'])}**. First: {calendar['payment_dates'][0]['date'] if calendar['payment_dates'] else 'None'}; last: {calendar['payment_dates'][-1]['date'] if calendar['payment_dates'] else 'None'}."]
    if value.get('funding'):
      lines+=['','## Funding paths','','| Path | Status | Last included/stopping date | Nominal balance at that date | Purchasing power at that date |','|---|---|---|---:|---:|']
      for name,p in value['funding']['paths'].items():lines.append(f"| {name} | {p['status']} | {p['last_date']} | {money(p['ending_total'])} | {money(p['ending_total_model_start_dollars'])} |")
      lines+=['','A stopped path has no age80 ending value. Completed paths end at '+value['funding']['horizon_date']+'. These are conditional constant-return scenarios; multi-billion-dollar long-horizon outputs are not forecasts.']
    lines+=['','## Adverse funding cases','','| Case | Path | Status | First protected-payment shortfall |','|---|---|---|---|']
    for case in value['stress_tests']:
      for name,p in case.get('paths',{}).items():lines.append(f"| {case['name']} | {name} | {p['status']} | {p['first_payment_shortfall']['date'] if p['first_payment_shortfall'] else 'Not observed before cutoff/stop'} |")
      if not case.get('paths'):lines.append(f"| {case['name']} | — | {case['status']} | {case.get('reason','Not calculated')} |")
    lines+=['','## Estimation, cost and constraint sensitivity','','| Case | Change | Candidate | Largest weight change |','|---|---|---|---:|']
    for case in value.get('portfolio_sensitivities',[]):lines.append(f"| {case['name']} | {case['changed_parameters']} | {'Feasible' if case['candidate'] else case.get('reason') or case['status']} | {str(case['maximum_weight_change_points'])+'pp' if case['maximum_weight_change_points'] is not None else 'Unavailable'} |")
    lines+=['','## Conditions and reversal triggers','',*('- '+x for x in value['recommendation'].get('conditions',[])), '',*('- '+x for x in value['recommendation'].get('reversal_triggers',[])), '',value['recommendation']['committee_ask'],
      '', 'The quantitative result supports the stated decision only under these assumptions. Future inflation, reserve liquidity, calibration and future monitoring remain limitations. See validation-and-ai-use.md and locked-changed-input-record.md.']
    return '\n'.join(lines)+'\n'

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output-dir',type=Path,default=ROOT/'outputs');args=parser.parse_args()
    require_prediction_lock()
    raw=json.loads((ROOT/'docs/reference-plan.json').read_text());value,calendar=compute(raw['analysis'])
    json_write(args.output_dir/'analysis.json',value);json_write(args.output_dir/'college-calendar.json',calendar)
    (ROOT/'docs/visible-output.md').write_text(summary(value,calendar))
    print('Reproduced reference outputs and docs/visible-output.md. No designated changed-input run was performed.')

if __name__=='__main__':
    try:import fastapi
    except ModuleNotFoundError:
      python=ROOT/'.venv-web'/('Scripts/python.exe' if sys.platform=='win32' else 'bin/python')
      if not python.exists():raise SystemExit('Run the README setup step first.')
      raise SystemExit(subprocess.run([str(python),str(Path(__file__).resolve()),*sys.argv[1:]],cwd=ROOT).returncode)
    main()
