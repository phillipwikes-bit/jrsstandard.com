"use strict";
// Pure protocol client. No credentials, browser storage, network endpoints, or side effects.
(function(root){
  function revision(value){
    if(!Number.isSafeInteger(value)||value<0)throw Error("Invalid workspace revision");
    return value;
  }
  function checksum(value){
    if(typeof value!=="string"||!/^[a-f0-9]{64}$/.test(value))throw Error("Invalid SHA-256 checksum");
    return value;
  }
  function envelope(value){
    if(typeof value!=="string"||!value||new TextEncoder().encode(value).length>5000000)
      throw Error("Invalid encrypted workspace size");
    var vault=root&&root.IncomeOSVaultCloud;
    if(vault&&typeof vault.assertEncrypted==="function")vault.assertEncrypted(value);
    else {
      var obj;try{obj=JSON.parse(value);}catch{throw Error("Invalid encrypted workspace");}
      if(!obj||obj.format!=="incomeos-workspace"||obj.version!==1||obj.kdf!=="PBKDF2-SHA256"||
         obj.iterations!==600000||obj.cipher!=="AES-256-GCM"||
         Object.keys(obj).sort().join(",")!=="cipher,data,format,iterations,iv,kdf,salt,version")
        throw Error("Unsupported encrypted workspace");
    }
    return value;
  }
  function appendRequest(expectedRevision,ciphertext,sha256){
    return Object.freeze({expected_revision:revision(expectedRevision),encrypted_payload:envelope(ciphertext),payload_sha256:checksum(sha256)});
  }
  function applyResult(expectedRevision,returnedRevision){
    revision(expectedRevision);
    if(revision(returnedRevision)!==expectedRevision+1)throw Error("Unexpected server revision: quarantine pending edit");
    return returnedRevision;
  }
  function recover(currentRevision,serverRevision){
    revision(currentRevision);revision(serverRevision);
    if(serverRevision<currentRevision)throw Error("Server revision older than local revision: refuse overwrite");
    return Object.freeze({revision:serverRevision,requiresOwnerConfirmation:serverRevision!==currentRevision});
  }
  var api=Object.freeze({appendRequest:appendRequest,applyResult:applyResult,recover:recover});
  if(root)root.IncomeOSWorkspaceRevision=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
}(typeof window!=="undefined"?window:globalThis));
