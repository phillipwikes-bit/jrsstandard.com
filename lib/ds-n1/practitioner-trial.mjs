// DS-N1 practitioner trial (2026-11-19). Compares the issues an independent
// practitioner raises on a constructed record with what DS-N1 reported,
// where DS-N1's output was recorded BEFORE the practitioner saw the record.
//
// It reports counts, a denominator and a Wilson interval. With a handful of
// constructed records and few reviewers it supports no accuracy claim; it is
// a disciplined way to collect early practitioner evidence.
import { createHash } from 'node:crypto';
import { openReview, deriveState } from './index.mjs';
import { runDetectionTemplates, TEMPLATE_VERSION } from './detection-templates.mjs';

export const TRIAL_VERSION = 'ds-n1.practitioner-trial/0.1.0-dev';

// Issue categories a reviewer's point is coded to, each with the templates
// that count as DS-N1 reporting it.
export const CATEGORIES = Object.freeze({
  approver_role: ['approver_role_not_stated'],
  authority_basis: ['no_authority_basis_cited', 'authority_source_not_identified', 'no_authority_section', 'authority_state_conflict'],
  evidence_summary: ['conclusory_evidence_summary'],
  unsupported_statement: ['basis_states_no_reason_or_source', 'conclusion_without_basis', 'conclusion_without_traceable_basis'],
  source_conflict: ['absent_quotation', 'cited_evidence_conflict', 'ambiguous_quotation', 'control_state_conflict', 'risk_state_conflict', 'hedged_source_stated_firmly'],
  sequence: ['assessment_after_decision', 'impossible_sequence', 'decision_date_conflict', 'expiry_date_conflict', 'duration_date_conflict'],
  inferred_date: ['date_not_in_sources', 'no_dated_decision', 'no_explicit_dates'],
  end_date: ['no_stated_expiry_date'],
  post_expiry_terms: ['no_post_expiry_terms'],
  scope_limits: ['no_compensating_control_stated', 'amount_limit_without_volume_cap'],
  stop_redress: ['no_stop_or_redress_path'],
  human_oversight: ['human_oversight_removed'],
  certainty_language: ['certainty_language'],
  conclusion_missing: ['no_locatable_conclusion', 'basis_without_conclusion'],
});
const BY_TEMPLATE = new Map(Object.entries(CATEGORIES).flatMap(([c, ts]) => ts.map((t) => [t, c])));

const sha = (s) => createHash('sha256').update(s).digest('hex');

// Run DS-N1 on a record and freeze what it reported, by category.
export function buildPrediction(record, { engineCommit, recordedAt }) {
  if (!engineCommit || !recordedAt) throw new TypeError('engineCommit and recordedAt are required');
  const state = deriveState(openReview(record, { at: recordedAt }));
  const hits = runDetectionTemplates(state);
  const categories = [...new Set(hits.map((h) => BY_TEMPLATE.get(h.template)).filter(Boolean))].sort();
  return {
    trial_version: TRIAL_VERSION, template_version: TEMPLATE_VERSION, engine_commit: engineCommit,
    recorded_at: recordedAt, record_id: record.record_id, record_sha256: sha(JSON.stringify(record)),
    status: state.status, categories,
    hits: hits.map((h) => ({ template: h.template, mode: h.mode, claim_id: h.claim_id || null, category: BY_TEMPLATE.get(h.template) || null })),
  };
}

// Compare a practitioner's coded points with a frozen prediction.
// coded = { record_id, reviewer, points: [{ category, text, partial? }] }
// A point may be coded 'other' when it fits no category; it counts as a miss.
export function comparePoints(prediction, coded, record) {
  if (coded.record_id !== prediction.record_id) throw new Error(`coded points are for ${coded.record_id}, prediction is for ${prediction.record_id}`);
  if (record && sha(JSON.stringify(record)) !== prediction.record_sha256) throw new Error('record changed since the prediction was recorded');
  const found = new Set(prediction.categories);
  const raised = new Map();
  for (const p of coded.points) {
    if (p.category !== 'other' && !CATEGORIES[p.category]) throw new Error(`unknown category ${p.category}`);
    if (!raised.has(p.category) || p.category === 'other') raised.set(p.category === 'other' ? `other:${raised.size}` : p.category, p);
  }
  const rows = [];
  for (const [cat, p] of raised) {
    const base = cat.startsWith('other') ? 'other' : cat;
    const result = base !== 'other' && found.has(base) ? (p.partial ? 'PARTIAL' : 'MATCH') : 'MISS';
    rows.push({ category: base, point: p.text, result });
  }
  const dsOnly = [...found].filter((c) => !raised.has(c));
  return { record_id: prediction.record_id, reviewer: coded.reviewer, rows, ds_only: dsOnly,
    raised: rows.length, matched: rows.filter((r) => r.result === 'MATCH').length,
    partial: rows.filter((r) => r.result === 'PARTIAL').length, missed: rows.filter((r) => r.result === 'MISS').length };
}

// Wilson score interval, 95%.
export function wilson(k, n, z = 1.96) {
  if (!n) return { k, n, rate: null, low: null, high: null };
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return { k, n, rate: p, low: Math.max(0, c - h), high: Math.min(1, c + h) };
}

// Totals across comparisons. Partial matches are counted separately, never as
// matches. The rate is "practitioner-raised issues DS-N1 also reported".
export function aggregate(comparisons) {
  const raised = comparisons.reduce((a, c) => a + c.raised, 0);
  const matched = comparisons.reduce((a, c) => a + c.matched, 0);
  const partial = comparisons.reduce((a, c) => a + c.partial, 0);
  return {
    records: new Set(comparisons.map((c) => c.record_id)).size,
    reviewers: new Set(comparisons.map((c) => c.reviewer)).size,
    raised, matched, partial, missed: raised - matched - partial,
    ds_only: comparisons.reduce((a, c) => a + c.ds_only.length, 0),
    full_match_rate: wilson(matched, raised),
    caveat: 'Constructed records reviewed by a small number of practitioners. Not an accuracy result.',
  };
}
