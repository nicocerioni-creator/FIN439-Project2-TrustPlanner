'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { calculateFundingProjection, validateFundingPlan, estimatePortfolio, type InvestmentContext, type PortfolioSelection, type FundingRequest, type AdaptivePolicy, type FundingPath, type FundingResult, type FundingRow } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { Badge, Sheet, SheetSection, TableScroll, tableCell, tableHead } from './primitives';
import type { PlanSession, FundingRecord } from './types';
import type {InflationSetting} from './reserve-view';
import {ReserveCalculator} from './reserve-calculator';

const field = 'mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-900';
const labels = { minimum: 'Minimum support', goal: 'Goal support', college_only: 'College only', adaptive: 'Adaptive support' };
const colors = { minimum: '#13334d', goal: '#0f766e', college_only: '#0f766e', adaptive: '#7c3aed' };

function BalanceChart({ result }: { result: FundingResult }) {
  const paths = Object.values(result.paths).filter((p): p is FundingPath => !!p);
  const max = Math.max(1, Number(result.opening_allocation.total_trust_assets), ...paths.flatMap(p => p.monthly_ledger.map(r => Number(r.closing_total_model_start_dollars))));
  return <figure className="space-y-3">
    <figcaption className="text-sm font-medium text-navy-900">Trust balance in model-start purchasing power</figcaption>
    <svg viewBox="0 0 800 245" role="img" aria-label="Scenario trust balances in model-start purchasing power. A stopped line ends at the first scheduled payment shortfall." className="w-full rounded-md bg-slate-50">
      {[0, 0.5, 1].map(f => <g key={f}><line x1="88" y1={20 + f * 180} x2="780" y2={20 + f * 180} stroke="#cbd5e1" strokeDasharray="3 4"/><text x="80" y={24 + f * 180} textAnchor="end" fontSize="11" fill="#475569">{formatMoney(max * (1-f))}</text></g>)}
      {paths.map(p => <polyline key={p.path} fill="none" stroke={colors[p.path]} strokeWidth="2.5" points={[[88, 200 - Number(result.opening_allocation.total_trust_assets) / max * 180], ...p.monthly_ledger.map(r => [88 + (r.month_index ?? 0) / result.horizon_months * 692, 200 - Number(r.closing_total_model_start_dollars) / max * 180])].map(point => point.join(',')).join(' ')} />)}
      <text x="88" y="225" fontSize="11" fill="#475569">Model start</text><text x="780" y="225" textAnchor="end" fontSize="11" fill="#475569">Youngest reaches 80</text>
    </svg>
    <ul className="flex flex-wrap gap-5 text-xs text-slate-600">{paths.map(p => <li key={p.path} className="flex items-center gap-2"><span className="inline-block h-0.5 w-6" style={{background: colors[p.path]}} />{labels[p.path]}{p.status === 'stopped_at_payment_shortfall' ? ' · stopped at payment shortfall' : ''}</li>)}</ul>
  </figure>;
}

