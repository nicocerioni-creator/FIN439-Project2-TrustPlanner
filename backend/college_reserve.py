"""Undiscounted real college reserve; no return forecast or adult affordability rule."""
from datetime import date
from decimal import Decimal, ROUND_HALF_UP, localcontext
from backend.cpi_data import cpi_snapshot


def money(value):
    return str(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def reserve_valuation(schedule, valuation_date, reserve_assets=None, annual_inflation=None, lookup=None):
    # Covers the technical request bounds even for extreme CPI stress assumptions.
    with localcontext() as context:
        context.prec = 256
        return _reserve_valuation(schedule, valuation_date, reserve_assets, annual_inflation, lookup)


def _reserve_valuation(schedule, valuation_date, reserve_assets=None, annual_inflation=None, lookup=None):
    lookup = lookup or cpi_snapshot
    start_raw = schedule['inputs']['model_start_date']
    if not start_raw:
        raise ValueError('Select a model start date and update the payment plan before valuing the reserve.')
    start = date.fromisoformat(start_raw)
    if valuation_date < start:
        raise ValueError('Reserve valuation date cannot precede model start.')
    # Baseline applies during the start month. Subsequent resets happen on day 1.
    update_date = max(start, valuation_date.replace(day=1))
    baseline = lookup(start)
    current = baseline if update_date == start else lookup(update_date)
    factor = Decimal(current['index_value']) / Decimal(baseline['index_value'])
    remaining = [p for p in schedule['college_semester_payments'] if date.fromisoformat(p['date']) >= valuation_date]
    real_total = sum((Decimal(p['amount_model_start_dollars']) for p in remaining), Decimal(0))
    required = sum(((Decimal(p['amount_model_start_dollars']) * factor).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) for p in remaining), Decimal(0))
    assets = Decimal(reserve_assets) if reserve_assets is not None else None
    inflation = Decimal(annual_inflation) if annual_inflation is not None else None
    projected, projection_total = [], Decimal(0)
    horizon_months = schedule['planning_horizon_months']
    outside_horizon = 0
    for p in remaining:
        payment_date = date.fromisoformat(p['date'])
        reset = max(start, payment_date.replace(day=1))
        steps = max(0, (reset.year - update_date.year) * 12 + reset.month - update_date.month)
        amount = None
        if inflation is not None:
            scenario_factor = (Decimal(1) + inflation / 100) ** (Decimal(steps) / 12)
            amount = Decimal(p['amount_model_start_dollars']) * factor * scenario_factor
            amount = amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            projection_total += amount
        outside = horizon_months is not None and p['month'] > horizon_months
        outside_horizon += int(outside)
        projected.append({**p, 'amount_at_valuation_purchasing_power': money(Decimal(p['amount_model_start_dollars']) * factor),
                          'scenario_nominal_amount': money(amount) if amount is not None else None,
                          'scenario_monthly_updates_after_valuation': steps,
                          'outside_planning_horizon': outside})
    surplus = assets - required if assets is not None else None
    return {
        'status': 'college_reserve_valuation_only',
        'rounding_convention': 'CPI-adjust each semester allowance, round to cents, then sum; annual indexed amounts are rounded separately.',
        'valuation_method': 'full_undiscounted_remaining_allowance_cpi_adjusted',
        'valuation_date': valuation_date.isoformat(), 'effective_cpi_reference_date': update_date.isoformat(),
        'payment_inputs': schedule['inputs'],
        'cpi': {'baseline': baseline, 'effective': current, 'ratio': str(factor)},
        'remaining_semesters': len(remaining),
        'remaining_obligation_model_start_dollars': money(real_total),
        'required_reserve_valuation_dollars': money(required),
        'designated_reserve_assets_valuation_dollars': money(assets) if assets is not None else None,
        'reserve_surplus_valuation_dollars': money(max(Decimal(0), surplus)) if surplus is not None else None,
        'reserve_shortfall_valuation_dollars': money(max(Decimal(0), -surplus)) if surplus is not None else None,
        'asset_comparison': 'not_entered' if assets is None else ('shortfall' if surplus < 0 else 'meets_accounting_reserve'),
        'indexed_annual_amounts_valuation_dollars': {k: money(Decimal(v) * factor) for k, v in schedule['annual_amounts_model_start_dollars'].items()},
        'future_cpi_annual_percent_assumption': str(inflation) if inflation is not None else None,
        'scenario_nominal_college_total': money(projection_total) if inflation is not None else None,
        'scenario_convention': 'User-entered effective annual CPI change, compounded at monthly first-day updates after the effective valuation reference; not published future data.',
        'college_payments': projected, 'semesters_beyond_planning_horizon': outside_horizon,
        'scope': 'Accounting reserve only. Entered assets are user-reported, not verified for eligibility or liquidity. No inflation hedge, lifetime solvency, adult affordability or mandate compliance is established.',
    }
