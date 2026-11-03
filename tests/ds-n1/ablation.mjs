#!/usr/bin/env node
// SP-18 ablation (suppression form). For each DS-N1 rule code, remove that
// code's findings and re-derive every labelled case's status. Reports:
//   false_ready_if_removed : cases labelled must-not-be-ready that would become READY
//   holds_released         : cases labelled ready-able that would stop being held
//   cases_touched          : cases whose status would change at all
//   fired_on               : cases where the rule raises at least one active finding
// Each rule is classified:
//   NEVER_FIRED : no labelled case exercises it (a coverage gap)
//   REDUNDANT   : it fires, but removing it alone changes no status, because the
//                 same cases are also held by other rules (no single-rule evidence)
//   DECISIVE    : removing it alone changes at least one status
//
// Optionally folds in reviewer feedback from exported review packages:
//   node tests/ds-n1/ablation.mjs [export1.json export2.json ...]
//
// Uses base fixtures, the stress DEV split and the isolation (coverage) set.
// Isolation cases are specification tests: every one must not be READY. The holdout is not used for
// anything that could steer rule changes.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openReview, deriveState, RULES, STATUS, verifyExport, VERDICT } from '../../lib/ds-n1/index.mjs';

const here = new URL('./', import.meta.url);
const AT = '2026-11-03T00:00:00Z';
const cases = [];
const base = JSON.parse(readFileSync(new URL('expectations.json', here), 'utf8')).fixtures;
for (const [id, e] of Object.entries(base)) {
  const rec = JSON.parse(readFileSync(new URL(`fixtures/${id}.json`, here), 'utf8'));
  cases.push({ id: `base:${id}`, rec, mustNotReady: e.must_not_be_ready });
}
const stress = JSON.parse(readFileSync(new URL('stress-expectations.json', here), 'utf8')).fixtures;
for (const [id, e] of Object.entries(stress)) {
  if (e.split !== 'dev') continue;
  const rec = JSON.parse(readFileSync(new URL(`fixtures/stress/${id}.json`, here), 'utf8'));
  cases.push({ id: `stress:${id}`, rec, mustNotReady: e.must_not_be_ready });
}

const iso = JSON.parse(readFileSync(new URL('isolation-expectations.json', here), 'utf8')).fixtures;
for (const id of Object.keys(iso)) {
  const rec = JSON.parse(readFileSync(new URL(`fixtures/isolation/${id}.json`, here), 'utf8'));
  cases.push({ id: `isolation:${id}`, rec, mustNotReady: true });
}
const baseState = new Map(cases.map((c) => [c.id, deriveState(openReview(c.rec, { at: AT }))]));
const baseline = new Map([...baseState].map(([k, v]) => [k, v.status]));
const rows = [];
for (const code of Object.keys(RULES).sort()) {
  let falseReady = 0, released = 0;
  const touched = [];
  for (const c of cases) {
    const before = baseline.get(c.id);
    const after = deriveState(openReview(c.rec, { at: AT }), { suppress: [code] }).status;
    if (after === before) continue;
    touched.push(`${c.id}:${before}->${after}`);
    if (after === STATUS.READY && c.mustNotReady) falseReady++;
    if (before !== STATUS.READY && after === STATUS.READY && !c.mustNotReady) released++;
  }
  const firedOn = cases.filter((c) => baseState.get(c.id).findings.some((f) => f.code === code && f.status !== 'SUPERSEDED')).length;
  const klass = !firedOn ? 'NEVER_FIRED' : touched.length ? 'DECISIVE' : 'REDUNDANT';
  rows.push({ code, severity: RULES[code].severity, fired_on: firedOn, class: klass, false_ready_if_removed: falseReady, holds_released: released, cases_touched: touched.length, touched });
}

// Reviewer feedback from exported packages (only internally consistent ones).
const feedback = {};
const skipped = [];
for (const file of process.argv.slice(2)) {
  const text = readFileSync(resolve(file), 'utf8');
  const v = verifyExport(text);
  if (v.verdict !== VERDICT.CONSISTENT) { skipped.push({ file, verdict: v.verdict }); continue; }
  for (const ev of JSON.parse(text).events) if (ev.type === 'finding_feedback') {
    feedback[ev.code] ||= { useful: 0, not_useful: 0, wrong: 0 };
    feedback[ev.code][ev.usefulness]++;
  }
}
for (const r of rows) r.reviewer_feedback = feedback[r.code] || null;

console.log(`cases: ${cases.length} (base + stress dev + isolation); exports read: ${process.argv.length - 2 - skipped.length}; skipped: ${JSON.stringify(skipped)}`);
console.log('code'.padEnd(26), 'sev'.padEnd(9), 'class'.padEnd(11), 'firedOn', 'falseReadyIfRemoved', 'holdsReleased', 'feedback');
for (const r of rows) {
  console.log(r.code.padEnd(26), r.severity.padEnd(9), r.class.padEnd(11), String(r.fired_on).padStart(7), String(r.false_ready_if_removed).padStart(19), String(r.holds_released).padStart(13),
    r.reviewer_feedback ? JSON.stringify(r.reviewer_feedback) : '-');
}
for (const k of ['NEVER_FIRED', 'REDUNDANT', 'DECISIVE']) console.log(`${k}: ${rows.filter((r) => r.class === k).map((r) => r.code).join(', ') || 'none'}`);
console.log('Limitation: developer fixtures and labels; suppression does not re-run derived rules; not a performance claim.');
