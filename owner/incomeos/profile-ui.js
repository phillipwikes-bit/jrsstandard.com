"use strict";
(function(){
  // Qualification profile editor in the opportunities panel. MEMORY ONLY until
  // the owner saves the file (optionally encrypted). Each change is passed to the
  // opportunity screen through an in-page event so results update immediately.
  function init(){
    var file=document.getElementById("profile-edit-file"),pass=document.getElementById("profile-passphrase"),load=document.getElementById("profile-edit-load"),
      save=document.getElementById("profile-save"),status=document.getElementById("profile-status"),root=document.getElementById("profile-editor"),
      PE=window.IncomeOSProfileEditor,WS=window.IncomeOSWorkspace;
    if(!file||!pass||!load||!save||!status||!root||!PE||!WS)return;
    var state={profile:null,dirty:false};
    function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
    function el(p,tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;p.appendChild(e);return e;}
    function field(p,id,label,type,value){var w=el(p,"div");var l=el(w,"label",label);l.htmlFor=id;var i=el(w,"input");i.id=id;i.type=type||"text";i.autocomplete="off";if(value!=null)i.value=value;return i;}
    function btn(p,text,fn){var b=el(p,"button",text,"smallbtn");b.type="button";b.addEventListener("click",fn);return b;}
    function publish(){try{document.dispatchEvent(new CustomEvent("incomeos:profile",{detail:state.profile}));}catch(e){}}
    function change(fn,msg){
      try{state.profile=fn(state.profile);state.dirty=true;render();publish();status.textContent=msg+". Save the profile to keep it.";}
      catch(err){status.textContent="Not changed: "+err.message;}
    }
    function render(){
      root.replaceChildren();save.hidden=!state.profile;
      if(!state.profile)return;
      var p=state.profile,t=today(),rd=PE.readiness(p);
      el(root,"p",rd.ready?"Profile complete enough for eligibility screening.":"Still blocking eligibility: "+rd.gaps.join("; ")+".",rd.ready?"tag-ok":"tag-hold");
      el(root,"h4","Qualifications","project-subhead");
      PE.items(p).forEach(function(it,n){
        var box=el(root,"div",null,"briefing-actions");
        el(box,"p",it.label+": "+(it.status==="documented"?"documented ("+it.ref+", checked "+it.checkedOn+")":"not documented"),it.status==="documented"?"tag-ok":null);
        if(it.status==="documented"){btn(box,"Remove documented mark",function(){change(function(x){return PE.undocument(x,it.path,t);},"Mark removed");});return;}
        var ref=field(box,"q-ref-"+n,"Where the record is kept"),on=field(box,"q-date-"+n,"Date you checked it","date",t);
        btn(box,"Mark documented",function(){change(function(x){return PE.markDocumented(x,it.path,ref.value,on.value,t);},"Marked documented");});
      });
      el(root,"h4","Work authorization","project-subhead");
      var wa=el(root,"div",null,"briefing-actions");
      var sel=el(wa,"select");sel.id="wa-authorized";sel.setAttribute("aria-label","Authorized to work in the US");
      [["","Choose"],["yes","Authorized to work in the US"],["no","Not authorized"]].forEach(function(o){var op=el(sel,"option",o[1]);op.value=o[0];});
      var cit=el(wa,"select");cit.id="wa-citizen";cit.setAttribute("aria-label","US citizen");
      [["","Citizenship: not stated"],["yes","US citizen"],["no","Not a US citizen"]].forEach(function(o){var op=el(cit,"option",o[1]);op.value=o[0];});
      var waRef=field(wa,"wa-ref","Document (for example passport, home safe)"),waOn=field(wa,"wa-date","Date checked","date",t);
      btn(wa,"Save work authorization",function(){change(function(x){return PE.setWorkAuthorization(x,{authorized:sel.value==="yes"?true:sel.value==="no"?false:null,citizen:cit.value==="yes"?true:cit.value==="no"?false:null,ref:waRef.value,checkedOn:waOn.value},t);},"Work authorization saved");});
      el(root,"h4","Conflicts of interest","project-subhead");
      var cf=el(root,"div",null,"briefing-actions");
      var cur=p.conflicts&&Array.isArray(p.conflicts.organizations)?p.conflicts.organizations.join(", "):"";
      var orgs=field(cf,"cf-orgs","Organizations you must not work for (comma separated; leave empty if none)","text",cur);
      btn(cf,"I reviewed my conflicts today",function(){change(function(x){return PE.setConflicts(x,orgs.value,t,t);},"Conflict review recorded");});
      var fe=el(root,"div",null,"briefing-actions");
      var feIn=field(fe,"pf-former","Former employers (separate with semicolons; engagements mentioning them are flagged for your review)","text",Array.isArray(p.formerEmployers)?p.formerEmployers.join("; "):"");
      btn(fe,"Save former employers",function(){change(function(x){return PE.setFormerEmployers(x,feIn.value);},"Former employers saved");});
      el(root,"h4","Hours, rate and focus","project-subhead");
      var pr=el(root,"div",null,"briefing-actions"),a=p.availability||{},pf=p.preferences||{};
      var hrs=field(pr,"pf-hours","Maximum hours per week","number",a.maxHoursPerWeek),rate=field(pr,"pf-rate","Minimum hourly rate (USD)","number",pf.minHourlyUsd);
      var scr=field(pr,"pf-screen","Typical unpaid screening hours","number",pf.defaultScreeningHours),eng=field(pr,"pf-engage","Typical engagement hours","number",pf.defaultEngagementHours);
      var focus=field(pr,"pf-focus","Focus words (comma separated; empty uses the defaults)","text",Array.isArray(pf.focusKeywords)?pf.focusKeywords.join(", "):"");
      btn(pr,"Save preferences",function(){change(function(x){return PE.setWorkPreferences(x,{maxHoursPerWeek:hrs.value,minHourlyUsd:rate.value,defaultScreeningHours:scr.value,defaultEngagementHours:eng.value,focusKeywords:focus.value});},"Preferences saved");});
    }
    load.addEventListener("click",async function(){
      var f=file.files&&file.files[0];
      if(!f){status.textContent="Choose your profile file first.";return;}
      if(f.size>2000000){status.textContent="Profile file exceeds 2 MB.";return;}
      try{
        var doc=await WS.load(await f.text(),pass.value||"");
        if(!doc||doc.schema!==PE.SCHEMA)throw Error("That is not a qualification profile file.");
        state.profile=doc;state.dirty=false;render();publish();status.textContent="Profile loaded in memory only.";
      }catch(err){status.textContent="Profile rejected: "+err.message;}
      finally{file.value="";}
    });
    save.addEventListener("click",async function(){
      if(!state.profile)return;
      var p=pass.value||"",stamp=today(),text,name;
      try{
        if(p){text=await WS.encrypt(p,state.profile);name="incomeos-profile-"+stamp+".encrypted.json";}
        else{text=JSON.stringify(state.profile,null,1);name="incomeos-profile-"+stamp+".json";}
        var url=URL.createObjectURL(new Blob([text],{type:"application/json"})),a=document.createElement("a");
        a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},2000);
        state.dirty=false;status.textContent=p?"Encrypted profile saved. The passphrase cannot be recovered.":"Saved WITHOUT encryption. Add a passphrase of 16+ characters and save again.";
      }catch(err){status.textContent="Not saved: "+err.message;}
    });
    window.addEventListener("beforeunload",function(e){if(state.dirty){e.preventDefault();e.returnValue="";}});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
