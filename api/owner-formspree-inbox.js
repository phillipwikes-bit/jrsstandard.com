// Private, read-only supplementary inbox for current JRS website inquiries.
// Unlike historical pilot_contacts, the public site's Formspree relay is the
// system of record for contemporary inquiries. Never write or re-purpose rows.
// Formspree's submissions API may require a paid plan and read-only API key.
import { ownerAccess } from './_owner-auth.js';
export const config={runtime:'edge'};
const FORM='mreddwdg';
const ENDPOINT='https://formspree.io/api/0/forms/'+FORM+'/submissions';
const PAGE_SIZE=100;
const MAX_ROWS=10000;
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer',
    'X-Content-Type-Options':'nosniff'
  }});
}
const str=(x,n)=>typeof x==='string'?x.slice(0,n):(typeof x==='number'?String(x).slice(0,n):'');
const consent=x=>x===true||x==='true'?'recorded-yes':x===false||x==='false'?'recorded-no':'not-recorded';
function row(x,index){
  const y=x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  return {
    source:'formspree-public-jrs-contact',
    source_record_id:str(y._id||y.id||y._submission_id,160),
    source_position:index,
    date:str(y._date||y.date||y.submitted_at||'',64),
    name:str(y.name,160),
    email:str(y.email,180),
    organization:str(y.organization,160),
    category:str(y.category,64),
    message:str(y.message,1600),
    contact_permission:consent(y.consent_to_contact),
    source_type:str(y.form_type||y.source,120),
    // Source-specific recipient permission is not marketing, publication,
    // research enrollment, transfer authorization or commercial qualification.
    publication_permission:'not-recorded',
    transfer_permission:'not-recorded'
  };
}
export default async function handler(req){
  if(req.method!=='GET')return json({error:'method_not_allowed'},405);
  const denied=await ownerAccess(req);
  if(denied)return denied;
  const key=((typeof process!=='undefined'&&process.env)||{}).FORMSPREE_READ_API_KEY||'';
  if(!key)return json({
    source:'formspree-public-jrs-contact',configured:false,complete:false,
    error:'formspree_read_api_not_configured',
    note:'Current submissions remain in Formspree/Gmail, not historical Supabase. Do not interpret unavailable as zero. Formspree read API access may require a Professional or Business plan.'
  },503);
  const items=[];
  for(let offset=0;offset<MAX_ROWS;offset+=PAGE_SIZE){
    let response;
    try{
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7500);
      try{
        response=await fetch(ENDPOINT+'?limit='+PAGE_SIZE+'&offset='+offset+'&order=desc',{
          method:'GET',headers:{Authorization:'Bearer '+key,Accept:'application/json'},
          redirect:'manual',signal:ctrl.signal
        });
      }finally{clearTimeout(timer);}
    }catch{
      return json({error:'formspree_transport_error',source:'formspree-public-jrs-contact',
        complete:false},502);
    }
    if(!response.ok)return json({error:'formspree_access_unavailable',upstream_status:response.status,
      source:'formspree-public-jrs-contact',complete:false},response.status===429?503:502);
    let data;
    try{data=await response.json()}catch{
      return json({error:'formspree_invalid_response',complete:false},502);
    }
    if(!data||!Array.isArray(data.submissions)||data.submissions.length>PAGE_SIZE)
      return json({error:'formspree_invalid_response',complete:false},502);
    for(const item of data.submissions)items.push(row(item,items.length));
    if(data.submissions.length<PAGE_SIZE){
      return json({source:'formspree-public-jrs-contact',configured:true,complete:true,
        total:items.length,rows:items,
        coverage:'Formspree response records for public contact form only; not historical Supabase research or participant rows; no publication or transfer consent inferred.'});
    }
  }
  return json({error:'formspree_pagination_limit',complete:false,
    note:'A source exceeding the retrieval cap cannot be shown as complete.'},502);
}
