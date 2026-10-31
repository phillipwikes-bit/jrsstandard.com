import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateOwnerPreviewAdmission} from '../tools/check-owner-preview-admission.mjs';

const original=JSON.parse(readFileSync(new URL('../docs/program-status/INCREMENT_15_OWNER_PREVIEW_OBSERVATIONS_2026-10-31.json',import.meta.url)));
const assess=mutate=>{const v=structuredClone(original);mutate?.(v);return evaluateOwnerPreviewAdmission(v)};
const codes=report=>report.blocking_findings.map(x=>x.code);
const has=(report,code)=>codes(report).includes(code);

test('01 actual branch snapshot refuses owner auth and production release',()=>{
 const a=assess();
 assert.equal(a.owner_authentication,'NOT_VERIFIED');
 assert.equal(a.program_status,'HOLD');
 assert(has(a,'OWNER_TOKEN_NOT_IN_CANDIDATE_SCOPE'));
 assert(has(a,'PREVIEW_SHA_MISMATCH'));
});
test('02 503 owner-access-unavailable is not an incorrect password',()=>{
 const a=assess();assert.equal(a.blocking_findings.filter(x=>x.code==='OWNER_ACCESS_UNAVAILABLE').length,3);
 assert(!has(a,'ANONYMOUS_PRIVATE_ROUTE_EXPOSURE'));
});
test('03 earlier branch-scoped token cannot be considered current',()=>{
 assert(has(assess(),'OTHER_BRANCH_TOKEN_NOT_REUSABLE'));
});
test('04 undocumented old-token rotation stays blocking',()=>{
 assert(has(assess(),'OWNER_TOKEN_ROTATION_NOT_VERIFIED'));
});
test('05 preview SHA mismatch is explicit and not passed by READY metadata',()=>{
 const a=assess();assert(has(a,'PREVIEW_SHA_MISMATCH'));
 assert.equal(a.gates['PST-01'],'NOT_VERIFIED');
});
test('06 exact SHA alone never supplies authentication or RLS acceptance',()=>{
 const a=assess(v=>{v.preview.git_sha=v.candidate.head_sha;v.preview.target='preview'});
 assert(!has(a,'PREVIEW_SHA_MISMATCH'));
 assert.equal(a.owner_authentication,'NOT_VERIFIED');
 assert(has(a,'DIRECT_DATABASE_RLS_NOT_TESTED'));
});
test('07 correctly scoped env key with 401 still does not establish owner positive login',()=>{
 const a=assess(v=>{
  v.credential_metadata.current_branch_scope_present=true;
  v.credential_metadata.owner_confirms_prior_exposure_rotated=true;
  v.preview.git_sha=v.candidate.head_sha;v.preview.target='preview';
  for(const r of v.anonymous_routes){r.http_status=401;r.error_code='unauthorized'}
 });
 assert(!has(a,'OWNER_TOKEN_NOT_IN_CANDIDATE_SCOPE'));
 assert(!has(a,'OWNER_ACCESS_UNAVAILABLE'));
 assert(has(a,'POSITIVE_OWNER_LOGIN_NOT_OBSERVED'));
 assert.equal(a.program_status,'HOLD');
});
test('08 anonymous 200 on a private API triggers critical investigation',()=>{
 const a=assess(v=>{v.anonymous_routes[2].http_status=200;v.anonymous_routes[2].error_code=null});
 assert(has(a,'ANONYMOUS_PRIVATE_ROUTE_EXPOSURE'));
 assert.equal(a.program_status,'HOLD');
});
test('09 206 and 304 on a private route likewise cannot pass',()=>{
 for(const code of [206,304]){
  const a=assess(v=>{v.anonymous_routes[0].http_status=code;v.anonymous_routes[0].error_code=null});
  assert(has(a,'ANONYMOUS_PRIVATE_ROUTE_EXPOSURE'));
 }
});
test('10 private-cache/noindex gaps remain independent of access status',()=>{
 const a=assess(v=>{v.anonymous_routes[1].private_cache=false;v.anonymous_routes[1].noindex=false});
 assert(has(a,'PRIVATE_ROUTE_HEADER_GAP'));
});
test('11 unknown, duplicated or omitted restricted route is refused',()=>{
 assert.throws(()=>assess(v=>v.anonymous_routes.push(structuredClone(v.anonymous_routes[0]))),/exact owner route observations|required/);
 assert.throws(()=>assess(v=>v.anonymous_routes[2].route='/api/unlisted'),/unsupported or duplicate/);
 assert.throws(()=>assess(v=>v.anonymous_routes.pop()),/exact owner route observations/);
});
test('12 secret fields in a snapshot are rejected before output',()=>{
 assert.throws(()=>assess(v=>{v.token='fabricated do not reveal'}),/field forbidden or unsupported/);
 assert.throws(()=>assess(v=>{v.credential_metadata.secret='fabricated do not reveal'}),/field forbidden or unsupported/);
});
test('13 invalid SHA and unknown deployment target are refused',()=>{
 assert.throws(()=>assess(v=>v.candidate.head_sha='not-a-sha'),/invalid candidate head SHA/);
 assert.throws(()=>assess(v=>v.preview.target='production'),/preview target not recognized/);
});
test('14 missing owner release signature always retains HOLD',()=>{
 const a=assess();assert(has(a,'OWNER_RELEASE_DECISION_ABSENT'));
 assert.equal(a.gates['PST-11'],'NOT_AUTHORIZED');
});
test('15 even self-asserted all completion flags never becomes authorized release',()=>{
 const a=assess(v=>{
  v.candidate.draft=false;v.candidate.merged=true;
  v.preview.git_sha=v.candidate.head_sha;v.preview.target='preview';
  for(const k of Object.keys(v.acceptance))v.acceptance[k]=true;
  v.credential_metadata.current_branch_scope_present=true;
  v.credential_metadata.owner_confirms_prior_exposure_rotated=true;
  v.anonymous_routes.forEach(o=>{o.http_status=401;o.error_code='unauthorized'});
 });
 assert.equal(a.program_status,'HOLD');
 assert.equal(a.gates['PST-03'],'NOT_VERIFIED');
 assert.equal(a.gates['PST-11'],'NOT_AUTHORIZED');
});
test('16 no credentials, contacts or signed cookies are printed in output',()=>{
 const result=JSON.stringify(assess());
 assert(!result.includes('Bearer '));
 assert(!result.includes('Set-Cookie'));
 assert(!result.includes('SUPABASE_SERVICE_ROLE_KEY'));
 assert(!result.includes('email'));
});
