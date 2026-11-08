"use strict";
// Restoring old accounting rows must append against the current server head,
// never roll back programme/history, bypass review, or create a network write.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {createHash,webcrypto}=require("node:crypto");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const load=require("./incomeos-browser-script-loader.cjs");
if(typeof globalThis.crypto==="undefined")Object.defineProperty(globalThis,"crypto",{value:webcrypto,configurable:true});
const context={window:{},Date,Intl,Math,Number,Array,Object,Set,JSON,String,console};
runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/accountant.js"),"utf8"),context);
const accountant=context.window.IncomeOSAccountant;
const workspace=load("workspace-store.js","IncomeOSWorkspace");
const dsProgram=load("ds-program.js","IncomeOSDSProgram");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const {createWorkspaceBridge}=load("revision-workspace-bridge.js","IncomeOSWorkspaceRevisionBridge");
const {createAccountingCoordinator}=load("revision-accounting-coordinator.js","IncomeOSRevisionAccountingCoordinator");
const sha256=async text=>createHash("sha256").update(text,"utf8").digest("hex");
const passphrase="synthetic recovery passphrase 2026",date="2026-11-08";
const expense=amount=>({id:"synthetic-expense",kind:"outflow",date,label:"Synthetic recovery vendor",
  category:"software",type:"expense",amountUsd:amount,businessUse:null,paymentStatus:"paid",source:"synthetic"});
