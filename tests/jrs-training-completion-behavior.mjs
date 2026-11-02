// Behavioral regression for the free-training / optional-completion boundary.
// Exercises the actual production function with in-memory storage and network.
// No network request is made by this test; it does not certify deployed privacy.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../training.html',import.meta.url),'utf8');

assert.match(source, /id="enroll-overlay" role="dialog" aria-modal="true" aria-labelledby="en-dialog-title"/,
  'Named training enrollment must be a modal dialog for assistive technologies');
assert.match(source, /id="en-dialog-description"/,
  'The optional enrollment purpose must be explained on the dialog');
assert.match(source, /id="en-msg" role="status" aria-live="polite"/,
  'Enrollment feedback must be announced without moving focus');
assert.match(source, /id="en-close" class="jrs-enroll-close"/,
  'Registration must provide a visible, keyboard-operated Close control');
assert.match(source, /jrsSetEnrollmentInert\(true\)/,
  'Background must be excluded from keyboard navigation while modal is open');
assert.match(source, /jrsSetEnrollmentInert\(false\)/,
  'Background focusability must be restored after the modal closes');
assert.match(source, /jrsEnrollReturnFocus = document.activeElement/,
  'Dialog must remember its initiating control');
assert.match(source, /e.key === 'Escape'[\s\S]*dismissEnroll\(\)/,
  'Escape must dismiss enrollment without requiring consent');
assert.match(source, /e.shiftKey[\s\S]*last.focus\(\)/,
  'Shift+Tab must wrap focus inside the dialog');
assert.match(source, /document.body.classList.remove\('jrs-training-dialog-open'\)/,
  'Closing enrollment must restore body scrolling');
assert.match(source, /Enrollment not confirmed/,
  'Registration must check service acceptance, not HTTP status alone');
assert.ok(!source.includes('consent to project updates. Free for practitioners.'),
  'Registration must not imply unrelated project-update consent');

// Public enrollment endpoints must not expose credential state or database
// diagnostics in a response. This is a structural check, not a live POST.
const enrollmentEndpoint=readFileSync(new URL('../api/enroll.js',import.meta.url),'utf8');
const completionEndpoint=readFileSync(new URL('../api/complete.js',import.meta.url),'utf8');
assert.doesNotMatch(enrollmentEndpoint, /serviceKey\s*:/, 'Do not disclose service-key configuration');
for(const endpoint of [enrollmentEndpoint,completionEndpoint]){
  assert.doesNotMatch(endpoint, /detail\s*:\s*String\(/,
    'Do not return internal database errors to clients');
  assert.match(endpoint, /error:'service_unavailable'/,
    'Database errors must be returned as generic unavailable responses');
}
assert.match(enrollmentEndpoint, /consent_required/,
  'Enrollment must require explicit consent');

const start=source.indexOf('var jrsCompletionPending = false;');
const end=source.indexOf('function jrsSanitizeCheck(text)',start);
assert.ok(start>=0&&end>start,'Cannot locate the production completion function');
const productionFunction=source.slice(start,end);
assert.ok(!productionFunction.includes('window.prompt'),'Free training must never prompt for an email');
assert.equal((source.match(/recordCompletion\(\);/g)||[]).length,4,
  'Completion triggers should remain on module finish, local PNG, restore and successful enrollment');

function setup({done=6,enrolled=false,email='reader@example.org',responses=[]}={}){
 const store=new Map();
 if(enrolled)store.set('jrs-training-enrolled','1');
 if(email)store.set('jrs-training-email',email);
 const calls=[];
 const context={
  jrsModulesDone:()=>done,
  localStorage:{
   getItem:k=>store.has(k)?store.get(k):null,
   setItem:(k,v)=>store.set(k,String(v))
  },
  fetch:(url,options)=>{
   calls.push({url,options});
   const r=responses.shift()??{ok:true,body:{ok:true}};
   return Promise.resolve({ok:r.ok,json:async()=>r.body});
  }
 };
 vm.runInNewContext(productionFunction,context,{timeout:1000});
 return {store,calls,context};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

{
 const x=setup({enrolled:false,email:''});
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,0,'Unregistered completion cannot trigger an email request');
 assert.equal(x.store.get('jrs-training-completed-sent'),undefined);
}
{
 const x=setup({enrolled:false});
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,0,'Stored email alone does not establish consented enrollment');
}
{
 const x=setup({enrolled:true,done:5});
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,0,'Incomplete training cannot generate a completion event');
}
{
 const x=setup({enrolled:true,responses:[{ok:false,body:{error:'unavailable'}},{ok:true,body:{ok:true}}]});
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,1);
 assert.equal(x.store.has('jrs-training-completed-sent'),false,'Non-2xx HTTP response cannot be recorded as sent');
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,2,'Failed transport must remain retryable');
 assert.equal(x.store.get('jrs-training-completed-sent'),'1','Confirmed successful retry must be recorded');
 assert.equal(x.calls[0].url,'/api/complete');
 assert.equal(JSON.parse(x.calls[0].options.body).email,'reader@example.org');
 assert.deepEqual(Object.keys(JSON.parse(x.calls[0].options.body)),['email'],
  'Completion request must not collect additional records');
 x.context.recordCompletion();
 await flush();
 assert.equal(x.calls.length,2,'Confirmed completion must not be repeated');
}
{
 const x=setup({enrolled:true,responses:[{ok:true,body:{ok:false}},{ok:true,body:{ok:true}}]});
 x.context.recordCompletion();
 await flush();
 assert.equal(x.store.has('jrs-training-completed-sent'),false,
  'Successful HTTP status without acceptance cannot be recorded as sent');
 x.context.recordCompletion();
 await flush();
 assert.equal(x.store.get('jrs-training-completed-sent'),'1');
}
{
 const x=setup({enrolled:true});
 let release;
 x.context.fetch=(url,options)=>{
  x.calls.push({url,options});
  return new Promise(resolve=>{release=resolve});
 };
 x.context.recordCompletion();
 x.context.recordCompletion();
 assert.equal(x.calls.length,1,'Repeated completion triggers must not produce concurrent duplicate writes');
 release({ok:true,json:async()=>({ok:true})});
 await flush();
 assert.equal(x.store.get('jrs-training-completed-sent'),'1');
}
console.log('PASS: free modules do not solicit email; enrollment gate, HTTP/body receipts, retries, deduplication and single-field payload are enforced.');


