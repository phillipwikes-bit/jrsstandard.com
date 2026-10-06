// JRS Review Engine local candidate: model-adapter boundary.
// LOCAL DEVELOPMENT ONLY. Defines the interface any future model connection must
// meet. NO LIVE PROVIDER IS IMPLEMENTED HERE OR ANYWHERE IN THE CANDIDATE.
//
// An adapter is an object with:
//   describe()        -> { model_id, model_version, prompt_version }   (synchronous, no I/O)
//   examine(request)  -> Promise<output>   output: an object or a JSON string
//
// Its output must be exactly this shape (contract jrs-candidate-adapter-output/0.1.0):
//   adapter_contract  'jrs-candidate-adapter-output/0.1.0'
//   model_id, model_version, prompt_version   strings, equal to describe()
//   completion        'complete' | 'incomplete'
//   conditions        all five keys; each { status, explanation_id, note, uncertain }
//   findings          [ { type, quotation, explanation_id, note, uncertain } ]
//   revision_needed   string or null
//
// validateAdapterOutput() FAILS CLOSED: any deviation rejects the whole output,
// with every reason listed. Nothing is repaired, coerced, truncated or partly kept.
// Rejected: unknown fields (free-form verdicts, summaries, scores), any number,
// determination language ("ready", "approved", "defensible", "compliant" and
// equivalents), a missing or invalid condition, a finding type outside the list,
// an explanation identifier that does not match the condition or type, a finding
// without a quotation, a quotation that is not an exact substring of the record,
// malformed or cut-off output, and output that reports itself incomplete.

import { CONDITION_CATEGORY, FLAW_CATEGORY } from './explanations.js';

export const ADAPTER_CONTRACT = 'jrs-candidate-adapter-output/0.1.0';
export const ADAPTER_CONDITION_KEYS = Object.keys(CONDITION_CATEGORY);
export const ADAPTER_FLAW_TYPES = Object.keys(FLAW_CATEGORY);
const TOP = ['adapter_contract', 'model_id', 'model_version', 'prompt_version', 'completion', 'conditions', 'findings', 'revision_needed'];
const COND_FIELDS = ['status', 'explanation_id', 'note', 'uncertain'];
const FINDING_FIELDS = ['type', 'quotation', 'explanation_id', 'note', 'uncertain'];
const STATUSES = ['pass', 'review', 'gap'];

// Determination language in model-authored text. Quotations are exempt: they are record text.
export const DETERMINATION = /\b(ready|defensible|compliant|certified|court-proof|audit-proof|validated|sign-off ready)\b|\b(?:is|are|should be|can be|may be|must be|could be|deemed|considered)\s+(?:fully\s+|now\s+)?(?:approved|acceptable|adequate|satisfactory|accepted|sufficient overall)\b|\b(?:approve|accept|reject)\s+(?:this|the)\s+(?:record|exception|draft|request)\b/i;

export function explanationIdFor(kind, key) {
  var table = kind === 'condition' ? CONDITION_CATEGORY : FLAW_CATEGORY;
  if (!Object.prototype.hasOwnProperty.call(table, key)) return null;
  return table[key] || key;
}

function hasNumber(v) {
  if (typeof v === 'number') return true;
  if (Array.isArray(v)) return v.some(hasNumber);
  if (v && typeof v === 'object') return Object.keys(v).some(function (k) { return hasNumber(v[k]); });
  return false;
}

function isText(v) { return typeof v === 'string'; }

