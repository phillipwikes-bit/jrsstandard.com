"use strict";
(function () {
  // Pure, side-effect-free accounting reconciliation and financial-quality diagnostics.
  // Processes copies only. No network, browser storage, financial execution, or tax conclusions.
  var MAX_CENTS = 1000000000000;
  function validDate(value) {
    if (typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var n=Date.parse(value+"T00:00:00Z");
    return Number.isFinite(n) && new Date(n).toISOString().slice(0,10)===value;
  }
  function cents(value) {
    if ((typeof value!=="string" && typeof value!=="number") || String(value).trim()==="") throw new Error("Missing monetary value");
    var s=String(value).trim();
    if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(s)) throw new Error("Currency must have no more than two decimal places");
    var neg=s[0]==="-",u=neg?s.slice(1):s,p=u.split("."),n=Number(p[0])*100+Number((p[1]||"").padEnd(2,"0"));
    if (!Number.isSafeInteger(n) || n>MAX_CENTS) throw new Error("Currency amount exceeds bounded range");
    return neg?-n:n;
  }
  function dollars(c) { return Math.round(c)/100; }
  function dayDiff(a,b) {
    return Math.abs((Date.parse(a+"T00:00:00Z")-Date.parse(b+"T00:00:00Z"))/86400000);
  }
  function clean(x,len) { return String(x==null?"":x).trim().slice(0,len); }
  function sourceId(x) {
    var parts=[x.institution,x.accountToken,x.transactionId].map(function(v){return clean(v,100);});
    if (parts.some(function(s){return !s || s.includes("|");})) throw new Error("Source requires institution, masked account token and immutable transaction id");
    // Tokens must be opaque reference labels, not raw payment or account identifiers.
    if (/^\d{9,}$/.test(parts[1]) || /@/.test(parts[1])) throw new Error("Raw account identifiers must not be imported");
    return parts.join("|");
  }
  function normalizedBank(row) {
    if(!row || typeof row!=="object" || Array.isArray(row))throw new Error("Invalid bank source");
    var id=sourceId(row);
    if(!validDate(row.date))throw new Error("Invalid posted date");
    if(!["debit","credit"].includes(row.direction))throw new Error("Invalid bank direction");
    if(row.posted!==true)throw new Error("Unposted transactions cannot be treated as settled evidence");
    if(row.currency!=="USD")throw new Error("Explicit currency conversion required for non-USD transactions");
    var amount=cents(row.amountUsd);
    if(amount<=0)throw new Error("Bank source amount must be positive");
    return {id:id,transactionId:clean(row.transactionId,100),institution:clean(row.institution,100),
      accountToken:clean(row.accountToken,100),date:row.date,amountCents:amount,direction:row.direction,
      description:clean(row.description,200),posted:true};
  }
  function entryKind(e) {
    if(e.kind==="income"){
      if(e.status==="pending")return "pending";
      if(e.status!=="paid")return "invalid";
      if(e.scope==="income")return ["interest","dividend","investment"].includes(e.category)?"investment-income":"earned-or-other-income";
      if(e.scope==="nonincome")return "recovery-or-return-of-principal";
      if(e.scope==="proceeds")return "unallocated-sale-proceeds";
      return "invalid";
    }
    if(e.kind==="outflow")return ["expense","taxpayment","capital","other"].includes(e.type)?e.type:"invalid";
    return "invalid";
  }
  function ledgerEntry(e) {
    if(!e || typeof e!=="object" || Array.isArray(e) || !validDate(e.date))throw new Error("Invalid ledger date");
    var id=clean(e.id,128),kind=entryKind(e);
    if(!id || kind==="invalid")throw new Error("Invalid ledger identity or category");
    var value=cents(e.kind==="income"?e.grossUsd:e.amountUsd);
    if(value<=0)throw new Error("Ledger values must be positive; refunds need their own financial class");
    var fee=e.kind==="income"?cents(e.feesUsd??0):0;
    if(fee<0||fee>value)throw new Error("Invalid withheld fee");
    var allocation=e.businessUse==null?null:Number(e.businessUse);
    if(allocation!==null && (!Number.isFinite(allocation)||allocation<0||allocation>100))throw new Error("Invalid business-use allocation");
    var ref=null;
    if(e.bankSource!==undefined && e.bankSource!==null){
      if(typeof e.bankSource!=="object")throw new Error("Invalid bank linkage");
      ref=sourceId(e.bankSource);
    }
    return {id:id,date:e.date,kind:kind,amountCents:value,feeCents:fee,
      direction:e.kind==="income"?"credit":"debit",
      vendor:clean(e.payer||e.label,100),category:clean(e.category,70),bankId:ref,
      ownerMarkedReconciled:e.reconciled===true,documentStatus:clean(e.evidenceStatus||e.docStatus||"unknown",60),
      allocation:allocation,sourceReference:clean(e.reference,120)};
  }
  function dedupSources(rows) {
    var map=new Map(),duplicates=[],conflicts=[],invalid=[];
    (Array.isArray(rows)?rows:[]).forEach(function(row,i){
      try{
        var b=normalizedBank(row),prev=map.get(b.id);
        if(!prev)map.set(b.id,b);
        else if(prev.amountCents===b.amountCents&&prev.direction===b.direction&&prev.date===b.date)duplicates.push(b.id);
        else conflicts.push(b.id);
      }catch(err){invalid.push({index:i,reason:err.message});}
    });
    return {rows:Array.from(map.values()),duplicates:duplicates,conflicts:conflicts,invalid:invalid};
  }
  function coverageCheck(items) {
    if(!Array.isArray(items) || !items.length)return {complete:false,covered:0,issues:["No verified financial-institution coverage declaration"]};
    var issues=[],ids=new Set(),covered=0;
    items.forEach(function(x,i){
      try{
        if(!x || typeof x!=="object")throw new Error("Invalid account coverage");
        var token=clean(x.institution,100)+"|"+clean(x.accountToken,100);
        if(!clean(x.institution,100)||!clean(x.accountToken,100)||ids.has(token))throw new Error("Missing or repeated institution/account coverage");
        ids.add(token);
        if(!validDate(x.from)||!validDate(x.through)||x.from>x.through)throw new Error("Invalid coverage interval");
        if(x.complete!==true || x.sourceVerified!==true)throw new Error("Coverage not independently verified");
        covered++;
      }catch(err){issues.push("Coverage row "+(i+1)+": "+err.message);}
    });
    return {complete:issues.length===0,covered:covered,issues:issues};
  }
  function analyze(entries,bankRows,coverage) {
    var source=dedupSources(bankRows),cov=coverageCheck(coverage),known=new Map(),issues=[],rec=[],byBank=new Map();
    var input=Array.isArray(entries)?entries:[];
    input.forEach(function(e,i){
      try{
        var normalized=ledgerEntry(e);
        if(known.has(normalized.id)){issues.push({code:"DUPLICATE_LEDGER_ID",entryId:normalized.id,detail:"Multiple records share a ledger ID"});return;}
        known.set(normalized.id,normalized);rec.push(normalized);
      }catch(err){issues.push({code:"INVALID_LEDGER",entryId:clean(e&&e.id,128),detail:"Record "+(i+1)+": "+err.message});}
    });
    var banks=new Map(source.rows.map(function(b){return [b.id,b];}));
    rec.forEach(function(e){
      if(!e.bankId)return;
      if(!byBank.has(e.bankId))byBank.set(e.bankId,[]);
      byBank.get(e.bankId).push(e);
    });
    byBank.forEach(function(items,id){if(items.length>1)issues.push({code:"BANK_LINK_COLLISION",bankId:id,entryIds:items.map(function(e){return e.id;}),detail:"One bank posting is linked to multiple ledger records"});});
    var used=new Set(),match=[],suggestions=[];
    rec.forEach(function(e){
      if(e.kind==="pending"){match.push({entryId:e.id,state:"NOT_RECEIVED",bankId:null});return;}
      var matched=e.bankId?banks.get(e.bankId):undefined;
      if(matched){
        var collision=(byBank.get(e.bankId)||[]).length>1;
        var consistent=matched.direction===e.direction && matched.amountCents===(e.amountCents-e.feeCents) && dayDiff(matched.date,e.date)<=3;
        if(!consistent || collision){
          issues.push({code:collision?"BANK_LINK_COLLISION":"BANK_LINK_MISMATCH",entryId:e.id,bankId:matched.id,detail:"Exact source ID but amounts, direction, date or uniqueness conflict"});
          match.push({entryId:e.id,state:"CONFLICT",bankId:matched.id});
        }else{
          used.add(matched.id);
          match.push({entryId:e.id,state:e.ownerMarkedReconciled?"OWNER_REVIEWED_BANK_MATCH":"BANK_LINKED_NOT_OWNER_REVIEWED",bankId:matched.id});
        }
      }else{
        if(e.bankId)issues.push({code:"MISSING_BANK_SOURCE",entryId:e.id,bankId:e.bankId,detail:"Referenced bank posting is missing from the supplied source"});
        var possible=source.rows.filter(function(b){return !used.has(b.id)&&b.direction===e.direction&&b.amountCents===e.amountCents-e.feeCents&&dayDiff(b.date,e.date)<=2;}).slice(0,6);
        suggestions.push({entryId:e.id,state:"UNVERIFIED_DATE_AMOUNT_CANDIDATES",bankIds:possible.map(function(b){return b.id;}),candidateCount:possible.length});
        match.push({entryId:e.id,state:"UNMATCHED",bankId:null});
      }
      if(e.kind==="expense"&&e.allocation===null)issues.push({code:"UNKNOWN_ALLOCATION",entryId:e.id,detail:"Business-use share not established"});
      if(e.kind==="unallocated-sale-proceeds")issues.push({code:"BASIS_NOT_ESTABLISHED",entryId:e.id,detail:"Sale proceeds cannot establish taxable gains without cost basis"});
      if(e.kind==="recovery-or-return-of-principal")issues.push({code:"NONINCOME_RECEIPT",entryId:e.id,detail:"Refund or returned principal must not count as new earnings"});
    });
    source.rows.forEach(function(b){if(!used.has(b.id))issues.push({code:"UNASSIGNED_BANK_POSTING",bankId:b.id,detail:"Bank posting not linked to a uniquely owner-reviewed ledger entry; credits may be transfers or refunds"});});
    source.conflicts.forEach(function(id){issues.push({code:"CONFLICTING_SOURCE_ID",bankId:id,detail:"Same source ID has contradictory bank values"});});
    source.invalid.forEach(function(x){issues.push({code:"INVALID_BANK_ROW",detail:"Source row "+(x.index+1)+": "+x.reason});});
    cov.issues.forEach(function(reason){issues.push({code:"SOURCE_COVERAGE",detail:reason});});
    var classes={};rec.forEach(function(e){if(e.kind==="pending")return;classes[e.kind]=(classes[e.kind]||0)+e.amountCents;});
    var approved=match.filter(function(m){return m.state==="OWNER_REVIEWED_BANK_MATCH";});
    var verifiedIds=new Set(approved.map(function(m){return m.entryId;}));
    var reviewedCents={};rec.forEach(function(e){if(verifiedIds.has(e.id)){reviewedCents[e.kind]=(reviewedCents[e.kind]||0)+e.amountCents;}});
    // A reviewed source match is not an external audit, an income tax conclusion, or investable funds.
    var closeBlockers=issues.filter(function(x){return !["UNKNOWN_ALLOCATION","BASIS_NOT_ESTABLISHED","NONINCOME_RECEIPT"].includes(x.code);});
    if(match.some(function(m){return m.state==="BANK_LINKED_NOT_OWNER_REVIEWED"||m.state==="UNMATCHED"||m.state==="CONFLICT"}))closeBlockers.push({code:"UNRESOLVED_LEDGER_MATCH",detail:"One or more posted ledger entries require owner reconciliation"});
    var closeReady=cov.complete&&source.conflicts.length===0&&source.invalid.length===0&&closeBlockers.length===0;
    function usdMap(input){var out={};Object.keys(input).forEach(function(k){out[k]=dollars(input[k]);});return out;}
    return {coverage:cov,bank:{distinct:source.rows.length,duplicateCount:source.duplicates.length,conflictCount:source.conflicts.length,invalidCount:source.invalid.length},
      ledger:{submitted:input.length,accepted:rec.length,pending:rec.filter(function(x){return x.kind==="pending";}).length,
        ownerReviewedBankMatches:approved.length,unverified:match.filter(function(x){return x.state!=="OWNER_REVIEWED_BANK_MATCH"&&x.state!=="NOT_RECEIVED";}).length},
      receivedByClassSelfReported:usdMap(classes),reviewedBankLinkedByClass:usdMap(reviewedCents),
      issues:issues,suggestions:suggestions,matches:match,
      closeGate:{status:closeReady?"READY_FOR_ADDITIONAL_ACCOUNTANT_REVIEW":"HOLD",readyForTaxFiling:false,
        independentlyAudited:false,executable:false,blockers:closeBlockers,
        note:"A ready status indicates source matches under stated coverage, not complete tax, external audit or spendable-cash verification."}};
  }
  window.IncomeOSAccountingControls=Object.freeze({validDate:validDate,cents:cents,ledgerEntry:ledgerEntry,
    normalizedBank:normalizedBank,coverageCheck:coverageCheck,analyze:analyze});
}());