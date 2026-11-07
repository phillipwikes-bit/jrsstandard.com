"use strict";
/* Staging-only bridge between the authoritative IncomeOS workspace file and
   server revision store. Not loaded by the Owner Desk and makes no network calls
   itself. A host must explicitly supply an authenticated revision store.
   No plaintext is persisted by this module. */
(function(root){
  function createWorkspaceBridge(revisions,workspace,integrity){
    if(!revisions||typeof revisions.refresh!=="function"||typeof revisions.append!=="function"||
       typeof revisions.currentRevision!=="function"||typeof revisions.requiresOwnerConfirmation!=="function"||
       typeof revisions.confirmRevision!=="function"||typeof revisions.reset!=="function"||
       !workspace||typeof workspace.validate!=="function"||typeof workspace.encrypt!=="function"||
       typeof workspace.decrypt!=="function"||!integrity||typeof integrity.sha256!=="function")
      throw Error("Workspace bridge requires verified staging dependencies");
    var busy=false,openedRevision=null,openedCiphertext=null,openedSha256=null;
    function ensureIdle(){if(busy)throw Error("Workspace bridge operation already in progress");}
    async function open(passphrase){
      ensureIdle();busy=true;openedRevision=null;openedCiphertext=null;openedSha256=null;
      try{
        var remote=await revisions.refresh();
        var doc=null;
        if(remote.text!==null){
          // A checksum match alone cannot prove decryption or workspace schema.
          doc=workspace.validate(await workspace.decrypt(passphrase,remote.text));
        }
        openedRevision=remote.revision;
        openedCiphertext=remote.text;
        openedSha256=remote.sha256||null;
        return Object.freeze({revision:remote.revision,workspace:doc,
          requiresOwnerConfirmation:remote.requiresOwnerConfirmation===true});
      }finally{busy=false;}
    }
    async function save(document,passphrase){
      ensureIdle();
      if(openedRevision===null||openedRevision!==revisions.currentRevision())
        throw Error("Open and verify the current server workspace before saving");
      if(revisions.requiresOwnerConfirmation())
        throw Error("Owner must review and confirm newer server workspace before saving");
      busy=true;
      try{
        workspace.validate(document);
        var ciphertext=await workspace.encrypt(passphrase,document);
        var checksum=await integrity.sha256(ciphertext);
        var result=await revisions.append(ciphertext,checksum);
        openedRevision=result.revision;
        openedCiphertext=ciphertext;
        openedSha256=checksum;
        return Object.freeze({revision:result.revision,encrypted:true});
      }catch(e){
        // An uncertain append must never leave a cached revision authorized.
        openedRevision=null;openedCiphertext=null;openedSha256=null;
        throw e;
      }finally{busy=false;}
    }
    function confirmOpenedRevision(revision){
      ensureIdle();
      if(openedRevision===null||openedRevision!==revision||
         revisions.currentRevision()!==revision)
        throw Error("Open the exact newer server workspace before owner confirmation");
      revisions.confirmRevision(revision);
    }
    function encryptedBackup(){
      ensureIdle();
      if(openedRevision===null||openedRevision!==revisions.currentRevision()||
         typeof openedCiphertext!=="string"||!openedSha256||revisions.requiresOwnerConfirmation())
        throw Error("Verified current encrypted workspace required for backup export");
      return Object.freeze({revision:openedRevision,ciphertext:openedCiphertext,sha256:openedSha256});
    }
    function close(){
      ensureIdle();openedRevision=null;openedCiphertext=null;openedSha256=null;revisions.reset();
    }
    return Object.freeze({open:open,save:save,encryptedBackup:encryptedBackup,confirmOpenedRevision:confirmOpenedRevision,
      close:close,status:function(){return Object.freeze({
        openedRevision:openedRevision,requiresOwnerConfirmation:revisions.requiresOwnerConfirmation()
      });}});
  }
  var api=Object.freeze({createWorkspaceBridge:createWorkspaceBridge});
  if(root)root.IncomeOSWorkspaceRevisionBridge=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
}(typeof window!=="undefined"?window:globalThis));
