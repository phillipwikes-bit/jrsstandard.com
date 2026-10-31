import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import session from '../api/owner-session.js';

const html=readFileSync(new URL('../owner-login.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert(script,'owner login must contain browser script');
const URL='https://www.jrsstandard.com/api/owner-session';
const original=process.env.OWNER_DASHBOARD_TOKEN;
test.after(()=>{
  if(original===undefined)delete process.env.OWNER_DASHBOARD_TOKEN;
  else process.env.OWNER_DASHBOARD_TOKEN=original;
});
const settled=()=>new Promise(resolve=>setImmediate(resolve));
async function render(get={status:401},post={status:200}){
 const elements={
  login:{reportValidity:()=>true,addEventListener(type,handler){assert.equal(type,'submit');this.onSubmit=handler}},
  secret:{disabled:false,value:'synthetic-secret-never-real'},
  go:{disabled:false},
  status:{textContent:''}
 };
 const calls=[],navigation=[];
 const fetch=async (url,options={})=>{
  calls.push({url,options});
  if(options.method==='POST'){
   if(post.throw)throw Error('synthetic POST connectivity failure');
   return {status:post.status,ok:post.status>=200&&post.status<300};
  }
  if(get.throw)throw Error('synthetic GET connectivity failure');
  return {status:get.status,ok:get.status>=200&&get.status<300};
 };
 runInNewContext(script,{document:{getElementById:id=>elements[id]},
   fetch,location:{replace:path=>navigation.push(path)}});
 await settled();
 return {elements,calls,navigation,async submit(){
   await elements.login.onSubmit({preventDefault(){}});
   await settled();
 }};
}
test('503 GET reports that NO password can work on this deployment',async()=>{
 const x=await render({status:503});
 assert.equal(x.elements.go.disabled,true);
 assert.equal(x.elements.secret.disabled,true);
 assert.match(x.elements.status.textContent,/No password can work/);
 await x.submit();
 assert.equal(x.calls.length,1,'Do not send owner password while unconfigured');
 assert.equal(x.navigation.length,0);
});
test('401 GET enables sign-in after server readiness',async()=>{
 const x=await render({status:401});
 assert.equal(x.elements.go.disabled,false);
 assert.equal(x.elements.secret.disabled,false);
 assert.match(x.elements.status.textContent,/ready/);
 assert.equal(x.calls[0].options.method,undefined);
});
test('valid configured POST signs in and never leaves access code in input',async()=>{
 const x=await render({status:401},{status:200});
 await x.submit();
 assert.equal(x.calls.length,2);
 assert.equal(x.calls[1].options.method,'POST');
 assert.equal(x.elements.secret.value,'');
 assert.deepEqual(x.navigation,['/programme-status-9872fb93cc94.html']);
});
test('wrong password (401 POST) differs from missing server config (503)',async()=>{
 const wrong=await render({status:401},{status:401});
 await wrong.submit();
 assert.match(wrong.elements.status.textContent,/Access code not accepted/);
 assert.equal(wrong.elements.go.disabled,false);
 assert.equal(wrong.navigation.length,0);
 const missing=await render({status:401},{status:503});
 await missing.submit();
 assert.match(missing.elements.status.textContent,/No password can work/);
 assert.equal(missing.elements.go.disabled,true);
 assert.equal(missing.elements.secret.disabled,true);
 assert.equal(missing.navigation.length,0);
});
test('authenticated GET redirects without inviting password entry',async()=>{
 const x=await render({status:200});
 assert.deepEqual(x.navigation,['/programme-status-9872fb93cc94.html']);
 assert.equal(x.elements.go.disabled,true);
});
test('network unavailable disables sign-in safely',async()=>{
 const x=await render({throw:true});
 assert.match(x.elements.status.textContent,/Cannot reach/);
 assert.equal(x.elements.go.disabled,true);
 assert.equal(x.elements.secret.disabled,true);
 await x.submit();
 assert.equal(x.calls.length,1);
});
test('POST network failure does not claim invalid password or successful access',async()=>{
 const x=await render({status:401},{throw:true});
 await x.submit();
 assert.match(x.elements.status.textContent,/Cannot reach/);
 assert.equal(x.elements.go.disabled,true);
 assert.equal(x.navigation.length,0);
});
test('server-side missing secret returns distinct 503 on valid POST',async()=>{
 delete process.env.OWNER_DASHBOARD_TOKEN;
 const req=new Request(URL,{method:'POST',
  headers:{Origin:'https://www.jrsstandard.com','Content-Type':'application/json'},
  body:JSON.stringify({token:'synthetic-password'})});
 const response=await session(req);
 assert.equal(response.status,503);
 assert.deepEqual(await response.json(),{error:'owner_access_unavailable'});
 assert.match(response.headers.get('cache-control')||'',/no-store/);
 assert.equal(response.headers.has('set-cookie'),false);
});
test('server-side configured secret rejects incorrect password with 401',async()=>{
 process.env.OWNER_DASHBOARD_TOKEN='synthetic_owner_login_fixture_31_oct_2026_abcdefghijklmnopqrstuvwxyz';
 const req=new Request(URL,{method:'POST',
  headers:{Origin:'https://www.jrsstandard.com','Content-Type':'application/json'},
  body:JSON.stringify({token:'definitely-not-the-owner-secret'})});
 const response=await session(req);
 assert.equal(response.status,401);
 assert.deepEqual(await response.json(),{error:'unauthorized'});
 assert.equal(response.headers.has('set-cookie'),false);
});
test('login script contains no literal secret and no external telemetry',()=>{
 assert(!/SUPABASE_SERVICE_ROLE_KEY|OWNER_DASHBOARD_TOKEN|gtag\(|googletagmanager/i.test(script));
 assert(!html.includes('value="synthetic-secret-never-real"'));
});
