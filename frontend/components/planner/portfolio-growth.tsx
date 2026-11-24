'use client';
import {useEffect,useRef,useState} from 'react';
import {simulatePortfolio,type InvestmentContext,type PortfolioSettings,type SimulationResult} from '@/lib/api';
import {formatMoney} from '@/lib/format';

const field='mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm';
export function PortfolioGrowth({context,settings,blocked}:{context:InvestmentContext;settings:PortfolioSettings;blocked:boolean}){
 const [years,setYears]=useState(30),[paths,setPaths]=useState(5000),[seed,setSeed]=useState(439);
 const [scope,setScope]=useState<'long_term'|'whole_trust'>('long_term'),[cost,setCost]=useState('0');
 const [result,setResult]=useState<SimulationResult|null>(null),[stamp,setStamp]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [year,setYear]=useState(30),[log,setLog]=useState(false);const requestId=useRef(0);
 const key=JSON.stringify([context,settings,years,paths,seed,scope,cost]);const latest=useRef(key);latest.current=key;
 useEffect(()=>()=>{requestId.current++;},[]);
 const stale=stamp!==key||blocked;
 async function run(){if(blocked)return;const id=++requestId.current,snapshot=key;setLoading(true);setError('');
  try{const value=await simulatePortfolio({...context,portfolio:settings,years,paths,seed,scope,annual_cost_percent:cost});
   if(id===requestId.current&&latest.current===snapshot){setResult(value);setStamp(snapshot);setYear(years);}}
  catch(err){if(id===requestId.current)setError(err instanceof Error?err.message:'Simulation failed.');}
  finally{if(id===requestId.current)setLoading(false);}}
 const points=result?.points??[];const picked=points[Math.min(year,points.length-1)];
 const transform=(value:number)=>log?Math.log10(Math.max(value,1e-12)):value;
 const high=points.length?Math.max(...points.flatMap(p=>[transform(p.p90),transform(p.mean)])):1;
 const low=points.length?Math.min(...points.map(p=>transform(p.p10))):0;
 const floor=log?low:Math.min(0,low),span=Math.max(high-floor,1e-8);
 const x=(i:number)=>85+i/Math.max(1,points.length-1)*790,y=(v:number)=>270-(transform(v)-floor)/span*235;
 const line=(key:'p10'|'median'|'p90'|'mean')=>points.map((p,i)=>`${i?'L':'M'}${x(i)},${y(p[key])}`).join(' ');
 return <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
  <div><p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Simulated investment growth</p><h3 className="mt-1 text-xl font-semibold text-navy-900">What could $100 become?</h3><p className="mt-2 text-sm text-slate-600">A Monte Carlo bootstrap reuses jointly observed12-month return blocks. This chart excludes college and adult payments; use Funding for payment affordability. All values are nominal, before taxes.</p></div>
  <div className="grid gap-4 sm:grid-cols-3">
   <label className="text-sm">Investments shown<select className={field} value={scope} onChange={e=>setScope(e.target.value as typeof scope)}><option value="long_term">Long-term portion after college earmark</option><option value="whole_trust">Whole-trust investment mix</option></select></label>
   <label className="text-sm">Years<input type="number" min="1" max="100" required className={field} value={years} onChange={e=>setYears(Number(e.target.value))}/></label>
   <label className="text-sm">Simulated paths<select className={field} value={paths} onChange={e=>setPaths(Number(e.target.value))}>{[1000,5000,10000,20000].map(n=><option key={n} value={n}>{n.toLocaleString()}</option>)}</select></label>
   <label className="text-sm">Reproducible seed<input type="number" min="0" max="2147483647" className={field} value={seed} onChange={e=>setSeed(Number(e.target.value))}/></label>
   <label className="text-sm">Additional annual expenses (%)<input type="number" min="0" max="99.99" step="0.01" className={field} value={cost} onChange={e=>setCost(e.target.value)}/></label>
  </div>
  <p className="text-xs text-slate-600">More paths reduce sampling noise, not errors in historical assumptions. Interactive runs stop at20,000 paths. Expenses here apply only to this chart; initial trading/setup costs are outside the $100 index. The seed and all inputs are saved with a downloaded simulation.</p>
  <button type="button" disabled={blocked||loading||!Number.isInteger(years)||years<1||years>100||!Number.isInteger(seed)||seed<0||seed>2147483647||cost.trim()===''||!Number.isFinite(Number(cost))||Number(cost)<0||Number(cost)>=100} onClick={()=>void run()} className="min-h-11 rounded bg-teal-700 px-5 text-sm font-medium text-white disabled:opacity-40">{loading?'Simulating growth…':'Simulate growth'}</button>
  {error&&<p role="alert" className="text-sm text-rose-900">{error}</p>}
  {result&&<div className={stale?'space-y-4 opacity-50':'space-y-4'}>
   {stale&&<p role="status" className="text-sm text-amber-900">Inputs changed. Run the simulation again before using these results.</p>}
   <p className="text-sm font-medium">{result.allocation_label} · {result.paths.toLocaleString()} paths · seed{result.seed}</p>
   <label className="flex gap-2 text-sm"><input type="checkbox" checked={log} onChange={e=>setLog(e.target.checked)}/>Logarithmic value scale (equal spacing represents equal percentage growth)</label>
   <svg viewBox="0 0 920 320" role="img" aria-label="Simulated growth of100 dollars:10th to90th percentile band, median and mean over years" className="w-full rounded-lg bg-white">
    {[0,.25,.5,.75,1].map(t=>{const v=floor+span*t;return <g key={t}><line x1="85" x2="875" y1={270-235*t} y2={270-235*t} stroke="#e2e8f0"/><text x="78" y={274-235*t} textAnchor="end" fontSize="12" fill="#475569">{formatMoney(log?10**v:v)}</text></g>;})}
    <path d={`${line('p90')} ${[...points].reverse().map((p,i)=>`L${x(points.length-1-i)},${y(p.p10)}`).join(' ')} Z`} fill="#ccfbf1"/>
    <path d={line('median')} fill="none" stroke="#0f766e" strokeWidth="3"/><path d={line('mean')} fill="none" stroke="#1e3a5f" strokeWidth="2" strokeDasharray="6 4"/>
    {[0,.25,.5,.75,1].map(t=><text key={t} x={85+t*790} y="294" textAnchor="middle" fontSize="12" fill="#475569">Year{Math.round(t*result.years)}</text>)}
    {picked&&<line x1={x(picked.year)} x2={x(picked.year)} y1="30" y2="270" stroke="#64748b" strokeDasharray="2 3"/>}
   </svg>
   <p className="text-xs text-slate-600">Shaded:10th–90th percentiles · teal:median · dashed navy:mean. These bands are scenario outcomes, not guaranteed ranges or confidence intervals.</p>
   <label className="block text-sm">Inspect year{picked?.year}<input type="range" min="0" max={result.years} value={Math.min(year,result.years)} onChange={e=>setYear(Number(e.target.value))} className="mt-2 w-full accent-teal-700"/></label>
   {picked&&<dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">{([['Downside (10th)',picked.p10],['Middle (median)',picked.median],['Upside (90th)',picked.p90],['Average (mean)',picked.mean]] as const).map(([label,value])=><div key={label}><dt className="text-slate-600">{label}</dt><dd className="mt-1 text-xl font-semibold text-navy-900">{formatMoney(value)}</dd></div>)}</dl>}
   <p className="text-sm">{result.terminal_loss_frequency_percent.toFixed(1)}% of paths end below the initial nominal$100. This is not the probability of a college or adult-support shortfall.</p>
   <button type="button" disabled={stale||loading||!!error} className="text-sm underline disabled:opacity-40" onClick={()=>{const blob=new Blob([JSON.stringify({context,portfolio:settings,years,paths,seed,scope,annual_cost_percent:cost,result},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='investment_growth_simulation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Download simulation and inputs</button>
   <details><summary className="cursor-pointer text-sm">Method and limitations</summary><p className="mt-3 text-xs text-slate-600">{result.method}</p><ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-slate-600">{result.limitations.map(v=><li key={v}>{v}</li>)}</ul></details>
  </div>}
 </div>;
}
