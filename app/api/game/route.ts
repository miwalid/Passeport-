import {env} from '../../../supabase/functions/rihla-game/database';
import {bank,makeTeam,normalize,testPosts,upgradeWaitingLibrary} from '../../../lib/game';
import {hydrateClues} from '../../../lib/clue-library';
import {eligibleCountries,clueSpots,validSpot,gpsPresent,huntView,huntComplete,collectClue,releaseHunt} from '../../../lib/cooperative';
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});
function view(r:any,t:any,admin:boolean,member?:any){
 if(admin)return r;
 const route=t.route[t.step],post=r.posts.find((p:any)=>p.id===route?.post),q=r.library.find((q:any)=>q.id===route?.qid);
 const ready=!r.settings.coop||huntComplete(t);
 const opened=t.opened&&r.status==='running'&&ready;
 const {secret,access,members,inviteKey,collections,...safe}=t;
 return {code:r.code,name:r.name,status:r.status,start:r.start,duration:r.duration,grace:r.grace,demo:r.demo,gpsTest:r.gpsTest,settings:r.settings,
 team:{...safe,route:t.route.map((x:any)=>({post:x.post})),...(member?{}:{inviteKey})},
 member:member?{id:member.id,name:member.name}:null,
 hunt:r.settings.coop?huntView(r,t,member):null,
 post:post?{id:post.id,name:post.name,lat:post.lat,lng:post.lng,radius:post.radius}:null,
 clue:opened&&!member?{clue:q?.clue,type:q?.type,choices:q?.choices,image:q?.image,audio:q?.audio}:null,
 hint:t.hinted&&opened&&!member?q?.hint:null,
 ranking:r.teams.map((x:any)=>({id:x.id,name:x.name,color:x.color,emblem:x.emblem,score:x.score,success:x.success,last:x.last})).sort((a:any,b:any)=>b.score-a.score||b.success-a.success||(a.last||Infinity)-(b.last||Infinity))};
}
function assign(r:any,keep=false){
 const qs=eligibleCountries(r);if(!qs.length||r.settings.count>qs.length||r.settings.count>r.posts.length)throw Error('أضف محطات وبلدانًا جاهزة كافية');
 r.teams.forEach((t:any,i:number)=>{const valid=t.route?.length===r.settings.count&&t.route.every((z:any)=>r.posts.some((p:any)=>p.id===z.post)&&qs.some((q:any)=>q.id===z.qid))&&new Set(t.route.map((z:any)=>z.qid)).size===r.settings.count;
 if(!keep||!valid)t.route=Array.from({length:r.settings.count},(_,j)=>({post:r.posts[(j+i)%r.posts.length].id,qid:qs[(j+i)%qs.length].id}));});
}
function start(r:any,now:number){
 if(r.status!=='waiting')throw Error('انطلقت اللعبة بالفعل');
 if(r.teams.length<1)throw Error('أضف فريقًا واحدًا على الأقل');
 if(r.settings.coop){if(r.teams.some((t:any)=>!t.members?.length))throw Error('يجب تسجيل عضو واحد على الأقل لكل فريق عبر QR');if(r.posts.some((p:any)=>p.clueSpots?.length!==10||!p.clueSpots.every(validSpot)))throw Error('اضبط 10 مواقع للأدلة في كل محطة وراجع إمكان الوصول إليها');}
 assign(r,true);r.status='running';r.start=now;
}
export async function POST(req:Request){try{
 const b:any=await req.json();const db=env.DB;if(!db)return json({error:'قاعدة البيانات غير متاحة'},503);
 if(b.action==='create'){
 const code=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase(),token=crypto.randomUUID(),coop=b.coop===true;
 const r:any={code,token,name:String(b.name||'رحلة الاكتشاف').slice(0,100),status:'waiting',start:0,duration:90,grace:5,demo:!!b.demo,catalogVersion:2,settings:{points:100,penalty:10,hint:10,skip:30,count:coop?5:8,coop},library:bank,teams:[],posts:[]};
 if(b.demo){r.teams=[makeTeam('فريق النسور',0),...(!coop?[makeTeam('فريق النجوم',1)]:[])];r.posts=testPosts(b.position).map(p=>({...p,...(coop?{clueSpots:clueSpots(p,25)}:{})}));r.settings.count=4;r.gpsTest=true;assign(r);if(!coop){r.status='running';r.start=Date.now();}}
 await db.prepare('INSERT INTO rooms(code,data,version) VALUES(?,?,0)').bind(code,JSON.stringify(r)).run();return json({code,token,role:'admin',room:r});}
 for(let retry=0;retry<5;retry++){
 const row=await db.prepare('SELECT data,version FROM rooms WHERE code=?').bind(String(b.code||'').toUpperCase()).first<any>();if(!row)return json({error:'رمز اللعبة غير صحيح'},404);
 const r=JSON.parse(row.data),now=Date.now(),admin=b.token===r.token;
 const commit=async()=>{const x=await db.prepare('UPDATE rooms SET data=?,version=version+1 WHERE code=? AND version=?').bind(JSON.stringify(r),r.code,row.version).run();return !!x.meta.changes;};
 let t=r.teams.find((x:any)=>x.id===b.team&&x.access===b.token),member:any=null;
 if(b.action==='memberJoin'){
 const team=r.teams.find((x:any)=>x.id===b.team&&x.inviteKey&&x.inviteKey===b.invite);
 if(!r.settings.coop||!team)throw Error('رابط الفريق غير صحيح');

 const name=String(b.name||'').trim().slice(0,40),device=String(b.device||'');if(!name||!/^[a-f0-9-]{32,40}$/i.test(device))throw Error('أدخل اسمك وافتح الرابط من هاتفك');
 team.members ||= [];const other=r.teams.find((x:any)=>x.id!==team.id&&x.members?.some((m:any)=>m.device===device));if(other)throw Error('هذا الهاتف مسجّل في فريق آخر');
 let m=team.members.find((m:any)=>m.device===device);
 if(!m){if(r.status!=='waiting')throw Error('انتهى التسجيل عند انطلاق اللعبة');if(team.members.length>=30)throw Error('الحد الأقصى 30 عضوًا للفريق');if(team.members.some((m:any)=>normalize(m.name)===normalize(name)))throw Error('الاسم مستخدم، أضف لقبًا لتمييزك');m={id:crypto.randomUUID(),name,device,token:crypto.randomUUID()};team.members.push(m);}
 if(!await commit())continue;return json({code:r.code,team:team.id,member:m.id,token:m.token,role:'member',room:view(r,team,false,m)});}
 if(b.action==='join'){
 t=r.teams.find((x:any)=>x.secret===String(b.secret));if(!t)return json({error:'الرمز السري غير صحيح'},403);
 t.access=crypto.randomUUID();t.inviteKey ||= crypto.randomUUID();t.members ||= [];t.collections ||= {};
 if(!await commit())continue;return json({code:r.code,team:t.id,token:t.access,role:'team',room:view(r,t,false)});}
 if(b.member){t=r.teams.find((x:any)=>x.id===b.team);member=t?.members?.find((m:any)=>m.id===b.member&&m.token===b.token);if(!member)return json({error:'يرجى تسجيل الدخول مجددًا'},403);}
 if(!admin&&!t)return json({error:'يرجى تسجيل الدخول مجددًا'},403);
 if(b.action==='read'){
 let changed=!admin&&!member?releaseHunt(r,t,b.position,now):false;if(admin){changed=upgradeWaitingLibrary(r);changed=hydrateClues(r)||changed;}
 if(changed&&!await commit())continue;return json({room:view(r,t,admin,member)});}
 if(member){if(b.action!=='collect')return json({error:'الإجابة وإدارة الفريق من الهاتف الرئيسي فقط'},403);collectClue(r,t,member,b,now);if(!await commit())continue;return json({room:view(r,t,false,member)});}
 if(!admin&&b.action==='memberRemove'){
 if(!r.settings.coop||r.status!=='waiting')throw Error('يمكن تعديل الأعضاء قبل الانطلاق فقط');t.members=(t.members||[]).filter((m:any)=>m.id!==b.target);
 if(!await commit())continue;return json({room:view(r,t,false)});}
 if(!admin&&b.action==='demoStart'){if(!r.demo||!r.settings.coop)throw Error('غير متاح');start(r,now);if(!await commit())continue;return json({room:view(r,t,false)});}
 const end=r.start+r.duration*60000,close=end+r.grace*60000;
 if(admin){
 if(b.action==='save'){
 if(r.status!=='waiting')throw Error('لا يمكن تعديل الإعدادات بعد الانطلاق');const c=b.config;
 const numeric={points:+c.settings.points,penalty:+c.settings.penalty,hint:+c.settings.hint,skip:+c.settings.skip,count:+c.settings.count};
 if(Object.values(numeric).some(v=>!Number.isFinite(v)||v<0)||!Number.isInteger(numeric.count)||numeric.count<1)throw Error('تحقق من البارم وعدد البلدان');
 if(!Number.isFinite(+c.duration)||+c.duration<1||+c.duration>600)throw Error('تحقق من المدة');
 if(!Array.isArray(c.library)||!Array.isArray(c.posts)||!Array.isArray(c.teams)||c.library.length>200)throw Error('إعدادات غير صالحة');
 r.name=String(c.name).slice(0,100);r.duration=+c.duration;r.settings={...numeric,coop:c.settings.coop===true};
 r.posts=c.posts.map((p:any)=>{if(!Number.isFinite(+p.lat)||Math.abs(+p.lat)>90||!Number.isFinite(+p.lng)||Math.abs(+p.lng)>180||!Number.isFinite(+p.radius)||+p.radius<5)throw Error('إحداثيات أو نطاق غير صحيح');return {id:p.id,name:String(p.name).slice(0,80),lat:+p.lat,lng:+p.lng,radius:+p.radius,rescue:p.rescue,clueSpots:Array.isArray(p.clueSpots)?p.clueSpots.map((s:any)=>({lat:+s.lat,lng:+s.lng,radius:+s.radius})):[]};});
 if(c.teams.length>100||new Set(c.teams.map((x:any)=>x.secret)).size!==c.teams.length||new Set(c.teams.map((x:any)=>x.id)).size!==c.teams.length)throw Error('معرّفات الفرق ورموزها يجب أن تكون مختلفة');
 r.teams=c.teams.map((x:any,i:number)=>{const old=r.teams.find((v:any)=>v.id===x.id)||{...makeTeam(x.name,i),id:x.id};return {...old,inviteKey:old.inviteKey||crypto.randomUUID(),members:old.members||[],collections:old.collections||{},name:String(x.name).slice(0,40),color:String(x.color),emblem:String(x.emblem),secret:String(x.secret),route:Array.isArray(x.route)?x.route:[]};});
 r.library=c.library;hydrateClues(r);if(eligibleCountries(r).length<numeric.count)throw Error('عدد البلدان الجاهزة غير كافٍ: وضع التعاون يتطلب 10 أدلة لكل بلد');
 }else if(b.action==='start')start(r,now);
 else if(b.action==='assign'){if(r.status!=='waiting')throw Error('التوزيع قبل الانطلاق فقط');assign(r);}
 else if(b.action==='finish'){r.status='finished';r.finishedAt ||= now;r.teams.forEach((x:any)=>{x.done=true;x.request=false;});}
 else if(b.action==='skip'){
 const x=r.teams.find((x:any)=>x.id===b.target);if(!x?.request)throw Error('الطلب غير موجود');
 if(b.approve){if(r.status!=='running'||now>=close)throw Error('انتهت اللعبة');const q=r.library.find((q:any)=>q.id===x.route[x.step]?.qid);if(!q)throw Error('المحطة غير موجودة');x.score=Math.max(0,x.score-r.settings.skip);x.stamps.push({country:q.country,flag:q.flag,ok:false});x.step++;x.errors=0;x.hinted=false;x.opened=0;x.override=false;x.done=now>=end||x.step>=x.route.length;}x.request=false;
 }else throw Error('إجراء غير معروف');
 }else{
 if(r.status!=='running'||t.done||now>=close)throw Error('انتهى وقت الإجابة');
 if(r.settings.coop&&b.step!==t.step)throw Error('تغيّرت المرحلة، حدّث الصفحة');
 const step=t.route[t.step],p=r.posts.find((x:any)=>x.id===step?.post),q=r.library.find((x:any)=>x.id===step?.qid);if(!p||!q)throw Error('المسار غير متاح');
 const present=(r.demo&&!r.gpsTest)||t.override||gpsPresent(b.position,p,now),ready=!r.settings.coop||huntComplete(t);
 if(b.action==='rescue'){if(now>=end&&!t.opened)throw Error('انتهى وقت فتح الألغاز');if(String(b.rescue)!==p.rescue)throw Error('رمز الطوارئ غير صحيح');t.override=true;if(r.settings.coop){t.arrivals ||= {};t.arrivals[String(t.step)] ||= now;}if(ready)t.opened ||= now;}
 else{
 if(!present)throw Error('ابق داخل نطاق المحطة مع موقع حديث ودقيق');
 if(b.action==='request'&&r.settings.coop)t.request=true;
 else if(!ready)throw Error('اجمعوا الأدلة العشرة أولًا');
 else if(b.action==='open'){if(now>=end)throw Error('انتهى وقت فتح ألغاز جديدة');t.opened ||= now;}
 else{
 if(!t.opened)throw Error('افتح اللغز أولًا');
 if(b.action==='hint'){if(!t.hinted){t.score=Math.max(0,t.score-r.settings.hint);t.hinted=true;}}
 else if(b.action==='request')t.request=true;
 else if(b.action==='answer'){
 const answers=[q.country,...String(q.aliases||'').split(',')].filter(Boolean).map(normalize);
 if(answers.includes(normalize(String(b.answer)))){t.score+=r.settings.points;t.success++;t.last=now-r.start;t.stamps.push({country:q.country,flag:q.flag,ok:true});t.step++;t.errors=0;t.hinted=false;t.opened=0;t.override=false;t.request=false;t.done=now>=end||t.step>=t.route.length;}
 else{t.errors++;if(t.errors>1)t.score=Math.max(0,t.score-r.settings.penalty);}
 }else throw Error('إجراء غير معروف');
 }}
 }
 if(!await commit())continue;return json({room:view(r,t,admin)});
 }return json({error:'تحديث متزامن، حاول مجددًا'},409);
 }catch(e:any){return json({error:e.message||'تعذر تنفيذ الطلب'},400);}}
