import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { Script, runInNewContext } from "node:vm";

const bridgeSource = readFileSync("owner/incomeos/encrypted-accountant-bridge.js","utf8");
const vaultSource = readFileSync("owner/incomeos/active-vault.js","utf8");
const accountantSource = readFileSync("owner/incomeos/accountant.js","utf8");
for (const [file, code] of [["bridge",bridgeSource],["vault",vaultSource],["accountant",accountantSource]])
  new Script(code,{filename:file+".js"});
const queue = new Map();
const navigator = { locks: { request(name, options, action) {
  assert.equal(options.mode,"exclusive");
  const previous=queue.get(name)||Promise.resolve();
  const next=previous.catch(()=>{}).then(action);
  queue.set(name,next.catch(()=>{}));
  return next;
}}};
const env = { window:{IncomeOSFinancialReadOnly:false},
  navigator, crypto, TextEncoder, TextDecoder, Uint8Array, JSON, Number, String,
  Array, Object, Math, Intl, Date, Set, Error, console, btoa, atob };
runInNewContext(accountantSource,env);
runInNewContext(vaultSource,env);
runInNewContext(bridgeSource,env);
const validate = env.window.IncomeOSAccountant.validateEntry;
assert.equal(typeof validate,"function","Use the real accountant data validation");
const Bridge = env.window.IncomeOSEncryptedAccountantBridge;
const Vault = env.window.IncomeOSActiveVault;
assert.ok(Bridge && Vault);
const state = new Map();
let failWrites=false;
const storage={
  getItem:k=>state.has(k)?state.get(k):null,
  setItem:(k,v)=>{if(failWrites&&k===Vault.keyName)throw Error("synthetic quota");state.set(k,v);},
  removeItem:k=>state.delete(k)
};
const passphrase="a-synthetic-owner-test-passphrase-2026";
const expense={id:"expense-1",kind:"outflow",label:"Synthetic AI subscription",payer:"Test vendor",
  category:"software",date:"2026-11-01",type:"expense",amountUsd:20.60,
  businessUse:null,evidenceStatus:"missing",reference:"synthetic-source-A",notes:"review",reconciled:false};
const income={id:"income-1",kind:"income",label:"Synthetic paid study",payer:"Test recruiter",
  category:"research",date:"2026-11-02",amountOriginal:150,currency:"USD",fx:1,
  grossUsd:150,feesUsd:0,status:"paid",scope:"income",method:"PayPal",
  taxForm:"None / unknown",docStatus:"not-expected",reference:"synthetic-source-B",notes:"",reconciled:false};
assert.equal(validate(expense),true);assert.equal(validate(income),true);
const rawLegacy=JSON.stringify({version:2,entries:[expense,income]});
storage.setItem("incomeos.accountant.v1",rawLegacy);
const owner=Bridge.openController(storage,Vault,validate);
const review=owner.readLegacyForReview();
assert.equal(review.exists,true);assert.equal(review.count,2);
review.entries[0].label="tampered-copy";
assert.equal(owner.readLegacyForReview().entries[0].label,expense.label,"Legacy review must be a defensive copy");
assert.equal(Vault.exists(storage),false,"Migration review does not automatically create a vault");
await assert.rejects(owner.createNew(passphrase,[expense,expense]),/duplicated/);
await assert.rejects(owner.createNew(passphrase,[{...expense,date:"2026-02-30"}]),/Invalid/);
assert.equal(Vault.exists(storage),false);
const created=await owner.createNew(passphrase,owner.readLegacyForReview().entries);
assert.equal(created.count,2);assert.equal(created.legacyPreserved,true,"Do not erase plaintext evidence before owner-approved migration");
assert.equal(owner.status().unlocked,true);
const encrypted=storage.getItem(Vault.keyName);
assert.ok(encrypted.includes("AES-256-GCM"));
for(const marker of ["Synthetic AI subscription","Synthetic paid study","synthetic-source-A"])
  assert.ok(!encrypted.includes(marker),"Source details cannot appear in the ciphertext envelope");
assert.equal(storage.getItem("incomeos.accountant.v1"),rawLegacy);
const snapshot=owner.getEntries();
snapshot[0].label="edited-copy";
assert.equal(owner.getEntries()[0].label,expense.label);
const next=owner.getEntries().concat([{...expense,id:"expense-2",label:"Another invoice",reference:"synthetic-source-C"}]);
failWrites=true;
await assert.rejects(owner.commit(next),/could not be persisted/);
assert.equal(owner.getEntries().length,2,"Failed save must not update the accountant view");
assert.equal(storage.getItem(Vault.keyName),encrypted);
failWrites=false;
assert.deepEqual(JSON.parse(JSON.stringify(await owner.commit(next))),{count:3,revision:2});
assert.equal(owner.getEntries().length,3);
owner.lock();
assert.equal(owner.status().unlocked,false);
assert.throws(()=>owner.getEntries(),/locked/);
await assert.rejects(owner.unlock("incorrect-owner-passphrase-2026"),/incorrect or vault data corrupted/);
const opened=await owner.unlock(passphrase);
assert.equal(opened.count,3);
const competing=Bridge.openController(storage,Vault,validate);
await competing.unlock(passphrase);
const changed=owner.getEntries().slice(0,2);
await owner.commit(changed);
await assert.rejects(competing.commit(next),/changed (before|during) save|changed in another tab/);
assert.equal(owner.getEntries().length,2);
competing.lock();
owner.lock();
env.window.IncomeOSFinancialReadOnly=true;
assert.throws(()=>owner.readLegacyForReview(),/blocked/);
await assert.rejects(owner.unlock(passphrase),/blocked/);
await assert.rejects(owner.createNew(passphrase,[]),/blocked/);
assert.equal(storage.getItem("incomeos.accountant.v1"),rawLegacy,"No automatic plaintext deletion");
console.log("IncomeOS encrypted accountant bridge passed: approved schema, legacy review, ciphertext-only saves, wrong password, no unapproved deletion, concurrent edits, quota failure and staging hold.");
