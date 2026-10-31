#!/usr/bin/env node
// JRS / DRR / Decision Spellchecker release evidence preflight, version 1.
// Offline evidence-state check, not an authentication or release authority.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

export const REQUIRED_PST=Object.freeze(Array.from({length:12},(_,i)=>'PST-'+String(i+1).padStart(2,'0')));
const SHA40=/^[0-9a-f]{40}$/;
const SHA256=/^[0-9a-f]{64}$/;
const PASS='PASS';
function isObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)}
function fail(code,detail){return {code,detail}}
function isSupportedEvidence(e){return isObject(e)&&typeof e.reference==='string'&&e.reference.trim()!==''&&SHA256.test(e.sha256||'')&&typeof e.reviewer==='string'&&e.reviewer.trim()!==''&&e.scope==='exact_candidate';}

export function evaluateIntegratedRelease(input){
  if(!isObject(input)||input.schema!=='jrs-integrated-release-evidence-v1')throw Error('Unsupported or missing evidence schema');
  if(!isObject(input.website)||!isObject(input.product)||!isObject(input.study)||!isObject(input.rights))throw Error('Four separate decision tracks required');
  if(!Array.isArray(input.website.pst_gates))throw Error('PST gates array missing');
  const rows=new Map();
  for(const g of input.website.pst_gates){
    if(!isObject(g)||!REQUIRED_PST.includes(g.id)||rows.has(g.id))throw Error('Duplicate or unsupported PST gate');
    if(typeof g.status!=='string'||!g.status)throw Error('Gate status missing');
    rows.set(g.id,g);
  }
  if(rows.size!==12)throw Error('Exactly twelve distinct PST gates required');
  const w=input.website, p=input.product, s=input.study, r=input.rights;
  const web=[],product=[],study=[],rights=[];
  if(!SHA40.test(w.pr_head_sha||''))web.push(fail('UNPINNED_PR_HEAD','Exact 40-digit Git SHA required'));
  if(w.pr_state!=='closed'||w.pr_merged!==true||w.pr_draft!==false)web.push(fail('UNMERGED_CANDIDATE','Draft/open branch does not constitute an accepted release'));
  if(!SHA40.test(w.preview_git_sha||'')||w.preview_git_sha!==w.pr_head_sha)web.push(fail('PREVIEW_SHA_MISMATCH','Preview build does not match exact candidate SHA'));
  if(w.preview_target!=='preview'||w.preview_live_verified!==true)web.push(fail('PREVIEW_NOT_ACCEPTED','Exact-preview authentication and functional acceptance missing'));
  for(const id of REQUIRED_PST.slice(0,11)){
    const gate=rows.get(id);
    if(gate.status!==PASS)web.push(fail('GATE_NOT_PASSED',id+': '+gate.status));
    else if(!isSupportedEvidence(gate.evidence))web.push(fail('GATE_EVIDENCE_INCOMPLETE',id+': no exact-candidate evidence reference/reviewer/SHA-256'));
  }
  if(w.postrelease_watch_plan_ready!==true)web.push(fail('PST12_PLAN_MISSING','PST-12 is a postrelease watch gate; a pre-release plan is required, not a fabricated postrelease pass'));
  const decision=w.owner_decision;
  if(!isObject(decision)||decision.action!=='APPROVE'||decision.candidate_sha!==w.pr_head_sha||!isSupportedEvidence(decision.evidence))web.push(fail('OWNER_RELEASE_DECISION_MISSING','An exact-SHA, recorded owner decision is required'));

  if(p.original_source_reproduced!==true)product.push(fail('DSA_ORIGINAL_NOT_REPRODUCED','Original private Decision Spellchecker source/build lineage unresolved'));
  if(p.original_18_features_verified!==true)product.push(fail('SP01_18_NOT_VERIFIED','All 18 features require exact-original-source proof'));
  if(p.original_source_independently_authenticated!==true)product.push(fail('DSA_AUTHENTICITY_NOT_ESTABLISHED','Self-consistent archive hashes do not authenticate provenance'));
  if(s.h2_vs_h3_independent_completed!==true)study.push(fail('H2H3_NOT_CONDUCTED','Independent H3 vs strong general-AI H2 comparison is missing'));
  if(s.actual_156_record_study_conducted!==true)study.push(fail('STUDY_NOT_CONDUCTED','Constructed blocked demonstrations are not an actual human study'));
  if(!Number.isSafeInteger(r.r6_total)||r.r6_total!==32||!Number.isSafeInteger(r.r6_authorized)||r.r6_authorized<0||r.r6_authorized>r.r6_total)throw Error('R6 rights figures invalid');
  if(r.r6_authorized!==r.r6_total)rights.push(fail('R6_TRANSFER_NOT_CLEARED',r.r6_authorized+'/'+r.r6_total+' authorizations recorded'));
  if(r.transaction_specific_counsel_cleared!==true)rights.push(fail('TRANSACTION_RIGHTS_NOT_CLEARED','No grant-specific professional disposition recorded'));

  return {
    schema:'jrs-integrated-release-preflight-v1',
    input_date:typeof input.as_of==='string'?input.as_of:'undated',
    website:{status:web.length?'HOLD':'EVIDENCE_PACKAGE_FOR_OWNER_REVIEW_ONLY',blockers:web},
    original_spellchecker:{status:product.length?'NO_GO_NOT_VERIFIED':'SOURCE_PACKAGE_FOR_REVIEW_ONLY',blockers:product},
    independent_study:{status:study.length?'NOT_ESTABLISHED':'DOSSIER_FOR_INDEPENDENT_REVIEW_ONLY',blockers:study},
    transfer:{status:rights.length?'NOT_AUTHORIZED':'LOT_FOR_LEGAL_REVIEW_ONLY',blockers:rights},
    source_reports:{r9_tests:p.r9_test_results||null,r6_hash_match:p.r6_hash_report||null,simulated_156:s.simulated_156||null},
    qualification:'This checks the completeness and consistency of recorded claims, not the truth, external origin, authenticity, rights, or approval of those claims. It cannot issue a release authorization.'
  };
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const file=process.argv[2];
  if(!file){console.error('Usage: node tools/check-integrated-release-evidence.mjs <snapshot.json> [--enforce]');process.exitCode=64;}
  else{
    try{
      const report=evaluateIntegratedRelease(JSON.parse(readFileSync(file,'utf8')));
      process.stdout.write(JSON.stringify(report,null,2)+'\n');
      if(process.argv.includes('--enforce')&&report.website.status==='HOLD')process.exitCode=2;
    }catch(e){console.error('INVALID_EVIDENCE_INPUT: '+e.message);process.exitCode=3;}
  }
}