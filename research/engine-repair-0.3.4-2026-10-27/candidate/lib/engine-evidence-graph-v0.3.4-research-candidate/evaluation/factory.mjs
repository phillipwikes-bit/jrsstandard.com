// JRS EVIDENCE GRAPH 0.3.0: Sealed Evaluation Factory (evaluation READINESS only).
//
// This module can describe, register and check a PROPOSED evaluation. It cannot
// run one, it holds no holdout, no external label and no adjudication, and no
// function here returns a status meaning completed, validated, approved, ready or
// released. The best outcome any package can receive here is
// "not_authorized_to_execute": authorisation is a human act recorded elsewhere.

import { createHash } from 'node:crypto';
import { relative, resolve, isAbsolute } from 'node:path';
import { scanProhibitedClaims } from '../../engine-evidence-contract/claims.mjs';

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x));

// ------------------------------------------------------------------ A. registry
export const REGISTRY_STATUSES = Object.freeze(['draft_protocol_only', 'awaiting_owner_decision', 'blocked_by_missing_permissions', 'not_authorized_to_execute', 'superseded']);
export const PREREGISTRATION_STATES = Object.freeze(['not_started', 'draft_only']);
export const HOLDOUT_STATES = Object.freeze(['none_exists', 'proposed_not_created']);
export const REGISTRY_FIELDS = Object.freeze(['evaluation_id', 'engine_version', 'compiler_version', 'codebook_version', 'codebook_sha256', 'prompt_contract_version',
  'scope', 'permitted_data_category', 'proposed_label_authority', 'proposed_adjudication_authority', 'proposed_holdout_status', 'required_permissions',
  'preregistration_state', 'current_status', 'stop_conditions', 'recorded_at']);
const FORBIDDEN_STATUS = /\b(?:completed?|validated|validation passed|approved|ready|released|passed|independently verified|accuracy established)\b/i;

export function validateRegistryEntry(e) {
  const p = [];
  if (!e || typeof e !== 'object') return ['entry_not_object'];
  for (const k of REGISTRY_FIELDS) if (!(k in e)) p.push('missing_field:' + k);
  for (const k of Object.keys(e)) if (![...REGISTRY_FIELDS, 'prev_hash', 'entry_hash', 'note'].includes(k)) p.push('undeclared_field:' + k);
  if (!REGISTRY_STATUSES.includes(e.current_status)) p.push('status_not_permitted:' + e.current_status);
  if (!PREREGISTRATION_STATES.includes(e.preregistration_state)) p.push('preregistration_state_not_permitted');
  if (!HOLDOUT_STATES.includes(e.proposed_holdout_status)) p.push('holdout_status_not_permitted');
  if (!Array.isArray(e.stop_conditions) || !e.stop_conditions.length) p.push('stop_conditions_missing');
  if (!Array.isArray(e.required_permissions) || !e.required_permissions.length) p.push('required_permissions_missing');
  if (typeof e.codebook_sha256 !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(e.codebook_sha256)) p.push('codebook_hash_missing');
  for (const k of ['note', 'current_status']) if (typeof e[k] === 'string' && FORBIDDEN_STATUS.test(e[k].replace(/not_authorized_to_execute|no evaluation (?:has been )?(?:authori[sz]ed|conducted)[^.]*/gi, ''))) p.push('forbidden_status_language_in:' + k);
  for (const k of ['note', 'scope']) if (typeof e[k] === 'string' && scanProhibitedClaims(e[k]).length) p.push('prohibited_claim_in:' + k);
  return p;
}

export function appendRegistryEntry(text, entry) {
  const lines = (text || '').split('\n').filter(Boolean);
  const prev = lines.length ? JSON.parse(lines[lines.length - 1]).entry_hash : 'sha256:' + '0'.repeat(64);
  const body = Object.assign({}, entry, { prev_hash: prev }); delete body.entry_hash;
  const problems = validateRegistryEntry(Object.assign({}, body, { entry_hash: 'x' }));
  if (problems.length) throw new Error('registry_append_refused: ' + problems.join(', '));
  body.entry_hash = sha(canon(body));
  return lines.concat(JSON.stringify(body)).join('\n') + '\n';
}

export function validateRegistry(text) {
  const p = [];
  const lines = (text || '').split('\n').filter(Boolean);
  let prev = 'sha256:' + '0'.repeat(64);
  lines.forEach((l, i) => {
    let e; try { e = JSON.parse(l); } catch { p.push('line_' + (i + 1) + ':not_json'); return; }
    if (e.prev_hash !== prev) p.push('line_' + (i + 1) + ':chain_broken');
    const body = Object.assign({}, e); delete body.entry_hash;
    if (sha(canon(body)) !== e.entry_hash) p.push('line_' + (i + 1) + ':entry_modified');
    for (const q of validateRegistryEntry(e)) p.push('line_' + (i + 1) + ':' + q);
    prev = e.entry_hash;
  });
  return p;
}

