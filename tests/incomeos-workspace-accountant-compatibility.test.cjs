"use strict";
// Cross-component contract: the shared workspace and programme forms must
// generate rows accepted by the existing accountant, without bank claims.
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const {runInNewContext}=require("node:vm");
const load=require("./incomeos-browser-script-loader.cjs");
const context={window:{},Date,Intl,Math,Number,Array,Object,Set,JSON,String,console};
runInNewContext(readFileSync(resolve(__dirname,"../owner/incomeos/accountant.js"),"utf8"),context);
const accountant=context.window.IncomeOSAccountant;
const workspace=load("workspace-store.js","IncomeOSWorkspace");
load("ds-program.js","IncomeOSDSProgram");
const date="2026-11-08";
const input={date,payer:"Synthetic contract vendor",label:"Synthetic entry",amountUsd:"25.00",category:"software"};
test("workspace expenses and programme costs satisfy the accountant's complete row contract",()=>{
  for(const dsDimension of [undefined,"software_api"]){
    const ws=workspace.addRecord(workspace.newWorkspace(date),"ledger",{...input,kind:"outflow",dsDimension},date);
    const row=ws.ledger[0];
    assert.equal(accountant.validateEntry(row),true);
    assert.equal(row.businessUse,null,"Unknown allocation cannot become a deduction percentage");
    assert.equal(row.paymentStatus,"scheduled","Missing payment evidence cannot become a recorded paid expense");
    assert.equal(row.evidenceStatus,"missing");
    assert.equal(row.source,"manual");
    if(dsDimension)assert.equal(row.program,"decision-spellchecker");
  }
});
test("workspace income remains expected unless the owner explicitly records receipt",()=>{
  for(const state of [undefined,"expected","paid"]){
    const ws=workspace.addRecord(workspace.newWorkspace(date),"ledger",{...input,kind:"income",category:"research",status:state},date);
    const row=ws.ledger[0];
    assert.equal(accountant.validateEntry(row),true);
    assert.equal(row.status,state||"expected");
    assert.equal(row.scope,"income");assert.equal(row.evidenceStatus,"missing");
    assert.equal(row.bankRef,undefined,"An owner-entered receipt is not bank verification");
  }
});
test("explicit expense payment status is preserved and unsupported statuses are refused",()=>{
  const paid=workspace.addRecord(workspace.newWorkspace(date),"ledger",{...input,kind:"outflow",paymentStatus:"paid"},date).ledger[0];
  assert.equal(paid.paymentStatus,"paid");assert.equal(accountant.validateEntry(paid),true);
  for(const kind of ["income","outflow"]){
    assert.throws(()=>workspace.addRecord(workspace.newWorkspace(date),"ledger",{
      ...input,kind,category:kind==="income"?"research":"software",status:"bank-verified",paymentStatus:"bank-verified"
    },date),/Unsupported payment status/);
  }
});
test("deleting an older row cannot cause the next generated identifier to collide",()=>{
  let ws=workspace.newWorkspace(date);
  for(let n=0;n<3;n++)ws=workspace.addRecord(ws,"ledger",{...input,kind:"outflow"},date);
  ws=workspace.setLedger(ws,ws.ledger.slice(1),date);
  const earlierIds=new Set(ws.ledger.map(row=>row.id));
  const next=workspace.addRecord(ws,"ledger",{...input,kind:"outflow"},date);
  assert.equal(new Set(next.ledger.map(row=>row.id)).size,3);
  assert.equal(earlierIds.has(next.ledger.at(-1).id),false);
});

test("rate offer identifiers remain unique when an older offer has been removed",()=>{
  const input={provider:"Synthetic provider",product:"savings",apyPct:2,sourceUrl:"https://example.org/rates"};
  let ws=workspace.newWorkspace(date);
  for(let n=0;n<3;n++)ws=workspace.addRecord(ws,"offers",input,date);
  ws.offers=ws.offers.slice(1);
  const ids=new Set(ws.offers.map(offer=>offer.id));
  const next=workspace.addRecord(ws,"offers",input,date);
  assert.equal(new Set(next.offers.map(offer=>offer.id)).size,3);
  assert.equal(ids.has(next.offers.at(-1).id),false);
});
