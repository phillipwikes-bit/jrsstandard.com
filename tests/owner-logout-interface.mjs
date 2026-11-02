// Browser-only sign-out interface regression with synthetic HTTP responses.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../programme-status-9872fb93cc94.html',import.meta.url),'utf8');
const sentinel="var out=document.getElementById('owner-signout');";
const marker=html.indexOf(sentinel);
assert.ok(marker>0,'sign-out handler exists');
const begin=html.lastIndexOf('<script>',marker);
const end=html.indexOf('</script>',marker);
assert.ok(begin>=0&&end>begin,'script extracted');
const program=html.slice(begin+8,end);
assert.ok(html.includes('id="owner-signout-status"'));
let passed=0;
async function scenario(name,responder,expect){
  const requests=[],navigations=[],control={
    textContent:'Sign out',disabled:false,click:null,
    addEventListener(type,fn){assert.equal(type,'click');this.click=fn;}
  };
  const status={textContent:''};
  const context={
    document:{getElementById(id){
      return id==='owner-signout'?control:id==='owner-signout-status'?status:null;
    }},
    fetch:async(path,options)=>{
      requests.push({path,method:options.method,credentials:options.credentials,cache:options.cache});
      return responder(requests.length,options);
    },
    location:{replace(path){navigations.push(path)}},
    Error
  };
  vm.runInNewContext(program,context,{filename:'owner-logout-inline.js'});
  assert.equal(typeof control.click,'function');
  await control.click();
  assert.ok(requests.every(r=>r.path==='/api/owner-session'&&r.credentials==='same-origin'&&r.cache==='no-store'));
  expect({requests,navigations,control,status});
  passed++;
  console.log('PASS '+name);
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
await scenario('confirmed browser session revocation redirects only after 401',n=>{
  if(n===1)return json({signed_out:true});
  return json({error:'unauthorized'},401);
},x=>{
  assert.equal(x.requests.length,2);
  assert.deepEqual(x.requests.map(r=>r.method),['DELETE','GET']);
  assert.deepEqual(x.navigations,['/owner-login.html']);
});
await scenario('failed DELETE does not claim sign-out',()=>json({error:'unavailable'},503),x=>{
  assert.equal(x.requests.length,1);
  assert.deepEqual(x.navigations,[]);
  assert.equal(x.control.disabled,false);
  assert.match(x.status.textContent,/may still be active/);
});
await scenario('false-positive successful DELETE body does not claim sign-out',()=>json({}),x=>{
  assert.equal(x.requests.length,1);
  assert.deepEqual(x.navigations,[]);
  assert.equal(x.control.textContent,'Retry sign-out');
});
await scenario('session still authorized after DELETE blocks redirect',()=>json({signed_out:true}),x=>{
  assert.equal(x.requests.length,2);
  assert.deepEqual(x.navigations,[]);
  assert.match(x.status.textContent,/could not be verified/);
});
await scenario('network outage does not claim sign-out',()=>{throw Error('synthetic outage')},x=>{
  assert.equal(x.requests.length,1);
  assert.deepEqual(x.navigations,[]);
  assert.equal(x.control.disabled,false);
});
console.log('PASS '+passed+' owner sign-out browser confirmation tests');