// Historical reviewer receipt must validate against a private issuer record.
// No live Supabase traffic is made, no personal data is created or modified.
{
 const receiptSource=readFileSync(new URL('../api/reviewer-cert.js',import.meta.url),'utf8');
 const completionSource=readFileSync(new URL('../reviewer/completion.html',import.meta.url),'utf8');
 assert.match(receiptSource, /'Referrer-Policy': 'no-referrer'/,
  'Historical receipts must not disclose code/name through downstream referrers');
 assert.match(receiptSource, /'Cache-Control': 'private, no-store'/,
  'Issuer receipts must not be stored in shared or browser caches');
 assert.match(receiptSource, /'X-Robots-Tag': 'noindex, nofollow'/,
  'Historic named receipts must not be indexed');
 assert.match(receiptSource, /'X-Content-Type-Options': 'nosniff'/,
  'Receipt content must use its declared HTML content type');
 assert.match(receiptSource,/source=eq\.reviewer-cert/,'Only historical issuer rows may attest a receipt');
 assert.match(receiptSource,/sameName\(name,recordName\)/,'Issuer name must be checked');
 assert.doesNotMatch(completionSource,/Certificate issued to/,'The browser must not issue a credential');
 assert.doesNotMatch(completionSource,/Six modules complete and the reviewer evaluation submitted/,'Do not overclaim training');
 assert.doesNotMatch(completionSource,/linkedin\.com\/profile\/add/,'Do not promote a self-issued professional credential');
 assert.match(completionSource,/method="post"/,'Receipt lookup must not put new names and codes in URLs');
 assert.doesNotMatch(completionSource,/googletagmanager\.com\/gtag/,'Personal receipt route must not load analytics before clearing legacy query data');

 const priorFetch=globalThis.fetch;
 const hadService=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const priorService=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const handler=(await import('../api/reviewer-cert.js')).default;
 const code='JRS-R-AB23CD45';
 let rows=[{name:'Alex Reviewer',created_at:'2026-08-17T12:30:00Z',
   message:JSON.stringify({kind:'reviewer-cert',completion_code:code,
     printed_name:'Alex Reviewer',printed_title:'Compliance Analyst'})}];
 let requests=[];
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   requests.push({url:String(url),method:options.method||'GET'});
   return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
 };
 const run=async(args)=>handler(new Request('https://jrsstandard.com/api/reviewer-cert?'+new URLSearchParams(args)));
 const post=async(args)=>handler(new Request('https://jrsstandard.com/api/reviewer-cert?src=verify',{
   method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams(args)
 }));
 try {
   let res=await run({code,name:'Alex Reviewer',title:'Invented Chief Executive',src:'verify'});
   assert.equal(res.status,200,'Verified historical record may be rendered');
   const verified=await res.text();
   assert.match(verified,/Reviewer evaluation receipt/);
   assert.match(verified,/Alex Reviewer/);
   assert.match(verified,/Compliance Analyst/);
   assert.match(verified,/August 17, 2026/,'Issue date must derive from issuer record');
   assert.doesNotMatch(verified,/Invented Chief Executive/,'Caller title is not evidence');
   assert.ok(requests.every(r=>r.method==='GET'),'Read-only verification must not mutate participant data');
   res=await post({code,name:'Alex Reviewer',title:'Forged Title'});
   assert.equal(res.status,200,'POST form may retrieve a previously issued receipt');
   const posted=await res.text();
   assert.match(posted,/Compliance Analyst/);
   assert.doesNotMatch(posted,/Forged Title/);
   assert.ok(requests.every(r=>r.method==='GET'),'POST receipt verification is still a read-only database operation');
   res=await post({code,name:'Wrong Name'});
   assert.equal(res.status,404,'POST must not mint a mismatched receipt');

   res=await run({code,name:'Another Name',src:'verify'});
   assert.equal(res.status,404,'A valid code with another person name must not mint a receipt');
   res=await run({code:'JRS-R-FAKE0000',name:'Alex Reviewer',src:'verify'});
   assert.equal(res.status,404,'Wrong code must not mint a receipt');
   rows=[];
   res=await run({code,name:'Alex Reviewer',src:'verify'});
   assert.equal(res.status,404,'No issuer row must fail closed');

   rows=[{name:'Alex Reviewer',created_at:'2026-08-17T12:30:00Z',
     message:'{"kind":"reviewer-cert","completion_code":"JRS-R-FAKE0000"}'}];
   res=await run({code,name:'Alex Reviewer',src:'verify'});
   assert.equal(res.status,404,'Payload must match code exactly');
   globalThis.fetch=async()=>new Response('unavailable',{status:502});
   res=await run({code,name:'Alex Reviewer',src:'verify'});
   assert.equal(res.status,503,'Issuer database failure must not mint a receipt');
   delete process.env.SUPABASE_SERVICE_ROLE_KEY;
   res=await run({code,name:'Alex Reviewer',src:'verify'});
   assert.equal(res.status,503,'Missing issuer verification credentials must fail closed');
 } finally {
   globalThis.fetch=priorFetch;
   if(hadService)process.env.SUPABASE_SERVICE_ROLE_KEY=priorService;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: reviewer receipt code, name, title and issuance date are issuer-validated; false and unavailable records fail closed.');


// Public access health requests must be read-only and must not expose
// credential configuration. This regression exercises the actual Edge handler,
// with networking replaced by an in-memory spy. No real data is accessed.
{
 const accessSource=readFileSync(new URL('../api/access.js',import.meta.url),'utf8');
 assert.doesNotMatch(accessSource,/purgeTestRows\s*\(/,
   'Anonymous access requests must never trigger historical participant deletion');
 assert.doesNotMatch(accessSource,/serviceKey\s*:/,
   'Access endpoint must not report presence of private service credentials');
 const accessHandler=(await import('../api/access.js')).default;
 const originalFetch=globalThis.fetch;
 const wasSet=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 let calls=0;
 globalThis.fetch=async()=>{ calls++;throw new Error('Forbidden network access on public health check'); };
 try {
   for(const present of [true,false]){
     if(present)process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
     else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
     const res=await accessHandler(new Request('https://jrsstandard.com/api/access',{method:'GET'}));
     assert.equal(res.status,200,'GET health check must remain available');
     assert.deepEqual(await res.json(),{ok:true},'Health response must be independent of credential state');
     assert.equal(res.headers.get('Cache-Control'),'no-store','Public health response must not be cached');
   }
   assert.equal(calls,0,'GET health checks must perform no external reads, writes or deletes');
 } finally {
   globalThis.fetch=originalFetch;
   if(wasSet)process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: access health checks are side-effect-free and disclose no secret configuration.');


// Unverified listing requests must not change a contact record. A sender who
// knows someone's email must not be able to publish their identity. Exercise
// actual handler code with all networking replaced by a rejecting test stub.
{
 const handler=(await import('../api/access.js')).default;
 const priorFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const calls=[];
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   calls.push({url:String(url),method:options.method||'GET'});
   return new Response('PRIVATE_DIAGNOSTIC_SHOULD_NEVER_ESCAPE',{status:400});
 };
 const post=async(data,origin='https://jrsstandard.com')=>
   handler(new Request('https://jrsstandard.com/api/access',{
     method:'POST',headers:{'Content-Type':'application/json','Origin':origin},
     body:JSON.stringify(data)
   }));
 try {
   let res=await post({event:'listing',email:'someone-else@example.org'},
     'https://unrelated.example');
   assert.equal(res.status,403,'External browser origins must be denied');
   assert.equal(calls.length,0,'Rejected origin must not read or write private contact data');
   res=await post({name:'X'.repeat(9000),email:'example@example.org',
     mode:'guide',edition:'employment',consent_contact:true});
   assert.equal(res.status,413,'Oversize access submissions must be rejected');
   assert.equal(calls.length,0,'Oversized access payload must not reach the database');
   res=await post({event:'listing',email:'someone-else@example.org'});
   assert.equal(res.status,403,'Unverified public listing must fail closed');
   assert.deepEqual(await res.json(),{error:'verified_consent_required'});
   assert.equal(calls.length,0,'No database lookup or consent mutation is allowed for an unverified email');
   res=await post({mode:'guide',edition:'employment',name:'Example Reviewer',
     email:'example@example.org',organization:'Example',consent_contact:true,
     src:'organic'});
   assert.equal(res.status,502,'Failed database insertion must not be reported as success');
   const body=await res.text();
   assert.doesNotMatch(body,/PRIVATE_DIAGNOSTIC_SHOULD_NEVER_ESCAPE|service_key_missing|db_insert_failed|status\\"/,
     'Public registration failures must not reveal raw database diagnostics');
   assert.ok(calls.some(c=>c.method==='POST'),
     'Normal consented registration should still attempt the intended database write');
 } finally {
   globalThis.fetch=priorFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: unverified public listing cannot change consent; registration failures conceal database details.');

// Access registration transport exceptions must return a controlled JSON
// rejection, without claiming a successful registration or guide delivery.
{
 const handler=(await import('../api/access.js')).default;
 const oldFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const savedKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const calls=[];
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   calls.push({url:String(url),method:options.method||'GET'});
   throw new Error('PRIVATE_TRANSPORT_DIAGNOSTIC');
 };
 try {
   const r=await handler(new Request('https://jrsstandard.com/api/access',{
     method:'POST',
     headers:{'content-type':'application/json','origin':'https://jrsstandard.com'},
     body:JSON.stringify({mode:'guide',edition:'employment',
       name:'Example Reviewer',email:'example@example.org',
       consent_contact:true,src:'organic'})
   }));
   assert.equal(r.status,502,'Transport failure must fail closed');
   assert.deepEqual(await r.json(),{error:'registration_unavailable'});
   assert.equal(calls.length,1,'No aggregate counts after a failed registration');
 } finally {
   globalThis.fetch=oldFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=savedKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: access registration rejects transport failures without exposing diagnostics.');




// Telemetry must not claim durable delivery on rejected writes or retain
// sensitive URL parameters. This exercises the real endpoint with a mock
// response; no actual analytics records are generated.
{
 const handler=(await import('../api/telemetry.js')).default;
 const previousFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const inserted=[];
 let upstreamStatus=502;
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options)=>{
   inserted.push({url:String(url),data:JSON.parse(options.body)});
   return new Response(upstreamStatus===200?'':'upstream unavailable',{status:upstreamStatus});
 };
 const payload={
   origin_url:'https://www.jrsstandard.com/reviewer/completion.html?name=Sensitive%20Name&code=JRS-R-FAKE1234',
   target_url:'https://www.jrsstandard.com/training.html?email=private%40example.org',
   meta:{label:'Training',src:'link'}
 };
 const send=()=>handler(new Request('https://jrsstandard.com/api/telemetry',{
   method:'POST',
   headers:{'content-type':'application/json','user-agent':'Mozilla/5.0 Safari/605.1.15'},
   body:JSON.stringify(payload)
 }));
 try {
   let response=await send();
   assert.deepEqual(await response.json(),{ok:true,recorded:false,reason:'write_failed'},
     'A rejected upstream insert cannot be counted as recorded');
   assert.equal(inserted.length,1);
   assert.equal(inserted[0].data.payload.origin,'/reviewer/completion.html');
   assert.equal(inserted[0].data.payload.target,'/training.html');
   const stored=JSON.stringify(inserted[0].data);
   assert.doesNotMatch(stored,/Sensitive.Name|FAKE1234|private%40example|private@example/,
     'Analytics may store paths but never sensitive URL query parameters');
   upstreamStatus=200;
   response=await send();
   assert.deepEqual(await response.json(),{ok:true,recorded:true},
     'Only an accepted upstream write may be recorded as delivered');
 } finally {
   globalThis.fetch=previousFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: telemetry acknowledges upstream writes only and removes sensitive URL parameters.');


// Server-side self-attested completion may not duplicate an email on sequential
// retries. This is not identity verification; a database unique constraint is
// still needed for an absolute concurrency guarantee. All calls are mocked.
{
 const handler=(await import('../api/complete.js')).default;
 const previousFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const calls=[];
 let saved=[];
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   const method=options.method||'GET';
   calls.push({url:String(url),method,body:options.body||''});
   if(method==='GET')return new Response(JSON.stringify(saved),
     {status:200,headers:{'Content-Type':'application/json'}});
   if(method==='POST')return new Response(null,{status:201});
   throw new Error('Unexpected test request');
 };
 const send=(options={})=>handler(new Request('https://jrsstandard.com/api/complete',{
   method:'POST',headers:{'content-type':'application/json',
      'origin':options.origin||'https://jrsstandard.com'},
   body:JSON.stringify(options.data||{email:'reader@example.org'})
 }));
 try {
   let res=await send({origin:'https://unauthorized.example'});
   assert.equal(res.status,403,'Cross-origin browser completion must be rejected');
   assert.equal(calls.length,0,'Rejected origin must not query private records');
   res=await send({data:{email:'x'.repeat(2500)+'@example.org'}});
   assert.equal(res.status,413,'Oversized completion payload must fail closed');
   assert.equal(calls.length,0,'Oversized request must not reach the database');

   res=await send();
   assert.equal(res.status,200,'First self-attested completion may be accepted');
   assert.deepEqual(await res.json(),{ok:true});
   assert.deepEqual(calls.map(c=>c.method),['GET','POST']);
   assert.match(calls[0].url,/source=eq.training-complete/);
   assert.equal(JSON.parse(calls[1].body).source,'training-complete');

   saved=[{id:'existing-record'}];calls.length=0;
   res=await send();
   assert.equal(res.status,200,'Repeat completion must acknowledge the existing record');
   assert.deepEqual(await res.json(),{ok:true});
   assert.deepEqual(calls.map(c=>c.method),['GET'],
     'Sequential retry must not insert another completion record');
 } finally {
   globalThis.fetch=previousFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: completion service checks source scope, rejects cross-origin/oversize requests and avoids sequential duplicates.');


// Training enrollment rejects unrelated origins and oversized payloads and
// never reports private database errors. No production enrollment takes place.
{
 const handler=(await import('../api/enroll.js')).default;
 const oldFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const calls=[];
 let upstreamStatus=400;
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   calls.push({url:String(url),method:options.method,body:options.body});
   return new Response(upstreamStatus===400?'SENSITIVE_DB_DIAGNOSTIC':'',{status:upstreamStatus});
 };
 const data={name:'Example Participant',email:'example@example.org',consent_contact:true};
 const send=(origin,body)=>handler(new Request('https://jrsstandard.com/api/enroll',{
   method:'POST',headers:{'origin':origin,'content-type':'application/json'},
   body:JSON.stringify(body)
 }));
 try {
   let r=await send('https://unrelated.example',data);
   assert.equal(r.status,403,'External browser origins must be rejected');
   assert.equal(calls.length,0,'Rejected origin must not create registration');
   r=await send('https://jrsstandard.com',{...data,name:'X'.repeat(8500)});
   assert.equal(r.status,413,'Oversized registrations must be rejected');
   assert.equal(calls.length,0,'Oversized request must not write personal data');
   r=await send('https://jrsstandard.com',{...data,consent_contact:false});
   assert.equal(r.status,400,'No enrollment without explicit contact consent');
   assert.equal(calls.length,0);
   r=await send('https://jrsstandard.com',data);
   assert.equal(r.status,502,'Database rejection must not appear as success');
   assert.doesNotMatch(await r.text(),/SENSITIVE_DB_DIAGNOSTIC|service_key_missing/,
     'Public responses must not expose provider diagnostics');
   upstreamStatus=201;
   r=await send('https://jrsstandard.com',data);
   assert.equal(r.status,200,'Consent-based enrollment behavior must remain usable');
   assert.deepEqual(await r.json(),{ok:true});
   assert.equal(calls.length,2,'Only valid consented submissions may reach the database');
 } finally {
   globalThis.fetch=oldFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: training enrollment origin, consent, size and error minimization enforced.');


// Public campaign and training funnel measurements must not report a view,
// first field touch or support endorsement as recorded when the database
// rejects the write. All network calls below are in-memory mocks.
{
 const handler=(await import('../api/access.js')).default;
 const priorFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const priorKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 let status=503;
 const calls=[];
 globalThis.fetch=async(url,options={})=>{
   calls.push({url:String(url),method:options.method||'GET'});
   return new Response(null,{status});
 };
 const send=(event)=>handler(new Request('https://jrsstandard.com/api/access',{
   method:'POST',
   headers:{'content-type':'application/json','origin':'https://jrsstandard.com',
     'user-agent':'Mozilla/5.0 Safari/605.1.15'},
   body:JSON.stringify({event,campaign:'rtkw',src:'organic',page:'training',mode:'support'})
 }));
 try {
   for(const event of ['field_touched','endorse','view']){
     const rejected=await send(event);
     assert.equal(rejected.status,200,'Noncritical telemetry failure must not interrupt navigation');
     const data=await rejected.json();
     assert.equal(data.recorded,false,event+' must not report a rejected database write');
     if(event==='endorse')assert.equal(data.endorse,false,
       'Rejected public support endorsement cannot be described as recorded');
   }
   status=201;
   for(const event of ['field_touched','endorse','view']){
     const accepted=await send(event);
     assert.equal((await accepted.json()).recorded,true,
       event+' may only report recorded after upstream acceptance');
   }
   assert.equal(calls.length,6,'Each funnel event must make exactly one server write attempt');
 } finally {
   globalThis.fetch=priorFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=priorKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: funnel telemetry reports recorded only on database acceptance.');


// Guide-directory arrivals must not contaminate registration-form conversion.
// The public gate-stats aggregator identifies them by mode='guidespage'.
// Preserve the distinction through ingestion, with no real database writes.
{
 const guidesPage=readFileSync(new URL('../investigator-guides.html',import.meta.url),'utf8');
 const gateStats=readFileSync(new URL('../api/gate-stats.js',import.meta.url),'utf8');
 assert.match(guidesPage,/mode:'guidespage'/,
   'Guide-directory arrival must retain its distinct event mode');
 assert.ok(guidesPage.includes('location.hostname') &&
   guidesPage.includes("if (q.get('owner') === '1'"),
   'Preview, owner or local browser audits must not become production guide visits');
   'Preview or local browser audits must not become production guide visits');
 assert.match(guidesPage,/src\.indexOf\('deploytest'\) === 0/,
   'Owner and deployment test traffic must remain outside guide-page counts');
 assert.match(gateStats,/String\(p\.mode\) === 'guidespage'/,
   'Reporting must exclude guide-directory visits from registration-form views');
 const handler=(await import('../api/access.js')).default;
 const originalFetch=globalThis.fetch;
 const hadKey=Object.prototype.hasOwnProperty.call(process.env,'SUPABASE_SERVICE_ROLE_KEY');
 const previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const requests=[];
 process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
 globalThis.fetch=async(url,options={})=>{
   requests.push(JSON.parse(options.body));
   return new Response(null,{status:201});
 };
 const send=(mode,src)=>handler(new Request('https://jrsstandard.com/api/access',{
   method:'POST',headers:{'content-type':'application/json',
     'origin':'https://jrsstandard.com','user-agent':'Mozilla/5.0 Safari/605.1.15'},
   body:JSON.stringify({event:'view',mode,src})
 }));
 try {
   const guides=await send('guidespage','organic');
   assert.equal(guides.status,200);
   assert.equal((await guides.json()).recorded,true);
   assert.equal(requests.length,1);
   assert.equal(requests[0].source,'gate-view');
   assert.equal(requests[0].payload.mode,'guidespage',
     'Directory traffic must not inflate guide-registration form views');
   const form=await send('guide','organic');
   assert.equal((await form.json()).recorded,true);
   assert.equal(requests[1].payload.mode,'guide',
     'Actual registration-form view remains a separate event');
   const test=await send('guidespage','deploytest-hosted');
   assert.equal((await test.json()).recorded,false);
   assert.equal(requests.length,2,'Smoke-test guide view cannot write database rows');
 } finally {
   globalThis.fetch=originalFetch;
   if(hadKey)process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;
   else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
 }
}
console.log('PASS: guide-directory visits and registration-form views are distinct; preview traffic is excluded.');
