// IncomeOS master-plan feature engines: categorization and split rules, net worth,
// recovery claims, renewal monitor, recruiter history, yield comparison, weekly briefing.
// SYNTHETIC DATA ONLY. Passing proves engine logic, not any real account or outcome.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{},URL,WeakSet};
for(const f of ["spend-intelligence.js","ledger-rules.js","net-worth.js","claims-tracker.js","renewal-monitor.js","recruiter-history.js","yield-compare.js","weekly-briefing.js"])
  vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const W=ctx.window,plain=x=>JSON.parse(JSON.stringify(x)),AS_OF="2026-11-03";

// ---------- Categorization and split rules ----------
const LR=W.IncomeOSLedgerRules;
const entries=[
  {id:"e1",kind:"outflow",type:"expense",payer:"Verizon Wireless",label:"Phone bill",amountUsd:"85.00",category:"other"},
  {id:"e2",kind:"outflow",type:"expense",payer:"Comcast",label:"Home internet",amountUsd:"100.01",category:"other"},
  {id:"e3",kind:"outflow",type:"expense",payer:"Anthropic",label:"Claude subscription",amountUsd:"20.00",category:"software",categoryConfirmed:true},
  {id:"e4",kind:"income",payer:"User Interviews",label:"Study payout",grossUsd:"150.00",feesUsd:0,category:"other"},
  {id:"e5",kind:"outflow",type:"expense",payer:"Acme Store",label:"Mixed purchase",amountUsd:"40.00",category:"other"}];
const rules=[
  {id:"phone",kind:"outflow",match:{vendorContains:"verizon"},category:"internet",businessUsePct:40,approvedOn:"2026-11-01"},
  {id:"internet-split",kind:"outflow",match:{vendorContains:"comcast"},split:[{category:"homeoffice",percent:33.3333},{category:"other",percent:66.6667}],approvedOn:"2026-11-01"},
  {id:"anthropic",kind:"outflow",match:{vendorContains:"anthropic"},category:"platform",approvedOn:"2026-11-01"},
  {id:"research",kind:"income",match:{vendorContains:"user interviews"},category:"research",approvedOn:"2026-11-01"},
  {id:"acme-a",kind:"outflow",match:{vendorContains:"acme"},category:"supplies",approvedOn:"2026-11-01"},
  {id:"acme-b",kind:"outflow",match:{vendorContains:"acme"},category:"equipment",approvedOn:"2026-11-01"},
  {id:"bad",kind:"outflow",match:{},category:"software",approvedOn:"2026-11-01"},
  {id:"unapproved",kind:"outflow",match:{vendorContains:"x"},category:"software"}];
let rp=LR.propose(entries,rules);
const byE=Object.fromEntries(rp.proposals.map(p=>[p.entryId,p]));
assert.equal(byE.e1.category,"internet");assert.equal(byE.e1.businessUsePct,40);assert.match(byE.e1.note,/not an approved deduction/);
assert.deepEqual(plain(byE.e2.split).map(s=>s.amountUsd).reduce((a,b)=>Math.round((a+b)*100)/100),100.01,"split sums exactly to the entry");
assert.ok(!byE.e3,"owner-confirmed category is never re-proposed");
assert.equal(byE.e4.category,"research");
assert.ok(!byE.e5);assert.equal(rp.exceptions[0].code,"RULES_CONFLICT","conflicting equal-specificity rules yield an exception, not a guess");
assert.ok(rp.invalidRules.some(r=>r.ruleId==="bad"&&r.problems.includes("RULE_MATCH_TOO_BROAD")));
assert.ok(rp.invalidRules.some(r=>r.ruleId==="unapproved"&&r.problems.includes("RULE_NOT_OWNER_APPROVED")));
assert.ok(rp.proposals.every(p=>p.status==="PROPOSED_FOR_OWNER_REVIEW"));
assert.deepEqual(plain(LR.validateRule({id:"split1",kind:"outflow",match:{vendorContains:"acme"},split:[{category:"software",percent:50},{category:"other",percent:40}],approvedOn:"2026-11-01"})),["SPLIT_PERCENT_NOT_100"]);
let applied=LR.apply(entries[1],byE.e2,"2026-11-03");
assert.equal(applied.entries.length,2);assert.equal(applied.entries[0].splitOf,"e2");assert.equal(applied.audit.after.splitInto.length,2);
assert.throws(()=>LR.apply(entries[0],byE.e2,"2026-11-03"),/does not belong/);
assert.throws(()=>LR.apply(entries[0],byE.e1,null),/acceptance date/);
assert.equal(entries[1].category,"other","original entry is not mutated");

