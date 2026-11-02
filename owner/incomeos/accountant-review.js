"use strict";
(function () {
  // Source-only accountant review signals. A flag is not a tax determination.
  // Contains no network, storage, transaction or autonomous financial action.
  const ID = Object.freeze({
    missingEvidence:"missing-evidence",
    unreconciled:"unreconciled",
    allocationUnknown:"allocation-unknown",
    allocationReview:"allocation-review",
    refundReview:"refund-link",
    proceedsBasis:"investment-basis",
    capitalReview:"nonincome-review",
    expectedForm:"expected-tax-form",
    pending:"payment-pending",
    sourceDuplicate:"duplicate-reference",
    foreignFx:"foreign-currency"
  });
  const DEFINITIONS = Object.freeze([
    { id:ID.missingEvidence, severity:"high", title:"Missing supporting reference", next:"Locate an invoice, receipt or transaction reference." },
    { id:ID.unreconciled, severity:"high", title:"Payment not reconciled", next:"Compare the entry with source evidence; do not assume received or deductible." },
    { id:ID.allocationUnknown, severity:"high", title:"Business-use percentage unknown", next:"Document use and determine an allocation with the accountant." },
    { id:ID.refundReview, severity:"high", title:"Unallocated refund or credit", next:"Match to the original charge and identify the proper accounting year." },
    { id:ID.proceedsBasis, severity:"high", title:"Investment proceeds need cost basis", next:"Obtain basis, holding-period and transaction records before treating as gain." },
    { id:ID.capitalReview, severity:"medium", title:"Possible nonincome receipt", next:"Determine whether this is a refund, transfer or principal recovery." },
    { id:ID.sourceDuplicate, severity:"medium", title:"Reference reused by multiple entries", next:"Examine the documents; this may be legitimate line-item allocation or an import duplicate." },
    { id:ID.expectedForm, severity:"medium", title:"Expected tax form outstanding", next:"Verify issuance and reconcile the form to recorded payments." },
    { id:ID.pending, severity:"medium", title:"Expected payment not received", next:"Track separately; do not include in confirmed cash received." },
    { id:ID.foreignFx, severity:"medium", title:"Non-USD receipt conversion", next:"Verify original currency, actual payment conversion and applicable reporting rate." },
    { id:ID.allocationReview, severity:"medium", title:"Shared-use charge needs supporting rationale", next:"Substantiate the allocation, especially for home internet, phone and home office." }
  ]);
  const DEF = Object.fromEntries(DEFINITIONS.map(e=>[e.id,e]));
  const SEVERITY = Object.freeze({high:0,medium:1});
  function text(s){return String(s==null?"":s).trim();}
  function eligible(e){return e&&typeof e==="object"&&!Array.isArray(e)&&
     (e.kind==="income"||e.kind==="outflow")&&
     typeof e.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.date);}
  function inspect(records, year){
    if(!Array.isArray(records)||records.length>15000)throw Error("Unsupported accountant record set");
    if(!/^\d{4}$/.test(String(year)))throw Error("A four-digit report year is required");
    const entries=records.filter(e=>eligible(e)&&e.date.slice(0,4)===String(year));
    const seen=new Map(),flags=[];
    for (let i=0;i<entries.length;i++){
      const e=entries[i],key=text(e.reference).toLowerCase();
      if(key){const arr=seen.get(key)||[];arr.push(i);seen.set(key,arr);}
    }
    function add(e,i,id){
      const d=DEF[id];
      if(!d)throw Error("Unknown evidence issue");
      flags.push({
        id:id,severity:d.severity,title:d.title,action:d.next,
        recordId:text(e.id).slice(0,128)||"row-"+(i+1),
        date:e.date,description:text(e.label).slice(0,100)||"(untitled)",
        amount:e.kind==="income"?Number(e.grossUsd)||0:Number(e.amountUsd)||0,
        kind:e.kind
      });
    }
    for(let i=0;i<entries.length;i++){
      const e=entries[i],reference=text(e.reference);
      if(!reference)add(e,i,ID.missingEvidence);
      if(e.reconciled!==true)add(e,i,ID.unreconciled);
      if(e.kind==="outflow"){
        if(e.type==="expense"){
          if(e.businessUse===null||e.businessUse===undefined||e.businessUse==="")add(e,i,ID.allocationUnknown);
          if(["internet","homeoffice"].includes(e.category) && e.businessUse!==null &&
            e.businessUse!==undefined && e.businessUse!=="" && Number(e.businessUse)>0)
            add(e,i,ID.allocationReview);
        }
        if(e.type==="refund")add(e,i,ID.refundReview);
      }else{
        if(e.status==="pending")add(e,i,ID.pending);
        if(e.scope==="proceeds")add(e,i,ID.proceedsBasis);
        if(e.scope==="nonincome")add(e,i,ID.capitalReview);
        if(e.docStatus==="expected")add(e,i,ID.expectedForm);
        if(e.currency && e.currency!=="USD")add(e,i,ID.foreignFx);
      }
      if(reference && (seen.get(reference.toLowerCase())||[]).length>1)add(e,i,ID.sourceDuplicate);
    }
    flags.sort((a,b)=>SEVERITY[a.severity]-SEVERITY[b.severity]||
      a.date.localeCompare(b.date)||a.id.localeCompare(b.id)||a.recordId.localeCompare(b.recordId));
    const counts=Object.fromEntries(DEFINITIONS.map(e=>[e.id,0]));
    flags.forEach(f=>counts[f.id]++);
    const high=flags.filter(f=>f.severity==="high").length;
    const recordsAffected=new Set(flags.map(f=>f.recordId)).size;
    return {
      year:String(year),recordCount:entries.length,openIssueCount:flags.length,
      highCount:high,mediumCount:flags.length-high,recordsAffected,
      issues:flags,counts:counts,
      advisory:"These exceptions identify unresolved documentation, not tax deductibility. Bank/account coverage and source completeness are not independently certified."
    };
  }
  window.IncomeOSAccountantReview=Object.freeze({inspect,definitions:DEFINITIONS});
}());