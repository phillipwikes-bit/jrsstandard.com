"use strict";
(function () {
  var KEY = "incomeos.accountant.v1";
  var LEGACY_KEY = "incomeos.owner.prototype.v1";
  var db = { version: 2, entries: [] };
  var editingIncome = null, editingCost = null;
  var $ = function (id) { return document.getElementById(id); };
  var usd = new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2, maximumFractionDigits:2 });
  var CATEGORIES = ["research","evaluation","business","royalty","rental","interest","dividend","investment","reward","recovery","employment","pension","retirement","socialsecurity","unemployment","other"];
  var COST_CATEGORIES = ["platform","software","equipment","internet","travel","training","professional","supplies","investing","tax","homeoffice","advertising","other"];
  var EXPENSE_TYPES = ["expense","taxpayment","capital","other","refund"];
  var SCOPES = ["income","nonincome","proceeds"];
  var TAX_FORMS = ["None / unknown","1099-NEC","1099-MISC","1099-K","1099-INT","1099-DIV","1099-B","Schedule K-1","W-2","1099-R","SSA-1099","1099-G","Other form"];
  // Payment states. Only "paid" (received) ever counts as income. Outstanding states are amounts
  // still owed; closed states were never received. "pending" stays for existing records.
  var STATUS = ["paid","pending","expected","invoiced","disputed","refunded","cancelled"];
  var OUTSTANDING = ["pending","expected","invoiced","disputed"];
  var STATUS_LABEL = {paid:"Recorded received",pending:"Pending",expected:"Expected, not received",invoiced:"Invoiced, not received",
    disputed:"Disputed, not received",refunded:"Refunded to payer, not income",cancelled:"Cancelled, not income"};
  // Expense payment states. Only "paid" counts toward expense totals; a record without a state
  // (created before this field existed) is treated as paid.
  var PAY_STATUS = ["paid","scheduled","disputed","refunded"];
  var PAY_LABEL = {paid:"Paid",scheduled:"Scheduled, not paid",disputed:"Disputed, not counted",refunded:"Charge refunded, not counted"};
  function payStatus(e){return e&&e.paymentStatus?e.paymentStatus:"paid";}
  function paidOut(e){return payStatus(e)==="paid";}
  // CSV: a missing column means paid (older files); an unrecognized value is scheduled, never paid.
  function importPayStatus(x){var s=String(x||"").trim().toLowerCase();if(!s)return "paid";return PAY_STATUS.indexOf(s)>=0?s:"scheduled";}
  // CSV and backups may say "received"; anything unrecognized is treated as expected, never as received.
  function importStatus(x){var s=String(x||"").trim().toLowerCase();if(s==="received")return "paid";return STATUS.indexOf(s)>=0?s:"expected";}
  var DOCSTATUS = ["not-expected","expected","received","reconciled"];
  var EVIDENCE_STATUS = ["missing","email","bank","both-unverified","both"];
  function node(tag, cls, text) { var e = document.createElement(tag); if(cls)e.className=cls; if(text!==undefined)e.textContent=String(text); return e; }
  function place(el,tag,cls,text){var n=node(tag,cls,text);el.appendChild(n);return n;}
  function limit(x,n){return String(x==null?"":x).trim().slice(0,n);}
  function money(x){return usd.format(Number(x)||0);}
  function round(x){return Math.round((x + Number.EPSILON)*100)/100;}
  function num(x){var n=Number(x);return Number.isFinite(n)?n:NaN;}
  function uid(){return "i"+Date.now()+"-"+Math.random().toString(36).slice(2,10);}
  function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  function currentYear(){return String($("report-year")?.value||new Date().getFullYear());}
  function datesMatch(e){
    if(!e||typeof e.date!=="string"||!/^20\d\d-\d\d-\d\d$/.test(e.date))return false;
    var t=Date.parse(e.date+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===e.date;
  }
  function validate(e){
    if(!e || !["income","outflow"].includes(e.kind) || !datesMatch(e))return false;
    if(!e.label || typeof e.label!=="string" || e.label.length>120)return false;
    if(e.kind==="income")return CATEGORIES.includes(e.category) && num(e.grossUsd)>0 && num(e.grossUsd)<=1e10 && num(e.feesUsd)>=0 && num(e.feesUsd)<=num(e.grossUsd) && STATUS.includes(e.status) && SCOPES.includes(e.scope);
    return EXPENSE_TYPES.includes(e.type) && COST_CATEGORIES.includes(e.category) && num(e.amountUsd)>0 && num(e.amountUsd)<=1e10 && (e.businessUse===null || (num(e.businessUse)>=0 && num(e.businessUse)<=100))
      && (e.paymentStatus===undefined || PAY_STATUS.includes(e.paymentStatus))
      && (e.accountantQuestions===undefined || (typeof e.accountantQuestions==="string" && e.accountantQuestions.length<=500))
      && (e.paymentAccount===undefined || safeAccountRef(e.paymentAccount));
  }
  // A payment account is recorded only as a short owner label (for example "Business card ending 1234").
  // More than four digits could be a full card or account number, so it is refused rather than stored.
  function safeAccountRef(x){return typeof x==="string" && x.length<=40 && (x.match(/[0-9]/g)||[]).length<=4;}
  var ACCOUNT_REF_RULE="Payment account: enter a short label such as \"Business card ending 1234\" (at most 40 characters and 4 digits). Full card or account numbers are not stored.";
  // Workspace mode: when an owner workspace file is open, the ledger lives in that file (saved,
  // optionally encrypted, by the owner) instead of browser storage. The staging lock still blocks
  // every browser-storage write; it does not apply to the in-memory workspace.
  var wsMode=false,wsForeign=[];
  function locked(){return window.IncomeOSFinancialReadOnly===true&&!wsMode;}
  function fromWorkspace(ws){
    var rows=ws&&Array.isArray(ws.ledger)?ws.ledger:[];
    db={version:2,entries:rows.filter(validate).slice(0,15000)};
    // Rows other panels wrote in a different shape are preserved untouched on every save.
    wsForeign=rows.filter(function(x){return !validate(x);});
  }
  function write(){
    if(window.IncomeOSFinancialReadOnly===true)return false;
    try{localStorage.setItem(KEY,JSON.stringify(db));return true;}
    catch(_e){alert("IncomeOS could not save locally. Available browser storage may be full.");return false;}
  }
  // Persist first, then update the current ledger. An interrupted storage write
  // must never appear as an accepted accounting record in the running interface.
  function commitEntries(entries){
    if(locked())throw new Error("Financial changes are disabled in unapproved staging");
    if(!Array.isArray(entries)||entries.length>15000||entries.some(function(x){return !validate(x);}))
      throw new Error("Financial records are invalid or exceed the ledger limit");
    if(wsMode){
      // The workspace owner applies the change and reports back; nothing is accepted unless it did.
      var result=null;
      try{document.dispatchEvent(new CustomEvent("incomeos:ledger-replace",{detail:{entries:entries.concat(wsForeign),done:function(r){result=r;}}}));}catch(_e){}
      if(!result||!result.ok)throw new Error("Workspace ledger was not updated"+(result&&result.error?": "+result.error:"")+". No change was accepted.");
      db={version:2,entries:entries};
      return true;
    }
    var next={version:2,entries:entries};
    try{localStorage.setItem(KEY,JSON.stringify(next));}
    catch(_e){throw new Error("Financial records could not be saved. No ledger update was accepted.");}
    db=next;
    return true;
  }
  function migrateLegacy(){
    if(window.IncomeOSFinancialReadOnly===true||wsMode)return;
    try {
      if(localStorage.getItem(KEY)!==null)return;
      var raw=JSON.parse(localStorage.getItem(LEGACY_KEY)||"{}");
      if(!Array.isArray(raw.receipts))return;
      var proposed=[];
      raw.receipts.forEach(function(x){
        if(!x || !x.label || !x.date || num(x.amount)<=0)return;
        var e={id:uid(),kind:"income",category:"other",label:limit(x.label,100),payer:"",date:limit(x.date,10),
          currency:"USD",amountOriginal:round(num(x.amount)),fx:1,grossUsd:round(num(x.amount)),feesUsd:0,
          status:x.status==="paid"?"paid":"pending",scope:"income",method:"Unknown",taxForm:"None / unknown",
          docStatus:"not-expected",reference:"Legacy IncomeOS entry",notes:"Imported from earlier ledger; review category and evidence.",
          reconciled:false,importedFrom:"legacy",createdAt:new Date().toISOString()};
        if(validate(e))proposed.push(e);
      });
      if(proposed.length)commitEntries(db.entries.concat(proposed));
    }catch(_e){}
  }
  function load(){
    migrateLegacy();
    try{
      var saved=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(saved && Array.isArray(saved.entries))db.entries=saved.entries.filter(validate).slice(0,15000);
    }catch(_e){db.entries=[];}
  }
  function yearEntries(){var year=currentYear();return db.entries.filter(function(x){return x.date.slice(0,4)===year;});}
  function sum(items,get){return round(items.reduce(function(t,e){return t+(Number(get(e))||0);},0));}
  // Category totals kept in separate groups so returned principal, unpaid bills and unallocated credits never mix with income or paid expenses.
  var CAT_GROUPS=[["income","Income received"],["nonincome","Receipts not income (returned principal, refunds)"],["proceeds","Asset sale proceeds, basis not determined"],["outstanding","Income not received"],["closed","Receipts refunded or cancelled, not income"],["expense","Expenses paid"],["taxpayment","Estimated tax payments paid"],["capital","Asset purchases / contributions paid"],["other","Other outflows paid"],["unpaid","Outflows not paid (scheduled, disputed or refunded)"],["refund","Refunds / credits, unallocated, not netted"]];
  function catGroup(e){
    if(e.kind==="income"){
      if(e.status==="paid")return SCOPES.indexOf(e.scope)>=0?e.scope:"income";
      return OUTSTANDING.indexOf(e.status)>=0?"outstanding":"closed";
    }
    if(e.type==="refund")return "refund";
    return paidOut(e)?e.type:"unpaid";
  }
  function categorySummary(entries){
    var map={};
    entries.forEach(function(e){
      var g=catGroup(e),k=g+"\u0000"+e.category,amt=e.kind==="income"?num(e.grossUsd):num(e.amountUsd);
      if(!map[k])map[k]={group:g,category:e.category,count:0,usd:0};
      map[k].count++;map[k].usd=round(map[k].usd+amt);
    });
    var order=CAT_GROUPS.map(function(x){return x[0];});
    return Object.keys(map).map(function(k){var r=map[k];r.groupLabel=(CAT_GROUPS[order.indexOf(r.group)]||[0,r.group])[1];return r;})
      .sort(function(a,b){return order.indexOf(a.group)-order.indexOf(b.group)||String(a.category).localeCompare(String(b.category));});
  }
  // Reconciliation evidence: every record lands in exactly one class. These reflect the owner's recorded
  // evidence only; no class is a software bank match, an audit, or a tax determination.
  var RECON_CLASSES=[["verified","Document and payment record matched after owner review"],["amountdate","Document and bank record both held, linkage not resolved"],["bankonly","Bank or card record only, no supporting document"],["receiptonly","Receipt or document only, payment not confirmed"],["unverified","Unverified, no evidence recorded"],["refund","Refunds, credits and reversals (not netted, not income)"],["capital","Transfers, returned principal and capital movements (not income or expense)"],["unsettled","Not yet received or paid (outside reconciliation)"]];
  function reconClass(e){
    if(e.kind==="income"){
      if(e.status==="refunded"||e.status==="cancelled")return "refund";
      if(e.status!=="paid")return "unsettled";
      if(e.scope!=="income")return "capital";
      var doc=e.docStatus==="received"||e.docStatus==="reconciled";
      return e.reconciled?(doc?"verified":"bankonly"):(doc?"receiptonly":"unverified");
    }
    if(e.type==="refund"||payStatus(e)==="refunded")return "refund";
    if(!paidOut(e))return "unsettled";
    if(e.type==="capital")return "capital";
    var ev=e.evidenceStatus||"missing";
    if(ev==="both")return e.reconciled?"verified":"amountdate";
    return ev==="both-unverified"?"amountdate":ev==="bank"?"bankonly":ev==="email"?"receiptonly":"unverified";
  }
  function reconciliationSummary(entries){
    var out=RECON_CLASSES.map(function(c){return {cls:c[0],label:c[1],count:0,usd:0};}),unsupported={count:0,usd:0};
    entries.forEach(function(e){
      var amt=e.kind==="income"?num(e.grossUsd):num(e.amountUsd),row=out.find(function(r){return r.cls===reconClass(e);});
      row.count++;row.usd=round(row.usd+amt);
      if(e.category==="other"){unsupported.count++;unsupported.usd=round(unsupported.usd+amt);}
    });
    return {classes:out,unsupported:unsupported,total:entries.length,
      notice:"Classes reflect recorded evidence only. No bank matching, audit or tax determination has been performed."};
  }
  // Receipt gaps: money actually paid out with no receipt or invoice on file ("Receipt not located" or
  // "Bank/card statement only"), grouped by payee and month. Refunds, unpaid bills and income are excluded.
  function receiptGaps(entries){
    var items=entries.filter(function(e){return e.kind==="outflow"&&e.type!=="refund"&&paidOut(e)&&["missing","bank"].indexOf(e.evidenceStatus||"missing")>=0;});
    var map={};
    items.forEach(function(e){
      var payee=e.payer||"(payee not recorded)",month=String(e.date).slice(0,7),k=payee+"\u0000"+month;
      if(!map[k])map[k]={payee:payee,month:month,count:0,usd:0,statementOnly:0};
      map[k].count++;map[k].usd=round(map[k].usd+num(e.amountUsd));if(e.evidenceStatus==="bank")map[k].statementOnly++;
    });
    var groups=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return a.month.localeCompare(b.month)||a.payee.localeCompare(b.payee);});
    return {count:items.length,usd:round(items.reduce(function(n,e){return n+num(e.amountUsd);},0)),groups:groups,
      items:items.slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date));})};
  }
  function totals(entries){
    var income=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="income";});
    var nonincome=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="nonincome";});
    var proceeds=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="proceeds";});
    var pending=entries.filter(function(e){return e.kind==="income"&&OUTSTANDING.indexOf(e.status)>=0;});
    var closed=entries.filter(function(e){return e.kind==="income"&&(e.status==="refunded"||e.status==="cancelled");});
    var expenses=entries.filter(function(e){return e.kind==="outflow"&&e.type==="expense"&&paidOut(e);});
    var taxpayments=entries.filter(function(e){return e.kind==="outflow"&&e.type==="taxpayment"&&paidOut(e);});
    var capital=entries.filter(function(e){return e.kind==="outflow"&&e.type==="capital"&&paidOut(e);});
    var other=entries.filter(function(e){return e.kind==="outflow"&&e.type==="other"&&paidOut(e);});
    var unpaidOut=entries.filter(function(e){return e.kind==="outflow"&&e.type!=="refund"&&!paidOut(e);});
    var refunds=entries.filter(function(e){return e.kind==="outflow"&&e.type==="refund";});
    return {
      gross:sum(income,function(e){return e.grossUsd}),
      fees:sum(income,function(e){return e.feesUsd}),
      expenses:sum(expenses,function(e){return e.amountUsd}),
      possibleBusinessUse:sum(expenses,function(e){return e.businessUse===null ? 0 : e.amountUsd*e.businessUse/100}),
      allocationPending:expenses.filter(function(e){return e.businessUse===null || e.businessUse===undefined;}).length,
      taxPaid:sum(taxpayments,function(e){return e.amountUsd}),
      capital:sum(capital,function(e){return e.amountUsd}),
      otherOutflow:sum(other,function(e){return e.amountUsd}),
      refundCredits:sum(refunds,function(e){return e.amountUsd}),
      refundCount:refunds.length,
      proceeds:sum(proceeds,function(e){return e.grossUsd}),
      returned:sum(nonincome,function(e){return e.grossUsd}),
      pending:sum(pending,function(e){return e.grossUsd}),
      incomeCount:income.length,pendingCount:pending.length,
      unpaidOutflowCount:unpaidOut.length,unpaidOutflowUsd:sum(unpaidOut,function(e){return e.amountUsd}),
      questionCount:entries.filter(function(e){return e.accountantQuestions;}).length,closedCount:closed.length,closedNotIncome:sum(closed,function(e){return e.grossUsd}),
      unreconciled:entries.filter(function(e){return !e.reconciled}).length
    };
  }
  // What the year's records still lack. Any gap makes the report INCOMPLETE; a clean result is still
  // only "no open gaps in the recorded entries", never accountant approval or tax-filing readiness.
  function completeness(entries){
    var t=totals(entries);
    var missingEvidence=entries.filter(function(e){return e.kind==="outflow"&&e.type!=="refund"&&(e.evidenceStatus||"missing")==="missing";}).length;
    var unallocatedRefunds=entries.filter(function(e){return e.kind==="outflow"&&e.type==="refund";}).length;
    var gaps=[["Records not marked reconciled",t.unreconciled],["Expense business-use not determined",t.allocationPending],
      ["Expenses without supporting evidence",missingEvidence],["Outstanding receipts: expected, invoiced, pending or disputed (not counted as received)",t.pendingCount],
      ["Refunds or credits not yet matched to a charge",unallocatedRefunds],
      ["Expenses scheduled, disputed or refunded (not counted)",t.unpaidOutflowCount],["Open questions for the accountant",t.questionCount]];
    var open=gaps.filter(function(g){return g[1]>0;});
    return {status:entries.length===0?"NO RECORDS":open.length?"INCOMPLETE":"NO OPEN GAPS IN RECORDED ENTRIES",gaps:gaps,open:open.length,
      notice:"Not reviewed or approved by an accountant and not ready for tax filing. Covers only entries recorded in IncomeOS; omitted accounts or receipts cannot be detected."};
  }
  function paidTotal(){return totals(db.entries).gross;}
  function addOrUpdate(e,editId){
    if(locked())throw new Error("Financial entry is disabled in unapproved staging. Open or create a workspace in Research, This week, to keep records in your workspace file.");
    var found=editId?db.entries.findIndex(function(x){return x.id===editId;}):-1;
    var next=db.entries.slice();
    if(found>=0)next[found]=Object.assign({},e,{id:editId,createdAt:db.entries[found].createdAt,updatedAt:new Date().toISOString()});
    else next.push(Object.assign({},e,{id:uid(),createdAt:new Date().toISOString()}));
    commitEntries(next);render();
  }
  function resetForm(formId,kind){
    $(formId).reset();
    $(kind==="income"?"receipt-date":"cost-date").value=today();
    if(kind==="income"){$("receipt-fx").value="1";$("receipt-fees").value="0";$("receipt-cancel").hidden=true;$("receipt-save").textContent="Save income entry";editingIncome=null;}
    else{$("cost-business-use").value="";if($("cost-payment-status"))$("cost-payment-status").value="paid";$("cost-cancel").hidden=true;$("cost-save").textContent="Save outflow";editingCost=null;}
  }
  function readIncome(){
    var amount=num($("receipt-amount").value),fx=num($("receipt-fx").value),fees=num($("receipt-fees").value||0);
    var e={
      kind:"income",label:limit($("receipt-label").value,100),payer:limit($("receipt-payer").value,100),
      category:$("receipt-category").value,date:$("receipt-date").value,
      amountOriginal:round(amount),currency:$("receipt-currency").value,fx:fx,
      grossUsd:round(amount*fx),feesUsd:round(fees),status:$("receipt-state").value,
      scope:$("receipt-scope").value,method:$("receipt-method").value,
      taxForm:$("receipt-doc").value,docStatus:$("receipt-doc-status").value,
      reference:limit($("receipt-reference").value,120),notes:limit($("receipt-notes").value,500),
      reconciled:$("receipt-reconciled").checked,importedFrom:"manual"
    };
    if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(fx)||fx<=0||fx>1e6||!Number.isFinite(fees)||fees<0||e.feesUsd>e.grossUsd||!validate(e)){alert("Please enter a valid description, date, gross amount, exchange rate and fee. Fees cannot exceed gross receipts.");return null;}
    return e;
  }
  function readCost(){
    var amount=num($("cost-amount").value),rawPct=$("cost-business-use").value.trim(),pct=rawPct===""?null:num(rawPct);
    var e={kind:"outflow",label:limit($("cost-label").value,100),payer:limit($("cost-payee").value,100),
      category:$("cost-category").value,date:$("cost-date").value,type:$("cost-type").value,
      amountUsd:round(amount),businessUse:$("cost-type").value==="refund"?null:pct,evidenceStatus:$("cost-evidence-status").value,
      reference:limit($("cost-reference").value,120),notes:limit($("cost-notes").value,500),
      reconciled:$("cost-evidence-status").value==="both",importedFrom:"manual",
      paymentStatus:PAY_STATUS.indexOf($("cost-payment-status")&&$("cost-payment-status").value)>=0?$("cost-payment-status").value:"paid",
      accountantQuestions:limit($("cost-questions")?$("cost-questions").value:"",500),
      paymentAccount:$("cost-payment-account")?$("cost-payment-account").value.trim():""};
    if(!safeAccountRef(e.paymentAccount)){alert(ACCOUNT_REF_RULE);return null;}
    if(!Number.isFinite(amount)||amount<=0||(pct!==null&&(!Number.isFinite(pct)||pct<0||pct>100))||!validate(e)){alert("Please enter a valid expense description, date, positive amount and business-use percentage from 0 to 100.");return null;}
    return e;
  }
  function setValue(id,value){if($(id))$(id).value=value==null?"":String(value);}
  function startEdit(e){
    if(locked())return;
    var isIncome=e.kind==="income";var p=isIncome?"receipt":"cost";
    if(isIncome){
      editingIncome=e.id;editingCost=null;
      setValue("receipt-label",e.label);setValue("receipt-payer",e.payer);setValue("receipt-category",e.category);
      setValue("receipt-amount",e.amountOriginal);setValue("receipt-date",e.date);setValue("receipt-currency",e.currency||"USD");
      setValue("receipt-fx",e.fx||1);setValue("receipt-fees",e.feesUsd||0);setValue("receipt-state",e.status);
      setValue("receipt-scope",e.scope);setValue("receipt-method",e.method||"Unknown");
      setValue("receipt-doc",e.taxForm||"None / unknown");setValue("receipt-doc-status",e.docStatus||"not-expected");
      setValue("receipt-reference",e.reference);setValue("receipt-notes",e.notes);
      $("receipt-reconciled").checked=!!e.reconciled;
      $("receipt-save").textContent="Update income entry";$("receipt-cancel").hidden=false;
    }else{
      editingCost=e.id;editingIncome=null;
      setValue("cost-label",e.label);setValue("cost-payee",e.payer);setValue("cost-category",e.category);
      setValue("cost-date",e.date);setValue("cost-amount",e.amountUsd);setValue("cost-type",e.type);
      setValue("cost-business-use",e.businessUse);
      setValue("cost-evidence-status",e.evidenceStatus||"missing");
      setValue("cost-reference",e.reference);setValue("cost-notes",e.notes);
      setValue("cost-payment-status",payStatus(e));setValue("cost-questions",e.accountantQuestions||"");setValue("cost-payment-account",e.paymentAccount||"");
      $("cost-save").textContent="Update outflow";$("cost-cancel").hidden=false;
    }
    $(p+"-form-title").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function renderSummary(){
    var rows=yearEntries(),t=totals(rows);
    $("ledger-total").textContent=money(t.gross);
    $("ledger-fees").textContent=money(t.fees);
    $("ledger-expenses").textContent=money(t.expenses);
    $("ledger-net").textContent=money(t.gross-t.fees-t.expenses);
    $("metric-paid").textContent=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(paidTotal());
    $("cash-assessed").textContent=money(paidTotal());
    $("ledger-count").textContent=rows.length+" year records";
    var box=$("report-preview");box.replaceChildren();
    var data=[
      ["Gross received, potentially income",t.gross],["Platform fees already withheld",t.fees],
      ["Other paid expense candidates",t.expenses],["Unallocated refunds / credits, NOT netted",t.refundCredits],["Business-use allocation estimate (review)",t.possibleBusinessUse],
      ["Cash after recorded fees and other paid expenses",round(t.gross-t.fees-t.expenses)],
      ["Pending / unpaid incentives",t.pending],["Possible returned principal / refunds",t.returned],
      ["Asset sale proceeds, cost basis not resolved",t.proceeds],["Estimated tax payments, not an expense",t.taxPaid],
      ["Asset purchases / contributions, not an expense",t.capital],["Other recorded outflows",t.otherOutflow]
    ];
    data.forEach(function(pair){var row=place(box,"div","accountant-line");place(row,"span","",pair[0]);place(row,"strong","",money(pair[1]));});
    var note=place(box,"p","muted","Refunds/credits are not counted as earnings or netted against expenses until supported by original-charge evidence and reviewed. "+t.unreconciled+" item(s) not marked reconciled. "+t.allocationPending+" expense allocation(s) not determined. "+t.pendingCount+" pending receipt(s). A blank allocation is unknown, not 0% or 100%. Tax form classification, deductible percentages, capital gains and tax treatment require accountant review.");
    note.style.marginTop="13px";
    var forms={};
    rows.forEach(function(e){if(e.kind==="income"&&e.taxForm&&e.taxForm!=="None / unknown")forms[e.taxForm]=(forms[e.taxForm]||0)+1;});
    place(box,"h4","","Recorded categories");
    categorySummary(rows).forEach(function(c){var row=place(box,"div","accountant-line");place(row,"span","",c.groupLabel+" · "+c.category+" ("+c.count+")");place(row,"strong","",money(c.usd));});
    var rs=reconciliationSummary(rows);
    place(box,"h4","","Reconciliation evidence");
    rs.classes.forEach(function(c){if(!c.count)return;var row=place(box,"div","accountant-line");place(row,"span","",c.label+" ("+c.count+")");place(row,"strong","",money(c.usd));});
    if(rs.unsupported.count){var ur=place(box,"div","accountant-line");place(ur,"span","","Classification not supported: category \"other\" ("+rs.unsupported.count+")");place(ur,"strong","",money(rs.unsupported.usd));}
    place(box,"p","muted",rs.notice);
    var gaps=receiptGaps(rows);
    place(box,"h4","","Receipt gaps");
    if(!gaps.count)place(box,"p","muted","No paid outflow is marked as missing a receipt.");
    else{gaps.groups.forEach(function(g){var row=place(box,"div","accountant-line");place(row,"span","",g.month+" · "+g.payee+" ("+g.count+(g.statementOnly?", "+g.statementOnly+" statement only":"")+")");place(row,"strong","",money(g.usd));});
      place(box,"p","muted",gaps.count+" paid outflow(s), "+money(gaps.usd)+", have no receipt or invoice on file. A bank or card statement shows payment, not what was bought.");}
    place(box,"p","muted","Supporting form references: "+(Object.keys(forms).length?Object.keys(forms).map(function(k){return k+" ("+forms[k]+")";}).join(", "):"None recorded")+". No bank, tax authority or payer validation has been performed.");
  }
  function showEntry(e){
    var out=place($("ledger-list"),"div","entry");var left=place(out,"div","entry-info");
    place(left,"strong","",e.label);
    place(left,"small","",e.date+" · "+(e.kind==="income"?"RECEIPT · "+e.category+" · "+(STATUS_LABEL[e.status]||"Not received"):(e.type==="refund"?"REFUND/CREDIT, UNALLOCATED · ":"OUTFLOW · ")+e.category+" · "+e.type));
    place(left,"small","",e.payer||"Source not identified");
    if(e.kind==="outflow"&&e.type!=="refund"&&!paidOut(e))place(left,"small","notice",PAY_LABEL[payStatus(e)]||payStatus(e));
    if(e.paymentAccount)place(left,"small","","Paid from: "+e.paymentAccount);
    if(e.accountantQuestions)place(left,"small","","Question for accountant: "+e.accountantQuestions);
    if(e.kind==="outflow"&&e.type!=="refund")place(left,"small","","Business use "+(e.businessUse===null||e.businessUse===undefined?"not determined":String(e.businessUse)+"%")+" · Evidence "+(e.evidenceStatus||"missing"));
    if(!e.reconciled)place(left,"small","notice","Not reconciled to source evidence");
    var right=place(out,"div","entry-actions");
    place(right,"div","amt"+(e.kind==="income"&&e.status!=="paid"?" pending":""),(e.kind==="outflow"&&e.type!=="refund"?"−":"+")+money(e.kind==="income"?e.grossUsd:e.amountUsd));
    var buttons=place(right,"div","entry-buttons"),ed=place(buttons,"button","","Edit"),del=place(buttons,"button","","Remove");
    ed.type="button";del.type="button";ed.addEventListener("click",function(){startEdit(e);});
    del.addEventListener("click",function(){
      if(locked())return;
      if(!confirm("Delete this local record? This cannot be undone without a backup."))return;
      try{commitEntries(db.entries.filter(function(x){return x.id!==e.id;}));render();}
      catch(err){alert(err.message);}
    });
  }
  function renderList(){
    var filter=$("ledger-filter").value,q=$("ledger-search").value.trim().toLowerCase();
    var rows=yearEntries().filter(function(e){
      if(filter==="income"&&e.kind!=="income")return false;
      if(filter==="outflow"&&!(e.kind==="outflow"&&e.type!=="refund"))return false;
      if(filter==="refund"&&!(e.kind==="outflow"&&e.type==="refund"))return false;
      if(filter==="pending"&&!(e.kind==="income"&&OUTSTANDING.indexOf(e.status)>=0))return false;
      return !q || [e.label,e.category,e.payer,e.reference,e.notes].join(" ").toLowerCase().includes(q);
    }).sort(function(a,b){return b.date.localeCompare(a.date);});
    $("ledger-list").replaceChildren();
    if(!rows.length)place($("ledger-list"),"div","empty","No records in this year/filter. You can enter income or expenses from any source.");
    else rows.forEach(showEntry);
  }
  function reviewApi(){var api=window.IncomeOSAccountantReview;return api&&typeof api.inspect==="function"?api:null;}
  // A half-typed or invalid report year must not stop rendering or the ledger-updated event.
  function annualReview(){
    var api=reviewApi();if(!api)return null;
    if(!/^\d{4}$/.test(currentYear()))return {invalidYear:true};
    try{return api.inspect(yearEntries(),currentYear());}catch(_e){return null;}
  }
  function renderReview(){
    var root=$("review-list"),status=$("review-summary");
    if(!root||!status)return;
    root.replaceChildren();
    var review=annualReview();
    if(!review){
      status.textContent="Documentation review unavailable. No completeness assertion can be made.";
      return;
    }
    if(review.invalidYear){status.textContent="Enter a four-digit report year to run the documentation review.";return;}
    if(review.recordCount===0){
      status.textContent="No records entered for "+currentYear()+". No evidence coverage can be established.";
      return;
    }
    status.textContent=review.openIssueCount+" documentation flags across "+review.recordsAffected+
      " of "+review.recordCount+" recorded items ("+review.highCount+" high priority).";
    if(!review.openIssueCount){
      place(root,"p","muted","No predefined evidence flags were detected in the recorded entries. This does not certify full account coverage, tax accuracy, or that every receipt is present.");
      return;
    }
    // Same order and counts as the summary CSV and printed report.
    (reviewApi().definitions||[]).forEach(function(def){
      var count=review.counts&&review.counts[def.id];if(!count)return;
      var row=place(root,"div","review-issue");
      var head=place(row,"div","panelrow");
      place(head,"strong","",def.title);
      place(head,"span","review-count",count+" flag"+(count===1?"":"s"));
      place(row,"p","muted",def.next);
    });
    place(root,"p","muted","Flags are for review only. A record with several flags appears more than once in the detailed exception CSV.");
  }
  function exportReview(){
    var review=annualReview();
    if(!review){alert("Documentation review module is unavailable; cannot export exceptions.");return;}
    if(review.invalidYear){alert("Enter a four-digit report year first.");return;}
    if(!review.recordCount){alert("No records for "+review.year+". An empty exception file would look like a clean year, so none was created.");return;}
    var rows=[["Tax year","Severity","Issue code","Issue","Record ID","Date","Description","Kind","Amount USD","Review action"]];
    review.issues.forEach(function(e){rows.push([review.year,e.severity,e.id,e.title,e.recordId,e.date,e.description,e.kind,
      e.amount.toFixed(2),e.action]);});
    download(csv(rows),"IncomeOS-accountant-exceptions-"+review.year+".csv","text/csv;charset=utf-8");
  }
  function render(){renderSummary();renderList();try{renderReview();}catch(_e){var rs=$("review-summary");if(rs)rs.textContent="Documentation review could not be shown.";}if(typeof window.dispatchEvent==="function" && typeof window.CustomEvent==="function")window.dispatchEvent(new window.CustomEvent("incomeos:ledger-updated"));}
  function csvSafe(x){var s=String(x??"");if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function csv(arr){return arr.map(function(row){return row.map(csvSafe).join(",");}).join("\r\n")+"\r\n";}
  function download(text,name,type){
    var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=node("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
  }
  function exportDetail(){
    var rows=[["Date","Kind","Type / scope","Category","Description","Payer / payee","Original amount","Currency","USD per unit","Gross USD","Platform fees USD","Other paid outflows USD","Unallocated refund credit USD","Business-use %","Status","Tax form","Form status","Evidence status","Evidence reference","Reconciled","Notes","Entry ID","Expense payment status","Questions for accountant","Payment account (label)"]];
    yearEntries().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(e){
      rows.push([e.date,e.kind,e.kind==="income"?e.scope:e.type,e.category,e.label,e.payer||"",e.amountOriginal??"",e.currency??"USD",e.fx??1,e.kind==="income"?e.grossUsd:"",e.feesUsd??0,e.kind==="outflow"&&e.type!=="refund"?e.amountUsd:"",e.kind==="outflow"&&e.type==="refund"?e.amountUsd:"",e.kind==="outflow"&&e.type!=="refund"?(e.businessUse==null?"":e.businessUse):"",e.status??"paid",e.taxForm??"",e.docStatus??"",e.evidenceStatus??"",e.reference??"",e.reconciled?"yes":"no",e.notes??"",e.id,e.kind==="outflow"?payStatus(e):"",e.accountantQuestions??"",e.paymentAccount??""]);
    });
    download(csv(rows),"IncomeOS-accountant-detail-"+currentYear()+".csv","text/csv;charset=utf-8");
  }
  function exportSummary(){
    var t=totals(yearEntries());var pairs=[
      ["Gross received, potential income",t.gross],["Platform fees withheld",t.fees],
      ["Other expenses recorded",t.expenses],["Estimated business use portion, not approved deduction",t.possibleBusinessUse],
      ["Recorded cash after fees and expenses, not taxable profit",round(t.gross-t.fees-t.expenses)],
      ["Pending receipts",t.pending],["Recovered principal / refunds",t.returned],
      ["Asset sale proceeds, review basis",t.proceeds],["Estimated tax payments",t.taxPaid],
      ["Asset purchases / capital contributions",t.capital],["Other outflows",t.otherOutflow],["Unallocated refunds / credits, not netted",t.refundCredits],
      ["Unreconciled record count",t.unreconciled],["Expense allocations not determined",t.allocationPending],
      ["Refunded or cancelled receipts, not income (count)",t.closedCount],["Refunded or cancelled receipts, not income (USD)",t.closedNotIncome]];
    var c=completeness(yearEntries());
    pairs.unshift(["Report status",c.status+". "+c.notice]);
    c.gaps.forEach(function(g){if(g[0]!=="Records not marked reconciled")pairs.push(["Completeness: "+g[0],g[1]]);});
    var review=annualReview();
    if(review&&!review.invalidYear){
      pairs.push(["Document flags requiring review",review.openIssueCount]);
      pairs.push(["High-priority documentation flags",review.highCount]);
      pairs.push(["Affected ledger records",review.recordsAffected]);
      for(var category of (reviewApi()&&reviewApi().definitions||[]))
        if(review.counts[category.id])pairs.push(["Documentation: "+category.title,review.counts[category.id]]);
    }
    var cats=categorySummary(yearEntries()).map(function(c){return [c.groupLabel,c.category,c.count,c.usd];});
    var rsum=reconciliationSummary(yearEntries());
    cats=cats.concat([[],["Reconciliation evidence","","Records","USD"]],rsum.classes.map(function(c){return [c.label,"",c.count,c.usd];}),
      [["Classification not supported (category other)","",rsum.unsupported.count,rsum.unsupported.usd],[rsum.notice]]);
    var rg=receiptGaps(yearEntries());
    cats=cats.concat([[],["Receipt gaps: month","Payee","Records","USD","Statement only"]],rg.groups.map(function(g){return [g.month,g.payee,g.count,g.usd,g.statementOnly];}),[["Receipt gaps total","",rg.count,rg.usd]]);
    download(csv([["IncomeOS personal tax-year summary",currentYear()]].concat([["Category","Amount or count"]],pairs,[[],["By category: group","Category","Records","USD"]],cats)),"IncomeOS-accountant-summary-"+currentYear()+".csv","text/csv;charset=utf-8");
  }
  function backup(){download(JSON.stringify({format:"incomeos-accountant",version:2,exportedAt:new Date().toISOString(),entries:db.entries},null,2),"IncomeOS-accountant-private-backup-"+today()+".json","application/json");}
  function printReport(){
    var t=totals(yearEntries());
    var r=$("print-report");r.replaceChildren();
    place(r,"h1","","IncomeOS | Accountant Annual Earnings & Expense Report");
    place(r,"p","","Tax year: "+currentYear()+" | Generated: "+today()+" | Self-reported records, not tax determinations");
    var comp=completeness(yearEntries());
    place(r,"h2","","Record completeness: "+comp.status);
    place(r,"p","",comp.notice);
    var ctab=place(r,"table"),cbody=place(ctab,"tbody");
    comp.gaps.forEach(function(g){var row=place(cbody,"tr");place(row,"td","",g[0]);place(row,"td","",String(g[1]));});
    place(r,"h2","","Annual reconciliation");
    var table=place(r,"table");var body=place(table,"tbody");
    [["Received gross potential income",t.gross],["Withheld platform fees",t.fees],["Other recorded expense candidates",t.expenses],["Business-use estimate (not approved deduction)",t.possibleBusinessUse],["Recorded receipts less fees/expenses",round(t.gross-t.fees-t.expenses)],["Pending unpaid receipts",t.pending],["Possible nonincome / refunded principal",t.returned],["Asset sale proceeds, basis not determined",t.proceeds],["Estimated tax payments",t.taxPaid],["Capital contributions / asset costs",t.capital],["Unallocated refunds / credits, not netted",t.refundCredits],["Unreconciled records",t.unreconciled]].forEach(function(p){var tr=place(body,"tr");place(tr,"th","",p[0]);place(tr,"td","",typeof p[1]==="number"&&p[0]!=="Unreconciled records"?money(p[1]):p[1]);});
    place(r,"h2","","By category");
    var ktab=place(r,"table"),kbody=place(ktab,"tbody");
    categorySummary(yearEntries()).forEach(function(c){var tr=place(kbody,"tr");[c.groupLabel,c.category,String(c.count),money(c.usd)].forEach(function(x){place(tr,"td","",x);});});
    var rsp=reconciliationSummary(yearEntries());
    place(r,"h2","","Reconciliation evidence");place(r,"p","",rsp.notice);
    var rtab=place(r,"table"),rbody=place(rtab,"tbody");
    rsp.classes.concat([{label:"Classification not supported (category other)",count:rsp.unsupported.count,usd:rsp.unsupported.usd}]).forEach(function(c){var tr=place(rbody,"tr");[c.label,String(c.count),money(c.usd)].forEach(function(x){place(tr,"td","",x);});});
    var rgp=receiptGaps(yearEntries());
    place(r,"h2","","Receipt gaps: "+rgp.count+" paid outflow(s), "+money(rgp.usd));
    if(!rgp.count)place(r,"p","","No paid outflow is marked as missing a receipt.");
    else{var gtab=place(r,"table"),gbody=place(gtab,"tbody");
      rgp.items.forEach(function(e){var tr=place(gbody,"tr");[e.date,e.payer||"(payee not recorded)",e.label,e.evidenceStatus==="bank"?"Statement only":"Receipt not located",money(e.amountUsd)].forEach(function(x){place(tr,"td","",x);});});}
    var review=annualReview();
    place(r,"h2","","Outstanding documentation review");
    if(!review||review.invalidYear)place(r,"p","","Review module unavailable or report year invalid. Source completeness not verified.");
    else{
      place(r,"p","",review.openIssueCount+" unresolved documentation flags, "+review.highCount+
        " high priority, affecting "+review.recordsAffected+" of "+review.recordCount+" recorded entries.");
      var issueTable=place(r,"table"),issueHead=place(issueTable,"thead"),issueHeader=place(issueHead,"tr");
      ["Evidence issue","Count","Required review"].forEach(function(x){place(issueHeader,"th","",x);});
      var issueBody=place(issueTable,"tbody");
      (reviewApi().definitions||[]).forEach(function(def){
        if(!review.counts[def.id])return;
        var row=place(issueBody,"tr");
        [def.title,review.counts[def.id],def.next].forEach(function(v){place(row,"td","",v);});
      });
      place(r,"p","","This exhibit covers only entries actually in this IncomeOS ledger. Unlinked institutions, omitted records and tax deductibility cannot be certified.");
    }
    var asks=yearEntries().filter(function(e){return e.accountantQuestions;});
    if(asks.length){place(r,"h2","","Questions for the accountant");var ql=place(r,"ul");
      asks.forEach(function(e){place(ql,"li","",e.date+" · "+e.label+": "+e.accountantQuestions);});}
    place(r,"h2","","Detailed entries");
    var dt=place(r,"table"),th=place(dt,"thead"),htr=place(th,"tr");
    ["Date","Kind","Source","Category","Gross USD","Fees USD","Outflow USD","Refund credit USD","Status / review"].forEach(function(x){place(htr,"th","",x);});
    var tb=place(dt,"tbody");
    yearEntries().slice().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(e){
      var tr=place(tb,"tr");
      [e.date,e.kind,e.label+(e.payer?" · "+e.payer:""),e.category,e.kind==="income"?money(e.grossUsd):"",e.kind==="income"?money(e.feesUsd):"",e.kind==="outflow"&&e.type!=="refund"?money(e.amountUsd):"",e.kind==="outflow"&&e.type==="refund"?money(e.amountUsd):"",e.kind==="income"?e.status+" / "+e.scope:(e.type+" / "+(PAY_LABEL[payStatus(e)]||payStatus(e))+" / "+(e.businessUse==null?"allocation unknown":e.businessUse+"% business use"))].forEach(function(x){place(tr,"td","",x);});
    });
    place(r,"p","","Document and source reference fields, bank matching, invoices, tax forms, and business-use substantiation should be reviewed alongside detailed CSV. Expenses are not automatically tax deductions. Asset proceeds require basis and holding-period review.");
    window.print();
  }
  function splitCsv(data){
    data=data.replace(/^\uFEFF/,"");
    var rows=[],row=[],field="",quoted=false;
    for(var i=0;i<data.length;i++){
      var c=data[i];
      if(quoted){if(c==='"'&&data[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
      else if(c==='"'){quoted=true;}
      else if(c===","){row.push(field);field="";}
      else if(c==="\n"||c==="\r"){if(c==="\r"&&data[i+1]==="\n")i++;row.push(field);if(row.some(function(z){return z.trim()!=="";}))rows.push(row);row=[];field="";}
      else field+=c;
    }
    if(quoted)throw new Error("Unclosed CSV quote");
    row.push(field);if(row.some(function(z){return z.trim()!=="";}))rows.push(row);
    return rows;
  }
  function findImportFields(row){
    var h=row.map(function(x){return x.toLowerCase().trim().replace(/[\s\-]+/g,"_");});
    var expected=["kind","date","description","vendor","category","amount_usd","status","business_use_pct","evidence_ref","notes"];
    var allowed=expected.concat(["evidence_status","payment_status","accountant_questions","payment_account"]);
    if(expected.some(function(x){return !h.includes(x)})||h.some(function(x){return !allowed.includes(x)})||new Set(h).size!==h.length)
      throw new Error("CSV headers must match the IncomeOS import template without duplicate or unsupported fields");
    return h;
  }
  function importCsv(text){
    if(locked())throw new Error("Financial import is disabled in unapproved staging. Open or create a workspace first.");
    var rows=splitCsv(text);if(rows.length<2)throw new Error("No data rows found");
    if(rows.length>5001)throw new Error("Import limit is 5,000 rows per file");
    var h=findImportFields(rows[0]),idx=function(k){return h.indexOf(k);};
    var accepted=[],skipped=0,rejected=0;
    // A dated bank transaction identifier is more reliable than merchant/amount matching:
    // two valid API charges can share the same day, vendor and dollar amount.
    function fingerprint(e) {
      var ref=String(e.reference||"").trim().toLowerCase(),amount=e.kind==="income"?e.grossUsd:e.amountUsd;
      // Line items of one invoice share its reference: date and amount keep them apart.
      return ref ? [e.kind,"ref",ref,e.date,Number(amount).toFixed(2)].join("|") :
        [e.kind,"legacy",e.date,e.label.toLowerCase(),Number(amount).toFixed(2)].join("|");
    }
    var fingerprints=new Set(db.entries.map(fingerprint));
    for(var i=1;i<rows.length;i++){
      var row=rows[i],get=function(k){return limit(row[idx(k)]??"",500);};
      var kind=get("kind").toLowerCase(),amount=num(get("amount_usd")),date=get("date"),label=limit(get("description"),100),category=get("category").toLowerCase();
      if(!label||!datesMatch({date:date})||!Number.isFinite(amount)||amount<=0||amount>1e10){rejected++;continue;}
      var e;
      if(kind==="income"){
        e={kind:"income",label:label,payer:limit(get("vendor"),100),date:date,category:CATEGORIES.includes(category)?category:"other",amountOriginal:amount,currency:"USD",fx:1,grossUsd:round(amount),feesUsd:0,
        status:importStatus(get("status")),scope:"income",method:"Unknown",taxForm:"None / unknown",docStatus:"not-expected",reference:limit(get("evidence_ref"),120),notes:limit(get("notes"),500),reconciled:false,importedFrom:"csv"};
      }else if(["expense","outflow","taxpayment","capital","other","refund"].includes(kind)){
        var rawBusiness=get("business_use_pct").trim(),bus=rawBusiness===""?null:num(rawBusiness);if(bus!==null&&(!Number.isFinite(bus)||bus<0||bus>100)){rejected++;continue;}
        e={kind:"outflow",type:kind==="expense"||kind==="outflow"?"expense":kind,label:label,payer:limit(get("vendor"),100),date:date,
        category:COST_CATEGORIES.includes(category)?category:"other",amountUsd:round(amount),businessUse:kind==="refund"?null:bus,
        evidenceStatus:EVIDENCE_STATUS.includes(get("evidence_status").toLowerCase())?get("evidence_status").toLowerCase():"missing",reference:limit(get("evidence_ref"),120),notes:limit(get("notes"),500),reconciled:false,importedFrom:"csv",paymentStatus:kind==="refund"?"paid":importPayStatus(get("payment_status")),accountantQuestions:limit(get("accountant_questions"),500)};
        var acct=get("payment_account").trim();
        if(safeAccountRef(acct))e.paymentAccount=acct;
        else{e.paymentAccount="";e.notes=limit("Payment account removed on import: it looked like a full card or account number. "+e.notes,500);}
      }else{rejected++;continue;}
      if(!validate(e)){rejected++;continue;}
      var evidenceKey=fingerprint(e);
      if(fingerprints.has(evidenceKey)){skipped++;continue;}
      fingerprints.add(evidenceKey);accepted.push(Object.assign({id:uid()+"-"+i,createdAt:new Date().toISOString()},e));
    }
    if(!accepted.length)return {accepted:0,skipped:skipped,rejected:rejected};
    if(!confirm("Import "+accepted.length+" new records? They are not yet reconciled to supporting evidence. "+skipped+" possible duplicates skipped; "+rejected+" invalid records rejected."))return {cancelled:true};
    commitEntries(db.entries.concat(accepted));render();
    return {accepted:accepted.length,skipped:skipped,rejected:rejected};
  }
  function importJson(text){
    if(locked())throw new Error("Financial restoration is disabled in unapproved staging. Open or create a workspace first.");
    var parsed=JSON.parse(text);
    if(!parsed||parsed.format!=="incomeos-accountant"||!Array.isArray(parsed.entries)||parsed.entries.length>15000)throw new Error("Not a supported IncomeOS accountant backup");
    var entries=parsed.entries.filter(validate);
    if(entries.length!==parsed.entries.length)throw new Error("Backup contains invalid or incomplete financial records");
    // Edit and Remove match records by id, so every restored record needs its own.
    var seen=new Set();
    entries.forEach(function(e){if(typeof e.id!=="string"||!e.id.trim()||seen.has(e.id))throw new Error("Backup contains records without a unique identifier");seen.add(e.id);});
    var ids=new Set(db.entries.map(function(e){return e.id;})),accepted=[];
    entries.forEach(function(e){if(!ids.has(e.id)){accepted.push(e);ids.add(e.id);}});
    if(!accepted.length)return {accepted:0,skipped:entries.length};
    if(!confirm("Restore "+accepted.length+" entries from local backup (existing IDs will not be overwritten)?"))return {cancelled:true};
    commitEntries(db.entries.concat(accepted));render();return {accepted:accepted.length,skipped:entries.length-accepted.length};
  }
  async function handleFile(input,format){
    var f=input.files?.[0];if(!f)return;
    try{
      if(f.size>2*1024*1024)throw new Error("Maximum upload size is 2 MB; split large exports.");
      var text=await f.text(),result=format==="csv"?importCsv(text):importJson(text);
      if(result&&!result.cancelled)alert("Import complete: "+result.accepted+" records added"+(result.skipped?", "+result.skipped+" duplicates skipped":"")+(result.rejected?", "+result.rejected+" records rejected":"")+". Review categories, business use and original documentation.");
    }catch(err){alert("Import was not completed. "+err.message);}
    input.value="";
  }
  function init(){
    load();
    $("receipt-date").value=today();$("cost-date").value=today();$("report-year").value=String(new Date().getFullYear());
    $("receipt-form").addEventListener("submit",function(ev){ev.preventDefault();var e=readIncome();if(!e)return;addOrUpdate(e,editingIncome);resetForm("receipt-form","income");});
    $("cost-form").addEventListener("submit",function(ev){ev.preventDefault();var e=readCost();if(!e)return;addOrUpdate(e,editingCost);resetForm("cost-form","outflow");});
    $("receipt-cancel").addEventListener("click",function(){resetForm("receipt-form","income");});
    $("cost-cancel").addEventListener("click",function(){resetForm("cost-form","outflow");});
    ["report-year","ledger-filter"].forEach(function(id){$(id).addEventListener("change",render);});
    $("ledger-search").addEventListener("input",renderList);
    $("refresh-accountant").addEventListener("click",render);
    $("export-ledger").addEventListener("click",exportDetail);
    $("export-review").addEventListener("click",exportReview);
    $("download-summary").addEventListener("click",exportSummary);
    $("backup-ledger").addEventListener("click",backup);
    $("print-accountant").addEventListener("click",printReport);
    $("download-template").addEventListener("click",function(){
      download(csv([["kind","date","description","vendor","category","amount_usd","status","business_use_pct","evidence_ref","notes","evidence_status","payment_status","accountant_questions","payment_account"],["expense","2026-01-01","Claude extra API usage","Anthropic","software","0.00","paid","","example only","Replace or delete example","missing","paid","","Card ending 0000"]]),"IncomeOS-import-template.csv","text/csv;charset=utf-8");
    });
    $("import-trigger").addEventListener("click",function(){$("import-ledger").click();});
    $("import-csv-trigger").addEventListener("click",function(){$("import-csv").click();});
    $("import-ledger").addEventListener("change",function(){handleFile(this,"json");});
    $("import-csv").addEventListener("change",function(){handleFile(this,"csv");});
    document.querySelectorAll("[data-vendor]").forEach(function(b){b.addEventListener("click",function(){
      setValue("cost-label",b.dataset.vendor);setValue("cost-payee",b.dataset.vendor);
      setValue("cost-category",b.dataset.costCategory||"software");
      $("cost-label").scrollIntoView({behavior:"smooth",block:"center"});
    });});
    render();
  }
  var wsDirty=false;
  function modeNote(){
    var n=$("ledger-mode");if(!n)return;
    n.hidden=!wsMode;
    n.textContent=wsMode?(wsDirty?"UNSAVED CHANGES. Save the workspace now (Research, This week) or they will be lost if this page closes. ":"")+"Editing the ledger in your open workspace. Changes are kept only when you save the workspace (encrypted, with a passphrase) in Research, This week. Nothing is stored in this browser."+(wsForeign.length?" "+wsForeign.length+" row(s) from other panels are kept as they are and not shown here.":""):"";
    var banner=$("financial-staging-interlock");if(banner&&window.IncomeOSFinancialReadOnly===true)banner.hidden=wsMode;
    // The staging lock disables these controls for browser storage; in workspace mode they edit the file instead.
    ["receipt-form","cost-form","import-trigger","import-csv-trigger","import-ledger","import-csv"].forEach(function(id){
      var el=$(id);if(!el||window.IncomeOSFinancialReadOnly!==true)return;
      var targets=el.tagName==="FORM"?el.querySelectorAll("input,select,textarea,button"):[el];
      Array.prototype.forEach.call(targets,function(c){c.disabled=!wsMode;if(wsMode)c.removeAttribute("aria-disabled");else c.setAttribute("aria-disabled","true");});
    });
  }
  function onWorkspace(ev){
    var ws=ev&&ev.detail;if(!ws||typeof ws!=="object"||!Array.isArray(ws.ledger))return;
    wsMode=true;fromWorkspace(ws);
    if(ev.type==="incomeos:workspace-loaded")wsDirty=false;else wsDirty=true;
    var go=$("ledger-save-now");if(go)go.hidden=!wsDirty;
    if(typeof document!=="undefined"&&$("ledger-list"))render();
    modeNote();
  }
  if(typeof document!=="undefined"&&document.addEventListener){
    ["incomeos:workspace-loaded","incomeos:workspace-changed","incomeos:workspace-restored"].forEach(function(n){document.addEventListener(n,onWorkspace);});
    document.addEventListener("incomeos:workspace-saved",function(){wsDirty=false;var go=$("ledger-save-now");if(go)go.hidden=true;modeNote();});
    document.addEventListener("click",function(ev){
      if(!ev.target||ev.target.id!=="ledger-save-now")return;
      // Take the owner straight to the save control; saving itself stays a deliberate owner action.
      var b=document.querySelector('.bottomnav button[data-view="research"]');if(b)b.click();
      var pass=$("briefing-passphrase");if(pass){pass.scrollIntoView({block:"center"});pass.focus();}
    });
  }
  window.IncomeOSAccountant={init:init,render:render,paidTotal:paidTotal,clear:function(){try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY);db={version:2,entries:[]};render();return true;}catch(_e){alert("Some locally stored accounting records could not be erased.");return false;}},totals:totals,categorySummary:categorySummary,reconciliationSummary:reconciliationSummary,receiptGaps:receiptGaps,completeness:completeness,validateEntry:validate,importCsv:importCsv,importJson:importJson,parseCsv:splitCsv,entriesForAnalysis:function(){return db.entries.map(function(e){return Object.assign({},e);});}};
})();