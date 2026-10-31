import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerAccess,ownerSecretMatches,createOwnerCookie} from '../api/_owner-auth.js';
import session from '../api/owner-session.js';
import progress from '../api/owner-progress.js';
import leads from '../api/leads-4b7e2c9af106d385.js';
import people from '../api/people-9dd1ecdf6f8cdfd4.js';
import roster from '../api/roster-8c3f1a9e7b2d6045.js';
import recheck from '../api/recheck-answers-b1a768e88d3e48bd.js';
import geo from '../api/geo-4e8b2d7f9a1c3065.js';
import variance from '../api/variance-6b1d90fa2c47e8b3.js';
const old={};
for(const key of ['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY']){old[key]=process.env[key];delete process.env[key];}
const fetchBefore=globalThis.fetch;
const SECRET='an-offline-synthetic-owner-access-token-that-is-long-and-private';
let n=0;
function req(endpoint='leads-4b7e2c9af106d385',headers={}){
 return new Request('https://www.jrsstandard.com/api/'+endpoint,{headers});
}
async function check(name,func){await func();console.log('PASS '+name);n++;}
try{
 await check('missing owner configuration fails closed',async()=>assert.equal((await ownerAccess(req())).status,503));
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 await check('missing cookie rejected',async()=>assert.equal((await ownerAccess(req())).status,401));
 await check('invalid bearer rejected',async()=>assert.equal((await ownerAccess(req('any',{Authorization:'Bearer incorrect'}))).status,401));
 await check('master bearer refused for private data routes; POST-only exchange retained',async()=>{
  assert.equal(await ownerSecretMatches(SECRET),true);
  assert.equal((await ownerAccess(req('any',{Authorization:'Bearer '+SECRET}))).status,401);
  assert.equal(await ownerSecretMatches(SECRET+'extra'),false);
 });
 const cookie=await createOwnerCookie();
 const value=cookie.split(';')[0];
 await check('cookie is secure, HttpOnly and same-site',async()=>{
   for(const word of ['__Host-jrs-owner=','Path=/','HttpOnly','Secure','SameSite=Strict','Max-Age=28800'])assert.ok(cookie.includes(word));
   assert.ok(!cookie.includes(SECRET));
 });
 await check('valid signed cookie accepted',async()=>assert.equal(await ownerAccess(req('any',{Cookie:value})),null));
 await check('tampering invalidates cookie',async()=>{
   const changed=value.slice(0,-1)+(value.endsWith('A')?'B':'A');
   assert.equal((await ownerAccess(req('any',{Cookie:changed}))).status,401);
 });
 await check('GET session verifies owner cookie',async()=>{
   const r=await session(new Request('https://www.jrsstandard.com/api/owner-session',{headers:{Cookie:value}}));
   assert.equal(r.status,200);
   assert.deepEqual(await r.json(),{authenticated:true});
 });
 await check('POST owner sign-in sets session cookie',async()=>{
   const r=await session(new Request('https://www.jrsstandard.com/api/owner-session',{
     method:'POST',headers:{origin:'https://www.jrsstandard.com','content-type':'application/json'},
     body:JSON.stringify({token:SECRET})
   }));
   assert.equal(r.status,200);
   assert.ok((r.headers.get('set-cookie')||'').includes('HttpOnly'));
 });
 await check('cross-origin owner login rejected',async()=>{
   const r=await session(new Request('https://www.jrsstandard.com/api/owner-session',{
     method:'POST',headers:{origin:'https://unrelated.example','content-type':'application/json'},body:JSON.stringify({token:SECRET})
   }));
   assert.equal(r.status,403);
 });
 await check('logout only clears browser cookie; server revocation is not claimed',async()=>{
   const r=await session(new Request('https://www.jrsstandard.com/api/owner-session',{
     method:'DELETE',headers:{Origin:'https://www.jrsstandard.com'}
   }));
   assert.equal(r.status,200);
   assert.ok((r.headers.get('set-cookie')||'').includes('Max-Age=0'));
   assert.equal((await r.json()).server_session_revoked,false);
 });
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('No unauthenticated fetch allowed')};
 await check('all private readers reject anonymous access before storage',async()=>{
   const handlers=[
     ['leads',leads],['people',people],['roster',roster],
     ['recheck',recheck],['geo',geo],['variance',variance],
     ['progress',progress]
   ];
   for(const [name,handler] of handlers){
     const r=await handler(req(name));
     assert.equal(r.status,401,name);
   }
   assert.equal(calls,0);
 });
 await check('owner progress reader blocks invalid view',async()=>{
  const r=await progress(req('owner-progress?view=unknown',{Cookie:value}));
  assert.equal(r.status,400);
 });
 await check('owner progress refuses missing server storage config',async()=>{
  const r=await progress(req('owner-progress?view=pilot',{Cookie:value}));
  assert.equal(r.status,503);
 });
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-private-database-key';
 globalThis.fetch=async(url,opts)=>{calls++;
   if(!String(url).includes('/rest/v1/pilot_progress'))throw Error('Unexpected table '+url);
   return Response.json([{code:'TEST',name:'Synthetic',total_reads:1}]);
 };
 await check('authenticated progress is proxied and uses private server key',async()=>{
  const r=await progress(req('owner-progress?view=pilot',{Cookie:value}));
  assert.equal(r.status,200);
  const rows=await r.json();assert.equal(rows[0].name,'Synthetic');
 });
 await check('dashboard no longer makes client database requests',async()=>{
  const d=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  assert.ok(!d.includes('/rest/v1/'));
  assert.ok(!d.includes('sb_publishable_'));
  for(const p of ['pilot','armb','realcase'])assert.ok(d.includes('/api/owner-progress?view='+p));
  assert.ok(d.includes('/api/owner-session'));
  assert.ok(d.includes('owner-signout'));
  assert.ok(!d.includes('googletagmanager.com/gtag/js'));
 });
 console.log('PASS '+n+' owner authentication checks');
}finally{
 globalThis.fetch=fetchBefore;
 for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
