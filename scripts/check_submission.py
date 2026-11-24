"""Cross-check frozen outputs, prediction order and written evidence without rerunning finance."""
from pathlib import Path
from copy import deepcopy
from datetime import datetime
import hashlib,json

ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/name).read_text())
def digest(name):return hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
def main():
 baseline=read('outputs/analysis.json');changed=read('outputs/changed-input.json');comparison=read('outputs/changed-input-comparison.json');lock=read('docs/locked-input-audit.json')
 reference=read('docs/reference-plan.json')['analysis'];assert baseline['inputs']==reference
 expected=deepcopy(reference);expected['funding']['annual_cpi_change_percent']='4';assert expected==changed['inputs']
 assert lock['prediction_publication_verified']
 assert datetime.fromisoformat(lock['commit_time_utc'].replace('Z','+00:00'))<=datetime.fromisoformat(lock['publication_verified_at_utc'])<datetime.fromisoformat(comparison['run_started_utc'])
 assert digest('docs/ai-off-prediction.txt')==lock['prediction_sha256']
 assert digest('docs/reference-plan.json')==lock['reference_plan_sha256']
 assert digest('outputs/analysis.json')==comparison['baseline_result_sha256']
 assert digest('outputs/changed-input.json')==comparison['changed_result_sha256']
 assert baseline['candidate']['weights']==changed['candidate']['weights']
 assert baseline['recommendation']['action']==changed['recommendation']['action']
 assert baseline['recommendation']['allocation_range_percent_of_support_capital']==[0,0]
 for name in ['README.md','docs/decision-memo.md','docs/validation-and-ai-use.md']:
  first=(ROOT/name).read_text().split('\n\n')[:2];assert 'Codex' in first[0] and 'own' in first[0];assert 'Educational' in first[1] or 'educational' in first[1];assert 'not investment advice' in first[1]
 visible=(ROOT/'docs/visible-output.md').read_text();memo=(ROOT/'docs/decision-memo.md').read_text();validation=(ROOT/'docs/validation-and-ai-use.md').read_text()
 assert baseline['recommendation']['action'] in visible
 for value in [baseline['funding']['paths']['adaptive']['ending_total'],baseline['funding']['paths']['adaptive']['ending_total_model_start_dollars']]:
  formatted='${:,.2f}'.format(float(value));assert formatted in visible and formatted in memo and formatted in validation
 for value in [comparison['baseline_nominal_college_total'],comparison['changed_nominal_college_total']]:
  formatted='${:,.2f}'.format(float(value));assert formatted in memo and formatted in validation
 assert len(baseline['portfolios'])>=4 and len(baseline['stress_tests'])==5 and len(baseline['portfolio_sensitivities'])==5
 print('PASS: exact one-input change, public-commit-before-run order, frozen hashes, allocation/decision, opening statements and written numbers.')
 print('VIDEO STATUS: all three URLs recorded; Video 3 exceeds the 5-minute limit and is retained by student choice. Video 1 transcript, full audiovisual review and Brightspace receipt remain pending.')
if __name__=='__main__':main()
