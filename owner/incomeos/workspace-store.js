"use strict";
(function(root){
  // IncomeOS workspace file: owner-held, optionally passphrase-encrypted.
  // Updates are pure functions that return a NEW workspace plus a change-log
  // entry; every change goes through the engine that owns its rules (ledger
  // rules, claims lifecycle, net-worth sources). Nothing here touches browser
  // storage or the network: the owner saves the returned file themselves.
  // Encryption matches vault.js: PBKDF2-SHA256 (600,000 iterations) and AES-256-GCM.
  var FORMAT="incomeos-workspace",ITERATIONS=600000,SCHEMA="incomeos.workspace.v1";
  var KEYS=["schema","note","ledger","rules","accounts","balances","claims","livedInStates","searchHistory","serviceNotes","offers","yieldParams","researchStages","recruiterOf","verifiedPayments","lifecycle","previousAlertIds","changeLog"];
  var dep=function(name,file){return root&&root[name]||(typeof require==="function"?require(file):null);};
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function arr(x){return Array.isArray(x)?x:[];}

  function validate(doc){
    if(!doc||typeof doc!=="object"||Array.isArray(doc)||doc.schema!==SCHEMA)throw Error("Expected an "+SCHEMA+" file.");
    var extra=Object.keys(doc).filter(function(k){return KEYS.indexOf(k)<0;});
    if(extra.length)throw Error("Unrecognized sections: "+extra.slice(0,5).join(", "));
    KEYS.forEach(function(k){if(Array.isArray(doc[k])&&doc[k].length>20000)throw Error(k+" has too many rows.");});
    return doc;
  }
  function log(ws,action,detail,on){
    ws.changeLog=arr(ws.changeLog).concat([{on:on,action:action,detail:detail}]).slice(-5000);
    return ws;
  }

  // Accept one categorization proposal: the ledger entry is replaced (or split) and the change is logged.
  function acceptProposal(ws,proposal,on){
    var LR=dep("IncomeOSLedgerRules","./ledger-rules.js");
    if(!isDate(on))throw Error("Date required");
    var next=clone(validate(ws)),i=arr(next.ledger).findIndex(function(e){return e&&e.id===proposal.entryId;});
    if(i<0)throw Error("Ledger entry not found");
    var res=LR.apply(next.ledger[i],proposal,on);
    next.ledger.splice.apply(next.ledger,[i,1].concat(res.entries));
    return log(next,"ACCEPT_CATEGORY_PROPOSAL",res.audit,on);
  }
  // Advance a claim through the claims lifecycle (evidence required by the engine).
  function advanceClaim(ws,claimId,t){
    var CL=dep("IncomeOSClaims","./claims-tracker.js");
    var next=clone(validate(ws)),i=arr(next.claims).findIndex(function(c){return c&&c.id===claimId;});
    if(i<0)throw Error("Claim not found");
    var r=CL.transition(next.claims[i],t);
    if(!r.ok)throw Error(r.error);
    next.claims[i]=r.claim;
    return log(next,"ADVANCE_CLAIM",{claimId:claimId,to:t.to,evidenceRef:t.evidenceRef},t.on);
  }
  function openClaim(ws,x){
    var CL=dep("IncomeOSClaims","./claims-tracker.js");
    var next=clone(validate(ws));next.claims=arr(next.claims);
    if(next.claims.some(function(c){return c.id===x.id;}))throw Error("Claim id already exists");
    next.claims.push(CL.create(x));
    return log(next,"OPEN_CLAIM",{claimId:x.id,kind:x.kind},x.openedOn);
  }
  // Record an official search the owner performed. A match opens a claim at MATCH_FOUND.
  function recordSearch(ws,sourceId,on,found,evidenceRef){
    if(!isDate(on))throw Error("Date required");
    if(typeof sourceId!=="string"||!sourceId)throw Error("Source required");
    var next=clone(validate(ws));
    next.searchHistory=arr(next.searchHistory).concat([{sourceId:sourceId,searchedOn:on,found:found===true}]);
    log(next,"RECORD_SEARCH",{sourceId:sourceId,found:found===true},on);
    if(found===true){
      if(typeof evidenceRef!=="string"||!evidenceRef.trim())throw Error("Describe what was found (reference)");
      var id="claim-"+sourceId+"-"+on;
      next=openClaim(next,{id:id,kind:"unclaimed_property",title:"Match on "+sourceId,openedOn:on,sourceId:sourceId});
      next=advanceClaim(next,id,{to:"MATCH_FOUND",on:on,evidenceRef:evidenceRef});
    }
    return next;
  }
  // Add a dated, sourced balance. The net-worth engine decides whether it is usable.
  function addBalance(ws,b){
    var next=clone(validate(ws));
    if(!arr(next.accounts).some(function(a){return a.id===b.accountId;}))throw Error("Unknown account");
    if(!isDate(b.asOf))throw Error("Balance date required");
    if(!Number.isFinite(Number(b.balanceUsd)))throw Error("Amount required");
    if(["statement","institution_export","appraisal","owner_estimate"].indexOf(b.source)<0)throw Error("Source type required");
    if(typeof b.sourceRef!=="string"||!b.sourceRef.trim())throw Error("Say where the statement is kept");
    next.balances=arr(next.balances).concat([{accountId:b.accountId,asOf:b.asOf,balanceUsd:String(b.balanceUsd),source:b.source,sourceRef:b.sourceRef.trim().slice(0,120)}]);
    return log(next,"ADD_BALANCE",{accountId:b.accountId,asOf:b.asOf},b.asOf);
  }
  // Mark this week's eligible opportunities as already reported so they do not re-notify.
  function markAlerted(ws,ids,on){
    var next=clone(validate(ws)),set={};
    arr(next.previousAlertIds).concat(arr(ids)).forEach(function(id){if(typeof id==="string")set[id]=1;});
    next.previousAlertIds=Object.keys(set).slice(-5000);
    return log(next,"MARK_ALERTED",{count:arr(ids).length},on);
  }

  // ---------- encryption ----------
  var enc=typeof TextEncoder!=="undefined"?new TextEncoder():null,dec=typeof TextDecoder!=="undefined"?new TextDecoder("utf-8",{fatal:true}):null;
  function b64(bytes){var s="";for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);return btoa(s);}
  function unb64(v){var s=atob(v),out=new Uint8Array(s.length);for(var i=0;i<s.length;i++)out[i]=s.charCodeAt(i);return out;}
  function pass(p){if(typeof p!=="string"||p.length<16||p.length>1024)throw Error("Use a passphrase of at least 16 characters.");return p;}
  async function deriveKey(p,salt){
    var m=await crypto.subtle.importKey("raw",enc.encode(pass(p)),{name:"PBKDF2"},false,["deriveKey"]);
    return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:ITERATIONS,hash:"SHA-256"},m,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  async function encrypt(p,ws){
    validate(ws);
    var salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),plain=enc.encode(JSON.stringify(ws));
    if(plain.byteLength>5000000)throw Error("Workspace exceeds 5 MB.");
    var ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv:iv},await deriveKey(p,salt),plain));
    return JSON.stringify({format:FORMAT,version:1,kdf:"PBKDF2-SHA256",iterations:ITERATIONS,cipher:"AES-256-GCM",salt:b64(salt),iv:b64(iv),data:b64(ct)});
  }
  function isEncrypted(text){try{var o=JSON.parse(text);return !!(o&&o.format===FORMAT);}catch(e){return false;}}
  async function decrypt(p,text){
    var o=JSON.parse(text);
    if(!o||o.format!==FORMAT||o.version!==1||o.kdf!=="PBKDF2-SHA256"||o.cipher!=="AES-256-GCM"||o.iterations!==ITERATIONS)throw Error("Unrecognized encrypted workspace format.");
    var salt=unb64(o.salt),iv=unb64(o.iv);
    if(salt.byteLength!==16||iv.byteLength!==12)throw Error("Invalid encryption parameters.");
    var plain;
    try{plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:iv},await deriveKey(p,salt),unb64(o.data));}
    catch(e){if(/passphrase/.test(e.message))throw e;throw Error("Wrong passphrase or damaged file.");}
    return validate(JSON.parse(dec.decode(plain)));
  }
  // Read either a plain or an encrypted workspace file's text.
  async function load(text,passphrase){
    if(typeof text!=="string"||text.length>8000000)throw Error("Workspace file is missing or too large.");
    if(isEncrypted(text)){if(!passphrase)throw Error("This workspace is encrypted. Enter its passphrase.");return decrypt(passphrase,text);}
    return validate(JSON.parse(text));
  }
  var api=Object.freeze({SCHEMA:SCHEMA,KEYS:KEYS.slice(),validate:validate,acceptProposal:acceptProposal,advanceClaim:advanceClaim,openClaim:openClaim,recordSearch:recordSearch,
    addBalance:addBalance,markAlerted:markAlerted,encrypt:encrypt,decrypt:decrypt,isEncrypted:isEncrypted,load:load});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSWorkspace=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
