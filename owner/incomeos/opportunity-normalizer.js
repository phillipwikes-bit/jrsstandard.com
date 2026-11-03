"use strict";
(function(root){
  // IncomeOS opportunity normalization, provenance, duplicate detection,
  // source versioning and freshness. Pure functions; no network access.
  // Hashes here are FNV-1a 64-bit identifiers for change detection and
  // de-duplication. They are NOT cryptographic and prove nothing about authenticity.
  var VERSION="incomeos.opportunity.v1";
  var Req=root&&root.IncomeOSRequirements||(typeof require==="function"?require("./listing-requirements.js"):null);
  var Comp=root&&root.IncomeOSCompensation||(typeof require==="function"?require("./compensation.js"):null);

  function fnv(s){
    var h1=0x811c9dc5,h2=0x050c5d1f,str=String(s);
    for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=Math.imul(h2^(c+i),16777619)>>>0;}
    return ("00000000"+h1.toString(16)).slice(-8)+("00000000"+h2.toString(16)).slice(-8);
  }
  function stable(v){
    if(Array.isArray(v))return "["+v.map(stable).join(",")+"]";
    if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+":"+stable(v[k]);}).join(",")+"}";
    return JSON.stringify(v===undefined?null:v);
  }
  function norm(s){return typeof s==="string"?s.toLowerCase().replace(/\b(inc|llc|ltd|corp|corporation|co|technologies|technology|the)\b\.?/g," ").replace(/[^a-z0-9]+/g," ").trim():"";}
  function normTitle(s){return norm(s).replace(/\b(remote|contract|part time|full time|freelance|us|usa|united states)\b/g," ").replace(/\s+/g," ").trim();}
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function day(x){if(isDate(x))return x;var t=typeof x==="number"?x:Date.parse(x);return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):null;}
  function httpsUrl(u){try{var x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password?x.href:null;}catch(e){return null;}}
  function host(u){try{return new URL(u).hostname.toLowerCase();}catch(e){return "";}}
  function hostAllowed(h,allowed){return allowed.some(function(a){a=String(a).toLowerCase();return h===a||h.slice(-a.length-1)==="."+a;});}

  // raw: connector output {postingId,title,employer,platform,sourceUrl,applyUrl,locationText,descriptionText,
  //   publishedAt,updatedAt,deadline,remoteMode,employmentTypeText,compensation:{min,max,currency,period,basis,sourceText}}
  // source: {connector, sourceId, sourceType:"primary_ats"|"official_api"|"aggregator"|"manual", allowedHosts:[...], reliability}
  function normalize(raw,source,fetchedAt){
    var problems=[];
    var title=typeof raw.title==="string"?raw.title.trim().slice(0,200):"";
    var employer=typeof raw.employer==="string"?raw.employer.trim().slice(0,120):"";
    var postingId=raw.postingId==null?"":String(raw.postingId).slice(0,120);
    if(!title||!employer||!postingId)problems.push("IDENTITY_INCOMPLETE");
    var sourceUrl=httpsUrl(raw.sourceUrl),applyUrl=httpsUrl(raw.applyUrl||raw.sourceUrl);
    if(!sourceUrl||!applyUrl)problems.push("SOURCE_URL_INVALID");
    var allowed=Array.isArray(source.allowedHosts)?source.allowedHosts:[];
    if(applyUrl&&allowed.length&&!hostAllowed(host(applyUrl),allowed))problems.push("APPLY_URL_OFF_SOURCE_DOMAIN");
    if(sourceUrl&&allowed.length&&!hostAllowed(host(sourceUrl),allowed))problems.push("SOURCE_URL_OFF_SOURCE_DOMAIN");
    var listing={title:title,descriptionText:raw.descriptionText,locationText:raw.locationText,employmentTypeText:raw.employmentTypeText};
    var extraction=Req.extract(listing),attrs=Req.attributes(listing),risks=Req.riskSignals(listing);
    var remoteMode=raw.remoteMode||(/\bremote\b/i.test(String(raw.locationText||"")+" "+title)?"remote":"unknown");
    var adv=raw.compensation&&raw.compensation.min!=null||raw.compensation&&raw.compensation.max!=null?raw.compensation:Comp.parseAdvertised(Req.strip(String(raw.descriptionText||"")));
    var text=Req.strip(String(raw.descriptionText||""));
    var core={title:title,employer:employer,locationText:raw.locationText||null,remoteMode:remoteMode,compensation:adv||null,deadline:day(raw.deadline),requirements:extraction.requirements.map(function(r){return [r.category,r.minLevel||r.key||r.mode||r.country||r.level||r.minYears||r.maxYears||r.minHoursPerWeek||"",r.mandatory];})};
    var rec={
      schema:VERSION,
      opportunityId:"opp-"+fnv(source.connector+"|"+source.sourceId+"|"+postingId),
      dedupeKey:"dk-"+fnv(norm(employer)+"|"+normTitle(title)+"|"+(remoteMode==="remote"?"remote":norm(raw.locationText))),
      platform:raw.platform||employer,employer:employer,title:title,
      sourceUrl:sourceUrl,applyUrl:applyUrl,postingId:postingId,
      provenance:{connector:source.connector,sourceId:source.sourceId,sourceType:source.sourceType||"unknown",reliability:source.reliability||"unclassified",fetchedAt:fetchedAt,mode:source.mode||"live"},
      discoveredOn:day(fetchedAt),lastVerifiedOn:day(fetchedAt),publishedOn:day(raw.publishedAt),updatedOn:day(raw.updatedAt),deadline:day(raw.deadline),
      remoteMode:remoteMode,locationText:typeof raw.locationText==="string"?raw.locationText.slice(0,200):null,
      employmentClassification:raw.employmentClassification||attrs.employmentClassification,
      compensation:adv||null,
      requirements:extraction.requirements,requirementSet:{ownerConfirmed:false,extraction:extraction.version},
      riskSignals:risks,problems:problems,
      descriptionExcerpt:text.slice(0,1500),descriptionLength:text.length,
      contentHash:"ch-"+fnv(stable(core)),
      availability:"LISTED_BY_SOURCE",
      uncertainties:[]
    };
    if(!adv)rec.uncertainties.push("COMPENSATION_NOT_PUBLISHED");
    if(remoteMode==="unknown")rec.uncertainties.push("REMOTE_STATUS_UNSTATED");
    if(!rec.employmentClassification)rec.uncertainties.push("CLASSIFICATION_UNSTATED");
    rec.uncertainties.push("REQUIREMENTS_AUTO_EXTRACTED_UNCONFIRMED");
    return rec;
  }

  // Group records describing the same opportunity across sources. Aggregator
  // copies never count as independent verification of a primary posting.
  function dedupe(records){
    var groups={},order=[];
    records.forEach(function(r){if(!groups[r.dedupeKey]){groups[r.dedupeKey]=[];order.push(r.dedupeKey);}groups[r.dedupeKey].push(r);});
    var rank={primary_ats:0,official_api:0,manual:1,aggregator:2,unknown:3};
    return order.map(function(k){
      function rk(r){var t=r.provenance&&r.provenance.sourceType;return Object.prototype.hasOwnProperty.call(rank,t)?rank[t]:3;}
      var g=groups[k].slice().sort(function(a,b){return rk(a)-rk(b);});
      var primary=g[0],flags=[];
      var comps=g.map(function(r){return r.compensation?stable([r.compensation.min,r.compensation.max,r.compensation.currency,r.compensation.period]):"none";});
      if(comps.filter(function(c,i){return c!=="none"&&comps.indexOf(c)===i;}).length>1)flags.push("CONFLICTING_DUPLICATE_COMPENSATION");
      var dl=g.map(function(r){return r.deadline||"none";});
      if(dl.filter(function(c,i){return c!=="none"&&dl.indexOf(c)===i;}).length>1)flags.push("CONFLICTING_DUPLICATE_DEADLINE");
      var ids=g.map(function(r){return r.opportunityId;});
      if(ids.filter(function(c,i){return ids.indexOf(c)!==i;}).length)flags.push("SAME_SOURCE_DUPLICATE");
      return {opportunity:primary,duplicates:g.slice(1).map(function(r){return {opportunityId:r.opportunityId,sourceType:r.provenance.sourceType,sourceUrl:r.sourceUrl};}),
        independentPrimarySources:g.filter(function(r){return r.provenance.sourceType==="primary_ats"||r.provenance.sourceType==="official_api";}).length,flags:flags};
    });
  }

  // Compare against the previous snapshot to detect changes and withdrawals.
  function diff(previous,current){
    var prev={},cur={},changes=[];
    (previous||[]).forEach(function(r){prev[r.opportunityId]=r;});
    current.forEach(function(r){cur[r.opportunityId]=r;});
    current.forEach(function(r){
      var p=prev[r.opportunityId];
      if(!p){changes.push({opportunityId:r.opportunityId,type:"NEW"});return;}
      r.discoveredOn=p.discoveredOn||r.discoveredOn;
      if(p.contentHash===r.contentHash)return;
      if(stable(p.compensation)!==stable(r.compensation))changes.push({opportunityId:r.opportunityId,type:"COMPENSATION_CHANGED",before:p.compensation,after:r.compensation});
      if(stable((p.requirements||[]).map(function(x){return x.sourceText;}))!==stable(r.requirements.map(function(x){return x.sourceText;})))changes.push({opportunityId:r.opportunityId,type:"REQUIREMENTS_CHANGED"});
      if((p.deadline||null)!==(r.deadline||null))changes.push({opportunityId:r.opportunityId,type:"DEADLINE_CHANGED",before:p.deadline||null,after:r.deadline||null});
      if(!changes.some(function(c){return c.opportunityId===r.opportunityId;}))changes.push({opportunityId:r.opportunityId,type:"CONTENT_CHANGED"});
    });
    Object.keys(prev).forEach(function(id){if(!cur[id])changes.push({opportunityId:id,type:"WITHDRAWN_OR_UNLISTED",sourceId:prev[id].provenance&&prev[id].provenance.sourceId});});
    return changes;
  }

  // Freshness decision. Withdrawn sources must be reported by the caller; a
  // listing absent from a SUCCESSFUL fetch is withdrawn, absent from a FAILED
  // fetch is unverified, never silently retained as active.
  // Relevance to the owner's focus areas: deterministic keyword matching on the
  // title (weight 3) and description (weight 1). It orders and filters what the
  // owner sees; it is never part of eligibility and hides nothing silently.
  var DEFAULT_FOCUS=["ai trainer","ai tutor","evaluator","evaluation","rater","annotat","red team","trust and safety","trust & safety","content policy","policy analyst",
    "investigat","compliance","civil rights","eeo","equal employment","discrimination","human resources","hr ","governance","quality assurance","qa analyst",
    "legal","paralegal","expert","subject matter","consultant","adjudicat","arbitrat","mediat","hearing officer","case review","reviewer","researcher","survey","interview","focus group","usability"];
  function relevance(rec,focus){
    var words=(Array.isArray(focus)&&focus.length?focus:DEFAULT_FOCUS).map(function(w){return String(w).toLowerCase();}).filter(Boolean);
    var title=" "+String(rec.title||"").toLowerCase()+" ",desc=" "+String(rec.descriptionExcerpt||"").toLowerCase()+" ";
    var matched=[],score=0;
    words.forEach(function(w){if(title.indexOf(w)>=0){score+=3;matched.push(w);}else if(desc.indexOf(w)>=0){score+=1;matched.push(w);}});
    return {score:score,matched:matched.slice(0,8)};
  }
  function freshness(rec,asOf,policy){
    var maxAge=policy&&Number.isFinite(policy.maxListingAgeDays)?policy.maxListingAgeDays:3;
    if(!isDate(asOf)||!isDate(rec.lastVerifiedOn))return "UNVERIFIED";
    if(rec.availability==="WITHDRAWN")return "WITHDRAWN";
    if(rec.deadline&&rec.deadline<asOf)return "EXPIRED";
    var age=(Date.parse(asOf+"T00:00:00Z")-Date.parse(rec.lastVerifiedOn+"T00:00:00Z"))/86400000;
    if(age<0)return "UNVERIFIED";
    return age>maxAge?"STALE":"FRESH";
  }
  var api=Object.freeze({VERSION:VERSION,fnv:fnv,stable:stable,normalize:normalize,dedupe:dedupe,diff:diff,freshness:freshness,normTitle:normTitle,relevance:relevance,DEFAULT_FOCUS:DEFAULT_FOCUS.slice()});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSOpportunity=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
