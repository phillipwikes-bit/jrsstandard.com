export const config = { runtime: 'edge' };

// JRS PUBLIC INFORMATION INQUIRIES. NOT A RECORD-REVIEW OR PRODUCT INTAKE.
// The only persisted result is a contact inquiry in existing pilot_contacts.
// A verified Cloudflare Turnstile response is mandatory, not optional, before
// storage. The provider key is a server-only secret and must never be logged.
import { notify, renderAlert } from './_notify.js';

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const SOURCE = 'site-inquiry';
const CATEGORIES = ['organization', 'research', 'training', 'commercial', 'general'];
const COMMERCIAL_PURPOSES = ['method-licence', 'software-evaluation', 'integration', 'asset-acquisition'];

function reply(obj, status=200) {
  return new Response(JSON.stringify(obj), {status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer'
  }});
}
function clean(v,n) {
  return String(typeof v==='string'?v:'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,n);
}
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length<=160; }
export default async function handler(req) {
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  const origin=req.headers.get('origin');
  const url=new URL(req.url);
  // This is an additional CSRF/cross-site friction control, not bot proof.
  if(!origin || origin!==url.origin)return reply({error:'origin_not_allowed'},403);
  const typ=(req.headers.get('content-type')||'').toLowerCase();
  if(!typ.startsWith('application/json'))return reply({error:'json_required'},415);
  const size=parseInt(req.headers.get('content-length')||'0',10);
  if(size>8192)return reply({error:'request_too_large'},413);
  const E=(typeof process!=='undefined'&&process.env)||{};
  if(!E.SUPABASE_SERVICE_ROLE_KEY || !E.TURNSTILE_SECRET_KEY)return reply({error:'inquiry_protection_unavailable'},503);

  let raw='';
  try{raw=await req.text();}catch{return reply({error:'body_unreadable'},400)}
  if(raw.length>8192)return reply({error:'request_too_large'},413);
  let b={};
  try{b=JSON.parse(raw);}catch{return reply({error:'bad_json'},400)}
  if(!b || typeof b!=='object' || Array.isArray(b))return reply({error:'bad_input'},400);

  // A honeypot is a secondary filter; Turnstile remains mandatory.
  if(clean(b.company_website,100))return reply({ok:true,stored:false},200);
  const name=clean(b.name,120);
  const email=clean(b.email,160).toLowerCase();
  const organization=clean(b.organization,160);
  const category=clean(b.category,32);
  const commercialPurpose=clean(b.commercial_purpose,40);
  const note=clean(b.message,1200);
  const token=clean(b.turnstileToken,2048);
  const consent=b.consent===true;
  if(name.length<2 || !validEmail(email) || !CATEGORIES.includes(category) || note.length<12 || !consent) {
    return reply({error:'required_fields_invalid'},400);
  }
  if(category==='commercial' && !COMMERCIAL_PURPOSES.includes(commercialPurpose))
    return reply({error:'commercial_purpose_required'},400);
  if(category!=='commercial' && commercialPurpose)
    return reply({error:'commercial_purpose_not_applicable'},400);
  if(!token)return reply({error:'challenge_required'},400);
  // Do not accept unverified records, including if the challenge vendor fails.
  let checked;
  try {
    const challenge=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({secret:E.TURNSTILE_SECRET_KEY,response:token})
    });
    if(!challenge.ok)return reply({error:'challenge_unavailable'},503);
    checked=await challenge.json();
  }catch{return reply({error:'challenge_unavailable'},503)}
  if(!checked || checked.success!==true)return reply({error:'challenge_rejected'},403);
  // The default Turnstile hostname is independently checked, not trusted from
  // the browser. Optional explicit override for known preview domains.
  const expected=(E.JRS_TURNSTILE_HOSTNAME||url.hostname).toLowerCase();
  if((checked.hostname||'').toLowerCase()!==expected)return reply({error:'challenge_host_mismatch'},403);

  const country=clean(req.headers.get('x-vercel-ip-country')||'',2).toUpperCase().replace(/[^A-Z]/g,'');
  const record={
    name,email,organization,source:SOURCE,
    message:JSON.stringify({
      kind:SOURCE,category,commercial_purpose:category==='commercial'?commercialPurpose:null,
      note,country,consent_to_contact:true,
      consent_version:'contact-v1-2026-10-30',
      consent_to_transfer:false,
      created_at:new Date().toISOString(),
      software_access_requested:false
    })
  };
  let stored;
  try{
    stored=await fetch(SB+'/rest/v1/pilot_contacts',{
      method:'POST',headers:{
        'apikey':E.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization':'Bearer '+E.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type':'application/json',
        'Prefer':'return=minimal'
      },
      body:JSON.stringify(record)
    });
  }catch{return reply({error:'storage_unavailable'},502)}
  if(!stored.ok)return reply({error:'storage_unavailable'},502);
  // A mail-provider failure cannot make a successfully saved record disappear.
  const sent=await notify(
    'JRS inquiry: '+category+(category==='commercial'?' / '+commercialPurpose:''),
    renderAlert('JRS website inquiry',[
      ['Category',category],['Commercial purpose',category==='commercial'?commercialPurpose:'not applicable'],
      ['Name',name],['Email',email],
      ['Organization',organization],['Message',note],['Country',country],
      ['Source',SOURCE]
    ]),email
  );
  return reply({ok:true,stored:true,alerted:sent.sent===true});
}