// ---------- Net worth ----------
const NW=W.IncomeOSNetWorth;
const accounts=[{id:"chk",name:"Checking",type:"checking"},{id:"sav",name:"Savings",type:"savings"},{id:"brk",name:"Brokerage",type:"brokerage"},
  {id:"ira",name:"IRA",type:"retirement"},{id:"cc",name:"Card",type:"credit_card"},{id:"car",name:"Car",type:"vehicle"},{id:"hsa",name:"HSA",type:"hsa"}];
const balances=[
  {accountId:"chk",asOf:"2026-11-02",balanceUsd:"2500.00",source:"statement",sourceRef:"SYN-chk-oct"},
  {accountId:"sav",asOf:"2026-11-01",balanceUsd:"10000.00",source:"institution_export",sourceRef:"SYN-sav"},
  {accountId:"brk",asOf:"2026-11-02",balanceUsd:"12000.00",costBasisUsd:"10000.00",source:"statement",sourceRef:"SYN-brk"},
  {accountId:"ira",asOf:"2026-08-01",balanceUsd:"50000.00",source:"statement",sourceRef:"SYN-ira-q2"},
  {accountId:"cc",asOf:"2026-10-28",balanceUsd:"700.00",source:"statement",sourceRef:"SYN-cc"},
  {accountId:"car",asOf:"2026-06-01",balanceUsd:"9000.00",source:"owner_estimate",sourceRef:"owner estimate"},
  {accountId:"ghost",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:"x"},
  {accountId:"sav",asOf:"2026-11-05",balanceUsd:"1",source:"statement",sourceRef:"future"}];
let nw=NW.report(accounts,balances,AS_OF);
assert.equal(nw.totals.liquidUsd,12500);assert.equal(nw.totals.investedUsd,12000);assert.equal(nw.totals.unrealizedGainUsd,2000);
assert.equal(nw.totals.liabilitiesUsd,700);assert.equal(nw.totals.illiquidUsd,9000);assert.equal(nw.totals.ownerEstimatedUsd,9000);
assert.equal(nw.totals.netWorthUsd,12500+12000+9000-700);
assert.ok(nw.excluded.some(x=>x.accountId==="ira"&&x.code==="BALANCE_STALE"),"stale balance excluded, not carried");
assert.ok(nw.gaps.some(x=>x.accountId==="hsa"),"listed account without a balance is a coverage gap");
assert.ok(nw.issues.some(x=>x.code==="BALANCE_FOR_UNKNOWN_ACCOUNT")&&nw.issues.some(x=>x.code==="BALANCE_DATE_INVALID_OR_FUTURE"));
assert.equal(nw.complete,false);assert.match(nw.label,/^PARTIAL/);
const conflict=NW.report([{id:"a",type:"checking"}],[{accountId:"a",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:"r1"},{accountId:"a",asOf:"2026-11-01",balanceUsd:"2",source:"statement",sourceRef:"r2"}],AS_OF);
assert.ok(conflict.excluded.some(x=>x.code==="CONFLICTING_BALANCES"));
const nwComplete1=NW.report([{id:"a",type:"checking"}],[{accountId:"a",asOf:"2026-10-01",balanceUsd:"1000",source:"statement",sourceRef:"r"}],"2026-10-01");
const nwComplete2=NW.report([{id:"a",type:"checking"}],[{accountId:"a",asOf:"2026-11-01",balanceUsd:"1500",source:"statement",sourceRef:"r"}],"2026-11-01");
const ch=NW.change(nwComplete1,nwComplete2,[{amountUsd:"400"}]);
assert.equal(ch.netWorthChangeUsd,500);assert.equal(ch.unexplainedUsd,100);assert.equal(ch.comparable,true);

