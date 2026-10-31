import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import endpoint from '../api/enterprise-inquiry.js';

const envKeys=['SUPABASE_SERVICE_ROLE_KEY','TURNSTILE_SITE_KEY','TURNSTILE_SECRET_KEY',
  'JRS_TURNSTILE_HOSTNAME','JRS_INQUIRY_ALERTS_ENABLED',
  'RESEND_API_KEY','SENDGRID_API_KEY','NOTIFY_TO','NOTIFY_FROM'];
const oldEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));
const oldFetch=globalThis.fetch;
const route='https://www.jrsstandard.com/api/enterprise-inquiry';
const good={
  name:'Synthetic Buyer Question',email:'synthetic@example.test',
  organization:'Synthetic Company',role:'Compliance reviewer',
  interest:'acquisition',scale:'unknown',timeline:'exploratory',
  platform:'',note:'A synthetic scope question, without any real case material.',
  consent:true,company_website:'',turnstileToken:'synthetic-challenge'
};
function req(body=good, origin='https://www.jrsstandard.com'){
  return new Request(route,{method:'POST',headers:{
    Origin:origin,'Content-Type':'application/json'
  },body:JSON.stringify(body)});
}
let calls=[],passes=0;
async function check(label,work){await work();passes++;console.log('PASS '+label)}
try{
  for(const key of envKeys)delete process.env[key];
  globalThis.fetch=async()=>{calls.push('unexpected');throw Error('No external request expected')};
  await check('disallow GET, OPTIONS and wildcard CORS',async()=>{
    for(const method of ['GET','OPTIONS']){
      const r=await endpoint(new Request(route,{method}));
      assert.equal(r.status,405);
      assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
    }
  });
  await check('reject cross-origin before storage',async()=>{
    assert.equal((await endpoint(req(good,'https://unrelated.example'))).status,403);
    assert.equal(calls.length,0);
  });
  await check('require JSON content type',async()=>{
    const r=await endpoint(new Request(route,{
      method:'POST',headers:{origin:'https://www.jrsstandard.com','content-type':'text/plain'},
      body:'test'
    }));assert.equal(r.status,415);
  });
  await check('fail closed on missing challenge configuration',async()=>{
    assert.equal((await endpoint(req())).status,503);
    assert.equal(calls.length,0);
  });
  process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-db-service';
  process.env.TURNSTILE_SECRET_KEY='synthetic-captcha-secret';
  process.env.TURNSTILE_SITE_KEY='synthetic-sitekey';
  await check('refuse absent consent, bad interest and malformed email',async()=>{
    for(const change of [
      {consent:false},{interest:'unknown-intent'},{email:'no-mail'},
      {name:'X'},{organization:''},{turnstileToken:''}
    ]){
      const r=await endpoint(req({...good,...change}));
      assert.equal(r.status,400);
    }
    assert.equal(calls.length,0);
  });
  await check('refuse malformed and oversized body',async()=>{
    const bad=await endpoint(new Request(route,{method:'POST',headers:{
      origin:'https://www.jrsstandard.com','content-type':'application/json'
    },body:'{invalid'}));
    assert.equal(bad.status,400);
    const long=await endpoint(req({...good,note:'a'.repeat(8500)}));
    assert.equal(long.status,413);
  });
  await check('honeypot is not stored',async()=>{
    const r=await endpoint(req({...good,company_website:'somewhere'}));
    assert.equal(r.status,200);assert.equal((await r.json()).stored,false);
    assert.equal(calls.length,0);
  });
  globalThis.fetch=async(url,options)=>{
    calls.push({url:String(url),options});
    if(String(url).includes('siteverify'))
      return Response.json({success:false,hostname:'www.jrsstandard.com'});
    throw Error('storage called after rejected challenge');
  };
  await check('rejected challenge blocks storage',async()=>{
    calls=[];
    const r=await endpoint(req());
    assert.equal(r.status,403);
    assert.equal(calls.length,1);
  });
  globalThis.fetch=async(url,options)=>{
    calls.push({url:String(url),options});
    if(String(url).includes('siteverify'))
      return Response.json({success:true,hostname:'different.example'});
    throw Error('storage called after host mismatch');
  };
  await check('verified but wrong host blocks storage',async()=>{
    calls=[];
    const r=await endpoint(req());
    assert.equal(r.status,403);assert.equal(calls.length,1);
  });
  globalThis.fetch=async(url,options)=>{
    calls.push({url:String(url),options});
    if(String(url).includes('siteverify'))
      return Response.json({success:true,hostname:'www.jrsstandard.com'});
    if(String(url).includes('/pilot_contacts'))return new Response(null,{status:201});
    throw Error('Unrecognized upstream');
  };
  await check('persist only a consent-limited legacy contact row after challenge',async()=>{
    calls=[];
    const r=await endpoint(req());
    const body=await r.json();
    assert.equal(r.status,200);assert.equal(body.stored,true);assert.equal(body.ok,true);
    assert.equal(body.alerted,false);
    assert.equal(calls.length,2);
    assert.ok(calls[0].url.includes('siteverify'));
    assert.ok(calls[1].url.includes('/pilot_contacts'));
    const stored=JSON.parse(calls[1].options.body);
    assert.equal(stored.source,'enterprise-inquiry');
    assert.equal(stored.email,'synthetic@example.test');
    const p=JSON.parse(stored.message);
    assert.equal(p.interest,'acquisition');
    assert.equal(p.consent_version,'enterprise-contact-v1-2026-10-30');
    assert.equal(p.consent_to_contact,true);
    assert.equal(p.consent_to_transfer,false);
    assert.equal(p.software_access_requested,false);
    assert.ok(!calls[1].options.body.includes('synthetic-challenge'));
    assert.ok(!calls[1].options.body.includes('synthetic-captcha-secret'));
    assert.equal(JSON.stringify(body).includes('synthetic@example.test'),false);
    assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
  });
  globalThis.fetch=async(url,options)=>{
    calls.push({url:String(url),options});
    if(String(url).includes('siteverify'))
      return Response.json({success:true,hostname:'www.jrsstandard.com'});
    if(String(url).includes('/pilot_contacts'))
      return new Response('private contact name from database error',{status:503});
    throw Error('Unexpected request');
  };
  await check('database failure cannot report success or leak error text',async()=>{
    calls=[];
    const r=await endpoint(req());
    assert.equal(r.status,502);
    const body=await r.text();
    assert.ok(!body.includes('private contact'));
    assert.equal(JSON.parse(body).error,'storage_unavailable');
    assert.equal(calls.length,2);
  });
  await check('enterprise form provides disabled-until-verified challenge, consent and mail fallback',async()=>{
    const html=readFileSync(new URL('../enterprise.html',import.meta.url),'utf8');
    assert.ok(html.includes('id="ei-captcha"'));
    assert.ok(html.includes('name="consent"'));
    assert.ok(html.includes('id="ei-b" disabled'));
    assert.ok(html.includes("fetch('/api/site-inquiry-config'"));
    assert.ok(html.includes("fetch('/api/enterprise-inquiry'"));
    assert.ok(html.includes('window.turnstile.render'));
    assert.ok(html.includes('info@jrsstandard.com'));
    const chunks=[...html.matchAll(/<script(?: [^>]*)?>([\\s\\S]*?)<\\/script>/g)];
    assert.ok(chunks.length>0);
    chunks.forEach(m=>new Function(m[1])); // parser-only: no DOM/network execution
  });
  console.log('PASS '+passes+' legacy enterprise inquiry gating checks');
}finally{
  globalThis.fetch=oldFetch;
  for(const [key,value] of Object.entries(oldEnv)){
    if(value===undefined)delete process.env[key];else process.env[key]=value;
  }
}
