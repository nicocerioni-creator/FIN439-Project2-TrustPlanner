"""Synthetic workflow checks; never the student's designated investment experiment."""
import sys,unittest
from pathlib import Path
from decimal import Decimal
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from backend.main import app
from test_product import portfolio,plan,POLICY

class FundingWorkflowTests(unittest.TestCase):
 def setUp(self):
  self.client=TestClient(app);self.inputs=plan()['inputs'];self.inputs['model_start_date']='2026-11-23'
  self.context={'payment_inputs':self.inputs,'opening_balance':'240','opening_transaction_cost':'10'}
  self.settings=portfolio()|{'transaction_cost_bps':'100'}
  self.funding={**self.context,'college_annual_return_percent':'0','support_annual_return_percent':'0','annual_cpi_change_percent':'0','adaptive_policy':POLICY}
 def test_estimate_needs_no_funding_returns_and_reports_both_portions(self):
  r=self.client.post('/api/v1/portfolio-estimate',json={**self.context,'portfolio':self.settings});self.assertEqual(r.status_code,200,r.text)
  value=r.json();candidate=value['candidate'];self.assertIsNotNone(candidate)
  self.assertEqual(candidate['college_weights']['SGOV'],100)
  self.assertAlmostEqual(sum(candidate['support_weights'].values()),100)
  self.assertEqual(candidate['support_model_assets'],227.6)
  self.assertNotIn('funding',value);self.assertNotIn('recommendation',value)
 def test_linked_funding_recomputes_rates_and_applies_trade_cost_once(self):
  r=self.client.post('/api/v1/funding-projection',json=self.funding|{'college_annual_return_percent':'99','support_annual_return_percent':'99','portfolio_source':self.settings})
  self.assertEqual(r.status_code,200,r.text);value=r.json();candidate=value['investment_source']['candidate']
  self.assertAlmostEqual(float(value['calculation_inputs']['support_annual_return_percent']),candidate['support_scenario_return_percent'])
  self.assertNotEqual(value['calculation_inputs']['support_annual_return_percent'],'99')
  self.assertEqual(Decimal(value['opening_allocation']['opening_transaction_cost']),Decimal('12.40'))
  self.assertEqual(value['inputs']['opening_transaction_cost'],'10')
  self.assertEqual(value['inputs']['annual_cost_percent'],'0')
 def test_birthdays_and_college_priority_cannot_be_waived(self):
  r=self.client.post('/api/v1/funding-projection',json=self.funding);self.assertEqual(r.status_code,200,r.text)
  self.assertTrue(r.json()['inputs']['include_horizon_day_payments'])
  self.assertEqual(r.json()['inputs']['reserve_transfer_rule'],'protect_before_payments')
  for override in ({'include_horizon_day_payments':False},{'reserve_transfer_rule':'separate_accounts'}):
   self.assertEqual(self.client.post('/api/v1/funding-projection',json=self.funding|override).status_code,422)
 def test_bad_portfolio_source_never_falls_back_to_manual_rates(self):
  for changes in ({'max_data_age_days':1},{'max_fund_weight_percent':'10'},{'decision_date':'2099-01-01'}):
   r=self.client.post('/api/v1/funding-projection',json=self.funding|{'portfolio_source':self.settings|changes})
   self.assertEqual(r.status_code,422,r.text)
 def test_linked_inspection_replays_evaluation_without_double_trade_cost(self):
  r=self.client.post('/api/v1/evaluate',json={'funding':self.funding,'portfolio':self.settings,'use_historical_proxy_returns':True,'stress':{'enabled':False}})
  self.assertEqual(r.status_code,200,r.text);value=r.json();selected=value['candidate_funding_inputs']
  self.assertEqual(Decimal(selected['opening_transaction_cost']),Decimal('10'))
  r=self.client.post('/api/v1/funding-projection',json=selected);self.assertEqual(r.status_code,200,r.text)
  self.assertEqual(r.json()['paths'],value['funding']['paths'])
