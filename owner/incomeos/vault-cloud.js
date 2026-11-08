"use strict";
(function(root){
  // IncomeOS private vault (Supabase project "incomeos-private"). Stores ONLY the workspace file that was already
  // encrypted on this device (AES-256-GCM; the passphrase never leaves the device). Sign-in tokens are kept in page
  // memory only: nothing is written to browser storage. The database allows reads and new saves for the
  // allow-listed owner only; saves cannot be changed or deleted through this connection.
  var CONFIG=Object.freeze({
    url:"https://pmvqxdgvnwhckzxojioa.supabase.co",
    // Publishable key: designed to be public; access is decided by the database rules, not by this key.
    key:"sb_publishable_TmUlJHebPm895zoRuCGzng_RKtoAZ8s",
    format:"incomeos-workspace-encrypted-v1"
  });
  var session=null;
  var sessionEpoch=0;
  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");}
  async function sha256(text){return hex(await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));}
  // The only shape accepted for upload: the workspace store's encrypted envelope with no readable workspace fields.
  function assertEncrypted(text){
    var o;try{o=JSON.parse(text);}catch(e){throw Error("Not an encrypted workspace");}
    var keys=o&&typeof o==="object"?Object.keys(o).sort().join(","):"";
    if(keys!=="cipher,data,format,iterations,iv,kdf,salt,version"||o.format!=="incomeos-workspace"||o.version!==1||o.kdf!=="PBKDF2-SHA256"||o.iterations!==600000||o.cipher!=="AES-256-GCM"||typeof o.data!=="string"||!/^[A-Za-z0-9+/=]+$/.test(o.data)||!o.data.length||typeof o.salt!=="string"||!/^[A-Za-z0-9+/]{22}==$/.test(o.salt)||typeof o.iv!=="string"||!/^[A-Za-z0-9+/]{16}$/.test(o.iv))
      throw Error("Refused: only an encrypted workspace can be sent to the vault");
    return o;
  }
  function email(x){x=String(x||"").trim();if(!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(x))throw Error("Enter a valid email address");return x;}
  function password(x){x=String(x||"");if(x.length<12)throw Error("Use a password of at least 12 characters");return x;}
  async function call(path,opts){
    opts=opts||{};
    var requestEpoch=sessionEpoch;
    var headers={"apikey":CONFIG.key,"Content-Type":"application/json"};
    if(opts.auth){if(!session)throw Error("Sign in to your vault first");headers.Authorization="Bearer "+session.access_token;}
    var res=await root.fetch(CONFIG.url+path,{method:opts.method||"GET",headers:headers,body:opts.body?JSON.stringify(opts.body):undefined,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer"});
    var text=await res.text(),data=null;
    if(opts.auth&&requestEpoch!==sessionEpoch)throw Error("Vault session changed during request");
    try{data=text?JSON.parse(text):null;}catch(e){}
    if(!res.ok){var msg=data&&(data.msg||data.message||data.error_description||data.error)||("HTTP "+res.status);throw Error(String(msg).slice(0,200));}
    return data;
  }
  async function signUp(e,p){await call("/auth/v1/signup",{method:"POST",body:{email:email(e),password:password(p)}});return {ok:true};}
  async function signIn(e,p){
    // A failed or interrupted sign-in must not retain an earlier owner session.
    session=null;
    var epoch=++sessionEpoch;
    var d=await call("/auth/v1/token?grant_type=password",{method:"POST",body:{email:email(e),password:password(p)}});
    if(epoch!==sessionEpoch)throw Error("Sign-in was cancelled");
    if(!d||typeof d.access_token!=="string"||!d.user||typeof d.user.id!=="string")throw Error("Sign-in did not return a session");
    session={access_token:d.access_token,userId:d.user.id,email:d.user.email||""};return {ok:true,userId:session.userId};
  }
  function signOut(){
    sessionEpoch++;session=null;
    // Revocation is immediate. Clear any passphrase retained in the local
    // workspace form, but do not silently discard unsaved financial edits.
    // Local plaintext remains in page memory until the page is reloaded.
    var doc=root&&root.document;
    var pass=doc&&doc.getElementById&&doc.getElementById("briefing-passphrase");
    if(pass)pass.value="";
  }
  function signedIn(){return !!session;}
  async function save(text){
    assertEncrypted(text);
    if(text.length>5000000)throw Error("Encrypted workspace exceeds 5 MB");
    if(!session)throw Error("Sign in to your vault first");
    var epoch=sessionEpoch;
    var digest=await sha256(text);
    if(epoch!==sessionEpoch||!session)throw Error("Vault session changed during request");
    await call("/rest/v1/incomeos_vault",{method:"POST",auth:true,body:{format:CONFIG.format,ciphertext:text,sha256:digest}});
    if(epoch!==sessionEpoch)throw Error("Vault session changed during request");
    return {ok:true};
  }
  async function latest(){
    if(!session)throw Error("Sign in to your vault first");
    var epoch=sessionEpoch;
    var rows=await call("/rest/v1/incomeos_vault?select=id,ciphertext,sha256,saved_at&order=saved_at.desc,id.desc&limit=1",{auth:true});
    if(!Array.isArray(rows)||!rows.length)return null;
    var r=rows[0];
    if(typeof r.ciphertext!=="string"||r.ciphertext.length>5000000)throw Error("The vault copy is missing or exceeds the 5 MB encrypted workspace limit");
    var digest=await sha256(r.ciphertext);
    if(epoch!==sessionEpoch||!session)throw Error("Vault session changed during request");
    if(digest!==r.sha256)throw Error("The vault copy failed its integrity check; it was not opened");
    assertEncrypted(r.ciphertext);
    if(epoch!==sessionEpoch||!session)throw Error("Vault session changed during request");
    return {text:r.ciphertext,savedAt:r.saved_at,id:r.id};
  }
  // Staging composition only. The revision client is not loaded by the live Owner Desk.
  // Keep the bearer token private to this closure and invalidate in-flight results
  // when the owner signs out or another session replaces the current one.
  function createRevisionTransport(){
    var factory=root&&root.IncomeOSSupabaseRevisionTransport&&root.IncomeOSSupabaseRevisionTransport.createTransport;
    if(typeof factory!=="function")throw Error("Staged revision transport is unavailable");
    if(!session)throw Error("Sign in to your vault first");
    var boundEpoch=sessionEpoch,boundUser=session.userId;
    var transport=factory({
      url:CONFIG.url,key:CONFIG.key,
      getToken:async function(){
        return session&&sessionEpoch===boundEpoch&&session.userId===boundUser?session.access_token:null;
      },
      fetch:function(url,options){return root.fetch(url,options);}
    });
    function assertSession(){
      if(!session||sessionEpoch!==boundEpoch||session.userId!==boundUser)
        throw Error("Vault session changed; create a new revision transport after sign-in");
      return true;
    }
    async function guarded(method,request){
      assertSession();
      var epoch=sessionEpoch;
      try{
        var result=method==="latest"?await transport.latest():await transport.append(request);
        if(epoch!==sessionEpoch)throw Error("Vault session changed during request");
        return result;
      }catch(e){
        if(epoch!==sessionEpoch)throw Error("Vault session changed during request");
        throw e;
      }
    }
    return Object.freeze({
      latest:function(){return guarded("latest");},
      append:function(request){return guarded("append",request);},
      // Credential-free session check for expensive local decrypt/encrypt work.
      // No token, user ID or session epoch is exposed to callers.
      assertSession:assertSession
    });
  }
  var api=Object.freeze({CONFIG:CONFIG,assertEncrypted:assertEncrypted,signUp:signUp,signIn:signIn,signOut:signOut,signedIn:signedIn,save:save,latest:latest,createRevisionTransport:createRevisionTransport});
  if(root)root.IncomeOSVaultCloud=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;

  // Panel wiring (browser only).
  if(typeof document==="undefined")return;
  var $=function(id){return document.getElementById(id);};
  function ask(name,detail){
    return new Promise(function(resolve){
      var settled=false,expired=false,timer=null;
      var assertOwner=detail.assertSession;
      // The deadline applies to the local cryptographic handoff, not only
      // its caller. A delayed PBKDF2/AES completion may not install plaintext
      // or submit an encrypted upload after the vault reports a timeout.
      if(typeof assertOwner==="function")detail.assertSession=function(){
        if(expired)throw Error("Vault workspace handoff expired");
        return assertOwner();
      };
      detail.done=function(value){
        if(settled)return;
        settled=true;
        if(timer!==null)clearTimeout(timer);
        resolve(value);
      };
      timer=setTimeout(function(){
        if(settled)return;
        expired=true;
        detail.done({ok:false,error:"Workspace handoff timed out; no vault operation was accepted"});
      },15000);
      try{document.dispatchEvent(new CustomEvent(name,{detail:detail}));}
      catch(e){detail.done({ok:false,error:"Workspace panel unavailable"});}
    });
  }
  function init(){
    var st=$("cloud-vault-status");if(!st)return;
    function say(t){st.textContent=t;}
    // Bind the entire local encrypt/decrypt handoff to the authenticated
    // session that initiated it, not just the HTTP request. The callback
    // exposes no token, owner identifier or epoch to another module.
    function sessionAssertion(){
      if(!session)throw Error("Sign in to your vault first");
      var epoch=sessionEpoch,userId=session.userId;
      return function(){
        if(!session||sessionEpoch!==epoch||session.userId!==userId)
          throw Error("Vault session changed during workspace operation");
      };
    }
    var saving=false;
    function refresh(){var on=signedIn();$("cloud-vault-signin").hidden=on;$("cloud-vault-signup").hidden=on;$("cloud-vault-signout").hidden=!on;$("cloud-vault-save").disabled=!on||saving;$("cloud-vault-restore").disabled=!on||saving;$("cloud-vault-password").value=on?"":$("cloud-vault-password").value;}
    async function guard(fn){try{await fn();}catch(e){say("Vault: "+e.message);}refresh();}
    $("cloud-vault-signin").addEventListener("click",function(){guard(async function(){say("Signing in…");await signIn($("cloud-vault-email").value,$("cloud-vault-password").value);say("Signed in to your private vault for this visit only.");});});
    $("cloud-vault-signup").addEventListener("click",function(){guard(async function(){await signUp($("cloud-vault-email").value,$("cloud-vault-password").value);say("Account requested. Confirm it from the email Supabase sends, then sign in. The vault opens only after the owner account is approved.");});});
    $("cloud-vault-signout").addEventListener("click",function(){signOut();say("Private vault signed out. Your loaded workspace may remain visible in this tab. Reload or close this page to clear it; save unsaved changes securely first.");refresh();});
    $("cloud-vault-save").addEventListener("click",function(){
      // A second upload cannot overtake an earlier encrypted snapshot and
      // make the latest vault copy older than the owner's last save.
      if(saving)return;
      saving=true;refresh();
      guard(async function(){
        var verify=sessionAssertion();
        var r=await ask("incomeos:vault-encrypt",{assertSession:verify});if(!r.ok)throw Error(r.error);
        verify();
        say("Saving encrypted copy…");await save(r.text);
        verify();
        document.dispatchEvent(new CustomEvent("incomeos:vault-saved",{detail:{saveId:r.saveId}}));
        say("Encrypted copy saved to your private vault.");
      }).finally(function(){saving=false;refresh();});
    });
    $("cloud-vault-restore").addEventListener("click",function(){guard(async function(){
      var verify=sessionAssertion();
      say("Fetching your latest encrypted save…");var v=await latest();verify();if(!v){say("Your vault has no saves yet.");return;}
      var r=await ask("incomeos:vault-open",{text:v.text,assertSession:verify});if(!r.ok)throw Error(r.error);
      verify();say("Opened the vault copy saved "+String(v.savedAt).slice(0,16).replace("T"," ")+" UTC.");});});
    refresh();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
