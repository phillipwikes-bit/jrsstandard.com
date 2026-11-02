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
