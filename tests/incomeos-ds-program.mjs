// Synthetic-only tests for the Decision Spellchecker program record (owner/incomeos/ds-program.js).
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},Date,Math,Array,Object,Map,Set,Number,String,JSON,Error,URL,globalThis:undefined};
ctx.globalThis=ctx;
runInNewContext(read("ds-program.js"),ctx);runInNewContext(read("workspace-store.js"),ctx);
const D=ctx.window.IncomeOSDSProgram,W=ctx.window.IncomeOSWorkspace;
const plain=v=>JSON.parse(JSON.stringify(v));
const on="2026-11-04";
let p=D.newProgram(on);

// Seeded state is honest: nothing verified, 0 of 18 accepted, every gate open, controlling sources flagged absent.
let c=plain(D.command(p,null,on));
assert.equal(c.acceptance.accepted,0);assert.equal(c.acceptance.total,18);
assert.equal(c.readiness.mandatoryGatesMet,0);assert.equal(c.readiness.status,"BLOCKED");
assert.ok(c.gates.every(g=>g.status==="BLOCKED"));
assert.equal(c.governing.inRepository,false);
assert.ok(c.identities.every(i=>i.status==="UNVERIFIED"));
assert.ok(c.blockers.some(b=>b.id==="BL-001"&&b.severity==="CRITICAL"));
assert.ok(c.comparisons.every(x=>x.status==="NOT_ESTABLISHED"));
assert.equal(c.autonomy.configured,false);
assert.ok(c.restrictedActions.every(a=>a.status==="NOT_AUTHORIZED"));
assert.ok(!("readinessPercent" in c.readiness));
assert.ok(p.acceptance.every(a=>a.criterion===null&&a.criterionSource==="NOT IN REPOSITORY"));
assert.ok(p.studies.every(s=>s.status==="PLANNED"));

// One identifier space across modules.
p=D.add(p,"evidence",{id:"E-SYN-001",title:"Synthetic DS-C unit test run",level:2,source:"tests/ci run",date:on,confidence:"high",assumptions:"Synthetic data",contradictions:"none found",informs:"DS-C module quality",subject:"DS-C"},on);
assert.throws(()=>D.add(p,"tasks",{id:"E-SYN-001",title:"dup"},on),/already used/);

// New-module (DS-C) passes never accept an SP check of the original.
p=D.linkEvidence(p,"acceptance","SP-01","E-SYN-001",on);
assert.throws(()=>D.acceptCheck(p,"SP-01",on),/new-module test passes do not qualify/);
const forced=plain(p);forced.acceptance[0].status="ACCEPTED";
assert.throws(()=>D.validate(forced),/without qualifying independent evidence/);

// Gates need primary evidence and the named approver; G2 and G3 need their underlying records.
assert.throws(()=>D.approveGate(p,"G1",{by:"OWNER",ref:"x"},on),/primary evidence/);
p=D.linkEvidence(p,"gates","G3","E-SYN-001",on);
assert.throws(()=>D.approveGate(p,"G3",{by:"OWNER",ref:"x"},on),/approved by COUNSEL only/);
assert.throws(()=>D.approveGate(p,"G3",{by:"COUNSEL",ref:"memo"},on),/grant-specific transfer authorization/);

// Research findings carry source, date, confidence, assumptions, contradictions and the decision informed; quantities need sourced evidence.
p=D.add(p,"evidence",{id:"E-ASSUME-001",title:"Owner guess",level:7,source:"owner",date:on,assumptions:"guess",contradictions:"none found",informs:"pricing"},on);
assert.throws(()=>D.add(p,"findings",{id:"F-001",question:"Market size?",answer:"Large",evidenceIds:["E-ASSUME-001"],assumptions:"a",contradictions:"none found",informs:"segment priority",quantity:"$2B"},on),/sourced evidence/);
assert.throws(()=>D.add(p,"findings",{id:"F-002",question:"q",answer:"a",evidenceIds:[],assumptions:"a",contradictions:"none",informs:"x"},on),/at least one evidence/);
p=D.add(p,"findings",{id:"F-003",question:"Do GRC teams review decision records?",answer:"Unknown pending interviews",evidenceIds:["E-ASSUME-001"],assumptions:"a",contradictions:"none found",informs:"segment priority",segmentId:"SEG-GRC"},on);
assert.equal(D.command(p,null,on).areas.find(a=>a.area==="Market discovery").status,"IN_PROGRESS");

