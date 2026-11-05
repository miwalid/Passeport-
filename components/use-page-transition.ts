import {useLayoutEffect,useRef} from 'react';

const excluded='header,nav,footer,.toast,.loading,.answer-effect,.dialog-backdrop';

/** A short, staggered rise and fade, matching the supplied Android reference. */
export function animatePageEntrance(main:HTMLElement,includeStats:boolean,reducedMotion:boolean){
 if(reducedMotion)return [];
 const targets:Element[]=[];
 for(const node of Array.from(main.children)){
  if(node.matches(excluded)||(!includeStats&&node.matches('.team-title,.stats')))continue;
  // Reveal form rows individually rather than moving a whole long form at once.
  if(node.matches('.form-card')){
   for(const child of Array.from(node.children)){
    if(child.matches('form'))targets.push(...Array.from(child.children));
    else targets.push(child);
   }
  }else targets.push(node);
 }
 const visible=targets.filter(node=>{const rect=node.getBoundingClientRect();return rect.height>0&&rect.bottom>0&&rect.top<window.innerHeight;});
 return visible.flatMap((node,index)=>typeof node.animate==='function'?[node.animate(
  [{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],
  {duration:480,delay:Math.min(index*65,260),easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'}
 )]:[]);
}

export function usePageTransition(screen:string,tab:string,setScreen:(value:string)=>void,setTab:(value:string)=>void){
 const current=useRef({screen,tab});
 const previousScreen=useRef('');
 useLayoutEffect(()=>{
  window.scrollTo({top:0,behavior:'instant' as ScrollBehavior});
  const main=document.querySelector('main');
  const includeStats=previousScreen.current!==screen;
  previousScreen.current=screen;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animations=main?animatePageEntrance(main,includeStats,reducedMotion):[];
  return()=>animations.forEach(animation=>animation.cancel());
 },[screen,tab]);
 function navigate(kind:'screen'|'tab',value:string){
  if(current.current[kind]===value)return;
  current.current={...current.current,[kind]:value};
  setScreen(current.current.screen);
  setTab(current.current.tab);
 }
 return {navigateScreen:(value:string)=>navigate('screen',value),navigateTab:(value:string)=>navigate('tab',value)};
}
