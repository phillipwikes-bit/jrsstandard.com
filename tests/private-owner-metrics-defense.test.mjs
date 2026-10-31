// Increment 20. Direct-handler defense in depth: fabricated session keys and
// empty synthetic PostgREST results only. No live database, original records,
// private contacts or actual owner passwords.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOwnerCookie} from '../api/_owner-auth.js';
import access from '../api/access-stats.js';
import enroll from '../api/enroll-stats.js';
import orgpilot from '../api/orgpilot-stats.js';
import gate from '../api/gate-stats.js';
import geo from '../api/geo-stats.js';
import asset from '../api/asset-stats.js';
const routes={
 'access-stats':access,'enroll-stats':enroll,'orgpilot-stats':orgpilot,
 'gate-stats':gate,'geo-stats':geo,'asset-stats':asset
};
const ORIGIN='https://www.jrsstandard.com';
const OWNER='increment20-only-synthetic-owner-access-credential-abc0123456789';
const ROTATED='increment20-only-rotated-owner-credential-xyz9876543210';
const ENV_KEYS=['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY'];
const saved=Object.fromEntries(ENV_KEYS.map(key=>[key,process.env[key]]));
const savedFetch=globalThis.fetch;
let externalCalls=0;
const req=(name,options={})=>new Request(ORIGIN+'/api/'+name,options);
const assertPrivate=r=>{
 assert.match(r.headers.get('cache-control')||'',/private/);
 assert.match(r.headers.get('cache-control')||'',/no-store/);
 assert.match(r.headers.get('x-robots-tag')||'',/noindex/);
 assert.equal(r.headers.has('access-control-allow-origin'),false);
};
test.before(()=>{
 for(const key of ENV_KEYS)delete process.env[key];
 globalThis.fetch=async()=>{externalCalls++;throw Error('Unexpected network: direct handler must not access storage before admission');};
});
test.after(()=>{
 globalThis.fetch=savedFetch;
 for(const [key,value] of Object.entries(saved)){
  if(value===undefined)delete process.env[key];else process.env[key]=value;
 }
});
test('01 scope contains exactly six internal owner metric handlers',()=>{
 assert.deepEqual(Object.keys(routes).sort(),[
  'access-stats','asset-stats','enroll-stats','gate-stats','geo-stats','orgpilot-stats'
 ]);
});
test('02 original immutable baseline retains 24 old source IDs',()=>{
 const b=JSON.parse(readFileSync(new URL('../tests/public-program-baseline.json',import.meta.url)));
 assert.equal(Object.keys(b.files).length,24);
});
test('03 controlled security exceptions are eight exact-hash proposed replacements',()=>{
 const b=JSON.parse(readFileSync(new URL('../tests/public-program-baseline.json',import.meta.url)));
 const x=JSON.parse(readFileSync(new URL('../tests/public-program-controlled-exceptions.json',import.meta.url)));
 assert.equal(x.status,'PROPOSED_NOT_RELEASE_APPROVED');
 assert.equal(x.production_status,'HOLD');
 assert.equal(x.owner_approval,'NOT_PROVIDED');
 assert.equal(Object.keys(x.entries).length,8);
 for(const name of Object.keys(routes)){
  const path='api/'+name+'.js',e=x.entries[path];
  assert(e,path);assert.equal(e.before_blob_sha,b.files[path]);
  assert.notEqual(e.candidate_blob_sha,e.before_blob_sha);
  assert.equal(e.database_migration,false);
  assert.equal(e.history_rewrite,false);
 }
});
test('04 with no owner secret all six direct reads refuse before any DB fetch',async()=>{
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name));
  assert.equal(r.status,503,name);
  assert.deepEqual(await r.json(),{error:'owner_access_unavailable'});
  assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('05 configured secret still refuses all six anonymous direct reads',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=OWNER;
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name));
  assert.equal(r.status,401,name);
  assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('06 forged cookies are refused inside the handler, independent of proxy',async()=>{
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name,{headers:{Cookie:'__Host-jrs-owner=fabricated'}}));
  assert.equal(r.status,401,name);assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('07 correct long-term bearer owner token cannot read a direct metrics route',async()=>{
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name,{headers:{Authorization:'Bearer '+OWNER}}));
  assert.equal(r.status,401,name);assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('08 non-GET requests are refused by each handler including OPTIONS',async()=>{
 for(const [name,handler] of Object.entries(routes)){
  for(const method of ['POST','OPTIONS','DELETE']){
   const r=await handler(req(name,{method}));
   assert.equal(r.status,405,name+':'+method);
   assertPrivate(r);
  }
 }
 assert.equal(externalCalls,0);
});
test('09 signed owner cookie reaches service-key availability check without DB fetch',async()=>{
 const cookie=(await createOwnerCookie()).split(';')[0];
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name,{headers:{Cookie:cookie}}));
  assert.equal(r.status,503,name);
  assert.equal((await r.json()).error,'service_key_missing',name);
  assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('10 rotating owner key invalidates cookie across all direct reader routes',async()=>{
 const before=(await createOwnerCookie()).split(';')[0];
 process.env.OWNER_DASHBOARD_TOKEN=ROTATED;
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name,{headers:{Cookie:before}}));
  assert.equal(r.status,401,name);assertPrivate(r);
 }
 assert.equal(externalCalls,0);
});
test('11 synthetic empty upstream can reach direct handler only after session check',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=OWNER;
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service-key-not-connected-to-real-database';
 const cookie=(await createOwnerCookie()).split(';')[0];
 let calls=0;
 globalThis.fetch=async()=>{
  calls++;
  return Response.json([]);
 };
 for(const [name,handler] of Object.entries(routes)){
  const r=await handler(req(name,{headers:{Cookie:cookie}}));
  assert.equal(r.status,200,name);
  assertPrivate(r);
  const body=await r.json();
  assert.equal(typeof body,'object',name);
 }
 assert(calls>=6);
});
test('12 no test ever transmitted a request to an external service',()=>{
 // The only "calls" allowed were handled by synthetic mocks in test 11.
 assert.equal(externalCalls,0);
});
