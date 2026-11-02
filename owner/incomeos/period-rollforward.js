"use strict";
(function(){
  // Cross-period owner-source rollforward. Each month must independently pass
  // the existing source-to-ledger close; no historical balances are fabricated.
  // This is NOT a verified opening trial balance or authenticated bank service.
  var MAX_MONTHS=24,LIMIT=100000000000000;
  function obj(x){return !!x&&typeof x==="object"&&!Array.isArray(x);}
  function date(x){
    if(typeof x!=="string"||!/^20\d\d-\d\d-\d\d$/.test(x))return false;
    var t=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;
  }
  function nextDay(x){return new Date(Date.parse(x+"T00:00:00Z")+86400000).toISOString().slice(0,10);}
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x);}
  function issue(code,month,reference){return {code:code,month:month||null,reference:reference||null};}
  function amount(x){return Number.isSafeInteger(x)&&Math.abs(x)<=LIMIT;}
  function sourceId(x){return x.institution.trim()+"|"+x.accountToken;}
  function ledgerMovement(trial,kind){
    var net=kind==="cash_asset"?trial.debitCents-trial.creditCents:
      kind==="card_liability"?trial.creditCents-trial.debitCents:null;
    return amount(net)?net:null;
  }
  function periodBankState(p,issues){
    var pkg=p.statementPackage,month=p.asOf,accounts=new Map(),statements=new Map();
    pkg.expectedAccounts.forEach(function(a){
      if(!obj(a)||typeof a.institution!=="string"||typeof a.accountToken!=="string"||
         !["asset","liability"].includes(a.balanceType)||a.ownerConfirmed!==true){
        issues.push(issue("INVALID_OWNER_ACCOUNT",month));return;
      }
      var key=sourceId(a);
      if(accounts.has(key))issues.push(issue("DUPLICATE_OWNER_ACCOUNT",month,key));
      accounts.set(key,a);
    });
    pkg.statements.forEach(function(s){
      if(!obj(s)||typeof s.institution!=="string"||typeof s.accountToken!=="string"){
        issues.push(issue("INVALID_STATEMENT",month));return;
      }
      var key=sourceId(s);
      if(!statements.has(key))statements.set(key,[]);
      statements.get(key).push(s);
    });
    var values=new Map();
    accounts.forEach(function(a,key){
      var list=(statements.get(key)||[]).slice().sort(function(x,y){return x.startDate.localeCompare(y.startDate);});
      if(!list.length){issues.push(issue("MISSING_PERIOD_ACCOUNT_STATEMENT",month,key));return;}
      var first=list[0],last=list[list.length-1];
      if(first.startDate!==pkg.from||last.endDate!==pkg.to ||
         !amount(first.openingCents)||!amount(last.closingCents)){
        issues.push(issue("PERIOD_BOUNDARY_MISSING",month,key));return;
      }
      values.set(key,{openingCents:first.openingCents,closingCents:last.closingCents,
        kind:a.balanceType,accountId:key});
    });
    return values;
  }
  async function assess(input){
    if(!obj(input)||Object.keys(input).some(function(k){
      return !["periods","initialOpeningReviewed","initialOpeningEvidenceId"].includes(k);
    })||!Array.isArray(input.periods)||input.periods.length<2||
       input.periods.length>MAX_MONTHS)throw Error("Require 2 to 24 complete calendar-month source packages");
    if(!window.IncomeOSMonthlyClose||!window.IncomeOSDoubleEntry||!window.IncomeOSEventJournal)
      throw Error("Monthly close, journal and double-entry dependencies unavailable");
    var issues=[],processed=[],seenEventIds=new Set(),seenSourceIds=new Set(),seenBankIds=new Set(),
      seenEntryIds=new Set(),seenDocumentIds=new Set(),lastMonth=null,lastStatements=null,
      baselineChart=null,baselineAccountMap=null;
    for(var i=0;i<input.periods.length;i++){
      var p=input.periods[i];
      if(!obj(p)||Object.keys(p).some(function(k){
        return !["asOf","journal","chart","entries","statementPackage","sourceAccountMap","sourceBindings"].includes(k);
      })||!obj(p.statementPackage)||!date(p.asOf)||!Array.isArray(p.entries)||
         !Array.isArray(p.journal)||!Array.isArray(p.chart)||!Array.isArray(p.sourceAccountMap)||
         !Array.isArray(p.sourceBindings))
        throw Error("Each month requires dated full source/ledger packages");
      var pkg=p.statementPackage,from=pkg.from,to=pkg.to,month=p.asOf.slice(0,7);
      if(lastMonth!==null&&from!==nextDay(lastMonth))
        issues.push(issue("NONCONSECUTIVE_PERIODS",month));
      if(!date(from)||!date(to)||p.asOf!==to)
        issues.push(issue("INVALID_PERIOD_BOUNDARY",month));
      var close=await window.IncomeOSMonthlyClose.assess(p);
      var double=await window.IncomeOSDoubleEntry.assess({
        journal:p.journal,accounts:p.chart,entries:p.entries,asOf:p.asOf
      });
      var verified=await window.IncomeOSEventJournal.verify(p.journal);
      if(close.status!=="READY_FOR_ACCOUNTANT_SOURCE_REVIEW_ONLY"||
         double.status!=="BALANCED_OWNER_REVIEW_ONLY")
        issues.push(issue("MONTH_CLOSE_NOT_ACCEPTED",month));
      if(i===0) {
        if(input.initialOpeningReviewed!==true||!id(input.initialOpeningEvidenceId))
          issues.push(issue("INITIAL_OPENING_NOT_ATTESTED",month));
      }
      // Accounts may be renamed by a bank but never silently dropped or added.
      var chart=new Map(),map=new Map(),usedAccounts=new Set();
      p.chart.forEach(function(a){
        if(obj(a)&&id(a.id)&&id(a.evidenceId)&&a.ownerReviewed===true){
          if(chart.has(a.id))issues.push(issue("DUPLICATE_CHART_ACCOUNT",month,a.id));
          chart.set(a.id,a.kind);
        }else issues.push(issue("UNREVIEWED_CHART_ACCOUNT",month));
      });
      p.sourceAccountMap.forEach(function(m){
        if(!obj(m)||!id(m.accountId)||!id(m.evidenceId)||typeof m.bankAccountId!=="string"||
           !chart.has(m.accountId)||usedAccounts.has(m.bankAccountId)||map.has(m.accountId))
          issues.push(issue("INVALID_ACCOUNT_MAPPING",month));
        else{map.set(m.accountId,m.bankAccountId);usedAccounts.add(m.bankAccountId);}
      });
      chart.forEach(function(kind,key){
        if(["cash_asset","card_liability"].includes(kind)&&!map.has(key))
          issues.push(issue("UNMAPPED_FINANCIAL_CHART_ACCOUNT",month,key));
      });
      if(baselineChart){
        if(chart.size!==baselineChart.size||
          Array.from(chart).some(function(x){return baselineChart.get(x[0])!==x[1];}))
          issues.push(issue("CHART_CHANGED_WITHOUT_MIGRATION",month));
        if(map.size!==baselineAccountMap.size||
          Array.from(map).some(function(x){return baselineAccountMap.get(x[0])!==x[1];}))
          issues.push(issue("ACCOUNT_MAP_CHANGED_WITHOUT_MIGRATION",month));
      }else{baselineChart=chart;baselineAccountMap=map;}
      var statements=periodBankState(p,issues);
      if(lastStatements){
        if(statements.size!==lastStatements.size)
          issues.push(issue("ACCOUNT_POPULATION_CHANGED",month));
        statements.forEach(function(now,key){
          var prev=lastStatements.get(key);
          if(!prev||prev.kind!==now.kind){
            issues.push(issue("ACCOUNT_POPULATION_CHANGED",month,key));return;
          }
          if(prev.closingCents!==now.openingCents)
            issues.push(issue("BALANCE_CARRYFORWARD_MISMATCH",month,key));
        });
      }
      var trial=new Map((double.movementTrialBalance||[]).map(function(t){return [t.accountId,t];}));
      p.sourceAccountMap.forEach(function(m){
        if(!obj(m)||typeof m.bankAccountId!=="string")return;
        var balance=statements.get(m.bankAccountId),t=trial.get(m.accountId),
          kind=chart.get(m.accountId);
        if(!balance||!["cash_asset","card_liability"].includes(kind))return;
        var change=t?ledgerMovement(t,kind):0,delta=balance.closingCents-balance.openingCents;
        if(change===null||!amount(delta)||delta!==change)
          issues.push(issue("LEDGER_TO_BANK_BALANCE_MISMATCH",month,m.accountId));
      });
      p.journal.forEach(function(e){
        if(seenEventIds.has(e.id))issues.push(issue("REUSED_JOURNAL_EVENT_ID",month,e.id));
        seenEventIds.add(e.id);
        if(e.type==="POSTED"){
          if(seenSourceIds.has(e.data.sourceId))issues.push(issue("REUSED_PROVIDER_SOURCE_ID",month,e.data.sourceId));
          seenSourceIds.add(e.data.sourceId);
          if(e.data.postedDate<from||e.data.postedDate>to)
            issues.push(issue("OUT_OF_PERIOD_POSTING",month,e.id));
        }
        if(e.type==="DOCUMENT_MATCHED"){
          if(seenDocumentIds.has(e.data.documentId))
            issues.push(issue("REUSED_PAYMENT_DOCUMENT",month,e.data.documentId));
          seenDocumentIds.add(e.data.documentId);
        }
      });
      p.statementPackage.bankRows.forEach(function(b){
        if(!obj(b)||typeof b.institution!=="string"||typeof b.accountToken!=="string"||
           typeof b.transactionId!=="string")return;
        var key=b.institution+"|"+b.accountToken+"|"+b.transactionId;
        if(seenBankIds.has(key))issues.push(issue("REUSED_BANK_TRANSACTION",month,key));
        seenBankIds.add(key);
      });
      p.entries.forEach(function(e){
        if(!obj(e)||typeof e.id!=="string")return;
        if(seenEntryIds.has(e.id))issues.push(issue("REUSED_LEDGER_ENTRY",month,e.id));
        seenEntryIds.add(e.id);
        if(e.kind==="REFUND"&&i>0&&
          !p.journal.some(function(x){return x.id===e.originalExpenseEventId;}))
          issues.push(issue("CROSS_PERIOD_REFUND_REQUIRES_LINKED_HISTORICAL_EVIDENCE",month,e.id));
      });
      processed.push({month:month,from:from,to:to,closeStatus:close.status,
        sourceHeadHash:verified.headHash,statementAccountCount:statements.size,
        balancedEntries:close.balancedEntries,verifiedOwnerOnly:true});
      lastMonth=to;lastStatements=statements;
    }
    // No period may be disclosed as successfully rolled forward if any failed.
    var accepted=issues.length===0;
    var last=lastStatements?Array.from(lastStatements.values()):[];
    return {status:accepted?"CONSECUTIVE_OWNER_REVIEW_ONLY":"HOLD",periodCount:input.periods.length,
      periodResults:processed,issues:issues,firstPeriod:processed[0]?.month,
      lastPeriod:processed[processed.length-1]?.month,
      closingStatementBalances:accepted?last.map(function(x){return {accountId:x.accountId,
        balanceType:x.kind,closingCents:x.closingCents};}):null,
      reconciledPeriodCount:accepted?processed.length:0,
      firstPeriodOpeningIndependentlyAuthenticated:false,
      signedExternalJournalHeadAnchor:false,bankStatementsIndependentlyAuthenticated:false,
      approvedOwnerBackend:false,readyForTaxFiling:false,
      canTransferOrInvest:false,
      note:"Balances represent contiguous owner-reviewed statement claims only. The source periods have independent local hash chains, not an externally signed continuity anchor. Cross-period refund/cost-basis cases and new or closed accounts remain on HOLD pending controlled historical linking."};
  }
  window.IncomeOSPeriodRollforward=Object.freeze({assess:assess});
}());