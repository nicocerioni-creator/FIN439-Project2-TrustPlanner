"""Synthetic cash-flow correctness fixtures, not the locked changed-input experiment."""
from datetime import date
from decimal import Decimal
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from backend.main import app, PaymentRequest, payment_schedule
from backend.funding_projection import project_funding


def schedule(ages=(18,), degrees=('1',), adult=False, start='2026-01-01', **kwargs):
    return payment_schedule(PaymentRequest(model_start_date=date.fromisoformat(start),
        starting_ages=list(ages), degree_years=list(degrees), adult_support_enabled=adult, **kwargs))


def project(plan, opening='100000', **kwargs):
    inputs = dict(college_return='0', support_return='0', annual_cost='0', annual_cpi='0',
                  reserve_rule='protect_before_payments', include_horizon_day=True)
    return project_funding(plan, opening, **(inputs | kwargs))


class FundingTests(unittest.TestCase):
    def test_single_opening_balance_reserve_and_college_cashflows_reconcile(self):
        result = project(schedule())
        allocation = result['opening_allocation']
        self.assertEqual(allocation['college_assets'], '50000.00')
        self.assertEqual(allocation['support_assets'], '50000.00')
        path = result['paths']['college_only']
        self.assertEqual(path['total_college_payments'], '50000.00')
        self.assertEqual(path['ending_total'], '50000.00')
        self.assertTrue(path['ledger_reconciles'])
        for row in path['monthly_ledger']:
            self.assertEqual(Decimal(row['closing_college_assets']) + Decimal(row['closing_support_assets']), Decimal(row['closing_total']))
            self.assertEqual(Decimal(row['reconciliation_difference']), 0)
        august = next(r for r in path['monthly_ledger'] if r['month'] == '2026-08')
        self.assertEqual(august['college_paid'], '25000.00')

    def test_minimum_and_goal_are_independent_and_goal_failure_is_not_floor_failure(self):
        plan = schedule(ages=(79,), degrees=('1',), adult=True,
            first_college_years=[2000], adult_minimum='120', adult_target='1200')
        result = project(plan, '120')
        self.assertEqual(result['paths']['minimum']['ending_total'], '0.00')
        self.assertEqual(result['paths']['minimum']['status'], 'completed_horizon')
        goal = result['paths']['goal']
        self.assertEqual(goal['status'], 'stopped_at_payment_shortfall')
        self.assertEqual(goal['first_payment_shortfall']['date'], '2026-02-28')
        self.assertIsNone(goal['first_adult_minimum_breach_date'])
        self.assertEqual(goal['first_payment_shortfall']['adult_unpaid'], '80.00')

    def test_cpi_reset_topup_and_deflation_release_without_double_counting(self):
        plan = schedule(); plan['planning_horizon_months'] = 2
        inflation = str((Decimal('1.01') ** 12 - 1) * 100)
        result = project(plan, annual_cpi=inflation)
        rows = result['paths']['college_only']['monthly_ledger']
        feb = next(r for r in rows if r['month'] == '2026-02')
        self.assertEqual(feb['transfer_to_college'], '500.00')
        self.assertEqual(feb['closing_total'], '100000.00')
        falling = str((Decimal('0.99') ** 12 - 1) * 100)
        result = project(plan, annual_cpi=falling)
        feb = next(r for r in result['paths']['college_only']['monthly_ledger'] if r['month'] == '2026-02')
        self.assertEqual(feb['transfer_to_support'], '500.00')
        separate = project(plan, annual_cpi=inflation, reserve_rule='separate_accounts')
        self.assertIsNotNone(separate['paths']['college_only']['first_college_reserve_gap_date'])

    def test_unpaid_college_is_retained_at_stop_and_balances_do_not_go_negative(self):
        result = project(schedule(), '10000')
        p = result['paths']['college_only']
        self.assertEqual(p['last_date'], '2026-08-01')
        self.assertEqual(p['first_payment_shortfall']['college_unpaid'], '15000.00')
        self.assertEqual(p['ending_required_college_reserve'], '40000.00')
        self.assertEqual(p['ending_total'], '0.00')
        self.assertEqual(p['first_college_reserve_gap_date'], '2026-01-01')

    def test_college_first_on_shared_due_date_and_adult_eligibility(self):
        plan = schedule(ages=(18, 79), degrees=('1', '1'), adult=True,
            first_college_years=[None, 2000], graduation_dates=[None, date(2001, 5, 1)],
            adult_minimum='120', adult_target='1200')
        plan['planning_horizon_months'] = 8
        result = project(plan, '50300')
        aug = next(r for r in result['paths']['minimum']['monthly_ledger'] if r['month'] == '2026-08')
        self.assertEqual(aug['college_paid'], '25000.00')
        self.assertEqual(aug['adult_paid'], '10.00')
        self.assertEqual(result['first_adult_payment_dates_in_projection'], ['2026-01-01'])
        young = project(schedule(adult=True))
        self.assertEqual(young['first_adult_payment_dates_in_projection'], ['2027-06-30'])

    def test_explicit_terminal_choice_and_out_of_horizon_college_stays_reserved(self):
        plan = schedule(ages=(79,), start='2026-08-01', first_college_years=[2027])
        include = project(plan)
        exclude = project(plan, include_horizon_day=False)
        self.assertEqual(include['paths']['college_only']['total_college_payments'], '25000.00')
        self.assertEqual(exclude['paths']['college_only']['total_college_payments'], '0.00')
        self.assertEqual(exclude['paths']['college_only']['ending_required_college_reserve'], '50000.00')
        self.assertEqual(include['college_payments_beyond_horizon'], 1)
        self.assertEqual(exclude['college_payments_beyond_horizon'], 2)

    def test_return_cost_accrual_and_monthly_reconciliation(self):
        plan = schedule(ages=(79,), first_college_years=[2000])
        result = project(plan, '1000', support_return='12', annual_cost='1')
        p = result['paths']['college_only']
        self.assertAlmostEqual(float(p['ending_total']), 1108.8, delta=0.3)
        self.assertGreater(Decimal(p['total_costs']), 0)
        self.assertEqual(Decimal('1000') + Decimal(p['total_gross_growth']) - Decimal(p['total_costs']), Decimal(p['ending_total']))

    def test_api_requires_all_scenario_inputs_and_accepts_explicit_future_start(self):
        client = TestClient(app)
        body = dict(payment_inputs=schedule(ages=(79,), start='2027-05-31', first_college_years=[2000])['inputs'],
                    opening_balance='1000', college_annual_return_percent='0', support_annual_return_percent='0',
                    annual_cost_percent='0', annual_cpi_change_percent='0',
                    reserve_transfer_rule='protect_before_payments', include_horizon_day_payments=True)
        result = client.post('/api/v1/funding-projection', json=body)
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()['model_start_date'], '2027-05-31')
        self.assertIsNone(result.json()['portfolio_evaluation'])
        rejected = client.post('/api/v1/funding-projection', json=body | {'api_key': 'not-a-real-user-key-value'})
        self.assertEqual(rejected.status_code, 422)
        self.assertNotIn('not-a-real-user-key-value', rejected.text)
        for key in ('annual_cpi_change_percent',):
            invalid = dict(body); invalid.pop(key)
            self.assertEqual(client.post('/api/v1/funding-projection', json=invalid).status_code, 422)
        self.assertEqual(client.post('/api/v1/funding-projection',json=body|{'include_horizon_day_payments':False}).status_code,422)
        self.assertEqual(client.post('/api/v1/funding-projection',json=body|{'reserve_transfer_rule':'separate_accounts'}).status_code,422)
        for key, val in [('support_annual_return_percent','-100'), ('annual_cost_percent','100'), ('opening_balance','-1'), ('annual_cpi_change_percent','-50.01')]:
            self.assertEqual(client.post('/api/v1/funding-projection', json=body | {key: val}).status_code, 422)
        self.assertEqual(client.post('/api/v1/funding-projection', json=body | {'payment_inputs': schedule(ages=(), degrees=())['inputs']}).status_code, 422)
