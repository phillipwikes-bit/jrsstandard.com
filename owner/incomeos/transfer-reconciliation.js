"use strict";
(function(){
  // Pure, conservative internal-transfer and credit-card-payment reconciliation.
  // No access to actual owner accounts, no document verification and no transactions.
  // Equal amounts and dates alone NEVER establish that funds belong to the owner.
  var MAX=10000;
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x);}
  function plain(x){return !!x&&typeof x==="object"&&!Array.isArray(x);}
  function exact(x,required){
    if(!plain(x)||Object.keys(x).some(function(k){return !required.includes(k);})||
      required.some(function(k){return !Object.prototype.hasOwnProperty.call(x,k);}))
      throw Error("Missing or unsupported transfer evidence fields");
  }
  function dayGap(a,b){return Math.abs((Date.parse(a+"T00:00:00Z")-Date.parse(b+"T00:00:00Z"))/86400000);}
  function bankId(row){return [row.institution,row.accountToken,row.transactionId].join("|");}
  function accountId(row){return row.institution+"|"+row.accountToken;}
  function reviewed(postId,state,label){
    var post=state.posted.get(postId),types=state.classes.get(postId)||[],approvals=state.reconciled.get(postId)||[];
    return !!post&&types.length===1&&types[0].data.classification===label&&
      approvals.length===1&&approvals[0].data.classificationEventId===types[0].id;
  }
  function problem(code,related){return {code:code,related:related||null};}
  async function assess(input){
    if(!plain(input)||!Array.isArray(input.journal)||!plain(input.statementPackage)||
      !Array.isArray(input.bindings)||!Array.isArray(input.pairs))throw Error("Source, journal, transfer and evidence arrays required");
    if(input.bindings.length>MAX||input.pairs.length>MAX)throw Error("Transfer evidence cap exceeded");
    if(!window.IncomeOSEventJournal||!window.IncomeOSAccountingControls||!window.IncomeOSStatementClose)
      throw Error("Verified accounting and journal dependencies unavailable");
    var journal=await window.IncomeOSEventJournal.verify(input.journal),
      source=window.IncomeOSStatementClose.assess(input.statementPackage),
      issues=[],manifest=new Map(),banks=new Map(),bindings=new Map(),usedBankIds=new Set(),usedPairs=new Set();
    if(source.gate.status!=="READY_FOR_ACCOUNTANT_SOURCE_REVIEW")
      issues.push(problem("STATEMENT_COVERAGE_HOLD","Complete account reconciliation required before any internal-transfer assertion"));
    input.statementPackage.expectedAccounts.forEach(function(a){
      if(!a||typeof a.institution!=="string"||typeof a.accountToken!=="string")return;
      var k=accountId(a);
      manifest.set(k,{balanceType:a.balanceType,ownerConfirmed:a.ownerConfirmed});
    });
    input.statementPackage.bankRows.forEach(function(row){
      try{var b=window.IncomeOSAccountingControls.normalizedBank(row);banks.set(b.id,b);}
      catch(_e){issues.push(problem("INVALID_BANK_SOURCE","Bank source failed normalization"));}
    });
    input.bindings.forEach(function(b,i){
      try{
        exact(b,["postedEventId","bankSourceId","journalSourceId","sourceEvidenceId"]);
        if(!id(b.postedEventId)||typeof b.bankSourceId!=="string"||!id(b.journalSourceId)||!id(b.sourceEvidenceId))
          throw Error("Invalid binding identity");
        if(bindings.has(b.postedEventId)||usedBankIds.has(b.bankSourceId))
          throw Error("Bank or journal posting reused by another source binding");
        bindings.set(b.postedEventId,b);
        usedBankIds.add(b.bankSourceId);
      }catch(_e){issues.push(problem("INVALID_OR_DUPLICATE_SOURCE_BINDING","Source binding "+(i+1)));}
    });
    var activeTransfers=new Set();
    journal.state.posted.forEach(function(_,postId){
      var types=journal.state.classes.get(postId)||[];
      if(types.length===1&&["transfer_in","transfer_out"].includes(types[0].data.classification))
        activeTransfers.add(postId);
    });
    var usedEvents=new Set(),matched=[];
    input.pairs.forEach(function(pair,i){
      try{
        exact(pair,["id","kind","debitEventId","creditEventId","reviewEvidenceId"]);
        if(!id(pair.id)||!id(pair.debitEventId)||!id(pair.creditEventId)||!id(pair.reviewEvidenceId)||
          !["INTERNAL_BANK_TRANSFER","CREDIT_CARD_PAYMENT"].includes(pair.kind)||
          pair.debitEventId===pair.creditEventId)throw Error("Invalid transfer identity or relationship");
        if(usedPairs.has(pair.id))throw Error("Transfer pair identity repeated");
        usedPairs.add(pair.id);
        if(usedEvents.has(pair.debitEventId)||usedEvents.has(pair.creditEventId))
          throw Error("An already paired financial posting cannot be allocated twice");
        if(!reviewed(pair.debitEventId,journal.state,"transfer_out")||
          !reviewed(pair.creditEventId,journal.state,"transfer_in"))
          throw Error("Both internal transfers must have active, owner-reviewed transfer classifications");
        var debit=journal.state.posted.get(pair.debitEventId),credit=journal.state.posted.get(pair.creditEventId);
        if(debit.data.direction!=="debit"||credit.data.direction!=="credit"||
          debit.data.amountCents!==credit.data.amountCents)throw Error("Debit and credit must be distinct and equal");
        if(dayGap(debit.data.postedDate,credit.data.postedDate)>7)
          throw Error("Opposing transaction dates exceed the supported settlement window");
        var first=bindings.get(pair.debitEventId),last=bindings.get(pair.creditEventId);
        if(!first||!last||first.bankSourceId===last.bankSourceId)
          throw Error("Each posting must have its own unambiguous external bank reference");
        var a=banks.get(first.bankSourceId),b=banks.get(last.bankSourceId);
        if(!a||!b)throw Error("Referenced posted bank rows missing");
        if(first.sourceEvidenceId!==debit.data.evidenceId||last.sourceEvidenceId!==credit.data.evidenceId||
          first.journalSourceId!==debit.data.sourceId||last.journalSourceId!==credit.data.sourceId)
          throw Error("Owner source binding evidence disagrees with journal posting");
        if(a.direction!=="debit"||b.direction!=="credit"||
          a.amountCents!==debit.data.amountCents||b.amountCents!==credit.data.amountCents||
          dayGap(a.date,debit.data.postedDate)>3||dayGap(b.date,credit.data.postedDate)>3)
          throw Error("External bank rows conflict with source amounts, dates or directions");
        var sourceAccount=accountId(a),targetAccount=accountId(b);
        if(sourceAccount===targetAccount)throw Error("Internal transfer requires distinct owner accounts");
        var from=manifest.get(sourceAccount),to=manifest.get(targetAccount);
        if(!from||!to||from.ownerConfirmed!==true||to.ownerConfirmed!==true||
          from.balanceType!=="asset"||
          to.balanceType!==(pair.kind==="CREDIT_CARD_PAYMENT"?"liability":"asset"))
          throw Error("Destination and source account ownership and types must be supported");
        usedEvents.add(pair.debitEventId);usedEvents.add(pair.creditEventId);
        matched.push({pairId:pair.id,kind:pair.kind,amountCents:debit.data.amountCents,
          debitEventId:pair.debitEventId,creditEventId:pair.creditEventId,
          accounts:{from:sourceAccount,to:targetAccount},ownerReviewedSourceOnly:true});
      }catch(e){issues.push(problem("TRANSFER_PAIR_HOLD","Pair "+(i+1)+": "+e.message));}
    });
    var unpaired=[];
    activeTransfers.forEach(function(postId){
      if(!usedEvents.has(postId)){
        unpaired.push(postId);
        issues.push(problem("UNPAIRED_CLASSIFIED_TRANSFER","Source posting "+postId+" lacks a complete reviewed opposing entry"));
      }
    });
    if(!input.pairs.length)issues.push(problem("NO_PAIR_EVIDENCE","No confirmed internal transfer or card-payment pairs supplied"));
    var total=0,bankTransfer=0,cardPayment=0;
    matched.forEach(function(p){
      total+=p.amountCents;
      if(p.kind==="INTERNAL_BANK_TRANSFER")bankTransfer+=p.amountCents;
      else cardPayment+=p.amountCents;
    });
    if(!Number.isSafeInteger(total)||!Number.isSafeInteger(bankTransfer)||!Number.isSafeInteger(cardPayment))
      throw Error("Transfer sum exceeds safe integer precision");
    var clear=issues.length===0;
    return {status:clear?"READY_FOR_ACCOUNTANT_PAIR_REVIEW_ONLY":"HOLD",sourceStatus:source.gate.status,
      matchedPairs:clear?matched:[],unpairedTransferEventIds:unpaired,issues:issues,
      tentativePairCount:matched.length,
      ownerReviewedInternalTransferCents:clear?bankTransfer:null,
      ownerReviewedCardPaymentCents:clear?cardPayment:null,
      earnedIncomeAddedCents:0,operatingExpenseAddedCents:0,
      independentStatementAuthentication:false,actualOwnerAccountAccess:false,
      executable:false,taxConclusion:false,
      note:"Paired bank movements and card payments are neither new income nor a second operating expense. This model relies on owner-reviewed source claims and cannot identify unclassified transfers or assert bank account ownership."};
  }
  window.IncomeOSTransferReconciliation=Object.freeze({assess:assess});
}());