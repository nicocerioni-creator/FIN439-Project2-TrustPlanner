'use client';

import {useEffect,useRef,useState,type FormEvent} from 'react';
import {evaluatePortfolio,getInvestmentData,getPortfolioCases,type PortfolioCasesResult,validateAnalysisPlan,estimatePortfolio,type InvestmentContext,type PortfolioSelection,type PortfolioEstimateResult,type FundingRequest,type PortfolioSettings,type StressSettings,type EvaluationResult,type EvaluationRequest} from '@/lib/api';
import {formatDate,formatMoney} from '@/lib/format';
import {Badge,Sheet,SheetSection,TableScroll,tableCell,tableHead} from './primitives';
import type {PlanSession,PortfolioRecord} from './types';
import {PortfolioGrowth} from './portfolio-growth';
import {PortfolioSensitivity} from './portfolio-sensitivity';
import {PortfolioCases} from './portfolio-cases';
import {adjustPortfolioWeight} from '@/lib/portfolio-weights';

const ticks=['VOO','QQQ','SCHD','PAVE','XLE','XLV','SGOV'];
const field='mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-900';
const initial:PortfolioSettings={allocation_style:'balanced_growth',max_growth_fund_weight_percent:'40',proposed_weights:Object.fromEntries(ticks.map(t=>[t,t==='SGOV'?'100':'0'])),decision_date:'',estimation_months:36,max_data_age_days:60,
 current_weights:Object.fromEntries(ticks.map(t=>[t,t==='SGOV'?'100':'0'])),initial_allocation:true,
 turnover_used_percent:'0',volatility_limit_percent:'25',turnover_limit_percent:'33',max_fund_weight_percent:'100',
 risk_off_equity_cap_percent:'40',return_target_percent:'10',transaction_cost_bps:'0',pilot_max_percent:'0',
 confirm_reserve_proxy:true,price_csv:null,source_available_on:null,confirm_uploaded_provenance:false};
const initialStress:StressSettings={short_window_months:12,long_window_months:60,trade_cost_increase_bps:'25',tighter_volatility_percent:'10',tighter_fund_cap_percent:'60',enabled:true,support_loss_percent:'-35',college_loss_percent:'-1',
 inflation_increase_points:'2',return_reduction_points:'3',cost_increase_points:'0.5',longevity_extension_years:10};

