// IncomeOS workspace file: engine-checked updates, append-only change log, encryption round trip.
// SYNTHETIC DATA ONLY.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{},URL,WeakSet,crypto:globalThis.crypto,btoa,atob,TextEncoder,TextDecoder};
for(const f of ["ledger-rules.js","claims-tracker.js","workspace-store.js"])vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const WS=ctx.window.IncomeOSWorkspace,LR=ctx.window.IncomeOSLedgerRules;
const plain=x=>JSON.parse(JSON.stringify(x));
const base={schema:"incomeos.workspace.v1",
  ledger:[{id:"e1",kind:"outflow",type:"expense",date:"2026-10-05",payer:"Comcast",label:"Internet",amountUsd:"100.01",category:"other"}],
  rules:[{id:"net",kind:"outflow",match:{vendorContains:"comcast"},split:[{category:"homeoffice",percent:40},{category:"other",percent:60}],approvedOn:"2026-11-01"}],
  accounts:[{id:"chk",name:"Checking",type:"checking"}],balances:[],claims:[]};

// Accept a proposal: entry split, original replaced, change logged, input untouched.
const prop=LR.propose(base.ledger,base.rules).proposals[0];
let w=WS.acceptProposal(base,prop,"2026-11-03");
assert.equal(w.ledger.length,2);assert.equal(w.ledger.reduce((a,e)=>a+Math.round(Number(e.amountUsd)*100),0),10001);
assert.equal(w.changeLog.length,1);assert.equal(w.changeLog[0].action,"ACCEPT_CATEGORY_PROPOSAL");
assert.equal(base.ledger.length,1,"input workspace is not mutated");
assert.equal(LR.propose(w.ledger,w.rules).proposals.length,0,"accepted entries are not re-proposed");
assert.throws(()=>WS.acceptProposal(base,{...plain(prop),entryId:"nope"},"2026-11-03"),/not found/);

// Record searches; a match opens a claim at MATCH_FOUND with evidence.
w=WS.recordSearch(w,"md-comptroller","2026-11-03",false);
assert.equal(w.searchHistory.length,1);assert.equal(w.claims.length,0);
assert.throws(()=>WS.recordSearch(w,"missingmoney","2026-11-03",true,""),/Describe what was found/);
w=WS.recordSearch(w,"missingmoney","2026-11-03",true,"MissingMoney match, ref 4471");
assert.equal(w.claims[0].state,"MATCH_FOUND");assert.equal(w.claims[0].history.at(-1).evidenceRef,"MissingMoney match, ref 4471");
const cid=w.claims[0].id;

// Claims lifecycle rules are enforced by the claims engine.
assert.throws(()=>WS.advanceClaim(w,cid,{to:"PAID",on:"2026-11-04",evidenceRef:"x",amountUsd:50,bankRef:"b"}),/TRANSITION_NOT_ALLOWED/);
assert.throws(()=>WS.advanceClaim(w,cid,{to:"CLAIM_FILED",on:"2026-11-04",evidenceRef:""}),/EVIDENCE_REFERENCE_REQUIRED/);
w=WS.advanceClaim(w,cid,{to:"CLAIM_FILED",on:"2026-11-04",evidenceRef:"claim #9"});
assert.equal(w.claims[0].state,"CLAIM_FILED");

// Balances need a known account, a date, an amount and a stated source.
assert.throws(()=>WS.addBalance(w,{accountId:"ghost",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:"r"}),/Unknown account/);
assert.throws(()=>WS.addBalance(w,{accountId:"chk",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:" "}),/where the statement/);
for(const bad of ["",null,undefined,"abc","1.234"])assert.throws(()=>WS.addBalance(w,{accountId:"chk",asOf:"2026-11-01",balanceUsd:bad,source:"statement",sourceRef:"r"}),/balance amount/,"empty or malformed amount refused: "+bad);
w=WS.addBalance(w,{accountId:"chk",asOf:"2026-11-01",balanceUsd:"2500",source:"statement",sourceRef:"Oct statement, filing cabinet"});
assert.equal(w.balances.length,1);

w=WS.markAlerted(w,["o1","o2","o1"],"2026-11-03");assert.deepEqual(plain(w.previousAlertIds).sort(),["o1","o2"]);
assert.deepEqual(plain(w.changeLog.map(c=>c.action)),["ACCEPT_CATEGORY_PROPOSAL","RECORD_SEARCH","RECORD_SEARCH","OPEN_CLAIM","ADVANCE_CLAIM","ADVANCE_CLAIM","ADD_BALANCE","MARK_ALERTED"]);

