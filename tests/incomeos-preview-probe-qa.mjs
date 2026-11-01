// Synthetic-only protected-preview readiness. Never makes a network request.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {probeProtectedPreview} from "./incomeos-preview-probe.mjs";

const root=resolve("owner/incomeos"),read=p=>readFileSync(resolve(root,p),"utf8");
const manifest=JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.start_url,"./","Home-screen launch must work in separate IncomeOS staging project root");
assert.equal(manifest.scope,"./","PWA installation must not be tied to public JRS domain");
assert.match(read("index.html"),/rel="manifest" href="\.\/manifest\.webmanifest"/);

const vercel=JSON.parse(read("vercel.json"));
assert.equal(vercel.version,2);
assert.equal(vercel.headers.length,1);
assert.equal(vercel.headers[0].source,"/(.*)");
const headers=new Map(vercel.headers[0].headers.map(x=>[x.key.toLowerCase(),x.value]));
assert.match(headers.get("cache-control"),/no-store/);
assert.match(headers.get("content-security-policy"),/frame-ancestors 'none'/);
assert.match(headers.get("content-security-policy"),/script-src 'self'/);
assert.match(headers.get("content-security-policy"),/connect-src 'self'/);
assert.match(headers.get("content-security-policy"),/object-src 'none'/);
assert.match(headers.get("content-security-policy"),/form-action 'none'/);
assert.equal(headers.get("x-frame-options"),"DENY");
assert.equal(headers.get("x-content-type-options"),"nosniff");
assert.equal(headers.get("referrer-policy"),"no-referrer");
assert.match(headers.get("strict-transport-security"),/max-age=/);
assert.match(headers.get("x-robots-tag"),/noindex/);
assert.match(headers.get("permissions-policy"),/payment=\(\)/);
assert.equal(vercel.headers[0].headers.length,10);

const sha="a".repeat(40);
const base={teamId:"team_Q2KvghlnRA3ePBm4zAiYzbIf",projectId:"prj_eIGgDvJb3LkYmk0NGjoo7bWFEi3n",
  githubHeadSha:sha,providerDeploymentSha:sha,previewTarget:"preview",deploymentState:"READY",
  deploymentId:"deploy.synthetic.001",previewUrl:"https://incomeos-synthetic-abc.vercel.app/",
  projectProtection:{enabled:true,deploymentType:"all"}};
let callCount=0;
const blocked=async (_u,options)=>{callCount++;assert.equal(options.redirect,"manual");
  assert.ok(["GET","HEAD"].includes(options.method),"No post or financial endpoint accessed");
  assert.ok(options.signal,"Set an HTTP timeout");
  return {status:403,headers:{get:()=>null}};
};
let result=await probeProtectedPreview(base,blocked);
assert.equal(result.gate,"ANONYMOUS_ACCESS_CHECK_PASSED");
assert.equal(result.anonymousChecks.length,6);
assert.equal(callCount,6);
assert.equal(result.productionReady,false);
assert.equal(result.authenticatedOwnerVerified,false);
assert.equal(result.privateFinancialBackendVerified,false);
assert.equal(result.canDeployToProduction,false);
result=await probeProtectedPreview(base,async()=>({status:401}));
assert.equal(result.gate,"ANONYMOUS_ACCESS_CHECK_PASSED");
result=await probeProtectedPreview(base,async()=>({status:404}));
assert.equal(result.gate,"HOLD","A missing page must not count as protected access");
assert.equal(result.anonymousChecks.length,1);
result=await probeProtectedPreview(base,async()=>({status:302}));
assert.equal(result.gate,"HOLD","An unverified redirect must not count as a proven authentication denial");
result=await probeProtectedPreview(base,async()=>({status:200}));
assert.equal(result.gate,"HOLD","Publicly readable resources block release");
assert.match(result.reason,/Anonymous client can read/);
let calls=0;
for(const variant of [
  {githubHeadSha:"b".repeat(40)},{providerDeploymentSha:"b".repeat(40)},
  {projectId:"prj_other"},{teamId:"team_other"},
  {previewTarget:"production"},{deploymentState:"QUEUED"},
  {projectProtection:{enabled:true,deploymentType:"all_except_custom_domains"}},
  {projectProtection:{enabled:false,deploymentType:"all"}},
  {previewUrl:"http://incomeos-synthetic.vercel.app/"},
  {previewUrl:"https://incomeos-synthetic.vercel.app/foo"},
  {previewUrl:"https://incomeos-synthetic.vercel.app.evil.org/"},
  {previewUrl:"https://username:password@incomeos-synthetic.vercel.app/"},
  {previewUrl:"https://incomeos-synthetic.vercel.app/?bypass=true"},
  {previewUrl:"https://incomeos-synthetic.vercel.app/#asset"},
  {deploymentId:null}
]){
  const r=await probeProtectedPreview({...base,...variant},async()=>{calls++;return {status:403}});
  assert.equal(r.gate,"HOLD","Unverified metadata cannot pass: "+JSON.stringify(variant));
}
assert.equal(calls,0,"A blocked source attestation must never make HTTP requests");
result=await probeProtectedPreview(base,async()=>{throw new Error("Synthetic timeout");});
assert.equal(result.gate,"HOLD");
assert.equal(result.anonymousChecks[0].status,"ERROR");
assert.doesNotMatch(read("vercel.json"),/bypass|secret|token|authorization|API_KEY/i);
console.log("IncomeOS protected-preview QA passed using synthetic responses only: exact project/SHA, all-target SSO, GET/HEAD anonymous denial, no false positives, and staging headers.");
