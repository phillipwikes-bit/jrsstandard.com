// JRS Review Engine local candidate: versioned result contract.
// LOCAL DEVELOPMENT ONLY. No network, no storage, no clock: every time stamp
// is supplied by the caller.
//
// Shape (contract jrs-candidate-result/0.2.0):
//   contract_version
//   review_identity      every version that produced the result, plus review_id,
//                        a hash of those versions and the source. A disposition
//                        is bound to one review_id and cannot move to another.
//   record_ref           the caller's record identifier, passed through unchanged
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

export const CONTRACT_VERSION = 'jrs-candidate-result/0.3.0';
export const DISPOSITIONS = ['confirmed', 'not_confirmed', 'needs_more_information'];
const SIGN_OFF_MEANING = 'Sign-off records that a named person reviewed every finding in this result. It is not an access decision, not an approval of the record and not a validation of the candidate.';

function clone(o) { return JSON.parse(JSON.stringify(o)); }

// Key-order-independent JSON, so a digest never depends on how an object was built.
export function canonicalJson(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonicalJson(v[k]); }).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}

// result_digest binds the findings to their review version. It catches a finding or a disposition
// copied from another result, and any edit to a finding. It is NOT authentication: anyone can
// recompute it, so it does not show who produced a result.
function digestOf(r) {
  return sha256(canonicalJson({ review_identity: r.review_identity, record_ref: r.record_ref, status: r.status, source: r.source,
    extraction_findings: r.extraction_findings, contextual_findings: r.contextual_findings }));
}

export function reviewIdentity(versions, sourceSha) {
  var identity = {
    contract_version: CONTRACT_VERSION,
    candidate_version: versions.candidate_version,
    source_prep_version: versions.source_prep_version,
    explanation_set_version: versions.explanation_set_version,
    prompt_sha256: versions.prompt_sha256 || null,
    prompt_version: versions.prompt_version || null,
    adapter_contract: versions.adapter_contract || null,
    model: versions.model || null,
    derived_from: versions.derived_from,
  };
  identity.review_id = sha256(JSON.stringify(identity) + '|' + (sourceSha || 'no-source')).slice(0, 24);
  return identity;
}

function number(prefix, list, reviewId) {
  return list.map(function (f, i) { return Object.assign({ id: prefix + '-' + String(i + 1).padStart(3, '0'), review_id: reviewId }, f); });
}

export function buildResult(parts) {
  var rid = parts.identity.review_id;
  var extraction = number('X', parts.extraction_findings || [], rid);
  var contextual = parts.contextual === null || parts.contextual === undefined ? null : {
    conditions: parts.contextual.conditions,
    findings: number('C', parts.contextual.findings || [], rid),
    revision_needed: parts.contextual.revision_needed === undefined ? null : parts.contextual.revision_needed,
  };
  var items = {};
  extraction.concat(contextual ? contextual.findings : []).forEach(function (f) {
    if (f.needs_disposition !== false) items[f.id] = { status: 'pending', review_id: rid };
  });
  var result = {
    contract_version: CONTRACT_VERSION,
    review_identity: parts.identity,
    record_ref: parts.record_ref === undefined ? null : parts.record_ref,
    status: parts.status,
    reason: parts.reason || null,
    refusal_codes: parts.refusal_codes || [],
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
  result.result_digest = digestOf(result);
  return result;
}

// Checks that every finding, disposition item and history entry belongs to this review version and
// that the findings are unchanged since the result was built. Returns { ok, problems }.
export function verifyResultIntegrity(result) {
  var problems = [], rid = result && result.review_identity && result.review_identity.review_id;
  if (!rid) return { ok: false, problems: ['no review identity'] };
  if (result.result_digest !== digestOf(result)) problems.push('findings or identity changed since the result was built');
  var findings = (result.extraction_findings || []).concat(result.contextual_findings ? result.contextual_findings.findings : []);
  var ids = findings.map(function (f) { return f.id; });
  if (new Set(ids).size !== ids.length) problems.push('duplicate finding identifiers');
  findings.forEach(function (f) { if (f.review_id !== rid) problems.push('finding ' + f.id + ' belongs to another review version'); });
  var hr = result.human_review || {}, disp = hr.disposition || {}, items = disp.items || {};
  var needs = findings.filter(function (f) { return f.needs_disposition !== false; }).map(function (f) { return f.id; }).sort();
  if (JSON.stringify(Object.keys(items).sort()) !== JSON.stringify(needs)) problems.push('disposition items do not match the findings');
  Object.keys(items).forEach(function (k) { if (items[k].review_id !== rid) problems.push('disposition for ' + k + ' belongs to another review version'); });
  (disp.history || []).forEach(function (h, i) {
    if (h.review_id !== rid) problems.push('disposition history entry ' + i + ' belongs to another review version');
    if (ids.indexOf(h.finding_id) === -1) problems.push('disposition history entry ' + i + ' names an unknown finding');
  });
  return { ok: problems.length === 0, problems: problems };
}

function assertIntegrity(result) {
  var v = verifyResultIntegrity(result);
  if (!v.ok) throw new Error('result_integrity_failed: ' + v.problems.join('; '));
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
  assertIntegrity(result);
  if (result.human_review.sign_off.status === 'signed') throw new Error('result_signed_off: dispositions are closed');
  var item = result.human_review.disposition.items[d.finding_id];
  if (!item) throw new Error('unknown_finding: ' + d.finding_id);
  if (DISPOSITIONS.indexOf(d.decision) === -1) throw new Error('invalid_disposition: ' + d.decision);
  requireText(d.reviewer, 'reviewer'); requireText(d.at, 'at');
  var next = clone(result);
  var entry = { review_id: result.review_identity.review_id, finding_id: d.finding_id, decision: d.decision, reviewer: d.reviewer, at: d.at, note: d.note ? String(d.note).slice(0, 1000) : null,
                replaces: item.status === 'pending' ? null : item.status };
  next.human_review.disposition.history.push(entry);
  next.human_review.disposition.items[d.finding_id] = { status: d.decision, reviewer: d.reviewer, at: d.at, review_id: result.review_identity.review_id };
  var pending = Object.values(next.human_review.disposition.items).some(function (i) { return i.status === 'pending'; });
  next.human_review.disposition.status = pending ? 'in_progress' : 'complete';
  return next;
}

export function signOff(result, s) {
  if (result.status !== 'examined') throw new Error('only an examined result can be signed off');
  assertSameReview(result, s.review_id);
  assertIntegrity(result);
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
