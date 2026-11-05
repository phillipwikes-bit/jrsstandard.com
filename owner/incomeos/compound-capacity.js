"use strict";
(function(root){
  // Available-to-compound estimate from the owner's own ledger totals (IncomeOSAccountant.totals).
  // Pure arithmetic: no bank access, no transfer, no investment. Received income only; expected,
  // invoiced and pending amounts are never counted. Returned principal and sale proceeds are shown as
  // capital coming back, never as earnings. The figure is an estimate until every counted record is
  // reconciled to a bank or card statement.
  function n(x){x=Number(x);return Number.isFinite(x)?x:0;}
  function r2(x){return Math.round(x*100)/100;}
  function estimate(t,opts){
    if(!t||typeof t!=="object")throw Error("Ledger totals required");
    opts=opts||{};
    var reserve=n(opts.reserveUsd),scheduled=n(opts.scheduledObligationsUsd);
    if(reserve<0||scheduled<0)throw Error("Reserve and obligations cannot be negative");
    var netIncome=r2(n(t.gross)-n(t.fees));
    var spending=r2(n(t.expenses)+n(t.taxPaid)+n(t.otherOutflow));
    var operating=r2(netIncome-spending);
    var capitalBack=r2(n(t.returned)+n(t.proceeds));
    var contributed=r2(n(t.capital));
    var cash=r2(operating+capitalBack-contributed);
    var available=r2(Math.max(0,cash-scheduled-reserve));
    var issues=[];
    if(n(t.pending)>0)issues.push("Income not yet received ($"+n(t.pending).toFixed(2)+") is not counted.");
    if(n(t.unreconciled)>0)issues.push(t.unreconciled+" record(s) not reconciled to a bank or card statement.");
    if(n(t.refundCount)>0)issues.push(t.refundCount+" refund or credit record(s) are not netted.");
    if(n(t.proceeds)>0)issues.push("Sale proceeds have no cost basis recorded; the gain or loss is unknown.");
    if(!(reserve>0))issues.push("No reserve set for emergencies and taxes.");
    if(cash-scheduled-reserve<0)issues.push("Obligations and reserve exceed the cash generated; nothing is available.");
    return {netIncomeReceived:netIncome,spendingPaid:spending,operatingCashFlow:operating,capitalReturned:capitalBack,
      capitalContributed:contributed,cashGenerated:cash,scheduledObligations:scheduled,reserve:reserve,availableToCompound:available,
      status:n(t.unreconciled)>0?"ESTIMATE_NOT_RECONCILED":"RECONCILED_RECORDS_ONLY",issues:issues,
      notice:"An estimate from your recorded entries, not a bank balance. Nothing is invested or moved. Check your accounts before deciding."};
  }
  // Downside view of a hypothetical allocation: a loss share and a fee, never a promised return.
  function downside(amountUsd,lossPct,feePct){
    var a=n(amountUsd),l=n(lossPct),f=n(feePct);
    if(a<0||l<0||l>100||f<0||f>100)throw Error("Amount, loss and fee must be valid");
    return {amount:r2(a),loss:r2(a*l/100),fee:r2(a*f/100),remaining:r2(Math.max(0,a-a*l/100-a*f/100))};
  }
  var api=Object.freeze({estimate:estimate,downside:downside});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSCompoundCapacity=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
