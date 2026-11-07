"use strict";
// Synthetic end-to-end client/RPC seam. No Supabase credentials or external requests.
const assert=require("node:assert/strict");
const {createHash}=require("node:crypto");
const load=require("./incomeos-browser-script-loader.cjs");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const {createTransport}=load("revision-supabase-transport.js","IncomeOSSupabaseRevisionTransport");
const envelope=JSON.stringify({
  format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,
  cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",
  iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="
});
const digest=text=>createHash("sha256").update(text,"utf8").digest("hex");
(async()=>{
  let signedIn=true;
  let head=null;
  let reads=0,writes=0;
  const calls=[];
  const transport=createTransport({
    url:"https://synthetic.supabase.co",
    key:"test-public-key",
    getToken:async()=>signedIn?"synthetic-owner-token":null,
    fetch:async(url,opts)=>{
      calls.push({url,opts});
      assert.equal(opts.credentials,"omit");
      assert.equal(opts.cache,"no-store");
      assert.equal(opts.headers.Authorization,"Bearer synthetic-owner-token");
      const reply=(payload,status=200)=>({ok:status>=200&&status<300,status,json:async()=>payload});
      if(url.endsWith("incomeos_latest_workspace_revision")){
        reads++;return reply(head);
      }
      if(url.endsWith("incomeos_append_workspace_revision")){
        const body=JSON.parse(opts.body);
        assert.deepEqual(Object.keys(body).sort(),["encrypted_payload","expected_revision","payload_sha256"]);
        if(body.expected_revision!==(head?head.revision:0))return reply({message:"stale"},409);
        assert.equal(digest(body.encrypted_payload),body.payload_sha256);
        head={revision:body.expected_revision+1,ciphertext:body.encrypted_payload,ciphertext_sha256:body.payload_sha256};
        writes++;return reply(head.revision);
      }
      throw Error("Unexpected RPC path");
    }
  });
  const store=createRevisionStore(transport,protocol,{sha256:async text=>digest(text)});
  await assert.rejects(store.append(envelope,digest(envelope)),/Read server revision/);
  assert.equal(calls.length,0);
  assert.equal((await store.refresh()).revision,0);
  assert.equal((await store.append(envelope,digest(envelope))).revision,1);
  assert.equal(writes,1);
  const callsBeforeBadWrite=calls.length;
  await assert.rejects(store.append(envelope,"a".repeat(64)),/checksum mismatch/);
  assert.equal(calls.length,callsBeforeBadWrite,"Checksum mismatch must not reach transport");
  assert.equal(store.currentRevision(),null);
  assert.equal((await store.refresh()).revision,1);

  // Another client advances the server, then this stale client tries to save.
  head={revision:2,ciphertext:envelope,ciphertext_sha256:digest(envelope)};
  await assert.rejects(store.append(envelope,digest(envelope)),/HTTP 409/);
  assert.equal(store.currentRevision(),null);
  assert.equal((await store.refresh()).requiresOwnerConfirmation,true);
  await assert.rejects(store.append(envelope,digest(envelope)),/Owner confirmation required/);
  store.confirmRevision(2);
  assert.equal((await store.append(envelope,digest(envelope))).revision,3);

  head={revision:4,ciphertext:envelope,ciphertext_sha256:"b".repeat(64)};
  await assert.rejects(store.refresh(),/checksum mismatch/);
  assert.equal(store.currentRevision(),null);
  signedIn=false;
  const beforeUnsigned=calls.length;
  await assert.rejects(store.refresh(),/Owner session required/);
  assert.equal(calls.length,beforeUnsigned,"Unsigned reads must not reach transport");
  assert.ok(reads>=3&&writes===2);
  console.log("PASS: synthetic Supabase RPC seam enforces SHA-256, CAS, owner confirmation and token gate");
})().catch(e=>{console.error(e);process.exitCode=1;});
