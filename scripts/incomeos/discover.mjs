#!/usr/bin/env node
// IncomeOS discovery runner.
// Fetches documented public job-board APIs, normalizes listings, detects
// changes and withdrawals, and writes a PUBLIC-DATA-ONLY snapshot plus an
// execution receipt. It never reads the owner profile in CI.
//
// Usage:
//   node scripts/incomeos/discover.mjs --out DIR [--previous snapshot.json] [--strict]
//   node scripts/incomeos/discover.mjs --out DIR --profile .incomeos-private/owner-profile.json [--alert-state FILE]
//      (local only: also writes DIR/private-screen.json and DIR/alerts.json; refused when GITHUB_ACTIONS is set)
import {createRequire} from "node:module";
import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const require=createRequire(import.meta.url);
const here=dirname(fileURLToPath(import.meta.url));
const lib=join(here,"..","..","owner","incomeos");
require(join(lib,"listing-requirements.js"));
require(join(lib,"compensation.js"));
const Opp=require(join(lib,"opportunity-normalizer.js"));
require(join(lib,"eligibility-engine.js"));
const Radar=require(join(lib,"project-radar.js"));
const Discovery=require(join(lib,"discovery-connectors.js"));

function arg(name){const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null;}
const outDir=arg("--out")||"incomeos-discovery-out";
const registryPath=arg("--registry")||join(lib,"discovery-sources.json");
const previousPath=arg("--previous");
const profilePath=arg("--profile");
const alertStatePath=arg("--alert-state");
const strict=process.argv.includes("--strict");
const MAX_BYTES=15*1024*1024;

async function fetchJson(url,{headers,timeoutMs}){
  const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),timeoutMs);
  try{
    const res=await fetch(url,{headers,signal:ctl.signal,redirect:"error"});
    const buf=Buffer.from(await res.arrayBuffer());
    if(buf.length>MAX_BYTES)throw Error("RESPONSE_TOO_LARGE");
    let json=null;
    if(res.status===200){try{json=JSON.parse(buf.toString("utf8"));}catch{throw Error("INVALID_JSON");}}
    return {status:res.status,json,bytes:buf.length};
  }catch(e){throw Error(e.name==="AbortError"?"TIMEOUT":(e.message||"FETCH_FAILED"));}
  finally{clearTimeout(timer);}
}

function commit(){try{return execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();}catch{return null;}}

const startedAt=new Date().toISOString();
const registry=JSON.parse(readFileSync(registryPath,"utf8"));
if(registry.schema!=="incomeos.discovery-sources.v1"||!Array.isArray(registry.sources))throw Error("Invalid discovery registry");
const credentials={usajobs:process.env.USAJOBS_API_KEY&&process.env.USAJOBS_USER_AGENT?{apiKey:process.env.USAJOBS_API_KEY,userAgent:process.env.USAJOBS_USER_AGENT}:null};
const run=await Discovery.discover(registry,{fetchJson,normalizer:Opp,credentials,timeoutMs:20000,maxAttempts:3,backoffMs:2000});

// Carry forward records from sources that FAILED this run, marked unverified.
// Their lastVerifiedOn is unchanged, so freshness rules age them out.
let previous=[];
if(previousPath&&existsSync(previousPath)){
  const prev=JSON.parse(readFileSync(previousPath,"utf8"));
  if(prev.schema==="incomeos.discovery-snapshot.v1")previous=prev.opportunities||[];
}
const failedSources=new Set(run.connectors.filter(r=>r.status!=="ok").map(r=>r.sourceId));
const carried=previous.filter(r=>failedSources.has(r.provenance&&r.provenance.sourceId)).map(r=>({...r,availability:"UNVERIFIED_SOURCE_FAILED"}));
const opportunities=run.records.concat(carried);
const okSources=new Set(run.connectors.filter(r=>r.status==="ok").map(r=>r.sourceId));
const changes=Opp.diff(previous.filter(r=>okSources.has(r.provenance&&r.provenance.sourceId)),run.records);

