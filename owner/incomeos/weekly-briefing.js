"use strict";
(function(root){
  // IncomeOS weekly briefing. Combines what the engines already produced into
  // one screen that answers five questions: what verified eligible work exists,
  // which is worth the most, what needs the owner, what income is verified, and
  // whether the automated parts are healthy. It decides whether a notification
  // is justified; a quiet week returns notify:false with a one-line summary.
  // It reads engine outputs only and computes no new financial facts.
  var VERSION="incomeos.weekly-briefing.v1";
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function money(x){return "$"+Number(x).toFixed(2);}

  // inputs: {screen (project-radar.screen), claims (claims-tracker.review), renewals (renewal-monitor.review),
  //   rules (ledger-rules.propose), netWorth (net-worth.report), income (opportunity-lifecycle.verifiedIncome),
  //   discoveryReceipt (discovery-receipt.json), previousAlertIds?:[]}
  function build(inputs,asOf){
    if(!isDate(asOf))throw Error("asOf date required");
    var i=inputs||{},attention=[],health=[];
    var s=i.screen,seen={};(i.previousAlertIds||[]).forEach(function(id){seen[id]=1;});
    var eligible=s?s.eligible.map(function(r){return {id:r.opportunity.opportunityId,title:r.opportunity.title,platform:r.opportunity.platform,effectiveHourlyUsd:r.economics.effectiveHourlyUsd,deadline:r.opportunity.deadline,sourceUrl:r.opportunity.sourceUrl,isNew:!seen[r.opportunity.opportunityId]};}):[];
    var top=eligible.filter(function(e){return e.effectiveHourlyUsd!=null;}).sort(function(a,b){return b.effectiveHourlyUsd-a.effectiveHourlyUsd;}).slice(0,3);
    eligible.filter(function(e){return e.isNew;}).forEach(function(e){attention.push({priority:2,area:"opportunities",text:"New eligible: "+e.title+" ("+e.platform+")"+(e.effectiveHourlyUsd!=null?", about "+money(e.effectiveHourlyUsd)+"/h before tax":"")});});
    eligible.filter(function(e){var d=e.deadline?(Date.parse(e.deadline)-Date.parse(asOf))/86400000:NaN;return d>=0&&d<=7;}).forEach(function(e){attention.push({priority:1,area:"opportunities",text:"Deadline "+e.deadline+": "+e.title});});
    if(s&&s.pending.length)attention.push({priority:3,area:"opportunities",text:s.pending.length+" listing(s) need you to confirm their requirements"});
    if(i.claims)i.claims.actions.forEach(function(a){attention.push({priority:a.priority,area:"recovery",text:a.code.replace(/_/g," ").toLowerCase()+" ("+a.claimId+")"+(a.deadline?" by "+a.deadline:"")});});
    if(i.claims)i.claims.warnings.forEach(function(w){attention.push({priority:1,area:"recovery",text:w.code.replace(/_/g," ").toLowerCase()+" ("+w.claimId+")"});});
    if(i.renewals)i.renewals.items.forEach(function(r){
      var urgent=r.flags.some(function(f){return /NOTICE_DEADLINE_SOON|PRICE_INCREASE/.test(f);});
      var shown=r.flags.filter(function(f){return !/^NO_OWNER_NOTE/.test(f);}).map(function(f){return f.replace(/_/g," ").toLowerCase();});
      attention.push({priority:urgent?1:3,area:"spending",text:r.vendor+": "+(shown.length?shown.join(", "):"add a note saying whether this service is necessary")+(r.annualizedIncreaseUsd?" (+"+money(r.annualizedIncreaseUsd)+"/yr)":"")});
    });
    if(i.rules&&(i.rules.proposals.length||i.rules.exceptions.length))attention.push({priority:3,area:"accounting",text:i.rules.proposals.length+" categorization proposal(s) to accept or reject"+(i.rules.exceptions.length?", "+i.rules.exceptions.length+" rule conflict(s)":"")});
    if(i.netWorth&&!i.netWorth.complete)attention.push({priority:3,area:"accounting",text:"Net worth is partial: "+(i.netWorth.gaps.length+i.netWorth.excluded.length)+" account balance(s) missing or stale"});
    // System health from the discovery receipt.
    var r=i.discoveryReceipt;
    if(!r)health.push({ok:false,text:"No discovery receipt this week"});
    else{
      var ageDays=(Date.parse(asOf)-Date.parse(String(r.finishedAt).slice(0,10)))/86400000;
      health.push({ok:r.summary.ok>0&&ageDays<=2,text:"Discovery: "+r.summary.ok+" source(s) ok, "+r.summary.failed+" failed, last run "+String(r.finishedAt).slice(0,10)});
      (r.connectors||[]).filter(function(c){return c.status==="error";}).forEach(function(c){health.push({ok:false,text:c.sourceId+": "+c.error});});
      if(ageDays>2||r.summary.ok===0)attention.push({priority:1,area:"system",text:"Discovery has not produced live data recently"});
    }
    attention.sort(function(a,b){return a.priority-b.priority;});
    var income=i.income?i.income.verifiedUsd:null,recovered=i.claims?i.claims.recoveredUsd:null;
    var actionable=attention.filter(function(a){return a.priority<=2;});
    return {version:VERSION,asOf:asOf,
      answers:{
        eligibleOpportunities:eligible.length,
        highestValue:top,
        needsYou:attention,
        verified:{incomeUsd:income,recoveredUsd:recovered,note:"Verified means matched to a bank posting or payout statement. Advertised pay, approvals and estimates are excluded."},
        systemHealth:health},
      notify:actionable.length>0,
      summary:actionable.length?actionable.length+" item(s) need you this week":"Nothing needs you this week",
      notice:"A summary of engine outputs. It adds no new financial facts."};
  }
  var api=Object.freeze({VERSION:VERSION,build:build});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSWeeklyBriefing=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
