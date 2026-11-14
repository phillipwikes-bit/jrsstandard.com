"use strict";
(function(root){
  // IncomeOS opportunity lifecycle. Append-only, evidence-bearing transitions.
  // The system may only record discovery, verification and closure-by-expiry.
  // Every step that represents the owner (approval, submission, acceptance,
  // work, payment) requires an owner actor and explicit evidence. Nothing
  // advances on elapsed time or model inference. Payment is verified only by
  // authenticated payment evidence, never by acceptance or a completed task.
  var STATES=["DISCOVERED","SOURCE_VERIFIED","ELIGIBILITY_VERIFIED","ELIGIBLE_FOR_REVIEW","APPLICATION_APPROVED_BY_OWNER","APPLICATION_SUBMITTED",
    "SCREENING_PENDING","SCREENING_COMPLETED","ACCEPTED","PROJECT_ASSIGNED","WORK_PERFORMED","PAYMENT_PENDING","PAYMENT_VERIFIED","CLOSED"];
  var NEXT={
    DISCOVERED:["SOURCE_VERIFIED","CLOSED"],SOURCE_VERIFIED:["ELIGIBILITY_VERIFIED","CLOSED"],ELIGIBILITY_VERIFIED:["ELIGIBLE_FOR_REVIEW","CLOSED"],
    ELIGIBLE_FOR_REVIEW:["APPLICATION_APPROVED_BY_OWNER","CLOSED"],APPLICATION_APPROVED_BY_OWNER:["APPLICATION_SUBMITTED","CLOSED"],
    APPLICATION_SUBMITTED:["SCREENING_PENDING","ACCEPTED","CLOSED"],SCREENING_PENDING:["SCREENING_COMPLETED","CLOSED"],SCREENING_COMPLETED:["ACCEPTED","CLOSED"],
    ACCEPTED:["PROJECT_ASSIGNED","CLOSED"],PROJECT_ASSIGNED:["WORK_PERFORMED","CLOSED"],WORK_PERFORMED:["PAYMENT_PENDING","CLOSED"],
    PAYMENT_PENDING:["PAYMENT_VERIFIED","CLOSED"],PAYMENT_VERIFIED:["CLOSED"],CLOSED:[]
  };
  var SYSTEM_ALLOWED={SOURCE_VERIFIED:1,ELIGIBILITY_VERIFIED:1,ELIGIBLE_FOR_REVIEW:1};
  var EVIDENCE={
    SOURCE_VERIFIED:["source_fetch_receipt","owner_source_check"],
    ELIGIBILITY_VERIFIED:["eligibility_engine_decision"],
    ELIGIBLE_FOR_REVIEW:["eligibility_engine_decision"],
    APPLICATION_APPROVED_BY_OWNER:["owner_authorization"],
    APPLICATION_SUBMITTED:["submission_confirmation"],
    SCREENING_PENDING:["platform_message","submission_confirmation"],
    SCREENING_COMPLETED:["platform_message","assessment_record"],
    ACCEPTED:["acceptance_record","signed_agreement","platform_message"],
    PROJECT_ASSIGNED:["assignment_record","platform_message"],
    WORK_PERFORMED:["timesheet","work_log","platform_task_record"],
    PAYMENT_PENDING:["invoice","platform_payout_pending","work_log"],
    PAYMENT_VERIFIED:["bank_posting","platform_payout_statement"]
  };
  var CLOSE_REASONS=["expired","withdrawn","rejected","declined_by_owner","ineligible","completed","source_unavailable"];
  function isTs(x){return typeof x==="string"&&Number.isFinite(Date.parse(x))&&/^\d{4}-\d{2}-\d{2}T/.test(x);}
  function create(opportunityId,discoveredAt,sourceRef){
    if(typeof opportunityId!=="string"||!opportunityId)throw Error("OPPORTUNITY_ID_REQUIRED");
    if(!isTs(discoveredAt))throw Error("TIMESTAMP_REQUIRED");
    return Object.freeze({opportunityId:opportunityId,state:"DISCOVERED",history:Object.freeze([Object.freeze({to:"DISCOVERED",at:discoveredAt,actor:"system",evidence:Object.freeze({type:"source_fetch_receipt",ref:String(sourceRef||"").slice(0,200)})})])});
  }
  // t: {to, at, actor:"system"|"owner", evidence:{type, ref}, closeReason?, authorization?:{scope, grantedAt}}
  function transition(rec,t){
    if(!rec||STATES.indexOf(rec.state)<0)return {ok:false,error:"RECORD_INVALID",record:rec};
    if(!t||STATES.indexOf(t.to)<0)return {ok:false,error:"TARGET_STATE_INVALID",record:rec};
    if(NEXT[rec.state].indexOf(t.to)<0)return {ok:false,error:"TRANSITION_NOT_ALLOWED:"+rec.state+"->"+t.to,record:rec};
    if(!isTs(t.at))return {ok:false,error:"TIMESTAMP_REQUIRED",record:rec};
    var last=rec.history[rec.history.length-1];
    if(Date.parse(t.at)<Date.parse(last.at))return {ok:false,error:"TIMESTAMP_BEFORE_PREVIOUS",record:rec};
    if(t.actor!=="system"&&t.actor!=="owner")return {ok:false,error:"ACTOR_INVALID",record:rec};
    if(t.actor==="system"&&!SYSTEM_ALLOWED[t.to]&&!(t.to==="CLOSED"&&(t.closeReason==="expired"||t.closeReason==="withdrawn"||t.closeReason==="source_unavailable")))return {ok:false,error:"OWNER_ACTION_REQUIRED",record:rec};
    var ev=t.evidence;
    if(t.to==="CLOSED"){
      if(CLOSE_REASONS.indexOf(t.closeReason)<0)return {ok:false,error:"CLOSE_REASON_REQUIRED",record:rec};
      if(!ev||typeof ev.ref!=="string"||!ev.ref.trim())return {ok:false,error:"EVIDENCE_REQUIRED",record:rec};
    }else{
      if(!ev||EVIDENCE[t.to].indexOf(ev.type)<0)return {ok:false,error:"EVIDENCE_TYPE_NOT_ACCEPTED_FOR_"+t.to,record:rec};
      if(typeof ev.ref!=="string"||!ev.ref.trim())return {ok:false,error:"EVIDENCE_REFERENCE_REQUIRED",record:rec};
    }
    if(t.to==="APPLICATION_APPROVED_BY_OWNER"&&!(t.authorization&&t.authorization.scope==="apply:"+rec.opportunityId))return {ok:false,error:"TRANSACTION_SPECIFIC_AUTHORIZATION_REQUIRED",record:rec};
    if(t.to==="APPLICATION_SUBMITTED"&&!rec.history.some(function(h){return h.to==="APPLICATION_APPROVED_BY_OWNER";}))return {ok:false,error:"OWNER_APPROVAL_MISSING",record:rec};
    if(t.to==="PAYMENT_VERIFIED"&&!(Number.isFinite(t.amountUsd)&&t.amountUsd>0&&typeof t.transactionId==="string"&&t.transactionId))return {ok:false,error:"PAYMENT_AMOUNT_AND_TRANSACTION_ID_REQUIRED",record:rec};
    var entry={to:t.to,at:t.at,actor:t.actor,evidence:Object.freeze({type:ev.type||"closure_note",ref:ev.ref.trim().slice(0,200)})};
    if(t.closeReason)entry.closeReason=t.closeReason;
    if(t.to==="PAYMENT_VERIFIED"){entry.amountUsd=Math.round(t.amountUsd*100)/100;entry.transactionId=t.transactionId.slice(0,120);}
    return {ok:true,error:null,record:Object.freeze({opportunityId:rec.opportunityId,state:t.to,history:Object.freeze(rec.history.concat([Object.freeze(entry)]))})};
  }
  // Realized income from lifecycle records counts PAYMENT_VERIFIED only, once per transaction id.
  function verifiedIncome(records){
    var seen={},total=0,dups=[];
    (records||[]).forEach(function(r){(r.history||[]).forEach(function(h){
      if(h.to!=="PAYMENT_VERIFIED")return;
      if(seen[h.transactionId]){dups.push(h.transactionId);return;}
      seen[h.transactionId]=1;total+=Math.round(h.amountUsd*100);
    });});
    return {verifiedUsd:total/100,duplicateTransactionIds:dups,basis:"PAYMENT_VERIFIED transitions with bank posting or platform payout statement references only"};
  }
  var api=Object.freeze({STATES:STATES.slice(),create:create,transition:transition,verifiedIncome:verifiedIncome});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSLifecycle=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
