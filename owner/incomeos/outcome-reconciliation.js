"use strict";
(function(root){
  // Reconcile documented outcomes against independently identified statement entries.
  // This is a read-only control, never a transfer or investment instruction.
  function reconcile(outcomes,entries){
    var issues=[],used=new Set(),totals={},currencies=new Set();
    if(!Array.isArray(outcomes)||!Array.isArray(entries))
      return {status:"HOLD",issues:[{code:"INVALID_INPUT"}],matchedCents:null,availableToInvestCents:null,transferAuthorized:false};
    if(!outcomes.length)issues.push({code:"NO_OUTCOMES"});
    if(!entries.length)issues.push({code:"NO_STATEMENT_ENTRIES"});
    var byId=new Map();
    entries.forEach(function(e,i){
      if(!e||typeof e.id!=="string"||!e.id.trim()||byId.has(e.id.trim())||
        !Number.isSafeInteger(e.amountCents)||typeof e.accountId!=="string"||!e.accountId.trim()||
        e.posted!==true||e.sourceVerified!==true||
        typeof e.currency!=="string"||!e.currency.trim()||
        typeof e.institutionId!=="string"||!e.institutionId.trim()||
        typeof e.postedDate!=="string"||!e.postedDate.trim()||
        (e.direction!=="credit"&&e.direction!=="debit")){
        issues.push({code:"INVALID_STATEMENT_ENTRY",index:i});return;
      }
      byId.set(e.id.trim(),e);
    });
    outcomes.forEach(function(o,i){
      if(!o||typeof o.statementEntryId!=="string"||!o.statementEntryId.trim()||
        typeof o.accountId!=="string"||!o.accountId.trim()||
        !Number.isSafeInteger(o.amountCents)||o.amountCents<=0||
        typeof o.currency!=="string"||!o.currency.trim()||
        typeof o.institutionId!=="string"||!o.institutionId.trim()||
        typeof o.postedDate!=="string"||!o.postedDate.trim()){
        issues.push({code:"INVALID_OUTCOME",index:i});return;
      }
      var id=o.statementEntryId.trim(),entry=byId.get(id);
      if(used.has(id)){issues.push({code:"STATEMENT_ENTRY_REUSED",index:i});return;}
      used.add(id);
      if(!entry){issues.push({code:"STATEMENT_ENTRY_MISSING",index:i});return;}
      if(entry.accountId!==o.accountId||entry.amountCents!==o.amountCents||
        entry.currency!==o.currency||entry.institutionId!==o.institutionId||entry.postedDate!==o.postedDate){
        issues.push({code:"STATEMENT_MISMATCH",index:i});return;
      }
      // Every reconcilable outcome is money received: a debit cannot reconcile as income or a refund.
      if(entry.direction!=="credit"&&o.type!=="BILL_SAVINGS"){issues.push({code:"ENTRY_NOT_A_CREDIT",index:i});return;}
      if(o.type==="BILL_SAVINGS"){
        issues.push({code:"SAVINGS_NOT_CASH_DEPOSIT",index:i});return;
      }
      if(o.type!=="EARNED_INCOME"&&o.type!=="INVESTMENT_DISTRIBUTION"&&o.type!=="REFUND"&&o.type!=="RETURNED_PRINCIPAL"){
        issues.push({code:"UNKNOWN_OUTCOME_TYPE",index:i});return;
      }
      // Totals are in one currency; mixed currencies are held rather than summed.
      currencies.add(o.currency.trim());
      if(currencies.size>1){issues.push({code:"MIXED_CURRENCIES",index:i});return;}
      var next=(totals[o.type]||0)+o.amountCents;
      if(!Number.isSafeInteger(next)){issues.push({code:"TOTAL_OVERFLOW",index:i});return;}
      totals[o.type]=next;
    });
    return {status:issues.length?"HOLD":"RECONCILED_REVIEW_ONLY",issues:issues,
      matchedCents:issues.length?null:totals,currency:issues.length||!currencies.size?null:Array.from(currencies)[0],availableToInvestCents:null,transferAuthorized:false};
  }
  var api=Object.freeze({reconcile:reconcile});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSOutcomeReconciliation=api;
}(typeof window!=="undefined"?window:null));
