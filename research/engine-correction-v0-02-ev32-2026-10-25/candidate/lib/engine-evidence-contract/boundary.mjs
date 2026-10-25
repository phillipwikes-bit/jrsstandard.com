// JRS EVIDENCE CONTRACT 0.2.0: record boundary, scope intake and instruction quarantine.
//
// SEPARATION. A submission is split into six compartments that never mix:
//   submission_metadata, scope_declaration, record_content, embedded_instructions
//   (record text that reads as an instruction), candidate_response, and
//   local_evaluation_metadata. Only record_content is ever placed in front of a
//   candidate, and it is placed there as quoted data inside the prompt contract.
//
// EXECUTION BOUNDARY. Instructions found in the record are QUARANTINED: their
// spans are listed so a reviewer can see them, and they stay in the record as
// record text, but nothing here acts on them. execution_boundary is always
// "preserved". If instruction risk is detected, no candidate status may stand:
// every condition is routed to review_required (run.mjs).
//
// DETECTION IS BOUNDED. Lexical patterns catch obvious adversarial phrasing.
// Reworded, translated, encoded or novel instructions may pass. This module
// never claims complete prompt-injection detection.
//
// SCOPE. The regulated-domain list is a superset of the 0.1 gate's list, with
// added reworded employment and termination phrasings found missing in the 0.1
// failure-mode register (FM-03). 0.1 behaviour is not changed.

import { CONTRACT_VERSION, ENGINE_CANDIDATE_VERSION, CODEBOOK_VERSION, LOCAL_SIZE_LIMIT_CHARS, INSTRUCTION_RISK_LIMITATION } from './contract.mjs';

export const SUBMISSION_FIELDS = Object.freeze(['submission_metadata', 'scope_declaration', 'declared_versions', 'requested_outputs', 'claimed_evidence', 'record_text']);
export const PERMITTED_OUTPUTS = Object.freeze(['condition_findings', 'cognitive_controls', 'v1_comparison']);
export const PROHIBITED_OUTPUTS = Object.freeze(['overall_pass', 'overall_score', 'overall_determination', 'compliance_certification',
  'legal_conclusion', 'decision_recommendation', 'approval_recommendation', 'risk_acceptance', 'credibility_assessment']);
const AUTHORIZED_SCOPE = Object.freeze({
  record_type: 'supplier_access_exception_draft', record_state: 'completed_draft', content_origin: 'synthetic_engineering_fixture',
});

const NO_ASSESSMENT = 'No assessment of the record, its author, or the underlying decision was made.';

export const REGULATED = Object.freeze([
  ['employment', /\b(?:employment|hiring|hired|firing|fired|dismissal|dismissed|disciplinary|discipline|demotion|job applicants?|performance (?:review|improvement plan)|human resources|HR (?:case|matter|decision|investigation)|let go|laid off|lay-?offs?|redundanc(?:y|ies)|made redundant|written warning|final warning|probation(?:ary)? (?:period|review))\b/i],
  ['employment', /\b(?:termination|terminated|dismissal) of (?:a |an |the |his |her |their )?(?:employee|staff member|worker|contractor's employee|engineer|manager|analyst)\b/i],
  ['employment', /\b(?:employee|staff member|worker|engineer|manager|analyst|supervisor)(?:'s|s'|s)? (?:termination|dismissal|discipline|promotion|demotion|performance rating|conduct)\b/i],
  ['employment', /\bpromot(?:ion|ed)\b(?!\s+(?:to|into)\s+(?:production|prod|staging|test))/i],
  ['housing', /\b(?:tenant|tenancy|landlord|eviction|rental application|housing)\b/i],
  ['lending', /\b(?:loan|lending|credit application|credit decision|creditworthiness|mortgage)\b/i],
  ['insurance', /\b(?:insurance|policyholder|underwriting|insurance claim)\b/i],
  ['medical', /\b(?:patient|diagnos(?:is|ed)|medical|clinical|health record|prescription)\b/i],
  ['legal_outcome', /\b(?:court|verdict|sentencing|court judgment|legal judgment|plea|criminal|litigation outcome|settlement decision)\b/i],
]);

export const INSTRUCTION_PATTERNS = Object.freeze([
  ['override_instructions', /\b(?:ignore|disregard|override|forget)\s+(?:all\s+|any\s+|the\s+|your\s+)?(?:previous|prior|above|earlier|system|existing|preceding)\s+(?:instructions|rules|guidance|prompts?|directions)\b/i],
  ['role_reassignment', /\byou are now\b|\bact as (?:the|an?) (?:engine|reviewer|assistant|model)\b/i],
  ['prompt_reference', /\bsystem prompt\b|\bdeveloper message\b/i],
  ['status_directive', /\bmark\s+(?:all|every|each)\s+(?:five\s+|5\s+)?(?:conditions?|criteria)\s+(?:as\s+)?(?:pass(?:ed)?|supported|ready|met)\b/i],
  ['output_directive', /\b(?:respond|reply|answer|return|output)\s+(?:only\s+)?(?:with\s+)?["']?(?:pass|ready|supported)["']?\s*(?:for|on)\s+(?:all|every|each)\b/i],
  ['role_marker', /^\s*(?:assistant|system|user)\s*:/im],
  ['addressed_to_tool', /\bnote to (?:the )?(?:ai|model|engine|reviewer bot|automated reviewer|llm)\b/i],
  ['suppression_directive', /\bdo not (?:flag|report|mention|surface|cite) (?:any|this|these|the)\b/i],
  ['certification_request', /\b(?:certify|confirm|declare)\s+(?:that\s+)?(?:this|the)\s+(?:exception|record|decision)\s+(?:is|as)\s+(?:compliant|approved|lawful|legal|valid)\b/i],
]);

const PLACEHOLDER = /\[(?:TBD|TBC|TODO|PENDING|INSERT[^\]]*|DRAFT[^\]]*)\]|\bTBD\b|\bTODO\b|\bto be completed\b|<insert[^>]*>|\?\?\?/i;

function allMatches(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = g.exec(text)) !== null) { out.push({ start: m.index, end: m.index + m[0].length, matched_text: m[0] }); if (!m[0].length) g.lastIndex++; }
  return out;
}

