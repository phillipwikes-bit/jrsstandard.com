// IncomeOS engagement classification, confidentiality flags and application notes. SYNTHETIC DATA ONLY.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{},URL,WeakSet};
for(const f of ["eligibility-engine.js","engagement-screen.js"])vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const EG=ctx.window.IncomeOSEngagement,E=ctx.window.IncomeOSEligibility,T="2026-11-03";
assert.equal(EG.classify("Paid 1-hour consultation via GLG on EEO investigations"),"EXPERT_CONSULTATION");
assert.equal(EG.classify("Participants needed: 60-minute user interview, $150"),"RESEARCH_STUDY");
assert.equal(EG.classify("Full-time salaried position with benefits and 401(k)"),"EMPLOYMENT");
assert.equal(EG.classify("Contract role evaluating AI responses, hourly project"),"PROJECT_WORK");
assert.equal(EG.classify("Join our team"),"UNCLASSIFIED");
let r=EG.confidentialityRisks("Seeking former investigators at a state civil rights agency to explain internal case prioritization processes and pending investigations.",["Maryland Commission on Civil Rights"]);
assert.ok(r.flags.includes("FORMER_OR_CURRENT_EMPLOYEE_SOUGHT")&&r.flags.includes("NONPUBLIC_INFORMATION_SOUGHT")&&r.flags.includes("PENDING_MATTER"));
assert.equal(r.requiresOwnerReview,true);assert.match(r.note,/does not decide/);
r=EG.confidentialityRisks("Consultation on how the Maryland Commission on Civil Rights publishes its annual report.",["Maryland Commission on Civil Rights"]);
assert.ok(r.flags.some(f=>f.startsWith("MENTIONS_FORMER_EMPLOYER")),"former employer named is flagged even for public topics");
r=EG.confidentialityRisks("Predict how the EEOC will decide charges next year.",[]);assert.ok(r.flags.includes("PREDICT_AGENCY_DECISIONS"));
r=EG.confidentialityRisks("Request for charging party names from closed files.",[]);assert.ok(r.flags.includes("PROTECTED_PERSONAL_DATA"));
assert.equal(EG.confidentialityRisks("Evaluate AI chatbot answers about public employment law.",["Maryland Commission on Civil Rights"]).requiresOwnerReview,false);
// Application notes: only from documented items, only for engine-eligible decisions.
const doc=ref=>({status:"documented",ref,verifiedOn:"2026-11-01"});
const profile={schema:"incomeos.owner-profile.v1",
  education:[{level:"masters",degree:"SYN Master of Science",fieldKeys:["negotiation"],evidence:doc("SYN-diploma")}],
  totalProfessionalYears:{years:25,evidence:doc("SYN-resume")},
  experience:[{domainKeys:["civil_rights_investigation"],years:10,description:"SYN civil rights investigations",evidence:doc("SYN-exp")},{domainKeys:["ai_evaluation"],description:"SYN undocumented AI work",evidence:{status:"attested"}}],
  credentials:[{key:"eeo_investigator",name:"SYN EEO Investigator Certification",evidence:doc("SYN-cert")}],
  location:{country:"US",region:"MD",evidence:doc("SYN-res")},workAuthorization:[{country:"US",authorized:true,evidence:doc("SYN-wa")}],
  conflicts:{organizations:[],evidence:doc("SYN-coi")},preferences:{remoteOnly:true}};
const opp={id:"o1",title:"EEO case reviewer",platform:"SYN",employer:"SYN",remoteMode:"remote",requirementSet:{ownerConfirmed:true,confirmedOn:T},requirements:[
  {id:"r1",category:"education",minLevel:"bachelors",mandatory:true,sourceText:"Bachelor's degree required."},
  {id:"r2",category:"experience",minYears:5,domains:[],mandatory:true,sourceText:"5+ years of professional experience."},
  {id:"r3",category:"certification",key:"eeo_investigator",mandatory:true,sourceText:"EEO investigator certification required."},
  {id:"r4",category:"work_authorization",country:"US",mandatory:true,sourceText:"Must be authorized to work in the US."}]};
const d=E.evaluate(opp,profile,T,{});assert.equal(d.status,"ELIGIBLE");
const n=EG.applicationNotes(opp,d,profile);
assert.ok(n.text.includes("SYN Master of Science")&&n.text.includes("25 years of professional experience")&&n.text.includes("SYN EEO Investigator Certification")&&n.text.includes("Authorized to work in the United States"));
assert.ok(n.text.includes("SYN civil rights investigations"),"documented extra experience offered");
assert.ok(!n.text.includes("undocumented AI work"),"attested-only experience never appears");
assert.equal(n.submitted,false);assert.match(n.text,/nothing has been submitted/);
const withheld=E.evaluate({...opp,requirementSet:{ownerConfirmed:false}},profile,T,{});
assert.throws(()=>EG.applicationNotes(opp,withheld,profile),/eligible on documented evidence/);
console.log("IncomeOS engagement QA passed (synthetic data): consultation vs job vs study, confidentiality and former-employer flags, notes from documented evidence only");
