"use strict";
/* Staging-only coordinator for the EXISTING IncomeOS accountant and the
   authoritative owner workspace. Not loaded by index.html. It never persists
   plaintext, creates competing ledger storage, or saves automatically. */
(function(root){
  function createAccountingCoordinator(bridge,workspace,accountant){
    if(!bridge||typeof bridge.open!=="function"||typeof bridge.save!=="function"||
       typeof bridge.confirmOpenedRevision!=="function"||
       typeof bridge.encryptedBackup!=="function"||typeof bridge.close!=="function"||
       typeof bridge.assertSession!=="function"||
       !workspace||typeof workspace.validate!=="function"||
       typeof workspace.newWorkspace!=="function"||typeof workspace.setLedger!=="function"||
       typeof workspace.encrypt!=="function"||typeof workspace.decrypt!=="function"||
       !accountant||typeof accountant.validateEntry!=="function")
      throw Error("Verified workspace, accounting and revision dependencies required");
    var working=null,opened=false,dirty=false,needsReview=false,needsRecovery=false,busy=false;
    function clone(value){return JSON.parse(JSON.stringify(value));}
    function ensureIdle(){if(busy)throw Error("Accounting operation already in progress");}
    // Authentication governs local draft access and cryptographic exports as
    // well as HTTP calls. A revoked runtime cannot regain authority through a
    // later sign-in. Discard and close remain available for local cleanup.
    function verifySession(){bridge.assertSession();}
    function validateLedger(entries){
      if(!Array.isArray(entries)||entries.length>15000)
        throw Error("Unsupported accounting ledger collection");
      var ids=new Set();
      entries.forEach(function(e){
        if(!e||typeof e!=="object"||Array.isArray(e)||typeof e.id!=="string"||
           !e.id.trim()||ids.has(e.id.trim())||accountant.validateEntry(e)!==true)
          throw Error("Invalid or unsupported accounting record: preserve original workspace");
        ids.add(e.id.trim());
      });
    }
    async function open(passphrase){
      ensureIdle();verifySession();
      if(dirty)throw Error("Preserve or explicitly discard unsaved accounting draft before reopening");
      busy=true;opened=false;working=null;needsReview=false;needsRecovery=false;
      try{
        var result=await bridge.open(passphrase);
        verifySession();
        if(result.workspace!==null){
          workspace.validate(result.workspace);
          validateLedger(result.workspace.ledger);
          working=clone(result.workspace);
        }
        opened=true;needsReview=result.requiresOwnerConfirmation===true;
        return Object.freeze({revision:result.revision,hasWorkspace:working!==null,
          ledgerCount:working?working.ledger.length:0,requiresOwnerConfirmation:needsReview});
      }finally{busy=false;}
    }
    function initializeNew(on){
      ensureIdle();verifySession();
      if(!opened||working!==null||needsReview||needsRecovery)
        throw Error("Open an empty, verified server workspace before initialization");
      var next=workspace.newWorkspace(on);
      if(typeof on!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(on)||
         !Number.isFinite(Date.parse(on+"T00:00:00Z"))||
         new Date(on+"T00:00:00Z").toISOString().slice(0,10)!==on)
        throw Error("Valid initialization date required");
      working=next;dirty=true;
    }
    function replaceLedger(entries,on){
      ensureIdle();verifySession();
      if(!opened||!working||needsReview||needsRecovery)
        throw Error("Open and confirm a verified owner workspace before editing");
      validateLedger(entries);
      var next=workspace.setLedger(working,clone(entries),on);
      workspace.validate(next);
      working=next;dirty=true;
      return Object.freeze({ledgerCount:next.ledger.length,unsaved:true});
    }
    function updateProgram(program,on){
      ensureIdle();verifySession();
      if(!opened||!working||needsReview||needsRecovery)
        throw Error("Open and confirm a verified owner workspace before editing");
      if(typeof workspace.setDsProgram!=="function")
        throw Error("Existing Decision Spellchecker programme engine required");
      // The existing programme engine owns its validation and acceptance
      // rules. Save the programme in the SAME revision as the financial rows.
      var next=workspace.setDsProgram(working,clone(program),on);
      workspace.validate(next);validateLedger(next.ledger);verifySession();
      working=next;dirty=true;
      return Object.freeze({unsaved:true,serverSaved:false});
    }
    async function restoreLedgerBackup(backup,passphrase,on){
      ensureIdle();verifySession();
      if(!opened||!working||dirty||needsReview||needsRecovery)
        throw Error("Open and confirm the current workspace; preserve or discard any draft before backup restoration");
      if(typeof bridge.inspectEncryptedBackup!=="function")
        throw Error("Verified encrypted backup inspection required");
      busy=true;
      try{
        var restored=await bridge.inspectEncryptedBackup(backup,passphrase);
        verifySession();validateLedger(restored.workspace.ledger);
        // Restore accounting rows as a new local edit against the CURRENT
        // server head. Preserve current programme, nonfinancial sections and
        // history. An old backup is never installed as an old server revision.
        var next=workspace.setLedger(working,clone(restored.workspace.ledger),on);
        next.changeLog.push({on:on,action:"LEDGER_BACKUP_RESTORED",detail:{
          sourceRevision:restored.revision,sourceSha256:restored.sha256,
          ledgerRows:next.ledger.length}});
        workspace.validate(next);verifySession();working=next;dirty=true;
        return Object.freeze({ledgerCount:next.ledger.length,sourceRevision:restored.revision,
          unsaved:true,serverSaved:false});
      }finally{busy=false;}
    }
    async function save(passphrase){
      ensureIdle();verifySession();
      if(!opened||!working||needsReview||needsRecovery||!dirty)
        throw Error("A verified unsaved accounting draft is required before saving");
      busy=true;
      try{
        var result=await bridge.save(clone(working),passphrase);
        dirty=false;
        return Object.freeze({revision:result.revision,encrypted:true,ledgerCount:working.ledger.length});
      }catch(e){
        // Preserve the unsaved in-memory draft, but do not allow another save
        // until the server has been reopened and the owner resolves the conflict.
        needsRecovery=true;opened=false;
        throw e;
      }finally{busy=false;}
    }
    function confirmOpenedRevision(revision){
      ensureIdle();verifySession();
      if(!opened||dirty||!needsReview)throw Error("A verified newer owner workspace must be reviewed");
      bridge.confirmOpenedRevision(revision);
      needsReview=false;
    }
    function pendingDraft(){
      ensureIdle();verifySession();
      if(!dirty||!working)throw Error("No pending accounting draft");
      return clone(working);
    }
    function workspaceSnapshot(){
      ensureIdle();verifySession();
      if(!opened||!working||needsRecovery)throw Error("Open a verified current workspace before inspection");
      // Review is possible before confirmation, but callers cannot mutate the
      // authoritative working copy through a returned object reference.
      return clone(working);
    }
    async function exportPendingDraftEncrypted(passphrase){
      ensureIdle();verifySession();
      if(!dirty||!working)throw Error("No pending accounting draft to preserve");
      busy=true;
      try{
        // Do not send the draft to the server or clear its dirty flag.
        // A failed/conflicted save may be rescued as an owner-held encrypted file.
        var snapshot=clone(workspace.validate(working));
        validateLedger(snapshot.ledger);
        var ciphertext=await workspace.encrypt(passphrase,snapshot);
        verifySession();
        var restored=await workspace.decrypt(passphrase,ciphertext);
        verifySession();
        if(JSON.stringify(restored)!==JSON.stringify(snapshot))
          throw Error("Encrypted accounting draft verification failed");
        return Object.freeze({encrypted:true,ciphertext:ciphertext,serverSaved:false});
      }finally{busy=false;}
    }
    function discardDraft(){
      ensureIdle();
      if(!dirty)throw Error("No pending accounting draft");
      working=null;opened=false;dirty=false;needsReview=false;needsRecovery=false;
      // Preserve the revision store's high-water mark after a conflict.
      // Explicit draft discard is not an authorization to reset rollback detection.
    }
    function encryptedBackup(){
      ensureIdle();
      if(!opened||!working||dirty||needsReview||needsRecovery)
        throw Error("Save or resolve accounting draft before encrypted backup");
      return bridge.encryptedBackup();
    }
    function close(){
      ensureIdle();
      if(dirty)throw Error("Preserve or explicitly discard unsaved accounting draft before closing");
      bridge.close();working=null;opened=false;needsReview=false;needsRecovery=false;
    }
    return Object.freeze({open:open,initializeNew:initializeNew,replaceLedger:replaceLedger,updateProgram:updateProgram,restoreLedgerBackup:restoreLedgerBackup,
      save:save,confirmOpenedRevision:confirmOpenedRevision,pendingDraft:pendingDraft,
      workspaceSnapshot:workspaceSnapshot,
      exportPendingDraftEncrypted:exportPendingDraftEncrypted,
      discardDraft:discardDraft,encryptedBackup:encryptedBackup,close:close,
      status:function(){return Object.freeze({opened:opened,dirty:dirty,
        requiresOwnerConfirmation:needsReview,needsRecovery:needsRecovery,
        ledgerCount:working?working.ledger.length:0});}});
  }
  var api=Object.freeze({createAccountingCoordinator:createAccountingCoordinator});
  if(root)root.IncomeOSRevisionAccountingCoordinator=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
}(typeof window!=="undefined"?window:globalThis));
