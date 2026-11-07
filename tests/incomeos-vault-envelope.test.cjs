"use strict";
const assert=require("node:assert/strict");
const vault=require("../owner/incomeos/vault-cloud.js");
const valid={format:"incomeos-workspace",version:1,kdf:"PBKDF2-SHA256",iterations:600000,cipher:"AES-256-GCM",salt:"AAAAAAAAAAAAAAAAAAAAAA==",iv:"AAAAAAAAAAAAAAAA",data:"AAAAAAAAAAAAAAAAAAAAAA=="};
assert.equal(vault.assertEncrypted(JSON.stringify(valid)).version,1);
for(const [field,value] of [["version",2],["kdf","PBKDF2-SHA1"],["iterations",1],["cipher","AES-128-GCM"],["salt","short"],["iv","short"],["data",""]]){
  assert.throws(()=>vault.assertEncrypted(JSON.stringify({...valid,[field]:value})),/Refused/,"must reject invalid "+field);
}
assert.throws(()=>vault.assertEncrypted(JSON.stringify({...valid,ledger:[]})),/Refused/);
console.log("PASS: cloud vault rejects malformed and downgraded envelopes");
