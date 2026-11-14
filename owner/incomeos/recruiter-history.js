"use strict";
(function(root){
  // IncomeOS recruiter and platform history. Uses only the owner's own recorded
  // application stages (the research-outcomes stage format) and VERIFIED payments.
  // Rates are shown only once there is enough history; below the sample floor the
  // result says so instead of producing a number. No probabilities are invented.
  var VERSION="incomeos.recruiter-history.v1";
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function days(a,b){return Math.round((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000);}
  function median(xs){if(!xs.length)return null;var s=xs.slice().sort(function(a,b){return a-b;}),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}

  // stages: [{studyId, stage:"APPLIED"|"INVITED"|"COMPLETED"|"ACCEPTED"|"PAID"|"DECLINED"|"INELIGIBLE", date, minutes?}]
  // recruiterOf: {studyId: recruiterName}
  // verifiedPayments: {studyId: amountUsd}  (only payments matched to a bank posting)
  function summarize(stages,recruiterOf,verifiedPayments,opts){
    opts=opts||{};
    var floor=Number.isFinite(opts.minApplications)?opts.minApplications:5;
    var studies={};
    (stages||[]).forEach(function(s){
      if(!s||typeof s.studyId!=="string"||!isDate(s.date))return;
      (studies[s.studyId]=studies[s.studyId]||[]).push(s);
    });
    var by={},unattributed=0;
    Object.keys(studies).forEach(function(id){
      var r=recruiterOf&&recruiterOf[id];
      if(!r){unattributed++;return;}
      var ev=studies[id].slice().sort(function(a,b){return a.date.localeCompare(b.date);});
      var has=function(st){return ev.some(function(e){return e.stage===st;});},at=function(st){var e=ev.filter(function(x){return x.stage===st;})[0];return e?e.date:null;};
      var g=by[r]=by[r]||{recruiter:r,applied:0,invited:0,completed:0,paid:0,declinedOrIneligible:0,paymentDelays:[],minutes:0,paidCents:0,unpaidCompleted:0};
      if(has("APPLIED"))g.applied++;
      if(has("INVITED"))g.invited++;
      if(has("COMPLETED"))g.completed++;
      if(has("DECLINED")||has("INELIGIBLE"))g.declinedOrIneligible++;
      ev.forEach(function(e){var m=Number(e.minutes);if(Number.isFinite(m)&&m>0)g.minutes+=m;});
      var v=verifiedPayments&&Number(verifiedPayments[id]);
      if(has("PAID")&&v>0){
        g.paid++;g.paidCents+=Math.round(v*100);
        if(at("COMPLETED"))g.paymentDelays.push(days(at("COMPLETED"),at("PAID")));
      }else if(has("COMPLETED"))g.unpaidCompleted++;
    });
    var rows=Object.keys(by).sort().map(function(k){
      var g=by[k],enough=g.applied>=floor;
      return {recruiter:g.recruiter,applications:g.applied,invited:g.invited,completed:g.completed,verifiedPaid:g.paid,completedAwaitingVerifiedPayment:g.unpaidCompleted,
        observedInvitationRate:enough?Math.round(g.invited/g.applied*1000)/10:null,
        observedPaymentRate:g.completed>=floor?Math.round(g.paid/g.completed*1000)/10:null,
        medianDaysToPayment:median(g.paymentDelays),
        verifiedPaidUsd:g.paidCents/100,
        verifiedUsdPerRecordedHour:g.minutes>0&&g.paidCents>0?Math.round(g.paidCents/(g.minutes/60))/100:null,
        status:enough?"OBSERVED":"INSUFFICIENT_HISTORY: "+g.applied+" of "+floor+" applications recorded"};
    });
    return {version:VERSION,recruiters:rows,unattributedStudies:unattributed,
      notice:"Rates are counts of your own recorded outcomes, not predictions. Pay per hour uses only verified payments and the minutes you recorded, including screening."};
  }
  var api=Object.freeze({VERSION:VERSION,summarize:summarize});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSRecruiterHistory=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
