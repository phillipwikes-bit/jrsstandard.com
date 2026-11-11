"use strict";
// Explicit negative release gate. Passing staging tests never authorizes deployment.
const assert=require("node:assert/strict");
const {readFileSync}=require("node:fs");
const {resolve}=require("node:path");
const read=p=>readFileSync(resolve(__dirname,"..",p),"utf8");
const acceptance=JSON.parse(read("owner/incomeos/ACCOUNTING-EDITOR-ACCEPTANCE.json"));
assert.equal(acceptance.milestoneComplete,false,"No unverified accounting milestone completion");
for(const id of ["A14","A16"]){
  const item=acceptance.items.find(x=>x.id===id);
  assert.ok(item,"Missing acceptance control "+id);
  assert.equal(item.status,"BLOCKED",id+" cannot be implicitly released by source or CI tests");
}
const storage=acceptance.items.find(x=>x.id==="A14");
assert.match(storage.limitation,/not been migrated to the live database/);
assert.match(storage.limitation,/real owner save-and-restore/);
const html=read("owner/incomeos/index.html");
for(const script of ["revision-store.js","revision-supabase-transport.js","revision-workspace-bridge.js","revision-runtime-staging.js","revision-accounting-coordinator.js","revision-preview-config.js","revision-preview.js"]){
  assert.ok(!html.includes('src="./'+script+'"'),"Staging revision script cannot load in live Owner Desk: "+script);
}
assert.match(read("engineering/incomeos/workspace-revision-staging.sql"),/STAGING ONLY/);
assert.match(read("engineering/incomeos/workspace-revision-rpc-staging.sql"),/STAGING ONLY/);
assert.match(read("owner/incomeos/revision-workspace-bridge.js"),/Staging-only bridge/);
console.log("PASS: IncomeOS revision staging cannot silently satisfy owner release or production acceptance");
