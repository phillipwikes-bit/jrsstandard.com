import assert from "node:assert/strict";
import { test } from "node:test";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const values = new Map();
const env = {
  crypto: webcrypto,
  Uint8Array, TextEncoder, TextDecoder, btoa, atob,
  localStorage: {
    getItem(k) { return values.has(k) ? values.get(k) : null; },
    setItem(k, v) { values.set(String(k), String(v)); },
    removeItem(k) { values.delete(k); }
  },
  module: { exports: {} }
};
vm.runInNewContext(
  readFileSync(new URL("../owner/incomeos/contact-profile.js", import.meta.url), "utf8"),
  env, { filename: "contact-profile.js" }
);
const c = env.module.exports;
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
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), fake);
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


test("iPhone contact card exports only approved contact fields, without screener data", () => {
  const card = c.contactCard({...fake, cityState:"Testville, MD 21000"});
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.match(card, /FN:Test Person\r\nN:Person;Test;;;\r\n/);
  assert.match(card, /EMAIL;TYPE=INTERNET:test@example.invalid/);
  assert.match(card, /TEL;TYPE=CELL:555-0100/);
  assert.match(card, /ADR;TYPE=HOME:;;;Testville;MD;21000;/);
  assert.ok(card.endsWith("END:VCARD\r\n"));
  assert.ok(!card.includes(fake.qualifications));
  assert.ok(!card.includes(pw));
  assert.ok(!card.includes("LinkedIn"));
});

test("contact card refuses missing names and escapes embedded line breaks", () => {
  assert.throws(() => c.contactCard({...fake, fullName:""}), /full name/i);
  const card = c.contactCard({...fake, fullName:"Demo\nEMAIL:unauthorized@example.invalid"});
  assert.equal(card.split("\r\nEMAIL;TYPE=INTERNET:").length-1, 1);
  assert.ok(card.includes("FN:Demo\\nEMAIL:unauthorized@example.invalid"));
  assert.ok(!card.includes("\r\nEMAIL:unauthorized@example.invalid"));
});