// Returns { ok: true, output } or { ok: false, codes: [...], details: [...] }.
export function validateAdapterOutput(raw, recordText, expected) {
  var codes = [], details = [];
  var fail = function (code, detail) { if (codes.indexOf(code) === -1) codes.push(code); details.push(code + (detail ? ': ' + detail : '')); };
  var o = raw;
  if (typeof raw === 'string') {
    try { o = JSON.parse(raw); } catch (e) { fail('not_json', 'output is not complete JSON'); return { ok: false, codes: codes, details: details }; }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) { fail('not_an_object'); return { ok: false, codes: codes, details: details }; }

  Object.keys(o).forEach(function (k) { if (TOP.indexOf(k) === -1) fail('unknown_field', k); });
  if (hasNumber(o)) fail('numeric_value', 'numbers are not permitted in adapter output');
  if (o.adapter_contract !== ADAPTER_CONTRACT) fail('wrong_contract');
  ['model_id', 'model_version', 'prompt_version'].forEach(function (k) {
    if (!isText(o[k]) || !o[k].trim()) fail('missing_identity', k);
    else if (expected && expected[k] !== o[k]) fail('identity_mismatch', k);
  });
  if (o.completion === 'incomplete') fail('adapter_reported_incomplete');
  else if (o.completion !== 'complete') fail('invalid_completion');

  var c = o.conditions;
  if (!c || typeof c !== 'object' || Array.isArray(c)) fail('missing_condition', 'conditions');
  else {
    Object.keys(c).forEach(function (k) { if (ADAPTER_CONDITION_KEYS.indexOf(k) === -1) fail('unknown_field', 'conditions.' + k); });
    ADAPTER_CONDITION_KEYS.forEach(function (k) {
      var e = c[k];
      if (!e || typeof e !== 'object') { fail('missing_condition', k); return; }
      Object.keys(e).forEach(function (f) { if (COND_FIELDS.indexOf(f) === -1) fail('unknown_field', 'conditions.' + k + '.' + f); });
      if (STATUSES.indexOf(e.status) === -1) fail('invalid_status', k);
      if (e.explanation_id !== explanationIdFor('condition', k)) fail('invalid_explanation_id', k);
      if (!isText(e.note)) fail('missing_note', k);
      else if (DETERMINATION.test(e.note)) fail('determination_language', 'conditions.' + k + '.note');
      if (typeof e.uncertain !== 'boolean') fail('invalid_uncertainty', k);
    });
  }

  if (!Array.isArray(o.findings)) fail('missing_findings');
  else o.findings.forEach(function (f, i) {
    if (!f || typeof f !== 'object') { fail('invalid_finding', String(i)); return; }
    Object.keys(f).forEach(function (k) { if (FINDING_FIELDS.indexOf(k) === -1) fail('unknown_field', 'findings.' + i + '.' + k); });
    if (ADAPTER_FLAW_TYPES.indexOf(f.type) === -1) fail('invalid_finding_type', String(i));
    else if (f.explanation_id !== explanationIdFor('flaw', f.type)) fail('invalid_explanation_id', 'findings.' + i);
    if (!isText(f.quotation) || !f.quotation.trim()) fail('missing_quotation', String(i));
    else if (typeof recordText !== 'string' || recordText.indexOf(f.quotation) === -1) fail('quotation_not_in_record', String(i));
    if (!isText(f.note)) fail('missing_note', 'findings.' + i);
    else if (DETERMINATION.test(f.note)) fail('determination_language', 'findings.' + i + '.note');
    if (typeof f.uncertain !== 'boolean') fail('invalid_uncertainty', 'findings.' + i);
  });

  if (o.revision_needed !== null && o.revision_needed !== undefined) {
    if (!isText(o.revision_needed)) fail('invalid_revision');
    else if (DETERMINATION.test(o.revision_needed)) fail('determination_language', 'revision_needed');
  }
  return codes.length ? { ok: false, codes: codes, details: details } : { ok: true, output: o };
}

export function assertAdapter(adapter) {
  if (!adapter || typeof adapter.examine !== 'function' || typeof adapter.describe !== 'function') {
    throw new Error('adapter must provide describe() and examine(); this candidate has no provider access of its own');
  }
  var d = adapter.describe();
  ['model_id', 'model_version', 'prompt_version'].forEach(function (k) {
    if (!d || typeof d[k] !== 'string' || !d[k].trim()) throw new Error('adapter describe() must state ' + k);
  });
  return { model_id: d.model_id, model_version: d.model_version, prompt_version: d.prompt_version };
}
