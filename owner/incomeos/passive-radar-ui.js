"use strict";
(function(){
  // Shows reviewed passive-radar findings. Nothing is fetched or submitted. The owner's decision on a finding
  // (pursuing, done, dismissed) is saved only in the open workspace, through the workspace panel.
  var $=function(id){return document.getElementById(id);};
  var usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
  var REASONS={ID_MISSING:"no identifier",DUPLICATE_ID:"repeats an earlier identifier",TITLE_MISSING:"no title",SOURCE_NAME_MISSING:"no source named",
    SOURCE_LINK_MISSING_OR_UNSAFE:"no safe https source link",DIRECT_LINK_MISSING_OR_UNSAFE:"no safe https direct link",DUPLICATE_DIRECT_LINK:"same direct link as an earlier finding",
    DATE_MISSING_OR_INVALID:"no valid date found",DATE_IN_FUTURE:"date is in the future",FINDING_STALE:"found more than 14 days ago",VALUE_TYPE_UNKNOWN:"type is not new income, returned capital, savings or projection",
    DEADLINE_PASSED_OR_INVALID:"deadline passed or invalid",AMOUNT_INVALID:"amount is not a valid number",COST_INVALID:"cost is not a valid number",AMOUNT_BASIS_UNKNOWN:"amount basis unknown",
    CAPITAL_INVALID:"required capital is not a valid number",LOCKUP_INVALID:"lockup is not a whole number of days",
    RISK_SIGNAL:"shows scam or paid-finder signs",SENSITIVE_DATA:"contains personal or account data",NOT_AN_OBJECT:"not a finding"};
  var TYPE_LABEL={new_income:"New income",returned_capital:"Returned capital",savings:"Savings",projection:"Projection"};
  var state={ws:null,last:null};
  function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function add(x,tag,value,cls){var e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=String(value);x.appendChild(e);return e;}
  function anchor(x,href,label){var a=add(x,"a",label);a.href=href;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";return a;}
  function kept(){var k=state.ws&&state.ws.passiveFindings;return k&&typeof k==="object"&&!Array.isArray(k)?k:{};}
  function reason(k){var p=k.split(":");return REASONS[p[0]]||(p[0]==="LEVEL_INVALID"?p[1]+" is not low, medium, high or unknown":p[0]==="TEXT_INVALID"?p[1]+" is empty or too long":k);}
  function decide(f,status,sel){
    var res=null;
    document.dispatchEvent(new CustomEvent("incomeos:passive-decision",{detail:{finding:f,status:status,done:function(r){res=r;}}}));
    if(!res||!res.ok){$("passive-status").textContent="Decision not saved: "+(res&&res.error||"open your workspace first")+".";if(sel)sel.value=(kept()[f.id]||{}).status||"New";}
  }
  function claimFor(id){var cs=state.ws&&Array.isArray(state.ws.claims)?state.ws.claims:[],cid="claim-finding-"+String(id).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);
    for(var i=0;i<cs.length;i++)if(cs[i].id===cid)return cs[i];return null;}
  function claimControl(parent,f){
    if(f.valueType!=="returned_capital"||!state.ws)return;
    var c=claimFor(f.id),row=add(parent,"div",null,"cardalt passive-claim");
    if(c){add(row,"span","Recovery claim open: "+c.state.replace(/_/g," ").toLowerCase()+". Record its steps in This week.","muted");return;}
    var b=add(row,"button","Track as recovery claim","smallbtn");b.type="button";
    b.setAttribute("aria-label","Track "+f.title+" as a recovery claim");
    b.addEventListener("click",function(){
      var res=null;document.dispatchEvent(new CustomEvent("incomeos:passive-claim",{detail:{finding:f,done:function(r){res=r;}}}));
      $("passive-status").textContent=res&&res.ok?"Recovery claim opened for "+f.title+". Nothing is counted as received until you record the payment with its bank reference.":"Claim not opened: "+(res&&res.error||"open your workspace first")+".";
    });
  }
  function decisionControl(parent,f){
    var row=add(parent,"div",null,"cardalt");
    var lab=add(row,"label","Your decision ");var sel=add(lab,"select");
    sel.setAttribute("aria-label","Your decision on "+f.title);
    ["New","Pursuing","Done","Dismissed"].forEach(function(s){var o=add(sel,"option",s);o.value=s;});
    sel.value=(kept()[f.id]||{}).status||"New";
    sel.disabled=!state.ws;
    sel.addEventListener("change",function(){decide(f,sel.value,sel);});
    if(!state.ws)add(row,"small","Open your workspace to keep a decision.","muted");
  }
  function terms(c,t){
    var dl=add(c,"dl",null,"detail");
    function line(k,v){var d=add(dl,"div",null,"line");add(d,"dt",k);add(d,"dd",v==null||v===""?"not stated":v);}
    line("Provider",t.provider);
    line("Capital required",t.requiredCapitalUsd==null?null:usd.format(t.requiredCapitalUsd));
    line("Effort",t.adminBurden==="unknown"?null:t.adminBurden);
    line("Counterparty risk",t.counterpartyRisk==="unknown"?null:t.counterpartyRisk);
    line("Default risk",t.defaultRisk==="unknown"?null:t.defaultRisk);
    line("Liquidity",t.liquidity);
    line("Lockup",t.lockupDays==null?null:t.lockupDays+" days");
    line("Tax",t.taxNote);
    line("Your action",t.requiredAction);
  }
  function renderKept(){
    var box=$("passive-kept");if(!box)return;box.replaceChildren();
    var k=kept(),ids=Object.keys(k).filter(function(id){return k[id].status!=="Dismissed";});
    if(!state.ws){add(box,"p","Open your workspace to see findings you are pursuing.","muted");return;}
    if(!ids.length){add(box,"p","No findings kept yet. Choose Pursuing on a finding to keep it here.","muted");return;}
    ids.sort(function(a,b){return String(k[a].deadline||"9999").localeCompare(String(k[b].deadline||"9999"));}).forEach(function(id){
      var x=k[id],d=add(box,"div",null,"spend-issue passive-kept-item");d.setAttribute("data-finding-id",id);
      add(d,"strong",x.title);
      add(d,"p",x.status+" since "+x.on+" · "+TYPE_LABEL[x.valueType]+(x.valueType==="projection"?" (not income)":"")+(x.deadline?" · deadline "+x.deadline:"")+" · "+x.sourceName+", found "+x.foundOn);
      var links=add(d,"p",null,"cardalt");anchor(links,x.directUrl,"Open direct link");anchor(links,x.sourceUrl,"Open source");
      var c=claimFor(id);if(c)add(d,"p","Recovery claim: "+c.state.replace(/_/g," ").toLowerCase(),"muted");
    });
    add(box,"p","A finding becomes money only when you record the actual payment in Income.","muted");
  }
  function render(){
    renderKept();
    var res=state.last,out=$("passive-results");if(!res)return;out.replaceChildren();
    var p=res.potentialUsd,k=kept();
    var shown=res.accepted.filter(function(f){return !(k[f.id]&&k[f.id].status==="Dismissed");}),hidden=res.accepted.length-shown.length;
    $("passive-status").textContent=res.accepted.length+" finding(s) accepted, "+res.refused.length+" refused"+(hidden?", "+hidden+" dismissed earlier and hidden":"")+". Received so far from these findings: "+usd.format(res.receivedUsd)+". "+res.notice;
    var sum=add(out,"div",null,"callout");
    add(sum,"strong","Potential value stated by sources (not received)");
    add(sum,"p","New income "+usd.format(p.new_income)+" · Returned capital "+usd.format(p.returned_capital)+" · Savings "+usd.format(p.savings)+(res.projectionCount?" · "+res.projectionCount+" projection(s), never counted":""));
    shown.forEach(function(f){
      var c=add(out,"article",null,"card passive-finding");c.setAttribute("data-finding-id",f.id);
      var chips=add(c,"div",null,"chips");
      add(chips,"span",f.valueLabel,"chip"+(f.valueType==="projection"?" warn":""));
      if(f.official)add(chips,"span","Official .gov link","chip gray");
      if(f.warnings.indexOf("COSTS_MONEY_TO_PURSUE")>=0)add(chips,"span","Costs "+usd.format(f.costToPursueUsd)+" to pursue","chip warn");
      if(f.warnings.indexOf("REQUIRES_CAPITAL")>=0)add(chips,"span","Puts your money at risk","chip warn");
      add(c,"h3",f.title);
      var amt=f.valueType==="projection"?"Projection: not income"+(f.amountUsd!=null?" ("+usd.format(f.amountUsd)+" estimated)":""):
        f.amountUsd==null?"Amount not stated":usd.format(f.amountUsd)+(f.amountBasis==="stated"?" stated by source":" estimate, not stated by source");
      add(c,"p",amt,"assetAmount");
      add(c,"p","Source: "+f.sourceName+" · found "+f.foundOn+(f.deadline?" · deadline "+f.deadline:""),"provider");
      if(f.summary)add(c,"p",f.summary,"detail");
      if(f.eligibilityText)add(c,"p","Eligibility (from source): "+f.eligibilityText,"detail");
      terms(c,f.terms);
      var links=add(c,"p",null,"cardalt");anchor(links,f.directUrl,"Open direct link");anchor(links,f.sourceUrl,"Open source");
      decisionControl(c,f);
      claimControl(c,f);
    });
    if(res.refused.length){
      add(out,"h4","Refused findings");
      res.refused.slice(0,50).forEach(function(r){
        var d=add(out,"div",null,"spend-issue passive-refused");
        add(d,"strong",(r.title||r.id||"Finding "+(r.index+1)));
        add(d,"p","Refused: "+r.reasons.map(reason).join("; ")+".");
      });
    }
  }
  function importFile(){
    var f=$("passive-import-file").files&&$("passive-import-file").files[0];
    if(!f){$("passive-status").textContent="Choose a findings file first.";return;}
    if(f.size>2000000){$("passive-status").textContent="Findings file is too large (over 2 MB).";return;}
    f.text().then(function(t){
      try{state.last=window.IncomeOSPassiveRadar.importFindings(JSON.parse(t),today());render();}
      catch(e){state.last=null;$("passive-results").replaceChildren();$("passive-status").textContent="Findings not reviewed: "+e.message;}
    }).catch(function(){$("passive-status").textContent="The file could not be read.";});
  }
  function downloadTemplate(){
    var u=URL.createObjectURL(new Blob([JSON.stringify(window.IncomeOSPassiveRadar.template(today()),null,2)],{type:"application/json"}));
    var a=document.createElement("a");a.href=u;a.download="incomeos-passive-findings-sample.json";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);
  }
  function onWs(ev){if(ev.detail&&typeof ev.detail==="object"&&ev.detail.schema==="incomeos.workspace.v1"){state.ws=ev.detail;render();}}
  function init(){
    if(!$("passive-radar-panel")||!window.IncomeOSPassiveRadar)return;
    $("passive-import").addEventListener("click",importFile);
    $("passive-template").addEventListener("click",downloadTemplate);
    ["incomeos:workspace-loaded","incomeos:workspace-changed","incomeos:workspace-restored"].forEach(function(n){document.addEventListener(n,onWs);});
    renderKept();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
