// Synthetic private inquiry follow-up tests. No real contact, OAuth or outbound email.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/owner-inquiry-followup.js';
const previous=Object.fromEntries(['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY']
  .map(k=>[k,process.env[k]]));
const originalFetch=globalThis.fetch;
const secret='offline-synthetic-owner-token-for-jrs-inquiry-tests-2026';
const origin='https://www.jrsstandard.com';
const endpoint=origin+'/api/owner-inquiry-followup';
const id='sub_abc0123456789';
const request=(method='GET',body,owner=secret,atOrigin=origin)=>{
  const headers={};
  if(owner)headers.authorization='Bearer '+owner;
  if(method==='PUT'){headers.origin=atOrigin;headers['content-type']='application/json';}
  return new Request(endpoint,{method,headers,
    ...(method==='PUT'?{body:JSON.stringify(body)}:{})});
};
let count=0;
async function check(name,fn){await fn();count++;console.log('PASS: '+name);}
try{
  delete process.env.OWNER_DASHBOARD_TOKEN;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  globalThis.fetch=async()=>{throw Error('unauthorized network request')};
  await check('no owner secret fails closed before storage',async()=>{
    assert.equal((await handler(request('GET',null,null))).status,503);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await check('missing or invalid owner credentials are refused',async()=>{
    assert.equal((await handler(request('GET',null,null))).status,401);
    assert.equal((await handler(request('GET',null,'invalid'))).status,401);
  });
  await check('missing database credential is unavailable, never zero',async()=>{
    const r=await handler(request());assert.equal(r.status,503);
    assert.equal((await r.json()).ready,false);
  });
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-database-service-token';
  await check('cross-origin writes cannot reach the storage endpoint',async()=>{
    const r=await handler(request('PUT',{source_record_id:id,followup_status:'needs_review'},secret,'https://attacker.example'));
    assert.equal(r.status,403);
  });
  await check('unexpected fields cannot be stored',async()=>{
    const r=await handler(request('PUT',{source_record_id:id,followup_status:'needs_review',email:'not-allowed@example.test'}));
    assert.equal(r.status,400);
  });
  await check('unsupported state and unstable IDs are rejected',async()=>{
    assert.equal((await handler(request('PUT',{source_record_id:id,followup_status:'qualified_buyer'}))).status,400);
    assert.equal((await handler(request('PUT',{source_record_id:'1',followup_status:'closed'}))).status,400);
  });
  let calls=[];
  globalThis.fetch=async(url,opts)=>{
    calls.push({url:String(url),opts});
    if(opts.method==='POST')return Response.json([{
      source:'formspree-public-jrs-contact',source_record_id:id,
      followup_status:'needs_review',updated_at:'2026-11-03T20:00:00Z'
    }]);
    return Response.json([{
      source_record_id:id,followup_status:'needs_review',updated_at:'2026-11-03T20:00:00Z'
    }]);
  };
  await check('owner GET returns only manual source states',async()=>{
    const r=await handler(request());assert.equal(r.status,200);
    const d=await r.json();assert.equal(d.ready,true);assert.equal(d.states.length,1);
    assert.equal(d.states[0].source_record_id,id);
    assert.ok(!JSON.stringify(d).includes('synthetic-database-service-token'));
    assert.ok(!JSON.stringify(d).includes('name'));
  });
  await check('owner PUT stores only allowlisted state fields',async()=>{
    const r=await handler(request('PUT',{source_record_id:id,followup_status:'needs_review'}));
    assert.equal(r.status,200);
    const d=await r.json();assert.equal(d.saved,true);
    const sent=JSON.parse(calls.find(c=>c.opts.method==='POST').opts.body);
    assert.deepEqual(Object.keys(sent).sort(),
      ['followup_status','source','source_record_id','updated_at'].sort());
    assert.equal(sent.source,'formspree-public-jrs-contact');
    assert.equal(calls.find(c=>c.opts.method==='POST').opts.headers.Prefer,
      'resolution=merge-duplicates,return=representation');
  });
  globalThis.fetch=async(url,opts)=>new Response(JSON.stringify({message:'table missing'}),{status:404});
  await check('uninstalled private table must not claim success',async()=>{
    assert.equal((await handler(request('PUT',{source_record_id:id,followup_status:'closed'}))).status,503);
    const get=await handler(request());assert.equal(get.status,503);
    assert.equal((await get.json()).ready,false);
  });
  const sql=readFileSync(new URL('../supabase-owner-inquiry-followup.sql',import.meta.url),'utf8');
  await check('SQL private table has RLS and no public grant',async()=>{
    assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
    assert.match(sql,/REVOKE ALL ON TABLE public\.jrs_inquiry_followups FROM PUBLIC, anon, authenticated/);
    assert.match(sql,/GRANT SELECT, INSERT, UPDATE ON TABLE public\.jrs_inquiry_followups TO service_role/);
    assert.doesNotMatch(sql,/email\s+text|name\s+text|message\s+text/i);
  });
  const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  await check('private owner UI separates current source and triage states',async()=>{
    assert.ok(html.includes("fetch('/api/owner-formspree-inbox'"));
    assert.ok(html.includes("fetch('/api/owner-inquiry-followup'"));
    assert.ok(html.includes('id="current-formspree-category-filter"'));
    assert.ok(html.includes('id="current-formspree-followup-filter"'));
    assert.ok(html.includes('Formspree and the designated email inbox'));
    assert.ok(html.includes('Gmail notifications remain separate from dashboard retrieval'));
    assert.ok(html.includes('followup_status'));
    assert.ok(html.includes('jrs-current-formspree-private-inquiries.csv'));
    assert.ok(html.includes('from%3Aformspree.io+after%3A2026%2F10%2F29'));
    assert.ok(!html.includes('googletagmanager.com/gtag/js'));
  });
  console.log('PASS: '+count+' owner triage and status tests');
}finally{
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries(previous)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
