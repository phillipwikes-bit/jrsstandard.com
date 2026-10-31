#!/usr/bin/env node
// JRS / DRR / Decision Spellchecker: non-authoritative source claim preflight.
// This checks metadata consistency only. It never authenticates source, performs
// private file access, signs rights, conducts studies, or authorizes release.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function requireObject(x,name){if(!isObject(x))throw Error(name+' must be an object');}
function requireBool(x,name){if(typeof x!=='boolean')throw Error(name+' must be a Boolean');}
function requireCount(x,name){if(!Number.isSafeInteger(x)||x<0)throw Error(name+' must be a nonnegative integer');}
function entry(code,detail){return {code,detail}}
export function assessSourceClaims(data){
  requireObject(data,'snapshot');
  if(data.schema!=='jrs-source-claims-snapshot-v1')throw Error('unsupported snapshot schema');
  for(const key of ['master','original','local_candidate','r6','r9','study','website'])
    requireObject(data[key],key);
  const {master,original,local_candidate,r6,r9,study,website}=data;
  if(master.title!=='Comprehensive Integrated Master Program through Increment 10'||
     master.pages!==223)throw Error('the controlling baseline must be the observed 223-page edition');
  for(const [x,n] of [[master.raw_bytes_inspected,'master.raw_bytes_inspected'],
    [master.page_text_inspected,'master.page_text_inspected'],
    [original.source_located,'original.source_located'],
    [original.source_authenticated,'original.source_authenticated'],
    [original.clean_build_reproduced,'original.clean_build_reproduced'],
    [local_candidate.developer_candidate,'local_candidate.developer_candidate'],
    [r6.commercial_digest_conflict_reported,'r6.commercial_digest_conflict_reported'],
    [r6.signed_erratum_verified,'r6.signed_erratum_verified'],
    [r9.zip_metadata_located,'r9.zip_metadata_located'],
    [r9.primary_bytes_inspected,'r9.primary_bytes_inspected'],
    [study.h2_h3_independent_completed,'study.h2_h3_independent_completed'],
    [website.owner_login_live_verified,'website.owner_login_live_verified'],
    [website.production_release_approved,'website.production_release_approved']])
    requireBool(x,n);
  for(const [x,n] of [[original.sp_verified_count,'original.sp_verified_count'],
    [r6.component_total,'r6.component_total'],
    [r6.component_transfer_authorized,'r6.component_transfer_authorized'],
    [r9.reported_synthetic_pass,'r9.reported_synthetic_pass'],
    [local_candidate.reported_synthetic_pass,'local_candidate.reported_synthetic_pass']])
    requireCount(x,n);
  if(original.sp_verified_count>18 || r6.component_transfer_authorized>r6.component_total)
    throw Error('verified counts exceed controlling denominators');
  if(r6.component_total!==32)throw Error('R6 controlling inventory denominator must be 32, unless a new edition is explicitly defined');
  const findings=[];
  if(!master.raw_bytes_inspected)
    findings.push(entry('MASTER_BYTES_NOT_INSPECTED','223-page baseline identified by text/metadata; byte-level identity and page preservation cannot be claimed'));
  if(!master.page_text_inspected)
    findings.push(entry('MASTER_TEXT_NOT_INSPECTED','Master content has not been read from the authoritative library item'));
  if(!original.source_located)
    findings.push(entry('DSA_SOURCE_NOT_LOCATED','Original private DS-A source was not located in the accessible inspection scope'));
  if(!original.source_authenticated)
    findings.push(entry('DSA_PROVENANCE_NOT_AUTHENTICATED','No independent primary lineage and original-build identity established'));
  if(!original.clean_build_reproduced)
    findings.push(entry('DSA_BUILD_NOT_REPRODUCED','No verified clean build or original executable replay'));
  if(original.sp_verified_count!==18)
    findings.push(entry('DSA_SP_NOT_VERIFIED','Only '+original.sp_verified_count+' of 18 requirements independently accepted on original source'));
  if(local_candidate.developer_candidate)
    findings.push(entry('LOCAL_CANDIDATE_NOT_ORIGINAL','Developer candidate suite is not evidence of original DS-A identity'));
  if(r9.reported_synthetic_pass>0)
    findings.push(entry('R9_SYNTHETIC_NOT_STUDY','R9 synthetic tests cannot establish H3 original-product effectiveness'));
  if(r9.zip_metadata_located&&!r9.primary_bytes_inspected)
    findings.push(entry('R9_ARCHIVE_NOT_RERUN','ZIP exists in connected library metadata; primary archive bytes and tests were not replayed here'));
  if(r6.commercial_digest_conflict_reported&&!r6.signed_erratum_verified)
    findings.push(entry('R6_COMMERCIAL_DIGEST_CONFLICT','Dated discrepancy in secondary sale schedule remains unsigned/unreconciled'));
  if(r6.component_transfer_authorized!==r6.component_total)
    findings.push(entry('R6_TRANSFER_NOT_CLEARED',r6.component_transfer_authorized+'/'+r6.component_total+' components have approved transfer rights'));
  if(!study.h2_h3_independent_completed)
    findings.push(entry('H2H3_NOT_CONDUCTED','No independently adjudicated exact-original product comparison'));
  if(!website.owner_login_live_verified)
    findings.push(entry('OWNER_DASHBOARD_NOT_ACCEPTED','No successful exact-preview owner login and private data controls accepted'));
  if(!website.production_release_approved)
    findings.push(entry('PRODUCTION_HOLD','No production release decision authorized'));
  return {
    schema:'jrs-source-claim-preflight-v1',
    evidence_date:data.evidence_date,
    baseline:{pages:223,content_reviewed:master.page_text_inspected,byte_identity_verified:master.raw_bytes_inspected},
    gate_states:{
      original_dsa:'NO_GO_NOT_VERIFIED',
      h2_h3:'NOT_ESTABLISHED',
      r6_transfer:'NOT_AUTHORIZED',
      website_production:'HOLD',
      master_preservation:master.raw_bytes_inspected?'OWNER_REVIEW_REQUIRED':'NOT_BYTE_VERIFIED'
    },
    findings,
    qualification:'This is a metadata-consistency and claim-scope screen. It never upgrades original-source authenticity, independent evaluation, commercial rights or production permission. Any supplied assertions still require external primary evidence.'
  };
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  try{
    if(!process.argv[2])throw Error('Usage: node tools/check-source-claim-boundaries.mjs <snapshot.json>');
    const report=assessSourceClaims(JSON.parse(readFileSync(process.argv[2],'utf8')));
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
  }catch(error){
    console.error('SOURCE_CLAIM_INPUT_REJECTED: '+error.message);
    process.exitCode=3;
  }
}