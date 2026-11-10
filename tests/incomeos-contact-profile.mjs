import assert from "node:assert/strict";
import { test } from "node:test";
import { webcrypto } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.crypto = webcrypto;

const values = new Map();
globalThis.localStorage = {
  getItem(k) { return values.has(k) ? values.get(k) : null; },
  setItem(k, v) { values.set(String(k), String(v)); },
  removeItem(k) { values.delete(k); }
};
const c = require("../owner/incomeos/contact-profile.js");
const fake = {
  fullName: "Test Person", email: "test@example.invalid",
  phone: "555-0100", cityState: "Testville, MD",
  qualifications: "Research participant", linkedin: ""
};
const pw = "this-is-a-fake-test-passphrase";

test("explicit encrypted storage survives reload of contact module", async () => {
  c.remove();
  assert.equal(c.hasSaved(), false);
  await c.save(fake, pw);
  assert.equal(c.hasSaved(), true);
  const stored = values.get(c.STORAGE_KEY);
  assert.ok(stored);
  assert.ok(!stored.includes(fake.fullName));
  assert.ok(!stored.includes(fake.email));
  assert.ok(!stored.includes(fake.phone));
  assert.ok(!stored.includes(pw));
  const restored = await c.unlock(pw);
  assert.deepEqual(restored, fake);
});

test("wrong passphrase fails without destroying saved profile", async () => {
  await assert.rejects(c.unlock("incorrect-passphrase-of-sufficient-length"));
  const restored = await c.unlock(pw);
  assert.equal(restored.fullName, fake.fullName);
});

test("new saves use fresh salt and IV and preserve edits", async () => {
  const before = JSON.parse(values.get(c.STORAGE_KEY));
  await c.save({...fake, phone:"555-0199"}, pw);
  const after = JSON.parse(values.get(c.STORAGE_KEY));
  assert.notEqual(before.salt, after.salt);
  assert.notEqual(before.iv, after.iv);
  assert.equal((await c.unlock(pw)).phone, "555-0199");
});

test("tampered ciphertext is rejected, then saved copy can be deleted", async () => {
  const before = values.get(c.STORAGE_KEY);
  const obj = JSON.parse(before);
  obj.data = obj.data.slice(0, -4) + "AAAA";
  values.set(c.STORAGE_KEY, JSON.stringify(obj));
  await assert.rejects(c.unlock(pw));
  values.set(c.STORAGE_KEY, before);
  c.remove();
  assert.equal(c.hasSaved(), false);
  await assert.rejects(c.unlock(pw));
});

test("contact block is owner-editable data only, not screener answers", () => {
  const block = c.formatContact(fake);
  assert.ok(block.startsWith("CONTACT INFORMATION"));
  assert.ok(block.includes("Full name: Test Person"));
  assert.ok(block.includes("Email: test@example.invalid"));
  assert.ok(!/eligible:|approved:|applied:|income bracket:/i.test(block));
  assert.throws(() => c.clean({fullName:"Test"}));
  assert.throws(() => c.clean({...fake, fullName:"x".repeat(501)}));
});

test("short passphrase cannot create a saved copy", async () => {
  await assert.rejects(c.save(fake, "too-short"));
  assert.equal(c.hasSaved(), false);
});
