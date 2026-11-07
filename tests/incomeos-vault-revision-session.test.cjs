"use strict";
// Isolated owner authentication binding test. No real Supabase requests or credentials.
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const {webcrypto}=require("node:crypto");
const directory=resolve(__dirname,"../owner/incomeos");
const read=name=>readFileSync(resolve(directory,name),"utf8");
(async()=>{
  const calls=[];
  let tokenNumber=0,delayNext=false,releaseDelayed=null;
  const reply=(body,status=200)=>({
    ok:status>=200&&status<300,status,
    text:async()=>JSON.stringify(body),
    json:async()=>body
  });
  async function fakeFetch(url,options){
    calls.push({url,headers:options.headers,credentials:options.credentials});
    if(url.includes("/auth/v1/token?")){
      tokenNumber++;
      const body=JSON.parse(options.body);
      assert.match(body.email,/@example\.org$/);
      return reply({access_token:"synthetic-owner-token-"+tokenNumber,
        user:{id:"synthetic-owner-"+tokenNumber,email:body.email}});
    }
    if(url.includes("/rest/v1/rpc/incomeos_")){
      assert.equal(options.credentials,"omit");
      assert.equal(options.cache,"no-store");
      assert.match(options.headers.Authorization,/^Bearer synthetic-owner-token-/);
      if(delayNext){
        delayNext=false;
        return new Promise(resolve=>{releaseDelayed=()=>resolve(reply(null));});
      }
      return reply(url.includes("latest_workspace_revision")?null:1);
    }
    throw Error("Unexpected request "+url);
  }
  const context={window:{crypto:webcrypto,fetch:fakeFetch},JSON,Promise,TextEncoder,Error,URL};
  runInNewContext(read("revision-supabase-transport.js"),context);
  runInNewContext(read("vault-cloud.js"),context);
  const vault=context.window.IncomeOSVaultCloud;
  assert.ok(vault);
  assert.equal(vault.access_token,undefined,"No token getter may be exposed");
  assert.throws(()=>vault.createRevisionTransport(),/Sign in/);
  await vault.signIn("owner@example.org","a synthetic password 12");
  const first=vault.createRevisionTransport();
  assert.equal(await first.latest(),null);
  assert.equal(await first.append({expected_revision:0,encrypted_payload:"synthetic",payload_sha256:"a".repeat(64)}),1);
  assert.ok(Object.isFrozen(first));
  delayNext=true;
  const pending=first.latest();
  for(let i=0;i<20&&releaseDelayed===null;i++)await Promise.resolve();
  assert.equal(typeof releaseDelayed,"function","Expected an in-flight authenticated revision read");
  vault.signOut();
  releaseDelayed();
  await assert.rejects(pending,/Vault session changed/);
  await assert.rejects(first.latest(),/Vault session changed/);
  await vault.signIn("owner@example.org","a synthetic password 12");
  await assert.rejects(first.latest(),/Vault session changed/,"Previous session must never be reused after reauthentication");
  const second=vault.createRevisionTransport();
  assert.equal(await second.latest(),null);
  assert.equal(tokenNumber,2);
  assert.ok(calls.some(x=>x.url.endsWith("/rest/v1/rpc/incomeos_latest_workspace_revision")));
  assert.ok(calls.some(x=>x.url.endsWith("/rest/v1/rpc/incomeos_append_workspace_revision")));
  console.log("PASS: staged RPC transport is bound to owner vault session and rejects sign-out races");
})().catch(err=>{console.error(err);process.exitCode=1;});
