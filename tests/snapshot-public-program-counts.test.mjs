import test from 'node:test';
import assert from 'node:assert/strict';
import { capture,compare,parseCount,GROUPS } from '../scripts/snapshot-public-program-counts.mjs';
const fixed='2026-10-31T00:00:00.000Z';
const header=n=>new Response(null,{status:200,headers:{'Content-Range':'*/'+n}});
test('parse count from full and empty postgrest headers',()=>{
 assert.equal(parseCount('0-0/1'),1);assert.equal(parseCount('*/0'),0);
 assert.throws(()=>parseCount('*/ *'),/invalid_count_header/);
 assert.throws(()=>parseCount(null),/missing_count_header/);
 assert.throws(()=>parseCount('*/unknown'),/invalid_count_header/);
});
test('valid fractional UTC cutoffs accepted, invalid calendar dates refused',async()=>{
 const stamp='2026-10-31T00:00:00.123Z';
 let called=0;
 const r=await capture({cutoff:stamp,service:'synthetic-service-key',
  fetchImpl:async()=>{called++;return header(1)},now:()=>fixed});
 assert.equal(r.cutoff_utc,stamp);assert.equal(called,GROUPS.length);
 await assert.rejects(capture({cutoff:'2026-02-30T00:00:00.000Z',service:'synthetic-service-key',
  fetchImpl:async()=>{throw Error('unexpected request')}}),/invalid_cutoff/);
});
test('missing service credential refuses before network',async()=>{
 let hits=0;
 await assert.rejects(capture({cutoff:fixed,service:'',fetchImpl:async()=>{hits++}}),/missing_service_configuration/);
 assert.equal(hits,0);
});
test('invalid cutoff refuses before network',async()=>{
 let hits=0;
 await assert.rejects(capture({cutoff:'2026-10-31',service:'long-test-key',fetchImpl:async()=>{hits++}}),/invalid_cutoff/);
 assert.equal(hits,0);
});
test('read-only exact-count headers, no row bodies, and fixed UTC cutoff',async()=>{
 const requests=[];
 const f=async(url,opts)=>{requests.push({url,opts});return header(5)};
 const r=await capture({cutoff:fixed,service:'synthetic-service-key',fetchImpl:f,
   now:()=>fixed});
 assert.equal(r.entries.length,GROUPS.length);
 assert.equal(requests.length,GROUPS.length);
 assert.equal(r.cutoff_utc,fixed);
 assert(!JSON.stringify(r).includes('synthetic-service-key'));
 for(const {url,opts} of requests){
  assert.equal(opts.method,'HEAD');
  assert.equal(opts.redirect,'error');
  assert.equal(opts.headers.Prefer,'count=exact');
  assert.equal(opts.headers.Authorization,'Bearer synthetic-service-key');
  const u=new URL(url);assert.equal(u.origin,'https://pjzxkeviouofdseagvpf.supabase.co');
  assert.equal(u.searchParams.get('created_at'),'lt.'+fixed);
  assert(!u.searchParams.has('email'));assert(!u.searchParams.has('name'));
 }
});
test('HTTP 500 fails closed, not zero',async()=>{
 await assert.rejects(capture({cutoff:fixed,service:'synthetic-service-key',
   fetchImpl:async()=>new Response(null,{status:500})}),/read_unavailable:events_all/);
});
test('missing Content-Range fails closed',async()=>{
 await assert.rejects(capture({cutoff:fixed,service:'synthetic-service-key',
   fetchImpl:async()=>new Response(null,{status:200})}),/count_unavailable:events_all/);
});
test('connection exception fails closed without exposing secrets',async()=>{
 await assert.rejects(capture({cutoff:fixed,service:'synthetic-service-key',
   fetchImpl:async()=>{throw Error('synthetic-service-key was seen')}}),
   err=>err.message==='read_unavailable:events_all');
});
test('exact matching snapshot reconciles',async()=>{
 const base=await capture({cutoff:fixed,service:'synthetic-service-key',fetchImpl:async()=>header(5),now:()=>fixed});
 const next=structuredClone(base);next.captured_utc='2026-11-02T00:00:00.000Z';
 const r=compare(base,next);assert.equal(r.state,'counts_equal');
 assert(r.delta.every(x=>x.delta===0));
});
test('historical backfill is a discrepancy not an overwritten count',async()=>{
 const base=await capture({cutoff:fixed,service:'synthetic-service-key',fetchImpl:async()=>header(5),now:()=>fixed});
 const next=structuredClone(base);next.entries[3].count=6;
 const r=compare(base,next);
 assert.equal(r.state,'discrepancy_requires_review');
 assert.equal(r.delta[3].delta,1);
});
test('cross-cutoff comparison refused',async()=>{
 const base=await capture({cutoff:fixed,service:'synthetic-service-key',fetchImpl:async()=>header(5),now:()=>fixed});
 const next=structuredClone(base);next.cutoff_utc='2026-11-01T00:00:00.000Z';
 assert.throws(()=>compare(base,next),/snapshot_scope_mismatch/);
});
test('missing family refuses silent alignment',async()=>{
 const base=await capture({cutoff:fixed,service:'synthetic-service-key',fetchImpl:async()=>header(5),now:()=>fixed});
 const next=structuredClone(base);next.entries.pop();
 assert.throws(()=>compare(base,next),/snapshot_schema_drift/);
});