export function detectInstructionRisk(record) {
  const spans = [];
  for (const [pattern_id, re] of INSTRUCTION_PATTERNS) for (const m of allMatches(record, re)) spans.push(Object.assign({ pattern_id }, m));
  spans.sort((a, b) => a.start - b.start);
  return {
    record_instruction_risk: spans.length ? 'detected' : 'not_detected',
    execution_boundary: 'preserved',
    quarantined_instruction_spans: spans.map((s) => Object.assign(s, { offset_unit: 'utf16_code_unit', handling: 'preserved_as_record_text_not_executed' })),
    limitation: INSTRUCTION_RISK_LIMITATION,
  };
}

export function separateSubmission(submission, candidateResponseText, localEvaluationMetadata) {
  const sub = submission && typeof submission === 'object' && !Array.isArray(submission) ? submission : {};
  const unknown = Object.keys(sub).filter((k) => !SUBMISSION_FIELDS.includes(k));
  return {
    unknown_submission_fields: unknown,
    compartments: {
      submission_metadata: sub.submission_metadata || null,
      scope_declaration: sub.scope_declaration || null,
      declared_versions: sub.declared_versions || null,
      requested_outputs: sub.requested_outputs || null,
      claimed_evidence: sub.claimed_evidence,
      record_content: typeof sub.record_text === 'string' ? sub.record_text : null,
      candidate_response: typeof candidateResponseText === 'string' ? candidateResponseText : null,
      local_evaluation_metadata: localEvaluationMetadata || {},
    },
  };
}

