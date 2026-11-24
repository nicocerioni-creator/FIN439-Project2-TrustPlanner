"""API correctness fixtures; never the designated changed-input investment experiment."""
from pathlib import Path
from decimal import Decimal
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from fastapi.testclient import TestClient
from backend.main import app


class WebAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_reference_case_and_default_schedule(self):
        reference = self.client.get('/api/v1/reference-case')
        self.assertEqual(reference.status_code, 200)
        inputs = reference.json()['inputs']
        self.assertIsNone(inputs['model_start_date'])
        response = self.client.post('/api/v1/payment-schedule', json=inputs)
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['college_obligation_model_start_dollars'], '800000')
        self.assertEqual(result['total_funded_semesters'], 32)
        self.assertIsNone(result['beneficiaries'][0]['first_adult_payment_month'])
        self.assertFalse(result['calendar_timing_complete'])
        self.assertEqual(result['inputs']['family_mode'], 'demo')
        self.assertIsNone(result['funding_evaluation'])
        self.assertIsNone(result['portfolio_evaluation'])
        self.assertEqual(result['policy']['cpi_indexation_basis'], 'model_start')

    def test_five_year_and_half_year_degrees_use_full_semester_schedule(self):
        result = self.client.post('/api/v1/payment-schedule', json={
            'degree_years': ['5', '3.5', '4', '4'], 'model_start_date': '2026-09-01',
        }).json()
        self.assertEqual(Decimal(result['college_obligation_model_start_dollars']), Decimal(825000))
        first, second = result['beneficiaries'][:2]
        self.assertEqual(first['funded_semesters'], 10)
        self.assertEqual(first['first_adult_payment_date'], '2042-06-30')
        self.assertEqual(second['funded_semesters'], 7)
        self.assertEqual(second['graduation_date'], '2042-12-31')
        self.assertEqual(second['first_adult_payment_date'], '2043-01-31')
        first_payments = [p for p in result['college_semester_payments'] if p['child_id'] == 1]
        self.assertEqual(first_payments[-1]['date'], '2042-01-01')
        self.assertLess(first_payments[-1]['month'], first['graduation_month'])

    def test_college_only_has_no_active_adult_obligation(self):
        response = self.client.post('/api/v1/payment-schedule', json={
            'college_annual': '15000', 'adult_support_enabled': False,
            'adult_minimum': '20000', 'adult_target': '10000',
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['scenario'], 'college_only')
        self.assertEqual(result['college_obligation_model_start_dollars'], '240000')
        self.assertEqual(result['annual_amounts_model_start_dollars']['adult_minimum'], '0')
        self.assertEqual(result['annual_amounts_model_start_dollars']['adult_target'], '0')
        self.assertIsNone(result['policy']['adult_first_payment'])
        for child in result['beneficiaries']:
            self.assertIsNone(child['first_adult_payment_date'])
            self.assertIsNone(child['first_adult_payment_month'])

    def test_invalid_inputs_return_validation_errors(self):
        for invalid in [
            {'degree_years': [3.25, 4, 4, 4]},
            {'degree_years': [4, 4, 4]},
            {'college_annual': '0'},
            {'college_annual': 'NaN'},
            {'adult_minimum': '30000', 'adult_target': '20000'},
            {'model_start_date': '1899-01-01'},
            {'unapproved_return_forecast': 0.10},
        ]:
            with self.subTest(invalid=invalid):
                self.assertEqual(self.client.post('/api/v1/payment-schedule', json=invalid).status_code, 422)

    def test_evaluation_endpoint_cannot_fabricate_results(self):
        for missing in ({},None):
            response=self.client.post('/api/v1/evaluate',json=missing)
            self.assertEqual(response.status_code,422)
            self.assertNotIn('portfolios',response.json())

    def test_custom_families_have_variable_counts_and_matching_totals(self):
        for ages, degrees, total in [([10], ['5'], 250_000),
                                    ([12, 9, 6, 3, 0], ['4'] * 5, 1_000_000),
                                    ([], [], 0)]:
            with self.subTest(ages=ages):
                response = self.client.post('/api/v1/payment-schedule', json={
                    'starting_ages': ages, 'degree_years': degrees,
                })
                self.assertEqual(response.status_code, 200, response.text)
                result = response.json()
                self.assertEqual(len(result['beneficiaries']), len(ages))
                self.assertEqual(Decimal(result['college_obligation_model_start_dollars']), total)

    def test_demo_is_preserved_and_cannot_be_relabelled_with_custom_inputs(self):
        inputs = self.client.get('/api/v1/reference-case').json()['inputs']
        inputs['starting_ages'][0] = 9
        self.assertEqual(self.client.post('/api/v1/payment-schedule', json=inputs).status_code, 422)
        inputs['family_mode'] = 'custom'
        self.assertEqual(self.client.post('/api/v1/payment-schedule', json=inputs).status_code, 200)

    def test_academic_dates_and_remaining_obligation_for_existing_college_child(self):
        result = self.client.post('/api/v1/payment-schedule', json={
            'model_start_date': '2026-11-23', 'starting_ages': [20], 'degree_years': ['4'],
        }).json()
        self.assertEqual(result['beneficiaries'][0]['past_semesters_excluded'], 3)
        self.assertEqual(result['total_funded_semesters'], 5)
        self.assertEqual(result['college_semester_payments'][0]['date'], '2027-01-01')
        self.assertEqual(Decimal(result['college_obligation_model_start_dollars']), 125_000)
        self.assertTrue(all(p['date'][5:] in ('01-01', '08-01') for p in result['college_semester_payments']))

    def test_family_and_calendar_validation(self):
        for invalid in [
            {'starting_ages': [8], 'degree_years': ['4','4']},
            {'starting_ages': [-1], 'degree_years': ['4']},
            {'starting_ages': [8.5], 'degree_years': ['4']},
            {'starting_ages': [20], 'degree_years': ['4']},
            {'starting_ages': [8], 'degree_years': ['4'], 'first_college_years': []},
            {'starting_ages': [8], 'degree_years': ['4'], 'first_college_years': [2036]},
            {'starting_ages': [8], 'degree_years': ['4'], 'model_start_date': '2026-09-01',
             'graduation_dates': ['2042-05-31']},
        ]:
            with self.subTest(invalid=invalid):
                self.assertEqual(self.client.post('/api/v1/payment-schedule', json=invalid).status_code, 422)
