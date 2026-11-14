"use strict";
(function(root){
  // IncomeOS deterministic eligibility engine.
  // Compares structured, mandatory listing requirements against a private owner
  // profile. No probabilities, no model inference, no network access.
  // A requirement is SATISFIED only by a profile item whose evidence is
  // "documented" (a reference to a record the owner holds) and not stale.
  // Owner attestation without a record reference is NOT_ESTABLISHED.
  // Listing-supplied claims such as eligibility:"verified" are never read.
  var ENGINE="incomeos.eligibility.v1";
  var SATISFIED="SATISFIED",NOT_SATISFIED="NOT_SATISFIED",NOT_ESTABLISHED="NOT_ESTABLISHED",NOT_APPLICABLE="NOT_APPLICABLE";
  var CATEGORIES=["education","experience","certification","license","geography","work_authorization","remote","technical_skill",
    "language","employment_classification","schedule","conflict_of_interest","platform_restriction","clearance","enrollment","other","requirement_set"];
  var EDUCATION_RANK={high_school:1,associate:2,bachelors:3,masters:4,jd:5,doctorate:5};
  var CLEARANCE_RANK={public_trust:1,secret:2,top_secret:3,ts_sci:4};
  var issued=typeof WeakSet==="function"?new WeakSet():null;

  function isDate(x){if(typeof x!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;var t=Date.parse(x+"T00:00:00Z");return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x;}
  function days(a,b){return (Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000;}
  function key(x){return typeof x==="string"?x.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""):"";}
  function arr(x){return Array.isArray(x)?x:[];}

  // Evidence quality of one profile item: documented, attested or unknown, with staleness.
  function evidenceState(item,asOf,policy){
    var ev=item&&item.evidence;
    if(!ev||typeof ev!=="object")return {ok:false,reason:"EVIDENCE_MISSING",ref:null};
    if(ev.status!=="documented")return {ok:false,reason:ev.status==="attested"?"OWNER_ATTESTED_NOT_DOCUMENTED":"EVIDENCE_NOT_DOCUMENTED",ref:null};
    if(typeof ev.ref!=="string"||!ev.ref.trim())return {ok:false,reason:"EVIDENCE_REFERENCE_MISSING",ref:null};
    if(!isDate(ev.verifiedOn))return {ok:false,reason:"EVIDENCE_DATE_INVALID",ref:ev.ref};
    if(ev.verifiedOn>asOf)return {ok:false,reason:"EVIDENCE_DATED_IN_FUTURE",ref:ev.ref};
    var maxAge=policy&&Number.isFinite(policy.maxEvidenceAgeDays)?policy.maxEvidenceAgeDays:730;
    if(days(ev.verifiedOn,asOf)>maxAge)return {ok:false,reason:"EVIDENCE_STALE",ref:ev.ref};
    return {ok:true,reason:null,ref:ev.ref.trim().slice(0,200)};
  }
  // ownerItem: a short description of the exact profile item that satisfied the requirement,
  // so downstream text (application notes) never has to guess it from a free-text reference.
  function describeItem(it){
    if(!it||typeof it!=="object")return null;
    var d=it.degree||it.name||it.description||(it.level?it.level+" degree":null)||(it.key?String(it.key).replace(/_/g," "):null)||(Number.isFinite(Number(it.years))?it.years+" years of professional experience":null);
    return d?String(d).slice(0,160):null;
  }
  function result(req,status,reason,ownerEvidence,item){
    return {requirementId:req.id,category:req.category,mandatory:req.mandatory!==false,status:status,reason:reason||null,
      sourceText:typeof req.sourceText==="string"?req.sourceText.slice(0,500):null,ownerEvidence:ownerEvidence||null,ownerItem:status==="SATISFIED"?describeItem(item):null};
  }
  // Pick the best match among candidate profile items: documented beats undocumented.
  function bestMatch(items,matches,asOf,policy){
    var undocumented=null;
    for(var i=0;i<items.length;i++){
      if(!matches(items[i]))continue;
      var ev=evidenceState(items[i],asOf,policy);
      if(ev.ok)return {item:items[i],evidence:ev};
      if(!undocumented)undocumented={item:items[i],evidence:ev};
    }
    return undocumented;
  }
  function absent(req,complete,what){
    return complete===true?result(req,NOT_SATISFIED,what+"_NOT_HELD"):result(req,NOT_ESTABLISHED,what+"_NOT_IN_PROFILE");
  }
  function fromMatch(req,m,complete,what){
    if(!m)return absent(req,complete,what);
    if(m.evidence.ok)return result(req,SATISFIED,null,m.evidence.ref,m.item);
    return result(req,NOT_ESTABLISHED,m.evidence.reason);
  }

  var evaluators={
    education:function(req,p,asOf,pol){
      var min=EDUCATION_RANK[req.minLevel];
      if(!min)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      var fields=arr(req.fields).map(key).filter(Boolean);
      var m=bestMatch(arr(p.education),function(e){
        if((EDUCATION_RANK[e.level]||0)<min)return false;
        if(req.minLevel==="jd"&&e.level!=="jd")return false;
        if(req.minLevel==="doctorate"&&e.level!=="doctorate")return false;
        if(!fields.length)return true;
        return arr(e.fieldKeys).map(key).some(function(f){return fields.indexOf(f)>=0;});
      },asOf,pol);
      return fromMatch(req,m,p.completeness&&p.completeness.education,"DEGREE");
    },
    enrollment:function(req,p,asOf,pol){
      var en=p.enrollment;
      if(!en||typeof en.currentlyEnrolled!=="boolean")return result(req,NOT_ESTABLISHED,"ENROLLMENT_UNKNOWN");
      if(en.currentlyEnrolled===false)return result(req,NOT_SATISFIED,"NOT_CURRENTLY_ENROLLED");
      var ev=evidenceState(en,asOf,pol);return ev.ok?result(req,SATISFIED,null,ev.ref):result(req,NOT_ESTABLISHED,ev.reason);
    },
    experience:function(req,p,asOf,pol){
      var min=Number(req.minYears),max=req.maxYears==null?null:Number(req.maxYears);
      if((req.minYears!=null&&!Number.isFinite(min))||(max!==null&&!Number.isFinite(max)))return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      var domains=arr(req.domains).map(key).filter(Boolean),items=arr(p.experience);
      if(max!==null){
        var total=p.totalProfessionalYears;
        if(!total||!Number.isFinite(Number(total.years)))return result(req,NOT_ESTABLISHED,"TOTAL_EXPERIENCE_UNKNOWN");
        var tev=evidenceState(total,asOf,pol);
        if(Number(total.years)>max)return tev.ok?result(req,NOT_SATISFIED,"EXPERIENCE_ABOVE_MAXIMUM",tev.ref):result(req,NOT_ESTABLISHED,tev.reason);
        if(req.minYears==null)return tev.ok?result(req,SATISFIED,null,tev.ref):result(req,NOT_ESTABLISHED,tev.reason);
      }
      if(!domains.length){
        // General professional experience requirement.
        var t=p.totalProfessionalYears;
        if(!t||!Number.isFinite(Number(t.years)))return result(req,NOT_ESTABLISHED,"TOTAL_EXPERIENCE_UNKNOWN");
        var ev=evidenceState(t,asOf,pol);
        if(!ev.ok)return result(req,NOT_ESTABLISHED,ev.reason);
        return Number(t.years)>=(Number.isFinite(min)?min:0)?result(req,SATISFIED,null,ev.ref,{years:t.years}):result(req,NOT_SATISFIED,"EXPERIENCE_BELOW_MINIMUM",ev.ref);
      }
      var inDomain=items.filter(function(e){return arr(e.domainKeys).map(key).some(function(d){return domains.indexOf(d)>=0;});});
      if(!inDomain.length)return absent(req,p.completeness&&p.completeness.experience,"DOMAIN_EXPERIENCE");
      var m=bestMatch(inDomain,function(e){return Number(e.years)>=(Number.isFinite(min)?min:0);},asOf,pol);
      if(m)return fromMatch(req,m,false,"DOMAIN_EXPERIENCE");
      var short=bestMatch(inDomain,function(){return true;},asOf,pol);
      return short&&short.evidence.ok?result(req,NOT_SATISFIED,"EXPERIENCE_BELOW_MINIMUM",short.evidence.ref):result(req,NOT_ESTABLISHED,"EXPERIENCE_BELOW_MINIMUM_OR_UNDOCUMENTED");
    },
    certification:function(req,p,asOf,pol){return credential(req,p,asOf,pol,"credentials","CREDENTIAL");},
    license:function(req,p,asOf,pol){return credential(req,p,asOf,pol,"licenses","LICENSE");},
    technical_skill:function(req,p,asOf,pol){
      var k=key(req.key);if(!k)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      return fromMatch(req,bestMatch(arr(p.skills),function(s){return key(s.key)===k;},asOf,pol),p.completeness&&p.completeness.skills,"SKILL");
    },
    language:function(req,p,asOf,pol){
      var k=key(req.key);if(!k)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      var levels={basic:1,professional:2,fluent:3,native:4},need=levels[req.level]||2;
      return fromMatch(req,bestMatch(arr(p.languages),function(l){return key(l.key)===k&&(levels[l.level]||0)>=need;},asOf,pol),p.completeness&&p.completeness.languages,"LANGUAGE");
    },
    geography:function(req,p,asOf,pol){
      var loc=p.location;
      if(!loc||typeof loc.country!=="string")return result(req,NOT_ESTABLISHED,"OWNER_LOCATION_UNKNOWN");
      var ev=evidenceState(loc,asOf,pol);
      var country=loc.country.toUpperCase(),region=typeof loc.region==="string"?country+"-"+loc.region.toUpperCase():null;
      var allowedC=arr(req.allowedCountries).map(function(x){return String(x).toUpperCase();});
      var allowedR=arr(req.allowedRegions).map(function(x){return String(x).toUpperCase();});
      var excluded=arr(req.excludedRegions).map(function(x){return String(x).toUpperCase();});
      var fails=(allowedC.length&&allowedC.indexOf(country)<0)||(allowedR.length&&(!region||allowedR.indexOf(region)<0))||(region&&excluded.indexOf(region)>=0)||excluded.indexOf(country)>=0;
      if(allowedR.length&&!region)return result(req,NOT_ESTABLISHED,"OWNER_REGION_UNKNOWN");
      if(!ev.ok)return result(req,NOT_ESTABLISHED,ev.reason);
      return fails?result(req,NOT_SATISFIED,"LOCATION_EXCLUDED",ev.ref):result(req,SATISFIED,null,ev.ref);
    },
    work_authorization:function(req,p,asOf,pol){
      var c=typeof req.country==="string"?req.country.toUpperCase():"";
      var wa=arr(p.workAuthorization).filter(function(w){return typeof w.country==="string"&&w.country.toUpperCase()===c;})[0];
      if(!c)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      if(!wa||typeof wa.authorized!=="boolean")return result(req,NOT_ESTABLISHED,"WORK_AUTHORIZATION_UNKNOWN");
      var ev=evidenceState(wa,asOf,pol);
      if(!ev.ok)return result(req,NOT_ESTABLISHED,ev.reason);
      if(!wa.authorized)return result(req,NOT_SATISFIED,"NOT_AUTHORIZED",ev.ref);
      if(req.citizenshipRequired===true&&wa.citizen!==true)return wa.citizen===false?result(req,NOT_SATISFIED,"CITIZENSHIP_REQUIRED",ev.ref):result(req,NOT_ESTABLISHED,"CITIZENSHIP_UNKNOWN");
      return result(req,SATISFIED,null,ev.ref,{name:(req.citizenshipRequired===true?"Citizen of ":"Authorized to work in ")+(c==="US"?"the United States":c)});
    },
    clearance:function(req,p,asOf,pol){
      var need=CLEARANCE_RANK[req.level];if(!need)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
      var m=bestMatch(arr(p.clearances),function(c){return c.active===true&&(CLEARANCE_RANK[c.level]||0)>=need;},asOf,pol);
      return fromMatch(req,m,p.completeness&&p.completeness.clearances,"CLEARANCE");
    },
    remote:function(req,p){
      var pref=p.preferences||{};
      if(req.mode==="remote")return result(req,SATISFIED,null,"listing states remote");
      if(req.mode==="hybrid"||req.mode==="onsite")return pref.remoteOnly===false?result(req,SATISFIED,null,"owner accepts non-remote"):result(req,NOT_SATISFIED,"NOT_REMOTE");
      return result(req,NOT_ESTABLISHED,"REMOTE_STATUS_UNKNOWN");
    },
    employment_classification:function(req,p){
      var ok=arr((p.preferences||{}).acceptedClassifications);
      if(!req.type)return result(req,NOT_ESTABLISHED,"CLASSIFICATION_UNKNOWN");
      if(!ok.length)return result(req,NOT_ESTABLISHED,"OWNER_CLASSIFICATION_PREFERENCE_UNSET");
      return ok.indexOf(req.type)>=0?result(req,SATISFIED,null,"owner accepts "+req.type):result(req,NOT_SATISFIED,"CLASSIFICATION_NOT_ACCEPTED");
    },
    schedule:function(req,p){
      var a=p.availability;
      if(!a||!Number.isFinite(Number(a.maxHoursPerWeek)))return result(req,NOT_ESTABLISHED,"OWNER_AVAILABILITY_UNSET");
      if(req.fixedShift===true&&a.acceptsFixedShifts!==true)return result(req,NOT_SATISFIED,"FIXED_SHIFT_REQUIRED");
      if(Number.isFinite(Number(req.minHoursPerWeek))&&Number(req.minHoursPerWeek)>Number(a.maxHoursPerWeek))return result(req,NOT_SATISFIED,"HOURS_EXCEED_AVAILABILITY");
      return result(req,SATISFIED,null,"owner availability "+Number(a.maxHoursPerWeek)+" h/week");
    },
    conflict_of_interest:function(req,p,asOf,pol){
      var org=key(req.organization),c=p.conflicts;
      if(!org)return result(req,NOT_ESTABLISHED,"ORGANIZATION_UNKNOWN");
      if(!c||!Array.isArray(c.organizations))return result(req,NOT_ESTABLISHED,"CONFLICTS_NOT_REVIEWED");
      if(c.organizations.map(key).some(function(o){return o&&(o===org||org.indexOf(o)>=0);}))return result(req,NOT_SATISFIED,"CONFLICT_OF_INTEREST");
      var ev=evidenceState(c,asOf,pol);
      return ev.ok?result(req,SATISFIED,null,ev.ref):result(req,NOT_ESTABLISHED,"CONFLICTS_REVIEW_"+ev.reason);
    },
    platform_restriction:function(req,p,asOf){
      var plat=key(req.platform);
      var hit=arr(p.platformStanding).filter(function(s){return key(s.platform)===plat;})[0];
      if(!hit)return result(req,NOT_APPLICABLE,"NO_VERIFIED_RESTRICTION");
      if(hit.status==="barred")return result(req,NOT_SATISFIED,"PLATFORM_BARRED");
      if(hit.status==="reapply_after"&&isDate(hit.until)&&hit.until>asOf)return result(req,NOT_SATISFIED,"REAPPLICATION_WAIT");
      return result(req,NOT_APPLICABLE,"NO_ACTIVE_RESTRICTION");
    },
    requirement_set:function(req){
      return req.ownerConfirmed===true?result(req,SATISFIED,null,"owner confirmed full posting reviewed on "+req.confirmedOn):result(req,NOT_ESTABLISHED,"REQUIREMENT_SET_NOT_CONFIRMED_COMPLETE");
    },
    other:function(req){return result(req,NOT_ESTABLISHED,"UNSTRUCTURED_REQUIREMENT");}
  };
  function credential(req,p,asOf,pol,field,what){
    var k=key(req.key);if(!k)return result(req,NOT_ESTABLISHED,"REQUIREMENT_UNPARSED");
    var items=arr(p[field]).filter(function(c){return key(c.key)===k;});
    if(!items.length)return absent(req,p.completeness&&p.completeness[field],what);
    var live=items.filter(function(c){return !(isDate(c.expiresOn)&&c.expiresOn<asOf);});
    if(!live.length){var e=evidenceState(items[0],asOf,pol);return e.ok?result(req,NOT_SATISFIED,what+"_EXPIRED",e.ref):result(req,NOT_ESTABLISHED,what+"_EXPIRED_OR_UNDOCUMENTED");}
    if(req.jurisdiction){var j=String(req.jurisdiction).toUpperCase();live=live.filter(function(c){return String(c.jurisdiction||"").toUpperCase()===j;});if(!live.length)return absent(req,p.completeness&&p.completeness[field],what+"_JURISDICTION");}
    return fromMatch(req,bestMatch(live,function(){return true;},asOf,pol),false,what);
  }

  // Detect requirements that contradict each other inside one listing.
  function conflicts(reqs){
    var out=[];
    var modes=reqs.filter(function(r){return r.category==="remote"&&r.mandatory!==false;}).map(function(r){return r.mode;});
    if(modes.indexOf("remote")>=0&&(modes.indexOf("onsite")>=0||modes.indexOf("hybrid")>=0))out.push("REMOTE_MODE_CONTRADICTORY");
    var geo=reqs.filter(function(r){return r.category==="geography"&&r.mandatory!==false&&arr(r.allowedCountries).length;});
    if(geo.length>1){
      var common=geo.reduce(function(acc,r){var s=arr(r.allowedCountries).map(function(x){return String(x).toUpperCase();});return acc===null?s:acc.filter(function(c){return s.indexOf(c)>=0;});},null);
      if(!common.length)out.push("GEOGRAPHY_CONTRADICTORY");
    }
    var cls=reqs.filter(function(r){return r.category==="employment_classification"&&r.mandatory!==false;}).map(function(r){return r.type;});
    if(cls.filter(function(v,i){return cls.indexOf(v)===i;}).length>1)out.push("CLASSIFICATION_CONTRADICTORY");
    return out;
  }

  function validateRequirement(r,i){
    if(!r||typeof r!=="object"||Array.isArray(r))return "REQUIREMENT_"+i+"_INVALID";
    if(typeof r.id!=="string"||!r.id)return "REQUIREMENT_"+i+"_ID_MISSING";
    if(CATEGORIES.indexOf(r.category)<0)return "REQUIREMENT_"+i+"_CATEGORY_UNKNOWN";
    return null;
  }

  // evaluate(opportunity, profile, asOf, policy)
  // opportunity: {id, platform, employer, requirements:[...], requirementSet:{ownerConfirmed, confirmedOn}}
  function evaluate(opp,profile,asOf,policy){
    policy=policy||{};
    var out={engine:ENGINE,opportunityId:opp&&opp.id||null,asOf:asOf,status:"WITHHELD_PENDING_VERIFICATION",requirements:[],blocking:[],unresolved:[],
      note:"Eligibility for a published opportunity does not establish platform acceptance, project assignment or compensation."};
    function seal(){if(issued)issued.add(out);return Object.freeze(out);}
    if(!isDate(asOf)){out.status="WITHHELD_PENDING_VERIFICATION";out.unresolved.push("AS_OF_DATE_INVALID");return seal();}
    if(!profile||typeof profile!=="object"||profile.schema!=="incomeos.owner-profile.v1"){out.unresolved.push("OWNER_PROFILE_MISSING_OR_INVALID");return seal();}
    if(!opp||typeof opp!=="object"||!Array.isArray(opp.requirements)){out.unresolved.push("REQUIREMENTS_MISSING");return seal();}
    var reqs=opp.requirements.slice(0,100),bad=reqs.map(validateRequirement).filter(Boolean);
    if(bad.length){out.unresolved=out.unresolved.concat(bad);return seal();}
    // Implicit mandatory checks applied to every opportunity.
    var implicit=[
      {id:"implicit-requirement-set",category:"requirement_set",mandatory:true,ownerConfirmed:!!(opp.requirementSet&&opp.requirementSet.ownerConfirmed===true&&isDate(opp.requirementSet.confirmedOn)&&opp.requirementSet.confirmedOn<=asOf),confirmedOn:opp.requirementSet&&opp.requirementSet.confirmedOn,sourceText:null},
      {id:"implicit-conflict",category:"conflict_of_interest",mandatory:true,organization:opp.employer||opp.platform||"",sourceText:null},
      {id:"implicit-platform-standing",category:"platform_restriction",mandatory:true,platform:opp.platform||"",sourceText:null}
    ];
    if(!reqs.some(function(r){return r.category==="remote";}))implicit.push({id:"implicit-remote",category:"remote",mandatory:true,mode:opp.remoteMode||"unknown",sourceText:null});
    var all=reqs.concat(implicit);
    out.requirements=all.map(function(r){
      try{return evaluators[r.category](r,profile,asOf,policy);}catch(e){return result(r,NOT_ESTABLISHED,"EVALUATION_ERROR");}
    });
    var contradictions=conflicts(reqs);
    out.unresolved=contradictions.slice();
    out.requirements.forEach(function(r){
      if(!r.mandatory)return;
      if(r.status===NOT_SATISFIED)out.blocking.push(r.requirementId+":"+r.reason);
      else if(r.status===NOT_ESTABLISHED)out.unresolved.push(r.requirementId+":"+r.reason);
    });
    out.status=out.blocking.length?"INELIGIBLE":out.unresolved.length?"WITHHELD_PENDING_VERIFICATION":"ELIGIBLE";
    return seal();
  }
  function isEngineDecision(d){return !!(issued&&d&&typeof d==="object"&&issued.has(d));}

  var api=Object.freeze({ENGINE:ENGINE,CATEGORIES:CATEGORIES.slice(),STATUSES:[SATISFIED,NOT_SATISFIED,NOT_ESTABLISHED,NOT_APPLICABLE],evaluate:evaluate,isEngineDecision:isEngineDecision,evidenceState:evidenceState});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSEligibility=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
