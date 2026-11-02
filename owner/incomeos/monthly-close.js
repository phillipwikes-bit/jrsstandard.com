"use strict";
(function(){
  // Source-to-general-ledger monthly close review. Never a tax close, a verified
  // bank connection, a statement download, or authenticated accounting storage.
  function object(v){return !!v&&typeof v==="object"&&!Array.isArray(v);}
  function id(v){return typeof v==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(v)&&!/^\d{9,}$/.test(v);}
  function exact(v,expected){
    if(!object(v)||Object.keys(v).some(function(k){return !expected.includes(k);})||
      expected.some(function(k){return !Object.prototype.hasOwnProperty.call(v,k);}))
      throw Error("Incomplete or unsupported close evidence");
  }
  function fault(code,reference){return {code:code,reference:reference||null};}
  function assessSources(input,v){
    var issues=[],chart=new Map(),financial=new Map(),seenPhysical=new Set(),
      manifest=new Map(),bank=new Map(),statementLinks=new Map(),
      sourceEntry=new Map(),usedPost=new Set(),usedBank=new Set();
    input.chart.forEach(function(a){
      if(object(a)&&typeof a.id==="string")chart.set(a.id,a.kind);
    });
    input.statementPackage.expectedAccounts.forEach(function(a){
      if(object(a)&&typeof a.institution==="string"&&typeof a.accountToken==="string")
        manifest.set(a.institution.trim()+"|"+a.accountToken,a);
    });
    input.statementPackage.bankRows.forEach(function(raw){
      try{var b=window.IncomeOSAccountingControls.normalizedBank(raw);
        if(bank.has(b.id))issues.push(fault("DUPLICATE_BANK_POSTING",b.id));else bank.set(b.id,b);
      }catch(_e){issues.push(fault("INVALID_SOURCE_BANK_ROW"));}
    });
    input.statementPackage.accountingMatches.forEach(function(row){
      if(!object(row)||typeof row.bankId!=="string"||!id(row.entryId)||row.state!=="OWNER_REVIEWED_BANK_MATCH")
        issues.push(fault("INVALID_STATEMENT_LINK"));
      else if(statementLinks.has(row.bankId))issues.push(fault("DUPLICATE_STATEMENT_LINK",row.bankId));
      else statementLinks.set(row.bankId,row.entryId);
    });
    input.entries.forEach(function(e){
      if(!object(e)||!Array.isArray(e.sourceEventIds))return;
      e.sourceEventIds.forEach(function(s){
        if(sourceEntry.has(s))issues.push(fault("REUSED_LEDGER_POSTING",s));
        else sourceEntry.set(s,e);
      });
    });
    input.sourceAccountMap.forEach(function(m,i){
      try{
        exact(m,["accountId","bankAccountId","evidenceId"]);
        if(!id(m.accountId)||!id(m.evidenceId)||typeof m.bankAccountId!=="string"||
          !chart.has(m.accountId)||!["cash_asset","card_liability"].includes(chart.get(m.accountId))||
          !manifest.has(m.bankAccountId)||manifest.get(m.bankAccountId).ownerConfirmed!==true)
          throw Error("Account chart to bank source is unverified");
        var bt=manifest.get(m.bankAccountId).balanceType;
        if((chart.get(m.accountId)==="card_liability")!==(bt==="liability"))
          throw Error("Bank liability class differs from ledger account");
        if(financial.has(m.accountId)||seenPhysical.has(m.bankAccountId))throw Error("Duplicate account map");
        seenPhysical.add(m.bankAccountId);financial.set(m.accountId,m.bankAccountId);
      }catch(_e){issues.push(fault("INVALID_SOURCE_ACCOUNT_MAPPING",String(i+1)));}
    });
    if(!financial.size)issues.push(fault("NO_MAPPED_FINANCIAL_ACCOUNTS"));
    manifest.forEach(function(_,id){
      if(!seenPhysical.has(id))issues.push(fault("UNMAPPED_STATEMENT_ACCOUNT",id));
    });
    input.sourceBindings.forEach(function(b,i){
      try{
        exact(b,["postedEventId","bankSourceId","journalSourceId","evidenceId","ledgerEntryId"]);
        if(!id(b.postedEventId)||!id(b.journalSourceId)||!id(b.evidenceId)||!id(b.ledgerEntryId)||
          typeof b.bankSourceId!=="string"||!bank.has(b.bankSourceId)||
          usedPost.has(b.postedEventId)||usedBank.has(b.bankSourceId))
          throw Error("Source reuse, unrecognized bank posting, or invalid identity");
        var post=v.state.posted.get(b.postedEventId),row=bank.get(b.bankSourceId),
          entry=sourceEntry.get(b.postedEventId);
        if(!post||!entry||entry.id!==b.ledgerEntryId||
          post.data.sourceId!==b.journalSourceId||post.data.evidenceId!==b.evidenceId)
          throw Error("Evidence binding does not match owner-reviewed journal");
        var bankAccountId=row.institution+"|"+row.accountToken;
        var accountEntry=Array.isArray(entry.lines)?entry.lines.filter(function(l){
          return financial.get(l.accountId)===bankAccountId;
        }):[];
        if(accountEntry.length!==1||
          accountEntry[0].amountCents!==post.data.amountCents||
          accountEntry[0].side!==(post.data.direction==="credit"?"debit":"credit"))
          throw Error("Source bank movement does not match a unique corresponding ledger account");
        if(row.amountCents!==post.data.amountCents||row.direction!==post.data.direction||
          row.date!==post.data.postedDate||statementLinks.get(row.id)!==entry.id)
          throw Error("Posted bank amount, date, direction, or statement linkage disagree");
        usedPost.add(b.postedEventId);usedBank.add(b.bankSourceId);
      }catch(_e){issues.push(fault("INVALID_BANK_TO_LEDGER_BINDING",String(i+1)));}
    });
    v.state.posted.forEach(function(_,id){
      if(!usedPost.has(id))issues.push(fault("UNBOUND_JOURNAL_POSTING",id));
    });
    bank.forEach(function(_,id){
      if(!usedBank.has(id))issues.push(fault("UNBOUND_BANK_STATEMENT_ROW",id));
    });
    return {issues:issues,matched:usedBank.size};
  }
  async function assess(input){
    if(!object(input)||!Array.isArray(input.journal)||!Array.isArray(input.chart)||
      !Array.isArray(input.entries)||!object(input.statementPackage)||
      !Array.isArray(input.sourceBindings)||!Array.isArray(input.sourceAccountMap)||
      typeof input.asOf!=="string")throw Error("Close review requires dated complete source packages");
    if(input.sourceBindings.length>10000||input.sourceAccountMap.length>200)
      throw Error("Close review source exceeds maximum bounded size");
    if(!window.IncomeOSDoubleEntry||!window.IncomeOSStatementClose||
       !window.IncomeOSAccountingControls||!window.IncomeOSEventJournal)
      throw Error("All accounting source verification dependencies required");
    var double=await window.IncomeOSDoubleEntry.assess({
      journal:input.journal,accounts:input.chart,entries:input.entries,asOf:input.asOf
    });
    var statement=window.IncomeOSStatementClose.assess(input.statementPackage);
    var issues=[];
    if(input.statementPackage.to!==input.asOf)
      issues.push(fault("CLOSE_DATE_MISMATCH"));
    if(double.status!=="BALANCED_OWNER_REVIEW_ONLY")
      issues.push(fault("DOUBLE_ENTRY_REVIEW_HOLD"));
    if(statement.gate.status!=="READY_FOR_ACCOUNTANT_SOURCE_REVIEW")
      issues.push(fault("STATEMENT_RECONCILIATION_HOLD"));
    var v=await window.IncomeOSEventJournal.verify(input.journal);
    var evidence=assessSources(input,v);
    issues.push(...evidence.issues);
    var passed=issues.length===0;
    return {asOf:input.asOf,status:passed?"READY_FOR_ACCOUNTANT_SOURCE_REVIEW_ONLY":"HOLD",
      issues:issues,statementIssues:statement.issues,doubleEntryIssues:double.unresolved,
      sourceJournalHeadHash:v.headHash,
      matchedBankPostings:passed?evidence.matched:null,
      balancedEntries:passed?double.reviewedEntries:null,
      movementDebitsCents:passed?double.movementDebitsCents:null,
      movementCreditsCents:passed?double.movementCreditsCents:null,
      ownerReviewedEarnedIncomeCents:passed?double.earnedIncomeCents:null,
      ownerReviewedInvestmentIncomeCents:passed?double.investmentCashIncomeCents:null,
      readyForTaxFiling:false,bankStatementsIndependentlyAuthenticated:false,
      allRealWorldAccountsKnown:false,hasAuthenticatedOwnerBackend:false,
      canTransferOrInvest:false,
      note:"A full owner-declared source-to-ledger join is not provider-signed bank evidence, audited opening balances, tax filing approval, or permission to transfer/invest."
    };
  }
  window.IncomeOSMonthlyClose=Object.freeze({assess:assess});
}());