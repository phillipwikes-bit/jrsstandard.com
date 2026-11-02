// Synthetic-only historical checkout source coverage tests. No live contacts,
// provider credentials, payment attempts or outbound network requests.
import assert from 'node:assert/strict';
import handler from '../api/checkout-stats.js';
const keys=['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY'];
const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const savedFetch=globalThis.fetch;
const secret='synthetic-checkout-owner-secret-012345678901234567890123456789';
const service='synthetic-checkout-read-only-service-key';
const req=auth=>new Request('https://www.jrsstandard.com/api/checkout-stats',{
  headers:auth?{authorization:'Bearer '+auth}:{}
});
const click=i=>({created_at:'2026-10-02T00:00:00Z',
  payload:{
    offer:i===0?'__proto__':i===1?'toString':i===2?'constructor':'audit',
    state:i===4?'constructor':i%2?'unconfigured':'configured',
    country:i===3?'__proto__':'US'
  }});
const fallback=i=>({created_at:'2026-10-02T00:00:00Z',
  message:JSON.stringify({offer:'audit',price_usd:250,volume:'synthetic-'+i})});
const inquiry=i=>({created_at:'2026-10-02T00:00:00Z',
  message:JSON.stringify({interest:'licence',scale:'synthetic',timeline:'later'})});
const sourceType=url=>String(url).includes('interaction_events')?'checkout-click':
  String(url).includes('checkout-fallback')?'checkout-fallback':'enterprise-inquiry';
let calls=[],passes=0;
async function pass(label,fn){await fn();passes++;console.log('PASS '+label);}
try{
  delete process.env.OWNER_DASHBOARD_TOKEN;
  process.env.SUPABASE_SERVICE_ROLE_KEY=service;
  globalThis.fetch=async()=>{throw Error('unauthorized storage read');};
  await pass('unconfigured owner secret cannot reach storage',async()=>{
    assert.equal((await handler(req())).status,503);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await pass('anonymous or invalid credentials cannot reach storage',async()=>{
    assert.equal((await handler(req())).status,401);
    assert.equal((await handler(req('invalid'))).status,401);
  });
  const fixtures={'checkout-click':click,'checkout-fallback':fallback,'enterprise-inquiry':inquiry};
  for(const interrupted of Object.keys(fixtures)){
    calls=[];
    globalThis.fetch=async(url,opt)=>{
      const source=sourceType(url),range=opt.headers?.Range;
      calls.push({source,range});
      assert.equal(opt.headers.Authorization,'Bearer '+service);
      if(source!==interrupted)return Response.json([fixtures[source](0)]);
      if(range==='0-999')return Response.json(Array.from({length:1000},(_,i)=>fixtures[source](i)));
      return new Response('synthetic interruption',{status:503});
    };
    await pass(interrupted+' late-page failure cannot report partial totals',async()=>{
      const response=await handler(req(secret));
      assert.equal(response.status,502);
      const data=await response.json();
      assert.equal(data.complete,false);
      assert.equal(data.source,interrupted);
      assert.equal(data.error,'checkout_source_incomplete');
      assert.ok(!('pay_screen_arrivals' in data));
      assert.ok(!('fallback_leads' in data));
      assert.ok(!('enterprise_inquiries' in data));
      assert.ok(calls.some(x=>x.source===interrupted&&x.range==='1000-1999'));
      assert.equal(response.headers.get('access-control-allow-origin'),null);
    });
  }
  calls=[];
  globalThis.fetch=async(url,opt)=>{
    const source=sourceType(url),range=opt.headers?.Range;
    calls.push({source,range});
    assert.equal(opt.headers.Authorization,'Bearer '+service);
    if(range==='0-999')return Response.json(Array.from({length:1000},(_,i)=>fixtures[source](i)));
    if(range==='1000-1999')return Response.json([fixtures[source](1000)]);
    throw Error('unexpected page');
  };
  await pass('all 1001-row populations are separately and fully reconciled',async()=>{
    const response=await handler(req(secret));
    assert.equal(response.status,200);
    const d=await response.json();
    assert.equal(d.complete,true);
    assert.equal(d.pay_screen_arrivals,1001);
    assert.equal(d.fallback_leads,1001);
    assert.equal(d.enterprise_inquiries,1001);
    assert.equal(d.arrivals_by_state.unconfigured,500);
    assert.equal(d.arrivals_by_offer['__proto__'],1);
    assert.equal(d.arrivals_by_offer.toString,1);
    assert.equal(d.arrivals_by_offer.constructor,1);
    assert.equal(d.arrivals_by_country['__proto__'],1);
    assert.equal(d.arrivals_by_state.constructor,1);
    assert.equal(d.unconfigured_intent_usd,499*250);
    assert.ok(Number.isFinite(d.unconfigured_intent_usd));
    assert.equal(d.leads_by_offer.audit,1001);
    assert.equal(Object.values(d.arrivals_by_offer).reduce((a,b)=>a+b,0),1001);
    assert.equal(Object.values(d.arrivals_by_country).reduce((a,b)=>a+b,0),1001);
    assert.equal(Object.values(d.arrivals_by_state).reduce((a,b)=>a+b,0),1001);
    assert.deepEqual(d.source_coverage,['checkout-click','checkout-fallback','enterprise-inquiry']);
    assert.equal(calls.length,6);
    assert.ok(!JSON.stringify(d).includes(service));
    assert.ok(d.note.includes('neither confirmed purchase intent, lost revenue'));
    assert.equal(response.headers.get('access-control-allow-origin'),null);
    assert.match(response.headers.get('cache-control'),/no-store/);
    assert.match(response.headers.get('x-robots-tag'),/noindex/);
  });
  console.log('PASS '+passes+' complete private checkout activity tests');
}finally{
  globalThis.fetch=savedFetch;
  for(const [key,value] of Object.entries(prior)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
