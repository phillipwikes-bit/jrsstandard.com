import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const source=readFileSync("owner/incomeos/accountant.js","utf8");
const start=source.indexOf("function fromWorkspace(ws)");
const end=source.indexOf("\n  function write()",start);
assert.ok(start>=0&&end>start,"workspace loader must exist");
const loader=source.slice(start,end);
assert.match(loader,/entries:rows\.filter\(validate\)/,"valid workspace entries must not be silently truncated");
assert.doesNotMatch(loader,/\.slice\(0,\s*15000\)/,"workspace loader must not silently drop overflow rows");
assert.doesNotMatch(source,/saved\.entries\.filter\(validate\)\.slice\(0,\s*15000\)/,"local ledger must not silently truncate on load");
assert.match(source,/entries\.length>15000/,"editor must reject writes beyond its supported limit");
assert.match(source,/entries:entries\.concat\(wsForeign\)/,"foreign ledger records must be preserved");
const idStart=source.indexOf("function uniqueEntryIds(entries)");
const idEnd=source.indexOf("\n  function commitEntries",idStart);
assert.ok(idStart>=0&&idEnd>idStart,"unique ID gate must exist");
const uniqueEntryIds=runInNewContext("("+source.slice(idStart,idEnd).trim()+")",{Set});
assert.equal(uniqueEntryIds([{id:"a"},{id:"b"}]),true);
assert.equal(uniqueEntryIds([{id:"a"},{id:"a"}]),false);
assert.equal(uniqueEntryIds([{id:"a"},{id:" a "}]),false);
assert.equal(uniqueEntryIds([{id:""}]),false);
assert.equal(uniqueEntryIds([{id:42}]),false);
assert.ok(source.includes("!uniqueEntryIds(entries)"),"commit gate must enforce unique IDs");
assert.ok(source.includes("!uniqueEntryIds(entries.concat(wsForeign))"),"workspace commit must reject collisions with foreign rows");
assert.equal(uniqueEntryIds([{id:"accounting-1"},{id:"foreign-1"}]),true);
assert.equal(uniqueEntryIds([{id:"shared-1"},{id:"shared-1"}]),false);

function exerciseWorkspace(rows){
  const context={input:{ledger:rows},Set,Array};
  runInNewContext(`
    var localLoadUnsafe=true,workspaceLoadUnsafe=false,db={version:2,entries:[]},wsForeign=[];
    function validate(e){return !!e&&e.kind==="income"&&e.valid===true;}
    ${source.slice(idStart,idEnd)}
    ${loader}
    fromWorkspace(input);
    result={unsafe:workspaceLoadUnsafe,entries:db.entries.length,foreign:wsForeign.length};
  `,context);
  return context.result;
}
assert.equal(exerciseWorkspace(undefined).unsafe,true,"Missing workspace ledger must fail closed");
assert.equal(exerciseWorkspace(null).unsafe,true,"Null workspace ledger must fail closed");
assert.equal(exerciseWorkspace({entries:[]}).unsafe,true,"Object workspace ledger must fail closed");
assert.equal(exerciseWorkspace("invalid").unsafe,true,"String workspace ledger must fail closed");
assert.equal(exerciseWorkspace([]).unsafe,false,"Explicit empty workspace ledger is valid");
assert.equal(exerciseWorkspace([{id:"ok",kind:"income",valid:true}]).unsafe,false);
assert.equal(exerciseWorkspace([{id:"ok",kind:"income",valid:true}]).entries,1);
assert.equal(exerciseWorkspace([{id:"dup",kind:"income",valid:true},{id:"dup",kind:"income",valid:true}]).unsafe,true);
assert.equal(exerciseWorkspace([{id:"dup",kind:"income",valid:true},{id:"dup",kind:"income",valid:true}]).entries,0);
assert.equal(exerciseWorkspace([{id:"invalid",kind:"income",valid:false}]).unsafe,true);
assert.equal(exerciseWorkspace([{id:"invalid",kind:"income",valid:false}]).entries,0);
assert.equal(exerciseWorkspace([{id:"foreign",kind:"other"}]).unsafe,false);
assert.equal(exerciseWorkspace([{id:"foreign",kind:"other"}]).foreign,1);

