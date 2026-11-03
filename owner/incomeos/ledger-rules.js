"use strict";
(function(root){
  // IncomeOS categorization and split rules.
  // Rules PROPOSE a category or a split; they never change a ledger entry.
  // The owner accepts or rejects each proposal. A rule that conflicts with
  // another rule produces no proposal, only an exception. Splits are integer
  // cents and must sum exactly to the original amount.
  var VERSION="incomeos.ledger-rules.v1";
  var INCOME=["research","evaluation","business","royalty","rental","interest","dividend","investment","reward","recovery","employment","pension","retirement","socialsecurity","unemployment","other"];
  var COST=["platform","software","equipment","internet","travel","training","professional","supplies","investing","tax","homeoffice","advertising","other"];
  function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
  function cents(x){var n=Math.round(Number(x)*100);return Number.isSafeInteger(n)?n:NaN;}
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function amountOf(e){return e.kind==="income"?cents(e.grossUsd):cents(e.amountUsd);}

  // rule: {id, kind:"income"|"outflow", match:{vendorContains?, labelContains?, minUsd?, maxUsd?},
  //        category, split?:[{category, percent}] | [{category, amountUsd}], businessUsePct?, approvedOn, note}
  function validateRule(r){
    var p=[];
    if(!r||typeof r!=="object")return ["RULE_INVALID"];
    if(typeof r.id!=="string"||!/^[a-z0-9][a-z0-9_-]{1,60}$/i.test(r.id))p.push("RULE_ID_INVALID");
    if(r.kind!=="income"&&r.kind!=="outflow")p.push("RULE_KIND_INVALID");
    var cats=r.kind==="income"?INCOME:COST;
    var m=r.match||{};
    if(!m.vendorContains&&!m.labelContains)p.push("RULE_MATCH_TOO_BROAD");
    if(m.minUsd!=null&&!(Number(m.minUsd)>=0))p.push("RULE_MIN_INVALID");
    if(m.maxUsd!=null&&!(Number(m.maxUsd)>0))p.push("RULE_MAX_INVALID");
    if(!r.split&&cats.indexOf(r.category)<0)p.push("RULE_CATEGORY_UNKNOWN");
    if(r.split){
      if(!Array.isArray(r.split)||r.split.length<2||r.split.length>10)p.push("SPLIT_INVALID");
      else{
        if(r.split.some(function(s){return cats.indexOf(s.category)<0;}))p.push("SPLIT_CATEGORY_UNKNOWN");
        var pct=r.split.every(function(s){return s.percent!=null&&s.amountUsd==null;}),amt=r.split.every(function(s){return s.amountUsd!=null&&s.percent==null;});
        if(!pct&&!amt)p.push("SPLIT_MIXED_BASIS");
        if(pct&&Math.round(r.split.reduce(function(a,s){return a+Number(s.percent);},0)*1000)!==100000)p.push("SPLIT_PERCENT_NOT_100");
        if(r.split.some(function(s){return (s.percent!=null&&!(Number(s.percent)>0))||(s.amountUsd!=null&&!(Number(s.amountUsd)>0));}))p.push("SPLIT_PART_NOT_POSITIVE");
      }
    }
    if(r.businessUsePct!=null&&!(Number(r.businessUsePct)>=0&&Number(r.businessUsePct)<=100))p.push("BUSINESS_USE_INVALID");
    if(!isDate(r.approvedOn))p.push("RULE_NOT_OWNER_APPROVED");
    return p;
  }
  function matches(r,e){
    if(e.kind!==r.kind)return false;
    var m=r.match||{},vendor=norm(e.payer),label=norm(e.label),amt=amountOf(e);
    if(m.vendorContains&&vendor.indexOf(norm(m.vendorContains))<0)return false;
    if(m.labelContains&&label.indexOf(norm(m.labelContains))<0)return false;
    if(m.minUsd!=null&&amt<cents(m.minUsd))return false;
    if(m.maxUsd!=null&&amt>cents(m.maxUsd))return false;
    return true;
  }
  // Allocate cents across parts; remainder cents go to the largest parts first, deterministically.
  function allocate(total,split){
    if(split[0].amountUsd!=null){
      var parts=split.map(function(s){return {category:s.category,cents:cents(s.amountUsd)};});
      var sum=parts.reduce(function(a,p){return a+p.cents;},0);
      return sum===total?{ok:true,parts:parts}:{ok:false,reason:"SPLIT_AMOUNTS_DO_NOT_EQUAL_TOTAL"};
    }
    var raw=split.map(function(s,i){var exact=total*Number(s.percent)/100;return {i:i,category:s.category,cents:Math.floor(exact),frac:exact-Math.floor(exact)};});
    var rem=total-raw.reduce(function(a,p){return a+p.cents;},0);
    raw.slice().sort(function(a,b){return b.frac-a.frac||a.i-b.i;}).slice(0,rem).forEach(function(p){raw[p.i].cents+=1;});
    return {ok:true,parts:raw.map(function(p){return {category:p.category,cents:p.cents};})};
  }
  function specificity(r){var m=r.match||{};return (m.vendorContains?2:0)+(m.labelContains?2:0)+(m.minUsd!=null?1:0)+(m.maxUsd!=null?1:0);}

  // propose(entries, rules) -> {proposals, exceptions, invalidRules}
  // An entry that is already categorized by the owner (categoryConfirmed:true) is never re-proposed.
  function propose(entries,rules){
    var valid=[],invalid=[];
    (Array.isArray(rules)?rules:[]).forEach(function(r){var p=validateRule(r);if(p.length)invalid.push({ruleId:r&&r.id||null,problems:p});else valid.push(r);});
    var proposals=[],exceptions=[];
    (Array.isArray(entries)?entries:[]).forEach(function(e){
      if(!e||!e.id||(e.kind!=="income"&&e.kind!=="outflow"))return;
      if(e.categoryConfirmed===true)return;
      var total=amountOf(e);if(!(total>0))return;
      var hits=valid.filter(function(r){return matches(r,e);});
      if(!hits.length)return;
      var best=Math.max.apply(null,hits.map(specificity)),top=hits.filter(function(r){return specificity(r)===best;});
      var outcomes=top.map(function(r){return r.split?"split:"+JSON.stringify(r.split):"cat:"+r.category+"|"+(r.businessUsePct==null?"":r.businessUsePct);});
      if(outcomes.some(function(o){return o!==outcomes[0];})){exceptions.push({entryId:e.id,code:"RULES_CONFLICT",ruleIds:top.map(function(r){return r.id;})});return;}
      var r=top[0];
      var prop={entryId:e.id,ruleId:r.id,status:"PROPOSED_FOR_OWNER_REVIEW",currentCategory:e.category||null};
      if(r.split){
        var a=allocate(total,r.split);
        if(!a.ok){exceptions.push({entryId:e.id,code:a.reason,ruleIds:[r.id]});return;}
        prop.split=a.parts.map(function(p){return {category:p.category,amountUsd:p.cents/100};});
      }else{
        if(e.category===r.category&&(r.businessUsePct==null||e.businessUsePct===r.businessUsePct))return;
        prop.category=r.category;
      }
      if(r.businessUsePct!=null){prop.businessUsePct=Number(r.businessUsePct);prop.note="Business-use percentage is an owner estimate, not an approved deduction.";}
      proposals.push(prop);
    });
    return {version:VERSION,proposals:proposals,exceptions:exceptions,invalidRules:invalid};
  }
  // Apply ONE accepted proposal to a copy of the entry; returns the new entry or new split entries plus an audit record.
  function apply(entry,proposal,acceptedOn){
    if(!entry||!proposal||proposal.entryId!==entry.id)throw Error("Proposal does not belong to this entry");
    if(!isDate(acceptedOn))throw Error("Owner acceptance date required");
    var audit={entryId:entry.id,ruleId:proposal.ruleId,acceptedOn:acceptedOn,before:{category:entry.category||null,businessUsePct:entry.businessUsePct==null?null:entry.businessUsePct}};
    if(proposal.split){
      var total=amountOf(entry),sum=proposal.split.reduce(function(a,s){return a+cents(s.amountUsd);},0);
      if(sum!==total)throw Error("Split no longer equals the entry amount");
      var parts=proposal.split.map(function(s,i){var c=JSON.parse(JSON.stringify(entry));c.id=entry.id+"-s"+(i+1);c.splitOf=entry.id;c.category=s.category;c.categoryConfirmed=true;
        if(entry.kind==="income"){c.grossUsd=s.amountUsd;c.feesUsd=i===0?entry.feesUsd||0:0;}else c.amountUsd=s.amountUsd;return c;});
      audit.after={splitInto:parts.map(function(p){return p.id;})};
      return {entries:parts,audit:audit};
    }
    var c=JSON.parse(JSON.stringify(entry));c.category=proposal.category;c.categoryConfirmed=true;
    if(proposal.businessUsePct!=null)c.businessUsePct=proposal.businessUsePct;
    audit.after={category:c.category,businessUsePct:c.businessUsePct==null?null:c.businessUsePct};
    return {entries:[c],audit:audit};
  }
  var api=Object.freeze({VERSION:VERSION,validateRule:validateRule,propose:propose,apply:apply});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSLedgerRules=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
