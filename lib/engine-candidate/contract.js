// JRS Review Engine local candidate: versioned result contract.
// LOCAL DEVELOPMENT ONLY. No network, no storage, no clock: every time stamp
// is supplied by the caller.
//
// Shape (contract jrs-candidate-result/0.2.0):
//   contract_version
//   review_identity      every version that produced the result, plus review_id,
//                        a hash of those versions and the source. A disposition
//                        is bound to one review_id and cannot move to another.
//   status               examined | refused | incomplete
//   source               hash, length, lines (never the text itself)
//   extraction_findings  deterministic: source preparation and model-output checks
//   contextual_findings  model-derived: flagged conditions and documentation flaws
//   human_review
//     disposition        per-finding decisions by a person, with full history
//     sign_off           a separate, final act; refused while any finding is pending
//
// There is no numerical score, no DRR score and no overall verdict of any kind.

import { sha256 } from './source-prep.js';

export const CONTRACT_VERSION = 'jrs-candidate-result/0.2.0';
export const DISPOSITIONS = ['confirmed', 'not_confirmed', 'needs_more_information'];
const SIGN_OFF_MEANING = 'Sign-off records that a named person reviewed every finding in this result. It is not an access decision, not an approval of the record and not a validation of the candidate.';

function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function reviewIdentity(versions, sourceSha) {
  var identity = {
    contract_version: CONTRACT_VERSION,
    candidate_version: versions.candidate_version,
    source_prep_version: versions.source_prep_version,
    explanation_set_version: versions.explanation_set_version,
    prompt_sha256: versions.prompt_sha256 || null,
    model: versions.model || null,
    derived_from: versions.derived_from,
  };
  identity.review_id = sha256(JSON.stringify(identity) + '|' + (sourceSha || 'no-source')).slice(0, 24);
  return identity;
}

function number(prefix, list) {
  return list.map(function (f, i) { return Object.assign({ id: prefix + '-' + String(i + 1).padStart(3, '0') }, f); });
}

export function buildResult(parts) {
  var extraction = number('X', parts.extraction_findings || []);
  var contextual = parts.contextual === null || parts.contextual === undefined ? null : {
    conditions: parts.contextual.conditions,
    findings: number('C', parts.contextual.findings || []),
    revision_needed: parts.contextual.revision_needed === undefined ? null : parts.contextual.revision_needed,
  };
  var items = {};
  extraction.concat(contextual ? contextual.findings : []).forEach(function (f) {
    if (f.needs_disposition !== false) items[f.id] = { status: 'pending' };
  });
  return {
    contract_version: CONTRACT_VERSION,
    review_identity: parts.identity,
    status: parts.status,
    reason: parts.reason || null,
    detail: parts.detail || null,
    scope_profile: parts.scope_profile,
    examined_at: parts.examined_at || null,
    source: parts.source || null,
    extraction_findings: extraction,
    contextual_findings: contextual,
    human_review: {
      required: true,
      disposition: { status: Object.keys(items).length ? 'pending' : 'nothing_to_dispose', items: items, history: [] },
      sign_off: { status: 'not_signed', reviewer: null, signed_at: null, statement: null, meaning: SIGN_OFF_MEANING },
    },
    validated: false,
    notice: 'Local development candidate. Not validated. Not a decision. A person must read the record and every finding before any use.',
  };
}

function requireText(v, name) {
  if (typeof v !== 'string' || !v.trim()) throw new Error(name + ' is required');
}

function assertSameReview(result, reviewId) {
  if (reviewId !== result.review_identity.review_id) {
    throw new Error('review_version_mismatch: a disposition made on one review version cannot be applied to another');
  }
}

export function recordDisposition(result, d) {
  if (result.status !== 'examined') throw new Error('only an examined result takes dispositions');
  assertSameReview(result, d.review_id);
  if (result.human_review.sign_off.status === 'signed') throw new Error('result_signed_off: dispositions are closed');
  var item = result.human_review.disposition.items[d.finding_id];
  if (!item) throw new Error('unknown_finding: ' + d.finding_id);
  if (DISPOSITIONS.indexOf(d.decision) === -1) throw new Error('invalid_disposition: ' + d.decision);
  requireText(d.reviewer, 'reviewer'); requireText(d.at, 'at');
  var next = clone(result);
  var entry = { finding_id: d.finding_id, decision: d.decision, reviewer: d.reviewer, at: d.at, note: d.note ? String(d.note).slice(0, 1000) : null,
                replaces: item.status === 'pending' ? null : item.status };
  next.human_review.disposition.history.push(entry);
  next.human_review.disposition.items[d.finding_id] = { status: d.decision, reviewer: d.reviewer, at: d.at };
  var pending = Object.values(next.human_review.disposition.items).some(function (i) { return i.status === 'pending'; });
  next.human_review.disposition.status = pending ? 'in_progress' : 'complete';
  return next;
}

export function signOff(result, s) {
  if (result.status !== 'examined') throw new Error('only an examined result can be signed off');
  assertSameReview(result, s.review_id);
  if (result.human_review.sign_off.status === 'signed') throw new Error('already_signed_off');
  var pending = Object.keys(result.human_review.disposition.items).filter(function (k) {
    return result.human_review.disposition.items[k].status === 'pending';
  });
  if (pending.length) throw new Error('dispositions_pending: ' + pending.join(', '));
  requireText(s.reviewer, 'reviewer'); requireText(s.at, 'at'); requireText(s.statement, 'statement');
  var next = clone(result);
  next.human_review.sign_off = { status: 'signed', reviewer: s.reviewer, signed_at: s.at, statement: String(s.statement).slice(0, 1000), meaning: SIGN_OFF_MEANING };
  return next;
}
