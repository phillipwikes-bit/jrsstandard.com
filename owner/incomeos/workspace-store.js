"use strict";
(function(root){
  // IncomeOS workspace file: owner-held, optionally passphrase-encrypted.
  // Updates are pure functions that return a NEW workspace plus a change-log
  // entry; every change goes through the engine that owns its rules (ledger
  // rules, claims lifecycle, net-worth sources). Nothing here touches browser
  // storage or the network: the owner saves the returned file themselves.
  // Encryption matches vault.js: PBKDF2-SHA256 (600,000 iterations) and AES-256-GCM.
  var FORMAT="incomeos-workspace",ITERATIONS=600000,SCHEMA="incomeos.workspace.v1";
  var KEYS=["schema","note","ledger","rules","accounts","balances","claims","livedInStates","searchHistory","serviceNotes","offers","yieldParams","researchStages","recruiterOf","verifiedPayments","lifecycle","previousAlertIds","changeLog","researchTimes","dsProgram"];
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
  var PROFILE_SCHEMA="incomeos.owner-profile.v1";
  function validateDoc(doc){
    if(doc&&doc.schema===PROFILE_SCHEMA){if(typeof doc!=="object"||Array.isArray(doc))throw Error("Invalid profile");return doc;}
    return validate(doc);
  }
  function newWorkspace(on){
    return {schema:SCHEMA,note:"Private IncomeOS workspace created "+(isDate(on)?on:"")+". Keep outside the repository; save encrypted.",
      ledger:[],rules:[],accounts:[],balances:[],claims:[],livedInStates:["MD"],searchHistory:[],serviceNotes:[],offers:[],
      yieldParams:{amountUsd:0,horizonMonths:12,federalRatePct:0,stateRatePct:0,needLiquidity:true},researchStages:[],recruiterOf:{},verifiedPayments:{},lifecycle:[],previousAlertIds:[],changeLog:[],researchTimes:{}};
  }
  var ACCOUNT_TYPES=["checking","savings","money_market","cd","treasury","brokerage","retirement","hsa","real_estate","vehicle","receivable","other_asset","credit_card","mortgage","auto_loan","student_loan","personal_loan","tax_owed","other_liability"];
  var INCOME_CATS=["research","evaluation","business","royalty","rental","interest","dividend","investment","reward","recovery","employment","pension","retirement","socialsecurity","unemployment","other"];
  var COST_CATS=["platform","software","equipment","internet","travel","training","professional","supplies","investing","tax","homeoffice","advertising","other"];
  function money(x){var s=String(x==null?"":x).trim();if(!/^\d{1,9}(\.\d{1,2})?$/.test(s)||Number(s)<=0)throw Error("Enter a positive amount like 85.00");return Number(s).toFixed(2);}
  function text(x,max,what){var s=String(x==null?"":x).trim();if(!s)throw Error(what+" is required");return s.slice(0,max);}
  function slug(x){return String(x).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"item";}
  // Add one record to a section, validated for that section. Returns the new workspace.
  function addRecord(ws,section,x,on){
    if(!isDate(on))throw Error("Date required");
    var next=clone(validate(ws)),list=arr(next[section]),rec;
    if(section==="accounts"){
      if(ACCOUNT_TYPES.indexOf(x.type)<0)throw Error("Choose an account type");
      var name=text(x.name,80,"Account name"),id="acct-"+slug(name);
      if(list.some(function(a){return a.id===id;}))throw Error("An account with that name already exists");
      rec={id:id,name:name,type:x.type};
    }else if(section==="ledger"){
      if(x.kind!=="income"&&x.kind!=="outflow")throw Error("Choose income or expense");
      if(!isDate(x.date))throw Error("Date required");
      var cats=x.kind==="income"?INCOME_CATS:COST_CATS,cat=cats.indexOf(x.category)>=0?x.category:"other";
      rec={id:"m-"+x.date+"-"+slug(x.payer)+"-"+(list.length+1),kind:x.kind,date:x.date,payer:text(x.payer,100,"Payer or vendor"),label:text(x.label||x.payer,100,"Description"),category:cat,evidenceStatus:"missing",source:"manual"};
      if(x.kind==="income"){rec.grossUsd=money(x.amountUsd);rec.feesUsd="0.00";}else{rec.type="expense";rec.amountUsd=money(x.amountUsd);}
      // Optional Decision Spellchecker accounting dimension: links the row to the program's financial engine.
      if(x.dsDimension){
        var DS=dep("IncomeOSDSProgram","./ds-program.js");if(!DS)throw Error("Decision Spellchecker engine unavailable");
        var dims=x.kind==="income"?DS.REVENUE_DIMS:DS.COST_DIMS;
        if(dims.indexOf(x.dsDimension)<0)throw Error("Choose a Decision Spellchecker "+(x.kind==="income"?"revenue":"cost")+" dimension");
        rec.program="decision-spellchecker";rec.dsDimension=x.dsDimension;
        if(x.kind==="income"&&x.dsAgreementId)rec.dsAgreementId=String(x.dsAgreementId).slice(0,80);
      }
    }else if(section==="serviceNotes"){
      var v=text(x.vendor,100,"Vendor");
      list=list.filter(function(n){return String(n.vendor).toLowerCase()!==v.toLowerCase();});
      rec={vendor:v,necessary:x.necessary===true,cancelNoticeDays:x.cancelNoticeDays===""||x.cancelNoticeDays==null?null:Math.max(0,Math.min(365,Math.round(Number(x.cancelNoticeDays)))),lastUsedOn:isDate(x.lastUsedOn)?x.lastUsedOn:null};
    }else if(section==="offers"){
      if(["savings","money_market","cd","treasury_bill","treasury_note","i_bond"].indexOf(x.product)<0)throw Error("Choose a product");
      var apy=Number(x.apyPct);if(!(apy>=0&&apy<25))throw Error("Enter the APY in percent");
      var url;try{url=new URL(x.sourceUrl);}catch(e){throw Error("Paste the provider's https page");}
      if(url.protocol!=="https:")throw Error("Paste the provider's https page");
      rec={id:"offer-"+slug(x.provider)+"-"+(list.length+1),provider:text(x.provider,80,"Provider"),product:x.product,apyPct:apy,insurance:x.insurance||"FDIC",sourceUrl:url.href,checkedOn:on};
      if(x.termMonths)rec.termMonths=Math.round(Number(x.termMonths));
      if(x.earlyPenaltyMonths!==""&&x.earlyPenaltyMonths!=null)rec.earlyPenaltyMonths=Number(x.earlyPenaltyMonths);
    }else throw Error("Unknown section");
    next[section]=list.concat([rec]);
    return log(next,"ADD_"+section.toUpperCase(),{id:rec.id||rec.vendor},on);
  }
  // Replace the Decision Spellchecker program record after the program engine validated it.
  function setDsProgram(ws,program,on){
    if(!isDate(on))throw Error("Date required");
    var DS=dep("IncomeOSDSProgram","./ds-program.js");if(!DS)throw Error("Decision Spellchecker engine unavailable");
    var next=clone(validate(ws));next.dsProgram=DS.validate(clone(program));
    var last=next.dsProgram.changeLog[next.dsProgram.changeLog.length-1];
    return log(next,"DS_PROGRAM_UPDATED",{programAction:last?last.action:null,programSeq:last?last.seq:null},on);
  }
  // Owner-entered study time components, keyed by research study id. Same limits as the research engine.
  function setResearchTime(ws,studyId,t,on){
    if(!isDate(on))throw Error("Date required");
    if(typeof studyId!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{3,89}$/.test(studyId))throw Error("Invalid study id");
    function mins(v,name){if(v===null||v===undefined||v==="")return null;var n=Number(v);if(!Number.isFinite(n)||n<0||n>1440)throw Error("Invalid "+name+" minutes");return n;}
    var rec={screenMinutes:mins(t.screenMinutes,"screener"),prepMinutes:mins(t.prepMinutes,"preparation"),adminMinutes:mins(t.adminMinutes,"follow-up"),
      timeConfidence:t.timeConfidence==="verified"?"verified":"estimated",enteredOn:on};
    var next=clone(validate(ws));next.researchTimes=Object.assign({},next.researchTimes&&typeof next.researchTimes==="object"&&!Array.isArray(next.researchTimes)?next.researchTimes:{});
    next.researchTimes[studyId]=rec;
    if(Object.keys(next.researchTimes).length>2000)throw Error("Too many study time entries");
    return log(next,"SET_RESEARCH_TIME",{studyId:studyId,timeConfidence:rec.timeConfidence},on);
  }
  function clearResearchTime(ws,studyId,on){
    var next=clone(validate(ws));if(next.researchTimes)delete next.researchTimes[studyId];
    return log(next,"CLEAR_RESEARCH_TIME",{studyId:studyId},on);
  }
  function setYieldParams(ws,y,on){
    var next=clone(validate(ws)),p={amountUsd:Number(y.amountUsd),horizonMonths:Number(y.horizonMonths),federalRatePct:Number(y.federalRatePct),stateRatePct:Number(y.stateRatePct),needLiquidity:y.needLiquidity===true};
    if(!(p.amountUsd>0)||!(p.horizonMonths>0)||!(p.federalRatePct>=0&&p.federalRatePct<60)||!(p.stateRatePct>=0&&p.stateRatePct<20))throw Error("Enter amount, months and both tax rates");
    next.yieldParams=p;return log(next,"SET_YIELD_PARAMS",{},on);
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
    var amt=String(b.balanceUsd==null?"":b.balanceUsd).trim();
    if(!/^-?\d{1,12}(\.\d{1,2})?$/.test(amt))throw Error("Enter the balance amount, like 1200.00");
    if(["statement","institution_export","appraisal","owner_estimate"].indexOf(b.source)<0)throw Error("Source type required");
    if(typeof b.sourceRef!=="string"||!b.sourceRef.trim())throw Error("Say where the statement is kept");
    next.balances=arr(next.balances).concat([{accountId:b.accountId,asOf:b.asOf,balanceUsd:amt,source:b.source,sourceRef:b.sourceRef.trim().slice(0,120)}]);
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
    validateDoc(ws);
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
    return validateDoc(JSON.parse(dec.decode(plain)));
  }
  // Read either a plain or an encrypted workspace file's text.
  async function load(text,passphrase){
    if(typeof text!=="string"||text.length>8000000)throw Error("Workspace file is missing or too large.");
    if(isEncrypted(text)){if(!passphrase)throw Error("This workspace is encrypted. Enter its passphrase.");return decrypt(passphrase,text);}
    return validateDoc(JSON.parse(text));
  }
  var api=Object.freeze({SCHEMA:SCHEMA,KEYS:KEYS.slice(),validate:validate,newWorkspace:newWorkspace,addRecord:addRecord,setYieldParams:setYieldParams,setResearchTime:setResearchTime,clearResearchTime:clearResearchTime,ACCOUNT_TYPES:ACCOUNT_TYPES.slice(),INCOME_CATS:INCOME_CATS.slice(),COST_CATS:COST_CATS.slice(),acceptProposal:acceptProposal,advanceClaim:advanceClaim,openClaim:openClaim,recordSearch:recordSearch,
    addBalance:addBalance,markAlerted:markAlerted,setDsProgram:setDsProgram,encrypt:encrypt,decrypt:decrypt,isEncrypted:isEncrypted,load:load});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSWorkspace=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
