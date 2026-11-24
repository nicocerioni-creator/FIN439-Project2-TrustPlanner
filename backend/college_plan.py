"""Date-grouped nominal college allowances using the funding scenario's CPI convention."""
from collections import defaultdict
from datetime import date
from decimal import Decimal, ROUND_HALF_UP, localcontext


def college_payment_plan(schedule, annual_inflation):
    start_raw=schedule['inputs']['model_start_date']
    if not start_raw:raise ValueError('Choose a model start date and update the family first.')
    start=date.fromisoformat(start_raw)
    with localcontext() as context:
        context.prec=80
        monthly=(1+Decimal(annual_inflation)/100)**(Decimal(1)/12)
        groups=defaultdict(list);totals=defaultdict(lambda:Decimal(0))
        for p in schedule['college_semester_payments']:
            day=date.fromisoformat(p['date'])
            steps=(day.year-start.year)*12+day.month-start.month
            amount=(Decimal(p['amount_model_start_dollars'])*monthly**steps).quantize(Decimal('.01'),rounding=ROUND_HALF_UP)
            groups[p['date']].append({'child_id':p['child_id'],'semester':p['semester'],'term':p['term'],'amount_nominal_dollars':str(amount)})
            totals[p['child_id']]+=amount
        dates=[{'date':day,'total_nominal_dollars':str(sum((Decimal(p['amount_nominal_dollars']) for p in payments),Decimal(0))),
                'payments':sorted(payments,key=lambda p:p['child_id'])} for day,payments in sorted(groups.items())]
        return {'model_start_date':start_raw,'annual_inflation_percent':str(annual_inflation),
            'total_nominal_dollars':str(sum(totals.values(),Decimal(0))),
            'children':[{'child_id':c['child_id'],'total_nominal_dollars':str(totals[c['child_id']])} for c in schedule['beneficiaries']],
            'payment_dates':dates,'convention':'Nominal scheduled allowances, not proof of payment or funding. Monthly first-day inflation steps after model start, per-child semester amounts rounded to cents, including obligations beyond the funding horizon.'}
