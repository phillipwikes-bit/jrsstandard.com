// Guards the accounting editor acceptance record against false-ready claims.
// It checks the record's own consistency; it does not by itself verify any feature.
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const r=JSON.parse(readFileSync("owner/incomeos/ACCOUNTING-EDITOR-ACCEPTANCE.json","utf8"));
assert.equal(r.schema,"incomeos.acceptance.v1");
assert.equal(r.items.length,16,"all sixteen directive acceptance items are recorded");
const ids=new Set();
for(const it of r.items){
  assert.ok(!ids.has(it.id),"unique id "+it.id);ids.add(it.id);
  assert.ok(r.statusVocabulary.includes(it.status),it.id+": known status");
  for(const f of it.evidence)assert.ok(existsSync(f),it.id+": evidence file exists: "+f);
  if(it.status==="SOURCE TESTED")assert.ok(it.evidence.length>0,it.id+": source tested needs a test");
  if(it.status==="BLOCKED")assert.ok(it.blockedBy,it.id+": a blocked item names its dependency");
  // Anything beyond source testing needs recorded deployment evidence, which no item has yet.
  if(["PROTECTED PREVIEW VERIFIED","OWNER ACCEPTANCE PENDING","PRODUCTION VERIFIED"].includes(it.status))
    assert.ok(it.deploymentEvidence&&it.deploymentEvidence.commit&&it.deploymentEvidence.url,it.id+": deployment evidence required");
}
// Authentication, denial, hosted storage, release and owner approval cannot be source-tested into readiness.
for(const id of ["A01","A02","A14","A15","A16"])
  assert.ok(!["SOURCE TESTED","IN DEVELOPMENT","NOT IMPLEMENTED"].includes(r.items.find(x=>x.id===id).status),id+" is not satisfied by source tests");
assert.equal(r.milestoneComplete,r.items.every(x=>x.status==="PRODUCTION VERIFIED"),"milestone complete only when every item is production verified");
// Physical-device and accountant claims stay qualified.
assert.match(r.items.find(x=>x.id==="A12").limitation,/not tested on a physical iPhone/);
assert.match(r.items.find(x=>x.id==="A11").limitation,/not accountant-reviewed and not tax-filing ready/);
console.log("IncomeOS acceptance record checks passed: "+r.items.filter(x=>x.status==="SOURCE TESTED").length+" source tested, "+r.items.filter(x=>x.status==="BLOCKED").length+" blocked, milestone complete: "+r.milestoneComplete);
