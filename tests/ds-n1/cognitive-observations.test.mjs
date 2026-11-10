// SP-07 extension: unsupported certainty (8.5) and premature closure (8.4). Constructed fictional states only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { buildCognitiveObservations, COGNITIVE_OBSERVATION_VERSION } from '../../lib/ds-n1/cognitive-observations.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/session.mjs';

const base = (o = {}) => ({
  status: 'HOLD',
  record: { text: 'Northwind clearly met every control. The exception can proceed to finalisation.', sources: [{ source_id: 'S1', version: '1' }] },
  claims: [{ claim_id: 'C1', text: 'Northwind clearly met every control.', citations: [{ source_id: 'S1' }] }],
  findings: [{ finding_id: 'F1', claim_id: 'C1', condition: 'RC2', code: 'UNSUPPORTED_CLAIM', status: 'OPEN', severity: 'critical' }],
  ...o,
});

test('fires: categorical claim with an unresolved finding, and closure stated while a critical finding is open', () => {
  const s = base(), before = structuredClone(s), obs = buildCognitiveObservations(s);
  assert.deepEqual(obs.map((o) => o.kind), ['unsupported_certainty', 'premature_closure']);
  const [c, p] = obs;
  assert.equal(c.claim_id, 'C1'); assert.deepEqual(c.markers, ['clearly']); assert.deepEqual(c.related_findings, ['F1']);
  assert.equal(c.question, 'Does the evidence support the certainty expressed in this statement?');
  assert.equal(p.passage, 'The exception can proceed to finalisation.');
  assert.deepEqual(p.record_span, { start: 37, end: 79 });
  assert.equal(s.record.text.slice(p.record_span.start, p.record_span.end), p.passage, 'span points at the exact passage');
  assert.equal(p.question, 'What information remains necessary before this conclusion can be finalized?');
  for (const o of obs) { assert.equal(o.version, COGNITIVE_OBSERVATION_VERSION); assert.equal(o.changes_review_status, false); assert.equal(o.unresolved, true); }
  assert.deepEqual(s, before, 'the review state is not modified');
});

test('fires: categorical claim that cites no source, even with no open finding', () => {
  const s = base({ claims: [{ claim_id: 'C1', text: 'The vendor undoubtedly passed review.', citations: [] }], findings: [] });
  const obs = buildCognitiveObservations(s);
  assert.equal(obs.length, 1); assert.match(obs[0].concern, /cites no source/);
});

test('does not fire: certainty that is resolved and cited, negated certainty, or closure with nothing critical open', () => {
  assert.equal(buildCognitiveObservations(base({ findings: [{ ...base().findings[0], status: 'LIMITATION_RECORDED' }] })).length, 0, 'resolved findings: no observation');
  const neg = base({ claims: [{ claim_id: 'C1', text: 'Northwind has not clearly met every control.', citations: [{ source_id: 'S1' }] }],
    record: { text: 'The exception cannot be finalised yet.', sources: [] } });
  assert.equal(buildCognitiveObservations(neg).filter((o) => o.kind === 'unsupported_certainty').length, 0, '"not clearly" is not categorical');
  assert.equal(buildCognitiveObservations(neg).filter((o) => o.kind === 'premature_closure').length, 0, '"cannot be finalised" is not closure');
  const review = base({ findings: [{ ...base().findings[0], severity: 'review' }], claims: [{ claim_id: 'C1', text: 'Northwind met every control.', citations: [{ source_id: 'S1' }] }] });
  assert.equal(buildCognitiveObservations(review).length, 0, 'only critical or blocking findings make closure premature');
  assert.equal(buildCognitiveObservations(base({ findings: [{ ...base().findings[0], status: 'SUPERSEDED' }] })).length, 0, 'superseded findings are ignored');
});

test('never diagnoses the reviewer or supplies a fact', () => {
  const text = JSON.stringify(buildCognitiveObservations(base()).map(({ limitation, ...o }) => o));
  assert.doesNotMatch(text, /\b(bias(ed)?|intent|motive|dishonest|misconduct|discriminat|you (were|are))\b/i);
  const src = readFileSync(new URL('../../lib/ds-n1/cognitive-observations.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /fetch\(|http|import\(|Math\.random|Date\.now/, 'deterministic, offline');
});

test('fails closed on malformed or refused input', () => {
  assert.throws(() => buildCognitiveObservations(null), TypeError);
  assert.throws(() => buildCognitiveObservations({ claims: [] }), TypeError);
  assert.deepEqual(buildCognitiveObservations({ status: 'ERROR', claims: [], findings: [], record: { text: 'x' } }), []);
  assert.deepEqual(buildCognitiveObservations({ status: 'HOLD', claims: [], findings: [] }), []);
});

test('real fixtures: deterministic, and every passage and finding is present in the review', () => {
  const dir = new URL('./fixtures/', import.meta.url);
  let total = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const rec = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    let st;
    try { st = deriveState(openReview(rec, { at: '2026-11-10T00:00:00Z' })); } catch { continue; }
    const a = buildCognitiveObservations(st), b = buildCognitiveObservations(st);
    assert.deepEqual(a, b, f + ' deterministic');
    const ids = new Set(st.findings.map((x) => x.finding_id));
    for (const o of a) {
      total++;
      for (const id of o.related_findings) assert.ok(ids.has(id), f + ' links only to existing findings');
      if (o.kind === 'premature_closure') assert.equal(st.record.text.slice(o.record_span.start, o.record_span.end), o.passage, f + ' exact passage');
      else assert.ok(st.claims.some((c) => c.claim_id === o.claim_id && c.text === o.passage), f + ' passage is the claim text');
    }
  }
  assert.ok(total > 0, 'the fixtures exercise at least one observation');
});
