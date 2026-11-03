"use strict";
(function(){
  // Owner dashboard: eligible projects and expert work.
  // MEMORY ONLY. The profile, the snapshot and owner confirmations are held in
  // this page's memory and are discarded on reload. Nothing is written to
  // browser storage, nothing is transmitted and no application is submitted.
  // This is compatible with the unconditional staging interlock, which blocks
  // persistent owner data, because no persistent data is created here.
  // All listing text is untrusted and rendered with textContent only.
  function init(){
    var profileInput=document.getElementById("project-profile-file"),input=document.getElementById("project-import-file"),
      button=document.getElementById("project-import"),status=document.getElementById("project-status"),
      eligibleRoot=document.getElementById("project-results"),pendingRoot=document.getElementById("project-pending"),
      excludedRoot=document.getElementById("project-excluded"),healthRoot=document.getElementById("project-health"),
      summary=document.getElementById("project-summary"),
      radar=window.IncomeOSProjectRadar,Opp=window.IncomeOSOpportunity;
    if(!input||!button||!status||!eligibleRoot||!pendingRoot||!excludedRoot||!healthRoot||!summary||!radar||!Opp)return;
    var state={profile:null,snapshot:null,confirmations:{}};
    var MAX_BYTES=8000000;
    function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
    function el(parent,tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;parent.appendChild(e);return e;}
    function safeLink(parent,url,label){
      try{var u=new URL(url);if(u.protocol!=="https:"||u.username||u.password)return null;}catch(e){return null;}
      var a=el(parent,"a",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.referrerPolicy="no-referrer";return a;
    }
    function money(x){return x==null?"unverified":"$"+Number(x).toFixed(2)+"/h";}
    async function readJson(file,label){
      if(!file)throw Error("Select a "+label+" file.");
      if(file.size>MAX_BYTES)throw Error(label+" exceeds the 8 MB limit.");
      try{return JSON.parse(await file.text());}catch(e){throw Error(label+" is not valid JSON.");}
    }
    // Convert manually imported flat listings into normalized records.
    // Listing-supplied eligibility claims are dropped by construction.
    function fromManual(items){
      if(!Array.isArray(items)||!items.length||items.length>200)throw Error("Expected 1 to 200 listings.");
      var src={connector:"manual",sourceId:"manual-import",sourceType:"manual",allowedHosts:[],mode:"manual_import"};
      return {schema:"incomeos.discovery-snapshot.v1",connectors:[{sourceId:"manual-import",connector:"manual",mode:"manual_import",status:"ok",listingCount:items.length,error:null}],
        opportunities:items.map(function(x){
          if(!x||typeof x!=="object"||Array.isArray(x))throw Error("Each listing must be an object.");
          var rec=Opp.normalize({postingId:x.id,title:x.title,employer:x.employer||x.platform,platform:x.platform,sourceUrl:x.sourceUrl,applyUrl:x.applyUrl,
            locationText:x.remote===true?"Remote":x.locationText,descriptionText:typeof x.descriptionText==="string"?x.descriptionText:"",deadline:x.deadline,remoteMode:x.remote===true?"remote":undefined},src,(x.reviewed||"")+"T00:00:00Z");
          if(!/^\d{4}-\d{2}-\d{2}$/.test(String(x.reviewed||"")))rec.problems.push("REVIEW_DATE_MISSING");
          return rec;
        })};
    }
    function renderHealth(conns){
      healthRoot.replaceChildren();
      if(!conns.length){el(healthRoot,"p","No connector receipts in this file.","muted");return;}
      conns.forEach(function(c){
        var card=el(healthRoot,"article",null,"radar-card");
        el(card,"strong",String(c.sourceId||"source").slice(0,60)+" · "+String(c.status||"unknown").toUpperCase(),c.status==="ok"?"tag-ok":"tag-hold");
        el(card,"p",(c.mode||"")+" · "+(c.listingCount||0)+" listings"+(c.httpStatus?" · HTTP "+c.httpStatus:"")+(c.error?" · "+String(c.error).slice(0,80):"")+(c.finishedAt?" · "+String(c.finishedAt).slice(0,16).replace("T"," "):""));
      });
    }
    function basis(row){return row.decision.requirements.filter(function(q){return q.status==="SATISFIED";}).map(function(q){return q.category.replace(/_/g," ")+": "+q.ownerEvidence;});}
    function card(root,row,kind){
      var o=row.opportunity,c=el(root,"article",null,"radar-card");
      el(c,"strong",String(o.title).slice(0,140));
      var EG=window.IncomeOSEngagement;
      if(EG){
        var txt=[o.title,o.descriptionExcerpt].join(". "),kindLabel={EXPERT_CONSULTATION:"Expert consultation",RESEARCH_STUDY:"Research study",EMPLOYMENT:"Employment",PROJECT_WORK:"Project work",UNCLASSIFIED:"Type unclear"}[EG.classify(txt)];
        el(c,"p",kindLabel,"muted");
        var risk=EG.confidentialityRisks([txt,o.employer,o.platform].join(". "),state.profile&&state.profile.formerEmployers);
        if(risk.requiresOwnerReview){var rl=el(c,"p","Needs your confidentiality review: "+risk.flags.map(function(f){return f.replace(/_/g," ").toLowerCase();}).join("; ")+". "+risk.note,"tag-hold");}
      }
      el(c,"p",String(o.platform||o.employer).slice(0,80)+" · "+(o.remoteMode||"remote unknown")+" · effective "+money(row.economics.effectiveHourlyUsd)+(row.economics.status!=="UNVERIFIED"?" ("+row.economics.status.toLowerCase().replace(/_/g," ")+", before taxes)":" ("+row.economics.reasons.join(", ").toLowerCase().replace(/_/g," ")+")"));
      el(c,"p","Deadline: "+(o.deadline||"none published")+" · last verified "+o.lastVerifiedOn+(row.duplicates.length?" · "+row.duplicates.length+" duplicate copies merged":""));
      if(kind==="eligible"){
        var ul=el(c,"ul");basis(row).forEach(function(b){el(ul,"li",b);});
        safeLink(c,o.applyUrl,"Open application (you decide whether to apply)");
        if(window.IncomeOSEngagement){
          var nb=el(c,"button","Prepare application notes");nb.type="button";nb.className="smallbtn";
          nb.addEventListener("click",function(){
            var notes;try{notes=window.IncomeOSEngagement.applicationNotes(o,row.decision,state.profile);}catch(err){el(c,"p",err.message,"tag-hold");return;}
            var pre=el(c,"pre",notes.text,"app-notes");pre.tabIndex=0;
            var cb=el(c,"button","Copy notes");cb.type="button";cb.className="smallbtn";
            cb.addEventListener("click",function(){
              function select(){var r=document.createRange();r.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);}
              try{navigator.clipboard.writeText(notes.text).then(function(){cb.textContent="Copied";},function(){select();cb.textContent="Selected: copy manually";});}catch(e){select();cb.textContent="Selected: copy manually";}
            });
            nb.disabled=true;
          });
        }
      }else{
        var ul2=el(c,"ul");row.decision.unresolved.slice(0,8).forEach(function(u){el(ul2,"li",u.replace(/^[^:]*:/,"").replace(/_/g," ").toLowerCase());});
        o.requirements.slice(0,6).forEach(function(r){el(c,"p","Source: “"+String(r.sourceText||"").slice(0,180)+"”"+(r.mandatory?"":" (optional)"));});
        var b=el(c,"button","I read the full posting; its requirements are complete");b.type="button";b.className="smallbtn";
        b.addEventListener("click",function(){state.confirmations[o.opportunityId]={confirmedOn:today(),contentHash:o.contentHash};render();});
      }
      safeLink(c,o.sourceUrl,"View source posting");
    }
    function render(){
      [eligibleRoot,pendingRoot,excludedRoot].forEach(function(r){r.replaceChildren();});
      summary.replaceChildren();
      if(!state.snapshot)return;
      if(!state.profile){status.textContent="Load your private qualification profile. Without it nothing can be shown as eligible.";renderHealth(state.snapshot.connectors||[]);return;}
      var res;
      var prefs=Object.assign({},state.profile.preferences||{},{includeOffFocus:state.showAll===true});
      try{res=radar.screen(state.snapshot,state.profile,today(),prefs,{confirmations:state.confirmations});}
      catch(e){status.textContent="Screening rejected: "+e.message;return;}
      renderHealth(res.connectors);
      res.eligible.forEach(function(r){card(eligibleRoot,r,"eligible");});
      res.pending.slice(0,50).forEach(function(r){card(pendingRoot,r,"pending");});
      if(!res.eligible.length)el(eligibleRoot,"p","No opportunity currently meets every documented mandatory requirement.","muted");
      if(res.offFocusHidden){var t=el(pendingRoot,"button",(state.showAll?"Hide":"Show")+" "+res.offFocusHidden+" listings outside your focus areas");t.type="button";t.className="smallbtn";
        t.addEventListener("click",function(){state.showAll=!state.showAll;render();});}
      var reasons=Object.keys(res.exclusionReasons).sort(function(a,b){return res.exclusionReasons[b]-res.exclusionReasons[a];}).slice(0,12);
      var ul=el(excludedRoot,"ul");reasons.forEach(function(k){el(ul,"li",res.exclusionReasons[k]+" × "+k.replace(/_/g," ").toLowerCase());});
      var healthy=res.connectors.filter(function(c){return c.status==="ok";}).length;
      [["Verified eligible",res.eligible.length],["Meets rate target",res.alerts.length],["Need your check",res.pending.length],["Sources healthy",healthy+"/"+res.connectors.length]].forEach(function(p){var d=el(summary,"div");el(d,"b",p[1]);el(d,"span",p[0]);});
      status.textContent=res.eligible.length+" eligible, "+res.pending.length+" awaiting verification, "+res.excludedCount+" excluded"+(res.offFocusHidden?", "+res.offFocusHidden+" outside your focus areas hidden":"")+". "+res.notice;
      try{document.dispatchEvent(new CustomEvent("incomeos:screened",{detail:res}));}catch(e){}
    }
    button.addEventListener("click",async function(){
      try{
        if(profileInput&&profileInput.files&&profileInput.files[0]){
          var p=await readJson(profileInput.files[0],"Profile");
          if(!p||p.schema!=="incomeos.owner-profile.v1")throw Error("Profile must use schema incomeos.owner-profile.v1.");
          state.profile=p;
        }
        var doc=await readJson(input.files&&input.files[0],"Listing");
        state.snapshot=doc&&doc.schema==="incomeos.discovery-snapshot.v1"?doc:fromManual(Array.isArray(doc)?doc:doc&&doc.projects);
        state.confirmations={};
        render();
      }catch(err){status.textContent="Import rejected: "+err.message;}
      finally{input.value="";if(profileInput)profileInput.value="";}
    });
    document.addEventListener("incomeos:profile",function(ev){state.profile=ev.detail||null;if(state.snapshot)render();});
    status.textContent="Memory only: load your private profile and a discovery snapshot. Nothing is stored, sent or submitted.";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
