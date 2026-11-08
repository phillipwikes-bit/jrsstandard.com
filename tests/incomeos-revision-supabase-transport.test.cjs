"use strict";
const assert=require("node:assert/strict");
const {createTransport}=require("./incomeos-browser-script-loader.cjs")("revision-supabase-transport.js","IncomeOSSupabaseRevisionTransport");
(async()=>{
  const calls=[];
  const transport=createTransport({
    url:"https://example.supabase.co",key:"public-test-key",
    getToken:async()=>"test-owner-token",
    fetch:async(url,options)=>{
      calls.push({url,options});
      return {ok:true,status:200,json:async()=>url.endsWith("latest_workspace_revision")?null:1};
    }
  });
  assert.equal(await transport.latest(),null);
  assert.equal(await transport.append({expected_revision:0,encrypted_payload:"encrypted",payload_sha256:"a".repeat(64)}),1);
  assert.equal(calls.length,2);
  assert.equal(calls[0].options.credentials,"omit");
  assert.equal(calls[0].options.cache,"no-store");
  assert.equal(calls[0].options.redirect,"error","Credential-bearing RPC requests must not follow redirects");
  assert.equal(calls[1].options.method,"POST");
  assert.equal(calls[1].options.headers.Authorization,"Bearer test-owner-token");
  assert.match(calls[1].url,/incomeos_append_workspace_revision$/);
  const noToken=createTransport({url:"https://example.supabase.co",key:"public",getToken:async()=>null,fetch:async()=>{throw Error("Must not fetch");}});
  await assert.rejects(noToken.latest(),/Owner session required/);
  assert.throws(()=>createTransport({url:"http://example.supabase.co",key:"public",getToken:async()=>"",fetch:async()=>{}}));
  const config={url:"https://example.supabase.co",key:"public-test-key",getToken:async()=>"test-owner-token",timeoutMs:15};
  for(const timeoutMs of [0,-1,30001,Infinity,"15"])
    assert.throws(()=>createTransport({...config,timeoutMs,fetch:async()=>{}}),/Bounded RPC timeout/);
  let lateReply,requestSignal,attempts=0;
  const stalled=createTransport({...config,fetch:async(url,options)=>{
    attempts++;requestSignal=options.signal;
    return new Promise(resolve=>{lateReply=()=>resolve({ok:true,status:200,json:async()=>1});});
  }});
  await assert.rejects(stalled.append({expected_revision:0}),/timed out; outcome uncertain/);
  assert.equal(requestSignal.aborted,true,"A stalled request must be aborted at its deadline");
  lateReply();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(attempts,1,"Timeout and late success cannot trigger an automatic retry");
  const stalledBody=createTransport({...config,fetch:async()=>({ok:true,status:200,json:()=>new Promise(()=>{})})});
  await assert.rejects(stalledBody.latest(),/timed out/,
    "Deadline must include a stalled response body, not just response headers");
  const rejected=createTransport({...config,fetch:async()=>({ok:false,status:401,json:async()=>({message:"SYNTHETIC-SECRET-DO-NOT-ECHO"})})});
  await assert.rejects(rejected.latest(),e=>e.status===401&&!e.message.includes("SYNTHETIC-SECRET"));
  const invalidStatus=createTransport({...config,fetch:async()=>({ok:false,status:"SYNTHETIC-PRIVATE-STATUS"})});
  await assert.rejects(invalidStatus.latest(),e=>/reopen to verify/.test(e.message)&&!e.message.includes("SYNTHETIC-PRIVATE"));
  const networkError=createTransport({...config,fetch:async()=>{throw Error("SYNTHETIC-SECRET-DO-NOT-ECHO");}});
  await assert.rejects(networkError.latest(),e=>/reopen to verify/.test(e.message)&&!e.message.includes("SYNTHETIC-SECRET"));
  for(const failure of [Error("SYNTHETIC-PRIVATE-TOKEN-PROVIDER-DETAIL"),
    Object.assign(Error("SYNTHETIC-PRIVATE-TOKEN-PROVIDER-DETAIL"),{status:401}),null,undefined]){
    const tokenFailure=createTransport({...config,getToken:async()=>{throw failure;},fetch:async()=>{throw Error("Must not fetch");}});
    await assert.rejects(tokenFailure.latest(),e=>/reopen to verify/.test(e.message)&&!e.message.includes("SYNTHETIC-PRIVATE"));
  }
  {
    let resolveToken,lateFetches=0;
    const tokenWait=createTransport({...config,getToken:()=>new Promise(resolve=>{resolveToken=resolve;}),
      fetch:async()=>{lateFetches++;return {ok:true,json:async()=>null};}});
    const result=await Promise.race([
      tokenWait.latest().then(()=>"unexpected success",e=>e.message),
      new Promise(resolve=>setTimeout(()=>resolve("unbounded token retrieval"),150))
    ]);
    assert.match(result,/timed out; outcome uncertain/,"The RPC deadline includes token retrieval");
    resolveToken("late-synthetic-owner-token");await new Promise(resolve=>setImmediate(resolve));
    assert.equal(lateFetches,0,"A late token cannot dispatch a request after the deadline");
  }
  // Authentication yields. Caller edits to configuration must not redirect
  // the already configured request or replace its credential-bearing fetch.
  {
    let signal,release;
    const started=new Promise(resolve=>{signal=resolve;});
    const waiting=new Promise(resolve=>{release=resolve;});
    const requests=[];let substitutedFetches=0;
    const mutable={url:"https://example.supabase.co",key:"original-synthetic-public-key",
      getToken:async()=>{signal();await waiting;return "synthetic-owner-token";},
      fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>null};}};
    const request={expected_revision:0,encrypted_payload:"synthetic-original-ciphertext",payload_sha256:"a".repeat(64)};
    const expected=JSON.stringify(request);
    const pinned=createTransport(mutable);const pending=pinned.append(request);await started;
    request.expected_revision=99;request.encrypted_payload="synthetic caller replacement";
    mutable.url="https://unapproved.invalid";mutable.key="replaced-synthetic-public-key";
    mutable.fetch=async()=>{substitutedFetches++;return {ok:true,json:async()=>null};};
    release();await pending;
    assert.equal(substitutedFetches,0,"Caller mutation cannot redirect the authenticated fetch");
    assert.equal(requests.length,1);
    assert.equal(requests[0].url,"https://example.supabase.co/rest/v1/rpc/incomeos_append_workspace_revision");
    assert.equal(requests[0].options.body,expected,"Token retrieval cannot change the submitted revision request");
    assert.equal(requests[0].options.headers.apikey,"original-synthetic-public-key");
  }
  console.log("PASS: owner-token RPC transport and fail-closed request configuration");
})().catch(e=>{console.error(e);process.exitCode=1;});
