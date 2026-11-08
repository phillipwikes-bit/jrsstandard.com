"use strict";
// Real AES-GCM workspace crypto, with synthetic in-memory RPC. No owner data or network.
const assert=require("node:assert/strict");
const {webcrypto,createHash}=require("node:crypto");
const load=require("./incomeos-browser-script-loader.cjs");
if(typeof globalThis.crypto==="undefined") Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const workspace=load("workspace-store.js","IncomeOSWorkspace");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const {createWorkspaceBridge}=load("revision-workspace-bridge.js","IncomeOSWorkspaceRevisionBridge");
const digest=async text=>createHash("sha256").update(text,"utf8").digest("hex");
const passphrase="synthetic test passphrase with 20+ characters";
(async()=>{
  let remote=null,writes=0;
  const transport={
    latest:async()=>remote,
    append:async req=>{
      if(req.expected_revision!==(remote?remote.revision:0))throw Error("Stale server revision");
      assert.match(req.encrypted_payload,/"cipher":"AES-256-GCM"/);
      assert.doesNotMatch(req.encrypted_payload,/private synthetic ledger label/);
      assert.equal(await digest(req.encrypted_payload),req.payload_sha256);
      remote={revision:req.expected_revision+1,ciphertext:req.encrypted_payload,
        ciphertext_sha256:req.payload_sha256};writes++;
      return remote.revision;
    }
  };
  const ownerA=createWorkspaceBridge(createRevisionStore(transport,protocol,{sha256:digest}),workspace,{sha256:digest});
  const ownerB=createWorkspaceBridge(createRevisionStore(transport,protocol,{sha256:digest}),workspace,{sha256:digest});
  const doc=workspace.newWorkspace("2026-11-07");
  await assert.rejects(ownerA.save(doc,passphrase),/Open and verify/);
  assert.equal((await ownerA.open(passphrase)).revision,0);
  assert.throws(()=>ownerA.encryptedBackup(),/Verified current encrypted workspace/);
  doc.note="private synthetic ledger label for test only";
  assert.equal((await ownerA.save(doc,passphrase)).revision,1);
  assert.equal(writes,1);
  const backup1=ownerA.encryptedBackup();
  assert.equal(backup1.revision,1);
  assert.equal(backup1.ciphertext,remote.ciphertext);
  assert.equal(backup1.sha256,await digest(backup1.ciphertext));
  assert.equal((await workspace.decrypt(passphrase,backup1.ciphertext)).note,doc.note);
  assert.ok(Object.isFrozen(backup1));
  assert.doesNotMatch(backup1.ciphertext,/private synthetic ledger label/);
  assert.equal((await ownerB.open(passphrase)).workspace.note,doc.note);
  const beforeWrongPassphrase=remote;
  const beforeWrongPassphraseWrites=writes;
  await assert.rejects(ownerB.save(doc,"synthetic but incorrect passphrase"),/Wrong passphrase/);
  assert.equal(writes,beforeWrongPassphraseWrites,"Wrong passphrase must not reach the server");
  assert.equal(remote,beforeWrongPassphrase,"Wrong passphrase must not replace ciphertext");
  assert.equal(ownerB.status().openedRevision,null,"Wrong passphrase must quarantine local write authorization");
  assert.equal((await ownerB.open(passphrase)).revision,1);
  const changed=structuredClone(doc);
  changed.note="second synthetic revision";
  assert.equal((await ownerA.save(changed,passphrase)).revision,2);
  await assert.rejects(ownerB.save(changed,passphrase),/Stale server revision/);
  assert.equal(ownerB.status().openedRevision,null);
  const updated=await ownerB.open(passphrase);
  assert.equal(updated.revision,2);
  assert.equal(updated.workspace.note,changed.note);
  assert.equal(updated.requiresOwnerConfirmation,true);
  assert.throws(()=>ownerB.encryptedBackup(),/Verified current encrypted workspace/);
  assert.equal((await ownerB.open(passphrase)).requiresOwnerConfirmation,true);
  await assert.rejects(ownerB.save(doc,passphrase),/Owner must review and confirm/);
  assert.throws(()=>ownerB.confirmOpenedRevision(1),/exact newer/);
  ownerB.confirmOpenedRevision(2);
  assert.equal(ownerB.encryptedBackup().revision,2);
  assert.equal((await ownerB.save(updated.workspace,passphrase)).revision,3);
  assert.equal(ownerB.encryptedBackup().sha256,remote.ciphertext_sha256);
  assert.equal(writes,3);
  const good=remote;
  remote={...good,ciphertext_sha256:"0".repeat(64)};
  await assert.rejects(ownerA.open(passphrase),/checksum mismatch/);
  assert.equal(ownerA.status().openedRevision,null);
  assert.throws(()=>ownerA.encryptedBackup(),/Verified current encrypted workspace/);
  await assert.rejects(ownerA.save(doc,passphrase),/Open and verify/);
  remote=good;
  await assert.rejects(ownerA.open("wrong synthetic passphrase"),/Wrong passphrase/);
  assert.equal(ownerA.status().openedRevision,null);
  // A vault sign-out during local AES decryption must not return even a
  // verified workspace from an in-flight revision read.
  let unlockDecrypt, signalDecrypt;
  const decryptStarted=new Promise(resolve=>{signalDecrypt=resolve;});
  const decryptBlocked=new Promise(resolve=>{unlockDecrypt=resolve;});
  let decryptAuthorized=true;
  const decryptWorkspace=Object.assign({},workspace,{
    decrypt:async(p,ciphertext)=>{
      signalDecrypt();
      await decryptBlocked;
      return workspace.decrypt(p,ciphertext);
    }
  });
  const decryptGuard=()=>{if(!decryptAuthorized)throw Error("Vault session changed");};
  const readBridge=createWorkspaceBridge(createRevisionStore(transport,protocol,{sha256:digest}),
    decryptWorkspace,{sha256:digest},decryptGuard);
  const pendingRead=readBridge.open(passphrase);
  await decryptStarted;
  decryptAuthorized=false;
  unlockDecrypt();
  await assert.rejects(pendingRead,/Vault session changed/);
  assert.equal(readBridge.status().openedRevision,null,
    "Sign-out during decryption must not authorize a recovered workspace");
  assert.throws(()=>readBridge.encryptedBackup(),/Vault session changed/);
  // A sign-out while encryption is in progress must not append ciphertext or
  // report a successful save, even when the original revision was verified.
  let unlockEncrypt,signalEncrypt;
  const encryptStarted=new Promise(resolve=>{signalEncrypt=resolve;});
  const encryptBlocked=new Promise(resolve=>{unlockEncrypt=resolve;});
  let encryptAuthorized=true;
  const encryptWorkspace=Object.assign({},workspace,{
    encrypt:async(p,document)=>{
      signalEncrypt();
      await encryptBlocked;
      return workspace.encrypt(p,document);
    }
  });
  const encryptGuard=()=>{if(!encryptAuthorized)throw Error("Vault session changed");};
  const writeBridge=createWorkspaceBridge(createRevisionStore(transport,protocol,{sha256:digest}),
    encryptWorkspace,{sha256:digest},encryptGuard);
  await writeBridge.open(passphrase);
  const writesBeforeRevocation=writes;
  const pendingWrite=writeBridge.save(doc,passphrase);
  await encryptStarted;
  encryptAuthorized=false;
  unlockEncrypt();
  await assert.rejects(pendingWrite,/Vault session changed/);
  assert.equal(writes,writesBeforeRevocation,"Logout during encryption must prevent remote append");
  assert.equal(writeBridge.status().openedRevision,null);
  ownerA.close();
  assert.equal(ownerA.status().openedRevision,null);
  assert.throws(()=>ownerA.encryptedBackup(),/Verified current encrypted workspace/);
  assert.equal(writes,3);
  console.log("PASS: encrypted workspace-to-revision bridge, verified backup, decryption, CAS and owner-review hold");
})().catch(err=>{console.error(err);process.exitCode=1;});
