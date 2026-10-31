import assert from 'node:assert/strict';
import proxy from '../proxy.js';
import { createOwnerCookie } from '../api/_owner-auth.js';
import { readFileSync } from 'node:fs';

const home='https://www.jrsstandard.com/programme-status-9872fb93cc94.html';
const legacy='https://www.jrsstandard.com/programme--9872fb93cc94.html';
const secret='synthetic-private-owner-secret-0123456789-across-tests-only';
const old=process.env.OWNER_DASHBOARD_TOKEN;
let pass=0;
async function check(label,fn){await fn();console.log('PASS '+label);pass++;}
try{
  delete process.env.OWNER_DASHBOARD_TOKEN;
  await check('no configured owner secret blocks static HTML before response',async()=>{
    const result=await proxy(new Request(home));
    assert.equal(result.status,503);
    assert.ok(!(await result.text()).includes('<html'));
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await check('anonymous browser cannot receive owner HTML',async()=>{
    const result=await proxy(new Request(home));
    assert.equal(result.status,302);
    assert.equal(result.headers.get('location'),'/owner-login.html');
    assert.equal(result.headers.get('cache-control'),'private, no-store');
  });
  await check('legacy owner URL is authenticated before static HTML',async()=>{
    const result=await proxy(new Request(legacy));
    assert.equal(result.status,302);
    assert.equal(result.headers.get('location'),'/owner-login.html');
    assert.equal(result.headers.get('cache-control'),'private, no-store');
  });
  await check('legacy URL denies HEAD before static HTML',async()=>{
    const result=await proxy(new Request(legacy,{method:'HEAD'}));
    assert.equal(result.status,302);
  });
  await check('legacy URL denies POST before static HTML',async()=>{
    const result=await proxy(new Request(legacy,{method:'POST'}));
    assert.equal(result.status,405);
  });
  await check('HEAD also requires a session',async()=>{
    const result=await proxy(new Request(home,{method:'HEAD'}));
    assert.equal(result.status,302);
  });
  await check('nonread methods are blocked',async()=>{
    const result=await proxy(new Request(home,{method:'POST'}));
    assert.equal(result.status,405);
  });
  await check('forged owner cookie denied before static HTML',async()=>{
    const r=await proxy(new Request(home,{headers:{Cookie:'__Host-jrs-owner=forged-cookie'}}));
    assert.equal(r.status,302);
  });
  await check('owner signature cannot be issued with no secret',async()=>{
    delete process.env.OWNER_DASHBOARD_TOKEN;
    await assert.rejects(createOwnerCookie());
    process.env.OWNER_DASHBOARD_TOKEN=secret;
  });
  await check('route config and dependency are pinned to private page',async()=>{
    const j=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
    assert.equal(j.proxy.entrypoint,'proxy.js');
    assert.deepEqual(j.proxy.matcher,[
      '/programme-status-9872fb93cc94.html','/programme--9872fb93cc94.html',
      '/api/access-stats','/api/enroll-stats','/api/orgpilot-stats',
      '/api/gate-stats','/api/geo-stats','/api/asset-stats'
    ]);
    const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
    assert.equal(pkg.dependencies['@vercel/functions'],'3.10.4');
    assert.equal(pkg.type,'module');
  });
  console.log('PASS '+pass+' private owner routing checks');
}finally{
  if(old===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
  else process.env.OWNER_DASHBOARD_TOKEN=old;
}
