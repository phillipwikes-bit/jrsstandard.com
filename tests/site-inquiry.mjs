import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import inquiry from '../api/site-inquiry.js';
import settings from '../api/site-inquiry-config.js';

const original={};
for(const key of ['SUPABASE_SERVICE_ROLE_KEY','TURNSTILE_SECRET_KEY','TURNSTILE_SITE_KEY','JRS_TURNSTILE_HOSTNAME']){
  original[key]=process.env[key];delete process.env[key];
}
const oldFetch=globalThis.fetch;
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name)}
const address='https://www.jrsstandard.com/api/site-inquiry';
const defaultBody={
  name:'Synthetic Contact', email:'contact@example.test',
  organization:'Example Org',category:'research',
  message:'This is a synthetic research inquiry for the website.',
  consent:true,company_website:'',turnstileToken:'synthetic-pass'
};
function make(body=defaultBody,origin='https://www.jrsstandard.com'){
 return new Request(address,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
}
try{
 await test('configuration disabled without secrets',async()=>{
   const v=await settings(new Request('https://www.jrsstandard.com/api/site-inquiry-config'));
   assert.deepEqual(await v.json(),{enabled:false,site_key:null});
 });
 await test('method must be POST',async()=>assert.equal((await inquiry(new Request(address))).status,405));
 await test('origin enforced before DB',async()=>assert.equal((await inquiry(make(defaultBody,'https://malicious.example'))).status,403));
 await test('unconfigured bot protection fails closed',async()=>assert.equal((await inquiry(make())).status,503));
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service-key';
 process.env.TURNSTILE_SECRET_KEY='synthetic-bot-secret';
 process.env.TURNSTILE_SITE_KEY='synthetic-public-site-key';
 await test('settings exposes only public key',async()=>{
   const v=await settings(new Request('https://www.jrsstandard.com/api/site-inquiry-config'));
   const data=await v.json();
   assert.equal(data.enabled,true);assert.equal(data.site_key,'synthetic-public-site-key');
   assert.ok(!JSON.stringify(data).includes('synthetic-bot-secret'));
 });
 await test('bad inputs fail without network',async()=>{
   for(const bad of [
     {...defaultBody,category:'random'},
     {...defaultBody,message:'too short'},
     {...defaultBody,consent:false},
     {...defaultBody,email:'not-an-email'},
     {...defaultBody,name:''},
     {...defaultBody,turnstileToken:''}
   ])assert.equal((await inquiry(make(bad))).status,400);
 });
 await test('honeypot is never persisted',async()=>{
   const data=await(await inquiry(make({...defaultBody,company_website:'fake.biz'}))).json();
   assert.equal(data.stored,false);
 });
 let calls=[];
 globalThis.fetch=async (url,opts)=>{
   calls.push({url:String(url),opts});
   if(String(url).includes('siteverify'))return Response.json({success:false,hostname:'www.jrsstandard.com'});
   throw Error('Unexpected upstream call '+url);
 };
 await test('rejected challenge does not access database',async()=>{
   const result=await inquiry(make());assert.equal(result.status,403);
   assert.equal(calls.length,1);assert.ok(calls[0].url.includes('siteverify'));
 });
 calls=[];
 globalThis.fetch=async(url,opts)=>{
   calls.push({url:String(url),opts});
   if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'not-your-site.example'});
   throw Error('unexpected storage');
 };
 await test('host mismatch refuses storage',async()=>{
   const result=await inquiry(make());assert.equal(result.status,403);
   assert.equal(calls.length,1);
 });
 calls=[];
 globalThis.fetch=async(url,opts)=>{
   calls.push({url:String(url),opts});
   if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'www.jrsstandard.com'});
   if(String(url).includes('/pilot_contacts'))return new Response(null,{status:201});
   throw Error('unknown call');
 };
 await test('verified inquiry is stored before notification',async()=>{
   const response=await inquiry(make());
   const json=await response.json();
   assert.equal(response.status,200);assert.equal(json.ok,true);assert.equal(json.stored,true);
   assert.equal(json.alerted,false); // Existing notifier disabled until separate PR/provider.
   assert.equal(calls.length,2);
   assert.ok(calls[0].url.includes('siteverify'));
   assert.ok(calls[1].url.includes('/pilot_contacts'));
   const stored=JSON.parse(calls[1].opts.body);
   assert.equal(stored.source,'site-inquiry');
   const message=JSON.parse(stored.message);
   assert.equal(message.category,'research');
   assert.equal(message.consent_to_contact,true);
   assert.equal(message.consent_version,'contact-v1-2026-10-30');
   assert.equal(message.consent_to_transfer,false);
   assert.equal(message.software_access_requested,false);
   assert.ok(!stored.message.includes('synthetic-pass'));
   assert.ok(!stored.message.includes('synthetic-bot-secret'));
 });
 calls=[];
 globalThis.fetch=async(url,opts)=>{
   calls.push({url:String(url),opts});
   if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'www.jrsstandard.com'});
   if(String(url).includes('/pilot_contacts'))return new Response('denied',{status:503});
   throw Error('unknown call');
 };
 await test('database failure cannot report success',async()=>{
   const response=await inquiry(make());
   assert.equal(response.status,502);
   assert.equal((await response.json()).error,'storage_unavailable');
 });
 await test('inbox source/labels include website inquiries',async()=>{
   const leads=readFileSync(new URL('../api/leads-4b7e2c9af106d385.js',import.meta.url),'utf8');
   const people=readFileSync(new URL('../api/people-9dd1ecdf6f8cdfd4.js',import.meta.url),'utf8');
   assert.ok(leads.includes("'site-inquiry'"));
   assert.ok(people.includes("'site-inquiry'"));
 });
 await test('front-end and CSP require challenge service',async()=>{
   const html=readFileSync(new URL('../contact.html',import.meta.url),'utf8');
   const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
   assert.ok(html.includes("fetch('/api/site-inquiry'"));
   assert.ok(html.includes("fetch('/api/site-inquiry-config'"));
   assert.ok(html.includes('name="consent"'));
   assert.ok(html.includes('name="category"'));
   assert.ok(html.includes('not yet been confirmed as operational'));
   const csp=vercel.headers.flatMap(o=>o.headers||[]).find(h=>h.key==='Content-Security-Policy')?.value||'';
   assert.ok(csp.includes('https://challenges.cloudflare.com'));
 });
 console.log('PASS '+passed+' site-inquiry tests');
} finally{
 globalThis.fetch=oldFetch;
 for(const [key,value] of Object.entries(original)){
   if(value===undefined)delete process.env[key];else process.env[key]=value;
 }
}
