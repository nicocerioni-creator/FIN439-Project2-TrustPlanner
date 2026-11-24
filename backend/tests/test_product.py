"""Synthetic policy/data/portfolio checks, not the locked student experiment."""
from datetime import date
from decimal import Decimal
from pathlib import Path
import math
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from backend.main import app,FundingRequest,PortfolioSettings,payment_schedule,PaymentRequest
from backend.funding_projection import project_funding
from backend.portfolio_engine import analyze,prepare_data,read_panel

POLICY={'enabled':True,'real_discount_percent':'0','buffer_percent':'0','terminal_real_balance':'0','max_monthly_restoration_points':'100'}

def panel():
    text=['Date,VOO,QQQ,SCHD,PAVE,XLE,XLV,SGOV'];values=[100.]*7
    for i in range(25):
        y,m=divmod(2024*12+8+i,12);day=date(y,m+1,28)
        if i:
            values=[v*(1+(0.009+0.0005*j+0.006*math.sin(i+j)) if j<6 else 1+0.002+0.0001*math.sin(i)) for j,v in enumerate(values)]
        text.append(day.isoformat()+','+','.join(str(v) for v in values))
    return '\n'.join(text)+'\n'


def portfolio():
    return PortfolioSettings(decision_date=date(2026,11,23),estimation_months=12,
        current_weights={t:100 if t=='SGOV' else 0 for t in ('VOO','QQQ','SCHD','PAVE','XLE','XLV','SGOV')},
        confirm_reserve_proxy=True,price_csv=panel(),source_available_on=date(2026,10,22),confirm_uploaded_provenance=True).model_dump(mode='json')


def plan():
    return payment_schedule(PaymentRequest(model_start_date=date(2026,1,1),starting_ages=[79],degree_years=['1'],
        first_college_years=[2000],adult_minimum='120',adult_target='1200'))


