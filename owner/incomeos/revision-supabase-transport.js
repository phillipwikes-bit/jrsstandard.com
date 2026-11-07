"use strict";
/* Staging-only Supabase RPC transport. No embedded credentials, no automatic calls. */
(function(root){
  function createTransport(config){
    if(!config||typeof config.url!=="string"||!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(config.url)||
       typeof config.key!=="string"||!config.key||
       typeof config.getToken!=="function"||typeof config.fetch!=="function")
      throw Error("Explicit authenticated Supabase transport configuration required");
    async function rpc(name,body){
      var token=await config.getToken();
      if(typeof token!=="string"||!token)throw Error("Owner session required");
      var response=await config.fetch(config.url+"/rest/v1/rpc/"+name,{
        method:"POST",credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer",
        headers:{"apikey":config.key,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
        body:JSON.stringify(body||{})
      });
      if(!response||typeof response.ok!=="boolean")throw Error("Invalid RPC response");
      if(!response.ok)throw Error("Workspace RPC rejected request (HTTP "+response.status+")");
      return response.json();
    }
    return Object.freeze({
      latest:function(){return rpc("incomeos_latest_workspace_revision",{});},
      append:function(request){return rpc("incomeos_append_workspace_revision",request);}
    });
  }
  if(root)root.IncomeOSSupabaseRevisionTransport=Object.freeze({createTransport:createTransport});
  if(typeof module!=="undefined"&&module.exports)module.exports={createTransport:createTransport};
}(typeof window!=="undefined"?window:globalThis));
