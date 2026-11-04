// Synthetic readiness checks. No live Formspree, Supabase, Gmail or participant data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/owner-inquiry-readiness.js';
const keys=['OWNER_DASHBOARD_TOKEN','FORMSPREE_READ_API_KEY','SUPABASE_SERVICE_ROLE_KEY'];
const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const priorFetch=globalThis.fetch;
const secret='synthetic-JRS-owner-inquiry-readiness-credential-2026-abcdefgh';
const url='https://www.jrsstandard.com/api/owner-inquiry-readiness';
const req=(token=secret,method='GET')=>new Request(url,{
  method,headers:token?{authorization:'Bearer '+token}:{}
});
let total=0;
async function check(label,fn){await fn();total++;console.log('PASS '+label);}
try{
  keys.forEach(k=>delete process.env[k]);
  let calls=[];
  globalThis.fetch=async(...args)=>{calls.push(args);throw Error('unapproved network request')};
  await check('missing server owner secret fails closed',async()=>{
    assert.equal((await handler(req(null))).status,503);
    assert.equal(calls.length,0);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await check('anonymous and invalid credentials cannot probe providers',async()=>{
    assert.equal((await handler(req(null))).status,401);
    assert.equal((await handler(req('not-owner'))).status,401);
    assert.equal(calls.length,0);
  });
  await check('unsupported methods denied without probing',async()=>{
    assert.equal((await handler(req(secret,'POST'))).status,405);
    assert.equal(calls.length,0);
  });
  await check('missing provider credentials yield explicit nonzero claims and no network calls',async()=>{
    const r=await handler(req());
    assert.equal(r.status,200);
    const d=await r.json();
    assert.equal(d.formspree.state,'missing_read_credential');
    assert.equal(d.followup_store.state,'missing_database_credential');
    assert.equal(d.formspree.read_ready,false);
    assert.equal(d.followup_store.write_verified,false);
    assert.equal(d.formspree.count_claim,'not_measured');
    assert.equal(d.release,'hold');
    assert.equal(calls.length,0);
    assert.match(r.headers.get('cache-control'),/no-store/);
    assert.equal(r.headers.get('access-control-allow-origin'),null);
  });
  process.env.FORMSPREE_READ_API_KEY='fictional-formspree-read-only-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY='fictional-supabase-service-key';
  calls=[];
  globalThis.fetch=async(u,opt)=>{
    calls.push({url:String(u),opt});
    if(String(u).includes('formspree.io'))return Response.json({
      submissions:[{email:'private@example.test',name:'PRIVATE SOURCE',message:'Never return this'}]
    });
    return new Response(null,{status:200});
  };
  await check('configured probes return readiness and never leak a provider contact',async()=>{
    const r=await handler(req());assert.equal(r.status,200);
    const d=await r.json();
    assert.equal(d.formspree.state,'read_access_verified');
    assert.equal(d.followup_store.state,'private_table_access_verified');
    assert.equal(d.followup_store.write_verified,false);
    assert.equal(d.gmail.state,'delivery_not_verified_by_this_check');
    assert.equal(calls.length,2);
    assert.equal(calls[0].opt.method,'GET');
    assert.equal(calls[1].opt.method,'HEAD');
    assert.ok(calls[0].url.includes('limit=1'));
    assert.ok(calls[1].url.includes('limit=0'));
    const output=JSON.stringify(d);
    for(const secretPart of ['private@example.test','PRIVATE SOURCE','Never return this','fictional-supabase','fictional-formspree']){
      assert.ok(!output.includes(secretPart),'not allowed in readiness report: '+secretPart);
    }
    assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  });
  globalThis.fetch=async(u,opt)=>String(u).includes('formspree.io')
    ?new Response(null,{status:403})
    :new Response(null,{status:404});
  await check('provider access and missing table remain distinct blockers',async()=>{
    const r=await handler(req());const d=await r.json();
    assert.equal(d.formspree.state,'api_access_denied_or_plan');
    assert.equal(d.followup_store.state,'private_table_missing_or_not_exposed');
  });
  globalThis.fetch=async(u,opt)=>String(u).includes('formspree.io')
    ?new Response(null,{status:401})
    :new Response(null,{status:403});
  await check('invalid key and denied database permissions are distinct',async()=>{
    const r=await handler(req());const d=await r.json();
    assert.equal(d.formspree.state,'invalid_read_credential');
    assert.equal(d.followup_store.state,'private_table_access_denied');
  });
  globalThis.fetch=async()=>{throw Error('provider offline')};
  await check('provider transport outage does not imply zero contacts',async()=>{
    const r=await handler(req());const d=await r.json();
    assert.equal(d.formspree.state,'provider_unavailable');
    assert.equal(d.followup_store.state,'database_unavailable');
    assert.equal(d.formspree.count_claim,'not_measured');
  });
  globalThis.fetch=async(u)=>String(u).includes('formspree.io')
    ?Response.json({submissions:'invalid'})
    :new Response(null,{status:200});
  await check('unexpected Formspree response cannot be classified as ready',async()=>{
    const r=await handler(req());const d=await r.json();
    assert.equal(d.formspree.state,'unexpected_provider_response');
    assert.equal(d.formspree.read_ready,false);
  });
  const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  await check('owner UI only provides an explicit diagnostic control',async()=>{
    assert.ok(html.includes('id="current-inquiry-diagnostics"'));
    assert.ok(html.includes('id="current-inquiry-diagnostic-status"'));
    assert.ok(html.includes("fetch('/api/owner-inquiry-readiness'"));
    assert.ok(html.includes('read_access_verified'));
    assert.ok(!html.includes('googletagmanager.com/gtag/js'));
  });
  const workflow=readFileSync(new URL('../.github/workflows/owner-dashboard-mainline.yml',import.meta.url),'utf8');
  assert.ok(workflow.includes('node tests/owner-inquiry-readiness.mjs'));
  console.log('PASS '+total+' private owner inquiry readiness checks');
}finally{
  globalThis.fetch=priorFetch;
  for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}
}
