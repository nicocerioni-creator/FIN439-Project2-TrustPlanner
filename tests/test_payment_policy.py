from datetime import date
from decimal import Decimal
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from payment_policy import (add_months, annual_payment_amounts, graduation_timing,
                            indexed_annual_amounts)


class PaymentPolicyTests(unittest.TestCase):
    def test_early_late_and_half_year_eligibility(self):
        for degree, age, month in [(3, 21, 156), (3.5, 21.5, 162),
                                    (4, 22, 168), (4.5, 22.5, 174), (5, 23, 180)]:
            with self.subTest(degree=degree):
                result = graduation_timing(8, degree)
                self.assertEqual(result['graduation_age'], age)
                self.assertEqual(result['adult_eligibility_month'], month)
                self.assertEqual(result['adult_eligibility_month'], result['graduation_month'])

    def test_children_have_independent_timelines(self):
        first = graduation_timing(8, 3)
        second = graduation_timing(6, 4.5)
        self.assertEqual(second['adult_eligibility_month'] - first['adult_eligibility_month'], 42)

    def test_semester_starts_and_first_adult_payment_do_not_overlap_graduation(self):
        timing = graduation_timing(8, 4.5)
        self.assertEqual(timing['college_semester_payment_months'], list(range(120, 174, 6)))
        self.assertEqual(len(timing['college_semester_payment_months']), 9)
        self.assertNotIn(timing['graduation_month'], timing['college_semester_payment_months'])
        self.assertEqual(timing['first_adult_payment_month'], 175)

    def test_invalid_duration_does_not_silently_round(self):
        for value in (0, -1, 3.25, float('nan'), float('inf')):
            with self.assertRaises(ValueError):
                graduation_timing(8, value)

    def test_calendar_dates_preserve_half_year_and_leap_handling(self):
        self.assertEqual(add_months(date(2026, 1, 31), 1), date(2026, 2, 28))
        self.assertEqual(add_months(date(2024, 2, 29), 12), date(2025, 2, 28))
        self.assertEqual(add_months(date(2026, 9, 1), 42), date(2030, 3, 1))

    def test_cpi_scales_all_benefits_and_keeps_real_floor(self):
        result = indexed_annual_amounts(100, 110)
        self.assertEqual(result, {'college': Decimal(55000), 'adult_minimum': Decimal(22000),
                                  'adult_target': Decimal(220000)})
        self.assertEqual(result['adult_target'] / result['adult_minimum'], 10)

    def test_invalid_cpi_is_not_replaced_with_no_inflation(self):
        for value in (0, -1, float('nan'), float('inf')):
            with self.assertRaises(ValueError):
                indexed_annual_amounts(value, 100)

    def test_college_only_cpi_does_not_restore_disabled_adult_payments(self):
        amounts = annual_payment_amounts(college=15_000, adult_support_enabled=False)
        result = indexed_annual_amounts(100, 110, annual_amounts=amounts)
        self.assertEqual(result, {'college': Decimal(16500), 'adult_minimum': Decimal(0),
                                  'adult_target': Decimal(0)})
        self.assertEqual(result['college'] / 2, Decimal(8250))

    def test_custom_adult_floor_and_goal_are_validated(self):
        with self.assertRaisesRegex(ValueError, 'at least the minimum'):
            annual_payment_amounts(adult_minimum=30_000, adult_target=20_000)
        for invalid in (-1, float('nan'), float('inf')):
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                annual_payment_amounts(college=invalid)

    def test_deflation_reduces_all_benefits_without_imposing_nominal_floor(self):
        self.assertEqual(indexed_annual_amounts(100, 90), {
            'college': Decimal(45000), 'adult_minimum': Decimal(18000),
            'adult_target': Decimal(180000),
        })
