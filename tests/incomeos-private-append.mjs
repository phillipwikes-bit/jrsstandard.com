// Private append handler contract tests. All identities and bank entries synthetic.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script,runInNewContext} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const ctx={window:{},crypto:webcrypto,Date,TextEncoder,Uint8Array,Number,String,Array,Map,Set,Object,JSON,Math,Error};
for(const file of ["financial-event-journal.js","private-append-handler.js"]){let c=read(file);new Script(c);runInNewContext(c,ctx);}
const J=ctx.window.IncomeOSEventJournal,H=ctx.window.IncomeOSServerAppend;
const origin="https://incomeos-staging.example.org",subject="synthetic-owner-0001";
let history=[],failOnLoad=false,failOnAppend=false,race=false;
const deps={
  allowedOrigin:origin,
  authenticate:async req=>req.auth==="valid"?{verified:true,subject:req.subject||subject}:null,
  approvedOwner:async who=>who===subject,
  verifyCsrf:async req=>req.csrfProof==="synthetic-verified",
  loadEvents:async()=>{if(failOnLoad)throw Error("synthetic storage read error");return history.slice();},
  appendAtomic:async(who,row,expected)=>{
    if(failOnAppend)throw Error("synthetic storage down");
    if(race || who!==subject)return false;
    const v=await J.verify(history);
    if(v.headHash!==expected || row.seq!==history.length+1 || row.prevHash!==expected)return false;
    history=history.concat([row]);return true;
  }
};
const handler=H.create(deps);
const event={id:"financial.event.0001",type:"POSTED",timestamp:"2026-11-01T22:15:00.000Z",
 data:{sourceId:"bank.source.0001",postedDate:"2026-11-01",direction:"credit",amountCents:2500,currency:"USD",evidenceId:"provider.doc.0001"}};
const req=(overrides={})=>({method:"POST",origin,contentType:"application/json",auth:"valid",
  csrfProof:"synthetic-verified",body:{expectedHeadHash:J.genesisHash,event},...overrides});
async function code(overrides,status,reason){
 const r=await handler(req(overrides));
 assert.equal(r.status,status);
 if(reason)assert.equal(r.body.reason,reason);
 assert.match(r.headers["Cache-Control"],/no-store/);
 return r;
}
await code({method:"GET"},405,"METHOD_NOT_ALLOWED");
await code({origin:"https://not-authorized.example"},403,"ORIGIN_NOT_ALLOWED");
await code({contentType:"text/plain"},415,"UNSUPPORTED_CONTENT_TYPE");
await code({auth:"not-validated"},401,"AUTHENTICATION_REQUIRED");
await code({subject:"synthetic-imposter-0002"},403,"NOT_APPROVED_OWNER");
await code({csrfProof:"invalid"},403,"CSRF_PROOF_REQUIRED");
await code({body:null},400,"INVALID_REQUEST");
await code({body:{expectedHeadHash:J.genesisHash,event,rawAccountNumber:"12345678"}},400,"UNEXPECTED_REQUEST_FIELDS");
await code({body:{expectedHeadHash:"invalid",event}},400,"INVALID_HEAD");
await code({body:{expectedHeadHash:J.genesisHash,event:{...event,accountNumber:"1234"}}},400,"INVALID_EVENT");
await code({body:{expectedHeadHash:J.genesisHash,event:{...event,data:{...event.data,accountPassword:"password"}}}},400,"INVALID_EVENT");
failOnLoad=true;await code({},503,"SOURCE_HISTORY_NOT_VERIFIED");failOnLoad=false;
race=true;await code({},409,"CONCURRENT_APPEND_OR_REJECTED");race=false;
failOnAppend=true;await code({},503,"PERSISTENCE_UNAVAILABLE");failOnAppend=false;
let created=await code({},201);
assert.equal(created.body.sequence,1);
assert.equal(created.body.independentlyBankVerified,false);
assert.equal(created.body.readyForTaxFiling,false);
assert.equal(history.length,1);
await code({},409,"STALE_JOURNAL_HEAD");
await code({body:{expectedHeadHash:history[0].hash,event}},409,"EVENT_VALIDATION_OR_ID_CONFLICT");
const second={...event,id:"financial.event.0002",data:{...event.data,sourceId:"bank.source.0002"}};
created=await code({body:{expectedHeadHash:history[0].hash,event:second}},201);
assert.equal(created.body.sequence,2);
assert.equal(history.length,2);
const broken=history[0].hash;
history[0]={...history[0],hash:"f".repeat(64)};
await code({body:{expectedHeadHash:created.body.headHash,event:{...event,id:"financial.event.0003"}}},503,"SOURCE_HISTORY_NOT_VERIFIED");
history[0]={...history[0],hash:broken};
assert.equal((await J.verify(history)).count,2);
assert.throws(()=>H.create({allowedOrigin:origin}),/dependencies/);
assert.throws(()=>H.create({...deps,allowedOrigin:"http://insecure.example"}),/protected HTTPS/);
assert.doesNotMatch(read("private-append-handler.js"),/localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
console.log("IncomeOS private-append contract QA passed: denied by default, owner identity, origin/CSRF, tamper hold, atomic head conflict and no disclosed financial content.");
