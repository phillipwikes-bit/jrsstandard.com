// JRS ENGINE ASSURANCE: deterministic pre-analysis gate.
//
// Runs BEFORE any candidate analysis. If it refuses or escalates, the provider
// is never invoked and every condition is reported as not_assessed. It makes no
// judgment about the record's author, the decision, or its legality: each
// boundary statement says which scope limit was reached and nothing more.
//
// DISPOSITIONS
//   refuse   : the input is outside the authorized local scope or asks for an
//              output this package does not produce.
//   escalate : the input is nominally in scope but cannot be analysed safely
//              (incomplete, or claimed evidence is absent). A human decides.
//
// KNOWN LIMIT. Detection is lexical. It errs toward refusal: a supplier record
// that mentions, say, "insurance" is refused even if the mention is incidental.
// A false refusal is recoverable by a human; a missed refusal is not. Recorded
// as FM-03 and FM-04 in FAILURE_MODE_REGISTER.md.

import { SUPPORTED_VERSIONS } from './versions.mjs';
import { MIN_RECORD_CHARS } from './candidate-core.mjs';

export const LOCAL_SIZE_LIMIT_CHARS = 8000;

export const AUTHORIZED_SCOPE = Object.freeze({
  record_type: 'supplier_access_exception_draft',
  record_state: 'completed_draft',
  content_origin: 'synthetic_engineering_fixture',
});

export const PERMITTED_OUTPUTS = Object.freeze(['condition_findings', 'record_controls', 'manifest_reference']);
export const PROHIBITED_OUTPUTS = Object.freeze([
  'overall_pass', 'overall_score', 'overall_determination', 'compliance_certification',
  'legal_conclusion', 'decision_recommendation', 'approval_recommendation', 'risk_acceptance',
]);

const SCOPE_TEXT = 'The authorized local scope is completed, non-HR supplier-access exception drafts '
  + 'supplied as synthetic engineering fixtures.';
const NO_ASSESSMENT = 'No assessment of the record, its author, or the underlying decision was made.';

// Regulated or excluded decision domains. Each entry is [domain, regex].
const REGULATED = [
  ['employment', /\b(employment|hiring|hired|firing|fired|dismissal|dismissed|disciplinary|demotion|job applicants?|performance review|termination of (?:his|her|their|the) (?:employment|contract of employment)|human resources|HR (?:case|matter|decision|investigation))\b/i],
  ['employment', /\bpromot(?:ion|ed)\b(?!\s+(?:to|into)\s+(?:production|prod|staging|test))/i],
  ['housing', /\b(tenant|tenancy|landlord|eviction|rental application|housing)\b/i],
  ['lending', /\b(loan|lending|credit application|credit decision|creditworthiness|mortgage)\b/i],
  ['insurance', /\b(insurance|policyholder|underwriting|insurance claim)\b/i],
  ['medical', /\b(patient|diagnos(?:is|ed)|medical|clinical|health record|prescription)\b/i],
  ['legal_outcome', /\b(court|verdict|sentencing|court judgment|legal judgment|plea|criminal|litigation outcome|settlement decision)\b/i],
];

// Instructions addressed to the Engine rather than to a human reader.
const INJECTION = [
  /\b(ignore|disregard|override)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|earlier|system|existing)\s+(?:instructions|rules|guidance|prompts?)\b/i,
  /\byou are now\b/i,
  /\bsystem prompt\b/i,
  /\bmark\s+(?:all|every|each)\s+(?:five\s+|5\s+)?(?:conditions?|criteria)\s+(?:as\s+)?(?:pass(?:ed)?|supported|ready|met)\b/i,
  /\b(?:respond|reply|answer|return|output)\s+(?:only\s+)?(?:with\s+)?["']?(?:pass|ready|supported)["']?\s*(?:for|on)\s+(?:all|every|each)\b/i,
  /^\s*(?:assistant|system)\s*:/im,
  /\bnote to (?:the )?(?:ai|model|engine|reviewer bot|automated reviewer)\b/i,
  /\bdo not (?:flag|report|mention|surface) (?:any|this|these|the)\b/i,
  /\b(?:certify|confirm|declare)\s+(?:that\s+)?(?:this|the)\s+(?:exception|record|decision)\s+(?:is|as)\s+(?:compliant|approved|lawful|legal|valid)\b/i,
];

