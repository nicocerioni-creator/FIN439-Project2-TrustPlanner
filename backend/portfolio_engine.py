"""Transparent research comparisons on an admitted frozen monthly price panel."""
import csv
from datetime import date
from io import StringIO
import hashlib
import json
import math
from pathlib import Path
import statistics

DATA = Path(__file__).resolve().parents[1] / 'data/market'
TICKERS = ('VOO','QQQ','SCHD','PAVE','XLE','XLV','SGOV')
NAMES = dict(zip(TICKERS, ('Vanguard S&P 500 ETF','Invesco QQQ','Schwab U.S. Dividend Equity ETF',
    'Global X U.S. Infrastructure Development ETF','Energy Select Sector SPDR ETF',
    'Health Care Select Sector SPDR ETF','iShares 0–3 Month Treasury Bond ETF')))

# Research presets apply to the assets LEFT AFTER the college earmark.
STYLES = {
    'lower_risk': ('Lower risk', .35, 'Lowest historical volatility; long-term equities capped at35%.'),
    'balanced_growth': ('Balanced growth', .70, 'Highest historical Sharpe proxy; long-term equities capped at70%.'),
    'aggressive_growth': ('Aggressive growth', 1., 'Highest historical arithmetic return within all limits.'),
    'maximum_sharpe': ('Maximum historical Sharpe', 1., 'Highest historical excess return / total portfolio volatility, using SGOV as the cash-return proxy.'),
    'target_return': ('Target return (legacy)', 1., 'Lowest historical volatility meeting the target, otherwise highest feasible return.'),
    'custom': ('Custom proposed weights', 1., 'User-entered target weights, subject to all hard checks.'),
}


def panel_info():
    meta=json.loads((DATA/'manifest.json').read_text())
    return {'tickers':TICKERS,'names':NAMES,'manifest':meta}


def read_panel(text):
    rows=list(csv.reader(StringIO(text.lstrip('\ufeff'))))
    if not rows or rows[0] != ['Date',*TICKERS] or len(rows)<14 or len(rows)>1201:
        raise ValueError('Use Date,VOO,QQQ,SCHD,PAVE,XLE,XLV,SGOV and 13–1200 consecutive monthly adjusted-price rows.')
    days=[];prices=[]
    for row in rows[1:]:
        if len(row)!=8:raise ValueError('Every monthly price row needs all seven assets.')
        try:d=date.fromisoformat(row[0]); values=[float(v) for v in row[1:]]
        except (ValueError,OverflowError) as exc:raise ValueError('Use ISO dates and finite positive monthly prices.') from exc
        if any(not math.isfinite(v) or v<=0 for v in values):raise ValueError('Monthly prices must be finite and positive.')
        if days and (d<=days[-1] or (d.year-days[-1].year)*12+d.month-days[-1].month!=1):
            raise ValueError('Use exactly one complete row per consecutive month, oldest first. No missing-price filling.')
        days.append(d);prices.append(values)
    return days,prices


