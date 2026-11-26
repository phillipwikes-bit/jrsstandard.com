// Cognitive lenses and CC-* safeguards (2026-11-18). Read-only; constructed records.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openReview, deriveState, applyAction, STATUS } from '../../lib/ds-n1/index.mjs';
import { buildSafeguards, LENSES, CONTROLS } from '../../lib/ds-n1/cognitive-safeguards.mjs';

const T0 = '2026-11-18T12:00:00Z';
const R = { reviewer_id: 'R-01', name: 'Sample Reviewer' };
const fx = (dir, id) => JSON.parse(readFileSync(new URL(`./${dir}/${id}.json`, import.meta.url), 'utf8'));
const st = (r) => deriveState(openReview(r, { at: T0 }));
const addClaim = (r, claim) => { r.text += ' ' + claim.quote; r.claims.push(claim); return r; };
const controls = (s, cc) => buildSafeguards(s).controls.filter((c) => c.control === cc);
const lenses = (s, l) => buildSafeguards(s).lenses.filter((x) => x.lens === l);

test('fourteen lenses and eight controls are defined, each with a question or purpose', () => {
  assert.equal(Object.keys(LENSES).length, 14);
  assert.deepEqual(Object.keys(CONTROLS), ['CC-INTENT', 'CC-PLAUSIBLE', 'CC-NEGATION', 'CC-DATES', 'CC-WORDS', 'CC-MISSING', 'CC-BASIS', 'CC-ESCALATE']);
  for (const l of Object.values(LENSES)) assert.ok(l.question.endsWith('?'));
});

test('supported records raise no lens and no control', () => {
  for (const id of ['P01', 'P02', 'P03', 'P04', 'P05']) assert.deepEqual(buildSafeguards(st(fx('fixtures', id))), { lenses: [], controls: [] }, id);
  for (const id of ['INV-P01', 'DISC-P01', 'MEMO-P01']) assert.deepEqual(buildSafeguards(st(fx('fixtures-partner', id))), { lenses: [], controls: [] }, id);
  // 2026-11-25: AUTH-P01 cites a policy it does not supply (now a finding); with the policy supplied it raises nothing.
  const auth = fx('fixtures-partner', 'AUTH-P01');
  auth.sources.push({ source_id: 'S9', title: 'Finance automation policy, section 4', version: 'v3', text: 'Section 4. The finance director may authorize an AI assistant to send routine customer messages, with human sign-off of each batch.' });
  assert.deepEqual(buildSafeguards(st(auth)), { lenses: [], controls: [] }, 'AUTH-P01 with its policy');
  assert.ok(buildSafeguards(st(fx('fixtures-partner', 'AUTH-P01'))).controls.some((c) => c.trigger === 'AUTHORITY_TEXT_NOT_SUPPLIED'));
});

test('finding-based controls: negation, dates, missing, basis, and the request facet of CC-INTENT', () => {
  const auth = st(fx('fixtures-partner', 'AUTH-D01'));
  assert.ok(controls(auth, 'CC-NEGATION').some((c) => c.claim_id === 'C2'));
  assert.ok(controls(auth, 'CC-INTENT').some((c) => c.trigger === 'EVENT_ROLE_CONFUSION'));
  assert.ok(controls(st(fx('fixtures-partner', 'INV-D01')), 'CC-DATES').length);
  assert.ok(controls(st(fx('fixtures-partner', 'MEMO-D01')), 'CC-MISSING').some((c) => c.trigger === 'SOURCE_MISSING'));
  assert.ok(controls(st(fx('fixtures', 'D06')), 'CC-BASIS').length);
});

