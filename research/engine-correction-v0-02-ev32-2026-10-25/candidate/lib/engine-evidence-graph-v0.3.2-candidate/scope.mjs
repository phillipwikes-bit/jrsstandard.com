// JRS EVIDENCE GRAPH 0.3.0: intake gate.
//
// Reuses the 0.2 regulated-domain and instruction lists unchanged and adds
// phrasings recorded as missed in the 0.2 failure-mode register (KF-02, KF-03)
// and an "other consequential domain" list. Everything stays lexical and
// bounded; an uncertain match refuses rather than proceeds.

import { REGULATED as V02_REGULATED, INSTRUCTION_PATTERNS as V02_INSTRUCTIONS } from '../engine-evidence-contract/boundary.mjs';
import { CONTRACT_VERSION, COMPILER_VERSION, PROMPT_VERSION, CODEBOOK_VERSION, LOCAL_SIZE_LIMIT_CHARS } from './contract.mjs';

export const SUBMISSION_FIELDS = Object.freeze(['submission_metadata', 'scope_declaration', 'declared_versions', 'requested_outputs', 'fixture_identity', 'record_text']);
export const PERMITTED_OUTPUTS = Object.freeze(['condition_findings', 'evidence_graph', 'cognitive_controls', 'v02_comparison']);
export const PROHIBITED_OUTPUTS = Object.freeze(['overall_pass', 'overall_score', 'overall_determination', 'compliance_certification', 'legal_conclusion',
  'decision_recommendation', 'approval_recommendation', 'credibility_assessment', 'readiness_verdict', 'risk_acceptance']);

export const REGULATED = Object.freeze([
  ...V02_REGULATED,
  ['employment', /\b(?:relieved of (?:his |her |their )?duties|staffing reduction|workforce reduction|headcount reduction|reduction in force|stood down|suspended from work|exit interview|severance)\b/i],
  ['other_consequential', /\b(?:immigration|visa status|benefits? eligibility|admissions? decision|child custody|parole|credit score|tenancy application|disability claim)\b/i],
]);

export const INSTRUCTION_PATTERNS = Object.freeze([
  ...V02_INSTRUCTIONS,
  ['reworded_status_directive', /\b(?:treat|consider|regard|record)\s+(?:every|all|each)\s+(?:condition|criterion|criteria|requirement)s?\b[^.\n]{0,60}\b(?:satisfied|met|passed|supported|complete)\b/i],
  ['assume_directive', /\bfor the purposes? of (?:this|the) review,?\s+(?:assume|treat|consider)\b/i],
  ['summary_directive', /\bwhen summari[sz]ing\b[^.\n]{0,60}\b(?:omit|ignore|treat|mark)\b/i],
  ['non_english_override', /\b(?:ignora|ignorez|ignoriere|ignoreer)\b[^.\n]{0,40}\b(?:instrucciones|instructions|anweisungen|instructies)\b/i],
]);

// RP-SCO-01 (Phase 7): one reworded employment family. Contract non-renewal for a person is not covered (deferred).
export const REWORDED_EMPLOYMENT = /\b(?:keeps?|lose|loses|lost)\s+(?:his|her|their)\s+job\b(?![-\s]+(?:queue|queues|scheduler|runner|title|description|code|reference|log|logs))/i;

