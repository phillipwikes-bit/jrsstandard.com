import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/support-stats.js';

const originalService=process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalFetch=globalThis.fetch;
test.after(()=>{
 globalThis.fetch=originalFetch;
 if(originalService===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 else process.env.SUPABASE_SERVICE_ROLE_KEY=originalService;
});
const event=(campaign='rtkw',src='human',day='2026-10-30')=>
 ({payload:{campaign,src,country:'US'},created_at:day+'T12:00:00Z'});
async function invoke({missingKey=false,primary=[],outage=[],wall=[],named=0,fail=null,largePrimary=false,largeWall=false}={}){
 const requests=[];
 if(missingKey)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 else process.env.SUPABASE_SERVICE_ROLE_KEY='test-key-long-enough';
 globalThis.fetch=async(url,opts={})=>{
  const u=String(url), range=opts?.headers?.Range||'0-999';
  requests.push({url:u,range});
  const kind=u.includes('source=eq.support')?'primary':
   u.includes('source=eq.gate-view')?'outage':
   u.includes('select=id')?'named':'wall';
  if(fail===kind)return new Response('source failed',{status:503});
  if(fail===kind+'-page2'&&range==='1000-1999')
    return new Response('second page interrupted',{status:503});
  if(kind==='named'){
   const returned=named===0?'*/0':('0-0/'+named);
   return new Response('[]',{status:206,headers:{'Content-Range':returned,'Content-Type':'application/json'}});
  }
  const base=kind==='primary'?primary:kind==='outage'?outage:wall;
  const rows=kind==='primary'&&largePrimary?Array.from({length:1000},()=>event())
      :kind==='wall'&&largeWall?Array.from({length:1000},()=>({name:'Fixture Consent',message:'{"consent_public_list":false}'}))
      :base;
  if(range==='1000-1999')return Response.json([]);
  return Response.json(rows);
 };
 const res=await handler(new Request('https://jrs.example.test/api/support-stats'));
 return {res,data:await res.json(),requests};
}
test('missing server key returns 503 unavailable, never synthetic zero',async()=>{
 const x=await invoke({missingKey:true});
 assert.equal(x.res.status,503);assert.equal(x.data.error,'support_stats_unavailable');
 assert.equal(x.data.total,undefined);assert.equal(x.requests.length,0);
});
test('primary database 503 returns 502 unavailable, not zero',async()=>{
 const x=await invoke({fail:'primary'});
 assert.equal(x.res.status,502);assert.equal(x.data.error,'support_stats_unavailable');
 assert.equal(x.data.total,undefined);
});
test('interrupted second page refuses a plausible 1000-row partial count',async()=>{
 const x=await invoke({largePrimary:true,fail:'primary-page2'});
 assert.equal(x.res.status,502);assert.equal(x.data.total,undefined);
 assert(x.requests.some(r=>r.range==='1000-1999'));
});
test('genuinely empty complete dataset returns observable zero',async()=>{
 const x=await invoke();
 assert.equal(x.res.status,200);assert.equal(x.data.total,0);
 assert.deepEqual(x.data.by_campaign,[]);
 assert.equal(x.data.named_supporters,0);
});
test('valid support rows preserve previous counting/filtering categories',async()=>{
 const x=await invoke({primary:[event('rtkw','human'),event('defend','human'),event('rtkw','test')],named:2});
 assert.equal(x.res.status,200);assert.equal(x.data.total,2);
 assert.equal(x.data.named_supporters,2);
 assert.equal(x.data.countries,1);
 assert.equal(x.data.by_campaign.length,2);
});
test('outage historical-source failure is not silently reported as zero',async()=>{
 const x=await invoke({fail:'outage'});
 assert.equal(x.res.status,502);assert.equal(x.data.total,undefined);
});
test('named count error is not silently reported as zero',async()=>{
 const x=await invoke({fail:'named'});
 assert.equal(x.res.status,502);assert.equal(x.data.total,undefined);
});
test('public supporter wall failure is not silently reported as empty',async()=>{
 const x=await invoke({fail:'wall'});
 assert.equal(x.res.status,502);assert.equal(x.data.total,undefined);
});
test('public wall pagination failure is rejected instead of listing partial consent',async()=>{
 const x=await invoke({largeWall:true,fail:'wall-page2'});
 assert.equal(x.res.status,502);assert.equal(x.data.total,undefined);
});
test('public wall includes only explicit public-listing consent',async()=>{
 const x=await invoke({wall:[
   {name:'Fixture A',organization:'Sample Org',message:'{"consent_public_list":true,"campaign":"rtkw"}'},
   {name:'Fixture B',organization:'Private Org',message:'{"consent_public_list":false,"campaign":"defend"}'},
   {name:'Fixture C',organization:'Private Org',message:'{}'}
 ]});
 assert.equal(x.res.status,200);
 assert.deepEqual(x.data.public_supporters,[{name:'Fixture A',organization:'Sample Org',initiative:'The Right to Know Why'}]);
 assert.equal(JSON.stringify(x.data).includes('Fixture B'),false);
});
test('read failures do not leak server credential or source response text',async()=>{
 const x=await invoke({fail:'primary'});
 const body=JSON.stringify(x.data);
 assert.equal(body.includes('test-key-long-enough'),false);
 assert.equal(body.includes('source failed'),false);
 assert.equal(x.res.headers.get('cache-control'),'no-store');
});
