"use strict";
/* IncomeOS revision transport adapter. Staging only; never activates legacy vault writes.
   Requires an authenticated, owner-scoped transport supplied by the hosting application. */
(function(root){
  function createRevisionStore(transport,protocol){
    if(!transport||typeof transport.append!=="function"||typeof transport.latest!=="function")
      throw Error("Authenticated revision transport required");
    if(!protocol||typeof protocol.appendRequest!=="function"||typeof protocol.applyResult!=="function"||typeof protocol.recover!=="function")
      throw Error("Revision protocol required");
    var busy=false;
    var revision=null;
    var confirmationRequired=false;
    function integer(n){return Number.isSafeInteger(n)&&n>=0&&n<Number.MAX_SAFE_INTEGER;}
    function parseLatest(row){
      if(row===null)return {revision:0,text:null};
      if(!row||!integer(row.revision)||row.revision===0||typeof row.ciphertext!=="string"||
         typeof row.ciphertext_sha256!=="string"||!/^[0-9a-f]{64}$/.test(row.ciphertext_sha256))
        throw Error("Invalid server revision response");
      return {revision:row.revision,text:row.ciphertext,sha256:row.ciphertext_sha256};
    }
    async function refresh(){
      if(busy)throw Error("Revision operation already in progress");
      busy=true;
      try{
        var result=parseLatest(await transport.latest());
        var recovery=revision!==null?protocol.recover(revision,result.revision):null;
        confirmationRequired=!!(recovery&&recovery.requiresOwnerConfirmation);
        revision=result.revision;
        return Object.freeze(Object.assign({},result,{requiresOwnerConfirmation:confirmationRequired}));
      }catch(e){
        // A failed read must never leave a previously trusted revision usable.
        revision=null;
        confirmationRequired=false;
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
        var next=await transport.append(request);
        revision=protocol.applyResult(expected,next);
        return Object.freeze({revision:revision});
      }catch(e){
        // Any uncertain write outcome, including timeout, forces a fresh read.
        revision=null;
        throw e;
      }finally{busy=false;}
    }
    function reset(){if(busy)throw Error("Cannot reset an in-flight revision operation");revision=null;confirmationRequired=false;}
    function confirmRevision(value){
      if(busy)throw Error("Cannot confirm an in-flight revision operation");
      if(revision===null||!integer(value)||value!==revision)throw Error("Revision confirmation mismatch");
      confirmationRequired=false;
    }
    return Object.freeze({refresh:refresh,append:append,reset:reset,confirmRevision:confirmRevision,requiresOwnerConfirmation:function(){return confirmationRequired;},currentRevision:function(){return revision;}});
  }
  if(root)root.IncomeOSRevisionStore=Object.freeze({createRevisionStore:createRevisionStore});
  if(typeof module!=="undefined"&&module.exports)module.exports={createRevisionStore:createRevisionStore};
}(typeof window!=="undefined"?window:globalThis));
