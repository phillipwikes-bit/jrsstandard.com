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
  "revision-store.js","revision-workspace-bridge.js"
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
    return {writes,reads,finalRevision:untampered.revision,viewport:innerWidth};
  });
  assert.deepEqual(errors,[],"No page errors or external requests");
  assert.equal(result.writes,3);
  assert.equal(result.finalRevision,3);
  console.log("PASS: Chromium 375px real AES-GCM staging bridge, two clients, CAS and fail-closed recovery");
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