// Study time entries: validated like the research engine, logged, removable.
let rt=WS.setResearchTime(w,"study-abc1",{screenMinutes:"5",prepMinutes:0,adminMinutes:"",timeConfidence:"verified"},"2026-11-03");
assert.deepEqual(plain(rt.researchTimes["study-abc1"]),{screenMinutes:5,prepMinutes:0,adminMinutes:null,timeConfidence:"verified",enteredOn:"2026-11-03"});
assert.throws(()=>WS.setResearchTime(w,"study-abc1",{prepMinutes:-1},"2026-11-03"),/Invalid preparation/);
assert.throws(()=>WS.setResearchTime(w,"x",{},"2026-11-03"),/Invalid study id/);
assert.equal(WS.setResearchTime(w,"study-abc2",{timeConfidence:"anything"},"2026-11-03").researchTimes["study-abc2"].timeConfidence,"estimated","unknown confidence never upgrades to verified");
rt=WS.clearResearchTime(rt,"study-abc1","2026-11-03");assert.equal(rt.researchTimes["study-abc1"],undefined);
assert.equal(rt.changeLog.at(-1).action,"CLEAR_RESEARCH_TIME");
// Unknown sections (for example a pasted password) are rejected.
assert.throws(()=>WS.validate({schema:"incomeos.workspace.v1",password:"x"}),/Unrecognized sections: password/);

