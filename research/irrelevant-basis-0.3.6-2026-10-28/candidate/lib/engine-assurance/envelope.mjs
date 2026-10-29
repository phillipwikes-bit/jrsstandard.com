// JRS ENGINE ASSURANCE: Review Run Envelope validation and normalisation.
//
// Two layers, both required for a valid envelope:
//   1. Structural: the JSON Schema at
//      research/engine-assurance-2026-10-10/contracts/review-run-envelope.schema.json,
//      applied by a SUBSET validator that fails closed on any keyword it does not
//      implement (the same discipline as tools/validate-manifest.js).
//   2. Semantic: cross-field rules R1-R12 below, which JSON Schema cannot express
//      without constructs this validator deliberately does not implement.
//
// The envelope is private and local. It is not the public API contract and not
// the Decision Reconstruction Manifest.

import { readFileSync } from 'node:fs';
import { CONDITION_KEYS } from './candidate-core.mjs';
import { SUPPORTED_VERSIONS } from './versions.mjs';
import { SPAN_LIMITATION, verifySpan } from './span-verify.mjs';
import { scanObject } from './content-guard.mjs';
import { canonicalize } from '../manifest/canonicalize.js';
import { sha256Prefixed } from '../manifest/hash.js';

export const SCHEMA_PATH = new URL('../../research/engine-assurance-2026-10-10/contracts/review-run-envelope.schema.json', import.meta.url);
export function loadEnvelopeSchema() { return JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')); }

export const REQUIRED_LIMITATION_IDS = Object.freeze(['L-01', 'L-02', 'L-03', 'L-04', 'L-05', 'L-06', 'L-07']);

const KNOWN = new Set(['$schema', '$id', '$ref', '$defs', 'title', 'description', 'type', 'required', 'properties',
  'additionalProperties', 'enum', 'const', 'pattern', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength',
  'minimum', 'maximum', 'minProperties', 'format']);
const DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function typeOk(v, t) {
  if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  if (t === 'array') return Array.isArray(v);
  if (t === 'integer') return Number.isInteger(v);
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
  return typeof v === t;
}

export function validateStructure(node, schema, root = schema, path = '$', errs = []) {
  for (const kw of Object.keys(schema)) {
    if (!KNOWN.has(kw)) { errs.push(path + ': schema keyword ' + kw + ' is not implemented; failing closed'); return errs; }
  }
  if (schema.$ref) {
    const m = /^#\/\$defs\/([A-Za-z0-9_]+)$/.exec(schema.$ref);
    if (!m || !root.$defs || !root.$defs[m[1]]) { errs.push(path + ': unresolvable $ref ' + schema.$ref); return errs; }
    return validateStructure(node, root.$defs[m[1]], root, path, errs);
  }
  if ('const' in schema && node !== schema.const) errs.push(path + ': expected ' + JSON.stringify(schema.const));
  if (schema.enum && !schema.enum.includes(node)) errs.push(path + ': ' + JSON.stringify(node) + ' is not one of ' + JSON.stringify(schema.enum));
  if (schema.type && !typeOk(node, schema.type)) { errs.push(path + ': expected ' + schema.type); return errs; }
  if (typeOk(node, 'object')) {
    for (const r of schema.required || []) if (!(r in node)) errs.push(path + '.' + r + ': required field missing');
    if (schema.minProperties != null && Object.keys(node).length < schema.minProperties) errs.push(path + ': too few properties');
    const props = schema.properties || {};
    for (const k of Object.keys(node)) {
      if (props[k]) validateStructure(node[k], props[k], root, path + '.' + k, errs);
      else if (schema.additionalProperties === false) errs.push(path + '.' + k + ': field not permitted');
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validateStructure(node[k], schema.additionalProperties, root, path + '.' + k, errs);
      }
    }
  }
  if (Array.isArray(node)) {
    if (schema.minItems != null && node.length < schema.minItems) errs.push(path + ': fewer than ' + schema.minItems + ' items');
    if (schema.maxItems != null && node.length > schema.maxItems) errs.push(path + ': more than ' + schema.maxItems + ' items');
    if (schema.items) node.forEach((v, i) => validateStructure(v, schema.items, root, path + '[' + i + ']', errs));
  }
  if (typeof node === 'string') {
    if (schema.minLength != null && node.length < schema.minLength) errs.push(path + ': shorter than ' + schema.minLength);
    if (schema.maxLength != null && node.length > schema.maxLength) errs.push(path + ': longer than ' + schema.maxLength);
    if (schema.pattern && !new RegExp(schema.pattern).test(node)) errs.push(path + ': does not match ' + schema.pattern);
    if (schema.format === 'date-time' && !DATE_RE.test(node)) errs.push(path + ': not an RFC 3339 timestamp');
    if (schema.format === 'uuid' && !UUID_RE.test(node)) errs.push(path + ': not a UUID');
  }
  if (typeof node === 'number') {
    if (schema.minimum != null && node < schema.minimum) errs.push(path + ': below ' + schema.minimum);
    if (schema.maximum != null && node > schema.maximum) errs.push(path + ': above ' + schema.maximum);
  }
  return errs;
}

