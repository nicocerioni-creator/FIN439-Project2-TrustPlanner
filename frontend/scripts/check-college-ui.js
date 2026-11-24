/* Real component wiring with synthetic data. No investment experiment. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..'),req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/college-payment-plan.example.json'),'utf8'));
let cursor=0,failed=false,downloaded,timerId=0,defer=false,corruptSummary=false;const hooks=[],calls=[],cpiCalls=[],effects=[],waiting=[];const timers=new Map();
function setTimer(fn){const id=++timerId;timers.set(id,fn);return id;}function clearTimer(id){timers.delete(id);}function flushTimers(){const batch=[...timers.values()];timers.clear();batch.forEach(fn=>fn());}
function response(rate){const value=structuredClone(fixture);const amounts={'0':['50.00','50.00'],'3':['50.87','51.50'],'6':['51.73','53.00']}[rate];if(!amounts)return value;value.annual_inflation_percent=rate;value.inputs.annual_inflation_percent=rate;value.payment_dates.forEach((row,i)=>{row.total_nominal_dollars=(Number(amounts[i])*2).toFixed(2);row.payments.forEach(p=>p.amount_nominal_dollars=amounts[i]);});value.children.forEach(c=>c.total_nominal_dollars=(Number(amounts[0])+Number(amounts[1])).toFixed(2));value.total_nominal_dollars=(Number(value.children[0].total_nominal_dollars)*2).toFixed(2);return value;}
const react={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=initial;return[hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];},useRef(v){const i=cursor++;return hooks[i]??(hooks[i]={current:v});},useEffect(fn,deps){const i=cursor++;const previous=hooks[i];if(!previous||deps.some((d,j)=>!Object.is(d,previous.deps[j]))){hooks[i]={deps,cleanup:previous?.cleanup};effects.push(()=>{hooks[i].cleanup?.();hooks[i].cleanup=fn();});}}};
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};
const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function local(n){if(n==='react')return react;if(n==='@/lib/api')return{calculateCollegePaymentPlan:async(p,i)=>{calls.push([p,i]);if(failed)throw Error('Synthetic failure');if(defer)return new Promise(resolve=>waiting.push({rate:i,resolve}));const value=response(i);if(corruptSummary){value.total_nominal_dollars='999999.00';value.children.forEach(c=>c.total_nominal_dollars='999999.00');value.payment_dates.forEach(r=>r.total_nominal_dollars='999999.00');}return value;},calculateCollegeReserve:async p=>{cpiCalls.push(p);throw Error('Synthetic CPI unavailable');}};
if(n.startsWith('@/')||n.startsWith('.')){const p=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return req(n);}
vm.runInNewContext('(function(require,module,exports){'+out+'\n})',{Error,Date,Intl,Blob,URL:{createObjectURL(b){downloaded=b;return'blob:test';},revokeObjectURL(){}},document:{createElement(){return{click(){}};}},setTimeout:setTimer,clearTimeout:clearTimer})(local,m,m.exports);cache.set(file,m.exports);return m.exports;}
const {ReserveView}=load(path.join(base,'components/planner/reserve-view.tsx'));
const {ReserveCalculator}=load(path.join(base,'components/planner/reserve-calculator.tsx'));
const session={mode:'live',stale:false,error:'',loading:false,result:{inputs:fixture.inputs.payment_inputs,college_obligation_model_start_dollars:'200',total_funded_semesters:4,beneficiaries:[1,2].map(i=>({child_id:i,degree_years:'1',remaining_funded_degree_years:'1',funded_semesters:2,college_obligation_model_start_dollars:'100'}))}};
const inflation={value:'',onChange(v){this.value=v;}};
function render(){cursor=0;const tree=ReserveView({session,inflation,onOpenFunding(){}});while(effects.length)effects.shift()();return tree;}function all(n,p,a=[]){if(Array.isArray(n)){n.forEach(v=>all(v,p,a));return a;}if(!n||typeof n!=='object')return a;if(p(n))a.push(n);all(n.props?.children,p,a);return a;}
const nodes=t=>all(render(),n=>n.type===t);const html=()=>renderToStaticMarkup(render());
async function settle(){await new Promise(resolve=>setImmediate(resolve));}
const exportButton=()=>nodes('button').find(n=>n.props.children==='Download college payment calendar');
function assertChildTotal(expected){const cells=nodes('td').filter(n=>n.props.className.includes('font-semibold'));assert.equal(cells[0].props.children,expected);assert.equal(cells[1].props.children,expected);}
async function main(){
assert.equal(calls.length,0);assert.equal(nodes('input').filter(n=>n.props.type==='date').length,0);
assert.ok(html().includes('Funded semesters in plan'));assert.ok(html().includes('Adult support'));
nodes('input')[0].props.onChange({target:{value:'0'}});render();assert.equal(calls.length,0);flushTimers();await settle();
assert.equal(calls.length,1);assertChildTotal('$100');
// Editing in College refreshes automatically without submitting the form.
nodes('input')[0].props.onChange({target:{value:'3'}});render();assert.ok(!exportButton());flushTimers();await settle();assertChildTotal('$102.37');
assert.ok(html().includes('Children and individual payments'));assert.equal(nodes('tr').length,6);
exportButton().props.onClick();assert.deepEqual(JSON.parse(await downloaded.text()),response('3'));
// A shared value changed in Funding follows the same automatic path.
inflation.value='6';render();flushTimers();await settle();assertChildTotal('$104.73');
// An older reply arriving last must never overwrite the newest rate/child totals.
defer=true;inflation.value='3';render();flushTimers();inflation.value='6';render();flushTimers();assert.equal(waiting.length,2);
waiting[1].resolve(response('6'));await settle();assertChildTotal('$104.73');
waiting[0].resolve(response('3'));await settle();assertChildTotal('$104.73');
// Rapid edits cancel pending timers rather than issuing intermediate requests.
defer=false;const before=calls.length;inflation.value='0';render();inflation.value='3';render();flushTimers();await settle();assert.equal(calls.length,before+1);assertChildTotal('$102.37');
failed=true;inflation.value='6';render();flushTimers();await settle();assert.ok(html().includes('Synthetic failure'));assert.ok(!exportButton());
failed=false;await nodes('form')[0].props.onSubmit({preventDefault(){}});assertChildTotal('$104.73');
// Even inconsistent precomputed summaries must not affect the calendar-derived totals.
corruptSummary=true;inflation.value='0';render();flushTimers();await settle();assertChildTotal('$100');
assert.ok(html().includes('$200'));assert.ok(!html().includes('$999,999'));
exportButton().props.onClick();const exact=JSON.parse(await downloaded.text());assert.equal(exact.total_nominal_dollars,'200.00');assert.equal(exact.children[0].total_nominal_dollars,'100.00');assert.equal(exact.payment_dates[0].total_nominal_dollars,'100.00');
corruptSummary=false;
const {summarizeCollegePayments}=load(path.join(base,'lib/college-payment-totals.ts'));
const dates=Array.from({length:13},(_,i)=>({date:String(i),total_nominal_dollars:'999',payments:[{child_id:1,semester:i+1,term:'fall',amount_nominal_dollars:'0.10'},...(i===12?[{child_id:2,semester:1,term:'fall',amount_nominal_dollars:'0.20'}]:[])]}));
const sum=summarizeCollegePayments(dates);assert.equal(sum.childTotal(1),'1.30');assert.equal(sum.childTotal(2),'0.20');assert.equal(sum.childTotal(3),'0.00');assert.equal(sum.totalNominalDollars,'1.50');
inflation.value='';render();flushTimers();assert.ok(!exportButton());
inflation.value='101';const invalidBefore=calls.length;render();flushTimers();assert.equal(calls.length,invalidBefore);assert.ok(html().includes('between -50% and 100%'));
session.mode='illustrative';inflation.value='3';const count=calls.length;render();flushTimers();await nodes('form')[0].props.onSubmit({preventDefault(){}});assert.equal(calls.length,count);
hooks.forEach(h=>h?.cleanup?.());hooks.length=0;cursor=0;session.mode='live';session.result.inputs.model_start_date='2100-01-01';
const future=renderToStaticMarkup(ReserveCalculator({session}));assert.ok(future.includes('model starts in the future'));assert.ok(!future.includes('type="date"'));assert.ok(!future.includes('Assets designated'));assert.equal(cpiCalls.length,0);
console.log('College UI PASS: automatic per-child totals at 0/3/6% inflation, shared Funding edits, debounce and out-of-order replies, exact export/error/retry/invalid/preview guards.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
