import {useLayoutEffect,useRef} from 'react';
import {flushSync} from 'react-dom';

type Transition = {skipTransition:()=>void;ready:Promise<void>;finished:Promise<void>};
type TransitionDocument = Document & {startViewTransition?:(update:()=>void)=>Transition};

/** Keep navigation immediate, including on older Android WebViews. */
export function usePageTransition(screen:string,tab:string,setScreen:(value:string)=>void,setTab:(value:string)=>void){
 const current=useRef({screen,tab});
 const active=useRef<Transition|null>(null);
 const revision=useRef(0);
 const fallback=useRef<Animation[]>([]);
 useLayoutEffect(()=>{
  if(active.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const nodes=document.querySelectorAll('main > :not(header):not(nav):not(footer):not(.team-title):not(.stats):not(.toast):not(.loading):not(.answer-effect):not(.dialog-backdrop)');
  fallback.current.forEach(animation=>animation.cancel());
  fallback.current=Array.from(nodes).flatMap(node=>typeof node.animate==='function'?[node.animate([{opacity:0,transform:'translateX(20px)'},{opacity:1,transform:'translateX(0)'}],{duration:350,easing:'cubic-bezier(.22,1,.36,1)'})]:[]);
  return()=>{fallback.current.forEach(animation=>animation.cancel());fallback.current=[];};
 },[screen,tab]);
 useLayoutEffect(()=>()=>{revision.current++;active.current?.skipTransition();},[]);
 function navigate(kind:'screen'|'tab',value:string){
  if(current.current[kind]===value)return;
  const id=++revision.current;
  const before=current.current;
  current.current={...before,[kind]:value};
  const order=['passport','navigation','riddle','ranking'];
  document.documentElement.dataset.journeyDirection=kind==='tab'&&order.indexOf(value)<order.indexOf(before.tab)?'back':'forward';
  active.current?.skipTransition();
  const update=(sync=true)=>{if(id!==revision.current)return;const commit=()=>{setScreen(current.current.screen);setTab(current.current.tab);};if(sync)flushSync(commit);else commit();};
  const doc=document as TransitionDocument;
  if(!doc.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches){active.current=null;update(false);return;}
  try{
   const transition=doc.startViewTransition(()=>update());
   active.current=transition;
   transition.ready.catch(()=>{});
   transition.finished.catch(()=>{}).finally(()=>{if(active.current===transition)active.current=null;});
  }catch{active.current=null;update(false);}
 }
 return {navigateScreen:(value:string)=>navigate('screen',value),navigateTab:(value:string)=>navigate('tab',value)};
}
