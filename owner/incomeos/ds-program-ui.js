"use strict";
(function(){
  // Decision Spellchecker command center: the first IncomeOS view.
  // It reads the program record held in the owner's workspace and sends every
  // change back to the workspace through in-page events, so the owner saves one
  // file. MEMORY ONLY: no browser storage, no network, no outbound contact.
  var DS=window.IncomeOSDSProgram;
  var state={ws:null};
  function $(id){return document.getElementById(id);}
  function today(){var d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
  function el(p,tag,text,cls){var e=document.createElement(tag);if(text!=null)e.textContent=String(text);if(cls)e.className=cls;p.appendChild(e);return e;}
  function usd(x){return "$"+Number(x||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
  var CHIP={VERIFIED:"chip",IN_PROGRESS:"chip ds-progress",UNVERIFIED:"chip gray",BLOCKED:"chip warn",NOT_AUTHORIZED:"chip warn"};
  function chip(p,s){return el(p,"span",String(s).replace(/_/g," ").toLowerCase(),CHIP[s]||"chip gray");}
  function program(){return state.ws&&state.ws.dsProgram?state.ws.dsProgram:null;}
  // Dispatch to the workspace owner and report only what it actually applied.
  function dispatch(name,detail,label){
    var result=null;detail.done=function(r){result=r;};
    try{document.dispatchEvent(new CustomEvent(name,{detail:detail}));}catch(e){result={ok:false,error:e.message};}
    if(!result)msg("Not applied: the workspace panel did not respond.",true);
    else if(!result.ok)msg("Not applied: "+result.error,true);
    else msg(label+". Save the workspace to keep it.");
    return !!(result&&result.ok);
  }
  function send(next,label){return dispatch("incomeos:ds-update",{program:next,label:label},label);}
  function msg(text,bad){var s=$("ds-status");if(s){s.textContent=text;s.className=bad?"status error":"status";}}
  function attempt(fn,label){
    var p=program();if(!p){msg("Load or create your workspace in Research, This week, first.",true);return;}
    var next;try{next=fn(p);}catch(e){msg(e.message,true);return;}
    send(next,label);
  }
  // Compact form builder: fields [name,label,type,options].
  function form(parent,title,fields,submit,label){
    var d=el(parent,"details",null,"ds-form"),s=el(d,"summary",title),f=el(d,"form");f.noValidate=true;
    var inputs={};
    fields.forEach(function(x){
      var id="ds-"+title.replace(/[^a-z]+/gi,"-").toLowerCase()+"-"+x[0],l=el(f,"label",x[1]);l.htmlFor=id;
      var i;
      if(x[2]==="select"){i=el(f,"select");x[3].forEach(function(o){var op=el(i,"option",o[1]);op.value=o[0];});}
      else{i=el(f,"input");i.type=x[2]||"text";}
      i.id=id;inputs[x[0]]=i;
    });
    var b=el(f,"button",label||"Add","mainbtn");b.type="submit";
    f.addEventListener("submit",function(ev){ev.preventDefault();var v={};Object.keys(inputs).forEach(function(k){v[k]=inputs[k].value;});submit(v,f);});
    return f;
  }
  function list(v){return String(v||"").split(",").map(function(x){return x.trim();}).filter(Boolean);}
  function render(){
    var out=$("ds-output");if(!out||!DS)return;
    out.replaceChildren();
    var p=program(),asOf=today(),c;
    try{c=DS.command(p||DS.newProgram(asOf),state.ws,asOf);}catch(e){el(out,"p","The program record could not be read: "+e.message,"status error");return;}
    var start=$("ds-start");if(start)start.hidden=!(state.ws&&!p);
    if(!p)el(out,"p",state.ws?"This workspace has no program record yet. Start one to record evidence, tasks and decisions.":"Showing the initial program record. Load your workspace in Research, This week, to record changes.","callout");
    var head=el(out,"section",null,"panel");
    el(head,"p","PHASE "+c.phaseIndex+" OF "+c.phaseCount+" · "+c.phase.replace(/^P\d_/,"").replace(/_/g," ").toLowerCase(),"kicker");
    el(head,"p",c.proposition);el(head,"p",c.boundary,"muted");
    el(head,"p","Governing program: "+c.governing.reference+(c.governing.inRepository?"":" (document not in the repository)"),"muted");
    var legend=el(head,"div",null,"chips");DS.STATUS.forEach(function(s){chip(legend,s);});

    var areas=el(out,"section",null,"panel");el(areas,"h3","Program status");
    c.areas.forEach(function(a){var row=el(areas,"div",null,"entry");var t=el(row,"div");el(t,"strong",a.area);el(t,"small",a.detail);chip(row,a.status);});
    el(areas,"p",c.readiness.mandatoryGatesMet+" of "+c.readiness.mandatoryGatesTotal+" mandatory gates met. "+c.readiness.note,"muted");

    var ids=el(out,"section",null,"panel");el(ids,"h3","Product identities");
    c.identities.forEach(function(i){var row=el(ids,"div",null,"entry");var t=el(row,"div");el(t,"strong",i.id+" · "+i.title);el(t,"small",i.note);chip(row,i.status);});
    el(ids,"p","SP acceptance (original DS-A): "+c.acceptance.accepted+" of "+c.acceptance.total+". New-module test passes never count toward it.","muted");

    var bl=el(out,"section",null,"panel");el(bl,"h3","Critical blockers");
    c.blockers.slice(0,20).forEach(function(b){var row=el(bl,"div",null,"entry");var t=el(row,"div");el(t,"strong",b.id+" · "+b.title);el(t,"small","Next step: "+b.nextActionBy);el(row,"span",b.severity.toLowerCase(),"chip warn");});

    var na=el(out,"section",null,"panel");el(na,"h3","Next authorized actions");
    if(!c.nextActions.length)el(na,"p","No ready tasks. Add tasks below; tasks that need a restricted action stay blocked until authorized.","muted");
    c.nextActions.forEach(function(t){var row=el(na,"div",null,"entry");var tt=el(row,"div");el(tt,"strong",t.id+" · "+t.title);
      el(tt,"small",t.module+" · "+t.taskState.replace(/_/g," ").toLowerCase()+" · score "+t.score+" · evidence "+t.evidence);
      if(!p)return;
      // Start a task that has not begun; finish one in progress (finishing needs linked evidence).
      var started=t.taskState==="IN_PROGRESS",b=el(row,"button",started?"Done":"Start","smallbtn");b.type="button";
      b.addEventListener("click",function(){attempt(function(x){return DS.setTaskState(x,t.id,started?"DONE":"IN_PROGRESS",asOf);},started?"Task done":"Task started");});});
    var held=c.queue.filter(function(t){return t.state!=="READY";});
    if(held.length)el(na,"p",held.length+" task(s) waiting on dependencies or authorization.","muted");

    var ra=el(out,"section",null,"panel");el(ra,"h3","Restricted actions");
    c.restrictedActions.forEach(function(a){var row=el(ra,"div",null,"entry");var t=el(row,"div");el(t,"strong",a.label);el(t,"small",a.missing.length?"Missing: "+a.missing.join(", "):"Authorized");chip(row,a.status);});

    var fin=c.finance,fs=el(out,"section",null,"panel");el(fs,"h3","Program finance");
    el(fs,"p","Actual (ledger rows tagged to the program)","kicker");
    var line=function(k,v){var r=el(fs,"div",null,"accountant-line");el(r,"span",k);el(r,"strong",v);};
    line("Last month operating cost ("+fin.actual.lastMonth+")",usd(fin.actual.lastMonthOperatingCostUsd));
    line("Total recorded program cost",usd(fin.actual.totalCostUsd));
    line("Revenue received (bank-matched, executed agreement)",usd(fin.actual.revenueReceivedUsd));
    line("Revenue recorded, not verified",usd(fin.actual.revenueRecordedNotVerifiedUsd));
    el(fs,"p","Projections (never revenue)","kicker");
    if(!fin.projections.length)el(fs,"p","No pricing scenarios yet.","muted");
    fin.projections.forEach(function(s){line(s.label+" · "+s.model+" · price "+s.priceBasis.replace(/_/g," ").toLowerCase(),usd(s.monthlyContributionUsd)+"/mo"+(s.breakEvenMonths?" · break-even "+s.breakEvenMonths+" mo":" · no break-even"));});
    el(fs,"p",fin.notice,"muted");

    var cm=el(out,"section",null,"panel");el(cm,"h3","Validation claims");
    c.comparisons.forEach(function(x){var row=el(cm,"div",null,"entry");el(row,"strong",x.claim);el(row,"span",x.status.replace(/_/g," ").toLowerCase(),x.status==="NOT_ESTABLISHED"?"chip gray":"chip");});

    var as=el(out,"section",null,"panel");el(as,"h3","Owner-asserted facts");
    c.assertions.forEach(function(a){var row=el(as,"div",null,"entry");var t=el(row,"div");el(t,"strong",a.statement);el(t,"small",a.source+(a.sourceInRepository?"":" · source document not in repository"));});

    var au=el(out,"section",null,"panel");el(au,"h3","Operating cycle");el(au,"p",c.autonomy.note,"muted");
    if(c.autonomy.lastCycle)el(au,"p","Last cycle "+c.autonomy.lastCycle.id+" on "+c.autonomy.lastCycle.ranOn+": "+c.autonomy.lastCycle.prioritize.ready.length+" ready task(s), "+c.autonomy.lastCycle.report.openGates+" open gate(s).");
    if(p){var rb=el(au,"button","Run cycle","smallbtn");rb.type="button";rb.addEventListener("click",function(){attempt(function(x){return DS.runCycle(x,state.ws,asOf).program;},"Cycle recorded");});}

    if(p)forms(out,p,asOf);
  }
  function forms(out,p,asOf){
    var s=el(out,"section",null,"panel");el(s,"h3","Record");
    var levels=Object.keys(DS.LEVELS).map(function(k){return [k,k+" · "+DS.LEVELS[k]];});
    var conf=[["low","Low"],["medium","Medium"],["high","High"]];
    form(s,"Evidence",[["id","Identifier","text"],["title","Title","text"],["level","Evidence level","select",levels],["source","Source (file, URL or document)","text"],["date","Date","date"],
      ["confidence","Confidence","select",conf],["assumptions","Assumptions","text"],["contradictions","Contradictory evidence","text"],["informs","Decision it informs","text"],
      ["subject","About product identity (optional)","select",[["","None"],["DS-A","DS-A"],["DS-B","DS-B"],["DS-C","DS-C"]]]],
      function(v){attempt(function(x){return DS.add(x,"evidence",{id:v.id,title:v.title,level:Number(v.level),source:v.source,date:v.date,confidence:v.confidence,assumptions:v.assumptions,contradictions:v.contradictions,informs:v.informs,subject:v.subject||undefined},asOf);},"Evidence added");});
    form(s,"Research finding",[["id","Identifier","text"],["question","Question","text"],["answer","Finding","text"],["evidenceIds","Evidence identifiers (comma separated)","text"],
      ["segmentId","Segment","select",[["","None"]].concat(p.segments.map(function(g){return [g.id,g.title];}))],["confidence","Confidence","select",conf],
      ["assumptions","Assumptions","text"],["contradictions","Contradictory evidence","text"],["informs","Decision it informs","text"],["quantity","Quantity, if any (needs sourced evidence)","text"]],
      function(v){attempt(function(x){return DS.add(x,"findings",{id:v.id,question:v.question,answer:v.answer,evidenceIds:list(v.evidenceIds),segmentId:v.segmentId||undefined,confidence:v.confidence,assumptions:v.assumptions,contradictions:v.contradictions,informs:v.informs,quantity:v.quantity},asOf);},"Finding added");});
    var mods=DS.MODULES.map(function(m){return [m,m];}),scale=[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]];
    form(s,"Task",[["id","Identifier","text"],["title","Task","text"],["module","Module","select",mods],["dependsOn","Depends on (task identifiers, comma separated)","text"],
      ["value","Decision value (1 to 5)","select",scale],["cost","Cost (1 to 5)","select",scale],["risk","Risk (1 to 5)","select",scale],
      ["restrictedAction","Restricted action, if any","select",[["","None"]].concat(DS.ACTIONS.map(function(a){return [a,a.replace(/_/g," ")];}))]],
      function(v){attempt(function(x){return DS.add(x,"tasks",{id:v.id,title:v.title,module:v.module,dependsOn:list(v.dependsOn),value:Number(v.value),cost:Number(v.cost),risk:Number(v.risk),restrictedAction:v.restrictedAction||null},asOf);},"Task added");});
    form(s,"Pricing scenario",[["id","Identifier","text"],["label","Scenario name","text"],["model","Model","select",[["subscription","Subscription"],["licensing","Licensing"],["usage","Usage-based"],["oem","OEM"],["acquisition","Acquisition"]]],
      ["priceUsd","Price per unit (USD)","text"],["unitsPerMonth","Units per month","number"],["variableCostUsd","Variable cost per unit (USD)","text"],["fixedMonthlyUsd","Fixed monthly cost (USD)","text"],
      ["investmentUsd","Investment to recover (USD)","text"],["evidenceIds","Price evidence identifiers (optional)","text"],["assumptions","Assumptions","text"]],
      function(v){attempt(function(x){return DS.add(x,"pricing",{id:v.id,label:v.label,model:v.model,priceUsd:v.priceUsd,unitsPerMonth:Number(v.unitsPerMonth),variableCostUsd:v.variableCostUsd||"0",fixedMonthlyUsd:v.fixedMonthlyUsd||"0",investmentUsd:v.investmentUsd||"0",evidenceIds:list(v.evidenceIds),assumptions:v.assumptions},asOf);},"Pricing scenario added");});
    form(s,"Contact ledger entry",[["id","Identifier","text"],["organization","Organization","text"],["role","Role","text"],
      ["origin","Where the contact came from","select",[["conference","Conference or event"],["published_directory","Published business directory"],["existing_relationship","Existing professional relationship"],["inbound_inquiry","Inbound inquiry about Decision Spellchecker"],["referral","Referral with consent"],["other","Other (explain in basis detail)"]]],
      ["lawfulBasis","Lawful contact basis","select",DS.BASES.map(function(b){return [b,b.replace(/_/g," ")];})],["basisNote","Basis detail","text"]],
      function(v){attempt(function(x){return DS.add(x,"contacts",v,asOf);},"Contact recorded (not contacted)");});
    form(s,"Pipeline prospect",[["id","Identifier","text"],["organization","Organization","text"]],
      function(v){attempt(function(x){return DS.add(x,"pipeline",v,asOf);},"Prospect identified");});
    var costDims=DS.COST_DIMS.map(function(d){return [d,d.replace(/_/g," ")];});
    form(s,"Program cost (adds a ledger row)",[["date","Date","date"],["payer","Vendor","text"],["amountUsd","Amount (USD)","text"],["dsDimension","Dimension","select",costDims]],
      function(v){dispatch("incomeos:ds-ledger",{entry:{kind:"outflow",date:v.date,payer:v.payer,amountUsd:v.amountUsd,category:"software",dsDimension:v.dsDimension}},"Program cost added to the workspace ledger");},"Add cost");
    actions(out,p,asOf);
  }
  // Phase 3 and 4 records and the owner's own controlled actions. Each goes through the engine's rules.
  function actions(out,p,asOf){
    var s=el(out,"section",null,"panel");el(s,"h3","Engineering, validation and rights");
    var ids=["DS-A","DS-B","DS-C"].map(function(i){return [i,i];});
    form(s,"Requirement",[["id","Identifier","text"],["text","Requirement","text"],["version","Version","number"],["identity","Product identity","select",[["DS-C","DS-C"],["DS-A","DS-A"],["DS-B","DS-B"]]],["evidenceIds","Evidence identifiers (optional)","text"]],
      function(v){attempt(function(x){return DS.add(x,"requirements",{id:v.id,text:v.text,version:v.version||1,identity:v.identity,evidenceIds:list(v.evidenceIds)},asOf);},"Requirement added");});
    form(s,"Defect",[["id","Identifier","text"],["title","Defect","text"],["severity","Severity","select",[["CRITICAL","Critical"],["HIGH","High"],["MEDIUM","Medium"],["LOW","Low"]]],["identity","Product identity","select",ids]],
      function(v){attempt(function(x){return DS.add(x,"defects",v,asOf);},"Defect recorded");});
    form(s,"Release candidate",[["id","Identifier","text"],["version","Version","text"],["identity","Product identity","select",[["DS-C","DS-C"],["DS-A","DS-A"]]],["rollbackPlan","Rollback plan","text"]],
      function(v){attempt(function(x){return DS.add(x,"releases",v,asOf);},"Release candidate recorded (not released)");});
    form(s,"Study",[["id","Identifier","text"],["title","Study","text"],["kind","Kind","select",[["synthetic","Synthetic development test"],["independent","Independent empirical validation"]]],
      ["arms","Arms (comma separated: H0, H1, H2, H3)","text"],["minimumN","Minimum sample size","number"],["note","Note","text"]],
      function(v){attempt(function(x){return DS.add(x,"studies",{id:v.id,title:v.title,kind:v.kind,arms:list(v.arms),minimumN:v.minimumN||1,note:v.note},asOf);},"Study recorded (planned)");});
    form(s,"Study run",[["id","Identifier","text"],["studyId","Study","select",p.studies.map(function(x){return [x.id,x.id+" · "+x.kind];})],["arm","Arm","select",[["H0","H0 routine"],["H1","H1 manual JRS"],["H2","H2 general AI"],["H3","H3 authenticated DS-A"]]],
      ["identity","Product identity (H3 must be DS-A)","select",[["","None"]].concat(ids)],["tp","True positives","number"],["fp","False positives","number"],["fn","False negatives","number"],["tn","True negatives","number"],["minutes","Reviewer minutes","number"],["evidenceIds","Evidence identifiers","text"]],
      function(v){attempt(function(x){var st=DS.add(x,"runs",{id:v.id,studyId:v.studyId,arm:v.arm,kind:(x.studies.filter(function(y){return y.id===v.studyId;})[0]||{}).kind,identity:v.identity||null,
        metrics:{tp:v.tp||0,fp:v.fp||0,fn:v.fn||0,tn:v.tn||0,minutes:v.minutes===""?null:v.minutes},evidenceIds:list(v.evidenceIds)},asOf);return st;},"Run recorded");});
    form(s,"Rights component",[["id","Identifier","text"],["component","Component","text"],["kind","Kind","select",[["original_source","Original source"],["new_code","New code"],["third_party_dependency","Third-party dependency"],["research_material","Research material"],["contributor_work","Contributor work"],["documentation","Documentation"]]],
      ["possibleExclusion","Possible licensing exclusion","text"],["evidenceIds","Evidence identifiers (optional)","text"]],
      function(v){attempt(function(x){return DS.add(x,"rights",{id:v.id,component:v.component,kind:v.kind,possibleExclusion:v.possibleExclusion,evidenceIds:list(v.evidenceIds)},asOf);},"Component recorded (unresolved)");});
    var linkable=[["tasks","Task"],["gates","Gate"],["acceptance","SP check"],["findings","Finding"],["pipeline","Pipeline entry"],["runs","Study run"],["requirements","Requirement"],["rights","Rights component"]];
    form(s,"Link evidence",[["collection","Record kind","select",linkable],["id","Record identifier","text"],["evidenceId","Evidence identifier","text"]],
      function(v){attempt(function(x){return DS.linkEvidence(x,v.collection,v.id,v.evidenceId,asOf);},"Evidence linked");},"Link");

    var o=el(out,"section",null,"panel");el(o,"h3","Owner controls");
    el(o,"p","Recording an approval or authorization does not perform anything. Each is checked against its gate rules and kept in the change log.","muted");
    form(o,"Message for approval",[["id","Identifier","text"],["text","Message text","text"]],function(v){attempt(function(x){return DS.add(x,"messages",v,asOf);},"Message drafted (not approved, not sent)");});
    form(o,"Approve message",[["id","Message","select",p.messages.map(function(m){return [m.id,m.id+(m.approvedBy?" · approved":"")];})]],function(v){attempt(function(x){return DS.approveMessage(x,v.id,asOf);},"Message approved");},"Approve");
    form(o,"Record a contact you made",[["contactId","Contact","select",p.contacts.map(function(c){return [c.id,c.id+" · "+c.organization];})],["messageId","Approved message","select",p.messages.filter(function(m){return m.approvedBy;}).map(function(m){return [m.id,m.id];})],
      ["channel","Channel","text"],["response","Response, if any","text"]],
      function(v){attempt(function(x){return DS.recordContact(x,v.contactId,{messageId:v.messageId,channel:v.channel,response:v.response},asOf);},"Contact recorded");},"Record");
    form(o,"Suppress a contact",[["contactId","Contact","select",p.contacts.map(function(c){return [c.id,c.id+" · "+c.organization];})]],function(v){attempt(function(x){return DS.suppress(x,v.contactId,asOf);},"Contact suppressed");},"Suppress");
    form(o,"Advance pipeline",[["id","Prospect","select",p.pipeline.map(function(e){return [e.id,e.id+" · "+e.organization+" · "+e.stage.replace(/_/g," ").toLowerCase()];})],
      ["contactId","Contact (for contacted)","text"],["evidenceIds","Evidence identifiers","text"],["agreementRef","Agreement reference (executed only)","text"]],
      function(v){attempt(function(x){return DS.advance(x,v.id,{contactId:v.contactId,evidenceIds:list(v.evidenceIds),agreementRef:v.agreementRef},asOf);},"Pipeline advanced");},"Advance");
    form(o,"Owner authorization",[["action","Restricted action","select",DS.ACTIONS.map(function(a){return [a,a.replace(/_/g," ")];})],["ref","Your authorization record reference","text"],["scope","Scope","text"]],
      function(v){attempt(function(x){return DS.authorize(x,v.action,{grantedBy:"OWNER",ref:v.ref,scope:v.scope},asOf);},"Authorization recorded");},"Record");
    form(o,"Gate approval",[["gate","Gate","select",p.gates.map(function(g){return [g.id,g.id+" · approved by "+g.approver.toLowerCase()];})],["ref","Approval record reference","text"]],
      function(v){attempt(function(x){var g=x.gates.filter(function(y){return y.id===v.gate;})[0];return DS.approveGate(x,v.gate,{by:g&&g.approver,ref:v.ref},asOf);},"Gate approval recorded");},"Record");
    form(o,"Program phase",[["phase","Phase","select",DS.PHASES.map(function(x){return [x,x.replace(/_/g," ").toLowerCase()];})]],function(v){attempt(function(x){return DS.setPhase(x,v.phase,asOf);},"Phase set");},"Set");
  }
  function init(){
    if(!DS||!$("ds-output"))return;
    var start=$("ds-start");
    if(start)start.addEventListener("click",function(){if(!state.ws)return;send(DS.newProgram(today()),"Decision Spellchecker program record started");msg("Program record started. Save the workspace to keep it.");});
    ["incomeos:workspace-loaded","incomeos:workspace-changed","incomeos:workspace-restored"].forEach(function(n){
      document.addEventListener(n,function(ev){if(ev.detail&&typeof ev.detail==="object")state.ws=ev.detail;render();});
    });
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
}());