const AUTHORIZED = Object.freeze({ record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture' });
const PLACEHOLDER = /\[(?:TBD|TBC|TODO|PENDING|INSERT[^\]]*)\]|\bTBD\b|<insert[^>]*>|\?\?\?/;
const NO = 'No assessment of the record, its author, or the underlying decision was made.';

function first(text, re) { const m = new RegExp(re.source, re.flags.replace('g', '')).exec(text); return m ? { start: m.index, end: m.index + m[0].length, matched_text: m[0] } : null; }

export function detectInstructionRisk(record) {
  const spans = [];
  for (const [id, re] of INSTRUCTION_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'); let m;
    while ((m = g.exec(record)) !== null) { spans.push({ pattern_id: id, start: m.index, end: m.index + m[0].length, matched_text: m[0] }); if (!m[0].length) g.lastIndex++; }
  }
  return { record_instruction_risk: spans.length ? 'detected' : 'not_detected', execution_boundary: 'preserved', spans: spans.sort((a, b) => a.start - b.start) };
}

export function runIntake(submission, record, computedFixtureHash, rules = new Set(), rulePackProblems = []) {
  const triggers = [];
  const add = (code, disposition, category, boundary, location) => triggers.push(Object.assign({ code, disposition, category, boundary }, location ? { location } : {}));
  if (rulePackProblems.length) add('rule_pack_rejected', 'refuse', 'rule_pack', 'The candidate rule packs failed validation (' + rulePackProblems.length + ' problem(s)); no rule pack is applied and nothing is assessed. ' + NO);
  const sub = submission && typeof submission === 'object' && !Array.isArray(submission) ? submission : {};
  const unknown = Object.keys(sub).filter((k) => !SUBMISSION_FIELDS.includes(k));
  if (unknown.length) add('unrecognised_submission_field', 'refuse', 'intake', 'Undeclared submission fields (' + unknown.join(', ') + ') are not read. ' + NO);
  if (typeof record !== 'string') { add('record_text_missing', 'refuse', 'intake', 'No record text was supplied. ' + NO); return { decision: 'refuse', triggers }; }
  const sd = sub.scope_declaration;
  if (!sd || typeof sd !== 'object') add('missing_scope_declaration', 'refuse', 'scope', 'No scope declaration was supplied. ' + NO);
  else {
    const bad = Object.keys(AUTHORIZED).filter((k) => sd[k] !== AUTHORIZED[k]);
    if (sd.hr_content !== false) bad.push('hr_content');
    if (sd.regulated_decision_content !== false) bad.push('regulated_decision_content');
    if (bad.length) add(sd.content_origin !== AUTHORIZED.content_origin ? 'non_synthetic_record_not_authorized' : 'invalid_scope_declaration', 'refuse', 'scope',
      'The scope declaration does not match the authorized local scope (' + bad.join(', ') + '). ' + NO);
  }
  const want = { contract_version: CONTRACT_VERSION, compiler_version: COMPILER_VERSION, prompt_version: PROMPT_VERSION, codebook_version: CODEBOOK_VERSION };
  const dv = sub.declared_versions;
  if (!dv || typeof dv !== 'object') add('missing_version_declaration', 'refuse', 'version', 'No version labels were declared. ' + NO);
  else for (const [k, v] of Object.entries(want)) if (dv[k] !== v) add(k.replace('_version', '') + '_version_mismatch', 'refuse', 'version',
    'Declared ' + k + ' ' + JSON.stringify(dv[k] === undefined ? null : dv[k]) + ' does not match ' + v + '. ' + NO);
  const fi = sub.fixture_identity;
  if (fi !== undefined && (!fi || typeof fi !== 'object' || fi.fixture_hash !== computedFixtureHash)) add('fixture_hash_mismatch', 'refuse', 'version',
    'The declared fixture hash does not match the record and candidate response supplied. ' + NO);
  const ro = sub.requested_outputs;
  if (!Array.isArray(ro) || !ro.length) add('missing_requested_outputs', 'refuse', 'output_request', 'No requested outputs were declared. ' + NO);
  else for (const o of ro) {
    if (PROHIBITED_OUTPUTS.includes(o)) add('prohibited_output_requested', 'refuse', 'output_request', 'The request asks for ' + JSON.stringify(o) + ', which this candidate never produces. ' + NO);
    else if (!PERMITTED_OUTPUTS.includes(o)) add('unsupported_output_requested', 'refuse', 'output_request', 'Unrecognised output ' + JSON.stringify(o) + '. ' + NO);
  }
  if (record.trim().length < 40) add('record_too_short', 'refuse', 'size', 'The record has fewer than 40 characters. ' + NO);
  if (record.length > LOCAL_SIZE_LIMIT_CHARS) add('record_exceeds_local_size_limit', 'refuse', 'size', 'The record exceeds ' + LOCAL_SIZE_LIMIT_CHARS + ' characters and is refused, not truncated. ' + NO);
  const seen = new Set();
  for (const [domain, re] of (rules.has('RP-SCO-01') ? [...REGULATED, ['employment', REWORDED_EMPLOYMENT]] : REGULATED)) {
    if (seen.has(domain)) continue;
    const m = first(record, re);
    if (m) { seen.add(domain); add('excluded_domain_content', 'refuse', 'excluded_domain:' + domain, 'The record contains language associated with ' + domain.replace('_', ' ') + ' matters, which are outside the authorized local scope. ' + NO, m); }
  }
  const ph = first(record, PLACEHOLDER);
  if (ph) add('incomplete_record', 'escalate', 'completeness', 'The record contains placeholder text and is not a completed draft. ' + NO, ph);
  const decision = triggers.some((t) => t.disposition === 'refuse') ? 'refuse' : triggers.some((t) => t.disposition === 'escalate') ? 'escalate' : 'proceed';
  return { decision, triggers };
}
