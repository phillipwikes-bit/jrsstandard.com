// JRS EVIDENCE GRAPH COMPILER 0.3.4-research-candidate (0.3.3-research-candidate with the research profile repaired
// after the 156-record study; 0.3.4 repair assignment, 2026-10-27). Constants. Not adopted; the engine of record is 0.3.1.
// The default path (no research profile) is the 0.3.2 path unchanged.
// Separately versioned from frozen v0.3 (lib/engine-evidence-graph/), which is unchanged.
// Only COMPILER_VERSION differs here; contract, prompt and limitation texts are identical.
//
// A SEPARATELY VERSIONED local candidate. It does not replace or migrate v1
// (0.1.0-validation, blob baebb512), the 0.1 assurance package, or the 0.2
// evidence contract. It reuses some of their deterministic helpers unchanged.
//
// QUOTE-ONLY MODEL CONTRACT. A candidate may propose exact quotations and
// condition-level observations. It is never trusted for offsets, sections,
// evidence status, graph links or the final status. The compiler computes all
// of those locally and can only keep or lower a candidate's proposed status.

export const CONTRACT_VERSION = 'jrs-engine-local-0.3.0-evidence-graph';
export const COMPILER_VERSION = '0.3.6-research-candidate';
export const PROMPT_VERSION = 'jrs-engine-local-0.3.0/prompt-1';
export const CODEBOOK_VERSION = '1.0';
export const GRAPH_FORMAT_VERSION = 'jrs-evidence-graph/0.3.0';
export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';
export const LOCAL_SIZE_LIMIT_CHARS = 8000;
export const HISTORICAL_REFERENCE_ID = 'HREF-v1-0.1.0-validation-baebb512';

export const CONDITION_IDS = Object.freeze(['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency']);
export const STATUSES = Object.freeze(['supported', 'gap', 'review_required', 'not_assessed']);

export const NODE_TYPES = Object.freeze(['record', 'record_section', 'record_span', 'proposed_quote', 'verified_evidence', 'assertion',
  'condition', 'finding', 'limitation', 'conflict', 'refusal', 'human_review_route', 'run_identity']);
export const EDGE_TYPES = Object.freeze(['CONTAINS', 'LOCATES', 'QUOTES', 'TEXTUALLY_SUPPORTS', 'RELATES_TO', 'TEMPORALLY_PRECEDES',
  'TEMPORALLY_CONFLICTS', 'CONTRADICTS', 'LIMITS', 'ROUTES_TO_REVIEW', 'REFUSES']);

// Permitted (edge type, from node type, to node type). Anything else is invalid.
export const EDGE_SHAPES = Object.freeze({
  CONTAINS: [['record', 'record_section'], ['record_section', 'record_span'], ['record', 'record_span']],
  LOCATES: [['proposed_quote', 'record_span']],
  QUOTES: [['verified_evidence', 'record_span']],
  TEXTUALLY_SUPPORTS: [['verified_evidence', 'assertion']],
  RELATES_TO: [['assertion', 'condition'], ['proposed_quote', 'condition'], ['finding', 'condition'], ['finding', 'assertion'],
    ['finding', 'record_span'], ['run_identity', 'record'], ['proposed_quote', 'verified_evidence']],
  TEMPORALLY_PRECEDES: [['record_span', 'record_span']],
  TEMPORALLY_CONFLICTS: [['record_span', 'record_span']],
  CONTRADICTS: [['conflict', 'record_span'], ['conflict', 'verified_evidence']],
  LIMITS: [['limitation', 'finding']],
  ROUTES_TO_REVIEW: [['finding', 'human_review_route'], ['conflict', 'human_review_route'], ['refusal', 'human_review_route']],
  REFUSES: [['refusal', 'record'], ['refusal', 'finding'], ['refusal', 'proposed_quote']],
});

// The only meaning each edge type may carry. No edge asserts proof, truth,
// legal sufficiency, compliance, credibility or decision correctness.
export const EDGE_MEANINGS = Object.freeze({
  CONTAINS: 'The source node contains the target text region.',
  LOCATES: 'The proposed quotation was found at this record span by the local compiler.',
  QUOTES: 'The verified evidence item is the exact text of this record span.',
  TEXTUALLY_SUPPORTS: 'The quoted text is present in the record and is associated with the bounded assertion type.',
  RELATES_TO: 'The source node is associated with the target node for review purposes.',
  TEMPORALLY_PRECEDES: 'The source span states a date earlier than the date stated in the target span.',
  TEMPORALLY_CONFLICTS: 'The two spans state dates whose order is impossible as written.',
  CONTRADICTS: 'The conflict node links record text that states incompatible things; the Engine does not say which is correct.',
  LIMITS: 'The limitation bounds what the finding can be taken to mean.',
  ROUTES_TO_REVIEW: 'The source node requires human review.',
  REFUSES: 'The refusal node records that the target was not assessed or not used.',
});

export const ASSERTION_TYPES = Object.freeze(['stated_authority', 'stated_decision', 'stated_date', 'stated_rationale', 'stated_risk',
  'stated_control', 'stated_expiry', 'stated_renewal_condition', 'stated_source_reference', 'stated_unresolved_issue']);

// Which assertion types may stand for which condition.
export const CONDITION_ASSERTIONS = Object.freeze({
  reconstructability: ['stated_decision', 'stated_rationale', 'stated_source_reference', 'stated_date', 'stated_control'],
  identifiable_basis: ['stated_authority', 'stated_rationale', 'stated_source_reference'],
  chronology_integrity: ['stated_date', 'stated_expiry', 'stated_renewal_condition'],
  reasoning_traceability: ['stated_rationale', 'stated_decision', 'stated_source_reference', 'stated_authority'],
  sufficiency: ['stated_control', 'stated_risk', 'stated_expiry', 'stated_renewal_condition', 'stated_unresolved_issue', 'stated_source_reference'],
});

export const QUOTE_STATUSES = Object.freeze(['verified_unique', 'verified_disambiguated', 'ambiguous', 'absent', 'malformed', 'not_assessed']);
export const USABLE_QUOTE_STATUSES = Object.freeze(['verified_unique', 'verified_disambiguated']);

export const LIMITATIONS = Object.freeze({
  presence: 'Textual presence only: the quoted text occurs in the record at the computed offsets and is associated with a bounded assertion type. '
    + 'It does not establish that the text proves the finding. It does not establish that the underlying decision was correct or justified. Human review is required.',
  sufficiency: 'This result identifies visible documentation gaps only. It does not determine whether the underlying decision had sufficient substantive support.',
  conflict: 'The Engine identified a record conflict, not the true state of events. It does not say which statement is correct.',
  refusal: 'Not assessed. No statement is made about the record, its author, or the underlying decision.',
  instruction: 'Instruction-risk detection is bounded and lexical; reworded, translated, encoded or novel instructions may not be detected.',
});

export const HUMAN_REVIEW_ROUTE = Object.freeze({
  route: 'documentation_quality_reviewer',
  statement: 'A human documentation reviewer must examine every finding, cited span, conflict and refusal before any use of this output.',
});
