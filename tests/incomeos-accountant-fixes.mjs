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
// Category summary: returned principal, unpaid bills and unallocated credits never mix with income or paid expenses.
{const inc=(scope,status,g)=>({kind:"income",scope,status,grossUsd:g,feesUsd:0,label:"x",date:"2026-10-01",category:"research"});
 const out=(type,a,st)=>({kind:"outflow",type,category:"software",amountUsd:a,businessUse:null,label:"x",date:"2026-10-01",...(st?{paymentStatus:st}:{})});
 const rows=A.categorySummary([inc("income","paid",100),inc("income","paid",50),inc("nonincome","paid",900),inc("income","invoiced",300),inc("income","cancelled",70),
   out("expense",40),out("expense",25,"scheduled"),out("refund",15),out("taxpayment",200)]);
 const get=(g,c)=>rows.find(r=>r.group===g&&r.category===c);
 assert.deepEqual([get("income","research").usd,get("income","research").count],[150,2],"only received income in the income group");
 assert.equal(get("nonincome","research").usd,900,"returned principal kept apart");
 assert.equal(get("outstanding","research").usd,300);assert.equal(get("closed","research").usd,70);
 assert.equal(get("expense","software").usd,40,"paid expense alone");
 assert.equal(get("unpaid","software").usd,25,"scheduled bill kept apart");
 assert.equal(get("refund","software").usd,15,"credit not netted against expenses");
 assert.equal(get("taxpayment","software").usd,200);
 assert.deepEqual(rows.map(r=>r.group),["income","nonincome","outstanding","closed","expense","taxpayment","unpaid","refund"],"fixed group order");
 assert.equal(rows.reduce((n,r)=>n+r.count,0),9,"every record lands in exactly one group");}
assert.doesNotMatch(src,/\(e\.kind==="income"\?"Income · ":"Outflow · "\)\+e\.category/,"old mixed grouping removed");
assert.match(src,/"By category: group","Category","Records","USD"/,"summary CSV carries the category table");
// Payment account: a short owner label only; anything that could be a full card or account number is refused.
{const ex={kind:"outflow",type:"expense",category:"software",amountUsd:10,businessUse:null,label:"x",date:"2026-10-01"};
 assert.equal(A.validateEntry({...ex,paymentAccount:"Business card ending 1234"}),true);
 assert.equal(A.validateEntry({...ex,paymentAccount:""}),true);
 for(const bad of ["4111 1111 1111 1111","Acct 12345","x".repeat(41)])assert.equal(A.validateEntry({...ex,paymentAccount:bad}),false,bad);
 assert.throws(()=>A.importJson(JSON.stringify({format:"incomeos-accountant",version:2,entries:[{...ex,id:"pa1",paymentAccount:"4111111111111111"}]})),"backup with a full number refused");
 A.importCsv([header+",payment_account",
   "expense,2026-10-05,Synthetic hosting,Host,software,9.00,paid,,R-1,n1,Card ending 4242",
   "expense,2026-10-06,Synthetic email,Mail,software,6.00,paid,,R-2,n2,4111 1111 1111 1111"].join("\n"));
 assert.match(prompts.pop(),/Import 2 new records/);}
assert.match(src,/"Payment account \(label\)","Source"/,"detailed CSV carries the payment account label");
assert.match(src,/Payment account removed on import: it looked like a full card or account number/);
// Reconciliation evidence: each record in exactly one class, from recorded evidence only.
{const inc=(o)=>({kind:"income",scope:"income",status:"paid",grossUsd:100,feesUsd:0,label:"x",date:"2026-10-01",category:"research",docStatus:"not-expected",reconciled:false,...o});
 const ex=(o)=>({kind:"outflow",type:"expense",category:"software",amountUsd:10,businessUse:null,label:"x",date:"2026-10-01",evidenceStatus:"missing",reconciled:false,...o});
 const recs=[inc({docStatus:"received",reconciled:true}),inc({reconciled:true}),inc({docStatus:"received"}),inc({}),inc({status:"invoiced"}),inc({status:"cancelled"}),inc({scope:"nonincome"}),
   ex({evidenceStatus:"both",reconciled:true}),ex({evidenceStatus:"both"}),ex({evidenceStatus:"both-unverified"}),ex({evidenceStatus:"bank"}),ex({evidenceStatus:"email"}),ex({}),
   ex({type:"refund"}),ex({paymentStatus:"refunded"}),ex({paymentStatus:"scheduled"}),ex({type:"capital"}),ex({category:"other"})];
 const r=A.reconciliationSummary(recs),c=Object.fromEntries(r.classes.map(x=>[x.cls,x.count]));
 assert.deepEqual(c,{verified:2,amountdate:2,bankonly:2,receiptonly:2,unverified:3,refund:3,capital:2,unsettled:2});
 assert.equal(r.classes.reduce((n,x)=>n+x.count,0),recs.length,"every record in exactly one class");
 assert.equal(r.classes.find(x=>x.cls==="verified").usd,110,"income gross plus matched expense");
 assert.equal(r.classes.find(x=>x.cls==="unsettled").usd,110,"invoiced income and scheduled bill outside reconciliation");
 assert.deepEqual([r.unsupported.count,r.unsupported.usd],[1,10]);
 assert.match(r.notice,/No bank matching, audit or tax determination/);}
