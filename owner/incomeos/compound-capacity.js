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
  // Actual results by holding, from ledger records named for the same payer or payee. Cash only: money put in
  // (paid capital outflows), income received (paid investment-type income after fees), principal returned and
  // sale proceeds. Principal and proceeds are capital coming back, never income; nothing projected is used.
  var INVEST_CATS=["interest","dividend","investment","rental","royalty"];
  function holdings(entries){
    if(!Array.isArray(entries))throw Error("Entries required");
    var map={},order=[];
    entries.forEach(function(e){
      if(!e||typeof e!=="object")return;
      var role=null,amt=0;
      if(e.kind==="outflow"&&e.type==="capital"&&(e.paymentStatus||"paid")==="paid"){role="contributed";amt=n(e.amountUsd);}
      else if(e.kind==="income"&&e.status==="paid"){
        if(e.scope==="nonincome"){role="returned";amt=n(e.grossUsd);}
        else if(e.scope==="proceeds"){role="proceeds";amt=n(e.grossUsd);}
        else if(INVEST_CATS.indexOf(e.category)>=0){role="income";amt=r2(n(e.grossUsd)-n(e.feesUsd));}
      }
      if(!role)return;
      var name=String(e.payer||"").trim(),key=name.toLowerCase()||"(unnamed)";
      if(!map[key]){map[key]={name:name||"Unnamed holding",contributed:0,income:0,returned:0,proceeds:0,records:0,unreconciled:0,first:e.date,last:e.date};order.push(key);}
      var h=map[key];h[role]=r2(h[role]+amt);h.records++;if(!e.reconciled)h.unreconciled++;
      if(e.date<h.first)h.first=e.date;if(e.date>h.last)h.last=e.date;
    });
    // Reinvestment: a contribution may say part of it was paid with earnings received from a named holding.
    // Earnings are capped at that holding's income actually received, used in date order; anything beyond the
    // cap, or naming a holding with no received income, counts as new money. Principal is never earnings.
    var spent={},links=[];
    entries.filter(function(e){return e&&e.kind==="outflow"&&e.type==="capital"&&(e.paymentStatus||"paid")==="paid"&&n(e.reinvestedUsd)>0;})
      .sort(function(a,b){return String(a.date).localeCompare(String(b.date));})
      .forEach(function(e){
        var to=String(e.payer||"").trim().toLowerCase()||"(unnamed)",from=String(e.reinvestedFrom||"").trim().toLowerCase(),want=r2(n(e.reinvestedUsd));
        var avail=map[from]?r2(map[from].income-(spent[from]||0)):0,used=r2(Math.max(0,Math.min(want,avail)));
        if(used>0)spent[from]=r2((spent[from]||0)+used);
        links.push({to:to,from:from,fromName:map[from]?map[from].name:String(e.reinvestedFrom||""),claimed:want,used:used});
      });
    var rows=order.map(function(k){
      var h=map[k],back=r2(h.returned+h.proceeds),flags=[];
      var inLinks=links.filter(function(l){return l.to===k;}),reinv=r2(inLinks.reduce(function(a,l){return a+l.used;},0));
      inLinks.forEach(function(l){if(l.used<l.claimed)flags.push("$"+r2(l.claimed-l.used).toFixed(2)+" recorded as reinvested from "+(l.fromName||"an unnamed holding")+" exceeds the income received from it; counted as new money.");});
      if(!(h.contributed>0))flags.push("No money put in is recorded for this holding; results cannot be judged.");
      if(h.proceeds>0)flags.push("Sale proceeds have no cost basis recorded; the gain or loss is unknown.");
      if(h.unreconciled)flags.push(h.unreconciled+" record(s) not reconciled to a statement.");
      if(k==="(unnamed)")flags.push("Records without a payer or payee name are grouped here.");
      return {name:h.name,contributed:h.contributed,incomeReceived:h.income,principalReturned:h.returned,saleProceeds:h.proceeds,
        reinvestedEarnings:reinv,newMoney:r2(Math.max(0,h.contributed-reinv)),earningsReinvestedElsewhere:r2(spent[k]||0),
        capitalBack:back,netCashSoFar:r2(h.income+back-h.contributed),stillInvested:r2(Math.max(0,h.contributed-back)),
        status:h.contributed>0&&back>=h.contributed?"CAPITAL_RETURNED":h.contributed>0?"CAPITAL_STILL_OUT":"NO_CONTRIBUTION_RECORDED",
        incomeOnCapitalPct:h.contributed>0?r2(h.income/h.contributed*100):null,from:h.first,to:h.last,records:h.records,flags:flags};
    });
    rows.sort(function(a,b){return b.contributed-a.contributed||a.name.localeCompare(b.name);});
    return {holdings:rows,notice:"Cash results from your recorded entries only. Principal returned and sale proceeds are your own money coming back, not earnings. Income on capital is not annualised and is not a return forecast."};
  }
  var api=Object.freeze({estimate:estimate,downside:downside,holdings:holdings});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSCompoundCapacity=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
