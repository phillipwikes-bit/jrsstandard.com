"use strict";
(function(){
  // "Start here" checklist. Listens to the panels' in-page events and shows
  // which setup steps are done and the single next step. Memory only: it reads
  // nothing from storage and records nothing; progress resets on reload, which
  // matches the app (your data lives in the files you save).
  function init(){
    var root=document.getElementById("start-here-steps"),next=document.getElementById("start-here-next");
    if(!root||!next)return;
    var s={profile:null,profileSavedEncrypted:false,workspace:false,workspaceSavedEncrypted:false,workspaceDirty:false,listings:false};
    var STEPS=[
      {id:"open-profile",text:"Open your qualification profile",where:"profile-edit-panel",done:function(){return !!s.profile;}},
      {id:"document",text:"Document your qualifications, work authorization, conflicts and hours",where:"profile-edit-panel",done:function(){var PE=window.IncomeOSProfileEditor;return !!(s.profile&&PE&&PE.readiness(s.profile).ready);}},
      {id:"save-profile",text:"Save your profile encrypted (passphrase of 16+ characters)",where:"profile-edit-panel",done:function(){return s.profileSavedEncrypted;}},
      {id:"workspace",text:"Start or open your workspace in This week",where:"briefing-panel",done:function(){return s.workspace;}},
      {id:"save-workspace",text:"Save your workspace encrypted",where:"briefing-panel",done:function(){return s.workspaceSavedEncrypted&&!s.workspaceDirty;}},
      {id:"listings",text:"Load job listings (discovery snapshot or ChatGPT file) and screen them",where:"project-opportunity-panel",done:function(){return s.listings;}}
    ];
    function render(){
      root.replaceChildren();var first=null;
      STEPS.forEach(function(st){
        var ok=st.done(),li=document.createElement("li");li.textContent=(ok?"Done: ":"")+st.text;li.className=ok?"tag-ok":"";
        root.appendChild(li);if(!ok&&!first)first=st;
      });
      next.replaceChildren();
      if(!first){next.textContent="Setup complete. Check This week for what needs you.";return;}
      next.appendChild(document.createTextNode("Next: "+first.text+". "));
      var a=document.createElement("a");a.href="#"+first.where;a.textContent="Go there";
      a.addEventListener("click",function(){var t=document.getElementById(first.where);if(t&&t.tagName==="DETAILS")t.open=true;});
      next.appendChild(a);
    }
    function on(name,fn){document.addEventListener(name,function(ev){fn(ev.detail);render();});}
    on("incomeos:profile",function(d){s.profile=d||null;});
    on("incomeos:profile-saved",function(d){if(d&&d.encrypted)s.profileSavedEncrypted=true;});
    on("incomeos:workspace-loaded",function(d){s.workspace=!!d;s.workspaceDirty=false;s.workspaceSavedEncrypted=false;});
    on("incomeos:workspace-changed",function(){s.workspaceDirty=true;});
    on("incomeos:workspace-saved",function(d){if(d&&d.encrypted){s.workspaceSavedEncrypted=true;s.workspaceDirty=false;}});
    on("incomeos:screened",function(){s.listings=true;});
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
