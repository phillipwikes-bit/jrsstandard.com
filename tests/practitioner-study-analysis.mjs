#!/usr/bin/env node
// Checks the practitioner study analysis on synthetic rows (no real data).
import assert from 'node:assert/strict';
import { analyze, wilson } from '../research/study/analyze_practitioner_study.mjs';

const R = (id, rid, rely, extra = {}) => ({ id, created_at: id, source: 'practitioner-review', meta: { record_id: 'AR-82', rid, rely, country: 'GB', ...extra } });
const T = (id, rid, rely, extra = {}) => ({ id, created_at: id, source: 'practitioner-review-tap', meta: { record_id: 'AR-82', rid, rely, country: 'FR', ...extra } });
const rows = [
  R('01', '', undefined, { country: 'US' }),          // early page: question 1 not asked
  T('02', 'aaaaaaaa', 'Yes'), T('03', 'aaaaaaaa', 'No'), R('04', 'aaaaaaaa', 'No'), // changed tap, completed
  T('05', 'bbbbbbbb', 'No'), T('06', 'bbbbbbbb', 'Yes'),  // question 1 only; last tap counts
  T('07', 'cccccccc', 'Not without more', { country: 'US' }),
  R('08', '', 'Not without more', { commercial_contact: true, channel: 'email', country: 'DE' }),
  { id: '09', created_at: '09', source: 'practitioner-review', meta: { record_id: 'AR-81', rid: 'dddddddd', rely: 'Yes', country: 'GB' } },
];
const checks = [
  ['Wilson interval matches the textbook value for 9 of 11', () => assert.deepEqual(wilson(9, 11), [52.3, 94.9])],
  ['people are counted once per visit; completions and question-1-only separated', () => {
    const a = analyze(rows, { record: 'AR-82' });
    assert.equal(a.people, 5); assert.equal(a.completed, 3); assert.equal(a.question_1_only, 2);
  }],
  ['a changed tap counts once, with the last answer', () => {
    const a = analyze(rows, { record: 'AR-82' });
    assert.equal(a.changed_their_tap, 2);
    assert.equal(a.reliance.everyone_who_answered_question_1.yes, 1);
  }],
  ['early answers without question 1 are "not answered", never guessed', () => {
    const a = analyze(rows, { record: 'AR-82' });
    assert.equal(a.reliance.completed.not_answered, 1);
    assert.deepEqual(a.reliance.completed.would_not_rely_as_it_stands, { k: 2, n: 2, pct: 100, wilson95_pct: [34.2, 100] });
  }],
  ['a coded answer is used only when supplied, and labelled as coded', () => {
    const a = analyze(rows, { record: 'AR-82', coded: { '01': 'Yes' } });
    assert.equal(a.reliance.completed.answered, 3);
    assert.equal(a.reliance_basis['coded from written answer'], 1);
  }],
  ['commercial contacts can be excluded; record filter works; US split uses country', () => {
    const a = analyze(rows, { record: 'AR-82' });
    assert.equal(a.reliance.completed_excluding_commercial_contacts.answered, 1);
    assert.equal(a.reliance.us.answered, 1);
    assert.equal(analyze(rows, { record: 'AR-81' }).completed, 1);
  }],
];
let failed = 0;
for (const [name, fn] of checks) { try { fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, e.message.split('\n')[0]); } }
process.exit(failed ? 1 : 0);
