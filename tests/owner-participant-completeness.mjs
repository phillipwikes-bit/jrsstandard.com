// Complete-source private participant test. Synthetic rows only.
import assert from 'node:assert/strict';
import people from '../api/people-9dd1ecdf6f8cdfd4.js';
const keys=['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY'];
const prev=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const originalFetch=globalThis.fetch;
const secret='synthetic-owner-participant-secret-01234567890123';
let calls=0;
const req=()=>new Request('https://www.jrsstandard.com/api/people-9dd1ecdf6f8cdfd4',
  {headers:{Authorization:'Bearer '+secret}});
try{
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-private-source-key';
  const sample=Array.from({length:1000},(_,i)=>({
    created_at:'2026-10-31T12:00:00Z',name:'Fixture Name '+i,
    email:'fixture-'+i+'@example.test',organization:'Synthetic Laboratory',
    source:'training-enroll',message:'{}'
  }));
  sample[0]={...sample[0],name:'DIAGNOSTIC TEST',source:'diagnostic',
    message:JSON.stringify({page_source:'deploytest-2026'})};
  sample[1]={...sample[1],name:'Legitimate contact with historic test code',
    message:JSON.stringify({code:'TEST-00'})};
  sample[2]={...sample[2],name:'Do Not Contact',message:'{}'};
  globalThis.fetch=async(_url,options)=>{
    calls++;
    if(calls===1){
      assert.equal(options.headers.Range,'0-999');
      return Response.json(sample);
    }
    assert.equal(options.headers.Range,'1000-1999');
    return new Response('synthetic outage',{status:503});
  };
  let r=await people(req());
  assert.equal(r.status,502);
  let body=await r.json();
  assert.equal(body.complete,false);
  assert.equal(body.error,'private_participant_source_incomplete');
  assert.ok(!('people' in body));
  assert.ok(!('total_rows' in body));
  assert.equal(calls,2);
  console.log('PASS interrupted data source does not return partial named list');
  calls=0;
  // Survey funnel counts (2026-11-21) are HEAD requests to interaction_events.
  // They are tallied separately so `calls` still counts participant-source pages
  // exactly, and they return no Content-Range here, which must yield null
  // (not available), never a false zero.
  const funnelCalls=[];
  globalThis.fetch=async(url,options)=>{
    if(String(url).includes('/interaction_events')){
      funnelCalls.push({url:String(url),method:options&&options.method});
      return new Response(null,{status:200});
    }
    calls++;
    return Response.json(calls===1?sample:[{
      created_at:'2026-10-31T13:00:00Z',name:'Last fixture',
      email:'last-fixture@example.test',organization:'Synthetic Laboratory',
      source:'training-enroll',message:'{}'
    }]);
  };
  r=await people(req());
  assert.equal(r.status,200);
  body=await r.json();
  assert.equal(body.ok,true);
  assert.equal(body.complete,true);
  assert.equal(body.source_row_count,1001);
  assert.equal(body.retained_source_rows,1001);
  assert.ok(!Number.isNaN(Date.parse(body.coverage_through_utc)));
  assert.match(body.pagination_basis,/not a transactional snapshot/);
  assert.equal(body.total_rows,1001);
  assert.equal(body.people.length,1001);
  assert.equal(body.possible_test_rows,2);
  assert.match(body.test_marker_basis,/no source record excluded/);
  assert.equal(body.people[0].name,'DIAGNOSTIC TEST');
  assert.equal(body.people[0].possible_test_marker,true);
  assert.equal(body.people[1].possible_test_marker,true);
  assert.equal(body.people[2].name,'Do Not Contact');
  assert.equal(body.people[2].possible_test_marker,false);
  assert.equal(body.people[1000].source_position,1000);
  assert.equal(body.people[1000].name,'Last fixture');
  assert.equal(calls,2);
  assert.equal(funnelCalls.length,4);
  assert.equal(funnelCalls.filter(c=>/country=eq\.US/.test(c.url)).length,2);
  assert.ok(funnelCalls.every(c=>c.method==='HEAD'&&/source=eq\.page-view/.test(c.url)));
  assert.ok(funnelCalls.some(c=>/event=eq\.review-view/.test(c.url)));
  assert.ok(funnelCalls.some(c=>/event=eq\.review-start/.test(c.url)));
  assert.equal(body.survey_funnel.opened,null);
  assert.equal(body.survey_funnel.started,null);
  assert.equal(body.survey_funnel.opened_us,null);
  assert.equal(body.survey_funnel.started_us,null);
  console.log('PASS complete 1001-row source retains flagged historical tests and genuine contacts without suppression');
}finally{
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries(prev)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
