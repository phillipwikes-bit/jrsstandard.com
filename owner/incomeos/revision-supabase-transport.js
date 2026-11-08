"use strict";
/* Staging-only Supabase RPC transport. No embedded credentials, no automatic calls. */
(function(root){
  function createTransport(config){
    if(!config||typeof config.url!=="string"||!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(config.url)||
       typeof config.key!=="string"||!config.key||
       typeof config.getToken!=="function"||typeof config.fetch!=="function")
      throw Error("Explicit authenticated Supabase transport configuration required");
    // Retain the validated endpoint and providers, not the caller's mutable
    // configuration object. Token retrieval yields before request dispatch.
    config=Object.freeze({url:config.url,key:config.key,getToken:config.getToken,
      fetch:config.fetch,timeoutMs:config.timeoutMs});
    var timeoutMs=config.timeoutMs===undefined?30000:config.timeoutMs;
    if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)
      throw Error("Bounded RPC timeout required");
    async function rpc(name,body){
      var controller=typeof AbortController==="function"?new AbortController():null;
      var timer=null,timedOut=false,httpError=null;
      var timeoutError=Error("Workspace RPC timed out; outcome uncertain, reopen before saving");
      var sessionError=Error("Owner session required");
      try{
        // Snapshot the request before the authentication provider yields.
        var serializedBody=JSON.stringify(body||{});
        return await Promise.race([
          (async function(){
            var token=await config.getToken();
            // A late token must not initiate a request after the deadline.
            if(timedOut)throw timeoutError;
            if(typeof token!=="string"||!token)throw sessionError;
            var response=await config.fetch(config.url+"/rest/v1/rpc/"+name,{
              method:"POST",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",redirect:"error",
              headers:{"apikey":config.key,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
              body:serializedBody,signal:controller?controller.signal:undefined
            });
            if(!response||typeof response.ok!=="boolean")throw Error("Invalid RPC response");
            if(!response.ok){
              if(!Number.isInteger(response.status)||response.status<100||response.status>599)
                throw Error("Invalid RPC response");
              httpError=Error("Workspace RPC rejected request (HTTP "+response.status+")");
              httpError.status=response.status;throw httpError;
            }
            return await response.json();
          }()),
          new Promise(function(resolve,reject){
            timer=setTimeout(function(){
              timedOut=true;
              reject(timeoutError);
              if(controller)controller.abort();
            },timeoutMs);
          })
        ]);
      }catch(e){
        if(timedOut)throw timeoutError;
        if(e===sessionError)throw sessionError;
        if(httpError&&e===httpError)throw httpError;
        // Do not expose raw network/body/parser errors, which can echo secrets.
        throw Error("Workspace RPC failed; reopen to verify server state before saving");
      }finally{if(timer!==null)clearTimeout(timer);}
    }
    return Object.freeze({
      latest:function(){return rpc("incomeos_latest_workspace_revision",{});},
      append:function(request){return rpc("incomeos_append_workspace_revision",request);}
    });
  }
  if(root)root.IncomeOSSupabaseRevisionTransport=Object.freeze({createTransport:createTransport});
  if(typeof module!=="undefined"&&module.exports)module.exports={createTransport:createTransport};
}(typeof window!=="undefined"?window:globalThis));
