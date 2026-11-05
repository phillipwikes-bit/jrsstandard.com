import test from 'node:test';
import assert from 'node:assert/strict';
import {learningGuidance,reflectiveGuidance} from '../../lib/ds-n1/reflective-controls.mjs';
const f={finding_id:'F-1',code:'NEGATION_CONFLICT',condition:'RC2',status:'ESCALATED',explanation:'Source contradicts claim',question:'Does the source say the opposite?'};
test('SP-13 is versioned and evidence specific without changing findings',()=>{const before=JSON.stringify(f);const g=learningGuidance(f,{codebookVersion:'unverified',ruleVersion:'ds-n1.rules/0.2.0'});assert.equal(g.condition,'RC2');assert.match(g.next_review,/negation/);assert.equal(g.codebook_version,'unverified');assert.equal(JSON.stringify(f),before);});
test('SP-14 preserves unresolved hold and is non-authoritative',()=>{const r=reflectiveGuidance(f);assert.deepEqual(r.steps.map(x=>x.name),['Restrain','Reframe','Recalibrate','Release']);assert.equal(r.unresolved,true);assert.equal(r.can_finalize,false);assert.match(r.steps[1].guidance,/opposite/);});
test('SP-14 resolved findings remain non-authoritative',()=>{const r=reflectiveGuidance({...f,status:'OVERRIDDEN'});assert.equal(r.unresolved,false);assert.equal(r.can_finalize,false);});
test('guidance rejects malformed findings',()=>{assert.throws(()=>learningGuidance(null),TypeError);assert.throws(()=>reflectiveGuidance({}),TypeError);});
