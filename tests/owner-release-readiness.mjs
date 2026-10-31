import assert from 'node:assert/strict';
import readiness from '../api/owner-release-readiness.js';
import {createOwnerCookie} from '../api/_owner-auth.js';

const KEYS=[
 'OWNER_DASHBOARD_TOKEN','SUPABASE_SERVICE_ROLE_KEY',
 'TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY',
 'NOTIFY_TO','NOTIFY_FROM','RESEND_API_KEY','SENDGRID_API_KEY',
 'JRS_INQUIRY_ALERTS_ENABLED'
];
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
 const bearerOnly=await readiness(new Request(base,{headers:{Authorization:'Bearer '+SECRET}}));
 assert.equal(bearerOnly.status,401,'Persistent owner code cannot bypass signed cookie');
 const cookie=(await createOwnerCookie()).split(';')[0];
 const request=new Request(base,{headers:{Cookie:cookie}});
 const missing=await readiness(request);
 assert.equal(missing.status,200);
 let obj=await missing.json();
 assert.equal(obj.production_release,'BLOCKED_UNTIL_INDEPENDENT_VERIFICATION_AND_AUTHORIZATION');
 assert.equal(obj.engine_release,'NO_GO_NOT_VERIFIED');
 assert.equal(obj.assessment,'configuration_inventory_not_release_authorization');
 assert.equal(obj.missing_configuration.length,7);
 assert.ok(obj.requirements.find(x=>x.code==='owner_secret').configured);
 assert.ok(obj.requirements.filter(x=>x.code!=='owner_secret').every(x=>!x.configured));
 assert.ok(obj.required_independent_verifications.every(x=>x.state==='not_verified_by_this_endpoint'));

 process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-database-service-role-key';
 process.env.TURNSTILE_SITE_KEY='synthetic-public-widget-key';
 process.env.TURNSTILE_SECRET_KEY='synthetic-challenge-secret';
 process.env.NOTIFY_TO='owner-synthetic@example.com';
 process.env.NOTIFY_FROM='mailer-synthetic@example.com';
 process.env.RESEND_API_KEY='synthetic-resend-key';
 process.env.JRS_INQUIRY_ALERTS_ENABLED='true';
 const configured=await readiness(request);
 assert.equal(configured.status,200);
 obj=await configured.json();
 assert.deepEqual(obj.missing_configuration,[]);
 assert.ok(obj.requirements.every(x=>x.configured));
 assert.ok(obj.required_independent_verifications.every(x=>x.state==='not_verified_by_this_endpoint'));
 assert.equal(obj.production_release,'BLOCKED_UNTIL_INDEPENDENT_VERIFICATION_AND_AUTHORIZATION');
 const data=JSON.stringify(obj);
 for(const value of [SECRET,'synthetic-database-service-role-key',
   'synthetic-public-widget-key','synthetic-challenge-secret',
   'owner-synthetic@example.com','mailer-synthetic@example.com',
   'synthetic-resend-key']){
   assert.ok(!data.includes(value),'sensitive configuration leaked');
 }
 assert.equal(fetches,0,'owner readiness cannot read private database');

 // A superficially configured but unapproved notification switch is reported as missing.
 process.env.JRS_INQUIRY_ALERTS_ENABLED='false';
 const gated=await readiness(request);
 assert.ok((await gated.json()).missing_configuration.includes('notification_enabled'));

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