const snapshot={schema:"incomeos.discovery-snapshot.v1",generatedAt:new Date().toISOString(),commit:commit(),
  dataClass:"PUBLIC_LISTINGS_ONLY",notice:"Public job-board data only. Contains no owner profile, eligibility result or application data. Listings are not verified openings for the owner, and advertised pay is not earned income.",
  connectors:run.connectors,summary:run.summary,changes,opportunities};
const receipt={schema:"incomeos.discovery-receipt.v1",startedAt,finishedAt:new Date().toISOString(),commit:snapshot.commit,
  runner:process.env.GITHUB_ACTIONS?"github-actions":"local",runId:process.env.GITHUB_RUN_ID||null,
  summary:run.summary,connectors:run.connectors,opportunityCount:opportunities.length,newCount:changes.filter(c=>c.type==="NEW").length,
  changedCount:changes.filter(c=>c.type!=="NEW").length,carriedUnverified:carried.length};

mkdirSync(outDir,{recursive:true});
writeFileSync(join(outDir,"discovery-snapshot.json"),JSON.stringify(snapshot));
writeFileSync(join(outDir,"discovery-receipt.json"),JSON.stringify(receipt,null,2));

if(profilePath){
  if(process.env.GITHUB_ACTIONS||process.env.CI)throw Error("Refusing to read an owner profile inside CI");
  const profile=JSON.parse(readFileSync(profilePath,"utf8"));
  const prefs=profile.preferences||{};
  const asOf=new Date().toISOString().slice(0,10);
  const screened=Radar.screen(snapshot,profile,asOf,prefs,{confirmations:profile.confirmations||{}});
  writeFileSync(join(outDir,"private-screen.json"),JSON.stringify({asOf,eligible:screened.eligible.map(r=>({opportunity:r.opportunity,decision:r.decision,economics:r.economics})),
    pending:screened.pending.map(r=>({opportunityId:r.opportunity.opportunityId,title:r.opportunity.title,platform:r.opportunity.platform,sourceUrl:r.opportunity.sourceUrl,unresolved:r.decision.unresolved,effectiveHourlyUsd:r.economics.effectiveHourlyUsd})),
    excludedCount:screened.excludedCount,exclusionReasons:screened.exclusionReasons},null,2));
  // Alert de-duplication: one alert per opportunity content version.
  const statePath=alertStatePath||join(outDir,"alert-state.json");
  const state=existsSync(statePath)?JSON.parse(readFileSync(statePath,"utf8")):{sent:{}};
  const fresh=screened.alerts.filter(a=>{const o=screened.eligible.find(r=>r.opportunity.opportunityId===a.opportunityId).opportunity;return state.sent[a.opportunityId]!==o.contentHash;});
  fresh.forEach(a=>{state.sent[a.opportunityId]=screened.eligible.find(r=>r.opportunity.opportunityId===a.opportunityId).opportunity.contentHash;});
  writeFileSync(statePath,JSON.stringify(state,null,2));
  writeFileSync(join(outDir,"alerts.json"),JSON.stringify({generatedAt:new Date().toISOString(),delivery:"LOCAL_FILE_ONLY: no external alert provider is authorized",alerts:fresh},null,2));
  console.log(`Private screen: ${screened.eligible.length} eligible, ${screened.pending.length} awaiting verification, ${screened.excludedCount} excluded, ${fresh.length} new alerts.`);
}

for(const r of run.connectors)console.log(`${r.status.padEnd(8)} ${r.sourceId.padEnd(24)} http=${r.httpStatus} listings=${r.listingCount} attempts=${r.attempts}${r.error?" error="+r.error:""}`);
console.log(`Discovery: ${run.summary.ok} ok, ${run.summary.failed} failed, ${run.summary.disabled} disabled; ${opportunities.length} records (${carried.length} carried unverified); ${changes.length} changes.`);
if(run.summary.ok===0&&run.summary.failed>0){console.error("All live connectors failed. Snapshot contains no live data.");process.exit(2);}
if(strict&&run.summary.failed>0)process.exit(3);
