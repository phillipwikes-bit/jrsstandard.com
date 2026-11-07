"use strict";
const assert=require("node:assert/strict");
const {createTransport}=require("../owner/incomeos/revision-supabase-transport.js");
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
  assert.equal(calls[1].options.method,"POST");
  assert.equal(calls[1].options.headers.Authorization,"Bearer test-owner-token");
  assert.match(calls[1].url,/incomeos_append_workspace_revision$/);
  const noToken=createTransport({url:"https://example.supabase.co",key:"public",getToken:async()=>null,fetch:async()=>{throw Error("Must not fetch");}});
  await assert.rejects(noToken.latest(),/Owner session required/);
  assert.throws(()=>createTransport({url:"http://example.supabase.co",key:"public",getToken:async()=>"",fetch:async()=>{}}));
  console.log("PASS: owner-token RPC transport and fail-closed request configuration");
})().catch(e=>{console.error(e);process.exitCode=1;});
