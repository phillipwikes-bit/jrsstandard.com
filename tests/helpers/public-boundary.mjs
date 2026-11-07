// Current public retirement contract. A removed route and an explicit refusal
// both close intake. Neither is evidence of production runtime verification.
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
export const retiredReviewRoutes=[
 'api/review.js','api/review-engine.js','api/v1/review-engine.js'
];
export async function assertClosedReviewRoute(path){
 const file=new URL(path,root);
 const config=JSON.parse(readFileSync(new URL('vercel.json',root),'utf8'));
 const route='/'+path.replace(/\.js$/,'');
 const routing=[...(config.rewrites||[]),...(config.redirects||[])];
 assert.ok(!routing.some(r=>r.source===route || r.source.includes(':') &&
  (r.source.startsWith('/api/') || r.source==='/:path*')),
  path+': retired API must not be routed to another handler');
 if(!existsSync(file)){
  // Vercel discovers both .js and .ts handlers. Guard alternate extensions and
  // catch-all handlers, not just the old JavaScript filename.
  for(const suffix of ['.ts','.mjs','.cjs'])assert.ok(!existsSync(new URL(path.replace(/\.js$/,suffix),root)),path+': alternate handler restored');
  for(const suffix of ['.js','.ts','.mjs','.cjs'])assert.ok(!existsSync(new URL(path.replace(/\.js$/,'/index'+suffix),root)),path+': directory handler restored');
  for(const dir of ['api/','api/v1/']){
   const loc=new URL(dir,root);
   if(existsSync(loc))assert.ok(!readdirSync(loc).some(n=>n.includes('[')||n.includes('...')),dir+': inspect catch-all before asserting a removed route is closed');
  }
  return 'removed';
 }
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('Unexpected outbound request');};
 try{
  const {default:handler}=await import(file.href);
  for(const method of ['POST','GET']){
   const response=await handler(new Request('https://example.test'+route,{
    method,headers:{'Content-Type':'application/json'},
    ...(method==='POST'?{body:JSON.stringify({text:'Fictional record. Public processing must remain unavailable.'})}:{})
   }));
   assert.ok([404,405,503].includes(response.status),path+': must refuse '+method);
   const body=await response.json();
   assert.ok(['controlled_review_unavailable','method_not_allowed','not_found'].includes(body.error),path+': refusal must not return an evaluation');
   assert.doesNotMatch(JSON.stringify(body),/"conditions"|"determination"|Use POST/,path+': no assessment or invitation');
   if(response.status===503){
    assert.equal(body.implementation_status,'controlled_local_development');
    assert.equal(body.public_access,false);
    assert.equal(body.record_submission_accepted,false);
    assert.equal(body.human_review_required,true);
    assert.deepEqual([...body.release_gates].sort(),[
     'independent_labeled_and_adjudicated_holdout_evaluation',
     'operator_control_evidence',
     'counsel_review_of_real_data_flows_and_claims',
     'recorded_owner_release_authorization',
     'independent_production_quality_assurance'
    ].sort());
    assert.equal(body.api_version,path.includes('/v1/')?'v1':undefined);
   }
  }
  assert.equal(calls,0,path+': no outbound request');
 }finally{globalThis.fetch=original;}
 return 'explicit refusal';
}
export function assertRetiredReviewPage(){
 assert.ok(!existsSync(new URL('review-engine.html',root)),
  'The retired public Engine page must not be silently restored');
}
export function assertConceptualManifest(){
 const s=readFileSync(new URL('manifest.html',root),'utf8');
 assert.match(s,/conceptual reference/i);
 assert.match(s,/does not offer a machine-readable service/);
 assert.match(s,/does not establish their equivalence or technical compatibility/);
 const v=JSON.parse(readFileSync(new URL('vercel.json',root),'utf8'));
 for(const path of [
  '/jrs-decision-reconstruction-manifest-v1.0.1.schema.json',
  '/jrs-decision-reconstruction-manifest-v1.0.schema.json',
  '/jrs-decision-reconstruction-manifest-example-v1.0.json'
 ]){
  assert.equal(v.rewrites.find(r=>r.source===path)?.destination,'/api/not-found');
  assert.ok(!s.includes('href="'+path+'"'),'conceptual page must not offer a blocked schema download');
 }
}
