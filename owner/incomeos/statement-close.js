"use strict";
(function () {
  // Pure statement-level coverage and arithmetic checks, intended for a future
  // separately authenticated owner service. No storage, network, tax conclusion,
  // bank authentication, payment, or external transaction is performed here.
  var MAX=50000;
  function validDate(x) {
    if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;
    var t=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;
  }
  function nextDay(x) {return new Date(Date.parse(x+"T00:00:00Z")+86400000).toISOString().slice(0,10);}
  function integer(x) {return Number.isSafeInteger(x)&&Math.abs(x)<=100000000000000;}
  function opaque(x) {return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x)&&!(/^\d{9,}$/.test(x))&&!x.includes("@");}
  function bankIdentity(x) {
    if(typeof x!=="string")return false;
    var parts=x.split("|");
    try{return parts.length===3&&identity(parts[0],parts[1])===parts[0]+"|"+parts[1]&&opaque(parts[2]);}
    catch(_e){return false;}
  }
  function identity(institution,token) {
    if(typeof institution!=="string"||!institution.trim()||institution.length>100||institution.includes("|")||!opaque(token))throw Error("Invalid financial source identity");
    return institution.trim()+"|"+token;
  }
  function fail(issues,code,detail,accountId) {issues.push({code:code,detail:detail,accountId:accountId||null});}
  function manifest(row) {
    if(!row||typeof row!=="object"||Array.isArray(row))throw Error("Invalid account manifest");
    var id=identity(row.institution,row.accountToken);
    if(!["asset","liability"].includes(row.balanceType))throw Error("Balance type is required");
    if(row.ownerConfirmed!==true)throw Error("Account scope was not confirmed by the owner");
    return {id:id,institution:row.institution.trim(),accountToken:row.accountToken,balanceType:row.balanceType};
  }
  function stmt(row) {
    if(!row||typeof row!=="object"||Array.isArray(row))throw Error("Invalid statement source");
    var id=identity(row.institution,row.accountToken);
    if(!opaque(row.statementId)||!opaque(row.evidenceId)||!validDate(row.startDate)||!validDate(row.endDate)||row.startDate>row.endDate)throw Error("Invalid statement identity, date or evidence");
    if(!integer(row.openingCents)||!integer(row.closingCents)||!integer(row.totalCreditsCents)||row.totalCreditsCents<0||!integer(row.totalDebitsCents)||row.totalDebitsCents<0)throw Error("Statement balances and flow totals must use safe integer USD cents");
    if(!Number.isSafeInteger(row.postingCount)||row.postingCount<0||row.postingCount>MAX)throw Error("Statement posting count invalid");
    if(row.currency!=="USD"||row.sourceVerified!==true||typeof row.documentSha256!=="string"||!/^[a-f0-9]{64}$/.test(row.documentSha256))throw Error("Statement source evidence is insufficient");
    return {id:id,statementId:row.statementId,evidenceId:row.evidenceId,startDate:row.startDate,endDate:row.endDate,
      openingCents:row.openingCents,closingCents:row.closingCents,creditsCents:row.totalCreditsCents,
      debitsCents:row.totalDebitsCents,postingCount:row.postingCount,documentSha256:row.documentSha256};
  }
  function assess(input) {
    if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Statement close requires a structured input");
    var from=input.from,to=input.to;
    if(!validDate(from)||!validDate(to)||from>to||(Date.parse(to+"T00:00:00Z")-Date.parse(from+"T00:00:00Z"))/86400000>366)throw Error("Invalid reporting interval");
    var issues=[],accounts=new Map(),statements=[],bank=[],links=new Map(),allStatements=new Set();
    if(!Array.isArray(input.expectedAccounts)||!Array.isArray(input.statements)||!Array.isArray(input.bankRows)||!Array.isArray(input.accountingMatches))throw Error("Account, statement, posting and linkage arrays are mandatory");
    if(input.expectedAccounts.length>100||input.statements.length>500||input.bankRows.length>MAX||input.accountingMatches.length>MAX)throw Error("Source inputs exceed bounded size");
    if(input.scopeConfirmed!==true)fail(issues,"SCOPE_NOT_CONFIRMED","The declared account population is not confirmed");
    if(!input.expectedAccounts.length)fail(issues,"NO_EXPECTED_ACCOUNTS","An empty financial population does not establish complete coverage");
    input.expectedAccounts.forEach(function(x,i) {
      try {var a=manifest(x);if(accounts.has(a.id))fail(issues,"DUPLICATE_ACCOUNT","Repeated account manifest",a.id);else accounts.set(a.id,a);}
      catch(e){fail(issues,"INVALID_ACCOUNT","Account "+(i+1)+": "+e.message);}
    });
    input.statements.forEach(function(x,i) {
      try {var s=stmt(x);if(allStatements.has(s.statementId))fail(issues,"DUPLICATE_STATEMENT","Statement ID repeats",s.id);
        else {allStatements.add(s.statementId);statements.push(s);}
        if(!accounts.has(s.id))fail(issues,"UNDECLARED_STATEMENT_ACCOUNT","Statement does not belong to the declared account population",s.id);
      }catch(e){fail(issues,"INVALID_STATEMENT","Statement "+(i+1)+": "+e.message);}
    });
    if(!window.IncomeOSAccountingControls)throw Error("Posting normalization dependency missing");
    var usedIds=new Map();
    input.bankRows.forEach(function(x,i) {
      try {
        var b=window.IncomeOSAccountingControls.normalizedBank(x),acct=identity(b.institution,b.accountToken);
        var prev=usedIds.get(b.id);
        if(prev) {
          if(prev.date!==b.date||prev.amountCents!==b.amountCents||prev.direction!==b.direction)fail(issues,"CONFLICTING_POSTED_SOURCE","Same bank transaction ID has inconsistent posted evidence",acct);
          else fail(issues,"REPEATED_POSTED_SOURCE","Repeated bank posting, not an additional transaction",acct);
        } else {usedIds.set(b.id,b);bank.push({...b,accountId:acct});}
        if(!accounts.has(acct))fail(issues,"UNDECLARED_BANK_ACCOUNT","Bank posting outside account manifest",acct);
      }catch(e){fail(issues,"INVALID_POSTING","Posting "+(i+1)+": "+e.message);}
    });
    input.accountingMatches.forEach(function(x,i){
      if(!x||typeof x!=="object"||!opaque(x.entryId)||!bankIdentity(x.bankId)||x.state!=="OWNER_REVIEWED_BANK_MATCH") {
        fail(issues,"INVALID_OWNER_REVIEW_LINK","Link "+(i+1)+" is not a supported owner-reviewed bank match");return;
      }
      if(links.has(x.bankId))fail(issues,"REUSED_BANK_MATCH","Bank posting associated with multiple ledger entries");
      else links.set(x.bankId,x.entryId);
    });
    var details=[];
    accounts.forEach(function(acct) {
      var segments=statements.filter(function(s){return s.id===acct.id&&s.startDate<=to&&s.endDate>=from;})
        .sort(function(a,b){return a.startDate.localeCompare(b.startDate);});
      if(!segments.length){fail(issues,"MISSING_STATEMENT","No statement covers the period",acct.id);details.push({accountId:acct.id,complete:false,statements:0,postings:0});return;}
      if(segments[0].startDate>from||segments[segments.length-1].endDate<to)fail(issues,"INCOMPLETE_DATE_COVERAGE","Statements do not span full requested interval",acct.id);
      var count=0,expectedCount=0,credits=0,debits=0;
      segments.forEach(function(s,i){
        if(i) {
          if(nextDay(segments[i-1].endDate)!==s.startDate)fail(issues,"GAPPED_OR_OVERLAPPING_STATEMENTS","Adjacent statement periods are not contiguous",acct.id);
          if(segments[i-1].closingCents!==s.openingCents)fail(issues,"BALANCE_CONTINUITY_FAILURE","Adjacent statement balances differ",acct.id);
        }
        var rows=bank.filter(function(b){return b.accountId===acct.id&&b.date>=s.startDate&&b.date<=s.endDate;});
        var cr=0,db=0;
        rows.forEach(function(b){if(b.direction==="credit")cr+=b.amountCents;else db+=b.amountCents;
          if(b.date>=from&&b.date<=to&&!links.has(b.id))fail(issues,"UNRECONCILED_POSTING","Bank posting lacks unique owner-reviewed ledger link",acct.id);
        });
        if(!Number.isSafeInteger(cr)||!Number.isSafeInteger(db))fail(issues,"UNSAFE_SUM","Aggregated posting totals exceeded safe integer precision",acct.id);
        if(rows.length!==s.postingCount)fail(issues,"POSTING_COUNT_MISMATCH","Posted transaction count disagrees with statement",acct.id);
        if(cr!==s.creditsCents||db!==s.debitsCents)fail(issues,"STATEMENT_FLOW_MISMATCH","Posted credits or debits differ from statement totals",acct.id);
        var movement=acct.balanceType==="asset"?cr-db:db-cr;
        if(!Number.isSafeInteger(s.openingCents+movement)||s.openingCents+movement!==s.closingCents)
          fail(issues,"STATEMENT_BALANCE_MISMATCH","Statement opening plus movement does not equal closing balance",acct.id);
        count+=rows.length;expectedCount+=s.postingCount;credits+=cr;debits+=db;
      });
      bank.filter(function(b){return b.accountId===acct.id&&b.date>=from&&b.date<=to;}).forEach(function(b) {
        if(!segments.some(function(s){return b.date>=s.startDate&&b.date<=s.endDate;}))
          fail(issues,"UNASSIGNED_PERIOD_POSTING","Posting is outside all supplied statement spans",acct.id);
      });
      details.push({accountId:acct.id,balanceType:acct.balanceType,complete:!issues.some(function(i){return i.accountId===acct.id;}),
        statements:segments.length,postings:count,expectedPostings:expectedCount,creditsUsd:credits/100,debitsUsd:debits/100});
    });
    links.forEach(function(_,bankId){if(!usedIds.has(bankId))fail(issues,"MATCH_WITHOUT_SOURCE","Reviewed link references a bank source not in this statement package");});
    var ready=issues.length===0;
    return {from:from,to:to,declaredAccounts:accounts.size,statementsReviewed:statements.length,
      bankPostingsReviewed:bank.length,ownerReviewedLinks:links.size,accounts:details,issues:issues,
      gate:{status:ready?"READY_FOR_ACCOUNTANT_SOURCE_REVIEW":"HOLD",readyForTaxFiling:false,
        independentlyBankAuthenticated:false,allRealWorldAccountsKnown:false,canTransferOrInvest:false,
        note:"Source counts, statement arithmetic and local owner review are not provider authentication, tax certification or evidence that no accounts were omitted from the owner-declared population."}};
  }
  window.IncomeOSStatementClose=Object.freeze({assess:assess,validateManifest:manifest,validateStatement:stmt});
}());