// JRS audiences never become leads; contacts need a lawful basis, an approved message and owner authorization.
assert.throws(()=>D.add(p,"contacts",{id:"C-001",organization:"Org",role:"CISO",origin:"jrs_website_visitor",lawfulBasis:"inbound_request",basisNote:"n"},on),/cannot become Decision Spellchecker leads/);
assert.throws(()=>D.add(p,"contacts",{id:"C-002",organization:"Org",role:"CISO",origin:"conference",lawfulBasis:"scraped",basisNote:"n"},on),/lawful contact basis/);
p=D.add(p,"contacts",{id:"C-003",organization:"Example Org",role:"Head of Investigations",origin:"conference",lawfulBasis:"published_business_contact",basisNote:"Speaker list"},on);
p=D.add(p,"messages",{id:"M-001",text:"Discovery interview request"},on);
assert.throws(()=>D.recordContact(p,"C-003",{messageId:"M-001",channel:"email"},on),/owner-approved message/);
p=D.approveMessage(p,"M-001",on);
assert.throws(()=>D.recordContact(p,"C-003",{messageId:"M-001",channel:"email"},on),/not authorized/);
p=D.authorize(p,"external_contact",{grantedBy:"OWNER",ref:"owner instruction 2026-11-04",scope:"Discovery interviews only"},on);
p=D.recordContact(p,"C-003",{messageId:"M-001",channel:"email"},on);
const sup=D.suppress(p,"C-003",on);
assert.throws(()=>D.recordContact(sup,"C-003",{messageId:"M-001",channel:"email"},on),/suppressed/);

// Pipeline stages cannot be skipped and each needs its own evidence; execution needs every gate.
p=D.add(p,"pipeline",{id:"PL-001",organization:"Example Org"},on);
assert.throws(()=>D.advance(p,"PL-001",{evidenceIds:["E-SYN-001"]},on),/contact ledger/);
p=D.advance(p,"PL-001",{contactId:"C-003"},on);
assert.throws(()=>D.advance(p,"PL-001",{evidenceIds:["E-ASSUME-001"]},on),/written evidence/);
p=D.add(p,"evidence",{id:"E-EMAIL-001",title:"Buyer email listing requirements",level:3,source:"owner mailbox",date:on,assumptions:"authentic sender",contradictions:"none found",informs:"requirements"},on);
p=D.advance(p,"PL-001",{evidenceIds:["E-EMAIL-001"]},on);
p=D.advance(p,"PL-001",{evidenceIds:["E-EMAIL-001"]},on);
assert.equal(p.pipeline[0].stage,"NONBINDING_INTEREST");assert.equal(p.pipeline[0].nonbinding,true);
assert.throws(()=>D.advance(p,"PL-001",{evidenceIds:["E-EMAIL-001"],agreementRef:"x"},on),/not authorized/);

// Validation: H3 is the authenticated original only; planned studies never count; comparisons stay NOT_ESTABLISHED.
p=D.add(p,"studies",{id:"ST-SYN-1",title:"Synthetic DS-C check",kind:"synthetic",arms:["H2"],minimumN:10},on);
assert.throws(()=>D.add(p,"runs",{id:"R-1",studyId:"ST-SYN-1",arm:"H3",kind:"synthetic",identity:"DS-C",metrics:{tp:1,fp:0,fn:0},evidenceIds:["E-SYN-001"]},on),/authenticated original/);
assert.throws(()=>D.add(p,"runs",{id:"R-2",studyId:"ST-156",arm:"H2",kind:"synthetic",metrics:{tp:1,fp:0,fn:0},evidenceIds:["E-SYN-001"]},on),/must match its study/);
p=D.add(p,"runs",{id:"R-3",studyId:"ST-SYN-1",arm:"H2",kind:"synthetic",metrics:{tp:8,fp:2,fn:1,tn:9},evidenceIds:["E-SYN-001"]},on);
assert.deepEqual(plain(D.runMetrics(p.runs[0])),{precision:0.8,recall:0.889,falsePositives:2,falseNegatives:1});
assert.ok(D.comparisons(p).every(x=>x.status==="NOT_ESTABLISHED"));

