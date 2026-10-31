import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/support-join.js';
import {readFileSync} from 'node:fs';

const originalFetch=globalThis.fetch;
const originalService=process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalEnv=process.env.VERCEL_ENV;
test.after(()=>{
 globalThis.fetch=originalFetch;
 if(originalService===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 else process.env.SUPABASE_SERVICE_ROLE_KEY=originalService;
 if(originalEnv===undefined)delete process.env.VERCEL_ENV;
 else process.env.VERCEL_ENV=originalEnv;
});
const HOST='https://www.jrsstandard.com';
const details={name:'Synthetic Participant',organization:'Synthetic Organization',
 email:'synthetic@example.test',campaign:'rtkw',source:'supported-page',
 consent_contact:true,consent_public_list:false};
async function invoke({method='POST',origin=HOST,crossSite=false,body=details,
 contentType='application/json',environment='production',service='synthetic-test-service',
 dbStatus=201,throwFetch=false}={}){
 process.env.VERCEL_ENV=environment;
 if(service)process.env.SUPABASE_SERVICE_ROLE_KEY=service;
 else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 const calls=[];
 globalThis.fetch=async(url,init)=>{
  calls.push({url,init});
  if(throwFetch)throw Error('SENSITIVE SAMPLE ERROR: token/PII');
  return new Response('SENSITIVE SAMPLE ERROR: token/PII',{status:dbStatus});
 };
 const headers={};
 if(origin!==null)headers.Origin=origin;
 if(contentType)headers['Content-Type']=contentType;
 if(crossSite)headers['Sec-Fetch-Site']='cross-site';
 const init={method,headers};
 if(method==='POST')init.body=typeof body==='string'?body:JSON.stringify(body);
 const res=await handler(new Request(HOST+'/api/support-join',init));
 return {res,data:await res.json(),calls};
}
const assertPrivate=res=>{
 assert.equal(res.headers.get('access-control-allow-origin'),null);
 assert.match(res.headers.get('cache-control')||'',/no-store/);
 assert.match(res.headers.get('x-robots-tag')||'',/noindex/);
 assert.equal(res.headers.get('referrer-policy'),'no-referrer');
};
test('GET cannot disclose service-key state or register anyone',async()=>{
 const x=await invoke({method:'GET'});
 assert.equal(x.res.status,405);
 assert.deepEqual(x.data,{error:'method_not_allowed'});
 assertPrivate(x.res);assert.equal(x.calls.length,0);
});
test('OPTIONS cannot create permissive wildcard CORS for private registry',async()=>{
 const x=await invoke({method:'OPTIONS'});
 assert.equal(x.res.status,405);assertPrivate(x.res);
 assert.equal(x.calls.length,0);
});
test('missing or external Origin and cross-site metadata refuse before DB',async()=>{
 for(const p of [{origin:null},{origin:'https://other.example'},{crossSite:true}]){
  const x=await invoke(p);assert.equal(x.res.status,403);
  assert.deepEqual(x.data,{error:'origin_not_allowed'});
  assert.equal(x.calls.length,0);assertPrivate(x.res);
 }
});
test('preview with inherited production key never creates registry row',async()=>{
 const x=await invoke({environment:'preview'});
 assert.equal(x.res.status,503);assert.deepEqual(x.data,{error:'preview_only',recorded:false});
 assert.equal(x.calls.length,0);assertPrivate(x.res);
});
test('unset environment cannot silently write',async()=>{
 const x=await invoke({environment:''});
 assert.equal(x.res.status,503);assert.equal(x.calls.length,0);
});
test('missing service configuration returns 503 no fake success',async()=>{
 const x=await invoke({service:null});
 assert.equal(x.res.status,503);assert.equal(x.data.error,'storage_unavailable');
 assert.equal(x.calls.length,0);
});
test('incorrect content type and oversized request cannot be stored',async()=>{
 const type=await invoke({contentType:'text/plain'});
 assert.equal(type.res.status,415);assert.equal(type.calls.length,0);
 const oversized=await invoke({body:JSON.stringify({...details,extra:'a'.repeat(4500)})});
 assert.equal(oversized.res.status,413);assert.equal(oversized.calls.length,0);
});
test('invalid JSON or wrong top-level type refused',async()=>{
 for(const body of ['{bad',null,[],42]){
  const x=await invoke({body:body==='{bad'?body:body});
  assert([400,413].includes(x.res.status));assert.equal(x.calls.length,0);
 }
});
test('name and affirmative contact consent required',async()=>{
 for(const body of [{...details,name:''},{...details,consent_contact:false},
                    {...details,consent_contact:null},{...details,name:{x:1}}]){
  const x=await invoke({body});assert.equal(x.res.status,400);
  assert.equal(x.calls.length,0);
 }
});
test('field-length/consent types cannot be silently truncated or coerced',async()=>{
 for(const body of [{...details,name:'a'.repeat(201)},
  {...details,consent_public_list:'true'}, {...details,email:'not-an-email'}]){
  const x=await invoke({body});assert.equal(x.res.status,400);
  assert.equal(x.calls.length,0);
 }
});
test('unlisted entry stays private even if client forges transfer and listing flags',async()=>{
 const x=await invoke({body:{...details,consent_transfer:true,consent_listed:true,
  consent_public_list:false}});
 assert.equal(x.res.status,200);
 assert.deepEqual(x.data,{ok:true,recorded:true});assertPrivate(x.res);
 assert.equal(x.calls.length,1);
 const row=JSON.parse(x.calls[0].init.body),payload=JSON.parse(row.message);
 assert.equal(row.name,details.name);assert.equal(row.organization,details.organization);
 assert.equal(row.source,'support');assert.equal(payload.campaign,'rtkw');
 assert.equal(payload.consent_contact,true);
 assert.equal(payload.consent_transfer,false);
 assert.equal(payload.consent_listed,false);
 assert.equal(payload.consent_public_list,false);
 assert.equal(payload.page_source,'supported-page');
 assert(!JSON.stringify(x.data).includes(details.email));
});
test('public listing must be separately affirmed; transfer still false',async()=>{
 const x=await invoke({body:{...details,consent_public_list:true,consent_transfer:true}});
 assert.equal(x.res.status,200);assert.equal(x.calls.length,1);
 const row=JSON.parse(x.calls[0].init.body),payload=JSON.parse(row.message);
 assert.equal(payload.consent_public_list,true);
 assert.equal(payload.consent_listed,true);
 assert.equal(payload.consent_transfer,false);
});
test('DB rejection does not leak raw error, PII, credential or indicate a new entry',async()=>{
 const x=await invoke({dbStatus:500});
 assert.equal(x.res.status,502);assert.deepEqual(x.data,{error:'storage_unavailable'});
 assertPrivate(x.res);assert.equal(x.calls.length,1);
 for(const forbidden of ['SENSITIVE','Synthetic Participant','synthetic@example.test','synthetic-test-service']){
  assert.equal(JSON.stringify(x.data).includes(forbidden),false);
 }
});
test('network exception fails closed without leaking upstream diagnostics',async()=>{
 const x=await invoke({throwFetch:true});
 assert.equal(x.res.status,502);assert.deepEqual(x.data,{error:'storage_unavailable'});
 assertPrivate(x.res);
});
test('static registry page never claims an unverified click or asks for real case upload',()=>{
 const src=readFileSync(new URL('../supported.html',import.meta.url),'utf8');
 assert(!src.includes('Your support is counted'));
 assert(!src.includes('Paste up to twenty five of your own records'));
 assert(!src.includes('consent_transfer:true'));
 assert(!src.includes('href="/api/support?'));
 assert(src.includes('id="support-status"'));
 assert(src.includes('consent_transfer:false'));
 assert(src.includes('result.recorded')||src.includes('x.d.recorded===true'));
 assert(src.includes('Preview mode: no registry entry was recorded.'));
});
