"use strict";
(function(root){
  // IncomeOS secure persistent application profile: client for a PRIVATE
  // Supabase project protected by OWNER-PROFILE-SCHEMA.sql (row-level security,
  // single enrolled owner). DISABLED until configured with that project's URL
  // and publishable key: with no configuration every call reports
  // BACKEND_NOT_CONFIGURED and the app keeps its session-only profile.
  //
  // - Sign-in: emailed one-time code for an EXISTING user (create_user:false);
  //   no public registration from this client.
  // - Session: kept in page memory only; never written to browser storage.
  // - Ownership: enforced by the database (auth.uid() + allowed_owners). The
  //   application email is profile content and never proves ownership.
  // - Nothing here logs profile content.
  var VERSION="incomeos.profile-store.v1";
  function err(code,message){var e=Error(message||code);e.code=code;return e;}
  function isHttps(u){try{return new URL(u).protocol==="https:";}catch(e){return false;}}

  function validateProfile(p){
    if(!p||typeof p!=="object")throw err("INVALID_PROFILE","Profile required");
    var name=String(p.fullName||"").trim(),email=String(p.applicationEmail||"").trim(),li=p.linkedinUrl==null||p.linkedinUrl===""?null:String(p.linkedinUrl).trim();
    if(!name||name.length>120)throw err("INVALID_PROFILE","Enter your name (up to 120 characters)");
    if(email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw err("INVALID_PROFILE","Enter a valid application email");
    if(li!==null&&!/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9_-]{3,100}\/?$/.test(li))throw err("INVALID_PROFILE","LinkedIn must be an https://linkedin.com/in/... address");
    var q=Array.isArray(p.qualifications)?p.qualifications:String(p.qualifications||"").split(/\n/);
    // Cut by whole characters (never splitting an emoji) and stay well under the database's 16 KB limit.
    q=q.map(function(x){return String(x).trim();}).filter(Boolean).slice(0,30).map(function(x){return Array.from(x).slice(0,200).join("");});
    var bytes=typeof TextEncoder!=="undefined"?new TextEncoder().encode(JSON.stringify(q)).length:JSON.stringify(q).length*4;
    if(bytes>12000)throw err("INVALID_PROFILE","Qualifications are too long; shorten some entries");
    return {full_name:name,application_email:email,qualifications:q,linkedin_url:li};
  }
  function fromRow(r){return r?{fullName:r.full_name,applicationEmail:r.application_email,qualifications:Array.isArray(r.qualifications)?r.qualifications:[],linkedinUrl:r.linkedin_url||"",updatedAt:r.updated_at||null}:null;}

  function create(config,deps){
    deps=deps||{};
    var fetchFn=deps.fetch||(typeof fetch==="function"?fetch.bind(typeof window!=="undefined"?window:globalThis):null);
    var now=deps.now||function(){return Date.now();};
    var configured=!!(config&&isHttps(config.url)&&typeof config.publishableKey==="string"&&config.publishableKey.length>20);
    var base=configured?config.url.replace(/\/+$/,""):null,key=configured?config.publishableKey:null;
    var session=null;
    function need(){if(!configured)throw err("BACKEND_NOT_CONFIGURED","Secure profile storage is not set up yet. Your profile stays in this session only.");}
    async function call(path,opts,auth){
      need();
      var headers=Object.assign({"apikey":key,"Content-Type":"application/json"},opts.headers||{});
      if(auth){
        if(!session)throw err("NOT_SIGNED_IN","Sign in to load or save your profile.");
        if(session.expiresAt&&now()>=session.expiresAt*1000){session=null;throw err("SESSION_EXPIRED","Your session expired. Sign in again; nothing was saved.");}
        headers.Authorization="Bearer "+session.accessToken;
      }
      var res;
      try{res=await fetchFn(base+path,{method:opts.method||"GET",headers:headers,body:opts.body?JSON.stringify(opts.body):undefined,credentials:"omit",redirect:"error"});}
      catch(e){throw err("NETWORK","Could not reach secure storage. Nothing was changed.");}
      var text=await res.text(),json=null;try{json=text?JSON.parse(text):null;}catch(e){}
      if(res.status===401){session=null;throw err("SESSION_EXPIRED","Your session expired or was rejected. Sign in again; nothing was saved.");}
      if(res.status===403)throw err("FORBIDDEN","This account is not the enrolled owner. Access refused.");
      if(res.status<200||res.status>=300)throw err("SERVER_ERROR","Secure storage refused the request (HTTP "+res.status+"). Nothing was changed.");
      return json;
    }
    var tableHeaders={"Accept-Profile":"incomeos_private","Content-Profile":"incomeos_private"};
    return Object.freeze({
      configured:configured,
      signedIn:function(){return !!session;},
      // Sends a code only to an existing user; never creates an account.
      requestCode:async function(email){
        if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email||"")))throw err("INVALID_EMAIL","Enter your sign-in email");
        try{await call("/auth/v1/otp",{method:"POST",body:{email:String(email).trim(),create_user:false}},false);}
        catch(e){if(e.code==="NETWORK"||e.code==="BACKEND_NOT_CONFIGURED")throw e;throw err("CODE_NOT_SENT","No code was sent. Use the email of the enrolled owner account; new accounts cannot be created here.");}
        return {sent:true};
      },
      verifyCode:async function(email,code){
        if(!/^\d{6,10}$/.test(String(code||"")))throw err("INVALID_CODE","Enter the code from the email");
        var r;
        try{r=await call("/auth/v1/verify",{method:"POST",body:{type:"email",email:String(email).trim(),token:String(code)}},false);}
        catch(e){if(e.code==="NETWORK"||e.code==="BACKEND_NOT_CONFIGURED")throw e;throw err("INVALID_CODE","That code is wrong or has expired. Request a new code.");}
        if(!r||!r.access_token||!r.user||!r.user.id)throw err("SIGN_IN_FAILED","Sign-in was not confirmed.");
        session={accessToken:r.access_token,userId:r.user.id,expiresAt:Number(r.expires_at)||Math.floor(now()/1000)+Number(r.expires_in||3600)};
        return {userId:r.user.id};
      },
      signOut:function(){session=null;},
      load:async function(){
        var rows=await call("/rest/v1/application_profile?select=full_name,application_email,qualifications,linkedin_url,updated_at",{headers:tableHeaders},true);
        return fromRow(Array.isArray(rows)?rows[0]:null);
      },
      save:async function(profile){
        var row=validateProfile(profile);row.owner_id=session?session.userId:null;
        var rows=await call("/rest/v1/application_profile?on_conflict=owner_id",{method:"POST",body:row,headers:Object.assign({"Prefer":"resolution=merge-duplicates,return=representation"},tableHeaders)},true);
        if(!Array.isArray(rows)||rows.length!==1)throw err("SAVE_NOT_CONFIRMED","The save was not confirmed by secure storage. Try again.");
        return fromRow(rows[0]);
      },
      remove:async function(){
        if(!session)throw err("NOT_SIGNED_IN","Sign in to delete your profile.");
        var rows=await call("/rest/v1/application_profile?owner_id=eq."+encodeURIComponent(session.userId),{method:"DELETE",headers:Object.assign({"Prefer":"return=representation"},tableHeaders)},true);
        var check=await call("/rest/v1/application_profile?select=owner_id",{headers:tableHeaders},true);
        if(Array.isArray(check)&&check.length)throw err("DELETE_NOT_CONFIRMED","The profile still exists after deletion. Nothing is assumed deleted.");
        return {deleted:Array.isArray(rows)?rows.length:0};
      }
    });
  }
  var api=Object.freeze({VERSION:VERSION,create:create,validateProfile:validateProfile});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSProfileStore=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
