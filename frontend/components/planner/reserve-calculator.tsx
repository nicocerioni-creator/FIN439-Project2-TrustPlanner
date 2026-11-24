'use client';

import {useRef,useState} from 'react';
import {calculateCollegeReserve,type ReserveResult} from '@/lib/api';
import {formatDate,formatMoney} from '@/lib/format';
import type {PlanSession} from './types';

/** Optional published-inflation audit. Forward funding uses its own explicit scenario. */
export function ReserveCalculator({session}:{session:PlanSession}) {
 const [result,setResult]=useState<ReserveResult|null>(null);const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');const [submitted,setSubmitted]=useState('');const requestId=useRef(0);
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const today=`${parts.year}-${parts.month}-${parts.day}`;const plan=session.result;const start=plan?.inputs.model_start_date;
 const stamp=JSON.stringify([plan?.inputs,today]);
 const unavailable=session.mode!=='live'?'Published inflation lookup is disabled in the design preview.':
  !start?'Choose and update a model start date first.':start>today?'Your model starts in the future. Published inflation for that start is not available yet; use the scenario inflation assumption above.':
  start<'1913-02-01'?'Published CPI history cannot cover this model start. The scenario above can still use your inflation assumption.':
  session.stale||session.loading||session.error?'Update Family & payments successfully first.':'';
 const current=!!result&&submitted===stamp&&!unavailable&&!error;
 async function calculate(){if(unavailable||!plan)return;const id=++requestId.current;setLoading(true);setError('');const snapshot=stamp;
  try{const value=await calculateCollegeReserve({payment_inputs:plan.inputs,valuation_date:today,reserve_assets:null,future_cpi_annual_percent:null});
   if(id===requestId.current){setResult(value);setSubmitted(snapshot);}}
  catch(err){if(id===requestId.current)setError(err instanceof Error?err.message:'Published inflation is unavailable. Retry later.');}
  finally{if(id===requestId.current)setLoading(false);}}
 function download(){if(!current||loading||!result)return;const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='college_reserve.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
  <summary className="cursor-pointer text-sm font-semibold text-navy-900">Optional: check published inflation as of today</summary>
  <p className="mt-3 text-sm leading-relaxed text-slate-600">This historical check translates remaining allowances into purchasing power as of {formatDate(today)}, using published CPI-U. Today is selected automatically. It does not change your forward Funding scenario or its opening assets.</p>
  {unavailable?<p className="mt-3 text-sm text-slate-600">{unavailable}</p>:<button type="button" disabled={loading} onClick={()=>void calculate()} className="mt-4 min-h-10 rounded border border-slate-300 bg-white px-3 text-sm disabled:opacity-40">{loading?'Checking published inflation…':'Check inflation-adjusted college requirement'}</button>}
  {error&&<p role="alert" className="mt-3 text-sm text-rose-900">{error}</p>}
  {current&&<div className="mt-4 space-y-3 text-sm text-slate-700"><p>Remaining college allowance at today&apos;s purchasing power: <strong>{formatMoney(result!.required_reserve_valuation_dollars)}</strong> across {result!.remaining_semesters} semesters.</p><p className="text-xs">This includes inflation already published since model start. Future inflation and investment growth are handled in the scenario above; this figure is not a guarantee of future funding.</p><details><summary className="cursor-pointer">CPI source details</summary><p className="mt-2 text-xs">Baseline index {result!.cpi.baseline.index_value}; effective index {result!.cpi.effective.index_value}. Monthly reset reference {formatDate(result!.effective_cpi_reference_date)}; prior-day publication cutoff {formatDate(result!.cpi.effective.requested_cutoff)}.</p></details><button type="button" disabled={loading} onClick={download} className="min-h-10 rounded border border-slate-300 px-3 text-sm">Download published CPI record</button></div>}
 </details>;
}
