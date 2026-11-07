"use strict";
const assert=require("node:assert/strict");
const protocol=require("../owner/incomeos/workspace-revision-protocol.js");
const {createRevisionStore}=require("../owner/incomeos/revision-store.js");
const envelope=JSON.stringify({format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="});
const digest="a".repeat(64);
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
  const store=createRevisionStore(transport,protocol);
  await assert.rejects(store.append(envelope,digest),/Read server revision/);
  assert.equal((await store.refresh()).revision,0);
  assert.equal((await store.append(envelope,digest)).revision,1);
  assert.equal(writes,1);
  assert.equal((await store.refresh()).revision,1);
  head={revision:2,ciphertext:envelope,ciphertext_sha256:digest};
  await assert.rejects(store.append(envelope,digest),/Stale revision/);
  assert.equal(store.currentRevision(),null);
  assert.equal((await store.refresh()).revision,2);
  const uncertain=createRevisionStore({latest:async()=>head,append:async()=>{head={revision:3,ciphertext:envelope,ciphertext_sha256:digest};throw Error("Timeout");}},protocol);
  await uncertain.refresh();
  await assert.rejects(uncertain.append(envelope,digest),/Timeout/);
  assert.equal(uncertain.currentRevision(),null);
  assert.equal((await uncertain.refresh()).revision,3);
  const rollback=createRevisionStore({latest:async()=>head,append:transport.append},protocol);
  await rollback.refresh();
  head={revision:1,ciphertext:envelope,ciphertext_sha256:digest};
  await assert.rejects(rollback.refresh(),/refuse overwrite/);
  console.log("PASS: revision adapter conflict, uncertain write, recovery rollback");
})().catch(e=>{console.error(e);process.exitCode=1;});
