// Synthetic investment distribution, capital and reinvestment attribution.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const sandbox={window:{},crypto:webcrypto,Date,JSON,Array,Map,Set,Math,Object,Number,String,Uint8Array,TextEncoder,Error};
for(const path of ["financial-event-journal.js","investment-cashflow.js"]){
 const source=read(path);new Script(source);runInNewContext(source,sandbox);
}
const J=sandbox.window.IncomeOSEventJournal, I=sandbox.window.IncomeOSInvestmentCashflow;
let journal=[];
async function post(name,amountCents,classification){
 const labels=["capital_contribution","tax_payment","business_expense","personal_expense","transfer_out"];
 const direction=labels.includes(classification)?"debit":"credit";
 const date="2026-11-01",timestamp="2026-11-01T20:40:00.000Z",id="post."+name,doc="document."+name;
 const x=(id,type,data)=>({id,type,timestamp,data});
 journal=await J.append(journal,x(id,"POSTED",{sourceId:"bank."+name,postedDate:date,direction,amountCents,currency:"USD",evidenceId:"bank.statement.001"}));
 journal=await J.append(journal,x("class."+name,"CLASSIFIED",{postedEventId:id,classification,evidenceId:"owner.classification.001"}));
 journal=await J.append(journal,x("doc."+name,"DOCUMENT_MATCHED",{postedEventId:id,documentId:doc,amountCents}));
 journal=await J.append(journal,x("review."+name,"OWNER_RECONCILED",{postedEventId:id,classificationEventId:"class."+name,reviewEvidenceId:"owner.review.001"}));
 return {id,doc};
}
const acq=await post("asset.funded.001",5000,"capital_contribution");
const dist=await post("asset.dividend.001",500,"investment_income");
const redeploy=await post("asset.reinvest.001",500,"capital_contribution");
const roc=await post("asset.roc.001",300,"returned_principal");
const sale=await post("asset.sale.001",1000,"sale_proceeds");
const assetId="asset.synthetic.1001";
const movement=(id,kind,amountCents,p)=>({id,kind,assetId,date:"2026-11-01",amountCents,
 bankEventId:p.id,documentId:p.doc,evidenceId:"operator.source.001"});
const records=[
 movement("move.funded.001","CAPITAL_DEPLOYED",5000,acq),
 movement("move.dividend.001","DISTRIBUTION",500,dist),
 movement("move.reinvest.001","CAPITAL_DEPLOYED",500,redeploy),
 movement("move.roc.001","RETURNED_PRINCIPAL",300,roc),
 movement("move.sale.001","SALE_PROCEEDS",1000,sale),
 {id:"move.reinvest.link.001",kind:"REINVESTMENT_LINK",assetId,date:"2026-11-01",
 distributionId:"move.dividend.001",deploymentId:"move.reinvest.001",evidenceId:"operator.reinvest.001"}
];
let result=await I.analyze(records,journal,"2026-11-01");
assert.equal(result.acceptedMovements,5);
assert.equal(result.ownerReviewedCashIncomeCents,500);
assert.equal(result.ownerReviewedCapitalDeployedCents,5500);
assert.equal(result.ownerReviewedReturnedPrincipalCents,300);
assert.equal(result.ownerReviewedSaleProceedsCents,1000);
assert.equal(result.linkedPotentialReinvestmentsCents,500);
assert.equal(result.linkedReinvestmentPairs,1);
assert.equal(result.assets[0].investmentIncomeCents,500);
assert.equal(result.assets[0].capitalDeployedCents,5500);
assert.equal(result.assets[0].marketValueCents,null);
assert.equal(result.assets[0].realizedGainCents,null);
assert.equal(result.gate.status,"HOLD","Sale proceeds with unknown cost basis are not realized gains");
assert.ok(result.issues.some(x=>x.code==="SALE_BASIS_AND_LOTS_NOT_ESTABLISHED"));
assert.equal(result.gate.providerReinvestmentVerified,false);
assert.equal(result.gate.executable,false);
assert.equal(result.gate.bankOrBrokerIndependentlyAuthenticated,false);
result=await I.analyze(records.filter(x=>x.kind!=="SALE_PROCEEDS"),journal,"2026-11-01");
assert.equal(result.gate.status,"OWNER_SOURCE_LINKED_REVIEW_ONLY");
assert.equal(result.ownerReviewedCashIncomeCents,500);
assert.equal(result.ownerReviewedSaleProceedsCents,0);
assert.equal(result.gate.completePositionInventory,false);
assert.equal(result.assets[0].estimatedUnreturnedPrincipalCents,null);
result=await I.analyze(records.filter(x=>x.kind!=="REINVESTMENT_LINK"),journal,"2026-11-01");
assert.equal(result.linkedPotentialReinvestmentsCents,0,"A purchase is not automatically a reinvestment");
result=await I.analyze(records.concat(records[5].id==="bad"?[]:[{...records[5],id:"move.reinvest.link.002"}]),journal,"2026-11-01");
assert.ok(result.issues.some(x=>x.code==="DUPLICATED_REINVESTMENT_LINK"));
result=await I.analyze([records[0],{...records[0],id:"move.duplicate.001"}],journal,"2026-11-01");
assert.equal(result.acceptedMovements,1);
assert.ok(result.issues.some(x=>x.code==="BANK_POSTING_ALREADY_ATTRIBUTED"));
result=await I.analyze([{...records[1],amountCents:999}],journal,"2026-11-01");
assert.equal(result.ownerReviewedCashIncomeCents,0);
assert.ok(result.issues.some(x=>x.code==="BANK_AMOUNT_OR_DIRECTION_MISMATCH"));
result=await I.analyze([{...records[1],documentId:"unrelated.document.001"}],journal,"2026-11-01");
assert.equal(result.ownerReviewedCashIncomeCents,0);
assert.ok(result.issues.some(x=>x.code==="INVESTMENT_EVIDENCE_NOT_MATCHED"));
result=await I.analyze([{...records[0],kind:"DISTRIBUTION"}],journal,"2026-11-01");
assert.equal(result.ownerReviewedCashIncomeCents,0);
assert.ok(result.issues.some(x=>x.code==="BANK_AMOUNT_OR_DIRECTION_MISMATCH"));
result=await I.analyze([movement("move.external.principal.001","RETURNED_PRINCIPAL",300,roc)],journal,"2026-11-01");
assert.ok(result.issues.some(x=>x.code==="PREEXISTING_CAPITAL_OR_BASIS_NOT_IMPORTED"));
await assert.rejects(I.analyze([records[0],{...records[0]}],journal,"2026-11-01"),/Duplicate investment movement/);
await assert.rejects(I.analyze([{...records[0],date:"2026-11-02"}],journal,"2026-11-01"),/Future-dated/);
await assert.rejects(I.analyze([{...records[0],bankPassword:"secret"}],journal,"2026-11-01"),/unsupported fields/);
await assert.rejects(I.analyze([{...records[1],amountCents:-2}],journal,"2026-11-01"),/Cash movement needs cents/);
const damaged=JSON.parse(JSON.stringify(journal));damaged[0].data.amountCents=1;
await assert.rejects(I.analyze(records,damaged,"2026-11-01"),/modified/);
assert.doesNotMatch(read("investment-cashflow.js"),/fetch\s*\(|localStorage|XMLHttpRequest|sendBeacon|WebSocket/);
console.log("IncomeOS investment-cashflow QA passed: source-linked distributions, ROC, capital, sale-basis holds, reinvestment linkage, and duplicate prevention.");
