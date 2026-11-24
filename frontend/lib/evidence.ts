import type {FundingPath,FundingResult,PaymentResult} from './api';
import type {PlanSession,FundingRecord,PortfolioRecord,CollegeRecord,CalculationRecord} from '@/components/planner/types';

export const pathLabels:Record<FundingPath['path'],string>={adaptive:'Adaptive support',minimum:'Minimum support',goal:'Goal support',college_only:'College only'};
export function recordStatus(record:CalculationRecord<unknown>|null|undefined){
 if(record?.loading)return 'Calculating';
 if(record?.error)return 'Needs attention';
 if(record?.current&&record.result)return 'Current';
 return record?.result?'Needs updating':'Not calculated';
}
export function evidenceSnapshot(session:PlanSession,funding?:FundingRecord|null,portfolio?:PortfolioRecord|null,college?:CollegeRecord|null,annualInflation?:string){
 const current=!!session.result&&session.mode==='live'&&!session.stale&&!session.loading&&!session.error;
 const matches=(plan:PaymentResult['inputs']|undefined)=>!!plan&&JSON.stringify(plan)===JSON.stringify(session.result?.inputs);
 const sameInflation=(value:string|undefined)=>annualInflation===undefined||(annualInflation.trim()!==''&&Number.isFinite(Number(annualInflation))&&Number(value)===Number(annualInflation));
 const fundingCurrent=sameInflation(funding?.request?.annual_cpi_change_percent)&&current&&!!funding?.current&&!!funding.result&&matches(funding.request?.payment_inputs);
 const analysisMatchesFunding=funding==null||!!funding.request&&JSON.stringify(funding.request)===JSON.stringify(portfolio?.request?.funding);
 const portfolioCurrent=analysisMatchesFunding&&sameInflation(portfolio?.request?.funding.annual_cpi_change_percent)&&current&&!!portfolio?.current&&!!portfolio.result&&matches(portfolio.request?.funding.payment_inputs);
 const collegeCurrent=sameInflation(college?.result?.inputs.annual_inflation_percent)&&current&&!!college?.current&&!!college.result&&matches(college.result.inputs.payment_inputs);
 const analysis=portfolioCurrent?portfolio!.result:null;
 // A full analysis can provide a funding result even without a separate Funding run.
 const projection:FundingResult|null=fundingCurrent?funding!.result:analysis?.funding&&analysis.candidate_funding_inputs?
  {...analysis.funding,api_version:analysis.api_version,inputs:analysis.candidate_funding_inputs}:null;
 return {current,payment:current?session.result:null,fundingCurrent,portfolioCurrent,collegeCurrent,
  funding:projection,analysis,college:collegeCurrent?college!.result:null};
}
export function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function readableReport(rows:[string,string][],mandate:[string,string][],status:[string,string][],created:string){
 const table=(items:[string,string][])=>'<table>'+items.map(([label,value])=>`<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')+'</table>';
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trust planning results</title><style>body{font:16px/1.5 system-ui;color:#18334b;max-width:960px;margin:40px auto;padding:0 24px}h1,h2{font-family:Georgia,serif}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #ddd}th{width:38%}small{color:#536273}@media print{body{margin:0;font-size:11pt}tr{break-inside:avoid}}</style><body><p>OpenAI Codex assisted with the code, calculations and report generation; v0 contributed interface design. The analysis and final decisions are the student’s own. Educational and research use only; not investment advice or a guarantee.</p><h1>Trust planning results</h1><p>Report created '+escapeHtml(created)+'. Use your browser’s Print command to save a PDF.</p><h2>Calculation status</h2>'+table(status)+'<h2>Results and assumptions</h2>'+table(rows)+'<h2>Trust &amp; portfolio mandate</h2>'+table(mandate)+'<p>Balances are conditional on the selected assumptions. Historical returns are not forecasts. A finite projection is not proof of lifelong solvency. Only current calculations are included; unavailable results are labelled.</p></body></html>';
}
export function calendarCsv(calendar:NonNullable<ReturnType<typeof evidenceSnapshot>['college']>){
 const cell=(value:unknown)=>{let text=String(value);if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return '\uFEFF'+[['Payment date','Child','Semester','Term','Payment (nominal USD)'],...calendar.payment_dates.flatMap(day=>day.payments.map(p=>[day.date,p.child_id,p.semester,p.term,p.amount_nominal_dollars]))].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
