'use client';
import {useEffect,useRef,useState} from 'react';
import {compassHeading} from '../lib/compass';
export function useCompass(notify:(s:string)=>void){
 const [heading,H]=useState<number|null>(null);const stop=useRef<()=>void>(()=>{});
 useEffect(()=>()=>stop.current(),[]);
 async function orient(){
 stop.current();H(null);
 try{const w=window as any;if(!w.DeviceOrientationEvent)throw Error('هذا الجهاز لا يوفّر بوصلة. جرّب هاتفًا يدعمها.');if(w.DeviceOrientationEvent.requestPermission&&await w.DeviceOrientationEvent.requestPermission(true)!=='granted')throw Error('اسمح بالوصول إلى مستشعر اتجاه الهاتف');
 let last=0;const event=(e:any)=>{const h=compassHeading(e,window.screen.orientation?.angle??w.orientation??0);if(h!==null){last=Date.now();H(h)}};
 window.addEventListener('deviceorientationabsolute',event,true);window.addEventListener('deviceorientation',event,true);
 const timer=setInterval(()=>{if(Date.now()-last>4000)H(null)},1000);
 stop.current=()=>{clearInterval(timer);window.removeEventListener('deviceorientationabsolute',event,true);window.removeEventListener('deviceorientation',event,true)};
 notify('أبقِ الهاتف مسطّحًا وحرّكه على شكل 8 للمعايرة، بعيدًا عن المعادن.');
 }catch(e:any){notify(e.message)}
 }
 return {heading,orient};
}
