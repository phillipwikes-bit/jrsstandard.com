// Staging privacy boundary checks. Synthetic assertions, no owner records included.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {Script} from "node:vm";
const read=p=>readFileSync(resolve("owner/incomeos",p),"utf8");
const html=read("index.html");
const scripts=["staging-interlock.js","incomeos.js","accountant.js","research-ui.js","spend-ui.js","vault.js"];
for(const file of scripts)new Script(read(file),{filename:file});
const guard=read("staging-interlock.js");
assert.match(guard,/window\.IncomeOSFinancialReadOnly=true/);
const guardPosition=html.indexOf('<script defer src="./staging-interlock.js">');
assert.ok(guardPosition>0);
for(const name of scripts.filter(x=>x!=="staging-interlock.js"))
  assert.ok(guardPosition<html.indexOf('<script defer src="./'+name+'">'),
    "Staging guard must run before "+name);
const accountant=read("accountant.js");
assert.match(accountant,/function commitEntries\(entries\)/);
assert.match(accountant,/try\{localStorage\.setItem\(KEY,JSON\.stringify\(next\)\);\}/);
assert.match(accountant,/db=next/);
assert.match(accountant,/Financial changes are disabled in unapproved staging/);
assert.match(accountant,/Financial import is disabled in unapproved staging/);
assert.match(accountant,/Financial restoration is disabled in unapproved staging/);
const vault=read("vault.js");
assert.match(vault,/IncomeOSFinancialReadOnly!==false\)throw new Error\("Restore disabled/,"vault restore fails closed unless the lock is explicitly released");
const main=read("incomeos.js");
assert.match(main,/function save\(\) \{\s*if\(window\.IncomeOSFinancialReadOnly===true\)return false/);
assert.match(main,/state\.stages = window\.IncomeOSFinancialReadOnly===true \? \{\}/);
assert.match(main,/state\.receipts = window\.IncomeOSFinancialReadOnly===true \? \[\]/);
assert.match(main,/select\.disabled=true/);
assert.match(main,/b\.disabled=true/);
assert.match(main,/localStorage\.removeItem\(STORE_KEY\)/);
assert.doesNotMatch(main,/state = \{ saved: \[\], stages: \{\}, receipts: \[\] \}; save\(\)/);
const radar=read("research-ui.js");
assert.match(radar,/function load\(\)\{\s*if\(window\.IncomeOSFinancialReadOnly===true\)return/);
assert.match(radar,/function persist\(\)\{if\(window\.IncomeOSFinancialReadOnly===true\)/);
assert.match(radar,/sel\.disabled=true/);
// Changed 2026-11-05: public study files may be loaded into page memory while storage is blocked. The import's
// memory-only branch must return before persist(), so nothing reaches browser storage; a browser test confirms it.
assert.match(radar,/var memoryOnly=window\.IncomeOSFinancialReadOnly===true;/);
{const i=radar.indexOf("if(memoryOnly){"),j=radar.indexOf("return;}",i),branch=radar.slice(i,j);
 assert.ok(i>0&&j>i&&radar.indexOf("if(persist())",j)>j,"memory-only branch returns before persist()");
 assert.doesNotMatch(branch,/persist\(|localStorage|sessionStorage|indexedDB/,"memory-only branch never writes browser storage");
 assert.match(branch,/nothing was stored/);}
const spend=read("spend-ui.js");
assert.match(spend,/function load\(\)\{\s*if\(window\.IncomeOSFinancialReadOnly===true\)return/);
assert.match(spend,/function save\(\)\{if\(window\.IncomeOSFinancialReadOnly===true\)/);
assert.match(spend,/spend-budget-form","spend-plan-form/);
assert.match(spend,/Read-only staging/);
assert.doesNotMatch(html,/<script[^>]+src=["']https?:/);
console.log("IncomeOS staging privacy QA passed: early interlock, blocked financial, participation, research and budget writes, safe erasure, and no outside scripts.");