class ProductTests(unittest.TestCase):
    def test_adaptive_funds_floor_and_common_increment_without_cash_creation(self):
        r=project_funding(plan(),'240','0','0','0','0','protect_before_payments',True,POLICY)
        self.assertEqual(r['paths']['goal']['status'],'stopped_at_payment_shortfall')
        a=r['paths']['adaptive'];self.assertEqual(a['status'],'completed_horizon')
        self.assertEqual(a['total_adult_payments'],'240.00');self.assertEqual(a['ending_total'],'0.00')
        self.assertTrue(a['ledger_reconciles'])
        self.assertTrue(all(Decimal(v['annual_support_per_child_model_start_dollars'])>=120 for v in a['adaptive_reviews']))
        buffered=project_funding(plan(),'240','0','0','0','0','protect_before_payments',True,POLICY|{'buffer_percent':'100'})
        self.assertGreater(Decimal(buffered['paths']['adaptive']['ending_total']),0)
        self.assertEqual(Decimal(buffered['paths']['adaptive']['adaptive_reviews'][0]['goal_gap_share']),0)

    def test_terminal_goal_opening_cost_and_shock_reconcile(self):
        r=project_funding(plan(),'240','0','0','0','0','protect_before_payments',True,POLICY|{'terminal_real_balance':'60'})
        self.assertEqual(r['paths']['adaptive']['ending_total'],'60.00')
        r=project_funding(plan(),'130','0','0','0','0','protect_before_payments',True,POLICY,opening_transaction_cost='10')
        self.assertEqual(r['paths']['adaptive']['total_costs'],'10.00')
        self.assertEqual(r['paths']['adaptive']['ending_total'],'0.00')
        r=project_funding(plan(),'240','0','0','0','0','protect_before_payments',True,POLICY,support_shock='-50')
        self.assertEqual(r['paths']['adaptive']['total_gross_growth'],'-120.00')
        self.assertEqual(r['paths']['adaptive']['ending_total'],'0.00')

    def test_future_beneficiary_minimums_are_budgeted_before_discretionary_support(self):
        p=payment_schedule(PaymentRequest(model_start_date=date(2026,1,1),starting_ages=[79,78],degree_years=['1','0.5'],
           first_college_years=[2000,2026],adult_minimum='120',adult_target='1200'))
        r=project_funding(p,'25360','0','0','0','0','protect_before_payments',True,POLICY)
        a=r['paths']['adaptive'];self.assertEqual(a['status'],'completed_horizon')
        self.assertEqual(a['total_adult_payments'],'360.00')
        self.assertEqual(Decimal(a['adaptive_reviews'][0]['goal_gap_share']),0)

    def test_adaptive_flags_insufficient_minimum_and_restoration_cap(self):
        r=project_funding(plan(),'60','0','0','0','0','protect_before_payments',True,POLICY)
        a=r['paths']['adaptive'];self.assertIsNotNone(a['first_adult_minimum_breach_date'])
        self.assertGreater(Decimal(a['adaptive_reviews'][0]['minimum_budget_gap_real']),0)
        r=project_funding(plan(),'240','0','12','0','0','protect_before_payments',True,POLICY|{'max_monthly_restoration_points':'0'})
        reviews=r['paths']['adaptive']['adaptive_reviews'];first=Decimal(reviews[0]['goal_gap_share'])
        self.assertTrue(all(Decimal(v['goal_gap_share'])<=first for v in reviews))

    def test_data_gate_excludes_later_snapshot_and_stale_data(self):
        settings=portfolio();card,data=prepare_data(settings)
        self.assertIsNotNone(data);self.assertEqual(card['admission'],'admit_for_this_forward_decision')
        for changes in ({'decision_date':'2026-10-22'},{'max_data_age_days':1},{'confirm_uploaded_provenance':False}):
            card,data=prepare_data(settings|changes);self.assertIsNone(data);self.assertEqual(card['admission'],'quarantine')
        with self.assertRaises(ValueError):read_panel(panel().replace(',100.0',',.'))

    def test_portfolio_constraints_baselines_and_signal_are_explicit(self):
        result=analyze(portfolio(),100000,50000)
        self.assertEqual(len(result['portfolios']),4)
        benchmark=next(p for p in result['portfolios'] if p['name']=='VOO benchmark proxy')
        self.assertFalse(benchmark['hard_checks']['college_reserve_proxy_coverage'])
        self.assertTrue(result['candidate']['hard_checks_pass'])
        self.assertEqual(result['grid_combinations_examined'],8008)
        self.assertIn('signal_12_month_return_percent',result['data_card'])
        for p in result['portfolios']:self.assertAlmostEqual(sum(p['weights'].values()),100)
        low=portfolio()|{'max_fund_weight_percent':'10'}
        self.assertIsNone(analyze(low,100000,50000)['candidate'])

    def test_full_api_stress_and_import_without_unlocking_experiment(self):
        client=TestClient(app)
        inputs=plan()['inputs'];inputs['model_start_date']='2026-11-23'
        funding=FundingRequest(payment_inputs=inputs,opening_balance='240',college_annual_return_percent='0',
            support_annual_return_percent='0',annual_cost_percent='0',annual_cpi_change_percent='0',
            reserve_transfer_rule='protect_before_payments',include_horizon_day_payments=True,adaptive_policy=POLICY).model_dump(mode='json')
        body={'funding':funding,'portfolio':portfolio(),'use_historical_proxy_returns':False}
        imported=client.post('/api/v1/validate-analysis-plan',json=body)
        self.assertEqual(imported.status_code,200,imported.text)
        response=client.post('/api/v1/evaluate',json=body)
        self.assertEqual(response.status_code,200,response.text)
        r=response.json();self.assertEqual(len(r['stress_tests']),5);self.assertIn('adaptive',r['funding']['paths'])
        self.assertTrue(r['recommendation']['student_review_required'])
        future=body|{'portfolio':portfolio()|{'decision_date':'2026-10-23'},'funding':funding|{'payment_inputs':inputs|{'model_start_date':'2026-10-01'}}}
        r=client.post('/api/v1/evaluate',json=future).json();self.assertEqual(r['status'],'data_quarantine');self.assertFalse(r['portfolios'])
        invalid=body|{'owner_key':'not-a-real-user-key-value'}
        rejected=client.post('/api/v1/evaluate',json=invalid)
        self.assertEqual(rejected.status_code,422);self.assertNotIn('not-a-real-user-key-value',rejected.text)

    def test_negative_signal_and_rebalance_budget_bind(self):
        settings=portfolio();rows=settings['price_csv'].splitlines()
        # A deliberately declining VOO series makes the risk-off rule observable.
        for i in range(1,len(rows)):
            fields=rows[i].split(',');fields[1]=str(100*(0.99**i));rows[i]=','.join(fields)
        settings['price_csv']='\n'.join(rows)+'\n'
        settings['risk_off_equity_cap_percent']='20'
        r=analyze(settings,100000,0)
        self.assertEqual(r['data_card']['signal_regime'],'risk_off')
        self.assertLessEqual(sum(v for t,v in r['candidate']['weights'].items() if t!='SGOV'),20.00001)
        settings.update(initial_allocation=False,turnover_used_percent='33')
        r=analyze(settings,100000,0)
        self.assertEqual(r['candidate']['weights']['SGOV'],100)
        self.assertFalse(r['portfolios'][0]['hard_checks']['annual_turnover_budget'])

    def test_long_horizon_inflation_and_costs_preserve_minimum_budget(self):
        p=payment_schedule(PaymentRequest(model_start_date=date(2026,1,1),starting_ages=[0],degree_years=['0.5'],
            college_annual='100',adult_minimum='120',adult_target='1200'))
        r=project_funding(p,'50000','0','0','0.5','3','protect_before_payments',True,POLICY)
        a=r['paths']['adaptive']
        self.assertEqual(a['status'],'completed_horizon')
        self.assertTrue(a['ledger_reconciles'])
        self.assertIsNone(a['first_adult_minimum_breach_date'])
        self.assertEqual(len(a['adaptive_reviews']),961)
