"use strict";
// Full staging composition: authenticated-session abstraction, existing
// accountant, authoritative workspace, real AES-256-GCM and revision CAS.
// All records and RPC responses are synthetic. No external fetch or owner data.
const assert=require("node:assert/strict");
const {createHash,webcrypto}=require("node:crypto");
const load=require("./incomeos-browser-script-loader.cjs");
if(typeof globalThis.crypto==="undefined")
  Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const accountantSource=readFileSync(resolve(__dirname,"../owner/incomeos/accountant.js"),"utf8");
const accountantContext={window:{},Date,Intl,Math,Number,Array,Object,Set,JSON,String,console};
runInNewContext(accountantSource,accountantContext);
globalThis.IncomeOSAccountant=accountantContext.window.IncomeOSAccountant;
const workspace=load("workspace-store.js","IncomeOSWorkspace");
load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
load("revision-store.js","IncomeOSRevisionStore");
load("revision-workspace-bridge.js","IncomeOSWorkspaceRevisionBridge");
load("revision-accounting-coordinator.js","IncomeOSRevisionAccountingCoordinator");
let remote=null,writes=0,reads=0,authenticated=false,epoch=0,timeoutAfterCommit=false;
const checksum=text=>createHash("sha256").update(text,"utf8").digest("hex");
function signIn(){authenticated=true;epoch++;}
function signOut(){authenticated=false;epoch++;}
const vault=Object.freeze({
  signedIn:()=>authenticated,
  createRevisionTransport:()=>{
    if(!authenticated)throw Error("Owner session required");
    const boundEpoch=epoch;
    const guard=()=>{if(!authenticated||boundEpoch!==epoch)throw Error("Owner session changed");};
    return Object.freeze({
      assertSession:()=>{guard();return true;},
      latest:async()=>{guard();reads++;return remote;},
      append:async request=>{
        guard();
        assert.equal(await checksum(request.encrypted_payload),request.payload_sha256);
        assert.doesNotMatch(request.encrypted_payload,/SYNTHETIC PRIVATE ACCOUNTING DESCRIPTION/);
        if(request.expected_revision!==(remote?remote.revision:0))
          throw Error("Stale workspace revision");
        remote={revision:request.expected_revision+1,ciphertext:request.encrypted_payload,
          ciphertext_sha256:request.payload_sha256};
        writes++;
        if(timeoutAfterCommit){timeoutAfterCommit=false;throw Error("Synthetic network timeout after commit");}
        return remote.revision;
      }
    });
  }
});
globalThis.IncomeOSVaultCloud=vault;
const {createAccountingRuntime}=load("revision-runtime-staging.js","IncomeOSRevisionRuntime");
const date="2026-11-08",passphrase="synthetic owner passphrase at least sixteen characters";
const expense=(id,amount)=>({id,kind:"outflow",date,label:"SYNTHETIC PRIVATE ACCOUNTING DESCRIPTION "+id,
  category:"software",type:"expense",amountUsd:amount,businessUse:null,paymentStatus:"paid",source:"synthetic"});
(async()=>{
  assert.throws(()=>createAccountingRuntime(),/staging-only/);
  assert.throws(()=>createAccountingRuntime({stagingOnly:false}),/staging-only/);
  assert.throws(()=>createAccountingRuntime({stagingOnly:true}),/Authenticated owner vault session/);
  signIn();
  const a=createAccountingRuntime({stagingOnly:true});
  assert.equal(reads,0,"Constructing runtime cannot automatically read server");
  assert.equal(writes,0,"Constructing runtime cannot write or autosave");
  const opened=await a.open(passphrase);
  assert.equal(opened.hasWorkspace,false);
  assert.equal(opened.revision,0);
  a.initializeNew(date);
  const first=expense("syn-1",22.5);
  a.replaceLedger([first],date);
  assert.equal(writes,0,"Editing in-memory ledger cannot write to server");
  assert.equal(a.status().dirty,true);
  assert.equal((await a.save(passphrase)).revision,1);
  assert.equal(writes,1);
  assert.equal((await workspace.decrypt(passphrase,remote.ciphertext)).ledger[0].id,"syn-1");
  const b=createAccountingRuntime({stagingOnly:true});
  assert.equal((await b.open(passphrase)).ledgerCount,1);
  const second=expense("syn-2",15);
  b.replaceLedger([first,second],date);
  a.replaceLedger([{...first,amountUsd:31}],date);
  assert.equal((await a.save(passphrase)).revision,2);
  await assert.rejects(b.save(passphrase),/Stale workspace revision/);
  assert.equal(b.status().needsRecovery,true);
  assert.equal(b.pendingDraft().ledger.length,2,"Uncommitted draft must survive a conflict");
  const beforeRescue=writes;
  const rescued=await b.exportPendingDraftEncrypted(passphrase);
  assert.equal(rescued.serverSaved,false);
  assert.doesNotMatch(rescued.ciphertext,/SYNTHETIC PRIVATE ACCOUNTING DESCRIPTION/);
  assert.equal((await workspace.decrypt(passphrase,rescued.ciphertext)).ledger.length,2);
  assert.equal(writes,beforeRescue,"Rescue export cannot transmit draft");
  await assert.rejects(b.open(passphrase),/Preserve or explicitly discard/);
  b.discardDraft();
  assert.equal((await b.open(passphrase)).requiresOwnerConfirmation,true);
  assert.throws(()=>b.replaceLedger([first,second],date),/Open and confirm/);
  b.confirmOpenedRevision(2);
  b.replaceLedger([{...first,amountUsd:31},second],date);
  assert.equal((await b.save(passphrase)).revision,3);
  timeoutAfterCommit=true;
  b.replaceLedger([{...first,amountUsd:45},second],date);
  await assert.rejects(b.save(passphrase),/Synthetic network timeout after commit/);
  assert.equal(b.status().needsRecovery,true,"An uncertain network result must quarantine writes");
  assert.equal(b.status().dirty,true,"Network timeout must preserve pending draft");
  const backup=await b.exportPendingDraftEncrypted(passphrase);
  assert.equal(backup.serverSaved,false);
  assert.equal((await workspace.decrypt(passphrase,backup.ciphertext)).ledger[0].amountUsd,45);
  assert.equal(writes,4,"Commit-then-timeout produced one server revision, never two");
  const c=createAccountingRuntime({stagingOnly:true});
  assert.equal((await c.open(passphrase)).revision,4);
  assert.equal(c.status().dirty,false);
  assert.equal(c.encryptedBackup().revision,4);
  assert.equal((await workspace.decrypt(passphrase,c.encryptedBackup().ciphertext)).ledger[0].amountUsd,45);
  const beforeLogoutWrites=writes;
  signOut();
  const d=createAccountingRuntime;
  assert.throws(()=>d({stagingOnly:true}),/Authenticated owner vault session/);
  assert.throws(()=>c.encryptedBackup(),/Owner session changed/,
    "Logout must revoke encrypted backup reads even if a workspace was opened");
  await assert.rejects(c.open(passphrase),/Owner session changed/);
  assert.equal(writes,beforeLogoutWrites,"A revoked session cannot write or refresh");
  assert.equal(globalThis.IncomeOSRevisionRuntime.createAccountingRuntime,createAccountingRuntime);
  console.log("PASS: staged existing accountant + AES vault + CAS revision composition, conflict rescue, timeout and logout guards; no automatic writes");
})().catch(err=>{console.error(err);process.exitCode=1;});