// Tasks: dependencies gate progress; done needs evidence; restricted tasks need authorization; ranking is deterministic.
p=D.add(p,"tasks",{id:"T-1",title:"Recover DS-A source",module:"engineering",value:5,cost:3,risk:2},on);
p=D.add(p,"tasks",{id:"T-2",title:"Rebuild DS-A",module:"engineering",dependsOn:["T-1"],value:5,cost:4,risk:3},on);
p=D.add(p,"tasks",{id:"T-3",title:"Publish listing",module:"commercial",restrictedAction:"sales_listing",value:4,cost:1,risk:5},on);
assert.throws(()=>D.setTaskState(p,"T-2","IN_PROGRESS",on),/dependencies/);
assert.throws(()=>D.setTaskState(p,"T-1","DONE",on),/Link evidence/);
assert.throws(()=>D.setTaskState(p,"T-3","IN_PROGRESS",on),/not authorized/);
const q=plain(D.prioritize(p));
assert.deepEqual(q.map(t=>[t.id,t.state]),[["T-1","READY"],["T-2","BLOCKED_BY_DEPENDENCY"],["T-3","NOT_AUTHORIZED"]]);

// Finance: actuals from tagged workspace rows only; revenue needs an executed agreement and bank match; projections stay separate.
let ws=W.newWorkspace(on);
ws=W.addRecord(ws,"ledger",{kind:"outflow",date:"2026-10-12",payer:"API provider",amountUsd:"40.00",category:"software",dsDimension:"software_api"},on);
ws=W.addRecord(ws,"ledger",{kind:"outflow",date:"2026-11-02",payer:"Host",amountUsd:"20.00",category:"software",dsDimension:"hosting_infrastructure"},on);
ws=W.addRecord(ws,"ledger",{kind:"outflow",date:"2026-10-20",payer:"Unrelated",amountUsd:"99.00",category:"other"},on);
ws=W.addRecord(ws,"ledger",{kind:"income",date:"2026-10-25",payer:"Example Org",amountUsd:"500.00",category:"business",dsDimension:"licensing_revenue",dsAgreementId:"PL-001"},on);
assert.throws(()=>W.addRecord(ws,"ledger",{kind:"income",date:on,payer:"x",amountUsd:"1.00",dsDimension:"software_api"},on),/revenue dimension/);
p=D.add(p,"pricing",{id:"PR-1",model:"subscription",label:"Team plan guess",priceUsd:"500",unitsPerMonth:4,variableCostUsd:"50",fixedMonthlyUsd:"300",investmentUsd:"6000",assumptions:"Unvalidated price"},on);
const f=plain(D.finance(p,ws,on));
assert.equal(f.actual.totalCostUsd,60);assert.equal(f.actual.costsByDimensionUsd.software_api,40);
assert.equal(f.actual.lastMonthOperatingCostUsd,40);
assert.equal(f.actual.revenueReceivedUsd,0,"No executed agreement: nothing counts as received");
assert.equal(f.actual.revenueRecordedNotVerifiedUsd,500);
assert.ok(f.issues.some(i=>i.code==="REVENUE_WITHOUT_EXECUTED_AGREEMENT"));
assert.equal(f.projections[0].basis,"PROJECTION");assert.equal(f.projections[0].priceBasis,"ASSUMPTION");
assert.equal(f.projections[0].monthlyContributionUsd,1500);assert.equal(f.projections[0].breakEvenMonths,4);
ws=W.addRecord(ws,"ledger",{kind:"outflow",date:"2026-10-28",payer:"Broker",amountUsd:"10.00",category:"investing",dsDimension:"reinvestment"},on);
assert.ok(D.finance(p,ws,on).issues.some(i=>i.code==="REINVESTMENT_NOT_AUTHORIZED"));

// Workspace integration: stored, validated and logged in the workspace change log.
ws=W.setDsProgram(ws,p,on);
assert.equal(ws.dsProgram.programId,"DSP");
assert.equal(ws.changeLog[ws.changeLog.length-1].action,"DS_PROGRAM_UPDATED");
const bad=plain(p);bad.tasks[0].dependsOn=["NOPE"];
assert.throws(()=>W.setDsProgram(ws,bad,on),/unknown tasks record/);
assert.equal(W.validate(W.newWorkspace(on)).dsProgram,undefined,"Older workspaces without the program still load");

// Operating cycle is owner-run, fetches nothing, and records what it reviewed.
const run=D.runCycle(p,ws,on);
assert.match(run.cycle.id,/^CYCLE-\d+$/);assert.deepEqual(plain(run.cycle.prioritize.ready),["T-1"]);
assert.equal(D.command(run.program,ws,on).autonomy.configured,false);
assert.ok(run.program.changeLog.length>p.changeLog.length);


// ---------- Review of 2026-11-04 (R8): each check fails on 8864b65 ----------
// R8-1: free-text wording of a JRS audience is refused, not just the exact token.
for(const origin of ["JRS website visitor","Research participant","jrs training","Website-Visitor"])
 assert.throws(()=>D.add(p,"contacts",{id:"C-W-"+origin.length,organization:"Org",role:"r",origin,lawfulBasis:"inbound_request",basisNote:"n"},on),/cannot become/,origin);
