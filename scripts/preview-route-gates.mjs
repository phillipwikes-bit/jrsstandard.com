// Independent preview gate: compare URL content to the exact source revision
// and refuse an anonymous success from any private JRS route.
// Run only against a reviewed *.vercel.app PREVIEW, not production.
//
// Usage:
//   node scripts/preview-route-gates.mjs https://my-preview.vercel.app <40-char-sha>
//
// This script does not authenticate, send data, submit forms, inspect response
// bodies of owner APIs, or claim that Supabase RLS/Turnstile/Gmail are validated.

export const PRIVATE_PATHS=Object.freeze([
  '/programme-status-9872fb93cc94.html',
  '/api/owner-session',
  '/api/owner-progress?view=pilot',
  '/api/owner-release-readiness',
  '/api/site-inquiry-stats',
  '/api/leads-4b7e2c9af106d385',
  '/api/people-9dd1ecdf6f8cdfd4',
  '/api/roster-8c3f1a9e7b2d6045',
  '/api/recheck-answers-b1a768e88d3e48bd',
  '/api/geo-4e8b2d7f9a1c3065',
  '/api/variance-6b1d90fa2c47e8b3',
  '/api/enroll-admin',
  '/api/support-contacts',
  '/api/coauthor-stats',
  '/api/contributor-stats',
  '/api/checkout-stats',
  // G2/PST-03, added in Increment 18. These six service-role-backed
  // aggregate readers are private. Omitting them from the exact-deployment
  // negative-path probe would leave the new edge gate unobserved.
  '/api/access-stats',
  '/api/enroll-stats',
  '/api/orgpilot-stats',
  '/api/gate-stats',
  '/api/geo-stats',
  '/api/asset-stats'
]);

export function validatedPreviewOrigin(input) {
  if (typeof input!=='string') throw Error('preview_origin_missing');
  let parsed;
  try { parsed=new URL(input); } catch { throw Error('preview_origin_invalid'); }
  if(parsed.protocol!=='https:' || parsed.username || parsed.password ||
      parsed.search || parsed.hash || parsed.pathname!=='/' ||
      parsed.port || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(parsed.hostname)) {
    throw Error('preview_origin_not_a_vercel_preview');
  }
  return parsed.origin;
}

async function get(fetchImpl,origin,path) {
  // Host redirects must never be followed. A Vercel protection login or
  // wrong deployment could otherwise appear to be an authorization test.
  return fetchImpl(origin+path,{
    method:'GET',redirect:'manual',cache:'no-store',
    headers:{'Accept':'application/json, text/html;q=0.9'}
  });
}

function requireStatus(res,status,path) {
  if(!res || res.status!==status) {
    throw Error('preview_probe_unexpected_status:'+path+':'+(res?res.status:'network'));
  }
}

export async function checkPreview({baseUrl,expectedSha,fetchImpl=fetch}) {
  const origin=validatedPreviewOrigin(baseUrl);
  if(typeof expectedSha!=='string' || !/^[a-f0-9]{40}$/.test(expectedSha)) {
    throw Error('expected_sha_invalid');
  }
  const build=await get(fetchImpl,origin,'/api/deployment-identity');
  requireStatus(build,200,'/api/deployment-identity');
  if(!(build.headers.get('content-type')||'').includes('application/json')) {
    throw Error('preview_build_identity_wrong_type');
  }
  const identity=await build.json();
  if(identity.channel!=='preview' || identity.commit_sha!==expectedSha ||
     identity.assessment!=='source_identity_only_not_release_authorization' ||
     identity.engine_release!=='NO_GO_NOT_VERIFIED') {
    throw Error('preview_commit_or_identity_mismatch');
  }
  if(!(build.headers.get('cache-control')||'').includes('no-store')) {
    throw Error('preview_build_identity_cacheable');
  }

  // Check that the host serves the public application, not a generic
  // protection/login/404 page. No personal data is requested here.
  for(const path of ['/contact.html','/enterprise.html']) {
    const res=await get(fetchImpl,origin,path);
    requireStatus(res,200,path);
    if(!(res.headers.get('content-type')||'').includes('text/html')) {
      throw Error('preview_public_html_wrong_type:'+path);
    }
  }
  const config=await get(fetchImpl,origin,'/api/site-inquiry-config');
  requireStatus(config,200,'/api/site-inquiry-config');
  if(!(config.headers.get('content-type')||'').includes('application/json')) {
    throw Error('preview_site_config_wrong_type');
  }
  const siteConfig=await config.json();
  if(typeof siteConfig.enabled!=='boolean') throw Error('preview_site_config_invalid');

  // Never follow redirects or consume/log private response bodies. The
  // unconfigured secret intentionally yields 503; configured-but-unsigned
  // access must yield 401. Other statuses are NOT accepted.
  const outcomes={unauthorized:0,unconfigured:0};
  for(const path of PRIVATE_PATHS) {
    const res=await get(fetchImpl,origin,path);
    if(res.status===401) outcomes.unauthorized++;
    else if(res.status===503) outcomes.unconfigured++;
    else throw Error('private_route_not_proven_closed:'+path+':'+res.status);
  }
  return {
    preview_origin:origin,
    verified_commit:expectedSha,
    public_routes_checked:3,
    private_routes_checked:PRIVATE_PATHS.length,
    private_outcomes:outcomes,
    inquiry_configuration_present:siteConfig.enabled,
    decision:'ROUTE_PROBES_PASSED_ONLY_PRODUCTION_RELEASE_BLOCKED',
    unverified:['supabase_rls','real_owner_login_and_recovery','actual_turnstile_submission',
      'actual_email_delivery','safari_acceptance','buyer_data_rights','owner_release_authorization']
  };
}

// Run as a manually invoked command, but never in an import-based test.
// Process exit code 2 means not executed or invalid inputs, not success.
const invoked=process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href;
if(invoked) {
  const args=process.argv.slice(2);
  if(args.length!==2) {
    console.error('PREVIEW NOT TESTED: specify exact HTTPS *.vercel.app origin and full expected SHA');
    process.exitCode=2;
  }else{
    try {
      const result=await checkPreview({baseUrl:args[0],expectedSha:args[1]});
      console.log(JSON.stringify(result,null,2));
    }catch(e){
      console.error('PREVIEW BLOCKED: '+String(e.message||e));
      process.exitCode=1;
    }
  }
}