export function PortfolioView({session,funding,onApplyFunding,onOpenFunding,context,onSelectPortfolio,onEvidenceChange,importAnalysis}:{session:PlanSession;funding:FundingRequest|null;
 onApplyFunding:(v:FundingRequest)=>void;onOpenFunding:()=>void;context?:InvestmentContext|null;onSelectPortfolio?:(v:PortfolioSelection|null)=>void;onEvidenceChange?:(v:PortfolioRecord)=>void;importAnalysis?:EvaluationRequest|null}){
 const [estimate,setEstimate]=useState<PortfolioEstimateResult|null>(null);const [estimateStamp,setEstimateStamp]=useState('');
 const [settings,setSettings]=useState(initial);const [stress,setStress]=useState(initialStress);
 const history=!!funding?.portfolio_source;const [data,setData]=useState<Awaited<ReturnType<typeof getInvestmentData>>|null>(null);
 const [result,setResult]=useState<EvaluationResult|null>(null);const [submitted,setSubmitted]=useState('');
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [note,setNote]=useState('');
 const [calculatedAt,setCalculatedAt]=useState<string|null>(null);
 const requestId=useRef(0);const stamp=JSON.stringify([funding,settings,stress,history]);
 const ctx=context??(funding?{payment_inputs:funding.payment_inputs,opening_balance:funding.opening_balance,opening_transaction_cost:funding.opening_transaction_cost??'0'}:null);
 const estimateKey=JSON.stringify([ctx,settings]);const latestEstimateKey=useRef(estimateKey);latestEstimateKey.current=estimateKey;
 const blocked=session.mode!=='live'||!ctx||session.stale||session.loading||!!session.error;
 const stale=stamp!==submitted||session.stale;
 useEffect(()=>{if(estimate&&estimateStamp!==estimateKey)onSelectPortfolio?.(null);},[estimateKey,estimateStamp,onSelectPortfolio]);
 useEffect(()=>{onEvidenceChange?.({settings,result,current:!!result&&!stale&&!blocked&&!loading&&!error,loading,error,calculatedAt,request:funding&&!blocked?{funding,portfolio:settings,stress,use_historical_proxy_returns:history}:null,estimateCurrent:!!estimate&&estimateStamp===estimateKey&&!blocked&&!loading&&!error});},[result,stale,blocked,loading,error,calculatedAt,stamp,estimate,estimateStamp,estimateKey,onEvidenceChange]);
 useEffect(()=>{if(importAnalysis){setSettings({...importAnalysis.portfolio,confirm_reserve_proxy:true,max_growth_fund_weight_percent:importAnalysis.portfolio.allocation_style==='custom'?'100':importAnalysis.portfolio.max_growth_fund_weight_percent??'40'});setStress(importAnalysis.stress);}},[importAnalysis]);
 async function calculateEstimates(){if(blocked||!ctx)return;const id=++requestId.current;const snapshot=estimateKey;setLoading(true);setError('');
  try{const value=await estimatePortfolio({...ctx,portfolio:settings});if(id===requestId.current&&latestEstimateKey.current===snapshot){setEstimate(value);setEstimateStamp(snapshot);onSelectPortfolio?.(value.candidate?{contextKey:JSON.stringify(ctx),settings,estimate:value}:null);setNote(value.candidate?'Portfolio estimates are linked to Funding. Review them before projecting payments.':'No usable candidate. Review the data-admission message and constraints.');}}
  catch(err){if(id===requestId.current)setError(err instanceof Error?err.message:'Portfolio estimation failed.');}finally{if(id===requestId.current)setLoading(false);}}
 useEffect(()=>{if(session.mode==='live')void getInvestmentData().then(setData).catch(()=>setError('Could not load the saved market-data description. Check the Python service.'));},[session.mode]);
 useEffect(()=>()=>{requestId.current++;},[]);
 function set<K extends keyof PortfolioSettings>(key:K,value:PortfolioSettings[K]){setSettings(old=>({...old,[key]:value}));}
 async function calculate(event:FormEvent){event.preventDefault();if(blocked)return;if(!funding){await calculateEstimates();return;}const id=++requestId.current;const snapshot=stamp;
  setLoading(true);setError('');try{const value=await evaluatePortfolio({funding,portfolio:settings,stress,use_historical_proxy_returns:history});
   if(id===requestId.current){setResult(value);setSubmitted(snapshot);setCalculatedAt(new Date().toISOString());}}
  catch(err){if(id===requestId.current)setError(err instanceof Error?err.message:'Analysis failed.');}
  finally{if(id===requestId.current)setLoading(false);}}
 function download(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function savePlan(){if(!funding)return;try{const saved=await validateAnalysisPlan({funding,portfolio:settings,stress,use_historical_proxy_returns:history});download({kind:'trust-planner-analysis-settings',version:1,analysis:saved.inputs},'trust_analysis_settings.json');setNote('Validated analysis settings saved.');}catch(err){setNote(err instanceof Error?err.message:'Complete the required settings before saving.');}}
 async function loadPlan(file:File|undefined){if(!file)return;if(file.size>10000000){setNote('Choose a JSON plan smaller than10MB.');return;}
  try{const raw=JSON.parse(await file.text());const restored=raw.kind==='trust-planner-analysis-settings'?raw.analysis:raw.inputs;
   const canonical=await validateAnalysisPlan({...restored,funding:{...restored?.funding,reserve_transfer_rule:'protect_before_payments',include_horizon_day_payments:true,initial_college_shock_percent:'0',initial_support_shock_percent:'0'}});
   if(!session.onImportPaymentPlan)throw new Error('Import unavailable in this preview.');
   await session.onImportPaymentPlan(canonical.inputs.funding.payment_inputs);onApplyFunding(canonical.inputs.funding);
   setSettings({...canonical.inputs.portfolio,confirm_reserve_proxy:true,max_growth_fund_weight_percent:canonical.inputs.portfolio.allocation_style==='custom'?'100':canonical.inputs.portfolio.allocation_style==='target_return'?canonical.inputs.portfolio.max_growth_fund_weight_percent??'40':'40'});setStress(canonical.inputs.stress);customDraft.current=canonical.inputs.portfolio.proposed_weights??null;
   setNote('Full analysis settings restored with college-first protection and the 80th birthday included. Opening loss scenarios are managed in the stress settings. Return-source selection follows Funding. Standard cases use their fixed concentration cap; Custom allows any weight subject to hard limits. Calculate again to refresh results.');setError('');
  }catch(err){setNote(err instanceof Error?err.message:'Could not restore these settings.');}}
 async function uploadPrices(file:File|undefined){if(!file)return;if(file.size>500000){setNote('Price CSV must be smaller than500KB.');return;}
  set('price_csv',await file.text());set('confirm_uploaded_provenance',false);setNote('Uploaded price panel is in page memory only. Enter its availability date and confirm provenance.');}
 const [previewRetry,setPreviewRetry]=useState(0);
 const [caseSnapshot,setCaseSnapshot]=useState<{key:string;value:PortfolioCasesResult}|null>(null);
 const [customSnapshot,setCustomSnapshot]=useState<{key:string;value:PortfolioEstimateResult}|null>(null);
 const [caseError,setCaseError]=useState<{key:string;message:string}|null>(null);
 const [customError,setCustomError]=useState<{key:string;message:string}|null>(null);
 const caseSettings:PortfolioSettings={...settings,allocation_style:'balanced_growth',max_growth_fund_weight_percent:'40',proposed_weights:null};
 const caseKey=JSON.stringify([ctx,caseSettings]);
 const previewReady=!blocked&&!!settings.decision_date;
 const custom=settings.allocation_style==='custom';
 const validCustom=!!settings.proposed_weights&&ticks.every(t=>Number.isFinite(Number(settings.proposed_weights![t]))&&Number(settings.proposed_weights![t])>=0)&&Math.abs(Object.values(settings.proposed_weights).reduce((a,b)=>a+Number(b),0)-100)<0.00001;
 useEffect(()=>{if(!previewReady||!ctx)return;let active=true;const timer=setTimeout(()=>{
  void getPortfolioCases({...ctx,portfolio:caseSettings}).then(value=>{if(active){setCaseSnapshot({key:caseKey,value});setCaseError(null);}}).catch(err=>{if(active)setCaseError({key:caseKey,message:err instanceof Error?err.message:'Case preview failed.'});});
 },200);return()=>{active=false;clearTimeout(timer);};},[caseKey,previewReady,previewRetry]);
 useEffect(()=>{if(!previewReady||!ctx||!custom||!validCustom)return;let active=true;const timer=setTimeout(()=>{
  void estimatePortfolio({...ctx,portfolio:settings}).then(value=>{if(active){setCustomSnapshot({key:estimateKey,value});setCustomError(null);}}).catch(err=>{if(active)setCustomError({key:estimateKey,message:err instanceof Error?err.message:'Custom preview failed.'});});
 },120);return()=>{active=false;clearTimeout(timer);};},[estimateKey,previewReady,custom,validCustom,previewRetry]);
 const shownCases=previewReady&&caseSnapshot?.key===caseKey?caseSnapshot.value:null;
 const preview=custom?(previewReady&&customSnapshot?.key===estimateKey?customSnapshot.value:null):shownCases?.cases[settings.allocation_style??'balanced_growth']??null;
 const previewError=(custom&&!validCustom?'Custom weights must total100%.':custom&&customError?.key===estimateKey?customError.message:caseError?.key===caseKey?caseError.message:'');
 const previewPending=previewReady&&!previewError&&(custom?!preview:!shownCases);
 const customDraft=useRef<Record<string,string>|null>(null);
 function chooseCase(style:PortfolioSettings['allocation_style']){if(style===settings.allocation_style)return;
  const seed=customDraft.current??(preview?.candidate?Object.fromEntries(ticks.map(t=>[t,preview.candidate!.weights[t].toFixed(2)])):settings.proposed_weights);
  setSettings(old=>({...old,allocation_style:style,max_growth_fund_weight_percent:style==='custom'?'100':'40',confirm_reserve_proxy:true,...(style==='custom'?{proposed_weights:seed}:{} )}));
 }
 function changeWeight(ticker:string,value:string){const next=adjustPortfolioWeight(settings.proposed_weights??{},ticker,value);customDraft.current=next;set('proposed_weights',next);}
 const card=result?.data_card;
 return <Sheet>
  <SheetSection id="portfolio-inputs" kicker="Draft research settings" title="Choose how the long-term money is invested">
   <p className="mb-5 max-w-3xl text-sm leading-relaxed text-slate-700">Set aside the college obligation first, then choose a risk style for the remaining investments. Compare the proposed allocation with equal-weight, inverse-volatility and VOO benchmark baselines. Historical estimates help compare choices; they do not predict future returns.</p>
   {blocked&&<div className="mb-5 rounded bg-amber-50 p-3 text-sm text-amber-900">Update your family and enter an opening balance in Funding. Portfolio estimation does not require return assumptions or a funding projection. <button type="button" className="underline" onClick={onOpenFunding}>Open funding assumptions</button></div>}
   <form onSubmit={calculate} className="space-y-5">
    <fieldset disabled={blocked||loading} className="space-y-5 disabled:opacity-60">
     <PortfolioCases settings={settings} cases={shownCases} preview={preview} pending={previewPending} error={previewError} onChoose={chooseCase} onWeight={changeWeight} onRetry={()=>{setCaseError(null);setCustomError(null);setPreviewRetry(v=>v+1);}}/>
     <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm">Investment decision date<input type="date" required className={field} max={data?.today_eastern} value={settings.decision_date} onChange={e=>set('decision_date',e.target.value)}/>{data&&<button type="button" onClick={()=>set('decision_date',data.today_eastern)} className="mt-1 text-xs text-teal-800 underline">Use today</button>}</label>
      <label className="text-sm">Estimation window (monthly returns)<input type="number" required min="12" max="120" className={field} value={settings.estimation_months} onChange={e=>set('estimation_months',Number(e.target.value))}/></label>
      <label className="text-sm">Maximum data age (calendar days)<input type="number" required min="1" max="365" className={field} value={settings.max_data_age_days} onChange={e=>set('max_data_age_days',Number(e.target.value))}/></label>
     </div>
     <p className="text-xs text-slate-600">Bundled panel: September2021–September2026, captured October22,2026. It can only support a forward decision after capture and before the chosen staleness limit. A decision after model start is quarantined.</p>
     <details className="rounded border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-medium">Starting holdings, trading costs and hard limits</summary>
      <p className="my-3 text-xs text-slate-600">Starting holdings describe what you own before this decision. The100% SGOV row is only an editable parking placeholder, never the recommended target. If this is an existing portfolio, enter its actual weights and uncheck initial funding. Proposed weights appear in the results below.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{ticks.map(t=><label key={t} className="text-sm">{t} current weight (%)<input type="number" min="0" max="100" step="0.01" required className={field} value={settings.current_weights[t]} onChange={e=>set('current_weights',{...settings.current_weights,[t]:e.target.value})}/></label>)}</div>
      <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" checked={settings.initial_allocation} onChange={e=>set('initial_allocation',e.target.checked)}/>Initial funding: exclude opening allocation from the turnover budget</label>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{([
       ['turnover_used_percent','Annual turnover already used (%)','0','100'],['volatility_limit_percent','Annualized volatility limit (%)','0.01','25'],
       ['turnover_limit_percent','Annual turnover budget (%)','0','33'],['max_fund_weight_percent','Maximum single-fund weight (%)','1','100'],
       ['risk_off_equity_cap_percent','Equity cap when VOO trend is nonpositive (%)','0','100'],['return_target_percent','Nominal return objective (%)','-50','100'],
       ['transaction_cost_bps','One-way transaction costs (basis points)','0','1000'],['pilot_max_percent','Maximum proposed pilot / support capital (%)','0','100']
      ] as const).map(([key,label,min,max])=><label key={key} className="text-sm">{label}<input type="number" required step="0.01" min={min} max={max} className={field} value={settings[key]} onChange={e=>set(key,e.target.value)}/></label>)}</div>
     </details>
     <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600"><p><strong>College backing:</strong> this model uses SGOV as its short-term Treasury proxy. It does not guarantee inflation protection or payment-date matching.</p><p className="mt-2"><strong>Funding return source:</strong> {history?"historical portfolio estimates, as selected in Funding.":funding?"your manual assumptions selected in Funding.":"choose historical estimates or your own assumptions in Funding; this page follows that selection for cash-flow and stress calculations."} ETF operating expenses are embedded in the price history; enter only additional expenses. <button type="button" className="underline" onClick={onOpenFunding}>Review return source in Funding</button></p></div>
     <details className="rounded border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-medium">Stress assumptions (editable draft cases)</summary>
      <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={stress.enabled} onChange={e=>setStress(s=>({...s,enabled:e.target.checked}))}/>Run the robustness scenarios</label>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{([
       ['support_loss_percent','Immediate support-asset loss (%)','-99.99','0'],['college_loss_percent','Immediate college-asset loss (%)','-99.99','0'],
       ['inflation_increase_points','Persistent CPI increase (percentage points)','0','20'],['return_reduction_points','Persistent return reduction (percentage points)','0','30'],
       ['cost_increase_points','Additional annual costs (percentage points)','0','20'],['longevity_extension_years','Longer-life extension (years)','0','20']
      ] as const).map(([key,label,min,max])=><label key={key} className="text-sm">{label}<input type="number" min={min} max={max} step={key==='longevity_extension_years'?'1':'0.01'} className={field} value={stress[key]} onChange={e=>setStress(s=>({...s,[key]:key==='longevity_extension_years'?Number(e.target.value):e.target.value}))}/></label>)}</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{([
       ['short_window_months','Short estimation window (months)','12','120'],['long_window_months','Long estimation window (months)','12','120'],
       ['trade_cost_increase_bps','Extra opening trading costs (basis points)','0','1000'],['tighter_volatility_percent','Tighter volatility ceiling (%)','0.01','25'],['tighter_fund_cap_percent','Tighter whole-trust single-fund cap (%)','0.01','100']
      ] as const).map(([key,label,min,max])=><label key={key} className="text-sm">{label}<input type="number" min={min} max={max} step={key.endsWith('_months')?'1':'0.01'} value={stress[key]??initialStress[key]} className={field} onChange={e=>setStress(s=>({...s,[key]:key.endsWith('_months')?Number(e.target.value):e.target.value}))}/></label>)}</div>
      <p className="mt-3 text-xs text-slate-600">These are selected adverse cases, not probabilities or predictions. The combined case applies the losses, inflation, lower returns and costs together.</p>
     </details>
    </fieldset>
    <details className="rounded border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-medium">Use an updated monthly price CSV</summary>
     <p className="my-3 text-xs text-slate-600">Header: Date,VOO,QQQ,SCHD,PAVE,XLE,XLV,SGOV. Consecutive monthly adjusted closing prices;13–1200 complete rows. Missing values are rejected.</p>
     <input type="file" accept=".csv,text/csv" disabled={session.mode!=='live'} onChange={e=>void uploadPrices(e.target.files?.[0])} className="text-sm"/>
     {settings.price_csv&&<div className="mt-3 space-y-3"><label className="block text-sm">Snapshot availability date<input type="date" className={field} value={settings.source_available_on??''} onChange={e=>set('source_available_on',e.target.value||null)}/></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={settings.confirm_uploaded_provenance} onChange={e=>set('confirm_uploaded_provenance',e.target.checked)}/>I checked the source, adjusted-price basis and availability date. This assertion is recorded, not independently verified.</label><button type="button" className="text-sm underline" onClick={()=>{set('price_csv',null);set('source_available_on',null);}}>Use bundled panel again</button></div>}
    </details>
    <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={blocked||loading} className="min-h-12 rounded bg-teal-700 px-5 text-sm font-medium text-white disabled:opacity-40">{loading?'Calculating portfolios and stress cases…':funding?'Evaluate portfolios and stress':'Estimate portfolio returns'}</button>
     <button type="button" disabled={blocked||loading} onClick={()=>void calculateEstimates()} className="min-h-10 rounded border border-slate-300 px-3 text-sm disabled:opacity-40">Estimate and link returns to Funding</button>
     <button type="button" disabled={blocked||!funding} className="min-h-10 rounded border border-slate-300 px-3 text-sm disabled:opacity-40" onClick={()=>void savePlan()}>Save analysis settings</button>
     <label className="text-sm">Load saved analysis<input type="file" accept=".json,application/json" disabled={session.mode!=='live'} className="ml-2 max-w-60 text-xs" onChange={e=>void loadPlan(e.target.files?.[0])}/></label></div>
    {note&&<p role="status" className="text-sm text-slate-700">{note}</p>}{error&&<p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
   </form>
  </SheetSection>
  {estimate?.candidate&&estimateStamp===estimateKey&&ctx&&<SheetSection id="proposed-allocation" kicker="Proposed allocation · not starting holdings" title={estimate.candidate.allocation_label??'Constrained allocation'}>
   <div className="grid gap-4 sm:grid-cols-3">{([['Historical CAGR',`${estimate.candidate.historical_constant_mix_cagr_percent.toFixed(2)}%`],['Historical volatility',`${estimate.candidate.annualized_sample_volatility_percent.toFixed(2)}%`],['Historical Sharpe proxy',estimate.candidate.historical_sharpe_proxy?.toFixed(2)??'Undefined']] as const).map(([label,value])=><div className="rounded-xl border border-slate-200 p-4" key={label}><p className="text-xs text-slate-600">{label}</p><p className="mt-2 text-3xl font-semibold text-navy-900">{value}</p></div>)}</div>
   <div className="mt-5 space-y-3">{ticks.filter(t=>estimate.candidate!.weights[t]>0.001).map(t=><div key={t} className="grid grid-cols-[60px_1fr_65px] items-center gap-3 text-sm"><span className="font-semibold">{t}</span><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className={t==='SGOV'?'h-full rounded-full bg-slate-500':'h-full rounded-full bg-teal-600'} style={{width:`${estimate.candidate!.weights[t]}%`}}/></div><span className="text-right">{estimate.candidate!.weights[t].toFixed(1)}%</span></div>)}</div>
   <p className="my-5 text-xs leading-relaxed text-slate-600">{estimate.search_rule} Sharpe uses annualized historical arithmetic return minus SGOV's historical arithmetic return, divided by total annualized volatility. SGOV is a proxy for cash returns. This is an in-sample comparison; it can overfit. The10% objective is reported separately and does not override risk limits.</p>
   <PortfolioGrowth context={ctx} settings={settings} blocked={blocked||loading}/>
  </SheetSection>}
  {estimate&&<SheetSection id="portfolio-return-estimates" kicker="Historical estimates for Funding" title={estimate.candidate?'College and long-term investment returns':'Portfolio estimate unavailable'}>
   {estimateStamp!==estimateKey?<p className="text-sm text-amber-900">Portfolio settings or opening assets changed. Estimate again before using these values.</p>:estimate.candidate?<div className="space-y-4 text-sm text-slate-700"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="font-semibold">College fund · SGOV proxy</dt><dd>{estimate.candidate.college_scenario_return_percent.toFixed(2)}% annual historical CAGR · {formatMoney(estimate.candidate.college_model_assets??0)} earmarked</dd></div><div><dt className="font-semibold">Long-term family-support investments</dt><dd>{estimate.candidate.support_scenario_return_percent?.toFixed(2)}% annual historical CAGR · {formatMoney(estimate.candidate.support_model_assets??0)} remaining</dd></div></dl><p>Historical estimates are linked to the selected weights and estimation period. They are assumptions for forward planning, not guaranteed or known future returns. College is removed before calculating the remaining portfolio's return.</p><p className="text-xs">Data admission: {String(estimate.data_card.admission)}. Latest price: {String(estimate.data_card.last_price_date)}. Estimation window: {String(estimate.data_card.estimation_months)} months.</p><p>Long-term weights: {Object.entries(estimate.candidate.support_weights??{}).filter(([,w])=>w>0.001).map(([t,w])=>`${t} ${w.toFixed(1)}%`).join(' · ')||'No remaining assets'}.</p><button type="button" onClick={onOpenFunding} className="min-h-10 rounded bg-teal-700 px-4 text-sm text-white">Review linked returns in Funding</button></div>:<ul className="list-disc pl-5 text-sm text-amber-900">{((estimate.data_card.reasons as string[]|undefined)??['No candidate satisfies the selected constraints.']).map(v=><li key={v}>{v}</li>)}</ul>}
  </SheetSection>}
  {result&&<>
   <SheetSection id="data-card" kicker="Point-in-time boundary" title="Data admission and investment signal">
    {stale&&<p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">Settings changed. Recalculate before using or exporting these results.</p>}
    <div className={stale?'opacity-60':''}><Badge tone={result.status==='data_quarantine'?'amber':'teal'}>{String(card?.admission)}</Badge><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{['source','snapshot_available_on','decision_date','last_price_date','data_age_days','signal_start_price_date','signal_end_price_date','signal_12_month_return_percent','signal_regime'].map(k=><div key={k}><dt className="font-semibold text-navy-900">{k.replaceAll('_',' ')}</dt><dd>{String(card?.[k]??'Not calculated')}</dd></div>)}</dl>
    <p className="mt-4 text-sm text-slate-600">{String(card?.signal)}</p><p className="mt-2 text-xs text-slate-600">{String(card?.revision_limit)}</p>
    {(card?.reasons as string[]|undefined)?.length ? <ul className="mt-3 list-disc pl-5 text-sm text-rose-900">{(card?.reasons as string[]).map(v=><li key={v}>{v}</li>)}</ul>:null}</div>
   </SheetSection>
   {result.portfolios.length>0&&<SheetSection id="portfolio-comparison" kicker="Same data and constraints" title="Baseline and constrained comparisons">
    <div className={stale?'opacity-60':''}><TableScroll><table className="w-full min-w-[1050px]"><thead><tr>{['Portfolio','Arithmetic return estimate','Historical CAGR','Annualized volatility','Annual turnover budget','Checks','Return objective','Funding'].map(h=><th className={tableHead} key={h}>{h}</th>)}</tr></thead><tbody>{result.portfolios.map(p=><tr key={p.name}><th className={`${tableCell} text-left`}>{p.name}</th><td className={tableCell}>{p.historical_arithmetic_return_percent.toFixed(2)}%</td><td className={tableCell}>{p.historical_constant_mix_cagr_percent.toFixed(2)}%</td><td className={tableCell}>{p.annualized_sample_volatility_percent.toFixed(2)}%</td><td className={tableCell}>{p.annual_turnover_total_percent.toFixed(2)}%</td><td className={tableCell}>{p.hard_checks_pass?'All modelled checks pass':`Fail: ${p.failed_rules.join(', ')}`}</td><td className={tableCell}>{p.return_objective_met?'Estimate meets target':'Estimate below target'}</td><td className={tableCell}>{p.funding_summary?Object.entries(p.funding_summary).map(([name,v])=><p key={name}>{name}: {v.status}</p>):p.funding_note}</td></tr>)}</tbody></table></TableScroll>
    <TableScroll><table className="mt-6 w-full min-w-[760px]"><thead><tr><th className={tableHead}>Target weights</th>{ticks.map(t=><th className={tableHead} key={t}>{t}</th>)}</tr></thead><tbody>{result.portfolios.map(p=><tr key={p.name}><th className={`${tableCell} text-left`}>{p.name}</th>{ticks.map(t=><td key={t} className={tableCell}>{p.weights[t].toFixed(2)}%</td>)}</tr>)}</tbody></table></TableScroll>
    <p className="mt-4 text-xs text-slate-600">{result.search_rule} Examined {result.grid_combinations_examined} grid combinations. Passing modelled checks is conditional and does not establish future mandate compliance.</p>
    {result.candidate_funding_inputs&&<button type="button" disabled={stale||loading||!!error} className="mt-4 min-h-10 rounded border border-slate-300 px-3 text-sm disabled:opacity-40" onClick={()=>{onApplyFunding(result.candidate_funding_inputs!);onOpenFunding();}}>Inspect candidate in Funding &amp; cash flows</button>}</div>
   </SheetSection>}
   {result.stress_tests.length>0&&<SheetSection id="stress-results" kicker="Selected adverse assumptions" title="Funding stress outcomes"><div className={stale?'opacity-60':''}><TableScroll><table className="w-full min-w-[800px]"><thead><tr>{['Case','Path','Result','First payment shortfall','Minimum breach','Ending purchasing power'].map(h=><th className={tableHead} key={h}>{h}</th>)}</tr></thead><tbody>{result.stress_tests.flatMap(t=>t.paths?Object.entries(t.paths).map(([name,p])=><tr key={`${t.name}-${name}`}><th className={`${tableCell} text-left`}>{t.name}</th><td className={tableCell}>{name}</td><td className={tableCell}>{p.status}</td><td className={tableCell}>{p.first_payment_shortfall?formatDate(p.first_payment_shortfall.date):'Not observed before cutoff/stop'}</td><td className={tableCell}>{p.first_adult_minimum_breach_date?formatDate(p.first_adult_minimum_breach_date):'Not observed before cutoff/stop'}</td><td className={tableCell}>{formatMoney(p.ending_total_model_start_dollars??'0')}</td></tr>):[<tr key={t.name}><th className={tableCell}>{t.name}</th><td colSpan={5} className={tableCell}>{t.reason??t.status}</td></tr>])}</tbody></table></TableScroll></div></SheetSection>}
   <PortfolioSensitivity result={result} stale={stale}/>
   <SheetSection id="committee-review" kicker="Draft decision support" title={result.recommendation.action}><div className={`space-y-4 ${stale?'opacity-60':''}`}>
    {result.recommendation.allocation_range_percent_of_support_capital&&<p className="text-sm">Proposed pilot range: {result.recommendation.allocation_range_percent_of_support_capital.join('–')}% of support capital, subject to committee approval; no transaction is executed.</p>}
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{result.recommendation.conditions?.map(v=><li key={v}>{v}</li>)}</ul><p className="text-sm text-slate-700">{result.recommendation.committee_ask}</p>
    <p className="text-sm font-semibold">Stop / reversal triggers</p><ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{result.recommendation.reversal_triggers?.map(v=><li key={v}>{v}</li>)}</ul>
    <button type="button" disabled={blocked||stale||loading||!!error} className="min-h-11 rounded bg-navy-900 px-4 text-sm font-medium text-white disabled:opacity-40" onClick={()=>download(result,'portfolio_funding_analysis.json')}>Download complete analysis JSON</button>
    <details><summary className="cursor-pointer text-sm font-medium">Definitions, limitations and source audit</summary><dl className="mt-3 space-y-3 text-sm text-slate-600">{Object.entries(result.risk_definitions??{}).map(([k,v])=><div key={k}><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>)}</dl><ul className="mt-4 list-disc pl-5 text-sm text-slate-600">{result.limitations?.map(v=><li key={v}>{v}</li>)}</ul><p className="mt-3 break-all text-xs text-slate-600">Snapshot SHA256: {String(card?.sha256)}</p></details>
    <p className="text-xs text-slate-600">The separate locked changed-input record still requires the student&apos;s own prediction committed before its designated run. This panel does not author that prediction or perform that designated experiment.</p>
   </div></SheetSection>
  </>}
 </Sheet>;
}
