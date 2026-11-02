"use strict";
(function () {
  // Unrouted adapter contract for a FUTURE private server. There is no deployed
  // financial endpoint. All authorization and persistence dependencies must be
  // trusted server-side implementations, never fields read from a browser body.
  // Public JRS production and the public study database must not mount it.
  function validHash(x){return typeof x==="string"&&/^[a-f0-9]{64}$/.test(x);}
  function response(status,body){
    return {status:status,headers:{"Cache-Control":"no-store, private, max-age=0",
      "Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer"},body:body};
  }
  function create(config) {
    if(!config||typeof config!=="object"||!/^https:\/\//.test(config.allowedOrigin||""))
      throw Error("A specific protected HTTPS origin is required");
    var services=["authenticate","approvedOwner","verifyCsrf","loadEvents","appendAtomic"];
    if(services.some(function(s){return typeof config[s]!=="function";}))throw Error("All security dependencies must be implemented server-side");
    if(!window.IncomeOSEventJournal)throw Error("Verified journal validation module required");
    var journal=window.IncomeOSEventJournal;
    return async function handle(req){
      if(!req||req.method!=="POST")return response(405,{status:"DENIED",reason:"METHOD_NOT_ALLOWED"});
      if(req.origin!==config.allowedOrigin)return response(403,{status:"DENIED",reason:"ORIGIN_NOT_ALLOWED"});
      if(req.contentType!=="application/json")return response(415,{status:"DENIED",reason:"UNSUPPORTED_CONTENT_TYPE"});
      var principal;
      try{principal=await config.authenticate(req);}catch(_e){return response(401,{status:"DENIED",reason:"AUTHENTICATION_REQUIRED"});}
      if(!principal||principal.verified!==true||typeof principal.subject!=="string"||principal.subject.length<8)
        return response(401,{status:"DENIED",reason:"AUTHENTICATION_REQUIRED"});
      var owner;
      try{owner=await config.approvedOwner(principal.subject);}
      catch(_e){return response(503,{status:"HOLD",reason:"OWNER_CHECK_UNAVAILABLE"});}
      if(owner!==true)return response(403,{status:"DENIED",reason:"NOT_APPROVED_OWNER"});
      var csrf=false;
      try{csrf=await config.verifyCsrf(req,principal);}
      catch(_e){csrf=false;}
      if(csrf!==true)return response(403,{status:"DENIED",reason:"CSRF_PROOF_REQUIRED"});
      if(!req.body||typeof req.body!=="object"||Array.isArray(req.body))
        return response(400,{status:"REJECTED",reason:"INVALID_REQUEST"});
      if(Object.keys(req.body).some(function(k){return k!=="event"&&k!=="expectedHeadHash";}))
        return response(400,{status:"REJECTED",reason:"UNEXPECTED_REQUEST_FIELDS"});
      var size=0;
      try{size=new TextEncoder().encode(JSON.stringify(req.body)).byteLength;}
      catch(_e){return response(400,{status:"REJECTED",reason:"INVALID_REQUEST"});}
      if(size>16000)return response(413,{status:"REJECTED",reason:"REQUEST_TOO_LARGE"});
      if(!validHash(req.body.expectedHeadHash))return response(400,{status:"REJECTED",reason:"INVALID_HEAD"});
      var normalized;
      try{normalized=journal.normalizeInput(req.body.event);}
      catch(_e){return response(400,{status:"REJECTED",reason:"INVALID_EVENT"});}
      var history,verified;
      try{
        history=await config.loadEvents(principal.subject);
        verified=await journal.verify(history);
      }catch(_e){return response(503,{status:"HOLD",reason:"SOURCE_HISTORY_NOT_VERIFIED"});}
      if(verified.headHash!==req.body.expectedHeadHash)
        return response(409,{status:"HOLD",reason:"STALE_JOURNAL_HEAD"});
      var next;
      try{next=await journal.append(history,normalized);}
      catch(_e){return response(409,{status:"HOLD",reason:"EVENT_VALIDATION_OR_ID_CONFLICT"});}
      var row=next[next.length-1];
      try{
        // MUST atomically enforce owner, previous head, seq and inserted hash.
        // The store must recheck all these under one database lock/transaction.
        var stored=await config.appendAtomic(principal.subject,row,verified.headHash);
        if(stored!==true)return response(409,{status:"HOLD",reason:"CONCURRENT_APPEND_OR_REJECTED"});
      }catch(_e){return response(503,{status:"HOLD",reason:"PERSISTENCE_UNAVAILABLE"});}
      return response(201,{status:"APPENDED_FOR_OWNER_REVIEW",eventId:row.id,sequence:row.seq,headHash:row.hash,
        independentlyBankVerified:false,readyForTaxFiling:false});
    };
  }
  window.IncomeOSServerAppend=Object.freeze({create:create});
}());