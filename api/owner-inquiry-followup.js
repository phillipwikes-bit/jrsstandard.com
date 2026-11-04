// Owner-only follow-up decisions for Formspree inquiries.
// This endpoint stores ONLY source ID, manually selected workflow state and update time.
// Message body, name, email and organization remain in the Formspree source of record.
// Never expose this endpoint or its Supabase table in a public or buyer-facing page.
import { ownerAccess } from './_owner-auth.js';
import { fetchAll } from './_sb-fetch.js';
export const config = { runtime: 'edge' };
const SB='https://pjzxkeviouofdseagvpf.supabase.co';
const TABLE='jrs_inquiry_followups';
const SOURCE='formspree-public-jrs-contact';
const ALLOWED=new Set(['needs_review','response_recorded','closed','not_relevant']);
const ID=/^[A-Za-z0-9_-]{8,160}$/;
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff'
  }});
}
function database(){
  const token=((typeof process!=='undefined'&&process.env)||{}).SUPABASE_SERVICE_ROLE_KEY||'';
  return token?{apikey:token,Authorization:'Bearer '+token}:null;
}
export default async function handler(req){
  const denied=await ownerAccess(req);
  if(denied)return denied;
  if(req.method!=='GET'&&req.method!=='PUT')return json({error:'method_not_allowed'},405);
  const h=database();
  if(!h)return json({error:'followup_store_not_configured',ready:false},503);
  if(req.method==='GET'){
    const result=await fetchAll(SB,
      TABLE+'?select=source_record_id,followup_status,updated_at'
       +'&source=eq.'+SOURCE+'&order=updated_at.desc',h);
    if(!result.complete)return json({error:'followup_store_unavailable',ready:false},503);
    if(result.rows.some(r=>!r||!ID.test(String(r.source_record_id||''))||
      !ALLOWED.has(r.followup_status)||typeof r.updated_at!=='string')){
      return json({error:'followup_store_invalid',ready:false},502);
    }
    return json({source:SOURCE,ready:true,complete:true,
      states:result.rows.map(r=>({
        source_record_id:r.source_record_id,
        followup_status:r.followup_status,
        updated_at:r.updated_at
      })),
      interpretation:'Owner-entered follow-up states; response_recorded does not verify Gmail delivery.'});
  }
  const origin=req.headers.get('origin');
  if(!origin||origin!==new URL(req.url).origin)return json({error:'origin_not_allowed'},403);
  if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return json({error:'json_required'},415);
  if(Number(req.headers.get('content-length')||0)>700)return json({error:'request_too_large'},413);
  let body;
  try{
    const raw=await req.text();
    if(raw.length>700)return json({error:'request_too_large'},413);
    body=JSON.parse(raw);
  }catch{return json({error:'bad_json'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'bad_input'},400);
  const keys=Object.keys(body);
  if(keys.length!==2||!keys.includes('source_record_id')||!keys.includes('followup_status'))
    return json({error:'unsupported_fields'},400);
  const id=body.source_record_id,status=body.followup_status;
  if(typeof id!=='string'||!ID.test(id)||!ALLOWED.has(status))
    return json({error:'invalid_state'},400);
  let result;
  try{
    result=await fetch(SB+'/rest/v1/'+TABLE+'?on_conflict=source,source_record_id',{
      method:'POST',
      headers:{...h,'Content-Type':'application/json',
        Prefer:'resolution=merge-duplicates,return=representation'},
      body:JSON.stringify({source:SOURCE,source_record_id:id,followup_status:status,
        updated_at:new Date().toISOString()}),
      redirect:'error'
    });
  }catch{return json({error:'followup_write_failed'},502);}
  if(!result.ok)return json({error:'followup_write_unavailable'},503);
  let saved;
  try{saved=await result.json()}catch{return json({error:'followup_write_unconfirmed'},502)}
  if(!Array.isArray(saved)||saved.length!==1||saved[0].source_record_id!==id||
     saved[0].source!==SOURCE||saved[0].followup_status!==status||
     typeof saved[0].updated_at!=='string'){
    return json({error:'followup_write_unconfirmed'},502);
  }
  return json({saved:true,source:SOURCE,source_record_id:id,
    followup_status:status,updated_at:saved[0].updated_at});
}
