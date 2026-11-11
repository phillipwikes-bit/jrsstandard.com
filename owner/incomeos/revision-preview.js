"use strict";
/* Loaded only by an explicitly prepared, origin-bound revision preview. */
(function(){
  function init(){
    var vault=window.IncomeOSVaultCloud,host=window.IncomeOSRevisionDeskHost,runtime=window.IncomeOSRevisionRuntime;
    var panel=document.getElementById("cloud-vault-panel"),status=document.getElementById("cloud-vault-status");
    if(!vault||!vault.revisionPreview||!host||!runtime||!panel||!status)return;
    panel.querySelector("summary").textContent="Staged revision sign-in";
    panel.querySelector("p").textContent="Use synthetic records in this protected preview. Sign in, enter the workspace passphrase, and open the latest revision before editing.";
    ["briefing-file","briefing-load"].forEach(function(id){
      document.getElementById(id).hidden=true;
      var label=document.querySelector('label[for="'+id+'"]');if(label)label.hidden=true;
    });
    var open=document.createElement("button");open.type="button";open.className="smallbtn";
    open.id="revision-preview-open";open.textContent="Open staged revision editor";
    panel.querySelector(".vault-buttons").appendChild(open);
    var coordinator=null,binding=null;
    function refresh(){open.disabled=!vault.signedIn();}
    document.addEventListener("incomeos:revision-preview-session",function(event){
      if(event.detail.signedIn!==true){
        var dirty=coordinator&&coordinator.status().dirty;
        if(binding&&binding.attached())binding.lock();
        binding=null;coordinator=null;
        var reason=event.detail.reason==="denied"?"Staged revision access was denied.":"Staged session ended.";
        status.textContent=dirty?reason+" An unconfirmed draft was open. Verify the latest revision or use a previously downloaded encrypted rescue file after sign-in.":
          reason+" Sign in with an authorized staging identity.";
      }
      refresh();
    });
    document.addEventListener("incomeos:revision-preview-signout",function(event){
      if(coordinator&&coordinator.status().dirty&&!window.confirm("Signing out closes this draft. Save or download an encrypted rescue copy first. Sign out now?"))
        event.preventDefault();
    });
    open.addEventListener("click",async function(){
      if(!vault.signedIn())return;
      open.disabled=true;
      var currentBinding=null;
      try{
        if(!coordinator)coordinator=runtime.createAccountingRuntime({stagingOnly:true});
        if(!binding||!binding.attached())binding=host.attach(coordinator,{stagingOnly:true});
        currentBinding=binding;
        var pass=document.getElementById("briefing-passphrase").value;
        var opened=await currentBinding.open(pass);
        if(binding!==currentBinding)return;
        status.textContent=opened.hasWorkspace?
          "Opened staged revision "+opened.revision+(opened.requiresOwnerConfirmation?". Review and confirm it before editing.":"."):
          "Staged vault is empty. Start a new workspace to prepare a synthetic draft.";
      }catch(error){if(!currentBinding||binding===currentBinding)status.textContent="Staged editor: "+error.message;}
      finally{refresh();}
    });
    refresh();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
