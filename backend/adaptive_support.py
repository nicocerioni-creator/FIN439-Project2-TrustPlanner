"""Editable deterministic liability-budget rule; not a lifetime funding guarantee."""
from decimal import Decimal, ROUND_HALF_UP


def liability_budget(events, adults, college, remaining, start, end, college_return,
                     support_return, costs, annual_cpi, cpi_monthly, minimum, goal, policy):
    q=lambda v:v.quantize(Decimal('0.01'),rounding=ROUND_HALF_UP)
    real_plan=Decimal(str(policy['real_discount_percent']))/100
    support_net=(1+support_return/100)*(1-costs/100)
    # Never credit more growth to the budget than this scenario itself assumes.
    nominal_discount_base=min((1+real_plan)*(1+annual_cpi/100),support_net)
    discounts=[nominal_discount_base**(-Decimal((d-start).days)/Decimal('365.2425')) for d in events]
    remaining=dict(remaining)
    ratio=Decimal(1); ratios=[]; costs_due=[]; minimum_due=[]; extra_due=[]
    c=sum((q(real)*n for real,n in remaining.items()),Decimal(0));previous=start
    # A small cent-rounding margin applies only when growth/indexation/costs vary.
    rounding_margin=Decimal('0.02') if any(v!=0 for v in (college_return,support_return,costs,annual_cpi)) else Decimal(0)
    for day in events:
        days=Decimal((day-previous).days)/Decimal('365.2425')
        c+=q(c*((1+college_return/100)**days-1))
        c-=q(c*(1-(1-costs/100)**days))
        if day>start and day.day==1:ratio*=cpi_monthly
        required=sum((q(real*ratio)*n for real,n in remaining.items()),Decimal(0))
        rebalance=day==start or day==end or day.day==1 or college.get(day) or adults.get(day)
        carry=max(Decimal(0),required-c) if rebalance else Decimal(0)
        if rebalance:c=required  # Ignore positive future reserve surplus as a conservative budget choice.
        for real in college.get(day,[]):
            remaining[real]-=1;c-=q(real*ratio)
        n=adults.get(day,0)
        floor=q(minimum*ratio/12)*n;target=q(goal*ratio/12)*n
        costs_due.append(carry+rounding_margin);minimum_due.append(floor);extra_due.append(target-floor)
        ratios.append(ratio);previous=day
    floors=[Decimal(0)]*(len(events)+1);extras=[Decimal(0)]*(len(events)+1);carry=[Decimal(0)]*(len(events)+1)
    for i in range(len(events)-1,-1,-1):
        floors[i]=floors[i+1]+minimum_due[i]*discounts[i]
        extras[i]=extras[i+1]+extra_due[i]*discounts[i]
        carry[i]=carry[i+1]+costs_due[i]*discounts[i]
    terminal=Decimal(str(policy['terminal_real_balance']))*ratios[-1]*discounts[-1]
    return floors,extras,carry,discounts,ratios,terminal


def review(available_real, event_index, budget, policy, previous_share, first=False):
    floors,increments,carry,discounts,ratios,terminal=budget;i=event_index
    unit=discounts[i]*ratios[i]
    # Today's reserve transfer is already reflected in available assets.
    minimum_pv=(floors[i]+carry[i+1]+terminal)/unit
    extra_pv=increments[i]/unit
    assets=available_real/(1+Decimal(str(policy['buffer_percent']))/100)
    desired=min(Decimal(1),max(Decimal(0),(assets-minimum_pv)/extra_pv)) if extra_pv else Decimal(1)
    if assets<minimum_pv:desired=Decimal(0)
    restoration=Decimal(str(policy['max_monthly_restoration_points']))/100
    share=desired if first or desired<=previous_share else min(desired,previous_share+restoration)
    return share,minimum_pv,max(Decimal(0),minimum_pv-assets)
