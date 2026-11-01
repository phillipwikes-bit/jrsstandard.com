// Legacy GET writer regression for Issue 3.2 PST-04/06.
// Synthetic requests only; no real database operations or participant data.
import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/support.js';

const oldFetch=globalThis.fetch;
const oldSecret=process.env.SUPABASE_SERVICE_ROLE_KEY;
const oldEnvironment=process.env.VERCEL_ENV;
test.after(()=>{
 globalThis.fetch=oldFetch;
 if(oldSecret===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 else process.env.SUPABASE_SERVICE_ROLE_KEY=oldSecret;
 if(oldEnvironment===undefined)delete process.env.VERCEL_ENV;
 else process.env.VERCEL_ENV=oldEnvironment;
});
const makeReq=({method='GET',path='/api/support?c=rtkw&src=field',cookies='',ua='Mozilla/5.0 (synthetic test)',purpose=''}={})=>{
 const headers={'user-agent':ua,'sec-fetch-mode':'navigate','sec-fetch-dest':'document'};
 if(cookies)headers.Cookie=cookies;
 if(purpose)headers['sec-purpose']=purpose;
 return new Request('https://www.jrsstandard.com'+path,{method,headers});
};
async function run(opts={},status=201,environment='production',service='synthetic-test-service-key'){
 process.env.VERCEL_ENV=environment;
 if(service)process.env.SUPABASE_SERVICE_ROLE_KEY=service;
 else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 let calls=[];
 globalThis.fetch=async (url,init)=>{calls.push({url,init});return new Response(null,{status})};
 const response=await handler(makeReq(opts));
 return {response,calls,url:new URL(response.headers.get('location'))};
}
test('production GET accepted by storage marks count and sets one browser cookie',async()=>{
 const x=await run();
 assert.equal(x.response.status,302);
 assert.equal(x.calls.length,1);
 assert.match(x.calls[0].url,/\/rest\/v1\/interaction_events$/);
 assert.equal(x.url.pathname,'/access.html');
 assert.equal(x.url.searchParams.get('r'),'1');
 assert.equal(x.url.searchParams.get('c'),'rtkw');
 assert.match(x.response.headers.get('set-cookie'),/^jrs_e_rtkw=1;/);
 const payload=JSON.parse(x.calls[0].init.body);
 assert.equal(payload.source,'support');assert.equal(payload.type,'endorse');
 assert.equal(payload.payload.src,'field');
});
test('storage 500 never claims recorded or stores counted cookie',async()=>{
 const x=await run({},500);
 assert.equal(x.response.status,302);
 assert.equal(x.calls.length,1);
 assert.equal(x.url.searchParams.has('r'),false);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('storage 401 never claims recorded or stores counted cookie',async()=>{
 const x=await run({},401);
 assert.equal(x.response.status,302);
 assert.equal(x.calls.length,1);
 assert.equal(x.url.searchParams.has('r'),false);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('preview cannot write even if production database key is configured',async()=>{
 const x=await run({},201,'preview');
 assert.equal(x.response.status,302);
 assert.equal(x.calls.length,0);
 assert.equal(x.url.searchParams.has('r'),false);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('unknown deployment environment fails closed on writes',async()=>{
 const x=await run({},201,'');
 assert.equal(x.calls.length,0);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('HEAD request never creates historical support interaction',async()=>{
 const x=await run({method:'HEAD'});
 assert.equal(x.calls.length,0);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('POST request never creates historical support interaction',async()=>{
 const x=await run({method:'POST'});
 assert.equal(x.calls.length,0);
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('previous browser marker prevents duplicate while preserving prior-record indicator',async()=>{
 const x=await run({cookies:'a=x; jrs_e_rtkw=1'});
 assert.equal(x.calls.length,0);
 assert.equal(x.url.searchParams.get('r'),'1');
 assert.equal(x.response.headers.has('set-cookie'),false);
});
test('preview bots, prefetch and tagged smoke checks do not record',async()=>{
 for(const opts of [{ua:'Googlebot/2.1'},{purpose:'prefetch'},{path:'/api/support?c=rtkw&src=test'}]){
  const x=await run(opts);
  assert.equal(x.calls.length,0);
  assert.equal(x.response.headers.has('set-cookie'),false);
 }
});
test('missing service credential redirects without a false count',async()=>{
 const x=await run({},201,'production',null);
 assert.equal(x.calls.length,0);
 assert.equal(x.response.headers.has('set-cookie'),false);
 assert.equal(x.url.searchParams.has('r'),false);
});
