import {uid} from './team-utils';
import {clueSpots,readyCountry} from './cooperative';
export function autoRoute(draft:any,position:any,spacing=120){
 const count=Number(draft.settings.count),countries=draft.library.filter((q:any)=>!draft.settings.coop||readyCountry(q));
 if(!Number.isInteger(count)||count<1||count>50||count>countries.length)throw Error('اختر عددًا من 1 إلى 50 لا يتجاوز عدد البلدان الجاهزة');
 if(!position||!Number.isFinite(position.lat)||!Number.isFinite(position.lng)||Math.abs(position.lat)>85||Math.abs(position.lng)>180)throw Error('تعذّر تحديد الموقع');
 if(!Number.isFinite(spacing)||spacing<80||spacing>500)throw Error('المسافة بين المحطات من 80 إلى 500 م');
 const cols=Math.ceil(Math.sqrt(count));
 const posts=Array.from({length:count},(_,i)=>{const row=Math.floor(i/cols),col=row%2?cols-1-i%cols:i%cols;
 const p={id:uid(),name:'المحطة '+(i+1),lat:position.lat+row*spacing/111320,lng:((position.lng+col*spacing/(111320*Math.cos(position.lat*Math.PI/180))+540)%360)-180,radius:20,rescue:String(Math.floor(100000+Math.random()*900000))};
 return {...p,...(draft.settings.coop?{clueSpots:clueSpots(p)}:{})};});
 const teams=draft.teams.map((t:any,i:number)=>({...t,route:posts.map((_,j)=>({post:posts[(j+i)%count].id,qid:countries[(j+i)%countries.length].id}))}));
 return {...draft,posts,teams};
}
