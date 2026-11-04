// Keeps the owner-facing README consistent with the code on where records are kept and how the app is hosted.
// It checks the record's statements against the page's actual load order; it is not a deployment test.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const readme=readFileSync("owner/incomeos/README.md","utf8"),html=readFileSync("owner/incomeos/index.html","utf8");
const cur=readme.split("## Current hosting and storage")[1];
assert.ok(cur,"README states the current hosting and storage model");
assert.match(cur,/incomeos-opportunity-desk/);assert.match(cur,/All Deployments/);assert.match(cur,/workspace file/);
assert.match(cur,/not yet been independently tested/,"live access denial stays unverified until tested");
// Every statement that records live in browser localStorage must be marked superseded.
for(const line of readme.split("\n").filter(l=>/stored (only )?in (browser )?localStorage/i.test(l)))
  assert.match(line,/^- Superseded \d{4}-\d\d-\d\d/,"stale storage claim not marked: "+line.slice(0,80));
// The claim rests on the interlock loading before the accounting editor and the workspace store.
const at=f=>html.indexOf('src="./'+f+'"');
assert.ok(at("staging-interlock.js")>=0&&at("staging-interlock.js")<at("accountant.js")&&at("staging-interlock.js")<at("workspace-store.js"),"staging interlock loads first");
console.log("IncomeOS records-current checks passed.");
