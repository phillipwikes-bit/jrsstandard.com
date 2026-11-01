"use strict";
(function(){
  // Public-source-only interoperability for the separate research feed and
  // the owner staging snapshot. Never import screening answers, user IDs, emails,
  // account records, study participation state, credentials or personal notes.
  var radar=window.IncomeOSResearchRadar;
  var PUBLIC=["id","title","recruiter","incentive_usd","incentive_label","incentive_type","duration_minutes","format","online_only","participation_dates","apply_deadline","eligibility","flags","application_url","source_url","access_type","availability_status","source_checked_on","is_active","summary","created_at","updated_at"];
  var NATIVE=["id","title","provider","paymentUsd","paymentMethod","minutes","screenMinutes","mode","eventEnd","reviewed","url","sourceUrl","dates","linkKind","eligibility","risk","status","eligibilityStatus","dateType"];
  var MAX=200;
  function plain(x){return x&&typeof x==="object"&&!Array.isArray(x);}
  function check(x,fields){
    if(!plain(x))throw Error("Research candidate must be a public-source record");
    var names=Object.keys(x);
    if(names.some(function(k){return !fields.includes(k)}))throw Error("Private or unrecognized research fields are prohibited");
  }
  function trim(x,limit){return String(x===null||x===undefined?"":x).trim().slice(0,limit);}
  function validDate(s){
    if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
    var n=Date.parse(s+"T00:00:00Z");
    return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s;
  }
  function toCanonical(raw){
    if(!radar||typeof radar.candidate!=="function")throw Error("Research screening engine unavailable");
    if(!plain(raw))throw Error("Invalid public research source");
    if("recruiter" in raw || "incentive_usd" in raw || "application_url" in raw){
      check(raw,PUBLIC);
      if(raw.is_active!==true)throw Error("Inactive public listing requires separate history, not a current lead");
      var mode="hybrid",format=trim(raw.format,160).toLowerCase();
      if(raw.online_only===true)mode="online";
      else if(format.includes("in person")&&format.includes("online"))mode="hybrid";
      else if(format.includes("in person")||format.includes("in-person"))mode="in-person";
      // Uncertain formats never qualify for fully-online filtering.
      if(raw.apply_deadline!==null&&raw.apply_deadline!==undefined&&!validDate(raw.apply_deadline))throw Error("Invalid published application deadline");
      var canonical={
        id:raw.id,title:raw.title,provider:raw.recruiter,paymentUsd:raw.incentive_usd,
        minutes:raw.duration_minutes,screenMinutes:null,mode:mode,
        eventEnd:raw.apply_deadline||null,dateType:"application-deadline",
        reviewed:raw.source_checked_on,dates:trim(raw.participation_dates,100),
        url:raw.application_url,sourceUrl:raw.source_url,
        linkKind:raw.access_type==="direct"?"Direct screener":raw.access_type==="login"?"Study-specific registration":"Application details unconfirmed",
        eligibility:raw.eligibility,risk:raw.flags,status:trim(raw.availability_status,150)||"Availability unconfirmed",
        eligibilityStatus:"unknown"
      };
      return radar.candidate(canonical);
    }
    check(raw,NATIVE);
    // The prototype snapshot's eventEnd represents the last published session,
    // not necessarily the application deadline.
    return radar.candidate({...raw,dateType:raw.dateType||"published-session-end"});
  }
  function extract(doc){
    if(Array.isArray(doc))return doc;
    if(!plain(doc))throw Error("Expected a public research collection");
    var root=Array.isArray(doc.studies)?doc.studies:Array.isArray(doc.items)?doc.items:
      Array.isArray(doc.data)?doc.data:null;
    if(!root)throw Error("No research studies array found");
    if(doc.asOf!==undefined&&!validDate(doc.asOf))throw Error("Invalid feed as-of date");
    return root;
  }
  function collect(doc){
    var arr=extract(doc);
    if(!arr.length||arr.length>MAX)throw Error("Source must contain 1–200 public candidates");
    var items=[],errors=[];
    arr.forEach(function(raw,i){
      try{items.push(toCanonical(raw));}
      catch(err){errors.push({row:i+1,reason:err.message});}
    });
    return {items:items,rejected:errors,received:arr.length,accepted:items.length,
      notice:errors.length?"Some public rows lacked required source or compensation information; no amounts or deadlines were invented.":"All public rows passed intake validation."};
  }
  window.IncomeOSPublicFeedAdapter=Object.freeze({toCanonical:toCanonical,collect:collect});
}());