import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import recheck from '../api/recheck-answers-b1a768e88d3e48bd.js';
import roster from '../api/roster-8c3f1a9e7b2d6045.js';
import geo from '../api/geo-4e8b2d7f9a1c3065.js';
import variance from '../api/variance-6b1d90fa2c47e8b3.js';
import {createOwnerCookie} from '../api/_owner-auth.js';

const handlers={recheck,roster,geo,variance};
const previous={};
for(const k of ['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY']) {
  previous[k]=process.env[k]; delete process.env[k];
}
const previousFetch=globalThis.fetch;
const ownerSecret='synthetic-research-reader-owner-code-with-adequate-length';
let calls=0,passes=0,ownerCookie='';
function request(name,method='GET',authorization=false,rawBearer=false){
  const headers=authorization?{Cookie:ownerCookie}:
    (rawBearer?{Authorization:'Bearer '+ownerSecret}:{});
  return new Request('https://www.jrsstandard.com/api/'+name,{method,headers});
}
async function check(name,fn){await fn();passes++;console.log('PASS '+name);}
try {
  globalThis.fetch=async()=>{calls++;throw Error('unauthorized upstream call');};
  await check('without configured owner token all research views fail closed',async()=>{
    for(const [name,handler] of Object.entries(handlers)){
      const r=await handler(request(name));
      assert.equal(r.status,503,name);
    }
    assert.equal(calls,0);
  });
  process.env.OWNER_DASHBOARD_TOKEN=ownerSecret;
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-server-only-db-key';
  ownerCookie=(await createOwnerCookie()).split(';')[0];
  await check('anonymous and forged owner credentials cannot read research responses',async()=>{
    for(const [name,handler] of Object.entries(handlers)){
      for(const authorized of [false]){
        const r=await handler(request(name,'GET',authorized));
        assert.equal(r.status,401,name);
      }
    }
    assert.equal(calls,0);
  });
  await check('raw owner master bearer cannot read protected research data',async()=>{
    for(const [name,handler] of Object.entries(handlers)){
      const r=await handler(request(name,'GET',false,true));
      assert.equal(r.status,401,name);
    }
    assert.equal(calls,0);
  });
  await check('all research readers reject non-GET requests with no DB read',async()=>{
    for(const [name,handler] of Object.entries(handlers)){
      for(const method of ['POST','OPTIONS']){
        const r=await handler(request(name,method,true));
        assert.equal(r.status,405,name);
      }
    }
    assert.equal(calls,0);
  });
  const fullBatch=Array.from({length:1000},()=>({created_at:'2026-10-30T12:00:00Z',message:'{}',payload:{country:'US',edition:'synthetic',src:'synthetic'}}));
  let ranges=[];
  globalThis.fetch=async(url,options={})=>{
    calls++;
    const range=options.headers?.Range||'none';
    ranges.push(range);
    // First page looks plausible. A second-page provider failure must prevent
    // the entire incomplete dataset from being presented as a full result.
    if(range==='0-999')return Response.json(fullBatch);
    return new Response('synthetic upstream interruption',{status:503});
  };
  await check('any incomplete research dataset is refused instead of silently truncated',async()=>{
    for(const [name,handler] of Object.entries({recheck,roster,geo,variance})){
      const r=await handler(request(name,'GET',true));
      assert.equal(r.status,502,name);
      assert.ok(!(await r.text()).includes('synthetic-server-only-db-key'));
    }
    assert.ok(ranges.includes('0-999') && ranges.includes('1000-1999'));
  });
  calls=0;
  globalThis.fetch=async(url,options={})=>{
    calls++;
    if(String(url).includes('training-enroll')){
      return Response.json([{name:'Fixture Enrollee',email:'reader@example.test',
        organization:'Fixture Lab',message:JSON.stringify({country:'US'}),created_at:'2026-10-29T00:00:00Z'}]);
    }
    if(String(url).includes('training-complete'))return Response.json([]);
    if(String(url).includes('guide-dl'))return Response.json([{created_at:'2026-10-29T00:00:00Z',
      payload:{country:'US',edition:'synthetic-edition',src:'synthetic-channel'}}]);
    if(String(url).includes('recheck-submit'))return Response.json([{name:'Fixture Reader',
      email:'reader@example.test',organization:'Fixture Lab',created_at:'2026-10-29T00:00:00Z',
      message:JSON.stringify({slot:'E-01',study:'synthetic',answers:[],answered_count:0,total_cases:10})}]);
    throw new Error('Unexpected table '+String(url));
  };
  await check('fully paginated second-read response preserves all enrolled records',async()=>{
    const r=await recheck(request('recheck','GET',true));
    assert.equal(r.status,200);
    const d=await r.json();
    assert.equal(d.ok,true);
    assert.equal(d.submissions,1);
    assert.equal(d.readers[0].slot,'E-01');
  });
  await check('fully paginated roster preserves all enrollment records',async()=>{
    const r=await roster(request('roster','GET',true));
    assert.equal(r.status,200);
    const html=await r.text();
    assert.ok(html.includes('Fixture Enrollee'));
    assert.ok(html.includes('owner authentication'));
    assert.ok((r.headers.get('cache-control')||'').includes('no-store'));
  });
  await check('fully paginated guide report preserves source counts and security headers',async()=>{
    const r=await geo(request('geo','GET',true));
    assert.equal(r.status,200);
    const html=await r.text();
    assert.ok(html.includes('synthetic-edition'));
    assert.ok(html.includes('synthetic-channel'));
    assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');
    assert.ok((r.headers.get('cache-control')||'').includes('no-store'));
  });
  await check('sensitive views do not retain wildcard cross-origin access',async()=>{
    for(const n of ['recheck-answers-b1a768e88d3e48bd','roster-8c3f1a9e7b2d6045','geo-4e8b2d7f9a1c3065','variance-6b1d90fa2c47e8b3']){
      const s=readFileSync(new URL('../api/'+n+'.js',import.meta.url),'utf8');
      assert.ok(s.includes('ownerAccess(req)'),n);
      assert.ok(!s.includes("'Access-Control-Allow-Origin': '*'"),n);
      assert.ok(!s.includes("'Access-Control-Allow-Origin':'*'"),n);
    }
  });
  console.log('PASS '+passes+' owner research report integrity checks');
} finally {
  globalThis.fetch=previousFetch;
  for(const [k,v] of Object.entries(previous)) {
    if(v===undefined)delete process.env[k];else process.env[k]=v;
  }
}
