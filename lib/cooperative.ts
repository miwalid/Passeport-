import {distance} from './team-utils';
export const readyCountry=(q:any)=>Array.isArray(q.clues)&&q.clues.length===10&&q.clues.every((s:any)=>typeof s==='string'&&s.trim().length>0);
export const eligibleCountries=(r:any)=>r.settings.coop?r.library.filter(readyCountry):r.library;
export function clueSpots(p:any,spread=35){return Array.from({length:10},(_,i)=>{const a=i*2*Math.PI/10;return {lat:+(+p.lat+Math.cos(a)*spread/111320).toFixed(7),lng:+(+p.lng+Math.sin(a)*spread/(111320*Math.cos(+p.lat*Math.PI/180))).toFixed(7),radius:10};});}
export function validSpot(p:any){return p&&Number.isFinite(+p.lat)&&Math.abs(+p.lat)<=85&&Number.isFinite(+p.lng)&&Math.abs(+p.lng)<=180&&Number.isFinite(+p.radius)&&+p.radius>=5&&+p.radius<=200;}
export function gpsPresent(position:any,p:any,now=Date.now()){return position&&Number.isFinite(position.lat)&&Number.isFinite(position.lng)&&Number.isFinite(position.accuracy)&&position.accuracy>=0&&position.accuracy<=Math.max(50,+p.radius*2)&&Number.isFinite(position.at)&&Math.abs(now-position.at)<30000&&distance(position,p)<=+p.radius;}
export function ownerFor(t:any,index:number){const members=t.members||[];return members.length?members[(index+t.step)%members.length]:null;}
export const collections=(t:any)=>(t.collections?.[String(t.step)]||[]) as {index:number;member:string;at:number;rescue?:boolean}[];
export const huntComplete=(t:any)=>new Set(collections(t).map(x=>x.index)).size===10;
export const huntReleased=(t:any)=>!!t.arrivals?.[String(t.step)];
export function releaseHunt(r:any,t:any,position:any,now=Date.now()){
 const post=r.posts.find((p:any)=>p.id===t.route[t.step]?.post);
 if(!r.settings.coop||r.status!=='running'||t.done||now>=r.start+r.duration*60000||huntReleased(t)||!post||!gpsPresent(position,post,now))return false;
 t.arrivals ||= {};t.arrivals[String(t.step)]=now;return true;
}
export function huntView(r:any,t:any,member?:any){const step=t.route[t.step],post=r.posts.find((p:any)=>p.id===step?.post),q=r.library.find((q:any)=>q.id===step?.qid);const found=collections(t);return {released:huntReleased(t),count:found.length,total:10,step:t.step,clues:huntComplete(t)?q?.clues||[]:[],assignments:huntReleased(t)&&member&&post&&r.status==='running'&&!t.done?Array.from({length:10},(_,index)=>({index,spot:post.clueSpots?.[index],found:found.some(x=>x.index===index)})).filter(x=>ownerFor(t,x.index)?.id===member.id):[],members:(t.members||[]).map((m:any)=>({id:m.id,name:m.name,assigned:Array.from({length:10},(_,i)=>i).filter(i=>ownerFor(t,i)?.id===m.id).length,collected:found.filter(x=>x.member===m.id).length}))};}
export function collectClue(r:any,t:any,m:any,b:any,now=Date.now()){
 if(!r.settings.coop||r.status!=='running'||t.done||now>=r.start+r.duration*60000)throw Error('انتهى وقت جمع الأدلة');
 if(!huntReleased(t))throw Error('بانتظار وصول الهاتف الرئيسي إلى المحطة');
 if(b.step!==t.step||!Number.isInteger(b.index)||b.index<0||b.index>9)throw Error('تغيّرت المرحلة، حدّث الصفحة');
 if(ownerFor(t,b.index)?.id!==m.id)throw Error('هذا الدليل مخصّص لعضو آخر');
 if(collections(t).some(x=>x.index===b.index))return;
 const route=t.route[t.step],post=r.posts.find((p:any)=>p.id===route?.post),spot=post?.clueSpots?.[b.index];
 if(!validSpot(spot))throw Error('موقع الدليل غير مضبوط');
 const rescue=!!b.rescue&&String(b.rescue)===String(post.rescue);
 if(!rescue&&!gpsPresent(b.position,spot,now))throw Error('اقترب من موقع الدليل وفعّل موقعًا حديثًا ودقيقًا');
 t.collections ||= {};t.collections[String(t.step)] ||= [];t.collections[String(t.step)].push({index:b.index,member:m.id,at:now,rescue});
 if(huntComplete(t))t.opened=t.opened||now;
}
