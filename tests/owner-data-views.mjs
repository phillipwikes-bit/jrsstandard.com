import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import enroll from '../api/enroll-admin.js';
import supporters from '../api/support-contacts.js';
import {createOwnerCookie} from '../api/_owner-auth.js';

const saved={};
for (const name of ['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY','BENCH_ADMIN_TOKEN','RUN_TOKEN']){
  saved[name]=process.env[name];delete process.env[name];
}
const oldFetch=globalThis.fetch,owner='synthetic-owner-authentication-token-requires-thirty-two-chars';
const legacy='synthetic-legacy-token';
const url=name=>'https://www.jrsstandard.com/api/'+name;
let reads=0;
try {
  process.env.BENCH_ADMIN_TOKEN=legacy;
  process.env.RUN_TOKEN=legacy;
  globalThis.fetch=async()=>{reads++;throw Error('Unauthorized data read')};

  for(const [name,fn] of [['enroll-admin',enroll],['support-contacts',supporters]]){
    let response=await fn(new Request(url(name)+'?token='+legacy));
    assert.equal(response.status,503,name+' denies with no owner-secret config');
    assert.equal(response.headers.get('access-control-allow-origin'),null);
  }
  process.env.OWNER_DASHBOARD_TOKEN=owner;
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-server-only-database-key';
  for(const [name,fn] of [['enroll-admin',enroll],['support-contacts',supporters]]){
    const response=await fn(new Request(url(name)+'?token='+legacy));
    assert.equal(response.status,401,name+' denies legacy query-string credential');
    assert.equal(response.headers.get('access-control-allow-origin'),null);
    for(const method of ['OPTIONS','POST']){
      const result=await fn(new Request(url(name),{method}));
      assert.equal(result.status,405,name+' blocks '+method);
      assert.equal(result.headers.get('access-control-allow-origin'),null);
    }
  }
  assert.equal(reads,0,'no anonymous database calls');

  const cookie=(await createOwnerCookie()).split(';')[0];
  const record={name:'Synthetic Trainee',email:'synthetic@example.test',
    organization:'Example',message:JSON.stringify({title:'Reviewer',consent_transfer:false}),
    created_at:'2026-10-20T10:00:00Z'};
  globalThis.fetch=async (target,options)=>{
    reads++;
    const u=String(target);
    assert.ok(u.startsWith('https://pjzxkeviouofdseagvpf.supabase.co/rest/v1/'));
    assert.equal(options.headers.Authorization,'Bearer synthetic-server-only-database-key');
    if(u.includes('source=eq.training-enroll')) return Response.json([record]);
    if(u.includes('source=eq.training-complete')) return Response.json([{email:record.email,created_at:'2026-10-21T10:00:00Z'}]);
    if(u.includes('source=eq.support')) return Response.json([{...record,message:JSON.stringify({campaign:'general',consent_transfer:false})}]);
    if(u.includes('source=in.(reviewer-eval-incentive,reviewer-cert,honor-accept)')) return Response.json([]);
    throw Error('Unknown read path');
  };
  let response=await enroll(new Request(url('enroll-admin'),{headers:{Cookie:cookie}}));
  assert.equal(response.status,200);
  let body=await response.json();
  assert.equal(body.count,1);
  assert.equal(body.completed,1);
  assert.equal(body.people[0].consent_transfer,false);
  response=await supporters(new Request(url('support-contacts'),{headers:{Authorization:'Bearer '+owner}}));
  assert.equal(response.status,200);
  body=await response.json();
  assert.equal(body.count,1);
  assert.equal(body.contacts[0].consent_transfer,false);
  assert.equal(body.recommendation_request_count,0);
  assert.equal(reads,4,'only the authorized expected database reads');

  for(const filename of ['api/enroll-admin.js','api/support-contacts.js']){
    const src=readFileSync(new URL('../'+filename,import.meta.url),'utf8');
    assert.ok(src.includes("from './_owner-auth.js'"),filename);
    assert.ok(src.includes('await ownerAccess(req)'),filename);
    for(const prohibited of ["searchParams.get('token')",'BENCH_ADMIN_TOKEN','RUN_TOKEN','Access-Control-Allow-Origin']){
      assert.ok(!src.includes(prohibited),filename+' retains '+prohibited);
    }
  }
  const dashboard=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  for(const name of ['enroll-admin','support-contacts']){
    assert.ok(dashboard.includes('href="/api/'+name+'"'),'owner navigation');
    assert.ok(!dashboard.includes('/api/'+name+'?token='),'no URL tokens in owner navigation');
  }
  console.log('PASS owner-only named-record readers: query token denial, no CORS, authenticated retrieval and consent integrity');
} finally {
  globalThis.fetch=oldFetch;
  for(const [name,value] of Object.entries(saved)){
    if(value===undefined)delete process.env[name];else process.env[name]=value;
  }
}