const FAVOURABLE = new Set(['supported', 'gap']);
const EXPECTED_CANDIDATE = { supported: 'pass', gap: 'gap' };
// Keys that would assert a status the package cannot support, at any depth.
const STATUS_CLAIM_KEY = /(production|ready|readiness|certif|complian|approved|validated|guarantee|license|licence|sale)/i;

// Fields that hold record text verbatim. They are checked against the record,
// not against the claim guard, because a synthetic record may legitimately
// contain a term such as "guaranteed" that a record control is reporting.
const RECORD_TEXT_FIELDS = new Set(['quote', 'matched_text']);

function stripRecordText(v) {
  if (Array.isArray(v)) return v.map(stripRecordText);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) if (!RECORD_TEXT_FIELDS.has(k)) o[k] = stripRecordText(v[k]);
    return o;
  }
  return v;
}

// Semantic rules. `record` is optional; when supplied every span is re-verified.
export function validateSemantics(env, record) {
  const errs = [];
  const add = (rule, msg) => errs.push(rule + ': ' + msg);
  if (!env || typeof env !== 'object') return ['R0: envelope is not an object'];
  const cf = (env.findings && Array.isArray(env.findings.condition_findings)) ? env.findings.condition_findings : [];
  const refusals = Array.isArray(env.refusals) ? env.refusals : [];
  const codes = new Set(refusals.map((r) => r && r.code));

  // R1 execution mode and provider mode agree.
  if (env.execution_mode === 'local_mocked' && env.provider_mode !== 'mocked') add('R1', 'local_mocked requires provider_mode mocked');
  if (env.execution_mode === 'local_deterministic' && env.provider_mode !== 'not_used') add('R1', 'local_deterministic requires provider_mode not_used');
  if (env.provider_mode === 'not_used' && env.provider_invocations !== 0) add('R1', 'provider_mode not_used with a provider invocation');

  // R2 an unauthorized execution mode can only be a refusal.
  if (env.execution_mode === 'external_not_authorized') {
    if (!codes.has('execution_mode_not_authorized')) add('R2', 'external_not_authorized without an execution_mode_not_authorized refusal');
    if (cf.some((f) => f.outcome !== 'not_assessed')) add('R2', 'external_not_authorized with an assessed condition');
    if (env.provider_invocations !== 0) add('R2', 'external_not_authorized with a provider invocation');
  }

  // R3 a refusal or escalation leaves nothing assessed and nothing favourable.
  const gateStopped = env.gate && (env.gate.decision === 'refuse' || env.gate.decision === 'escalate');
  if (gateStopped) {
    if (cf.some((f) => f.outcome !== 'not_assessed')) add('R3', 'gate ' + env.gate.decision + ' but a condition was assessed');
    if (env.provider_invocations !== 0) add('R3', 'gate ' + env.gate.decision + ' but the provider was invoked');
    if (env.manifest_reference && env.manifest_reference.produced) add('R3', 'gate ' + env.gate.decision + ' but a Manifest was produced');
    if (!refusals.some((r) => r.stage === 'pre_analysis')) add('R3', 'gate ' + env.gate.decision + ' without a pre_analysis refusal entry');
    if (env.findings && env.findings.record_controls && env.findings.record_controls.length) add('R3', 'gate stopped but record controls were reported');
  }
  if (env.gate && env.gate.decision === 'proceed' && refusals.some((r) => r.stage === 'pre_analysis')) add('R3', 'pre_analysis refusal recorded but gate decision is proceed');

  // R4 exactly the five Engine conditions, once each.
  const ids = cf.map((f) => f.condition_id);
  if (ids.length !== CONDITION_KEYS.length || CONDITION_KEYS.some((k) => ids.filter((x) => x === k).length !== 1)) {
    add('R4', 'condition findings must be exactly the five Engine condition keys, once each');
  }

  for (const f of cf) {
    if (!f || typeof f !== 'object') continue;
    const where = f.condition_id;
    // R5 favourable or gap outcomes require verified exact spans and the matching candidate status.
    if (FAVOURABLE.has(f.outcome)) {
      if (!Array.isArray(f.source_spans) || !f.source_spans.length) add('R5', where + ': ' + f.outcome + ' without a source span');
      if (f.evidence_classification !== 'contains_record') add('R5', where + ': ' + f.outcome + ' must be classified contains_record');
      if (f.outcome_basis !== 'candidate_status_with_verified_span') add('R5', where + ': ' + f.outcome + ' with basis ' + f.outcome_basis);
      if (f.candidate_status !== EXPECTED_CANDIDATE[f.outcome]) add('R5', where + ': ' + f.outcome + ' does not follow candidate status ' + f.candidate_status);
      if (f.explanation_content_class !== 'derived_record_content') add('R5', where + ': favourable or gap finding without a candidate explanation');
    }
    // R6 review_required can never have been promoted: a review candidate status stays review_required.
    if (f.candidate_status === 'review' && f.outcome !== 'review_required' && f.outcome !== 'not_assessed') add('R6', where + ': candidate review converted to ' + f.outcome);
    // R7 not_assessed carries no spans and no record support.
    if (f.outcome === 'not_assessed') {
      if (f.source_spans && f.source_spans.length) add('R7', where + ': not_assessed with source spans');
      if (f.evidence_classification !== 'no_verified_record_support') add('R7', where + ': not_assessed must be no_verified_record_support');
    }
    // R8 every finding carries the span limitation verbatim.
    if (typeof f.limitation !== 'string' || !f.limitation.includes(SPAN_LIMITATION)) add('R8', where + ': required limitation missing or altered');
    // R9 spans re-verified against the record.
    if (record !== undefined && Array.isArray(f.source_spans)) {
      for (const s of f.source_spans) if (!verifySpan(record, s)) add('R9', where + ': span does not match the record at its offsets');
    }
  }
  if (record !== undefined && env.findings && Array.isArray(env.findings.record_controls)) {
    for (const c of env.findings.record_controls) {
      for (const s of (c.detect && c.detect.spans) || []) if (!verifySpan(record, s)) add('R9', c.control_id + ': span does not match the record');
    }
  }

  // R10 versions agree with the supported set and with any Manifest produced.
  if (!SUPPORTED_VERSIONS.engine_version.includes(env.engine_version)) add('R10', 'unsupported engine_version');
  if (!SUPPORTED_VERSIONS.codebook_version.includes(env.codebook_version)) add('R10', 'unsupported codebook_version');
  const mr = env.manifest_reference;
  if (mr && mr.produced) {
    if (mr.engine_version !== env.engine_version) add('R10', 'Manifest engine version conflicts with envelope');
    if (mr.codebook_version !== env.codebook_version) add('R10', 'Manifest codebook version conflicts with envelope');
    if (!SUPPORTED_VERSIONS.manifest_version.includes(mr.manifest_version)) add('R10', 'unsupported Manifest version');
    if (!SUPPORTED_VERSIONS.jrs_version.includes(mr.jrs_version)) add('R10', 'unsupported JRS version in Manifest');
    for (const k of ['manifest_id', 'manifest_hash', 'represents', 'offline_validation']) if (!(k in mr)) add('R10', 'produced Manifest reference lacks ' + k);
    if (mr.offline_validation !== 'schema_valid_and_self_consistent') add('R10', 'produced Manifest did not validate offline');
  }

  // R11 required limitations present, and human review always required.
  const lids = new Set((env.limitations || []).map((l) => l && l.id));
  for (const id of REQUIRED_LIMITATION_IDS) if (!lids.has(id)) add('R11', 'limitation ' + id + ' missing');
  if (env.human_review_required !== true) add('R11', 'human_review_required must be true');

  // R12 no status claim anywhere, by key or by unnegated wording.
  const walkKeys = (v, p) => {
    if (Array.isArray(v)) v.forEach((x, i) => walkKeys(x, p + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) {
      if (STATUS_CLAIM_KEY.test(k) && !(p === '$' && k === 'human_review_required')) add('R12', 'status-claim key ' + p + '.' + k);
      walkKeys(v[k], p + '.' + k);
    }
  };
  walkKeys(env, '$');
  for (const f of scanObject(stripRecordText(env))) add('R12', 'unsupported claim "' + f.term + '" at ' + f.path);
  if (env.release_status !== 'NO_GO_NOT_VERIFIED') add('R12', 'release_status must be NO_GO_NOT_VERIFIED');
  return errs;
}

export function validateEnvelope(env, record, schema = loadEnvelopeSchema()) {
  const structural = validateStructure(env, schema);
  const semantic = validateSemantics(env, record);
  return { valid: !structural.length && !semantic.length, structural, semantic };
}

// Normalised output: everything that should be identical across replays of the
// same fixture on the same code, with keys sorted. Run identity, wall-clock
// time, code hashes and repository state are excluded so that a replay compares
// behaviour rather than the moment it ran.
export function normalizeEnvelope(env) {
  const copy = JSON.parse(JSON.stringify(env));
  delete copy.run_id;
  delete copy.run_timestamp;
  delete copy.artifact_hashes;
  if (copy.source_identity) { delete copy.source_identity.repository_head; delete copy.source_identity.working_tree; }
  if (copy.manifest_reference) { delete copy.manifest_reference.manifest_id; delete copy.manifest_reference.manifest_hash; }
  return canonicalize(copy);
}

export async function normalizedOutputHash(env) {
  return sha256Prefixed(normalizeEnvelope(env));
}
