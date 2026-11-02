"use strict";
(function () {
  // Cryptographic storage primitive only. Not an authentication or release control.
  // This file is NOT loaded by the staging interface.
  const NAME = "incomeos.owner.encrypted.v1";
  const FORMAT = "incomeos-active-ledger";
  const VERSION = 1;
  const ITERATIONS = 600000;
  const MAX_PLAINTEXT = 2000000;
  const MAX_ENVELOPE = 4000000;
  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8", { fatal: true });

  function storageOK(storage) {
    if (!storage || typeof storage.getItem !== "function" ||
        typeof storage.setItem !== "function" || typeof storage.removeItem !== "function")
      throw new Error("A browser storage adapter is required.");
    return storage;
  }
  function permitted() {
    if (window.IncomeOSFinancialReadOnly !== false)
      throw new Error("Encrypted financial writes are unavailable until the separate owner-only release gate approves them.");
  }
  // Use browser-provided cross-tab exclusive locking for all writes.
  // Missing Web Locks must block writes, not fall back to unsafe localStorage.
  async function withWriteLock(action) {
    if (typeof navigator === "undefined" || !navigator.locks ||
        typeof navigator.locks.request !== "function")
      throw new Error("Exclusive browser storage locking is unavailable; encrypted writes remain disabled.");
    return navigator.locks.request(NAME, { mode: "exclusive" }, action);
  }
  function checkPassphrase(passphrase) {
    if (typeof passphrase !== "string" || passphrase.length < 16 ||
        passphrase.length > 1024)
      throw new Error("A unique passphrase between 16 and 1024 characters is required.");
    return passphrase;
  }
  function b64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function bytes(input, count) {
    if (typeof input !== "string" || input.length > MAX_ENVELOPE ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input))
      throw new Error("Invalid encoded vault data.");
    const s = atob(input);
    if (count && s.length !== count) throw new Error("Invalid cryptographic parameter length.");
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function validateData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        data.version !== 1 || !Array.isArray(data.entries) ||
        data.entries.length > 15000)
      throw new Error("Invalid owner ledger format.");
    if (data.entries.some(e => !e || typeof e !== "object" || Array.isArray(e) ||
        typeof e.kind !== "string" || typeof e.date !== "string" ||
        typeof e.label !== "string"))
      throw new Error("Invalid individual ledger entry.");
    const packed = JSON.stringify(data);
    if (enc.encode(packed).length > MAX_PLAINTEXT)
      throw new Error("Owner ledger is above the encrypted-storage limit.");
    return packed;
  }
  function parseEnvelope(raw) {
    if (typeof raw !== "string" || raw.length > MAX_ENVELOPE) throw new Error("Vault is missing or too large.");
    let v;
    try { v = JSON.parse(raw); } catch (_err) { throw new Error("Invalid vault encoding."); }
    if (!v || v.format !== FORMAT || v.version !== VERSION ||
        v.kdf !== "PBKDF2-SHA256" || v.iterations !== ITERATIONS ||
        v.cipher !== "AES-256-GCM" || !Number.isSafeInteger(v.revision) ||
        v.revision < 1 || v.revision > Number.MAX_SAFE_INTEGER - 1)
      throw new Error("Unsupported or corrupted owner vault.");
    const salt = bytes(v.salt, 16), nonce = bytes(v.nonce, 12);
    const ciphertext = bytes(v.ciphertext);
    if (ciphertext.length < 17) throw new Error("Owner vault authentication data is incomplete.");
    return { envelope: v, salt, nonce, ciphertext };
  }
  function aad(revision) { return enc.encode(FORMAT + ":" + VERSION + ":" + revision); }
  async function derive(passphrase, salt) {
    const raw = await crypto.subtle.importKey("raw", enc.encode(checkPassphrase(passphrase)),
      { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, hash: "SHA-256", iterations: ITERATIONS },
      raw, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function seal(data, key, salt, revision) {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = enc.encode(validateData(data));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, additionalData: aad(revision), tagLength: 128 },
      key, plaintext);
    return JSON.stringify({ format: FORMAT, version: VERSION,
      kdf: "PBKDF2-SHA256", iterations: ITERATIONS, salt: b64(salt),
      cipher: "AES-256-GCM", nonce: b64(nonce), revision,
      ciphertext: b64(new Uint8Array(cipher)) });
  }
  async function unseal(raw, key) {
    const parsed = parseEnvelope(raw);
    let plaintext;
    try {
      plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: parsed.nonce,
          additionalData: aad(parsed.envelope.revision), tagLength: 128 },
        key, parsed.ciphertext);
    } catch (_err) {
      throw new Error("Passphrase incorrect or vault data corrupted.");
    }
    let obj;
    try { obj = JSON.parse(dec.decode(plaintext)); } catch (_err) {
      throw new Error("Decrypted ledger data is invalid.");
    }
    validateData(obj);
    return { data: obj, revision: parsed.envelope.revision, salt: parsed.salt };
  }
  function session(storage, initialRaw, key, salt, revision, initialData) {
    let activeKey = key, previousRaw = initialRaw, current = initialData, rev = revision, activeSalt = salt;
    let committing = false;
    function ensure() { if (!activeKey || !current) throw new Error("Owner ledger is locked."); }
    return Object.freeze({
      status() { return { unlocked: !!activeKey, revision: activeKey ? rev : null }; },
      snapshot() { ensure(); return JSON.parse(JSON.stringify(current)); },
      async commit(next) {
        permitted(); ensure();
        if (committing) throw new Error("An encrypted ledger save is already in progress.");
        validateData(next);
        if (storage.getItem(NAME) !== previousRaw)
          throw new Error("Encrypted ledger changed in another tab. Unlock the latest version before editing.");
        committing = true;
        const expectedRaw = previousRaw, expectedRevision = rev, initialKey = activeKey;
        try {
          return await withWriteLock(async () => {
            permitted(); ensure();
            if (storage.getItem(NAME) !== expectedRaw)
              throw new Error("Encrypted ledger changed before save. Unlock the latest version before editing.");
            const serialized = await seal(next, activeKey, activeSalt, rev + 1);
            // The exclusive Web Lock spans encryption and the final storage write.
            permitted(); ensure();
            if (initialKey !== activeKey)
              throw new Error("Owner ledger was locked during encryption.");
            if (storage.getItem(NAME) !== expectedRaw || rev !== expectedRevision)
              throw new Error("Encrypted ledger changed during save. Unlock the latest version before editing.");
            // Web Locks coordinate participating same-origin tabs, not external
            // devices or hostile storage modification. Production still requires
            // a trusted server-side compare-and-swap for shared ledgers.
            try { storage.setItem(NAME, serialized); }
            catch (_err) { throw new Error("Encrypted ledger could not be persisted. No entry was accepted."); }
            previousRaw = serialized; current = JSON.parse(JSON.stringify(next)); rev += 1;
            return rev;
          });
        } finally { committing = false; }
      },
      lock() { current = null; activeKey = null; activeSalt = null; previousRaw = null; rev = null; }
    });
  }
  async function create(storage, passphrase, data) {
    permitted(); storageOK(storage); checkPassphrase(passphrase); validateData(data);
    return withWriteLock(async () => {
      permitted();
      if (storage.getItem(NAME) !== null) throw new Error("An encrypted ledger already exists.");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await derive(passphrase, salt);
      const raw = await seal(data, key, salt, 1);
      permitted();
      if (storage.getItem(NAME) !== null) throw new Error("A ledger appeared during setup.");
      try { storage.setItem(NAME, raw); }
      catch (_err) { throw new Error("Could not save encrypted ledger; setup was not completed."); }
      return session(storage, raw, key, salt, 1, JSON.parse(JSON.stringify(data)));
    });
  }
  async function unlock(storage, passphrase) {
    storageOK(storage); checkPassphrase(passphrase);
    const raw = storage.getItem(NAME);
    if (raw === null) throw new Error("No encrypted IncomeOS ledger exists on this device.");
    const parsed = parseEnvelope(raw);
    const key = await derive(passphrase, parsed.salt);
    const opened = await unseal(raw, key);
    if (storage.getItem(NAME) !== raw) throw new Error("Encrypted ledger changed during unlocking.");
    return session(storage, raw, key, opened.salt, opened.revision, opened.data);
  }
  function exists(storage) { return storageOK(storage).getItem(NAME) !== null; }

  window.IncomeOSActiveVault = Object.freeze({ create, unlock, exists, keyName: NAME });
}());
