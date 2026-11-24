'use client';
import type {PortfolioCasesResult,PortfolioEstimateResult,PortfolioRow,PortfolioSettings} from '@/lib/api';
import {portfolioTickers} from '@/lib/portfolio-weights';

export const standardCases=[
 ['lower_risk','Lower Risk','Prioritize stability; up to35% long-term equity.'],
 ['balanced_growth','Balanced Growth','Historical Sharpe objective; up to70% long-term equity.'],
 ['aggressive_growth','Aggressive Growth','Historical growth objective; up to100% long-term equity.'],
] as const;
const colors:Record<string,string>={lower_risk:'#64748b',balanced_growth:'#0f766e',aggressive_growth:'#7c3aed',custom:'#d97706'};
export function PortfolioCases({settings,cases,preview,pending,error,onChoose,onWeight,onRetry}:{settings:PortfolioSettings;cases:PortfolioCasesResult|null;
 preview:PortfolioEstimateResult|null;pending:boolean;error:string;onChoose:(style:PortfolioSettings['allocation_style'])=>void;onWeight:(ticker:string,value:string)=>void;onRetry:()=>void}){
 const custom=settings.allocation_style==='custom';
 const row=preview?.candidate??preview?.portfolios.find(p=>p.name==='Constrained candidate');
 const plotted:{key:string;label:string;row:PortfolioRow}[]=standardCases.flatMap(([key,label])=>cases?.cases[key]?.candidate?[{key,label,row:cases.cases[key]!.candidate!}]:[]);
 if(custom&&row)plotted.push({key:'custom',label:'Custom case',row});
 const maxRisk=Math.max(5,...plotted.map(p=>p.row.annualized_sample_volatility_percent))*1.15;
 const minReturn=Math.min(0,...plotted.map(p=>p.row.historical_arithmetic_return_percent))-1;
 const maxReturn=Math.max(5,...plotted.map(p=>p.row.historical_arithmetic_return_percent))*1.15;
 const x=(risk:number)=>80+risk/maxRisk*640,y=(ret:number)=>270-(ret-minReturn)/(maxReturn-minReturn)*225;
 return <div className="space-y-5">
  <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Standard cases · compare starting points</p>
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="group" aria-label="Portfolio cases">
   {[...standardCases,['custom','Custom case','Adjust each fund and explore the trade-off.'] as const].map(([value,label,description])=><button data-case={value} key={value} type="button" aria-pressed={settings.allocation_style===value} onClick={()=>onChoose(value)} className={`rounded-xl border p-4 text-left ${settings.allocation_style===value?'border-teal-700 bg-teal-50 ring-1 ring-teal-700':'border-slate-200 bg-white'}`}><span className="block text-base font-semibold text-navy-900">{label}</span><span className="mt-2 block text-xs leading-relaxed text-slate-600">{description}</span></button>)}
  </div>
  <p className="text-xs leading-relaxed text-slate-600">College backing stays earmarked within the same trust. Standard cases use a40% maximum per equity fund in the remaining long-term assets; Custom removes that preset cap while retaining your hard limits. Lower Risk may hold all SGOV. Seven funds still overlap in U.S. equities.</p>
  {pending&&<p role="status" className="text-sm text-teal-800">Updating weights and historical risk/return…</p>}
  {error&&<p role="alert" className="text-sm text-rose-900">{error} <button type="button" className="underline" onClick={onRetry}>Retry preview</button></p>}
  {!preview&&!pending&&!error&&<p className="text-sm text-slate-600">Enter a valid decision date below to see case weights and the chart. Family and opening assets must be applied first.</p>}
  {(preview||custom)&&<div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
   <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-navy-900">{custom?'Adjust custom weights':'Selected case weights'}</h3><p className="mb-4 mt-1 text-xs text-slate-600">Whole-trust percentages, including college backing in SGOV.</p>
    {(row||custom)?<div className="space-y-3">{portfolioTickers.map(t=>{const weight=custom?Number(settings.proposed_weights?.[t]??0):row?.weights[t]??0;return <div key={t} className="space-y-1"><div className="flex items-center justify-between gap-3 text-sm"><label htmlFor={`case-weight-${t}`} className="font-semibold">{t}</label>{custom?<span className="flex items-center gap-1"><input id={`case-weight-${t}`} data-custom-weight={t} aria-label={`${t} custom weight percent`} type="number" min="0" max="100" step="0.1" value={settings.proposed_weights?.[t]??'0'} onChange={e=>onWeight(t,e.target.value)} className="h-8 w-20 rounded border border-slate-300 bg-white px-2 text-right"/>%</span>:<span data-case-weight={t}>{weight.toFixed(1)}%</span>}</div>{custom?<input aria-label={`${t} weight slider`} data-weight-slider={t} type="range" min="0" max="100" step="0.1" value={weight} onChange={e=>onWeight(t,e.target.value)} className="w-full accent-teal-700"/>:<div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{width:`${weight}%`,background:t==='SGOV'?'#64748b':'#0f766e'}}/></div>}</div>;})}</div>:<p className="text-sm text-amber-900">No usable weights. Review data admission and constraints.</p>}
    {custom&&<p className="mt-4 text-xs text-slate-600">Equity changes use or replenish SGOV. Editing SGOV scales the equity mix. Total stays100%; the chart updates automatically. Insufficient college backing or excess risk is flagged.</p>}
   </div>
   <div className="rounded-xl border border-slate-200 p-4"><h3 className="font-semibold text-navy-900">Historical return versus risk</h3><p className="mt-1 text-xs text-slate-600">Higher dots: higher annual arithmetic return estimate. Further right: more annualized volatility. These are historical estimates, not forecasts.</p>
    {plotted.length>0?<><svg className="mt-3 w-full" viewBox="0 0 800 335" role="img" aria-label="Portfolio comparison: historical annual return estimate versus annualized volatility">
     {[0,.25,.5,.75,1].map(f=><g key={f}><line x1="80" x2="720" y1={270-f*225} y2={270-f*225} stroke="#e2e8f0"/><text x="72" y={274-f*225} fontSize="12" fill="#475569" textAnchor="end">{(minReturn+(maxReturn-minReturn)*f).toFixed(1)}%</text><text x={80+f*640} y="294" fontSize="12" fill="#475569" textAnchor="middle">{(f*maxRisk).toFixed(1)}%</text></g>)}
     <text x="400" y="322" fontSize="13" fill="#475569" textAnchor="middle">Annualized volatility (risk)</text><text x="14" y="155" transform="rotate(-90 14 155)" fontSize="13" fill="#475569" textAnchor="middle">Annual return estimate</text>
     {plotted.map(p=><g key={p.key} data-risk-point={p.key}><circle cx={x(p.row.annualized_sample_volatility_percent)} cy={y(p.row.historical_arithmetic_return_percent)} r={settings.allocation_style===p.key?9:6} fill={colors[p.key]} stroke={settings.allocation_style===p.key?'#0f172a':'white'} strokeWidth="2"><title>{`${p.label}: return ${p.row.historical_arithmetic_return_percent.toFixed(2)}%, volatility ${p.row.annualized_sample_volatility_percent.toFixed(2)}%`}</title></circle></g>)}
    </svg><ul className="flex flex-wrap gap-3 text-xs">{plotted.map(p=><li className="flex items-center gap-1" key={p.key}><span className="h-2 w-2 rounded-full" style={{background:colors[p.key]}}/>{p.label}</li>)}</ul></>:<p className="my-8 text-sm text-slate-600">No comparable estimates yet. Check the date, data admission and constraints.</p>}
    {row&&<dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-sm"><div><dt className="text-slate-600">Selected return estimate</dt><dd className="text-2xl font-semibold text-navy-900" data-selected-return>{row.historical_arithmetic_return_percent.toFixed(2)}%</dd></div><div><dt className="text-slate-600">Selected risk estimate</dt><dd className="text-2xl font-semibold text-navy-900" data-selected-risk>{row.annualized_sample_volatility_percent.toFixed(2)}%</dd></div></dl>}
    {row&&!row.hard_checks_pass&&<p className="mt-4 rounded bg-rose-50 p-3 text-sm text-rose-900">Custom case fails: {row.failed_rules.map(v=>v.replaceAll('_',' ')).join(', ')}. Shown for comparison; cannot be linked to Funding.</p>}
    {preview&&!row&&<p className="mt-4 text-sm text-amber-900">{((preview.data_card.reasons as string[]|undefined)??['No candidate meets this case’s constraints.']).join(' ')}</p>}
   </div>
  </div>}
 </div>;
}
