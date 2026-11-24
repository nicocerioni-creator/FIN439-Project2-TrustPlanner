"""Deterministic two-account cash flows with optional draft adaptive support."""
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP, localcontext
from academic_calendar import shift_months
from backend.adaptive_support import liability_budget, review

ZERO = Decimal(0)
CENT = Decimal('0.01')


def rounded(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def dollars(value):
    with localcontext() as ctx:
        ctx.prec=max(80,value.adjusted()+4) if value else 80
        return str(rounded(value))


def project_funding(schedule, opening_balance, college_return, support_return, annual_cost,
                    annual_cpi, reserve_rule, include_horizon_day, adaptive_policy=None,
                    opening_transaction_cost=0, college_shock=0, support_shock=0):
    with localcontext() as ctx:
        ctx.prec = 80
        return _project(schedule, Decimal(opening_balance), Decimal(college_return),
                        Decimal(support_return), Decimal(annual_cost), Decimal(annual_cpi),
                        reserve_rule, include_horizon_day, adaptive_policy, Decimal(opening_transaction_cost), Decimal(college_shock), Decimal(support_shock))


def _project(schedule, opening, college_return, support_return, annual_cost, annual_cpi,
             reserve_rule, include_horizon_day, adaptive_policy, transaction_cost, college_shock, support_shock):
    start_raw = schedule['inputs']['model_start_date']
    if not start_raw:
        raise ValueError('Choose a model start date and update the family payment plan first.')
    horizon_months = schedule['planning_horizon_months']
    if horizon_months is None:
        raise ValueError('Add at least one beneficiary to define the youngest-age-80 horizon.')
    if horizon_months <= 0:
        raise ValueError('The youngest beneficiary must be younger than 80 for a forward funding projection.')
    if reserve_rule not in ('protect_before_payments', 'separate_accounts'):
        raise ValueError('Choose a supported reserve transfer rule.')
    start = date.fromisoformat(start_raw)
    horizon = shift_months(start, horizon_months)
    end = horizon if include_horizon_day else horizon - timedelta(days=1)
    college = defaultdict(list)
    remaining = defaultdict(int)
    for p in schedule['college_semester_payments']:
        real = Decimal(p['amount_model_start_dollars'])
        remaining[real] += 1
        day = date.fromisoformat(p['date'])
        if day <= end:
            college[day].append(real)
    adults = defaultdict(int)
    first_adult_dates = []
    for child in schedule['beneficiaries']:
        if not child['adult_support_enabled']:
            continue
        anchor = date.fromisoformat(child['first_adult_payment_date'])
        offset = max(0, (start.year - anchor.year) * 12 + start.month - anchor.month)
        while shift_months(anchor, offset) < start:
            offset += 1
        first = shift_months(anchor, offset)
        if first <= end:
            first_adult_dates.append(first)
        while (day := shift_months(anchor, offset)) <= end:
            adults[day] += 1
            offset += 1
    resets = set()
    month = shift_months(start.replace(day=1), 1)
    while month <= end:
        resets.add(month)
        month = shift_months(month, 1)
    month_ends = {day - timedelta(days=1) for day in resets if day - timedelta(days=1) >= start}
    events = sorted({start, end, *resets, *month_ends, *college.keys(), *adults.keys()})
    cpi_monthly = (Decimal(1) + annual_cpi / 100) ** (Decimal(1) / 12)
    amounts = {k: Decimal(v) for k, v in schedule['annual_amounts_model_start_dollars'].items()}
    factors = {}

    def growth_factors(days):
        if days not in factors:
            fraction = Decimal(days) / Decimal('365.2425')
            factors[days] = tuple((Decimal(1) + r / 100) ** fraction for r in (college_return, support_return)) + ((Decimal(1) - annual_cost / 100) ** fraction,)
        return factors[days]

    def obligation(index):
        return sum((rounded(real * index) * count for real, count in remaining.items()), ZERO)

    if transaction_cost > opening:
        raise ValueError('Opening transaction costs cannot exceed opening assets.')
    policy = adaptive_policy or {'enabled': False}
    if policy.get('enabled') and reserve_rule != 'protect_before_payments':
        raise ValueError('Adaptive support requires the protect-before-payments reserve rule.')
    initial_required = obligation(Decimal(1))
    initial_college = min(opening-transaction_cost, initial_required)
    initial_support = opening-transaction_cost-initial_college
    budget = liability_budget(events, adults, college, remaining, start, end, college_return, support_return, annual_cost, annual_cpi, cpi_monthly, amounts['adult_minimum'], amounts['adult_target'], policy) if policy.get('enabled') else None
    paths = {}
    path_names = (('minimum', 'goal', 'adaptive') if policy.get('enabled') else ('minimum', 'goal')) if schedule['inputs']['adult_support_enabled'] else ('college_only',)
    for path_name in path_names:
        c, s, index = initial_college, initial_support, Decimal(1)
        opening_shock = rounded(c*college_shock/100)+rounded(s*support_shock/100)
        c += rounded(c*college_shock/100); s += rounded(s*support_shock/100)
        share = Decimal(0); reviews = []
        previous = start
        monthly = {}
        first_reserve_gap = start.isoformat() if c < initial_required else None
        first_missed = None
        first_floor_breach = None
        college_unpaid = ZERO
        totals = {name: ZERO for name in ('gross_growth', 'costs', 'college_due', 'college_paid', 'adult_due', 'adult_paid', 'adult_minimum_due', 'transfer_to_college', 'transfer_to_support')}
        max_reconciliation_error = ZERO
        stopped = False
        for event_index, day in enumerate(events):
            key = day.strftime('%Y-%m')
            if key not in monthly:
                monthly[key] = {
                    'month': key, 'month_index': (day.year - start.year) * 12 + day.month - start.month, 'period_start': previous.isoformat(), 'period_end': day.isoformat(),
                    'opening_total': opening if day == start else c+s,
                    **{name: ZERO for name in totals},
                    'college_payment_count': 0, 'adult_payment_count': 0,
                }
            row = monthly[key]
            if day == start:
                row['costs'] += transaction_cost
                row['gross_growth'] += opening_shock
            rc, rs, fee_factor = growth_factors((day - previous).days)
            gc, gs = rounded(c * (rc - 1)), rounded(s * (rs - 1))
            c += gc; s += gs
            fc, fs = rounded(c * (1 - fee_factor)), rounded(s * (1 - fee_factor))
            c -= fc; s -= fs
            row['gross_growth'] += gc + gs
            row['costs'] += fc + fs
            if day in resets:
                index *= cpi_monthly
            required = obligation(index)
            # The selected scenario rule is explicit; no asset eligibility is inferred.
            if reserve_rule == 'protect_before_payments' and (day == start or day == end or day in resets or college.get(day) or adults.get(day)):
                if c < required:
                    transfer = min(s, required - c)
                    s -= transfer; c += transfer
                    row['transfer_to_college'] += transfer
                elif c > required:
                    transfer = c - required
                    c -= transfer; s += transfer
                    row['transfer_to_support'] += transfer
            if c < required and first_reserve_gap is None:
                first_reserve_gap = day.isoformat()
            if path_name == 'adaptive' and (day == start or day in resets):
                available_real = max(ZERO, c+s-required)/index
                share, minimum_pv, gap = review(available_real, event_index, budget, policy, share, not reviews)
                reviews.append({'date': day.isoformat(), 'goal_gap_share': str(share),
                    'minimum_liability_pv_real': dollars(minimum_pv), 'minimum_budget_gap_real': dollars(gap),
                    'annual_support_per_child_model_start_dollars': dollars(amounts['adult_minimum']+share*(amounts['adult_target']-amounts['adult_minimum']))})
            college_due = sum((rounded(v * index) for v in college[day]), ZERO)
            college_paid = min(c, college_due)
            c -= college_paid
            # An unpaid due is retained in the final obligation; do not erase a missed bill.
            for real in college[day]:
                remaining[real] -= 1
            college_unpaid = college_due - college_paid
            required_after = obligation(index) + college_unpaid
            n = adults[day]
            minimum_due = rounded(amounts['adult_minimum'] * index / 12) * n
            adult_annual = amounts['adult_minimum'] if path_name == 'minimum' else (amounts['adult_minimum']+share*(amounts['adult_target']-amounts['adult_minimum']) if path_name == 'adaptive' else amounts['adult_target'])
            adult_due = rounded(adult_annual * index / 12) * n
            # Any unfilled college requirement is unavailable for adult distributions.
            available_support = min(s, max(ZERO, c + s - required_after))
            adult_paid = min(available_support, adult_due) if college_unpaid == 0 else ZERO
            s -= adult_paid
            row['college_due'] += college_due; row['college_paid'] += college_paid
            row['adult_due'] += adult_due; row['adult_paid'] += adult_paid
            row['adult_minimum_due'] += minimum_due
            row['college_payment_count'] += len(college[day]); row['adult_payment_count'] += n
            if adult_paid < minimum_due and first_floor_breach is None:
                first_floor_breach = day.isoformat()
            if college_paid < college_due or adult_paid < adult_due:
                first_missed = {
                    'date': day.isoformat(), 'college_unpaid': dollars(college_unpaid),
                    'adult_unpaid': dollars(adult_due - adult_paid),
                    'minimum_support_unpaid': dollars(max(ZERO, minimum_due - adult_paid)),
                }
                stopped = True
            row.update({
                'period_end': day.isoformat(), 'closing_college_assets': c,
                'closing_support_assets': s, 'closing_total': c + s,
                'closing_total_model_start_dollars': (c + s) / index,
                'cpi_ratio': str(index), 'required_college_reserve': required_after,
                'college_reserve_gap': max(ZERO, required_after - c),
            })
            previous = day
            if stopped:
                break
        # Restore obligations so both paths start from identical liabilities.
        remaining.clear()
        for p in schedule['college_semester_payments']:
            remaining[Decimal(p['amount_model_start_dollars'])] += 1
        serialized = []
        for row in monthly.values():
            expected = row['opening_total'] + row['gross_growth'] - row['costs'] - row['college_paid'] - row['adult_paid']
            delta = abs(row['closing_total'] - expected)
            max_reconciliation_error = max(max_reconciliation_error, delta)
            row['reconciliation_difference'] = row['closing_total'] - expected
            for name in totals:
                totals[name] += row[name]
            serialized.append({k: dollars(v) if isinstance(v, Decimal) else v for k, v in row.items()})
        overall_expected = opening + totals['gross_growth'] - totals['costs'] - totals['college_paid'] - totals['adult_paid']
        if c + s != overall_expected or max_reconciliation_error != 0:
            raise ArithmeticError('The cash-flow ledger did not reconcile.')
        yearly = {}
        for row in monthly.values():
            year = row['month'][:4]
            if year not in yearly:
                yearly[year] = {'year': year, 'period_start': row['period_start'], 'opening_total': row['opening_total'],
                                **{k: ZERO for k in totals}}
            summary = yearly[year]
            for k in totals:
                summary[k] += row[k]
            for k in ('period_end', 'closing_total', 'closing_total_model_start_dollars', 'closing_college_assets',
                      'closing_support_assets', 'required_college_reserve', 'college_reserve_gap'):
                summary[k] = row[k]
        annual_summary = [{k: dollars(v) if isinstance(v, Decimal) else v for k, v in row.items()} for row in yearly.values()]
        paths[path_name] = {
            'path': path_name, 'status': 'stopped_at_payment_shortfall' if stopped else 'completed_horizon',
            'last_date': previous.isoformat(), 'ending_total': dollars(c + s),
            'ending_total_model_start_dollars': dollars((c + s) / index),
            'ending_college_assets': dollars(c), 'ending_support_assets': dollars(s),
            'first_college_reserve_gap_date': first_reserve_gap,
            'first_payment_shortfall': first_missed, 'first_adult_minimum_breach_date': first_floor_breach,
            'total_college_payments': dollars(totals['college_paid']),
            'total_adult_payments': dollars(totals['adult_paid']), 'total_costs': dollars(totals['costs']),
            'total_gross_growth': dollars(totals['gross_growth']),
            'ending_required_college_reserve': serialized[-1]['required_college_reserve'],
            'adaptive_reviews': reviews, 'ledger_reconciles': True, 'monthly_ledger': serialized, 'annual_summary': annual_summary,
        }
    return {
        'status': 'deterministic_funding_scenarios_only',
        'model_start_date': start.isoformat(), 'horizon_date': horizon.isoformat(),
        'last_included_date': end.isoformat(), 'horizon_months': horizon_months,
        'opening_allocation': {
            'total_trust_assets': dollars(opening), 'opening_transaction_cost': dollars(transaction_cost), 'net_opening_assets': dollars(opening-transaction_cost), 'required_college_reserve': dollars(initial_required),
            'college_assets': dollars(initial_college), 'support_assets': dollars(initial_support),
            'college_reserve_gap': dollars(max(ZERO, initial_required - initial_college)),
            'total_is_college_plus_support': initial_college + initial_support + transaction_cost == opening,
        },
        'college_payments_beyond_horizon': sum(1 for p in schedule['college_semester_payments'] if date.fromisoformat(p['date']) > end),
        'first_adult_payment_dates_in_projection': sorted(set(d.isoformat() for d in first_adult_dates)),
        'paths': paths,
        'conventions': {
            'opening_allocation': 'Allocate up to the full remaining college obligation from the one opening balance; the remainder is support capital.',
            'reserve_rule': reserve_rule,
            'return_and_cost_accrual': 'Effective annual gross returns and asset-based costs accrued between dated events using actual days / 365.2425, then rounded to cents. Both accounts share the entered annual cost rate.',
            'cpi_scenario': 'Ratio starts at 1; each first-of-month reset after model start compounds one monthly step of the explicit annual CPI assumption. No published future data or reconstructed historical path is used.',
            'payment_order': 'Accrue growth/costs, reset CPI, apply selected reserve transfers, pay college, then pay adult support from unreserved support assets.',
            'rounding': 'Round per-child monthly benefits, semester payments, event growth and costs to cents. Twelve rounded instalments may differ from the annual amount by a few cents.',
            'adult_recurrence': 'Monthly from the first payment date, anchored to its original day, clamped in shorter months; payments before model start are excluded.',
            'terminal_payments': 'Include payments on the youngest-80 birthday.' if include_horizon_day else 'Exclude payments on the youngest-80 birthday.',
            'adaptive_policy': 'Draft monthly common-share rule: reserve college first; budget discounted future minimums for all beneficiaries with the nominal planning discount capped at assumed net support growth, conservative reserve-carry drag and a cent-rounding margin and optional terminal support balance; buffer; then allocate remaining budget to a common fraction of minimum-to-goal increments. Cut immediately when required; cap monthly restoration as selected. Always pay at least the floor if cash permits; flag actual inability instead of silently waiving it. Risky returns and present-value estimates do not guarantee funding.',
            'shortfall': 'Stop each path at its first unpaid scheduled distribution. Retain unpaid college due at stop. A goal-path shortfall does not by itself prove the adult minimum is unaffordable. Adaptive support is used only when explicitly enabled; partial adult payments are aggregated, not allocated among individual children.',
        },
        'warnings': [
            'These are explicit constant-assumption scenarios, not forecasts, probabilities, market backtests or portfolio recommendations.',
            'The two accounts are accounting partitions, not verified eligible investments, inflation hedges or liquidity guarantees.',
            'Taxes, contributions and changing market return paths are not modelled. Any adaptive rule is an editable draft scenario policy; initial shocks/costs are explicit inputs.',
            'The age-80 cutoff does not terminate lifetime support or prove solvency beyond the horizon. Out-of-horizon college obligations remain reserved.',
            'Payments missed before model start are not reconstructed. A stopped path does not assume later arrears treatment.',
        ],
        'portfolio_evaluation': None, 'mandate_compliance': None,
    }
