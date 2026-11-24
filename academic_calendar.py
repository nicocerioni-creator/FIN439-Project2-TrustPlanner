"""Academic payment calendar. Original classroom timing helpers remain preserved."""
from calendar import monthrange
from datetime import date
from decimal import Decimal


def shift_months(anchor: date, months: int) -> date:
    year, month0 = divmod(anchor.year * 12 + anchor.month - 1 + months, 12)
    month = month0 + 1
    return date(year, month, min(anchor.day, monthrange(year, month)[1]))


def month_index(anchor: date, event: date) -> int:
    """Calendar-month index; exact days remain in the accompanying ISO date."""
    return (event.year - anchor.year) * 12 + event.month - anchor.month


def academic_timing(starting_age, degree_years, model_start=None,
                    first_college_year=None, graduation_date=None):
    years = Decimal(str(degree_years))
    if not years.is_finite() or years <= 0 or years * 2 != (years * 2).to_integral_value():
        raise ValueError('Degree length must be positive and in half-year increments.')
    count = int(years * 2)
    if model_start is None:
        if starting_age > 18 or first_college_year is not None or graduation_date is not None:
            raise ValueError('Select a model start date for children already over 18 or for calendar overrides.')
        return {
            'college_start_date': None, 'graduation_date': None, 'graduation_age': None,
            'first_adult_payment_date': None, 'college_start_month': None,
            'graduation_month': None, 'first_adult_payment_month': None,
            'first_college_year': None, 'total_degree_semesters': count, 'past_semesters': 0,
            'semesters': [{'semester': i + 1, 'term': 'fall' if i % 2 == 0 else 'spring',
                           'date': None, 'month': None, 'academic_year': None}
                          for i in range(count)],
        }

    birth = shift_months(model_start, -starting_age * 12)
    birthday18 = shift_months(model_start, (18 - starting_age) * 12)
    first_year = first_college_year
    if first_year is None:
        first_year = birthday18.year + (date(birthday18.year, 8, 1) < birthday18)
    entry = date(first_year, 8, 1)
    if entry < birth:
        raise ValueError('The first college payment cannot precede the birth date inferred from the starting age.')
    all_semesters = []
    for i in range(count):
        year = first_year + i // 2
        payment = date(year, 8, 1) if i % 2 == 0 else date(year + 1, 1, 1)
        all_semesters.append({'semester': i + 1, 'term': 'fall' if i % 2 == 0 else 'spring',
                              'date': payment.isoformat(), 'month': month_index(model_start, payment),
                              'academic_year': year})
    final_payment = date.fromisoformat(all_semesters[-1]['date'])
    next_payment = (date(final_payment.year + 1, 1, 1) if count % 2 else
                    date(final_payment.year, 8, 1))
    estimated_graduation = (date(final_payment.year, 12, 31) if count % 2 else
                            date(final_payment.year, 5, 31))
    graduation = graduation_date or estimated_graduation
    if not final_payment <= graduation < next_payment:
        raise ValueError('Graduation date must fall within the final funded semester, before the next January 1 or August 1. Adjust degree length to fund additional semesters.')
    first_adult = shift_months(graduation, 1)
    remaining = [s for s in all_semesters if date.fromisoformat(s['date']) >= model_start]
    approximate_age = (Decimal(starting_age) + Decimal((graduation - model_start).days) /
                       Decimal('365.2425')).quantize(Decimal('0.01'))
    return {
        'college_start_date': entry.isoformat(), 'graduation_date': graduation.isoformat(),
        'graduation_age': str(approximate_age), 'first_adult_payment_date': first_adult.isoformat(),
        'college_start_month': month_index(model_start, entry),
        'graduation_month': month_index(model_start, graduation),
        'first_adult_payment_month': month_index(model_start, first_adult),
        'first_college_year': first_year, 'total_degree_semesters': count,
        'past_semesters': count - len(remaining), 'semesters': remaining,
    }
