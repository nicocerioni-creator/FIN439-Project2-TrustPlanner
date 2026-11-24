/* Real Evidence component and Python-generated synthetic240-assets records. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..'),req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
let cursor=0,downloaded,downloadName,restored,imported=0;const hooks=[],cache=new Map();
const react={...React,useState(v){const i=cursor++;if(!(i in hooks))hooks[i]=v;return[hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];}};
async function post(route,input){const r=await fetch('http://127.0.0.1:8000/api/v1/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;}
const api={validateAnalysisPlan:body=>post('validate-analysis-plan',body)};
function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function local(n){if(n==='react')return react;if(n==='@/lib/api')return api;if(n.startsWith('@/')||n.startsWith('.')){const p=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return req(n);}
 vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{Error,Date,Intl,Blob,JSON,URL:{createObjectURL(blob){downloaded=blob;return'blob:test';},revokeObjectURL(){}},document:{createElement(){return{click(){downloadName=this.download;}};}},setTimeout(fn){fn();}})(local,m,m.exports);cache.set(file,m.exports);return m.exports;}
const {EvidenceView}=load(path.join(base,'components/planner/evidence-view.tsx'));
const {evidenceSnapshot,readableReport}=load(path.join(base,'lib/evidence.ts'));
function all(n,p,out=[]){if(Array.isArray(n)){n.forEach(v=>all(v,p,out));return out;}if(!n||typeof n!=='object')return out;if(p(n))out.push(n);all(n.props?.children,p,out);all(n.props?.aside,p,out);return out;}
function text(n){if(Array.isArray(n))return n.map(text).join('');if(typeof n==='string'||typeof n==='number')return String(n);return n&&typeof n==='object'?text(n.props?.children):'';}
let props;const render=()=>{cursor=0;return EvidenceView(props);};const html=()=>renderToStaticMarkup(render());
const button=label=>all(render(),n=>n.type==='button'&&text(n)===label)[0];
async function click(label){await button(label).props.onClick();await new Promise(r=>setImmediate(r));}
async function until(predicate){const deadline=Date.now()+5000;while(!predicate()&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,5));assert.ok(predicate(),html());}
async function main(){
 const payment=await post('payment-schedule',{model_start_date:'2026-11-23',starting_ages:[79,79],degree_years:['0.5','0.5'],first_college_years:[2000,2027],college_annual:'100',adult_minimum:'12',adult_target:'1200'});
 const request={payment_inputs:payment.inputs,opening_balance:'240',college_annual_return_percent:'0',support_annual_return_percent:'0',annual_cost_percent:'0',annual_cpi_change_percent:'3',reserve_transfer_rule:'protect_before_payments',include_horizon_day_payments:true,adaptive_policy:{enabled:true,real_discount_percent:'0',buffer_percent:'0',terminal_real_balance:'0',max_monthly_restoration_points:'100'}};
 const projection=await post('funding-projection',request);
 const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/analysis.example.json'),'utf8'));
 const analysisRequest={...fixture.inputs,funding:request,stress:{...fixture.inputs.stress,enabled:false},use_historical_proxy_returns:false};
 const analysis=await post('evaluate',analysisRequest);
 const calendar=await post('college-payment-plan',{payment_inputs:payment.inputs,annual_inflation_percent:'3'});
 const record={current:true,loading:false,error:'',calculatedAt:'2026-11-23T23:00:00Z'};
 props={session:{mode:'live',result:payment,stale:false,loading:false,error:'',onDownload(){},onImportPaymentPlan:async input=>{assert.deepEqual(JSON.parse(JSON.stringify(input)),payment.inputs);imported++;}},
  funding:{...record,result:projection,request,selectedPath:'adaptive'},portfolio:{...record,result:analysis,request:analysisRequest,settings:analysisRequest.portfolio,estimateCurrent:false},college:{...record,result:calendar},annualInflation:'3',onRestore:v=>restored=v};
 assert.ok(html().includes('Trust &amp; portfolio mandate'));assert.ok(!html().includes('What the service returned'));assert.ok(!html().includes('Unresolved policy decisions'));
 assert.equal(text(all(render(),n=>n.props?.['data-ending-nominal'])[0]),new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(projection.paths.adaptive.ending_total)).replace(/\.00$/,''));
 await click('Download results summary');assert.equal(downloadName,'trust_results_summary.html');let report=await downloaded.text();assert.ok(report.includes(projection.paths.adaptive.ending_total.replace(/\.00$/,'')));assert.ok(report.includes('Current'));assert.ok(report.includes('Print'));
 await click('Download payment calendar');assert.equal(downloadName,'college_calendar.csv');let csv=await downloaded.text();for(const day of calendar.payment_dates)for(const payment of day.payments){assert.ok(csv.includes(day.date));assert.ok(csv.includes(payment.amount_nominal_dollars));}
 await click('Save complete plan');await until(()=>downloadName==='trust_analysis_settings.json');const saved=JSON.parse(await downloaded.text());assert.equal(saved.kind,'trust-planner-analysis-settings');assert.equal(saved.version,3);assert.ok(saved.results.funding);assert.ok(saved.results.analysis);assert.ok(saved.results.college);
 const input=all(render(),n=>n.type==='input'&&n.props.type==='file')[0];await input.props.onChange({target:{files:[{size:10000,text:async()=>JSON.stringify(saved)}]}});await until(()=>!!restored);assert.equal(imported,1);assert.ok(restored?.portfolio);
 // An early-stopped goal path cannot masquerade as an age80 terminal value.
 const select=all(render(),n=>n.type==='select')[0];select.props.onChange({target:{value:'goal'}});
 assert.equal(text(all(render(),n=>n.props?.['data-ending-nominal'])[0]),'Unavailable at age80');assert.ok(html().includes('Projection stopped'));
 // Inflation edits invalidate all result sources immediately, even before effects publish.
 props.annualInflation='6';const snap=evidenceSnapshot(props.session,props.funding,props.portfolio,props.college,'6');assert.equal(snap.funding,null);assert.equal(snap.college,null);assert.equal(snap.analysis,null);assert.equal(button('Download payment calendar').props.disabled,true);assert.equal(button('Save complete plan').props.disabled,true);
 props.annualInflation='3';const original=props.funding.request;props.funding.request={...original,opening_balance:'300'};assert.equal(evidenceSnapshot(props.session,props.funding,props.portfolio,props.college,'3').analysis,null);props.funding.request=original;props.funding.current=false;props.portfolio.current=false;await click('Detailed calculation record (JSON)');const stale=JSON.parse(await downloaded.text());assert.equal(stale.results.funding,null);assert.equal(stale.results.analysis,null);
 props.funding.result=null;props.portfolio.result=null;props.session.result={...payment,inputs:{...payment.inputs,adult_support_enabled:false},annual_amounts_model_start_dollars:{...payment.annual_amounts_model_start_dollars,adult_minimum:'0',adult_target:'0'}};assert.ok(html().includes('Off'));
 props.session.stale=true;assert.equal(button('Download results summary').props.disabled,true);
 props.session.stale=false;props.session.mode='illustrative';assert.equal(button('Download results summary').props.disabled,true);assert.equal(button('Save complete plan').props.disabled,true);
 const safe=readableReport([['A','<script>alert(1)</script>']],[],[],'test');assert.ok(!safe.includes('<script>'));assert.ok(safe.includes('&lt;script&gt;'));
 console.log('Evidence PASS: live synthetic snapshots, nominal/real terminal values, early-stop/age80 guard, status and CPI freshness, CSV/HTML/full-plan exports, validated reopen, stale omission, adult-off and preview guards, escaped report.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
