// Financial CSV import integrity, entirely synthetic. No real owner data is embedded.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const source=readFileSync(resolve("owner/incomeos/accountant.js"),"utf8");
new Script(source);
const memory=new Map();
let storageFailure=true,alerts=[];
const storage={
 getItem:k=>memory.get(k)??null,
 setItem(k,v){if(storageFailure)throw Error("Synthetic storage quota");memory.set(k,v);},
 removeItem:k=>memory.delete(k)
};
const nodes=new Map();
function node(){
 return {value:"",textContent:"",style:{},children:[],className:"",
   appendChild(x){this.children.push(x);return x;},
   replaceChildren(...args){this.children=args;},
   addEventListener(){},setAttribute(){},remove(){},click(){}};
}
const doc={getElementById(id){
 if(!nodes.has(id)){const x=node();if(id==="report-year")x.value="2026";nodes.set(id,x);}
 return nodes.get(id);
},createElement:()=>node()};
const ctx={window:{IncomeOSFinancialReadOnly:false},localStorage:storage,
 document:doc,Date,Intl,Math,Number,String,Array,Object,Set,Map,JSON,console,
 alert:x=>alerts.push(String(x)),confirm:()=>true};
runInNewContext(source,ctx);
const accountant=ctx.window.IncomeOSAccountant;
const header="kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes,evidence_status";
const row=(date,amount,ref,allocation="")=>["expense",date,"Synthetic fee","Synthetic Vendor","software",amount,"paid",allocation,ref,"SYNTHETIC","both-unverified"].join(",");
const csv=[header,row("2026-10-12","15.50","source.synthetic.1"),row("2026-10-13","20.75","source.synthetic.2")].join("\n");
assert.throws(()=>accountant.importCsv(csv),/No ledger update was accepted/);
assert.equal(accountant.entriesForAnalysis().length,0,"Failed storage write cannot create phantom accepted entries");
assert.equal(memory.has("incomeos.accountant.v1"),false);
storageFailure=false;
let imported=accountant.importCsv(csv);
assert.equal(imported.accepted,2);
assert.equal(imported.skipped,0);
let rows=accountant.entriesForAnalysis();
assert.equal(rows.length,2);
assert.equal(Math.round(rows.reduce((s,r)=>s+r.amountUsd,0)*100),3625);
assert.equal(rows[0].reconciled,false,"CSV ingestion cannot mark evidence reconciled");
assert.equal(rows[0].businessUse,null,"Blank business use is unknown, not a tax deduction");
const stored=JSON.parse(memory.get("incomeos.accountant.v1"));
assert.equal(stored.entries.length,2);
assert.equal(stored.entries[0].reference,"source.synthetic.1");
imported=accountant.importCsv(csv);
assert.equal(imported.accepted,0);
assert.equal(imported.skipped,2,"Reimport must be idempotent for identical source references");
assert.equal(accountant.entriesForAnalysis().length,2);
storageFailure=true;
const another=[header,row("2026-10-14","4.10","source.synthetic.3")].join("\n");
assert.throws(()=>accountant.importCsv(another),/No ledger update was accepted/);
assert.equal(accountant.entriesForAnalysis().length,2,"Storage quota failure cannot inflate account totals");
assert.equal(JSON.parse(memory.get("incomeos.accountant.v1")).entries.length,2);
storageFailure=false;
const noDate=[header,row("2026-02-30","4.10","source.synthetic.bad.date")].join("\n");
assert.equal(accountant.importCsv(noDate).rejected,1,"Nonexistent calendar date must be rejected");
assert.equal(accountant.entriesForAnalysis().length,2);
const duplicateHeader=header.replace("amount_usd","date");
assert.throws(()=>accountant.importCsv([duplicateHeader,row("2026-10-15","1.00","source.synthetic.4")].join("\n")),/CSV headers must match/);
assert.throws(()=>accountant.importCsv([header+",personal_email",row("2026-10-15","1.00","source.synthetic.4")+",private@example.org"].join("\n")),/CSV headers must match/);
ctx.window.IncomeOSFinancialReadOnly=true;
assert.throws(()=>accountant.importCsv(another),/disabled in unapproved staging/);
assert.equal(accountant.entriesForAnalysis().length,2);
assert.equal(memory.size,1);
assert.equal(accountant.totals(rows).allocationPending,2);
assert.doesNotMatch(source,/<script[^>]*src=["']https?:/);
console.log("IncomeOS ledger persistence QA passed: quota failure leaves memory unchanged; imports idempotent, exact calendar validation, strict CSV headers, allocations unknown, and staging imports denied.");
