// Issue 3.3 / Increment 21. All fetches are mocked, no live Supabase
// transactions, identifiers, secrets or personal records.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchAll,fetchAllUrl,fetchAllRows} from '../api/_sb-fetch.js';
import {createOwnerCookie} from '../api/_owner-auth.js';
import training from '../api/enroll-stats.js';
import checkout from '../api/checkout-stats.js';
import {readFileSync} from 'node:fs';

const BASE='https://fictional-db.invalid';
const OWNER_URL='https://www.jrsstandard.com';
const SECRET='increment21-fabricated-owner-secret-12345678901234567890';
const sourceUrl=BASE+'/rest/v1/pilot_contacts?select=email&source=eq.training-complete&limit=10000';
const priorFetch=globalThis.fetch;
const priorOwner=process.env.OWNER_DASHBOARD_TOKEN;
const priorService=process.env.SUPABASE_SERVICE_ROLE_KEY;

function range(options={}){
 const s=options.headers?.Range??options.headers?.range;
 assert.match(s||'',/^\d+-\d+$/,'Range is required on all paginated reads');
 return s.split('-').map(Number);
}
async function withMock(mock,fn){
 const before=globalThis.fetch;
 globalThis.fetch=async(u,o)=>mock(String(u),o);
 try{return await fn()}finally{globalThis.fetch=before}
}
function fullRows(n){
 return Array.from({length:n},(_,i)=>({id:i+1}));
}
function paged(rows,{breakPage=-1,mode='error'}={}){
 let calls=0;
 const call=async (u,o)=>{
  assert(!u.includes('limit=10000'),'full URL wrapper removes ineffective limit');
  const [start,end]=range(o);
  const page=calls++;
  if(page===breakPage){
   if(mode==='throw')throw Error('synthetic_disconnect');
   if(mode==='badjson')return Response.json({unexpected:'shape'});
   return Response.json({error:'synthetic_error'},{status:502});
  }
  return Response.json(rows.slice(start,end+1),{status:206});
 };
 return {call,count:()=>calls};
}
async function cookieRequest(path){
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-not-a-real-service-credential';
 const cookie=(await createOwnerCookie()).split(';')[0];
 return new Request(OWNER_URL+path,{headers:{Cookie:cookie}});
}

