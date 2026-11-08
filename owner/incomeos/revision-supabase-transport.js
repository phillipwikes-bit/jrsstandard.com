"use strict";
/* Staging-only Supabase RPC transport. No embedded credentials, no automatic calls. */
(function(root){
  function createTransport(config){
    if(!config||typeof config.url!=="string"||!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(config.url)||
       typeof config.key!=="string"||!config.key||
       typeof config.getToken!=="function"||typeof config.fetch!=="function")
      throw Error("Explicit authenticated Supabase transport configuration required");
    var timeoutMs=config.timeoutMs===undefined?30000:config.timeoutMs;
    if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)
      throw Error("Bounded RPC timeout required");
    async function rpc(name,body){
      var token=await config.getToken();
      if(typeof token!=="string"||!token)throw Error("Owner session required");
      var controller=typeof AbortController==="function"?new AbortController():null;
      var timer=null,timedOut=false;
      var timeoutError=Error("Workspace RPC timed out; outcome uncertain, reopen before saving");
      try{
        return await Promise.race([
          (async function(){
            var response=await config.fetch(config.url+"/rest/v1/rpc/"+name,{
              method:"POST",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
              headers:{"apikey":config.key,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
              body:JSON.stringify(body||{}),signal:controller?controller.signal:undefined
            });
            if(!response||typeof response.ok!=="boolean")throw Error("Invalid RPC response");
            if(!response.ok){
              var rejected=Error("Workspace RPC rejected request (HTTP "+response.status+")");
              rejected.status=response.status;throw rejected;
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
        if(e&&Number.isInteger(e.status))throw e;
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
