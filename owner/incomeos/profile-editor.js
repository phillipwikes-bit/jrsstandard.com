"use strict";
(function(root){
  // IncomeOS qualification profile editor. Pure functions that return a NEW
  // profile. Marking an item "documented" requires naming the record the owner
  // holds and the date it was checked; the eligibility engine accepts nothing
  // less. The editor cannot add a qualification the owner did not already list:
  // new degrees or credentials are added deliberately, with their own evidence.
  var SCHEMA="incomeos.owner-profile.v1";
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"));}
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function arr(x){return Array.isArray(x)?x:[];}
  function check(p){if(!p||typeof p!=="object"||p.schema!==SCHEMA)throw Error("Expected an "+SCHEMA+" profile");return p;}
  function evidence(ref,checkedOn,today){
    var r=String(ref==null?"":ref).trim();
    if(!r)throw Error("Say where the record is kept (for example: diploma, home file cabinet)");
    if(!isDate(checkedOn))throw Error("Enter the date you checked the record");
    if(isDate(today)&&checkedOn>today)throw Error("The check date cannot be in the future");
    return {status:"documented",ref:r.slice(0,200),verifiedOn:checkedOn};
  }
  function label(group,item){
    if(group==="education")return (item.degree||item.level||"Degree")+(item.institution?", "+item.institution:"");
    if(group==="credentials"||group==="licenses")return item.name||item.key||"Credential";
    if(group==="experience")return item.description||arr(item.domainKeys).join(", ")||"Experience";
    if(group==="languages")return (item.key||"Language")+" ("+(item.level||"level unset")+")";
    if(group==="totalProfessionalYears")return "Total professional experience: "+(item.years==null?"unset":item.years+" years");
    if(group==="location")return "Residence: "+(item.region?item.region+", ":"")+(item.country||"unset");
    if(group==="enrollment")return "Current student enrollment: "+(item.currentlyEnrolled==null?"unset":item.currentlyEnrolled?"yes":"no");
    return group;
  }
  // Every evidence-bearing item, with a stable path the editor can address.
  function items(p){
    check(p);var out=[];
    ["education","credentials","licenses","experience","languages","skills","clearances"].forEach(function(g){
      arr(p[g]).forEach(function(it,i){out.push({path:g+"."+i,group:g,label:label(g,it),status:it.evidence&&it.evidence.status||"unknown",ref:it.evidence&&it.evidence.ref||null,checkedOn:it.evidence&&it.evidence.verifiedOn||null});});
    });
    ["totalProfessionalYears","location","enrollment"].forEach(function(g){
      if(p[g]&&typeof p[g]==="object")out.push({path:g,group:g,label:label(g,p[g]),status:p[g].evidence&&p[g].evidence.status||"unknown",ref:p[g].evidence&&p[g].evidence.ref||null,checkedOn:p[g].evidence&&p[g].evidence.verifiedOn||null});
    });
    return out;
  }
  function at(p,path){
    var parts=String(path).split(".");
    var target=parts.length===2?arr(p[parts[0]])[Number(parts[1])]:p[parts[0]];
    if(!target||typeof target!=="object")throw Error("Item not found");
    return target;
  }
  function markDocumented(p,path,ref,checkedOn,today){
    var next=clone(check(p));at(next,path).evidence=evidence(ref,checkedOn,today);
    next.updatedOn=isDate(today)?today:next.updatedOn;return next;
  }
  // Undo a documented mark (for example a record that turned out to be missing).
  function undocument(p,path,today){
    var next=clone(check(p));at(next,path).evidence={status:"attested",ref:null,verifiedOn:null};
    next.updatedOn=isDate(today)?today:next.updatedOn;return next;
  }
  function setWorkAuthorization(p,x,today){
    var next=clone(check(p));
    if(typeof x.authorized!=="boolean")throw Error("Choose whether you are authorized to work in the US");
    var rec={country:"US",authorized:x.authorized,citizen:typeof x.citizen==="boolean"?x.citizen:null,evidence:evidence(x.ref,x.checkedOn,today)};
    next.workAuthorization=arr(next.workAuthorization).filter(function(w){return w.country!=="US";}).concat([rec]);
    return next;
  }
  // Conflicts: an explicit list (it may be empty) plus the date the owner reviewed it.
  function setConflicts(p,orgs,checkedOn,today){
    var next=clone(check(p));
    var list=(Array.isArray(orgs)?orgs:String(orgs||"").split(/[\n,;]/)).map(function(s){return String(s).trim();}).filter(Boolean).slice(0,200);
    next.conflicts={organizations:list,evidence:evidence("owner conflict-of-interest review",checkedOn,today)};
    return next;
  }
  function setWorkPreferences(p,x){
    var next=clone(check(p));next.availability=next.availability||{};next.preferences=next.preferences||{};
    var h=Number(x.maxHoursPerWeek);if(!(h>0&&h<=80))throw Error("Enter weekly hours between 1 and 80");
    var r=Number(x.minHourlyUsd);if(!(r>=0&&r<10000))throw Error("Enter a minimum hourly rate");
    next.availability.maxHoursPerWeek=h;next.availability.acceptsFixedShifts=x.acceptsFixedShifts===true;
    next.preferences.minHourlyUsd=r;
    if(x.defaultScreeningHours!==""&&x.defaultScreeningHours!=null){var s=Number(x.defaultScreeningHours);if(!(s>=0&&s<100))throw Error("Screening hours must be 0 to 99");next.preferences.defaultScreeningHours=s;}
    if(x.defaultEngagementHours!==""&&x.defaultEngagementHours!=null){var e=Number(x.defaultEngagementHours);if(!(e>0&&e<5000))throw Error("Engagement hours must be positive");next.preferences.defaultEngagementHours=e;}
    if(typeof x.focusKeywords==="string"){var f=x.focusKeywords.split(/[\n,;]/).map(function(s){return s.trim().toLowerCase();}).filter(Boolean).slice(0,60);if(f.length)next.preferences.focusKeywords=f;else delete next.preferences.focusKeywords;}
    return next;
  }
  // Former employers: used only to flag engagements that touch them for the owner's own ethics review.
  function setFormerEmployers(p,text){
    var next=clone(check(p));
    next.formerEmployers=String(text||"").split(/[\n;]/).map(function(s){return s.trim();}).filter(function(s){return s.length>=4;}).slice(0,50);
    return next;
  }
  // What still blocks eligibility, in plain words.
  function readiness(p){
    check(p);var gaps=[];
    var undocumented=items(p).filter(function(i){return i.status!=="documented";});
    if(undocumented.length)gaps.push(undocumented.length+" qualification(s) not yet documented");
    var wa=arr(p.workAuthorization).filter(function(w){return w.country==="US";})[0];
    if(!wa||typeof wa.authorized!=="boolean"||!wa.evidence||wa.evidence.status!=="documented")gaps.push("US work authorization not set");
    if(!p.conflicts||!Array.isArray(p.conflicts.organizations)||!p.conflicts.evidence||p.conflicts.evidence.status!=="documented")gaps.push("Conflict-of-interest list not reviewed");
    if(!p.availability||!(Number(p.availability.maxHoursPerWeek)>0))gaps.push("Weekly hours not set");
    if(!p.preferences||!Array.isArray(p.preferences.acceptedClassifications)||!p.preferences.acceptedClassifications.length)gaps.push("Accepted work types (contractor, part-time) not set");
    return {ready:gaps.length===0,gaps:gaps};
  }
  var api=Object.freeze({SCHEMA:SCHEMA,items:items,markDocumented:markDocumented,undocument:undocument,setWorkAuthorization:setWorkAuthorization,setConflicts:setConflicts,setWorkPreferences:setWorkPreferences,setFormerEmployers:setFormerEmployers,readiness:readiness});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSProfileEditor=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
