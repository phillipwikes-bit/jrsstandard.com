"use strict";
// Synthetic UI event contracts. No browser persistence, accounts or network.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
function fixture(file){
  const handlers={},nodes=new Map(),events=[],timers=[];
  class Node{
    constructor(){this.children=[];this.textContent="";}
    appendChild(n){this.children.push(n);return n;}
    replaceChildren(){this.children=[];this.textContent="";}
    setAttribute(){} addEventListener(){}
    get text(){return this.textContent+this.children.map(n=>n.text).join("");}
  }
  const document={readyState:"loading",createElement:()=>new Node(),
    getElementById:id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);},
    addEventListener:(name,fn)=>{(handlers[name]||=([])).push(fn);},
    dispatchEvent:ev=>{events.push(ev);for(const fn of handlers[ev.type]||[])fn(ev);}};
  const window={IncomeOSResearchRadar:{candidate:x=>x},IncomeOSPublicFeedAdapter:{},IncomeOSPassiveRadar:{},
    IncomeOSWorkspace:{validate:ws=>{if(!ws||ws.schema!=="incomeos.workspace.v1"||Object.keys(ws).includes("password"))throw Error("Invalid workspace");return ws;}}};
  const context={window,document,Intl,Date,URL,console,setTimeout:fn=>timers.push(fn),
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
  runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/"+file),"utf8"),context);
  return {send:(type,detail)=>document.dispatchEvent({type,detail}),events,nodes,
    init:()=>{for(const fn of handlers.DOMContentLoaded||[])fn();},
    flush:()=>{while(timers.length)timers.shift()();}};
}
const a={schema:"incomeos.workspace.v1",ledger:[],researchStudies:[{id:"synthetic-study-A"}],
  researchProgress:{"synthetic-study-A":{status:"Applied"}},
  researchTimes:{"synthetic-study-A":{screenMinutes:7,timeConfidence:"estimated"}}};
const b={schema:"incomeos.workspace.v1",ledger:[],researchStudies:[],researchProgress:{},researchTimes:{}};
for(const close of [null,{schema:"incomeos.workspace.v1",password:"synthetic-unsupported"}]){
 test("closing or invalidating a research workspace cannot copy prior records into its successor: "+(close===null?"null":"invalid"),()=>{
  const f=fixture("research-ui.js");f.send("incomeos:workspace-loaded",a);f.events.length=0;
  f.send("incomeos:workspace-loaded",close);f.send("incomeos:workspace-loaded",b);f.flush();
  assert.deepEqual(f.events.filter(e=>/^incomeos:research-(progress|time|studies)$/.test(e.type)),[],
    "Closing cannot publish prior study progress, time or records to the next workspace");
 });
}
for(const event of ["incomeos:workspace-restored","incomeos:workspace-changed"]){
 test(event+" cannot retain research data after closure",()=>{
  const f=fixture("research-ui.js");f.send("incomeos:workspace-loaded",a);f.events.length=0;
  f.send(event,null);f.send("incomeos:workspace-loaded",b);f.flush();
  assert.deepEqual(f.events.filter(e=>/^incomeos:research-(progress|time|studies)$/.test(e.type)),[]);
 });
}
test("direct research workspace replacement cannot carry records from the prior workspace",()=>{
 const f=fixture("research-ui.js");f.send("incomeos:workspace-loaded",a);f.events.length=0;
 f.send("incomeos:workspace-loaded",b);f.flush();
 assert.deepEqual(f.events.filter(e=>/^incomeos:research-(progress|time|studies)$/.test(e.type)),[]);
});
for(const event of ["incomeos:workspace-loaded","incomeos:workspace-restored","incomeos:workspace-changed"]){
 for(const invalid of [null,{schema:"incomeos.workspace.v1",password:"synthetic-unsupported"}]){
 test("passive findings remove prior private content after "+event+" closes the workspace: "+(invalid===null?"null":"invalid"),()=>{
  const f=fixture("passive-radar-ui.js");f.init();
  f.send("incomeos:workspace-loaded",{schema:"incomeos.workspace.v1",passiveFindings:{"synthetic-finding":{
    title:"Synthetic private finding",status:"Pursuing",on:"2026-11-08",valueType:"savings",sourceName:"Synthetic source",foundOn:"2026-11-08"
  }}});
  assert.match(f.nodes.get("passive-kept").text,/Synthetic private finding/);
  f.send(event,invalid);
  assert.doesNotMatch(f.nodes.get("passive-kept").text,/Synthetic private finding/);
  assert.match(f.nodes.get("passive-kept").text,/Open your workspace/);
 });
}

}
