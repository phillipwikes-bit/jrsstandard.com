export const config={runtime:'edge'};
import {ownerAccess} from './_owner-auth.js';
import {fetchAll} from './_sb-fetch.js';

// Private replacement for three formerly browser-direct Supabase reads.
// Only these complete progress tables can be requested; no arbitrary URL,
// table, column or SQL input is accepted from the client.
const SB='https://pjzxkeviouofdseagvpf.supabase.co';
const VIEWS={
 pilot:'pilot_progress?select=code,name,total_reads,reads_today,last_at&order=total_reads.desc,code.asc',
 realcase:'realcase_progress?select=*&order=cases.desc',
 armb:'armb_progress?select=code,arm_code,reads,reads_today,last_at&order=reads.desc,code.asc'
};
function json(obj,status=200){
 return new Response(JSON.stringify(obj),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private',
  'X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer'
 }});
}
export default async function handler(req){
 if(req.method!=='GET')return json({error:'method_not_allowed'},405);
 const denied=await ownerAccess(req);if(denied)return denied;
 const view=new URL(req.url).searchParams.get('view')||'';
 if(!Object.hasOwn(VIEWS,view))return json({error:'unknown_view'},400);
 const env=(typeof process!=='undefined'&&process.env)||{};
 const key=env.SUPABASE_SERVICE_ROLE_KEY||'';
 if(!key)return json({error:'storage_unavailable'},503);
 const result=await fetchAll(SB,VIEWS[view],{'apikey':key,'Authorization':'Bearer '+key});
 if(!result.complete)return json({error:'progress_incomplete'},502);
 return json(result.rows);
}
