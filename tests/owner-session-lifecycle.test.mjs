// Owner-session authentication contract. Synthetic credentials and fabricated cookies only.
// Does not access the database, production Vercel, private contact records or real secrets.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerAccess,createOwnerCookie,ownerSecretMatches} from '../api/_owner-auth.js';
import session from '../api/owner-session.js';

const OWNER_URL='https://www.jrsstandard.com/api/owner-session';
const SYNTHETIC_SECRET='synthetic_owner_login_fixture_ONLY_2026_10_31_123456789';
const ROTATED_SECRET='rotated_synthetic_owner_fixture_ONLY_2026_10_31_987654321';
const savedToken=process.env.OWNER_DASHBOARD_TOKEN;
const originalDateNow=Date.now;
const originalFetch=globalThis.fetch;
let fetchCalls=0;
globalThis.fetch=async()=>{fetchCalls++;throw Error('Synthetic owner auth may not perform a network request');};

test.after(()=>{
  Date.now=originalDateNow;globalThis.fetch=originalFetch;
  if(savedToken===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
  else process.env.OWNER_DASHBOARD_TOKEN=savedToken;
});
const configured=()=>{process.env.OWNER_DASHBOARD_TOKEN=SYNTHETIC_SECRET;};
const ownerReq=({cookie='',authorization=''}={})=>{
 const headers={};
 if(cookie)headers.cookie=cookie;
 if(authorization)headers.authorization=authorization;
 return new Request(OWNER_URL,{headers});
};
const tokenPost=async ({origin='https://www.jrsstandard.com',secret=SYNTHETIC_SECRET,contentType='application/json'}={})=>{
 const headers={'Content-Type':contentType};
 if(origin!==null)headers.Origin=origin;
 return session(new Request(OWNER_URL,{method:'POST',headers,body:JSON.stringify({token:secret})}));
};
const valueFromSetCookie=s=>(s||'').split(';')[0];
const assertPrivate=res=>{
 assert.match(res.headers.get('cache-control')||'',/no-store/);
 assert.match(res.headers.get('x-robots-tag')||'',/noindex/);
 assert.equal(res.headers.get('referrer-policy'),'no-referrer');
};
test('unset server secret denies GET with 503, before any remote read',async()=>{
 delete process.env.OWNER_DASHBOARD_TOKEN;
 const res=await session(ownerReq());
 assert.equal(res.status,503);assert.deepEqual(await res.json(),{error:'owner_access_unavailable'});
 assertPrivate(res);assert.equal(fetchCalls,0);
});
test('undersized server secret denies signed owner access',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN='too_short';
 const res=await session(ownerReq({authorization:'Bearer too_short'}));
 assert.equal(res.status,503);assertPrivate(res);
});
test('configured owner endpoint denies unsigned GET',async()=>{
 configured();
 const res=await session(ownerReq());
 assert.equal(res.status,401);assertPrivate(res);
});
test('correct bearer owner secret passes while incorrect value fails',async()=>{
 configured();
 assert.equal(await ownerAccess(ownerReq({authorization:'Bearer '+SYNTHETIC_SECRET})),null);
 const denied=await ownerAccess(ownerReq({authorization:'Bearer '+ROTATED_SECRET}));
 assert.equal(denied.status,401);assertPrivate(denied);
});
test('owner login requires exact same origin, JSON and correct token',async()=>{
 configured();
 assert.equal((await tokenPost({origin:null})).status,403);
 assert.equal((await tokenPost({origin:'https://another.example'})).status,403);
 assert.equal((await tokenPost({contentType:'text/plain'})).status,415);
 assert.equal((await tokenPost({secret:ROTATED_SECRET})).status,401);
 const res=await tokenPost();
 assert.equal(res.status,200);
 assert.equal((await res.json()).authenticated,true);
 assertPrivate(res);
 const cookie=res.headers.get('set-cookie')||'';
 assert.match(cookie,/^__Host-jrs-owner=v1\./);
 assert.match(cookie,/; HttpOnly; Secure; SameSite=Strict/);
 assert.match(cookie,/; Max-Age=28800/);
});
test('valid signed owner cookie permits GET on current configured secret',async()=>{
 configured();
 const cookie=valueFromSetCookie((await tokenPost()).headers.get('set-cookie'));
 const res=await session(ownerReq({cookie}));
 assert.equal(res.status,200);
 assert.equal((await res.json()).authenticated,true);
 assertPrivate(res);
 assert.equal(res.headers.has('set-cookie'),false);
});
test('tampered owner signature or payload is rejected',async()=>{
 configured();
 const cookie=valueFromSetCookie(await createOwnerCookie());
 const [name,...components]=cookie.split('=');
 const original=components.join('=');
 const [version,expiry,nonce,signature]=original.split('.');
 const replacement=signature.at(-1)==='A'?'B':'A';
 const tampered=name+'='+[version,expiry,nonce,signature.slice(0,-1)+replacement].join('.');
 const r=await session(ownerReq({cookie:tampered}));
 assert.equal(r.status,401);assertPrivate(r);
});
test('owner cookies expire by server time; no renewal without authentication',async()=>{
 configured();
 const start=Date.now();
 const cookie=valueFromSetCookie(await createOwnerCookie());
 try {
   Date.now=()=>start+8*60*60*1000+1000;
   const res=await session(ownerReq({cookie}));
   assert.equal(res.status,401);assertPrivate(res);
 } finally {Date.now=originalDateNow}
});
test('rotating the master owner secret invalidates all older signed cookies',async()=>{
 configured();
 const cookie=valueFromSetCookie(await createOwnerCookie());
 process.env.OWNER_DASHBOARD_TOKEN=ROTATED_SECRET;
 const res=await session(ownerReq({cookie}));
 assert.equal(res.status,401);assertPrivate(res);
 assert.equal(await ownerSecretMatches(SYNTHETIC_SECRET),false);
});
test('DELETE clears the browser cookie with secure flags; cleared browser GET denied',async()=>{
 configured();
 const res=await session(new Request(OWNER_URL,{method:'DELETE'}));
 assert.equal(res.status,200);
 assert.equal((await res.json()).signed_out,true);
 assertPrivate(res);
 assert.match(res.headers.get('set-cookie')||'',/^__Host-jrs-owner=; Path=\/; Max-Age=0; HttpOnly; Secure; SameSite=Strict/);
 const after=await session(ownerReq({cookie:'__Host-jrs-owner='}));
 assert.equal(after.status,401);
});
test('KNOWN LIMITATION: captured cookie remains server-valid after browser sign-out',async()=>{
 configured();
 const stolenCookie=valueFromSetCookie(await createOwnerCookie());
 const signout=await session(new Request(OWNER_URL,{method:'DELETE',headers:{Cookie:stolenCookie}}));
 assert.equal(signout.status,200);
 const replay=await session(ownerReq({cookie:stolenCookie}));
 // This is an observed control gap, NOT acceptance of per-session revocation.
 // Stateless HMAC cookies remain valid until expiry or master-secret rotation.
 assert.equal(replay.status,200);
 assert.equal((await replay.json()).authenticated,true);
});
test('invalid POST bodies do not yield signed cookies',async()=>{
 configured();
 const invalid=[
  new Request(OWNER_URL,{method:'POST',headers:{Origin:'https://www.jrsstandard.com','Content-Type':'application/json'},body:'not-json'}),
  new Request(OWNER_URL,{method:'POST',headers:{Origin:'https://www.jrsstandard.com','Content-Type':'application/json'},body:JSON.stringify({token:SYNTHETIC_SECRET+'x'.repeat(1201)})})
 ];
 for(const req of invalid){
  const res=await session(req);
  assert([400,413].includes(res.status));
  assertPrivate(res);
  assert.equal(res.headers.has('set-cookie'),false);
 }
});
test('no test accessed external sources',()=>assert.equal(fetchCalls,0));
