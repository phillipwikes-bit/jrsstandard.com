// Synthetic owner-readiness diagnostics. Never reads or logs real credentials.
import assert from 'node:assert/strict';
import handler from '../api/owner-release-readiness.js';

const keys=['OWNER_DASHBOARD_TOKEN','JRS_OWNER_EMAIL','NEON_AUTH_BASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
const secret='synthetic-test-owner-secret-012345678901234567890123456789';
const url='https://www.jrsstandard.com/api/owner-release-readiness';
const req=(authorized=true)=>new Request(url,{
  headers: authorized?{authorization:'Bearer '+secret}:{}
});
try{
  keys.forEach(k=>delete process.env[k]);
  assert.equal((await handler(req(false))).status,503);
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  assert.equal((await handler(req(false))).status,401);
  let response=await handler(req());
  assert.equal(response.status,200);
  assert.match(response.headers.get('cache-control'),/no-store/);
  let data=await response.json();
  assert.equal(data.assessment,'configuration_inventory_not_release_authorization');
  assert.deepEqual(data.missing_configuration,['owner_email','neon_auth_base','database_service_key']);
  assert.equal(data.current_public_inquiry_path,'Formspree relay, not the historical Supabase site-inquiry table');
  process.env.JRS_OWNER_EMAIL='synthetic-owner@example.test';
  process.env.NEON_AUTH_BASE_URL='https://synthetic.neon.tech/neondb/auth';
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-key-no-real-data';
  response=await handler(req());
  data=await response.json();
  assert.equal(data.missing_configuration.length,0);
  assert.ok(data.required_independent_verifications.every(x=>x.state==='not_verified_by_this_endpoint'));
  assert.equal(data.production_release,'PRIVATE_DASHBOARD_HOLD_UNTIL_VERIFICATION_AND_OWNER_AUTHORIZATION');
  assert.ok(!JSON.stringify(data).includes('synthetic-owner@example.test'));
  assert.ok(!JSON.stringify(data).includes('synthetic-key-no-real-data'));
  process.env.NEON_AUTH_BASE_URL='http://untrusted.example.test/auth';
  data=await (await handler(req())).json();
  assert.deepEqual(data.missing_configuration,['neon_auth_base']);
  console.log('PASS owner release inventory: fail-closed, private, Neon/owner email requirements, never grants release');
}finally{
  for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
