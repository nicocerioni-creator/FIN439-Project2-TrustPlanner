"""Reproducible investment-only bootstrap, never a withdrawal/solvency model."""
import math
import random
from backend.portfolio_engine import TICKERS


def simulate_growth(data, weights, years=30, paths=5000, seed=439, annual_cost_percent=0):
    # Each draw uses one common contiguous 12-month block across all assets.
    # Circular wrapping gives every observed month equal probability as a start.
    # Returns are monthly rebalanced, not independently sampled ticker returns.
    returns=data['returns']; blocks=[]
    for start in range(len(returns)):
        factor=1.
        for offset in range(12):
            factor*=1+sum(weights[t]*r for t,r in zip(TICKERS,returns[(start+offset)%len(returns)]))
        factor*=1-annual_cost_percent/100
        if not math.isfinite(factor) or factor<=0:raise ValueError('Simulation requires finite positive annual growth factors.')
        blocks.append(factor)
    rng=random.Random(seed); values=[100.]*paths
    def point(year):
        ordered=sorted(values)
        def quantile(q):
            index=(paths-1)*q; lo=int(index); fraction=index-lo
            return ordered[lo]*(1-fraction)+ordered[min(lo+1,paths-1)]*fraction
        mean=math.fsum(values)/paths
        if not math.isfinite(mean):raise ValueError('Simulation exceeded finite numeric limits. Shorten the horizon or review the prices.')
        return {'year':year,'p10':quantile(.1),'median':quantile(.5),'p90':quantile(.9),'mean':mean}
    points=[point(0)]
    for year in range(1,years+1):
        values=[value*rng.choice(blocks) for value in values]
        points.append(point(year))
    return {'points':points,'paths':paths,'years':years,'seed':seed,'starting_index':100,
        'terminal_loss_frequency_percent':sum(v<100 for v in values)/paths*100,
        'method':'Circular12-month moving-block bootstrap of jointly observed monthly returns; monthly constant-weight rebalancing; annual additional expense deducted at year end.',
        'limitations':[
            'Investment growth of $100 in nominal dollars BEFORE college/adult payments, contributions and taxes. Not a cash-flow forecast or probability of trust solvency.',
            '10th/90th percentiles are simulated outcomes under this historical resampling assumption, not confidence bounds on future performance. The mean differs from the median.',
            'Only the admitted estimation window is reused. No new regimes, parameter uncertainty, future trading costs or future CPI are modelled. Long horizons compound estimation errors.',
            'SGOV is a return proxy, not a guaranteed reserve. Initial setup/trade costs are outside this indexed chart; ETF operating costs are embedded in source returns.',
            'Increasing path count reduces sampling noise, not historical bias. Interactive runs are limited to20000 paths to keep the app responsive.'
        ]}
