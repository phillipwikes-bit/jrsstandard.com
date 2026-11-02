// Synthetic-only historical owner inbox completeness regression.
import assert from 'node:assert/strict';
import handler from '../api/leads-4b7e2c9af106d385.js';

const original = Object.fromEntries(['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY']
  .map(k => [k,process.env[k]]));
const oldFetch = globalThis.fetch;
const secret = 'synthetic-owner-historical-inbox-secret-0123456789abcd';
const dbKey = 'synthetic-supabase-read-key-not-real';
const req = (authorization) => new Request(
  'https://www.jrsstandard.com/api/leads-4b7e2c9af106d385?limit=1',
  {headers:authorization?{Authorization:'Bearer '+authorization}:{}}
);
const lead = (i) => ({
  created_at:'2026-10-20T00:00:00Z',source:'site-inquiry',
  name:'Synthetic contact '+i,email:'synthetic'+i+'@example.test',
  organization:'Synthetic organization',message:JSON.stringify({category:'research',country:'US'})
});
const attempt = (i) => ({
  created_at:'2026-10-20T00:00:00Z',
  payload:{offer:'synthetic-offer',state:i%2?'unconfigured':'configured',src:'fixture',country:'US'}
});
let checks=0, requests=[];
async function check(title, run) {
  await run();
  checks++;
  console.log('PASS '+title);
}
try {
  delete process.env.OWNER_DASHBOARD_TOKEN;
  process.env.SUPABASE_SERVICE_ROLE_KEY=dbKey;
  globalThis.fetch=async()=>{ throw Error('should not reach storage'); };
  await check('missing owner secret prevents private reads',async()=>{
    assert.equal((await handler(req())).status,503);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await check('anonymous and invalid tokens never access private storage',async()=>{
    assert.equal((await handler(req())).status,401);
    assert.equal((await handler(req('wrong'))).status,401);
  });

  const thousand = Array.from({length:1000},(_,i)=>lead(i));
  globalThis.fetch=async(url,options={})=>{
    requests.push({url:String(url),range:options.headers?.Range,auth:options.headers?.Authorization});
    if(options.headers?.Range==='0-999')return Response.json(thousand);
    return new Response('interrupted',{status:503});
  };
  await check('interrupted second page never leaks partial named leads',async()=>{
    const response=await handler(req(secret));
    assert.equal(response.status,502);
    const data=await response.json();
    assert.equal(data.complete,false);
    assert.equal(data.error,'historical_leads_source_incomplete');
    assert.ok(!('leads' in data));
    assert.ok(!('attempts' in data));
    assert.deepEqual(requests.map(x=>x.range),['0-999','1000-1999']);
  });

  requests=[];
  globalThis.fetch=async(url,options={})=>{
    requests.push({url:String(url),range:options.headers?.Range,auth:options.headers?.Authorization});
    if(String(url).includes('/pilot_contacts'))return Response.json([lead(1)]);
    if(options.headers?.Range==='0-999')return Response.json(
      Array.from({length:1000},(_,i)=>attempt(i)));
    return new Response('interrupted',{status:503});
  };
  await check('interrupted pay-screen source cannot appear as zero activity',async()=>{
    const response=await handler(req(secret));
    assert.equal(response.status,502);
    const data=await response.json();
    assert.equal(data.error,'historical_attempts_source_incomplete');
    assert.equal(data.complete,false);
    assert.ok(!('leads' in data));
    assert.ok(!('attempts' in data));
  });

  requests=[];
  globalThis.fetch=async(url,options={})=>{
    requests.push({url:String(url),range:options.headers?.Range,auth:options.headers?.Authorization});
    const isLead=String(url).includes('/pilot_contacts');
    if(options.headers?.Range==='0-999')return Response.json(
      Array.from({length:1000},(_,i)=>isLead?lead(i):attempt(i)));
    if(options.headers?.Range==='1000-1999')return Response.json(
      [isLead?lead(1000):attempt(1000)]);
    throw Error('Unexpected pagination range');
  };
  await check('complete 1001-row populations are counted and kept separate',async()=>{
    const response=await handler(req(secret));
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.complete,true);
    assert.equal(data.lead_count,1001);
    assert.equal(data.attempt_count,1001);
    assert.equal(data.leads[1000].email,'synthetic1000@example.test');
    assert.equal(data.attempts_unconfigured,500);
    assert.deepEqual(data.sources,['pilot_contacts','interaction_events']);
    assert.deepEqual(requests.map(x=>x.range),['0-999','1000-1999','0-999','1000-1999']);
    assert.ok(requests.every(x=>x.auth==='Bearer '+dbKey));
    assert.ok(requests.every(x=>x.url.includes('order=created_at.desc')));
    assert.ok(requests.every(x=>!x.url.includes('&limit=')));
    assert.ok(!JSON.stringify(data).includes(dbKey));
    assert.match(response.headers.get('cache-control'),/no-store/);
    assert.equal(response.headers.get('access-control-allow-origin'),null);
  });
  console.log('PASS '+checks+' historical owner inbox checks');
} finally {
  globalThis.fetch=oldFetch;
  for(const [k,v] of Object.entries(original)){
    if(v===undefined)delete process.env[k];
    else process.env[k]=v;
  }
}
