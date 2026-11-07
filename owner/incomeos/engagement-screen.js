"use strict";
(function(root){
  // IncomeOS engagement screening and application notes.
  //
  // 1. classify(): tells expert consultations apart from employment, project
  //    work and survey or interview studies, from listing text.
  // 2. confidentialityRisks(): flags requests that could reach confidential
  //    agency information, protected personal data, non-public deliberations or
  //    a former employer. These are flags for the OWNER'S review; IncomeOS never
  //    clears an ethics or post-employment question itself.
  // 3. applicationNotes(): builds a qualification summary for one eligible
  //    opportunity from DOCUMENTED profile items only, matched to each stated
  //    requirement. It never invents experience and never submits anything.
  var VERSION="incomeos.engagement.v1";
  var CONSULT=/\b(expert network|consultation|consulting call|paid call|advisory call|phone consultation|expert call|1[- ]?hour call|subject[- ]matter expert|glg|alphasights|guidepoint|third bridge|coleman research|tegus|dialectica)\b/i;
  var SURVEY=/\b(survey|focus group|user interview|usability (study|test)|research study|diary study|participants? needed)\b/i;
  var EMPLOY=/\b(full[- ]time|part[- ]time employee|w-?2|benefits|401\(k\)|salary|permanent position)\b/i;
  var PROJECT=/\b(contract|contractor|freelance|project[- ]based|1099|per task|hourly project)\b/i;
  function classify(text){
    var t=String(text||"");
    if(CONSULT.test(t))return "EXPERT_CONSULTATION";
    if(SURVEY.test(t))return "RESEARCH_STUDY";
    if(EMPLOY.test(t)&&!PROJECT.test(t))return "EMPLOYMENT";
    if(PROJECT.test(t))return "PROJECT_WORK";
    return "UNCLASSIFIED";
  }
  var RISKS=[
    [/\b(current or former|former|current) (employee|staff|official|investigator|officer)s? (of|at|with)\b/i,"FORMER_OR_CURRENT_EMPLOYEE_SOUGHT"],
    [/\b(non-?public|internal|confidential|proprietary|not publicly available|inside)\b[^.]{0,60}\b(information|data|deliberations?|decisions?|processes|pipeline|investigations?|cases?|policies)\b/i,"NONPUBLIC_INFORMATION_SOUGHT"],
    [/\b(pending|ongoing|open|active) (investigation|case|complaint|matter|litigation|enforcement)s?\b/i,"PENDING_MATTER"],
    [/\b(complainant|respondent|charging party|claimant)s?'? (names?|identit|records?|files?)\b/i,"PROTECTED_PERSONAL_DATA"],
    [/\b(how|what) (the )?(agency|commission|regulator|department|eeoc|hud)\b[^.]{0,60}\b(will|plans?|intends?|decides?|is likely)\b/i,"PREDICT_AGENCY_DECISIONS"]
  ];
  // formerEmployers: owner-maintained list, e.g. ["Maryland Commission on Civil Rights"]
  function confidentialityRisks(text,formerEmployers){
    var t=String(text||""),out=[];
    RISKS.forEach(function(r){if(r[0].test(t))out.push(r[1]);});
    (Array.isArray(formerEmployers)?formerEmployers:[]).forEach(function(name){
      var n=String(name||"").trim();if(n.length<4)return;
      if(t.toLowerCase().indexOf(n.toLowerCase())>=0)out.push("MENTIONS_FORMER_EMPLOYER: "+n);
    });
    return {flags:out,requiresOwnerReview:out.length>0,
      note:out.length?"Review your confidentiality duties and any post-employment rules before accepting. IncomeOS does not decide whether an engagement is permitted.":null};
  }
  var LABELS={education:"Education",experience:"Experience",certification:"Certification",license:"License",geography:"Location",work_authorization:"Work authorization",
    language:"Language",technical_skill:"Skill",clearance:"Clearance",enrollment:"Enrollment",schedule:"Availability",remote:"Remote work",employment_classification:"Engagement type",conflict_of_interest:"Conflicts",platform_restriction:"Platform standing",requirement_set:"Requirements reviewed"};
  function describe(item,group){
    if(!item)return null;
    if(group==="education")return item.degree||(item.level+" degree"+(arr(item.fieldKeys).length?" in "+item.fieldKeys[0].replace(/_/g," "):""));
    if(group==="credentials"||group==="licenses")return item.name||String(item.key||"").replace(/_/g," ");
    if(group==="experience")return item.description||arr(item.domainKeys).join(", ").replace(/_/g," ");
    return null;
  }
  function arr(x){return Array.isArray(x)?x:[];}
  // decision: an IncomeOSEligibility decision with status ELIGIBLE; profile: the same profile.
  function applicationNotes(opportunity,decision,profile){
    if(!decision||decision.status!=="ELIGIBLE")throw Error("Notes are prepared only for opportunities that are eligible on documented evidence");
    var lines=[],used={};
    decision.requirements.forEach(function(r){
      if(r.status!=="SATISFIED"||!r.mandatory||["requirement_set","conflict_of_interest","platform_restriction","remote","employment_classification","schedule"].indexOf(r.category)>=0)return;
      // Use the exact profile item the engine matched; never guess it from a shared free-text reference.
      var proof=r.ownerItem||null;
      if(!proof&&r.category==="geography")proof="Based in "+(profile.location&&profile.location.region?profile.location.region+", ":"")+(profile.location&&profile.location.country||"");
      if(!proof&&r.category==="language")proof="Language requirement met";
      if(!proof||used[proof])return;used[proof]=1;
      lines.push({requirement:r.sourceText?String(r.sourceText).slice(0,200):LABELS[r.category]||r.category,meets:proof,category:LABELS[r.category]||r.category});
    });
    // Relevant documented experience beyond the stated minimums, for the owner to choose from.
    var extra=arr(profile.experience).filter(function(e){return e.evidence&&e.evidence.status==="documented";}).map(function(e){return describe(e,"experience");}).filter(function(d){return d&&!used[d];}).slice(0,5);
    var text=["Application notes: "+String(opportunity.title||"").slice(0,120)+" ("+String(opportunity.platform||opportunity.employer||"").slice(0,80)+")","","How I meet the stated requirements:"]
      .concat(lines.map(function(l){return "- "+l.category+": "+l.meets;}))
      .concat(extra.length?["","Other relevant documented experience:"].concat(extra.map(function(x){return "- "+x;})):[])
      .concat(["","Prepared by IncomeOS from documented profile items only. Check every line before using it; nothing has been submitted."]).join("\n");
    return {version:VERSION,lines:lines,otherExperience:extra,text:text,submitted:false};
  }
  var api=Object.freeze({VERSION:VERSION,classify:classify,confidentialityRisks:confidentialityRisks,applicationNotes:applicationNotes});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSEngagement=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
