'use client';

import {useEffect,useRef,useState,type FormEvent} from 'react';
import {calculateCollegePaymentPlan,type CollegePaymentPlan} from '@/lib/api';
import {formatDate,formatMoney,formatYears} from '@/lib/format';
import {summarizeCollegePayments} from '@/lib/college-payment-totals';
import {Badge,Kicker,Sheet,SheetSection,TableScroll,tableCell,tableHead} from './primitives';
import type {PlanSession,CollegeRecord} from './types';

export type InflationSetting = {value:string;onChange:(value:string)=>void};

export function ReserveView({session,inflation,onOpenFunding,onEvidenceChange}:{session:PlanSession;inflation:InflationSetting;onOpenFunding:()=>void;onEvidenceChange?:(v:CollegeRecord)=>void}) {
 const [calculation,setCalculation]=useState<{projection:CollegePaymentPlan;stamp:string}|null>(null);
 const projection=calculation?.projection??null;const submitted=calculation?.stamp??'';const [loading,setLoading]=useState(false);const [error,setError]=useState('');
 const [updatingFamily,setUpdatingFamily]=useState(false);const [refreshNonce,setRefreshNonce]=useState(0);
 const [calculatedAt,setCalculatedAt]=useState<string|null>(null);
 const [page,setPage]=useState(0);const requestId=useRef(0);const debounce=useRef<ReturnType<typeof setTimeout>|null>(null);const plan=session.result;
 const draft=session.input??plan?.inputs;
 const stamp=JSON.stringify([plan?.inputs,inflation.value]);
 const blocked=session.mode!=='live'||session.stale||session.loading||!!session.error||!plan?.inputs.model_start_date;
 const validInflation=inflation.value.trim()!==''&&Number.isFinite(Number(inflation.value))&&Number(inflation.value)>=-50&&Number(inflation.value)<=100;
 const canUpdate=!blocked&&validInflation;
 const canSubmit=session.mode==='live'&&!session.loading&&!loading&&!updatingFamily&&validInflation&&!!draft?.model_start_date&&(!blocked||!!session.onRefreshPaymentPlan);
 const current=!!projection&&submitted===stamp&&!blocked&&!loading&&!updatingFamily&&!error;
 useEffect(()=>{onEvidenceChange?.({result:projection,current,loading:loading||updatingFamily,error,calculatedAt});},[projection,current,loading,updatingFamily,error,calculatedAt,onEvidenceChange]);
 const displayError=error||session.error;
 const unavailableReason=!validInflation?'Enter valid inflation':!draft?.model_start_date?'Choose a model start date':session.loading||updatingFamily?'Updating…':session.stale?'Press Update college payments to apply family edits':session.error?'Retry Update college payments':'Update college payments';
 const pending=updatingFamily||(canUpdate&&!current&&!displayError);
 async function refresh(){if(!canUpdate||!plan)return;
  const id=++requestId.current;const snapshot=stamp;setLoading(true);setError('');
  try{const next=await calculateCollegePaymentPlan(plan.inputs,inflation.value);if(id===requestId.current){setCalculation({projection:next,stamp:snapshot});setCalculatedAt(new Date().toISOString());setPage(0);}}
  catch(err){if(id===requestId.current)setError(err instanceof Error?err.message:'College payment calculation failed.');}
  finally{if(id===requestId.current)setLoading(false);}}
 useEffect(()=>{
  // Changing either page's shared inflation immediately invalidates older replies.
  requestId.current++;setLoading(false);
  if(updatingFamily)return;
  if(!session.error)setError('');
  if(canUpdate)debounce.current=setTimeout(()=>{debounce.current=null;void refresh();},300);
  return()=>{if(debounce.current!==null)clearTimeout(debounce.current);debounce.current=null;requestId.current++;};
 },[stamp,canUpdate,updatingFamily,refreshNonce]);
 async function calculate(e:FormEvent){e.preventDefault();
  if(debounce.current!==null)clearTimeout(debounce.current);debounce.current=null;
  if(!canSubmit)return;
  if(!blocked||!session.onRefreshPaymentPlan){await refresh();return;}
  setUpdatingFamily(true);setError('');
  try{await session.onRefreshPaymentPlan();setRefreshNonce(n=>n+1);}
  catch(err){setError(err instanceof Error?err.message:'Payment plan could not be updated.');}
  finally{setUpdatingFamily(false);}
 }
 function download(){if(!current||blocked||loading||!projection)return;
  const summary=summarizeCollegePayments(projection.payment_dates);
  const exported={...projection,total_nominal_dollars:summary.totalNominalDollars,payment_dates:summary.paymentDates,children:plan!.beneficiaries.map(c=>({child_id:c.child_id,total_nominal_dollars:summary.childTotal(c.child_id)}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(exported,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='college_payment_plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 if(!plan)return <Sheet><SheetSection title="Start with your family" kicker="College overview"><p className="text-sm text-slate-700">Update Family &amp; payments to see the college obligation and each child&apos;s remaining semesters.</p></SheetSection></Sheet>;
 const totals=summarizeCollegePayments(current?projection!.payment_dates:[]);
 const rows=totals.paymentDates;const pages=Math.max(1,Math.ceil(rows.length/12));const activePage=Math.min(page,pages-1);
 return <Sheet>
  <SheetSection kicker="Your college plan" title="Every child's remaining college allowance">
   <div className={`grid gap-7 sm:grid-cols-3 ${session.stale?'opacity-60':''}`}>
    <div className="sm:col-span-3"><Kicker>{current||canUpdate||updatingFamily?'Total projected college payments':'Full college obligation · model-start dollars'}</Kicker><p className="mt-3 font-serif text-5xl tabular-nums text-navy-900 sm:text-6xl">{current?formatMoney(totals.totalNominalDollars):canUpdate||updatingFamily?(displayError?'Unavailable':'Updating…'):formatMoney(plan.college_obligation_model_start_dollars)}</p><p className="mt-3 text-sm text-slate-600">{current?`Nominal dollars on the future payment dates, using ${inflation.value}% annual inflation. An assumed scenario, not a forecast.`:'All remaining allowances through graduation. Enter inflation below to see the dollar amounts expected on each payment date.'}</p></div>
    <div><Kicker>Funded semesters in plan</Kicker><p className="mt-2 font-serif text-3xl text-navy-900">{plan.total_funded_semesters}</p><p className="mt-2 text-xs text-slate-600">Semesters covered by the allowance policy; funding availability is checked in Funding.</p></div>
    <div><Kicker>Adult support</Kicker><p className="mt-2 font-serif text-3xl text-navy-900">{plan.inputs.adult_support_enabled?'On':'Off'}</p><p className="mt-2 text-xs text-slate-600">{plan.inputs.adult_support_enabled?'Monthly, beginning one month after graduation.':'College-only planning; no adult payments.'}</p></div>
    <div><Kicker>Model-start purchasing power</Kicker><p className="mt-2 text-2xl font-semibold text-navy-900">{formatMoney(plan.college_obligation_model_start_dollars)}</p><p className="mt-2 text-xs text-slate-600">The allowance before inflation after model start. College funds come from the total trust balance.</p></div>
   </div>
   {session.stale&&<p className="mt-5 text-sm text-amber-900">Family edits are waiting to be applied. Press Update college payments below to apply them and refresh this page.</p>}
   <button type="button" className="mt-6 min-h-10 rounded border border-slate-300 px-4 text-sm font-medium text-navy-900" onClick={onOpenFunding}>Review college funding and reserve</button>
  </SheetSection>
  <SheetSection kicker="One shared assumption" title="Show payments in future dollars">
   <form onSubmit={calculate} className="flex flex-wrap items-end gap-4"><label className="block text-sm font-medium text-navy-900">Expected annual inflation (CPI, %)<input type="number" min="-50" max="100" step="0.01" required placeholder="Enter an assumption" value={inflation.value} disabled={session.mode!=='live'} onChange={e=>inflation.onChange(e.target.value)} className="mt-2 block h-11 w-64 rounded-md border border-slate-300 px-3"/></label><button type="submit" disabled={!canSubmit} className="min-h-11 rounded bg-teal-700 px-4 text-sm font-medium text-white disabled:opacity-40">{loading||updatingFamily?'Updating college payments…':'Update college payments'}</button></form>
   <p className="mt-3 text-sm text-slate-600">The Update college payments button applies your latest family edits and recalculates this page in one action. Totals and payment amounts update automatically after you edit inflation, including changes made in Funding &amp; cash flows. The per-child totals are summed directly from every payment in the calendar below, across all calendar pages. Inflation changes the future dollar amount needed to preserve the allowance&apos;s purchasing power. It updates monthly from model start. Enter 0 for unchanged prices; negative values reduce payments.</p>
   {!draft?.model_start_date&&<p className="mt-3 text-sm text-amber-900">Choose a model start date in Family &amp; payments so payments can be placed on the calendar.</p>}
   {pending&&<p role="status" className="mt-3 text-sm text-slate-600">Updating future-dollar amounts…</p>}
   {inflation.value!==''&&!validInflation&&<p role="alert" className="mt-3 text-sm text-amber-900">Enter an inflation assumption between -50% and 100%.</p>}
   {displayError&&<p role="alert" className="mt-3 text-sm text-rose-900">{displayError}</p>}
  </SheetSection>
  <SheetSection kicker="Child by child" title="What remains for each child">
   <TableScroll><table key={submitted} data-testid="college-child-totals" className="w-full min-w-[780px]"><thead><tr>{['Child','Years of payments left','Funded semesters','College obligation · future dollars','Model-start dollars'].map(h=><th className={tableHead} key={h}>{h}</th>)}</tr></thead><tbody>{plan.beneficiaries.map(c=><tr key={c.child_id}><th className={`${tableCell} text-left`}>Child {c.child_id}<span className="block text-xs font-normal text-slate-500">Planned degree: {formatYears(c.degree_years)}</span></th><td className={tableCell}>{formatYears(c.remaining_funded_degree_years??'—')}</td><td className={tableCell}>{c.funded_semesters}</td><td data-testid={`college-future-total-${c.child_id}`} className={`${tableCell} font-semibold`}>{current?formatMoney(totals.childTotal(c.child_id)):pending?'Updating…':displayError?'Unavailable':unavailableReason}</td><td className={tableCell}>{formatMoney(c.college_obligation_model_start_dollars)}</td></tr>)}</tbody></table></TableScroll>
   <p className="mt-3 text-xs text-slate-600">Two remaining funded semesters count as one year of payments. This excludes waiting time before college and semesters dated before model start. Every remaining semester through graduation is included, even for a degree longer than four years.</p>
  </SheetSection>
  <SheetSection kicker="Payment calendar" title="Who gets paid, when, and how much" aside={<Badge>{current?`${rows.length} payment dates`:pending?'Updating…':error?'Unavailable':'Inflation assumption needed'}</Badge>}>
   {!current?<p className="text-sm text-slate-600">Enter a valid inflation assumption to automatically show nominal amounts grouped by date. Future payments use your inflation assumption; they are not published future CPI values.</p>:<>
    <TableScroll><table key={submitted} data-testid="college-payment-dates" className="w-full min-w-[660px]"><thead><tr>{['Payment date','Total due · nominal dollars','Children and individual payments'].map(h=><th className={tableHead} key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(activePage*12,activePage*12+12).map(row=><tr key={row.date}><th className={`${tableCell} text-left`}>{formatDate(row.date)}<span className="block text-xs font-normal text-slate-500">{row.date.slice(5,7)==='08'?'Fall semester':'Spring semester'}</span></th><td className={`${tableCell} text-lg font-semibold text-navy-900`}>{formatMoney(row.total_nominal_dollars)}</td><td className={tableCell}><ul className="space-y-1">{row.payments.map(p=><li key={`${p.child_id}-${p.semester}`}>Child {p.child_id} <span className="text-slate-400">·</span> {formatMoney(p.amount_nominal_dollars)}</li>)}</ul></td></tr>)}</tbody></table></TableScroll>
    {!rows.length&&<p className="mt-3 text-sm text-slate-600">No college payments remain in this plan.</p>}
    <div className="mt-4 flex items-center justify-between text-sm"><span>Page {activePage+1} of {pages} · January 1 and August 1 payments</span><div className="flex gap-3"><button type="button" className="min-h-10 rounded border px-3 disabled:opacity-40" disabled={activePage===0} onClick={()=>setPage(activePage-1)}>Previous</button><button type="button" className="min-h-10 rounded border px-3 disabled:opacity-40" disabled={activePage+1>=pages} onClick={()=>setPage(activePage+1)}>Next</button></div></div>
    <p className="mt-4 text-xs text-slate-600">These are scheduled allowances, not evidence that payments have been made. Funding scenarios separately report any inability to pay.</p>
    <button type="button" disabled={blocked||loading||!current} onClick={download} className="mt-5 min-h-11 rounded bg-navy-900 px-4 text-sm font-medium text-white disabled:opacity-40">Download college payment calendar</button>
   </>}
  </SheetSection>
 </Sheet>;
}
