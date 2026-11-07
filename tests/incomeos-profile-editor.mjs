// IncomeOS profile editor and workspace record forms. SYNTHETIC DATA ONLY.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{},URL,WeakSet,crypto:globalThis.crypto,btoa,atob,TextEncoder,TextDecoder};
for(const f of ["eligibility-engine.js","ledger-rules.js","claims-tracker.js","workspace-store.js","profile-editor.js"])vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const PE=ctx.window.IncomeOSProfileEditor,WS=ctx.window.IncomeOSWorkspace,E=ctx.window.IncomeOSEligibility;
const T="2026-11-03";
const tpl=JSON.parse(readFileSync(new URL("../owner/incomeos/owner-profile.template.json",import.meta.url),"utf8"));
const p0={...tpl,education:[{level:"masters",fieldKeys:["negotiation"],degree:"SYN MS",evidence:{status:"attested",ref:null,verifiedOn:null}}],
  credentials:[{key:"syn_cert",name:"SYN cert",evidence:{status:"attested"}}],experience:[],languages:[],location:{country:"US",region:"MD",evidence:{status:"attested"}},
  totalProfessionalYears:{years:25,evidence:{status:"attested"}},workAuthorization:[],conflicts:{organizations:null},availability:{maxHoursPerWeek:null},
  preferences:{remoteOnly:true,acceptedClassifications:["contractor"],minHourlyUsd:25}};
let r=PE.readiness(p0);assert.equal(r.ready,false);
assert.ok(r.gaps.some(g=>/not yet documented/.test(g))&&r.gaps.some(g=>/work authorization/.test(g))&&r.gaps.some(g=>/Conflict/.test(g))&&r.gaps.some(g=>/Weekly hours/.test(g)));
const items=PE.items(p0);assert.ok(items.some(i=>i.path==="education.0"&&i.status==="attested"));
// Documenting requires a record location and a non-future check date.
assert.throws(()=>PE.markDocumented(p0,"education.0","",T,T),/where the record is kept/);
assert.throws(()=>PE.markDocumented(p0,"education.0","diploma","2027-01-01",T),/future/);
assert.throws(()=>PE.markDocumented(p0,"nope.3","x",T,T),/not found/);
let p=p0;for(const it of items)p=PE.markDocumented(p,it.path,"SYN record for "+it.path,T,T);
assert.equal(p0.education[0].evidence.status,"attested","input profile not mutated");
assert.ok(PE.items(p).every(i=>i.status==="documented"));
assert.throws(()=>PE.setWorkAuthorization(p,{authorized:null,ref:"x",checkedOn:T},T),/Choose/);
p=PE.setWorkAuthorization(p,{authorized:true,citizen:true,ref:"SYN passport",checkedOn:T},T);
p=PE.setConflicts(p,"",T,T);assert.deepEqual(JSON.parse(JSON.stringify(p.conflicts.organizations)),[],"an empty reviewed list is valid");
assert.throws(()=>PE.setWorkPreferences(p,{maxHoursPerWeek:0,minHourlyUsd:30}),/weekly hours/);
p=PE.setWorkPreferences(p,{maxHoursPerWeek:20,minHourlyUsd:35,defaultScreeningHours:2,defaultEngagementHours:40,focusKeywords:"policy, investigat"});
assert.deepEqual(JSON.parse(JSON.stringify(p.preferences.focusKeywords)),["policy","investigat"]);
assert.equal(PE.readiness(p).ready,true);
// The edited profile now satisfies the engine; the template-shaped original does not.
const opp={id:"o",platform:"P",employer:"E",remoteMode:"remote",requirements:[{id:"r1",category:"education",minLevel:"masters",sourceText:"t"},{id:"r2",category:"work_authorization",country:"US",sourceText:"t"}],requirementSet:{ownerConfirmed:true,confirmedOn:T}};
assert.equal(E.evaluate(opp,p0,T,{}).status,"WITHHELD_PENDING_VERIFICATION");
assert.equal(E.evaluate(opp,p,T,{}).status,"ELIGIBLE");
p=PE.undocument(p,"education.0",T);assert.equal(E.evaluate(opp,p,T,{}).status,"WITHHELD_PENDING_VERIFICATION","undocumenting withdraws eligibility");
// Profiles can be saved encrypted and reopened; a profile is never accepted as a workspace.
const sealed=await WS.encrypt("synthetic passphrase 123",p);
assert.equal((await WS.load(sealed,"synthetic passphrase 123")).schema,"incomeos.owner-profile.v1");
assert.throws(()=>WS.validate(p),/Expected an incomeos.workspace.v1/);

