"""Run only the precommitted2%→4% annual-inflation experiment; never authors a prediction."""
from copy import deepcopy
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from reproduce_submission import ROOT,require_prediction_lock,compute,json_write

def main():
    lock=require_prediction_lock();original=json.loads((ROOT/'docs/reference-plan.json').read_text())['analysis']
    if original['funding']['annual_cpi_change_percent']!='2':raise SystemExit('Reference inflation is not the locked2% input; stop.')
    changed=deepcopy(original);changed['funding']['annual_cpi_change_percent']='4'
    before=deepcopy(original);before['funding']['annual_cpi_change_percent']='4'
    assert before==changed
    # Record start before execution; the GitHub publication time must already be verified.
    started=datetime.now(timezone.utc).isoformat()
    baseline=json.loads((ROOT/'outputs/analysis.json').read_text())
    if baseline['inputs']!=original:raise SystemExit('Reproduce the exact frozen baseline first.')
    result,calendar=compute(changed)
    json_write(ROOT/'outputs/changed-input.json',result);json_write(ROOT/'outputs/changed-college-calendar.json',calendar)
    comparison={'parameter':'funding.annual_cpi_change_percent','unit':'percent per year','old':'2','new':'4',
       'prediction_commit':lock['prediction_commit'],'prediction_sha256':lock['prediction_sha256'],'reference_plan_sha256':lock['reference_plan_sha256'],
       'run_started_utc':started,'run_completed_utc':datetime.now(timezone.utc).isoformat(),
       'baseline_result_sha256':hashlib.sha256((ROOT/'outputs/analysis.json').read_bytes()).hexdigest(),
       'changed_result_sha256':hashlib.sha256((ROOT/'outputs/changed-input.json').read_bytes()).hexdigest(),
       'baseline_decision':baseline['recommendation']['action'],'changed_decision':result['recommendation']['action'],
       'baseline_weights':baseline['candidate']['weights'],'changed_weights':result['candidate']['weights'],
       'baseline_returns':{k:baseline['candidate'][k] for k in ['college_scenario_return_percent','support_scenario_return_percent']},
       'changed_returns':{k:result['candidate'][k] for k in ['college_scenario_return_percent','support_scenario_return_percent']},
       'changed_nominal_college_total':calendar['total_nominal_dollars'],
       'baseline_nominal_college_total':json.loads((ROOT/'outputs/college-calendar.json').read_text())['total_nominal_dollars'],
       'baseline_paths':{k:{field:v[field] for field in ['status','last_date','ending_total','ending_total_model_start_dollars','first_payment_shortfall']} for k,v in baseline['funding']['paths'].items()},
       'changed_paths':{k:{field:v[field] for field in ['status','last_date','ending_total','ending_total_model_start_dollars','first_payment_shortfall']} for k,v in result['funding']['paths'].items()}}
    json_write(ROOT/'outputs/changed-input-comparison.json',comparison)
    print('Completed only the locked inflation2%→4% experiment; original student prediction is unchanged.')

if __name__=='__main__':
    try:import fastapi
    except ModuleNotFoundError:
      python=ROOT/'.venv-web'/('Scripts/python.exe' if sys.platform=='win32' else 'bin/python')
      if not python.exists():raise SystemExit('Run the README setup step first.')
      raise SystemExit(subprocess.run([str(python),str(Path(__file__).resolve()),*sys.argv[1:]],cwd=ROOT).returncode)
    main()
