// DS-N1 candidate identity. This is a NEW experimental candidate created on
// 2026-11-03. It is NOT the original Decision Spellchecker (DS-A, v0.6.11 /
// v0.7.0), NOT the R6 laboratory (LAB-R6 / DS-B), and NOT the JRS Review
// Engine. Do not rebrand it as any of those.
export const CANDIDATE = Object.freeze({
  candidate_id: 'DS-N1',
  name: 'Decision Spellchecker new experimental candidate 1',
  version: '0.2.0-dev',
  provenance: 'Newly developed 2026-11-03 by an AI development agent (Claude Code) in branch claude/decision-spellchecker-ds-n1-2026-11-03. No DS-A or LAB-R6 source was available or used.',
  not_identical_to: ['DS-A (original Decision Spellchecker)', 'LAB-R6 / DS-B', 'JRS Review Engine'],
  rule_version: 'ds-n1.rules/0.2.0',
  model_calls: 0,
  network_access: false,
});

export const RECORD_SCHEMA = 'ds-n1.record/1.0';
export const EVENT_SCHEMA = 'ds-n1.event/1.0';
export const REPORT_SCHEMA = 'ds-n1.report/1.0';
export const EXPORT_SCHEMA = 'ds-n1.export/1.0';

// Provisional mapping to the five published review conditions. This is a
// DS-N1 internal grouping, NOT a versioned Engine-to-Codebook correspondence.
export const CONDITIONS = Object.freeze({
  RC1: 'Reconstructability',
  RC2: 'Basis identification',
  RC3: 'Chronology',
  RC4: 'Decision-process traceability',
  RC5: 'Sufficiency',
});
export const CONDITION_MAPPING_STATUS = 'PROVISIONAL: DS-N1 internal grouping; no versioned Codebook correspondence record exists';

// Scope taken from docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md:
// completed, non-HR supplier-access exception drafts only, constructed data only.
export const ALLOWED_RECORD_CLASSES = Object.freeze(['supplier_access_exception']);
export const EXCLUDED_RECORD_CLASSES = Object.freeze([
  'employment', 'housing', 'lending', 'insurance', 'medical', 'legal_outcome',
]);
export const ALLOWED_DATA_CLASSIFICATIONS = Object.freeze(['constructed_fictional']);

export const LIMITS = Object.freeze({
  record_text_max: 200_000,
  source_text_max: 500_000,
  sources_max: 50,
  claims_max: 200,
  citations_per_claim_max: 20,
  events_max: 5_000,
  id_max: 64,
});

export const STATUS = Object.freeze({
  READY: 'READY_FOR_HUMAN_FINALIZATION',
  REVIEW: 'REVIEW_REQUIRED',
  INCOMPLETE: 'INCOMPLETE',
  HOLD: 'HOLD',
  REFUSED: 'REFUSED_SCOPE',
  ERROR: 'ERROR',
});

export const READY_MEANING = 'READY_FOR_HUMAN_FINALIZATION means only that DS-N1 rules found no unresolved finding in the supplied constructed package. It is not legal defensibility, organisational approval, sufficiency, or authorisation. A human must finalise.';
