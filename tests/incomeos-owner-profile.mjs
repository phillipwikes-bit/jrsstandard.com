// IncomeOS owner-profile privacy, safe rendering and discovery-isolation checks.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync,spawnSync} from "node:child_process";
import vm from "node:vm";
const read=f=>readFileSync(new URL("../"+f,import.meta.url),"utf8");

// 1. The committed template carries no owner data and cannot produce an eligible result.
const tpl=JSON.parse(read("owner/incomeos/owner-profile.template.json"));
assert.equal(tpl.schema,"incomeos.owner-profile.v1");
const tplText=JSON.stringify(tpl);
const wsTpl=JSON.stringify(JSON.parse(read("owner/incomeos/owner-workspace.template.json")));
for(const s of ["Baltimore","Wheeling","Commission","Wikes"])assert.ok(!wsTpl.includes(s),"workspace template has no owner data: "+s);
for(const s of ["Baltimore","Wheeling","Commission on Civil Rights","Moral Reconation","\"MD\"","Wikes"])assert.ok(!tplText.includes(s),"template must not contain owner data: "+s);
assert.doesNotMatch(tplText,/"status":"documented"/,"template has no documented evidence");
const ctx={window:{},URL,WeakSet};
for(const f of ["eligibility-engine.js","listing-requirements.js","compensation.js","opportunity-normalizer.js","project-radar.js"])vm.runInNewContext(read("owner/incomeos/"+f),ctx);
const d=ctx.window.IncomeOSEligibility.evaluate({id:"x",platform:"P",employer:"E",remoteMode:"remote",requirements:[{id:"r",category:"education",minLevel:"bachelors",sourceText:"t"}],requirementSet:{ownerConfirmed:true,confirmedOn:"2026-11-01"}},tpl,"2026-11-03",{});
assert.notEqual(d.status,"ELIGIBLE","template profile never yields eligibility");

// 2. Private profile paths are ignored and no populated profile is tracked.
assert.match(read(".gitignore"),/^\.incomeos-private\/$/m);
const tracked=execFileSync("git",["ls-files"],{encoding:"utf8"}).split("\n");
assert.ok(!tracked.some(p=>/owner-profile(?!\.template)\.json$/.test(p)||p.startsWith(".incomeos-private/")),"no private profile committed");

// 3. New owner modules: no network, storage, dynamic code or HTML injection.
const mods=["eligibility-engine.js","listing-requirements.js","compensation.js","opportunity-normalizer.js","opportunity-lifecycle.js","project-radar.js","project-ui.js","ledger-rules.js","net-worth.js","claims-tracker.js","renewal-monitor.js","recruiter-history.js","yield-compare.js","weekly-briefing.js","briefing-ui.js","workspace-store.js","profile-editor.js","profile-ui.js","engagement-screen.js"];
for(const m of mods){
  const src=read("owner/incomeos/"+m);
  assert.doesNotMatch(src,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/,m+": no network access");
  assert.doesNotMatch(src,/localStorage|sessionStorage|indexedDB|document\.cookie/,m+": no persistent storage");
  assert.doesNotMatch(src,/\beval\s*\(|new Function\s*\(|innerHTML|outerHTML|insertAdjacentHTML|document\.write/,m+": no dynamic code or HTML injection");
}
// Connectors may use only the injected fetch, never browser storage.
const conn=read("owner/incomeos/discovery-connectors.js");
assert.doesNotMatch(conn,/localStorage|sessionStorage|innerHTML|\beval\s*\(/);
assert.doesNotMatch(conn,/\bfetch\s*\(/,"connectors use the injected fetchJson only");

// 4. Script order: engines load before the radar, radar before the UI.
const page=read("owner/incomeos/index.html");
const pos=f=>page.indexOf('src="./'+f+'"');
for(const f of ["eligibility-engine.js","listing-requirements.js","compensation.js","opportunity-normalizer.js"])assert.ok(pos(f)>0&&pos(f)<pos("project-radar.js"),f+" before radar");
assert.ok(pos("project-radar.js")<pos("project-ui.js"));
assert.ok(pos("staging-interlock.js")<pos("project-ui.js"),"interlock still loads first");
assert.doesNotMatch(page,/<script[^>]*src=["']https?:/i);

// 5. Discovery workflow is read-only, public-data-only and never handles a profile.
const wf=read(".github/workflows/incomeos-discovery.yml");
assert.match(wf,/permissions:\s*\n\s*contents: read/);
assert.doesNotMatch(wf,/--profile|git push|git commit|contents: write|vercel/i);
assert.match(wf,/retention-days: 7/);
const runner=read("scripts/incomeos/discover.mjs");
assert.match(runner,/Refusing to read an owner profile inside CI/);
const r=spawnSync(process.execPath,["scripts/incomeos/discover.mjs","--out","/nonexistent-incomeos","--registry","owner/incomeos/owner-profile.template.json","--profile","owner/incomeos/owner-profile.template.json"],{env:{...process.env,CI:"1"},encoding:"utf8"});
assert.notEqual(r.status,0,"runner refuses invalid registry / CI profile use");

// 6. The private draft must never be referenced from served HTML.
assert.doesNotMatch(page,/\.incomeos-private|owner-profile\.json/);
console.log("IncomeOS owner-profile privacy QA passed: template has no owner data, private paths ignored, no storage/network/HTML injection in new modules, safe script order, read-only discovery workflow");
