"use strict";
(function(root){
  // IncomeOS cash and Treasury yield comparison. COMPARISON ONLY: it opens no
  // account, moves no money and makes no recommendation to buy. Every offer must
  // carry the provider's own page and a check date; stale offers are excluded.
  // The amount compared should be the verified investable surplus from
  // capital-readiness.js, never an assumed balance.
  //
  // Tax treatment used (stated, owner-adjustable, not tax advice):
  //  - Bank and credit-union interest: federal and state income tax.
  //  - US Treasury interest (bills, notes, I bonds): federal tax only; exempt from state and local income tax.
  // Insurance: deposits above the per-bank coverage limit (default $250,000) are flagged.
  var VERSION="incomeos.yield-compare.v1";
  var PRODUCTS={savings:{liquid:true,treasury:false},money_market:{liquid:true,treasury:false},cd:{liquid:false,treasury:false},
    treasury_bill:{liquid:false,treasury:true},treasury_note:{liquid:false,treasury:true},i_bond:{liquid:false,treasury:true}};
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function httpsUrl(u){try{return new URL(u).protocol==="https:";}catch(e){return false;}}
  function r4(x){return Math.round(x*10000)/10000;}
  function r2(x){return Math.round(x*100)/100;}
  function addMonths(d,m){var t=new Date(d+"T00:00:00Z");t.setUTCMonth(t.getUTCMonth()+m);return t.toISOString().slice(0,10);}

  // offers: [{id, provider, product, apyPct, termMonths?, minDepositUsd?, earlyPenaltyMonths?, insurance:"FDIC"|"NCUA"|"US_TREASURY"|"NONE", sourceUrl, checkedOn}]
  // p: {amountUsd, horizonMonths, federalRatePct, stateRatePct, needLiquidity, maxOfferAgeDays?, insuranceLimitUsd?}
  function compare(offers,p,asOf){
    if(!isDate(asOf))throw Error("asOf date required");
    if(!p||!(Number(p.amountUsd)>0)||!(Number(p.horizonMonths)>0))throw Error("Amount and horizon required");
    var fed=Number(p.federalRatePct),st=Number(p.stateRatePct);
    if(!(fed>=0&&fed<60)||!(st>=0&&st<20))throw Error("Federal and state marginal rates required");
    var maxAge=Number.isFinite(p.maxOfferAgeDays)?p.maxOfferAgeDays:7,limit=Number.isFinite(p.insuranceLimitUsd)?p.insuranceLimitUsd:250000;
    var rows=[],excluded=[];
    (offers||[]).forEach(function(o){
      var why=[];
      var kind=o&&PRODUCTS[o.product];
      if(!kind)why.push("PRODUCT_UNKNOWN");
      if(!(Number(o&&o.apyPct)>=0&&Number(o.apyPct)<25))why.push("RATE_INVALID");
      if(!o||!httpsUrl(o.sourceUrl))why.push("SOURCE_URL_MISSING");
      if(!o||!isDate(o.checkedOn)||o.checkedOn>asOf)why.push("CHECK_DATE_INVALID");
      else if((Date.parse(asOf)-Date.parse(o.checkedOn))/86400000>maxAge)why.push("OFFER_STALE");
      if(kind&&!kind.liquid&&!(Number(o.termMonths)>0))why.push("TERM_MISSING");
      if(o&&Number(o.minDepositUsd)>Number(p.amountUsd))why.push("BELOW_MINIMUM_DEPOSIT");
      if(why.length){excluded.push({id:o&&o.id||null,provider:o&&o.provider||null,reasons:why});return;}
      var apy=Number(o.apyPct),term=Number(o.termMonths)||0,flags=[];
      var taxRate=kind.treasury?fed:fed+st,afterTax=apy*(1-taxRate/100);
      // Locked beyond the horizon: CDs pay an early-withdrawal penalty; Treasuries must be sold at market (price risk, not modelled).
      var effective=afterTax;
      if(!kind.liquid&&term>Number(p.horizonMonths)){
        if(o.product==="cd"){
          var pen=Number(o.earlyPenaltyMonths);
          if(!(pen>=0)){excluded.push({id:o.id,provider:o.provider,reasons:["EARLY_PENALTY_UNKNOWN"]});return;}
          var heldYears=Number(p.horizonMonths)/12,grossEarned=apy/100*heldYears,penalty=apy/100*pen/12;
          effective=heldYears>0?((grossEarned-penalty)/heldYears*100)*(1-taxRate/100):0;
          flags.push("EARLY_WITHDRAWAL_PENALTY_APPLIED");
        }else if(o.product==="i_bond"){
          // I bonds cannot be sold at market: 12-month minimum hold, then 3 months' interest forfeited before 5 years.
          if(Number(p.horizonMonths)<12){excluded.push({id:o.id,provider:o.provider,reasons:["I_BOND_LOCKED_FOR_12_MONTHS"]});return;}
          if(Number(p.horizonMonths)<60){var hy=Number(p.horizonMonths)/12;effective=((apy/100*hy-apy/100*3/12)/hy*100)*(1-taxRate/100);flags.push("I_BOND_3_MONTH_INTEREST_PENALTY_APPLIED");}
        }else flags.push("MUST_SELL_BEFORE_MATURITY: market price risk not modelled");
      }
      if(p.needLiquidity===true&&!kind.liquid)flags.push("NOT_LIQUID");
      if(o.insurance==="NONE")flags.push("NOT_GOVERNMENT_INSURED");
      if((o.insurance==="FDIC"||o.insurance==="NCUA")&&Number(p.amountUsd)>limit)flags.push("ABOVE_INSURANCE_LIMIT_AT_ONE_INSTITUTION");
      if(o.product==="i_bond")flags.push("I_BOND_RULES: annual purchase limit and current rate; check TreasuryDirect");
      if(effective<0)flags.push("LOSES_MONEY_AT_THIS_HORIZON");
      var years=Number(p.horizonMonths)/12;
      rows.push({id:o.id,provider:o.provider,product:o.product,apyPct:apy,afterTaxYieldPct:r4(afterTax),effectiveAfterTaxPct:r4(effective),
        // Negative when penalties exceed interest: shown as a loss, never hidden as $0.
        estimatedAfterTaxEarningsUsd:r2(Number(p.amountUsd)*effective/100*years),
        liquid:kind.liquid,termMonths:term||null,maturesOn:term?addMonths(asOf,term):null,flags:flags,sourceUrl:o.sourceUrl,checkedOn:o.checkedOn});
    });
    var eligible=rows.filter(function(r){return !(p.needLiquidity===true&&!r.liquid);});
    eligible.sort(function(a,b){return b.effectiveAfterTaxPct-a.effectiveAfterTaxPct;});
    return {version:VERSION,asOf:asOf,assumptions:{federalRatePct:fed,stateRatePct:st,horizonMonths:Number(p.horizonMonths),amountUsd:Number(p.amountUsd)},
      ranked:eligible,notLiquid:rows.filter(function(r){return p.needLiquidity===true&&!r.liquid;}),excluded:excluded,
      notice:"Comparison of offers you recorded, after estimated income tax. Rates change; recheck the provider page before acting. Not advice and not an instruction to open or fund any account."};
  }
  // Ladder: split an amount into equal rungs maturing at successive intervals.
  function ladder(amountUsd,rungs,intervalMonths,startOn){
    if(!(Number(amountUsd)>0)||!(rungs>=2&&rungs<=24)||!(intervalMonths>=1)||!isDate(startOn))throw Error("Invalid ladder parameters");
    var cents=Math.round(amountUsd*100),base=Math.floor(cents/rungs),rem=cents-base*rungs;
    var out=[];for(var i=0;i<rungs;i++)out.push({rung:i+1,amountUsd:(base+(i<rem?1:0))/100,termMonths:intervalMonths*(i+1),maturesOn:addMonths(startOn,intervalMonths*(i+1))});
    return {rungs:out,notice:"A ladder plan, not a purchase. Each rung needs its own current offer and owner authorization."};
  }
  var api=Object.freeze({VERSION:VERSION,PRODUCTS:Object.keys(PRODUCTS),compare:compare,ladder:ladder});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSYieldCompare=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
