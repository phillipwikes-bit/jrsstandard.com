// JRS ENGINE EVIDENCE CONTRACT 0.2.0 (local candidate). Constants.
//
// This is a SEPARATELY VERSIONED local candidate. It does not replace the
// historical v1 candidate (0.1.0-validation), which is preserved unchanged in
// lib/engine-assurance/candidate-core.mjs and, as an exact blob copy, in
// research/engine-evidence-contract-2026-10-10/historical-reference/.
//
// Nothing here is a route, nothing here calls a provider, and no output of
// this contract is evidence of accuracy, validation, or readiness.

export const CONTRACT_VERSION = 'jrs-engine-local-0.2.0';
export const ENGINE_CANDIDATE_VERSION = '0.2.0-local-candidate';
export const CODEBOOK_VERSION = '1.0';
export const RESULT_FORMAT_VERSION = 'jrs-evidence-contract-result/0.2.0';
export const HISTORICAL_REFERENCE_ID = 'HREF-v1-0.1.0-validation-baebb512';
export const HISTORICAL_ENGINE_VERSION = '0.1.0-validation';
export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';
export const LOCAL_SIZE_LIMIT_CHARS = 8000;

// Contract condition identifiers. Their correspondence to the v1 Engine keys is
// taken from the v1 prompt's own labels (see V1_KEY_TO_CONDITION). Their
// correspondence to Codebook conditions RC1-RC5 is NOT ESTABLISHED.
export const CONDITION_IDS = Object.freeze([
  'reconstructability',
  'identifiable_basis',
  'chronology_integrity',
  'reasoning_traceability',
  'sufficiency',
]);

export const STATUSES = Object.freeze(['supported', 'gap', 'review_required', 'not_assessed']);
export const FAVOURABLE_OR_GAP = Object.freeze(['supported', 'gap']);

export const ASSERTION_TYPES = Object.freeze([
  'recorded_fact', 'stated_authority', 'stated_risk', 'stated_control',
  'stated_date', 'stated_decision', 'stated_rationale', 'other_record_content',
]);

// v1 prompt text: "3. cold_reviewer_clarity, Reconstructability", "1. basis_identification,
// Basis Identification", "5. temporal_reconstructability, Chronology",
// "2. reasoning_traceability, Decision-Process Traceability",
// "4. accountability_support, Evidentiary Sufficiency". Label-based, not a
// validated equivalence: the v1 and v0.2 instructions differ.
export const V1_KEY_TO_CONDITION = Object.freeze({
  cold_reviewer_clarity: 'reconstructability',
  basis_identification: 'identifiable_basis',
  temporal_reconstructability: 'chronology_integrity',
  reasoning_traceability: 'reasoning_traceability',
  accountability_support: 'sufficiency',
});

export const PRESENCE_LIMITATION =
  'Evidence verification establishes record presence only: each cited quotation occurs in the evaluated '
  + 'record at the stated offsets. It does not establish that the quotation supports this finding in context, '
  + 'or that the finding is correct. It does not establish that the underlying decision was justified. Human review is required.';

export const INSTRUCTION_RISK_LIMITATION =
  'Instruction-risk detection is a bounded lexical check for obvious adversarial patterns. Reworded, '
  + 'translated, encoded or novel instructions may not be detected. Detection is not complete prompt-injection defence.';

export const HUMAN_REVIEW_ROUTE = Object.freeze({
  required: true,
  route: 'documentation_quality_reviewer',
  statement: 'A human documentation reviewer must examine every condition, every cited passage, and every routing reason before any use of this output.',
});

// Offsets are JavaScript string indices.
export const OFFSET_UNIT = 'utf16_code_unit';
export const MIN_QUOTE_CHARS = 8;
export const MAX_QUOTE_CHARS = 400;
export const MAX_EVIDENCE_ITEMS = 5;
