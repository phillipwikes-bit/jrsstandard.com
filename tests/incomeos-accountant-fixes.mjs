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
// Payment states: only received ("paid") counts; outstanding and closed states never do.
{const inc=(status,g)=>({kind:"income",scope:"income",status,grossUsd:g,feesUsd:0,label:"x",date:"2026-10-01",category:"research"});
 const t=A.totals([inc("paid",100),inc("expected",200),inc("invoiced",300),inc("disputed",400),inc("pending",500),inc("refunded",60),inc("cancelled",70)]);
 assert.equal(t.gross,100,"only received counts as income");assert.equal(t.pendingCount,4);assert.equal(t.closedCount,2);assert.equal(t.closedNotIncome,130);
 for(const st of ["expected","invoiced","disputed","refunded","cancelled"])assert.equal(A.validateEntry({...inc(st,10)}),true,st);
 assert.equal(A.validateEntry({...inc("received",10)}),false,"stored received state is 'paid'");}
// CSV import: "received" means received; anything unrecognized becomes expected, never received.
A.importCsv([header,"income,2026-10-05,Study A,Rec,research,50.00,received,,REF-A,","income,2026-10-06,Study B,Rec,research,60.00,invoiced,,REF-B,","income,2026-10-07,Study C,Rec,research,70.00,maybe,,REF-C,"].join("\n"));
assert.match(prompts.pop(),/Import 3 new records/);
assert.match(src,/function importStatus\(x\)\{var s=String\(x\|\|""\)\.trim\(\)\.toLowerCase\(\);if\(s==="received"\)return "paid";return STATUS\.indexOf\(s\)>=0\?s:"expected";\}/);
// Expense payment states: only paid expenses count; a record without a state counts as paid.
{const ex=(st,a)=>({kind:"outflow",type:"expense",category:"software",amountUsd:a,businessUse:null,label:"x",date:"2026-10-01",...(st?{paymentStatus:st}:{})});
 const t=A.totals([ex(null,10),ex("paid",20),ex("scheduled",300),ex("disputed",400),ex("refunded",500)]);
 assert.equal(t.expenses,30,"only paid (or legacy) expenses count");assert.equal(t.unpaidOutflowCount,3);assert.equal(t.unpaidOutflowUsd,1200);
 assert.equal(A.validateEntry(ex("bogus",1)),false);
 assert.equal(A.validateEntry({...ex("paid",1),accountantQuestions:"Is this deductible?"}),true);
 assert.equal(A.validateEntry({...ex("paid",1),accountantQuestions:"q".repeat(501)}),false);
 const c=A.completeness([ex("scheduled",5),{...ex("paid",5),accountantQuestions:"q"}]);
 assert.ok(c.gaps.some(g=>/scheduled, disputed or refunded/.test(g[0])&&g[1]===1));assert.ok(c.gaps.some(g=>/questions for the accountant/i.test(g[0])&&g[1]===1));}
assert.match(src,/function importPayStatus\(x\)\{var s=String\(x\|\|""\)\.trim\(\)\.toLowerCase\(\);if\(!s\)return "paid";return PAY_STATUS\.indexOf\(s\)>=0\?s:"scheduled";\}/,"unrecognized CSV state is scheduled, never paid");
console.log("IncomeOS accountant review checks passed.");
