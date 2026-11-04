// Authorized owner-only, zero-record probe of inquiry sources.
// This is NOT a source of contact totals, a Gmail delivery receipt, or release authorization.
import { ownerAccess } from './_owner-auth.js';
export const config={runtime:'edge'};
const FORM='https://formspree.io/api/0/forms/mreddwdg/submissions';
const SB='https://pjzxkeviouofdseagvpf.supabase.co/rest/v1/jrs_inquiry_followups';
const TIMEOUT=6000;
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Robots-Tag':'noindex,nofollow',
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff'
  }});
}
async function probe(url,options){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),TIMEOUT);
  try{return await fetch(url,{...options,redirect:'error',signal:controller.signal});}
  catch{return null;}finally{clearTimeout(timeout);}
}
export default async function handler(req){
  const denied=await ownerAccess(req);
  if(denied)return denied;
  if(req.method!=='GET')return json({error:'method_not_allowed'},405);
  const env=(typeof process!=='undefined'&&process.env)||{};
  // Zero outbound requests unless their corresponding private credential exists.
  const formKey=typeof env.FORMSPREE_READ_API_KEY==='string'
    ?env.FORMSPREE_READ_API_KEY.trim():'';
  const dbKey=typeof env.SUPABASE_SERVICE_ROLE_KEY==='string'
    ?env.SUPABASE_SERVICE_ROLE_KEY.trim():'';
  let formState='missing_read_credential';
  let statusState='missing_database_credential';
  if(formKey){
    // A single provider record at most is inspected server-side and discarded;
    // no names, emails or submitted content appear in this response.
    const r=await probe(FORM+'?limit=1&offset=0&spam=false',{
      method:'GET',
      headers:{Authorization:'Bearer '+formKey,Accept:'application/json'}
    });
    if(!r)formState='provider_unavailable';
    else if(r.status===401)formState='invalid_read_credential';
    else if(r.status===402||r.status===403)formState='api_access_denied_or_plan';
    else if(r.status===404)formState='form_unavailable';
    else if(r.status===429)formState='provider_rate_limited';
    else if(!r.ok)formState='provider_unavailable';
    else{
      try{
        const data=await r.json();
        formState=data&&Array.isArray(data.submissions)&&data.submissions.length<=1
          ?'read_access_verified':'unexpected_provider_response';
      }catch{formState='unexpected_provider_response';}
    }
  }
  if(dbKey){
    // HEAD checks schema availability and service-role access without reading any rows.
    const r=await probe(SB+'?select=source_record_id&limit=0',{
      method:'HEAD',
      headers:{apikey:dbKey,Authorization:'Bearer '+dbKey,Accept:'application/json'}
    });
    if(!r)statusState='database_unavailable';
    else if(r.ok)statusState='private_table_access_verified';
    else if(r.status===404)statusState='private_table_missing_or_not_exposed';
    else if(r.status===401||r.status===403)statusState='private_table_access_denied';
    else statusState='database_unavailable';
  }
  return json({
    checked_at:new Date().toISOString(),
    audience:'authenticated_owner_only',
    formspree:{state:formState,read_ready:formState==='read_access_verified',
      count_claim:'not_measured',data_returned:false},
    followup_store:{state:statusState,
      read_ready:statusState==='private_table_access_verified',
      write_verified:false,record_count:'not_measured'},
    gmail:{state:'delivery_not_verified_by_this_check',
      note:'Formspree Gmail notification delivery cannot be verified by provider readiness checks.'},
    release:'hold',
    limitation:'This configuration and read-access probe does not prove complete Formspree pagination, successful follow-up writes, mobile owner login or publication readiness.'
  });
}
