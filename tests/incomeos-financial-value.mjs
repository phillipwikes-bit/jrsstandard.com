// End-to-end synthetic financial-benefit attribution. Not real owner accounts.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const source=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const files=["financial-event-journal.js","research-outcomes.js","recovery-engine.js","financial-value.js"];
const ctx={window:{},Date,JSON,Array,Map,Set,Math,Object,Number,String,Uint8Array,TextEncoder,Error,crypto:webcrypto};
for(const f of files){const c=source(f);new Script(c);runInNewContext(c,ctx);}
const J=ctx.window.IncomeOSEventJournal,V=ctx.window.IncomeOSFinancialValue;
const stamp="2026-11-01T22:15:00.000Z",raw=(id,type,data)=>({id,type,timestamp:stamp,data});
let history=[];
async function addPayment(name,amountCents,classification,document){
 const p="post."+name,c="class."+name,rv="review."+name;
 history=await J.append(history,raw(p,"POSTED",{sourceId:"bank."+name+".0001",postedDate:"2026-11-01",direction:classification==="business_expense"?"debit":"credit",amountCents,currency:"USD",evidenceId:"bank.statement.001"}));
 history=await J.append(history,raw(c,"CLASSIFIED",{postedEventId:p,classification,evidenceId:"owner.classification.001"}));
 if(document)history=await J.append(history,raw("doc."+name,"DOCUMENT_MATCHED",{postedEventId:p,documentId:document,amountCents}));
 history=await J.append(history,raw(rv,"OWNER_RECONCILED",{postedEventId:p,classificationEventId:c,reviewEvidenceId:"owner.review.001"}));
}
await addPayment("research",12500,"earned_income","study.payment.001");
await addPayment("interest",600,"investment_income");
await addPayment("refund",5000,"refund");
await addPayment("principal",7000,"returned_principal");
await addPayment("sale",30000,"sale_proceeds");
await addPayment("expense",6000,"business_expense");
const stage=(id,stage,minutes=null,extra={})=>({id,studyId:"study.example.001",stage,date:"2026-11-01",evidenceId:"owner.stage.001",minutes,...extra});
const stages=[
 stage("stage.applied.001","APPLIED",15),stage("stage.completed.001","COMPLETED",45),
 stage("stage.accepted.001","ACCEPTED",0),
 stage("stage.paid.001","PAID",0,{bankEventId:"post.research",payoutDocumentId:"study.payment.001"})
];
const bill=(month,amountUsd)=>({provider:"Synthetic Utility",service:"Equivalent monthly plan",month,amountUsd,
 confirmedEquivalentService:true,sourceStatus:"owner-reviewed-bill-and-bank"});
const args={journal:history,studyStages:stages,paidBills:[bill("2026-08",100),bill("2026-09",80),bill("2026-10",80)],asOf:"2026-11-01"};
let result=await V.summarize(args);
assert.equal(result.ownerReviewedEarnedIncomeUsd,125);
assert.equal(result.ownerReviewedInvestmentIncomeUsd,6);
assert.equal(result.ownerReviewedCashIncomeUsd,131);
assert.equal(result.researchReceiptsWithinEarnedIncomeUsd,125);
assert.equal(result.ownerReviewedRefundsUsd,50);
assert.equal(result.ownerReviewedReturnedPrincipalUsd,70);
assert.equal(result.ownerReviewedSaleProceedsUsd,300);
assert.equal(result.observedBillSavingsTwoCyclesUsd,40);
assert.equal(result.moneyAvailableToInvestUsd,null);
assert.equal(result.netAfterTaxBenefitUsd,null);
assert.equal(result.recurringSavingsFutureGuaranteedUsd,null);
assert.equal(result.controls.bankStatementsComplete,false);
assert.equal(result.controls.ownerIdentityVerified,false);
assert.equal(result.controls.independentAudit,false);
assert.equal(result.controls.appliedProviderReinvestment,false);
assert.equal(result.financialOutcomeStatus,"OWNER_REVIEWED_ONLY_NOT_EXTERNALLY_VERIFIED");
assert.equal(result.documentation.attributedResearchStudies,1);
assert.equal(result.documentation.activePostedTransactions,6);
const noSavings=await V.summarize({...args,paidBills:args.paidBills.slice(0,2)});
assert.equal(noSavings.observedBillSavingsTwoCyclesUsd,0);
const noStudy=await V.summarize({...args,studyStages:[]});
assert.equal(noStudy.researchReceiptsWithinEarnedIncomeUsd,0);
assert.equal(noStudy.ownerReviewedEarnedIncomeUsd,125);
const noJournal=await V.summarize({...args,journal:[]});
assert.equal(noJournal.ownerReviewedCashIncomeUsd,0);
assert.equal(noJournal.researchReceiptsWithinEarnedIncomeUsd,0);
assert.equal(noJournal.documentation.activePostedTransactions,0);
await assert.rejects(V.summarize({...args,asOf:"2026-02-30"}),/as-of/);
await assert.rejects(V.summarize({...args,paidBills:{}}),/arrays/);
const tampered=JSON.parse(JSON.stringify(history));tampered[0].data.amountCents=1;
await assert.rejects(V.summarize({...args,journal:tampered}),/modified/);
const original=source("financial-value.js");
assert.doesNotMatch(original,/fetch\s*\(|localStorage|sendBeacon|XMLHttpRequest|WebSocket/);
console.log("IncomeOS financial-value QA passed: separate earned/investment income, nonincome principal, research subset, documented bill savings, evidence gates and no fabricated net benefit.");