const PLACEHOLDER = /\[(?:TBD|TBC|TODO|PENDING|INSERT[^\]]*|DRAFT[^\]]*)\]|\bTBD\b|\bTODO\b|\bto be completed\b|<insert[^>]*>|\?\?\?/i;

function hit(record, re) {
  const m = re.exec(record);
  return m ? { start: m.index, end: m.index + m[0].length, matched_text: m[0] } : null;
}

export function runScopeGate(record, request) {
  const triggers = [];
  const add = (code, disposition, category, boundary, location) => {
    const t = { code, disposition, category, boundary };
    if (location) t.location = Object.assign({ offset_unit: 'utf16_code_unit' }, location);
    triggers.push(t);
  };
  const text = typeof record === 'string' ? record : '';
  const req = request && typeof request === 'object' ? request : {};

  // 1. Scope declaration.
  const sd = req.scope_declaration;
  if (!sd || typeof sd !== 'object') {
    add('missing_scope_declaration', 'refuse', 'scope',
      'No scope declaration was supplied, so the record cannot be placed inside the authorized scope. ' + SCOPE_TEXT + ' ' + NO_ASSESSMENT);
  } else {
    const bad = [];
    for (const k of Object.keys(AUTHORIZED_SCOPE)) if (sd[k] !== AUTHORIZED_SCOPE[k]) bad.push(k);
    if (sd.hr_content !== false) bad.push('hr_content');
    if (sd.regulated_decision_content !== false) bad.push('regulated_decision_content');
    if (bad.length) {
      add(sd.content_origin && sd.content_origin !== AUTHORIZED_SCOPE.content_origin
        ? 'non_synthetic_record_not_authorized' : 'invalid_scope_declaration', 'refuse', 'scope',
      'The scope declaration does not match the authorized scope (' + bad.join(', ') + '). ' + SCOPE_TEXT + ' ' + NO_ASSESSMENT);
    }
  }

  // 2. Version labels. A missing declaration is refused, not defaulted.
  const dv = req.declared_versions;
  if (!dv || typeof dv !== 'object') {
    add('missing_version_declaration', 'refuse', 'version',
      'No Engine, codebook and schema version labels were declared. Version labels are required so the output can be identified later. ' + NO_ASSESSMENT);
  } else {
    for (const k of ['engine_version', 'codebook_version', 'schema_version']) {
      if (!SUPPORTED_VERSIONS[k].includes(dv[k])) {
        add('unsupported_version_label', 'refuse', 'version',
          'The declared ' + k + ' ' + JSON.stringify(dv[k] === undefined ? null : dv[k])
          + ' is not a version this local package supports (' + SUPPORTED_VERSIONS[k].join(', ') + '). ' + NO_ASSESSMENT);
      }
    }
  }

  // 3. Requested outputs.
  const ro = Array.isArray(req.requested_outputs) ? req.requested_outputs : null;
  if (!ro || !ro.length) {
    add('missing_requested_outputs', 'refuse', 'output_request',
      'No requested outputs were declared. Permitted outputs are ' + PERMITTED_OUTPUTS.join(', ') + '. ' + NO_ASSESSMENT);
  } else {
    for (const o of ro) {
      if (PROHIBITED_OUTPUTS.includes(o)) {
        add('prohibited_output_requested', 'refuse', 'output_request',
          'The request asks for ' + JSON.stringify(o) + '. This package does not produce an overall pass, score, compliance certification, '
          + 'legal conclusion, approval, or decision recommendation. It reports documentation conditions for human review only. ' + NO_ASSESSMENT);
      } else if (!PERMITTED_OUTPUTS.includes(o)) {
        add('unsupported_output_requested', 'refuse', 'output_request',
          'The request asks for ' + JSON.stringify(o) + ', which is not a recognised output. ' + NO_ASSESSMENT);
      }
    }
  }

  // 4. Provider configuration in the request. Only the mocked mode is accepted.
  const pv = req.provider;
  if (pv !== undefined) {
    const keys = pv && typeof pv === 'object' ? Object.keys(pv) : [];
    if (!pv || typeof pv !== 'object' || pv.mode !== 'mocked' || keys.some((k) => k !== 'mode')) {
      add('provider_configuration_not_authorized', 'refuse', 'execution',
        'The request carries a provider configuration other than {"mode":"mocked"}. Live or network-capable providers are not authorized for this work. ' + NO_ASSESSMENT);
    }
  }

  // 5. Record size. The assurance layer refuses rather than truncating.
  if (!text.trim() || text.trim().length < MIN_RECORD_CHARS) {
    add('record_too_short', 'refuse', 'size',
      'The record has fewer than ' + MIN_RECORD_CHARS + ' characters of text. ' + NO_ASSESSMENT);
  }
  if (text.length > LOCAL_SIZE_LIMIT_CHARS) {
    add('record_exceeds_local_size_limit', 'refuse', 'size',
      'The record has ' + text.length + ' characters; the documented local limit is ' + LOCAL_SIZE_LIMIT_CHARS
      + '. The record is refused rather than truncated, so no part of it is assessed as though it were the whole. ' + NO_ASSESSMENT);
  }

  // 6. Regulated or excluded decision content.
  const seen = new Set();
  for (const [domain, re] of REGULATED) {
    if (seen.has(domain)) continue;
    const loc = hit(text, re);
    if (loc) {
      seen.add(domain);
      add('regulated_domain_content', 'refuse', 'regulated_domain:' + domain,
        'The record contains language associated with ' + domain.replace('_', '-') + ' decisions, which are excluded from the authorized local scope. '
        + SCOPE_TEXT + ' ' + NO_ASSESSMENT, loc);
    }
  }

  // 7. Instructions embedded in the record.
  for (const re of INJECTION) {
    const loc = hit(text, re);
    if (loc) {
      add('embedded_instruction_detected', 'refuse', 'record_integrity',
        'The record contains text addressed to the review tool rather than to a human reader. Embedded instructions are not followed, '
        + 'and a record carrying them is not analysed. ' + NO_ASSESSMENT, loc);
      break;
    }
  }

  // 8. Incomplete record.
  const ph = hit(text, PLACEHOLDER);
  if (ph) {
    add('incomplete_record', 'escalate', 'completeness',
      'The record contains placeholder text, so it is not a completed draft. A human should confirm the final content before review. ' + NO_ASSESSMENT, ph);
  }
  if (sd && typeof sd === 'object' && sd.truncated === true) {
    add('incomplete_record', 'escalate', 'completeness',
      'The scope declaration states the record is truncated. ' + NO_ASSESSMENT);
  }

  // 9. Claimed evidence must be present verbatim.
  if (req.claimed_evidence !== undefined) {
    if (!Array.isArray(req.claimed_evidence)) {
      add('invalid_claimed_evidence', 'refuse', 'record_integrity', 'claimed_evidence must be a list of exact quotations. ' + NO_ASSESSMENT);
    } else {
      for (const c of req.claimed_evidence) {
        if (typeof c !== 'string' || !c || text.indexOf(c) === -1) {
          add('claimed_evidence_not_found', 'escalate', 'record_integrity',
            'The request cites evidence (' + JSON.stringify(String(c).slice(0, 120)) + ') that does not occur in the submitted record. '
            + 'The citation may refer to material outside the record; a human should resolve it before review. ' + NO_ASSESSMENT);
        }
      }
    }
  }

  const decision = triggers.some((t) => t.disposition === 'refuse') ? 'refuse'
    : triggers.some((t) => t.disposition === 'escalate') ? 'escalate' : 'proceed';
  return { decision, triggers };
}
