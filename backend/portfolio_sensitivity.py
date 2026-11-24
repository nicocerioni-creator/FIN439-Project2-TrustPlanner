"""One-at-a-time research checks; no relaxation of baseline mandate limits."""
from backend.portfolio_engine import analyze,TICKERS


def sensitivities(settings,opening,required,opening_cost,stress,baseline):
    cases=[
        ('Shorter estimation window',{'estimation_months':int(stress.get('short_window_months',12))}),
        ('Longer estimation window',{'estimation_months':int(stress.get('long_window_months',60))}),
        ('Higher opening trading costs',{'transaction_cost_bps':str(min(1000,float(settings['transaction_cost_bps'])+float(stress.get('trade_cost_increase_bps',25))))}),
        ('Tighter volatility constraint',{'volatility_limit_percent':str(min(float(settings['volatility_limit_percent']),float(stress.get('tighter_volatility_percent',10))))}),
        ('Tighter whole-trust single-fund cap',{'max_fund_weight_percent':str(min(float(settings['max_fund_weight_percent']),float(stress.get('tighter_fund_cap_percent',60))))}),
    ]
    results=[]
    for name,changes in cases:
        try:
            value=analyze({**settings,**changes},opening,required,opening_cost);p=value['candidate']
            results.append({'name':name,'changed_parameters':changes,'status':value['status'],
                'data_card':value['data_card'],'candidate':p,
                'maximum_weight_change_points':max(abs(p['weights'][t]-baseline['weights'][t]) for t in TICKERS) if p and baseline else None,
                'reason':None if p else ' '.join(value['data_card'].get('reasons',[])) or 'No grid candidate passes the stressed constraints.'})
        except (ValueError,OverflowError) as exc:
            results.append({'name':name,'changed_parameters':changes,'status':'invalid_scenario','candidate':None,'maximum_weight_change_points':None,'reason':str(exc)})
    return results
