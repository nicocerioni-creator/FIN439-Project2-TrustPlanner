from datetime import date
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from academic_calendar import academic_timing


class AcademicCalendarTests(unittest.TestCase):
    def test_fall_entry_after_eighteenth_birthday(self):
        early = academic_timing(8, 4, date(2026, 7, 1))
        late = academic_timing(8, 4, date(2026, 9, 1))
        self.assertEqual(early['college_start_date'], '2036-08-01')
        self.assertEqual(late['college_start_date'], '2037-08-01')
        self.assertEqual(late['graduation_date'], '2041-05-31')
        self.assertEqual(late['first_adult_payment_date'], '2041-06-30')

    def test_fall_and_spring_are_not_six_month_offsets(self):
        timing = academic_timing(8, 4, date(2026, 9, 1))
        self.assertEqual(timing['semesters'][0]['date'], '2037-08-01')
        self.assertEqual(timing['semesters'][1]['date'], '2038-01-01')
        self.assertEqual(timing['semesters'][2]['date'], '2038-08-01')
        self.assertEqual(len(timing['semesters']), 8)

    def test_half_year_finishes_fall_and_has_one_semester_allowance(self):
        timing = academic_timing(8, 4.5, date(2026, 9, 1))
        self.assertEqual(len(timing['semesters']), 9)
        self.assertEqual(timing['semesters'][-1]['date'], '2041-08-01')
        self.assertEqual(timing['graduation_date'], '2041-12-31')
        self.assertEqual(timing['first_adult_payment_date'], '2042-01-31')

    def test_explicit_entry_and_graduation_overrides(self):
        timing = academic_timing(8, 4, date(2026, 9, 1), 2036, date(2040, 6, 15))
        self.assertEqual(timing['college_start_date'], '2036-08-01')
        self.assertEqual(timing['graduation_date'], '2040-06-15')
        self.assertEqual(timing['first_adult_payment_date'], '2040-07-15')
        with self.assertRaisesRegex(ValueError, 'final funded semester'):
            academic_timing(8, 4, date(2026, 9, 1), 2036, date(2040, 8, 1))

    def test_due_today_included_past_semesters_excluded(self):
        timing = academic_timing(20, 4, date(2026, 1, 1), 2024)
        self.assertEqual(timing['semesters'][0]['date'], '2026-01-01')
        self.assertEqual(timing['past_semesters'], 3)
        self.assertEqual(len(timing['semesters']), 5)

    def test_missing_start_date_does_not_invent_calendar_dates(self):
        timing = academic_timing(8, 4)
        self.assertIsNone(timing['college_start_date'])
        self.assertIsNone(timing['graduation_date'])
        self.assertEqual(len(timing['semesters']), 8)
        self.assertTrue(all(s['date'] is None and s['month'] is None for s in timing['semesters']))
