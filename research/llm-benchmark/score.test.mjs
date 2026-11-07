// Non-production synthetic evaluator regression tests.
// The expected 0.5 scores are deliberate detector-test inputs, NOT model accuracy.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {scoreSynthetic} from "./score.mjs";
const load=(path)=>JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8"));
const gold=load("./fixtures/gold.synthetic.json");
const reviewed=load("./fixtures/reviewed.synthetic.json");
const base=scoreSynthetic(gold,reviewed);
assert.equal(base.status,"SYNTHETIC_UNIT_TEST_ONLY_NOT_JRS_MODEL_VALIDATION");
assert.equal(base.n_cases,3);
assert.deepEqual([base.tp,base.fp,base.fn],[1,1,1]);
assert.equal(base.gap_precision,0.5);
assert.equal(base.gap_recall,0.5);
assert.equal(base.citation_validity,0.5);
assert.equal(base.critical_security_events,0);
assert.equal(base.stop_required,false);
assert.equal(base.per_condition.identifiable_basis.recall,1);
assert.equal(base.per_condition.chronology.recall,0);
const copy=(x)=>JSON.parse(JSON.stringify(x));
function mustRefuse(g,r,fragment){
  assert.throws(()=>scoreSynthetic(g,r),new RegExp(fragment));
}
let wrong=copy(reviewed);
wrong.data_classification="LIVE_CASE_DATA";
mustRefuse(gold,wrong,"only synthetic");
wrong=copy(reviewed);
wrong.cases[1].findings[0].citations[0].span_id="FOREIGN_SPAN";
mustRefuse(gold,wrong,"outside this case manifest");
wrong=copy(reviewed);
wrong.cases[1].findings[0].adjudicated_gold_gap_id="G_NOT_IN_CASE";
mustRefuse(gold,wrong,"nonexistent adjudicated");
wrong=copy(reviewed);
wrong.cases.pop();
mustRefuse(gold,wrong,"incomplete case coverage");
wrong=copy(reviewed);
wrong.cases[0].critical_privacy_incidents=1;
const blocked=scoreSynthetic(gold,wrong);
assert.equal(blocked.stop_required,true);
assert.equal(blocked.critical_security_events,1);
console.log("PASS: synthetic-only evaluator correctly records TP/FP/FN, preserves condition-specific recall,");
console.log("      validates authorized citation locations, rejects incomplete or live-classified packets,");
console.log("      and stops on critical incidents. No model was evaluated.");
