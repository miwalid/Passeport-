import {gpsPresent} from './cooperative';
export function skipState(settings:any,t:any,now=Date.now()){
 const limit=settings.skipLimit??3,waitMinutes=settings.skipWaitMinutes??5;
 const used=t.skipCount??(t.stamps||[]).filter((s:any)=>s.ok===false).length;
 const arrived=t.arrivals?.[String(t.step)];
 const waitSeconds=arrived?Math.max(0,Math.ceil((arrived+waitMinutes*60000-now)/1000)):null;
 return {limit,used,remaining:Math.max(0,limit-used),waitSeconds,canRequest:used<limit&&waitSeconds===0&&!t.request&&!t.done};
}
export function recordArrival(r:any,t:any,position:any,now:number){
 if(r.status!=='running'||t.done||now>=r.start+r.duration*60000||t.arrivals?.[String(t.step)])return false;
 const p=r.posts.find((p:any)=>p.id===t.route[t.step]?.post);
 if(!p||!gpsPresent(position,p,now))return false;
 t.arrivals ||= {};t.arrivals[String(t.step)]=now;return true;
}
export function requestSkip(r:any,t:any,now:number){
 const s=skipState(r.settings,t,now);
 if(t.request)throw Error('لديك طلب تجاوز قيد الانتظار');
 if(s.remaining===0)throw Error('بلغتم الحد الأقصى للتجاوزات');
 if(s.waitSeconds===null)throw Error('يجب تأكيد الوصول إلى المحطة أولًا');
 if(s.waitSeconds>0)throw Error('انتظروا '+s.waitSeconds+' ثانية قبل طلب التجاوز');
 t.request=true;t.skipRequest={id:crypto.randomUUID(),step:t.step,at:now};
}