// ------------------------------------------------------------------ B. separation controls
export const APPROVED_DATA_CLASSIFICATIONS = Object.freeze(['authorized_independent_non_hr_supplier_records_with_counsel_review']);
const PLACEHOLDER_EXACT = /^\s*(?:|tbd|tbc|todo|placeholder|n\/a|na|none|unknown|pending|not_assigned|to be (?:confirmed|assigned)|\[.*\]|<.*>)\s*$/i;
// Also catches identifiers that announce themselves as stand-ins (found 2026-10-10:
// an owner-authorisation ID reading "...PLACEHOLDER-NOT-ISSUED" passed the exact list).
const PLACEHOLDER_WORD = /placeholder|example|not[ _-]?issued|dummy|sample|structure only|fictional/i;
const PLACEHOLDER = { test: (v) => PLACEHOLDER_EXACT.test(v) || PLACEHOLDER_WORD.test(v) };
const ENGINEERING_PROCESSES = ['engineering_authored', 'claude_code_session', 'fixture_generator', 'same_session_as_code'];

export function checkEvaluationPackage(pkg, ctx) {
  const reasons = [];
  const r = (code, detail) => reasons.push({ code, detail });
  const p = pkg && typeof pkg === 'object' ? pkg : {};
  const dev = ctx.developmentHashes || new Set();
  const vi = p.version_identity || {};
  for (const k of ['engine_version', 'compiler_version', 'prompt_contract_version', 'codebook_version']) if (!vi[k]) r('missing_version_identity', k);
  if (!/^sha256:[0-9a-f]{64}$/.test(vi.codebook_sha256 || '')) r('missing_codebook_hash', 'codebook_sha256');
  const ow = p.owner_authorization;
  if (!ow || typeof ow !== 'object' || PLACEHOLDER.test(String(ow.record_id || '')) || !ow.date) r('missing_owner_authorization', 'no owner authorization record');
  if (!APPROVED_DATA_CLASSIFICATIONS.includes(p.data_classification)) r('unapproved_data_classification', String(p.data_classification));
  const adj = p.adjudication_authority;
  if (!adj || typeof adj !== 'object' || PLACEHOLDER.test(String(adj.name || ''))) r('placeholder_adjudication_authority', 'adjudication authority empty or placeholder');
  for (const item of p.sealed_set || []) {
    if (item.origin === 'synthetic_engineering_fixture' || /synthetic/i.test(String(item.origin || ''))) r('synthetic_presented_as_holdout', item.item_id);
    if (dev.has(item.content_sha256)) r('development_sealed_overlap', item.item_id);
  }
  const la = p.label_authority || {};
  if (la.claimed_independent === true && (ENGINEERING_PROCESSES.includes(la.process_id) || la.process_id === p.engineering_process_id || PLACEHOLDER.test(String(la.name || ''))))
    r('label_independence_not_supported', 'label claimed independent but produced by the engineering process or unnamed authority');
  for (const l of p.labels || []) if (ENGINEERING_PROCESSES.includes(l.label_process_id) && la.claimed_independent === true) { r('label_independence_not_supported', l.item_id); break; }
  if (p.data_location) {
    const abs = isAbsolute(p.data_location) ? p.data_location : resolve(ctx.repoRoot, p.data_location);
    const rel = relative(ctx.repoRoot, abs);
    if (!rel.startsWith('..') && !isAbsolute(rel) && !rel.startsWith('.local-evaluations')) r('raw_records_in_tracked_directory', rel || '.');
  }
  const fr = p.freeze || {};
  for (const [k, cur] of Object.entries(ctx.currentHashes || {})) if (fr[k] && fr[k] !== cur) r('component_changed_after_freeze', k);
  if (!fr.freeze_date) r('missing_freeze_record', 'freeze_date');
  if (p.claimed_status && FORBIDDEN_STATUS.test(String(p.claimed_status))) r('status_claim_not_permitted', String(p.claimed_status));
  if (p.material_origin === 'local_protocol_template') r('template_only_material', 'a generated template is not an evaluation');
  return { decision: reasons.length ? 'refused' : 'not_authorized_to_execute', reasons,
    statement: 'This check can refuse a package. It cannot authorise, run, or complete an evaluation. Authorisation is a separate, recorded human decision.' };
}

