"use strict";
(function(){
  var KEY="incomeos.research.radar.v1",engine=window.IncomeOSResearchRadar,adapter=window.IncomeOSPublicFeedAdapter;
  var db={version:1,preferences:{minPay:0,minEhy:75,maxScreenMinutes:15,remoteOnly:true},leads:[],progress:{}},publicLeads=[],latest=null;
  var statuses=["New","Reviewing","Applied","Invited","Completed","Paid (self-reported)","Declined","Not eligible"];
  var $=function(id){return document.getElementById(id);};
  function elem(tag,cls,content){var n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n;}
  function add(el,tag,cls,content){var n=elem(tag,cls,content);el.appendChild(n);return n;}
  function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  function usd(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);}
  // Hourly rates are shown to the cent so the card matches the engine and the CSV (e.g. $66.67, not $67).
  function rate(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);}
  function load(){
    if(window.IncomeOSFinancialReadOnly===true)return;
    try{var v=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(v&&typeof v==="object"&&!Array.isArray(v)){
        var p=v.preferences||{},min=Number(p.minPay),screen=Number(p.maxScreenMinutes);
        if(Number.isFinite(min)&&min>=0&&min<=100000)db.preferences.minPay=min;
        if(Number.isFinite(screen)&&screen>=0&&screen<=720)db.preferences.maxScreenMinutes=screen;
        if(typeof p.remoteOnly==="boolean")db.preferences.remoteOnly=p.remoteOnly;
        if(Number.isFinite(Number(p.minEhy))&&Number(p.minEhy)>=0&&Number(p.minEhy)<=100000)db.preferences.minEhy=Number(p.minEhy);
        db.leads=Array.isArray(v.leads)?v.leads.slice(0,200).map(function(x){try{return engine.candidate(x);}catch(e){return null;}}).filter(Boolean):[];
        db.progress=v.progress&&typeof v.progress==="object"&&!Array.isArray(v.progress)?v.progress:{};
      }
    }catch(e){$("radar-status").textContent="Saved research data could not be read. No changes have been written.";}
  }
  function persist(){if(window.IncomeOSFinancialReadOnly===true){$("radar-status").textContent="Personal study tracking is disabled in unapproved staging.";return false;}try{localStorage.setItem(KEY,JSON.stringify(db));return true;}catch(e){$("radar-status").textContent="Research changes could not be saved to local storage.";return false;}}
  // Owner-entered time components, held in page memory only (never stored).
  // They fill gaps the source did not publish; a source value is never overwritten silently.
  var timeOverrides={},profileForNotes=null;
  document.addEventListener("incomeos:profile",function(ev){profileForNotes=ev.detail||null;if(latest)view();});
  // A loaded workspace restores saved study times; entries made here are sent to it.
  function fromWorkspace(ws){
    var t=ws&&ws.researchTimes,out={};
    if(t&&typeof t==="object")Object.keys(t).forEach(function(id){var o=t[id];if(o&&typeof o==="object")out[id]={screenMinutes:o.screenMinutes,prepMinutes:o.prepMinutes,adminMinutes:o.adminMinutes,timeConfidence:o.timeConfidence==="verified"?"verified":"estimated"};});
    return out;
  }
  // Undo: the cards mirror the restored workspace exactly.
  document.addEventListener("incomeos:workspace-restored",function(ev){timeOverrides=fromWorkspace(ev.detail);if(latest)view();});
  document.addEventListener("incomeos:workspace-loaded",function(ev){
    var t=ev.detail&&ev.detail.researchTimes,prior=timeOverrides;timeOverrides={};
    if(t&&typeof t==="object")Object.keys(t).forEach(function(id){var o=t[id];if(o&&typeof o==="object")timeOverrides[id]={screenMinutes:o.screenMinutes,prepMinutes:o.prepMinutes,adminMinutes:o.adminMinutes,timeConfidence:o.timeConfidence==="verified"?"verified":"estimated"};});
    // Times entered before this workspace was opened are kept and recorded in it, not discarded.
    var carried=Object.keys(prior).filter(function(id){return !timeOverrides[id];});
    carried.forEach(function(id){timeOverrides[id]=prior[id];});
    if(latest)view();
    carried.forEach(function(id){emit("incomeos:research-time",{id:id,times:prior[id]});});
  });
  function emit(name,detail){if(name==="incomeos:research-screened")window.IncomeOSResearchLatest=detail;try{document.dispatchEvent(new CustomEvent(name,{detail:detail}));}catch(e){}}
  function combined(){
    return publicLeads.concat(db.leads).map(function(x){
      var o=timeOverrides[x.id];if(!o)return x;
      return Object.assign({},x,{screenMinutes:o.screenMinutes,prepMinutes:o.prepMinutes,adminMinutes:o.adminMinutes,timeConfidence:o.timeConfidence});
    });
  }
  function view(){
    var root=$("radar-results");root.replaceChildren();
    latest=engine.digest(combined(),db.preferences,today());
    emit("incomeos:research-screened",{asOf:latest.date,results:latest.results.map(function(v){return {id:v.candidate.id,title:v.candidate.title,provider:v.candidate.provider,priority:v.priority,effectiveHourlyYield:v.effectiveHourlyYield,paymentUsd:v.candidate.paymentUsd,paymentForm:v.paymentForm,deadline:v.deadline,url:v.candidate.url,timeConfidence:v.timeConfidence};})});
    $("radar-count").textContent=latest.scanned+" sourced candidates · "+latest.priority+" for preliminary review · "+latest.duplicateCount+" duplicate records suppressed";
    if(!latest.results.length){add(root,"p","muted","No sourced study candidates are loaded. Import reviewed public listings or check the existing dated research cards.");return;}
    var visible=latest.results.slice(0,60);
    visible.forEach(function(v){
      var s=v.candidate,div=add(root,"article","radar-card"),heading=add(div,"div","radar-heading");
      add(heading,"strong","",s.title);add(heading,"span","",v.priority.replaceAll("_"," "));
      add(div,"p","muted",s.provider+" · "+s.mode+" · "+s.minutes+" minute session · advertised "+usd(s.paymentUsd)+" · "+(s.eventEnd?(s.dateType==="application-deadline"?"application deadline ":"last published session date ")+s.eventEnd:"no published application deadline"));
      add(div,"p","muted",v.effectiveHourlyYield===null?"EHY unavailable: "+(v.ehyMissing&&v.ehyMissing.length?"missing "+v.ehyMissing.join(", ")+" time.":"time not established."):("Effective hourly yield "+rate(v.effectiveHourlyYield)+"/hr · "+v.totalMinutes+" minutes total ("+s.minutes+" session + "+s.screenMinutes+" screener + "+s.prepMinutes+" prep + "+s.adminMinutes+" follow-up) · time "+v.timeConfidence));
      add(div,"p","muted","Advertised "+usd(s.paymentUsd)+" ("+({cash:"cash",gift_card:"gift card",points:"points",unknown:"payment form not stated"}[v.paymentForm]||"payment form not stated")+"). Advertised pay is not earned income.");
      add(div,"p","muted","Session-only equivalent "+rate(v.sessionRate)+"/hr"+(v.sessionPlusScreenRate===null?" · screening effort unknown":" · including specified screening "+rate(v.sessionPlusScreenRate)+"/hr")+". Selection and payment are not guaranteed.");
      if(s.eligibility.length)add(div,"p","muted","Published requirements: "+s.eligibility.join("; "));
      var flags=v.reasons.concat(v.warnings);
      if(flags.length)add(div,"p","radar-flags",flags.join("; "));
      var controls=add(div,"div","radar-controls");
      var a=add(controls,"a","smallbtn","Open specific application");
      a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";
      var b=add(controls,"a","textbtn","Evidence source");b.href=s.sourceUrl;b.target="_blank";b.rel="noopener noreferrer";b.referrerPolicy="no-referrer";
      var sel=add(controls,"select");
      sel.setAttribute("aria-label","Owner progress for "+s.title);
      statuses.forEach(function(x){var o=add(sel,"option","",x);o.value=x;});
      sel.value=statuses.includes(db.progress[s.id])?db.progress[s.id]:"New";
      if(window.IncomeOSFinancialReadOnly===true){sel.disabled=true;sel.title="Private study tracking requires secured owner storage";}
      else sel.addEventListener("change",function(){db.progress[s.id]=sel.value;persist();});
      // Enter missing or corrected time components (memory only; labelled as owner-entered).
      var tdet=add(div,"details","radar-time");var tsum=add(tdet,"summary","",timeOverrides[s.id]?"Your time entries ("+timeOverrides[s.id].timeConfidence+")":"Enter screener, prep and follow-up time");
      var tgrid=add(tdet,"div","formgrid");
      function tfield(key,label,val){var w=add(tgrid,"div");var l=add(w,"label","",label);var i=add(w,"input");i.type="number";i.min="0";i.max="1440";i.step="1";i.inputMode="numeric";i.id="t-"+key+"-"+s.id;l.htmlFor=i.id;if(val!==null&&val!==undefined)i.value=val;return i;}
      var tS=tfield("screen","Screener minutes",s.screenMinutes),tP=tfield("prep","Preparation minutes",s.prepMinutes),tA=tfield("admin","Follow-up minutes",s.adminMinutes);
      var cw=add(tgrid,"div");var cl=add(cw,"label","","These times are");var tc=add(cw,"select");tc.id="t-conf-"+s.id;cl.htmlFor=tc.id;
      [["estimated","My estimate"],["verified","Confirmed by the recruiter or study page"]].forEach(function(o){var op=add(tc,"option","",o[1]);op.value=o[0];});
      if(timeOverrides[s.id])tc.value=timeOverrides[s.id].timeConfidence;
      var tb=add(tdet,"button","smallbtn","Use these times");tb.type="button";
      tb.addEventListener("click",function(){
        function val(i){return i.value===""?null:Number(i.value);}
        var o={screenMinutes:val(tS),prepMinutes:val(tP),adminMinutes:val(tA),timeConfidence:tc.value};
        try{engine.candidate(Object.assign({},s,o));}catch(e){$("radar-status").textContent="Times not used: "+e.message;return;}
        timeOverrides[s.id]=o;view();emit("incomeos:research-time",{id:s.id,times:o});
        $("radar-status").textContent="Times applied for "+s.title+". EHY and ranking updated. To keep them, have a workspace open in \"This week\" and save it.";
      });
      if(timeOverrides[s.id]){var tr=add(tdet,"button","textbtn","Clear my times");tr.type="button";tr.addEventListener("click",function(){delete timeOverrides[s.id];view();emit("incomeos:research-time",{id:s.id,times:null});});}
      // Application notes from the loaded qualification profile (documented items only).
      var nb=add(controls,"button","textbtn","Prepare application notes");nb.type="button";
      nb.addEventListener("click",function(){
        var PE=window.IncomeOSProfileEditor,pre=div.querySelector("pre.app-notes");if(pre)pre.remove();
        if(!profileForNotes||!PE){$("radar-status").textContent="Open your qualification profile in the opportunities panel first.";return;}
        var docd=PE.items(profileForNotes).filter(function(i){return i.status==="documented";}).map(function(i){return "- "+i.label;});
        var lines=["Application notes: "+s.title+" ("+s.provider+")","","Published requirements (compare yourself; IncomeOS does not judge study eligibility):"]
          .concat(s.eligibility.length?s.eligibility.map(function(x){return "- "+x;}):["- none published"])
          .concat(["","Your documented qualifications:"]).concat(docd.length?docd:["- none documented yet"])
          .concat(["","Never invent answers to screener questions. Nothing has been submitted."]);
        var out=add(div,"pre","app-notes",lines.join("\n"));out.tabIndex=0;
      });
      if(db.leads.some(function(x){return x.id===s.id;})){
        var del=add(controls,"button","textbtn","Remove imported lead");del.type="button";
        del.addEventListener("click",function(){if(!confirm("Remove this locally imported research lead?"))return;db.leads=db.leads.filter(function(x){return x.id!==s.id;});delete db.progress[s.id];persist();view();});
      }
    });
    if(latest.scanned>60)add(root,"p","muted","Showing the first 60 prioritized records. Export the CSV for the full screening list.");
  }
  function download(data,name,type){
    var u=URL.createObjectURL(new Blob([data],{type:type}));var a=elem("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},1000);
  }
  function quote(x){var s=String(x==null?"":x);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function exportCsv(){
    var rows=[["ID","Provider","Title","Advertised USD","Session minutes","Screen minutes","Prep minutes","Follow-up minutes","Total minutes","EHY USD/hour","EHY missing components","Time confidence","Payment form","Mode","Published End Date","Date Type","Source reviewed","Screening priority","Review flags","Owner progress","Application URL","Source URL"]];
    latest.results.forEach(function(v){var s=v.candidate;rows.push([s.id,s.provider,s.title,s.paymentUsd,s.minutes,s.screenMinutes??"",s.prepMinutes??"",s.adminMinutes??"",v.totalMinutes??"",v.effectiveHourlyYield??"",(v.ehyMissing||[]).join("; "),v.timeConfidence,v.paymentForm,s.mode,s.eventEnd||"",s.dateType,s.reviewed,v.priority,v.reasons.concat(v.warnings).join("; "),db.progress[s.id]||"New",s.url,s.sourceUrl]);});
    download(rows.map(function(x){return x.map(quote).join(",");}).join("\r\n")+"\r\n","IncomeOS-research-radar-"+today()+".csv","text/csv;charset=utf-8");
  }
  async function importLeads(){
    if(window.IncomeOSFinancialReadOnly===true){$("radar-status").textContent="Local imports require secured owner storage.";return;}
    var f=$("radar-import-file").files?.[0],notice=$("radar-status");
    if(!f){notice.textContent="Select a JSON file containing reviewed public research candidates.";return;}
    if(f.size>250000){notice.textContent="The research file exceeds the 250 KB limit.";return;}
    try{
      var doc=JSON.parse(await f.text()),result=adapter.collect(doc);
      if(!result.accepted)throw new Error("No public opportunities passed intake verification ("+result.rejected.length+" rejected)");
      var parsed=result.items;
      var existing=engine.dedupe(publicLeads.concat(db.leads)).items,unique=engine.dedupe(existing.concat(parsed));
      var incoming=unique.items.filter(function(x){return !publicLeads.some(function(p){return p.id===x.id;});});
      var added=incoming.filter(function(x){return !db.leads.some(function(e){return e.id===x.id;});}).length;
      if(!confirm("Review "+result.received+" public rows: "+result.accepted+" validated, "+result.rejected.length+" rejected, "+added+" new local candidates. Import validated records only? Availability and eligibility remain unconfirmed."))return;
      db.leads=incoming.slice(0,200);
      if(persist()){view();notice.textContent="Public-source intake complete: "+result.accepted+" accepted, "+result.rejected.length+" rejected, "+unique.skipped+" duplicate(s) suppressed. No recruiter was contacted."; }
    }catch(e){notice.textContent="No research candidates imported: "+e.message;}finally{$("radar-import-file").value="";}
  }
  function template(){
    var d=today(),sample={
      id:"source-study-1234",title:"Sample participant interview",provider:"Example recruiter",paymentUsd:125,minutes:60,screenMinutes:null,prepMinutes:null,adminMinutes:null,timeConfidence:"unknown",mode:"online",
      eventEnd:d,dateType:"application-deadline",reviewed:d,dates:d,eligibility:["Eligibility must be verified"],risk:["Sample only, not an available study"],status:"Availability unconfirmed",
      linkKind:"Direct screener",url:"https://example.org/survey/1234",sourceUrl:"https://example.org/study/1234"
    };
    download(JSON.stringify({asOf:d,studies:[sample]},null,2),"IncomeOS-research-import-example.json","application/json");
  }
  async function feed(){
    try{
      var response=await fetch("./opportunities.json",{cache:"no-store",credentials:"same-origin"});
      if(!response.ok)throw new Error("No current research feed");
      var data=await response.json();
      var result=adapter.collect(data);
      publicLeads=result.items;
      view();
      $("radar-status").textContent="Dated, local public snapshot: "+result.accepted+" verified-format records accepted, "+result.rejected.length+" rejected. Not a live recruiter or financial account connection.";
    }catch(e){$("radar-status").textContent="Public research snapshot unavailable. Only previously imported local candidates are shown.";view();}
  }
  function init(){
    if(!$("radar-results")||!engine||!adapter)return;
    load();
    if(window.IncomeOSFinancialReadOnly===true){$("radar-import").disabled=true;$("radar-import-file").disabled=true;$("radar-preferences").querySelectorAll("input,button").forEach(function(e){e.disabled=true;});}
    $("radar-min-pay").value=db.preferences.minPay;$("radar-min-ehy").value=db.preferences.minEhy;$("radar-max-screen").value=db.preferences.maxScreenMinutes;$("radar-remote").checked=db.preferences.remoteOnly;
    $("radar-preferences").addEventListener("submit",function(e){
      e.preventDefault();var pay=Number($("radar-min-pay").value),ehy=Number($("radar-min-ehy").value),screen=Number($("radar-max-screen").value);
      if(!Number.isFinite(pay)||pay<0||pay>100000||!Number.isFinite(ehy)||ehy<0||ehy>100000||!Number.isFinite(screen)||screen<0||screen>720){$("radar-status").textContent="Enter valid payment and screening thresholds.";return;}
      db.preferences={minPay:pay,minEhy:ehy,maxScreenMinutes:screen,remoteOnly:$("radar-remote").checked};
      if(persist())view();
    });
    $("radar-import").addEventListener("click",importLeads);
    $("radar-template").addEventListener("click",template);
    $("radar-export").addEventListener("click",exportCsv);
    $("radar-rescan").addEventListener("click",feed);
    view();feed();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());