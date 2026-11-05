'use client';
import {skipState} from '../lib/skip-rules';
export function SkipRequestPanel({room,team,now,busy,onRequest}:any){
 const s=skipState(room.settings,team,now),wait=s.waitSeconds;
 const time=wait===null?'':Math.floor(wait/60).toString().padStart(2,'0')+':'+(wait%60).toString().padStart(2,'0');
 return <section className="notice"><p>التجاوزات المستعملة: <b dir="ltr">{s.used} / {s.limit}</b> · المتبقي: {s.remaining}</p><p>{team.request?'طلبكم قيد مراجعة المنظّم.':!s.remaining?'استُنفد عدد التجاوزات المسموح بها.':wait===null?'يبدأ وقت الانتظار بعد تأكيد الوصول إلى المحطة.':wait>0?'الوقت المتبقي قبل طلب التجاوز: '+time:'يمكنكم الآن طلب تجاوز هذه المحطة.'}</p><p>عند الموافقة: خصم {room.settings.skip} نقطة، دون نقاط أو ختم نجاح لهذا البلد.</p><button type="button" disabled={busy||!s.canRequest} onClick={()=>{if(confirm('إرسال طلب تجاوز؟ يُخصم '+room.settings.skip+' نقطة عند موافقة المنظّم.'))onRequest()}}>{team.request?'تم إرسال الطلب':'طلب تجاوز من المنظّم'}</button></section>;
}
