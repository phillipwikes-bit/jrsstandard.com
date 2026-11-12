"use strict";
// Read-only DS source evidence contract. No storage, network, or release actions.
(function(root,factory){var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.IncomeOSDSSourceAdapter=api;})(typeof globalThis!=="undefined"?globalThis:null,function(){
var SCHEMA="incomeos.ds-source-evidence.v1",SHA=/^[a-f0-9]{40}$/i,SP=/^SP-(0[1-9]|1[0-8])$/,STATES=["NOT_EXECUTED","PASSED","FAILED","SKIPPED"];
function required(x,label){if(typeof x!=="string"||!x.trim())throw TypeError(label+" required");return x.trim();}
function validate(e){
if(!e||typeof e!=="object"||Array.isArray(e)||e.schema!==SCHEMA)throw TypeError("unsupported evidence schema");
if(["DS-A","DS-N1"].indexOf(e.identity)<0)throw TypeError("invalid identity");
if(!/^[\w.-]+\/[\w.-]+$/.test(required(e.repository,"repository")))throw TypeError("invalid repository");
if(!SHA.test(required(e.commit,"commit")))throw TypeError("full source commit required");
required(e.branch,"branch");
if(!Array.isArray(e.tests)||!Array.isArray(e.requirements))throw TypeError("tests and requirements required");
var tests=e.tests.map(function(t){if(!t||STATES.indexOf(t.status)<0)throw TypeError("invalid test");required(t.id,"test id");if(t.status==="PASSED"||t.status==="FAILED")required(t.evidence,"executed test evidence");return Object.freeze({id:t.id,status:t.status,evidence:t.evidence||null});});
var requirements=e.requirements.map(function(r){if(!r||!SP.test(r.id)||r.originalAccepted!==false)throw TypeError("original acceptance unverified");return Object.freeze({id:r.id,originalAccepted:false,candidateStatus:required(r.candidateStatus,"candidate status")});});
return Object.freeze({schema:SCHEMA,identity:e.identity,repository:e.repository,branch:e.branch,commit:e.commit,tests:Object.freeze(tests),requirements:Object.freeze(requirements),integrationStatus:"INTEGRATION_IN_PROGRESS",customerAccess:false,commercialRelease:false});
}
function summarize(e,p){var x=validate(e);if(!p||p.schema!=="incomeos.ds-program.v1"||p.programId!=="DSP")throw TypeError("authoritative dsProgram required");var counts={passed:0,failed:0,skipped:0,notExecuted:0};x.tests.forEach(function(t){counts[{PASSED:"passed",FAILED:"failed",SKIPPED:"skipped",NOT_EXECUTED:"notExecuted"}[t.status]]++;});return Object.freeze({schema:SCHEMA,programId:p.programId,source:Object.freeze({identity:x.identity,repository:x.repository,branch:x.branch,commit:x.commit}),tests:Object.freeze(counts),originalAccepted:0,originalAcceptanceVerified:false,integrationStatus:x.integrationStatus,customerAccess:false,commercialRelease:false});}
return Object.freeze({SCHEMA:SCHEMA,validate:validate,summarize:summarize});
});
