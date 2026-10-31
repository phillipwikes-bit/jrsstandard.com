import assert from 'node:assert/strict';
import handler from '../api/site-inquiry-stats.js';
import { readFileSync } from 'node:fs';
const old={};
for(const k of ['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY']){old[k]=process.env[k];delete process.env[k];}
const oldFetch=globalThis.fetch;
const owner='synthetic-secret-for-owner-inquiry-stats-that-is-long';
const route='https://www.jrsstandard.com/api/site-inquiry-stats';
function request(auth){return new Request(route,{headers:auth?{Authorization:'Bearer '+auth}:{}})}
let calls=[];
try{
 let r=await handler(request());
 assert.equal(r.status,503); // no configured token must fail closed
 process.env.OWNER_DASHBOARD_TOKEN=owner;
 r=await handler(request());
 assert.equal(r.status,401);
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-private-service-key';
 const now=Date.now(),date=new Date(now-2*86400000).toISOString(),oldDate='2026-02-02T00:00:00.000Z';
 const rows=[
  {created_at:date,message:JSON.stringify({category:'research',consent_to_contact:true,note:'Secret note should never leave aggregate'})},
  {created_at:date,message:JSON.stringify({category:'commercial',consent_to_contact:true,email:'should-never-return@example.test'})},
  {created_at:date,message:JSON.stringify({category:'commercial',commercial_purpose:'asset-acquisition',consent_to_contact:true})},
  {created_at:date,message:JSON.stringify({category:'commercial',commercial_purpose:'method-licence',consent_to_contact:true})},
  {created_at:oldDate,message:'not-json'},
  {created_at:oldDate,message:JSON.stringify({category:'organization',consent_to_contact:false})}
 ];
 globalThis.fetch=async(url,options)=>{
  calls.push({url:String(url),headers:options.headers});
  assert.ok(String(url).includes('source=eq.site-inquiry'));
  assert.ok(!String(url).includes('enterprise-inquiry'));
  return Response.json(rows);
 };
 r=await handler(request());
 assert.equal(r.status,401);
 assert.equal(calls.length,0);
 r=await handler(request(owner));
 assert.equal(r.status,200);
 const d=await r.json();
 assert.equal(d.source,'site-inquiry');
 assert.equal(d.total,6);
 assert.equal(d.last_30_days,4);
 assert.equal(d.by_category.research,1);
 assert.equal(d.by_category.commercial,3);
 assert.equal(d.commercial_by_purpose.unspecified,1);
 assert.equal(d.commercial_by_purpose['asset-acquisition'],1);
 assert.equal(d.commercial_by_purpose['method-licence'],1);
 assert.equal(d.commercial_by_purpose['software-evaluation'],0);
 assert.equal(d.by_category.organization,1);
 assert.equal(d.unclassified_count,1);
 assert.equal(d.malformed_payload_count,1);
 assert.equal(d.contact_consent_count,4);
 assert.ok(!JSON.stringify(d).includes('Secret note'));
 assert.ok(!JSON.stringify(d).includes('should-never-return'));
 assert.equal(calls.length,1);
 const page=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
 for(const value of ['ld-site-total','ld-site-30d','ld-site-types','ld-site-commercial','/api/site-inquiry-stats'])assert.ok(page.includes(value));
 assert.ok(page.includes("x.source !== 'site-inquiry'"));
 console.log('PASS: inquiry totals by category, private reads, malformed rows, no PII leakage, no commercial conflation');
}finally{
 globalThis.fetch=oldFetch;
 for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
