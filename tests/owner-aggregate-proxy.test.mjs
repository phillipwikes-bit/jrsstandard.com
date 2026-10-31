// Increment 18. Synthetic source-level edge-owner gate checks only.
// No production access, database calls, private records or owner credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import proxy,{OWNER_METRIC_PATHS,OWNER_HTML_PATHS} from '../proxy.js';
import {createOwnerCookie,ownerAccess} from '../api/_owner-auth.js';

const ORIGIN='https://www.jrsstandard.com';
const ORIGINAL=process.env.OWNER_DASHBOARD_TOKEN;
const originalFetch=globalThis.fetch;
const SECRET='synthetic-increment-18-owner-secret-2026-10-31-ample';
let networkCalls=0;
const req=(path,opts={})=>new Request(ORIGIN+path,opts);
test.before(()=>{globalThis.fetch=async()=>{networkCalls++;throw Error('No external database or HTTP requests allowed');}});
test.after(()=>{
 globalThis.fetch=originalFetch;
 if(ORIGINAL===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
 else process.env.OWNER_DASHBOARD_TOKEN=ORIGINAL;
});
test('01 exactly six service-role metric paths are under owner proxy',()=>{
 assert.deepEqual(OWNER_METRIC_PATHS,[
  '/api/access-stats','/api/enroll-stats','/api/orgpilot-stats',
  '/api/gate-stats','/api/geo-stats','/api/asset-stats'
 ]);
 assert.equal(new Set(OWNER_METRIC_PATHS).size,6);
});
test('02 two private owner HTML paths remain protected',()=>{
 assert.deepEqual(OWNER_HTML_PATHS,[
  '/programme-status-9872fb93cc94.html',
  '/programme--9872fb93cc94.html'
 ]);
});
test('03 Vercel proxy matches all protected routes exactly',()=>{
 const cfg=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
 assert.equal(cfg.proxy.entrypoint,'proxy.js');
 assert.deepEqual(cfg.proxy.matcher,[...OWNER_HTML_PATHS,...OWNER_METRIC_PATHS]);
});
test('04 no owner configuration makes all six metric GET routes fail-closed 503',async()=>{
 delete process.env.OWNER_DASHBOARD_TOKEN;
 for(const path of OWNER_METRIC_PATHS){
  const r=await proxy(req(path));
  assert.equal(r.status,503,path);
  assert.deepEqual(await r.json(),{error:'owner_access_unavailable'});
  assert.match(r.headers.get('cache-control')||'',/no-store/);
  assert.match(r.headers.get('x-robots-tag')||'',/noindex/);
  assert.equal(r.headers.has('access-control-allow-origin'),false);
 }
 assert.equal(networkCalls,0);
});
test('05 configured owner without cookie returns API 401 not HTML redirect',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_METRIC_PATHS){
  const r=await proxy(req(path));
  assert.equal(r.status,401,path);
  assert.equal(r.headers.has('location'),false);
  assert.deepEqual(await r.json(),{error:'unauthorized'});
  assert.match(r.headers.get('cache-control')||'',/private/);
 }
 assert.equal(networkCalls,0);
});
test('06 forged or stale owner cookie cannot reach any aggregate',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_METRIC_PATHS){
  for(const cookie of ['__Host-jrs-owner=fabricated','__Host-jrs-owner=v1.0000000000.bad.signature']){
   const r=await proxy(req(path,{headers:{Cookie:cookie}}));
   assert.equal(r.status,401,path);
  }
 }
 assert.equal(networkCalls,0);
});
test('07 durable master token as bearer cannot bypass cookie-only authentication',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_METRIC_PATHS){
  const r=await proxy(req(path,{headers:{Authorization:'Bearer '+SECRET}}));
  assert.equal(r.status,401,path);
 }
 assert.equal(networkCalls,0);
});
test('08 all six metrics refuse non-read methods before reaching original functions',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_METRIC_PATHS){
  for(const method of ['POST','OPTIONS','DELETE']){
   const r=await proxy(req(path,{method}));
   assert.equal(r.status,405,path+':'+method);
   assert.match(r.headers.get('cache-control')||'',/no-store/);
   assert.equal(r.headers.get('allow'),'GET, HEAD');
   assert.equal(r.headers.has('access-control-allow-origin'),false);
  }
 }
 assert.equal(networkCalls,0);
});
test('09 HEAD requests do not bypass configured owner authentication',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_METRIC_PATHS){
  const r=await proxy(req(path,{method:'HEAD'}));
  assert.equal(r.status,401,path);
 }
 assert.equal(networkCalls,0);
});
test('10 original private HTML uses redirect for unsigned owner, unlike JSON APIs',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 for(const path of OWNER_HTML_PATHS){
  const r=await proxy(req(path));
  assert.equal(r.status,302,path);
  assert.equal(r.headers.get('location'),'/owner-login.html');
  assert.match(r.headers.get('cache-control')||'',/no-store/);
 }
 assert.equal(networkCalls,0);
});
test('11 proper signed session is accepted by auth gate, not a release certificate',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 const cookie=(await createOwnerCookie()).split(';')[0];
 for(const path of OWNER_METRIC_PATHS){
  const denied=await ownerAccess(req(path,{headers:{Cookie:cookie}}));
  assert.equal(denied,null,path);
 }
 assert.equal(networkCalls,0);
});
test('12 source handlers remain historical: proxy is the only added admission barrier',()=>{
 for(const path of OWNER_METRIC_PATHS){
  const source=readFileSync(new URL('..'+path+'.js',import.meta.url),'utf8');
  assert.match(source,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(source,/ownerAccess\(req\)/);
 }
});
test('13 privacy review must remain independent of all synthetic PASS responses',()=>{
 const docs=readFileSync(new URL('../docs/security/JRS_DECISION_SPELLCHECKER_READONLY_RLS_INVENTORY_2026-10-30.sql',import.meta.url),'utf8');
 assert.match(docs,/BEGIN READ ONLY;/);
 assert.match(docs,/ROLLBACK;/);
 // The existence of a SQL template is not proof it was run against a live DB.
 assert.equal(networkCalls,0);
});
