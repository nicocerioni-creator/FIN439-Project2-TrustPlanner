"""Synthetic audit checks; the separately locked reference experiment is not a fixture."""
import unittest
from backend.portfolio_engine import analyze
from backend.portfolio_sensitivity import sensitivities
from backend.product_evaluation import evaluate_product
from backend.main import PaymentRequest,payment_schedule,FundingRequest,StressSettings
from test_product import portfolio,plan

class SubmissionReviewTests(unittest.TestCase):
 def test_sensitivity_reports_missing_window_and_never_loosens_limits(self):
  settings=portfolio()|{'volatility_limit_percent':'8','max_fund_weight_percent':'50'}
  baseline=analyze(settings,100000,0)['candidate']
  rows=sensitivities(settings,100000,0,0,{},baseline)
  self.assertEqual(len(rows),5)
  self.assertEqual(rows[1]['status'],'invalid_scenario')
  self.assertIsNone(rows[1]['candidate'])
  self.assertEqual(rows[3]['changed_parameters']['volatility_limit_percent'],'8.0')
  self.assertEqual(rows[4]['changed_parameters']['max_fund_weight_percent'],'50.0')
  self.assertEqual(rows[2]['candidate']['proposed_transaction_cost'],250)
 def test_disabled_stress_cannot_recommend_allocation(self):
  raw=plan()['inputs']|{'model_start_date':'2026-11-23'};p=payment_schedule(PaymentRequest(**raw))
  fund=FundingRequest(payment_inputs=raw,opening_balance='20000',college_annual_return_percent='0',support_annual_return_percent='0',annual_cpi_change_percent='0').model_dump(mode='json')
  r=evaluate_product(p,fund,portfolio(),StressSettings(enabled=False).model_dump(mode='json'),False)
  self.assertTrue(r['recommendation']['action'].startswith('Reject'))
  self.assertEqual(r['recommendation']['allocation_range_percent_of_support_capital'],[0,0])
  self.assertEqual(r['portfolio_sensitivities'],[])
 def test_zero_pilot_ceiling_means_research_only_after_valid_checks(self):
  raw=plan()['inputs']|{'model_start_date':'2026-11-23'};p=payment_schedule(PaymentRequest(**raw))
  fund=FundingRequest(payment_inputs=raw,opening_balance='20000',college_annual_return_percent='0',support_annual_return_percent='0',annual_cpi_change_percent='0').model_dump(mode='json')
  stress=StressSettings(short_window_months=12,long_window_months=12).model_dump(mode='json')
  r=evaluate_product(p,fund,portfolio(),stress,False)
  self.assertTrue(r['recommendation']['action'].startswith('Adopt the research'))
  self.assertEqual(r['recommendation']['allocation_range_percent_of_support_capital'],[0,0])
  self.assertIn('approve0%',r['recommendation']['committee_ask'])

if __name__=='__main__':unittest.main()
