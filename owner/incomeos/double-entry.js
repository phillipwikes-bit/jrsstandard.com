"use strict";
(function(){
  // Synthetic-testable double-entry review ledger. No persistence or account
  // access; this is NOT a posted general ledger, tax basis or account statement.
  var TYPES=["EARNED_INCOME","INVESTMENT_INCOME","BUSINESS_EXPENSE","PERSONAL_EXPENSE",
    "REFUND","CAPITAL_DEPLOYED","RETURNED_PRINCIPAL","TAX_PAYMENT",
    "INTERNAL_TRANSFER","CREDIT_CARD_PAYMENT"];
  var ACCOUNT_KINDS=["cash_asset","card_liability","investment_asset","earned_revenue",
    "investment_revenue","business_expense","personal_expense","expense_reversal","owner_draw"];
  var CLASS={
    EARNED_INCOME:"earned_income",INVESTMENT_INCOME:"investment_income",
    BUSINESS_EXPENSE:"business_expense",PERSONAL_EXPENSE:"personal_expense",
    REFUND:"refund",CAPITAL_DEPLOYED:"capital_contribution",
    RETURNED_PRINCIPAL:"returned_principal",TAX_PAYMENT:"tax_payment"
  };
  var MAX=10000,LIMIT=1000000000000;
  function obj(x){return !!x&&typeof x==="object"&&!Array.isArray(x);}
  function exact(x,allowed,required){
    if(!obj(x)||Object.keys(x).some(function(k){return !allowed.includes(k);})||
      required.some(function(k){return !Object.prototype.hasOwnProperty.call(x,k);}))
      throw Error("Missing or unsupported accounting fields");
  }
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x)&&!/^\d{9,}$/.test(x);}
  function date(x){
    if(typeof x!=="string"||!/^20\d\d-\d\d-\d\d$/.test(x))return false;
    var t=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;
  }
  function cents(x){return Number.isSafeInteger(x)&&x>0&&x<=LIMIT;}
  function account(x){
    exact(x,["id","kind","evidenceId","ownerReviewed"],["id","kind","evidenceId","ownerReviewed"]);
    if(!id(x.id)||!ACCOUNT_KINDS.includes(x.kind)||!id(x.evidenceId)||x.ownerReviewed!==true)
      throw Error("Invalid or unreviewed account declaration");
    return {id:x.id,kind:x.kind,evidenceId:x.evidenceId};
  }
  function entry(x){
    exact(x,["id","date","kind","evidenceId","sourceEventIds","lines","originalExpenseEventId"],
      ["id","date","kind","evidenceId","sourceEventIds","lines"]);
    if(!id(x.id)||!date(x.date)||!TYPES.includes(x.kind)||!id(x.evidenceId)||
      !Array.isArray(x.sourceEventIds)||!Array.isArray(x.lines)||x.lines.length!==2||
      x.sourceEventIds.length!==(x.kind==="INTERNAL_TRANSFER"||x.kind==="CREDIT_CARD_PAYMENT"?2:1)||
      x.sourceEventIds.some(function(s){return !id(s);})||
      new Set(x.sourceEventIds).size!==x.sourceEventIds.length)
      throw Error("Invalid accounting entry identity or source structure");
    if(x.kind==="REFUND"?!id(x.originalExpenseEventId):Object.prototype.hasOwnProperty.call(x,"originalExpenseEventId"))
      throw Error("Refund requires the original documented expense, other entries cannot claim it");
    var lines=x.lines.map(function(l){
      exact(l,["accountId","side","amountCents"],["accountId","side","amountCents"]);
      if(!id(l.accountId)||!["debit","credit"].includes(l.side)||!cents(l.amountCents))
        throw Error("Invalid accounting debit or credit");
      return {accountId:l.accountId,side:l.side,amountCents:l.amountCents};
    });
    if(lines[0].side===lines[1].side||lines[0].accountId===lines[1].accountId||
      lines[0].amountCents!==lines[1].amountCents)
      throw Error("Journal entry must balance exactly across two distinct accounts");
    return {id:x.id,date:x.date,kind:x.kind,evidenceId:x.evidenceId,
      sourceEventIds:x.sourceEventIds.slice(),lines:lines,
      originalExpenseEventId:x.kind==="REFUND"?x.originalExpenseEventId:null};
  }
  function problem(code,id){return {code:code,entryId:id||null};}
  function isReviewed(state,postId,label){
    var p=state.posted.get(postId),c=state.classes.get(postId)||[],r=state.reconciled.get(postId)||[];
    return !!p&&c.length===1&&c[0].data.classification===label&&
      r.length===1&&r[0].data.classificationEventId===c[0].id;
  }
  function spec(e,accountKinds){
    var debit=e.lines.find(function(l){return l.side==="debit";}),credit=e.lines.find(function(l){return l.side==="credit";});
    var dk=accountKinds.get(debit.accountId),ck=accountKinds.get(credit.accountId);
    function yes(a,b){return dk===a&&(Array.isArray(b)?b.includes(ck):ck===b);}
    if(e.kind==="EARNED_INCOME")return yes("cash_asset","earned_revenue");
    if(e.kind==="INVESTMENT_INCOME")return yes("cash_asset","investment_revenue");
    if(e.kind==="BUSINESS_EXPENSE")return yes("business_expense",["cash_asset","card_liability"]);
    if(e.kind==="PERSONAL_EXPENSE")return yes("personal_expense",["cash_asset","card_liability"]);
    if(e.kind==="REFUND")return ["cash_asset","card_liability"].includes(dk)&&ck==="expense_reversal";
    if(e.kind==="CAPITAL_DEPLOYED")return yes("investment_asset","cash_asset");
    if(e.kind==="RETURNED_PRINCIPAL")return yes("cash_asset","investment_asset");
    if(e.kind==="TAX_PAYMENT")return yes("owner_draw","cash_asset");
    if(e.kind==="INTERNAL_TRANSFER")return yes("cash_asset","cash_asset");
    if(e.kind==="CREDIT_CARD_PAYMENT")return yes("card_liability","cash_asset");
    return false;
  }
  async function assess(input){
    if(!obj(input)||!Array.isArray(input.journal)||!Array.isArray(input.accounts)||!Array.isArray(input.entries)||
      !date(input.asOf))throw Error("Explicit dated source journal, chart and entries required");
    if(input.accounts.length>200||input.entries.length>MAX)throw Error("Accounting review input cap exceeded");
    if(!window.IncomeOSEventJournal)throw Error("Verified journal dependency unavailable");
    var v=await window.IncomeOSEventJournal.verify(input.journal),state=v.state,issues=[],
      accountKinds=new Map(),seenEntries=new Set(),usedSources=new Map(),entries=[],origRefund=new Map();
    if(!input.accounts.length)issues.push(problem("NO_CHART_OF_ACCOUNTS"));
    input.accounts.forEach(function(row,i){
      try{var a=account(row);
        if(accountKinds.has(a.id))throw Error("Repeated chart account");
        accountKinds.set(a.id,a.kind);
      }catch(_e){issues.push(problem("INVALID_ACCOUNT",String(i+1)));}
    });
    input.entries.forEach(function(raw,i){
      var e;
      try{e=entry(raw);}
      catch(_e){issues.push(problem("INVALID_OR_UNBALANCED_ENTRY",String(i+1)));return;}
      if(seenEntries.has(e.id)){issues.push(problem("DUPLICATE_ENTRY",e.id));return;}
      seenEntries.add(e.id);
      if(e.date>input.asOf){issues.push(problem("FUTURE_ACCOUNTING_EVENT",e.id));return;}
      if(e.lines.some(function(l){return !accountKinds.has(l.accountId);})||
        !spec(e,accountKinds)){issues.push(problem("INVALID_ACCOUNT_OR_LEDGER_TREATMENT",e.id));return;}
      if(e.sourceEventIds.some(function(id){return usedSources.has(id);})){
        issues.push(problem("DUPLICATE_SOURCE_ALLOCATION",e.id));return;
      }
      var postings=e.sourceEventIds.map(function(id){return state.posted.get(id);});
      if(postings.some(function(p){return !p;})){
        issues.push(problem("JOURNAL_POSTING_MISSING",e.id));return;
      }
      var value=e.lines[0].amountCents;
      if(postings.some(function(p){return p.data.amountCents!==value;})){
        issues.push(problem("SOURCE_AMOUNT_MISMATCH",e.id));return;
      }
      if(postings.some(function(p){return p.data.postedDate>e.date;})){
        issues.push(problem("PREMATURE_BOOKING",e.id));return;
      }
      if(e.kind==="INTERNAL_TRANSFER"||e.kind==="CREDIT_CARD_PAYMENT"){
        if(!isReviewed(state,e.sourceEventIds[0],"transfer_out")||
           !isReviewed(state,e.sourceEventIds[1],"transfer_in")||
           postings[0].data.direction!=="debit"||postings[1].data.direction!=="credit"||
           Math.abs((Date.parse(postings[1].data.postedDate+"T00:00:00Z")-Date.parse(postings[0].data.postedDate+"T00:00:00Z"))/86400000)>7){
          issues.push(problem("UNVERIFIED_TRANSFER_PAIR",e.id));return;
        }
      }else {
        var kind=CLASS[e.kind],direction=["EARNED_INCOME","INVESTMENT_INCOME","REFUND","RETURNED_PRINCIPAL"].includes(e.kind)?"credit":"debit";
        if(!isReviewed(state,e.sourceEventIds[0],kind)||postings[0].data.direction!==direction){
          issues.push(problem("UNREVIEWED_SOURCE_CLASSIFICATION",e.id));return;
        }
      }
      if(e.kind==="REFUND"){
        if(!isReviewed(state,e.originalExpenseEventId,"business_expense") &&
           !isReviewed(state,e.originalExpenseEventId,"personal_expense")){
          issues.push(problem("REFUND_ORIGINAL_NOT_REVIEWED",e.id));return;
        }
        if(state.posted.get(e.originalExpenseEventId).data.postedDate>e.date){
          issues.push(problem("REFUND_PRECEDES_ORIGINAL",e.id));return;
        }
      }
      e.sourceEventIds.forEach(function(id){usedSources.set(id,e.id);});
      if(e.kind==="REFUND"){
        origRefund.set(e.originalExpenseEventId,(origRefund.get(e.originalExpenseEventId)||0)+value);
      }
      entries.push(e);
    });
    state.posted.forEach(function(_,id){
      if(!usedSources.has(id))issues.push(problem("UNMAPPED_POSTED_SOURCE",id));
    });
    var entryBySource=new Map();
    entries.forEach(function(e){e.sourceEventIds.forEach(function(id){entryBySource.set(id,e);});});
    origRefund.forEach(function(total,id){
      var orig=state.posted.get(id),entry=entryBySource.get(id);
      if(!entry||!["BUSINESS_EXPENSE","PERSONAL_EXPENSE"].includes(entry.kind)||
        !Number.isSafeInteger(total)||total>orig.data.amountCents)
        issues.push(problem("REFUNDS_EXCEED_DOCUMENTED_EXPENSE",id));
    });
    var capital=new Map(),returned=new Map();
    entries.forEach(function(e){
      if(!["CAPITAL_DEPLOYED","RETURNED_PRINCIPAL"].includes(e.kind))return;
      var line=e.lines.find(function(l){return accountKinds.get(l.accountId)==="investment_asset";});
      var bucket=e.kind==="CAPITAL_DEPLOYED"?capital:returned;
      bucket.set(line.accountId,(bucket.get(line.accountId)||0)+e.lines[0].amountCents);
    });
    returned.forEach(function(value,id){
      if(!Number.isSafeInteger(value)||value>(capital.get(id)||0))
        issues.push(problem("RETURNED_CAPITAL_EXCEEDS_IMPORTED_DEPLOYMENT",id));
    });
    var debit=0,credit=0,balances=new Map();
    entries.forEach(function(e){
      e.lines.forEach(function(l){
        if(l.side==="debit")debit+=l.amountCents;else credit+=l.amountCents;
        var a=balances.get(l.accountId)||{debitCents:0,creditCents:0};
        a[l.side==="debit"?"debitCents":"creditCents"]+=l.amountCents;balances.set(l.accountId,a);
      });
    });
    if(!Number.isSafeInteger(debit)||!Number.isSafeInteger(credit)||
       debit!==credit||Array.from(balances.values()).some(function(a){return !Number.isSafeInteger(a.debitCents)||!Number.isSafeInteger(a.creditCents);}))
      issues.push(problem("UNSAFE_OR_UNBALANCED_AGGREGATE"));
    if(!entries.length)issues.push(problem("NO_BOOKED_ENTRIES"));
    var pass=!issues.length,totals={};
    if(pass){
      entries.forEach(function(e){var k=e.kind;totals[k]=(totals[k]||0)+e.lines[0].amountCents;});
    }
    return {
      asOf:input.asOf,status:pass?"BALANCED_OWNER_REVIEW_ONLY":"HOLD",
      sourceHeadHash:v.headHash,chartAccounts:accountKinds.size,reviewedEntries:pass?entries.length:0,
      mappedSourcePostings:pass?usedSources.size:0,unresolved:issues,
      movementTrialBalance:pass?Array.from(balances.entries()).map(function(x){
        return {accountId:x[0],accountKind:accountKinds.get(x[0]),debitCents:x[1].debitCents,creditCents:x[1].creditCents};
      }):null,
      movementDebitsCents:pass?debit:null,movementCreditsCents:pass?credit:null,
      ownerReviewedMovementTotalsCents:pass?totals:null,
      earnedIncomeCents:pass?(totals.EARNED_INCOME||0):null,
      investmentCashIncomeCents:pass?(totals.INVESTMENT_INCOME||0):null,
      refundCents:pass?(totals.REFUND||0):null,
      internalTransferCents:pass?(totals.INTERNAL_TRANSFER||0):null,
      cardPaymentCents:pass?(totals.CREDIT_CARD_PAYMENT||0):null,
      readyForTaxFiling:false,openingBalancesConfirmed:false,bankStatementsIndependentlyVerified:false,
      authenticatedOwnerVerified:false,canTransferFunds:false,canReinvest:false,
      note:"Balanced owner-reviewed journal movements are not complete accounts, opening balances, verified taxable results, independent bank authentication or authorization to move funds. Refunds, principal and transfers are not income."
    };
  }
  window.IncomeOSDoubleEntry=Object.freeze({assess:assess,validateAccount:account,validateEntry:entry});
}());