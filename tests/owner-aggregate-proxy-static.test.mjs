// Increment 18: import-free source and routing contract for the continuity
// workflow, which deliberately does not install the Vercel dependency.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
const config=JSON.parse(text('vercel.json'));
const proxySource=text('proxy.js');
const frozen=JSON.parse(text('tests/public-program-baseline.json'));
const exceptions=JSON.parse(text('tests/public-program-controlled-exceptions.json'));
const html=['/programme-status-9872fb93cc94.html','/programme--9872fb93cc94.html'];
const metrics=['/api/access-stats','/api/enroll-stats','/api/orgpilot-stats','/api/gate-stats','/api/geo-stats','/api/asset-stats'];
test('01 Vercel exact matcher includes HTML and six metric routes',()=>{
 assert.equal(config.proxy.entrypoint,'proxy.js');
 assert.deepEqual(config.proxy.matcher,[...html,...metrics]);
});
test('02 each metric route is present in explicit proxy allowlist',()=>{
 for(const path of metrics)assert(proxySource.includes("'"+path+"'"),path);
});
test('03 proxy executes ownerAccess before next for listed paths',()=>{
 const a=proxySource.indexOf('if (!OWNER_PATHS.has(pathname)) return next();');
 const b=proxySource.indexOf('const denied = await ownerAccess(request);');
 const c=proxySource.lastIndexOf('return next();');
 assert(a>=0 && b>a && c>b);
});
test('04 owner GET API refusals are not redirected to HTML',()=>{
 assert.match(proxySource,/denied\.status === 401 && HTML_PATHS\.has\(pathname\)/);
 assert.match(proxySource,/return denied;/);
});
test('05 unsupported methods are refused without wildcard cross-origin authorization',()=>{
 assert.match(proxySource,/request\.method !== 'GET' && request\.method !== 'HEAD'/);
 assert.match(proxySource,/status: 405/);
 assert.doesNotMatch(proxySource,/Access-Control-Allow-Origin/);
});
test('06 original baseline preserved with six newly scoped security exceptions',()=>{
 assert.equal(Object.keys(frozen.files).length,24);
 for(const path of metrics)assert.match(frozen.files[path.slice(1)+'.js'],/^[0-9a-f]{40}$/,path);
 assert.deepEqual(Object.keys(exceptions.entries).sort(),["api/access-stats.js","api/asset-stats.js","api/enroll-stats.js","api/gate-stats.js","api/geo-stats.js","api/orgpilot-stats.js","api/support-stats.js","api/support.js"]);
});
test('07 metric source modules also require signed sessions and private response headers',()=>{
 for(const path of metrics){
  const src=text(path.slice(1)+'.js');
  assert.match(src,/SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(src,/ownerAccess\(req\)/);
  assert.doesNotMatch(src,/Access-Control-Allow-Origin/);
  assert.match(src,/no-store, private/);
 }
});
test('08 public aggregate endpoints not in owner route inventory',()=>{
 for(const p of ['/api/panel-stats','/api/support-stats','/api/initiative-support','/api/dl'])
   assert(!config.proxy.matcher.includes(p),p);
});
