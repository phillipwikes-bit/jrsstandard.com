// JRS controlled independent-evaluation readiness: separated review workspaces. INTERNAL. FAILS CLOSED.
//
// Four workspaces that are never collapsed into one another:
//   extraction      RECORD_SUPPORTED_FACT, EXTRACTION_ARTIFACT
//   interpretation  HUMAN_INTERPRETATION (one condition, one determination, blind to candidate output)
//   comparison      CANDIDATE_ENGINE_OUTPUT (candidate key, never a condition), REVIEWER_DISAGREEMENT
//   adjudication    ADJUDICATED_CONCLUSION (only under a frozen adjudication protocol)
// A GATE_CONCLUSION belongs to no workspace: only the role named in the authority matrix records one,
// in the release-gate record, and no code path here can create it.
//
// Items hold locations, never record text. Nothing is scored: agreement and DRR functions exist only
// to refuse, and stay refusals after the freezes, because no protocol for them is frozen or implemented.
import { CONDITION_IDS, DETERMINATIONS, FREEZES, RECORD_TEXT_FIELDS, MAX_FREE_TEXT, inferenceGroups, loadMapping, loadRegistry } from './vocabulary.js';

export const WORKSPACE_VERSION = 'jrs-evaluation-review-workspace/0.1.0';
export const KIND_WORKSPACE = Object.freeze({
  RECORD_SUPPORTED_FACT: 'extraction', EXTRACTION_ARTIFACT: 'extraction', HUMAN_INTERPRETATION: 'interpretation',
  CANDIDATE_ENGINE_OUTPUT: 'comparison', REVIEWER_DISAGREEMENT: 'comparison', ADJUDICATED_CONCLUSION: 'adjudication',
});
export const WORKSPACES = Object.freeze(['extraction', 'interpretation', 'comparison', 'adjudication']);
const AUTHOR = Object.freeze({
  RECORD_SUPPORTED_FACT: [['human', 'independent_reviewer']], EXTRACTION_ARTIFACT: [['human', 'independent_reviewer'], ['code', 'extraction_tool']],
  HUMAN_INTERPRETATION: [['human', 'independent_reviewer']], CANDIDATE_ENGINE_OUTPUT: [['engine', 'candidate']],
  REVIEWER_DISAGREEMENT: [['code', 'comparison_tool'], ['human', 'adjudicator']], ADJUDICATED_CONCLUSION: [['human', 'adjudicator']],
});
const NOTE_FIELDS = ['note', 'basis_note', 'missing_element', 'reason', 'summary', 'rationale'];
const filled = (v) => v !== null && v !== undefined && !(typeof v === 'string' && !v.trim());
const clone = (o) => JSON.parse(JSON.stringify(o));
function walk(v, fn, path = '$') {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, path + '[' + i + ']'));
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) { fn(k, v[k], path + '.' + k); walk(v[k], fn, path + '.' + k); }
}

// A workspace for a real evaluation needs an admitted intake, which this package never produces.
// A synthetic probe workspace exists only to exercise the controls, with SYNTHETIC- tokens throughout.
export function createEvaluationWorkspace({ mode, intakeDecision, freezes } = {}) {
  if (mode === 'evaluation') {
    if (!intakeDecision || intakeDecision.decision !== 'ADMITTED') return { ok: false, codes: [{ code: 'intake_not_admitted', control: 'WS-00', message: 'A workspace for real records needs an admitted intake; intake is closed.' }] };
    freezes = loadRegistry().freezes;
  } else if (mode !== 'synthetic_probe') return { ok: false, codes: [{ code: 'unknown_mode', control: 'WS-00', message: 'Mode must be synthetic_probe; evaluation needs an admitted intake.' }] };
  const f = {};
  for (const k of FREEZES) {
    const x = (freezes || {})[k] || { frozen: false, freeze_record_ref: null };
    if (x.frozen === true && !filled(x.freeze_record_ref)) return { ok: false, codes: [{ code: 'freeze_without_record', control: 'WS-00', message: 'A freeze needs an owner freeze record: ' + k }] };
    if (mode === 'synthetic_probe' && x.frozen === true && !/^SYNTHETIC-/.test(x.freeze_record_ref)) return { ok: false, codes: [{ code: 'probe_freeze_not_synthetic', control: 'WS-00', message: 'A probe may only use SYNTHETIC- freeze references.' }] };
    f[k] = { frozen: x.frozen === true, freeze_record_ref: x.freeze_record_ref || null };
  }
  return { ok: true, workspace: { workspace_version: WORKSPACE_VERSION, mode, freezes: f, extraction: [], interpretation: [], comparison: [], adjudication: [] } };
}

