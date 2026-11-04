// Synthetic-only regression checks for the review of vault.js, vault-ui.js and active-vault.js.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
import {runInNewContext} from "node:vm";
const read=p=>readFileSync("owner/incomeos/"+p,"utf8");
const fake={window:{IncomeOSFinancialReadOnly:false},crypto:webcrypto,TextEncoder,TextDecoder,btoa,atob,Uint8Array,Date,JSON,Object,Array,String,Error};
runInNewContext(read("vault.js"),fake);
const V=fake.window.IncomeOSVault,pass="synthetic backup passphrase for tests";
const store=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)});
const ledger=JSON.stringify({version:2,entries:[{id:"synthetic"}]});
const envelope=JSON.stringify({format:"incomeos-active-ledger",version:1,data:"AAAA"});

// R9-3: restoring an older backup keeps data sets it does not contain.
{const live=new Map([["incomeos.accountant.v1",ledger],["incomeos.research.radar.v1",JSON.stringify({version:1,preferences:{},leads:[],progress:{}})]]);
 const old={version:1,values:{"incomeos.accountant.v1":ledger}};
 V.restore(store(live),old);
 assert.ok(live.has("incomeos.research.radar.v1"),"data set absent from the backup is kept");
 assert.deepEqual([...V.retained(store(live),{version:1,values:{"incomeos.accountant.v1":ledger}})],["incomeos.research.radar.v1"]);}
// R9-4: the backup includes the encrypted active ledger and round-trips it.
{const m=new Map([["incomeos.accountant.v1",ledger],["incomeos.owner.encrypted.v1",envelope]]);
 const rec=V.capture(store(m));
 assert.equal(rec.values["incomeos.owner.encrypted.v1"],envelope);
 const back=await V.decrypt(pass,await V.encrypt(pass,rec));
 assert.equal(back.values["incomeos.owner.encrypted.v1"],envelope);}
// R9-5: one damaged data set is left out and reported; the rest still back up.
{const m=new Map([["incomeos.accountant.v1",ledger],["incomeos.research.radar.v1","{truncated"]]);
 const rec=V.capture(store(m));
 assert.deepEqual([...rec.skipped],["incomeos.research.radar.v1"]);
 assert.equal(rec.values["incomeos.accountant.v1"],ledger);
 await V.encrypt(pass,rec);}
// R9-10: malformed base64 gets the module's own error.
{const good=JSON.parse(await V.encrypt(pass,{version:1,values:{"incomeos.accountant.v1":ledger}}));
 await assert.rejects(V.decrypt(pass,JSON.stringify({...good,salt:"AAAAA"})),/Invalid backup encoding/);}
// R9-2: restore fails closed when the staging lock is undefined.
{const f2={...fake,window:{}};runInNewContext(read("vault.js"),f2);
 assert.throws(()=>f2.window.IncomeOSVault.restore(store(new Map()),{version:1,values:{"incomeos.accountant.v1":ledger}}),/Restore disabled/);}
// R9-1: the restore message distinguishes an incomplete rollback from a bad passphrase.
assert.match(read("vault-ui.js"),/rollback was incomplete/);
// R9-7: a commit saves and keeps the data as it was when commit was called.
{const locks=new Map();const navigator={locks:{request(n,o,cb){const p=(locks.get(n)||Promise.resolve()).catch(()=>{}).then(cb);locks.set(n,p.catch(()=>{}));return p;}}};
 const sb={window:{IncomeOSFinancialReadOnly:false},navigator,crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,JSON,Number,String,Array,Object,Math,btoa,atob,Error,console};
 runInNewContext(read("active-vault.js"),sb);const A=sb.window.IncomeOSActiveVault;
 const mem=new Map(),st=store(mem),pw="a-long-test-only-not-a-real-passphrase-2026";
 const s=await A.create(st,pw,{version:1,entries:[{id:"a",kind:"outflow",date:"2026-11-02",label:"SYNTHETIC",amountUsd:1}]});
 const next={version:1,entries:[{id:"a",kind:"outflow",date:"2026-11-02",label:"SYNTHETIC",amountUsd:1},{id:"b",kind:"outflow",date:"2026-11-03",label:"SECOND",amountUsd:2}]};
 const pending=s.commit(next);next.entries.push({id:"c",kind:"outflow",date:"2026-11-04",label:"LATE EDIT",amountUsd:3});await pending;
 assert.equal(s.snapshot().entries.length,2,"memory matches what was saved");
 const fresh=await A.unlock(st,pw);assert.equal(fresh.snapshot().entries.length,2);}
console.log("IncomeOS vault review checks passed (7 findings fixed; plaintext retention, storage-key list and helper duplication left for owner decision or later).");
