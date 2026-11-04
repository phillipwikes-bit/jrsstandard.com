// Synthetic-only regression checks for the review of owner/incomeos/accountant.js.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const src=readFileSync("owner/incomeos/accountant.js","utf8");
const prompts=[];
const sb={window:{},Intl,Date,Number,Math,String,Array,Object,Set,Map,JSON,console,confirm:m=>{prompts.push(m);return false;}};
runInNewContext(src,sb);
const A=sb.window.IncomeOSAccountant;
const header="kind,date,description,vendor,category,amount_usd,status,business_use_pct,evidence_ref,notes";
// R10-4: line items of one invoice share its reference but are not duplicates.
A.importCsv([header,
  "expense,2026-10-02,Seat licences,Vendor,software,120.00,paid,100,INV-1001,line 1",
  "expense,2026-10-02,Support plan,Vendor,software,40.00,paid,100,INV-1001,line 2",
  "expense,2026-10-02,Seat licences,Vendor,software,120.00,paid,100,INV-1001,line 1 again"].join("\n"));
assert.match(prompts.pop(),/Import 2 new records\? .* 1 possible duplicates skipped/,"two line items kept, the exact repeat skipped");
// R10-3: a backup whose records lack unique identifiers is refused.
const entry={kind:"outflow",type:"expense",label:"Synthetic",date:"2026-10-02",category:"software",amountUsd:5,businessUse:null};
assert.throws(()=>A.importJson(JSON.stringify({format:"incomeos-accountant",version:2,entries:[entry,{...entry,label:"Second"}]})),/unique identifier/);
assert.throws(()=>A.importJson(JSON.stringify({format:"incomeos-accountant",version:2,entries:[{...entry,id:"x1"},{...entry,id:"x1",label:"Dup"}]})),/unique identifier/);
A.importJson(JSON.stringify({format:"incomeos-accountant",version:2,entries:[{...entry,id:"x1"},{...entry,id:"x2"}]}));
assert.match(prompts.pop(),/Restore 2 entries/);
// R10-5: missing review definitions cannot break the summary or the printed report.
assert.doesNotMatch(src,/window\.IncomeOSAccountantReview\.definitions/);
// R10-6: no empty exception file for a year without records.
assert.match(src,/An empty exception file would look like a clean year/);
// R10-9: dead helper removed.
assert.doesNotMatch(src,/function escapePrint/);
// Completeness: any gap makes the year INCOMPLETE; the notice never implies approval or filing readiness.
{const c=A.completeness([{kind:"income",status:"pending",scope:"income",reconciled:true},{kind:"outflow",type:"expense",businessUse:null,evidenceStatus:"missing",reconciled:false}]);
 assert.equal(c.status,"INCOMPLETE");assert.ok(c.open>=3);assert.match(c.notice,/Not reviewed or approved by an accountant and not ready for tax filing/);
 assert.equal(A.completeness([]).status,"NO RECORDS");
 assert.equal(A.completeness([{kind:"outflow",type:"expense",businessUse:50,evidenceStatus:"both",reconciled:true}]).status,"NO OPEN GAPS IN RECORDED ENTRIES");}
assert.match(src,/Record completeness: /,"printed report shows completeness");
assert.match(src,/pairs\.unshift\(\["Report status"/,"summary CSV leads with the report status");
console.log("IncomeOS accountant review checks passed.");
