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
  var STATUS = ["paid","pending"];
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
    return EXPENSE_TYPES.includes(e.type) && COST_CATEGORIES.includes(e.category) && num(e.amountUsd)>0 && num(e.amountUsd)<=1e10 && (e.businessUse===null || (num(e.businessUse)>=0 && num(e.businessUse)<=100));
  }
  function write(){
    if(window.IncomeOSFinancialReadOnly===true)return false;
    try{localStorage.setItem(KEY,JSON.stringify(db));return true;}
    catch(_e){alert("IncomeOS could not save locally. Available browser storage may be full.");return false;}
  }
  // Persist first, then update the current ledger. An interrupted storage write
  // must never appear as an accepted accounting record in the running interface.
  function commitEntries(entries){
    if(window.IncomeOSFinancialReadOnly===true)throw new Error("Financial changes are disabled in unapproved staging");
    if(!Array.isArray(entries)||entries.length>15000||entries.some(function(x){return !validate(x);}))
      throw new Error("Financial records are invalid or exceed the ledger limit");
    var next={version:2,entries:entries};
    try{localStorage.setItem(KEY,JSON.stringify(next));}
    catch(_e){throw new Error("Financial records could not be saved. No ledger update was accepted.");}
    db=next;
    return true;
  }
  function migrateLegacy(){
    if(window.IncomeOSFinancialReadOnly===true)return;
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
  function totals(entries){
    var income=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="income";});
    var nonincome=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="nonincome";});
    var proceeds=entries.filter(function(e){return e.kind==="income"&&e.status==="paid"&&e.scope==="proceeds";});
    var pending=entries.filter(function(e){return e.kind==="income"&&e.status==="pending";});
    var expenses=entries.filter(function(e){return e.kind==="outflow"&&e.type==="expense";});
    var taxpayments=entries.filter(function(e){return e.kind==="outflow"&&e.type==="taxpayment";});
    var capital=entries.filter(function(e){return e.kind==="outflow"&&e.type==="capital";});
    var other=entries.filter(function(e){return e.kind==="outflow"&&e.type==="other";});
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
      unreconciled:entries.filter(function(e){return !e.reconciled}).length
    };
  }
  function paidTotal(){return totals(db.entries).gross;}
  function addOrUpdate(e,editId){
    if(window.IncomeOSFinancialReadOnly===true)throw new Error("Financial entry is disabled in unapproved staging");
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
    else{$("cost-business-use").value="";$("cost-cancel").hidden=true;$("cost-save").textContent="Save outflow";editingCost=null;}
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
      reconciled:$("cost-evidence-status").value==="both",importedFrom:"manual"};
    if(!Number.isFinite(amount)||amount<=0||(pct!==null&&(!Number.isFinite(pct)||pct<0||pct>100))||!validate(e)){alert("Please enter a valid expense description, date, positive amount and business-use percentage from 0 to 100.");return null;}
    return e;
  }
  function setValue(id,value){if($(id))$(id).value=value==null?"":String(value);}
  function startEdit(e){
    if(window.IncomeOSFinancialReadOnly===true)return;
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
    var grp={},forms={};
    rows.forEach(function(e){
      var key=(e.kind==="income"?"Income · ":"Outflow · ")+e.category;
      grp[key]=(grp[key]||0)+(e.kind==="income" ? (e.status==="paid" ? e.grossUsd:0) : e.amountUsd);
      if(e.kind==="income"&&e.taxForm&&e.taxForm!=="None / unknown")forms[e.taxForm]=(forms[e.taxForm]||0)+1;
    });
    place(box,"h4","","Recorded categories");
    Object.keys(grp).sort().forEach(function(key){var row=place(box,"div","accountant-line");place(row,"span","",key);place(row,"strong","",money(grp[key]));});
    place(box,"p","muted","Supporting form references: "+(Object.keys(forms).length?Object.keys(forms).map(function(k){return k+" ("+forms[k]+")";}).join(", "):"None recorded")+". No bank, tax authority or payer validation has been performed.");
  }
  function showEntry(e){
    var out=place($("ledger-list"),"div","entry");var left=place(out,"div","entry-info");
    place(left,"strong","",e.label);
    place(left,"small","",e.date+" · "+(e.kind==="income"?"RECEIPT · "+e.category+" · "+(e.status==="paid"?"Recorded received":"Pending"):(e.type==="refund"?"REFUND/CREDIT, UNALLOCATED · ":"OUTFLOW · ")+e.category+" · "+e.type));
    place(left,"small","",e.payer||"Source not identified");
    if(e.kind==="outflow"&&e.type!=="refund")place(left,"small","","Business use "+(e.businessUse===null||e.businessUse===undefined?"not determined":String(e.businessUse)+"%")+" · Evidence "+(e.evidenceStatus||"missing"));
    if(!e.reconciled)place(left,"small notice","Not reconciled to source evidence");
    var right=place(out,"div","entry-actions");
    place(right,"div","amt"+((e.status==="pending")?" pending":""),(e.kind==="outflow"&&e.type!=="refund"?"−":"+")+money(e.kind==="income"?e.grossUsd:e.amountUsd));
    var buttons=place(right,"div","entry-buttons"),ed=place(buttons,"button","","Edit"),del=place(buttons,"button","","Remove");
    ed.type="button";del.type="button";ed.addEventListener("click",function(){startEdit(e);});
    del.addEventListener("click",function(){
      if(window.IncomeOSFinancialReadOnly===true)return;
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
      if(filter==="pending"&&!(e.kind==="income"&&e.status==="pending"))return false;
      return !q || [e.label,e.category,e.payer,e.reference,e.notes].join(" ").toLowerCase().includes(q);
    }).sort(function(a,b){return b.date.localeCompare(a.date);});
    $("ledger-list").replaceChildren();
    if(!rows.length)place($("ledger-list"),"div","empty","No records in this year/filter. You can enter income or expenses from any source.");
    else rows.forEach(showEntry);
  }
  function render(){renderSummary();renderList();if(typeof window.dispatchEvent==="function" && typeof window.CustomEvent==="function")window.dispatchEvent(new window.CustomEvent("incomeos:ledger-updated"));}
  function csvSafe(x){var s=String(x??"");if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function csv(arr){return arr.map(function(row){return row.map(csvSafe).join(",");}).join("\r\n")+"\r\n";}
  function download(text,name,type){
    var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=node("a");
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
  }
  function exportDetail(){
    var rows=[["Date","Kind","Type / scope","Category","Description","Payer / payee","Original amount","Currency","USD per unit","Gross USD","Platform fees USD","Other paid outflows USD","Unallocated refund credit USD","Business-use %","Status","Tax form","Form status","Evidence status","Evidence reference","Reconciled","Notes","Entry ID"]];
    yearEntries().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(e){
      rows.push([e.date,e.kind,e.kind==="income"?e.scope:e.type,e.category,e.label,e.payer||"",e.amountOriginal??"",e.currency??"USD",e.fx??1,e.kind==="income"?e.grossUsd:"",e.feesUsd??0,e.kind==="outflow"&&e.type!=="refund"?e.amountUsd:"",e.kind==="outflow"&&e.type==="refund"?e.amountUsd:"",e.kind==="outflow"&&e.type!=="refund"?(e.businessUse==null?"":e.businessUse):"",e.status??"paid",e.taxForm??"",e.docStatus??"",e.evidenceStatus??"",e.reference??"",e.reconciled?"yes":"no",e.notes??"",e.id]);
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
      ["Unreconciled record count",t.unreconciled],["Expense allocations not determined",t.allocationPending]];
    download(csv([["IncomeOS personal tax-year summary",currentYear()]].concat([["Category","Amount or count"]],pairs)),"IncomeOS-accountant-summary-"+currentYear()+".csv","text/csv;charset=utf-8");
  }
  function backup(){download(JSON.stringify({format:"incomeos-accountant",version:2,exportedAt:new Date().toISOString(),entries:db.entries},null,2),"IncomeOS-accountant-private-backup-"+today()+".json","application/json");}
  function escapePrint(text){return String(text??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function printReport(){
    var t=totals(yearEntries());
    var r=$("print-report");r.replaceChildren();
    place(r,"h1","","IncomeOS | Accountant Annual Earnings & Expense Report");
    place(r,"p","","Tax year: "+currentYear()+" | Generated: "+today()+" | Self-reported records, not tax determinations");
    place(r,"h2","","Annual reconciliation");
    var table=place(r,"table");var body=place(table,"tbody");
    [["Received gross potential income",t.gross],["Withheld platform fees",t.fees],["Other recorded expense candidates",t.expenses],["Business-use estimate (not approved deduction)",t.possibleBusinessUse],["Recorded receipts less fees/expenses",round(t.gross-t.fees-t.expenses)],["Pending unpaid receipts",t.pending],["Possible nonincome / refunded principal",t.returned],["Asset sale proceeds, basis not determined",t.proceeds],["Estimated tax payments",t.taxPaid],["Capital contributions / asset costs",t.capital],["Unallocated refunds / credits, not netted",t.refundCredits],["Unreconciled records",t.unreconciled]].forEach(function(p){var tr=place(body,"tr");place(tr,"th","",p[0]);place(tr,"td","",typeof p[1]==="number"&&p[0]!=="Unreconciled records"?money(p[1]):p[1]);});
    place(r,"h2","","Detailed entries");
    var dt=place(r,"table"),th=place(dt,"thead"),htr=place(th,"tr");
    ["Date","Kind","Source","Category","Gross USD","Fees USD","Outflow USD","Refund credit USD","Status / review"].forEach(function(x){place(htr,"th","",x);});
    var tb=place(dt,"tbody");
    yearEntries().slice().sort(function(a,b){return a.date.localeCompare(b.date);}).forEach(function(e){
      var tr=place(tb,"tr");
      [e.date,e.kind,e.label+(e.payer?" · "+e.payer:""),e.category,e.kind==="income"?money(e.grossUsd):"",e.kind==="income"?money(e.feesUsd):"",e.kind==="outflow"&&e.type!=="refund"?money(e.amountUsd):"",e.kind==="outflow"&&e.type==="refund"?money(e.amountUsd):"",e.kind==="income"?e.status+" / "+e.scope:(e.type+" / "+(e.businessUse==null?"allocation unknown":e.businessUse+"% business use"))].forEach(function(x){place(tr,"td","",x);});
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
    var allowed=expected.concat(["evidence_status"]);
    if(expected.some(function(x){return !h.includes(x)})||h.some(function(x){return !allowed.includes(x)})||new Set(h).size!==h.length)
      throw new Error("CSV headers must match the IncomeOS import template without duplicate or unsupported fields");
    return h;
  }
  function importCsv(text){
    if(window.IncomeOSFinancialReadOnly===true)throw new Error("Financial import is disabled in unapproved staging");
    var rows=splitCsv(text);if(rows.length<2)throw new Error("No data rows found");
    if(rows.length>5001)throw new Error("Import limit is 5,000 rows per file");
    var h=findImportFields(rows[0]),idx=function(k){return h.indexOf(k);};
    var accepted=[],skipped=0,rejected=0;
    // A dated bank transaction identifier is more reliable than merchant/amount matching:
    // two valid API charges can share the same day, vendor and dollar amount.
    function fingerprint(e) {
      var ref=String(e.reference||"").trim().toLowerCase(),amount=e.kind==="income"?e.grossUsd:e.amountUsd;
      return ref ? [e.kind,"ref",ref].join("|") :
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
        status:get("status")==="paid"?"paid":"pending",scope:"income",method:"Unknown",taxForm:"None / unknown",docStatus:"not-expected",reference:limit(get("evidence_ref"),120),notes:limit(get("notes"),500),reconciled:false,importedFrom:"csv"};
      }else if(["expense","outflow","taxpayment","capital","other","refund"].includes(kind)){
        var rawBusiness=get("business_use_pct").trim(),bus=rawBusiness===""?null:num(rawBusiness);if(bus!==null&&(!Number.isFinite(bus)||bus<0||bus>100)){rejected++;continue;}
        e={kind:"outflow",type:kind==="expense"||kind==="outflow"?"expense":kind,label:label,payer:limit(get("vendor"),100),date:date,
        category:COST_CATEGORIES.includes(category)?category:"other",amountUsd:round(amount),businessUse:kind==="refund"?null:bus,
        evidenceStatus:EVIDENCE_STATUS.includes(get("evidence_status").toLowerCase())?get("evidence_status").toLowerCase():"missing",reference:limit(get("evidence_ref"),120),notes:limit(get("notes"),500),reconciled:false,importedFrom:"csv"};
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
    if(window.IncomeOSFinancialReadOnly===true)throw new Error("Financial restoration is disabled in unapproved staging");
    var parsed=JSON.parse(text);
    if(!parsed||parsed.format!=="incomeos-accountant"||!Array.isArray(parsed.entries)||parsed.entries.length>15000)throw new Error("Not a supported IncomeOS accountant backup");
    var entries=parsed.entries.filter(validate);
    if(entries.length!==parsed.entries.length)throw new Error("Backup contains invalid or incomplete financial records");
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
    $("download-summary").addEventListener("click",exportSummary);
    $("backup-ledger").addEventListener("click",backup);
    $("print-accountant").addEventListener("click",printReport);
    $("download-template").addEventListener("click",function(){
      download(csv([["kind","date","description","vendor","category","amount_usd","status","business_use_pct","evidence_ref","notes","evidence_status"],["expense","2026-01-01","Claude extra API usage","Anthropic","software","0.00","paid","","example only","Replace or delete example","missing"]]),"IncomeOS-import-template.csv","text/csv;charset=utf-8");
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
  window.IncomeOSAccountant={init:init,render:render,paidTotal:paidTotal,clear:function(){try{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY);db={version:2,entries:[]};render();return true;}catch(_e){alert("Some locally stored accounting records could not be erased.");return false;}},totals:totals,importCsv:importCsv,parseCsv:splitCsv,entriesForAnalysis:function(){return db.entries.map(function(e){return Object.assign({},e);});}};
})();