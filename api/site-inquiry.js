// JRS public professional contact relay.
// Fixed historical JRS Formspree endpoint. Not a Review Engine, research
// enrollment, pilot participant writer, commercial lead writer or file intake.
// No Formspree API key or Gmail credential is needed on Vercel for this relay.
export const config={runtime:'edge'};
const FORM='https://formspree.io/f/mreddwdg';
const CATEGORIES=new Set(['method','research','training','organization','accessibility','general']);
const clean=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max):'';
const validEmail=v=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)&&v.length<=160;
function reply(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'
 }});
}
export default async function handler(req){
 if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
 const url=new URL(req.url), origin=req.headers.get('origin');
 if(!origin||origin!==url.origin)return reply({error:'origin_not_allowed'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return reply({error:'json_required'},415);
 if(Number(req.headers.get('content-length')||0)>8192)return reply({error:'request_too_large'},413);
 let raw='';
 try{raw=await req.text()}catch{return reply({error:'unreadable_body'},400)}
 if(raw.length>8192)return reply({error:'request_too_large'},413);
 let b;
 try{b=JSON.parse(raw)}catch{return reply({error:'bad_json'},400)}
 if(!b||typeof b!=='object'||Array.isArray(b))return reply({error:'bad_input'},400);
 if(clean(b.company_website,100)||clean(b._gotcha,100))return reply({error:'submission_not_accepted'},403);
 const name=clean(b.name,120),email=clean(b.email,160).toLowerCase();
 const organization=clean(b.organization,160),category=clean(b.category,40);
 const message=clean(b.message,1200);
 if(name.length<2||!validEmail(email)||!CATEGORIES.has(category)||message.length<12||b.consent!==true){
  return reply({error:'required_fields_invalid'},400);
 }
 // Explicit allowlist: never relay arbitrary JSON fields, attachments, records,
 // research consents, recipient addresses, commercial qualification data or URLs.
 const fields=new URLSearchParams({
  name,email,organization,category,message,
  source:'public-jrs-professional-contact',
  form_type:'jrs-general-professional-inquiry-2026-11-01',
  consent_to_contact:'true',consent_to_transfer:'false',
  _subject:'JRS Public Inquiry: '+category,
  _gotcha:''
 });
 try{
  const upstream=await fetch(FORM,{method:'POST',headers:{
   'Accept':'application/json',
   'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
   'Origin':url.origin
  },body:fields.toString()});
  if(!upstream.ok)return reply({error:'delivery_not_confirmed'},502);
  // Accepted by Formspree, not independently proof of Gmail mailbox receipt.
  return reply({ok:true,accepted:true,transport:'formspree'});
 }catch{return reply({error:'delivery_not_confirmed'},502)}
}
