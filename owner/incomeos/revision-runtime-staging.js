"use strict";
/* Staging-only composition of the existing IncomeOS vault login, RPC transport,
   authoritative revision store, and encrypted owner workspace. Not loaded by
   index.html. No automatic reads, writes, authentication, or deployment. */
(function(root){
  function createRuntime(options){
    if(!options||options.stagingOnly!==true)
      throw Error("Explicit staging-only revision runtime authorization required");
    var vault=root&&root.IncomeOSVaultCloud,
      protocol=root&&root.IncomeOSWorkspaceRevision,
      store=root&&root.IncomeOSRevisionStore,
      bridge=root&&root.IncomeOSWorkspaceRevisionBridge,
      workspace=root&&root.IncomeOSWorkspace;
    if(!vault||typeof vault.signedIn!=="function"||!vault.signedIn()||
       typeof vault.createRevisionTransport!=="function")
      throw Error("Authenticated owner vault session required");
    if(!protocol||!store||typeof store.createRevisionStore!=="function"||
       !bridge||typeof bridge.createWorkspaceBridge!=="function"||
       !workspace||typeof workspace.decrypt!=="function"||
       !root.crypto||!root.crypto.subtle||typeof root.crypto.subtle.digest!=="function"||
       typeof root.TextEncoder!=="function")
      throw Error("Verified encrypted revision runtime dependencies required");
    var digest=async function(text){
      if(typeof text!=="string")throw Error("SHA-256 requires encrypted workspace text");
      var bytes=new root.TextEncoder().encode(text);
      var hash=await root.crypto.subtle.digest("SHA-256",bytes);
      return Array.prototype.map.call(new Uint8Array(hash),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");
    };
    var integrity=Object.freeze({sha256:digest});
    return bridge.createWorkspaceBridge(
      store.createRevisionStore(vault.createRevisionTransport(),protocol,integrity),
      workspace,integrity
    );
  }
  // Compose the tested accountant, authoritative workspace and revision bridge.
  // This is staging-only and is deliberately not loaded by index.html: the
  // revision RPC has not been migrated to the live owner vault. There is no
  // browser-triggered save, background synchronization or plaintext store.
  function createAccountingRuntime(options){
    if(!options||options.stagingOnly!==true)
      throw Error("Explicit staging-only accounting runtime authorization required");
    var coordinator=root&&root.IncomeOSRevisionAccountingCoordinator,
      accountant=root&&root.IncomeOSAccountant,
      workspace=root&&root.IncomeOSWorkspace;
    if(!coordinator||typeof coordinator.createAccountingCoordinator!=="function"||
       !accountant||typeof accountant.validateEntry!=="function"||
       !workspace||typeof workspace.setLedger!=="function")
      throw Error("Verified existing accountant, workspace and coordinator required");
    return coordinator.createAccountingCoordinator(createRuntime(options),workspace,accountant);
  }
  var api=Object.freeze({createRuntime:createRuntime,createAccountingRuntime:createAccountingRuntime});
  if(root)root.IncomeOSRevisionRuntime=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
}(typeof window!=="undefined"?window:globalThis));
