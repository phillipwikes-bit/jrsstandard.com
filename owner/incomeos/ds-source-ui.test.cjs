"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
test("payload-free workspace change preserves loaded programme",async()=>{
const handlers={},input={files:[{size:50,text:async()=>"{\"schema\":\"test\"}"}],value:"x",addEventListener(n,fn){this[n]=fn;}},output={textContent:""};
const doc={readyState:"complete",getElementById(id){return {"ds-source-file":input,"ds-source-result":output}[id];},addEventListener(n,fn){handlers[n]=fn;}};
let got=null;
const ctx={window:{IncomeOSDSSourceAdapter:{summarize(data,p){got=p;return {source:{identity:"DS-N1",repository:"test/repo",commit:"a".repeat(40)},tests:{passed:0,failed:0,notExecuted:1,skipped:0},integrationStatus:"INTEGRATION_IN_PROGRESS"};}}},document:doc};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"ds-source-ui.js"),"utf8"),ctx);
handlers["incomeos:workspace-loaded"]({detail:{dsProgram:{programId:"DSP"}}});
handlers["incomeos:workspace-changed"]({});
await input.change();
assert.equal(got.programId,"DSP");
assert.match(output.textContent,/INTEGRATION_IN_PROGRESS/);
});
