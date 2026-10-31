import test from 'node:test';
import assert from 'node:assert/strict';
import {assessReleaseLineage,parseNameStatus,classify} from '../tools/check-release-lineage.mjs';
const sha=c=>c.repeat(40);
const privateMetrics=['api/access-stats.js','api/asset-stats.js','api/enroll-stats.js','api/gate-stats.js','api/geo-stats.js','api/orgpilot-stats.js'];
const baseline={schema:'jrs-public-program-continuity-v1',files:Object.fromEntries(Array.from({length:16},(_,i)=>['api/legacy-'+i+'.js',sha('a')]))};
for(const path of privateMetrics)baseline.files[path]=sha('f');
baseline.files['api/support.js']=sha('b');baseline.files['api/support-stats.js']=sha('c');
const entries={
 'api/support.js':{before_blob_sha:sha('b'),candidate_blob_sha:sha('d')},
 'api/support-stats.js':{before_blob_sha:sha('c'),candidate_blob_sha:sha('e')}
};
for(const path of privateMetrics)entries[path]={before_blob_sha:sha('f'),candidate_blob_sha:sha('9')};
const except={schema:'jrs_controlled_source_exception_v1',production_status:'HOLD',owner_approval:'NOT_PROVIDED',entries};
const policy={schema:'jrs-candidate-lineage-policy-v1',observed_main_sha:sha('1'),last_reviewed_pr_head_sha:sha('3'),production_authorization:'HOLD',required_ancestry:[{label:'PR57',sha:sha('2')},{label:'PR67',sha:sha('3')}]};
const facts=()=>({main_sha:sha('1'),head_sha:sha('4'),merge_base_sha:sha('1'),ahead:263,ancestor_results:{[sha('2')]:true,[sha('3')]:true},files:[{path:'api/owner-session.js',status:'M'},{path:'docs/program-status/example.md',status:'A'}],current_frozen_blobs:Object.entries(baseline.files).map(([path,id])=>({path,sha:except.entries[path]?.candidate_blob_sha||id}))});
const run=mutate=>{const f=facts(),p=structuredClone(policy),b=structuredClone(baseline),e=structuredClone(except);mutate?.(f,p,b,e);return assessReleaseLineage(f,p,b,e)};
const has=(x,code)=>x.issues.some(y=>y.code===code);
test('01 correct ancestry and 24 frozen Git blobs pass development audit',()=>{const x=run();assert.equal(x.integrity_audit,'PASS');assert.equal(x.frozen_original_sources,24)});
test('02 development PASS never grants deployment, product or transfer',()=>{const x=run();assert.equal(x.release_decision,'HOLD');assert.equal(x.original_dsa,'NO_GO_NOT_VERIFIED');assert.equal(x.transfer,'NOT_AUTHORIZED')});
test('03 changed main commit requires new signed baseline review',()=>assert(has(run(f=>f.main_sha=sha('5')),'MAIN_BASE_MOVED')));
test('04 divergent merge-base is rejected',()=>assert(has(run(f=>f.merge_base_sha=sha('5')),'HEAD_DIVERGED_FROM_MAIN')));
test('05 absent PR57 ancestry is reported',()=>assert(has(run(f=>f.ancestor_results[sha('2')]=false),'ANCESTOR_MISSING')));
test('06 absent PR67 ancestry is reported',()=>assert(has(run(f=>f.ancestor_results[sha('3')]=false),'ANCESTOR_MISSING')));
test('07 missing frozen blob is reported',()=>assert(has(run(f=>f.current_frozen_blobs.pop()),'FROZEN_BLOBS_INCOMPLETE')));
test('08 unapproved frozen source modification is rejected',()=>assert(has(run(f=>f.current_frozen_blobs[0].sha=sha('9')),'FROZEN_SOURCE_DRIFT')));
test('09 altered original exception hash is refused',()=>assert(has(run((f,p,b,e)=>e.entries['api/support.js'].before_blob_sha=sha('8')),'EXCEPTION_BASE_CONFLICT')));
test('10 ninth uncontrolled frozen source exception is refused',()=>assert.throws(()=>run((f,p,b,e)=>e.entries['api/legacy-1.js']={}),/unexpected exception/));
test('11 owner-approved release flag cannot be self-inserted',()=>assert.throws(()=>run((f,p)=>p.production_authorization='APPROVE'),/preapprove/));
test('12 final reviewed PR head must match last ancestry anchor',()=>assert.throws(()=>run((f,p)=>p.last_reviewed_pr_head_sha=sha('9')),/final ancestor/));
test('13 empty candidate revision cannot be a review package',()=>assert(has(run(f=>f.ahead=0),'NO_CANDIDATE_COMMITS')));
test('14 deletion of a historical frozen source is a blocker',()=>assert(has(run(f=>f.files.push({path:'api/support.js',status:'D'})),'FROZEN_SOURCE_REMOVED')));
test('15 duplicate diff paths are an audit error',()=>assert(has(run(f=>f.files.push({path:'api/owner-session.js',status:'M'})),'DIFF_MALFORMED')));
test('16 NUL-delimited Git renamed files parse correctly',()=>{const a=parseNameStatus('R100\0a.txt\0b.txt\0A\0z.md\0');assert.deepEqual(a.map(x=>x.path),['b.txt','z.md']);assert.equal(a[0].previous_path,'a.txt')});
test('17 invalid status and truncated rename are rejected',()=>{assert.throws(()=>parseNameStatus('Q\0x\0'),/unknown/);assert.throws(()=>parseNameStatus('R100\0a\0'),/missing/)});
test('18 runtime file family gets separate review inventory',()=>{const x=run();assert.equal(x.runtime_affected_paths[0],'api/owner-session.js');assert.equal(x.category_counts.RUNTIME_PRIVACY_AUTH_WRITERS,1);assert.equal(classify('tests/x.js'),'DEVELOPER_TEST_OR_TOOL')});