async function fixture(){
  let writes=0,reads=0,active=true,pausedDecrypt=null;
  let document=workspace.setLedger(workspace.newWorkspace(date),[expense(10)],date);
  document=workspace.setDsProgram(document,dsProgram.newProgram(date),date);
  document=workspace.setResearchProgress(document,"synthetic-study","Reviewing",date);
  const ciphertext=await workspace.encrypt(passphrase,document);
  let remote={revision:1,ciphertext,ciphertext_sha256:await sha256(ciphertext)};
  const transport={latest:async()=>{reads++;return remote;},append:async req=>{
    if(req.expected_revision!==remote.revision)throw Error("Stale workspace revision");
    writes++;remote={revision:remote.revision+1,ciphertext:req.encrypted_payload,ciphertext_sha256:req.payload_sha256};
    return remote.revision;
  }};
  const owner=()=>{if(!active)throw Error("Owner session changed");};
  const ws={...workspace,decrypt:async(...args)=>{
    if(pausedDecrypt)await pausedDecrypt;
    return workspace.decrypt(...args);
  }};
  const coordinator=()=>createAccountingCoordinator(createWorkspaceBridge(
    createRevisionStore(transport,protocol,{sha256}),ws,{sha256},owner),ws,accountant);
  const a=coordinator();await a.open(passphrase);
  return {a,coordinator,backup:a.encryptedBackup(),writes:()=>writes,reads:()=>reads,
    remote:()=>remote,signOut:()=>{active=false;},pauseDecrypt:()=>{
      let release;pausedDecrypt=new Promise(resolve=>{release=resolve;});return release;
    }};
}
test("old encrypted ledger backup becomes an explicit new revision with current history and programme",async()=>{
  const f=await fixture();
  const current=f.a.workspaceSnapshot();
  current.ledger[0].amountUsd=999;
  assert.equal(f.a.workspaceSnapshot().ledger[0].amountUsd,10,"Snapshots cannot mutate the coordinator");
  const programme=dsProgram.add(f.a.workspaceSnapshot().dsProgram,"tasks",{
    id:"T-SYN-REVISION",title:"Synthetic shared revision programme task",module:"engineering"
  },date);
  assert.equal(f.a.updateProgram(programme,date).serverSaved,false);
  assert.equal(f.writes(),0,"Programme edits cannot autosave financial records");
  f.a.replaceLedger([expense(25)],date);await f.a.save(passphrase);
  const before=f.a.workspaceSnapshot(),writes=f.writes(),reads=f.reads();
  const oldDocument=await workspace.decrypt(passphrase,f.backup.ciphertext);
  oldDocument.dsProgram.title="Synthetic older programme title";
  oldDocument.researchProgress={};oldDocument.changeLog=[];
  const oldCiphertext=await workspace.encrypt(passphrase,oldDocument);
  const olderBackup={revision:1,ciphertext:oldCiphertext,sha256:await sha256(oldCiphertext)};
  const restored=await f.a.restoreLedgerBackup(olderBackup,passphrase,date);
  assert.equal(restored.serverSaved,false);
  assert.equal(restored.unsaved,true);
  assert.equal(f.writes(),writes);assert.equal(f.reads(),reads,"Restoration performs no server request");
  const pending=f.a.pendingDraft();
  assert.equal(pending.ledger[0].amountUsd,10);
  assert.deepEqual(pending.changeLog.slice(0,before.changeLog.length),before.changeLog);
  assert.deepEqual(pending.researchProgress,before.researchProgress);
  assert.deepEqual(pending.dsProgram,before.dsProgram);
  assert.notEqual(pending.dsProgram.title,oldDocument.dsProgram.title,
    "Restoring accounting rows cannot replace the current Decision Spellchecker programme");
  assert.deepEqual(pending.changeLog.at(-1),{on:date,action:"LEDGER_BACKUP_RESTORED",
    detail:{sourceRevision:1,sourceSha256:olderBackup.sha256,ledgerRows:1}});
  assert.equal((await f.a.save(passphrase)).revision,3,"Restore appends against revision 2, never rolls it back");
  assert.equal((await workspace.decrypt(passphrase,f.remote().ciphertext)).ledger[0].amountUsd,10);
  assert.ok((await workspace.decrypt(passphrase,f.remote().ciphertext)).dsProgram.tasks.some(t=>t.id==="T-SYN-REVISION"),
    "Programme management changes survive ledger restoration in the same encrypted revision");
});
test("programme edits retain the existing gate validator and cannot bypass session or revision holds",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const invalid=JSON.parse(JSON.stringify(before.dsProgram));
  invalid.gates[0].approval={by:"OWNER"};
  assert.throws(()=>f.a.updateProgram(invalid,date),/approval lacks/);
  assert.equal(f.a.status().dirty,false);
  assert.deepEqual(f.a.workspaceSnapshot(),before);
  const other=f.coordinator();await other.open(passphrase);
  other.replaceLedger([expense(30)],date);await other.save(passphrase);
  assert.equal((await f.a.open(passphrase)).requiresOwnerConfirmation,true);
  assert.throws(()=>f.a.updateProgram(before.dsProgram,date),/Open and confirm/);
  f.a.confirmOpenedRevision(2);
  assert.equal(f.a.updateProgram(before.dsProgram,date).unsaved,true);
  f.signOut();
  assert.throws(()=>f.a.updateProgram(before.dsProgram,date),/Owner session changed/);
  assert.equal(f.writes(),1,"Programme editing and revocation perform no extra writes");
});
test("existing workspace engines stage programme costs and nonfinancial edits without rewriting history",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  f.a.editWorkspace(w=>workspace.addRecord(w,"accounts",{name:"Synthetic account",type:"checking"},date),date);
  f.a.editWorkspace(w=>workspace.addRecord(w,"ledger",{kind:"outflow",date,payer:"Synthetic programme vendor",amountUsd:"12",category:"software",dsDimension:"software_api"},date),date);
  assert.equal(f.writes(),0);
  const draft=f.a.pendingDraft();
  assert.equal(draft.accounts[0].name,"Synthetic account");
  assert.equal(draft.ledger.at(-1).paymentStatus,"scheduled");
  assert.deepEqual(draft.changeLog.slice(0,before.changeLog.length),before.changeLog);
  assert.throws(()=>f.a.editWorkspace(w=>{w.changeLog=[];return w;},date),/preserve history/);
  assert.throws(()=>f.a.editWorkspace(w=>{w.ledger[0].amountUsd=-1;return w;},date),/Invalid or unsupported/);
  assert.deepEqual(f.a.pendingDraft(),draft,"Rejected edits cannot change the authoritative draft");
  assert.throws(()=>f.a.editWorkspace(w=>{f.a.replaceLedger([],date);return w;},date),/already in progress/);
  await f.a.save(passphrase);
  assert.equal((await workspace.decrypt(passphrase,f.remote().ciphertext)).accounts.length,1);
  f.signOut();assert.throws(()=>f.a.editWorkspace(w=>w,date),/Owner session changed/);
});
test("explicit unsaved reversal restores content while appending current history",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  assert.throws(()=>f.a.reverseEdit(before,date),/Only an unsaved/);
  f.a.editWorkspace(w=>workspace.addRecord(w,"accounts",{name:"Synthetic reversed account",type:"checking"},date),date);
  const changed=f.a.pendingDraft();
  f.a.reverseEdit(before,date);
  const reversed=f.a.pendingDraft();
  assert.equal(reversed.accounts.length,0);
  assert.deepEqual(reversed.changeLog.slice(0,changed.changeLog.length),changed.changeLog);
  assert.equal(reversed.changeLog.at(-1).action,"WORKSPACE_EDIT_REVERSED");
  assert.equal(f.writes(),0);
  await f.a.save(passphrase);
  assert.equal((await workspace.decrypt(passphrase,f.remote().ciphertext)).changeLog.at(-1).action,"WORKSPACE_EDIT_REVERSED");
});
test("wrong passphrases, tamper, invalid ledger and invalid chronology preserve current workspace",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const malformed=workspace.newWorkspace(date);malformed.ledger=[expense(-1)];
  const text=await workspace.encrypt(passphrase,malformed);
  const cases=[
    [f.backup,"incorrect synthetic passphrase",date,/Wrong passphrase/],
    [{...f.backup,sha256:"a".repeat(64)},passphrase,date,/checksum/],
    [{...f.backup,revision:0},passphrase,date,/Invalid encrypted revision backup/],
    [{...f.backup,ciphertext:"x".repeat(5000001)},passphrase,date,/Invalid encrypted revision backup/],
    [{revision:1,ciphertext:text,sha256:await sha256(text)},passphrase,date,/Invalid or unsupported accounting/],
    [f.backup,passphrase,"2026-02-30",/Date required/]
  ];
  for(const [backup,pass,on,error] of cases){
    await assert.rejects(f.a.restoreLedgerBackup(backup,pass,on),error);
    assert.equal(f.a.status().dirty,false);assert.deepEqual(f.a.workspaceSnapshot(),before);
    assert.equal(f.writes(),0);
  }
  assert.equal((await f.a.restoreLedgerBackup(f.backup,passphrase,date)).unsaved,true,
    "A rejected restore releases the operation lock");
});
test("restore refuses an unsaved draft and an unconfirmed newer server revision",async()=>{
  const f=await fixture(),other=f.coordinator();await other.open(passphrase);
  f.a.replaceLedger([expense(20)],date);
  await assert.rejects(f.a.restoreLedgerBackup(f.backup,passphrase,date),/preserve or discard/);
  other.replaceLedger([expense(30)],date);await other.save(passphrase);
  await assert.rejects(f.a.save(passphrase),/Stale/);
  await assert.rejects(f.a.restoreLedgerBackup(f.backup,passphrase,date),/preserve or discard/);
  f.a.discardDraft();assert.equal((await f.a.open(passphrase)).requiresOwnerConfirmation,true);
  assert.equal(f.a.workspaceSnapshot().ledger[0].amountUsd,30,"Owner can inspect a newer revision before confirming it");
  await assert.rejects(f.a.restoreLedgerBackup(f.backup,passphrase,date),/confirm the current workspace/);
  f.a.confirmOpenedRevision(2);
  assert.equal((await f.a.restoreLedgerBackup(f.backup,passphrase,date)).unsaved,true);
  assert.equal(f.writes(),1);
});
test("restore excludes concurrent operations and refuses local installation after session revocation",async()=>{
  const f=await fixture(),release=f.pauseDecrypt();
  const restoring=f.a.restoreLedgerBackup(f.backup,passphrase,date);
  try{
    assert.throws(()=>f.a.replaceLedger([expense(50)],date),/already in progress/);
    await assert.rejects(f.a.restoreLedgerBackup(f.backup,passphrase,date),/already in progress/);
    assert.throws(()=>f.a.close(),/already in progress/);
    f.signOut();
  }finally{release();}
  await assert.rejects(restoring,/Owner session changed/);
  assert.equal(f.a.status().dirty,false,"Revoked decrypt cannot install a restored draft");
  assert.equal(f.writes(),0);
  assert.throws(()=>f.a.workspaceSnapshot(),/Owner session changed/);
});
