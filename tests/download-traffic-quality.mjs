// Owner dashboard traffic-quality regression. Offline only, no service keys or external reads.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const helperSource = readFileSync(new URL('../api/_traffic-quality.js', import.meta.url), 'utf8');
const classifier = await import('data:text/javascript;base64,'+Buffer.from(helperSource).toString('base64'));
assert.equal(classifier.classifyDownloadTraffic({user_agent:'Googlebot/2.1'}),'declared_crawler');
assert.equal(classifier.classifyDownloadTraffic({user_agent:'Mozilla/5.0 Chrome/124'}),'not_identified_as_crawler');
assert.equal(classifier.classifyDownloadTraffic({}),'user_agent_missing');
assert.equal(classifier.classifyDownloadTraffic({user_agent:'curl/8.0'}),'declared_crawler');

const assetSource = readFileSync(new URL('../api/asset-stats.js', import.meta.url),'utf8');
assert.match(assetSource,/import \{ CRAWLER, isCrawler, classifyDownloadTraffic, isInternalTestSource, isCurrentDownloadResource \} from '\.\/_traffic-quality\.js';/);

let geoSource = readFileSync(new URL('../api/geo-stats.js', import.meta.url),'utf8');
assert.match(geoSource,/import \{ classifyDownloadTraffic, isInternalTestSource, isCurrentDownloadResource \} from '\.\/_traffic-quality\.js';/);
assert.match(geoSource,/if \(!complete\) return json\(\{ error:'incomplete_download_event_read' \}, 502\)/);
assert.match(geoSource,/reconciles_to_legacy_raw_scope:/);

geoSource = geoSource
  .replace("import { ownerAccess } from './_owner-auth.js';",'')
  .replace("import { fetchAll } from './_sb-fetch.js';",'')
  .replace("import { classifyDownloadTraffic, isInternalTestSource, isCurrentDownloadResource } from './_traffic-quality.js';",'')
  .replace("export const config = { runtime: 'edge' };",'')
  .replace('export default async function handler(req){','async function handler(req){');
assert.equal(geoSource.includes('import '),false);
const buildHandler = new Function('fetchAll','classifyDownloadTraffic','isInternalTestSource','isCurrentDownloadResource','ownerAccess','process',geoSource+'\nreturn handler;');

const rows = [
  {source:'guide-dl', payload:{edition:'employment',country:'US',user_agent:'Mozilla/5.0 Chrome/124'},created_at:'2026-10-30'},
  {source:'guide-dl', payload:{edition:'employment',country:'US',user_agent:'Googlebot/2.1'},created_at:'2026-10-30'},
  {source:'kit-dl', payload:{file:'JRS-Reference-9d4f2a7c.pdf',country:'US',user_agent:'curl/8.0'},created_at:'2026-10-30'},
  {source:'kit-dl', payload:{file:'JRS-Reference-9d4f2a7c.pdf',country:'SG'},created_at:'2026-10-30'},
  {source:'pdf-dl', payload:{doc:'standard',country:'FR',user_agent:'Mozilla/5.0 Chrome/124'},created_at:'2026-10-30'},
  {source:'guide-dl', payload:{edition:'fairhousing',country:'US',src:'test'},created_at:'2026-10-30'},
  {source:'kit-dl', payload:{file:'JRS_Kit_Retired.pdf',country:'US',user_agent:'Mozilla/5.0'},created_at:'2026-10-30'}
];
const env = {env:{SUPABASE_SERVICE_ROLE_KEY:'fake-test-key'}};
const handler = buildHandler(async () => ({rows,complete:true}),classifier.classifyDownloadTraffic,classifier.isInternalTestSource,classifier.isCurrentDownloadResource,async()=>null,env);
const response = await handler(new Request('https://www.jrsstandard.com/api/geo-stats'));
assert.equal(response.status,200);
const d = await response.json();
assert.equal(d.total,2);                    // legacy raw guide geography preserved
assert.equal(d.assets.total,3);             // legacy raw public assets preserved
assert.equal(d.quality.raw_requests,5);     // same complete included population
assert.equal(d.quality.declared_crawler,2);
assert.equal(d.quality.user_agent_missing,1);
assert.equal(d.quality.not_identified_as_crawler,2);
assert.equal(d.quality.internal_test_rows_excluded,1);
assert.equal(d.quality.retired_kit_rows_excluded,1);
assert.equal(d.quality.reconciles_to_legacy_raw_scope,true);
const ref = d.quality.by_asset.find(x=>x.asset==='JRS Reviewer Reference');
assert.ok(ref);
assert.equal(ref.raw_requests,2);
assert.equal(ref.declared_crawler,1);
assert.equal(ref.user_agent_missing,1);
assert.equal(ref.not_identified_as_crawler,0);

// A partial read and a failed database read must not be misreported as 0 downloads.
const partial = buildHandler(async () => ({rows:[rows[0]],complete:false}),classifier.classifyDownloadTraffic,classifier.isInternalTestSource,classifier.isCurrentDownloadResource,env);
assert.equal((await partial(new Request('https://www.jrsstandard.com/api/geo-stats'))).status,502);
const broken = buildHandler(async () => {throw Error('synthetic database failure')},classifier.classifyDownloadTraffic,classifier.isInternalTestSource,classifier.isCurrentDownloadResource,env);
assert.equal((await broken(new Request('https://www.jrsstandard.com/api/geo-stats'))).status,502);

const html = readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
assert.match(html,/id="buyer-evidence-snapshot"/);
assert.match(html,/id="download-quality-rows"/);
assert.match(html,/function renderDownloadQuality\(d\)/);
assert.match(html,/Historical archive, dated 13 August 2026/);
assert.match(html,/NO_GO_NOT_VERIFIED/);
console.log('PASS: shared crawler classification, scoped raw reconciliation, complete-read refusal, dated buyer evidence labels');
