// Increment 22, offline keyset evidence and owner-checkout reconstruction tests.
// Every PostgREST response here is synthesized. Never use real credentials,
// record payloads, study participants, emails, or external network access.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchBoundedKeyset} from '../api/_sb-bounded-keyset.js';
import checkout from '../api/checkout-stats.js';
import {createOwnerCookie} from '../api/_owner-auth.js';

const BASE='https://fictional-db.invalid/rest/v1/pilot_contacts?select=id,created_at,message&source=eq.checkout-fallback';
const CUT='2026-10-31T00:00:00.000Z';
const OWNER_ORIGIN='https://www.jrsstandard.com';
const SECRET='only-test-increment22-owner-secret-0123456789012345';
const savedOwner=process.env.OWNER_DASHBOARD_TOKEN;
const savedService=process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalFetch=globalThis.fetch;
const ts=(n)=>'2026-10-30T12:00:'+String(n).padStart(2,'0')+'.000Z';
const row=(id,stamp=ts(id))=>({id,created_at:stamp,message:'{}'});
const range=(o)=>{
 const value=o?.headers?.Range;
 assert.match(value||'',/^0-\d+$/);
 assert.equal(o.method,'GET');assert.equal(o.redirect,'error');
 assert.equal(o.cache,'no-store');
 return Number(value.slice(2))+1;
};
function cursorParams(u){
 const p=new URL(u).searchParams;
 assert.equal(p.get('order'),'created_at.asc,id.asc');
 const cutoff=p.get('created_at');assert.match(cutoff||'',/^lte\./);
 assert.equal(p.getAll('order').length,1);
 return p;
}
// Model only PostgREST filter behavior relevant to these exact trusted queries.
function scripted(rows,{errorCall=-1,malformedCall=-1,mutate}={}){
 let count=0,previousQueries=[];
 const fn=async(url,opt)=>{
  const i=count++,n=range(opt),p=cursorParams(url);
  previousQueries.push(url);
  if(i===errorCall)return Response.json({error:'synthetic_502'},{status:502});
  if(i===malformedCall)return Response.json({error:'wrong_shape'});
  if(mutate)mutate({i,rows});
  const cutoff=Date.parse(p.get('created_at').slice(4));
  let result=rows.filter(x=>Date.parse(x.created_at)<=cutoff);
  const keyset=p.get('or');
  if(keyset){
   const match=keyset.match(/^\(created_at\.gt\.([^,]+),and\(created_at\.eq\.([^,]+),id\.gt\.([0-9a-f-]+)\)\)$/);
   assert(match,'keyset predicate must preserve both cursor components');
   assert.equal(match[1],match[2]);
   const instant=match[1],id=BigInt(match[3]);
   const sortedTime=value=>value.replace(/\+00:00$/,'Z')
     .replace(/\.(\d{1,6})Z$/,(_,part)=>'.'+part.padEnd(6,'0')+'Z')
     .replace(/(\d{2})Z$/,(_,s)=>s+'.000000Z');
   result=result.filter(x=>
    sortedTime(x.created_at)>sortedTime(instant) ||
    (sortedTime(x.created_at)===sortedTime(instant) && BigInt(x.id)>id)
   );
  }
  return Response.json(result.slice(0,n),{status:206});
 };
 return {fn,calls:()=>count,queries:()=>previousQueries};
}
async function withMock(mock,work){
 const old=globalThis.fetch;globalThis.fetch=mock;
 try{return await work()}finally{globalThis.fetch=old}
}
test.after(()=>{
 globalThis.fetch=originalFetch;
 if(savedOwner===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;else process.env.OWNER_DASHBOARD_TOKEN=savedOwner;
 if(savedService===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=savedService;
});
test('01 zero is legitimate when the bounded source returns an empty first page',async()=>{
 const f=scripted([]);
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:3}));
 assert.equal(x.rows.length,0);assert.equal(x.evidence.observed_rows,0);
 assert.equal(x.evidence.page_requests,1);
});
test('02 stable 5-row source walks exact keyset pages without offsets',async()=>{
 const f=scripted([row(1),row(2),row(3),row(4),row(5)]);
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}));
 assert.deepEqual(x.rows.map(y=>y.id),[1,2,3,4,5]);
 assert.equal(x.evidence.page_requests,3);
 assert.equal(x.evidence.pagination,'strict_keyset');
 assert.equal(x.evidence.consistency,'bounded_ordered_read_not_atomic_snapshot');
 assert.equal(new URL(f.queries()[1]).searchParams.get('or'),
  '(created_at.gt.'+ts(2)+',and(created_at.eq.'+ts(2)+',id.gt.2))');
});
test('03 concurrent insertion behind the cursor does not shift page offset',async()=>{
 const data=[row(1),row(2),row(3),row(4)];
 const f=scripted(data,{mutate:({i,rows})=>{
  if(i===1)rows.push(row(99,ts(1))); // behind the prior cursor
 }});
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}));
 assert.deepEqual(x.rows.map(x=>x.id),[1,2,3,4]);
 assert.equal(x.rows.some(x=>x.id===99),false);
 // The backdated insertion is NOT a proven atomic snapshot.
 assert.equal(x.evidence.consistency,'bounded_ordered_read_not_atomic_snapshot');
});
test('04 above-cutoff records excluded by the exact same UTC bound',async()=>{
 const f=scripted([row(1),row(2,'2026-11-01T12:00:00.000Z')]);
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}));
 assert.deepEqual(x.rows.map(r=>r.id),[1]);assert.equal(x.evidence.cutoff_utc,CUT);
});
test('05 response with duplicate row IDs is rejected even across timestamps',async()=>{
 const records=[row(1),row(1,ts(2))];
 // Return repeated id on the first page, bypass simulator's filtering.
 await withMock(async(u,o)=>{range(o);return Response.json(records)},()=>
  assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:3}),/source_duplicate_id/));
});
test('06 out-of-order rows are refused before any figures are published',async()=>{
 await withMock(async(u,o)=>{range(o);return Response.json([row(2),row(1)])},()=>
  assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:3}),/source_order_invalid/));
});
test('07 a row after the cutoff is rejected if backend violates filter',async()=>{
 await withMock(async(u,o)=>{range(o);return Response.json([row(1,'2026-11-01T00:00:00.000Z')])},()=>
  assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:3}),/source_row_after_cutoff/));
});
test('08 missing, malformed and unsafe row IDs refuse the entire source',async()=>{
 for(const id of [undefined,'abc,or=(x)','not-a-uuid']){
  await withMock(async()=>Response.json([{id,created_at:ts(1)}]),()=>
   assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}),/source_id_invalid/));
 }
});
test('09 invalid or non-UTC source timestamp refuses instead of guessing order',async()=>{
 for(const stamp of ['broken','2026-10-30T12:00:00-04:00']){
  await withMock(async()=>Response.json([row(1,stamp)]),()=>
   assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}),/source_timestamp_invalid/));
 }
});
test('10 upstream failure and malformed bodies are never converted to zero',async()=>{
 for(const config of [{errorCall:0},{malformedCall:0},{errorCall:1}]){
  const f=scripted([row(1),row(2),row(3)],config);
  await withMock(f.fn,()=>assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}),
   /source_read_incomplete|source_page_invalid/));
 }
});
test('11 unapproved table, fields, filters and URL shapes are rejected',async()=>{
 const bad=[
  BASE.replace('pilot_contacts','private_unknown'),
  BASE.replace('id,created_at,message','message'),
  BASE+'&order=created_at.desc',
  BASE+'&or=(id.eq.1)',
  BASE.replace('source=eq.checkout-fallback','source=neq.checkout-fallback'),
  'http://fictional-db.invalid/rest/v1/pilot_contacts?select=id,created_at&source=eq.checkout-fallback'
 ];
 for(const url of bad)
  await assert.rejects(fetchBoundedKeyset(url,{}, {cutoffUtc:CUT,pageSize:2}),
   /source_scope_unapproved|source_query_unapproved|source_keys_not_selected|source_filter_invalid/);
});
test('12 invalid cutoff and page size refuse before any network activity',async()=>{
 for(const options of [
  {cutoffUtc:'2026-10-31'}, {cutoffUtc:'2026-10-31T00:00:00Z'},
  {cutoffUtc:CUT,pageSize:0},{cutoffUtc:CUT,pageSize:1001}
 ])await assert.rejects(fetchBoundedKeyset(BASE,{},options),/cutoff_invalid|page_size_invalid/);
});
test('13 microsecond cursor retains exact precision, never rounded to milliseconds',async()=>{
 const a='2026-10-30T12:00:01.123456+00:00';
 const b='2026-10-30T12:00:01.123457+00:00';
 const f=scripted([row(1,a),row(2,b)]);
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:1}));
 assert.equal(x.rows.length,2);
 assert(new URL(f.queries()[1]).searchParams.get('or').includes(a));
});
test('14 page-size excess is rejected even for HTTP 200 response',async()=>{
 await withMock(async()=>Response.json([row(1),row(2),row(3)]),()=>
  assert.rejects(fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}),/source_page_invalid/));
});
test('15 keyset reader does not claim impossible atomic-snapshot guarantees',async()=>{
 const f=scripted([row(1)]);
 const x=await withMock(f.fn,()=>fetchBoundedKeyset(BASE,{}, {cutoffUtc:CUT,pageSize:2}));
 assert.doesNotMatch(x.evidence.consistency,/atomic_snapshot_verified/);
 assert.equal(x.evidence.cutoff_utc,CUT);assert.equal(x.evidence.order,'created_at.asc,id.asc');
});
test('16 checkout integration carries a common cutoff and three source receipts',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-service-key-not-real';
 const cookie=(await createOwnerCookie()).split(';')[0];
 const request=new Request(OWNER_ORIGIN+'/api/checkout-stats',{headers:{Cookie:cookie}});
 const urls=[];
 await withMock(async(u,o)=>{
  urls.push(u);range(o);
  const p=cursorParams(u);
  assert(p.get('select').includes('id'));
  assert(p.get('select').includes('created_at'));
  return Response.json([]);
 },async()=>{
  const r=await checkout(request);assert.equal(r.status,200);
  const x=await r.json();
  assert.equal(x.pay_screen_arrivals,0);assert.equal(x.fallback_leads,0);
  assert.equal(x.enterprise_inquiries,0);
  assert.equal(x.read_consistency.method,'strict_keyset_created_at_id');
  assert.equal(Object.keys(x.read_consistency.source_evidence).length,3);
  assert.equal(new Set(urls.map(u=>new URL(u).searchParams.get('created_at'))).size,1);
  assert.match(x.read_consistency.qualification,/not an atomic/);
 });
 assert.equal(urls.length,3);
});
