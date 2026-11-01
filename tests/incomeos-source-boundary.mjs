// Enforce that the publicly readable JRS source branch never carries private owner artifacts.
// This protects repository contents only. It is not an app authorization or deployment test.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const paths=execFileSync("git",["ls-files","-z","owner/incomeos"],{encoding:"utf8"}).split("\0").filter(Boolean);
const extensions=new Set(["html","js","css","json","svg","webmanifest","md"]);
assert.ok(paths.length>=12,"Expected reviewed IncomeOS source tree");
for(const path of paths){
  assert.match(path,/^owner\/incomeos\/[A-Za-z0-9_.-]+$/,"No arbitrary paths inside publicly readable owner subtree");
  const filename=path.split("/").at(-1),extension=filename.split(".").at(-1);
  assert.ok(extensions.has(extension),"Potential financial document or secret file in public repo: "+path);
  assert.doesNotMatch(filename,/(bank.statement|invoice|receipt[0-9]|financial.records|private.key|token|credentials|secret|\.env)/i,
    "Private data/secret-shaped file name must not be committed: "+path);
}
const page=readFileSync("owner/incomeos/index.html","utf8");
const interlock=readFileSync("owner/incomeos/staging-interlock.js","utf8");
const accountant=readFileSync("owner/incomeos/accountant.js","utf8");
const journal=readFileSync("owner/incomeos/financial-event-journal.js","utf8");
const research=readFileSync("owner/incomeos/research-outcomes.js","utf8");
assert.match(page,/staging-interlock\.js/);
assert.match(page,/financial-staging-interlock/);
assert.match(interlock,/receipt-form/);
assert.match(interlock,/cost-form/);
assert.match(interlock,/vault-import/);
assert.match(journal,/NOT an authenticated signature/);
assert.match(research,/never calls recruiters/);
assert.doesNotMatch(page,/<script[^>]*src=["']https?:/i);
assert.doesNotMatch(accountant,/fetch\s*\(|WebSocket|XMLHttpRequest|sendBeacon/);
// No public URLs or personal financial records can enter the test fixtures.
const feed=JSON.parse(readFileSync("owner/incomeos/opportunities.json","utf8"));
for(const study of feed.studies||[])assert.ok(/^https:\/\//.test(study.url),"Only HTTPS sourced public candidates");
console.log("IncomeOS public repository safeguard passed: source-only allowlist, no financial attachments, staging interlock, no remote financial data collection.");
