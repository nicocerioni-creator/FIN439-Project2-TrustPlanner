"""Reserve/CPI correctness fixtures, not the student's locked investment experiment."""
from datetime import date
from decimal import Decimal
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from fastapi.testclient import TestClient
from backend.main import app, PaymentRequest, payment_schedule
from backend.college_reserve import reserve_valuation
from backend.cpi_data import parse_snapshot, CPIDataError


def snapshot(day):
    return {'index_value': '100' if day == date(2026, 1, 15) else '110',
            'reference_date': day.isoformat(), 'source_url': 'https://alfred.stlouisfed.org/'}


class ReserveTests(unittest.TestCase):
    def setUp(self):
        self.schedule = payment_schedule(PaymentRequest(model_start_date=date(2026, 1, 15)))

    def test_full_real_obligation_and_cpi_scaled_reserve_shortfall(self):
        r = reserve_valuation(self.schedule, date(2026, 2, 20), Decimal(800000), lookup=snapshot)
        self.assertEqual(r['required_reserve_valuation_dollars'], '880000.00')
        self.assertEqual(r['remaining_obligation_model_start_dollars'], '800000.00')
        self.assertEqual(r['reserve_shortfall_valuation_dollars'], '80000.00')
        self.assertEqual(r['asset_comparison'], 'shortfall')
        self.assertEqual(r['indexed_annual_amounts_valuation_dollars']['adult_minimum'], '22000.00')
        self.assertIsNone(r['scenario_nominal_college_total'])

    def test_baseline_applies_until_next_first_day_and_deflation_is_proportional(self):
        r = reserve_valuation(self.schedule, date(2026, 1, 31), lookup=snapshot)
        self.assertEqual(r['effective_cpi_reference_date'], '2026-01-15')
        self.assertEqual(r['required_reserve_valuation_dollars'], '800000.00')
        def falling(day): return {'index_value': '100' if day == date(2026, 1, 15) else '90'}
        r = reserve_valuation(self.schedule, date(2026, 2, 1), lookup=falling)
        self.assertEqual(r['required_reserve_valuation_dollars'], '720000.00')
        self.assertEqual(r['indexed_annual_amounts_valuation_dollars']['adult_target'], '180000.00')

    def test_valuation_includes_due_today_and_excludes_earlier_semesters(self):
        schedule = payment_schedule(PaymentRequest(model_start_date=date(2026, 1, 15),
            starting_ages=[18], degree_years=['1']))
        r = reserve_valuation(schedule, date(2026, 8, 1), lookup=snapshot)
        self.assertEqual(r['remaining_semesters'], 2)
        r = reserve_valuation(schedule, date(2026, 8, 2), lookup=snapshot)
        self.assertEqual(r['remaining_semesters'], 1)

    def test_optional_scenario_totals_reconcile_and_disabled_adult_stays_zero(self):
        self.schedule['annual_amounts_model_start_dollars']['adult_minimum'] = '0'
        self.schedule['annual_amounts_model_start_dollars']['adult_target'] = '0'
        r = reserve_valuation(self.schedule, date(2026, 2, 1), annual_inflation=Decimal('-2'), lookup=snapshot)
        self.assertEqual(sum(Decimal(p['scenario_nominal_amount']) for p in r['college_payments']), Decimal(r['scenario_nominal_college_total']))
        self.assertEqual(r['indexed_annual_amounts_valuation_dollars']['adult_target'], '0.00')
        self.assertLess(Decimal(r['scenario_nominal_college_total']), Decimal(r['required_reserve_valuation_dollars']))
        long_schedule = payment_schedule(PaymentRequest(model_start_date=date(2026, 1, 15),
            starting_ages=[8], degree_years=['100']))
        extreme = reserve_valuation(long_schedule, date(2026, 2, 1), annual_inflation=Decimal('100'), lookup=snapshot)
        self.assertEqual(extreme['remaining_semesters'], 200)
        self.assertTrue(Decimal(extreme['scenario_nominal_college_total']).is_finite())

    def test_cpi_vintage_validation_missing_values_and_no_current_fallback(self):
        raw=b'observation_date,CPIAUCNS_20261031\n2026-08-01,100\n2026-09-01,.\n'
        r = parse_snapshot(raw, date(2026, 11, 1), 'https://alfred.stlouisfed.org/')
        self.assertEqual(r['index_value'], '100')
        self.assertEqual(r['missing_observation_months'], ['2026-09-01'])
        for invalid in [raw.replace(b'CPIAUCNS', b'CPIAUCSL'), raw.replace(b'20261031', b'20261102'),
                        raw.replace(b',100', b',NaN'), raw.replace(b',100', b',-1'),
                        raw+b'2026-08-01,101\n']:
            with self.subTest(invalid=invalid):
                with self.assertRaises(CPIDataError): parse_snapshot(invalid, date(2026, 11, 1), 'public')

    def test_api_uses_approved_method_and_hides_rejected_credential_values(self):
        client = TestClient(app)
        inputs = self.schedule['inputs']
        with patch('backend.college_reserve.cpi_snapshot', side_effect=snapshot):
            r = client.post('/api/v1/college-reserve', json={'payment_inputs': inputs,
                'valuation_date': '2026-02-01', 'reserve_assets': '900000'})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.headers['cache-control'], 'no-store')
        self.assertEqual(r.json()['reserve_surplus_valuation_dollars'], '20000.00')
        sentinel = 'private-value-for-fixture-only'
        r = client.post('/api/v1/payment-schedule', json={'api_key': sentinel})
        self.assertEqual(r.status_code, 422)
        self.assertNotIn(sentinel, r.text)
        self.assertNotIn('input', r.json()['detail'][0])
        for bad in [{'valuation_date': '2100-01-01'}, {'reserve_assets': '-1'},
                    {'future_cpi_annual_percent': '-100'}]:
            body = {'payment_inputs': inputs, 'valuation_date': '2026-02-01', **bad}
            self.assertEqual(client.post('/api/v1/college-reserve', json=body).status_code, 422)

    def test_free_source_failure_does_not_generate_reserve_or_fallback_result(self):
        client = TestClient(app)
        with patch('backend.college_reserve.cpi_snapshot', side_effect=CPIDataError('Free data unavailable.')):
            r = client.post('/api/v1/college-reserve', json={'payment_inputs': self.schedule['inputs'], 'valuation_date': '2026-02-01'})
        self.assertEqual(r.status_code, 503)
        self.assertNotIn('required_reserve_valuation_dollars', r.json())

    def test_future_model_start_reports_empty_range_before_any_cpi_request(self):
        client = TestClient(app)
        inputs = {**self.schedule['inputs'], 'model_start_date': '2027-05-31'}
        with patch('backend.main.eastern_today', return_value=date(2026, 11, 23)), patch('backend.college_reserve.cpi_snapshot') as lookup:
            for valuation in ('2027-05-31', '2026-11-23'):
                response = client.post('/api/v1/college-reserve', json={
                    'payment_inputs': inputs, 'valuation_date': valuation})
                self.assertEqual(response.status_code, 422)
                self.assertIn('future model start', response.json()['detail'])
                self.assertIn('2027-05-31', response.json()['detail'])
            lookup.assert_not_called()
            response = client.post('/api/v1/college-reserve', json={
                'payment_inputs': self.schedule['inputs'], 'valuation_date': '2026-11-24'})
            self.assertEqual(response.status_code, 422)
            self.assertIn('2026-11-23', response.json()['detail'])
