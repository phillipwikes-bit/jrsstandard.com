// Cross-endpoint commercial evidence integrity, offline/synthetic only.
// No live records, secret values or production mutations are used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CRAWLER, isCrawler, classifyDownloadTraffic,
  isInternalTestSource, isCurrentDownloadResource
} from '../api/_traffic-quality.js';

assert.equal(isInternalTestSource('deploytest-geo2'), true);
assert.equal(isInternalTestSource('verify'), true);
assert.equal(isInternalTestSource('site'), false);
assert.equal(isCurrentDownloadResource({source:'kit-dl',payload:{file:'JRS_Kit_Retired.pdf'}}), false);
assert.equal(isCurrentDownloadResource({source:'kit-dl',payload:{file:'JRS-Reference-9d4f2a7c.pdf'}}), true);
assert.equal(isCurrentDownloadResource({source:'pdf-dl',payload:{doc:'standard',src:'test'}}), false);
assert.equal(classifyDownloadTraffic({user_agent:'  '}), 'user_agent_missing');

const src = readFileSync(new URL('../api/asset-stats.js',import.meta.url),'utf8');
assert.match(src,/import \{ fetchAll \} from '\.\/_sb-fetch\.js';/);
assert.doesNotMatch(src,/return await fetchAllRows\\(/);
assert.match(src,/aggregate_statistics_incomplete_or_unavailable/);
let compiled = src
  .replace(/^import .*?;\s*$/gm,'')
  .replace(/^export const config = \{ runtime: 'edge' \};\s*$/m,'')
  .replace('export default async function handler(req){','async function handler(req){');
assert.doesNotMatch(compiled,/^import /m);
const factory = new Function('fetchAll','process','CRAWLER','isCrawler',
  'classifyDownloadTraffic','isInternalTestSource','isCurrentDownloadResource',
  compiled+'\nreturn handler;');
const env = {env:{SUPABASE_SERVICE_ROLE_KEY:'not-a-real-credential'}};
const request = new Request('https://www.jrsstandard.com/api/asset-stats',{method:'GET'});
const setup = reader=>factory(reader,env,CRAWLER,isCrawler,
  classifyDownloadTraffic,isInternalTestSource,isCurrentDownloadResource);

// Fail closed if any of six required source views is incomplete.
const partial = setup(async(path) => ({rows:[],complete:!path.startsWith('pilot_progress?')}));
const partialResponse = await partial(request);
assert.equal(partialResponse.status,502);
assert.equal((await partialResponse.json()).error,'aggregate_statistics_incomplete_or_unavailable');

// All request populations share one timestamped event-row snapshot.
const make = (source,type,payload) => ({
  source,type,payload,created_at:'2026-10-30T12:00:00.000Z'
});
const rows=[
  make('guide-dl','download',{edition:'employment',country:'US',user_agent:'Mozilla/5.0'}),
  make('guide-dl','download',{edition:'employment',country:'US',user_agent:'Googlebot/2.1'}),
  make('kit-dl','download',{file:'JRS-Reference-9d4f2a7c.pdf',country:'SG'}),
  make('pdf-dl','download',{doc:'standard',country:'FR',user_agent:'Mozilla/5.0'}),
  make('legacy-source','download',{user_agent:'Mozilla/5.0'}),
  make('kit-dl','download',{file:'JRS_Kit_Retired.pdf',user_agent:'Mozilla/5.0'}),
  make('guide-dl','download',{edition:'employment',src:'deploytest-check',user_agent:'Mozilla/5.0'}),
  make('guide-dl','view',{edition:'employment',user_agent:'Mozilla/5.0'})
];
const complete = setup(async path=>({
  rows: path.startsWith('interaction_events?') ? rows : [],complete:true
}));
const completeResponse = await complete(request);
assert.equal(completeResponse.status,200);
const result = await completeResponse.json();
const b = result.open_engagement.download_scope_bridge;
assert.equal(result.open_engagement.public_artifact_downloads,6);
assert.equal(result.open_engagement.downloads_crawlers_excluded,1);
assert.equal(result.open_engagement.downloads_predating_user_agent_capture,1);
assert.equal(b.counted_all_source_download_type_events,7);
assert.equal(b.current_resource_redirect_requests,5);
assert.equal(b.current_resource_download_type_events,4);
assert.equal(b.current_resource_other_type_events,1);
assert.equal(b.outside_current_resource_download_type_events,3);
assert.equal(b.internal_test_rows_in_redirect_sources,1);
assert.equal(b.retired_or_unknown_kit_rows,1);
assert.equal(b.declared_crawler,1);
assert.equal(b.user_agent_missing,1);
assert.equal(b.not_identified_as_crawler,3);
assert.equal(b.source_scope_reconciles,true);
assert.equal(b.difference_between_legacy_download_events_and_current_resource_requests,2);

// A download request must never delete historical data. Test all routing
// cases with a stubbed fetch, not against the production database.
const dlSource = readFileSync(new URL('../api/dl.js',import.meta.url),'utf8');
assert.doesNotMatch(dlSource,/method\s*:\s*['"]DELETE['"]/);
const originalFetch = globalThis.fetch;
const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dl = (await import('../api/dl.js')).default;
const posts=[];
try {
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-only';
  globalThis.fetch=async(url,options={})=>{
    posts.push({url:String(url),method:options.method||'GET'});
    return new Response(null,{status:201});
  };
  const base='https://www.jrsstandard.com/api/dl?e=employment';
  const head=await dl(new Request(base,{method:'HEAD'}));
  assert.equal(head.status,302);
  assert.equal(posts.length,0);
  const post=await dl(new Request(base,{method:'POST'}));
  assert.equal(post.status,405);
  assert.equal(posts.length,0);
  const prefetch=await dl(new Request(base,{headers:{'sec-purpose':'prefetch'},method:'GET'}));
  assert.equal(prefetch.status,302);
  assert.equal(posts.length,0);
  const test=await dl(new Request(base+'&src=deploytest-check',{method:'GET'}));
  assert.equal(test.status,302);
  assert.equal(posts.length,0);
  const normal=await dl(new Request(base,{method:'GET'}));
  assert.equal(normal.status,302);
  assert.equal(posts.length,2);
  assert.ok(posts.every(x=>x.method==='POST'));
}finally{
  globalThis.fetch=originalFetch;
  if(originalKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY=originalKey;
}

console.log('PASS evidence integrity: 502 on incomplete, source-scope bridge, no download DELETE, GET/HEAD/prefetch distinction');
