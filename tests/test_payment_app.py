from datetime import date
from pathlib import Path
import unittest

from streamlit.testing.v1 import AppTest

ROOT = Path(__file__).resolve().parents[1]


class PaymentAppTests(unittest.TestCase):
    def test_individual_degree_inputs_and_dates(self):
        app = AppTest.from_file(str(ROOT / 'streamlit_app.py')).run(timeout=20)
        self.assertFalse(app.exception)
        self.assertEqual(app.number_input(key='college_annual').value, 50_000)
        self.assertTrue(app.toggle(key='adult_support_enabled').value)
        app.number_input(key='degree_years_1').set_value(3.5)
        app.number_input(key='degree_years_2').set_value(4.5)
        app.date_input(key='model_start').set_value(date(2026, 9, 1)).run()
        self.assertFalse(app.exception)
        table = app.dataframe[0].value
        self.assertEqual(list(table['Graduation / adult eligibility age']), [21.5, 22.5, 22, 22])
        self.assertEqual(table.iloc[0]['Graduation / adult eligibility date'], '2040-03-01')
        self.assertEqual(table.iloc[1]['Graduation / adult eligibility date'], '2043-03-01')
        self.assertEqual(table.iloc[0]['First adult payment date'], '2040-04-01')
        self.assertEqual(table.iloc[1]['First adult payment date'], '2043-04-01')

    def test_invalid_manual_quarter_year_is_rejected(self):
        app = AppTest.from_file(str(ROOT / 'streamlit_app.py')).run(timeout=20)
        app.number_input(key='degree_years_1').set_value(3.25).run()
        self.assertFalse(app.exception)
        self.assertTrue(any('half-year increments' in item.value for item in app.error))

    def test_college_only_mode_and_semester_proration(self):
        app = AppTest.from_file(str(ROOT / 'streamlit_app.py')).run(timeout=20)
        app.number_input(key='college_annual').set_value(15_000)
        app.number_input(key='degree_years_1').set_value(4.5)
        app.toggle(key='adult_support_enabled').set_value(False).run()
        self.assertFalse(app.exception)
        table = app.dataframe[0].value
        self.assertEqual(table.iloc[0]['Funded college semesters'], 9)
        self.assertFalse(table['Adult support included'].any())
        self.assertTrue(table['Adult eligibility month from model start'].isna().all())
        payments = app.table[0].value
        self.assertEqual(list(payments['Model-start dollars per child']), ['$15,000.00', '$7,500.00'])
        self.assertTrue(any('College-only scenario' in item.value for item in app.info))
        self.assertFalse(any(widget.key == 'adult_minimum' for widget in app.number_input))
        self.assertTrue((table['First adult payment date'] == 'Not included').all())
        semesters = app.dataframe[1].value
        first_child = semesters[semesters['Child'] == 'Child 1']
        self.assertEqual(len(first_child), 9)
        self.assertEqual(first_child.iloc[-1]['Month from model start'], 168)
        self.assertEqual(first_child.iloc[-1]['Amount in model-start dollars'], '7500.0')

    def test_adult_amounts_survive_toggle_and_invalid_goal_is_blocked(self):
        app = AppTest.from_file(str(ROOT / 'streamlit_app.py')).run(timeout=20)
        app.number_input(key='adult_minimum').set_value(25_000)
        app.number_input(key='adult_target').set_value(100_000).run()
        self.assertFalse(app.exception)
        self.assertTrue(any('Custom payment scenario' in item.value for item in app.info))
        app.toggle(key='adult_support_enabled').set_value(False).run()
        app.toggle(key='adult_support_enabled').set_value(True).run()
        self.assertFalse(app.exception)
        self.assertEqual(app.number_input(key='adult_minimum').value, 25_000)
        self.assertEqual(app.number_input(key='adult_target').value, 100_000)
        app.number_input(key='adult_target').set_value(10_000).run()
        self.assertFalse(app.exception)
        self.assertTrue(any('at least the minimum' in item.value for item in app.error))

    def test_college_protection_covers_the_entire_five_year_degree(self):
        app = AppTest.from_file(str(ROOT / 'streamlit_app.py')).run(timeout=20)
        app.number_input(key='degree_years_1').set_value(5).run()
        self.assertFalse(app.exception)
        reserve = next(item for item in app.metric if item.label ==
                       'College payments to protect (model-start dollars)')
        self.assertEqual(reserve.value, '$850,000.00')
        semesters = app.dataframe[1].value
        self.assertEqual(len(semesters[semesters['Child'] == 'Child 1']), 10)
