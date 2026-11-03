// IncomeOS workspace file: engine-checked updates, append-only change log, encryption round trip.
// SYNTHETIC DATA ONLY.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const ctx={window:{},URL,WeakSet,crypto:globalThis.crypto,btoa,atob,TextEncoder,TextDecoder};
for(const f of ["ledger-rules.js","claims-tracker.js","workspace-store.js"])vm.runInNewContext(readFileSync(new URL("../owner/incomeos/"+f,import.meta.url),"utf8"),ctx);
const WS=ctx.window.IncomeOSWorkspace,LR=ctx.window.IncomeOSLedgerRules;
const plain=x=>JSON.parse(JSON.stringify(x));
const base={schema:"incomeos.workspace.v1",
  ledger:[{id:"e1",kind:"outflow",type:"expense",date:"2026-10-05",payer:"Comcast",label:"Internet",amountUsd:"100.01",category:"other"}],
  rules:[{id:"net",kind:"outflow",match:{vendorContains:"comcast"},split:[{category:"homeoffice",percent:40},{category:"other",percent:60}],approvedOn:"2026-11-01"}],
  accounts:[{id:"chk",name:"Checking",type:"checking"}],balances:[],claims:[]};

// Accept a proposal: entry split, original replaced, change logged, input untouched.
const prop=LR.propose(base.ledger,base.rules).proposals[0];
let w=WS.acceptProposal(base,prop,"2026-11-03");
assert.equal(w.ledger.length,2);assert.equal(w.ledger.reduce((a,e)=>a+Math.round(Number(e.amountUsd)*100),0),10001);
assert.equal(w.changeLog.length,1);assert.equal(w.changeLog[0].action,"ACCEPT_CATEGORY_PROPOSAL");
assert.equal(base.ledger.length,1,"input workspace is not mutated");
assert.equal(LR.propose(w.ledger,w.rules).proposals.length,0,"accepted entries are not re-proposed");
assert.throws(()=>WS.acceptProposal(base,{...plain(prop),entryId:"nope"},"2026-11-03"),/not found/);

// Record searches; a match opens a claim at MATCH_FOUND with evidence.
w=WS.recordSearch(w,"md-comptroller","2026-11-03",false);
assert.equal(w.searchHistory.length,1);assert.equal(w.claims.length,0);
assert.throws(()=>WS.recordSearch(w,"missingmoney","2026-11-03",true,""),/Describe what was found/);
w=WS.recordSearch(w,"missingmoney","2026-11-03",true,"MissingMoney match, ref 4471");
assert.equal(w.claims[0].state,"MATCH_FOUND");assert.equal(w.claims[0].history.at(-1).evidenceRef,"MissingMoney match, ref 4471");
const cid=w.claims[0].id;

// Claims lifecycle rules are enforced by the claims engine.
assert.throws(()=>WS.advanceClaim(w,cid,{to:"PAID",on:"2026-11-04",evidenceRef:"x",amountUsd:50,bankRef:"b"}),/TRANSITION_NOT_ALLOWED/);
assert.throws(()=>WS.advanceClaim(w,cid,{to:"CLAIM_FILED",on:"2026-11-04",evidenceRef:""}),/EVIDENCE_REFERENCE_REQUIRED/);
w=WS.advanceClaim(w,cid,{to:"CLAIM_FILED",on:"2026-11-04",evidenceRef:"claim #9"});
assert.equal(w.claims[0].state,"CLAIM_FILED");

// Balances need a known account, a date, an amount and a stated source.
assert.throws(()=>WS.addBalance(w,{accountId:"ghost",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:"r"}),/Unknown account/);
assert.throws(()=>WS.addBalance(w,{accountId:"chk",asOf:"2026-11-01",balanceUsd:"1",source:"statement",sourceRef:" "}),/where the statement/);
w=WS.addBalance(w,{accountId:"chk",asOf:"2026-11-01",balanceUsd:"2500",source:"statement",sourceRef:"Oct statement, filing cabinet"});
assert.equal(w.balances.length,1);

w=WS.markAlerted(w,["o1","o2","o1"],"2026-11-03");assert.deepEqual(plain(w.previousAlertIds).sort(),["o1","o2"]);
assert.deepEqual(plain(w.changeLog.map(c=>c.action)),["ACCEPT_CATEGORY_PROPOSAL","RECORD_SEARCH","RECORD_SEARCH","OPEN_CLAIM","ADVANCE_CLAIM","ADVANCE_CLAIM","ADD_BALANCE","MARK_ALERTED"]);

// Unknown sections (for example a pasted password) are rejected.
assert.throws(()=>WS.validate({schema:"incomeos.workspace.v1",password:"x"}),/Unrecognized sections: password/);

// Encryption round trip; wrong passphrase and tampering fail closed; short passphrase refused.
const P="correct horse battery staple";
const sealed=await WS.encrypt(P,w);
assert.ok(WS.isEncrypted(sealed));assert.ok(!sealed.includes("Comcast"),"ciphertext does not reveal contents");
assert.deepEqual(plain(await WS.load(sealed,P)),plain(w));
await assert.rejects(WS.load(sealed,"wrong passphrase value"),/Wrong passphrase/);
await assert.rejects(WS.load(sealed,""),/encrypted/);
await assert.rejects(WS.encrypt("short",w),/16 characters/);
const o=JSON.parse(sealed);const d=Buffer.from(o.data,"base64");d[5]^=1;o.data=d.toString("base64");
await assert.rejects(WS.load(JSON.stringify(o),P),/Wrong passphrase or damaged/);
assert.equal((await WS.load(JSON.stringify(base),"")).schema,"incomeos.workspace.v1","plain files still load");
console.log("IncomeOS workspace QA passed (synthetic data): engine-checked updates, append-only change log, AES-GCM round trip, wrong-passphrase and tamper rejection");
