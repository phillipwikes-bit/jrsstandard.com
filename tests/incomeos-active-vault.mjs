import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";
import { runInNewContext, Script } from "node:vm";

const source = readFileSync("owner/incomeos/active-vault.js", "utf8");
new Script(source, { filename: "active-vault.js" });
const sandbox = { window: { IncomeOSFinancialReadOnly: false }, crypto,
  TextEncoder, TextDecoder, Uint8Array, JSON, Number, String, Array, Object,
  Math, btoa, atob, Error, console };
runInNewContext(source, sandbox);
const api = sandbox.window.IncomeOSActiveVault;
assert.equal(typeof api.create, "function");
assert.equal(typeof api.unlock, "function");

const mem = new Map();
const storage = {
  getItem: k => mem.has(k) ? mem.get(k) : null,
  setItem: (k,v) => { mem.set(k,v); },
  removeItem: k => { mem.delete(k); }
};
const password = "a-long-test-only-not-a-real-passphrase-2026";
const v1 = { version: 1, entries: [
  { id: "synthetic-1", kind: "outflow", date: "2026-11-02", label: "SYNTHETIC VENDOR ONLY", amountUsd: 8.95 }
] };
assert.equal(api.exists(storage), false);
let session = await api.create(storage, password, v1);
assert.equal(api.exists(storage), true);
assert.equal(session.status().unlocked, true);
let ciphertext = storage.getItem(api.keyName);
assert.ok(!ciphertext.includes("SYNTHETIC VENDOR ONLY"), "No plaintext vendor labels in browser storage");
assert.ok(!ciphertext.includes(password), "No passphrase saved");
assert.ok(!ciphertext.includes("amountUsd"), "No plaintext financial schema in browser storage");
assert.equal(session.snapshot().entries.length, 1);
const changed = session.snapshot();
changed.entries[0].label = "changed outside vault";
assert.equal(session.snapshot().entries[0].label, "SYNTHETIC VENDOR ONLY", "Snapshots are defensive copies");
const next = { version: 1, entries: [
  ...v1.entries, { id: "synthetic-2", kind: "income", date: "2026-11-02", label: "SYNTHETIC RESEARCH", grossUsd: 100 }
] };
assert.equal(await session.commit(next), 2);
assert.equal(session.snapshot().entries.length, 2);
ciphertext = storage.getItem(api.keyName);
assert.ok(!ciphertext.includes("SYNTHETIC RESEARCH"), "Updated ledger remains ciphertext");
session.lock();
assert.equal(session.status().unlocked, false);
assert.throws(() => session.snapshot(), /locked/);
session = await api.unlock(storage, password);
assert.equal(session.snapshot().entries.length, 2, "Encrypted records survive a lock/unlock cycle");
session.lock();
await assert.rejects(api.unlock(storage, "incorrect-test-passphrase-xxxx"), /incorrect or vault data corrupted/);
const before = storage.getItem(api.keyName);
const parsed = JSON.parse(before);
parsed.ciphertext = parsed.ciphertext.slice(0, -5) + "AAAAA";
storage.setItem(api.keyName, JSON.stringify(parsed));
await assert.rejects(api.unlock(storage, password), /corrupted|Invalid/);
storage.setItem(api.keyName, before);
const a = await api.unlock(storage, password);
const b = await api.unlock(storage, password);
await a.commit({ version: 1, entries: [] });
await assert.rejects(b.commit(next), /changed in another tab/);
b.lock();
const previous = storage.getItem(api.keyName);
let failWrites = false;
const quotaStorage = {
  getItem: k => storage.getItem(k),
  setItem: (k,v) => { if (failWrites) throw new Error("quota exceeded"); storage.setItem(k,v); },
  removeItem: k => storage.removeItem(k)
};
const c = await api.unlock(quotaStorage, password);
failWrites = true;
await assert.rejects(c.commit(next), /could not be persisted/);
assert.equal(storage.getItem(api.keyName), previous, "Failed save preserves encrypted storage");
assert.equal(c.snapshot().entries.length, 0, "Failed save does not publish uncommitted ledger changes");
c.lock(); a.lock();
sandbox.window.IncomeOSFinancialReadOnly = true;
await assert.rejects(api.create({ ...storage, getItem: () => null }, password, v1), /unavailable/);
const hold = await api.unlock(storage, password);
await assert.rejects(hold.commit(next), /unavailable/);
hold.lock();
assert.throws(() => session.snapshot(), /locked/);
// Simulate a delayed native WebCrypto encryption step. This exercises the
// vulnerable window between first version check and committing ciphertext.
let pauseEncryption = false, releaseEncryption = null, encryptStarted = null;
let startedEncryption = new Promise(resolve => { encryptStarted = resolve; });
const guardedCrypto = {
  getRandomValues: a => crypto.getRandomValues(a),
  subtle: {
    importKey: (...args) => crypto.subtle.importKey(...args),
    deriveKey: (...args) => crypto.subtle.deriveKey(...args),
    encrypt: async (...args) => {
      if (pauseEncryption) {
        pauseEncryption = false;
        encryptStarted();
        await new Promise(resolve => { releaseEncryption = resolve; });
      }
      return crypto.subtle.encrypt(...args);
    },
    decrypt: (...args) => crypto.subtle.decrypt(...args)
  }
};
const guardSandbox = { window: { IncomeOSFinancialReadOnly: false }, crypto: guardedCrypto,
  TextEncoder, TextDecoder, Uint8Array, JSON, Number, String, Array, Object,
  Math, btoa, atob, Error, console };
runInNewContext(source, guardSandbox);
const guardVault = guardSandbox.window.IncomeOSActiveVault;
const guardMap = new Map();
const guardStore = {
  getItem: k => guardMap.has(k) ? guardMap.get(k) : null,
  setItem: (k, v) => { guardMap.set(k, v); },
  removeItem: k => guardMap.delete(k)
};
let guarded = await guardVault.create(guardStore, password, v1);
const guardInitialCiphertext = guardStore.getItem(guardVault.keyName);
pauseEncryption = true;
const delayed = guarded.commit(next);
await startedEncryption;
await assert.rejects(guarded.commit(v1), /already in progress/,
  "Second save in same session cannot overtake ongoing encryption");
guarded.lock();
releaseEncryption();
await assert.rejects(delayed, /locked/,
  "Locking the account during asynchronous encryption blocks the write");
assert.equal(guardStore.getItem(guardVault.keyName), guardInitialCiphertext,
  "No ciphertext written after owner locks the session");
guarded = await guardVault.unlock(guardStore, password);
const competitor = await guardVault.unlock(guardStore, password);
pauseEncryption = true;
startedEncryption = new Promise(resolve => { encryptStarted = resolve; });
const stale = guarded.commit(next);
await startedEncryption;
await competitor.commit({ version: 1, entries: [] });
const competingCiphertext = guardStore.getItem(guardVault.keyName);
releaseEncryption();
await assert.rejects(stale, /changed during save/,
  "Competing tab update during encryption must not be overwritten");
assert.equal(guardStore.getItem(guardVault.keyName), competingCiphertext,
  "Delayed stale save preserves the newer tab's ciphertext");
guarded.lock();
competitor.lock();
console.log("IncomeOS active vault: encrypted-at-rest, independent copy, lock/unlock, wrong password, tamper, rollback-by-conflict, failed write and staging holds passed.");
