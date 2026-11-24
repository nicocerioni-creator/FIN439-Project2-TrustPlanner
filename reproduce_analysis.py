"""Replay a saved app configuration exactly; never changes an input or writes a prediction."""
import argparse
import json
from pathlib import Path
import subprocess
import sys

ROOT=Path(__file__).resolve().parent


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('saved_plan',type=Path,help='Save analysis settings or complete analysis JSON from the app.')
    parser.add_argument('--output-dir',type=Path,default=ROOT/'outputs')
    args=parser.parse_args()
    try:
        from backend.main import EvaluationRequest,payment_schedule,evaluate_product,eastern_today,API_VERSION
    except ModuleNotFoundError:
        python=ROOT/'.venv-web'/('Scripts/python.exe' if sys.platform=='win32' else 'bin/python')
        if not python.exists() or Path(sys.prefix).resolve()==(ROOT/'.venv-web').resolve():
            raise SystemExit('Run python3 setup_web.py first.')
        raise SystemExit(subprocess.run([str(python),str(Path(__file__).resolve()),*sys.argv[1:]],cwd=ROOT).returncode)
    raw=json.loads(args.saved_plan.read_text())
    body=raw['analysis'] if raw.get('kind')=='trust-planner-analysis-settings' else raw['inputs']
    from pydantic import ValidationError
    try:
        request=EvaluationRequest.model_validate(body)
    except ValidationError:
        raise SystemExit('Saved settings are invalid. Load them in the app for field guidance; rejected values are not printed.') from None
    if request.portfolio.decision_date>eastern_today():raise SystemExit('Decision date cannot be in the future.')
    result=evaluate_product(payment_schedule(request.funding.payment_inputs),request.funding.model_dump(mode='json'),
        request.portfolio.model_dump(mode='json'),request.stress.model_dump(mode='json'),request.use_historical_proxy_returns or request.funding.portfolio_source is not None)
    output={'api_version':API_VERSION,'inputs':request.model_dump(mode='json'),**result}
    args.output_dir.mkdir(parents=True,exist_ok=True)
    (args.output_dir/'analysis.json').write_text(json.dumps(output,indent=2)+'\n')
    text=['OpenAI Codex assisted with code, calculations and this generated report; the analysis and final decision are the student\'s own.',
      '', 'Educational/research use only; not investment advice or a guarantee.', '', '# Saved analysis replay',
      '',f"Decision date: {request.portfolio.decision_date}. Data status: {result['data_card']['admission']}.",
      f"Snapshot SHA256: {result['data_card']['sha256']}", '',f"Draft decision support: **{result['recommendation']['action']}**",'',
      '| Portfolio | Arithmetic return estimate | Sample volatility | Modelled checks |', '|---|---:|---:|---|']
    for p in result['portfolios']:
        text.append(f"|{p['name']}|{p['historical_arithmetic_return_percent']:.2f}%|{p['annualized_sample_volatility_percent']:.2f}%|{', '.join(p['failed_rules']) or 'Pass under assumptions'}|")
    text+=['', '## Conditions', '', *('- '+v for v in result['recommendation'].get('conditions',[])), '',
      '## Stop and reversal triggers','', *('- '+v for v in result['recommendation'].get('reversal_triggers',[])), '',
      result['recommendation']['committee_ask'], '', 'The complete inputs, baseline/funding/stress results and limitations are in analysis.json.',
      'This command replays saved inputs only. It does not run the designated changed-input experiment or author the student prediction.']
    (args.output_dir/'analysis-summary.md').write_text('\n'.join(text)+'\n')
    print(f'Saved exact-input replay to {args.output_dir}/analysis.json and analysis-summary.md. No changed-input record or prediction was produced.')


if __name__=='__main__':main()
