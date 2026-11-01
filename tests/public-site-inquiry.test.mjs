import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const server=file('api/site-inquiry.js'),ui=file('contact.html'),privacy=file('privacy-notice.html'),cfg=file('api/site-inquiry-config.js');
const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(server).toString('base64'));
const valid={name:'JRS System Test',email:'test@example.org',organization:'Test-only',category:'method',
 message:'Synthetic general contact route test; no private records.',consent:true};
function req(data=valid,headers={},method='POST'){
 return new Request('https://www.jrsstandard.com/api/site-inquiry',{
  method,headers:{'origin':'https://www.jrsstandard.com','content-type':'application/json',...headers},
  body:method==='POST'?JSON.stringify(data):undefined
 });
}
test('form is true on-page send, with documented native Formspree fallback',()=>{
 assert.match(ui,/id="jrs-inquiry"/);assert.match(ui,/action="https:\/\/formspree\.io\/f\/mreddwdg"/);
 assert.match(ui,/method="POST"/);assert.match(ui,/Submit inquiry/);
 assert.doesNotMatch(ui,/Prepare email in my email app|Enterprise inquiry|value="commercial"/);
 for(const n of ['name','email','organization','category','message','consent'])assert.match(ui,new RegExp('name="'+n+'"'));
});
test('purpose and contact consent remain separate from pilot study and commercial sales',()=>{
 assert.match(ui,/form_type" value="jrs-general-professional-inquiry-2026-11-01"/);
 assert.match(ui,/Formspree and email notification/);
 assert.match(privacy,/Existing Formspree|existing third-party Formspree/);
 assert.match(privacy,/not entered into the JRS research participant ledger/);
});
test('configuration accurately identifies independent email provider',()=>{
 assert.match(cfg,/existing_formspree_relay/);
 assert.doesNotMatch(cfg,/TURNSTILE_SECRET_KEY|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});
test('rejects non-POST',async()=>{
 const r=await handler(req(valid,{},'GET'));assert.equal(r.status,405);
});
test('rejects missing or cross-site Origin',async()=>{
 for(const origin of ['https://attacker.invalid','']){
  const r=await handler(req(valid,{'origin':origin}));assert.equal(r.status,403);
 }
});
test('rejects invalid content type and bad JSON',async()=>{
 assert.equal((await handler(req(valid,{'content-type':'text/plain'}))).status,415);
 const b=new Request('https://www.jrsstandard.com/api/site-inquiry',{method:'POST',headers:{
  origin:'https://www.jrsstandard.com','content-type':'application/json'
 },body:'not json'});
 assert.equal((await handler(b)).status,400);
});
test('rejects absent consent and invalid categories or short messages',async()=>{
 for(const p of [{...valid,consent:false},{...valid,category:'commercial'},{...valid,message:'too short'},{...valid,email:'not-an-email'}]){
  const r=await handler(req(p));assert.equal(r.status,400);
 }
});
test('rejects honeypot submissions without calling upstream',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('unwanted')};
 try{const r=await handler(req({...valid,_gotcha:'bot'}));assert.equal(r.status,403);assert.equal(calls,0)}
 finally{globalThis.fetch=original}
});
test('acceptance forwards only allowlisted fields and returns no PII',async()=>{
 const original=globalThis.fetch;let forwarded=null;
 globalThis.fetch=async(url,opt)=>{forwarded={url,opt};return new Response(JSON.stringify({ok:true}),{status:200})};
 try{
  const r=await handler(req({...valid,attachment:'PRIVATE DOCUMENT',commercial_purpose:'asset-acquisition',_subject:'Injected'}));
  const out=await r.json();
  assert.equal(r.status,200);assert.equal(out.accepted,true);
  assert.equal(forwarded.url,'https://formspree.io/f/mreddwdg');
  assert.equal(forwarded.opt.method,'POST');
  const b=new URLSearchParams(forwarded.opt.body);
  assert.equal(b.get('source'),'public-jrs-professional-contact');
  assert.equal(b.get('form_type'),'jrs-general-professional-inquiry-2026-11-01');
  assert.equal(b.get('consent_to_transfer'),'false');
  assert.equal(b.get('attachment'),null);assert.equal(b.get('commercial_purpose'),null);
  assert.equal(b.get('_subject'),'JRS Public Inquiry: method');
  assert.ok(!JSON.stringify(out).includes('test@example.org'));
 }finally{globalThis.fetch=original}
});
test('upstream refusal is not an accepted receipt',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('blocked',{status:403});
 try{const r=await handler(req());assert.equal(r.status,502);assert.equal((await r.json()).error,'delivery_not_confirmed')}
 finally{globalThis.fetch=original}
});
test('network exception is not an accepted receipt',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('timeout')};
 try{const r=await handler(req());assert.equal(r.status,502);assert.equal((await r.json()).error,'delivery_not_confirmed')}
 finally{globalThis.fetch=original}
});
test('no Supabase service-role or credential dependency in route',()=>{
 assert.doesNotMatch(server,/SUPABASE_SERVICE_ROLE_KEY|POSTGRES_URL|RESEND_API_KEY|SENDGRID_API_KEY|TURNSTILE_SECRET_KEY/);
 assert.match(server,/Formspree, not independently proof of Gmail mailbox receipt/);
});
