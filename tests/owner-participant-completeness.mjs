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
  globalThis.fetch=async(_url,options)=>{
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
  assert.equal(body.total_rows,1001);
  assert.equal(body.people.length,1001);
  assert.equal(body.people[1000].name,'Last fixture');
  assert.equal(calls,2);
  console.log('PASS complete 1001-row source preserves all participant names and email addresses');
}finally{
  globalThis.fetch=originalFetch;
  for(const [key,value] of Object.entries(prev)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
