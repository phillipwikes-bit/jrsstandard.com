"use strict";
// Public vault API races, independent of the browser button interlocks.
// Synthetic identity and service only. No credentials or owner records.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const {webcrypto}=require("node:crypto");
const source=readFileSync(resolve(__dirname,"../owner/incomeos/vault-cloud.js"),"utf8");
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,
  cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="});
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
const reply=data=>({ok:true,status:200,text:async()=>JSON.stringify(data)});
async function rejectsOverlap(operation){
  let timer;
  try{
    await assert.rejects(Promise.race([operation,new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error("Overlapping operation was not rejected")),100);
    })]),/Vault operation already in progress/);
  }finally{clearTimeout(timer);}
}
async function fixture(){
  let writes=0,reads=0,hashGate=null,writeGate=null,readGate=null,rejectWrite=false,rows=[];
  const context={window:{crypto:{subtle:{digest:async(...args)=>{
    if(hashGate)await hashGate.promise;
    return webcrypto.subtle.digest(...args);
  }}},fetch:async(url,options)=>{
    if(url.includes("/auth/v1/token"))return reply({access_token:"synthetic-token",expires_in:3600,user:{id:"synthetic-owner"}});
    if(options.method==="POST"){
      writes++;
      rows=[{id:writes,saved_at:"2026-11-08T12:00:00Z",...JSON.parse(options.body)}];
      if(writeGate)await writeGate.promise;
      if(rejectWrite)throw Error("synthetic lost acknowledgement");
      return reply(null);
    }
    reads++;
    if(readGate)await readGate.promise;
    return reply(rows);
  }},JSON,Promise,TextEncoder,Error,URL,Date,AbortController,setTimeout,clearTimeout};
  runInNewContext(source,context);
  const vault=context.window.IncomeOSVaultCloud;
  await vault.signIn("owner@example.org","synthetic password 12");
  return {vault,writes:()=>writes,reads:()=>reads,
    pauseHash:()=>hashGate=deferred(),pauseWrite:()=>writeGate=deferred(),pauseRead:()=>readGate=deferred(),
    rejectWrite:()=>{rejectWrite=true;}};
}
test("vault API excludes a second save before hashing yields",async()=>{
  const f=await fixture(),gate=f.pauseHash();
  const saving=f.vault.save(envelope);
  try{
    await rejectsOverlap(f.vault.save(envelope));
    assert.equal(f.writes(),0,"Neither snapshot reaches HTTP before its digest completes");
  }finally{gate.resolve();await saving;}
  assert.equal(f.writes(),1,"Overlapping explicit calls cannot append duplicate snapshots");
});
test("recovery read cannot overtake an in-flight upload",async()=>{
  const f=await fixture(),gate=f.pauseWrite();
  const saving=f.vault.save(envelope);
  try{
    await rejectsOverlap(f.vault.latest());
    assert.equal(f.reads(),0);
  }finally{gate.resolve();await saving;}
  assert.equal((await f.vault.latest()).text,envelope,"Successful save releases API lock");
});
test("save and second recovery are excluded while recovery is pending",async()=>{
  const f=await fixture(),gate=f.pauseRead();
  const reading=f.vault.latest();
  try{
    await rejectsOverlap(f.vault.save(envelope));
    await rejectsOverlap(f.vault.latest());
    assert.equal(f.writes(),0);
  }finally{gate.resolve();await reading;}
  assert.equal(await f.vault.latest(),null,"Empty verified recovery releases API lock");
});
test("failed upload releases operation lock but retains recovery quarantine",async()=>{
  const f=await fixture();f.rejectWrite();
  await assert.rejects(f.vault.save(envelope),/Save outcome is uncertain/);
  await assert.rejects(f.vault.save(envelope),/Previous vault save outcome is uncertain/);
  assert.equal(f.writes(),1,"API lock failure cannot become a blind retry");
  assert.equal((await f.vault.latest()).text,envelope);
  assert.equal(f.vault.recoveryRequired(),false);
  assert.equal(f.writes(),1,"Verified recovery performs no write");
});
