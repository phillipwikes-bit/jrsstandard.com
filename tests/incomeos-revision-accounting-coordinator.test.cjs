"use strict";
// The existing accountant validator and authoritative owner workspace are used
// together with the staging revision bridge. Synthetic records and in-memory RPC.
const assert=require("node:assert/strict");
const {createHash,webcrypto}=require("node:crypto");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const load=require("./incomeos-browser-script-loader.cjs");
if(typeof globalThis.crypto==="undefined")
  Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
const accountantVm={window:{},Date,Intl,Math,Number,Array,Object,Set,JSON,String,console};
runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/accountant.js"),"utf8"),accountantVm);
const accountant=accountantVm.window.IncomeOSAccountant;
const workspace=load("workspace-store.js","IncomeOSWorkspace");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const {createWorkspaceBridge}=load("revision-workspace-bridge.js","IncomeOSWorkspaceRevisionBridge");
const {createAccountingCoordinator}=load("revision-accounting-coordinator.js","IncomeOSRevisionAccountingCoordinator");
const sha256=async value=>createHash("sha256").update(value,"utf8").digest("hex");
const integrity={sha256},passphrase="synthetic accounting test passphrase 2026";
const date="2026-11-07";
const expense=(id,amount)=>({id,kind:"outflow",date,label:"Synthetic vendor "+id,
  category:"software",type:"expense",amountUsd:amount,businessUse:null,
  paymentStatus:"paid",source:"synthetic"});