// R8-2: a hand-edited file cannot claim approvals, grants or stages without their records.
{const t=plain(p);t.gates[6].approval={by:"OWNER"};assert.throws(()=>D.validate(t),/approval lacks/);}
{const t=plain(p);t.authorizations.push({id:"AUTH-x",action:"payment_collection",grantedBy:"OWNER"});assert.throws(()=>D.validate(t),/lacks a known action/);}
{const t=plain(p);t.pipeline[0].stage="EXECUTED_AGREEMENT";assert.throws(()=>D.validate(t),/not sequential/);}
{const t=plain(D.add(p,"rights",{id:"RC-1",component:"core",kind:"original_source"},on));t.rights[0].grantSpecificTransferAuthorization=true;assert.throws(()=>D.validate(t),/executed instrument/);}
// R8-5: cycle IDs stay unique after old cycles roll off.
{let q=p;const seen=new Set();for(let i=0;i<205;i++){const r=D.runCycle(q,null,on);q=r.program;assert.ok(!seen.has(r.cycle.id),"duplicate "+r.cycle.id);seen.add(r.cycle.id);}}
// R8-6: prioritize exposes each task's own state so the view can offer Done for started work.
{const q=D.setTaskState(p,"T-1","IN_PROGRESS",on);assert.equal(D.prioritize(q).find(t=>t.id==="T-1").taskState,"IN_PROGRESS");}
// R8-7: a refund row reduces program cost.
{let w2=W.newWorkspace(on);
 w2=W.addRecord(w2,"ledger",{kind:"outflow",date:"2026-10-12",payer:"API provider",amountUsd:"40.00",category:"software",dsDimension:"software_api"},on);
 w2.ledger.push({...w2.ledger[0],id:"refund-1",type:"refund",amountUsd:"10.00"});
 assert.equal(D.finance(p,w2,on).actual.totalCostUsd,30);}
// R8-8: every mutator requires a date.
assert.throws(()=>D.approveMessage(p,"M-001"),/Date required/);
assert.throws(()=>D.suppress(p,"C-003"),/Date required/);
assert.throws(()=>D.setPhase(p,"P2_COMMAND_CENTER"),/Date required/);
assert.throws(()=>D.acceptCheck(p,"SP-01"),/Date required/);
// R8-9: references must name the right kind of record.
{const t=plain(p);t.tasks[1].dependsOn=["E-SYN-001"];assert.throws(()=>D.validate(t),/unknown tasks record/);}
{const t=plain(p);t.gates[0].evidenceIds=["T-1"];assert.throws(()=>D.validate(t),/unknown evidence record/);}
// R8-10: the workspace store has no unused action parameter.
assert.doesNotMatch(read("workspace-store.js"),/function setDsProgram\(ws,program,on,action\)/);
// Owner report: statuses come only from the record; contacts and prospects appear as counts only.
{const seed=plain(D.report(D.newProgram(on),null,on));
 const st=Object.fromEntries(seed.items.map(i=>[i.area,i.status]));
 assert.equal(st.What,"NOT ESTABLISHED");assert.equal(st.Rights,"NOT ESTABLISHED");assert.equal(st.Technology,"NOT ESTABLISHED");
 assert.equal(st.Validation,"NOT ESTABLISHED");assert.equal(st.Evidence,"PARTIAL","repository records exist but none primary");
 assert.match(seed.markdown,/^# Decision Spellchecker program report\n\nCONFIDENTIAL/);
 assert.match(seed.markdown,/document not in the repository/);
 const full=D.report(p,ws,on).markdown;
 assert.ok(!full.includes("Example Org")&&!full.includes("Head of Investigations"),"no buyer or contact names in the report");
 assert.match(full,/1 contact\(s\), 1 prospect\(s\)/);
 assert.doesNotMatch(full,/\d\s?%|—/,"no percentages or em-dashes");
 assert.notEqual(D.report(p,ws,on).items.find(i=>i.area==="Commercial value").status,"ESTABLISHED","commercial value is never established from records alone");}
// No network, storage or messaging in the engine.
assert.doesNotMatch(read("ds-program.js"),/fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|sendBeacon|WebSocket|mailto:/);
console.log("IncomeOS Decision Spellchecker program QA passed: honest seed, shared identifiers, SP and gate controls, lead and contact rules, staged pipeline, validation separation, prioritization, actual-versus-projected finance, workspace integration and owner-run cycle.");
