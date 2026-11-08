"use strict";
// Expiry and revocation during local crypto and delayed HTTP responses.
// Synthetic identity, clock and service only. No real account or network.
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const {webcrypto}=require("node:crypto");
const source=readFileSync(resolve(__dirname,"../owner/incomeos/vault-cloud.js"),"utf8");
const transportSource=readFileSync(resolve(__dirname,"../owner/incomeos/revision-supabase-transport.js"),"utf8");
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,
  cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="});
const reply=(data,status=200)=>({ok:status<300,status,text:async()=>JSON.stringify(data),json:async()=>data});
function fixture(){
  let now=1800000000000,calls=0,expires={expires_in:60},responseStatus=200,onRead=null,onDigest=null;
  const pass={value:"synthetic passphrase"};
  const context={window:{
    document:{getElementById:()=>pass},
    crypto:{subtle:{digest:async(...args)=>{if(onDigest)onDigest();return webcrypto.subtle.digest(...args);}}},
    fetch:async(url)=>{
      calls++;
      if(url.includes("/auth/v1/token"))return reply({access_token:"synthetic-token",user:{id:"synthetic-owner"},...expires});
      if(onRead)await onRead();
      if(responseStatus!==200)return reply({message:"SYNTHETIC-SECRET-DO-NOT-ECHO"},responseStatus);
      return reply(url.includes("/rpc/")?null:[]);
    }
  },Date:{now:()=>now},JSON,Promise,TextEncoder,Error,URL,setTimeout,clearTimeout,AbortController};
  runInNewContext(transportSource,context);runInNewContext(source,context);
  return {vault:context.window.IncomeOSVaultCloud,pass,
    login:()=>context.window.IncomeOSVaultCloud.signIn("owner@example.org","synthetic password 12"),
    advance:ms=>{now+=ms;},setExpiry:x=>{expires=x;},setStatus:s=>{responseStatus=s;},
    onRead:fn=>{onRead=fn;},onDigest:fn=>{onDigest=fn;},calls:()=>calls,now:()=>now};
}
(async()=>{
  for(const expires of [{},{expires_in:0},{expires_in:-1},{expires_in:"60"},{expires_at:1}]){
    const f=fixture();f.setExpiry(expires);
    await assert.rejects(f.login(),/valid session expiry/);
    assert.equal(f.vault.signedIn(),false,"Malformed expiry cannot create an indefinite session");
  }
  const f=fixture();
  f.setExpiry({expires_in:60,expires_at:f.now()/1000+10});
  await f.login();
  const revision=f.vault.createRevisionTransport();
  f.advance(10000);
  const before=f.calls();
  assert.equal(f.vault.signedIn(),false,"The earlier absolute expiry governs");
  assert.equal(f.pass.value,"","Expiry clears the entered workspace passphrase");
  await assert.rejects(f.vault.latest(),/Sign in/);
  assert.throws(()=>revision.assertSession(),/session changed/);
  assert.equal(f.calls(),before,"Expired sessions cannot initiate a vault request");
  f.setExpiry({expires_in:60});
  await f.login();
  assert.throws(()=>revision.assertSession(),/session changed/,"Login cannot revive the earlier transport");

  const inFlight=fixture();await inFlight.login();
  inFlight.onRead(async()=>inFlight.advance(60000));
  await assert.rejects(inFlight.vault.latest(),/session changed/);
  assert.equal(inFlight.vault.signedIn(),false,"Expiry during HTTP body processing revokes session");

  const hashing=fixture();await hashing.login();
  hashing.onDigest(()=>hashing.advance(60000));
  const beforeHash=hashing.calls();
  await assert.rejects(hashing.vault.save(envelope),/session changed/);
  assert.equal(hashing.calls(),beforeHash,"Expiry during SHA-256 prevents encrypted upload");

  for(const rpc of [false,true]){
    const denied=fixture();await denied.login();denied.setStatus(401);
    const op=rpc?denied.vault.createRevisionTransport().latest():denied.vault.latest();
    await assert.rejects(op,e=>/expired or was rejected/.test(e.message)&&!e.message.includes("SYNTHETIC-SECRET"));
    assert.equal(denied.vault.signedIn(),false,"Server 401 revokes both vault and revision authority");
  }
  const broken=fixture();await broken.login();broken.setStatus(500);
  await assert.rejects(broken.vault.latest(),e=>/HTTP 500/.test(e.message)&&!e.message.includes("SYNTHETIC-SECRET"));
  console.log("PASS: finite vault expiry, in-flight expiry, 401 revocation, no stale crypto upload and no reflected server secrets");
})().catch(e=>{console.error(e);process.exitCode=1;});
