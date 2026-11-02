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
