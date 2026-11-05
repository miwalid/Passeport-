import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const code=ts.transpileModule(fs.readFileSync('components/use-page-transition.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText.replace(/^import .*;\n/gm,'').replace('export function usePageTransition','function usePageTransition');
function fixture(native=true,reduced=false){
 const pending=[];const state={screen:'team',tab:'ranking'};
 const document={documentElement:{dataset:{}},...(native?{startViewTransition(update){let finish;const finished=new Promise(resolve=>finish=resolve);pending.push(async()=>{await update();finish();});return {skipTransition(){finish();},ready:Promise.resolve(),finished};}}:{})};
 const hook=new Function('useRef','useLayoutEffect','flushSync','document','matchMedia',code+';return usePageTransition;')((current)=>({current}),()=>{},fn=>fn(),document,()=>({matches:reduced}));
 const nav=hook(state.screen,state.tab,value=>state.screen=value,value=>state.tab=value);
 return {state,nav,pending};
}
const a=fixture();a.nav.navigateScreen('config');a.nav.navigateTab('posts');for(const commit of a.pending)await commit();assert.deepEqual(a.state,{screen:'config',tab:'posts'});
const b=fixture();b.nav.navigateTab('passport');b.nav.navigateTab('navigation');b.nav.navigateTab('ranking');for(const commit of b.pending)await commit();assert.equal(b.state.tab,'ranking');
for(const [native,reduced] of [[false,false],[true,true]]){const c=fixture(native,reduced);c.nav.navigateScreen('home');c.nav.navigateTab('passport');assert.deepEqual(c.state,{screen:'home',tab:'passport'});assert.equal(c.pending.length,0);}
const d=fixture();d.nav.navigateTab('ranking');assert.equal(d.pending.length,0);
console.log('PASS: combined screen/tab changes, rapid navigation keeps last request, legacy fallback, reduced motion and unchanged tabs.');