(async()=>{
  const first=expense("exp-1",25);
  const second=expense("exp-2",18);
  assert.equal(accountant.validateEntry(first),true);
  assert.equal(accountant.validateEntry(second),true);
  const pendingIncome={id:"income-1",kind:"income",date,label:"Synthetic pending research payment",
    category:"research",grossUsd:120,feesUsd:0,status:"pending",scope:"income",
    payer:"Synthetic Study",source:"synthetic"};
  assert.equal(accountant.validateEntry(pendingIncome),true);
  assert.equal(accountant.validateEntry({...pendingIncome,status:"paid"}),true);
  const empty=workspace.newWorkspace(date);
  assert.throws(()=>workspace.setLedger(empty,[first,{...first,id:" exp-1 "}],date),/unique id/,
    "Authoritative workspace must normalize duplicate ledger IDs");
  assert.equal(workspace.setLedger(empty,[{...first,id:"constructor"}],date).ledger[0].id,"constructor",
    "Inherited Object keys must not falsely collide with ledger IDs");
  assert.equal(workspace.setLedger(empty,[{...first,id:"toString"}],date).ledger[0].id,"toString");
  let remote=null,writes=0;
  const transport={
    latest:async()=>remote,
    append:async req=>{
      if(req.expected_revision!==(remote?remote.revision:0))throw Error("Stale workspace revision");
      assert.equal(await sha256(req.encrypted_payload),req.payload_sha256);
      remote={revision:req.expected_revision+1,ciphertext:req.encrypted_payload,
        ciphertext_sha256:req.payload_sha256};
      writes++;return remote.revision;
    }
  };
  function coordinator(){
    const revisions=createRevisionStore(transport,protocol,integrity);
    const bridge=createWorkspaceBridge(revisions,workspace,integrity);
    return createAccountingCoordinator(bridge,workspace,accountant);
  }
  const a=coordinator(),b=coordinator();
  await assert.rejects(a.save(passphrase),/verified unsaved accounting draft/);
  assert.deepEqual((await a.open(passphrase)).hasWorkspace,false);
  assert.throws(()=>a.encryptedBackup(),/Save or resolve/);
  assert.throws(()=>a.initializeNew("invalid"),/Valid initialization date/);
  a.initializeNew(date);
  assert.throws(()=>a.replaceLedger([first,{...first,id:" exp-1 "}],date),/Invalid or unsupported/,
    "Whitespace-equivalent identifiers cannot coexist in an authoritative ledger");
  assert.throws(()=>a.replaceLedger([{...first,amountUsd:-1}],date),/Invalid or unsupported/);
  assert.equal(a.replaceLedger([first],date).ledgerCount,1);
  assert.equal(a.status().dirty,true);
  assert.equal(a.pendingDraft().ledger.length,1);
  const beforeDraftExportWrites=writes;
  const firstRescue=await a.exportPendingDraftEncrypted(passphrase);
  assert.equal(firstRescue.encrypted,true);
  assert.equal(firstRescue.serverSaved,false);
  assert.equal(a.status().dirty,true,"Rescue export cannot mark an unsaved draft as saved");
  assert.equal(writes,beforeDraftExportWrites,"Rescue export cannot write to server");
  assert.doesNotMatch(firstRescue.ciphertext,/Synthetic vendor/);
  assert.equal((await workspace.decrypt(passphrase,firstRescue.ciphertext)).ledger[0].id,first.id);
  assert.equal((await a.save(passphrase)).revision,1);
  await assert.rejects(a.exportPendingDraftEncrypted(passphrase),/No pending accounting draft/);
  assert.equal(a.status().dirty,false);
  const backup=a.encryptedBackup();
  assert.equal(backup.revision,1);
  assert.equal(backup.sha256,await sha256(backup.ciphertext));
  assert.doesNotMatch(backup.ciphertext,/Synthetic vendor/);
  const restored=await workspace.decrypt(passphrase,backup.ciphertext);
  assert.equal(restored.ledger[0].id,first.id);

  assert.equal((await b.open(passphrase)).ledgerCount,1);
  const bDraft=[first,second];
  b.replaceLedger(bDraft,date);
  a.replaceLedger([{...first,amountUsd:30}],date);
  assert.equal((await a.save(passphrase)).revision,2);
  await assert.rejects(b.save(passphrase),/Stale workspace revision/);
  assert.equal(b.status().needsRecovery,true);
  assert.equal(b.pendingDraft().ledger.length,2,"Uncommitted edit must be preserved after conflict");
  const beforeConflictRescueWrites=writes;
  const rescue=await b.exportPendingDraftEncrypted(passphrase);
  assert.equal(rescue.serverSaved,false);
  assert.equal((await workspace.decrypt(passphrase,rescue.ciphertext)).ledger.length,2);
  assert.equal(writes,beforeConflictRescueWrites,"Conflict rescue must not append");
  assert.equal(b.status().needsRecovery,true,"Rescue cannot bypass conflict review");
  await assert.rejects(b.exportPendingDraftEncrypted("short"),/passphrase/);
  assert.equal(b.status().dirty,true,"Failed rescue must preserve the draft");
  await assert.rejects(b.open(passphrase),/Preserve or explicitly discard/);
  assert.throws(()=>b.encryptedBackup(),/Save or resolve/);
  b.discardDraft();
  const reopened=await b.open(passphrase);
  assert.equal(reopened.revision,2);
  assert.equal(reopened.requiresOwnerConfirmation,true,
    "Discarding an unsaved draft must not erase revision conflict history");
  assert.throws(()=>b.replaceLedger(bDraft,date),/Open and confirm/);
  b.confirmOpenedRevision(2);
  b.replaceLedger([{...first,amountUsd:30},second],date);
  assert.equal((await b.save(passphrase)).revision,3);
  assert.equal(writes,3);
  const latest=await workspace.decrypt(passphrase,remote.ciphertext);
  assert.equal(latest.ledger.length,2);
  assert.equal(latest.ledger[0].amountUsd,30);
  assert.equal(latest.ledger[1].id,second.id);
  assert.ok(latest.changeLog.length>=2,"Workspace change log must be retained");
  // An unpaid research claim is a real ledger record but cannot be classified
  // as a received payment simply because it is included in a server save.
  b.replaceLedger([...latest.ledger,pendingIncome],date);
  assert.equal((await b.save(passphrase)).revision,4);
  assert.equal(writes,4);
  const incomeWorkspace=await workspace.decrypt(passphrase,remote.ciphertext);
  assert.equal(incomeWorkspace.ledger.length,3);
  assert.equal(incomeWorkspace.ledger.find(e=>e.id==="income-1").status,"pending");
  assert.equal(incomeWorkspace.ledger.find(e=>e.id==="income-1").grossUsd,120);
  assert.throws(()=>b.pendingDraft(),/No pending accounting draft/);
  b.close();
  assert.equal(b.status().opened,false);
  console.log("PASS: existing accountant ledger flows through encrypted server revisions with conflict-preserved draft");
})().catch(err=>{console.error(err);process.exitCode=1;});
