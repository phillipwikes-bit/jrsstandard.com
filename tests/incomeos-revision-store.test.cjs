"use strict";
const assert=require("node:assert/strict");
const {createHash}=require("node:crypto");
const load=require("./incomeos-browser-script-loader.cjs");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="});
const sha256=async text=>createHash("sha256").update(text,"utf8").digest("hex");
const digest=createHash("sha256").update(envelope,"utf8").digest("hex");
const integrity={sha256};
(async()=>{
  let head=null, writes=0;
  const transport={
    latest:async()=>head,
    append:async req=>{
      if(req.expected_revision!==(head?head.revision:0))throw Error("Stale revision");
      head={revision:req.expected_revision+1,ciphertext:req.encrypted_payload,ciphertext_sha256:req.payload_sha256};
      writes++;return head.revision;
    }
  };
  assert.throws(()=>createRevisionStore(transport,protocol),/Independent SHA-256 verifier required/);
  const store=createRevisionStore(transport,protocol,integrity);
  await assert.rejects(store.append(envelope,digest),/Read server revision/);
  assert.equal((await store.refresh()).revision,0);
  assert.equal((await store.append(envelope,digest)).revision,1);
  assert.equal(writes,1);
  assert.equal((await store.refresh()).revision,1);
  head={revision:2,ciphertext:envelope,ciphertext_sha256:digest};
  await assert.rejects(store.append(envelope,digest),/Stale revision/);
  assert.equal(store.currentRevision(),null);
  assert.equal((await store.refresh()).revision,2);
  const review=createRevisionStore({latest:async()=>head,append:transport.append},protocol,integrity);
  await review.refresh();
  head={revision:3,ciphertext:envelope,ciphertext_sha256:digest};
  assert.equal((await review.refresh()).requiresOwnerConfirmation,true);
  assert.equal(review.requiresOwnerConfirmation(),true);
  assert.equal((await review.refresh()).requiresOwnerConfirmation,true,"Repeated read must not bypass owner confirmation");
  await assert.rejects(review.append(envelope,digest),/Owner confirmation required/);
  assert.throws(()=>review.confirmRevision(2),/confirmation mismatch/);
  review.confirmRevision(3);
  assert.equal(review.requiresOwnerConfirmation(),false);
  assert.equal((await review.append(envelope,digest)).revision,4);
  head={revision:2,ciphertext:envelope,ciphertext_sha256:digest};
  const uncertain=createRevisionStore({latest:async()=>head,append:async()=>{head={revision:3,ciphertext:envelope,ciphertext_sha256:digest};throw Error("Timeout");}},protocol,integrity);
  await uncertain.refresh();
  await assert.rejects(uncertain.append(envelope,digest),/Timeout/);
  assert.equal(uncertain.currentRevision(),null);
  assert.equal((await uncertain.refresh()).revision,3);
  assert.equal(uncertain.requiresOwnerConfirmation(),true,"Uncertain write reaching a newer revision needs owner review");
  await assert.rejects(uncertain.append(envelope,digest),/Owner confirmation required/);
  const rollback=createRevisionStore({latest:async()=>head,append:transport.append},protocol,integrity);
  await rollback.refresh();
  head={revision:1,ciphertext:envelope,ciphertext_sha256:digest};
  await assert.rejects(rollback.refresh(),/refuse overwrite/);
  assert.equal(rollback.currentRevision(),null);
  assert.equal(rollback.highestObservedRevision(),3);
  await assert.rejects(rollback.refresh(),/refuse overwrite/,"Repeated fetch must not bypass rollback hold");
  await assert.rejects(rollback.append(envelope,digest),/Read server revision/);
  const plaintext=createRevisionStore({latest:async()=>({revision:1,ciphertext:JSON.stringify({ledger:[]}),ciphertext_sha256:digest}),append:transport.append},protocol,integrity);
  await assert.rejects(plaintext.refresh(),/Unsupported encrypted workspace/);
  assert.equal(plaintext.currentRevision(),null,"Unencrypted response must not be accepted as a trusted revision");
  const malformedEnvelope=createRevisionStore({latest:async()=>({revision:1,ciphertext:JSON.stringify({...JSON.parse(envelope),ledger:[]}),ciphertext_sha256:digest}),append:transport.append},protocol,integrity);
  await assert.rejects(malformedEnvelope.refresh(),/Unsupported encrypted workspace/);
  assert.equal(malformedEnvelope.currentRevision(),null);
  const corrupt=createRevisionStore({latest:async()=>({revision:1,ciphertext:envelope,ciphertext_sha256:"invalid"}),append:transport.append},protocol,integrity);
  await assert.rejects(corrupt.refresh(),/Invalid server revision/);
  assert.equal(corrupt.currentRevision(),null);
  const tampered=createRevisionStore({latest:async()=>({revision:1,ciphertext:envelope,ciphertext_sha256:"b".repeat(64)}),append:transport.append},protocol,integrity);
  await assert.rejects(tampered.refresh(),/checksum mismatch/);
  assert.equal(tampered.currentRevision(),null);
  const untrusted=createRevisionStore({latest:async()=>null,append:async()=>{throw Error("Must not write invalid digest");}},protocol,integrity);
  await untrusted.refresh();
  await assert.rejects(untrusted.append(envelope,"b".repeat(64)),/checksum mismatch/);
  assert.equal(untrusted.currentRevision(),null);
  // A server must not substitute a different encrypted payload at a revision
  // already observed as trusted, even when the replacement checksum is valid.
  let equivocated={revision:5,ciphertext:envelope,ciphertext_sha256:digest};
  const sameRevision=createRevisionStore({
    latest:async()=>equivocated,append:async()=>{throw Error("No writes expected");}
  },protocol,integrity);
  assert.equal((await sameRevision.refresh()).revision,5);
  assert.equal((await sameRevision.refresh()).revision,5,"Unchanged revision is safe to reread");
  const alternateEnvelope=JSON.stringify({...JSON.parse(envelope),data:"AQEBAQEBAQEBAQEBAQEBAQ=="});
  equivocated={revision:5,ciphertext:alternateEnvelope,
    ciphertext_sha256:createHash("sha256").update(alternateEnvelope,"utf8").digest("hex")};
  await assert.rejects(sameRevision.refresh(),/different ciphertext/);
  assert.equal(sameRevision.currentRevision(),null,"Substitution must quarantine trusted revision");
  await assert.rejects(sameRevision.refresh(),/different ciphertext/,
    "Retrying must not bypass same-revision substitution detection");
  // Empty workspaces also have a stable, normalized digest representation.
  const neverWritten=createRevisionStore({latest:async()=>null,append:transport.append},protocol,integrity);
  assert.equal((await neverWritten.refresh()).revision,0);
  assert.equal((await neverWritten.refresh()).revision,0);
  console.log("PASS: revision adapter conflict, integrity, equivocation, uncertain write, recovery rollback");
})().catch(e=>{console.error(e);process.exitCode=1;});
