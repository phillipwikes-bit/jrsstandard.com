"use strict";
(function(){
  // "This week" panel. Loads a private workspace file (incomeos.workspace.v1)
  // into page memory and shows the weekly briefing plus net worth, recovery
  // claims, renewals, yields, recruiter history and categorization proposals.
  // MEMORY ONLY: nothing is written to browser storage or transmitted. Changes
  // are made to the in-memory copy and kept only when the owner saves the file. Listing results
  // arrive from the opportunities panel through an in-page event.
  function init(){
    var input=document.getElementById("briefing-file"),button=document.getElementById("briefing-load"),status=document.getElementById("briefing-status"),out=document.getElementById("briefing-output"),
      passInput=document.getElementById("briefing-passphrase"),saveBtn=document.getElementById("briefing-save"),undoBtn=document.getElementById("briefing-undo"),WS=window.IncomeOSWorkspace;
    var E={rules:window.IncomeOSLedgerRules,nw:window.IncomeOSNetWorth,claims:window.IncomeOSClaims,ren:window.IncomeOSRenewals,intel:window.IncomeOSIntelligence,rh:window.IncomeOSRecruiterHistory,yc:window.IncomeOSYieldCompare,wb:window.IncomeOSWeeklyBriefing,life:window.IncomeOSLifecycle};
    if(!input||!button||!status||!out||!WS||Object.keys(E).some(function(k){return !E[k];}))return;
    var state={ws:null,screen:null,dirty:false,history:[],research:window.IncomeOSResearchLatest||null};
    function announce(){try{document.dispatchEvent(new CustomEvent("incomeos:workspace-loaded",{detail:state.ws}));}catch(e){}}
    function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
    function el(p,tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;p.appendChild(e);return e;}
    function link(p,url,label){try{var u=new URL(url);if(u.protocol!=="https:")return;}catch(e){return;}var a=el(p,"a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";}
    function money(x){return x==null?"n/a":"$"+Number(x).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
    function section(title){var s=el(out,"section",null,"briefing-section");el(s,"h4",title,"project-subhead");return s;}
    function arr(x){return Array.isArray(x)?x:[];}
    function act(fn,label){
      try{var before=state.ws;state.ws=fn(state.ws);state.history.push(before);if(state.history.length>20)state.history.shift();state.dirty=true;render();status.textContent=label+". Save the updated workspace to keep this change, or undo it.";}
      catch(err){status.textContent="Not changed: "+err.message;}
    }
    function btn(p,text,onClick){var b=el(p,"button",text,"smallbtn");b.type="button";b.addEventListener("click",onClick);return b;}
    function field(p,id,label,type,value){var w=el(p,"div");var l=el(w,"label",label);l.htmlFor=id;var i=el(w,"input");i.id=id;i.type=type||"text";if(value!=null&&value!=="")i.value=value;i.autocomplete="off";return i;}
    function download(text,name){
      var url=URL.createObjectURL(new Blob([text],{type:"application/json"})),a=document.createElement("a");
      a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},2000);
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
        r.yc=arr(ws.offers).length&&ws.yieldParams&&Number(ws.yieldParams.amountUsd)>0?E.yc.compare(ws.offers,ws.yieldParams,asOf):null;
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
      if(state.research&&state.research.results.length){
        var rOpen=state.research.results.filter(function(x){return x.priority!=="HOLD";});
        s=section("Paid research by effective hourly yield");
        var withEhy=rOpen.filter(function(x){return x.effectiveHourlyYield!==null;}).slice(0,3);
        if(!withEhy.length)el(s,"p","No open study has complete time information yet. Enter screener, prep and follow-up time on a research card.","muted");
        else{var ur=el(s,"ul");withEhy.forEach(function(x){var li=el(ur,"li",x.title+" ("+x.provider+"): "+money(x.effectiveHourlyYield)+"/hr effective, advertised "+money(x.paymentUsd)+(x.paymentForm!=="cash"?" ("+x.paymentForm.replace("_"," ")+")":"")+(x.timeConfidence==="estimated"?", time estimated":"")+" ");link(li,x.url,"application");});}
        rOpen.filter(function(x){return x.deadline&&(Date.parse(x.deadline)-Date.parse(asOf))/86400000<=7&&x.deadline>=asOf;}).forEach(function(x){el(s,"p","Deadline "+x.deadline+": "+x.title,"tag-hold");});
        el(s,"p",rOpen.length+" open studies; advertised pay is not earned income.","muted");
      }
      s=section("Official searches due");
      if(!r.due.length)el(s,"p","No unclaimed-property searches due.","muted");
      else{var u3=el(s,"ul");r.due.forEach(function(d){var li=el(u3,"li",d.name+" ("+d.reason.replace(/_/g," ").toLowerCase()+"). "+(/^UNCONFIRMED|confirm the state/.test(d.urlStatus)?"Check the address first. ":""));link(li,d.url,"open");
        if(state.ws){var row=el(li,"div",null,"briefing-actions");
          btn(row,"Searched: nothing found",function(){act(function(w){return WS.recordSearch(w,d.sourceId,asOf,false);},"Search recorded");});
          var ref=field(row,"found-"+d.sourceId,"If found, what (claim number or amount)","text");
          btn(row,"Searched: match found",function(){act(function(w){return WS.recordSearch(w,d.sourceId,asOf,true,ref.value);},"Match recorded and claim opened");});}});}
      var dupFn=window.IncomeOSRecovery&&window.IncomeOSRecovery.duplicateCandidates,dups=state.ws&&dupFn?dupFn(arr(state.ws.ledger)):[];
      var claimed={};arr(state.ws&&state.ws.claims).forEach(function(c){claimed[c.id]=1;});
      dups=dups.filter(function(d){return !claimed["dup-"+d.firstId+"-"+d.secondId];});
      if(dups.length){s=section("Possible duplicate charges");el(s,"p","Same merchant, same amount, within a day. Check your statement before disputing; a matching pair is not proof of an error.","muted");
        dups.slice(0,20).forEach(function(d){var box=el(s,"div",null,"briefing-actions");el(box,"p",d.vendor+": "+money(d.amountUsd)+" twice ("+d.firstId+", "+d.secondId+")");
          btn(box,"Open billing-error claim",function(){act(function(w){return WS.openClaim(w,{id:"dup-"+d.firstId+"-"+d.secondId,kind:"billing_error",title:"Possible duplicate: "+d.vendor+" "+money(d.amountUsd),counterparty:d.vendor,openedOn:asOf,estimatedUsd:d.amountUsd});},"Claim opened; add the statement date to get the dispute deadline");});});}
      var open=arr(state.ws&&state.ws.claims).filter(function(c){return ["PAID","DENIED","ABANDONED"].indexOf(c.state)<0;});
      if(open.length){s=section("Open claims");open.forEach(function(c){
        var box=el(s,"div",null,"briefing-actions");el(box,"p",c.title+" ("+c.kind.replace(/_/g," ")+"): "+c.state.replace(/_/g," ").toLowerCase()+(c.deadline?", deadline "+c.deadline:""));
        var nexts={SEARCH_DUE:["MATCH_FOUND","SEARCHED_NONE_FOUND"],SEARCHED_NONE_FOUND:["SEARCH_DUE"],MATCH_FOUND:["CLAIM_FILED","ABANDONED"],CLAIM_FILED:["DOCUMENTS_REQUESTED","APPROVED","DENIED"],DOCUMENTS_REQUESTED:["CLAIM_FILED","APPROVED","DENIED","ABANDONED"],APPROVED:["PAID","DENIED"]}[c.state]||[];
        var sel=el(box,"select");sel.id="claim-next-"+c.id;sel.setAttribute("aria-label","Next step for "+c.title);nexts.forEach(function(n){var o=el(sel,"option",n.replace(/_/g," ").toLowerCase());o.value=n;});
        var ev=field(box,"claim-ev-"+c.id,"Evidence (letter, claim number, screenshot name)");
        var amt=field(box,"claim-amt-"+c.id,"Amount paid (if paid)","number");var bank=field(box,"claim-bank-"+c.id,"Bank posting reference (if paid)");
        btn(box,"Record step",function(){act(function(w){return WS.advanceClaim(w,c.id,{to:sel.value,on:asOf,evidenceRef:ev.value,amountUsd:amt.value,bankRef:bank.value});},"Claim updated");});
      });}
      if(r.nw){s=section("Net worth ("+(r.nw.complete?"all listed accounts current":"partial")+")");var t=r.nw.totals;
        [["Net worth",t.netWorthUsd],["Liquid cash",t.liquidUsd],["Liquid after liabilities",t.liquidNetOfLiabilitiesUsd],["Liabilities",t.liabilitiesUsd],["Unrealized gain (not income)",t.unrealizedGainUsd]].forEach(function(p){el(s,"p",p[0]+": "+money(p[1]));});
        r.nw.gaps.concat(r.nw.excluded).forEach(function(g){el(s,"p","Missing or stale: "+(g.name||g.accountId)+(g.balanceAsOf?" (last "+g.balanceAsOf+")":""),"tag-hold");});
        var bf=el(s,"div",null,"briefing-actions");var asel=el(bf,"select");asel.id="bal-account";asel.setAttribute("aria-label","Account");
        arr(state.ws.accounts).forEach(function(a){var o=el(asel,"option",a.name||a.id);o.value=a.id;});
        var bdate=field(bf,"bal-date","Statement date","date",asOf),bamt=field(bf,"bal-amount","Balance (USD)","number"),bsrc=field(bf,"bal-ref","Where the statement is kept");
        btn(bf,"Add balance",function(){act(function(w){return WS.addBalance(w,{accountId:asel.value,asOf:bdate.value,balanceUsd:bamt.value,source:"statement",sourceRef:bsrc.value});},"Balance added");});}
      if(r.ren.items.length){s=section("Renewals and prices");var u4=el(s,"ul");r.ren.items.forEach(function(i){el(u4,"li",i.vendor+": next about "+i.nextEstimated+", "+money(i.typicalAmount)+" "+i.cadence+(i.noticeBy?", notice by "+i.noticeBy:"")+". "+i.proposal.replace(/_/g," ").toLowerCase());});}
      if(r.yc){s=section("Cash and Treasury comparison (after estimated tax)");var u5=el(s,"ul");r.yc.ranked.slice(0,5).forEach(function(y){var li=el(u5,"li",y.provider+" "+y.product.replace(/_/g," ")+": "+y.effectiveAfterTaxPct+"% after tax (APY "+y.apyPct+"%), checked "+y.checkedOn+(y.flags.length?". "+y.flags.join("; ").toLowerCase().replace(/_/g," "):"")+" ");link(li,y.sourceUrl,"provider page");});
        if(r.yc.excluded.length)el(s,"p",r.yc.excluded.length+" offer(s) excluded as stale, unsourced or incomplete.","muted");el(s,"p",r.yc.notice,"muted");}
      if(r.rh){s=section("Recruiter history");var u6=el(s,"ul");r.rh.recruiters.forEach(function(x){el(u6,"li",x.recruiter+": "+x.applications+" applied, "+x.verifiedPaid+" verified paid"+(x.observedInvitationRate!=null?", "+x.observedInvitationRate+"% invited":"")+(x.medianDaysToPayment!=null?", paid in about "+x.medianDaysToPayment+" days":"")+(x.verifiedUsdPerRecordedHour!=null?", "+money(x.verifiedUsdPerRecordedHour)+"/recorded hour":"")+(x.status!=="OBSERVED"?" ("+x.status.toLowerCase().replace(/_/g," ")+")":""));});}
      if(r.rules.proposals.length||r.rules.exceptions.length||r.rules.invalidRules.length){s=section("Categorization proposals");el(s,"p",r.rules.proposals.length+" proposal(s), "+r.rules.exceptions.length+" conflict(s), "+r.rules.invalidRules.length+" invalid rule(s).","muted");
        r.rules.proposals.slice(0,30).forEach(function(pr){var e=arr(state.ws.ledger).filter(function(x){return x.id===pr.entryId;})[0]||{};
          var box=el(s,"div",null,"briefing-actions");el(box,"p",(e.date||"")+" "+(e.payer||e.label||pr.entryId)+": "+(pr.split?"split into "+pr.split.map(function(x){return x.category+" "+money(x.amountUsd);}).join(" + "):(pr.currentCategory||"none")+" to "+pr.category)+(pr.businessUsePct!=null?", business use "+pr.businessUsePct+"% (estimate)":""));
          btn(box,"Accept",function(){act(function(w){return WS.acceptProposal(w,pr,asOf);},"Change accepted");});});}
      if(a.highestValue.length&&state.ws){var ab=el(out,"div",null,"briefing-actions");btn(ab,"Mark this week's opportunities as seen",function(){act(function(w){return WS.markAlerted(w,a.highestValue.map(function(h){return h.id;}).concat((state.screen&&state.screen.eligible||[]).map(function(x){return x.opportunity.opportunityId;})),asOf);},"Marked as seen");});}
      if(state.ws){
        s=section("Add to your workspace");
        function select(p,id,label,opts){var w=el(p,"div");var l=el(w,"label",label);l.htmlFor=id;var x=el(w,"select");x.id=id;opts.forEach(function(o){var op=el(x,"option",o[1]);op.value=o[0];});return x;}
        var f1=el(s,"div",null,"briefing-actions");el(f1,"p","Income or expense");
        var lk=select(f1,"add-kind","Type",[["outflow","Expense"],["income","Income"]]),ld=field(f1,"add-date","Date","date",asOf),lp=field(f1,"add-payer","Payer or vendor"),
          ll=field(f1,"add-label","Description"),la=field(f1,"add-amount","Amount (USD)","text"),lc=select(f1,"add-cat","Category",WS.COST_CATS.concat(WS.INCOME_CATS.filter(function(c){return WS.COST_CATS.indexOf(c)<0;})).map(function(c){return [c,c];}));
        btn(f1,"Add entry",function(){act(function(w){return WS.addRecord(w,"ledger",{kind:lk.value,date:ld.value,payer:lp.value,label:ll.value,amountUsd:la.value,category:lc.value},asOf);},"Entry added");});
        var f2=el(s,"div",null,"briefing-actions");el(f2,"p","Account (for net worth)");
        var an=field(f2,"add-acct-name","Account name"),at=select(f2,"add-acct-type","Account type",WS.ACCOUNT_TYPES.map(function(t){return [t,t.replace(/_/g," ")];}));
        btn(f2,"Add account",function(){act(function(w){return WS.addRecord(w,"accounts",{name:an.value,type:at.value},asOf);},"Account added");});
        var f3=el(s,"div",null,"briefing-actions");el(f3,"p","Subscription or service note");
        var sv=field(f3,"add-svc","Vendor (as it appears on charges)"),sn=select(f3,"add-svc-need","Needed?",[["yes","Necessary"],["no","Not necessary"]]),
          sd=field(f3,"add-svc-notice","Cancellation notice (days)","number"),su=field(f3,"add-svc-used","Last used","date");
        btn(f3,"Save note",function(){act(function(w){return WS.addRecord(w,"serviceNotes",{vendor:sv.value,necessary:sn.value==="yes",cancelNoticeDays:sd.value,lastUsedOn:su.value},asOf);},"Service note saved");});
        var f4=el(s,"div",null,"briefing-actions");el(f4,"p","Savings, CD or Treasury rate you checked today");
        var op=field(f4,"add-off-prov","Provider"),opr=select(f4,"add-off-prod","Product",[["savings","Savings"],["money_market","Money market"],["cd","CD"],["treasury_bill","Treasury bill"],["treasury_note","Treasury note"],["i_bond","I bond"]]),
          oa=field(f4,"add-off-apy","APY (%)","text"),ot=field(f4,"add-off-term","Term (months, if any)","number"),oe=field(f4,"add-off-pen","Early withdrawal penalty (months of interest)","number"),
          oi=select(f4,"add-off-ins","Insurance",[["FDIC","FDIC"],["NCUA","NCUA"],["US_TREASURY","US Treasury"],["NONE","None"]]),ou=field(f4,"add-off-url","Provider page (https)","url");
        btn(f4,"Add rate",function(){act(function(w){return WS.addRecord(w,"offers",{provider:op.value,product:opr.value,apyPct:oa.value,termMonths:ot.value,earlyPenaltyMonths:oe.value,insurance:oi.value,sourceUrl:ou.value},asOf);},"Rate added");});
        var yp=state.ws.yieldParams||{},f5=el(s,"div",null,"briefing-actions");el(f5,"p","Comparison settings (use your verified spare cash and your own marginal tax rates)");
        var ya=field(f5,"yp-amount","Amount to compare (USD)","number",yp.amountUsd||""),yh=field(f5,"yp-months","Months until you may need it","number",yp.horizonMonths||12),
          yf=field(f5,"yp-fed","Federal marginal rate (%)","number",yp.federalRatePct||""),ys=field(f5,"yp-state","State marginal rate (%)","number",yp.stateRatePct||""),
          yl=select(f5,"yp-liquid","Must stay withdrawable?",[["yes","Yes"],["no","No"]]);yl.value=yp.needLiquidity===false?"no":"yes";
        btn(f5,"Save settings",function(){act(function(w){return WS.setYieldParams(w,{amountUsd:ya.value,horizonMonths:yh.value,federalRatePct:yf.value,stateRatePct:ys.value,needLiquidity:yl.value==="yes"},asOf);},"Comparison settings saved");});
      }
      s=section("System health");a.systemHealth.forEach(function(h){el(s,"p",(h.ok?"OK: ":"Problem: ")+h.text,h.ok?"tag-ok":"tag-hold");});
      if(saveBtn)saveBtn.hidden=!state.ws;
      if(undoBtn)undoBtn.hidden=!state.history.length;
      status.textContent=state.ws?(state.dirty?"Unsaved changes. Save the updated workspace to keep them.":"Workspace loaded in memory only. Nothing is stored or sent."):"Showing system health only. Load your workspace file to see your finances.";
    }
    button.addEventListener("click",async function(){
      var f=input.files&&input.files[0];
      if(!f){status.textContent="Choose your workspace file first.";return;}
      if(f.size>5000000){status.textContent="Workspace file exceeds 5 MB.";return;}
      try{var loaded=await WS.load(await f.text(),passInput&&passInput.value||"");if(loaded.schema!==WS.SCHEMA)throw Error("That is a profile, not a workspace. Open it in the opportunities panel.");state.ws=loaded;announce();state.dirty=false;state.history=[];render();}
      catch(err){status.textContent="Workspace rejected: "+err.message;}
      finally{input.value="";}
    });
    var newBtn=document.getElementById("briefing-new");
    if(newBtn)newBtn.addEventListener("click",function(){state.ws=WS.newWorkspace(today());state.history=[];announce();state.dirty=true;render();status.textContent="New empty workspace. Add accounts and entries below, then save it encrypted.";});
    if(undoBtn)undoBtn.addEventListener("click",function(){
      if(!state.history.length)return;
      state.ws=state.history.pop();state.dirty=true;render();status.textContent="Last change undone. Save to keep the workspace as it is now.";
    });
    if(saveBtn)saveBtn.addEventListener("click",async function(){
      if(!state.ws)return;
      var p=passInput&&passInput.value||"",stamp=today();
      try{
        if(p){download(await WS.encrypt(p,state.ws),"incomeos-workspace-"+stamp+".encrypted.json");status.textContent="Encrypted workspace saved. Keep the passphrase somewhere safe; it cannot be recovered.";}
        else{download(JSON.stringify(state.ws,null,1),"incomeos-workspace-"+stamp+".json");status.textContent="Saved WITHOUT encryption. Enter a passphrase of 16+ characters and save again to protect it.";}
        state.dirty=false;
      }catch(err){status.textContent="Not saved: "+err.message;}
    });
    window.addEventListener("beforeunload",function(e){if(state.dirty){e.preventDefault();e.returnValue="";}});
    document.addEventListener("incomeos:research-screened",function(ev){state.research=ev.detail||null;render();});
    document.addEventListener("incomeos:research-time",function(ev){
      var d=ev.detail;if(!d||!state.ws)return;
      act(function(w){return d.times?WS.setResearchTime(w,d.id,d.times,today()):WS.clearResearchTime(w,d.id,today());},d.times?"Study times added to your workspace":"Study times removed from your workspace");
    });
    document.addEventListener("incomeos:screened",function(ev){state.screen=ev.detail||null;render();});
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
