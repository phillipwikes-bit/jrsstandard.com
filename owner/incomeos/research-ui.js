"use strict";
(function(){
  var KEY="incomeos.research.radar.v1",engine=window.IncomeOSResearchRadar;
  var db={version:1,preferences:{minPay:100,maxScreenMinutes:15,remoteOnly:true},leads:[],progress:{}},publicLeads=[],latest=null;
  var statuses=["New","Reviewing","Applied","Invited","Completed","Paid (self-reported)","Declined","Not eligible"];
  var $=function(id){return document.getElementById(id);};
  function elem(tag,cls,content){var n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n;}
  function add(el,tag,cls,content){var n=elem(tag,cls,content);el.appendChild(n);return n;}
  function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  function usd(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);}
  function load(){
    try{var v=JSON.parse(localStorage.getItem(KEY)||"{}");
      if(v&&typeof v==="object"&&!Array.isArray(v)){
        var p=v.preferences||{},min=Number(p.minPay),screen=Number(p.maxScreenMinutes);
        if(Number.isFinite(min)&&min>=0&&min<=100000)db.preferences.minPay=min;
        if(Number.isFinite(screen)&&screen>=0&&screen<=720)db.preferences.maxScreenMinutes=screen;
        if(typeof p.remoteOnly==="boolean")db.preferences.remoteOnly=p.remoteOnly;
        db.leads=Array.isArray(v.leads)?v.leads.slice(0,200).map(function(x){try{return engine.candidate(x);}catch(e){return null;}}).filter(Boolean):[];
        db.progress=v.progress&&typeof v.progress==="object"&&!Array.isArray(v.progress)?v.progress:{};
      }
    }catch(e){$("radar-status").textContent="Saved research data could not be read. No changes have been written.";}
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(db));return true;}catch(e){$("radar-status").textContent="Research changes could not be saved to local storage.";return false;}}
  function combined(){return publicLeads.concat(db.leads);}
  function view(){
    var root=$("radar-results");root.replaceChildren();
    latest=engine.digest(combined(),db.preferences,today());
    $("radar-count").textContent=latest.scanned+" sourced candidates · "+latest.priority+" for preliminary review · "+latest.duplicateCount+" duplicate records suppressed";
    if(!latest.results.length){add(root,"p","muted","No sourced study candidates are loaded. Import reviewed public listings or check the existing dated research cards.");return;}
    var visible=latest.results.slice(0,60);
    visible.forEach(function(v){
      var s=v.candidate,div=add(root,"article","radar-card"),heading=add(div,"div","radar-heading");
      add(heading,"strong","",s.title);add(heading,"span","",v.priority.replaceAll("_"," "));
      add(div,"p","muted",s.provider+" · "+s.mode+" · "+s.minutes+" minute session · advertised "+usd(s.paymentUsd)+" · deadline "+s.eventEnd);
      add(div,"p","muted","Session-only equivalent "+usd(v.sessionRate)+"/hr"+(v.sessionPlusScreenRate===null?" · screening effort unknown":" · including specified screening "+usd(v.sessionPlusScreenRate)+"/hr")+". Selection and payment are not guaranteed.");
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
      sel.addEventListener("change",function(){db.progress[s.id]=sel.value;persist();});
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
    var rows=[["ID","Provider","Title","Advertised USD","Session minutes","Screen minutes","Mode","Deadline","Source reviewed","Screening priority","Review flags","Owner progress","Application URL","Source URL"]];
    latest.results.forEach(function(v){var s=v.candidate;rows.push([s.id,s.provider,s.title,s.paymentUsd,s.minutes,s.screenMinutes??"",s.mode,s.eventEnd,s.reviewed,v.priority,v.reasons.concat(v.warnings).join("; "),db.progress[s.id]||"New",s.url,s.sourceUrl]);});
    download(rows.map(function(x){return x.map(quote).join(",");}).join("\r\n")+"\r\n","IncomeOS-research-radar-"+today()+".csv","text/csv;charset=utf-8");
  }
  async function importLeads(){
    var f=$("radar-import-file").files?.[0],notice=$("radar-status");
    if(!f){notice.textContent="Select a JSON file containing reviewed public research candidates.";return;}
    if(f.size>250000){notice.textContent="The research file exceeds the 250 KB limit.";return;}
    try{
      var doc=JSON.parse(await f.text()),records=Array.isArray(doc)?doc:doc&&doc.studies;
      if(!Array.isArray(records)||!records.length||records.length>200)throw new Error("Expected one to 200 sourced studies");
      var parsed=records.map(function(x){return engine.candidate(x);});
      var existing=engine.dedupe(combined()).items,unique=engine.dedupe(existing.concat(parsed));
      var incoming=unique.items.filter(function(x){return !publicLeads.some(function(p){return p.id===x.id;});});
      var added=incoming.filter(function(x){return !db.leads.some(function(e){return e.id===x.id;});}).length;
      if(!confirm("Import "+parsed.length+" public research rows, including "+added+" new local candidates? Their availability and eligibility are not confirmed."))return;
      db.leads=incoming.slice(0,200);
      if(persist()){view();notice.textContent="Imported for local triage. "+unique.skipped+" duplicate candidate(s) skipped. No recruiter was contacted."; }
    }catch(e){notice.textContent="No research candidates imported: "+e.message;}finally{$("radar-import-file").value="";}
  }
  function template(){
    var d=today(),sample={
      id:"source-study-1234",title:"Sample participant interview",provider:"Example recruiter",paymentUsd:125,minutes:60,screenMinutes:null,mode:"online",
      eventEnd:d,reviewed:d,dates:d,eligibility:["Eligibility must be verified"],risk:["Sample only, not an available study"],status:"Availability unconfirmed",
      linkKind:"Direct screener",url:"https://example.org/survey/1234",sourceUrl:"https://example.org/study/1234"
    };
    download(JSON.stringify({asOf:d,studies:[sample]},null,2),"IncomeOS-research-import-example.json","application/json");
  }
  async function feed(){
    try{
      var response=await fetch("./opportunities.json",{cache:"no-store",credentials:"same-origin"});
      if(!response.ok)throw new Error("No current research feed");
      var data=await response.json();
      publicLeads=Array.isArray(data.studies)?data.studies.map(function(x){try{return engine.candidate(x);}catch(e){return null;}}).filter(Boolean):[];
      view();
    }catch(e){$("radar-status").textContent="Public research snapshot unavailable. Only previously imported local candidates are shown.";view();}
  }
  function init(){
    if(!$("radar-results")||!engine)return;
    load();
    $("radar-min-pay").value=db.preferences.minPay;$("radar-max-screen").value=db.preferences.maxScreenMinutes;$("radar-remote").checked=db.preferences.remoteOnly;
    $("radar-preferences").addEventListener("submit",function(e){
      e.preventDefault();var pay=Number($("radar-min-pay").value),screen=Number($("radar-max-screen").value);
      if(!Number.isFinite(pay)||pay<0||pay>100000||!Number.isFinite(screen)||screen<0||screen>720){$("radar-status").textContent="Enter valid payment and screening thresholds.";return;}
      db.preferences={minPay:pay,maxScreenMinutes:screen,remoteOnly:$("radar-remote").checked};
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