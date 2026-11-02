import { ownerAccess } from './_owner-auth.js';
export const config = { runtime: 'edge' };

// Private configuration inventory, not a deployment approval or a test of
// actual Gmail delivery, database privileges, or protected HTML routing.
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'X-Robots-Tag':'noindex, nofollow',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff'
}});
function present(v){return typeof v==='string'&&v.trim().length>0;}
function neonURL(v){
  if(!present(v))return false;
  try{
    const u=new URL(v);
    return u.protocol==='https:' && u.hostname.endsWith('.neon.tech') &&
      !u.username && !u.password && !u.search && !u.hash;
  }catch{return false;}
}
export default async function handler(req){
  if(req.method!=='GET')return json({error:'method_not_allowed'},405);
  const denied=await ownerAccess(req);
  if(denied)return denied;
  const e=(typeof process!=='undefined'&&process.env)||{};
  // Required for this authenticated owner dashboard, not the public site.
  const requirements=[
    {code:'owner_secret',label:'Private owner signing secret',configured:present(e.OWNER_DASHBOARD_TOKEN)&&e.OWNER_DASHBOARD_TOKEN.length>=32},
    {code:'owner_email',label:'Configured owner email recipient',configured:typeof e.JRS_OWNER_EMAIL==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.JRS_OWNER_EMAIL.trim())},
    {code:'neon_auth_base',label:'Neon Auth HTTPS base URL',configured:neonURL(e.NEON_AUTH_BASE_URL)},
    {code:'database_service_key',label:'Private Supabase read credential',configured:present(e.SUPABASE_SERVICE_ROLE_KEY)}
  ];
  return json({
    generated_at:new Date().toISOString(),
    audience:'authenticated_owner_only',
    assessment:'configuration_inventory_not_release_authorization',
    requirements,
    missing_configuration:requirements.filter(x=>!x.configured).map(x=>x.code),
    required_independent_verifications:[
      {code:'exact_commit_preview',state:'not_verified_by_this_endpoint',description:'Exact-head Vercel preview matches the source and is accessible for protected testing'},
      {code:'server_route',state:'not_verified_by_this_endpoint',description:'Owner HTML is withheld by the server proxy without a valid session'},
      {code:'owner_gmail',state:'not_verified_by_this_endpoint',description:'OTP reaches the designated owner inbox and signs in on mobile Safari'},
      {code:'owner_signout',state:'not_verified_by_this_endpoint',description:'Cookie expiry, sign-out, recovery and documented replay limitations accepted'},
      {code:'named_data',state:'not_verified_by_this_endpoint',description:'Complete named records, consent scopes and CSV export reconciled to their original private sources'},
      {code:'inquiry_source',state:'not_verified_by_this_endpoint',description:'Current Formspree contacts kept distinct from historical Supabase inquiry records'},
      {code:'source_rights',state:'not_verified_by_this_endpoint',description:'Privacy, retention, publication and participant contact permissions separately reviewed'},
      {code:'public_site',state:'not_verified_by_this_endpoint',description:'Free resources, PDFs, public inquiry and closed Review Engine remain unaffected'},
      {code:'owner_release',state:'not_verified_by_this_endpoint',description:'Owner approves exact production dashboard change and rollback plan'}
    ],
    current_public_inquiry_path:'Formspree relay, not the historical Supabase site-inquiry table',
    production_release:'PRIVATE_DASHBOARD_HOLD_UNTIL_VERIFICATION_AND_OWNER_AUTHORIZATION',
    engine_release:'NO_GO_NOT_VERIFIED',
    note:'Configuration presence does not prove authentication delivery, a private data read, production readiness, consent, rights or commercialization.'
  });
}
