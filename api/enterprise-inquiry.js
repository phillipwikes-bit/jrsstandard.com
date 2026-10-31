export const config = { runtime:'edge' };

// Legacy enterprise information-enquiry writer. Historic rows retain
// source='enterprise-inquiry' and are not rewritten or reclassified.
// This is a contact-only path: no confidential case submissions, buyer
// qualification, commercial offer or software evaluation authorization.
import { notify, renderAlert } from './_notify.js';

const SB='https://pjzxkeviouofdseagvpf.supabase.co';
const SOURCE='enterprise-inquiry';
const INTEREST=['engine-licence','oem-embed','framework-licence',
                'evaluation','acquisition','not-sure','other'];
const SCALE=['under-1k','1k-10k','10k-100k','over-100k','unknown'];
const TIMELINE=['immediate','this-quarter','this-year','exploratory'];

function json(o,status=200){
  return new Response(JSON.stringify(o),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }});
}
function clean(v,n){
  return String(typeof v==='string'?v:'')
    .replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
}
function oneOf(v,list){
  const s=clean(v,40).toLowerCase();
  return list.includes(s)?s:'';
}
function validEmail(s){
  return s.length<=160 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default async function handler(req){
  // No wildcard CORS or unauthenticated cross-site submission.
  if(req.method!=='POST')return json({error:'method_not_allowed'},405);
  const url=new URL(req.url);
  const origin=req.headers.get('origin');
  if(!origin || origin!==url.origin)return json({error:'origin_not_allowed'},403);
  if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return json({error:'json_required'},415);
  const declared=Number(req.headers.get('content-length')||'0');
  if(!Number.isFinite(declared)||declared>8192)return json({error:'request_too_large'},413);
  const E=(typeof process!=='undefined'&&process.env)||{};
  const service=E.SUPABASE_SERVICE_ROLE_KEY||'';
  const challengeSecret=E.TURNSTILE_SECRET_KEY||'';
  // No legacy bypass when the new categorized enquiry service is unavailable.
  if(!service||!challengeSecret||!E.TURNSTILE_SITE_KEY)
    return json({error:'inquiry_protection_unavailable'},503);

  let text='';
  try{text=await req.text()}catch{return json({error:'body_unreadable'},400)}
  if(text.length>8192)return json({error:'request_too_large'},413);
  let b;
  try{b=JSON.parse(text)}catch{return json({error:'bad_json'},400)}
  if(!b || typeof b!=='object' || Array.isArray(b))return json({error:'bad_input'},400);
  if(clean(b.company_website,100))return json({ok:true,stored:false},200);

  const name=clean(b.name,120);
  const email=clean(b.email,160).toLowerCase();
  const organization=clean(b.organization,160);
  const role=clean(b.role,120);
  const interest=oneOf(b.interest,INTEREST);
  const scale=oneOf(b.scale,SCALE);
  const timeline=oneOf(b.timeline,TIMELINE);
  const platform=clean(b.platform,160);
  const note=clean(b.note,1200);
  const token=clean(b.turnstileToken,2048);

  if(name.length<2 || !organization || !validEmail(email) || !interest ||
    b.consent!==true)return json({error:'required_fields_invalid'},400);
  if(!token)return json({error:'challenge_required'},400);

  let verified;
  try{
    const challenge=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret:challengeSecret,response:token})
    });
    if(!challenge.ok)return json({error:'challenge_unavailable'},503);
    verified=await challenge.json();
  }catch{return json({error:'challenge_unavailable'},503)}
  if(!verified || verified.success!==true)return json({error:'challenge_rejected'},403);
  const expected=String(E.JRS_TURNSTILE_HOSTNAME||url.hostname).toLowerCase();
  if(String(verified.hostname||'').toLowerCase()!==expected)
    return json({error:'challenge_host_mismatch'},403);

  const country=clean(req.headers.get('x-vercel-ip-country')||'',2)
    .toUpperCase().replace(/[^A-Z]/g,'');
  const storedRecord={
    name,email,organization,source:SOURCE,
    message:JSON.stringify({
      kind:SOURCE,role,interest,scale,timeline,platform,note,country,
      ts:new Date().toISOString(),
      consent_to_contact:true,
      consent_version:'enterprise-contact-v1-2026-10-30',
      consent_to_transfer:false,
      software_access_requested:false
    })
  };
  let saved;
  try{
    saved=await fetch(SB+'/rest/v1/pilot_contacts',{
      method:'POST',
      headers:{
        'apikey':service,'Authorization':'Bearer '+service,
        'Content-Type':'application/json','Prefer':'return=minimal'
      },
      body:JSON.stringify(storedRecord)
    });
  }catch{return json({error:'storage_unavailable'},502)}
  // Do not reflect provider error content: it may contain personal data.
  if(!saved.ok)return json({error:'storage_unavailable'},502);

  const alert=await notify(
    'Enterprise information inquiry: '+organization+' ('+interest+')',
    renderAlert('Enterprise information inquiry',[
      ['Name',name],['Email',email],['Organisation',organization],
      ['Role',role],['Interest',interest],['Platform',platform],
      ['Records per year',scale],['Timeline',timeline],
      ['Country',country],['Note',note],['Source',SOURCE]
    ]),email
  );
  return json({ok:true,stored:true,alerted:alert.sent===true});
}
