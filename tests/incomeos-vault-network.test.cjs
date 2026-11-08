"use strict";
// Synthetic interrupted vault responses, including a commit whose ACK is lost.
// Timers are accelerated only in this isolated VM; no live service is contacted.
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const {webcrypto,createHash}=require("node:crypto");
const source=readFileSync(resolve(__dirname,"../owner/incomeos/vault-cloud.js"),"utf8");
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,
  cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="});
const reply=data=>({ok:true,status:200,text:async()=>JSON.stringify(data)});
(async()=>{
  let rows=[],writes=0,releaseAck,mode="ordinary",signal;
  const context={window:{crypto:webcrypto,fetch:async(url,options)=>{
    if(url.includes("/auth/v1/token"))return reply({access_token:"synthetic-token",expires_in:3600,user:{id:"synthetic-owner"}});
    signal=options.signal;
    if(options.method==="POST"){
      writes++;
      rows=[{id:writes,saved_at:"2026-11-08T12:00:00Z",...JSON.parse(options.body)}];
      if(mode==="lost-ack")return new Promise(resolve=>{releaseAck=()=>resolve(reply(null));});
      return reply(null);
    }
    if(mode==="stalled-read")return new Promise(()=>{});
    if(mode==="stalled-body")return {ok:true,status:200,text:()=>new Promise(()=>{})};
    if(mode==="malformed-read")return reply({unexpected:"not a revision list"});
    return reply(rows);
  }},JSON,Promise,TextEncoder,Error,URL,Date,AbortController,clearTimeout,
    setTimeout:(fn,ms)=>setTimeout(fn,ms===30000?20:ms)};
  runInNewContext(source,context);
  const vault=context.window.IncomeOSVaultCloud;
  await vault.signIn("owner@example.org","synthetic password 12");
  mode="lost-ack";
  await assert.rejects(vault.save(envelope),/Save outcome is uncertain/);
  assert.equal(writes,1,"Timed-out upload committed exactly once in the synthetic service");
  assert.equal(signal.aborted,true,"Deadline aborts the stalled fetch");
  assert.equal(vault.recoveryRequired(),true);
  await assert.rejects(vault.save(envelope),/Previous vault save outcome is uncertain/);
  releaseAck();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(vault.recoveryRequired(),true,"A late ACK cannot authorize another write");
  assert.equal(writes,1,"Late ACK cannot retry a save");
  mode="malformed-read";
  await assert.rejects(vault.latest(),/Invalid vault recovery response/);
  assert.equal(vault.recoveryRequired(),true,"Malformed recovery cannot clear uncertainty");
  mode="ordinary";
  const good=rows[0].sha256;
  rows[0].sha256="a".repeat(64);
  await assert.rejects(vault.latest(),/integrity check/);
  assert.equal(vault.recoveryRequired(),true,"Corrupt recovery cannot clear uncertainty");
  rows[0].sha256=good;
  assert.equal((await vault.latest()).text,envelope);
  assert.equal(vault.recoveryRequired(),false,"Only an integrity-verified new read clears this session's hold");
  assert.equal(writes,1,"Recovery is read-only");
  await vault.save(envelope);
  assert.equal(writes,2,"A subsequent write still requires an explicit save call");
  assert.equal(createHash("sha256").update(envelope).digest("hex"),rows[0].sha256);
  for(mode of ["stalled-read","stalled-body"]){
    await assert.rejects(vault.latest(),/timed out/);
    assert.equal(signal.aborted,true,"Deadline covers response headers and full body");
  }
  console.log("PASS: interrupted vault commit quarantines retries, requires verified recovery, ignores late ACK and bounds stalled bodies");
})().catch(e=>{console.error(e);process.exitCode=1;});
