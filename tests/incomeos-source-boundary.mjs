// Enforce that the publicly readable JRS source branch never carries private owner artifacts.
// This protects repository contents only. It is not an app authorization or deployment test.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const paths=execFileSync("git",["ls-files","-z","owner/incomeos"],{encoding:"utf8"}).split("\0").filter(Boolean);
const extensions=new Set(["html","js","css","json","svg","webmanifest","md","sql"]);
assert.ok(paths.length>=12,"Expected reviewed IncomeOS source tree");
for(const path of paths){
  assert.match(path,/^owner\/incomeos\/[A-Za-z0-9_.-]+$/,"No arbitrary paths inside publicly readable owner subtree");
  const filename=path.split("/").at(-1),extension=filename.split(".").at(-1);
  assert.ok(extensions.has(extension),"Potential financial document or secret file in public repo: "+path);
  assert.doesNotMatch(filename,/(bank.statement|invoice|receipt[0-9]|financial.records|private.key|token|credentials|secret|\.env)/i,
    "Private data/secret-shaped file name must not be committed: "+path);
}
const privateSql=readFileSync("owner/incomeos/OWNER-PRIVATE-SCHEMA.sql","utf8");
assert.match(privateSql,/Not applied to any database/);
assert.match(privateSql,/revoke all on schema incomeos_private from anon/i);
assert.match(privateSql,/single_slot smallint not null default 1 unique/i);
assert.match(privateSql,/security definer\s+set search_path = ''/i);
assert.match(privateSql,/grant select on table incomeos_private.financial_events to authenticated/i);
assert.match(privateSql,/grant select on table incomeos_private.evidence_index to authenticated/i);
assert.doesNotMatch(privateSql,/grant (?:select,\s*)?insert on table incomeos_private\./i,"Direct browser inserts forbidden");
assert.doesNotMatch(privateSql,/for insert to authenticated/i,"Financial journal and evidence must not allow client insert policies");
assert.match(privateSql,/force row level security/);
assert.match(privateSql,/create policy "incomeos_owner_read_events"/);
assert.match(privateSql,/before update or delete on incomeos_private.financial_events/i);
assert.doesNotMatch(privateSql,/insert into incomeos_private.allowed_owners/i,"Never commit an owner identity seed");
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
