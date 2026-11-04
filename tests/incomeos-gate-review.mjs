// Synthetic-only regression checks for the review of source-attestation.js, release-gate.js and private-append-handler.js.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync("owner/incomeos/"+p,"utf8");
const sa={window:{}};runInNewContext(read("source-attestation.js"),sa);const S=sa.window.IncomeOSSourceAttestation;
const now="2026-11-02T18:00:00Z";
const good={connectionStatus:"linked",coverageComplete:true,balanceSourceVerified:true,statementReconciled:true,sourceEvidenceId:"statement-1",verifiedAt:"2026-11-02T17:00:00Z"};
// R12-1: a complete but self-asserted attestation is never reported as verified.
{const r=S.verify(good,now);assert.equal(r.verified,false);assert.equal(r.attestationComplete,true);assert.equal(r.selfAttested,true);}
// R12-3: times must be Z-suffixed ISO instants; local-time strings are refused.
{const r=S.verify({...good,verifiedAt:"2026-11-02T17:00:00"},now);assert.ok(r.reasons.includes("VERIFICATION_TIME_MISSING"));
 assert.equal(S.verify(good,"2026-11-02 18:00").status,"HOLD");}
// R12-9: every return path has the same fail-closed fields.
{for(const r of [S.verify(null,now),S.verify(good,"bad")]){assert.equal(r.authorizationToTransfer,false);assert.equal(r.availableToInvestCents,null);}
 const rg={window:{}};runInNewContext(read("release-gate.js"),rg);const g=rg.window.IncomeOSReleaseGate.assess(null);
 assert.equal(g.investmentExecutionEnabled,false);assert.equal(g.availableToInvestCents,null);}
// R12-10: a raw account or routing number is refused as an evidence reference.
assert.ok(S.verify({...good,sourceEvidenceId:"021000021123456789"},now).reasons.includes("EVIDENCE_REFERENCE_LOOKS_LIKE_ACCOUNT_NUMBER"));
// R12-4: the append handler loads without a browser window when the journal is injected.
const jc={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,String,Array,Map,Set,Object,JSON,Math,Error};
runInNewContext(read("financial-event-journal.js"),jc);const J=jc.window.IncomeOSEventJournal;
const server={globalThis:undefined,crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,String,Array,Map,Set,Object,JSON,Math,Error,URL,module:{exports:{}}};
server.globalThis=server;runInNewContext(read("private-append-handler.js"),server);
const H=server.module.exports;
const deps={allowedOrigin:"https://owner.example.com",authenticate:async()=>({verified:true,subject:"synthetic-owner-0001"}),approvedOwner:async()=>true,
 verifyCsrf:async()=>true,loadEvents:async()=>[],appendAtomic:async()=>true,journal:J};
const handle=H.create(deps);
// R12-6: a malformed origin fails at configuration; later edits to the caller's config change nothing.
assert.throws(()=>H.create({...deps,allowedOrigin:"https://owner.example.com/"}),/protected HTTPS origin/);
assert.throws(()=>H.create({...deps,allowedOrigin:"https://"}),/protected HTTPS origin/);
{const cfg={...deps};const h=H.create(cfg);cfg.allowedOrigin="https://evil.example.com";
 const r=await h({method:"POST",origin:"https://evil.example.com",contentType:"application/json",body:{}});assert.equal(r.status,403);}
// R12-5: a JSON content type with a charset parameter is accepted.
{const r=await handle({method:"POST",origin:"https://owner.example.com",contentType:"application/json; charset=utf-8",body:{event:{},expectedHeadHash:"0".repeat(64)}});
 assert.notEqual(r.status,415);}
console.log("IncomeOS gate review checks passed (7 findings fixed; 3 rejected with reasons).");