const all = (ws) => WORKSPACES.flatMap((w) => ws[w]);

export function addItem(ws, workspace, item) {
  const codes = [];
  const refuse = (code, control, message) => codes.push({ code, control, message });
  const mapping = loadMapping();
  if (!item || typeof item !== 'object') return { ok: false, codes: [{ code: 'not_an_item', control: 'WS-01' }] };
  // WS-01 the item belongs to exactly one workspace, and a gate conclusion to none.
  if (item.kind === 'GATE_CONCLUSION') refuse('gate_conclusion_outside_authority', 'WS-01', 'A gate conclusion is recorded only by the responsible role in the release-gate record.');
  else if (!KIND_WORKSPACE[item.kind]) refuse('unknown_item_kind', 'WS-01', String(item.kind));
  else if (KIND_WORKSPACE[item.kind] !== workspace) refuse('wrong_workspace', 'WS-01', item.kind + ' belongs in ' + KIND_WORKSPACE[item.kind] + ', not ' + workspace + '; workspaces are never collapsed.');
  if (!filled(item.item_id) || all(ws).some((x) => x.item_id === item.item_id)) refuse('item_id_missing_or_duplicate', 'WS-01');
  // WS-02 no record text.
  walk(item, (k, v, p) => {
    if (RECORD_TEXT_FIELDS.includes(k)) refuse('record_text_in_workspace', 'WS-02', p + ': record content is never stored; give a location reference.');
    else if (typeof v === 'string' && v.length > MAX_FREE_TEXT) refuse('record_text_in_workspace', 'WS-02', p + ' exceeds ' + MAX_FREE_TEXT + ' characters.');
  });
  // WS-03 authorship: a person's work is never generated by code, and probes never pass for real work.
  const a = item.author || {};
  const allowed = AUTHOR[item.kind] || [];
  if (!allowed.some(([k, r]) => a.kind === k && a.role === r)) refuse('author_not_permitted', 'WS-03', item.kind + ' must be authored by ' + allowed.map((x) => x.join(':')).join(' or ') + '.');
  if (!filled(a.token)) refuse('author_token_missing', 'WS-03');
  else if (ws.mode === 'synthetic_probe' && !/^SYNTHETIC-/.test(a.token)) refuse('probe_token_not_synthetic', 'WS-03');
  else if (ws.mode === 'evaluation' && /^SYNTHETIC-/.test(a.token)) refuse('synthetic_labelled_independent', 'WS-03');
  // WS-07 inference screen on every note.
  for (const k of NOTE_FIELDS) if (typeof item[k] === 'string' && inferenceGroups(item[k]).length) refuse('prohibited_inference', 'WS-07', k + ': ' + inferenceGroups(item[k]).join(', '));
  const locs = Array.isArray(item.location_refs) ? item.location_refs : [];
  const locOk = locs.every((l) => l && filled(l.source_ref) && filled(l.locator) && Object.keys(l).every((k) => ['source_ref', 'locator'].includes(k)));
  if (!locOk) refuse('location_ref_malformed', 'WS-06', 'A location reference is { source_ref, locator } and nothing else.');

  if (item.kind === 'RECORD_SUPPORTED_FACT' && !locs.length) refuse('fact_without_location', 'WS-06', 'A record-supported fact needs a location in the record.');
  if (item.kind === 'EXTRACTION_ARTIFACT' && !filled(item.extraction_version)) refuse('extraction_version_missing', 'WS-06');
  if (item.kind === 'HUMAN_INTERPRETATION') {
    // WS-04 every interpretation names one of the five conditions by ID; a label or candidate key is refused.
    if (!CONDITION_IDS.includes(item.condition_id)) refuse(mapping.candidate_keys_not_conditions.keys.includes(item.condition_id) ? 'candidate_key_as_condition' : 'unmapped_condition', 'WS-04', 'condition_id must be one of ' + CONDITION_IDS.join(', ') + '.');
    if (item.blind_to_candidate_output !== true) refuse('not_blind_to_candidate_output', 'WS-05', 'An interpretation is made blind to candidate output.');
    // WS-06 determination, with absence kept apart from defect.
    if (!DETERMINATIONS.includes(item.determination)) refuse('determination_invalid', 'WS-06', 'determination must be one of ' + DETERMINATIONS.join(', ') + '.');
    if (['AFFIRMATIVE_DEFECT', 'NO_DEFECT_OBSERVED'].includes(item.determination) && !locs.length) refuse('determination_without_location', 'WS-06', item.determination + ' needs at least one location reference.');
    if (item.determination === 'INFORMATION_MISSING' && !filled(item.missing_element)) refuse('missing_element_not_named', 'WS-06', 'Name what is missing; absence is not a defect in what is present.');
    if (item.determination === 'INSUFFICIENT_BASIS_TO_ASSESS' && !filled(item.reason)) refuse('insufficient_basis_without_reason', 'WS-06');
    if (!mapping.uncertainty_levels.includes(item.uncertainty)) refuse('uncertainty_invalid', 'WS-06', 'uncertainty must be one of ' + mapping.uncertainty_levels.join(', ') + '.');
    if (!filled(item.interpretation_version)) refuse('interpretation_version_missing', 'WS-06');
  }
  if (item.kind === 'CANDIDATE_ENGINE_OUTPUT') {
    // WS-05 candidate output keeps its own vocabulary; no condition correspondence is asserted.
    if (!mapping.candidate_keys_not_conditions.keys.includes(item.candidate_key)) refuse('candidate_key_unknown', 'WS-05');
    if ('condition_id' in item || 'condition' in item) refuse('candidate_key_mapped_to_condition', 'WS-05', 'No correspondence between a candidate key and a condition is asserted (D-2, D-3).');
  }
  if (item.kind === 'REVIEWER_DISAGREEMENT') {
    const refs = (item.interpretation_ids || []).map((id) => ws.interpretation.find((x) => x.item_id === id));
    const reviewers = new Set(refs.filter(Boolean).map((x) => x.author.token));
    if (refs.length < 2 || refs.some((x) => !x) || reviewers.size < 2) refuse('disagreement_needs_two_reviewers', 'WS-08', 'A disagreement names interpretations by at least two distinct reviewers.');
    else if (new Set(refs.map((x) => x.condition_id)).size !== 1) refuse('disagreement_across_conditions', 'WS-08');
    else if (new Set(refs.map((x) => x.determination)).size < 2) refuse('no_disagreement', 'WS-08');
  }
  if (item.kind === 'ADJUDICATED_CONCLUSION') {
    // WS-09 adjudication only under a frozen protocol, by someone other than the reviewers.
    if (!ws.freezes.adjudication_protocol.frozen) refuse('adjudication_protocol_not_frozen', 'WS-09', 'Adjudication needs an owner-frozen adjudication protocol.');
    const dis = ws.comparison.find((x) => x.item_id === item.disagreement_id && x.kind === 'REVIEWER_DISAGREEMENT');
    if (!dis) refuse('adjudication_without_disagreement', 'WS-09');
    else {
      const reviewers = dis.interpretation_ids.map((id) => ws.interpretation.find((x) => x.item_id === id).author.token);
      if (reviewers.includes(a.token)) refuse('adjudicator_is_a_reviewer', 'WS-09');
    }
    if (!filled(item.adjudication_protocol_version)) refuse('adjudication_protocol_version_missing', 'WS-09');
    if (!CONDITION_IDS.includes(item.condition_id)) refuse('unmapped_condition', 'WS-04');
  }
  if (codes.length) return { ok: false, codes };
  const next = clone(ws);
  next[workspace].push(clone(item));
  return { ok: true, workspace: next, codes: [] };
}

