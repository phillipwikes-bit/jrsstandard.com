// Isolated browser verification of the staging workspace revision bridge.
// Synthetic records and local in-memory transport only. No live server calls.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
let chromium;
try {({chromium}=require("playwright-core"));}
catch {if(process.env.CI)throw Error("playwright-core must be installed for browser CI"); console.log("SKIPPED: playwright-core unavailable"); process.exit(0);}
const scripts=new Set([
  "workspace-store.js","workspace-revision-protocol.js",
  "revision-store.js","revision-workspace-bridge.js",
  "revision-runtime-staging.js","revision-accounting-coordinator.js","accountant.js","ds-program.js"
]);
const base=new URL("../owner/incomeos/",import.meta.url);
const server=createServer((req,res)=>{
  const name=req.url.replace(/^\//,"").split("?")[0];
  if(name===""){
    res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
    res.end("<!doctype html><html><head><meta charset='utf-8'></head><body><h1>Isolated revision verification</h1>"+[...scripts].map(s=>"<script src='/"+s+"'></script>").join("")+"</body></html>");
    return;
  }
  if(!scripts.has(name)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{"content-type":"text/javascript; charset=utf-8"});
  res.end(readFileSync(new URL(name,base)));
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try {
  browser=await chromium.launch(process.env.INCOMEOS_BROWSER?
    {executablePath:process.env.INCOMEOS_BROWSER,args:["--no-sandbox"]}:{headless:true});
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",err=>errors.push(String(err)));
  page.on("request",req=>{if(!req.url().startsWith("http://127.0.0.1:"))errors.push("Unexpected outbound request");});
  await page.goto("http://127.0.0.1:"+server.address().port+"/");
  const result=await page.evaluate(async()=>{
    const assert=(condition,message)=>{if(!condition)throw Error(message);};
    const rejects=async(fn,message)=>{
      let error;
      try{await fn();}catch(e){error=e;}
      assert(error&&String(error).includes(message),"Expected "+message+"; got "+String(error));
    };
    const ws=window.IncomeOSWorkspace,protocol=window.IncomeOSWorkspaceRevision;
    const createStore=window.IncomeOSRevisionStore.createRevisionStore;
    const createBridge=window.IncomeOSWorkspaceRevisionBridge.createWorkspaceBridge;
    assert(!!ws&&!!protocol&&!!createStore&&!!createBridge,"Missing source modules");
    const sha256=async text=>{
      const bytes=new TextEncoder().encode(text);
      const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
      return Array.from(hash,b=>b.toString(16).padStart(2,"0")).join("");
    };
    const integrity={sha256};
    let latest=null,writes=0,reads=0;
    const transport={
      latest:async()=>{reads++;return latest;},
      append:async req=>{
        if(req.expected_revision!==(latest?latest.revision:0))throw Error("Stale server revision");
        assert(req.payload_sha256===await sha256(req.encrypted_payload),"Invalid write checksum");
        latest={revision:req.expected_revision+1,ciphertext:req.encrypted_payload,
          ciphertext_sha256:req.payload_sha256};
        writes++;return latest.revision;
      }
    };
    const a=createBridge(createStore(transport,protocol,integrity),ws,integrity);
    const b=createBridge(createStore(transport,protocol,integrity),ws,integrity);
    const password="synthetic owner test passphrase is long";
    const document=ws.newWorkspace("2026-11-07");
    document.note="SYNTHETIC PRIVATE LEDGER DATA";
    await rejects(()=>a.save(document,password),"Open and verify");
    assert((await a.open(password)).revision===0,"Empty server revision");
    assert((await a.save(document,password)).revision===1,"First encrypted append");
    assert(writes===1&& !latest.ciphertext.includes(document.note),"Server stored plaintext");
    assert((await b.open(password)).workspace.note===document.note,"Second client decrypted record");
    const updated=JSON.parse(JSON.stringify(document));
    updated.note="SYNTHETIC SECOND REVISION";
    assert((await a.save(updated,password)).revision===2,"Second append");
    await rejects(()=>b.save(document,password),"Stale server revision");
    assert(b.status().openedRevision===null,"Uncertain write quarantined");
    const recovered=await b.open(password);
    assert(recovered.revision===2&&recovered.requiresOwnerConfirmation,"New revision requires review");
    await rejects(()=>b.save(recovered.workspace,password),"Owner must review");
    b.confirmOpenedRevision(2);
    assert((await b.save(recovered.workspace,password)).revision===3,"Confirmed encrypted append");
    const untampered=latest;
    latest={...untampered,ciphertext_sha256:"0".repeat(64)};
    await rejects(()=>a.open(password),"checksum mismatch");
    assert(a.status().openedRevision===null,"Tampered server read quarantined");
    latest=untampered;
    await rejects(()=>a.open("wrong synthetic passphrase"),"Wrong passphrase");
    assert(a.status().openedRevision===null,"Wrong passphrase cannot authorize a write");
    // The final composition remains inactive until an explicitly authenticated
    // staging host supplies the vault session and makes an explicit call.
    const runtime=window.IncomeOSRevisionRuntime;
    assert(!!runtime,"Missing staging runtime factory");
    let absent=false;
    try{runtime.createRuntime({stagingOnly:true});}catch(e){absent=String(e).includes("Authenticated owner vault session");}
    assert(absent,"Missing vault session must block runtime construction");
    window.IncomeOSVaultCloud={
      signedIn:()=>true,
      createRevisionTransport:()=>Object.freeze({
        latest:transport.latest,
        append:transport.append,
        assertSession:()=>true
      })
    };
    absent=false;
    try{runtime.createRuntime({});}catch(e){absent=String(e).includes("Explicit staging-only");}
    assert(absent,"Explicit staging-only authorization is required");
    const composed=runtime.createRuntime({stagingOnly:true});
    const opened=await composed.open(password);
    assert(opened.revision===3&&opened.workspace.note===updated.note,
      "Composed authenticated runtime must decrypt the latest owner workspace");
    assert(writes===3,"Runtime construction/open must not silently save");
    composed.close();
    const accounting=runtime.createAccountingRuntime({stagingOnly:true});
    assert((await accounting.open(password)).revision===3,"Accounting runtime opens the same workspace");
    const row={id:"synthetic-browser-restore",kind:"outflow",date:"2026-11-08",
      label:"Synthetic browser backup expense",category:"software",type:"expense",
      amountUsd:10,businessUse:null,paymentStatus:"paid",source:"synthetic"};
    accounting.replaceLedger([row],"2026-11-08");
    assert((await accounting.save(password)).revision===4,"Explicit initial accounting save");
    const backup=accounting.encryptedBackup();
    const programme=window.IncomeOSDSProgram.add(window.IncomeOSDSProgram.newProgram("2026-11-08"),"tasks",{
      id:"T-BROWSER-SHARED",title:"Synthetic programme task",module:"engineering"
    },"2026-11-08");
    accounting.updateProgram(programme,"2026-11-08");
    accounting.replaceLedger([{...row,amountUsd:20}],"2026-11-08");
    assert((await accounting.save(password)).revision===5,"Current revision advances after backup");
    const history=accounting.workspaceSnapshot().changeLog;
    await rejects(()=>accounting.restoreLedgerBackup({...backup,sha256:"0".repeat(64)},password,"2026-11-08"),"checksum mismatch");
    assert(accounting.workspaceSnapshot().ledger[0].amountUsd===20,"Tamper cannot change current ledger");
    const counts={writes,reads};
    const restoration=await accounting.restoreLedgerBackup(backup,password,"2026-11-08");
    assert(restoration.unsaved&&restoration.serverSaved===false,"Restore requires an explicit new save");
    assert(writes===counts.writes&&reads===counts.reads,"Backup restoration must be entirely local");
    const restored=accounting.pendingDraft();
    assert(restored.ledger[0].amountUsd===10&&restored.note===updated.note,"Restore preserves current nonfinancial workspace");
    assert(JSON.stringify(restored.changeLog.slice(0,history.length))===JSON.stringify(history),"Restore preserves current history");
    assert((await accounting.save(password)).revision===6,"Restoration appends against current head, never revision 4");
    assert((await ws.decrypt(password,latest.ciphertext)).ledger[0].amountUsd===10,"Saved restoration decrypts exactly");
    assert((await ws.decrypt(password,latest.ciphertext)).dsProgram.tasks.some(t=>t.id==="T-BROWSER-SHARED"),
      "The same encrypted revision retains programme management changes after ledger recovery");
    const recoveryDocument=await ws.decrypt(password,backup.ciphertext);
    recoveryDocument.accounts=[{id:"synthetic-browser-account",name:"Synthetic recovered account",type:"checking"}];
    const recoveryText=await ws.encrypt(password,recoveryDocument);
    const review=await accounting.prepareWorkspaceRecovery({revision:backup.revision,ciphertext:recoveryText,sha256:await sha256(recoveryText)},password);
    assert(review.sections.includes("accounts")&&!review.sections.includes("dsProgram"),"Recovery must expose section review without programme replacement");
    accounting.applyWorkspaceRecovery(["accounts"],"2026-11-08");
    assert(writes===6,"Workspace recovery cannot autosave");
    assert((await accounting.save(password)).revision===7,"Selected recovery appends a new revision");
    const reconciled=await ws.decrypt(password,latest.ciphertext);
    assert(reconciled.accounts[0].id==="synthetic-browser-account"&&reconciled.dsProgram.tasks.some(t=>t.id==="T-BROWSER-SHARED"),"Section recovery retains current programme");
    return {writes,reads,finalRevision:latest.revision,viewport:innerWidth};
  });
  assert.deepEqual(errors,[],"No page errors or external requests");
  assert.equal(result.writes,7);
  assert.equal(result.finalRevision,7);
  console.log("PASS: Chromium 375px real AES-GCM staging accounting, CAS, fail-closed recovery and explicit ledger-backup restoration");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
