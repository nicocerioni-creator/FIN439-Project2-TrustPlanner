/* Shared family hook + college component, using synthetic inputs against the live Python API. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..'),req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/college-payment-plan.example.json'),'utf8'));
const hooks=[],effects=[],timers=new Map(),calls=[],cache=new Map();let cursor=0,timerId=0,session,tree,lastCollege,deferFamily=false,releaseFamily;
const equal=(a,b)=>a&&a.length===b.length&&b.every((v,i)=>Object.is(a[i],v));
const react={...React,
 useState(v){const i=cursor++;if(!(i in hooks))hooks[i]=typeof v==='function'?v():v;return[hooks[i],x=>hooks[i]=typeof x==='function'?x(hooks[i]):x];},
 useRef(v){const i=cursor++;return hooks[i]??(hooks[i]={current:v});},
 useCallback(fn,deps){const i=cursor++;if(!equal(hooks[i]?.deps,deps))hooks[i]={deps,fn};return hooks[i].fn;},
 useEffect(fn,deps){const i=cursor++;const old=hooks[i];if(!equal(old?.deps,deps)){hooks[i]={deps,cleanup:old?.cleanup};effects.push(()=>{hooks[i].cleanup?.();hooks[i].cleanup=fn();});}},
};
async function post(url,body){calls.push({url,body:structuredClone(body)});const r=await fetch('http://127.0.0.1:8000'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Error(typeof value.detail==='string'?value.detail:JSON.stringify(value.detail));return value;}
const api={
 getReferenceCase:async()=>{const r=await fetch('http://127.0.0.1:8000/api/v1/reference-case');return{...await r.json(),inputs:{...structuredClone(fixture.inputs.payment_inputs),model_start_date:null}};},
 calculatePaymentPlan:async p=>{if(deferFamily){deferFamily=false;await new Promise(resolve=>releaseFamily=resolve);}return post('/api/v1/payment-schedule',p);},
 calculateCollegePaymentPlan:async(p,i)=>{lastCollege=await post('/api/v1/college-payment-plan',{payment_inputs:p,annual_inflation_percent:i});return lastCollege;},
};
function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function local(n){if(n==='react')return react;if(n==='@/lib/api')return api;if(n.startsWith('@/')||n.startsWith('.')){const p=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return req(n);}
 vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{Error,Date,Intl,Blob,structuredClone,URL,document:{createElement(){return{click(){}};}},setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}})(local,m,m.exports);cache.set(file,m.exports);return m.exports;}
const {usePaymentPlan}=load(path.join(base,'hooks/use-payment-plan.ts'));
const {ReserveView}=load(path.join(base,'components/planner/reserve-view.tsx'));
const inflation={value:'',onChange(v){this.value=v;}};
function render(){cursor=0;session=usePaymentPlan();tree=ReserveView({session,inflation,onOpenFunding(){}});while(effects.length)effects.shift()();return tree;}
function all(n,p,out=[]){if(Array.isArray(n)){n.forEach(v=>all(v,p,out));return out;}if(!n||typeof n!=='object')return out;if(p(n))out.push(n);all(n.props?.children,p,out);return out;}
const nodes=t=>all(render(),n=>n.type===t),html=()=>renderToStaticMarkup(render());
function flush(){const batch=[...timers.values()];timers.clear();batch.forEach(fn=>fn());}
async function until(fn){const end=Date.now()+5000;render();while(!fn()&&Date.now()<end){await new Promise(r=>setTimeout(r,10));render();}assert.ok(fn(),'Timed out waiting for family/college state');}
const button=()=>nodes('button').find(n=>n.props.type==='submit');
const collegeCalls=()=>calls.filter(c=>c.url.endsWith('college-payment-plan')).length;
async function update(){assert.equal(button().props.disabled,false);const pending=nodes('form')[0].props.onSubmit({preventDefault(){}});render();await pending;render();flush();await until(()=>!!lastCollege&&!session.loading&&all(tree,n=>n.type==='button'&&n.props.children==='Download college payment calendar').length>0);}
function assertTotals(){const cells=nodes('td').filter(n=>n.props.className.includes('font-semibold'));lastCollege.children.forEach((c,i)=>assert.equal(cells[i].props.children,new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:Number(c.total_nominal_dollars)%1?2:0,maximumFractionDigits:3}).format(Number(c.total_nominal_dollars))));}
async function main(){
 render();await until(()=>session.result&&!session.loading);assert.equal(session.result.inputs.model_start_date,null);
 // The exact reported failure: the entered date is still unapplied in Family.
 session.onChange('model_start_date','2026-01-01');inflation.value='3';render();assert.equal(session.stale,true);assert.equal(session.result.inputs.model_start_date,null);
 await update();assert.equal(session.stale,false);assert.equal(lastCollege.inputs.payment_inputs.model_start_date,'2026-01-01');assertTotals();
 // Another family edit and CPI edit are both applied by the college button.
 session.onChange('model_start_date','2026-02-01');inflation.value='6';render();assert.equal(session.stale,true);
 await update();assert.equal(lastCollege.inputs.payment_inputs.model_start_date,'2026-02-01');assert.equal(lastCollege.inputs.annual_inflation_percent,'6');assertTotals();
 // CPI-only refresh uses one calendar request; no redundant family validation.
 const familyBefore=calls.filter(c=>c.url.endsWith('payment-schedule')).length;
 inflation.value='3';render();await update();assert.equal(calls.filter(c=>c.url.endsWith('payment-schedule')).length,familyBefore);assertTotals();
 // Invalid family inputs fail here without making a college request; retry recovers here.
 const before=collegeCalls();session.onChange('degree_years',['1.1','1']);render();assert.equal(button().props.disabled,false);
 await nodes('form')[0].props.onSubmit({preventDefault(){}});render();flush();assert.ok(session.error);assert.equal(collegeCalls(),before);assert.ok(!html().includes('Enter valid inflation and a model date'));
 session.onChange('degree_years',['1','1']);render();await update();assertTotals();
 // Edits during validation cannot be overwritten by the older family response.
 session.onChange('model_start_date','2026-02-02');render();deferFamily=true;const inFlight=nodes('form')[0].props.onSubmit({preventDefault(){}});render();
 session.onChange('model_start_date','2026-03-01');render();releaseFamily();await inFlight;render();
 assert.equal(session.input.model_start_date,'2026-03-01');assert.ok(session.error.includes('inputs changed'));
 await update();assert.equal(lastCollege.inputs.payment_inputs.model_start_date,'2026-03-01');assertTotals();
 hooks.forEach(h=>h?.cleanup?.());
 console.log('College refresh integration PASS: one college button validates/applies draft family dates and degrees, recalculates latest CPI totals, handles validation retry, and preserves edits made during requests. No Family button or investment endpoint used.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
