/* Real component hooks, synthetic case metrics: no reference investment experiment. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..'),req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/portfolio-estimate.example.json'),'utf8'));
let cursor=0,timerId=0,defer=false,fail=false;const hooks=[],effects=[],timers=new Map(),calls=[],waiting=[],cache=new Map();
const equal=(a,b)=>a&&a.length===b.length&&b.every((v,i)=>Object.is(v,a[i]));
const react={...React,useState(v){const i=cursor++;if(!(i in hooks))hooks[i]=typeof v==='function'?v():v;return[hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];},useRef(v){const i=cursor++;return hooks[i]??(hooks[i]={current:v});},useEffect(fn,deps){const i=cursor++;if(!equal(hooks[i]?.deps,deps)){const old=hooks[i];hooks[i]={deps,cleanup:old?.cleanup};effects.push(()=>{hooks[i].cleanup?.();hooks[i].cleanup=fn();});}}};
const ticks=['VOO','QQQ','SCHD','PAVE','XLE','XLV','SGOV'];
function result(weight){const value=structuredClone(fixture);value.candidate={...value.candidate,weights:Object.fromEntries(ticks.map(t=>[t,t==='VOO'?weight:t==='SGOV'?100-weight:0])),historical_arithmetic_return_percent:2+weight/10,annualized_sample_volatility_percent:weight/5};return value;}
const api={getInvestmentData:async()=>({today_eastern:'2026-11-23'}),getPortfolioCases:async()=>{calls.push('cases');if(fail)throw Error('Synthetic preview failure');return{api_version:'test',data_card:{},cases:{lower_risk:result(0),balanced_growth:result(40),aggressive_growth:result(80)}};},estimatePortfolio:async body=>{calls.push(body);if(fail)throw Error('Synthetic preview failure');const value=result(Number(body.portfolio.proposed_weights.VOO));if(defer)return new Promise(resolve=>waiting.push({resolve,value}));return value;}};
function load(file){if(cache.has(file))return cache.get(file);const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function local(n){if(n==='react')return react;if(n==='@/lib/api')return api;if(n.startsWith('@/')||n.startsWith('.')){const p=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([p,p+'.ts',p+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile()));}return req(n);}
vm.runInNewContext('(function(require,module,exports){'+code+'\n})',{Error,Date,Intl,Blob,URL,Math,setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);}})(local,m,m.exports);cache.set(file,m.exports);return m.exports;}
const {PortfolioView}=load(path.join(base,'components/planner/portfolio-view.tsx'));
const {PortfolioCases}=load(path.join(base,'components/planner/portfolio-cases.tsx'));
const {adjustPortfolioWeight}=load(path.join(base,'lib/portfolio-weights.ts'));
const props={session:{mode:'live',stale:false,loading:false,error:''},context:fixture.inputs,funding:null,onApplyFunding(){},onOpenFunding(){}};
function render(){cursor=0;const tree=PortfolioView(props);while(effects.length)effects.shift()();return tree;}
function all(n,p,out=[]){if(Array.isArray(n)){n.forEach(v=>all(v,p,out));return out;}if(!n||typeof n!=='object')return out;if(p(n))out.push(n);all(n.props?.children,p,out);return out;}
function work(){return all(render(),n=>n.type===PortfolioCases)[0].props;}
function flush(){const batch=[...timers.values()];timers.clear();batch.forEach(fn=>fn());}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function main(){
 render();flush();await settle();assert.equal(calls.length,0);
 all(render(),n=>n.type==='input'&&n.props.type==='date')[0].props.onChange({target:{value:'2026-11-23'}});render();flush();await settle();
 assert.equal(work().preview.candidate.weights.VOO,40);
 work().onChoose('aggressive_growth');assert.equal(work().preview.candidate.weights.VOO,80);
 work().onChoose('lower_risk');assert.equal(work().preview.candidate.weights.SGOV,100);
 work().onChoose('custom');assert.equal(work().settings.proposed_weights.SGOV,'100.00');
 work().onWeight('VOO','20');render();flush();await settle();assert.equal(work().preview.candidate.weights.VOO,20);
 assert.equal(work().preview.candidate.historical_arithmetic_return_percent,4);
 const before=calls.length;work().onWeight('VOO','10');render();work().onWeight('VOO','30');render();flush();await settle();
 assert.equal(calls.length,before+1);assert.equal(work().preview.candidate.weights.VOO,30);
 // Older in-flight custom responses are cancelled at their effect boundary.
 defer=true;work().onWeight('VOO','40');render();flush();work().onWeight('VOO','50');render();flush();assert.equal(waiting.length,2);
 waiting[1].resolve(waiting[1].value);await settle();assert.equal(work().preview.candidate.weights.VOO,50);
 waiting[0].resolve(waiting[0].value);await settle();assert.equal(work().preview.candidate.weights.VOO,50);
 defer=false;fail=true;work().onWeight('VOO','60');render();flush();await settle();assert.ok(work().error.includes('Synthetic preview failure'));assert.equal(work().preview,null);
 fail=false;work().onRetry();render();flush();await settle();assert.equal(work().preview.candidate.weights.VOO,60);
 work().onChoose('balanced_growth');assert.equal(work().preview.candidate.weights.VOO,40);
 work().onChoose('custom');assert.equal(work().settings.proposed_weights.VOO,'60.00');
 const html=renderToStaticMarkup(PortfolioCases(work()));assert.ok(html.includes('Custom case'));assert.ok(html.includes('data-selected-risk'));assert.ok(html.includes('VOO weight slider'));
 assert.equal(all(render(),n=>n.type==='select'&&n.props['data-portfolio']==='allocation-style').length,0);
 assert.equal(all(render(),n=>n.type==='input'&&n.props.type==='checkbox'&&n.props.required).length,0);
 let weights=Object.fromEntries(ticks.map(t=>[t,t==='SGOV'?'100':'0']));
 for(let i=0;i<100;i++){weights=adjustPortfolioWeight(weights,ticks[i%7],String(i%101));assert.equal(Math.round(Object.values(weights).reduce((a,b)=>a+Number(b),0)*100),10000);assert.ok(Object.values(weights).every(v=>Number(v)>=0));}
 props.session.mode='illustrative';const count=calls.length;render();flush();await settle();assert.equal(calls.length,count);
 hooks.forEach(h=>h?.cleanup?.());
 console.log('Portfolio cases PASS: standard weights, live custom graph metrics, exact100% sliders, debounce/races/error/retry, custom-draft retention, removed controls, preview isolation.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
