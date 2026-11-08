// Private vault client against a fake Supabase. SYNTHETIC DATA ONLY; this does not contact the real project.
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import vm from "node:vm";
import {webcrypto,createHash} from "node:crypto";
const dir=new URL("../owner/incomeos/",import.meta.url);
const src=readFileSync(new URL("vault-cloud.js",dir),"utf8");
const ORIGIN="https://pmvqxdgvnwhckzxojioa.supabase.co";
// Guards: no browser storage; one allowed outside origin, used by this module only; CSP allows exactly that origin.
assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.cookie/,"tokens stay in page memory");
assert.match(src,/credentials:"omit"/);
for(const f of readdirSync(dir).filter(f=>f.endsWith(".js")&&f!=="vault-cloud.js"))
  assert.doesNotMatch(readFileSync(new URL(f,dir),"utf8"),/supabase\.co/,f+" must not contact the vault directly");
const csp=s=>(s.match(/connect-src ([^;"]+)/)||[])[1];
assert.equal(csp(readFileSync(new URL("vercel.json",dir),"utf8")),"'self' "+ORIGIN,"hosted CSP allows only self and the vault");
assert.equal(csp(readFileSync(new URL("index.html",dir),"utf8")),"'self' "+ORIGIN,"page CSP allows only self and the vault");
assert.doesNotMatch(src,/service_role|sb_secret_/,"no secret key in the client");
{const html=readFileSync(new URL("index.html",dir),"utf8"),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);assert.deepEqual(dup,[],"every id on the page is unique");}

// Fake Supabase.
const calls=[];let rows=[];let owner=true;
async function fakeFetch(url,opt){
  calls.push({url,opt});const u=new URL(url);assert.equal(u.origin,ORIGIN);assert.equal(opt.headers.apikey.startsWith("sb_publishable_"),true);
  const ok=(d,s=200)=>({ok:s<300,status:s,text:async()=>JSON.stringify(d)});
  if(u.pathname==="/auth/v1/token"){const b=JSON.parse(opt.body);return b.password==="right password 12"?ok({access_token:"tok-1",user:{id:"u-1",email:b.email}}):ok({error_description:"Invalid login credentials"},400);}
  if(u.pathname==="/auth/v1/signup")return ok({id:"u-1"});
  if(u.pathname==="/rest/v1/incomeos_vault"){
    if(opt.method!=="POST")assert.equal(u.searchParams.get("order"),"saved_at.desc,id.desc","latest recovery must break same-timestamp ties by immutable id");
    assert.equal(opt.headers.Authorization,"Bearer tok-1");
    if(!owner)return opt.method==="POST"?ok({message:"new row violates row-level security policy"},403):ok([]);
    if(opt.method==="POST"){rows.unshift({id:rows.length+1,...JSON.parse(opt.body),saved_at:"2026-11-05T12:00:00Z"});return ok("",201);}
    return ok(rows.slice(0,1));}
  return ok({},404);
}
const ctx={window:{crypto:webcrypto,fetch:fakeFetch},TextEncoder,JSON,URL,Promise,Error,setTimeout};
vm.runInNewContext(src,ctx);const V=ctx.window.IncomeOSVaultCloud;
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"ZW5jcnlwdGVkLWJ5dGVz"});
const plain=JSON.stringify({schema:"incomeos.workspace.v1",ledger:[{label:"Synthetic salary"}]});
// Unencrypted or altered envelopes are refused before any request.
for(const bad of [plain,JSON.stringify({...JSON.parse(envelope),ledger:[]}),JSON.stringify({...JSON.parse(envelope),data:"not base64!"}),"nonsense"])
  assert.throws(()=>V.assertEncrypted(bad),/encrypted workspace/);
await assert.rejects(V.save(plain),/encrypted workspace/);
await assert.rejects(V.save(envelope),/Sign in/);
assert.equal(calls.length,0,"nothing was sent");
// Sign-in.
await assert.rejects(V.signIn("owner@example.org","short"),/12 characters/);
await assert.rejects(V.signIn("owner@example.org","wrong password 1"),/Invalid login credentials/);
assert.equal(V.signedIn(),false);
await V.signIn("owner@example.org","right password 12");assert.equal(V.signedIn(),true);
// Reauthentication failure must revoke the prior in-memory session.
await assert.rejects(V.signIn("owner@example.org","wrong password 1"),/Invalid login credentials/);
assert.equal(V.signedIn(),false,"failed reauthentication must not preserve the previous token");
await assert.rejects(V.latest(),/Sign in/);
await V.signIn("owner@example.org","right password 12");
assert.equal(V.signedIn(),true);
// A delayed authentication response must never reopen a session after explicit sign-out.
let releaseLogin;
const delayedFetch=(url,opt)=>url.includes("/auth/v1/token")?
  new Promise(resolve=>{releaseLogin=()=>resolve({ok:true,status:200,text:async()=>JSON.stringify({access_token:"delayed-token",user:{id:"u-1",email:"owner@example.org"}})});}):
  fakeFetch(url,opt);
const delayedCtx={window:{crypto:webcrypto,fetch:delayedFetch},TextEncoder,JSON,URL,Promise,Error,setTimeout};
vm.runInNewContext(src,delayedCtx);
const delayedVault=delayedCtx.window.IncomeOSVaultCloud;
const pendingLogin=delayedVault.signIn("owner@example.org","right password 12");
delayedVault.signOut();
releaseLogin();
await assert.rejects(pendingLogin,/cancelled/);
assert.equal(delayedVault.signedIn(),false,"sign-out cannot be reversed by delayed authentication");
// A vault read already in flight must not expose data after sign-out.
let releaseRead;
const delayedReadFetch=(url,opt)=>url.includes("/rest/v1/incomeos_vault")?
  new Promise(resolve=>{releaseRead=()=>resolve({ok:true,status:200,text:async()=>JSON.stringify([{id:9,ciphertext:envelope,sha256:createHash("sha256").update(envelope).digest("hex"),saved_at:"2026-11-06T00:00:00Z"}])});}):
  fakeFetch(url,opt);
const readCtx={window:{crypto:webcrypto,fetch:delayedReadFetch},TextEncoder,JSON,URL,Promise,Error,setTimeout};
vm.runInNewContext(src,readCtx);
const readVault=readCtx.window.IncomeOSVaultCloud;
await readVault.signIn("owner@example.org","right password 12");
const pendingRead=readVault.latest();
readVault.signOut();
releaseRead();
await assert.rejects(pendingRead,/session changed/);
assert.equal(readVault.signedIn(),false);
// A save already in flight must not report success after the owner signs out.
let releaseSave;
const delayedSaveFetch=(url,opt)=>url.includes("/rest/v1/incomeos_vault")&&opt.method==="POST"?
  new Promise(resolve=>{releaseSave=()=>resolve({ok:true,status:201,text:async()=>""});}):
  fakeFetch(url,opt);
const saveCtx={window:{crypto:webcrypto,fetch:delayedSaveFetch},TextEncoder,JSON,URL,Promise,Error,setTimeout};
vm.runInNewContext(src,saveCtx);
const saveVault=saveCtx.window.IncomeOSVaultCloud;
await saveVault.signIn("owner@example.org","right password 12");
const pendingSave=saveVault.save(envelope);
// SHA-256 is asynchronous, so wait until the mocked authenticated POST starts.
for(let i=0;i<100&&!releaseSave;i++)await new Promise(resolve=>setTimeout(resolve,1));
assert.equal(typeof releaseSave,"function","encrypted save must reach the mocked vault");
saveVault.signOut();
releaseSave();
await assert.rejects(pendingSave,/session changed/);
assert.equal(saveVault.signedIn(),false,"late save response cannot reinstate authentication");
// Save sends only the envelope, its format tag and hash.
await V.save(envelope);
const post=calls.find(c=>c.opt.method==="POST"&&c.url.endsWith("/rest/v1/incomeos_vault"));
const body=JSON.parse(post.opt.body);
assert.deepEqual(Object.keys(body).sort(),["ciphertext","format","sha256"]);
assert.equal(body.ciphertext,envelope);assert.equal(body.format,"incomeos-workspace-encrypted-v1");
assert.equal(body.sha256,createHash("sha256").update(envelope).digest("hex"));
for(const c of calls)assert.doesNotMatch(String(c.opt.body||""),/Synthetic salary/);
// Restore returns the latest copy after its integrity check; a tampered copy is refused.
assert.equal((await V.latest()).text,envelope);
rows[0].ciphertext=envelope.replace("ZW5j","ZW5k");
await assert.rejects(V.latest(),/integrity check/);
// A signed-in account that is not the allow-listed owner gets a refusal, not data.
rows=[];owner=false;
assert.equal(await V.latest(),null);
await assert.rejects(V.save(envelope),/row-level security/);
V.signOut();assert.equal(V.signedIn(),false);
await assert.rejects(V.latest(),/Sign in/);
console.log("IncomeOS vault client checks passed: encrypted envelopes only, nothing sent before sign-in, hash-checked restore, non-owner refused, tokens in memory, CSP allows only the vault origin.");
