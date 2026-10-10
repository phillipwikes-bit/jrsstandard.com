// JRS Review Engine local candidate: reviewer packet generator.
// LOCAL DEVELOPMENT ONLY. Builds a versioned, machine-readable packet for a human reviewer
// from one candidate result. It is SEPARATE from the Manifest library and is not a Manifest.
//
// The packet shows everything the result holds, with nothing hidden and nothing added:
//   - review identity, result digest and source-preparation status;
//   - deterministic findings, model findings and model-output checks, in separate sections;
//   - every quotation with an anchor checked against the source text;
//   - an explanation and a reviewer question for every finding;
//   - the full disposition history, and the sign-off state.
// It carries no score, no verdict, no routing decision, no compliance conclusion and no
// recommendation to act. It refuses to build when any of the following fails:
//   - the result does not pass verifyResultIntegrity;
//   - the source text does not match the result's hash;
//   - a quotation anchor does not slice back to its quoted text;
//   - a result shows sign-off while findings are pending.
// The packet holds quotations from the record, so it must be kept as confidentially as the record.

import { sha256 } from './source-prep.js';
import { verifyResultIntegrity, canonicalJson } from './contract.js';

export const PACKET_VERSION = 'jrs-candidate-reviewer-packet/0.1.0';
const STATUS = {
  human_review_required: true,
  standing: 'LOCAL CANDIDATE, NOT VALIDATED',
  notice: 'Produced by a local development candidate with a mocked model. It is not a decision, not a validation and not an approval. A person must read the record and every item below.',
};

function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }

function anchor(text, loc, quoted, id) {
  if (!loc || typeof loc.start !== 'number' || typeof loc.end !== 'number') throw new Error('quote_anchor_missing: ' + id);
  if (typeof text !== 'string' || text.slice(loc.start, loc.end) !== quoted) throw new Error('quote_anchor_mismatch: ' + id);
  return { start: loc.start, end: loc.end, line: loc.line, column: loc.column };
}

function explain(e) {
  if (!e) return null;
  return { label: e.label, meaning: e.meaning, look_for: e.look_for || null, reviewer_question: e.question, category: e.category || null,
           codebook_correspondence: e.codebook_correspondence || 'not_asserted' };
}

export function buildReviewerPacket(result, sourceText) {
  var v = verifyResultIntegrity(result);
  if (!v.ok) throw new Error('result_integrity_failed: ' + v.problems.join('; '));
  if (result.source) {
    if (typeof sourceText !== 'string' || sha256(sourceText) !== result.source.sha256) throw new Error('source_text_mismatch: the text supplied is not the text this result examined');
  }
  var r = clone(result), text = result.source ? sourceText : null;
  var items = r.human_review.disposition.items, history = r.human_review.disposition.history;
  var pending = Object.keys(items).filter(function (k) { return items[k].status === 'pending'; });
  if (r.human_review.sign_off.status === 'signed' && pending.length) throw new Error('sign_off_with_pending_items: ' + pending.join(', '));
  var dispFor = function (id) {
    return { status: items[id] ? items[id].status : 'not_required', history: history.filter(function (h) { return h.finding_id === id; }) };
  };

  var deterministic = [], checks = [];
  r.extraction_findings.forEach(function (f) {
    if (f.origin === 'model_output_check') {
      checks.push({ id: f.id, code: f.code, field: f.field || null, groups: f.groups || null, rejection_codes: f.rejection_codes || null,
                    rejection_details: f.rejection_details || null, explanation: explain(f.explanation), disposition: dispFor(f.id) });
      return;
    }
    var entry = { id: f.id, kind: f.kind, code: f.code, element: f.element || null, detail: f.detail || null, explanation: explain(f.explanation), disposition: dispFor(f.id) };
    if (f.matched !== undefined) { entry.quotation = f.matched; entry.anchor = text === null ? null : anchor(text, f.location, f.matched, f.id); }
    else entry.anchor_note = 'This finding concerns something absent from the record, so there is no quotation to anchor.';
    deterministic.push(entry);
  });

  var model = [], conditions = null, revision = null;
  if (r.contextual_findings) {
    conditions = r.contextual_findings.conditions;
    revision = r.contextual_findings.revision_needed;
    r.contextual_findings.findings.forEach(function (f) {
      var entry = { id: f.id, kind: f.kind, explanation_id: f.explanation_id, uncertain: f.uncertain, explanation: explain(f.explanation), disposition: dispFor(f.id) };
      if (f.kind === 'flaw') {
        if (typeof f.quotation !== 'string' || !f.quotation || !Array.isArray(f.locations) || !f.locations.length) throw new Error('quote_anchor_missing: ' + f.id);
        entry.type = f.type; entry.quotation = f.quotation; entry.model_note = f.model_note;
        entry.anchors = f.locations.map(function (l) { return anchor(text, l, f.quotation, f.id); });
      } else {
        entry.condition = f.condition; entry.condition_status = f.status; entry.model_note = f.note;
        entry.anchor_note = 'A candidate key concerns the record as a whole; quotations, if any, are on the flaw findings. A quotation shows presence in the record, not support.';
      }
      model.push(entry);
    });
  }

  var packet = {
    packet_version: PACKET_VERSION,
    status: STATUS,
    review_identity: r.review_identity,
    result_digest: r.result_digest,
    record_ref: r.record_ref,
    source_preparation: { version: r.review_identity.source_prep_version, result_status: r.status, reason: r.reason, detail: r.detail,
                          refusal_codes: r.refusal_codes || [], source: r.source ? { sha256: r.source.sha256, chars: r.source.chars, lines: r.source.lines } : null },
    deterministic_findings: deterministic,
    model_findings: { origin: 'mocked model (local candidate adapter)', conditions: conditions, findings: model,
                      model_revision_note: revision === null ? null : { text: revision, standing: 'Model text describing what the record does not state. Not a recommendation and not an instruction.' } },
    model_output_checks: checks,
    disposition: { status: r.human_review.disposition.status, pending: pending, history: history },
    sign_off: Object.assign({}, r.human_review.sign_off, { permitted_now: pending.length === 0 && r.status === 'examined' && r.human_review.sign_off.status !== 'signed' }),
  };
  packet.packet_id = sha256(canonicalJson({ review_id: r.review_identity.review_id, result_digest: r.result_digest,
    history: history, sign_off: r.human_review.sign_off, packet_version: PACKET_VERSION })).slice(0, 24);
  return packet;
}
