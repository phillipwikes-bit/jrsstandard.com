import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCognitiveControls, COGNITIVE_CONTROL_VERSION } from '../../lib/ds-n1/cognitive-controls.mjs';
const state = () => ({
  status: 'HOLD',
  record: { sources: [{source_id:'S1', version:'1'}] },
  claims: [{claim_id:'C1', text:'Approval was complete.', citations:[{source_id:'S1'}, {source_id:'MADE-UP'}]}],
  findings: [
    {finding_id:'F1', claim_id:'C1', condition:'RC2', code:'UNSUPPORTED_CLAIM',status:'OPEN',severity:'critical'},
    {finding_id:'F2', claim_id:'C1', condition:'RC5', code:'QUALIFICATION_OMITTED',status:'AWAITING_EVIDENCE',severity:'review'},
    {finding_id:'F3', claim_id:'C1', condition:'RC2', code:'SOURCE_MISSING',status:'SUPERSEDED',severity:'critical'},
    {finding_id:'F4', claim_id:'C2', condition:'RC3', code:'DATE_MISMATCH',status:'OVERRIDDEN',severity:'critical'},
  ]
});
test('questions are bounded, evidence-referenced, and never invent a source or alternative fact', () => {
 const s=state(), before=structuredClone(s); const cards=buildCognitiveControls(s);
 assert.equal(cards.length, 3);
 assert.deepEqual(cards[0].source_ids,['S1']);
 assert.equal(cards[0].category,'observation_inference');
 assert.equal(cards[1].category,'alternatives');
 assert.equal(cards[2].category,'state');
 assert.equal(cards[0].control_version,COGNITIVE_CONTROL_VERSION);
 assert.equal(cards[0].finding_status,'OPEN');
 assert.equal(cards[2].finding_status,'OVERRIDDEN');
 assert.equal(cards[2].unresolved,false);
 assert.equal(cards[0].action_surface,'existing_findings_and_actions');
 assert.deepEqual(s,before);
});
test('selection filters to its own claim without changing the review result', () => {
 const s=state(); assert.deepEqual(buildCognitiveControls(s,{claimId:'C2'}).map(c=>c.finding_id),['F4']);
 assert.equal(s.status,'HOLD');
});
test('unsupported finding codes and superseded findings create no prompts', () => {
 const s=state(); s.findings=s.findings.filter(f=>['F3'].includes(f.finding_id)); assert.deepEqual(buildCognitiveControls(s),[]);
 s.findings=[{finding_id:'X',code:'UNKNOWN',status:'OPEN'}]; assert.deepEqual(buildCognitiveControls(s),[]);
});
test('invalid/unreviewable states fail safely without a favorable result', () => {
 assert.throws(()=>buildCognitiveControls(null),TypeError);
 assert.deepEqual(buildCognitiveControls({record:null,claims:[],findings:[]}),[]);
});
