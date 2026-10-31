import { ownerAccess } from './_owner-auth.js';

export const config = { runtime:'edge' };

// Owner-only configuration inventory. No raw environment variable values,
// credential fragments, email addresses, tokens, hostnames or private records
// leave this endpoint. Configuration is NOT verification of function/security.
function json(body, status=200) {
  return new Response(JSON.stringify(body), {status, headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store, max-age=0',
    'X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer'
  }});
}
function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
export default async function handler(req) {
  if (req.method !== 'GET') return json({error:'method_not_allowed'},405);
  const denied = await ownerAccess(req);
  if (denied) return denied;

  const env=(typeof process!=='undefined' && process.env)||{};
  const requirements=[
    {code:'owner_secret', label:'Owner session secret', configured:present(env.OWNER_DASHBOARD_TOKEN) && env.OWNER_DASHBOARD_TOKEN.length>=32},
    {code:'database_service_key', label:'Existing server-side database key', configured:present(env.SUPABASE_SERVICE_ROLE_KEY)},
    {code:'turnstile_site', label:'Public inquiry challenge site key', configured:present(env.TURNSTILE_SITE_KEY)},
    {code:'turnstile_secret', label:'Public inquiry challenge server secret', configured:present(env.TURNSTILE_SECRET_KEY)},
    {code:'notification_recipient', label:'Private notification recipient', configured:present(env.NOTIFY_TO)},
    {code:'notification_sender', label:'Verified notification sender setting', configured:present(env.NOTIFY_FROM)},
    {code:'notification_provider', label:'Transactional notification provider key', configured:present(env.RESEND_API_KEY)||present(env.SENDGRID_API_KEY)},
    {code:'notification_enabled', label:'Owner-approved notification enable switch', configured:env.JRS_INQUIRY_ALERTS_ENABLED==='true'}
  ];
  return json({
    generated_at:new Date().toISOString(),
    audience:'authenticated_owner_only',
    assessment:'configuration_inventory_not_release_authorization',
    requirements,
    missing_configuration:requirements.filter(x=>!x.configured).map(x=>x.code),
    required_independent_verifications:[
      {code:'server_route', state:'not_verified_by_this_endpoint', description:'Static HTML inaccessible before authentication in the deployed environment'},
      {code:'database_rls', state:'not_verified_by_this_endpoint', description:'Live anonymous Supabase privileges and RLS inspected'},
      {code:'challenge', state:'not_verified_by_this_endpoint', description:'Turnstile challenge and abuse controls exercised on actual hostnames'},
      {code:'email_delivery', state:'not_verified_by_this_endpoint', description:'Provider acceptance, Gmail receipt and outage drill'},
      {code:'mobile_access', state:'not_verified_by_this_endpoint', description:'Owner Safari login, expiry, recovery and sign-out tested'},
      {code:'analytics_reconciliation', state:'not_verified_by_this_endpoint', description:'Request counts reconciled against a complete, dated production source snapshot'},
      {code:'rights_and_claims', state:'not_verified_by_this_endpoint', description:'Release privacy, conveyance and commercial claim review'},
      {code:'owner_authorization', state:'not_verified_by_this_endpoint', description:'Explicit production release and rollback decision'}
    ],
    production_release:'BLOCKED_UNTIL_INDEPENDENT_VERIFICATION_AND_AUTHORIZATION',
    engine_release:'NO_GO_NOT_VERIFIED',
    note:'This inventory confirms configuration presence only. It cannot establish production functionality, data security, merchant activity, software readiness or a licensing offer.'
  });
}