test('CC-INTENT stated-intent facet: a purpose the sources do not record', () => {
  const r = addClaim(fx('fixtures-partner', 'AUTH-P01'), { claim_id: 'C9', kind: 'fact',
    quote: 'Priya Nandakumar authorized Ledgerline Assistant in order to cut late payments.',
    citations: [{ source_id: 'S3', quote: 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails' }] });
  const c = controls(st(r), 'CC-INTENT').find((x) => x.claim_id === 'C9');
  assert.ok(c, 'expected the stated-intent control');
  assert.equal(c.facet, 'stated_intent');
  assert.match(c.question, /in order to/);
});

test('CC-PLAUSIBLE: plausibility wording without support', () => {
  const r = addClaim(fx('fixtures-partner', 'AUTH-P01'), { claim_id: 'C9', kind: 'fact',
    quote: 'The finance team probably preferred automated reminders.', citations: [] });
  const s = st(r);
  assert.ok(controls(s, 'CC-PLAUSIBLE').some((c) => c.claim_id === 'C9' && /probably/.test(c.question)));
  assert.ok(lenses(s, 'observation_vs_inference').some((l) => l.claim_id === 'C9'));
});

test('CC-WORDS: a recommendation restated as a requirement', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources.push({ source_id: 'S4', title: 'Policy note PN-2', version: 'v1', text: 'Policy note PN-2. Human sign-off on each reminder batch is recommended.', events: [] });
  addClaim(r, { claim_id: 'C9', kind: 'fact', quote: 'Human sign-off on each reminder batch is required.',
    citations: [{ source_id: 'S4', quote: 'Human sign-off on each reminder batch is' }] });
  const ws = controls(st(r), 'CC-WORDS').filter((x) => x.claim_id === 'C9');
  assert.ok(ws.some((c) => /recommended->required/.test(c.trigger)), 'expected the word-strength control');
  // 2026-11-25: the same pattern is now also a review finding, with its own safeguard.
  assert.ok(ws.some((c) => c.trigger === 'RECOMMENDATION_STATED_AS_REQUIREMENT'));
});

test('causation lens: a causal claim the sources state only as sequence', () => {
  const r = addClaim(fx('fixtures-partner', 'AUTH-P01'), { claim_id: 'C9', kind: 'fact',
    quote: 'The pilot risk evaluation resulted in the authorization of Ledgerline Assistant.',
    citations: [{ source_id: 'S2', quote: 'pilot risk evaluation of Ledgerline Assistant was completed' }] });
  assert.ok(lenses(st(r), 'causation').some((l) => l.claim_id === 'C9'));
});

test('CC-ESCALATE and materiality: closure stated while critical issues are open', () => {
  const s = st(fx('fixtures-partner', 'DISC-D01'));
  const e = controls(s, 'CC-ESCALATE');
  assert.ok(e.some((c) => c.trigger === 'closure_with_unresolved_critical' && c.escalate && c.route === 'authorised_reviewer'));
  assert.ok(lenses(s, 'materiality_and_escalation').length);
});

test('automation reliance: critical warnings overridden with no evidence action', () => {
  let session = openReview(fx('fixtures-partner', 'AUTH-D01'), { at: T0 });
  let t = 1;
  for (const f of deriveState(session).findings.filter((x) => x.severity === 'critical')) {
    session = applyAction(session, { type: 'override', at: `2026-11-18T12:0${t++}:00Z`, reviewer: R, finding_id: f.finding_id, rationale: 'Accepting the risk for this constructed example.' });
  }
  const s = deriveState(session);
  assert.ok(lenses(s, 'automation_reliance').length, 'expected the automation-reliance lens');
  assert.ok(controls(s, 'CC-ESCALATE').some((c) => c.trigger === 'critical_overridden'));
});

test('read-only, deterministic, and silent on refused or broken input', () => {
  const s = st(fx('fixtures-partner', 'INV-D01'));
  const before = JSON.stringify(s);
  assert.deepEqual(buildSafeguards(s), buildSafeguards(s));
  assert.equal(JSON.stringify(s), before);
  assert.equal(s.status, STATUS.HOLD);
  for (const item of [...buildSafeguards(s).lenses, ...buildSafeguards(s).controls]) {
    assert.equal(item.changes_review_status, false);
    assert.doesNotMatch(item.question, /\b(he|she|they) (felt|wanted|believed|intended)\b/i, 'never states a mental state');
  }
  assert.deepEqual(buildSafeguards({ status: 'REFUSED_SCOPE', record: null, claims: [], findings: [] }), { lenses: [], controls: [] });
  assert.throws(() => buildSafeguards(null), TypeError);
});
