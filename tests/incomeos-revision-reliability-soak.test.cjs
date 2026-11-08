"use strict";
// Deterministic revision reliability soak. Synthetic encrypted-envelope shapes
// ONLY, no real owner records, remote service, credentials, or automatic writes.
// AES encryption is independently tested in the workspace-bridge suite.
const assert=require("node:assert/strict");
const {createHash}=require("node:crypto");
const load=require("./incomeos-browser-script-loader.cjs");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const sha256=async text=>createHash("sha256").update(text,"utf8").digest("hex");
const payload=n=>JSON.stringify({
  format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",
  iterations:600000,cipher:"AES-256-GCM",
  salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",
  data:Buffer.alloc(16,1+n%254).toString("base64")
});
(async()=>{
  let remote=null,reads=0,writes=0,conflicts=0;
  let commitThenTimeout=false;
  const transport={
    latest:async()=>{reads++;return remote;},
    append:async request=>{
      if(request.expected_revision!==(remote?remote.revision:0)){
        conflicts++;throw Error("Stale revision; manual review required");
      }
      assert.equal(await sha256(request.encrypted_payload),request.payload_sha256);
      // Simulate a server-authoritative atomic compare-and-swap. An actual
      // database race is covered by the disposable PostgreSQL concurrency suite.
      if(request.expected_revision!==(remote?remote.revision:0)){
        conflicts++;throw Error("Stale revision; manual review required");
      }
      remote={revision:request.expected_revision+1,
        ciphertext:request.encrypted_payload,
        ciphertext_sha256:request.payload_sha256};
      writes++;
      if(commitThenTimeout){
        commitThenTimeout=false;
        throw Error("Unknown outcome: network timeout after commit");
      }
      return remote.revision;
    }
  };
  const a=createRevisionStore(transport,protocol,{sha256});
  const b=createRevisionStore(transport,protocol,{sha256});
  assert.equal(reads,0,"Constructing clients must not automatically fetch");
  assert.equal(writes,0,"Constructing clients must not write");
  const CYCLES=120;
  for(let i=0;i<CYCLES;i++){
    const before=writes;
    const head=remote?remote.revision:0;
    const ra=await a.refresh(),rb=await b.refresh();
    assert.equal(ra.revision,head);
    assert.equal(rb.revision,head);
    if(ra.requiresOwnerConfirmation)a.confirmRevision(head);
    if(rb.requiresOwnerConfirmation)b.confirmRevision(head);
    assert.equal(writes,before,"Reading or confirming a revision never writes");
    const encrypted=payload(i),digest=await sha256(encrypted);
    const [x,y]=await Promise.allSettled([
      a.append(encrypted,digest),
      b.append(encrypted,digest)
    ]);
    const ok=[x,y].filter(v=>v.status==="fulfilled");
    const denied=[x,y].filter(v=>v.status==="rejected");
    assert.equal(ok.length,1,"Exactly one concurrent append must succeed at revision "+head);
    assert.equal(denied.length,1,"Concurrent loser must be rejected, never merged");
    assert.match(String(denied[0].reason),/Stale revision/);
    assert.equal(remote.revision,head+1);
    assert.equal(writes,before+1,"Concurrent writers must not duplicate server writes");
    assert.equal((x.status==="fulfilled"?a:b).currentRevision(),head+1);
    assert.equal((x.status==="rejected"?a:b).currentRevision(),null,
      "Conflicted writer must be quarantined until explicitly reopened");
  }
  assert.equal(writes,CYCLES);
  assert.equal(conflicts,CYCLES);
  const stableReads=reads;
  const stableWrites=writes;
  // An idle verification call is read-only and cannot silently clear
  // the owner's review hold from a newer revision.
  for(const client of [a,b]){
    const state=await client.refresh();
    assert.equal(state.revision,CYCLES);
    if(state.requiresOwnerConfirmation){
      const again=await client.refresh();
      assert.equal(again.requiresOwnerConfirmation,true);
      client.confirmRevision(CYCLES);
    }
  }
  assert.ok(reads>=stableReads+2);
  assert.equal(writes,stableWrites);
  // If a commit reaches the server and its reply is lost, retrying without a
  // verified refresh must fail, not silently append a duplicate.
  commitThenTimeout=true;
  const next=payload(200),nextHash=await sha256(next);
  await assert.rejects(a.append(next,nextHash),/network timeout after commit/);
  assert.equal(remote.revision,CYCLES+1);
  assert.equal(writes,CYCLES+1);
  await assert.rejects(a.append(next,nextHash),/Read server revision/);
  const recovered=await a.refresh();
  assert.equal(recovered.revision,CYCLES+1);
  assert.equal(recovered.requiresOwnerConfirmation,true);
  await assert.rejects(a.append(next,nextHash),/Owner confirmation required/);
  a.confirmRevision(CYCLES+1);
  assert.equal((await a.append(payload(201),await sha256(payload(201)))).revision,CYCLES+2);
  assert.equal(writes,CYCLES+2);
  // A server may not replace ciphertext for an already trusted revision
  // with a different, internally consistent ciphertext/hash pair.
  const good=remote,forged=payload(220);
  remote={revision:good.revision,ciphertext:forged,ciphertext_sha256:await sha256(forged)};
  await assert.rejects(a.refresh(),/different ciphertext/);
  assert.equal(a.currentRevision(),null);
  remote=good;
  // A rollback to a lower revision is rejected even after a bad read.
  remote={...good,revision:good.revision-1};
  await assert.rejects(a.refresh(),/refuse overwrite/);
  assert.equal(a.currentRevision(),null);
  remote=good;
  assert.equal((await a.refresh()).revision,CYCLES+2);
  assert.equal(writes,CYCLES+2);
  console.log("PASS: 120 simultaneous-owner revision cycles, 120 denied CAS races, commit-then-timeout recovery, equivocation, rollback, no auto writes");
})().catch(err=>{console.error(err);process.exitCode=1;});
