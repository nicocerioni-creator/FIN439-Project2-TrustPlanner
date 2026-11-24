"""Graduation-based eligibility and CPI scaling, separate from investment modelling."""
from calendar import monthrange
from datetime import date
from decimal import Decimal

BASE_ANNUAL_AMOUNTS = {'college': 50_000, 'adult_minimum': 20_000, 'adult_target': 200_000}
STARTING_AGES = (8, 6, 4, 2)


def annual_payment_amounts(college=50_000, adult_support_enabled=True,
                           adult_minimum=20_000, adult_target=200_000):
    """Validate model-start-dollar benefits; disabled adult support creates no obligation."""
    amounts = {'college': Decimal(str(college)),
               'adult_minimum': Decimal(str(adult_minimum)) if adult_support_enabled else Decimal(0),
               'adult_target': Decimal(str(adult_target)) if adult_support_enabled else Decimal(0)}
    if any(not amount.is_finite() or amount < 0 for amount in amounts.values()):
        raise ValueError('Annual payment amounts must be finite and nonnegative.')
    if amounts['college'] <= 0:
        raise ValueError('The annual college allowance must be greater than zero.')
    if amounts['adult_target'] < amounts['adult_minimum']:
        raise ValueError('The adult support goal must be at least the minimum.')
    return amounts


def graduation_timing(starting_age, degree_years, college_start_age=18):
    """Monthly classroom timeline; ages are measured exactly at scenario start."""
    age = Decimal(str(starting_age))
    years = Decimal(str(degree_years))
    if not age.is_finite() or not years.is_finite():
        raise ValueError('Ages and degree lengths must be finite.')
    if age < 0 or age > college_start_age:
        raise ValueError('This child timeline requires an age from zero through college entry age.')
    if years <= 0 or years * 2 != (years * 2).to_integral_value():
        raise ValueError('Degree length must be positive and in half-year increments.')
    college_month = (Decimal(str(college_start_age)) - age) * 12
    if college_month != college_month.to_integral_value():
        raise ValueError('Starting age must correspond to a whole number of months.')
    duration_months = int(years * 12)
    return {'college_start_month': int(college_month), 'degree_months': duration_months,
            'graduation_month': int(college_month) + duration_months,
            'adult_eligibility_month': int(college_month) + duration_months,
            'first_adult_payment_month': int(college_month) + duration_months + 1,
            'college_semester_payment_months': list(range(int(college_month),
                                                        int(college_month) + duration_months, 6)),
            'graduation_age': float(Decimal(str(college_start_age)) + years)}


def add_months(start, months):
    """Calendar-month offset, clamping the day only when the target month is shorter."""
    if not isinstance(months, int) or months < 0:
        raise ValueError('Month offset must be a nonnegative integer.')
    month_number = start.year * 12 + start.month - 1 + months
    year, month_index = divmod(month_number, 12)
    month = month_index + 1
    return date(year, month, min(start.day, monthrange(year, month)[1]))


def indexed_annual_amounts(base_cpi, payment_cpi, annual_amounts=None):
    """Scale all starting-dollar benefits using supplied CPI levels, without rounding.

    The caller must identify the CPI series, reference period, release availability,
    adjustment schedule and whether inputs are observations or scenario assumptions.
    This function does not fetch CPI, forecast it, or assert point-in-time eligibility.
    """
    base, latest = Decimal(str(base_cpi)), Decimal(str(payment_cpi))
    if not base.is_finite() or not latest.is_finite() or base <= 0 or latest <= 0:
        raise ValueError('CPI levels must be finite and positive.')
    amounts = annual_payment_amounts(
        college=annual_amounts['college'], adult_minimum=annual_amounts['adult_minimum'],
        adult_target=annual_amounts['adult_target'],
    ) if annual_amounts is not None else annual_payment_amounts()
    factor = latest / base
    return {key: amount * factor for key, amount in amounts.items()}
