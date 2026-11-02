// Synthetic owner inbox integration checks. No real identities, API key or emails.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../api/owner-formspree-inbox.js';
const oldEnv=Object.fromEntries(['OWNER_DASHBOARD_TOKEN','FORMSPREE_READ_API_KEY']
  .map(k=>[k,process.env[k]]));
const oldFetch=globalThis.fetch;
const secret='synthetic-owner-secret-for-formspree-tests-0123456789abcd';
const req=(bearer,method='GET')=>new Request('https://www.jrsstandard.com/api/owner-formspree-inbox',{
  method,headers:bearer?{authorization:'Bearer '+bearer}:{}
});
let calls=[],passes=0;
async function pass(label,fn){await fn();passes++;console.log('PASS '+label);}
try{
  delete process.env.OWNER_DASHBOARD_TOKEN;delete process.env.FORMSPREE_READ_API_KEY;
  globalThis.fetch=async()=>{throw Error('should not fetch');};
  await pass('no owner secret fails closed',async()=>{
    assert.equal((await handler(req())).status,503);
  });
  process.env.OWNER_DASHBOARD_TOKEN=secret;
  await pass('anonymous access cannot read any contact data',async()=>{
    assert.equal((await handler(req())).status,401);
    assert.equal((await handler(req('not-the-secret'))).status,401);
  });
  await pass('missing Formspree key never reports zero contact records',async()=>{
    const r=await handler(req(secret));assert.equal(r.status,503);
    const d=await r.json();assert.equal(d.complete,false);
    assert.ok(!('total' in d));assert.ok(!('rows' in d));
  });
  await pass('nonread methods cannot receive contact records',async()=>{
    assert.equal((await handler(req(secret,'POST'))).status,405);
  });
  process.env.FORMSPREE_READ_API_KEY='synthetic-formspree-readonly-key-not-real';
  const first=Array.from({length:100},(_,i)=>({name:'Fixture '+i,email:'synthetic'+i+'@example.test',
    message:'Synthetic inquiry '+i,category:'general',consent_to_contact:'true',
    _date:'2026-11-02T08:00:00Z'}));
  // The public form has two legitimate delivery paths: AJAX posts an explicit
  // consent_to_contact field, while no-JS Formspree posts consent=on.
  first[0].consent_to_transfer='true'; // Injected field cannot create transfer permission.
  first[3].consent_to_transfer=true; // Boolean variant is equally unsupported.
  delete first[1].consent_to_contact;
  Object.assign(first[1],{
    consent:'on',source:'public-jrs-professional-contact',
    form_type:'jrs-general-professional-inquiry-2026-11-01'
  });
  delete first[2].consent_to_contact;
  first[2].consent='on'; // Unknown source cannot borrow public-form permission.
  calls=[];
  globalThis.fetch=async(url,opt)=>{
    calls.push({url:String(url),auth:opt.headers.Authorization,redirect:opt.redirect,method:opt.method});
    return Response.json({fields:['name','email','message'],submissions:calls.length===1?first:[
      {name:'Last Fixture',email:'last@example.test',message:'Synthetic additional record',
       category:'research',consent_to_contact:'false'}
    ]});
  };
  await pass('read-only credential and full pagination preserve source rows',async()=>{
    const r=await handler(req(secret));assert.equal(r.status,200);
    const d=await r.json();assert.equal(d.complete,true);
    assert.equal(d.total,101);assert.equal(d.rows.length,101);
    assert.equal(d.rows[100].contact_permission,'recorded-no');
    assert.equal(d.rows[0].contact_permission,'recorded-yes');
    assert.equal(d.rows[0].transfer_permission,'not-recorded');
    assert.equal(d.rows[3].transfer_permission,'not-recorded');
    assert.equal(d.source_scope,'formspree_nonspam_submissions');
    assert.match(d.coverage,/spam items are not included/);
    assert.match(d.coverage,/no publication, marketing, research enrollment or transfer permission/);
    assert.equal(d.rows[1].contact_permission,'recorded-yes');
    assert.equal(d.rows[1].transfer_permission,'not-recorded');
    assert.equal(d.rows[2].contact_permission,'not-recorded');
    assert.equal(d.rows[0].publication_permission,'not-recorded');
    assert.equal(calls.length,2);
    assert.ok(calls[0].url.includes('formspree.io/api/0/forms/mreddwdg/submissions'));
    assert.ok(calls[1].url.includes('offset=100'));
    assert.ok(calls.every(x=>x.url.includes('spam=false')));
    assert.ok(calls.every(x=>x.redirect==='manual'&&x.method==='GET'));
    assert.ok(calls.every(x=>x.auth==='Bearer synthetic-formspree-readonly-key-not-real'));
    assert.ok(!JSON.stringify(d).includes('synthetic-formspree-readonly-key-not-real'));
    assert.equal(r.headers.get('access-control-allow-origin'),null);
    assert.match(r.headers.get('cache-control'),/no-store/);
  });
  calls=[];
  globalThis.fetch=async(url,opt)=>{
    calls.push(url);
    return calls.length===1?Response.json({submissions:first})
      :new Response('upstream outage',{status:503});
  };
  await pass('partial dataset never appears as a complete inbox',async()=>{
    const r=await handler(req(secret));assert.equal(r.status,502);
    const d=await r.json();assert.equal(d.complete,false);
    assert.ok(!('rows' in d));
  });
  const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
  await pass('private page distinguishes Formspree from historical Supabase',async()=>{
    assert.ok(html.includes('id="current-formspree-inquiries"'));
    assert.ok(html.includes("fetch('/api/owner-formspree-inbox'"));
    assert.ok(html.includes('Formspree and the designated email inbox'));
    // Formspree subject lines can be customized, including source verification
    // messages. Subject-only Gmail filters silently omit valid notifications.
    assert.ok(html.includes('from%3Aformspree.io+after%3A2026%2F10%2F29'));
    assert.ok(!html.includes('from%3Aformspree.io+subject%3A%22JRS+Public+Inquiry%22'));
    assert.ok(html.includes('historical Supabase participant register'));
    assert.ok(html.includes('jrs-current-formspree-private-inquiries.csv'));
    assert.ok(html.includes("s.trimStart()"));
    assert.ok(html.includes("window.confirm('Export '"));
  });
  console.log('PASS '+passes+' private Formspree inquiry source tests');
}finally{
  globalThis.fetch=oldFetch;
  for(const [k,v] of Object.entries(oldEnv)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
}