// ------------------------------------------------------------------ C. protocol template
export const PROTOCOL_STATEMENT = 'No evaluation has been authorized or conducted through this local template.';
export function generateProtocol(meta) {
  const m = Object.assign({ evaluation_id: 'EVAL-LW-PLACEHOLDER', engine_version: '<engine version placeholder>', compiler_version: '<compiler version placeholder>',
    model_identity: '<model identity placeholder>', prompt_contract_version: '<prompt contract placeholder>', codebook_version: '<codebook version placeholder>',
    codebook_sha256: '<codebook hash placeholder>' }, meta || {});
  const S = (h, b) => '## ' + h + '\n\n' + b + '\n';
  return ['# Evaluation Protocol Template: ' + m.evaluation_id, '', '**' + PROTOCOL_STATEMENT + '**', '',
    'Generated locally from placeholder metadata. Every field marked placeholder must be completed by the named authority before this document could be proposed for authorisation.', '',
    S('1. Hypothesis', 'Placeholder: a pre-specified statement about condition-level agreement between the candidate and adjudicated reference labels.'),
    S('2. Scope', 'Completed, non-HR internal compliance records, initially supplier-access exception drafts; documentation-integrity analysis only; mandatory human review.'),
    S('3. Exclusions', 'Employment, hiring, promotion, discipline, termination, housing, lending, insurance, medical decisions, legal outcomes, and any excluded or uncertain consequential domain.'),
    S('4. Model and prompt identity', 'Model: ' + m.model_identity + '. Prompt contract: ' + m.prompt_contract_version + '. Engine: ' + m.engine_version + '. Compiler: ' + m.compiler_version + '.'),
    S('5. Codebook identity', 'Codebook version ' + m.codebook_version + ', SHA-256 ' + m.codebook_sha256 + '.'),
    S('6. Pre-specified metrics (placeholders)', 'Per-condition confusion matrices; unsupported-favourable rate; quotation-resolution rate; refusal miss and false-refusal rates; repeatability reported separately from accuracy. Thresholds: placeholder, to be fixed before any data are seen.'),
    S('7. Abstention and refusal criteria', 'Records refused at intake, conditions routed to review, and ambiguous or absent quotations are counted and reported, never dropped.'),
    S('8. Condition-level analysis plan', 'Each of the five conditions analysed separately; no overall score.'),
    S('9. Uncertainty reporting plan', 'Intervals for every rate; limitations stated beside every figure.'),
    S('10. Human-review disposition plan', 'Every routed finding receives a recorded human disposition; dispositions are not reference labels.'),
    S('11. Data permission requirement', 'Written owner authorisation and counsel review of data flows before any record is used.'),
    S('12. Independent labeling requirement', 'Labels assigned by at least two qualified reviewers who did not build the candidate, working independently.'),
    S('13. Adjudication requirement', 'A named adjudicator, independent of the engineering work, resolves label disagreements under a recorded procedure.'),
    S('14. Stop conditions', 'Any contamination finding, any change to prompt, codebook or compiler after freeze, any missing permission, any out-of-scope record.'),
    S('15. Release-gate statement', 'Completing an evaluation under this protocol would address release gate 1 only. It would not authorise release, deployment, licensing or sale.'),
    '**' + PROTOCOL_STATEMENT + '**', ''].join('\n');
}

// ------------------------------------------------------------------ D. authority matrix
export const AUTHORITY_ROLES = Object.freeze(['owner_decision', 'independent_labeler', 'adjudicator', 'technical_operator', 'counsel', 'production_qa', 'release_authority', 'local_engineering']);
export const EXCLUSIVE_FROM_ENGINEERING = Object.freeze(['independent_labeler', 'adjudicator', 'counsel', 'production_qa']);

export function checkAuthorityAssignment(assignments) {
  const v = [];
  const who = (role) => (assignments[role] || []).map((x) => String(x).trim().toLowerCase());
  const eng = new Set(who('local_engineering'));
  for (const role of EXCLUSIVE_FROM_ENGINEERING) for (const person of who(role)) if (eng.has(person)) v.push({ code: 'role_conflict', role, person });
  for (const person of who('adjudicator')) if (who('independent_labeler').includes(person)) v.push({ code: 'adjudicator_is_labeler', role: 'adjudicator', person });
  for (const role of ['independent_labeler', 'adjudicator', 'counsel', 'production_qa', 'release_authority']) for (const person of who(role)) if (PLACEHOLDER.test(person)) v.push({ code: 'placeholder_assignment', role, person });
  return v;
}