// ---------- Recovery claims ----------
const CL=W.IncomeOSClaims;
assert.ok(CL.SOURCES.every(s=>/^https:\/\//.test(s.url)));
assert.ok(CL.SOURCES.filter(s=>/UNCONFIRMED/.test(s.urlStatus)).length>=1,"unverified addresses are labelled, not presented as confirmed");
let due=CL.searchesDue(["MD","PA"],[{sourceId:"md-comptroller",searchedOn:"2026-09-01"}],AS_OF,180);
assert.ok(!due.some(d=>d.sourceId==="md-comptroller"),"searched within interval");
assert.ok(due.some(d=>d.sourceId==="missingmoney"&&d.reason==="NEVER_SEARCHED"));
assert.ok(due.some(d=>d.sourceId==="state-PA"));
let claim=CL.create({id:"c1",kind:"unclaimed_property",title:"MD property",openedOn:"2026-11-01",estimatedUsd:"120"});
assert.equal(claim.state,"SEARCH_DUE");
assert.equal(CL.transition(claim,{to:"PAID",on:"2026-11-02",evidenceRef:"x",amountUsd:120,bankRef:"b"}).ok,false,"cannot skip to paid");
let r1=CL.transition(claim,{to:"MATCH_FOUND",on:"2026-11-02",evidenceRef:"search screenshot ref"});assert.ok(r1.ok);
assert.equal(CL.transition(r1.claim,{to:"CLAIM_FILED",on:"2026-11-03"}).error,"EVIDENCE_REFERENCE_REQUIRED");
let c2=CL.transition(r1.claim,{to:"CLAIM_FILED",on:"2026-11-03",evidenceRef:"claim #123"}).claim;
c2=CL.transition(c2,{to:"APPROVED",on:"2026-11-10",evidenceRef:"approval letter"}).claim;
assert.equal(CL.transition(c2,{to:"PAID",on:"2026-11-20",evidenceRef:"check"}).error,"PAYMENT_AMOUNT_AND_BANK_REFERENCE_REQUIRED");
const paid=CL.transition(c2,{to:"PAID",on:"2026-11-20",evidenceRef:"deposit",amountUsd:"118.50",bankRef:"SYN-bank-77"}).claim;
const bill=CL.create({id:"c3",kind:"billing_error",title:"Double charge",openedOn:"2026-10-01",statementDate:"2026-09-10"});
const finder=CL.create({id:"c4",kind:"unclaimed_property",openedOn:"2026-10-01",feeUsd:"30",feeCharger:"finder service"});
let rv=CL.review([paid,paid,c2,bill,finder],"2026-11-03");
assert.equal(rv.recoveredUsd,118.5,"one bank reference counted once");
assert.ok(rv.warnings.some(w=>w.code==="BANK_REFERENCE_REUSED")&&rv.warnings.some(w=>w.code==="FINDER_FEE"));
assert.equal(rv.approvedNotYetPaidUsd,120);
assert.ok(rv.actions.some(a=>a.claimId==="c3"&&a.code==="DEADLINE_WITHIN_14_DAYS"&&a.deadline==="2026-11-09"));
assert.ok(rv.actions.some(a=>a.claimId==="c3"&&a.code==="FILE_CLAIM_ON_OFFICIAL_SITE"));

// ---------- Renewal monitor ----------
const RN=W.IncomeOSRenewals,INT=W.IncomeOSIntelligence;
const exp=(id,date,amt,payer)=>({id,kind:"outflow",type:"expense",date,amountUsd:amt,payer,label:payer,category:"software"});
const ledger=[exp("a1","2026-08-05","20","StreamCo"),exp("a2","2026-09-05","20","StreamCo"),exp("a3","2026-10-05","26","StreamCo"),
  exp("b1","2026-08-20","10","CloudDrive"),exp("b2","2026-09-20","10","CloudDrive"),exp("b3","2026-10-20","10","CloudDrive")];
const patterns=INT.recurring(ledger,AS_OF);
assert.equal(patterns.length,2);
const rr=RN.review(patterns,[{vendor:"StreamCo",necessary:false,cancelNoticeDays:1,lastUsedOn:"2026-06-01"},{vendor:"CloudDrive",necessary:true,lastUsedOn:"2026-01-01"}],AS_OF);
const sc=rr.items.find(i=>i.vendor==="StreamCo"),cd=rr.items.find(i=>i.vendor==="CloudDrive");
assert.ok(sc.flags.includes("PRICE_INCREASE")&&sc.flags.includes("UNUSED_90_DAYS_REVIEW")&&sc.flags.includes("CANCELLATION_NOTICE_DEADLINE_SOON"));
assert.equal(sc.proposal,"CANCELLATION_REVIEW_WITH_IMPACT_CHECK");assert.equal(sc.annualizedIncreaseUsd,72);
assert.equal(cd.proposal,"PRICE_REVIEW_ONLY","necessary service never proposed for cancellation");
assert.ok(!cd.flags.some(f=>/UNUSED/.test(f)));
assert.ok(RN.review(patterns,[{vendor:"StreamCo",necessary:false,cancelNoticeDays:3}],AS_OF).items.find(i=>i.vendor==="StreamCo").flags.includes("CANCELLATION_NOTICE_WINDOW_PASSED"));
assert.ok(RN.review(patterns,[],AS_OF).items.every(i=>i.flags.some(f=>/NO_OWNER_NOTE/.test(f))));

// ---------- Recruiter history ----------
const RH=W.IncomeOSRecruiterHistory;
const st=[];const rec={};
for(let k=1;k<=6;k++){const id="s"+k;rec[id]="Recruiter A";st.push({studyId:id,stage:"APPLIED",date:"2026-10-01",minutes:10});
  if(k<=3){st.push({studyId:id,stage:"INVITED",date:"2026-10-02"});st.push({studyId:id,stage:"COMPLETED",date:"2026-10-05",minutes:50});}
  if(k<=2)st.push({studyId:id,stage:"PAID",date:k===1?"2026-10-15":"2026-10-25"});}
rec.t1="Recruiter B";st.push({studyId:"t1",stage:"APPLIED",date:"2026-10-01"});
st.push({studyId:"orphan",stage:"APPLIED",date:"2026-10-01"});
let hist=RH.summarize(st,rec,{s1:100,s2:100,s3:0});
const A=hist.recruiters.find(r=>r.recruiter==="Recruiter A"),B=hist.recruiters.find(r=>r.recruiter==="Recruiter B");
assert.equal(A.observedInvitationRate,50);assert.equal(A.verifiedPaid,2);assert.equal(A.completedAwaitingVerifiedPayment,1);
assert.equal(A.medianDaysToPayment,15);assert.equal(A.observedPaymentRate,null,"3 completions is below the sample floor");
assert.equal(A.verifiedUsdPerRecordedHour,Math.round(20000/(210/60))/100);
assert.equal(B.observedInvitationRate,null);assert.match(B.status,/INSUFFICIENT_HISTORY/);
assert.equal(hist.unattributedStudies,1);
assert.doesNotMatch(JSON.stringify(hist),/probab/i);

// ---------- Yield comparison ----------
const YC=W.IncomeOSYieldCompare;
const offers=[
  {id:"hy",provider:"Bank A",product:"savings",apyPct:4.0,insurance:"FDIC",sourceUrl:"https://example.org/a",checkedOn:"2026-11-02"},
  {id:"tb",provider:"US Treasury",product:"treasury_bill",apyPct:3.9,termMonths:6,insurance:"US_TREASURY",sourceUrl:"https://example.org/t",checkedOn:"2026-11-02"},
  {id:"cd",provider:"Bank B",product:"cd",apyPct:4.6,termMonths:24,earlyPenaltyMonths:6,insurance:"FDIC",sourceUrl:"https://example.org/c",checkedOn:"2026-11-02"},
  {id:"old",provider:"Bank C",product:"savings",apyPct:5.5,insurance:"FDIC",sourceUrl:"https://example.org/o",checkedOn:"2026-10-01"},
  {id:"nolink",provider:"Bank D",product:"savings",apyPct:6,insurance:"FDIC",sourceUrl:"",checkedOn:"2026-11-02"},
  {id:"cdx",provider:"Bank E",product:"cd",apyPct:5,termMonths:24,insurance:"FDIC",sourceUrl:"https://example.org/e",checkedOn:"2026-11-02"}];
let yc=YC.compare(offers,{amountUsd:20000,horizonMonths:12,federalRatePct:22,stateRatePct:5},AS_OF);
const yr=Object.fromEntries(yc.ranked.map(r=>[r.id,r]));
assert.equal(yr.hy.afterTaxYieldPct,2.92,"bank interest taxed federal + state");
assert.equal(yr.tb.afterTaxYieldPct,3.042,"Treasury interest exempt from state tax");
assert.ok(yr.tb.effectiveAfterTaxPct>yr.hy.effectiveAfterTaxPct,"state exemption changes the ranking");
assert.ok(yr.cd.flags.includes("EARLY_WITHDRAWAL_PENALTY_APPLIED"));assert.equal(yr.cd.effectiveAfterTaxPct,r4((4.6-2.3)*0.73));
assert.ok(yc.excluded.some(e=>e.id==="old"&&e.reasons.includes("OFFER_STALE")));
assert.ok(yc.excluded.some(e=>e.id==="nolink"&&e.reasons.includes("SOURCE_URL_MISSING")));
assert.ok(yc.excluded.some(e=>e.id==="cdx"&&e.reasons.includes("EARLY_PENALTY_UNKNOWN")));
let liq=YC.compare(offers,{amountUsd:300000,horizonMonths:12,federalRatePct:22,stateRatePct:5,needLiquidity:true},AS_OF);
assert.ok(liq.ranked.every(r=>r.liquid));assert.ok(liq.ranked.find(r=>r.id==="hy").flags.includes("ABOVE_INSURANCE_LIMIT_AT_ONE_INSTITUTION"));
assert.throws(()=>YC.compare(offers,{amountUsd:1000,horizonMonths:12},AS_OF),/marginal rates/);
const lad=YC.ladder(10000.01,4,6,"2026-11-03");
assert.equal(lad.rungs.reduce((a,r)=>a+Math.round(r.amountUsd*100),0),1000001);assert.equal(lad.rungs[3].maturesOn,"2028-11-03");
function r4(x){return Math.round(x*10000)/10000;}

// ---------- Weekly briefing ----------
const WB=W.IncomeOSWeeklyBriefing;
const quiet=WB.build({claims:{actions:[],warnings:[],recoveredUsd:0},renewals:{items:[]},rules:{proposals:[],exceptions:[]},
  discoveryReceipt:{finishedAt:"2026-11-03T10:00:00Z",summary:{ok:5,failed:0},connectors:[]},income:{verifiedUsd:0}},AS_OF);
assert.equal(quiet.notify,false);assert.equal(quiet.summary,"Nothing needs you this week");
const busy=WB.build({screen:{eligible:[{opportunity:{opportunityId:"o1",title:"Policy evaluator",platform:"Mercor",deadline:"2026-11-06",sourceUrl:"https://x"},economics:{effectiveHourlyUsd:57.14}}],pending:[{}]},
  claims:rv,renewals:rr,rules:rp,netWorth:nw,income:{verifiedUsd:400},discoveryReceipt:{finishedAt:"2026-10-20T00:00:00Z",summary:{ok:0,failed:6},connectors:[{sourceId:"gh-x",status:"error",error:"HTTP_503"}]}},AS_OF);
assert.equal(busy.notify,true);assert.equal(busy.answers.eligibleOpportunities,1);assert.equal(busy.answers.highestValue[0].effectiveHourlyUsd,57.14);
assert.equal(busy.answers.verified.incomeUsd,400);assert.equal(busy.answers.verified.recoveredUsd,118.5);
assert.ok(busy.answers.needsYou[0].priority===1);
assert.ok(busy.answers.needsYou.some(a=>/Deadline 2026-11-06/.test(a.text)));
assert.ok(busy.answers.needsYou.some(a=>a.area==="system"));
assert.ok(busy.answers.systemHealth.some(h=>!h.ok));
const repeat=WB.build({screen:{eligible:[{opportunity:{opportunityId:"o1",title:"t",platform:"p",deadline:null},economics:{effectiveHourlyUsd:50}}],pending:[]},discoveryReceipt:{finishedAt:"2026-11-03T00:00:00Z",summary:{ok:1,failed:0},connectors:[]},previousAlertIds:["o1"]},AS_OF);
assert.equal(repeat.notify,false,"an already-reported opportunity does not re-notify");

// ---------- Third review, 2026-11-03 (each shown failing on 88a5ec2) ----------
{const T=AS_OF,CL2=CL,YC2=YC;const LR2=LR,NW2=NW,WB2=WB;
const review3={
 "split near-100% rejected":()=>LR2.validateRule({id:"sp1",kind:"outflow",match:{vendorContains:"acme"},split:[{category:"software",percent:33.3334},{category:"other",percent:33.3334},{category:"supplies",percent:33.3334}],approvedOn:T}).includes("SPLIT_PERCENT_NOT_100"),
 "punctuation-only rule too broad":()=>LR2.validateRule({id:"star",kind:"outflow",match:{vendorContains:"*"},category:"software",approvedOn:T}).includes("RULE_MATCH_TOO_BROAD"),
 "state search clears due item":()=>!CL2.searchesDue(["MD","PA"],[{sourceId:"state-PA",searchedOn:"2026-10-01"}],T,180).some(d=>d.sourceId==="state-PA"),
 "net worth does not mutate input":()=>{const b=[{accountId:"a",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:"r"},{accountId:"a",asOf:"2026-11-01",balanceUsd:"2",source:"statement",sourceRef:"r2"}];NW2.report([{id:"a",type:"checking"}],b,T);return !("conflict" in b[0])&&!("conflict" in b[1]);},
 "invalid cost basis not NaN":()=>{const r=NW2.report([{id:"b",type:"brokerage"}],[{accountId:"b",asOf:"2026-11-02",balanceUsd:"100",costBasisUsd:"n/a",source:"statement",sourceRef:"r"}],T);return r.lines[0].unrealizedUsd===null;},
 "past deadline not urgent":()=>!WB2.build({screen:{eligible:[{opportunity:{opportunityId:"o",title:"Old",platform:"P",deadline:"2026-10-01"},economics:{effectiveHourlyUsd:50}}],pending:[]},previousAlertIds:["o"]},T).answers.needsYou.some(a=>/Deadline/.test(a.text)),
 "finder fee on paid claim silent":()=>{let c=CL2.create({id:"c1",kind:"refund",openedOn:"2026-10-01",feeUsd:"50",feeCharger:"finder"});c=CL2.transition(c,{to:"CLAIM_FILED",on:"2026-10-02",evidenceRef:"x"}).claim;c=CL2.transition(c,{to:"APPROVED",on:"2026-10-03",evidenceRef:"x"}).claim;c=CL2.transition(c,{to:"PAID",on:"2026-10-04",evidenceRef:"x",amountUsd:"10",bankRef:"b"}).claim;return CL2.review([c],T).warnings.length===0;},
 "I bond 12-month lock":()=>YC2.compare([{id:"ib",provider:"TD",product:"i_bond",apyPct:4,termMonths:360,insurance:"US_TREASURY",sourceUrl:"https://example.org/i",checkedOn:T}],{amountUsd:10000,horizonMonths:6,federalRatePct:22,stateRatePct:5},T).excluded.some(e=>e.reasons.includes("I_BOND_LOCKED_FOR_12_MONTHS")),
 "I bond 3-month penalty":()=>{const r=YC2.compare([{id:"ib",provider:"TD",product:"i_bond",apyPct:4,termMonths:360,insurance:"US_TREASURY",sourceUrl:"https://example.org/i",checkedOn:T}],{amountUsd:10000,horizonMonths:24,federalRatePct:22,stateRatePct:5},T).ranked[0];return r&&r.flags.includes("I_BOND_3_MONTH_INTEREST_PENALTY_APPLIED")&&r.effectiveAfterTaxPct<r.afterTaxYieldPct;},
 "CD loss shown as loss":()=>{const r=YC2.compare([{id:"cd",provider:"B",product:"cd",apyPct:4,termMonths:60,earlyPenaltyMonths:12,insurance:"FDIC",sourceUrl:"https://example.org/c",checkedOn:T}],{amountUsd:10000,horizonMonths:3,federalRatePct:22,stateRatePct:5},T).ranked[0];return r.estimatedAfterTaxEarningsUsd<0&&r.flags.includes("LOSES_MONEY_AT_THIS_HORIZON");},
 "no blank renewal line":()=>!WB2.build({renewals:{items:[{vendor:"netflix",flags:["NO_OWNER_NOTE: mark whether this service is necessary"],annualizedIncreaseUsd:null}]}},T).answers.needsYou.some(a=>/^netflix: $/.test(a.text))};
for(const [k,f] of Object.entries(review3))assert.equal(f(),true,"review 3: "+k);}
console.log("IncomeOS plan-feature QA passed (synthetic data): rules and splits, net worth coverage, recovery claims, renewals, recruiter history, after-tax yields, weekly briefing");
