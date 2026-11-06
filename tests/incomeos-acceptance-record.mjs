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
  // A claimed deployed or owner-acceptance status requires traceable deployment evidence.
  if(["PROTECTED PREVIEW VERIFIED","OWNER ACCEPTANCE PENDING","PRODUCTION VERIFIED"].includes(it.status))
    assert.ok(it.deploymentEvidence&&/^[0-9a-f]{40}$/.test(it.deploymentEvidence.commit)&&/^https:\/\//.test(it.deploymentEvidence.url),it.id+": immutable commit and HTTPS deployment evidence required");
  if(it.status==="PROTECTED PREVIEW VERIFIED" || it.status==="OWNER ACCEPTANCE PENDING"){
    assert.ok(it.limitation&&it.limitation.trim().length>20,it.id+": preview or owner-pending status must disclose remaining limitations");
  }
  if(it.status==="PRODUCTION VERIFIED"){
    assert.ok(it.deploymentEvidence?.date&&it.deploymentEvidence?.probe,it.id+": production verification requires dated probe evidence");
    assert.ok(it.evidence.length>0,it.id+": production verification requires evidence files");
  }
}
// Authentication, denial, hosted storage, release and owner approval cannot be source-tested into readiness.
// A blocked recovery item must retain its explicit dependency until independently verified.
const hostedRecovery=r.items.find(x=>x.id==="A14");
if(hostedRecovery.status==="BLOCKED")assert.match(hostedRecovery.blockedBy,/owner|hosted|restore|vault/i,"hosted recovery blockage must be explained");
const rollback=r.items.find(x=>x.id==="A15");
if(rollback.status!=="PRODUCTION VERIFIED")assert.match(rollback.limitation,/rollback/i,"rollback evidence gap must remain visible");
for(const id of ["A01","A02","A14","A15","A16"])
  assert.ok(!["SOURCE TESTED","IN DEVELOPMENT","NOT IMPLEMENTED"].includes(r.items.find(x=>x.id===id).status),id+" is not satisfied by source tests");
assert.equal(r.milestoneComplete,r.items.every(x=>x.status==="PRODUCTION VERIFIED"),"milestone complete only when every item is production verified");
assert.equal(r.items.find(x=>x.id==="A16").status,"BLOCKED","owner publication authorization cannot be inferred from CI");
assert.equal(r.milestoneComplete,false,"no automatic production acceptance or owner authorization");
// Physical-device and accountant claims stay qualified.
// Device testing stays qualified: either untested on a physical iPhone, or form entry on the device not yet observed.
assert.match(r.items.find(x=>x.id==="A12").limitation,/not tested on a physical iPhone|form entry on the device has not been observed/);
assert.match(r.items.find(x=>x.id==="A11").limitation,/not accountant-reviewed and not tax-filing ready/);
console.log("IncomeOS acceptance record checks passed: "+r.items.filter(x=>x.status==="SOURCE TESTED").length+" source tested, "+r.items.filter(x=>x.status==="BLOCKED").length+" blocked, milestone complete: "+r.milestoneComplete);
