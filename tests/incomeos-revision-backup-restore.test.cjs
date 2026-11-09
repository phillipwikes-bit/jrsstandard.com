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
load("claims-tracker.js","IncomeOSClaims");
const dsProgram=load("ds-program.js","IncomeOSDSProgram");
const protocol=load("workspace-revision-protocol.js","IncomeOSWorkspaceRevision");
const {createRevisionStore}=load("revision-store.js","IncomeOSRevisionStore");
const {createWorkspaceBridge}=load("revision-workspace-bridge.js","IncomeOSWorkspaceRevisionBridge");
const {createAccountingCoordinator}=load("revision-accounting-coordinator.js","IncomeOSRevisionAccountingCoordinator");
const sha256=async text=>createHash("sha256").update(text,"utf8").digest("hex");
const passphrase="synthetic recovery passphrase 2026",date="2026-11-08";
async function backupOf(document){
  const ciphertext=await workspace.encrypt(passphrase,document);
  return {revision:1,ciphertext,sha256:await sha256(ciphertext)};
}
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
test("section-reviewed workspace recovery preserves programme and history and requires a new save",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const old=await workspace.decrypt(passphrase,f.backup.ciphertext);
  old.accounts=[{id:"synthetic-restored",name:"Synthetic restored account",type:"checking"}];
  old.ledger=[];old.dsProgram.title="Older programme must not replace current";old.changeLog=[];
  const ciphertext=await workspace.encrypt(passphrase,old),backup={revision:1,ciphertext,sha256:await sha256(ciphertext)};
  const review=await f.a.prepareWorkspaceRecovery(backup,passphrase);
  assert.deepEqual(review.sections.slice().sort(),["accounts","ledger"]);
  assert.equal(f.a.status().dirty,false);assert.equal(f.writes(),0);
  assert.throws(()=>f.a.applyWorkspaceRecovery(["dsProgram"],date),/Review recovery sections/);
  f.a.applyWorkspaceRecovery(["accounts","ledger"],date);
  const pending=f.a.pendingDraft();assert.equal(pending.ledger.length,0);assert.equal(pending.accounts.length,1);
  assert.deepEqual(pending.dsProgram,before.dsProgram);
  assert.deepEqual(pending.changeLog.slice(0,before.changeLog.length),before.changeLog);
  assert.equal(pending.changeLog.at(-1).action,"WORKSPACE_BACKUP_RECONCILED");
  assert.equal(f.writes(),0);await f.a.save(passphrase);
  assert.equal((await workspace.decrypt(passphrase,f.remote().ciphertext)).accounts.length,1);
  await f.a.prepareWorkspaceRecovery(f.backup,passphrase);
  f.a.replaceLedger([expense(20)],date);
  assert.throws(()=>f.a.applyWorkspaceRecovery(["ledger"],date),/unchanged current workspace/);
});
test("recovery refuses duplicate accounts, orphan balances and unsafe offer sources atomically",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const offer={id:"synthetic-offer",provider:"Synthetic provider",product:"savings",apyPct:2,insurance:"FDIC",sourceUrl:"https://example.org/rates",checkedOn:date};
  const cases=[
    {offers:[offer,{...offer}]},
    {offers:[{...offer,id:" synthetic-offer "}]},
    {accounts:[{id:"dup",name:"Synthetic",type:"checking"},{id:"dup",name:"Synthetic",type:"checking"}]},
    {balances:[{accountId:"missing",asOf:date,balanceUsd:"12",source:"statement",sourceRef:"Synthetic statement"}]},
    {offers:[{sourceUrl:"http://example.org",apyPct:2}]}
  ];
  for(const fields of cases){
    const doc={...before,...fields},ciphertext=await workspace.encrypt(passphrase,doc);
    const review=await f.a.prepareWorkspaceRecovery({revision:1,ciphertext,sha256:await sha256(ciphertext)},passphrase);
    assert.throws(()=>f.a.applyWorkspaceRecovery(review.sections.slice(),date),/recovered|Recovered/);
    assert.deepEqual(f.a.workspaceSnapshot(),before);assert.equal(f.a.status().dirty,false);assert.equal(f.writes(),0);
  }
});
test("valid unique offers recover as a reviewed draft and persist only on explicit save",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const offer={id:"synthetic-offer",provider:"Synthetic provider",product:"savings",apyPct:2,insurance:"FDIC",sourceUrl:"https://example.org/rates",checkedOn:date};
  const old={...before,offers:[offer,{...offer,id:"synthetic-offer-2"}]};
  const ciphertext=await workspace.encrypt(passphrase,old);
  const review=await f.a.prepareWorkspaceRecovery({revision:1,ciphertext,sha256:await sha256(ciphertext)},passphrase);
  assert.deepEqual(review.sections,["offers"]);assert.equal(f.writes(),0);
  f.a.applyWorkspaceRecovery(["offers"],date);
  assert.deepEqual(f.a.pendingDraft().offers,old.offers);
  assert.deepEqual(f.a.pendingDraft().dsProgram,before.dsProgram);
  assert.equal(f.a.status().dirty,true);assert.equal(f.writes(),0);
  await f.a.save(passphrase);assert.equal(f.writes(),1);
  assert.deepEqual((await workspace.decrypt(passphrase,f.remote().ciphertext)).offers,old.offers);
});
test("complex recovery sections cannot bypass their dedicated evidence and lifecycle engines",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const doc={...before,claims:[{id:"synthetic-unverified",state:"PAID"}],verifiedPayments:{synthetic:true},researchProgress:{}};
  const ciphertext=await workspace.encrypt(passphrase,doc);
  const review=await f.a.prepareWorkspaceRecovery({revision:1,ciphertext,sha256:await sha256(ciphertext)},passphrase);
  assert.deepEqual(review.sections,[]);
  assert.ok(review.blockedSections.includes("claims"));assert.ok(review.blockedSections.includes("verifiedPayments"));
  assert.throws(()=>f.a.applyWorkspaceRecovery(["claims"],date),/Review recovery sections/);
  assert.throws(()=>f.a.applyWorkspaceRecovery(["verifiedPayments"],date),/Review recovery sections/);
  assert.deepEqual(f.a.workspaceSnapshot(),before);assert.equal(f.writes(),0);
});
test("reviewed claim recovery appends supported history and preserves current records",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const opened=workspace.openClaim(before,{id:"synthetic-claim",kind:"refund",openedOn:date});
  const current=workspace.openClaim(opened,{id:"current-only",kind:"rebate",openedOn:date});
  f.a.editWorkspace(()=>current,date);await f.a.save(passphrase);
  const advance=(document,to,evidenceRef,extra={})=>workspace.advanceClaim(document,"synthetic-claim",{to,on:date,evidenceRef,...extra});
  const paid=advance(advance(advance(opened,"CLAIM_FILED","synthetic filing"),"APPROVED","synthetic letter"),
    "PAID","synthetic receipt",{amountUsd:25,bankRef:"synthetic-posting"});
  const withAdditional=workspace.openClaim(paid,{id:"backup-only",kind:"rebate",openedOn:date});
  const backup=await backupOf(withAdditional);
  const review=await f.a.prepareWorkspaceRecovery(backup,passphrase);
  assert.deepEqual(review.sections,["claims"]);
  assert.deepEqual({...review.claimRecovery},{added:1,advanced:1});
  assert.equal(f.writes(),1,"Preview must not write");
  f.a.applyWorkspaceRecovery(["claims"],date);
  const draft=f.a.pendingDraft();
  assert.deepEqual(draft.claims,[paid.claims[0],current.claims[1],withAdditional.claims[1]]);
  assert.deepEqual(draft.ledger,current.ledger,"Claim references are not bank links or ledger entries");
  assert.deepEqual(draft.changeLog.slice(0,-1),current.changeLog);
  assert.equal(f.writes(),1,"Apply is an unsaved edit");
  await f.a.save(passphrase);
  assert.equal(f.writes(),2);
  const stale=await f.a.prepareWorkspaceRecovery(await backupOf(opened),passphrase);
  assert.deepEqual(stale.sections,[],"An older prefix must not rewind a paid claim");
  assert.deepEqual(f.a.workspaceSnapshot().claims,draft.claims);
});
test("claim recovery blocks divergent, malformed and reused payment evidence without blocking a safe section",async()=>{
  const f=await fixture(),before=f.a.workspaceSnapshot();
  const add=id=>workspace.openClaim(before,{id,kind:"refund",openedOn:date});
  const advance=(document,id,to,evidenceRef,extra={})=>workspace.advanceClaim(document,id,{to,on:date,evidenceRef,...extra});
  const paid=(id,ref)=>advance(advance(advance(add(id),id,"CLAIM_FILED","original filing"),id,"APPROVED","synthetic approval"),
    id,"PAID","synthetic receipt",{amountUsd:25,bankRef:ref}).claims[0];
  const current=paid("current-claim","synthetic-posting");
  f.a.editWorkspace(w=>{w.claims=[current];w.changeLog.push({on:date,action:"SYNTHETIC_FIXTURE"});return w;},date);
  await f.a.save(passphrase);
  const snapshot=f.a.workspaceSnapshot(),copy=x=>JSON.parse(JSON.stringify(x));
  const diverged=copy(current);diverged.history[1].evidenceRef="different filing";
  const badDate=copy(current);badDate.history[2].on="2026-02-30";
  const missingReference=paid("missing-reference","different-posting");delete missingReference.history.at(-1).bankRef;
  for(const claims of [[diverged],[badDate],[missingReference],[paid("another-claim","synthetic-posting")],[current,current],null]){
    const review=await f.a.prepareWorkspaceRecovery(await backupOf({...snapshot,note:"Synthetic safe note",claims}),passphrase);
    assert.deepEqual(review.sections,["note"]);
    assert.ok(review.blockedSections.includes("claims"));
    assert.throws(()=>f.a.applyWorkspaceRecovery(["claims"],date),/Review recovery sections/);
    assert.deepEqual(f.a.workspaceSnapshot(),snapshot);assert.equal(f.writes(),1);
  }
  f.a.applyWorkspaceRecovery(["note"],date);
  assert.equal(f.a.pendingDraft().note,"Synthetic safe note");
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
