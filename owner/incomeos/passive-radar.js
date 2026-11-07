"use strict";
(function(root){
  // Passive Opportunity Radar intake. Reviews a findings file produced by the owner's ChatGPT
  // radar task and shows each finding with its source, date and value type. It fetches nothing,
  // files nothing, stores nothing and never counts a finding as money received. A projection is
  // never income; advertised amounts are potential value only.
  var SCHEMA="incomeos.passive-findings.v1";
  var TYPES={new_income:"New income",returned_capital:"Returned capital",savings:"Savings",projection:"Projection"};
  var BASIS=["stated","estimated","unknown"];
  var MAX=500,MAX_AGE_DAYS=14;
  var FIELDS=["id","title","sourceName","sourceUrl","directUrl","foundOn","valueType","amountUsd","amountBasis","deadline","summary","eligibilityText","costToPursueUsd",
    "provider","requiredCapitalUsd","adminBurden","counterpartyRisk","defaultRisk","liquidity","lockupDays","taxNote","requiredAction"];
  var LEVELS=["low","medium","high","unknown"];
  // Phrases that mark a finding as a likely scam or a paid finder service; official searches are free.
  var RISK=[/up-?front (fee|payment)/i,/processing fee/i,/gift ?cards?/i,/crypto|bitcoin|usdt/i,/wire (the|a|your)? ?(fee|money|payment)/i,/telegram|whatsapp/i,/finder('?s)? fee|recovery service fee/i,/guaranteed (return|payout|income)/i,/risk-?free return/i];
  var SENSITIVE=[/\b\d{3}-\d{2}-\d{4}\b/,/\b\d{9,19}\b/,/password|passcode|verification code|one-time code/i];
  function isDate(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;var t=Date.parse(x+"T00:00:00Z");return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;}
  function days(a,b){return (Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000;}
  function link(v){if(typeof v!=="string"||v.length>2000)return null;try{var u=new URL(v);if(u.protocol!=="https:"||u.username||u.password||/^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname)||u.hostname.indexOf(".")<0)return null;return u;}catch(e){return null;}}
  function text(v,max){return typeof v==="string"&&v.trim()&&v.length<=max?v.trim():null;}
  function review(f,asOf,seenIds,seenLinks){
    var reasons=[],warnings=[];
    if(!f||typeof f!=="object"||Array.isArray(f))return {reasons:["NOT_AN_OBJECT"],warnings:[]};
    var id=text(f.id,120),title=text(f.title,200),sourceName=text(f.sourceName,120),src=link(f.sourceUrl),direct=link(f.directUrl);
    if(!id)reasons.push("ID_MISSING");else if(seenIds.has(id))reasons.push("DUPLICATE_ID");
    if(!title)reasons.push("TITLE_MISSING");
    if(!sourceName)reasons.push("SOURCE_NAME_MISSING");
    if(!src)reasons.push("SOURCE_LINK_MISSING_OR_UNSAFE");
    if(!direct)reasons.push("DIRECT_LINK_MISSING_OR_UNSAFE");else if(seenLinks.has(direct.href))reasons.push("DUPLICATE_DIRECT_LINK");
    if(!isDate(f.foundOn))reasons.push("DATE_MISSING_OR_INVALID");
    else if(days(f.foundOn,asOf)<0)reasons.push("DATE_IN_FUTURE");
    else if(days(f.foundOn,asOf)>MAX_AGE_DAYS)reasons.push("FINDING_STALE");
    if(!Object.prototype.hasOwnProperty.call(TYPES,f.valueType))reasons.push("VALUE_TYPE_UNKNOWN");
    if(f.deadline!=null&&(!isDate(f.deadline)||f.deadline<asOf))reasons.push("DEADLINE_PASSED_OR_INVALID");
    if(f.amountUsd!=null&&!(typeof f.amountUsd==="number"&&Number.isFinite(f.amountUsd)&&f.amountUsd>=0&&f.amountUsd<=1e9))reasons.push("AMOUNT_INVALID");
    if(f.costToPursueUsd!=null&&!(typeof f.costToPursueUsd==="number"&&Number.isFinite(f.costToPursueUsd)&&f.costToPursueUsd>=0))reasons.push("COST_INVALID");
    if(f.amountBasis!=null&&BASIS.indexOf(f.amountBasis)<0)reasons.push("AMOUNT_BASIS_UNKNOWN");
    if(f.requiredCapitalUsd!=null&&!(typeof f.requiredCapitalUsd==="number"&&Number.isFinite(f.requiredCapitalUsd)&&f.requiredCapitalUsd>=0))reasons.push("CAPITAL_INVALID");
    if(f.lockupDays!=null&&!(Number.isInteger(f.lockupDays)&&f.lockupDays>=0&&f.lockupDays<=36500))reasons.push("LOCKUP_INVALID");
    ["adminBurden","counterpartyRisk","defaultRisk"].forEach(function(k){if(f[k]!=null&&LEVELS.indexOf(f[k])<0)reasons.push("LEVEL_INVALID:"+k);});
    ["provider","liquidity","taxNote","requiredAction"].forEach(function(k){if(f[k]!=null&&!text(f[k],500))reasons.push("TEXT_INVALID:"+k);});
    var blob=[f.title,f.summary,f.eligibilityText,f.sourceName,f.provider,f.liquidity,f.taxNote,f.requiredAction].filter(function(x){return typeof x==="string";}).join(" ");
    if(RISK.some(function(r){return r.test(blob);}))reasons.push("RISK_SIGNAL");
    if(SENSITIVE.some(function(r){return r.test(blob);}))reasons.push("SENSITIVE_DATA");
    if(typeof f.costToPursueUsd==="number"&&f.costToPursueUsd>0)warnings.push("COSTS_MONEY_TO_PURSUE");
    if(typeof f.requiredCapitalUsd==="number"&&f.requiredCapitalUsd>0)warnings.push("REQUIRES_CAPITAL");
    var extra=Object.keys(f).filter(function(k){return FIELDS.indexOf(k)<0;});
    if(extra.length)warnings.push("FIELDS_IGNORED:"+extra.slice(0,5).join(","));
    if(f.amountUsd==null||f.amountBasis!=="stated")warnings.push("AMOUNT_NOT_STATED_BY_SOURCE");
    return {reasons:reasons,warnings:warnings,id:id,src:src,direct:direct};
  }
  function importFindings(file,asOf){
    if(!isDate(asOf))throw Error("A review date is required");
    if(!file||typeof file!=="object"||file.schema!==SCHEMA||!Array.isArray(file.findings))throw Error("Not an "+SCHEMA+" file");
    if(file.findings.length>MAX)throw Error("At most "+MAX+" findings per file");
    var seenIds=new Set(),seenLinks=new Set(),accepted=[],refused=[],potential={new_income:0,returned_capital:0,savings:0};
    file.findings.forEach(function(f,i){
      var r=review(f,asOf,seenIds,seenLinks);
      if(r.id)seenIds.add(r.id);
      if(r.reasons.length){refused.push({index:i,id:r.id||null,title:f&&typeof f.title==="string"?f.title.slice(0,200):null,reasons:r.reasons});return;}
      seenLinks.add(r.direct.href);
      var out={id:r.id,title:f.title.trim(),valueType:f.valueType,valueLabel:TYPES[f.valueType],sourceName:f.sourceName.trim(),sourceUrl:r.src.href,directUrl:r.direct.href,
        official:/\.gov$/i.test(r.direct.hostname),foundOn:f.foundOn,ageDays:days(f.foundOn,asOf),deadline:f.deadline||null,
        amountUsd:typeof f.amountUsd==="number"?f.amountUsd:null,amountBasis:f.amountBasis||"unknown",costToPursueUsd:typeof f.costToPursueUsd==="number"?f.costToPursueUsd:0,
        summary:text(f.summary,2000),eligibilityText:text(f.eligibilityText,2000),warnings:r.warnings,
        terms:{provider:text(f.provider,500),requiredCapitalUsd:typeof f.requiredCapitalUsd==="number"?f.requiredCapitalUsd:null,adminBurden:f.adminBurden||"unknown",
          counterpartyRisk:f.counterpartyRisk||"unknown",defaultRisk:f.defaultRisk||"unknown",liquidity:text(f.liquidity,500),lockupDays:Number.isInteger(f.lockupDays)?f.lockupDays:null,
          taxNote:text(f.taxNote,500),requiredAction:text(f.requiredAction,500)},
        countsAsIncome:false,received:false};
      // Only source-stated amounts of non-projection findings enter the potential totals, and those totals are not income.
      if(f.valueType!=="projection"&&out.amountUsd!==null&&out.amountBasis==="stated")potential[f.valueType]+=Math.round(out.amountUsd*100);
      accepted.push(out);
    });
    var order={new_income:0,returned_capital:1,savings:2,projection:3};
    accepted.sort(function(a,b){return order[a.valueType]-order[b.valueType]||String(a.deadline||"9999").localeCompare(String(b.deadline||"9999"))||(b.amountUsd||0)-(a.amountUsd||0);});
    return {asOf:asOf,accepted:accepted,refused:refused,
      potentialUsd:{new_income:potential.new_income/100,returned_capital:potential.returned_capital/100,savings:potential.savings/100},
      projectionCount:accepted.filter(function(x){return x.valueType==="projection";}).length,
      receivedUsd:0,
      notice:"Findings are leads, not money. Nothing here has been received, claimed or verified as owed to you. Potential totals use only amounts the source states; projections are never counted. Open the direct link and confirm eligibility yourself before acting."};
  }
  function template(asOf){
    return {schema:SCHEMA,note:"Synthetic example. Replace with findings that each have a real source page and a direct link.",findings:[
      {id:"example-rebate-1",title:"Example utility rebate for a smart thermostat",sourceName:"Example utility rebates page",sourceUrl:"https://example.org/rebates",directUrl:"https://example.org/rebates/thermostat",foundOn:asOf,valueType:"savings",amountUsd:75,amountBasis:"stated",deadline:null,summary:"Copied description from the source.",eligibilityText:"Copied eligibility text from the source.",provider:"Example utility",requiredCapitalUsd:0,adminBurden:"low",counterpartyRisk:"low",defaultRisk:"unknown",liquidity:"Paid as a bill credit",lockupDays:0,taxNote:"Utility rebates are often not taxable; confirm with your accountant",requiredAction:"Submit the rebate form with the receipt"},
      {id:"example-projection-1",title:"Example: higher savings yield if cash were moved",sourceName:"Example bank rate page",sourceUrl:"https://example.org/rates",directUrl:"https://example.org/rates/savings",foundOn:asOf,valueType:"projection",amountUsd:null,amountBasis:"unknown",deadline:null,summary:"A projection is a calculation, not income."}]};
  }
  var api=Object.freeze({SCHEMA:SCHEMA,TYPES:Object.freeze(Object.assign({},TYPES)),MAX_AGE_DAYS:MAX_AGE_DAYS,importFindings:importFindings,template:template});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSPassiveRadar=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
