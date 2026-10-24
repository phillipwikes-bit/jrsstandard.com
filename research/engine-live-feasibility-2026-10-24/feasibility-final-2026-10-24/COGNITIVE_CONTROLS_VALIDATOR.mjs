// Cognitive-controls review-note validator (scratch-only human-review layer).
//
// Runs outside the frozen Engine. It reads the graph and execution record but never
// writes them, and it never produces a supported outcome: its outcome is one of
// review_blocked, escalated, uncertain or observed, preserving the reviewer's states.
// The provenance pair check is run here, never taken from the note.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pairCheck } from './harness-v2/src/adapter.mjs';

export const STATES = Object.freeze(['observed', 'uncertain', 'escalated', 'review_blocked']);
export const CONTROL_IDS = Object.freeze(['RC-01', 'RC-02', 'RC-03', 'RC-04', 'RC-05', 'RC-06', 'RC-07', 'RC-08']);
const SUPPORT_VALUES = ['yes', 'no', 'uncertain'];
// Keys that would let a note set or alter Engine output. Rejected anywhere in the note.
const OVERRIDE_KEYS = ['status', 'final_status', 'proposed_status', 'override', 'engine_output', 'findings', 'set_status', 'result', 'graph', 'nodes', 'edges'];
const PROHIBITED = /\b(clinical\w*|diagnos\w*|therap\w*|performance|performing|performant|validated|validation|release[- ]ready|production[- ]ready|reliab\w*)\b/i;

const sha = (b) => createHash('sha256').update(b).digest('hex');
function walkKeys(o, path, out) {
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { out.push({ k, path: path + '.' + k, v }); walkKeys(v, path + '.' + k, out); }
  return out;
}
function texts(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (o && typeof o === 'object') for (const v of Object.values(o)) texts(v, out);
  return out;
}

export function validateReviewNote(note, { setRegister }) {
  const reject = (code, extra = {}) => ({ accepted: false, outcome: 'rejected', code, ...extra });
  if (!note || typeof note !== 'object') return reject('note_not_an_object');

  // V-CC-01: provenance pair check, before anything else.
  const pc = pairCheck(note.execution_record_file, { setRegister });
  if (!pc.ok) return { accepted: false, outcome: 'review_blocked', code: 'provenance_check_failed', provenance: pc };
  const rec = JSON.parse(readFileSync(note.execution_record_file, 'utf8'));
  if (note.request_id !== rec.request_id) return { accepted: false, outcome: 'review_blocked', code: 'note_request_id_does_not_match_record' };
  const graphBytes = readFileSync(rec.graph_file);
  const graphHashBefore = sha(graphBytes);
  const graph = JSON.parse(graphBytes);

  // V-CC-06: no override keys anywhere.
  const keys = walkKeys(note, 'note', []);
  const override = keys.find((x) => OVERRIDE_KEYS.includes(x.k));
  if (override) return reject('engine_output_override_attempt', { at: override.path });

  // V-CC-02: every control present, valid state, non-empty note.
  if (!note.controls || typeof note.controls !== 'object') return reject('controls_missing');
  for (const id of CONTROL_IDS) {
    const c = note.controls[id];
    if (!c) return reject('control_missing:' + id);
    if (!STATES.includes(c.state)) return reject('control_state_invalid:' + id);
    if (typeof c.note !== 'string' || !c.note.trim()) return reject('control_note_empty:' + id);
  }
  // V-CC-03 and V-CC-04: uncertainty and escalation treatment are mandatory.
  if (typeof note.uncertainty_treatment !== 'string' || !note.uncertainty_treatment.trim()) return reject('uncertainty_treatment_missing');
  const esc = note.escalation_treatment;
  if (!esc || typeof esc.escalate !== 'boolean' || typeof esc.reason !== 'string' || !esc.reason.trim()) return reject('escalation_treatment_missing');

  // V-CC-05: support observations must match the graph exactly and may not claim support it does not show.
  for (const s of note.support_observations || []) {
    const f = (graph.findings || []).find((x) => x.condition_id === s.condition_id);
    if (!f) return reject('support_observation_condition_not_in_graph');
    if (s.graph_status_observed !== f.status) return reject('graph_status_misreported');
    if (!SUPPORT_VALUES.includes(s.quote_semantically_supports)) return reject('support_value_invalid');
    if (s.quote_semantically_supports === 'yes' && f.status !== 'supported') return reject('unsupported_support_claim');
  }
  // V-CC-07: prohibited characterizations.
  const bad = texts(note).find((t) => PROHIBITED.test(t));
  if (bad) return reject('prohibited_characterization');

  // Outcome preserves the reviewer's states; it is never a supported or favorable result.
  const states = CONTROL_IDS.map((id) => note.controls[id].state);
  const outcome = states.includes('review_blocked') ? 'review_blocked' : (states.includes('escalated') || esc.escalate) ? 'escalated' : states.includes('uncertain') ? 'uncertain' : 'observed';
  const graphHashAfter = sha(readFileSync(rec.graph_file));
  if (graphHashAfter !== graphHashBefore) return reject('graph_changed_during_validation');
  return { accepted: true, outcome, control_states: Object.fromEntries(CONTROL_IDS.map((id) => [id, note.controls[id].state])), graph_sha256_unchanged: true, engine_output_modified: false };
}
