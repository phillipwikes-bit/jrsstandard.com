// JRS ENGINE RELIABILITY 0.6.0-local: shared vocabulary for the Phase 6
// controlled reliability, regression and adaptation framework.
//
// The framework observes and compares. It never changes an Engine version,
// never applies a proposed change, never approves one, never adjusts a
// threshold and never reclassifies a result to a more favourable status.
// Every difference it finds is routed to a person or fails closed.

export const RELIABILITY_VERSION = '0.6.0-local-reliability';
export const BASELINE_FORMAT_VERSION = 'jrs-phase6-baseline/0.6.0';
export const RECORD_FORMAT_VERSION = 'jrs-phase6-behaviour-record/0.6.0';
export const LIBRARY_FORMAT_VERSION = 'jrs-phase6-scenario/0.6.0';
export const REGISTER_FORMAT_VERSION = 'jrs-phase6-knowledge-register/0.6.0';
export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';

export const STATEMENT = 'Local engineering material only. Synthetic, engineering-authored scenarios run offline against local Engine candidates. '
  + 'Not independently evaluated. No accuracy, semantic validity, reliability in use, legal compliance, production, release, licensing or sale readiness is established.';

// Packages the baseline covers. Each is read through its own frozen replay; none is modified.
export const PACKAGES = Object.freeze({
  'v0.1-assurance': { version: '0.1.0-assurance', source: 'tools/engine-assurance-replay.mjs' },
  'v0.2-evidence-contract': { version: '0.2.0-local', source: 'tools/engine-evidence-contract-replay.mjs' },
  'v0.3-evidence-graph': { version: '0.3.0-local', source: 'tools/engine-evidence-graph-replay.mjs' },
  'phase4-corpus': { version: '0.3.0-local (Phase 4 corpus, frozen compiler)', source: 'lib/engine-change-control/corpus-replay.mjs' },
  'phase4-stability': { version: '0.3.0-local (Phase 4 stability laboratory, frozen compiler)', source: 'lib/engine-change-control/stability.mjs' },
  'phase6-library': { version: '0.3.0-local (Phase 6 regression library, frozen compiler)', source: 'lib/engine-reliability/library.mjs' },
});

// Baseline classes. Precedence is the order listed; the first that applies is recorded.
export const BASELINE_CLASSES = Object.freeze(['known_open_failure', 'intentional_refusal', 'not_assessed', 'unsupported_or_ambiguous', 'expected_behavior']);

// Outcome rank used only to detect direction. A higher rank is a more favourable reading.
export const RANK = Object.freeze({ not_assessed: 0, review_required: 1, gap: 2, supported: 3 });
export const LOW_STATES = Object.freeze(['not_assessed', 'review_required']);

// Difference classifications (Work Package C).
export const DIFF_CLASSES = Object.freeze(['presentation_only', 'expected_safe_degradation', 'expected_refusal', 'unexpected_behavioral_change',
  'favorable_transition_requiring_human_review', 'limitation_removed_or_weakened', 'quote_or_span_integrity_defect', 'scope_boundary_defect',
  'unknown_comparison_state']);
// Classes that make the whole comparison fail closed.
export const FAIL_CLOSED_CLASSES = Object.freeze(['limitation_removed_or_weakened', 'quote_or_span_integrity_defect', 'scope_boundary_defect', 'unknown_comparison_state']);
export const VERDICTS = Object.freeze(['no_behavioral_difference', 'presentation_only', 'human_review_required', 'fail_closed']);

// Scenario library (Work Package B).
export const SYNTHETIC_MARKER = 'SYNTHETIC ENGINEERING FIXTURE.';
export const PROVENANCE_NOTE = 'Authored for local engineering only by the Phase 6 session on 2026-10-17. Synthetic; no real person, employer, customer or case. Not independent, real-world or holdout material.';
export const SCENARIO_CATEGORIES = Object.freeze({
  evidence_quotation_span_integrity: { prefix: 'EQ', minimum: 10 },
  presence_versus_semantic_support: { prefix: 'SP', minimum: 10 },
  chronology_ambiguity_conflict_omission: { prefix: 'CH', minimum: 10 },
  reasoning_traceability_unsupported_conclusions: { prefix: 'RT', minimum: 8 },
  sufficiency_missing_decision_basis: { prefix: 'SU', minimum: 8 },
  cognitive_controls_neutrality_bounded_language: { prefix: 'CC', minimum: 6 },
  excluded_domain_reworded_scope: { prefix: 'XD', minimum: 4 },
  instruction_injection_malformed_input: { prefix: 'IN', minimum: 4 },
});
export const EXPECTATION_KINDS = Object.freeze(['invariant', 'expected_degradation', 'expected_refusal', 'known_open_failure']);
export const SCENARIO_RESULTS = Object.freeze(['as_expected', 'known_open_failure_reproduced', 'known_open_failure_not_reproduced', 'unexpected']);

// Knowledge register (Work Package D).
export const REGISTER_STATES = Object.freeze(['open', 'reproduced', 'mitigated', 'deferred']);
export const ENGINE_LAYERS = Object.freeze(['intake_scope', 'instruction_quarantine', 'candidate_contract', 'quote_resolution', 'assertion_compiler',
  'contradiction_detection', 'condition_rules', 'status_combination', 'cognitive_controls', 'graph_validation', 'reliability_framework']);
export const RISK_CATEGORIES = Object.freeze(['favourable_reading_without_support', 'refusal_boundary', 'quote_integrity', 'chronology', 'reasoning_trace',
  'sufficiency_visibility', 'neutrality', 'instruction_risk', 'comparison_integrity', 'provenance']);

// Words no Phase 6 status, label or record may use for itself.
export const FORBIDDEN_STATUS_WORDS = Object.freeze(['validated', 'approved', 'accurate', 'correct', 'certified', 'compliant', 'production ready', 'production-ready',
  'release ready', 'release-ready', 'commercial ready', 'commercially ready', 'independently verified', 'sale ready', 'licensing ready']);
const FORBIDDEN_RE = new RegExp('(?<![A-Za-z0-9])(?:' + FORBIDDEN_STATUS_WORDS.map((w) => w.replace(/[-_ ]/g, '[-_ ]')).join('|') + ')(?![A-Za-z0-9])', 'i');
export function findForbiddenStatusWord(text) { const m = FORBIDDEN_RE.exec(String(text == null ? '' : text)); return m ? m[0] : null; }
