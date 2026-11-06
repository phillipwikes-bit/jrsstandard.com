import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync("owner/incomeos/incomeos.js","utf8");
const dateBody=source.match(/function stale\(s\) \{([\s\S]*?)\n  \}/);
const urlBody=source.match(/function safeUrl\(url\) \{([\s\S]*?)\n  \}/);
assert.ok(dateBody&&urlBody,"Review date and safe-link functions must remain present");
const ctx={Date,URL,String,Number};
const stale=runInNewContext("(function(s){"+dateBody[1]+"})",{...ctx,localDate:()=>day});
const safeUrl=runInNewContext("(function(url){"+urlBody[1]+"})",ctx);
const day=new Date().toISOString().slice(0,10);
// Current day must be accepted, invalid dates and historical dates must not be current.
assert.equal(stale({reviewed:day}),false,"Current review must not be rejected by malformed regex");
assert.equal(stale({reviewed:"2000-01-01"}),true);
assert.equal(stale({reviewed:"2026-02-30"}),true);
assert.equal(safeUrl("https://example.org/apply"),"https://example.org/apply");
for(const value of ["http://example.org","javascript:alert(1)","https://user:pass@example.org","not a url"])assert.equal(safeUrl(value),null);
console.log("Current source dates and HTTPS-only opportunity links validated.");