// WS-10: agreement is refused with one reviewer, refused before the freezes, and not implemented after them.
export function computeAgreement(ws) {
  const reviewers = new Set(ws.interpretation.map((x) => x.author.token));
  if (reviewers.size < 2) return { ok: false, codes: [{ code: 'single_reviewer_agreement', control: 'WS-10', message: 'Agreement needs at least two independent reviewers; one reviewer cannot produce an agreement result.' }] };
  if (!ws.freezes.interpretation.frozen || !ws.freezes.calibration.frozen) return { ok: false, codes: [{ code: 'agreement_before_freeze', control: 'WS-10', message: 'No agreement figure before the interpretation and calibration protocols are frozen.' }] };
  return { ok: false, codes: [{ code: 'agreement_not_implemented', control: 'WS-10', message: 'No agreement statistic is implemented; it must follow the frozen calibration protocol, written by the people who own it.' }] };
}

// WS-11: a DRR score or classification is refused before every freeze, and not implemented after them.
export function computeDrrScore(ws) {
  const open = FREEZES.filter((k) => !ws.freezes[k].frozen);
  if (open.length) return { ok: false, codes: [{ code: 'drr_score_before_freeze', control: 'WS-11', message: 'No DRR score or classification before these are frozen: ' + open.join(', ') + '.' }] };
  return { ok: false, codes: [{ code: 'drr_score_not_implemented', control: 'WS-11', message: 'No DRR scoring is implemented. It needs real interpretations, frozen calibration and adjudication, and owner approval.' }] };
}
