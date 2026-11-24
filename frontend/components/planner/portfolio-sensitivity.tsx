import type {EvaluationResult} from '@/lib/api';
import {SheetSection,TableScroll,tableHead,tableCell} from './primitives';
export function PortfolioSensitivity({result,stale}:{result:EvaluationResult;stale:boolean}){
 if(!result.portfolio_sensitivities?.length)return null;
 return <SheetSection id="portfolio-sensitivity" kicker="Re-estimate and re-optimize" title="Window, costs and constraint sensitivity"><div className={stale?'opacity-60':''}>
  <p className="mb-4 text-sm text-slate-600">One setting changes at a time. These historical allocation checks complement the separate payment-stress table. Missing long-window data is reported, never replaced with a shorter sample. Tighter ceilings never loosen baseline limits.</p>
  <TableScroll><table className="w-full min-w-[950px]"><thead><tr>{['Case','Changed parameters','Checks','Return estimate','Volatility','Largest weight change'].map(h=><th className={tableHead} key={h}>{h}</th>)}</tr></thead><tbody>{result.portfolio_sensitivities.map(s=><tr key={s.name}><th className={`${tableCell} text-left`}>{s.name}</th><td className={tableCell}>{Object.entries(s.changed_parameters).map(([k,v])=>`${k.replaceAll('_',' ')}: ${v}`).join(' · ')}</td><td className={tableCell}>{s.candidate?'Pass under stressed settings':s.reason??s.status}</td><td className={tableCell}>{s.candidate?`${s.candidate.historical_arithmetic_return_percent.toFixed(2)}%`:'Unavailable'}</td><td className={tableCell}>{s.candidate?`${s.candidate.annualized_sample_volatility_percent.toFixed(2)}%`:'Unavailable'}</td><td className={tableCell}>{s.maximum_weight_change_points===null?'Unavailable':`${s.maximum_weight_change_points.toFixed(1)}pp`}</td></tr>)}</tbody></table></TableScroll>
 </div></SheetSection>;
}