assert.ok(source.includes("if(!wsMode&&localLoadUnsafe)throw new Error"),"unsafe local ledger must block writes");
assert.ok(source.includes("!uniqueEntryIds(saved.entries)"),"local load must detect duplicate IDs");
assert.ok(source.includes("saved.entries.some(function(e){return !validate(e);})"),"local load must detect invalid rows");
assert.ok(source.includes("catch(_e){localLoadUnsafe=true;db.entries=[];}"),"unreadable local data must block writes");
assert.ok(source.includes("if(raw===null)return;"),"missing local ledger may initialize empty");
assert.ok(source.includes("saved.version!==2||!Array.isArray(saved.entries)"),"malformed or unsupported local ledger envelope must be quarantined");
assert.ok(source.includes("localLoadUnsafe=true;\n        db.entries=[];"),"invalid envelope must block edits without overwriting original");
assert.ok(source.includes("workspaceLoadUnsafe = !ws||!Array.isArray(ws.ledger)"),"malformed workspace ledger shape must be quarantined");
assert.ok(source.includes("if(!uniqueEntryIds(rows))workspaceLoadUnsafe=true"),"duplicate IDs in imported workspace must block edits");
assert.ok(source.includes("if(wsMode&&workspaceLoadUnsafe)throw new Error"),"unsafe workspace must not be overwritten");
assert.ok(source.includes('(e.kind==="income"||e.kind==="outflow")&&!validate(e)'),"invalid accounting-shaped workspace records must block edits");
assert.ok(source.includes("if(workspaceLoadUnsafe)db.entries=[];"),"unsafe workspace must not show partial financial totals");
assert.ok(source.includes("db.entries=[]; // Partial totals could be mistaken"),"unsafe local ledger must not show partial financial totals");
assert.ok(source.includes('el.textContent="Unavailable"'),"unsafe financial metrics must be marked unavailable, not zero");
assert.ok(source.includes('count.textContent="Integrity review required"'),"unsafe ledger must show review status");
assert.ok(source.includes("Financial totals are unavailable because the stored ledger failed integrity checks"),"unsafe report must explain the integrity restriction");
for(const name of ["exportReview","exportDetail","exportSummary"]){
  const start=source.indexOf("function "+name+"(){");
  assert.ok(start>=0,"missing "+name);
  assert.ok(source.slice(start,start+300).includes("Export blocked: accounting ledger integrity review is required"),name+" must block unsafe exports");
}
assert.ok(source.includes("function annualReview(){\n    if((wsMode&&workspaceLoadUnsafe)||(!wsMode&&localLoadUnsafe))return null;"),"unsafe ledger must not yield a documentation review");
for(const [name,message] of [["backup","Backup blocked:"],["printReport","Print blocked:"]]){
  const start=source.indexOf("function "+name+"(){");
  assert.ok(start>=0,"missing "+name);
  assert.ok(source.slice(start,start+400).includes(message),name+" must block unsafe output");
}
const restoreStart=source.indexOf("function importJson(text)");
const restoreEnd=source.indexOf("async function handleFile",restoreStart);
assert.ok(restoreStart>=0&&restoreEnd>restoreStart,"backup restoration must exist");
const restoreSource=source.slice(restoreStart,restoreEnd);
assert.ok(restoreSource.includes("parsed.version!==2"),"restore must reject unsupported backup versions");
assert.ok(restoreSource.includes("!uniqueEntryIds(entries)"),"restore must reject duplicate canonical IDs");
assert.ok(restoreSource.includes("e.id.trim()"),"restore must compare canonical IDs against existing records");
for(const name of ["importCsv","importJson"]){
  const start=source.indexOf("function "+name+"(text){");
  assert.ok(start>=0,"missing "+name);
  assert.ok(source.slice(start,start+500).includes("Import blocked: stored accounting records failed integrity checks"),name+" must reject unsafe baseline before processing");
}
assert.match(source,/function recoverRawLocal\(\)/,"Dedicated raw recovery must exist");
assert.match(source,/download\(raw,"IncomeOS-UNVERIFIED-raw-ledger-recovery-/,"Recovery must export original raw content without rewriting");
assert.match(source,/if\(!localLoadUnsafe\)/,"Recovery must be limited to quarantined local data");
assert.match(source,/if\(wsMode\)/,"Recovery must not silently substitute workspace records");
const onWorkspaceBody=source.slice(source.indexOf("function onWorkspace(ev){"),source.indexOf("function onWorkspace(ev){")+450);
assert.ok(onWorkspaceBody.includes("wsMode=true;fromWorkspace(ws)"),"Workspace event must reach integrity loader");
assert.ok(!onWorkspaceBody.includes("!Array.isArray(ws.ledger)"),"Malformed workspace ledger must not be ignored before quarantine");
assert.match(source,/workspaceLoadUnsafe = !ws\\|\\|!Array\\.isArray\\(ws\\.ledger\\)/,"Missing workspace ledger must be quarantined");
// Execute the event handler itself, not only the underlying loader.
const eventStart=source.indexOf("function onWorkspace(ev){");
const eventEnd=source.indexOf("\n  if(typeof document",eventStart);
assert.ok(eventStart>=0&&eventEnd>eventStart,"Workspace event handler must exist");
function exerciseWorkspaceEvent(ledger,includeLedger=true){
  const context={input:includeLedger?{ledger}: {},Set,Array,
    document:{},modeNote(){},render(){},$(){return null}};
  runInNewContext(`
    var localLoadUnsafe=true,workspaceLoadUnsafe=false,wsMode=false,wsDirty=false,db={version:2,entries:[]},wsForeign=[];
    function validate(e){return !!e&&e.kind==="income"&&e.valid===true;}
    ${source.slice(idStart,idEnd)}
    ${loader}
    ${source.slice(eventStart,eventEnd)}
    onWorkspace({type:"incomeos:workspace-loaded",detail:input});
    result={unsafe:workspaceLoadUnsafe,mode:wsMode,entries:db.entries.length};
  `,context);
  return context.result;
}
assert.deepEqual(JSON.parse(JSON.stringify(exerciseWorkspaceEvent(undefined,false))),{unsafe:true,mode:true,entries:0},"Missing ledger event must enter quarantine");
assert.equal(exerciseWorkspaceEvent("bad").unsafe,true,"Malformed ledger event must enter quarantine");
assert.equal(exerciseWorkspaceEvent(null).unsafe,true,"Null workspace event must enter quarantine");
assert.equal(exerciseWorkspaceEvent(undefined).unsafe,true,"Undefined workspace event must enter quarantine");

assert.equal(exerciseWorkspaceEvent([]).unsafe,false,"Valid empty ledger event must remain usable");

const staleContext={Set,Array,document:{},modeNote(){},render(){},$(){return null}};
runInNewContext(`
  var localLoadUnsafe=false,workspaceLoadUnsafe=false,wsMode=false,wsDirty=false,db={version:2,entries:[]},wsForeign=[];
  function validate(e){return !!e&&e.kind==="income"&&e.valid===true;}
  ${source.slice(idStart,idEnd)}
  ${loader}
  ${source.slice(eventStart,eventEnd)}
  onWorkspace({type:"incomeos:workspace-loaded",detail:{ledger:[{id:"prior",kind:"income",valid:true}]}});
  before={unsafe:workspaceLoadUnsafe,count:db.entries.length};
  onWorkspace({type:"incomeos:workspace-restored",detail:null});
  after={unsafe:workspaceLoadUnsafe,count:db.entries.length,foreign:wsForeign.length};
`,staleContext);
assert.deepEqual(JSON.parse(JSON.stringify(staleContext.before)),{unsafe:false,count:1},"Precondition: valid workspace is loaded");
assert.deepEqual(JSON.parse(JSON.stringify(staleContext.after)),{unsafe:true,count:0,foreign:0},"Malformed restoration must remove stale ledger from analysis without retaining foreign rows");

console.log("Accounting workspace preserves all imported valid rows and refuses over-limit edits.");
