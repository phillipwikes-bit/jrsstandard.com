import assert from 'node:assert/strict';
import readiness from '../api/owner-release-readiness.js';

const KEYS=['OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY','JRS_OWNER_EMAIL','NEON_AUTH_BASE_URL'];
const before=Object.fromEntries(KEYS.map(k=>[k,process.env[k]]));
const originalFetch=globalThis.fetch;
const SECRET='a-synthetic-owner-authorization-token-longer-than-32-chars';
const base='https://www.jrsstandard.com/api/owner-release-readiness';
let fetches=0;
globalThis.fetch=async()=>{fetches++;throw Error('owner readiness must never read the database')};
try {
 for(const key of KEYS)delete process.env[key];
 const anonymous=await readiness(new Request(base));
 assert.equal(anonymous.status,503);
 assert.equal(fetches,0);
 assert.equal((await readiness(new Request(base,{method:'POST'}))).status,405);
 process.env.OWNER_DASHBOARD_TOKEN=SECRET;
 const unauthorized=await readiness(new Request(base));
 assert.equal(unauthorized.status,401);
 assert.equal(fetches,0);
 const request=new Request(base,{headers:{Authorization:'Bearer '+SECRET}});
 const missing=await readiness(request);
 assert.equal(missing.status,200);
 let obj=await missing.json();
 assert.equal(obj.production_release,'PRIVATE_DASHBOARD_HOLD_UNTIL_VERIFICATION_AND_OWNER_AUTHORIZATION');
 assert.equal(obj.engine_release,'NO_GO_NOT_VERIFIED');
 assert.equal(obj.assessment,'configuration_inventory_not_release_authorization');
 assert.equal(obj.missing_configuration.length,3);
 assert.ok(obj.requirements.find(x=>x.code==='owner_secret').configured);
 assert.ok(obj.requirements.filter(x=>x.code!=='owner_secret').every(x=>!x.configured));
 assert.ok(obj.required_independent_verifications.every(x=>x.state==='not_verified_by_this_endpoint'));

 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-database-service-role-key';
 process.env.JRS_OWNER_EMAIL='owner-synthetic@example.test';
 process.env.NEON_AUTH_BASE_URL='https://synthetic-project.neon.tech/neondb/auth';
 const configured=await readiness(request);
 assert.equal(configured.status,200);
 obj=await configured.json();
 assert.deepEqual(obj.missing_configuration,[]);
 assert.ok(obj.requirements.every(x=>x.configured));
 assert.ok(obj.required_independent_verifications.every(x=>x.state==='not_verified_by_this_endpoint'));
 assert.equal(obj.production_release,'PRIVATE_DASHBOARD_HOLD_UNTIL_VERIFICATION_AND_OWNER_AUTHORIZATION');
 const data=JSON.stringify(obj);
 for(const value of [SECRET,'synthetic-database-service-role-key',
   'owner-synthetic@example.test','synthetic-project.neon.tech']){
   assert.ok(!data.includes(value),'sensitive configuration leaked');
 }
 assert.equal(fetches,0,'owner readiness cannot read private database');

 // A malformed upstream hostname cannot be treated as an approved identity provider.
 process.env.NEON_AUTH_BASE_URL='http://synthetic-project.neon.tech/neondb/auth';
 const gated=await readiness(request);
 assert.ok((await gated.json()).missing_configuration.includes('neon_auth_base'));
 process.env.NEON_AUTH_BASE_URL='https://synthetic-project.neon.tech/neondb/auth';

 const html=(await import('node:fs')).readFileSync(
   new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
 for(const fragment of ['id="owner-release-readiness"','id="release-readiness-config"',
  'id="release-readiness-verification"',"fetch('/api/owner-release-readiness'"]){
  assert.ok(html.includes(fragment),'missing private dashboard release readiness element');
 }
 assert.ok(!/\.\.\.\s*d\.requirements/.test(html),'do not expose runtime object as HTML');
 console.log('PASS owner readiness: no-token isolation, configuration disclosure bounds, unverified gate, release blocked, dashboard wiring');
}finally{
 globalThis.fetch=originalFetch;
 for(const [key,value] of Object.entries(before)){
  if(value===undefined)delete process.env[key];
  else process.env[key]=value;
 }
}
