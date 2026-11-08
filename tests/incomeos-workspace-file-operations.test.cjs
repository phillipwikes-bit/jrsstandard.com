"use strict";
// Deterministic workspace UI lifetime tests using actual workspace/briefing
// engines and a minimal DOM adapter. No network or real owner data.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {webcrypto}=require("node:crypto");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
function deferred(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
function fixture(){
 const nodes=new Map(),listeners={},windowListeners={},events=[],downloads=[],blobs=new Map();
 class Node{
  constructor(tag="div"){this.tagName=tag.toUpperCase();this.children=[];this.handlers={};this.value="";this.textContent="";this.files=[];this.disabled=false;this.hidden=false;}
  set id(value){this._id=value;nodes.set(value,this);} get id(){return this._id;}
  appendChild(n){this.children.push(n);n.parentNode=this;return n;}
  replaceChildren(...items){this.children=items;}
  querySelectorAll(){return [];}
  contains(){return false;}
  setAttribute(){} removeAttribute(){} remove(){} focus(){}
  addEventListener(name,fn){(this.handlers[name]||=[]).push(fn);}
  async click(){
   if(this.tagName==="A"&&this.download)downloads.push({name:this.download,blob:blobs.get(this.href)});
   return Promise.all((this.handlers.click||[]).map(fn=>fn({preventDefault(){}})));
  }
 }
 const node=id=>{if(!nodes.has(id)){const n=new Node();n.id=id;}return nodes.get(id);};
 const document={readyState:"complete",activeElement:null,body:new Node(),getElementById:node,createElement:tag=>new Node(tag),
  addEventListener:(name,fn)=>{(listeners[name]||=[]).push(fn);},
  dispatchEvent:event=>{events.push(event);for(const fn of listeners[event.type]||[])fn(event);}};
 const window={addEventListener:(name,fn)=>{(windowListeners[name]||=[]).push(fn);}};
 const BrowserURL=class extends URL{};
 BrowserURL.createObjectURL=blob=>{const key="blob:synthetic-"+blobs.size;blobs.set(key,blob);return key;};
 BrowserURL.revokeObjectURL=key=>blobs.delete(key);
 const context={window,document,Date,Intl,URL:BrowserURL,Blob,TextEncoder,TextDecoder,console,crypto:webcrypto,btoa,atob,
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
  setTimeout:()=>0,confirm:()=>true};
 for(const file of ["ledger-rules.js","net-worth.js","claims-tracker.js","renewal-monitor.js","spend-intelligence.js","recruiter-history.js","yield-compare.js","weekly-briefing.js","opportunity-lifecycle.js","workspace-store.js"])
  runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/"+file),"utf8"),context);
 const original=window.IncomeOSWorkspace;let loadDocument=(...args)=>original.load(...args);let encrypt=async(p,ws)=>"synthetic-encrypted:"+JSON.stringify(ws);
 window.IncomeOSWorkspace=Object.assign({},original,{load:(...args)=>loadDocument(...args),encrypt:(...args)=>encrypt(...args)});
 runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/briefing-ui.js"),"utf8"),context);
 const dirty=()=>{let blocked=false;for(const fn of windowListeners.beforeunload||[])fn({preventDefault(){blocked=true;}});return blocked;};
 const load=(doc,text)=>{node("briefing-file").files=[{size:100,text:text||(async()=>JSON.stringify(doc))}];return node("briefing-load").click();};
 return {window,document,node,events,downloads,dirty,load,
  encryptFile:doc=>original.encrypt("synthetic encrypted file passphrase",doc),
  setLoad:fn=>{loadDocument=fn;},setEncrypt:fn=>{encrypt=fn;},workspace:()=>original.newWorkspace("2026-11-08")};
}
test("a delayed file read cannot replace a workspace created while it was reading",async()=>{
 const f=fixture(),read=deferred();await f.node("briefing-new").click();
 const old=f.workspace();old.note="Synthetic older file";
 const pending=f.load(old,()=>read.promise);
 await f.node("briefing-new").click();
 const replacement=f.events.filter(e=>e.type==="incomeos:workspace-loaded").at(-1).detail;
 read.resolve(JSON.stringify(old));await pending;
 assert.equal(f.events.filter(e=>e.type==="incomeos:workspace-loaded").at(-1).detail,replacement);
 assert.equal(f.dirty(),true,"The newer unsaved workspace keeps its unload warning");
 assert.match(f.node("briefing-status").textContent,/changed during file|newer workspace/i);
});
for(const encrypted of [false,true])test("edits during "+(encrypted?"encrypted":"plain")+" file opening retain their dirty flag and undo history",async()=>{
 const f=fixture();let apply=true;
 f.document.addEventListener("incomeos:workspace-loaded",()=>{
  if(!apply)return;apply=false;
  f.document.dispatchEvent({type:"incomeos:research-progress",detail:{id:"synthetic-study",status:"Applied"}});
 });
 const document=f.workspace();
 f.node("briefing-passphrase").value="synthetic encrypted file passphrase";
 const text=encrypted?await f.encryptFile(document):JSON.stringify(document);
 await f.load(document,async()=>text);
 assert.equal(f.dirty(),true,"A subscriber's accepted edit is not part of the opened file");
 assert.equal(f.events.some(e=>e.type==="incomeos:workspace-saved"),false,"An edited restored file must not be reported as saved");
 await f.node("briefing-undo").click();
 assert.match(f.node("briefing-status").textContent,/undone/);
 const restored=f.events.filter(e=>e.type==="incomeos:workspace-restored").at(-1).detail;
 assert.deepEqual(Object.keys(restored.researchProgress),[]);
});
test("two pending local encrypted saves cannot produce duplicate file writes",async()=>{
 const f=fixture(),crypto=deferred();await f.node("briefing-new").click();f.node("briefing-passphrase").value="synthetic encryption passphrase";
 let attempts=0;f.setEncrypt(async()=>{attempts++;return crypto.promise;});
 const first=f.node("briefing-save").click();const second=f.node("briefing-save").click();
 crypto.resolve("synthetic encrypted bytes");await Promise.all([first,second]);
 assert.equal(attempts,1);assert.equal(f.downloads.length,1);
});

test("a newer file selection cancels older decryption before the newer read finishes",async()=>{
 const f=fixture(),decrypt=deferred(),started=deferred(),nextRead=deferred();
 const old=f.workspace();old.note="Synthetic older selection";
 const next=f.workspace();next.note="Synthetic current selection";
 f.setLoad(async text=>{started.resolve();await decrypt.promise;return JSON.parse(text);});
 const first=f.load(old);await started.promise;
 const second=f.load(next,()=>nextRead.promise);
 decrypt.resolve();await first;
 assert.equal(f.events.filter(e=>e.type==="incomeos:workspace-loaded").length,0,
  "An invalidated file must not become visible while the current selection is pending");
 nextRead.resolve(JSON.stringify(next));await second;
 assert.equal(f.events.filter(e=>e.type==="incomeos:workspace-loaded").at(-1).detail.note,next.note);
});
test("failed local encryption retains the draft and permits a subsequent explicit save",async()=>{
 const f=fixture();await f.node("briefing-new").click();f.node("briefing-passphrase").value="synthetic encryption passphrase";
 f.setEncrypt(async()=>{throw Error("Synthetic encryption interruption");});await f.node("briefing-save").click();
 assert.equal(f.downloads.length,0);assert.equal(f.dirty(),true);assert.equal(f.node("briefing-save").disabled,false);
 f.setEncrypt(async()=>"synthetic encrypted bytes");await f.node("briefing-save").click();
 assert.equal(f.downloads.length,1);assert.equal(f.dirty(),false);
});
test("editing during local encryption preserves the newer unsaved workspace",async()=>{
 const f=fixture(),encrypt=deferred();await f.node("briefing-new").click();f.node("briefing-passphrase").value="synthetic encryption passphrase";
 f.setEncrypt(async()=>encrypt.promise);const pending=f.node("briefing-save").click();
 f.document.dispatchEvent({type:"incomeos:research-progress",detail:{id:"synthetic-study",status:"Applied"}});
 encrypt.resolve("synthetic encrypted older snapshot");await pending;
 assert.equal(f.downloads.length,1);assert.equal(f.dirty(),true);
 assert.match(f.node("briefing-status").textContent,/earlier workspace version/);
});