def prepare_data(settings):
    meta=json.loads((DATA/'manifest.json').read_text())
    supplied=settings.get('price_csv')
    raw=supplied.encode() if supplied else (DATA/'prices.csv').read_bytes()
    digest=hashlib.sha256(raw).hexdigest()
    if not supplied and digest!=meta['sha256']:raise ValueError('The bundled market snapshot hash does not match its manifest.')
    days,prices=read_panel(raw.decode('utf-8-sig'))
    available=settings.get('source_available_on') if supplied else date.fromisoformat(meta['snapshot_available_on'])
    if isinstance(available,str):available=date.fromisoformat(available)
    decision=settings['decision_date']
    if isinstance(decision,str):decision=date.fromisoformat(decision)
    card={'source':'User-uploaded adjusted-price panel' if supplied else 'Frozen Lab 15 vendor adjusted-price panel',
          'sha256':digest,'snapshot_available_on':available.isoformat() if available else None,
          'first_price_date':days[0].isoformat(),'last_price_date':days[-1].isoformat(),
          'decision_date':decision.isoformat(),'units':'USD adjusted price; derived returns are decimals/percent, not CPI.',
          'rows':len(days),'source_provenance':'User asserted; not independently verified' if supplied else meta['sources'],
          'availability_rule':'Entire frozen snapshot must predate decision day; closing observations must also predate it. No backdated use of later adjusted history.',
          'revision_limit':'This is one forward-decision snapshot, not evidence of vintage-safe historical backtesting.',
          'signal':'12-month VOO adjusted-price total-return proxy; if nonpositive, restrict equity weight to the entered risk-off cap. An unvalidated research hypothesis.',
          'data_age_days':(decision-days[-1]).days}
    reasons=[]
    if settings.get('model_start_date') and decision>date.fromisoformat(settings['model_start_date']):reasons.append('Decision date follows model start; the snapshot cannot define a point-in-time allocation at that earlier start.')
    if available is None or available>=decision:reasons.append('Snapshot availability must be before the decision day.')
    if available and days[-1]>available:reasons.append('The panel contains a price dated after its claimed snapshot availability.')
    if days[-1]>=decision:reasons.append('The latest closing price must predate the decision day.')
    if card['data_age_days']>settings['max_data_age_days']:reasons.append('The final price exceeds the chosen staleness limit.')
    if supplied and not settings.get('confirm_uploaded_provenance'):reasons.append('Uploaded data provenance has not been confirmed.')
    card['admission']='quarantine' if reasons else 'admit_for_this_forward_decision'
    card['reasons']=reasons
    if reasons:return card,None
    returns=[[b/a-1 for a,b in zip(before,now)] for before,now in zip(prices,prices[1:])]
    window=settings['estimation_months']; selected=returns[-window:]
    if len(selected)<window:raise ValueError('The selected estimation window needs at least that many returns plus one price row.')
    cols=list(zip(*selected)); means=[statistics.mean(c) for c in cols]
    covariance=[[sum((x-means[i])*(y-means[j]) for x,y in zip(cols[i],cols[j]))/(len(selected)-1)*12 for j in range(7)] for i in range(7)]
    trend=prices[-1][0]/prices[-13][0]-1
    card.update({'estimation_months':len(selected),'estimation_first_return_date':days[-len(selected)].isoformat(),
                 'signal_start_price_date':days[-13].isoformat(),'signal_end_price_date':days[-1].isoformat(),
                 'signal_12_month_return_percent':trend*100,'signal_regime':'risk_on' if trend>0 else 'risk_off'})
    return card,{'returns':selected,'covariance':covariance,'means':[m*12 for m in means], 'trend':trend}


def cagr(weights, returns):
    logs=0
    for r in returns:
        value=sum(w*x for w,x in zip(weights,r))
        if value<=-1:raise ValueError('A portfolio return reaches -100%.')
        logs+=math.log1p(value)
    return math.expm1(logs*12/len(returns))