assert.match(src,/\["Reconciliation evidence","","Records","USD"\]/,"summary CSV carries reconciliation evidence");
// Receipt gaps: paid outflows with no receipt on file, once each; refunds, unpaid bills, income and receipted items excluded.
{const ex=(o)=>({kind:"outflow",type:"expense",category:"software",amountUsd:10,businessUse:null,label:"x",date:"2026-10-03",payer:"Vendor A",evidenceStatus:"missing",reference:"INV-9",...o});
 const g=A.receiptGaps([ex({}),ex({evidenceStatus:"bank",amountUsd:5}),ex({payer:"Vendor B",date:"2026-11-01"}),ex({payer:""}),
   ex({evidenceStatus:"email"}),ex({evidenceStatus:"both"}),ex({evidenceStatus:"both-unverified"}),ex({type:"refund"}),ex({paymentStatus:"scheduled"}),ex({paymentStatus:"disputed"}),
   ex({type:"taxpayment",amountUsd:200}),{kind:"income",scope:"income",status:"paid",grossUsd:50,label:"i",date:"2026-10-03"}]);
 assert.equal(g.count,5,"a reference number alone is not a receipt");assert.equal(g.usd,235);
 assert.deepEqual(g.groups.map(x=>[x.month,x.payee,x.count,x.usd,x.statementOnly]),
   [["2026-10","(payee not recorded)",1,10,0],["2026-10","Vendor A",3,215,1],["2026-11","Vendor B",1,10,0]]);
 assert.equal(A.receiptGaps([]).count,0);}
assert.match(src,/\["Receipt gaps: month","Payee","Records","USD","Statement only"\]/,"summary CSV carries receipt gaps");
// Unclassified: category "other" or outflow type "other", each record once with every reason; classified records never listed.
{const ex=(o)=>({id:"u"+Math.random(),kind:"outflow",type:"expense",category:"software",amountUsd:10,businessUse:null,label:"x",date:"2026-10-03",...o});
 const u=A.unclassified([ex({}),ex({category:"other",label:"a"}),ex({type:"other",label:"b"}),ex({type:"other",category:"other",label:"c",amountUsd:5}),
   {kind:"income",scope:"income",status:"paid",category:"other",grossUsd:40,label:"d",date:"2026-10-01"},{kind:"income",scope:"income",status:"paid",category:"research",grossUsd:40,label:"e",date:"2026-10-01"}]);
 assert.equal(u.count,4);assert.equal(u.usd,65);
 assert.deepEqual(JSON.parse(JSON.stringify(u.items.map(x=>[x.label,x.reasons.length]))),[["d",1],["a",1],["b",1],["c",2]]);
 assert.match(u.items[0].reasons[0],/Income source not classified/);}
assert.match(src,/\["Unclassified: date","Description","Kind","USD","Reason"\]/,"summary CSV carries unclassified transactions");
// Corrections history: a backup with an oversized or malformed history is refused.
{const ex={kind:"outflow",type:"expense",category:"software",amountUsd:10,businessUse:null,label:"x",date:"2026-10-01"};
 assert.equal(A.validateEntry({...ex,corrections:[{at:"2026-11-04T00:00:00Z",changes:[{field:"amountUsd",from:9,to:10}]}]}),true);
 assert.equal(A.validateEntry({...ex,corrections:Array.from({length:101},()=>({at:"2026-11-04",changes:[]}))}),false);
 assert.equal(A.validateEntry({...ex,corrections:"edited"}),false);
 assert.equal(A.validateEntry({...ex,corrections:[{changes:[]}]}),false);}
assert.match(src,/"Source","Corrections \(earlier values\)"\]\]/);
