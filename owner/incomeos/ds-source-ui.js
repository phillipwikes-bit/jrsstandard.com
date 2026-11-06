"use strict";
// Owner-only read-only evidence inspection. No source status is asserted without a supplied evidence file.
(function(){
var A=window.IncomeOSDSSourceAdapter,workspace=null;
function $(id){return document.getElementById(id);}
function show(s){var o=$("ds-source-result");if(o)o.textContent=s;}
function init(){
var input=$("ds-source-file");if(!input||!A)return;
["incomeos:workspace-loaded","incomeos:workspace-changed","incomeos:workspace-restored"].forEach(function(n){document.addEventListener(n,function(ev){workspace=ev.detail;});});
input.addEventListener("change",async function(){
show("No source evidence verified.");
if(!workspace||!workspace.dsProgram){show("Load the authoritative IncomeOS workspace before inspecting source evidence.");input.value="";return;}
var f=input.files&&input.files[0];if(!f)return;
if(f.size>100000){show("Evidence file exceeds 100 KB limit.");input.value="";return;}
try{
var data=JSON.parse(await f.text()),s=A.summarize(data,workspace.dsProgram);
show("Source: "+s.source.identity+" | "+s.source.repository+" | "+s.source.commit+"\nTests: "+s.tests.passed+" reported passed, "+s.tests.failed+" reported failed, "+s.tests.notExecuted+" not executed, "+s.tests.skipped+" skipped.\nOriginal SP acceptance: NOT VERIFIED. Integration: "+s.integrationStatus+".\nEvidence file is untrusted until independently authenticated. No workspace changes were made.");
}catch(e){show("Evidence rejected: "+e.message);}
input.value="";
});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
