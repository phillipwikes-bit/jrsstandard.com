#!/usr/bin/env node
// Increment 15: JRS owner preview admission, metadata-only evidence preflight.
// No network, secrets, live records, login attempts, credential reads or deployment.
// This is a REFUSAL/triage aid, not a production-release authority.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHA40=/^[0-9a-f]{40}$/;
const EXPECTED_ROUTES=Object.freeze([
  '/api/owner-session',
  '/programme-status-9872fb93cc94.html',
  '/api/support-contacts'
]);
const allowedTop=['schema','candidate','preview','credential_metadata','anonymous_routes','acceptance'];
const allowedCandidate=['head_sha','branch','draft','merged'];
const allowedPreview=['deployment_id','git_sha','branch','state','target'];
const allowedMeta=['key','inspected_without_decryption','current_branch_scope_present','unscoped_preview_scope_present','different_branch_scope_present','owner_confirms_prior_exposure_rotated'];
const allowedObservation=['route','http_status','error_code','private_cache','noindex'];
const allowedAcceptance=['valid_owner_session_tested','expired_cookie_tested','revoked_cookie_tested','direct_anonymous_rls_tested','fixed_cutoff_counts_reconciled','owner_signed_exact_sha','rollback_verified','mobile_safari_tested'];

function isObject(x){return x!==null&&typeof x==='object'&&!Array.isArray(x)}
function onlyKeys(x,keys,label){
  if(!isObject(x))throw Error(label+': object required');
  for(const k of Object.keys(x)){
    if(!keys.includes(k))throw Error(label+': field forbidden or unsupported ('+k+')');
  }
  for(const k of keys)if(!Object.hasOwn(x,k))throw Error(label+': missing '+k);
}
function validate(x){
  onlyKeys(x,allowedTop,'snapshot');
  if(x.schema!=='jrs-owner-preview-admission-v1')throw Error('unsupported schema');
  onlyKeys(x.candidate,allowedCandidate,'candidate');
  onlyKeys(x.preview,allowedPreview,'preview');
  onlyKeys(x.credential_metadata,allowedMeta,'credential_metadata');
  onlyKeys(x.acceptance,allowedAcceptance,'acceptance');
  for(const [part,keys] of [[x.candidate,['draft','merged']],[x.credential_metadata,allowedMeta.slice(1)],[x.acceptance,allowedAcceptance]]){
    for(const k of keys)if(typeof part[k]!=='boolean')throw Error(k+': Boolean required');
  }
  for(const n of ['head_sha','branch'])if(typeof x.candidate[n]!=='string'||!x.candidate[n].trim())throw Error('candidate '+n+' missing');
  if(!SHA40.test(x.candidate.head_sha))throw Error('invalid candidate head SHA');
  if(typeof x.preview.git_sha!=='string'||!SHA40.test(x.preview.git_sha))throw Error('invalid preview SHA');
  if(typeof x.preview.branch!=='string'||!x.preview.branch)throw Error('missing preview branch');
  if(typeof x.preview.state!=='string'||!x.preview.state)throw Error('missing preview state');
  if(typeof x.preview.deployment_id!=='string'||!x.preview.deployment_id)throw Error('missing preview ID');
  if(!['preview','NOT_CONFIRMED'].includes(x.preview.target))throw Error('preview target not recognized');
  if(x.credential_metadata.key!=='OWNER_DASHBOARD_TOKEN')throw Error('wrong auth key');
  if(!Array.isArray(x.anonymous_routes)||x.anonymous_routes.length!==EXPECTED_ROUTES.length)throw Error('exact owner route observations required');
  const byRoute=new Map();
  for(const row of x.anonymous_routes){
    onlyKeys(row,allowedObservation,'anonymous_routes[]');
    if(!EXPECTED_ROUTES.includes(row.route)||byRoute.has(row.route))throw Error('unsupported or duplicate owner route');
    if(!Number.isInteger(row.http_status)||row.http_status<100||row.http_status>599)throw Error('invalid response status');
    if(!(row.error_code===null||typeof row.error_code==='string'))throw Error('error_code must be string or null');
    if(typeof row.private_cache!=='boolean'||typeof row.noindex!=='boolean')throw Error('privacy response evidence missing');
    byRoute.set(row.route,row);
  }
  return byRoute;
}
function finding(code,reason,next){return {code,reason,next}}
export function evaluateOwnerPreviewAdmission(x){
  const routes=validate(x);
  const out=[];
  const add=(code,reason,next)=>out.push(finding(code,reason,next));
  if(x.candidate.draft||!x.candidate.merged)
    add('CANDIDATE_UNMERGED','Candidate remains draft or unmerged','Do not treat draft as accepted release');
  if(x.preview.git_sha!==x.candidate.head_sha)
    add('PREVIEW_SHA_MISMATCH','Preview deployment is not the exact current branch head','Build and verify the chosen final SHA before acceptance');
  if(x.preview.branch!==x.candidate.branch)
    add('PREVIEW_BRANCH_MISMATCH','Preview branch identity differs from candidate branch','Use one recorded branch and commit');
  if(x.preview.state!=='READY')
    add('PREVIEW_NOT_READY','Vercel metadata does not show a ready deployment','Review deployment without claiming site is available');
  if(x.preview.target!=='preview')
    add('PREVIEW_TARGET_NOT_CONFIRMED','Vercel target metadata did not independently confirm preview target','Confirm target before conditional acceptance');
  const env=x.credential_metadata;
  if(!env.inspected_without_decryption)
    add('SECRET_METADATA_SCOPE_UNVERIFIED','Environment metadata scope was not inspected safely','Use metadata-only scope review; never decrypt in this exercise');
  if(!env.current_branch_scope_present&&!env.unscoped_preview_scope_present)
    add('OWNER_TOKEN_NOT_IN_CANDIDATE_SCOPE','No eligible token entry covers the candidate preview branch','Owner should rotate a new token in a protected environment and scope it to the chosen preview');
  if(env.different_branch_scope_present&&!env.current_branch_scope_present&&!env.unscoped_preview_scope_present)
    add('OTHER_BRANCH_TOKEN_NOT_REUSABLE','An environment key on another branch does not confer readiness on this branch','Do not copy a chat-exposed token across branches');
  if(!env.owner_confirms_prior_exposure_rotated)
    add('OWNER_TOKEN_ROTATION_NOT_VERIFIED','Previously exposed credentials have no completed owner-confirmed rotation evidence','Owner-controlled secret rotation is required before named records are accessible');
  for(const route of EXPECTED_ROUTES){
    const r=routes.get(route);
    if(r.http_status===200||r.http_status===206||r.http_status===304)
      add('ANONYMOUS_PRIVATE_ROUTE_EXPOSURE','Anonymous '+route+' returned a success/not-modified status','Stop and investigate potential private resource exposure');
    else if(r.http_status===503&&r.error_code==='owner_access_unavailable')
      add('OWNER_ACCESS_UNAVAILABLE','Read-only '+route+' gave 503 owner_access_unavailable','Configured owner sign-in is not established; do not try an exposed old password');
    else if(r.http_status!==401)
      add('PRIVATE_ROUTE_RESPONSE_UNVERIFIED','Anonymous '+route+' returned an unexpected or inconclusive response','Investigate exact deployment headers and protected route behavior');
    if(!r.private_cache||!r.noindex)
      add('PRIVATE_ROUTE_HEADER_GAP','Required no-store/private or noindex is missing on '+route,'Fix response privacy policy before attempting positive login');
  }
  const a=x.acceptance;
  if(!a.valid_owner_session_tested)
    add('POSITIVE_OWNER_LOGIN_NOT_OBSERVED','No successful authorized exact-preview owner session','Owner must complete login test privately, with no credential copied to a report');
  if(!a.expired_cookie_tested||!a.revoked_cookie_tested)
    add('SESSION_LIFECYCLE_NOT_VERIFIED','Expired and revoked cookie tests have not been completed on the exact build','Test expired and revoked credentials, and explicitly disposition logout replay limitations');
  if(!a.direct_anonymous_rls_tested)
    add('DIRECT_DATABASE_RLS_NOT_TESTED','No direct anonymous database row-level security evidence','Test against controlled non-sensitive fixtures with documented access policy');
  if(!a.fixed_cutoff_counts_reconciled)
    add('HISTORICAL_COUNTS_NOT_RECONCILED','Pre/post original count reconciliation not established','Verify all 11 raw families and separate training/download/reviewer cohorts at a fixed UTC cutoff');
  if(!a.mobile_safari_tested)
    add('IPHONE_SAFARI_NOT_ACCEPTED','Real iPhone Safari authentication/recovery evidence missing','Owner must test interrupted sign-in, navigation, exports and recovery');
  if(!a.rollback_verified)
    add('ROLLBACK_NOT_ACCEPTED','Exact-artifact rollback verification missing','Document restore sequence and check rollback before release');
  if(!a.owner_signed_exact_sha)
    add('OWNER_RELEASE_DECISION_ABSENT','No signed exact-SHA owner approval','Preserve HOLD regardless of source or CI success');
  return {
    schema:'jrs-owner-preview-preflight-result-v1',
    candidate_sha:x.candidate.head_sha,
    observed_preview_sha:x.preview.git_sha,
    program_status:'HOLD',
    owner_authentication:'NOT_VERIFIED',
    gates:{'PST-01':'NOT_VERIFIED','PST-02':'NOT_VERIFIED','PST-03':'NOT_VERIFIED',
           'PST-05':'NOT_VERIFIED','PST-07':'NOT_VERIFIED','PST-09':'NOT_VERIFIED',
           'PST-11':'NOT_AUTHORIZED'},
    blocking_findings:out,
    instructions:'Metadata and anonymous responses cannot authenticate an owner, grant private record access, verify Supabase RLS, establish baseline counts or approve release. Do not transmit the token, session cookie or personal records.'
  };
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  try{
    if(!process.argv[2]||process.argv.length>3)throw Error('Usage: node tools/check-owner-preview-admission.mjs <redacted-evidence.json>');
    const doc=JSON.parse(readFileSync(process.argv[2],'utf8'));
    process.stdout.write(JSON.stringify(evaluateOwnerPreviewAdmission(doc),null,2)+'\n');
  }catch(e){
    // Avoid echoing arbitrary input data, URLs or secret contents to CI logs.
    console.error('OWNER_PREVIEW_ADMISSION_INPUT_REJECTED');
    process.exitCode=2;
  }
}