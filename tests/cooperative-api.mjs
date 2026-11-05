import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import ts from 'typescript';
const rows=new Map();globalThis.__testDB={prepare(sql){let args=[];return {bind(...a){args=a;return this;},async first(){const x=rows.get(args[0]);return x?structuredClone(x):null;},async run(){if(sql.startsWith('INSERT')){rows.set(args[0],{data:args[1],version:0});return {meta:{changes:1}};}const old=rows.get(args[1]);if(old?.version!==args[2])return {meta:{changes:0}};rows.set(args[1],{data:args[0],version:old.version+1});return {meta:{changes:1}};}};}};
const compiled=new Map();function load(file){file=path.resolve(file);if(compiled.has(file))return compiled.get(file);let s=fs.readFileSync(file,'utf8').replace(/import \{env\} from '[^']+';/,"const env={DB:globalThis.__testDB};");s=s.replace(/from ['"](\.[^'"]+)['"]/g,(full,p)=>'from '+JSON.stringify(load(path.resolve(path.dirname(file),p+'.ts'))));const js=ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;const url='data:text/javascript;base64,'+Buffer.from(js).toString('base64');compiled.set(file,url);return url;}
const {POST}=await import(load('app/api/game/route.ts'));const {makeTeam}=await import(load('lib/game.ts'));const {clueSpots}=await import(load('lib/cooperative.ts'));
const {cooperativeClues,hydrateClues}=await import(load('lib/clue-library.ts'));
assert.equal(Object.keys(cooperativeClues).length,50);assert.equal(Object.values(cooperativeClues).flat().length,500);
for(const clues of Object.values(cooperativeClues)){assert.equal(clues.length,10);assert.equal(new Set(clues).size,10);assert(clues.every(s=>s.trim().length>15));}
const waiting={status:'waiting',library:[{country:'فرنسا',clues:[]},{country:'الهند',clues:['دليل مخصص']},{country:'المغرب'},{country:'الصين',clues:[]},{country:'أستراليا',clues:[]} ]};
assert(hydrateClues(waiting));assert.equal(waiting.library.filter(q=>q.clues.length===10).length,4);assert.deepEqual(waiting.library[1].clues,['دليل مخصص']);assert.equal(hydrateClues(waiting),false);
const running={status:'running',library:[{country:'فرنسا',clues:[]}]};assert.equal(hydrateClues(running),false);assert.deepEqual(running.library[0].clues,[]);
const oldReady=new Set(['اليابان','إيطاليا','مصر','تونس','البرازيل','فرنسا','الهند','أستراليا','المغرب','الصين']);
const upgrade={status:'waiting',library:Object.entries(cooperativeClues).map(([country,clues])=>({country,clues:oldReady.has(country)?[...clues]:[]}))};
const preserved=JSON.stringify(upgrade.library.filter(q=>oldReady.has(q.country)));assert(hydrateClues(upgrade));assert.equal(upgrade.library.filter(q=>q.clues.length===10).length,50);assert.equal(JSON.stringify(upgrade.library.filter(q=>oldReady.has(q.country))),preserved);assert.equal(hydrateClues(upgrade),false);
let clock=Date.now();const realNow=Date.now;Date.now=()=>clock;
const position=(p)=>({lat:p.lat,lng:p.lng,accuracy:4,at:clock});
async function call(action,data={},auth={},expected=200){const res=await POST(new Request('http://test/api/game',{method:'POST',body:JSON.stringify({...auth,...data,action})}));const body=await res.json();assert.equal(res.status,expected,JSON.stringify({action,body}));return body;}
const created=await call('create',{name:'تعاون',coop:true});const admin={code:created.code,token:created.token};const config=created.room;config.settings.count=2;assert.equal(config.library.filter(q=>q.clues.length===10).length,50);
config.teams=[makeTeam('ألف',0),makeTeam('باء',1)];config.posts=[0,1].map(i=>{const p={id:'p'+i,name:'محطة '+i,lat:36.8+i*.001,lng:10.18,radius:20,rescue:'123456'};return {...p,clueSpots:clueSpots(p)};});await call('save',{config},admin);
const main=await call('join',{code:created.code,secret:config.teams[0].secret});const primary={code:main.code,team:main.team,token:main.token};assert(!JSON.stringify(main.room).includes('فوجي'));assert.equal(main.room.hunt.clues.length,0);
const invite={code:main.code,team:main.team,invite:main.room.team.inviteKey};
await call('memberJoin',{...invite,invite:'wrong',name:'عضو',device:crypto.randomUUID()},{},400);
const device=crypto.randomUUID();const one=await call('memberJoin',{...invite,name:'أحمد',device});const two=await call('memberJoin',{...invite,name:'سلمى',device:crypto.randomUUID()});const member=x=>({code:x.code,team:x.team,member:x.member,token:x.token});const m1=member(one),m2=member(two);
assert.equal((await call('memberJoin',{...invite,name:'أحمد',device})).member,one.member);
await call('memberJoin',{...invite,name:'أحمد',device:crypto.randomUUID()},{},400);
const mainB=await call('join',{code:created.code,secret:config.teams[1].secret});const inviteB={code:created.code,team:mainB.team,invite:mainB.room.team.inviteKey};await call('memberJoin',{...inviteB,name:'أحمد',device},{},400);await call('memberJoin',{...inviteB,name:'مريم',device:crypto.randomUUID()});
// A stale organizer form must not erase members who joined while it was open.
await call('save',{config},admin);const refreshed=await call('read',{},primary);assert.equal(refreshed.room.hunt.members.length,2);assert(!JSON.stringify(refreshed.room).includes(one.token));assert(!JSON.stringify(refreshed.room).includes(device));assert(!JSON.stringify(one.room).includes(invite.invite));assert(!JSON.stringify(one.room).includes(two.token));
await call('start',{},admin);assert.equal((await call('memberJoin',{...invite,name:'أحمد',device})).member,one.member);await call('memberJoin',{...invite,name:'متأخر',device:crypto.randomUUID()},{},400);
await call('answer',{step:0,answer:'اليابان',position:position(config.posts[0])},m1,403);
await call('open',{step:0,position:position(config.posts[0])},primary,400);
// Members cannot reveal assignments or collect before principal arrival.
const locked=await call('read',{},m1);assert.equal(locked.room.hunt.released,false);assert.deepEqual(locked.room.hunt.assignments,[]);
await call('collect',{step:0,index:0,rescue:'123456'},m1,400);
await call('read',{position:position(config.posts[0])},m1);assert.equal((await call('read',{},primary)).room.hunt.released,false);
await call('read',{position:{...position(config.posts[0]),at:clock-31000}},primary);assert.equal((await call('read',{},primary)).room.hunt.released,false);
await call('read',{position:position({lat:0,lng:0})},primary);assert.equal((await call('read',{},primary)).room.hunt.released,false);
await call('read',{position:position(config.posts[0])},primary);
assert.equal((await call('read',{},m1)).room.hunt.assignments.length,5);
assert.equal((await call('read',{},primary)).room.hunt.released,true);
const rescued=await call('rescue',{step:0,rescue:'123456'},primary);assert.equal(rescued.room.team.opened,0);assert.equal(rescued.room.clue,null);
const spots=config.posts[0].clueSpots;
await call('collect',{step:0,index:0,position:position(spots[0])},m2,400);
await call('collect',{step:0,index:0,position:{...position(spots[0]),at:clock-31000}},m1,400);
await call('collect',{step:0,index:0,position:position({lat:0,lng:0})},m1,400);
await call('collect',{step:0,index:0,position:{...position(spots[0]),accuracy:100}},m1,400);
await call('collect',{step:0,index:0,rescue:'wrong'},m1,400);
await call('collect',{step:0,index:0,position:position(spots[0])},m1);
await Promise.all([call('collect',{step:0,index:1,position:position(spots[1])},m2),call('collect',{step:0,index:2,position:position(spots[2])},m1)]);
const repeat=await call('collect',{step:0,index:0,position:position(spots[0])},m1);assert.equal(repeat.room.hunt.count,3);assert.equal(repeat.room.hunt.clues.length,0);
for(let i=3;i<9;i++)await call('collect',{step:0,index:i,position:position(spots[i])},i%2?m2:m1);
const nine=await call('read',{},primary);assert.equal(nine.room.hunt.count,9);assert.equal(nine.room.clue,null);assert(!JSON.stringify(nine.room).includes('فوجي'));
await call('collect',{step:0,index:9,position:position(spots[9])},m2);const unlocked=await call('read',{},primary);assert.equal(unlocked.room.hunt.count,10);assert.equal(unlocked.room.hunt.clues.length,10);assert(unlocked.room.clue);assert(unlocked.room.team.opened);
const next=await call('answer',{step:0,answer:'اليابان',position:position(config.posts[0])},primary);assert.equal(next.room.team.score,100);assert.equal(next.room.team.step,1);assert.equal(next.room.hunt.count,0);await call('collect',{step:0,index:0,position:position(spots[0])},m1,400);
assert.equal(next.room.hunt.released,false);assert.deepEqual((await call('read',{},m2)).room.hunt.assignments,[]);
await call('collect',{step:1,index:0,rescue:'123456'},m2,400);
await call('rescue',{step:1,rescue:'123456'},primary);
const nextM=await call('read',{},m2);assert(nextM.room.hunt.assignments.some(a=>a.index===0));
for(let i=0;i<10;i++)await call('collect',{step:1,index:i,rescue:'123456'},i%2?m1:m2);
const secondPost=config.posts[1];await call('answer',{step:1,answer:'خطأ',position:position(secondPost)},primary);const penalty=await call('answer',{step:1,answer:'خطأ',position:position(secondPost)},primary);assert.equal(penalty.room.team.score,90);
const started=(await call('read',{},admin)).room.start;clock=started+90*60000+60000;
await call('collect',{step:1,index:0,rescue:'123456'},m2,400);
const grace=await call('answer',{step:1,answer:'إيطاليا',position:position(secondPost)},primary);assert.equal(grace.room.team.score,190);assert(grace.room.team.done);
// Classic GPS games still unlock immediately at their post.
clock=realNow();const classic=await call('create',{demo:true,position:position({lat:36.8,lng:10.18})});const cMain=await call('join',{code:classic.code,secret:classic.room.teams[0].secret});const ca={code:classic.code,team:cMain.team,token:cMain.token};assert.equal(cMain.room.hunt,null);await call('open',{position:position(classic.room.posts[0])},ca);const success=await call('answer',{answer:'اليابان',position:position(classic.room.posts[0])},ca);assert.equal(success.room.team.score,100);
await call('finish',{},admin);await call('collect',{step:0,index:0,rescue:'123456'},m1,400);
// A real (non-demo) solo game starts with one team and supports GPS answers.
clock=realNow();const solo=await call('create',{name:'Solo',coop:false});const soloAdmin={code:solo.code,token:solo.token};const soloConfig=solo.room;soloConfig.settings.count=1;soloConfig.posts=[{id:'solo-post',name:'Solo post',lat:36.8,lng:10.18,radius:20,rescue:'654321'}];soloConfig.teams=[];await call('save',{config:soloConfig},soloAdmin);await call('start',{},soloAdmin,400);
soloConfig.teams=[makeTeam('Solo',0)];await call('save',{config:soloConfig},soloAdmin);await call('start',{},soloAdmin);const soloJoin=await call('join',{code:solo.code,secret:soloConfig.teams[0].secret});const soloAuth={code:solo.code,team:soloJoin.team,token:soloJoin.token};assert.equal(soloJoin.room.status,'running');assert.equal(soloJoin.room.hunt,null);const soloOpened=await call('open',{position:position(soloConfig.posts[0])},soloAuth);assert(soloOpened.room.clue);const soloAnswer=await call('answer',{answer:soloConfig.library[0].country,position:position(soloConfig.posts[0])},soloAuth);assert.equal(soloAnswer.room.team.score,100);assert(soloAnswer.room.team.done);
Date.now=realNow;console.log('PASS: QR membership, team isolation, privacy before 10/10, GPS checks, automatic/balanced assignment, concurrent collections, duplicate/stale requests, principal-only answers, scores, grace, legacy mode, finish, stale-config preservation.');
