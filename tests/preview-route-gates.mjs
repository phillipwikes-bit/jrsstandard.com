import assert from 'node:assert/strict';
import identity from '../api/deployment-identity.js';
import {checkPreview, PRIVATE_PATHS, validatedPreviewOrigin} from '../scripts/preview-route-gates.mjs';

const SHA='a'.repeat(40);
const ORIGIN='https://jrs-checked-preview.vercel.app';
const originalEnv={VERCEL_ENV:process.env.VERCEL_ENV,VERCEL_GIT_COMMIT_SHA:process.env.VERCEL_GIT_COMMIT_SHA};
function response(body,status=200,type='application/json',cache='no-store') {
  return new Response(typeof body==='string'?body:JSON.stringify(body),{
    status,headers:{'Content-Type':type,'Cache-Control':cache}
  });
}
function mockFetch({sha=SHA,privateStatus=503,leakPath=null,overrideStatus=null,configEnabled=false,
  wrongChannel=false,cache='no-store'}={}) {
  const seen=[];
  const fetchImpl=async(url,options)=>{
    const path=new URL(url).pathname;
    seen.push({path,options});
    assert.equal(options.redirect,'manual');
    assert.equal(options.method,'GET');
    assert.equal(options.cache,'no-store');
    if(path==='/api/deployment-identity')return response({
      channel:wrongChannel?'production':'preview',commit_sha:sha,
      assessment:'source_identity_only_not_release_authorization',
      engine_release:'NO_GO_NOT_VERIFIED'
    },200,'application/json',cache);
    if(path==='/contact.html'||path==='/enterprise.html')return response('<html>public</html>',200,'text/html');
    if(path==='/api/site-inquiry-config')return response({enabled:configEnabled,site_key:null});
    if(PRIVATE_PATHS.some(x=>new URL(x,ORIGIN).pathname===path)) {
      const status=path===leakPath?(overrideStatus??200):privateStatus;
      return {
        status,
        // A critical invariant: the probe must never inspect private content.
        json:()=>{throw Error('PRIVATE RESPONSE BODY READ')},
        text:()=>{throw Error('PRIVATE RESPONSE BODY READ')}
      };
    }
    throw Error('unexpected URL '+path);
  };
  return {fetchImpl,seen};
}
try{
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  let res=await identity(new Request(ORIGIN+'/api/deployment-identity'));
  assert.equal(res.status,503);
  assert.equal((await res.json()).error,'preview_build_identity_unavailable');
  process.env.VERCEL_ENV='production';
  process.env.VERCEL_GIT_COMMIT_SHA=SHA;
  assert.equal((await identity(new Request(ORIGIN+'/api/deployment-identity'))).status,503);
  process.env.VERCEL_ENV='preview';
  process.env.VERCEL_GIT_COMMIT_SHA='invalid-sha';
  assert.equal((await identity(new Request(ORIGIN+'/api/deployment-identity'))).status,503);
  process.env.VERCEL_GIT_COMMIT_SHA=SHA;
  res=await identity(new Request(ORIGIN+'/api/deployment-identity'));
  assert.equal(res.status,200);
  const obj=await res.json();
  assert.equal(obj.commit_sha,SHA);
  assert.equal(obj.channel,'preview');
  assert.equal(obj.engine_release,'NO_GO_NOT_VERIFIED');
  assert.equal(res.headers.get('Cache-Control').includes('no-store'),true);
  assert.equal((await identity(new Request(ORIGIN+'/api/deployment-identity',{method:'POST'}))).status,405);

  for(const origin of [
    'http://jrs-checked-preview.vercel.app',
    'https://www.jrsstandard.com/',
    'https://user:pass@jrs-checked-preview.vercel.app/',
    'https://jrs-checked-preview.vercel.app/foo',
    'https://jrs-checked-preview.vercel.app/?r=1',
    'https://jrs-checked-preview.vercel.app.evil.org/',
    'https://127.0.0.1/'
  ]) assert.throws(()=>validatedPreviewOrigin(origin));
  assert.equal(validatedPreviewOrigin(ORIGIN+'/'),ORIGIN);

  const all=mockFetch();
  const result=await checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,fetchImpl:all.fetchImpl});
  assert.equal(result.verified_commit,SHA);
  assert.equal(result.private_routes_checked,PRIVATE_PATHS.length);
  assert.equal(result.private_outcomes.unconfigured,PRIVATE_PATHS.length);
  assert.equal(result.decision,'ROUTE_PROBES_PASSED_ONLY_PRODUCTION_RELEASE_BLOCKED');
  assert.equal(all.seen.length,PRIVATE_PATHS.length+4);
  assert.ok(all.seen.every(x=>x.options.redirect==='manual'));

  const denied=await checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,fetchImpl:mockFetch({
    privateStatus:401,configEnabled:true
  }).fetchImpl});
  assert.equal(denied.private_outcomes.unauthorized,PRIVATE_PATHS.length);
  assert.equal(denied.inquiry_configuration_present,true);
  // Configured challenge is only a flag; independent verification stays pending.
  assert.ok(denied.unverified.includes('actual_turnstile_submission'));

  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,
    fetchImpl:mockFetch({sha:'b'.repeat(40)}).fetchImpl}),/preview_commit_or_identity_mismatch/);
  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,
    fetchImpl:mockFetch({wrongChannel:true}).fetchImpl}),/preview_commit_or_identity_mismatch/);
  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,
    fetchImpl:mockFetch({cache:'public, max-age=1000'}).fetchImpl}),/preview_build_identity_cacheable/);
  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,
    fetchImpl:mockFetch({leakPath:'/programme-status-9872fb93cc94.html'}).fetchImpl}),/private_route_not_proven_closed/);
  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:SHA,
    fetchImpl:mockFetch({leakPath:'/api/people-9dd1ecdf6f8cdfd4',overrideStatus:307}).fetchImpl}),/private_route_not_proven_closed/);
  await assert.rejects(checkPreview({baseUrl:ORIGIN+'/',expectedSha:'short',
    fetchImpl:mockFetch().fetchImpl}),/expected_sha_invalid/);

  console.log('PASS preview acceptance: exact source SHA, 16 anonymous private routes, fail closed on public leak, redirects, cache and missing build identity');
}finally{
  for(const [key,value] of Object.entries(originalEnv)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
