// Issue 3.3, Increment 19: source-controlled research stop rule.
// These tests use fabricated requests and NEVER invoke an external provider.
// A disabled endpoint is not evidence that the existing production deployment
// has removed its previously deployed cron. Only exact-SHA deployment can show it.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import study from '../api/run-study.js';
import {PUBLIC_STATUS} from '../api/_controlled-review.js';
import {PRIVATE_PATHS} from '../scripts/preview-route-gates.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const config=JSON.parse(read('vercel.json'));
const url='https://www.jrsstandard.com/api/run-study';
const readReq=method=>new Request(url,{method});
const g2=[
 '/api/access-stats','/api/enroll-stats','/api/orgpilot-stats',
 '/api/gate-stats','/api/geo-stats','/api/asset-stats'
];

test('01 no source-controlled Vercel cron remains in the release candidate',()=>{
 assert.equal(Object.hasOwn(config,'crons'),false);
});
test('02 the former daily scheduled study path is not in any cron list',()=>{
 assert(!JSON.stringify(config).includes('"schedule": "0 6 * * *"'));
});
test('03 source-controlled study runner remains a closed stub',()=>{
 const s=read('api/run-study.js');
 assert.match(s,/study_runner_disabled/);
 assert.match(s,/unavailable\(req, res,/);
 assert.doesNotMatch(s,/fetch\s*\(|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY/);
});
test('04 governing review status still refuses public record submission',()=>{
 assert.equal(PUBLIC_STATUS.public_access,false);
 assert.equal(PUBLIC_STATUS.record_submission_accepted,false);
 assert.equal(PUBLIC_STATUS.human_review_required,true);
 assert(PUBLIC_STATUS.release_gates.includes('independent_labeled_and_adjudicated_holdout_evaluation'));
 assert(PUBLIC_STATUS.release_gates.includes('recorded_owner_release_authorization'));
});
test('05 GET and POST remain 503 with no model, DB, or network activity',async()=>{
 const previousFetch=globalThis.fetch;
 let externalCalls=0;
 globalThis.fetch=async()=>{externalCalls++;throw Error('unexpected external request')};
 try{
   for(const method of ['GET','POST']){
     const r=await study(readReq(method));
     assert.equal(r.status,503,method);
     assert.match(r.headers.get('cache-control')||'',/no-store/);
     const v=await r.json();
     assert.equal(v.error,'study_runner_disabled');
     assert.equal(v.record_submission_accepted,false);
     assert.equal(v.public_access,false);
   }
   assert.equal(externalCalls,0);
 }finally{globalThis.fetch=previousFetch;}
});
test('06 prohibited verbs never activate study execution',async()=>{
 for(const method of ['PUT','PATCH','DELETE']){
   const r=await study(readReq(method));
   assert.equal(r.status,405,method);
   assert.equal((await r.json()).error,'method_not_allowed');
 }
});
test('07 OPTIONS is a preflight response only and not a completed study',async()=>{
 const r=await study(readReq('OPTIONS'));
 assert.equal(r.status,204);
 assert.match(r.headers.get('access-control-allow-methods')||'',/GET/);
 assert.match(r.headers.get('access-control-allow-methods')||'',/POST/);
});
test('08 all six G2 service-role analytics routes are in exact-preview negative probes',()=>{
 assert.equal(PRIVATE_PATHS.length,22);
 for(const p of g2)assert(PRIVATE_PATHS.includes(p),'missing '+p);
 assert.equal(new Set(PRIVATE_PATHS).size,PRIVATE_PATHS.length);
});
test('09 fixed original public interest source baseline is not silently redefined',()=>{
 const x=JSON.parse(read('tests/public-program-baseline.json'));
 const y=JSON.parse(read('tests/public-program-controlled-exceptions.json'));
 assert.equal(Object.keys(x.files).length,24);
 assert.deepEqual(Object.keys(y.entries).sort(),['api/support-stats.js','api/support.js']);
 assert.equal(y.production_status,'HOLD');
 assert.equal(y.owner_approval,'NOT_PROVIDED');
});
