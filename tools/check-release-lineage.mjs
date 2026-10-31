#!/usr/bin/env node
// Issue 3.3, G0 / Increment 16. Offline Git provenance and immutable-source
// check. Never reads credentials, contacts, DB records or a live deployment.
// Passing this development audit cannot approve merge or production release.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const SHA=/^[0-9a-f]{40}$/;
const git=args=>execFileSync('git',args,{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']}).trim();
const assert=(cond,msg)=>{if(!cond)throw Error(msg)};
const isSha=x=>typeof x==='string'&&SHA.test(x);
export function classify(path){
 if(path.startsWith('api/')||['proxy.js','vercel.json','programme-status-9872fb93cc94.html','owner-login.html'].includes(path))return 'RUNTIME_PRIVACY_AUTH_WRITERS';
 if(path.startsWith('.github/workflows/'))return 'CI_EXECUTION';
 if(['tests/','tools/','scripts/'].some(p=>path.startsWith(p)))return 'DEVELOPER_TEST_OR_TOOL';
 if(path.startsWith('docs/'))return 'EVIDENCE_DOCUMENTATION';
 return 'PUBLIC_SITE_OR_OTHER';
}
export function parseNameStatus(raw){
 assert(typeof raw==='string','diff output must be string');
 const parts=raw.split('\0');if(parts.at(-1)==='')parts.pop();
 const files=[];
 for(let i=0;i<parts.length;){
  const status=parts[i++];assert(/^[ACDMRTUXB][0-9]*$/.test(status),'unknown Git status');
  const old=parts[i++];assert(old,'missing Git path');
  if(status[0]==='R'||status[0]==='C'){
   const target=parts[i++];assert(target,'missing rename destination');
   files.push({path:target,previous_path:old,status:status[0]});
  }else files.push({path:old,status:status[0]});
 }
 assert(new Set(files.map(f=>f.path)).size===files.length,'duplicate Git path');
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}
function verifyPolicy(policy){
 assert(policy?.schema==='jrs-candidate-lineage-policy-v1','unsupported policy');
 assert(isSha(policy.observed_main_sha)&&isSha(policy.last_reviewed_pr_head_sha),'invalid SHA policy');
 assert(Array.isArray(policy.required_ancestry)&&policy.required_ancestry.length>=2,'ancestry missing');
 assert(policy.required_ancestry.every(x=>x&&isSha(x.sha)&&typeof x.label==='string'),'invalid ancestor');
 assert(policy.required_ancestry.at(-1).sha===policy.last_reviewed_pr_head_sha,'selected head not final ancestor');
 assert(policy.production_authorization==='HOLD','cannot silently preapprove release');
}
export function assessReleaseLineage(facts,policy,baseline,exceptions){
 verifyPolicy(policy);
 assert(facts&&isSha(facts.main_sha)&&isSha(facts.head_sha)&&isSha(facts.merge_base_sha),'invalid Git facts');
 assert(Number.isSafeInteger(facts.ahead)&&facts.ahead>=0&&Array.isArray(facts.files),'invalid Git diff');
 assert(facts.ancestor_results&&typeof facts.ancestor_results==='object','missing ancestor checks');
 assert(baseline?.schema==='jrs-public-program-continuity-v1','frozen source missing');
 assert(Object.keys(baseline.files||{}).length===24,'expected 24 immutable baseline paths');
 assert(exceptions?.schema==='jrs_controlled_source_exception_v1','invalid source exceptions');
 assert(exceptions.production_status==='HOLD'&&exceptions.owner_approval==='NOT_PROVIDED','exception release authorization not allowed');
 assert(Object.keys(exceptions.entries||{}).sort().join('|')==='api/support-stats.js|api/support.js','unexpected exception inventory');
 const issues=[],fail=(code,detail)=>issues.push({code,detail});
 if(facts.main_sha!==policy.observed_main_sha)fail('MAIN_BASE_MOVED','Main SHA changed since inspected baseline');
 if(facts.merge_base_sha!==facts.main_sha)fail('HEAD_DIVERGED_FROM_MAIN','Main is not an ancestor');
 if(facts.ahead===0)fail('NO_CANDIDATE_COMMITS','Empty candidate history');
 for(const a of policy.required_ancestry)if(facts.ancestor_results[a.sha]!==true)fail('ANCESTOR_MISSING',a.label);
 const got=new Map((facts.current_frozen_blobs||[]).map(x=>[x.path,x.sha]));
 if(got.size!==24)fail('FROZEN_BLOBS_INCOMPLETE','Expected all 24 source Git blobs');
 for(const [path,sha] of Object.entries(baseline.files)){
  const exc=exceptions.entries[path];
  if(exc&&exc.before_blob_sha!==sha)fail('EXCEPTION_BASE_CONFLICT',path);
  if(got.get(path)!==(exc?exc.candidate_blob_sha:sha))fail('FROZEN_SOURCE_DRIFT',path);
 }
 const seen=new Set();
 for(const f of facts.files){
  if(!f||!f.path||seen.has(f.path)||!/^[ACDMRTUXB]$/.test(f.status))fail('DIFF_MALFORMED','Duplicate/incomplete change');
  seen.add(f?.path);
  if(f?.status==='D'&&Object.hasOwn(baseline.files,f.path))fail('FROZEN_SOURCE_REMOVED',f.path);
 }
 const category_counts={};for(const f of facts.files){const cat=classify(f.path);category_counts[cat]=(category_counts[cat]||0)+1;}
 return {
  schema:'jrs-candidate-lineage-audit-v1',
  git:{main_sha:facts.main_sha,candidate_sha:facts.head_sha,merge_base_sha:facts.merge_base_sha,commits_ahead:facts.ahead,changed_files:facts.files.length},
  ancestry:policy.required_ancestry.map(a=>({label:a.label,sha:a.sha,confirmed:facts.ancestor_results[a.sha]===true})),
  category_counts,
  runtime_affected_paths:facts.files.filter(f=>classify(f.path)==='RUNTIME_PRIVACY_AUTH_WRITERS').map(f=>f.path),
  frozen_original_sources:24,development_exceptions:Object.keys(exceptions.entries).sort(),
  integrity_audit:issues.length===0?'PASS':'FAILED',issues,
  release_decision:'HOLD',original_dsa:'NO_GO_NOT_VERIFIED',independent_h2h3:'NOT_ESTABLISHED',transfer:'NOT_AUTHORIZED',
  qualification:'A Git SHA/ancestor check is not live owner authentication, direct database RLS, historic metric reconciliation, product validation, rights clearance or a production release decision.'
 };
}
export function collectGitFacts(policy,baseline){
 verifyPolicy(policy);
 const main_sha=git(['rev-parse','origin/main']),head_sha=git(['rev-parse','HEAD']);
 const merge_base_sha=git(['merge-base','origin/main','HEAD']);
 const ahead=Number(git(['rev-list','--count','origin/main..HEAD']));
 const raw=execFileSync('git',['diff','--name-status','-z','--find-renames','origin/main','HEAD'],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','ignore']});
 const files=parseNameStatus(raw),ancestor_results={};
 for(const a of policy.required_ancestry){
  try{execFileSync('git',['merge-base','--is-ancestor',a.sha,'HEAD'],{stdio:'ignore'});ancestor_results[a.sha]=true}
  catch{ancestor_results[a.sha]=false}
 }
 const current_frozen_blobs=Object.keys(baseline.files).map(path=>{
  let sha=null;try{sha=git(['rev-parse','HEAD:'+path])}catch{}
  return {path,sha};
 });
 return {main_sha,head_sha,merge_base_sha,ahead,files,ancestor_results,current_frozen_blobs};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 try{
  if(process.argv.length!==3)throw Error('usage');
  const p=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const b=JSON.parse(readFileSync('tests/public-program-baseline.json','utf8'));
  const e=JSON.parse(readFileSync('tests/public-program-controlled-exceptions.json','utf8'));
  const report=assessReleaseLineage(collectGitFacts(p,b),p,b,e);
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.integrity_audit!=='PASS')process.exitCode=1;
 }catch{
  console.error('RELEASE_LINEAGE_AUDIT_REFUSED');process.exitCode=2;
 }
}