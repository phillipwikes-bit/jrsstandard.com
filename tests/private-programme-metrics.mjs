import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import coauthors from '../api/coauthor-stats.js';
import contributors from '../api/contributor-stats.js';
import checkout from '../api/checkout-stats.js';
import {createOwnerCookie} from '../api/_owner-auth.js';

const handlers={coauthors,contributors,checkout};
const envNames=['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY'];
const saved=Object.fromEntries(envNames.map(k=>[k,process.env[k]]));
const fetchBefore=globalThis.fetch;
const secret='offline-synthetic-owner-session-secret-2026-10-30';
let calls=0,passed=0;
function request(path,headers={}) {
  return new Request('https://www.jrsstandard.com/api/'+path,{headers});
}
async function test(label,fn){await fn();passed++;console.log('PASS '+label);}
try{
  for(const key of envNames)delete process.env[key];
  globalThis.fetch=async()=>{calls++;throw Error('Unauthenticated fetch must not occur');};
  await test('all private metric endpoints fail closed without owner configuration',async()=>{
    for(const [name,handler] of Object.entries(handlers)) {
      const r=await handler(request(name));
      assert.equal(r.status,503,name);
    }
    assert.equal(calls,0);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-server-key';
  await test('all private metric endpoints deny anonymous and forged cookie',async()=>{
    for(const [name,handler] of Object.entries(handlers)) {
      for(const headers of [{},{Cookie:'__Host-jrs-owner=forged'}]){
        const r=await handler(request(name,headers));
        assert.equal(r.status,401,name);
        assert.equal(r.headers.get('cache-control'),'no-store, private');
      }
    }
    assert.equal(calls,0);
  });
  await test('legacy query token cannot authorize private metrics',async()=>{
    for(const [name,handler] of Object.entries(handlers)) {
      const r=await handler(request(name+'?token=legacy-synthetic'));
      assert.equal(r.status,401,name);
    }
    assert.equal(calls,0);
  });
  await test('non-GET methods do not access database',async()=>{
    for(const [name,handler] of Object.entries(handlers)){
      const r=await handler(new Request('https://www.jrsstandard.com/api/'+name,{method:'POST'}));
      assert.equal(r.status,405,name);
    }
    assert.equal(calls,0);
  });
  await test('valid signed owner cookie is not rejected by authentication',async()=>{
    const cookie=(await createOwnerCookie()).split(';')[0];
    for(const [name,handler] of Object.entries(handlers)){
      const r=await handler(request(name,{Cookie:cookie}));
      assert.notEqual(r.status,401,name);
      assert.notEqual(r.status,503,name);
    }
    assert.ok(calls>0,'authorized handler should reach storage');
  });
  await test('no permissive cross-origin headers in protected readers',async()=>{
    for(const name of ['coauthor','contributor','checkout']){
      const src=readFileSync(new URL('../api/'+name+'-stats.js',import.meta.url),'utf8');
      assert.ok(src.includes('ownerAccess(req)'),name);
      assert.ok(!src.includes("'Access-Control-Allow-Origin': '*'"),name);
      assert.ok(!src.includes("'Access-Control-Allow-Origin':'*'"),name);
      assert.ok(src.includes('noindex, nofollow'),name);
    }
  });
  console.log('PASS '+passed+' owner-only programme metrics checks');
}finally{
  globalThis.fetch=fetchBefore;
  for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