// ---------- Workspace record forms ----------
let w=WS.newWorkspace(T);assert.equal(w.schema,"incomeos.workspace.v1");assert.deepEqual(JSON.parse(JSON.stringify(w.ledger)),[]);
w=WS.addRecord(w,"accounts",{name:"Main Checking",type:"checking"},T);assert.equal(w.accounts[0].id,"acct-main-checking");
assert.throws(()=>WS.addRecord(w,"accounts",{name:"Main Checking",type:"checking"},T),/already exists/);
assert.throws(()=>WS.addRecord(w,"accounts",{name:"X",type:"crypto"},T),/account type/);
w=WS.addRecord(w,"ledger",{kind:"outflow",date:"2026-10-05",payer:"Comcast",label:"Internet",amountUsd:"85.5",category:"internet"},T);
assert.equal(w.ledger[0].amountUsd,"85.50");assert.equal(w.ledger[0].type,"expense");assert.equal(w.ledger[0].evidenceStatus,"missing");
w=WS.addRecord(w,"ledger",{kind:"income",date:"2026-10-06",payer:"User Interviews",amountUsd:"150",category:"research"},T);
assert.equal(w.ledger[1].grossUsd,"150.00");
for(const bad of ["-5","0","abc","1.234",""])assert.throws(()=>WS.addRecord(w,"ledger",{kind:"outflow",date:"2026-10-05",payer:"x",amountUsd:bad},T),/positive amount/);
assert.equal(WS.addRecord(w,"ledger",{kind:"outflow",date:"2026-10-05",payer:"x",amountUsd:"5",category:"bogus"},T).ledger.at(-1).category,"other","unknown category falls back to other");
w=WS.addRecord(w,"serviceNotes",{vendor:"Comcast",necessary:true,cancelNoticeDays:"30"},T);
w=WS.addRecord(w,"serviceNotes",{vendor:"comcast",necessary:false,cancelNoticeDays:""},T);
assert.equal(w.serviceNotes.length,1,"one note per vendor, latest wins");assert.equal(w.serviceNotes[0].necessary,false);
assert.throws(()=>WS.addRecord(w,"offers",{provider:"Bank",product:"savings",apyPct:"4",sourceUrl:"http://bank.example"},T),/https/);
w=WS.addRecord(w,"offers",{provider:"Bank A",product:"cd",apyPct:"4.5",termMonths:"12",earlyPenaltyMonths:"3",insurance:"FDIC",sourceUrl:"https://bank.example/cd"},T);
assert.equal(w.offers[0].checkedOn,T);assert.equal(w.offers[0].termMonths,12);
assert.throws(()=>WS.setYieldParams(w,{amountUsd:0,horizonMonths:12,federalRatePct:22,stateRatePct:5},T),/amount/);
w=WS.setYieldParams(w,{amountUsd:"10000",horizonMonths:"12",federalRatePct:"22",stateRatePct:"5",needLiquidity:false},T);
assert.equal(w.yieldParams.amountUsd,10000);
assert.throws(()=>WS.addRecord(w,"password",{},T),/Unknown section/);
assert.equal(w.changeLog.length,7,"every saved change logged once");assert.ok(w.changeLog.every(c=>c.on===T));
console.log("IncomeOS profile editor QA passed (synthetic data): documented-evidence edits, readiness gaps, engine effect, encrypted profile, validated workspace forms");
