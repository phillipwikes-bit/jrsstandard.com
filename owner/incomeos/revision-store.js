"use strict";
/* IncomeOS revision transport adapter. Staging only; never activates legacy vault writes.
   Requires an authenticated, owner-scoped transport supplied by the hosting application. */
(function(root){
  function createRevisionStore(transport,protocol,integrity){
    if(!transport||typeof transport.append!=="function"||typeof transport.latest!=="function")
      throw Error("Authenticated revision transport required");
    if(!protocol||typeof protocol.appendRequest!=="function"||typeof protocol.applyResult!=="function"||typeof protocol.recover!=="function")
      throw Error("Revision protocol required");
    // Fail closed if no SHA-256 digest provider is available. A stored checksum
    // is not independently verified merely because it has the correct format.
    var sha256=integrity&&integrity.sha256;
    if(typeof sha256!=="function")throw Error("Independent SHA-256 verifier required");
    async function verifyDigest(text,expected){
      var actual=await sha256(text);
      if(typeof actual!=="string"||!/^[0-9a-f]{64}$/.test(actual)||actual!==expected)
        throw Error("Encrypted workspace checksum mismatch");
    }
    var busy=false;
    var revision=null;
    // In-memory high-water mark survives failed reads/writes to detect server rollback.
    var highWaterRevision=null;
    // An append-only revision must retain the same ciphertext checksum whenever
    // the same revision is observed again, even after an uncertain network result.
    var highWaterSha=null;
    var confirmationRequired=false;
    function integer(n){return Number.isSafeInteger(n)&&n>=0&&n<Number.MAX_SAFE_INTEGER;}
    async function parseLatest(row){
      if(row===null)return {revision:0,text:null,sha256:null};
      if(!row||!integer(row.revision)||row.revision===0||typeof row.ciphertext!=="string"||
         typeof row.ciphertext_sha256!=="string"||!/^[0-9a-f]{64}$/.test(row.ciphertext_sha256))
        throw Error("Invalid server revision response");
      // Validate the returned encrypted envelope as strictly as an outgoing append.
      // A syntactically valid checksum alone does not establish a valid vault payload.
      protocol.appendRequest(row.revision-1,row.ciphertext,row.ciphertext_sha256);
      await verifyDigest(row.ciphertext,row.ciphertext_sha256);
      return {revision:row.revision,text:row.ciphertext,sha256:row.ciphertext_sha256};
    }
    async function refresh(){
      if(busy)throw Error("Revision operation already in progress");
      busy=true;
      try{
        var result=await parseLatest(await transport.latest());
        var baseline=revision!==null?revision:highWaterRevision;
        var recovery=baseline!==null?protocol.recover(baseline,result.revision):null;
        if(highWaterRevision!==null&&result.revision===highWaterRevision&&
           result.sha256!==highWaterSha)
          throw Error("Server returned different ciphertext for an already trusted revision");
        // Re-reading the same server value cannot silently clear an owner-review hold.
        confirmationRequired=confirmationRequired||!!(recovery&&recovery.requiresOwnerConfirmation);
        revision=result.revision;
        if(highWaterRevision===null||revision>highWaterRevision){
          highWaterRevision=revision;
          highWaterSha=result.sha256||null;
        }
        return Object.freeze(Object.assign({},result,{requiresOwnerConfirmation:confirmationRequired}));
      }catch(e){
        // A failed read must never leave a previously trusted revision usable.
        revision=null;
        // Do not forget the last trusted revision when a read fails.
        throw e;
      }finally{busy=false;}
    }
    async function append(ciphertext,sha256){
      if(busy)throw Error("Revision operation already in progress");
      if(revision===null)throw Error("Read server revision before saving");
      if(confirmationRequired)throw Error("Owner confirmation required before saving newer server revision");
      busy=true;
      try{
        var expected=revision;
        var request=protocol.appendRequest(expected,ciphertext,sha256);
        await verifyDigest(request.encrypted_payload,request.payload_sha256);
        var next=await transport.append(request);
        revision=protocol.applyResult(expected,next);
        highWaterRevision=revision;
        highWaterSha=request.payload_sha256;
        return Object.freeze({revision:revision});
      }catch(e){
        // Any uncertain write outcome, including timeout, forces a fresh read.
        revision=null;
        throw e;
      }finally{busy=false;}
    }
    // Closing the editor revokes read/write authorization without erasing the
    // last trusted server revision or any outstanding owner-review hold.
    // This detects replay/rollback when the same signed-in owner reopens the
    // workspace. No revision or plaintext is persisted to browser storage.
    function suspend(){
      if(busy)throw Error("Cannot suspend an in-flight revision operation");
      revision=null;
    }
    function reset(){if(busy)throw Error("Cannot reset an in-flight revision operation");revision=null;highWaterRevision=null;highWaterSha=null;confirmationRequired=false;}
    function confirmRevision(value){
      if(busy)throw Error("Cannot confirm an in-flight revision operation");
      if(revision===null||!integer(value)||value!==revision)throw Error("Revision confirmation mismatch");
      confirmationRequired=false;
    }
    return Object.freeze({refresh:refresh,append:append,suspend:suspend,reset:reset,confirmRevision:confirmRevision,requiresOwnerConfirmation:function(){return confirmationRequired;},currentRevision:function(){return revision;},highestObservedRevision:function(){return highWaterRevision;}});
  }
  if(root)root.IncomeOSRevisionStore=Object.freeze({createRevisionStore:createRevisionStore});
  if(typeof module!=="undefined"&&module.exports)module.exports={createRevisionStore:createRevisionStore};
}(typeof window!=="undefined"?window:globalThis));
