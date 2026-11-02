// Synthetic regression tests for private owner email-code delivery diagnostics.
// No external calls, real recipient, one-time codes, or sensitive configuration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = new URL('../api/owner-email-login.js', import.meta.url);
const source = readFileSync(path, 'utf8');
const stubbed = source.replace(
  "import { createOwnerCookie } from './_owner-auth.js';",
  "const createOwnerCookie = async () => '__Host-jrs-owner=synthetic-test-cookie';"
);
assert.notEqual(stubbed, source, 'expected owner cookie dependency');
const { default: handler } = await import(
  'data:text/javascript;base64,' + Buffer.from(stubbed).toString('base64')
);

const KEYS=['JRS_OWNER_EMAIL','OWNER_DASHBOARD_TOKEN','NEON_AUTH_BASE_URL'];
const previous=Object.fromEntries(KEYS.map(key=>[key,process.env[key]]));
const originalFetch=globalThis.fetch;
const originalError=console.error;
const logs=[];
let upstreamCalls=0;
const email='owner-private-synthetic@example.test';
const secret='synthetic-owner-secret-012345678901234567890123456789';
const origin='https://private-preview.example.test';
const url=origin+'/api/owner-email-login';
function request(action='send',requestOrigin=origin) {
  return new Request(url,{method:'POST',headers:{
    origin:requestOrigin,'content-type':'application/json','sec-fetch-site':'same-origin'
  },body:JSON.stringify({action})});
}
try {
  process.env.JRS_OWNER_EMAIL=email;
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  process.env.NEON_AUTH_BASE_URL='https://synthetic.neon.tech/neondb/auth';
  console.error=(...parts)=>logs.push(parts.join(' '));
  globalThis.fetch=async()=>{
    upstreamCalls++;
    return Response.json({code:'ORIGIN_NOT_TRUSTED',message:'do not log '+email},
      {status:403});
  };
  let response=await handler(new Request(url));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ready:true,mode:'email_code',code_length:6});
  assert.equal(upstreamCalls,0,'availability GET is a config check, not an email send');

  response=await handler(request('send','https://other.example.test'));
  assert.equal(response.status,403);
  assert.equal(upstreamCalls,0,'cross-origin requests must not reach provider');

  response=await handler(request());
  assert.equal(response.status,502);
  assert.deepEqual(await response.json(),{error:'email_code_provider_unavailable'});
  assert.equal(upstreamCalls,1);
  const entry=logs.join(' ');
  assert.match(entry,/jrs_owner_email_provider_failure/);
  assert.match(entry,/"phase":"send"/);
  assert.match(entry,/"status":403/);
  assert.match(entry,/ORIGIN_NOT_TRUSTED/);
  assert.ok(!entry.includes(email)&&!entry.includes(secret)&&!entry.includes('do not log'),
    'provider diagnostics must not reveal recipient, token or raw provider message');

  logs.length=0;
  globalThis.fetch=async()=>Response.json({code:'TOO_MANY_REQUESTS'},{status:429});
  response=await handler(request());
  assert.equal(response.status,429);
  assert.deepEqual(await response.json(),{error:'rate_limited'});

  logs.length=0;
  globalThis.fetch=async()=>{throw new DOMException('private transport failure','AbortError');};
  response=await handler(request());
  assert.equal(response.status,502);
  assert.deepEqual(await response.json(),{error:'email_code_service_unavailable'});
  assert.match(logs.join(' '),/"kind":"timeout"/);
  assert.ok(!logs.join(' ').includes('private transport failure'));

  console.log('PASS owner Neon OTP: safe diagnostic status, no PII, same-origin, retry and timeout');
} finally {
  globalThis.fetch=originalFetch;
  console.error=originalError;
  for(const [key,value] of Object.entries(previous)) {
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