// Pre-analysis scope gate for v0.2. Returns { decision, triggers }.
export function runIntakeGate(record, compartments, unknownFields = []) {
  const triggers = [];
  const add = (code, disposition, category, boundary, location) => {
    const t = { code, disposition, category, boundary };
    if (location) t.location = Object.assign({ offset_unit: 'utf16_code_unit' }, location);
    triggers.push(t);
  };
  if (unknownFields.length) {
    add('unrecognised_submission_field', 'refuse', 'intake',
      'The submission carries fields outside the defined compartments (' + unknownFields.join(', ') + '). Undeclared fields are not read, so the submission is refused rather than partly processed. ' + NO_ASSESSMENT);
  }
  if (typeof record !== 'string') {
    add('record_text_missing', 'refuse', 'intake', 'No record text was supplied. ' + NO_ASSESSMENT);
    return { decision: 'refuse', triggers };
  }
  const sd = compartments.scope_declaration;
  if (!sd || typeof sd !== 'object') {
    add('missing_scope_declaration', 'refuse', 'scope', 'No scope declaration was supplied. ' + NO_ASSESSMENT);
  } else {
    const bad = Object.keys(AUTHORIZED_SCOPE).filter((k) => sd[k] !== AUTHORIZED_SCOPE[k]);
    if (sd.hr_content !== false) bad.push('hr_content');
    if (sd.regulated_decision_content !== false) bad.push('regulated_decision_content');
    if (bad.length) add(sd.content_origin !== AUTHORIZED_SCOPE.content_origin ? 'non_synthetic_record_not_authorized' : 'invalid_scope_declaration', 'refuse', 'scope',
      'The scope declaration does not match the authorized scope (' + bad.join(', ') + '). The authorized local scope is completed, non-HR supplier-access exception drafts supplied as synthetic engineering fixtures. ' + NO_ASSESSMENT);
    if (sd.truncated === true) add('incomplete_record', 'escalate', 'completeness', 'The scope declaration states the record is truncated. ' + NO_ASSESSMENT);
  }
  const dv = compartments.declared_versions;
  const expected = { contract_version: CONTRACT_VERSION, engine_candidate_version: ENGINE_CANDIDATE_VERSION, codebook_version: CODEBOOK_VERSION };
  if (!dv || typeof dv !== 'object') add('missing_version_declaration', 'refuse', 'version', 'No version labels were declared. ' + NO_ASSESSMENT);
  else for (const [k, v] of Object.entries(expected)) {
    if (dv[k] !== v) add('unsupported_version_label', 'refuse', 'version', 'The declared ' + k + ' ' + JSON.stringify(dv[k] === undefined ? null : dv[k]) + ' is not ' + v + '. ' + NO_ASSESSMENT);
  }
  const ro = compartments.requested_outputs;
  if (!Array.isArray(ro) || !ro.length) add('missing_requested_outputs', 'refuse', 'output_request', 'No requested outputs were declared. ' + NO_ASSESSMENT);
  else for (const o of ro) {
    if (PROHIBITED_OUTPUTS.includes(o)) add('prohibited_output_requested', 'refuse', 'output_request',
      'The request asks for ' + JSON.stringify(o) + '. This candidate reports documentation conditions for human review only and produces no overall pass, score, certification, legal or credibility conclusion, or decision recommendation. ' + NO_ASSESSMENT);
    else if (!PERMITTED_OUTPUTS.includes(o)) add('unsupported_output_requested', 'refuse', 'output_request', 'Unrecognised output ' + JSON.stringify(o) + '. ' + NO_ASSESSMENT);
  }
  if (record.trim().length < 40) add('record_too_short', 'refuse', 'size', 'The record has fewer than 40 characters of text. ' + NO_ASSESSMENT);
  if (record.length > LOCAL_SIZE_LIMIT_CHARS) add('record_exceeds_local_size_limit', 'refuse', 'size',
    'The record has ' + record.length + ' characters; the local analysis limit is ' + LOCAL_SIZE_LIMIT_CHARS + '. It is refused for analysis; a segmentation proposal is provided for human planning only. ' + NO_ASSESSMENT);
  const domains = new Set();
  for (const [domain, re] of REGULATED) {
    if (domains.has(domain)) continue;
    const m = allMatches(record, re)[0];
    if (m) {
      domains.add(domain);
      add('regulated_domain_content', 'refuse', 'regulated_domain:' + domain,
        'The record contains language associated with ' + domain.replace('_', '-') + ' matters, which are excluded from the authorized local scope. ' + NO_ASSESSMENT, m);
    }
  }
  const ph = allMatches(record, PLACEHOLDER)[0];
  if (ph) add('incomplete_record', 'escalate', 'completeness', 'The record contains placeholder text, so it is not a completed draft. ' + NO_ASSESSMENT, ph);
  const ce = compartments.claimed_evidence;
  if (ce !== undefined) {
    if (!Array.isArray(ce)) add('invalid_claimed_evidence', 'refuse', 'record_integrity', 'claimed_evidence must be a list of exact quotations. ' + NO_ASSESSMENT);
    else for (const c of ce) if (typeof c !== 'string' || !c || record.indexOf(c) === -1) add('claimed_evidence_not_found', 'escalate', 'record_integrity',
      'The submission cites evidence that does not occur in the record (' + JSON.stringify(String(c).slice(0, 80)) + '). ' + NO_ASSESSMENT);
  }
  const decision = triggers.some((t) => t.disposition === 'refuse') ? 'refuse' : triggers.some((t) => t.disposition === 'escalate') ? 'escalate' : 'proceed';
  return { decision, triggers };
}
