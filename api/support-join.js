export const config = { runtime: 'edge' };

// Voluntary named registry enrollment. This writes private contact data only
// after an explicit same-origin POST and affirmative contact consent.
// The public registry is a separate, optional checkbox. This endpoint never
// treats a visit, a support-event redirect, or nonresponse as named consent.
// Legacy records are not repaired or reinterpreted by this change.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const MAX_BODY_BYTES=4096;
function json(o,status=200){
  return new Response(JSON.stringify(o),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Robots-Tag':'noindex, nofollow',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Allow':'POST'
  }});
}
function clean(v,max=200){
  if(v===undefined||v===null)return '';
  if(typeof v!=='string'||v.length>max)return null;
  return v.trim();
}
function normCampaign(c){
  c=String(c||'').toLowerCase().replace(/[^a-z]/g,'');
  if(c==='rtkw'||c==='rights'||c==='righttoknowwhy')return 'rtkw';
  if(c==='defend'||c==='decisions'||c==='decisionsyoucandefend')return 'defend';
  return 'general';
}
export default async function handler(req){
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  const origin=req.headers.get('origin');
  if(!origin||origin!==new URL(req.url).origin||
     req.headers.get('sec-fetch-site')==='cross-site')
    return json({error:'origin_not_allowed'},403);
  const contentType=(req.headers.get('content-type')||'').toLowerCase();
  if(!/^application\/json(?:\s*;|\s*$)/.test(contentType))
    return json({error:'json_required'},415);
  const length=Number(req.headers.get('content-length')||0);
  if(length>MAX_BODY_BYTES)return json({error:'request_too_large'},413);

  // Even an inherited service-role key must not allow preview/test records
  // to enter the historical registry or public wall.
  const env=(typeof process!=='undefined'&&process.env)||{};
  if(env.VERCEL_ENV!=='production')
    return json({error:'preview_only',recorded:false},503);
  const service=env.SUPABASE_SERVICE_ROLE_KEY||'';
  if(!service)return json({error:'storage_unavailable'},503);

  let b;
  try{
    const raw=await req.text();
    if(new TextEncoder().encode(raw).length>MAX_BODY_BYTES)
      return json({error:'request_too_large'},413);
    b=JSON.parse(raw);
  }catch{return json({error:'invalid_json'},400)}
  if(!b||typeof b!=='object'||Array.isArray(b))
    return json({error:'invalid_payload'},400);
  const name=clean(b.name),organization=clean(b.organization),email=clean(b.email);
  if(name===null||organization===null||email===null)
    return json({error:'invalid_field'},400);
  if(!name)return json({error:'name_required'},400);
  if(email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200))
    return json({error:'valid_email_required'},400);
  if(b.consent_contact!==true)return json({error:'consent_required'},400);
  // Under this form there is NO independent transfer-consent question.
  // Ignore any incoming claim of consent_transfer or consent_listed.
  const publicList=b.consent_public_list===true;
  if(b.consent_public_list!==undefined && typeof b.consent_public_list!=='boolean')
    return json({error:'invalid_public_consent'},400);

  const row={
    name,email,organization,source:'support',
    message:JSON.stringify({
      kind:'support',
      campaign:normCampaign(b.campaign),
      role:clean(b.role)||'',
      consent_contact:true,
      consent_transfer:false,
      consent_listed:publicList,
      consent_public_list:publicList,
      page_source:'supported-page',
      ts:new Date().toISOString()
    })
  };
  try{
    const res=await fetch(SB+'/rest/v1/pilot_contacts',{
      method:'POST',
      headers:{apikey:service,Authorization:'Bearer '+service,
               'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify(row)
    });
    if(!res||res.ok!==true)return json({error:'storage_unavailable'},502);
  }catch{return json({error:'storage_unavailable'},502)}
  return json({ok:true,recorded:true},200);
}
