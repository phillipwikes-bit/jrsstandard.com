#!/usr/bin/env node
// Read-only historical aggregate snapshot for JRS owner reconciliation.
// No personal records, tokens, service keys, case data, or row payloads are returned.
// This is a source-count control, not a statement about people or adoption.
import { readFileSync } from 'node:fs';

export const DB='https://pjzxkeviouofdseagvpf.supabase.co';
export const GROUPS=Object.freeze([
  {id:'events_all',table:'interaction_events',source:null},
  {id:'events_guides',table:'interaction_events',source:'guide-dl'},
  {id:'events_standard_pdf',table:'interaction_events',source:'pdf-dl'},
  {id:'events_reference_pdf',table:'interaction_events',source:'kit-dl'},
  {id:'events_support',table:'interaction_events',source:'support'},
  {id:'events_reviewer_views',table:'interaction_events',source:'reviewer-view'},
  {id:'events_training_views',table:'interaction_events',source:'train-view'},
  {id:'contacts_all',table:'pilot_contacts',source:null},
  {id:'contacts_training_enroll',table:'pilot_contacts',source:'training-enroll'},
  {id:'contacts_training_complete',table:'pilot_contacts',source:'training-complete'},
  {id:'contacts_organization_pilot',table:'pilot_contacts',source:'org-pilot'}
]);
const iso=v=>{
 if(typeof v!=='string'|| !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v))
   throw Error('invalid_cutoff');
 const d=new Date(v);
 if(!Number.isFinite(d.getTime())||d.toISOString()!==v.replace(/\.000Z$/,'Z').replace(/Z$/,'.000Z').replace(/\.000\.000Z$/,'.000Z'))
   throw Error('invalid_cutoff');
 return v;
};
export function parseCount(header){
 if(typeof header!=='string')throw Error('missing_count_header');
 const m=/^(?:\*|\d+-\d+)\/(\d+)$/.exec(header.trim());
 if(!m)throw Error('invalid_count_header');
 const n=Number(m[1]);
 if(!Number.isSafeInteger(n)||n<0)throw Error('invalid_count_header');
 return n;
}
export async function capture({cutoff,service,fetchImpl=fetch,now=()=>new Date().toISOString()}){
 // Validate before any request. The service role key is read from the process
 // environment by the CLI and is never put in URL, output or error message.
 const before=iso(cutoff);
 if(typeof service!=='string'||service.length<10)throw Error('missing_service_configuration');
 const entries=[];
 for(const g of GROUPS){
  const url=new URL(DB+'/rest/v1/'+g.table);
  url.searchParams.set('select','source');
  url.searchParams.set('created_at','lt.'+before);
  if(g.source)url.searchParams.set('source','eq.'+g.source);
  let res;
  try{
   res=await fetchImpl(url.toString(),{
    method:'HEAD',redirect:'error',
    headers:{apikey:service,Authorization:'Bearer '+service,Prefer:'count=exact',
             'Cache-Control':'no-store'}
   });
  }catch{throw Error('read_unavailable:'+g.id)}
  if(!res||!(res.status===200||res.status===206))throw Error('read_unavailable:'+g.id);
  let count;
  try{count=parseCount(res.headers.get('content-range'))}
  catch{throw Error('count_unavailable:'+g.id)}
  entries.push({id:g.id,table:g.table,source:g.source,count,grain:'raw_database_rows_before_cutoff'});
 }
 return {schema:'jrs_legacy_aggregate_snapshot_v1',captured_utc:now(),cutoff_utc:before,
  scope_note:'Only enumerated source families; categories are disjoint within a table, not exhaustive. Raw storage counts include bots, tests and repeat actions and do not establish readers or completed downloads.',
  entries};
}
export function compare(baseline,current){
 if(!baseline||!current||baseline.schema!=='jrs_legacy_aggregate_snapshot_v1'||
    current.schema!==baseline.schema||current.cutoff_utc!==baseline.cutoff_utc)
  throw Error('snapshot_scope_mismatch');
 const old=new Map(baseline.entries.map(x=>[x.id,x]));
 const delta=[];
 for(const entry of current.entries){
  const prior=old.get(entry.id);
  if(!prior||prior.table!==entry.table||prior.source!==entry.source)throw Error('snapshot_schema_drift');
  delta.push({id:entry.id,previous:prior.count,current:entry.count,delta:entry.count-prior.count,
    state:entry.count===prior.count?'unchanged':'requires_investigation'});
  old.delete(entry.id);
 }
 if(old.size)throw Error('snapshot_schema_drift');
 return {schema:'jrs_legacy_aggregate_reconciliation_v1',cutoff_utc:current.cutoff_utc,
  state:delta.every(x=>x.state==='unchanged')?'counts_equal':'discrepancy_requires_review',
  measured_families:delta.length,delta};
}
async function main(args){
 const flag=args.find(x=>x.startsWith('--cutoff='));
 const cutoff=flag?.slice('--cutoff='.length);
 if(!cutoff)throw Error('cutoff_required');
 const previous=args.find(x=>x.startsWith('--compare='));
 const baselinePath=previous?.slice('--compare='.length);
 const current=await capture({cutoff,service:process.env.SUPABASE_SERVICE_ROLE_KEY});
 const result=baselinePath?compare(JSON.parse(readFileSync(baselinePath,'utf8')),current):current;
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(result.state==='discrepancy_requires_review')process.exitCode=3;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 main(process.argv.slice(2)).catch(err=>{
  // Fixed error taxonomy; do not serialize secrets, HTTP response bodies,
  // original source rows, or arbitrary stack traces.
  const reason=String(err?.message||'snapshot_failed');
  process.stderr.write('SNAPSHOT_HOLD '+reason.replace(/[^a-z0-9_:]/gi,'').slice(0,75)+'\n');
  process.exitCode=2;
 });
}
