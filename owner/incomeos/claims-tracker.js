"use strict";
(function(root){
  // IncomeOS recovery claims: unclaimed property, refunds, rebates, billing
  // errors, savings bonds and pensions. Tracks searches and claims the OWNER
  // performs on official sites. It never files a claim, never contacts anyone
  // and never counts money as recovered until a bank posting or payment record
  // is attached. Paid "finder" services are flagged: official searches are free.
  var VERSION="incomeos.claims.v1";
  var SOURCES=[
    {id:"md-comptroller",name:"Maryland Comptroller unclaimed property search",url:"https://www.marylandtaxes.gov/unclaimed-property/",scope:"MD",kind:"unclaimed_property",urlStatus:"confirmed by web search 2026-11-03"},
    {id:"missingmoney",name:"MissingMoney.com (multi-state, run with NAUPA)",url:"https://www.missingmoney.com/",scope:"multi-state",kind:"unclaimed_property",urlStatus:"confirmed by web search 2026-11-03"},
    {id:"treasury-hunt",name:"TreasuryDirect Treasury Hunt (matured savings bonds)",url:"https://www.treasurydirect.gov/savings-bonds/treasury-hunt/",scope:"federal",kind:"savings_bond",urlStatus:"UNCONFIRMED: check the address before use"},
    {id:"pbgc",name:"PBGC unclaimed pension search",url:"https://www.pbgc.gov/search-unclaimed-pensions",scope:"federal",kind:"pension",urlStatus:"UNCONFIRMED: check the address before use"}
  ];
  var KINDS=["unclaimed_property","refund","rebate","billing_error","savings_bond","pension","merchant_credit"];
  var STATES=["SEARCH_DUE","SEARCHED_NONE_FOUND","MATCH_FOUND","CLAIM_FILED","DOCUMENTS_REQUESTED","APPROVED","PAID","DENIED","ABANDONED"];
  var NEXT={SEARCH_DUE:["SEARCHED_NONE_FOUND","MATCH_FOUND"],SEARCHED_NONE_FOUND:["SEARCH_DUE"],MATCH_FOUND:["CLAIM_FILED","ABANDONED"],
    CLAIM_FILED:["DOCUMENTS_REQUESTED","APPROVED","DENIED"],DOCUMENTS_REQUESTED:["CLAIM_FILED","APPROVED","DENIED","ABANDONED"],APPROVED:["PAID","DENIED"],PAID:[],DENIED:[],ABANDONED:[]};
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function addDays(d,n){return new Date(Date.parse(d+"T00:00:00Z")+n*86400000).toISOString().slice(0,10);}
  function c(x){var n=Math.round(Number(x)*100);return Number.isSafeInteger(n)&&n>0?n:NaN;}

  // Searches due: every official source in scope for each state the owner has lived in, re-run every N days.
  // states: ["MD","PA",...]; history: [{sourceId, state, searchedOn}]
  function searchesDue(states,history,asOf,everyDays){
    if(!isDate(asOf))throw Error("asOf date required");
    everyDays=Number.isFinite(everyDays)?everyDays:180;
    var due=[];
    var wanted=SOURCES.filter(function(s){return s.scope!=="MD"||states.indexOf("MD")>=0;});
    wanted.forEach(function(s){
      var last=(history||[]).filter(function(h){return h.sourceId===s.id&&isDate(h.searchedOn);}).map(function(h){return h.searchedOn;}).sort().pop();
      var next=last?addDays(last,everyDays):asOf;
      if(next<=asOf)due.push({sourceId:s.id,name:s.name,url:s.url,urlStatus:s.urlStatus,lastSearched:last||null,reason:last?"RE_SEARCH_INTERVAL":"NEVER_SEARCHED"});
    });
    var covered=["MD"];
    states.filter(function(st){return covered.indexOf(st)<0;}).forEach(function(st){
      due.push({sourceId:"state-"+st,name:st+" unclaimed property (via MissingMoney.com or the state's own site)",url:"https://www.missingmoney.com/",urlStatus:"multi-state portal; confirm the state participates",lastSearched:null,reason:"STATE_LIVED_IN"});
    });
    return due;
  }

  // claim: {id, kind, title, counterparty, sourceId?, estimatedUsd?, feeUsd?, feeCharger?, deadline?, history:[{to, on, evidenceRef, amountUsd?, bankRef?}]}
  function transition(claim,t){
    if(!claim||STATES.indexOf(claim.state)<0)return {ok:false,error:"CLAIM_INVALID"};
    if(NEXT[claim.state].indexOf(t.to)<0)return {ok:false,error:"TRANSITION_NOT_ALLOWED:"+claim.state+"->"+t.to};
    if(!isDate(t.on))return {ok:false,error:"DATE_REQUIRED"};
    var last=claim.history.length?claim.history[claim.history.length-1].on:null;
    if(last&&t.on<last)return {ok:false,error:"DATE_BEFORE_PREVIOUS"};
    if(typeof t.evidenceRef!=="string"||!t.evidenceRef.trim())return {ok:false,error:"EVIDENCE_REFERENCE_REQUIRED"};
    if(t.to==="PAID"&&(!(c(t.amountUsd)>0)||typeof t.bankRef!=="string"||!t.bankRef.trim()))return {ok:false,error:"PAYMENT_AMOUNT_AND_BANK_REFERENCE_REQUIRED"};
    var entry={to:t.to,on:t.on,evidenceRef:t.evidenceRef.trim().slice(0,200)};
    if(t.to==="PAID"){entry.amountUsd=c(t.amountUsd)/100;entry.bankRef=t.bankRef.trim().slice(0,120);}
    var next=JSON.parse(JSON.stringify(claim));next.state=t.to;next.history.push(entry);
    return {ok:true,claim:next};
  }
  function create(x){
    if(!x||typeof x.id!=="string"||!x.id)throw Error("Claim id required");
    if(KINDS.indexOf(x.kind)<0)throw Error("Unknown claim kind");
    if(!isDate(x.openedOn))throw Error("Opened date required");
    var start=x.kind==="unclaimed_property"||x.kind==="savings_bond"||x.kind==="pension"?"SEARCH_DUE":"MATCH_FOUND";
    return {id:x.id,kind:x.kind,title:String(x.title||x.kind).slice(0,120),counterparty:String(x.counterparty||"").slice(0,120),sourceId:x.sourceId||null,
      estimatedUsd:Number.isFinite(c(x.estimatedUsd))?c(x.estimatedUsd)/100:null,feeUsd:Number.isFinite(c(x.feeUsd))?c(x.feeUsd)/100:0,feeCharger:x.feeCharger||null,
      deadline:isDate(x.deadline)?x.deadline:null,statementDate:isDate(x.statementDate)?x.statementDate:null,state:start,history:[{to:start,on:x.openedOn,evidenceRef:"opened"}]};
  }
  // Queue of actions for the owner, plus recovered totals counted only from PAID with a bank reference.
  function review(claims,asOf){
    if(!isDate(asOf))throw Error("asOf date required");
    var actions=[],recoveredCents=0,pendingCents=0,warnings=[],seenBank={};
    (claims||[]).forEach(function(cl){
      if(cl.feeUsd>0&&cl.feeCharger!=="government")warnings.push({claimId:cl.id,code:"FINDER_FEE",detail:"Official unclaimed-property searches and claims are free; a paid finder is not required."});
      var deadline=cl.deadline;
      if(!deadline&&cl.kind==="billing_error"&&cl.statementDate)deadline=addDays(cl.statementDate,60);
      if(deadline&&["PAID","DENIED","ABANDONED"].indexOf(cl.state)<0){
        var left=(Date.parse(deadline+"T00:00:00Z")-Date.parse(asOf+"T00:00:00Z"))/86400000;
        if(left<0)actions.push({claimId:cl.id,priority:1,code:"DEADLINE_PASSED",deadline:deadline});
        else if(left<=14)actions.push({claimId:cl.id,priority:1,code:"DEADLINE_WITHIN_14_DAYS",deadline:deadline,
          note:cl.kind==="billing_error"&&!cl.deadline?"Estimated as 60 days after the statement date; confirm the exact window with the card issuer.":null});
      }
      if(cl.state==="MATCH_FOUND")actions.push({claimId:cl.id,priority:2,code:"FILE_CLAIM_ON_OFFICIAL_SITE"});
      if(cl.state==="DOCUMENTS_REQUESTED")actions.push({claimId:cl.id,priority:1,code:"SEND_REQUESTED_DOCUMENTS"});
      var lastOn=cl.history[cl.history.length-1].on;
      if((cl.state==="CLAIM_FILED"||cl.state==="APPROVED")&&(Date.parse(asOf)-Date.parse(lastOn))/86400000>60)actions.push({claimId:cl.id,priority:3,code:"FOLLOW_UP_NO_RESPONSE_60_DAYS"});
      if(cl.state==="PAID"){
        var p=cl.history[cl.history.length-1];
        if(seenBank[p.bankRef]){warnings.push({claimId:cl.id,code:"BANK_REFERENCE_REUSED"});return;}
        seenBank[p.bankRef]=1;recoveredCents+=Math.round(p.amountUsd*100);
      }else if(cl.state==="APPROVED"&&cl.estimatedUsd)pendingCents+=Math.round(cl.estimatedUsd*100);
    });
    actions.sort(function(a,b){return a.priority-b.priority;});
    return {version:VERSION,asOf:asOf,actions:actions,warnings:warnings,recoveredUsd:recoveredCents/100,approvedNotYetPaidUsd:pendingCents/100,
      notice:"Recovered funds are one-time recoveries, not recurring income, and count only once paid into a bank account."};
  }
  var api=Object.freeze({VERSION:VERSION,SOURCES:SOURCES.map(function(s){return Object.freeze(Object.assign({},s));}),KINDS:KINDS.slice(),STATES:STATES.slice(),searchesDue:searchesDue,create:create,transition:transition,review:review});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSClaims=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
