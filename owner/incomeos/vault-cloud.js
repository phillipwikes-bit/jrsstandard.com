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
  function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ("0"+b.toString(16)).slice(-2);}).join("");}
  async function sha256(text){return hex(await root.crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));}
  // The only shape accepted for upload: the workspace store's encrypted envelope with no readable workspace fields.
  function assertEncrypted(text){
    var o;try{o=JSON.parse(text);}catch(e){throw Error("Not an encrypted workspace");}
    var keys=o&&typeof o==="object"?Object.keys(o).sort().join(","):"";
    if(keys!=="cipher,data,format,iterations,iv,kdf,salt,version"||o.format!=="incomeos-workspace"||o.cipher!=="AES-256-GCM"||typeof o.data!=="string"||!/^[A-Za-z0-9+/=]+$/.test(o.data))
      throw Error("Refused: only an encrypted workspace can be sent to the vault");
    return o;
  }
  function email(x){x=String(x||"").trim();if(!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(x))throw Error("Enter a valid email address");return x;}
  function password(x){x=String(x||"");if(x.length<12)throw Error("Use a password of at least 12 characters");return x;}
  async function call(path,opts){
    opts=opts||{};
    var headers={"apikey":CONFIG.key,"Content-Type":"application/json"};
    if(opts.auth){if(!session)throw Error("Sign in to your vault first");headers.Authorization="Bearer "+session.access_token;}
    var res=await root.fetch(CONFIG.url+path,{method:opts.method||"GET",headers:headers,body:opts.body?JSON.stringify(opts.body):undefined,credentials:"omit",cache:"no-store",referrerPolicy:"no-referrer"});
    var text=await res.text(),data=null;try{data=text?JSON.parse(text):null;}catch(e){}
    if(!res.ok){var msg=data&&(data.msg||data.message||data.error_description||data.error)||("HTTP "+res.status);throw Error(String(msg).slice(0,200));}
    return data;
  }
  async function signUp(e,p){await call("/auth/v1/signup",{method:"POST",body:{email:email(e),password:password(p)}});return {ok:true};}
  async function signIn(e,p){
    var d=await call("/auth/v1/token?grant_type=password",{method:"POST",body:{email:email(e),password:password(p)}});
    if(!d||typeof d.access_token!=="string"||!d.user||typeof d.user.id!=="string")throw Error("Sign-in did not return a session");
    session={access_token:d.access_token,userId:d.user.id,email:d.user.email||""};return {ok:true,userId:session.userId};
  }
  function signOut(){session=null;}
  function signedIn(){return !!session;}
  async function save(text){
    assertEncrypted(text);
    if(text.length>5000000)throw Error("Encrypted workspace exceeds 5 MB");
    await call("/rest/v1/incomeos_vault",{method:"POST",auth:true,body:{format:CONFIG.format,ciphertext:text,sha256:await sha256(text)}});
    return {ok:true};
  }
  async function latest(){
    var rows=await call("/rest/v1/incomeos_vault?select=id,ciphertext,sha256,saved_at&order=saved_at.desc&limit=1",{auth:true});
    if(!Array.isArray(rows)||!rows.length)return null;
    var r=rows[0];
    if(typeof r.ciphertext!=="string"||(await sha256(r.ciphertext))!==r.sha256)throw Error("The vault copy failed its integrity check; it was not opened");
    assertEncrypted(r.ciphertext);
    return {text:r.ciphertext,savedAt:r.saved_at,id:r.id};
  }
  var api=Object.freeze({CONFIG:CONFIG,assertEncrypted:assertEncrypted,signUp:signUp,signIn:signIn,signOut:signOut,signedIn:signedIn,save:save,latest:latest});
  if(root)root.IncomeOSVaultCloud=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;

  // Panel wiring (browser only).
  if(typeof document==="undefined")return;
  var $=function(id){return document.getElementById(id);};
  function ask(name,detail){return new Promise(function(resolve){detail.done=resolve;document.dispatchEvent(new CustomEvent(name,{detail:detail}));setTimeout(function(){resolve({ok:false,error:"No workspace panel answered"});},15000);});}
  function init(){
    var st=$("cloud-vault-status");if(!st)return;
    function say(t){st.textContent=t;}
    function refresh(){var on=signedIn();$("cloud-vault-signin").hidden=on;$("cloud-vault-signup").hidden=on;$("cloud-vault-signout").hidden=!on;$("cloud-vault-save").disabled=!on;$("cloud-vault-restore").disabled=!on;$("cloud-vault-password").value=on?"":$("cloud-vault-password").value;}
    async function guard(fn){try{await fn();}catch(e){say("Vault: "+e.message);}refresh();}
    $("cloud-vault-signin").addEventListener("click",function(){guard(async function(){say("Signing in…");await signIn($("cloud-vault-email").value,$("cloud-vault-password").value);say("Signed in to your private vault for this visit only.");});});
    $("cloud-vault-signup").addEventListener("click",function(){guard(async function(){await signUp($("cloud-vault-email").value,$("cloud-vault-password").value);say("Account requested. Confirm it from the email Supabase sends, then sign in. The vault opens only after the owner account is approved.");});});
    $("cloud-vault-signout").addEventListener("click",function(){signOut();say("Signed out.");refresh();});
    $("cloud-vault-save").addEventListener("click",function(){guard(async function(){
      var r=await ask("incomeos:vault-encrypt",{});if(!r.ok)throw Error(r.error);
      say("Saving encrypted copy…");await save(r.text);document.dispatchEvent(new CustomEvent("incomeos:vault-saved"));say("Encrypted copy saved to your private vault.");});});
    $("cloud-vault-restore").addEventListener("click",function(){guard(async function(){
      say("Fetching your latest encrypted save…");var v=await latest();if(!v){say("Your vault has no saves yet.");return;}
      var r=await ask("incomeos:vault-open",{text:v.text});if(!r.ok)throw Error(r.error);say("Opened the vault copy saved "+String(v.savedAt).slice(0,16).replace("T"," ")+" UTC.");});});
    refresh();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
