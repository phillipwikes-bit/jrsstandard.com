"use strict";
(function(){
  // Pure, asynchronous event journal for a future authenticated owner-only backend.
  // SHA-256 chaining detects accidental/unauthorized edits to an exported history.
  // The hash chain is NOT an authenticated signature, remote attestation, or access control.
  // This code never persists, transmits, approves, transfers, or invests funds.
  var TYPES=["POSTED","CLASSIFIED","DOCUMENT_MATCHED","OWNER_RECONCILED","REVERSED"];
  var LABELS=["earned_income","investment_income","refund","returned_principal","sale_proceeds",
    "business_expense","personal_expense","capital_contribution","tax_payment","transfer_in","transfer_out","unclassified"];
  var CREDIT=new Set(["earned_income","investment_income","refund","returned_principal","sale_proceeds","transfer_in"]);
  var DEBIT=new Set(["business_expense","personal_expense","capital_contribution","tax_payment","transfer_out"]);
  var ZERO="0".repeat(64),MAX=10000,ENCODER=new TextEncoder();
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function object(o){return !!o&&typeof o==="object"&&!Array.isArray(o);}
  function keys(obj,allowed,required){
    if(!object(obj))throw Error("Journal record must be an object");
    if(Object.keys(obj).some(function(k){return !allowed.includes(k);})||required.some(function(k){return !own(obj,k);}))throw Error("Unsupported or missing journal fields");
  }
  function id(x){return typeof x==="string"&&/^[a-z0-9][a-z0-9._:-]{3,119}$/i.test(x);}
  function date(x){
    if(typeof x!=="string"||!/^20\d\d-\d\d-\d\d$/.test(x))return false;
    var t=Date.parse(x+"T00:00:00Z");
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;
  }
  function instant(x){
    return typeof x==="string"&&/^20\d\d-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(x)
      &&date(x.slice(0,10))&&Number.isFinite(Date.parse(x));
  }
  function cents(v){return Number.isSafeInteger(v)&&v>0&&v<=1000000000000;}
  function ref(x){return id(x)&&!/^\d{9,}$/.test(x);}
  function dataOf(type,data){
    var copy={};
    if(type==="POSTED"){
      keys(data,["sourceId","postedDate","direction","amountCents","currency","evidenceId"],["sourceId","postedDate","direction","amountCents","currency","evidenceId"]);
      if(!ref(data.sourceId)||!ref(data.evidenceId)||!date(data.postedDate)||!["credit","debit"].includes(data.direction)||!cents(data.amountCents)||data.currency!=="USD")throw Error("Invalid posted evidence");
      copy={sourceId:data.sourceId,postedDate:data.postedDate,direction:data.direction,amountCents:data.amountCents,currency:"USD",evidenceId:data.evidenceId};
    }else if(type==="CLASSIFIED"){
      keys(data,["postedEventId","classification","evidenceId"],["postedEventId","classification","evidenceId"]);
      if(!id(data.postedEventId)||!LABELS.includes(data.classification)||!ref(data.evidenceId))throw Error("Invalid classification");
      copy={postedEventId:data.postedEventId,classification:data.classification,evidenceId:data.evidenceId};
    }else if(type==="DOCUMENT_MATCHED"){
      keys(data,["postedEventId","documentId","amountCents"],["postedEventId","documentId","amountCents"]);
      if(!id(data.postedEventId)||!ref(data.documentId)||!cents(data.amountCents))throw Error("Invalid document match");
      copy={postedEventId:data.postedEventId,documentId:data.documentId,amountCents:data.amountCents};
    }else if(type==="OWNER_RECONCILED"){
      keys(data,["postedEventId","classificationEventId","reviewEvidenceId"],["postedEventId","classificationEventId","reviewEvidenceId"]);
      if(!id(data.postedEventId)||!id(data.classificationEventId)||!ref(data.reviewEvidenceId))throw Error("Invalid reconciliation");
      copy={postedEventId:data.postedEventId,classificationEventId:data.classificationEventId,reviewEvidenceId:data.reviewEvidenceId};
    }else if(type==="REVERSED"){
      keys(data,["targetEventId","reasonEvidenceId"],["targetEventId","reasonEvidenceId"]);
      if(!id(data.targetEventId)||!ref(data.reasonEvidenceId))throw Error("Invalid reversal");
      copy={targetEventId:data.targetEventId,reasonEvidenceId:data.reasonEvidenceId};
    }else throw Error("Unknown journal event");
    return copy;
  }
  function input(e){
    keys(e,["id","type","timestamp","data"],["id","type","timestamp","data"]);
    if(!id(e.id)||!TYPES.includes(e.type)||!instant(e.timestamp))throw Error("Invalid event identity or timestamp");
    return {id:e.id,type:e.type,timestamp:e.timestamp,data:dataOf(e.type,e.data)};
  }
  async function digest(value){
    if(!crypto||!crypto.subtle)throw Error("Cryptographic hash unavailable");
    var hash=await crypto.subtle.digest("SHA-256",ENCODER.encode(value));
    return Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,"0");}).join("");
  }
  function snapshot(events){
    var byId=new Map(),reversed=new Set(),sourceIds=new Set();
    events.forEach(function(e){byId.set(e.id,e);if(e.type==="REVERSED")reversed.add(e.data.targetEventId);});
    var posted=new Map(),classes=new Map(),matches=new Map(),reconciled=new Map();
    events.forEach(function(e){
      if(reversed.has(e.id)||e.type==="REVERSED")return;
      var d=e.data;
      if(e.type==="POSTED"){posted.set(e.id,e);sourceIds.add(d.sourceId);}
      else if(e.type==="CLASSIFIED"){
        if(!classes.has(d.postedEventId))classes.set(d.postedEventId,[]);
        classes.get(d.postedEventId).push(e);
      }else if(e.type==="DOCUMENT_MATCHED"){
        if(!matches.has(d.postedEventId))matches.set(d.postedEventId,[]);
        matches.get(d.postedEventId).push(e);
      }else if(e.type==="OWNER_RECONCILED"){
        if(!reconciled.has(d.postedEventId))reconciled.set(d.postedEventId,[]);
        reconciled.get(d.postedEventId).push(e);
      }
    });
    return {byId:byId,reversed:reversed,posted:posted,classes:classes,matches:matches,reconciled:reconciled,sourceIds:sourceIds};
  }
  function expectedDirection(label){
    return CREDIT.has(label)?"credit":DEBIT.has(label)?"debit":null;
  }
  function assertEligible(e,events){
    var state=snapshot(events),d=e.data;
    if(state.byId.has(e.id))throw Error("Duplicate event ID");
    if(e.type==="POSTED"){
      if(events.some(function(x){return x.type==="POSTED"&&x.data.sourceId===d.sourceId;}))throw Error("Source ID already recorded, including reversed histories");
    }else if(e.type==="CLASSIFIED"){
      var posted=state.posted.get(d.postedEventId);
      if(!posted)throw Error("Classification requires an active posted source");
      var direction=expectedDirection(d.classification);
      if(direction&&posted.data.direction!==direction)throw Error("Classification conflicts with posting direction");
      if((state.classes.get(d.postedEventId)||[]).length)throw Error("Reverse previous classification before replacing it");
      if((state.reconciled.get(d.postedEventId)||[]).length)throw Error("Cannot reclassify active reconciliation");
    }else if(e.type==="DOCUMENT_MATCHED"){
      var source=state.posted.get(d.postedEventId);
      if(!source ||source.data.amountCents!==d.amountCents)throw Error("Document amount does not match posted amount");
      if((state.matches.get(d.postedEventId)||[]).some(function(x){return x.data.documentId===d.documentId;}))throw Error("Document already matched to posting");
      if(events.some(function(x){return x.type==="DOCUMENT_MATCHED"&&!state.reversed.has(x.id)&&x.data.documentId===d.documentId;}))throw Error("Document evidence reused against another posting");
    }else if(e.type==="OWNER_RECONCILED"){
      var post=state.posted.get(d.postedEventId),cl=(state.classes.get(d.postedEventId)||[]).find(function(x){return x.id===d.classificationEventId;});
      if(!post||!cl||cl.data.classification==="unclassified")throw Error("Reconciliation requires an active, classified posting");
      if((state.reconciled.get(d.postedEventId)||[]).length)throw Error("Posting has active reconciliation");
    }else if(e.type==="REVERSED"){
      var target=state.byId.get(d.targetEventId);
      if(!target || target.type==="REVERSED" || state.reversed.has(d.targetEventId))throw Error("Reversal must reference an active non-reversal event");
      if(target.type==="CLASSIFIED"){
        if((state.reconciled.get(target.data.postedEventId)||[]).some(function(x){return x.data.classificationEventId===target.id;}))throw Error("Reverse reconciliation before reversing classification");
      }
      if(target.type==="POSTED"){
        var dependent=events.some(function(x){return !state.reversed.has(x.id)&&x.type!=="REVERSED"&&(
          (x.data.postedEventId===target.id) || (x.type==="OWNER_RECONCILED"&&x.data.postedEventId===target.id)
        );});
        if(dependent)throw Error("Reverse dependent records before reversing source posting");
      }
    }
  }
  async function verify(events){
    if(!Array.isArray(events)||events.length>MAX)throw Error("Journal length invalid");
    var history=[],prev=ZERO,sequence=0;
    for(var i=0;i<events.length;i++){
      var row=events[i];
      keys(row,["seq","prevHash","hash","id","type","timestamp","data"],["seq","prevHash","hash","id","type","timestamp","data"]);
      if(row.seq!==sequence+1 || row.prevHash!==prev ||typeof row.hash!=="string"||!/^[0-9a-f]{64}$/.test(row.hash))throw Error("Journal sequence or hash broken at event "+(i+1));
      var normalized=input({id:row.id,type:row.type,timestamp:row.timestamp,data:row.data});
      assertEligible(normalized,history);
      if(history.length && normalized.timestamp<history[history.length-1].timestamp)throw Error("Journal timestamp chronology violated");
      var content={seq:row.seq,prevHash:row.prevHash,id:normalized.id,type:normalized.type,timestamp:normalized.timestamp,data:normalized.data};
      var expected=await digest(JSON.stringify(content));
      if(expected!==row.hash)throw Error("Journal has been modified at event "+(i+1));
      history.push({...content,hash:expected});
      prev=expected;sequence++;
    }
    return {valid:true,count:history.length,headHash:prev,state:snapshot(history)};
  }
  async function append(history,event){
    var check=await verify(history),normalized=input(event);
    if(history.length>=MAX)throw Error("Journal event cap reached");
    assertEligible(normalized,history);
    if(history.length && normalized.timestamp<history[history.length-1].timestamp)throw Error("Journal timestamp must not precede prior entry");
    var row={seq:check.count+1,prevHash:check.headHash,id:normalized.id,type:normalized.type,timestamp:normalized.timestamp,data:normalized.data};
    var next={...row,hash:await digest(JSON.stringify(row))};
    return history.concat([next]);
  }
  async function report(events){
    var v=await verify(events),state=v.state,summary={},unclassified=0,reviewed=0,pending=0,issues=[];
    state.posted.forEach(function(post,id){
      var classes=state.classes.get(id)||[],recons=state.reconciled.get(id)||[];
      if(classes.length!==1){unclassified++;issues.push({code:"NOT_CLASSIFIED",postedEventId:id});return;}
      var cl=classes[0];
      if(cl.data.classification==="unclassified"){unclassified++;return;}
      var hasOwnerReview=recons.length===1 && recons[0].data.classificationEventId===cl.id;
      if(!hasOwnerReview){pending++;return;}
      reviewed++;
      var label=cl.data.classification;
      summary[label]=(summary[label]||0)+post.data.amountCents;
    });
    var totals={};Object.keys(summary).forEach(function(k){totals[k]=summary[k]/100;});
    var outstanding=state.posted.size-reviewed;
    return {count:v.count,hash:v.headHash,activePostings:state.posted.size,ownerReviewedPostings:reviewed,
      nonReviewedPostings:outstanding,unclassified:unclassified,pendingReview:pending,ownerReviewedByClass:totals,
      earnedIncomeUsd:(totals.earned_income||0),investmentCashIncomeUsd:(totals.investment_income||0),
      totalReceivedIncomeUsd:(totals.earned_income||0)+(totals.investment_income||0),
      returnedCapitalUsd:(totals.refund||0)+(totals.returned_principal||0),
      issues:issues,
      closeGate:{status:outstanding===0?"JOURNAL_REVIEW_COMPLETE_ONLY":"HOLD",readyForTaxFiling:false,
        independentlyAudited:false,allAccountsCovered:false,canTransferFunds:false,
        note:"Hash integrity and owner review do not establish statement completeness, authorization authenticity, tax eligibility or bank account balances."}};
  }
  window.IncomeOSEventJournal=Object.freeze({append:append,verify:verify,report:report,normalizeInput:input,genesisHash:ZERO});
}());