def analyze(settings, opening, required, extra_opening_cost=0):
    card,data=prepare_data(settings)
    if data is None:return {'status':'data_quarantine','data_card':card,'portfolios':[],'candidate':None}
    current=[float(settings['current_weights'][t])/100 for t in TICKERS]
    vol_limit=float(settings['volatility_limit_percent'])/100
    turnover_limit=float(settings['turnover_limit_percent'])/100
    used=float(settings['turnover_used_percent'])/100
    cap=float(settings['risk_off_equity_cap_percent'])/100 if data['trend']<=0 else 1
    max_weight=float(settings['max_fund_weight_percent'])/100
    target=float(settings['return_target_percent'])/100
    bps=float(settings['transaction_cost_bps'])/10000
    style=settings.get('allocation_style','target_return')
    style_name,equity_limit,description=STYLES[style]
    concentration=float(settings.get('max_growth_fund_weight_percent',40))/100
    cash_mean=data['means'][-1]
    def metrics(weights,name):
        variance=sum(weights[i]*weights[j]*data['covariance'][i][j] for i in range(7) for j in range(7))
        risk=math.sqrt(max(0,variance)); expected=sum(w*r for w,r in zip(weights,data['means']))
        transition=sum(abs(w-v) for w,v in zip(weights,current))/2
        charged=0 if settings['initial_allocation'] else transition
        gross_volume=1 if settings['initial_allocation'] else 2*transition
        trade_cost=round(opening*gross_volume*bps,2)
        net=opening-extra_opening_cost-trade_cost
        eligible=net*weights[-1]
        remaining=max(0,net-required)
        growth_equity=sum(weights[:-1])*net
        tests={'long_only_sum_100':abs(sum(weights)-1)<1e-8 and min(weights)>=0,
            'volatility':risk<=vol_limit+1e-10,'annual_turnover_budget':used+charged<=turnover_limit+1e-10,
            'college_reserve_proxy_coverage':eligible+1e-6>=required and net>=0,
            'point_in_time_equity_cap':sum(weights[:-1])<=cap+1e-10,
            'maximum_fund_weight':max(weights)<=max_weight+1e-10}
        if style!='target_return':
            tests['long_term_equity_limit']=growth_equity<=remaining*equity_limit+1e-6
            tests['long_term_equity_fund_limit']=max(weights[:-1])*net<=remaining*concentration+1e-6
        return {'name':name,'weights':{t:w*100 for t,w in zip(TICKERS,weights)},
            'historical_arithmetic_return_percent':expected*100,'historical_constant_mix_cagr_percent':cagr(weights,data['returns'])*100,
            'annualized_sample_volatility_percent':risk*100,'one_way_transition_turnover_percent':transition*100,
            'turnover_charged_percent':charged*100,'annual_turnover_total_percent':(used+charged)*100,
            'proposed_transaction_cost':round(trade_cost,2),'reserve_proxy_assets':round(eligible,2),
            'hard_checks':tests,'hard_checks_pass':all(tests.values()),'failed_rules':[k for k,v in tests.items() if not v],
            'return_objective_met':expected+1e-10>=target,'equity_cap_percent':cap*100,
            'historical_sharpe_proxy':(expected-cash_mean)/risk if risk>1e-10 else None,
            'historical_max_drawdown_percent':drawdown(weights,data['returns'])*100}
    equal=[1/7]*7
    vols=[math.sqrt(max(0,data['covariance'][i][i])) for i in range(7)]
    inv=[1/max(v,1e-8) for v in vols]; inv=[v/sum(inv) for v in inv]
    rows=[metrics(equal,'Equal weight'),metrics(inv,'Inverse volatility'),metrics([1,0,0,0,0,0,0],'VOO benchmark proxy')]
    best=None; fallback=None; count=0; preferred=None
    def visit(prefix,remaining):
        nonlocal best,fallback,count,preferred
        if len(prefix)==6:
            w=[u/10 for u in [*prefix,remaining]];count+=1
            # Cheap constraints before covariance/product calculations.
            if max(w)>max_weight+1e-10 or sum(w[:-1])>cap+1e-10:return
            transition=sum(abs(a-b) for a,b in zip(w,current))/2
            if used+(0 if settings['initial_allocation'] else transition)>turnover_limit+1e-10:return
            net=opening-extra_opening_cost-opening*(1 if settings['initial_allocation'] else 2*transition)*bps
            if net*w[-1]+1e-6<required:return
            if style!='target_return':
                remaining=max(0,net-required)
                if sum(w[:-1])*net>remaining*equity_limit+1e-6:return
                if max(w[:-1])*net>remaining*concentration+1e-6:return
            risk=math.sqrt(max(0,sum(w[i]*w[j]*data['covariance'][i][j] for i in range(7) for j in range(7))))
            if risk>vol_limit+1e-10:return
            expected=sum(a*b for a,b in zip(w,data['means']))
            if style=='lower_risk':score=(-risk,expected)
            elif style in ('balanced_growth','maximum_sharpe'):score=((expected-cash_mean)/risk if risk>1e-10 else -math.inf,expected,-risk)
            else:score=(expected,-risk)
            if preferred is None or score>preferred[0]:preferred=(score,w)
            if fallback is None or expected>fallback[0]:fallback=(expected,w)
            if expected+1e-10>=target and (best is None or risk<best[0]):best=(risk,w)
            return
        for n in range(remaining+1):visit([*prefix,n],remaining-n)
    if style!='custom':visit([],10)
    chosen=(best[1] if best else fallback[1] if fallback else None) if style=='target_return' else preferred[1] if preferred else None
    if style=='custom':chosen=[float(settings['proposed_weights'][t])/100 for t in TICKERS]
    candidate=metrics(chosen,'Constrained candidate') if chosen else None
    if candidate:
        candidate['allocation_style']=style;candidate['allocation_label']=style_name
        if not candidate['hard_checks_pass']:
            rows.append(candidate);candidate=None
    if candidate:rows.append(candidate)
    reserve_return=cagr([0,0,0,0,0,0,1],data['returns'])*100
    for p in rows:
        net=opening-extra_opening_cost-p['proposed_transaction_cost']
        ratio=required/net if net>0 else math.inf
        w=[p['weights'][t]/100 for t in TICKERS]
        support=None;residual=None
        if p['hard_checks']['college_reserve_proxy_coverage']:
            if ratio>=1-1e-10:support=0
            else:
                residual=[v/(1-ratio) for v in w]
                residual[-1]=(w[-1]-ratio)/(1-ratio)
                support=cagr(residual,data['returns'])*100
        p['college_model_assets']=round(required,2) if p['hard_checks']['college_reserve_proxy_coverage'] else None
        p['support_model_assets']=round(max(0,net-required),2) if p['hard_checks']['college_reserve_proxy_coverage'] else None
        p['college_weights']={t:100 if t=='SGOV' else 0 for t in TICKERS}
        p['support_weights']={t:v*100 for t,v in zip(TICKERS,residual)} if residual is not None else {}
        p['college_scenario_return_percent']=reserve_return
        p['support_scenario_return_percent']=support
    return {'status':'portfolio_estimates_only','data_card':card,'portfolios':rows,'candidate':candidate,
        'grid_combinations_examined':count,'allocation_style':style,'allocation_label':style_name,
        'search_rule':description+' College backing, volatility, turnover, trend and concentration checks remain binding. Search uses a10-percentage-point whole-trust grid (custom weights bypass search). Not a continuous/global optimum. Lower risk may select all SGOV; no forced equity exposure.',
        'risk_definitions':{'volatility':'Sample monthly return covariance, annualized by12; portfolio sqrt(wΣw). Historical estimate only.',
         'turnover':'One-way target transition =0.5 sum|target-current|, plus entered year-to-date budget used. Initial funding is excluded only if explicitly selected. This is proposed-trade budget, not proof of all future annual turnover.',
         'reserve':'SGOV treated as a liquid government-bill proxy solely under the confirmed modelling assumption. It is not an inflation-matched guarantee.',
         'benchmark':'VOO adjusted-return proxy for S&P500 total return; ETF fees/tracking differ from the index.',
         'returns':'Arithmetic annual mean for objective/search; historical constant-monthly-mix CAGR as an optional forward scenario. Not an out-of-sample strategy backtest; fund expenses are already embedded in adjusted returns.'}}


def drawdown(weights,returns):
    value=peak=1;worst=0
    for row in returns:
        value*=1+sum(w*r for w,r in zip(weights,row));peak=max(peak,value);worst=min(worst,value/peak-1)
    return worst
