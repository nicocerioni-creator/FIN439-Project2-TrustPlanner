"""Synthetic UI preview/constraint and bootstrap checks, not a student experiment."""
import math
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.main import app
from backend.portfolio_engine import TICKERS,analyze,prepare_data
from backend.portfolio_simulation import simulate_growth
from test_product import portfolio,plan


class PortfolioCasesTests(unittest.TestCase):
 def setUp(self):
  self.client=TestClient(app);inputs=plan()['inputs'];inputs['model_start_date']='2026-11-23'
  self.body={'payment_inputs':inputs,'opening_balance':'240','portfolio':portfolio()}
 def post(self,path,body):
  r=self.client.post('/api/v1/'+path,json=body);self.assertEqual(r.status_code,200,r.text);return r.json()
 def test_standard_cases_report_distinct_weights_and_binding_limits(self):
  # A synthetic required college reserve, not a reference-family investment run.
  rows=[]
  for style,cap in [('lower_risk',.35),('balanced_growth',.70),('aggressive_growth',1)]:
   p=analyze(portfolio()|{'allocation_style':style},1000,200)['candidate'];self.assertIsNotNone(p)
   self.assertTrue(p['hard_checks_pass']);self.assertGreaterEqual(p['reserve_proxy_assets'],200)
   equity=sum(p['weights'][t] for t in TICKERS[:-1])/100*1000
   self.assertLessEqual(equity,800*cap+1e-6)
   self.assertLessEqual(max(p['weights'][t] for t in TICKERS[:-1])/100*1000,800*.4+1e-6)
   rows.append(p)
  _,data=prepare_data(portfolio())
  self.assertLessEqual(rows[0]['annualized_sample_volatility_percent'],math.sqrt(data['covariance'][-1][-1])*100+1e-8)
  self.assertGreaterEqual(rows[2]['historical_arithmetic_return_percent'],rows[1]['historical_arithmetic_return_percent'])
  value=self.post('portfolio-cases',self.body)
  self.assertEqual(set(value['cases']),{'lower_risk','balanced_growth','aggressive_growth'})
  self.assertNotIn('funding',value);self.assertNotIn('recommendation',value)
 def test_custom_estimates_change_immediately_without_search_or_hidden_preset_cap(self):
  settings=portfolio()|{'allocation_style':'custom','max_growth_fund_weight_percent':'100'}
  def weights(voo):return {t:str(voo if t=='VOO' else 100-voo if t=='SGOV' else 0) for t in TICKERS}
  a=self.post('portfolio-estimate',self.body|{'portfolio':settings|{'proposed_weights':weights(20)}})
  b=self.post('portfolio-estimate',self.body|{'portfolio':settings|{'proposed_weights':weights(80)}})
  self.assertEqual(b['grid_combinations_examined'],0)
  self.assertEqual(b['candidate']['weights']['VOO'],80)
  self.assertGreater(b['candidate']['annualized_sample_volatility_percent'],a['candidate']['annualized_sample_volatility_percent'])
  self.assertGreater(b['candidate']['historical_arithmetic_return_percent'],a['candidate']['historical_arithmetic_return_percent'])
 def test_custom_failure_visible_but_cannot_be_linked_or_simulated(self):
  settings=portfolio()|{'allocation_style':'custom','max_growth_fund_weight_percent':'100',
   'proposed_weights':{t:100 if t=='VOO' else 0 for t in TICKERS},'volatility_limit_percent':'0.01'}
  value=self.post('portfolio-estimate',self.body|{'portfolio':settings});self.assertIsNone(value['candidate'])
  row=value['portfolios'][-1];self.assertIn('volatility',row['failed_rules'])
  self.assertEqual(self.client.post('/api/v1/portfolio-simulation',json=self.body|{'portfolio':settings}).status_code,422)
  funding={k:v for k,v in self.body.items() if k!='portfolio'}|{'college_annual_return_percent':'0','support_annual_return_percent':'0','annual_cpi_change_percent':'0','portfolio_source':settings}
  self.assertEqual(self.client.post('/api/v1/funding-projection',json=funding).status_code,422)
  value=self.post('evaluate',{'funding':funding|{'portfolio_source':None},'portfolio':settings,'stress':{'enabled':False},'use_historical_proxy_returns':False})
  self.assertIsNone(value['candidate_funding_inputs']);self.assertIsNone(value['funding'])
 def test_quarantine_precedes_all_previews_and_bootstrap(self):
  bad=self.body|{'portfolio':portfolio()|{'max_data_age_days':1}}
  with patch('backend.portfolio_simulation.simulate_growth',side_effect=AssertionError('must not simulate')):
   value=self.post('portfolio-cases',bad);self.assertEqual(value['data_card']['admission'],'quarantine')
   self.assertTrue(all(v['candidate'] is None for v in value['cases'].values()))
   self.assertEqual(self.client.post('/api/v1/portfolio-simulation',json=bad).status_code,422)
 def test_bootstrap_seed_quantiles_constant_growth_and_expense(self):
  weights={t:1 if t=='SGOV' else 0 for t in TICKERS}
  data={'returns':[[.01]*7]*12}
  value=simulate_growth(data,weights,3,1000,439,1)
  expected=100*((1.01**12)*.99)**3
  for key in ('p10','median','p90','mean'):self.assertAlmostEqual(value['points'][-1][key],expected)
  _,data=prepare_data(portfolio())
  a=simulate_growth(data,weights,3,1000,1);b=simulate_growth(data,weights,3,1000,1)
  self.assertEqual(a,b);self.assertNotEqual(a,simulate_growth(data,weights,3,1000,2))
  for p in a['points']:self.assertLessEqual(p['p10'],p['median']);self.assertLessEqual(p['median'],p['p90'])
 def test_bootstrap_uses_joint_returns_and_support_scope(self):
  # Opposing perfectly correlated ticker returns must cancel each month.
  data={'returns':[[.1,-.1,0,0,0,0,0],[-.1,.1,0,0,0,0,0]]*6}
  weights={t:.5 if t in ('VOO','QQQ') else 0 for t in TICKERS}
  value=simulate_growth(data,weights,2,1000);self.assertEqual(value['points'][-1]['median'],100)
  value=self.post('portfolio-simulation',self.body|{'years':2,'paths':1000})
  self.assertEqual(len(value['points']),3);self.assertAlmostEqual(sum(value['weights'].values()),100)
  self.assertIn('BEFORE',value['limitations'][0])
  self.assertEqual(self.client.post('/api/v1/portfolio-simulation',json=self.body|{'paths':1000000}).status_code,422)

if __name__=='__main__':unittest.main()
