"use strict";
(function(){
  // "This week" panel. Loads a private workspace file (incomeos.workspace.v1)
  // into page memory and shows the weekly briefing plus net worth, recovery
  // claims, renewals, yields, recruiter history and categorization proposals.
  // MEMORY ONLY: nothing is stored, transmitted or changed. Listing results
  // arrive from the opportunities panel through an in-page event.
  var KEYS=["schema","note","ledger","rules","accounts","balances","claims","livedInStates","searchHistory","serviceNotes","offers","yieldParams","researchStages","recruiterOf","verifiedPayments","lifecycle","previousAlertIds"];
  function init(){
    var input=document.getElementById("briefing-file"),button=document.getElementById("briefing-load"),status=document.getElementById("briefing-status"),out=document.getElementById("briefing-output");
    var E={rules:window.IncomeOSLedgerRules,nw:window.IncomeOSNetWorth,claims:window.IncomeOSClaims,ren:window.IncomeOSRenewals,intel:window.IncomeOSIntelligence,rh:window.IncomeOSRecruiterHistory,yc:window.IncomeOSYieldCompare,wb:window.IncomeOSWeeklyBriefing,life:window.IncomeOSLifecycle};
    if(!input||!button||!status||!out||Object.keys(E).some(function(k){return !E[k];}))return;
    var state={ws:null,screen:null};
    function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
    function el(p,tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;p.appendChild(e);return e;}
    function link(p,url,label){try{var u=new URL(url);if(u.protocol!=="https:")return;}catch(e){return;}var a=el(p,"a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";}
    function money(x){return x==null?"n/a":"$"+Number(x).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
    function section(title){var s=el(out,"section",null,"briefing-section");el(s,"h4",title,"project-subhead");return s;}
    function arr(x){return Array.isArray(x)?x:[];}
    function validate(doc){
      if(!doc||typeof doc!=="object"||Array.isArray(doc)||doc.schema!=="incomeos.workspace.v1")throw Error("Expected an incomeos.workspace.v1 file.");
      var extra=Object.keys(doc).filter(function(k){return KEYS.indexOf(k)<0;});
      if(extra.length)throw Error("Unrecognized sections: "+extra.slice(0,5).join(", "));
      KEYS.forEach(function(k){if(Array.isArray(doc[k])&&doc[k].length>20000)throw Error(k+" has too many rows.");});
      return doc;
    }
    function receiptFrom(screen){
      if(!screen||!screen.connectors||!screen.connectors.length)return null;
      var ok=screen.connectors.filter(function(c){return c.status==="ok";}).length,failed=screen.connectors.filter(function(c){return c.status==="error";}).length;
      var fin=screen.connectors.map(function(c){return c.finishedAt||"";}).sort().pop()||(today()+"T00:00:00Z");
      return {finishedAt:fin,summary:{ok:ok,failed:failed},connectors:screen.connectors};
    }
    function render(){
      out.replaceChildren();
      var ws=state.ws||{schema:"incomeos.workspace.v1"},asOf=today(),r={};
      try{
        r.rules=E.rules.propose(arr(ws.ledger),arr(ws.rules));
        r.nw=arr(ws.accounts).length?E.nw.report(ws.accounts,arr(ws.balances),asOf):null;
        r.claims=E.claims.review(arr(ws.claims),asOf);
        r.due=E.claims.searchesDue(arr(ws.livedInStates).length?ws.livedInStates:["MD"],arr(ws.searchHistory),asOf);
        r.ren=E.ren.review(E.intel.recurring(arr(ws.ledger),asOf),arr(ws.serviceNotes),asOf);
        r.yc=arr(ws.offers).length&&ws.yieldParams?E.yc.compare(ws.offers,ws.yieldParams,asOf):null;
        r.rh=arr(ws.researchStages).length?E.rh.summarize(ws.researchStages,ws.recruiterOf||{},ws.verifiedPayments||{}):null;
        r.income=arr(ws.lifecycle).length?E.life.verifiedIncome(ws.lifecycle):null;
        r.wb=E.wb.build({screen:state.screen,claims:r.claims,renewals:r.ren,rules:r.rules,netWorth:r.nw,income:r.income,discoveryReceipt:receiptFrom(state.screen),previousAlertIds:arr(ws.previousAlertIds)},asOf);
      }catch(err){status.textContent="Workspace could not be analyzed: "+err.message;return;}
      var a=r.wb.answers;
      var head=el(out,"div",null,"project-summary");
      [[a.eligibleOpportunities,"Verified eligible"],[a.needsYou.filter(function(x){return x.priority<=2;}).length,"Need you now"],[money(a.verified.incomeUsd==null?0:a.verified.incomeUsd),"Verified income"],[money(a.verified.recoveredUsd||0),"Recovered"]].forEach(function(p){var d=el(head,"div");el(d,"b",p[0]);el(d,"span",p[1]);});
      el(out,"p",r.wb.summary+". "+a.verified.note,"muted");
      var s=section("Needs you");
      if(!a.needsYou.length)el(s,"p","Nothing needs you right now.","muted");
      else{var ul=el(s,"ul");a.needsYou.slice(0,25).forEach(function(x){el(ul,"li",(x.priority===1?"Urgent: ":"")+x.text,x.priority===1?"tag-hold":null);});}
      if(a.highestValue.length){s=section("Highest-value eligible work");var u2=el(s,"ul");a.highestValue.forEach(function(h){var li=el(u2,"li",h.title+" ("+h.platform+"), about "+money(h.effectiveHourlyUsd)+"/h before tax ");link(li,h.sourceUrl,"source");});}
      s=section("Official searches due");
      if(!r.due.length)el(s,"p","No unclaimed-property searches due.","muted");
      else{var u3=el(s,"ul");r.due.forEach(function(d){var li=el(u3,"li",d.name+" ("+d.reason.replace(/_/g," ").toLowerCase()+"). "+(/^UNCONFIRMED|confirm the state/.test(d.urlStatus)?"Check the address first. ":""));link(li,d.url,"open");});}
      if(r.nw){s=section("Net worth ("+(r.nw.complete?"all listed accounts current":"partial")+")");var t=r.nw.totals;
        [["Net worth",t.netWorthUsd],["Liquid cash",t.liquidUsd],["Liquid after liabilities",t.liquidNetOfLiabilitiesUsd],["Liabilities",t.liabilitiesUsd],["Unrealized gain (not income)",t.unrealizedGainUsd]].forEach(function(p){el(s,"p",p[0]+": "+money(p[1]));});
        r.nw.gaps.concat(r.nw.excluded).forEach(function(g){el(s,"p","Missing or stale: "+(g.name||g.accountId)+(g.balanceAsOf?" (last "+g.balanceAsOf+")":""),"tag-hold");});}
      if(r.ren.items.length){s=section("Renewals and prices");var u4=el(s,"ul");r.ren.items.forEach(function(i){el(u4,"li",i.vendor+": next about "+i.nextEstimated+", "+money(i.typicalAmount)+" "+i.cadence+(i.noticeBy?", notice by "+i.noticeBy:"")+". "+i.proposal.replace(/_/g," ").toLowerCase());});}
      if(r.yc){s=section("Cash and Treasury comparison (after estimated tax)");var u5=el(s,"ul");r.yc.ranked.slice(0,5).forEach(function(y){var li=el(u5,"li",y.provider+" "+y.product.replace(/_/g," ")+": "+y.effectiveAfterTaxPct+"% after tax (APY "+y.apyPct+"%), checked "+y.checkedOn+(y.flags.length?". "+y.flags.join("; ").toLowerCase().replace(/_/g," "):"")+" ");link(li,y.sourceUrl,"provider page");});
        if(r.yc.excluded.length)el(s,"p",r.yc.excluded.length+" offer(s) excluded as stale, unsourced or incomplete.","muted");el(s,"p",r.yc.notice,"muted");}
      if(r.rh){s=section("Recruiter history");var u6=el(s,"ul");r.rh.recruiters.forEach(function(x){el(u6,"li",x.recruiter+": "+x.applications+" applied, "+x.verifiedPaid+" verified paid"+(x.observedInvitationRate!=null?", "+x.observedInvitationRate+"% invited":"")+(x.medianDaysToPayment!=null?", paid in about "+x.medianDaysToPayment+" days":"")+(x.verifiedUsdPerRecordedHour!=null?", "+money(x.verifiedUsdPerRecordedHour)+"/recorded hour":"")+(x.status!=="OBSERVED"?" ("+x.status.toLowerCase().replace(/_/g," ")+")":""));});}
      if(r.rules.proposals.length||r.rules.exceptions.length||r.rules.invalidRules.length){s=section("Categorization proposals");el(s,"p",r.rules.proposals.length+" proposal(s), "+r.rules.exceptions.length+" conflict(s), "+r.rules.invalidRules.length+" invalid rule(s). Accept changes in your ledger; this view changes nothing.","muted");}
      s=section("System health");a.systemHealth.forEach(function(h){el(s,"p",(h.ok?"OK: ":"Problem: ")+h.text,h.ok?"tag-ok":"tag-hold");});
      status.textContent=state.ws?"Workspace loaded in memory only. Nothing is stored or sent.":"Showing system health only. Load your workspace file to see your finances.";
    }
    button.addEventListener("click",async function(){
      var f=input.files&&input.files[0];
      if(!f){status.textContent="Choose your workspace file first.";return;}
      if(f.size>5000000){status.textContent="Workspace file exceeds 5 MB.";return;}
      try{state.ws=validate(JSON.parse(await f.text()));render();}
      catch(err){status.textContent="Workspace rejected: "+err.message;}
      finally{input.value="";}
    });
    document.addEventListener("incomeos:screened",function(ev){state.screen=ev.detail||null;render();});
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
