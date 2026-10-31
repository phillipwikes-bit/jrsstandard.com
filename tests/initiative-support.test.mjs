import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/initiative-support.js';

const endpoint='https://jrs.example.test/api/initiative-support';
const originalFetch=globalThis.fetch;
const originalService=process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalVercelEnv=process.env.VERCEL_ENV;
process.env.VERCEL_ENV='production';
function request({method='POST',origin='https://jrs.example.test',campaign='rtkw',
                  body,headers={}}={}){
  const h={'content-type':'application/json','user-agent':'Mozilla/5.0 HumanBrowser',
           'sec-fetch-site':'same-origin',...headers};
  if(origin!==null)h.origin=origin;
  return new Request(endpoint,{method,headers:h,
    ...(method==='GET'||method==='HEAD'?{}:{body:body??JSON.stringify({campaign})})});
}
async function run(args={},fetchResponse=new Response(null,{status:201}),service='fixture-service'){
  let calls=[];
  globalThis.fetch=async(url,options)=>{calls.push({url,options});return fetchResponse;};
  if(service===null)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY=service;
  const res=await handler(request(args));
  return {res,data:await res.json(),calls};
}
test.after(()=>{globalThis.fetch=originalFetch;
 if(originalVercelEnv===undefined)delete process.env.VERCEL_ENV;
 else process.env.VERCEL_ENV=originalVercelEnv;
 if(originalService===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 else process.env.SUPABASE_SERVICE_ROLE_KEY=originalService;
});
test('explicit same-origin POST is recorded in historical support event family',async()=>{
 const {res,data,calls}=await run();
 assert.equal(res.status,200);assert.equal(data.recorded,true);assert.equal(calls.length,1);
 assert.match(calls[0].url,/\/rest\/v1\/interaction_events$/);
 const p=JSON.parse(calls[0].options.body);
 assert.equal(p.source,'support');assert.equal(p.type,'endorse');
 assert.equal(p.payload.campaign,'rtkw');
 assert.equal(p.payload.src,'initiative-page');
 assert.equal(p.payload.user_agent,'Mozilla/5.0 HumanBrowser');
 assert.equal(p.payload.email,undefined);
 assert.match(res.headers.get('set-cookie'),/jrs_e_rtkw=1/);
 assert.match(res.headers.get('set-cookie'),/HttpOnly/);
 assert.equal(res.headers.get('cache-control'),'private, no-store');
});
test('second initiative uses its own compatibility cookie',async()=>{
 const {res,calls}=await run({campaign:'defend'});
 assert.equal(res.status,200);assert.equal(calls.length,1);
 assert.match(res.headers.get('set-cookie'),/jrs_e_defend=1/);
});
test('GET cannot silently count pageviews or crawler prefetch',async()=>{
 const {res,calls}=await run({method:'GET'});
 assert.equal(res.status,405);assert.equal(calls.length,0);
});
test('HEAD cannot count an initiative',async()=>{
 const {res,calls}=await run({method:'HEAD'});
 assert.equal(res.status,405);assert.equal(calls.length,0);
});
test('cross-origin POST cannot record an initiative',async()=>{
 const {res,calls}=await run({origin:'https://third-party.example'});
 assert.equal(res.status,403);assert.equal(calls.length,0);
});
test('cross-site fetch metadata is refused even with forged origin',async()=>{
 const {res,calls}=await run({headers:{'sec-fetch-site':'cross-site'}});
 assert.equal(res.status,403);assert.equal(calls.length,0);
});
test('missing Origin fails closed',async()=>{
 const {res,calls}=await run({origin:null});
 assert.equal(res.status,403);assert.equal(calls.length,0);
});
test('non-JSON content type fails closed',async()=>{
 const {res,calls}=await run({headers:{'content-type':'text/plain'}});
 assert.equal(res.status,415);assert.equal(calls.length,0);
});
test('unrecognized campaign cannot poison historical cohort',async()=>{
 const {res,calls}=await run({campaign:'buyer-lead'});
 assert.equal(res.status,422);assert.equal(calls.length,0);
});
test('malformed JSON fails cleanly',async()=>{
 const {res,calls}=await run({body:'{'});
 assert.equal(res.status,400);assert.equal(calls.length,0);
});
test('oversized request is refused',async()=>{
 const {res,calls}=await run({body:JSON.stringify({campaign:'rtkw',extraneous:'x'.repeat(300)})});
 assert.equal(res.status,413);assert.equal(calls.length,0);
});
test('already-counted browser does not post twice',async()=>{
 const {res,data,calls}=await run({headers:{cookie:'other=a; jrs_e_rtkw=1'}});
 assert.equal(res.status,200);assert.equal(data.already_recorded,true);
 assert.equal(data.recorded,false);assert.equal(calls.length,0);
 assert.equal(res.headers.get('set-cookie'),null);
});
test('preview environment cannot write or count an action',async()=>{
 process.env.VERCEL_ENV='preview';
 try{
  const {res,data,calls}=await run();
  assert.equal(res.status,200);assert.equal(data.recorded,false);
  assert.equal(data.preview_only,true);assert.equal(calls.length,0);
  assert.equal(res.headers.get('set-cookie'),null);
 }finally{process.env.VERCEL_ENV='production'}
});
test('unset environment cannot write or count an action',async()=>{
 delete process.env.VERCEL_ENV;
 try{
  const {res,data,calls}=await run();
  assert.equal(res.status,200);assert.equal(data.recorded,false);
  assert.equal(data.preview_only,true);assert.equal(calls.length,0);
  assert.equal(res.headers.get('set-cookie'),null);
 }finally{process.env.VERCEL_ENV='production'}
});
test('missing database credential fails closed, not successful',async()=>{
 const {res,data,calls}=await run({},new Response(null,{status:201}),null);
 assert.equal(res.status,503);assert.equal(data.recorded,undefined);
 assert.equal(calls.length,0);assert.equal(res.headers.get('set-cookie'),null);
});
test('HTTP 500 from database does not set cookie or assert success',async()=>{
 const {res,data,calls}=await run({},new Response(null,{status:500}));
 assert.equal(res.status,503);assert.equal(data.recorded,false);
 assert.equal(calls.length,1);assert.equal(res.headers.get('set-cookie'),null);
});
test('HTTP 401 from database does not set cookie or assert success',async()=>{
 const {res,data}=await run({},new Response(null,{status:401}));
 assert.equal(res.status,503);assert.equal(data.recorded,false);
 assert.equal(res.headers.get('set-cookie'),null);
});
test('crawler user agent is not counted',async()=>{
 const {res,calls}=await run({headers:{'user-agent':'Googlebot/2.1'}});
 assert.equal(res.status,403);assert.equal(calls.length,0);
});
test('caller-supplied src cannot create a buyer attribution',async()=>{
 const {calls}=await run({body:JSON.stringify({campaign:'rtkw',src:'commercial-acquisition'})});
 const payload=JSON.parse(calls[0].options.body);
 assert.equal(payload.payload.src,'initiative-page');
});
