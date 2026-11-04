"use strict";
(function(root){
  // Decision Spellchecker program record: one shared data model for the eight
  // IncomeOS program modules (command, research, engineering, validation,
  // commercial intelligence, business development, IP and risk, finance).
  // Every record lives in ONE document with ONE identifier space, so evidence,
  // tasks, gates and pipeline entries can reference each other and every change
  // is logged in one place. Pure functions only: no network, no storage, no
  // outbound contact, no payment and no release. Derived statuses are computed
  // from recorded evidence; nothing here can mark a gate met by itself.
  var SCHEMA="incomeos.ds-program.v1";
  var MODULES=["command","research","engineering","validation","commercial","bizdev","iprisk","finance"];
  var STATUS=["VERIFIED","IN_PROGRESS","UNVERIFIED","BLOCKED","NOT_AUTHORIZED"];
  // CLAUDE.md section 5 source-of-truth hierarchy (1 strongest).
  var LEVELS={1:"Executed primary evidence",2:"Structured primary record",3:"Contemporaneous written communication",4:"Contemporaneous project record",5:"Secondary summary",6:"Model inference",7:"Assumption"};
  var PHASES=["P1_ARCHITECTURE_AND_EVIDENCE_RECOVERY","P2_COMMAND_CENTER","P3_RESEARCH_AND_ENGINEERING","P4_COMMERCIAL_INFRASTRUCTURE","P5_OPERATIONAL_VERIFICATION","P6_CONTROLLED_COMMERCIALIZATION"];
  var IDENTITIES=["DS-A","DS-B","DS-C"];
  var ARMS=["H0","H1","H2","H3"];
  var STAGES=["IDENTIFIED","CONTACTED","REQUIREMENT_VERIFIED","NONBINDING_INTEREST","EXECUTED_AGREEMENT"];
  var BASES=["existing_relationship","published_business_contact","inbound_request","referral_with_consent"];
  // JRS audiences that must never become Decision Spellchecker leads.
  var FORBIDDEN_ORIGINS=["jrs_website_visitor","jrs_resource_user","research_participant","training_recipient"];
  var COST_DIMS=["research_development","software_api","hosting_infrastructure","testing_security","ip_legal","market_research","business_development","reinvestment"];
  var REVENUE_DIMS=["contract_revenue","licensing_revenue"];
  var DIMS=COST_DIMS.concat(REVENUE_DIMS);
  var TASK_STATES=["TODO","IN_PROGRESS","DONE","BLOCKED"];
  var COLLECTIONS=["evidence","assertions","findings","requirements","tasks","defects","releases","studies","runs","segments","competitors","pricing","messages","contacts","pipeline","rights","authorizations"];
  // Restricted actions: each needs every listed gate MET plus an owner authorization record.
  var ACTIONS={
    external_contact:{gates:[],label:"Contact a prospective buyer"},
    automated_outreach:{gates:["G7"],label:"Automated outbound solicitation"},
    external_product_access:{gates:["G1","G2","G5","G6","G7"],label:"Give anyone outside the owner access to the product"},
    sales_listing:{gates:["G1","G2","G3","G4","G6","G7"],label:"Publish a sales listing"},
    binding_offer:{gates:["G1","G2","G3","G4","G6","G7"],label:"Issue a binding offer"},
    licensing_transaction:{gates:["G1","G2","G3","G4","G5","G6","G7","G8"],label:"Execute a licensing or sale agreement"},
    payment_collection:{gates:["G1","G2","G3","G4","G5","G6","G7","G8"],label:"Collect payment"},
    reinvestment:{gates:[],label:"Spend program funds on reinvestment"},
    production_release:{gates:["G1","G2","G3","G4","G5","G6","G7","G8"],label:"Release to production"}
  };
  var GATES=[
    {id:"G1",title:"Original source recovered and authenticated (DS-A)",approver:"OWNER"},
    {id:"G2",title:"SP-01 to SP-18 independently accepted for the authenticated original",approver:"OWNER"},
    {id:"G3",title:"Rights clearance: grant-specific authorization for every component in scope",approver:"COUNSEL"},
    {id:"G4",title:"Independent labeled and adjudicated validation",approver:"OWNER"},
    {id:"G5",title:"Operator controls verified: authentication, database-enforced access, retention, recovery",approver:"OWNER"},
    {id:"G6",title:"Counsel review of data flows, privacy, claims and licensing",approver:"COUNSEL"},
    {id:"G7",title:"Recorded owner release authorization",approver:"OWNER"},
    {id:"G8",title:"Independent production QA",approver:"OWNER"}
  ];
  function isDate(x){return typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+"T00:00:00Z"))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;}
  function rid(x){return typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._:-]{1,79}$/.test(x);}
  function txt(x,max,what){var s=String(x==null?"":x).trim();if(!s)throw Error(what+" is required");return s.slice(0,max);}
  function opt(x,max){var s=String(x==null?"":x).trim();return s?s.slice(0,max):null;}
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function arr(x){return Array.isArray(x)?x:[];}
  function int(x,lo,hi,what){var n=Number(x);if(!Number.isInteger(n)||n<lo||n>hi)throw Error(what+" must be a whole number from "+lo+" to "+hi);return n;}
  function money(x,what){var s=String(x==null?"":x).trim();if(!/^\d{1,9}(\.\d{1,2})?$/.test(s))throw Error(what+" must be an amount like 1200.00");return Math.round(Number(s)*100);}
  function cents(c){return Math.round(c)/100;}

  // ---------- seeded program ----------
  function newProgram(on){
    if(!isDate(on))throw Error("Date required");
    var p={schema:SCHEMA,programId:"DSP",title:"Decision Spellchecker",
      proposition:"Ordinary spellcheck asks whether the words are written correctly. Decision Spellchecker asks whether the recorded justification is supported.",
      boundary:"Supports professional judgment; does not decide whether an employment, legal, compliance or investigative decision is correct.",
      governing:{reference:"JRS / DRR / Decision Spellchecker Master Program, Issue 3.4, Amendment O3, 2026-10-31",inRepository:false},
      phase:PHASES[0],createdOn:on,
      identities:[
        {id:"DS-A",title:"Original Decision Spellchecker implementation",status:"UNVERIFIED",note:"Original source, provenance and reproducible build not verified."},
        {id:"DS-B",title:"R6 synthetic research laboratory",status:"UNVERIFIED",note:"Research and design evidence only; not a product."},
        {id:"DS-C",title:"New private software modules",status:"UNVERIFIED",note:"New implementations, never presented as recovered original software. None recorded yet."}
      ],
      acceptance:[],gates:GATES.map(function(g){return {id:g.id,title:g.title,approver:g.approver,mandatory:true,evidenceIds:[],approval:null};}),
      evidence:[
        {id:"E-REPO-001",title:"Repository status line: original DS NO_GO_NOT_VERIFIED; independent H2/H3 NOT_ESTABLISHED; commercial transfer NOT_AUTHORIZED",level:4,
          source:"docs/program-status/INVESTIGATOR_GUIDES_DIRECT_FREE_DELIVERY_CORRECTION_2026-10-31.md line 49",date:"2026-10-31",confidence:"medium",
          assumptions:"The status line reflects the program state on that date.",contradictions:"None found in the repository.",informs:"Program status baseline"},
        {id:"E-REPO-002",title:"Current Engine handoff: external controlled use not verified; release gates 1 to 5 open",level:4,
          source:"docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md",date:"2026-10-05",confidence:"high",
          assumptions:"The handoff remains the operative override.",contradictions:"None found.",informs:"Gates G4 to G8"}
      ],
      assertions:[
        {id:"A-001",statement:"DS-A has 0 of 18 SP checks independently accepted.",assertedBy:"OWNER",source:"Owner directive 2026-11-04 citing Master Program Issue 3.4, Amendment O3",sourceInRepository:false,date:"2026-11-04"},
        {id:"A-002",statement:"The prior rights inventory found 0 grant-specific transfer authorizations across 32 components.",assertedBy:"OWNER",source:"Owner directive 2026-11-04",sourceInRepository:false,date:"2026-11-04"},
        {id:"A-003",statement:"The 156-parent-record study design and the separate 24/32/100 cohorts are proposed, not completed.",assertedBy:"OWNER",source:"Owner directive 2026-11-04",sourceInRepository:false,date:"2026-11-04"},
        {id:"A-004",statement:"Work packages SAL-01 to SAL-05 are active for planning and analysis only.",assertedBy:"OWNER",source:"Owner directive 2026-11-04",sourceInRepository:false,date:"2026-11-04"}
      ],
      blockers:[
        {id:"BL-001",title:"Controlling documents are not in the repository",detail:"Master Program Issue 3.4 Amendment O3, the SP-01 to SP-18 criteria, SAL-01 to SAL-05, the 32-component rights inventory and the study designs must be supplied before any of them can be cited as evidence.",severity:"CRITICAL",nextActionBy:"OWNER"},
        {id:"BL-002",title:"Source-aligned files of 2026-10-03 unavailable",detail:"CURRENT_ENGINE_HANDOFF_2026-10-05.md requires them for evidence, release-status and rights work.",severity:"HIGH",nextActionBy:"OWNER"},
        {id:"BL-003",title:"Original DS-A source not recovered or authenticated",detail:"Gate G1 cannot be met.",severity:"CRITICAL",nextActionBy:"OWNER"},
        {id:"BL-004",title:"No authenticated private backend",detail:"Program data stays in the owner-held workspace file until a private database with enforced access is provisioned and verified.",severity:"HIGH",nextActionBy:"OWNER"}
      ],
      findings:[],requirements:[],tasks:[],defects:[],releases:[],
      studies:[
        {id:"ST-156",title:"156-parent-record comparative study",kind:"independent",status:"PLANNED",arms:["H0","H1","H2","H3"],minimumN:156,note:"Proposed design; no results."},
        {id:"ST-COHORTS",title:"24/32/100 cohort studies",kind:"independent",status:"PLANNED",arms:["H0","H1","H2","H3"],minimumN:24,note:"Proposed; no results."}
      ],
      runs:[],segments:[],competitors:[],pricing:[],messages:[],contacts:[],pipeline:[],rights:[],authorizations:[],cycles:[],changeLog:[]};
    for(var i=1;i<=18;i++){var n=(i<10?"0":"")+i;p.acceptance.push({id:"SP-"+n,identity:"DS-A",criterion:null,criterionSource:"NOT IN REPOSITORY",status:"NOT_ACCEPTED",evidenceIds:[]});}
    [["SEG-GRC","Governance, risk and compliance"],["SEG-INV","Investigations"],["SEG-AIGOV","AI governance"],["SEG-MRM","Model risk"],["SEG-SUPPLIER","Supplier exceptions"],["SEG-HR","HR"],["SEG-EMPLOY","Employment decision review"]].forEach(function(s){
      p.segments.push({id:s[0],title:s[1],status:"UNVERIFIED",findingIds:[],note:"Candidate market; no source-backed finding yet."});
    });
    [["CMP-MANUAL","Manual review"],["CMP-JRS","JRS-assisted review"],["CMP-GPAI","General-purpose AI with human oversight"],["CMP-VENDOR","Specialist software vendors"]].forEach(function(c){
      p.competitors.push({id:c[0],title:c[1],findingIds:[],note:"No source-backed comparison yet."});
    });
    return log(p,"PROGRAM_CREATED",{phase:p.phase},on);
  }
  function log(p,action,detail,on){
    var seq=arr(p.changeLog).length+1;
    p.changeLog=arr(p.changeLog).concat([{seq:seq,on:on,action:action,detail:detail||{}}]);
    if(p.changeLog.length>5000)throw Error("Program change log is full; archive it before continuing");
    return p;
  }

  // ---------- validation ----------
  function ids(p){
    var all={};
    COLLECTIONS.concat(["identities","acceptance","gates","blockers"]).forEach(function(c){arr(p[c]).forEach(function(r){if(r&&r.id){if(all[r.id])throw Error("Identifier used twice: "+r.id);all[r.id]=c;}});});
    return all;
  }
  function validate(p){
    if(!p||typeof p!=="object"||Array.isArray(p)||p.schema!==SCHEMA)throw Error("Expected an "+SCHEMA+" record");
    if(PHASES.indexOf(p.phase)<0)throw Error("Unknown program phase");
    COLLECTIONS.concat(["identities","acceptance","gates","blockers","cycles","changeLog"]).forEach(function(c){if(!Array.isArray(p[c]))throw Error("Missing section: "+c);if(p[c].length>5000)throw Error(c+" has too many rows");});
    var all=ids(p);
    // References must point at the expected kind of record, not just any identifier.
    function refs(list,kind,what){arr(list).forEach(function(x){if(all[x]!==kind)throw Error(what+" references an unknown "+kind+" record: "+x);});}
    p.tasks.forEach(function(t){refs(t.dependsOn,"tasks","Task "+t.id);refs(t.evidenceIds,"evidence","Task "+t.id);});
    p.gates.forEach(function(g){refs(g.evidenceIds,"evidence","Gate "+g.id);});
    p.acceptance.forEach(function(a){refs(a.evidenceIds,"evidence","Check "+a.id);});
    p.findings.forEach(function(f){refs(f.evidenceIds,"evidence","Finding "+f.id);});
    p.pipeline.forEach(function(e){refs(e.evidenceIds,"evidence","Pipeline "+e.id);if(e.contactId)refs([e.contactId],"contacts","Pipeline "+e.id);});
    p.runs.forEach(function(r){refs([r.studyId],"studies","Run "+r.id);refs(r.evidenceIds,"evidence","Run "+r.id);});
    p.rights.forEach(function(r){refs(r.evidenceIds,"evidence","Component "+r.id);});
    function level(id){var e=byId(p,"evidence",id);return e?e.level:99;}
    // A loaded file is held to the same rules as the API: approvals, grants and stages need their records.
    p.gates.forEach(function(g){
      var def=GATES.filter(function(x){return x.id===g.id;})[0];
      if(!def||g.approver!==def.approver||g.mandatory!==true)throw Error("Gate "+g.id+" does not match its definition");
      if(!g.approval)return;
      if(g.approval.by!==def.approver||!isDate(g.approval.on)||!g.approval.ref||!g.evidenceIds.length||g.evidenceIds.some(function(e){return level(e)>2;}))
        throw Error("Gate "+g.id+" approval lacks its approver, date, reference or primary evidence");
      if(g.id==="G2"&&p.acceptance.some(function(x){return x.status!=="ACCEPTED";}))throw Error("Gate G2 is approved while SP checks remain unaccepted");
      if(g.id==="G3"&&(!p.rights.length||p.rights.some(function(r){return r.grantSpecificTransferAuthorization!==true;})))throw Error("Gate G3 is approved while rights authorizations are missing");
    });
    if(p.gates.length!==GATES.length)throw Error("All eight mandatory gates must be present");
    p.authorizations.forEach(function(a){
      if(!ACTIONS[a.action]||a.grantedBy!=="OWNER"||!isDate(a.grantedOn)||!a.ref)throw Error("Authorization "+a.id+" lacks a known action, owner grant, date or reference");
    });
    p.rights.forEach(function(r){
      if(r.grantSpecificTransferAuthorization===true&&!r.evidenceIds.some(function(e){return level(e)===1;}))throw Error("Component "+r.id+" claims a transfer authorization without an executed instrument");
    });
    p.pipeline.forEach(function(e){
      var h=arr(e.history).map(function(x){return x.stage;});
      if(STAGES.indexOf(e.stage)<0||h.join()!==STAGES.slice(0,STAGES.indexOf(e.stage)+1).join())throw Error("Pipeline "+e.id+" stage history is not sequential");
      if(e.stage!=="IDENTIFIED"&&STAGES.indexOf(e.stage)>=1&&!e.contactId)throw Error("Pipeline "+e.id+" passed CONTACTED without a contact");
      if(e.stage==="EXECUTED_AGREEMENT"&&(!e.agreementRef||e.nonbinding!==false||!e.evidenceIds.some(function(x){return level(x)===1;})))throw Error("Pipeline "+e.id+" is executed without an executed instrument");
    });
    // A new-module (DS-C) result can never satisfy an acceptance check of the original (DS-A).
    p.acceptance.forEach(function(a){
      if(a.identity!=="DS-A")throw Error("SP checks apply to the original DS-A only");
      if(a.status==="ACCEPTED"&&!acceptable(p,a))throw Error(a.id+" is marked accepted without qualifying independent evidence");
    });
    return p;
  }
  function byId(p,c,id){return arr(p[c]).filter(function(r){return r.id===id;})[0]||null;}
  function acceptable(p,a){
    var ev=arr(a.evidenceIds).map(function(i){return byId(p,"evidence",i);});
    return ev.length>0&&ev.every(function(e){return e&&e.level<=2&&e.subject==="DS-A"&&e.independent===true;});
  }

  // ---------- additions ----------
  function add(p0,collection,x,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),all=ids(p),rec;
    if(!x||typeof x!=="object")throw Error("Record required");
    var id=txt(x.id,80,"Identifier");if(!rid(id))throw Error("Identifiers use letters, numbers, dot, dash, colon or underscore");
    if(all[id])throw Error("Identifier already used: "+id);
    function ev(list,required){var l=arr(list).map(String);if(required&&!l.length)throw Error("Link at least one evidence record");l.forEach(function(e){if(all[e]!=="evidence")throw Error("Unknown evidence record: "+e);});return l;}
    if(collection==="evidence"){
      var level=int(x.level,1,7,"Evidence level");
      if(!isDate(x.date)||x.date>on)throw Error("Evidence date required and not in the future");
      rec={id:id,title:txt(x.title,200,"Title"),level:level,source:txt(x.source,300,"Source"),date:x.date,confidence:["high","medium","low"].indexOf(x.confidence)>=0?x.confidence:"low",
        assumptions:txt(x.assumptions,500,"Assumptions"),contradictions:txt(x.contradictions,500,"Contradictory evidence (write 'none found' if none)"),informs:txt(x.informs,200,"Decision informed")};
      if(x.subject){if(IDENTITIES.indexOf(x.subject)<0)throw Error("Unknown product identity");rec.subject=x.subject;}
      if(x.independent===true)rec.independent=true;
    }else if(collection==="findings"){
      rec={id:id,module:MODULES.indexOf(x.module)>=0?x.module:"research",question:txt(x.question,200,"Question"),answer:txt(x.answer,800,"Finding"),
        evidenceIds:ev(x.evidenceIds,true),date:isDate(x.date)?x.date:on,confidence:["high","medium","low"].indexOf(x.confidence)>=0?x.confidence:"low",
        assumptions:txt(x.assumptions,500,"Assumptions"),contradictions:txt(x.contradictions,500,"Contradictory evidence (write 'none found' if none)"),informs:txt(x.informs,200,"Decision informed")};
      // Quantities (market size, price acceptance, interest) need sourced evidence, never inference or assumption.
      if(x.quantity!=null&&x.quantity!==""){
        var weak=rec.evidenceIds.some(function(e){return byId(p,"evidence",e).level>5;});
        if(weak)throw Error("A quantitative finding needs sourced evidence (level 5 or stronger), not inference or assumption");
        rec.quantity=txt(x.quantity,120,"Quantity");
      }
      if(x.segmentId){var seg=byId(p,"segments",x.segmentId);if(!seg)throw Error("Unknown segment");rec.segmentId=x.segmentId;seg.findingIds=arr(seg.findingIds).concat([id]);}
    }else if(collection==="requirements"){
      rec={id:id,version:int(x.version==null?1:x.version,1,999,"Version"),text:txt(x.text,1000,"Requirement"),identity:IDENTITIES.indexOf(x.identity)>=0?x.identity:"DS-C",status:"DRAFT",evidenceIds:ev(x.evidenceIds,false)};
    }else if(collection==="tasks"){
      var deps=arr(x.dependsOn).map(String);deps.forEach(function(d){if(all[d]!=="tasks")throw Error("Unknown dependency: "+d);});
      rec={id:id,module:MODULES.indexOf(x.module)>=0?x.module:"engineering",title:txt(x.title,200,"Task"),state:"TODO",dependsOn:deps,evidenceIds:ev(x.evidenceIds,false),
        value:int(x.value==null?3:x.value,1,5,"Decision value"),cost:int(x.cost==null?3:x.cost,1,5,"Cost"),risk:int(x.risk==null?3:x.risk,1,5,"Risk"),
        restrictedAction:x.restrictedAction&&ACTIONS[x.restrictedAction]?x.restrictedAction:null};
    }else if(collection==="defects"){
      rec={id:id,title:txt(x.title,200,"Defect"),severity:["CRITICAL","HIGH","MEDIUM","LOW"].indexOf(x.severity)>=0?x.severity:"MEDIUM",identity:IDENTITIES.indexOf(x.identity)>=0?x.identity:"DS-C",status:"OPEN"};
    }else if(collection==="releases"){
      rec={id:id,identity:IDENTITIES.indexOf(x.identity)>=0?x.identity:"DS-C",version:txt(x.version,40,"Version"),status:"CANDIDATE",rollbackPlan:txt(x.rollbackPlan,500,"Rollback plan"),released:false};
    }else if(collection==="runs"){
      var st=byId(p,"studies",x.studyId);if(!st)throw Error("Unknown study");
      if(ARMS.indexOf(x.arm)<0)throw Error("Arm must be H0, H1, H2 or H3");
      if(x.kind!=="synthetic"&&x.kind!=="independent")throw Error("Run kind must be synthetic or independent");
      if(x.kind!==st.kind)throw Error("Run kind must match its study ("+st.kind+")");
      var m=x.metrics||{};
      rec={id:id,studyId:x.studyId,arm:x.arm,kind:x.kind,date:isDate(x.date)?x.date:on,identity:IDENTITIES.indexOf(x.identity)>=0?x.identity:null,
        metrics:{tp:int(m.tp,0,1e6,"True positives"),fp:int(m.fp,0,1e6,"False positives"),fn:int(m.fn,0,1e6,"False negatives"),tn:int(m.tn==null?0:m.tn,0,1e6,"True negatives"),minutes:m.minutes==null?null:int(m.minutes,0,1e7,"Minutes")},
        evidenceIds:ev(x.evidenceIds,true)};
      if(x.arm==="H3"&&rec.identity!=="DS-A")throw Error("H3 is the authenticated original (DS-A); record a DS-C result as a separate synthetic study");
    }else if(collection==="studies"){
      rec={id:id,title:txt(x.title,200,"Study"),kind:x.kind==="independent"?"independent":"synthetic",status:"PLANNED",arms:arr(x.arms).filter(function(a){return ARMS.indexOf(a)>=0;}),minimumN:int(x.minimumN==null?1:x.minimumN,1,100000,"Minimum sample"),note:opt(x.note,300)};
      if(rec.arms.length<1)throw Error("Choose at least one arm");
    }else if(collection==="pricing"){
      var model=["subscription","licensing","usage","oem","acquisition"].indexOf(x.model)>=0?x.model:null;if(!model)throw Error("Choose a pricing model");
      rec={id:id,model:model,label:txt(x.label,120,"Scenario name"),priceCents:money(x.priceUsd,"Price"),unitsPerMonth:int(x.unitsPerMonth,0,1e6,"Units per month"),
        variableCostCents:money(x.variableCostUsd==null?"0":x.variableCostUsd,"Variable cost"),fixedMonthlyCents:money(x.fixedMonthlyUsd==null?"0":x.fixedMonthlyUsd,"Fixed monthly cost"),
        investmentCents:money(x.investmentUsd==null?"0":x.investmentUsd,"Investment to recover"),evidenceIds:ev(x.evidenceIds,false),assumptions:txt(x.assumptions,500,"Assumptions"),projection:true};
    }else if(collection==="messages"){
      rec={id:id,text:txt(x.text,4000,"Message"),approvedBy:x.approvedBy==="OWNER"?"OWNER":null,approvedOn:x.approvedBy==="OWNER"?on:null};
    }else if(collection==="contacts"){
      var origin=String(x.origin==null?"":x.origin).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
      // Normalized, and also refused when the wording names a JRS audience in other words.
      if(FORBIDDEN_ORIGINS.indexOf(origin)>=0||/(^|_)jrs(_|$)/.test(origin)||/participant|training|trainee|resource_user|website_visitor/.test(origin))
        throw Error("JRS visitors, resource users, research participants and training recipients cannot become Decision Spellchecker leads");
      if(BASES.indexOf(x.lawfulBasis)<0)throw Error("Record the lawful contact basis");
      rec={id:id,organization:txt(x.organization,120,"Organization"),role:txt(x.role,120,"Role"),origin:txt(origin,60,"Where the contact came from"),lawfulBasis:x.lawfulBasis,
        basisNote:txt(x.basisNote,300,"Basis detail"),channel:opt(x.channel,40),approvedMessageId:null,contactedOn:null,response:null,suppressed:x.suppressed===true};
    }else if(collection==="pipeline"){
      rec={id:id,organization:txt(x.organization,120,"Organization"),stage:"IDENTIFIED",evidenceIds:ev(x.evidenceIds,false),contactId:null,agreementRef:null,history:[{stage:"IDENTIFIED",on:on}],nonbinding:true};
    }else if(collection==="rights"){
      rec={id:id,component:txt(x.component,160,"Component"),kind:["original_source","new_code","third_party_dependency","research_material","contributor_work","documentation"].indexOf(x.kind)>=0?x.kind:"original_source",
        rightsStatus:"UNRESOLVED",grantSpecificTransferAuthorization:false,possibleExclusion:opt(x.possibleExclusion,300),evidenceIds:ev(x.evidenceIds,false)};
    }else throw Error("Records of that kind are added through their own action");
    p[collection]=p[collection].concat([rec]);
    return validate(log(p,"ADD_"+collection.toUpperCase(),{id:id},on));
  }

  // ---------- controlled changes ----------
  function setTaskState(p0,id,state,on){
    if(!isDate(on))throw Error("Date required");if(TASK_STATES.indexOf(state)<0)throw Error("Unknown task state");
    var p=clone(validate(p0)),t=byId(p,"tasks",id);if(!t)throw Error("Unknown task");
    if(state==="DONE"||state==="IN_PROGRESS"){
      var open=t.dependsOn.filter(function(d){return byId(p,"tasks",d).state!=="DONE";});
      if(open.length)throw Error("Finish its dependencies first: "+open.join(", "));
      if(t.restrictedAction&&!authorized(p,t.restrictedAction).allowed)throw Error("This task performs a restricted action that is not authorized");
    }
    if(state==="DONE"&&!t.evidenceIds.length)throw Error("Link evidence of the result before marking the task done");
    t.state=state;return validate(log(p,"TASK_STATE",{id:id,state:state},on));
  }
  function linkEvidence(p0,collection,id,evidenceId,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),r=byId(p,collection,id);if(!r||!Array.isArray(r.evidenceIds))throw Error("Unknown record");
    if(!byId(p,"evidence",evidenceId))throw Error("Unknown evidence record");
    if(r.evidenceIds.indexOf(evidenceId)<0)r.evidenceIds.push(evidenceId);
    return validate(log(p,"LINK_EVIDENCE",{collection:collection,id:id,evidenceId:evidenceId},on));
  }
  // Human approval of a gate: the approver must be the gate's named authority and the evidence must be primary.
  function approveGate(p0,gateId,a,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),g=byId(p,"gates",gateId);if(!g)throw Error("Unknown gate");
    if(!a||a.by!==g.approver)throw Error("Gate "+gateId+" is approved by "+g.approver+" only");
    var ref=txt(a.ref,200,"Approval record reference");
    if(!g.evidenceIds.length||g.evidenceIds.some(function(e){return byId(p,"evidence",e).level>2;}))throw Error("A gate needs primary evidence (level 1 or 2) before approval");
    if(gateId==="G2"&&p.acceptance.some(function(x){return x.status!=="ACCEPTED";}))throw Error("Every SP check must be accepted first");
    if(gateId==="G3"&&(!p.rights.length||p.rights.some(function(r){return r.grantSpecificTransferAuthorization!==true;})))throw Error("Every component needs a grant-specific transfer authorization first");
    g.approval={by:a.by,on:on,ref:ref};
    return validate(log(p,"GATE_APPROVED",{gate:gateId,by:a.by,ref:ref},on));
  }
  function acceptCheck(p0,checkId,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),a=byId(p,"acceptance",checkId);if(!a)throw Error("Unknown check");
    if(!acceptable(p,a))throw Error("Acceptance needs independent primary evidence about the original DS-A; new-module test passes do not qualify");
    a.status="ACCEPTED";return validate(log(p,"SP_ACCEPTED",{id:checkId},on));
  }
  function recordRightsAuthorization(p0,componentId,evidenceId,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),r=byId(p,"rights",componentId),e=byId(p,"evidence",evidenceId);
    if(!r||!e)throw Error("Unknown component or evidence");
    if(e.level>1)throw Error("A transfer authorization must be an executed instrument (level 1)");
    r.grantSpecificTransferAuthorization=true;r.rightsStatus="AUTHORIZATION_RECORDED_PENDING_COUNSEL";if(r.evidenceIds.indexOf(evidenceId)<0)r.evidenceIds.push(evidenceId);
    return validate(log(p,"RIGHTS_AUTHORIZATION",{id:componentId,evidenceId:evidenceId},on));
  }
  function gateMet(p,id){var g=byId(p,"gates",id);return !!(g&&g.approval);}
  function authorized(p,action){
    var a=ACTIONS[action];if(!a)return {allowed:false,missing:["UNKNOWN_ACTION"]};
    var missing=a.gates.filter(function(g){return !gateMet(p,g);});
    var grant=arr(p.authorizations).filter(function(x){return x.action===action&&x.grantedBy==="OWNER";})[0];
    if(!grant)missing.push("OWNER_AUTHORIZATION");
    return {allowed:missing.length===0,missing:missing,label:a.label};
  }
  function authorize(p0,action,x,on){
    if(!isDate(on))throw Error("Date required");
    if(!ACTIONS[action])throw Error("Unknown action");
    if(!x||x.grantedBy!=="OWNER")throw Error("Only the owner can authorize a restricted action");
    var p=clone(validate(p0)),id="AUTH-"+action+"-"+(p.authorizations.length+1);
    p.authorizations.push({id:id,action:action,grantedBy:"OWNER",grantedOn:on,ref:txt(x.ref,200,"Authorization record reference"),scope:txt(x.scope,300,"Scope")});
    return validate(log(p,"AUTHORIZED",{action:action,ref:x.ref},on));
  }
  function approveMessage(p0,id,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),m=byId(p,"messages",id);if(!m)throw Error("Unknown message");
    m.approvedBy="OWNER";m.approvedOn=on;return validate(log(p,"MESSAGE_APPROVED",{id:id},on));
  }
  // The owner records a contact they made. Nothing here sends anything.
  function recordContact(p0,contactId,x,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),c=byId(p,"contacts",contactId);if(!c)throw Error("Unknown contact");
    if(c.suppressed)throw Error("This contact is suppressed and must not be contacted");
    var m=byId(p,"messages",x&&x.messageId);if(!m||m.approvedBy!=="OWNER")throw Error("Use an owner-approved message");
    if(!authorized(p,"external_contact").allowed)throw Error("External contact is not authorized");
    c.approvedMessageId=m.id;c.contactedOn=on;c.channel=txt(x.channel||c.channel,40,"Channel");c.response=opt(x.response,300);
    return validate(log(p,"CONTACT_RECORDED",{id:contactId},on));
  }
  function suppress(p0,contactId,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),c=byId(p,"contacts",contactId);if(!c)throw Error("Unknown contact");
    c.suppressed=true;return validate(log(p,"CONTACT_SUPPRESSED",{id:contactId},on));
  }
  // Stages cannot be skipped; each needs its own evidence or authorization.
  function advance(p0,pipelineId,x,on){
    if(!isDate(on))throw Error("Date required");
    var p=clone(validate(p0)),e=byId(p,"pipeline",pipelineId);if(!e)throw Error("Unknown pipeline entry");
    var next=STAGES[STAGES.indexOf(e.stage)+1];if(!next)throw Error("Already at the final stage");
    x=x||{};
    function strong(maxLevel,what){var l=arr(x.evidenceIds);if(!l.length)throw Error(what);l.forEach(function(i){var ev=byId(p,"evidence",i);if(!ev||ev.level>maxLevel)throw Error(what);});return l;}
    if(next==="CONTACTED"){
      var c=byId(p,"contacts",x.contactId);if(!c||!c.contactedOn)throw Error("Record the contact in the contact ledger first");
      if(c.organization!==e.organization)throw Error("The contact must belong to this organization");
      e.contactId=c.id;
    }else if(next==="REQUIREMENT_VERIFIED"){e.evidenceIds=e.evidenceIds.concat(strong(3,"A verified requirement needs written evidence from the buyer (level 3 or stronger)"));}
    else if(next==="NONBINDING_INTEREST"){e.evidenceIds=e.evidenceIds.concat(strong(3,"A nonbinding expression of interest needs the buyer's written statement (level 3 or stronger)"));}
    else if(next==="EXECUTED_AGREEMENT"){
      if(!authorized(p,"licensing_transaction").allowed)throw Error("Executing an agreement is not authorized: required gates and owner authorization are missing");
      e.evidenceIds=e.evidenceIds.concat(strong(1,"An executed agreement needs the executed instrument (level 1)"));
      e.agreementRef=txt(x.agreementRef,120,"Agreement reference");e.nonbinding=false;
    }
    e.stage=next;e.history.push({stage:next,on:on});
    return validate(log(p,"PIPELINE_ADVANCED",{id:pipelineId,stage:next},on));
  }
  function setPhase(p0,phase,on){
    if(!isDate(on))throw Error("Date required");
    if(PHASES.indexOf(phase)<0)throw Error("Unknown phase");
    var p=clone(validate(p0));p.phase=phase;return validate(log(p,"PHASE_SET",{phase:phase},on));
  }

  // ---------- derived views ----------
  function prioritize(p){
    var done={};p.tasks.forEach(function(t){if(t.state==="DONE")done[t.id]=1;});
    return p.tasks.filter(function(t){return t.state!=="DONE";}).map(function(t){
      var waiting=t.dependsOn.filter(function(d){return !done[d];}),restricted=t.restrictedAction?authorized(p,t.restrictedAction):null;
      var state=waiting.length?"BLOCKED_BY_DEPENDENCY":restricted&&!restricted.allowed?"NOT_AUTHORIZED":t.state==="BLOCKED"?"BLOCKED":"READY";
      // Expected decision value against cost and risk, on the owner's own 1 to 5 scales.
      return {id:t.id,title:t.title,module:t.module,state:state,taskState:t.state,evidence:t.evidenceIds.length,score:t.value*2-t.cost-t.risk,waitingOn:waiting,missing:restricted?restricted.missing:[]};
    }).sort(function(a,b){var o={READY:0,BLOCKED:1,BLOCKED_BY_DEPENDENCY:2,NOT_AUTHORIZED:3};return o[a.state]-o[b.state]||b.score-a.score||(a.id<b.id?-1:1);});
  }
  function comparisons(p){
    // A claim that one approach outperforms another needs completed independent studies with both arms.
    var out=[];
    [["H3","H2"],["H3","H1"],["H3","H0"],["H2","H1"]].forEach(function(pair){
      var supported=p.studies.filter(function(s){
        if(s.kind!=="independent"||s.status!=="COMPLETE")return false;
        return pair.every(function(arm){return p.runs.some(function(r){var m=r.metrics;return r.studyId===s.id&&r.arm===arm&&r.kind==="independent"&&m.tp+m.fp+m.fn+m.tn>=s.minimumN;});});
      });
      out.push({claim:pair[0]+" outperforms "+pair[1],status:supported.length?"COMPARISON_AVAILABLE_FOR_REVIEW":"NOT_ESTABLISHED",studies:supported.map(function(s){return s.id;})});
    });
    return out;
  }
  function runMetrics(r){var m=r.metrics,pp=m.tp+m.fp,ap=m.tp+m.fn;return {precision:pp?Math.round(m.tp/pp*1000)/1000:null,recall:ap?Math.round(m.tp/ap*1000)/1000:null,falsePositives:m.fp,falseNegatives:m.fn};}
  function monthKey(d){return d.slice(0,7);}
  function prevMonth(asOf){var y=Number(asOf.slice(0,4)),m=Number(asOf.slice(5,7))-1;if(m===0){y--;m=12;}return y+"-"+(m<10?"0":"")+m;}
  // Actual figures come only from the workspace ledger rows tagged to the program; projections never mix in.
  function finance(p,ws,asOf){
    var rows=arr(ws&&ws.ledger).filter(function(r){return r&&r.program==="decision-spellchecker"&&DIMS.indexOf(r.dsDimension)>=0;});
    var byDim={},issues=[],lastMonth=prevMonth(asOf),monthCost=0,received=0,recordedUnverified=0;
    DIMS.forEach(function(d){byDim[d]=0;});
    rows.forEach(function(r){
      var c=Math.round(Number(r.kind==="income"?r.grossUsd:r.amountUsd)*100);if(!Number.isSafeInteger(c)||c<=0){issues.push({code:"AMOUNT_INVALID",id:r.id});return;}
      if(r.kind==="income"){
        if(REVENUE_DIMS.indexOf(r.dsDimension)<0){issues.push({code:"INCOME_IN_COST_DIMENSION",id:r.id});return;}
        var deal=byId(p,"pipeline",r.dsAgreementId);
        if(!deal||deal.stage!=="EXECUTED_AGREEMENT")issues.push({code:"REVENUE_WITHOUT_EXECUTED_AGREEMENT",id:r.id});
        if(r.evidenceStatus==="both"&&deal&&deal.stage==="EXECUTED_AGREEMENT")received+=c;else recordedUnverified+=c;
        byDim[r.dsDimension]+=c;
      }else{
        if(COST_DIMS.indexOf(r.dsDimension)<0){issues.push({code:"COST_IN_REVENUE_DIMENSION",id:r.id});return;}
        if(r.dsDimension==="reinvestment"&&r.type!=="refund"&&!authorized(p,"reinvestment").allowed)issues.push({code:"REINVESTMENT_NOT_AUTHORIZED",id:r.id});
        // A refund row returns money: it reduces the dimension's cost instead of adding to it.
        var signed=r.type==="refund"?-c:c;
        byDim[r.dsDimension]+=signed;
        if(monthKey(r.date)===lastMonth)monthCost+=signed;
      }
    });
    var totalCost=COST_DIMS.reduce(function(s,d){return s+byDim[d];},0);
    var dims={};DIMS.forEach(function(d){dims[d]=cents(byDim[d]);});
    var scenarios=p.pricing.map(function(s){
      var contribution=s.unitsPerMonth*(s.priceCents-s.variableCostCents)-s.fixedMonthlyCents,months=null,flow=[],cum=-s.investmentCents;
      if(contribution>0)months=Math.ceil(s.investmentCents/contribution);
      for(var i=1;i<=12;i++){cum+=contribution;flow.push({month:i,cumulativeUsd:cents(cum)});}
      var sourced=s.evidenceIds.length>0&&s.evidenceIds.every(function(e){var x=byId(p,"evidence",e);return x&&x.level<=5;});
      return {id:s.id,label:s.label,model:s.model,basis:"PROJECTION",monthlyRevenueUsd:cents(s.unitsPerMonth*s.priceCents),monthlyContributionUsd:cents(contribution),
        breakEvenMonths:months,cashFlow12:flow,priceBasis:sourced?"SOURCE_BACKED":"ASSUMPTION",assumptions:s.assumptions};
    });
    return {actual:{costsByDimensionUsd:dims,totalCostUsd:cents(totalCost),lastMonth:lastMonth,lastMonthOperatingCostUsd:cents(monthCost),
        revenueReceivedUsd:cents(received),revenueRecordedNotVerifiedUsd:cents(recordedUnverified),rows:rows.length},
      projections:scenarios,issues:issues,
      notice:"Actual figures are ledger rows tagged to the program. Revenue counts as received only when bank-matched and tied to an executed agreement. Scenarios are projections, never earned revenue."};
  }
  function command(p0,ws,asOf){
    if(!isDate(asOf))throw Error("Date required");
    var p=validate(p0),gates=p.gates.map(function(g){return {id:g.id,title:g.title,approver:g.approver,status:g.approval?"VERIFIED":"BLOCKED",evidence:g.evidenceIds.length};});
    var openGates=gates.filter(function(g){return g.status!=="VERIFIED";});
    var accepted=p.acceptance.filter(function(a){return a.status==="ACCEPTED";}).length;
    var stages={};STAGES.forEach(function(s){stages[s]=0;});p.pipeline.forEach(function(e){stages[e.stage]++;});
    var fin=finance(p,ws,asOf),ranked=prioritize(p),cmp=comparisons(p);
    var rightsAuth=p.rights.filter(function(r){return r.grantSpecificTransferAuthorization;}).length;
    var restricted=Object.keys(ACTIONS).map(function(k){var a=authorized(p,k);return {action:k,label:ACTIONS[k].label,status:a.allowed?"VERIFIED":"NOT_AUTHORIZED",missing:a.missing};});
    var areas=[
      {area:"Engineering",status:p.identities.some(function(i){return i.id==="DS-A"&&i.status==="VERIFIED";})?"IN_PROGRESS":"UNVERIFIED",
        detail:"Original DS-A: "+accepted+" of 18 SP checks independently accepted. Open defects: "+p.defects.filter(function(d){return d.status==="OPEN";}).length+". Release candidates: "+p.releases.length+" (none released)."},
      {area:"Validation",status:cmp.some(function(c){return c.status!=="NOT_ESTABLISHED";})?"IN_PROGRESS":"UNVERIFIED",
        detail:p.studies.filter(function(s){return s.status==="COMPLETE";}).length+" of "+p.studies.length+" studies complete; synthetic runs "+p.runs.filter(function(r){return r.kind==="synthetic";}).length+", independent runs "+p.runs.filter(function(r){return r.kind==="independent";}).length+". No comparative claim is established."},
      {area:"Market discovery",status:p.findings.length?"IN_PROGRESS":"UNVERIFIED",detail:p.findings.length+" source-backed findings across "+p.segments.filter(function(s){return s.findingIds.length;}).length+" of "+p.segments.length+" candidate segments."},
      {area:"Commercial readiness",status:"NOT_AUTHORIZED",detail:openGates.length+" of "+gates.length+" mandatory gates open. Pipeline: "+STAGES.map(function(s){return s.toLowerCase().replace(/_/g," ")+" "+stages[s];}).join(", ")+"."},
      {area:"IP clearance",status:p.rights.length&&rightsAuth===p.rights.length?"IN_PROGRESS":"BLOCKED",detail:rightsAuth+" of "+p.rights.length+" recorded components have a grant-specific transfer authorization. Owner-asserted prior inventory: 0 of 32 (source not in repository)."},
      {area:"Finance",status:fin.actual.rows?"IN_PROGRESS":"UNVERIFIED",detail:"Last month's recorded operating cost "+fin.actual.lastMonthOperatingCostUsd.toFixed(2)+" USD. Revenue received "+fin.actual.revenueReceivedUsd.toFixed(2)+" USD."}
    ];
    var blockers=p.blockers.map(function(b){return {id:b.id,title:b.title,severity:b.severity,nextActionBy:b.nextActionBy};})
      .concat(openGates.map(function(g){return {id:g.id,title:"Gate open: "+g.title,severity:"GATE",nextActionBy:g.approver};}))
      .concat(fin.issues.map(function(i){return {id:i.id,title:"Finance: "+i.code.replace(/_/g," ").toLowerCase(),severity:"HIGH",nextActionBy:"OWNER"};}));
    return {asOf:asOf,program:p.title,proposition:p.proposition,boundary:p.boundary,phase:p.phase,phaseIndex:PHASES.indexOf(p.phase)+1,phaseCount:PHASES.length,
      identities:p.identities.map(function(i){return {id:i.id,title:i.title,status:i.status,note:i.note};}),
      areas:areas,gates:gates,acceptance:{accepted:accepted,total:p.acceptance.length},comparisons:cmp,restrictedActions:restricted,
      finance:fin,blockers:blockers,nextActions:ranked.filter(function(t){return t.state==="READY";}).slice(0,5),queue:ranked,
      assertions:p.assertions,governing:p.governing,
      readiness:{mandatoryGatesMet:gates.length-openGates.length,mandatoryGatesTotal:gates.length,status:openGates.length?"BLOCKED":"READY_FOR_OWNER_DECISION",
        note:"No weighted percentage: readiness is the list of mandatory gates, and any open gate blocks it."},
      autonomy:{configured:false,lastCycle:p.cycles.length?p.cycles[p.cycles.length-1]:null,
        note:"No scheduled or autonomous process is configured for this program. Cycles run only when the owner presses Run cycle."}};
  }
  // One operating cycle, run by the owner. It reviews the record; it fetches nothing and contacts no one.
  function runCycle(p0,ws,asOf){
    var p=clone(validate(p0)),c=command(p,ws,asOf);
    var stale=p.findings.filter(function(f){return (Date.parse(asOf)-Date.parse(f.date))/86400000>90;}).map(function(f){return f.id;});
    var weak=p.findings.filter(function(f){return f.confidence==="low";}).map(function(f){return f.id;});
    // Numbered from the change log, which is never trimmed, so IDs stay unique after old cycles roll off.
    var rec={id:"CYCLE-"+(p.changeLog.length+1),ranOn:asOf,
      discover:{staleFindings:stale,note:"Discovery is manual: no source is fetched by this cycle."},
      evaluate:{lowConfidenceFindings:weak},
      prioritize:{ready:c.nextActions.map(function(t){return t.id;}),notAuthorized:c.queue.filter(function(t){return t.state==="NOT_AUTHORIZED";}).map(function(t){return t.id;})},
      execute:{performed:[],note:"Execution is done by the owner or a Claude session, and recorded as tasks with evidence."},
      verify:{note:"Automated tests run in the repository's CI, not in this cycle."},
      report:{openGates:c.gates.filter(function(g){return g.status!=="VERIFIED";}).length,blockers:c.blockers.length}};
    p.cycles=p.cycles.concat([rec]).slice(-200);
    return {program:validate(log(p,"CYCLE_RUN",{id:rec.id},asOf)),cycle:rec};
  }
  var api=Object.freeze({SCHEMA:SCHEMA,MODULES:MODULES.slice(),STATUS:STATUS.slice(),LEVELS:LEVELS,PHASES:PHASES.slice(),STAGES:STAGES.slice(),BASES:BASES.slice(),
    FORBIDDEN_ORIGINS:FORBIDDEN_ORIGINS.slice(),COST_DIMS:COST_DIMS.slice(),REVENUE_DIMS:REVENUE_DIMS.slice(),DIMS:DIMS.slice(),ACTIONS:Object.keys(ACTIONS),
    newProgram:newProgram,validate:validate,add:add,setTaskState:setTaskState,linkEvidence:linkEvidence,approveGate:approveGate,acceptCheck:acceptCheck,
    recordRightsAuthorization:recordRightsAuthorization,authorized:authorized,authorize:authorize,approveMessage:approveMessage,recordContact:recordContact,suppress:suppress,
    advance:advance,setPhase:setPhase,prioritize:prioritize,comparisons:comparisons,runMetrics:runMetrics,finance:finance,command:command,runCycle:runCycle});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSDSProgram=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
