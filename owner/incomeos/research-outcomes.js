"use strict";
(function(){
  // Converts owner research participation into payout evidence only when a
  // separately reconciled bank posting and exact study payout document exist.
  // This module never calls recruiters, submits forms, or changes financial records.
  var STAGES=["APPLIED","INVITED","COMPLETED","ACCEPTED","PAID","DECLINED","INELIGIBLE"];
  var ID=/^[a-z0-9][a-z0-9._:-]{3,119}$/i;
  function isId(x){return typeof x==="string"&&ID.test(x);}
  function validDate(s){
    if(typeof s!=="string"||!/^20\d\d-\d\d-\d\d$/.test(s))return false;
    var t=Date.parse(s+"T00:00:00Z");return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;
  }
  function rows(input){
    if(!Array.isArray(input)||input.length>5000)throw Error("Invalid research pipeline size");
    var ids=new Set();
    return input.map(function(e,i){
      if(!e||typeof e!=="object"||Array.isArray(e))throw Error("Invalid stage record "+(i+1));
      if(Object.keys(e).some(function(k){return !["id","studyId","stage","date","evidenceId","minutes","bankEventId","payoutDocumentId"].includes(k);}))throw Error("Unexpected research record fields");
      if(!isId(e.id)||!isId(e.studyId)||!STAGES.includes(e.stage)||!validDate(e.date)||!isId(e.evidenceId))throw Error("Invalid research stage identity");
      if(ids.has(e.id))throw Error("Duplicate research stage identity");ids.add(e.id);
      var minutes=e.minutes==null?null:Number(e.minutes);
      if(minutes!==null&&(!Number.isInteger(minutes)||minutes<0||minutes>10080))throw Error("Invalid reported effort");
      if(e.stage==="PAID"&&(!isId(e.bankEventId)||!isId(e.payoutDocumentId)))throw Error("Bank payout requires source and matching payment evidence IDs");
      if(e.stage!=="PAID"&&(e.bankEventId!==undefined||e.payoutDocumentId!==undefined))throw Error("Bank source references are allowed only for payout stage");
      return {id:e.id,studyId:e.studyId,stage:e.stage,date:e.date,evidenceId:e.evidenceId,minutes:minutes,
        bankEventId:e.stage==="PAID"?e.bankEventId:null,payoutDocumentId:e.stage==="PAID"?e.payoutDocumentId:null};
    });
  }
  function evaluateOne(studyId,events,state,paymentUse){
    var stages=events.map(function(e){return e.stage;}),has=function(s){return stages.includes(s);},
      all=events.slice().sort(function(a,b){return a.date.localeCompare(b.date);});
    var first=all[0],last=all[all.length-1],issues=[],effort=0,unknownEffort=false;
    if(events.some(function(e,i){return i>0&&e.date<events[i-1].date;}))issues.push("STUDY_STAGE_CHRONOLOGY");
    if(has("DECLINED")||has("INELIGIBLE")){if(has("PAID"))issues.push("CONFLICTING_TERMINAL_STAGE");}
    var paid=events.filter(function(e){return e.stage==="PAID";});
    if(paid.length>1)issues.push("MULTIPLE_PAYOUT_STAGES");
    if(paid.length&&(!has("APPLIED")||!has("COMPLETED")||!has("ACCEPTED")))issues.push("INCOMPLETE_PARTICIPATION_TRAIL");
    var needed=["APPLIED","COMPLETED","ACCEPTED","PAID"];
    if(paid.length && needed.some(function(stage,i){return !stages.includes(stage)||(i>0&&stages.indexOf(stage)<=stages.indexOf(needed[i-1]));}))issues.push("INVALID_PARTICIPATION_ORDER");
    events.forEach(function(e){if(e.stage==="APPLIED"||e.stage==="COMPLETED"){
      if(e.minutes===null)unknownEffort=true;else effort+=e.minutes;
    }});
    var value=0;
    if(paid.length===1&&!issues.length){
      var p=paid[0],post=state.posted.get(p.bankEventId),cl=(state.classes.get(p.bankEventId)||[]),
        matches=state.matches.get(p.bankEventId)||[],reviews=state.reconciled.get(p.bankEventId)||[];
      var proper=post&&post.data.direction==="credit"&&cl.length===1&&cl[0].data.classification==="earned_income"
        &&reviews.length===1&&reviews[0].data.classificationEventId===cl[0].id
        &&matches.some(function(m){return m.data.documentId===p.payoutDocumentId&&m.data.amountCents===post.data.amountCents;});
      if(!proper)issues.push("PAYMENT_EVIDENCE_INCOMPLETE");
      else if(paymentUse.has(p.bankEventId))issues.push("BANK_PAYMENT_ALREADY_ATTRIBUTED");
      else {paymentUse.add(p.bankEventId);value=post.data.amountCents;}
    }
    return {studyId:studyId,stages:stages,latestStage:last.stage,startDate:first.date,lastUpdate:last.date,
      ownerReviewedReceivedUsd:value/100,effortMinutes:unknownEffort?null:effort,
      realizedHourlyEquivalent:value>0&&!unknownEffort&&effort>0?Math.round(value*60/effort)/100:null,
      issues:issues,paidEvidenceComplete:value>0,
      note:"Payout attribution is owner-reviewed source linkage, not independent financial audit or evidence that all applications are represented."};
  }
  async function analyze(events,journal,asOf){
    if(!validDate(asOf))throw Error("Valid as-of date required");
    if(!window.IncomeOSEventJournal)throw Error("Verified financial journal dependency missing");
    var verify=await window.IncomeOSEventJournal.verify(journal),normalized=rows(events),byStudy=new Map();
    normalized.forEach(function(e){
      if(e.date>asOf)throw Error("Future-dated research outcomes are not accepted");
      if(!byStudy.has(e.studyId))byStudy.set(e.studyId,[]);
      byStudy.get(e.studyId).push(e);
    });
    var paymentUse=new Set(),items=[],verifiedCents=0;
    byStudy.forEach(function(arr,study){
      var r=evaluateOne(study,arr,verify.state,paymentUse);
      verifiedCents+=Math.round(r.ownerReviewedReceivedUsd*100);items.push(r);
    });
    var submitted=normalized.filter(function(e){return e.stage==="APPLIED";}).length;
    var accepted=normalized.filter(function(e){return e.stage==="ACCEPTED";}).length;
    return {asOf:asOf,studyCount:byStudy.size,applicationsRecorded:submitted,acceptedParticipationRecords:accepted,
      ownerReviewedResearchReceiptsUsd:verifiedCents/100,paidStudies:items.filter(function(x){return x.paidEvidenceComplete;}).length,
      results:items,conversionRate:null,
      note:"No application-to-payout conversion rate is inferred until source coverage and complete opportunity denominators are established."};
  }
  window.IncomeOSResearchOutcomes=Object.freeze({analyze:analyze,validateRows:rows});
}());