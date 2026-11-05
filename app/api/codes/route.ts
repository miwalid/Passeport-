import {env} from '../../../supabase/functions/rihla-game/database';
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
export async function POST(req:Request){try{
 const b:any=await req.json();const db=env.DB;if(!db)return Response.json({error:'قاعدة البيانات غير متاحة'},{status:503});
 const row=await db.prepare('SELECT data,version FROM rooms WHERE code=?').bind(String(b.code||'').toUpperCase()).first<any>();
 if(!row||JSON.parse(row.data).token!==b.token)return Response.json({error:'للمنظّم فقط'},{status:403});
 if(typeof b.pdf!=='string'||b.pdf.length>1900000||!b.pdf.startsWith('JVBERi0')||!/^[A-Za-z0-9+/]*={0,2}$/.test(b.pdf))return Response.json({error:'ملف PDF غير صالح أو كبير جدًا'},{status:400});
 const id='PDF_'+crypto.randomUUID().replaceAll('-',''),expires=Date.now()+15*60000;
 await db.prepare("DELETE FROM rooms WHERE code LIKE 'PDF_%' AND json_extract(data,'$.expires') < ?").bind(Date.now()).run();
 await db.prepare('INSERT INTO rooms(code,data,version) VALUES(?,?,0)').bind(id,JSON.stringify({pdf:b.pdf,expires,name:'RIHLA_CODES_'+String(b.code).replace(/[^a-z0-9]/gi,'')+'.pdf'})).run();
 return Response.json({url:Deno.env.get('SUPABASE_URL')+'/functions/v1/rihla-game/codes?id='+id,expires},{headers});
 }catch{return Response.json({error:'تعذّر تجهيز رابط التنزيل، حاول مجددًا'},{status:500});}}
export async function GET(req:Request){
 const id=new URL(req.url).searchParams.get('id')||'';if(!/^PDF_[a-f0-9]{32}$/.test(id))return new Response('Not found',{status:404,headers});
 const db=env.DB;if(!db)return new Response('Unavailable',{status:503,headers});
 const row=await db.prepare('SELECT data,version FROM rooms WHERE code=?').bind(id).first<any>();if(!row)return new Response('Not found',{status:404,headers});
 const data=JSON.parse(row.data);if(data.expires<Date.now())return new Response('Expired - generate a new PDF from the organizer screen',{status:410,headers});
 return new Response(Uint8Array.from(atob(data.pdf),(ch)=>ch.charCodeAt(0)),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${data.name}"`,'X-Content-Type-Options':'nosniff'}});
}