test.after(()=>{
 globalThis.fetch=priorFetch;
 if(priorOwner===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;else process.env.OWNER_DASHBOARD_TOKEN=priorOwner;
 if(priorService===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=priorService;
});

test('01 legitimate zero-row source returns a genuine empty result',async()=>{
 const f=paged([]);const rows=await withMock(f.call,()=>fetchAllUrl(sourceUrl,{}));
 assert.deepEqual(rows,[]);assert.equal(f.count(),1);
});
test('02 1,001 rows are complete across first and second page',async()=>{
 const f=paged(fullRows(1001));const rows=await withMock(f.call,()=>fetchAllUrl(sourceUrl,{}));
 assert.equal(rows.length,1001);assert.equal(f.count(),2);assert.equal(rows[1000].id,1001);
});
test('03 a first-page upstream 502 cannot become an empty source',async()=>{
 const f=paged([], {breakPage:0});
 await withMock(f.call,()=>assert.rejects(fetchAllUrl(sourceUrl,{}),/source_read_incomplete/));
});
test('04 later upstream failure cannot become a plausible partial count',async()=>{
 const f=paged(fullRows(1001),{breakPage:1});
 await withMock(f.call,()=>assert.rejects(fetchAllUrl(sourceUrl,{}),/source_read_incomplete/));
 assert.equal(f.count(),2);
});
test('05 first page succeeds then network throws: complete must be false',async()=>{
 const f=paged(fullRows(1002),{breakPage:1,mode:'throw'});
 await withMock(f.call,async()=>{
  const base=await fetchAll(BASE,'pilot_contacts?select=email',{});
  assert.equal(base.complete,false);assert.equal(base.rows.length,1000);
 });
});
test('06 any malformed source URL is an error, not a zero',async()=>{
 await assert.rejects(fetchAllUrl(BASE+'/not-postgrest?x=1',{}),/source_url_invalid/);
});
test('07 nonarray upstream body causes wrapper rejection',async()=>{
 const f=paged([],{breakPage:0,mode:'badjson'});
 await withMock(f.call,()=>assert.rejects(fetchAllUrl(sourceUrl,{}),/source_read_incomplete/));
});
test('08 row-only wrapper also rejects incomplete data',async()=>{
 const f=paged(fullRows(1011),{breakPage:1});
 await withMock(f.call,()=>assert.rejects(fetchAllRows(BASE,'pilot_contacts?select=email',{}),/source_read_incomplete/));
});
test('09 base reader preserves explicit completeness flag for deliberate handlers',async()=>{
 const f=paged([],{breakPage:0});
 await withMock(f.call,async()=>{
  const x=await fetchAll(BASE,'pilot_contacts?select=email',{});
  assert.equal(x.complete,false);
  assert.deepEqual(x.rows,[]);
 });
});
test('10 checkout fallback-source failure reports HTTP 502, never zero leads',async()=>{
 const req=await cookieRequest('/api/checkout-stats');
 let calls=0;
 await withMock((u,o)=>{
  calls++;range(o);
  if(u.includes('source=eq.checkout-fallback'))return Response.json({error:'offline_failed'},{status:503});
  return Response.json([]);
 },async()=>{
  const r=await checkout(req);assert.equal(r.status,502);
  assert.equal((await r.json()).error,'checkout_source_incomplete');
  assert.match(r.headers.get('cache-control')||'',/no-store/);
 });
 assert(calls>=2);
});
test('11 checkout enterprise-inquiry failure also reports HTTP 502',async()=>{
 const req=await cookieRequest('/api/checkout-stats');
 await withMock((u,o)=>{
  range(o);
  if(u.includes('source=eq.enterprise-inquiry'))return Response.json({error:'offline_failed'},{status:502});
  return Response.json([]);
 },async()=>{
  const r=await checkout(req);assert.equal(r.status,502);
  assert.equal((await r.json()).error,'checkout_source_incomplete');
 });
});
test('12 genuinely complete empty checkout sources remain a valid zero',async()=>{
 const req=await cookieRequest('/api/checkout-stats');
 await withMock((u,o)=>{range(o);return Response.json([])},async()=>{
  const r=await checkout(req);assert.equal(r.status,200);
  const x=await r.json();assert.equal(x.fallback_leads,0);assert.equal(x.enterprise_inquiries,0);
 });
});
test('13 1,001 distinct training completions remain visible beyond 1,000-row cap',async()=>{
 const req=await cookieRequest('/api/enroll-stats');
 const completions=Array.from({length:1001},(_,i)=>({
  email:'fabricated'+i+'@invalid.example',
  message:'{"country":"US"}'
 }));
 let completionRequests=0;
 await withMock((u,o)=>{
  const [from,to]=range(o);
  if(u.includes('source=eq.training-enroll'))return Response.json([]);
  if(u.includes('source=eq.training-complete')){
   completionRequests++;return Response.json(completions.slice(from,to+1),{status:206});
  }
  throw Error('unexpected source '+u);
 },async()=>{
  const r=await training(req);assert.equal(r.status,200);
  const x=await r.json();assert.equal(x.enrollments,0);
  assert.equal(x.completions,1001);
  assert.equal(x.completions_countries,1);
  assert.equal(x.completions_by_country[0].count,1001);
 });
 assert.equal(completionRequests,2);
});
test('14 incomplete training-completion page returns 502, never partial count',async()=>{
 const req=await cookieRequest('/api/enroll-stats');
 const completions=Array.from({length:1000},(_,i)=>({
  email:'fabricated'+i+'@invalid.example',message:'{"country":"US"}'
 }));
 await withMock((u,o)=>{
  const [from,to]=range(o);
  if(u.includes('source=eq.training-enroll'))return Response.json([]);
  if(u.includes('source=eq.training-complete')){
   if(from>=1000)return Response.json({error:'failure'},{status:502});
   return Response.json(completions.slice(from,to+1),{status:206});
  }
  throw Error('unexpected source '+u);
 },async()=>{
  const r=await training(req);assert.equal(r.status,502);
  assert.equal((await r.json()).error,'training_completions_unavailable');
 });
});
test('15 source baseline retains original enrolled reader identity and proposed exact exception',()=>{
 const root=new URL('../',import.meta.url);
 const b=JSON.parse(readFileSync(new URL('tests/public-program-baseline.json',root)));
 const e=JSON.parse(readFileSync(new URL('tests/public-program-controlled-exceptions.json',root)));
 assert.equal(Object.keys(b.files).length,24);
 assert.equal(e.owner_approval,'NOT_PROVIDED');
 assert.equal(e.production_status,'HOLD');
 assert.equal(e.entries['api/enroll-stats.js'].before_blob_sha,b.files['api/enroll-stats.js']);
 assert.notEqual(e.entries['api/enroll-stats.js'].candidate_blob_sha,b.files['api/enroll-stats.js']);
 assert.equal(Object.keys(e.entries).length,8);
});
