"use strict";
(function(root){
  // Version 2.3 integration-first read-only product bridge.
  // No network, storage, payments, application dispatch, release or private data.
  // Static source snapshots are NOT live checks of GitHub, CI or production.
  var VERSION="incomeos.product-integration.v1";
  var OBSERVED="2026-11-05";
  var product=Object.freeze({id:"decision-spellchecker",title:"Decision Spellchecker",kind:"MANAGED_COMMERCIAL_PRODUCT",
    originalIdentity:"DS-A",candidateIdentity:"DS-N1",release:"NOT_AUTHORIZED"});
  var branches=Object.freeze([
    Object.freeze({id:"owner",name:"IncomeOS Owner Desk",pr:91,
      branch:"feature/incomeos-owner-prototype-2026-11-01",sha:"aad8c9c4b3ba8524e13e41bea64faffddfced292",
      status:"DRAFT_UNMERGED",destination:"IncomeOS Products",role:"AUTHORITATIVE_OWNER_CANDIDATE"}),
    Object.freeze({id:"core",name:"Decision Spellchecker experimental core",pr:119,
      branch:"claude/decision-spellchecker-ds-n1-2026-11-03",sha:"f8c7a2ad5fa81e7922401b7937530161ec97e61f",
      status:"DRAFT_UNMERGED",destination:"Decision Spellchecker product package",role:"EXPERIMENTAL_CORE"}),
    Object.freeze({id:"cognitive",name:"Cognitive controls SP-07, SP-13, SP-14",pr:128,
      branch:"chatgpt/ds-n1-sp07-contained-20261105",sha:"e345475c5bf0bd92ab68a9d53d8ddc983e480dfb",
      status:"DRAFT_UNMERGED",destination:"Decision Spellchecker product package",role:"EXPERIMENTAL_EXTENSION"})
  ]);
  function safeCount(v){return Number.isInteger(v)&&v>=0?v:0;}
  function snapshot(command){
    var c=command&&typeof command==="object"?command:{};
    var acceptance=c.acceptance&&typeof c.acceptance==="object"?c.acceptance:{};
    var gates=Array.isArray(c.gates)?c.gates:[];
    var restricted=Array.isArray(c.restrictedActions)?c.restrictedActions:[];
    var sources=branches.map(function(s){return {
      id:s.id,name:s.name,pr:s.pr,branch:s.branch,sha:s.sha,status:s.status,
      role:s.role,destination:s.destination,
      url:"https://github.com/phillipwikes-bit/jrsstandard.com/pull/"+s.pr
    };});
    return {
      schema:VERSION,observedOn:OBSERVED,product:product,sources:sources,
      ownerSystem:"IncomeOS Owner Desk",productSystem:"DS-N1 experimental candidate",
      originalRecovery:"AUTHENTIC_SOURCE_NOT_RECOVERED",
      sourceReconciliation:"IN_PROGRESS",
      sourceIntegration:"NOT_IMPLEMENTED",
      cognitiveStatus:"IN_DEVELOPMENT_NOT_INDEPENDENTLY_ACCEPTED",
      sp07:"IN_DEVELOPMENT",sp13:"IN_DEVELOPMENT",sp14:"IN_DEVELOPMENT",
      acceptance:{original:"DS-A",accepted:safeCount(acceptance.accepted),total:safeCount(acceptance.total)},
      outstandingGates:gates.filter(function(g){return g.status!=="VERIFIED";}).map(function(g){return g.id;}),
      commercialAuthorization:restricted.some(function(a){return a.status==="VERIFIED";})?"VERIFY_ACTION_SPECIFIC_AUTHORIZATIONS":"NOT_AUTHORIZED",
      boundaries:{owner:"PRIVATE_OWNER_ONLY",customer:"NOT_DEPLOYED",publicJRS:"SEPARATE",realRecords:"NOT_AUTHORIZED"},
      integrationTarget:"Existing owner/incomeos DS programme, not a second dashboard",
      blockers:["DS-N1 source is not packaged into the Owner Desk","SP-07/13/14 browser and independent acceptance incomplete",
        "Customer delivery and private authentication are not verified"],
      nextAction:"Verify PR #128 tests, then bring the product core and cognitive extension into an isolated private product package with reviewed interfaces and release holds.",
      notice:"Read-only development source snapshot. No application runtime connection, original-source recovery, independent validation, production release or sale is established."
    };
  }
  var api=Object.freeze({SCHEMA:VERSION,OBSERVED_ON:OBSERVED,PRODUCT:product,SOURCES:branches,snapshot:snapshot});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.IncomeOSProductIntegration=api;
}(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:null)));
