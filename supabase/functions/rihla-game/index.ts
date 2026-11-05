import {POST as game} from '../../../app/api/game/route';
import {POST as codes,GET as download} from '../../../app/api/codes/route';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Expose-Headers':'Content-Disposition'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
 const path=new URL(req.url).pathname;
 let response:Response;
 if(path.endsWith('/codes'))response=await(req.method==='GET'?download(req):codes(req));
 else if(path.endsWith('/game')&&req.method==='POST')response=await game(req);
 else response=Response.json({error:'Not found'},{status:404});
 const headers=new Headers(response.headers);for(const [k,v] of Object.entries(cors))headers.set(k,v);
 return new Response(response.body,{status:response.status,headers});
 }catch{return Response.json({error:'تعذّر الاتصال بقاعدة البيانات'},{status:500,headers:cors})}
});
