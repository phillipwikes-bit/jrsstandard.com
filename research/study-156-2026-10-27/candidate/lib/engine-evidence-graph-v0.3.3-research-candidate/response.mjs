// JRS EVIDENCE GRAPH 0.3.0: quote-only candidate response validation.
//
// A candidate response may contain only:
//   { "contract_version", "prompt_version", "observations": [ { "observation_id",
//     "condition_id", "proposed_status", "quote", "assertion_type",
//     optional "disambiguator", optional "note" } ] }
// Any field that would let the candidate assert an offset, section, location,
// evidence status, graph link or final status invalidates the whole response.
// Strict JSON intake (duplicate keys, prose around JSON) is the 0.2 parser, reused.

import { parseCandidateResponse } from '../engine-evidence-contract/strict-json.mjs';
import { CONTRACT_VERSION, PROMPT_VERSION, CONDITION_IDS, STATUSES } from './contract.mjs';

const OBS_KEYS = ['observation_id', 'condition_id', 'proposed_status', 'quote', 'assertion_type', 'disambiguator', 'note'];
const OBS_REQUIRED = ['observation_id', 'condition_id', 'proposed_status', 'quote', 'assertion_type'];
export const UNTRUSTED_FIELDS = Object.freeze(['start_offset', 'end_offset', 'offset', 'offsets', 'start', 'end', 'section', 'record_section', 'location',
  'evidence_status', 'quote_resolution_status', 'presence_verified', 'final_status', 'status', 'edges', 'graph', 'span_id', 'human_review_required']);
export const MAX_OBSERVATIONS = 25;

export function validateCandidate(text, { promptVersion = PROMPT_VERSION } = {}) {
  const p = parseCandidateResponse(text);
  const fail = (reason) => ({ ok: false, reason, notes: p.notes || [] });
  if (!p.ok) return fail(p.reason);
  const v = p.value;
  const top = Object.keys(v).filter((k) => !['contract_version', 'prompt_version', 'observations'].includes(k));
  if (top.length) return fail('undeclared_top_level_fields');
  if (v.contract_version !== CONTRACT_VERSION) return fail('contract_version_mismatch');
  if (v.prompt_version !== promptVersion) return fail('prompt_version_mismatch');
  if (!Array.isArray(v.observations) || !v.observations.length) return fail('observations_missing');
  if (v.observations.length > MAX_OBSERVATIONS) return fail('too_many_observations');
  const ids = new Set();
  for (const o of v.observations) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return fail('observation_not_an_object');
    if (Object.keys(o).some((k) => UNTRUSTED_FIELDS.includes(k))) return fail('candidate_supplied_untrusted_field');
    if (Object.keys(o).some((k) => !OBS_KEYS.includes(k))) return fail('undeclared_observation_field');
    if (OBS_REQUIRED.some((k) => !(k in o))) return fail('observation_missing_field');
    if (typeof o.observation_id !== 'string' || !/^[A-Za-z0-9_-]{1,24}$/.test(o.observation_id) || ids.has(o.observation_id)) return fail('observation_id_invalid_or_duplicate');
    ids.add(o.observation_id);
    if (!CONDITION_IDS.includes(o.condition_id)) return fail('unrecognised_condition_id');
    if (!STATUSES.includes(o.proposed_status)) return fail('invalid_proposed_status');
    if (o.quote !== null && typeof o.quote !== 'string') return fail('quote_not_text_or_null');
    if (o.note !== undefined && (typeof o.note !== 'string' || o.note.length > 400)) return fail('note_invalid');
  }
  return { ok: true, value: v, notes: p.notes || [] };
}
