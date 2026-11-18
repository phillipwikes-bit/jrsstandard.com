// The 23 named detection templates (2026-11-18). Constructed records only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';
import { runDetectionTemplates, TEMPLATES } from '../../lib/ds-n1/detection-templates.mjs';

const T0 = '2026-11-18T12:00:00Z';
const fx = (dir, id) => JSON.parse(readFileSync(new URL(`./${dir}/${id}.json`, import.meta.url), 'utf8'));
const st = (r) => deriveState(openReview(r, { at: T0 }));
const hits = (r) => runDetectionTemplates(st(r));
const names = (r) => new Set(hits(r).map((h) => h.template));

test('all 23 templates are registered in the five groups', () => {
  const groups = {};
  for (const t of Object.values(TEMPLATES)) groups[t.group] = (groups[t.group] || 0) + 1;
  assert.equal(Object.keys(TEMPLATES).length, 23);
  assert.deepEqual(groups, { authority_governance: 6, conclusion_reasoning: 5, chronology: 8, evidence_quotation: 3, certainty: 1 });
});

test('finding-based templates name the finding they rest on', () => {
  const h = hits(fx('fixtures', 'D03'));
  assert.ok(h.some((x) => x.template === 'authority_source_not_identified' && x.code === 'UNTRACEABLE_AUTHORITY'));
  assert.ok(h.some((x) => x.template === 'decision_date_conflict' && x.code === 'DATE_MISMATCH'));
  assert.ok(names(fx('fixtures', 'D10')).has('absent_quotation'));
  assert.ok(names(fx('fixtures-partner', 'AUTH-D01')).has('cited_evidence_conflict'));
  assert.ok(names(fx('fixtures-partner', 'MEMO-D01')).has('certainty_language'));
});

test('advisory templates never change a status and never fire on the supported partner records', () => {
  for (const id of ['AUTH-P01', 'INV-P01', 'DISC-P01', 'MEMO-P01']) {
    assert.deepEqual(hits(fx('fixtures-partner', id)), [], id);
  }
  for (const h of hits(fx('fixtures', 'P03'))) {
    assert.equal(h.mode, 'advisory');
    assert.equal(h.changes_review_status, false);
  }
  assert.equal(st(fx('fixtures', 'P03')).status, 'READY_FOR_HUMAN_FINALIZATION', 'advisory hits leave a supported record READY');
});

test('a thin but supported authorization is flagged as incomplete, not as unsupported', () => {
  const n = names(fx('fixtures', 'P03'));
  for (const t of ['no_compensating_control_stated', 'no_stated_expiry_date', 'no_locatable_conclusion', 'basis_without_conclusion']) assert.ok(n.has(t), t);
});

test('an evaluation completed after the authorization it supports', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[1].events = [{ role: 'evaluation_completed', date: '2026-10-20', actor: 'E1' }];
  const h = hits(r).find((x) => x.template === 'assessment_after_decision');
  assert.ok(h, 'expected assessment_after_decision');
  assert.match(h.detail, /2026-10-20.*2026-10-14/);
});

test('a request dated after the decision is an impossible sequence', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[0].events = [{ role: 'request', date: '2026-10-30' }];
  assert.ok(names(r).has('impossible_sequence'));
});

test('a quotation that occurs twice in its source is ambiguous', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[2].text += ' Sending is limited to invoices more than thirty days overdue, and each batch requires human sign-off.';
  assert.ok(names(r).has('ambiguous_quotation'));
});

test('a stated duration that does not match the source dates', () => {
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.sources[2].text += ' The authorization expires on 2026-11-13.';
  r.sources[2].events.push({ role: 'expiry', date: '2026-11-13' });
  r.text += ' The authorization lasts ninety days.';
  r.claims.push({ claim_id: 'C9', kind: 'fact', quote: 'The authorization lasts ninety days.', citations: [] });
  const h = hits(r).find((x) => x.template === 'duration_date_conflict');
  assert.ok(h, 'expected duration_date_conflict');
  assert.match(h.detail, /90 days.*30 days/);
});

test('date and authority templates apply only to record types that need them', () => {
  assert.ok(!names(fx('fixtures-partner', 'MEMO-P01')).has('no_explicit_dates'), 'a legal memo need not carry dates');
  assert.ok(!names(fx('fixtures-partner', 'INV-P01')).has('no_authority_section'), 'an investigation report is not an authorization');
});

test('an authorization with no authority statement, no dates and an undated decision', () => {
  const noAuth = fx('fixtures-partner', 'AUTH-P01');
  noAuth.claims = noAuth.claims.filter((c) => c.kind !== 'authority');
  assert.ok(names(noAuth).has('no_authority_section'));
  const undated = fx('fixtures-partner', 'AUTH-P01');
  const c3 = undated.claims.find((c) => c.kind === 'authority');
  undated.text = undated.text.replace(c3.quote, 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.');
  c3.quote = 'Priya Nandakumar authorized Ledgerline Assistant to send invoice reminder emails.';
  delete c3.event;
  assert.ok(names(undated).has('no_dated_decision'));
  const r = fx('fixtures-partner', 'AUTH-P01');
  r.text = 'Ledgerline Assistant may send invoice reminder emails.';
  r.claims = [{ claim_id: 'C1', kind: 'fact', quote: r.text, citations: [{ source_id: 'S1', quote: 'Ledgerline Assistant to send invoice reminder emails' }] }];
  assert.ok(names(r).has('no_explicit_dates'));
});