function Ledger({ path }: { path: FundingPath }) {
  const [frequency, setFrequency] = useState<'annual' | 'monthly'>('annual');
  const [page, setPage] = useState(0);
  const rows = frequency === 'annual' ? path.annual_summary : path.monthly_ledger;
  const pages = Math.max(1, Math.ceil(rows.length / 12));
  const activePage = Math.min(page, pages - 1);
  const visible = rows.slice(activePage * 12, activePage * 12 + 12);
  function changeFrequency(value: 'annual' | 'monthly') { setFrequency(value); setPage(0); }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Ledger frequency" className="flex gap-2">{(['annual', 'monthly'] as const).map(f => <button key={f} type="button" aria-pressed={frequency === f} onClick={() => changeFrequency(f)} className={`min-h-10 rounded-md border px-3 text-sm ${frequency === f ? 'border-navy-900 bg-navy-900 text-white' : 'border-slate-300'}`}>{f === 'annual' ? 'Annual summary' : 'Monthly ledger'}</button>)}</div>
      <p className="text-xs text-slate-600">All ledger amounts below are nominal dollars at the displayed dates.</p>
    </div>
    <TableScroll><table className="w-full min-w-[1150px] tabular-nums"><caption className="sr-only">{labels[path.path]} cash-flow ledger</caption><thead><tr>{['Period ending', 'Opening total', 'Gross growth', 'Costs', 'College paid', 'Adult paid', 'College assets', 'Long-term assets', 'Closing total', 'Required college reserve', 'College account gap'].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr></thead>
      <tbody>{visible.map((r: FundingRow) => <tr key={r.month ?? r.year}><th scope="row" className={`${tableCell} whitespace-nowrap text-left`}>{formatDate(r.period_end)}</th>{['opening_total','gross_growth','costs','college_paid','adult_paid','closing_college_assets','closing_support_assets','closing_total','required_college_reserve','college_reserve_gap'].map(k => <td key={k} className={`${tableCell} whitespace-nowrap text-right`}>{formatMoney(r[k as keyof FundingRow] as string)}</td>)}</tr>)}</tbody></table></TableScroll>
    <div className="flex items-center justify-between gap-3 text-sm"><button type="button" disabled={activePage === 0} onClick={() => setPage(activePage - 1)} className="min-h-10 rounded border border-slate-300 px-3 disabled:opacity-40">Previous</button><span>Page {activePage + 1} of {pages} · {rows.length} periods</span><button type="button" disabled={activePage + 1 === pages} onClick={() => setPage(activePage + 1)} className="min-h-10 rounded border border-slate-300 px-3 disabled:opacity-40">Next</button></div>
    <p className="text-xs text-slate-600">Opening assets + gross growth − costs − college paid − adult paid = closing assets. Transfers between accounts never change the total.</p>
  </div>;
}

export function FundingView({session,onRequestChange,importRequest,inflation,onOpenCollege,onOpenPortfolio,onContextChange,selection,onSelectPortfolio,onEvidenceChange}:{
 session:PlanSession;onRequestChange?:(v:FundingRequest|null)=>void;importRequest?:FundingRequest|null;inflation?:InflationSetting;
 onOpenCollege?:()=>void;onOpenPortfolio?:()=>void;onContextChange?:(v:InvestmentContext|null)=>void;
 selection?:PortfolioSelection|null;onSelectPortfolio?:(v:PortfolioSelection|null)=>void;onEvidenceChange?:(v:FundingRecord)=>void;
}) {
 const [customBalance,setCustomBalance]=useState('');
 const [manual,setManual]=useState({college:'',support:''});const [localInflation,setLocalInflation]=useState('');
 const [returnMode,setReturnMode]=useState<'portfolio'|'manual'>('portfolio');
 const [cost,setCost]=useState('0');const [openingCost,setOpeningCost]=useState('0');
 const [policy,setPolicy]=useState<AdaptivePolicy>({enabled:true,real_discount_percent:'0',buffer_percent:'0',terminal_real_balance:'0',max_monthly_restoration_points:'100'});
 const [saveNote,setSaveNote]=useState('');const [result,setResult]=useState<FundingResult|null>(null);const [submitted,setSubmitted]=useState('');
 const [selectedPath,setSelectedPath]=useState<FundingPath['path']>('adaptive');const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const [calculatedAt,setCalculatedAt]=useState<string|null>(null);
 const version=useRef(0);useEffect(()=>()=>{version.current++;},[]);
 const plan=session.result;const demo=plan?.inputs.family_mode==='demo';const annualInflation=inflation?.value??localInflation;
 const opening=demo?session.reference?.reference_initial_capital??'10000000':customBalance;
 const blocked=session.mode!=='live'||!plan?.inputs.model_start_date||!plan.beneficiaries.length||session.stale||session.loading||!!session.error;
 const context:InvestmentContext|null=plan&&opening!==''?{payment_inputs:plan.inputs,opening_balance:opening,opening_transaction_cost:openingCost||'0'}:null;
 const contextKey=JSON.stringify(context);const linked=selection?.contextKey===contextKey?selection:null;const candidate=linked?.estimate.candidate;
 const request:FundingRequest|null=!plan||opening===''||annualInflation===''||(returnMode==='portfolio'?!candidate:manual.college===''||manual.support==='')?null:{
  payment_inputs:plan.inputs,opening_balance:opening,
  college_annual_return_percent:returnMode==='portfolio'?String(candidate!.college_scenario_return_percent):manual.college,
  support_annual_return_percent:returnMode==='portfolio'?String(candidate!.support_scenario_return_percent):manual.support,
  annual_cost_percent:cost||'0',annual_cpi_change_percent:annualInflation,
  reserve_transfer_rule:'protect_before_payments',include_horizon_day_payments:true,
  opening_transaction_cost:openingCost||'0',initial_college_shock_percent:'0',initial_support_shock_percent:'0',
  adaptive_policy:{...policy,enabled:!!plan.inputs.adult_support_enabled&&policy.enabled},
  portfolio_source:returnMode==='portfolio'?linked!.settings:null,
 };
 const stamp=JSON.stringify([request,context,returnMode,manual,annualInflation,cost,policy]);const stale=session.stale||submitted!==stamp;
 const chosen=result?.paths[selectedPath]??(result?Object.values(result.paths).find((p):p is FundingPath=>!!p):undefined);
 useEffect(()=>{onContextChange?.(blocked?null:context);},[contextKey,blocked,onContextChange]);
 useEffect(()=>{onRequestChange?.(blocked?null:request);},[stamp,blocked,onRequestChange]);
 useEffect(()=>{onEvidenceChange?.({result,current:!!result&&!stale&&!blocked&&!loading&&!error,loading,error,calculatedAt,request:blocked?null:request,selectedPath:chosen?.path??selectedPath});},[result,stale,blocked,loading,error,calculatedAt,stamp,selectedPath,onEvidenceChange]);
 function setInflation(v:string){setLocalInflation(v);inflation?.onChange(v);}
 async function applySettings(v:FundingRequest){
  setCustomBalance(v.opening_balance);setInflation(v.annual_cpi_change_percent);setCost(v.annual_cost_percent||'0');setOpeningCost(v.opening_transaction_cost??'0');
  setManual({college:v.college_annual_return_percent,support:v.support_annual_return_percent});
  if(v.adaptive_policy)setPolicy(v.adaptive_policy);
  setReturnMode(v.portfolio_source?'portfolio':'manual');
  setSaveNote('Settings restored. College-first protection and payments on the 80th birthday are included. Recalculate to refresh results. Opening loss scenarios are now managed in Portfolio & stress.');
  if(v.portfolio_source){
   onSelectPortfolio?.(null);
   const ctx:InvestmentContext={payment_inputs:v.payment_inputs,opening_balance:v.opening_balance,opening_transaction_cost:v.opening_transaction_cost??'0'};
   const estimate=await estimatePortfolio({...ctx,portfolio:v.portfolio_source});
   if(!estimate.candidate)throw new Error('Saved portfolio could not be admitted or has no feasible candidate. Review Portfolio & stress.');
   onSelectPortfolio?.({contextKey:JSON.stringify(ctx),settings:v.portfolio_source,estimate});
  }
 }
 useEffect(()=>{if(importRequest)void applySettings(importRequest).catch(err=>setSaveNote(err instanceof Error?err.message:'Could not restore portfolio source.'));},[importRequest]);
 async function saveSettings(){if(!request||blocked)return;try{const saved=await validateFundingPlan(request);downloadJSON({kind:'trust-planner-settings',version:2,funding:saved.inputs},'trust_planner_settings.json');setSaveNote('Settings saved, including the selected return source.');}catch(err){setSaveNote(err instanceof Error?err.message:'Complete the required settings.');}}
 async function loadSettings(file:File|undefined){if(!file)return;if(file.size>10000000){setSaveNote('Choose settings smaller than10MB.');return;}
  try{const raw=JSON.parse(await file.text());const input=raw.kind==='trust-planner-settings'?raw.funding:raw.analysis?.funding??raw.inputs?.funding??raw.inputs??raw.funding;
   const validated=await validateFundingPlan({...input,reserve_transfer_rule:'protect_before_payments',include_horizon_day_payments:true,initial_college_shock_percent:'0',initial_support_shock_percent:'0'});
   if(!session.onImportPaymentPlan)throw new Error('Import unavailable in the design preview.');await session.onImportPaymentPlan(validated.inputs.payment_inputs);await applySettings(validated.inputs);setError('');
  }catch(err){setSaveNote(err instanceof Error?err.message:'Could not load settings.');}}
 async function calculate(event:FormEvent){event.preventDefault();if(blocked||!request)return;const id=++version.current;const snapshot=stamp;setLoading(true);setError('');
  try{const next=await calculateFundingProjection(request);if(id===version.current){setResult(next);setSubmitted(snapshot);setCalculatedAt(new Date().toISOString());}}
  catch(err){if(id===version.current)setError(err instanceof Error?err.message:'Projection failed.');}finally{if(id===version.current)setLoading(false);}}
 function downloadJSON(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function download(){if(result&&!stale&&!blocked&&!loading&&!error)downloadJSON(result,'funding_projection.json');}
 
 return <Sheet>
  <SheetSection id="funding-assumptions" kicker="1 · Your starting point" title="Plan how the trust pays your family">
   <p className="mb-5 max-w-3xl text-sm leading-relaxed text-slate-700">One trust supports two purposes: college payments first, then long-term family support. Set the starting assets and inflation, choose where investment returns come from, and review what the model can afford.</p>
   {blocked&&<p role="status" className="mb-5 rounded bg-amber-50 p-3 text-sm text-amber-900">{session.mode!=='live'?'Funding calculations are disabled in the design preview.':'Choose a model date, add a child and apply your latest family settings before calculating.'}</p>}
   <form onSubmit={calculate} className="space-y-7">
    <fieldset disabled={blocked||loading} className="grid gap-5 sm:grid-cols-2 disabled:opacity-60">
     <label className="text-sm font-medium">Opening trust balance ($)<input data-field="opening" className={field} type="number" min="0" step="0.01" required readOnly={demo} value={opening} onChange={e=>setCustomBalance(e.target.value)}/><span className="mt-1 block text-xs text-slate-600">{demo?'The demo starts with $10 million. Choose Your family to use another amount.':'Total trust assets, including money earmarked for college.'}</span></label>
     <label className="text-sm font-medium">Expected annual inflation (CPI, %)<input data-field="inflation" className={field} type="number" required min="-50" max="100" step="0.01" value={annualInflation} placeholder="Enter an assumption" onChange={e=>setInflation(e.target.value)}/><span className="mt-1 block text-xs text-slate-600">Shared with College overview. Future purchasing-power assumption; enter 0 for unchanged prices.</span></label>
    </fieldset>
    <p className="rounded bg-slate-50 p-3 text-sm text-slate-600">Scheduled payments on the youngest child&apos;s 80th birthday are included. This is a planning horizon; it does not prove funding beyond that date.</p>
    <section className="border-t border-slate-200 pt-6" aria-labelledby="return-source-title">
     <h2 id="return-source-title" className="font-serif text-2xl text-navy-900">2 · Investments and return assumptions</h2>
     <p className="mt-2 text-sm text-slate-600">Returns grow the assets between payments. A historical estimate used for future planning is an assumption, not a known future return.</p>
     <fieldset disabled={blocked||loading} className="mt-4 space-y-3"><label className="flex items-start gap-3 text-sm"><input type="radio" name="funding-return-source" checked={returnMode==='portfolio'} onChange={()=>setReturnMode('portfolio')}/><span><strong>Use the portfolio candidate&apos;s historical estimates</strong><span className="block text-xs text-slate-600">College uses the SGOV reserve proxy. Long-term investments use the remaining portfolio after the college allocation.</span></span></label><label className="flex gap-3 text-sm"><input type="radio" name="funding-return-source" checked={returnMode==='manual'} onChange={()=>setReturnMode('manual')}/>Enter my own return assumptions</label></fieldset>
     {returnMode==='portfolio'?(candidate?<div className="mt-4 rounded border border-teal-200 bg-teal-50 p-4"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="font-semibold">College fund · historical annual return</dt><dd>{candidate.college_scenario_return_percent.toFixed(2)}%</dd></div><div><dt className="font-semibold">Long-term investments · historical annual return</dt><dd>{candidate.support_scenario_return_percent?.toFixed(2)}%</dd></div></dl><p className="mt-3 text-xs text-slate-600">{String(linked?.estimate.data_card.estimation_months)} monthly returns · latest price {String(linked?.estimate.data_card.last_price_date)}. Fund expenses are embedded; additional expenses below are separate. Rates and trade costs are rechecked by Python when you calculate.</p><details className="mt-3 text-sm"><summary className="cursor-pointer font-medium">See the investments behind each portion</summary><p className="mt-2">College: SGOV reserve proxy. Long-term weights: {Object.entries(candidate.support_weights??{}).filter(([,w])=>w>0.001).map(([t,w])=>`${t} ${w.toFixed(1)}%`).join(' · ')||'No remaining long-term assets'}.</p><p className="mt-2">Estimated opening trade costs: {formatMoney(candidate.proposed_transaction_cost)}; included once in the calculation.</p></details></div>:<div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Choose and estimate a portfolio first. You can do this without entering manual return assumptions.<button type="button" className="mt-3 block min-h-10 rounded bg-navy-900 px-4 text-sm text-white" onClick={onOpenPortfolio}>Choose investments in Portfolio &amp; stress</button></div>):<fieldset disabled={blocked||loading} className="mt-4 grid gap-4 sm:grid-cols-2">{(['college','support'] as const).map(k=><label key={k} className="text-sm font-medium">{k==='college'?'College fund assumed annual return (%)':'Long-term investments assumed annual return (%)'}<input data-field={k} className={field} type="number" required min="-99.99" max="100" step="0.01" value={manual[k]} placeholder="Enter an assumption" onChange={e=>setManual(v=>({...v,[k]:e.target.value}))}/><span className="mt-1 block text-xs text-slate-600">{k==='college'?'Growth on the money earmarked for remaining college payments.':'Growth on the rest of the trust, used for adult support and college top-ups.'} Before the additional expenses below; this does not select any holdings.</span></label>)}</fieldset>}
     {onOpenPortfolio&&candidate&&<button type="button" onClick={onOpenPortfolio} className="mt-3 text-sm text-teal-800 underline">Review or change portfolio</button>}
    </section>
    <details className="rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-base font-semibold text-navy-900">3 · Optional costs and expenses</summary><p className="mt-3 text-sm text-slate-600">Both start at 0 for a simplified model. Include extra management, trustee or administration costs. Taxes are not calculated. Avoid charging ETF expenses or trading costs twice when already included in your return source.</p><fieldset disabled={blocked||loading} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Extra annual management and administration costs (%)<input data-field="cost" className={field} type="number" min="0" max="99.99" step="0.01" value={cost} onChange={e=>setCost(e.target.value)}/><span className="mt-1 block text-xs text-slate-600">Percentage of invested assets each year, applied to both portions. Blank means 0.</span></label><label className="text-sm font-medium">Upfront setup and initial expenses ($)<input data-field="opening-cost" className={field} type="number" min="0" step="0.01" value={openingCost} onChange={e=>setOpeningCost(e.target.value)}/><span className="mt-1 block text-xs text-slate-600">A dollar amount deducted once from the total before the college allocation. Blank means 0.</span></label></fieldset></details>
    {plan?.inputs.adult_support_enabled?<section className="border-t border-slate-200 pt-6" aria-labelledby="adult-policy-title"><h2 id="adult-policy-title" className="font-serif text-2xl text-navy-900">4 · Adult-support payment policy</h2><p className="mt-2 text-sm text-slate-600">The annual minimum is {formatMoney(plan.annual_amounts_model_start_dollars.adult_minimum)} and goal is {formatMoney(plan.annual_amounts_model_start_dollars.adult_target)} per eligible child, in model-start purchasing power. Payments adjust for inflation.</p><label className="mt-4 flex gap-3 text-sm font-semibold"><input type="checkbox" disabled={blocked||loading} checked={policy.enabled} onChange={e=>setPolicy(p=>({...p,enabled:e.target.checked}))}/>Adjust adult support to what the trust can afford</label><p className="mt-2 text-sm text-slate-600">Protect college and future minimum payments first, then pay an affordable share toward the goal. Review monthly. If even the minimum cannot be paid, report a funding failure. With this off, compare the fixed minimum and fixed goal.</p>{policy.enabled&&<details className="mt-4 rounded border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-medium">Advanced payment-policy settings</summary><p className="mt-3 text-xs text-slate-600">These are explicit draft policy assumptions. Current settings: planning real growth {policy.real_discount_percent}%, cushion {policy.buffer_percent}%, ending balance {formatMoney(policy.terminal_real_balance)}, restoration up to {policy.max_monthly_restoration_points} percentage points monthly.</p><fieldset disabled={blocked||loading} className="mt-4 grid gap-5 sm:grid-cols-2">{([
 ['real_discount_percent','Growth above inflation credited to future payments (%)','-20','20','A budgeting discount rate, not another investment return. Higher values can allow larger payments today. 0 credits no positive real growth; assumed losses still count.'],
 ['buffer_percent','Extra funding margin (%)','0','100','A cushion on the remaining payment budget. 10% means requiring about $1.10 for each $1 budgeted.'],
 ['terminal_real_balance','Desired family-support assets left at the cutoff ($)','0',undefined,'In model-start purchasing power. 0 permits spending down this capital; it does not require ending at zero.'],
 ['max_monthly_restoration_points','Maximum monthly increase toward the goal (percentage points)','0','100','Limits restoration after a cut, measured as points of the minimum-to-goal gap. 100 permits immediate restoration.']
 ] as const).map(([key,label,min,max,help])=><label key={key} className="text-sm font-medium">{label}<input className={field} type="number" required min={min} max={max} step="0.01" value={policy[key]} onChange={e=>setPolicy(p=>({...p,[key]:e.target.value}))}/><span className="mt-1 block text-xs font-normal text-slate-600">{help}</span></label>)}</fieldset></details>}</section>:<p className="rounded bg-slate-50 p-4 text-sm text-slate-600">Adult support is off. This scenario schedules college payments only; the remaining trust assets still grow at the long-term investment return.</p>}
    <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={blocked||loading||!request} className="min-h-12 rounded bg-teal-700 px-5 text-sm font-medium text-white disabled:opacity-40">{loading?'Calculating cash flows…':'Calculate funding plan'}</button><button type="button" disabled={blocked||!request||loading} onClick={()=>void saveSettings()} className="min-h-10 rounded border border-slate-300 px-3 text-sm disabled:opacity-40">Save plan settings</button><label className="text-sm">Load saved plan<input type="file" accept="application/json,.json" disabled={session.mode!=='live'||loading} className="ml-2 max-w-60 text-xs" onChange={e=>void loadSettings(e.target.files?.[0])}/></label></div>
    {saveNote&&<p role="status" className="text-sm text-slate-700">{saveNote}</p>}{error&&<p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
   </form>
  </SheetSection>
  <SheetSection id="college-funding" kicker="Built-in priority" title="College is protected before adult support"><p className="text-sm text-slate-700">The college fund is earmarked inside the total trust, not added on top. The model automatically moves money internally to keep remaining college payments protected, then uses the rest for family support. Internal transfers do not change the trust total.</p>{plan&&<p className="mt-4 text-sm text-slate-700">Remaining college allowance at model start: <strong>{formatMoney(plan.college_obligation_model_start_dollars)}</strong>. College assets and long-term investments are model allocations, not necessarily separate bank accounts.</p>}{onOpenCollege&&<button type="button" onClick={onOpenCollege} className="mt-3 text-sm text-teal-800 underline">Review the college payment calendar</button>}<ReserveCalculator session={session}/></SheetSection>
    {result && <>
      <SheetSection id="funding-opening" kicker="5 · Results from one balance" title="Where the opening money goes">
        {stale && <p role="status" className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Inputs changed. Recalculate before using or exporting these results.</p>}
        <div className={stale ? 'opacity-60' : ''}><dl className="grid gap-6 sm:grid-cols-3">{[['Total trust assets',result.opening_allocation.total_trust_assets],['College fund',result.opening_allocation.college_assets],['Long-term family investments',result.opening_allocation.support_assets]].map(([label,value]) => <div key={label}><dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt><dd className="mt-2 text-2xl font-semibold text-navy-900">{formatMoney(value)}</dd></div>)}</dl>
        <p className="mt-5 text-sm text-slate-700">Full opening college requirement: {formatMoney(result.opening_allocation.required_college_reserve)}. Opening college account gap: {formatMoney(result.opening_allocation.college_reserve_gap)}. Model horizon: {formatDate(result.horizon_date)}; last included date: {formatDate(result.last_included_date)}.</p>
        <p className="mt-3 text-sm text-slate-600">Return assumptions used: college {result.calculation_inputs?.college_annual_return_percent??result.inputs.college_annual_return_percent}% and long-term investments {result.calculation_inputs?.support_annual_return_percent??result.inputs.support_annual_return_percent}% annually, before additional expenses. Source: {result.investment_source?'portfolio candidate historical estimates':'manual assumptions'}. Upfront setup and trade expenses included once: {formatMoney(result.opening_allocation.opening_transaction_cost??'0')}.</p>
        {result.college_payments_beyond_horizon > 0 && <p className="mt-3 text-sm text-amber-900">{result.college_payments_beyond_horizon} college payments lie beyond the cutoff and remain part of the reserve requirement.</p>}</div>
      </SheetSection>
      <SheetSection id="funding-results" kicker="Conditional scenario outcomes" title="Can the trust cover the planned payments?">
        <div className={`space-y-7 ${stale ? 'opacity-60' : ''}`}><BalanceChart result={result}/><TableScroll><table className="w-full min-w-[690px]"><caption className="sr-only">Fixed support scenario comparison</caption><thead><tr>{['Path','Result','Last date','Ending nominal assets','Ending purchasing power','First college account gap','First minimum-support breach'].map(h => <th key={h} className={tableHead}>{h}</th>)}</tr></thead><tbody>{Object.values(result.paths).map(p => p && <tr key={p.path}><th className={`${tableCell} text-left`}>{labels[p.path]}</th><td className={tableCell}>{p.status === 'completed_horizon' ? 'Completed scenario horizon' : 'Stopped: payment shortfall'}</td><td className={tableCell}>{formatDate(p.last_date)}</td><td className={tableCell}>{formatMoney(p.ending_total)}</td><td className={tableCell}>{formatMoney(p.ending_total_model_start_dollars)}</td><td className={tableCell}>{p.first_college_reserve_gap_date ? formatDate(p.first_college_reserve_gap_date) : 'Not observed in calculated period'}</td><td className={tableCell}>{p.first_adult_minimum_breach_date ? formatDate(p.first_adult_minimum_breach_date) : 'Not observed in calculated period'}</td></tr>)}</tbody></table></TableScroll>
        <p className="text-sm leading-relaxed text-slate-700">The fixed minimum and goal paths are shown beside the optional adaptive draft policy. The model stops a path when a scheduled payment cannot be made in full, preserving the unpaid amount in the record. The adaptive path reduces only the discretionary minimum-to-goal share under the displayed budget rule; it never silently waives the minimum. A goal-payment shortfall can occur while the minimum is still affordable.</p></div>
      </SheetSection>
      {chosen && <SheetSection id="funding-ledger" kicker="Reconciled cash flows" title="Inspect the balances and payments" aside={<select aria-label="Payment path" className={field} value={chosen.path} onChange={e => setSelectedPath(e.target.value as FundingPath['path'])}>{Object.values(result.paths).map(p => p && <option key={p.path} value={p.path}>{labels[p.path]}</option>)}</select>}>
        <div className={`space-y-5 ${stale ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap gap-2"><Badge tone="teal">Ledger reconciles</Badge><Badge>{labels[chosen.path]}</Badge></div>
          {chosen.first_payment_shortfall && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">First scheduled-payment shortfall: {formatDate(chosen.first_payment_shortfall.date)}. College unpaid: {formatMoney(chosen.first_payment_shortfall.college_unpaid)}; adult unpaid: {formatMoney(chosen.first_payment_shortfall.adult_unpaid)}. Of this, minimum adult support unpaid: {formatMoney(chosen.first_payment_shortfall.minimum_support_unpaid)}.</p>}
          {chosen.first_college_reserve_gap_date && <p className="text-sm text-amber-900">A college account gap was observed on {formatDate(chosen.first_college_reserve_gap_date)}. This identifies the designated account&apos;s coverage, separately from an actual missed payment.</p>}
          <p className="text-sm text-slate-700">College paid: {formatMoney(chosen.total_college_payments)} · Adult paid: {formatMoney(chosen.total_adult_payments)} · Costs: {formatMoney(chosen.total_costs)}. College still required at the last date: {formatMoney(chosen.ending_required_college_reserve)}.</p>
          {chosen.path==='adaptive' && <details><summary className="cursor-pointer text-sm font-semibold">Monthly adaptive reviews (latest12)</summary><TableScroll><table className="mt-3 w-full min-w-[650px]"><thead><tr>{['Review date','Share above minimum','Annual support / child (real)','Future minimum budget gap (real)'].map(t=><th className={tableHead} key={t}>{t}</th>)}</tr></thead><tbody>{chosen.adaptive_reviews?.slice(-12).map(r=><tr key={r.date}><td className={tableCell}>{formatDate(r.date)}</td><td className={tableCell}>{(Number(r.goal_gap_share)*100).toFixed(2)}%</td><td className={tableCell}>{formatMoney(r.annual_support_per_child_model_start_dollars)}</td><td className={tableCell}>{formatMoney(r.minimum_budget_gap_real)}</td></tr>)}</tbody></table></TableScroll></details>}
          <Ledger key={`${chosen.path}-${submitted}`} path={chosen}/>
        </div>
      </SheetSection>}
      <SheetSection id="funding-export" kicker="Assumptions and limits" title="Save the complete calculation">
        <button type="button" disabled={blocked || stale || loading || !!error} onClick={download} className="min-h-11 rounded-md bg-navy-900 px-4 text-sm font-medium text-white disabled:opacity-40">Download funding projection JSON</button>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-slate-600">{result.warnings.map(w => <li key={w}>{w}</li>)}</ul>
        <details className="mt-5"><summary className="cursor-pointer text-sm font-medium text-navy-900">Accounting conventions</summary><dl className="mt-4 space-y-3 text-sm text-slate-600">{Object.entries(result.conventions).map(([key,value]) => <div key={key}><dt className="font-semibold text-navy-900">{key.replaceAll('_',' ')}</dt><dd>{value}</dd></div>)}</dl></details>
      </SheetSection>
    </>}
  </Sheet>;
}
