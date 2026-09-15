// JRS MANIFEST — BUILDER
//
// ARCHITECTURE: Review Engine -> Manifest Builder. NEVER the reverse.
//
// This module REPRESENTS an evaluation. It does not perform one. It must not
// create conditions, change a status, resolve a mapping, translate a routing
// vocabulary, or infer legal sufficiency, validation or compliance. If it
// cannot represent the engine's output without making a substantive
// assumption, it THROWS rather than guessing.
//
// The two places it would be easiest to guess are the two it refuses to:
//
//   1. CONDITION VOCABULARY. Three of the five Codebook-to-engine mappings are
//      UNRESOLVED. The builder emits 'review_engine_keys' and will not accept
//      'jrs_codebook_1.0' unless the caller supplies an owner-declared mapping.
//      Relabelling engine keys as Codebook conditions would silently answer D-2
//      and D-3 in code.
//
//   2. ROUTING VOCABULARY. Two exist. The builder records which one the value
//      came from and performs NO translation between them.

import { canonicalizeForHashing, CANONICALIZATION_ID } from './canonicalize.js';
import { sha256Prefixed, hashInput } from './hash.js';

export const MANIFEST_VERSION = '1.0';

export const ENGINE_CONDITION_KEYS = [
  'basis_identification',
  'reasoning_traceability',
  'cold_reviewer_clarity',
  'accountability_support',
  'temporal_reconstructability',
];

const STATUSES = ['pass', 'review', 'gap'];

// Why true and why it is not a parameter with a false default: the engine is
// empirically unvalidated, so shipping a manifest that said human review was
// unnecessary would assert what the research does not support.
const HUMAN_REVIEW_REASON =
  'Human review remains required because the current Review Engine is not '
  + 'established as validated for autonomous consequential decision use.';

export async function buildManifest(opts) {
  const {
    engineResult, sourceText, jrsVersion, codebookVersion,
    engine, context, conditionVocabulary, routingVocabulary,
    includeNotes = true, rawRecord = null, manifestId, createdAt, warnings,
  } = opts || {};

  if (!engineResult || typeof engineResult !== 'object') {
    throw new Error('manifest_build_failed: engineResult is required');
  }
  if (!jrsVersion) throw new Error('manifest_build_failed: jrsVersion is required');
  if (!codebookVersion) throw new Error('manifest_build_failed: codebookVersion is required');
  if (!engine || !engine.name || !engine.version || !engine.model || !engine.api_version) {
    throw new Error('manifest_build_failed: engine name, version, model and api_version are required');
  }

  // CONTROL 1 — vocabulary is declared, never inferred.
  const cv = conditionVocabulary || 'review_engine_keys';
  if (cv !== 'review_engine_keys' && cv !== 'jrs_codebook_1.0') {
    throw new Error('manifest_build_failed: unknown condition_vocabulary ' + cv);
  }
  if (cv === 'jrs_codebook_1.0' && !opts.ownerDeclaredMapping) {
    throw new Error(
      'manifest_build_failed: condition_vocabulary jrs_codebook_1.0 requires an '
      + 'owner-declared mapping. Three of five Codebook-to-engine mappings are '
      + 'UNRESOLVED (D-3) and cold_reviewer_clarity is INSUFFICIENTLY ESTABLISHED '
      + '(D-2). Relabelling engine keys would resolve them by assumption.');
  }

  // CONTROL 2 — routing is recorded with its vocabulary, never translated.
  const rv = routingVocabulary || 'engine_determination';
  if (rv !== 'engine_determination' && rv !== 'openapi_1.0_routing') {
    throw new Error('manifest_build_failed: unknown routing_vocabulary ' + rv);
  }
  const src = engineResult.result || engineResult;
  const routingValue = rv === 'engine_determination' ? src.determination : src.routing;
  if (!routingValue) {
    throw new Error('manifest_build_failed: no routing value for vocabulary ' + rv
      + '. The builder does not translate between vocabularies.');
  }

  // Conditions are copied, never recomputed.
  const srcConditions = src.conditions || {};
  const conditions = {};
  let anyNote = false;
  for (const k of Object.keys(srcConditions)) {
    const c = srcConditions[k] || {};
    if (STATUSES.indexOf(c.status) === -1) {
      throw new Error('manifest_build_failed: condition ' + k + ' has status '
        + JSON.stringify(c.status) + ', which the builder will not coerce');
    }
    const entry = { status: c.status };
    if (includeNotes && c.note) {
      entry.note = String(c.note).slice(0, 400);
      entry.note_content_class = 'derived_record_content';
      anyNote = true;
    }
    conditions[k] = entry;
  }
  if (Object.keys(conditions).length !== 5) {
    throw new Error('manifest_build_failed: expected 5 conditions, received '
      + Object.keys(conditions).length);
  }

  // CONTROL 3 — content class is DERIVED from what is actually present.
  // It is not a caller assertion, because a caller that got it wrong would
  // publish a manifest claiming to be record-free while paraphrasing a record.
  const content_class = rawRecord ? 'contains_record'
    : (anyNote ? 'derived_record_content' : 'no_record_content');

  const manifest = {
    manifest_id: manifestId || crypto.randomUUID(),
    manifest_version: MANIFEST_VERSION,
    created_at: createdAt || new Date().toISOString(),
    jrs_version: jrsVersion,
    codebook_version: codebookVersion,
    engine: {
      name: engine.name, version: engine.version,
      model: engine.model, api_version: engine.api_version,
    },
    input: await hashInput(sourceText),
    condition_vocabulary: cv,
    conditions: conditions,
    routing: { value: routingValue, vocabulary: rv },
    human_review: { required: true, reason: HUMAN_REVIEW_REASON },
    content_class: content_class,
  };

  if (context && Object.keys(context).length) manifest.context = context;
  if (Array.isArray(warnings) && warnings.length) manifest.warnings = warnings;

  const evaluation = {};
  if (engineResult.runs) evaluation.runs = engineResult.runs;
  if (engineResult.variance) evaluation.variance = engineResult.variance;
  if (engineResult.runs && engineResult.runs > 1) {
    // Wording is constrained: stability is not accuracy and not validation.
    evaluation.reproducibility_note =
      'Agreement across repeated runs describes the stability of the output. '
      + 'It is not a measure of accuracy and does not establish validation.';
  }
  if (Object.keys(evaluation).length) manifest.evaluation = evaluation;

  manifest.integrity = {
    manifest_hash: await sha256Prefixed(canonicalizeForHashing(manifest)),
    canonicalization: CANONICALIZATION_ID,
  };
  return manifest;
}