// Encryption round trip; wrong passphrase and tampering fail closed; short passphrase refused.
const P="correct horse battery staple";
const sealed=await WS.encrypt(P,w);
assert.ok(WS.isEncrypted(sealed));assert.ok(!sealed.includes("Comcast"),"ciphertext does not reveal contents");
assert.deepEqual(plain(await WS.load(sealed,P)),plain(w));
await assert.rejects(WS.load(sealed,"wrong passphrase value"),/Wrong passphrase/);
await assert.rejects(WS.load(sealed,""),/encrypted/);
await assert.rejects(WS.encrypt("short",w),/16 characters/);
const o=JSON.parse(sealed);const d=Buffer.from(o.data,"base64");d[5]^=1;o.data=d.toString("base64");
await assert.rejects(WS.load(JSON.stringify(o),P),/Wrong passphrase or damaged/);
assert.equal((await WS.load(JSON.stringify(base),"")).schema,"incomeos.workspace.v1","plain files still load");
// Passive-radar decisions: saved with the finding's links and date, removable, never touching the ledger.
{
  let w=WS.newWorkspace("2026-11-04");const led=JSON.stringify(w.ledger);
  const f={id:"pf-1",title:"Synthetic rebate",valueType:"savings",sourceName:"Synthetic",sourceUrl:"https://example.org/s",directUrl:"https://example.gov/d",foundOn:"2026-11-03",amountUsd:40,amountBasis:"stated"};
  w=WS.setPassiveFinding(w,f,"Pursuing","2026-11-04");
  assert.deepEqual(plain(w.passiveFindings["pf-1"]),{status:"Pursuing",on:"2026-11-04",title:"Synthetic rebate",valueType:"savings",sourceName:"Synthetic",sourceUrl:"https://example.org/s",directUrl:"https://example.gov/d",foundOn:"2026-11-03",deadline:null,amountUsd:40,amountBasis:"stated"});
  assert.equal(JSON.stringify(w.ledger),led,"a decision never changes the ledger");
  assert.equal(w.changeLog.at(-1).action,"SET_PASSIVE_FINDING");
  assert.throws(()=>WS.setPassiveFinding(w,{...f,directUrl:"http://example.gov/d"},"Pursuing","2026-11-04"),/https/);
  assert.throws(()=>WS.setPassiveFinding(w,{...f,valueType:"income"},"Pursuing","2026-11-04"),/type/);
  assert.throws(()=>WS.setPassiveFinding(w,f,"Claimed","2026-11-04"),/decision/);
  assert.throws(()=>WS.setPassiveFinding(w,{...f,foundOn:"bad"},"Done","2026-11-04"),/found-on/);
  w=WS.setPassiveFinding(w,f,"New","2026-11-05");assert.equal(w.passiveFindings["pf-1"],undefined);
  // A workspace saved before this section existed still loads.
  const old=plain(WS.newWorkspace("2026-11-01"));delete old.passiveFindings;assert.doesNotThrow(()=>WS.validate(old));
  assert.ok(WS.setPassiveFinding(old,f,"Dismissed","2026-11-04").passiveFindings["pf-1"]);
}
// A returned-capital finding opens one recovery claim carrying its links; nothing is counted as received.
{
  let w=WS.newWorkspace("2026-11-04");
  const f={id:"pf-cap",title:"Synthetic unclaimed property match",valueType:"returned_capital",sourceName:"Synthetic list",sourceUrl:"https://example.org/s",directUrl:"https://example.gov/claim",foundOn:"2026-11-03",amountUsd:80,amountBasis:"stated",deadline:"2026-12-31",terms:{provider:"Synthetic State Comptroller"}};
  w=WS.claimFromFinding(w,f,"2026-11-04");
  const c=w.claims.at(-1);
  assert.deepEqual([c.id,c.kind,c.state,c.counterparty,c.estimatedUsd,c.deadline],["claim-finding-pf-cap","unclaimed_property","SEARCH_DUE","Synthetic State Comptroller",80,"2026-12-31"]);
  assert.deepEqual(plain(c.finding),{id:"pf-cap",sourceUrl:"https://example.org/s",directUrl:"https://example.gov/claim",foundOn:"2026-11-03"});
  assert.equal(w.passiveFindings["pf-cap"].status,"Pursuing");assert.equal(w.passiveFindings["pf-cap"].claimId,"claim-finding-pf-cap");
  assert.throws(()=>WS.claimFromFinding(w,f,"2026-11-04"),/already open/,"one claim per finding");
  assert.throws(()=>WS.claimFromFinding(w,{...f,id:"pf-p",valueType:"projection"},"2026-11-04"),/returned-capital/);
  assert.equal(w.ledger.length,0,"no ledger entry");
  const rev=ctx.window.IncomeOSClaims.review(w.claims,"2026-11-04");
  assert.equal(rev.recoveredUsd,0,"not counted as recovered");
  // Paid needs a bank reference, as for any claim.
  w=WS.advanceClaim(w,c.id,{to:"MATCH_FOUND",on:"2026-11-05",evidenceRef:"search result"});
  w=WS.advanceClaim(w,c.id,{to:"CLAIM_FILED",on:"2026-11-05",evidenceRef:"claim 1"});
  w=WS.advanceClaim(w,c.id,{to:"APPROVED",on:"2026-11-06",evidenceRef:"letter"});
  assert.throws(()=>WS.advanceClaim(w,c.id,{to:"PAID",on:"2026-11-07",evidenceRef:"x",amountUsd:"80"}),/BANK_REFERENCE/);
  // Changing the decision keeps the claim link; an estimate is not used as the claim amount; a refund starts at MATCH_FOUND.
  w=WS.setPassiveFinding(w,f,"Done","2026-11-08");assert.equal(w.passiveFindings["pf-cap"].claimId,"claim-finding-pf-cap");
  w=WS.claimFromFinding(w,{...f,id:"pf-r",title:"Synthetic overpaid deposit refund",directUrl:"https://example.org/r",amountBasis:"estimated"},"2026-11-08");
  assert.deepEqual([w.claims.at(-1).kind,w.claims.at(-1).state,w.claims.at(-1).estimatedUsd],["refund","MATCH_FOUND",null]);
}
// Loaded study listings: re-checked by the study screener, deduplicated, capped and newest first; bad records refused.
{
  const sctx={window:{},URL};vm.runInNewContext(readFileSync(new URL("../owner/incomeos/research-radar.js",import.meta.url),"utf8"),sctx);
  ctx.window.IncomeOSResearchRadar=sctx.window.IncomeOSResearchRadar;
  const st=(id,reviewed)=>({id,title:"Synthetic study "+id,provider:"Synthetic Recruiter",paymentUsd:100,minutes:30,screenMinutes:5,mode:"online",reviewed,eventEnd:null,url:"https://example.org/a/"+id,sourceUrl:"https://example.org/s/"+id,status:"Open"});
  let w=WS.newWorkspace("2026-11-05");
  w=WS.setResearchStudies(w,[st("syn-a-0001","2026-11-01"),st("syn-b-0002","2026-11-05"),st("syn-a-0001","2026-11-01")],"2026-11-05");
  assert.deepEqual(plain(w.researchStudies.map(x=>x.id)),["syn-b-0002","syn-a-0001"],"deduplicated, newest first");
  assert.equal(w.changeLog.at(-1).action,"SET_RESEARCH_STUDIES");
  assert.throws(()=>WS.setResearchStudies(w,[{...st("syn-c-0003","2026-11-05"),url:"http://example.org/x"}],"2026-11-05"),/HTTPS/);
  assert.equal(WS.setResearchStudies(w,Array.from({length:250},(_,k)=>st("syn-n-"+String(k).padStart(4,"0"),"2026-11-05")),"2026-11-05").researchStudies.length,200);
  assert.equal(w.ledger.length,0,"studies never touch the ledger");
  delete ctx.window.IncomeOSResearchRadar;
  assert.throws(()=>WS.setResearchStudies(w,[],"2026-11-05"),/unavailable/,"fails closed without the checker");
}
console.log("IncomeOS workspace QA passed (synthetic data): engine-checked updates, append-only change log, AES-GCM round trip, wrong-passphrase and tamper rejection");
