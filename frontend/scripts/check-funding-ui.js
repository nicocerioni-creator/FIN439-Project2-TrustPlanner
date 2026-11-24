/* Component-level wiring checks using installed React/TypeScript; no browser or new dependencies.
   The API response fixture is a synthetic zero-return unit example, never the locked investment run. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const assert = require('assert/strict');
const base = path.resolve(__dirname, '..');
const req = createRequire(path.join(base, 'package.json'));
const ts = req('typescript');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const fixture = JSON.parse(fs.readFileSync(path.join(base, 'handoff/api/funding-projection.example.json'), 'utf8'));
const reference = JSON.parse(fs.readFileSync(path.join(base, 'handoff/api/reference-case.json'), 'utf8'));
const calls = [];
let rejectRequest = false;
let downloaded;
let clicked = false;
let cursor = 0;
const hooks = [];
const react = {...React,
  useState(initial) {
    const slot = cursor++;
    if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
    return [hooks[slot], value => { hooks[slot] = typeof value === 'function' ? value(hooks[slot]) : value; }];
  },
  useRef(initial) { const slot = cursor++; return hooks[slot] ?? (hooks[slot] = {current: initial}); },
  useEffect() { cursor++; },
};
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const module = {exports:{}};
  const output = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{
    jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
  }}).outputText;
  const local = name => {
    if (name === 'react') return react;
    if (name === '@/lib/api') return {calculateFundingProjection: async input => {
      calls.push(structuredClone(input));
      if (rejectRequest) throw Error('Synthetic service failure');
      return structuredClone(fixture);
    }};
    if (name.startsWith('@/') || name.startsWith('.')) {
      const target = name.startsWith('@/') ? path.join(base,name.slice(2)) : path.resolve(path.dirname(file),name);
      return load([target,target+'.ts',target+'.tsx'].find(p => fs.existsSync(p) && fs.statSync(p).isFile()));
    }
    return req(name);
  };
  vm.runInNewContext('(function(require,module,exports){'+output+'\n})', {
    Blob, Date, Intl, Error,
    URL:{createObjectURL(blob){downloaded=blob;return 'blob:fixture';},revokeObjectURL(){}},
    document:{createElement(){return {click(){clicked=true;}};}},setTimeout(callback){callback();},
  })(local,module,module.exports);
  cache.set(file,module.exports); return module.exports;
}
const {FundingView} = load(path.join(base,'components/planner/funding-view.tsx'));
const session = {mode:'live', result:{inputs:structuredClone(fixture.inputs.payment_inputs),beneficiaries:[{}],annual_amounts_model_start_dollars:{college:'50000',adult_minimum:'120',adult_target:'1200'}},reference,
  stale:false,loading:false,error:''};
let sharedInflation;
function render(){cursor=0;return FundingView({session,inflation:sharedInflation});}
function all(node, pred, out=[]){
  if(Array.isArray(node)){node.forEach(x=>all(x,pred,out));return out;}
  if(!node||typeof node!=='object')return out;
  if(pred(node))out.push(node);
  all(node.props?.children,pred,out);return out;
}
function nodes(type){return all(render(),x=>x.type===type);}
function exportButton(){return nodes('button').find(x=>x.props.children==='Download funding projection JSON');}
function html(){return renderToStaticMarkup(render());}
async function main(){
 const field=name=>nodes('input').find(n=>n.props['data-field']===name);
 assert.equal(calls.length,0);assert.equal(field('opening').props.value,'');
 field('opening').props.onChange({target:{value:'120'}});field('inflation').props.onChange({target:{value:'0'}});
 assert.equal(field('cost').props.value,'0');assert.ok(!field('cost').props.required);assert.equal(field('opening-cost').props.value,'0');
 assert.ok(html().includes('Optional costs and expenses'));assert.ok(!html().includes('Opening shock assumptions'));assert.ok(!html().includes('College reserve transfer rule'));
 assert.equal(nodes('select').length,0);
 nodes('input').filter(n=>n.props.type==='radio')[1].props.onChange();
 field('college').props.onChange({target:{value:'0'}});field('support').props.onChange({target:{value:'0'}});
 await nodes('form')[0].props.onSubmit({preventDefault(){}});
 assert.equal(calls.length,1);assert.equal(calls[0].opening_balance,'120');assert.equal(calls[0].annual_cost_percent,'0');
 assert.equal(calls[0].include_horizon_day_payments,true);assert.equal(calls[0].reserve_transfer_rule,'protect_before_payments');assert.equal(calls[0].initial_support_shock_percent,'0');
 assert.equal(exportButton().props.disabled,false);assert.ok(html().includes('Where the opening money goes'));assert.ok(html().includes('Stopped: payment shortfall'));assert.ok(!html().includes('NaN'));
 exportButton().props.onClick();assert.deepEqual(JSON.parse(await downloaded.text()),fixture);
 field('inflation').props.onChange({target:{value:'2'}});assert.equal(exportButton().props.disabled,true);
 rejectRequest=true;await nodes('form')[0].props.onSubmit({preventDefault(){}});field('inflation').props.onChange({target:{value:'0'}});assert.equal(exportButton().props.disabled,true);assert.ok(html().includes('Synthetic service failure'));
 session.stale=true;const before=calls.length;await nodes('form')[0].props.onSubmit({preventDefault(){}});assert.equal(calls.length,before);assert.ok(nodes('fieldset')[0].props.disabled);
 session.stale=false;session.mode='illustrative';assert.ok(nodes('fieldset')[0].props.disabled);assert.ok(html().includes('disabled in the design preview'));
 session.mode='live';rejectRequest=false;sharedInflation={value:'4',onChange(v){this.value=v;}};
 await nodes('form')[0].props.onSubmit({preventDefault(){}});assert.equal(calls.at(-1).annual_cpi_change_percent,'4');
 sharedInflation.value='6';assert.equal(field('inflation').props.value,'6');assert.equal(exportButton().props.disabled,true);
 field('inflation').props.onChange({target:{value:'3'}});assert.equal(sharedInflation.value,'3');
 console.log('Funding UI PASS: redesigned sections, explicit manual rates, optional zero costs, fixed college-first/80th-birthday policy, no opening-shock fields, exact export and stale/error/preview guards.');
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
