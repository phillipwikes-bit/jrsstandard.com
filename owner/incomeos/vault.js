"use strict";
(function () {
  // Encrypted export protects the downloaded backup, NOT unencrypted browser localStorage.
  var KEYS = Object.freeze(["incomeos.accountant.v1", "incomeos.owner.prototype.v1"]);
  var ITERATIONS = 600000;
  var FORMAT = "incomeos-local-backup";
  var encoder = new TextEncoder();
  var decoder = new TextDecoder("utf-8", {fatal:true});
  function base64(bytes) {
    var binary = ""; for (var i=0; i<bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function fromBase64(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length > 12000000) throw new Error("Invalid backup encoding");
    var data = atob(value), result = new Uint8Array(data.length);
    for (var i=0;i<data.length;i++) result[i]=data.charCodeAt(i);
    return result;
  }
  function secret(passphrase) {
    if (typeof passphrase !== "string" || passphrase.length < 16 || passphrase.length > 1024) throw new Error("Use a passphrase of at least 16 characters.");
    return passphrase;
  }
  async function key(passphrase,salt) {
    var material = await crypto.subtle.importKey("raw",encoder.encode(secret(passphrase)),{name:"PBKDF2"},false,["deriveKey"]);
    return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:ITERATIONS,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  function capture(storage) {
    var values = {};
    KEYS.forEach(function(k){var v = storage.getItem(k);if(v!==null){JSON.parse(v);values[k]=v;}});
    return {version:1,createdAt:new Date().toISOString(),values:values};
  }
  function verify(record) {
    if (!record || record.version!==1 || !record.values || typeof record.values!=="object" || Array.isArray(record.values)) throw new Error("Invalid IncomeOS backup schema.");
    var keys = Object.keys(record.values);
    if (keys.length>KEYS.length || keys.some(function(k){return !KEYS.includes(k);})) throw new Error("Backup contains an unsupported storage key.");
    keys.forEach(function(k){
      var v=record.values[k];if(typeof v!=="string"||v.length>2000000)throw new Error("Invalid record size.");
      var obj=JSON.parse(v);
      if (!obj || typeof obj!=="object" || Array.isArray(obj)) throw new Error("Invalid stored data object.");
      if (k==="incomeos.accountant.v1" && (!Array.isArray(obj.entries)||obj.entries.length>15000)) throw new Error("Invalid accountant ledger.");
      if (k==="incomeos.owner.prototype.v1" && (obj.saved!==undefined&&!Array.isArray(obj.saved)))throw new Error("Invalid saved opportunity data.");
    });
    return record;
  }
  async function encrypt(passphrase,record) {
    verify(record);
    var salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
    var plaintext=encoder.encode(JSON.stringify(record));
    if(plaintext.byteLength>4000000)throw new Error("Backup exceeds the 4 MB encrypted limit.");
    var ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv:iv},await key(passphrase,salt),plaintext);
    return JSON.stringify({format:FORMAT,version:1,kdf:"PBKDF2-SHA256",iterations:ITERATIONS,cipher:"AES-256-GCM",salt:base64(salt),iv:base64(iv),data:base64(new Uint8Array(ciphertext))});
  }
  async function decrypt(passphrase,encoded) {
    if(typeof encoded!=="string"||encoded.length>8000000)throw new Error("Backup file is missing or too large.");
    var obj=JSON.parse(encoded);
    if(!obj||obj.format!==FORMAT||obj.version!==1||obj.kdf!=="PBKDF2-SHA256"||obj.cipher!=="AES-256-GCM"||obj.iterations!==ITERATIONS)throw new Error("Unrecognized encrypted backup format.");
    var salt=fromBase64(obj.salt),iv=fromBase64(obj.iv);
    if(salt.byteLength!==16||iv.byteLength!==12)throw new Error("Invalid encryption parameters.");
    var encrypted=fromBase64(obj.data);
    var data=await crypto.subtle.decrypt({name:"AES-GCM",iv:iv},await key(passphrase,salt),encrypted);
    return verify(JSON.parse(decoder.decode(data)));
  }
  function restore(storage,record) {
    verify(record);
    // Call only after explicit user confirmation; unknown keys are never imported.
    KEYS.forEach(function(k){if(Object.prototype.hasOwnProperty.call(record.values,k))storage.setItem(k,record.values[k]);else storage.removeItem(k);});
  }
  window.IncomeOSVault = Object.freeze({capture:capture,encrypt:encrypt,decrypt:decrypt,restore:restore,verify:verify});
}());