/* Real component wiring against isolated synthetic fixtures; no browser/paid service. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {createRequire}=require('module');const base=path.resolve(__dirname,'..');const req=createRequire(path.join(base,'package.json'));
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const fixture=JSON.parse(fs.readFileSync(path.join(base,'handoff/api/analysis.example.json'),'utf8'));
let cursor=0,failed=false,downloaded,loaded=0;const hooks=[],calls=[];
const react={...React,useState(initial){const i=cursor++;if(!(i in hooks))hooks[i]=initial;return[hooks[i],v=>hooks[i]=typeof v==='function'?v(hooks[i]):v];},useRef(v){const i=cursor++;return hooks[i]??(hooks[i]={current:v});},useEffect(){cursor++;}};
const cache=new Map();function load(file){if(cache.has(file))return cache.get(file);const module={exports:{}};
 const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 function local(n){if(n==='react')return react;if(n==='@/lib/api')return{
  getInvestmentData:async()=>({}),evaluatePortfolio:async body=>{calls.push(structuredClone(body));if(failed)throw Error('Synthetic failure');return fixture;},
  validateAnalysisPlan:async body=>({inputs:body}),
 };if(n.startsWith('@/')||n.startsWith('.')){const target=n.startsWith('@/')?path.join(base,n.slice(2)):path.resolve(path.dirname(file),n);return load([target,target+'.ts',target+'.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile()));}return req(n);}
 vm.runInNewContext('(function(require,module,exports){'+output+'\n})',{Error,Date,Intl,Blob,URL:{createObjectURL(b){downloaded=b;return'blob:fixture';},revokeObjectURL(){}},document:{createElement(){return{click(){}};}},setTimeout(fn){fn();}})(local,module,module.exports);cache.set(file,module.exports);return module.exports;}
const {PortfolioView}=load(path.join(base,'components/planner/portfolio-view.tsx'));
const session={mode:'live',stale:false,loading:false,error:'',onImportPaymentPlan:async()=>loaded++};
let applied;const props={session,funding:fixture.inputs.funding,onApplyFunding:v=>applied=v,onOpenFunding(){}};
function render(){cursor=0;return PortfolioView(props);}function all(n,p,out=[]){if(Array.isArray(n)){n.forEach(x=>all(x,p,out));return out;}if(!n||typeof n!=='object')return out;if(p(n))out.push(n);all(n.props?.children,p,out);return out;}
function nodes(type){return all(render(),n=>n.type===type);}function button(text){return nodes('button').find(n=>n.props.children===text);}
async function main(){
 const date=nodes('input').find(n=>n.props.type==='date');date.props.onChange({target:{value:'2026-11-23'}});
 assert.equal(nodes('input').filter(n=>n.props.type==='checkbox'&&n.props.required).length,0);
 await nodes('form')[0].props.onSubmit({preventDefault(){}});
 assert.equal(calls.length,1);assert.equal(calls[0].portfolio.confirm_reserve_proxy,true);
 assert.ok(renderToStaticMarkup(render()).includes('Baseline and constrained comparisons'));
 assert.equal(button('Download complete analysis JSON').props.disabled,false);
 button('Download complete analysis JSON').props.onClick();assert.deepEqual(JSON.parse(await downloaded.text()),fixture);
 const numeric=nodes('input').find(n=>n.props.value===36);numeric.props.onChange({target:{value:'24'}});
 assert.equal(button('Download complete analysis JSON').props.disabled,true);
 failed=true;await nodes('form')[0].props.onSubmit({preventDefault(){}});assert.ok(renderToStaticMarkup(render()).includes('Synthetic failure'));
 assert.equal(button('Download complete analysis JSON').props.disabled,true);
 failed=false;
 const file={size:2000,text:async()=>JSON.stringify({kind:'trust-planner-analysis-settings',analysis:fixture.inputs})};
 const input=nodes('input').find(n=>n.props.accept==='.json,application/json');await input.props.onChange({target:{files:[file]}});
 // Handler intentionally returns void; drain the async import chain.
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(loaded,1);assert.deepEqual(JSON.parse(JSON.stringify(applied)),fixture.inputs.funding);
 session.mode='illustrative';assert.ok(nodes('fieldset')[0].props.disabled);
 console.log('Portfolio UI PASS: request/render/export, stale/error guards, validated saved-plan restore, preview isolation.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
