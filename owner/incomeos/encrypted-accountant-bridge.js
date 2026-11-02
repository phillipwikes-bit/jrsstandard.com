"use strict";
(function () {
  // Integration layer for future separately authenticated deployment ONLY.
  // Deliberately not loaded by index.html; staging remains read-only.
  const PLAIN_KEY = "incomeos.accountant.v1";
  function releaseHold() {
    if (window.IncomeOSFinancialReadOnly !== false)
      throw new Error("Owner financial operations remain blocked by the staging interlock.");
  }
  function checkAdapter(storage, vault, validateEntry) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.removeItem !== "function")
      throw new Error("A local storage adapter is required.");
    if (!vault || typeof vault.create !== "function" ||
        typeof vault.unlock !== "function" || typeof vault.exists !== "function")
      throw new Error("Encrypted vault implementation is missing.");
    if (typeof validateEntry !== "function")
      throw new Error("Accountant record validation is required.");
  }
  function clone(data) { return JSON.parse(JSON.stringify(data)); }
  function checkEntries(entries, validate) {
    if (!Array.isArray(entries) || entries.length > 15000)
      throw new Error("Unsupported accountant record collection.");
    const seen = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) ||
          typeof entry.id !== "string" || !entry.id || entry.id.length > 128 ||
          seen.has(entry.id) || validate(entry) !== true)
        throw new Error("Invalid or duplicated accountant entry; no ledger change accepted.");
      seen.add(entry.id);
    }
    return clone(entries);
  }
  function openController(storage, vault, validateEntry) {
    checkAdapter(storage, vault, validateEntry);
    let session = null, entries = null;
    function ensure() {
      if (!session || !entries || !session.status().unlocked)
        throw new Error("Accountant ledger is locked.");
    }
    function readLegacyForReview() {
      releaseHold();
      const raw = storage.getItem(PLAIN_KEY);
      if (raw === null) return { exists: false, count: 0, entries: [] };
      if (raw.length > 2200000) throw new Error("Legacy ledger is too large for migration review.");
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (_e) { throw new Error("Legacy ledger is not valid JSON."); }
      if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.entries))
        throw new Error("Unsupported legacy ledger version.");
      const checked = checkEntries(parsed.entries, validateEntry);
      return { exists: true, count: checked.length, entries: checked };
    }
    async function createNew(passphrase, proposedEntries = []) {
      releaseHold();
      if (session) throw new Error("Lock the existing session before opening another.");
      if (vault.exists(storage)) throw new Error("Encrypted accountant ledger already exists.");
      const checked = checkEntries(proposedEntries, validateEntry);
      const active = await vault.create(storage, passphrase, { version: 1, entries: checked });
      // Immediately verify the encrypted result rather than assuming a successful write.
      try {
        const record = active.snapshot();
        checkEntries(record.entries, validateEntry);
        session = active; entries = checked;
        return { count: checked.length, encrypted: true, legacyPreserved: storage.getItem(PLAIN_KEY) !== null };
      } catch (err) { active.lock(); throw err; }
    }
    async function unlock(passphrase) {
      releaseHold();
      if (session) throw new Error("Lock the current session before unlocking again.");
      const active = await vault.unlock(storage, passphrase);
      try {
        const record = active.snapshot();
        if (record.version !== 1) throw new Error("Unknown encrypted ledger schema.");
        const checked = checkEntries(record.entries, validateEntry);
        session = active; entries = checked;
        return { count: checked.length, encrypted: true };
      } catch (err) { active.lock(); throw err; }
    }
    async function commit(proposedEntries) {
      releaseHold(); ensure();
      const checked = checkEntries(proposedEntries, validateEntry);
      // Do not change any in-memory or persisted state before authenticated encryption completes.
      const revision = await session.commit({ version: 1, entries: checked });
      entries = checked;
      return { count: entries.length, revision };
    }
    function getEntries() { ensure(); return clone(entries); }
    function lock() {
      if (session) session.lock();
      session = null; entries = null;
    }
    return Object.freeze({
      readLegacyForReview, createNew, unlock, commit, getEntries, lock,
      status() { return { unlocked: !!session && !!session.status().unlocked, encrypted: true,
        legacyPresent: storage.getItem(PLAIN_KEY) !== null }; }
    });
  }
  window.IncomeOSEncryptedAccountantBridge = Object.freeze({ openController });
}());
