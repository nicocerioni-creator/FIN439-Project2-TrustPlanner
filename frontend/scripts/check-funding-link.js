/* Funding + Portfolio components linked through shared state, with synthetic assets and live Python calculations. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..'),req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/college-payment-plan.example.json'),'utf8'));
const hooks=[],effects=[],timers=new Map(),calls=[],cache=new Map();let cursor=0,timerId=0,session,context=null,selection=null,funding=null,fundingTree,portfolioTree,evidenceTree,fundingRecord=null,portfolioRecord=null,downloaded;
const equal=(a,b)=>a&&a.length===b.length&&b.every((v,i)=>Object.is(a[i],v));
const react={...React,
 useState(v){const i=cursor++;if(!(i in hooks))hooks[i]=typeof v==='function'?v():v;return[hooks[i],x=>hooks[i]=typeof x==='function'?x(hooks[i]):x];},
 useRef(v){const i=cursor++;return hooks[i]??(hooks[i]={current:v});},
 useCallback(fn,deps){const i=cursor++;if(!equal(hooks[i]?.deps,deps))hooks[i]={deps,fn};return hooks[i].fn;},
 useEffect(fn,deps){const i=cursor++;const old=hooks[i];if(!equal(old?.deps,deps)){hooks[i]={deps,cleanup:old?.cleanup};effects.push(()=>{hooks[i].cleanup?.();hooks[i].cleanup=fn();});}},
};
async function post(url,body){calls.push({url,body:structuredClone(body)});const r=await fetch('http://127.0.0.1:8000'+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Error(typeof value.detail==='string'?value.detail:JSON.stringify(value.detail));return value;}
const api={
 getInvestmentData:async()=>{const r=await fetch('http://127.0.0.1:8000/api/v1/investment-data');return r.json();},
 estimatePortfolio:p=>post('/api/v1/portfolio-estimate',p),
 calculateFundingProjection:p=>post('/api/v1/funding-projection',p),
 validateFundingPlan:p=>post('/api/v1/validate-funding-plan',p),
};

function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function local(n){if(n==='react')return react;if(n==='@/lib/api')return api;if(n.startsWith('@/')||n.startsWith('.')){const p=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return req(n);}
 vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{Error,Date,Intl,Blob,structuredClone,URL:{createObjectURL(b){downloaded=b;return'blob:test';},revokeObjectURL(){}},document:{createElement(){return{click(){}};}},setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}})(local,m,m.exports);cache.set(file,m.exports);return m.exports;}
const {FundingView}=load(path.join(base,'components/planner/funding-view.tsx'));
const {PortfolioView}=load(path.join(base,'components/planner/portfolio-view.tsx'));
const {EvidenceView}=load(path.join(base,'components/planner/evidence-view.tsx'));
const publishFunding=v=>fundingRecord=v,publishPortfolio=v=>portfolioRecord=v;
const inflation={value:'2',onChange(v){this.value=v;}};
const setContext=v=>context=v,setFunding=v=>funding=v,setSelection=v=>selection=v;
function render(){cursor=0;fundingTree=FundingView({session,inflation,selection,onEvidenceChange:publishFunding,onContextChange:setContext,onRequestChange:setFunding,onSelectPortfolio:setSelection});portfolioTree=PortfolioView({session,context,funding,onEvidenceChange:publishPortfolio,onSelectPortfolio:setSelection,onApplyFunding(){},onOpenFunding(){}});evidenceTree=EvidenceView({session,funding:fundingRecord,portfolio:portfolioRecord,annualInflation:inflation.value});while(effects.length)effects.shift()();}
function all(n,p,out=[]){if(Array.isArray(n)){n.forEach(v=>all(v,p,out));return out;}if(!n||typeof n!=='object')return out;if(p(n))out.push(n);all(n.props?.children,p,out);return out;}
const nodes=(tree,type)=>all(tree,n=>n.type===type);
async function until(fn){const end=Date.now()+5000;render();while(!fn()&&Date.now()<end){await new Promise(r=>setTimeout(r,10));render();}assert.ok(fn(),'Timed out waiting for workflow');}
async function main(){
 const saved=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/analysis.example.json'),'utf8'));
 const inputs=saved.inputs.funding.payment_inputs;const plan=await post('/api/v1/payment-schedule',inputs);
 session={mode:'live',stale:false,loading:false,error:'',input:inputs,result:plan,reference:{reference_initial_capital:'10000000'}};
 render();let fields=nodes(fundingTree,'input');fields.find(n=>n.props['data-field']==='opening').props.onChange({target:{value:'240'}});render();render();
 assert.ok(context);assert.equal(funding,null);assert.equal(nodes(portfolioTree,'fieldset')[0].props.disabled,false);
 nodes(portfolioTree,'input').find(n=>n.props.type==='date').props.onChange({target:{value:'2026-11-23'}});render();
 assert.equal(nodes(portfolioTree,'input').filter(n=>n.props.type==='checkbox'&&n.props.required).length,0);
 await nodes(portfolioTree,'form')[0].props.onSubmit({preventDefault(){}});render();render();
 assert.ok(selection?.estimate.candidate);assert.ok(funding?.portfolio_source);assert.equal(funding.annual_cost_percent,'0');
 assert.ok(!nodes(fundingTree,'input').some(n=>n.props['data-field']==='college')); // No invented manual rates.
 await nodes(fundingTree,'form')[0].props.onSubmit({preventDefault(){}});render();
 assert.ok(renderToStaticMarkup(fundingTree).includes('Where the opening money goes'));render();assert.equal(fundingRecord.current,true);assert.ok(renderToStaticMarkup(evidenceTree).includes('Model-start purchasing power'));assert.ok(renderToStaticMarkup(evidenceTree).includes('Current'));
 const called=calls.findLast(c=>c.url.endsWith('funding-projection'));assert.ok(called.body.portfolio_source);assert.equal(called.body.include_horizon_day_payments,true);assert.equal(called.body.reserve_transfer_rule,'protect_before_payments');
 nodes(fundingTree,'button').find(n=>n.props.children==='Save plan settings').props.onClick();await until(()=>!!downloaded);
 const file=JSON.parse(await downloaded.text());assert.ok(file.funding.portfolio_source);assert.equal(file.funding.annual_cost_percent,'0');
 nodes(fundingTree,'input').find(n=>n.props['data-field']==='opening').props.onChange({target:{value:'300'}});render();render();render();assert.equal(funding,null);assert.equal(selection,null);assert.equal(fundingRecord.current,false);
 assert.ok(nodes(fundingTree,'button').find(n=>n.props.children==='Calculate funding plan').props.disabled);
 hooks.forEach(h=>h?.cleanup?.());
 console.log('Funding ↔ Portfolio integration PASS: estimate without manual rates, link weights/returns, project with fixed priorities and zero optional costs, save source, invalidate when opening assets change. Synthetic240-assets family; no reference trust run.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
