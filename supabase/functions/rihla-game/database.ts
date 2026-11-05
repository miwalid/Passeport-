// Only the Edge Function can access records; game handlers authenticate each role.
async function rest(query:string,method='GET',body?:any){
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const response=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/rihla_rooms?'+query,{method,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw Error('Database request failed ('+response.status+')');
 return response.status===204?[]:response.json();
}
export const env={DB:{prepare(sql:string){let args:any[]=[];return {bind(...values:any[]){args=values;return this},async first(){const rows=await rest('code=eq.'+encodeURIComponent(args[0])+'&select=data,version');return rows[0]??null},async run(){
 let rows;
 if(sql.startsWith('INSERT'))rows=await rest('','POST',{code:args[0],data:args[1],version:0});
 else if(sql.startsWith('UPDATE'))rows=await rest('code=eq.'+encodeURIComponent(args[1])+'&version=eq.'+args[2],'PATCH',{data:args[0],version:args[2]+1});
 else if(sql.startsWith('DELETE')){const candidates=await rest('code=like.PDF_*&select=code,data');rows=[];for(const row of candidates)if(JSON.parse(row.data).expires<args[0])rows.push(...await rest('code=eq.'+encodeURIComponent(row.code),'DELETE'));}
 else throw Error('Unsupported database operation');
 return {meta:{changes:rows.length}};
 }}}}};
