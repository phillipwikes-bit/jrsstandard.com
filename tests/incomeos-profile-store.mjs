// IncomeOS secure profile: client behaviour against a SIMULATED backend, plus static
// checks of the RLS migration. This does NOT prove database security; the real-database
// checks live in scripts/incomeos/verify-profile-rls.mjs and need the private project.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
const ctx={window:{},URL,JSON,Date};vm.runInNewContext(read("owner/incomeos/profile-store.js"),ctx);
const PS=ctx.window.IncomeOSProfileStore;
// ---- static checks on the migration ----
const sql=read("owner/incomeos/OWNER-PROFILE-SCHEMA.sql");
assert.match(sql,/Not applied to any database/);
assert.match(sql,/force row level security/);
assert.match(sql,/revoke all on table incomeos_private\.application_profile from PUBLIC, anon, authenticated/);
assert.doesNotMatch(sql,/grant[^;]*to anon/i,"no anon grants");
for(const op of ["select","insert","update","delete"])assert.match(sql,new RegExp('for '+op+' to authenticated[\\s\\S]{0,200}owner_id = \\(select auth\\.uid\\(\\)\\) and \\(select incomeos_private\\.is_allowed_owner\\(\\)\\)'),op+" policy requires own row and enrolled owner");
assert.doesNotMatch(sql,/insert into incomeos_private\.allowed_owners/i,"never seeds an identity");
assert.match(sql,/disable new user sign-ups/);
// ---- client source rules ----
const src=read("owner/incomeos/profile-store.js");
assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.cookie/,"session never persisted in browser storage");
assert.doesNotMatch(src,/console\.(log|info|debug)/,"no logging of profile content");
assert.doesNotMatch(src,/service_role|sk_live|eyJ[a-zA-Z0-9]{20,}/,"no secrets in source");
assert.match(src,/create_user:false/,"sign-in never creates accounts");
// ---- unconfigured: keeps session-only behaviour ----
const off=PS.create(null);assert.equal(off.configured,false);
await assert.rejects(off.load(),e=>e.code==="BACKEND_NOT_CONFIGURED");
// ---- simulated backend with row-level ownership semantics ----
const OWNER="owner-uid",OTHER="other-uid";let rows={},now=Date.parse("2026-11-03T12:00:00Z");const calls=[];
const tokens={"tok-owner":OWNER,"tok-other":OTHER};const enrolled=new Set([OWNER]);
async function fakeFetch(url,opt){
  calls.push({url,opt});const u=new URL(url),h=opt.headers,uid=tokens[(h.Authorization||"").replace("Bearer ","")];
  const reply=(status,body)=>({status,text:async()=>body===undefined?"":JSON.stringify(body)});
  if(u.pathname==="/auth/v1/otp"){const b=JSON.parse(opt.body);return b.create_user===false?reply(200,{}):reply(400,{});}
  if(u.pathname==="/auth/v1/verify"){const b=JSON.parse(opt.body);const id=b.email==="owner@example.org"?OWNER:OTHER;return b.token==="123456"?reply(200,{access_token:id===OWNER?"tok-owner":"tok-other",expires_at:Math.floor(now/1000)+3600,user:{id}}):reply(401,{});}
  if(!uid)return reply(401,{message:"JWT required"});
  const visible=uid&&enrolled.has(uid)&&rows[uid]?[rows[uid]]:[];
  if(opt.method==="GET")return reply(200,visible);
  if(opt.method==="POST"){const b=JSON.parse(opt.body);if(b.owner_id!==uid||!enrolled.has(uid))return reply(403,{});rows[uid]={...b,updated_at:"2026-11-03T12:00:01Z"};return reply(201,[rows[uid]]);}
  if(opt.method==="DELETE"){if(!enrolled.has(uid))return reply(200,[]);const had=rows[uid]?[rows[uid]]:[];delete rows[uid];return reply(200,had);}
}
const cfg={url:"https://private-project.example.supabase.co",publishableKey:"sb_publishable_SYNTHETIC_ONLY_0123456789"};
const store=PS.create(cfg,{fetch:fakeFetch,now:()=>now});
// Not signed in: no read or write.
await assert.rejects(store.load(),e=>e.code==="NOT_SIGNED_IN");
await assert.rejects(store.save({fullName:"A",applicationEmail:"a@example.org"}),e=>e.code==="NOT_SIGNED_IN");
// Sign-in never creates users; wrong code refused.
await store.requestCode("owner@example.org");
assert.equal(JSON.parse(calls.at(-1).opt.body).create_user,false);
await assert.rejects(store.verifyCode("owner@example.org","000000"),e=>e.code==="SESSION_EXPIRED");
await store.verifyCode("owner@example.org","123456");assert.equal(store.signedIn(),true);
// Validation before any request.
const before=calls.length;
await assert.rejects(store.save({fullName:"",applicationEmail:"x"}),e=>e.code==="INVALID_PROFILE");
await assert.rejects(store.save({fullName:"SYN",applicationEmail:"syn@example.org",linkedinUrl:"http://linkedin.com/in/x"}),e=>/LinkedIn/.test(e.message));
assert.equal(calls.length,before,"invalid input never sent");
// Save, confirmed by the returned row; load returns it.
const saved=await store.save({fullName:"SYN Owner",applicationEmail:"apply@example.org",qualifications:"MS (SYN)\nEEO certification (SYN)",linkedinUrl:"https://www.linkedin.com/in/syn-owner"});
assert.equal(saved.fullName,"SYN Owner");assert.deepEqual(JSON.parse(JSON.stringify(saved.qualifications)),["MS (SYN)","EEO certification (SYN)"]);
assert.equal((await store.load()).applicationEmail,"apply@example.org");
const post=calls.find(c=>c.opt.method==="POST"&&c.url.includes("/rest/v1/"));
assert.equal(JSON.parse(post.opt.body).owner_id,OWNER);assert.equal(post.opt.credentials,"omit");assert.equal(post.opt.redirect,"error");
// Another signed-in user sees nothing and cannot write.
const other=PS.create(cfg,{fetch:fakeFetch,now:()=>now});await other.verifyCode("other@example.org","123456");
assert.equal(await other.load(),null);
await assert.rejects(other.save({fullName:"X",applicationEmail:"x@example.org"}),e=>e.code==="FORBIDDEN");
// Expired session: explicit message, nothing sent.
now+=3601*1000;const n=calls.length;
await assert.rejects(store.save({fullName:"SYN",applicationEmail:"apply@example.org"}),e=>e.code==="SESSION_EXPIRED"&&/nothing was saved/.test(e.message));
assert.equal(calls.length,n);assert.equal(store.signedIn(),false);
// Failed save (network) is reported, not assumed successful.
const flaky=PS.create(cfg,{fetch:async(u,o)=>{if(o.method==="POST"&&u.includes("/rest/"))throw new Error("offline");return fakeFetch(u,o);},now:()=>now});
await flaky.verifyCode("owner@example.org","123456");
await assert.rejects(flaky.save({fullName:"SYN",applicationEmail:"apply@example.org"}),e=>e.code==="NETWORK"&&/Nothing was changed/.test(e.message));
// Delete removes the row and is confirmed by a re-read.
assert.equal((await flaky.remove()).deleted,1);assert.equal(await flaky.load(),null);assert.equal(rows[OWNER],undefined);
console.log("IncomeOS secure profile QA passed (SIMULATED backend + migration static checks): unconfigured fallback, no account creation, own-row only, validation, confirmed save, expired session, failed save, confirmed delete. Real-database RLS not yet verified.");
