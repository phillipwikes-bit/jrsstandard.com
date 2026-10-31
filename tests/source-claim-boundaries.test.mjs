import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessSourceClaims} from '../tools/check-source-claim-boundaries.mjs';

const source=JSON.parse(readFileSync(new URL('../docs/source-custody/INCREMENT_14_EVIDENCE_SCOPE_SNAPSHOT_2026-10-31.json',import.meta.url)));
const run=f=>{const v=structuredClone(source);f?.(v);return assessSourceClaims(v)};
const contains=(r,code)=>r.findings.some(f=>f.code===code);

test('01 actual 223-page source is controlling, not earlier 198-page compilation',()=>{
 const r=run();assert.equal(r.baseline.pages,223);
 assert.equal(r.baseline.byte_identity_verified,false);
 assert(contains(r,'MASTER_BYTES_NOT_INSPECTED'));
});
test('02 treating 198-page available-source compilation as governing is rejected',()=>{
 assert.throws(()=>run(v=>v.master.pages=198),/223-page/);
});
test('03 unknown source edition is not silently accepted',()=>{
 assert.throws(()=>run(v=>v.master.title='Other master'),/controlling baseline/);
});
test('04 missing provenance cannot be upgraded by local candidate tests',()=>{
 const r=run();assert.equal(r.gate_states.original_dsa,'NO_GO_NOT_VERIFIED');
 assert(contains(r,'LOCAL_CANDIDATE_NOT_ORIGINAL'));
 assert(contains(r,'DSA_PROVENANCE_NOT_AUTHENTICATED'));
});
test('05 original 18 functional requirements remain unverified',()=>{
 const r=run();assert(contains(r,'DSA_SP_NOT_VERIFIED'));
 assert.match(r.findings.find(f=>f.code==='DSA_SP_NOT_VERIFIED').detail,/0 of 18/);
});
test('06 R9 80 synthetic tests do not validate an original H3 study',()=>{
 const r=run();assert(contains(r,'R9_SYNTHETIC_NOT_STUDY'));
 assert.equal(r.gate_states.h2_h3,'NOT_ESTABLISHED');
});
test('07 named R9 ZIP in library does not establish primary replay',()=>{
 const r=run();assert(contains(r,'R9_ARCHIVE_NOT_RERUN'));
});
test('08 71 primary R6 hash matches do not clear 32 commercial transfers',()=>{
 const r=run();assert.equal(source.r6.primary_manifest_matches_reported,71);
 assert.equal(r.gate_states.r6_transfer,'NOT_AUTHORIZED');
 assert(contains(r,'R6_TRANSFER_NOT_CLEARED'));
});
test('09 R6 mismatch requires signed source-linked erratum',()=>{
 const r=run();assert(contains(r,'R6_COMMERCIAL_DIGEST_CONFLICT'));
});
test('10 unsupported rights count beyond denominator is rejected',()=>{
 assert.throws(()=>run(v=>v.r6.component_transfer_authorized=33),/denominators/);
});
test('11 no completed original product study can be inferred',()=>{
 const r=run();assert(contains(r,'H2H3_NOT_CONDUCTED'));
 assert.equal(source.study.actual_independently_adjudicated_h3_lift,null);
});
test('12 owner session and website release remain separate holds',()=>{
 const r=run();assert(contains(r,'OWNER_DASHBOARD_NOT_ACCEPTED'));
 assert.equal(r.gate_states.website_production,'HOLD');
});
test('13 even all self-asserted Boolean claims never automatically authorize release',()=>{
 const r=run(v=>{
  v.original.source_located=true;v.original.source_authenticated=true;
  v.original.clean_build_reproduced=true;v.original.sp_verified_count=18;
  v.study.h2_h3_independent_completed=true;
  v.website.owner_login_live_verified=true;v.website.production_release_approved=true;
  v.r6.component_transfer_authorized=32;v.r6.signed_erratum_verified=true;
  v.master.raw_bytes_inspected=true;
 });
 assert.equal(r.gate_states.original_dsa,'NO_GO_NOT_VERIFIED');
 assert.equal(r.gate_states.r6_transfer,'NOT_AUTHORIZED');
 assert.equal(r.gate_states.website_production,'HOLD');
 assert.match(r.qualification,/external primary evidence/);
});
test('14 unknown schema is refused',()=>{
 assert.throws(()=>run(v=>v.schema='wrong'),/schema/);
});
test('15 missing source object is refused',()=>{
 assert.throws(()=>run(v=>delete v.r9),/r9 must be an object/);
});
test('16 malformed evidence values are refused',()=>{
 assert.throws(()=>run(v=>v.master.raw_bytes_inspected='true'),/Boolean/);
 assert.throws(()=>run(v=>v.r9.reported_synthetic_pass=-1),/nonnegative/);
});
