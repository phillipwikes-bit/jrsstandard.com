// JRS internal release-gate package: controlled vocabulary and gate definitions.
// INTERNAL ONLY. Not deployed (lib/ is excluded by .vercelignore), not public, and not the
// Decision Reconstruction Manifest. Governed by docs/architecture/RELEASE_EVIDENCE_PROTOCOL.md
// and docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md ("Do not mark any gate complete").
//
// Nothing in this file is evidence. It defines what evidence must look like before a gate may
// record PASS, and which kinds of evidence can never satisfy which requirement.

export const RECORD_SCHEMA_VERSION = 'jrs-release-gate-record/0.1.0';
export const SUPPORTED_SCHEMA_VERSIONS = Object.freeze([RECORD_SCHEMA_VERSION]);
export const VALIDATOR_VERSION = 'jrs-release-gate-validator/0.1.0';
export const REPORT_VERSION = 'jrs-release-gate-report/0.1.0';

// The only statuses a gate or sub-control may carry. "ready", "validated", "approved",
// "production", "licensed" and "sale-ready" are deliberately absent.
export const STATUSES = Object.freeze(['NOT_ASSESSED', 'PENDING', 'BLOCKED', 'PASS', 'FAIL', 'NOT_APPLICABLE']);

// Where an evidence item came from. Recorded separately from its class so a mismatch
// (for example a "live" item classed as a mocked test) is detectable.
export const PROVENANCES = Object.freeze(['constructed', 'mocked', 'local', 'live', 'independent', 'source_reported', 'owner_record']);

// What the artifact physically is. A class only accepts the kinds listed for it, which is how a
// written policy is kept from standing in for an execution record.
export const ARTIFACT_KINDS = Object.freeze([
  'constructed_dataset', 'test_output', 'code_review_note', 'policy_document', 'documentation_statement',
  'source_report', 'execution_log', 'smoke_test_response', 'monitoring_record', 'access_review_export',
  'rotation_record', 'deletion_execution_log', 'restore_record', 'rollback_record', 'labeling_dataset',
  'adjudication_record', 'holdout_attestation', 'qa_report', 'counsel_memo', 'signed_authorization',
]);

// Evidence classes. `provenance` is the only provenance the class may carry; `kinds` the only
// artifact kinds. `production_evidence` marks the classes that can ever stand for something
// happening outside this repository; constructed, mocked, local and source-reported never can.
export const EVIDENCE_CLASSES = Object.freeze({
  CONSTRUCTED_FIXTURE:       { provenance: 'constructed',     kinds: ['constructed_dataset'], production_evidence: false },
  MOCKED_TEST:               { provenance: 'mocked',          kinds: ['test_output'], production_evidence: false },
  LOCAL_CODE_REVIEW:         { provenance: 'local',           kinds: ['code_review_note', 'test_output', 'policy_document', 'documentation_statement'], production_evidence: false },
  SOURCE_REPORTED:           { provenance: 'source_reported', kinds: ['source_report', 'policy_document', 'documentation_statement'], production_evidence: false },
  LIVE_EXECUTION:            { provenance: 'live',            kinds: ['execution_log', 'smoke_test_response', 'monitoring_record'], production_evidence: true },
  INDEPENDENT_LABELING:      { provenance: 'independent',     kinds: ['labeling_dataset', 'adjudication_record', 'holdout_attestation'], production_evidence: true },
  INDEPENDENT_QA:            { provenance: 'independent',     kinds: ['qa_report'], production_evidence: true },
  COUNSEL_REVIEW:            { provenance: 'independent',     kinds: ['counsel_memo'], production_evidence: true },
  OWNER_AUTHORIZATION:       { provenance: 'owner_record',    kinds: ['signed_authorization'], production_evidence: true },
  OPERATOR_CONTROL_EVIDENCE: { provenance: 'live',            kinds: ['access_review_export', 'rotation_record', 'deletion_execution_log', 'restore_record', 'rollback_record', 'monitoring_record', 'execution_log'], production_evidence: true },
});

// [sub-control id, name, classes that can satisfy it, artifact kinds that can satisfy it]
const sc = (id, name, classes, kinds) => Object.freeze({ id, name, satisfied_by: Object.freeze(classes), kinds: Object.freeze(kinds) });

// The five release gates of the 5 October handoff, as the owner's instruction of 2026-10-06
// states them. Every gate is required; none may be recorded NOT_APPLICABLE.
export const GATES = Object.freeze([
  Object.freeze({
    id: 'RG-1', name: 'Independent labeling and adjudication of an unused sealed holdout',
    prerequisites: [], engine_specific: true, prompt_applicable: true, independent_reviewer_required: true,
    per_condition_results_required: true,
    sub_controls: Object.freeze([
      sc('RG-1.1', 'Holdout sealed before use and never used in development', ['INDEPENDENT_LABELING'], ['holdout_attestation']),
      sc('RG-1.2', 'Independent labeling of the holdout', ['INDEPENDENT_LABELING'], ['labeling_dataset']),
      sc('RG-1.3', 'Adjudication of labeling disagreements', ['INDEPENDENT_LABELING'], ['adjudication_record']),
      sc('RG-1.4', 'Named Engine version run on the holdout', ['LIVE_EXECUTION'], ['execution_log']),
      sc('RG-1.5', 'Per-condition results with uncertainty', ['INDEPENDENT_LABELING'], ['adjudication_record']),
    ]),
  }),
  Object.freeze({
    id: 'RG-2', name: 'Operator-control evidence',
    prerequisites: [], engine_specific: false, prompt_applicable: false, independent_reviewer_required: false,
    per_condition_results_required: false,
    sub_controls: Object.freeze([
      sc('RG-2.1', 'IAM and database access', ['OPERATOR_CONTROL_EVIDENCE'], ['access_review_export']),
      sc('RG-2.2', 'Credential rotation', ['OPERATOR_CONTROL_EVIDENCE'], ['rotation_record']),
      sc('RG-2.3', 'Retention execution', ['OPERATOR_CONTROL_EVIDENCE'], ['deletion_execution_log']),
      sc('RG-2.4', 'Backup restoration', ['OPERATOR_CONTROL_EVIDENCE'], ['restore_record']),
      sc('RG-2.5', 'Compatible rollback', ['OPERATOR_CONTROL_EVIDENCE'], ['rollback_record']),
      sc('RG-2.6', 'Monitoring', ['OPERATOR_CONTROL_EVIDENCE'], ['monitoring_record']),
      sc('RG-2.7', 'Live-operation verification', ['OPERATOR_CONTROL_EVIDENCE', 'LIVE_EXECUTION'], ['execution_log']),
    ]),
  }),
  Object.freeze({
    id: 'RG-3', name: 'Counsel review',
    prerequisites: [], engine_specific: false, prompt_applicable: false, independent_reviewer_required: true,
    per_condition_results_required: false,
    sub_controls: Object.freeze([
      sc('RG-3.1', 'Actual data flows', ['COUNSEL_REVIEW'], ['counsel_memo']),
      sc('RG-3.2', 'Storage terms', ['COUNSEL_REVIEW'], ['counsel_memo']),
      sc('RG-3.3', 'Privacy obligations', ['COUNSEL_REVIEW'], ['counsel_memo']),
      sc('RG-3.4', 'Evaluation claims', ['COUNSEL_REVIEW'], ['counsel_memo']),
      sc('RG-3.5', 'Licensing claims', ['COUNSEL_REVIEW'], ['counsel_memo']),
      sc('RG-3.6', 'Rights dependencies', ['COUNSEL_REVIEW'], ['counsel_memo']),
    ]),
  }),
  Object.freeze({
    id: 'RG-4', name: 'Recorded owner release authorization',
    prerequisites: ['RG-1', 'RG-2', 'RG-3'], engine_specific: true, prompt_applicable: true, independent_reviewer_required: false,
    per_condition_results_required: false, owner_decision_required: true,
    sub_controls: Object.freeze([
      sc('RG-4.1', 'Signed owner release authorization naming the Engine version', ['OWNER_AUTHORIZATION'], ['signed_authorization']),
    ]),
  }),
  Object.freeze({
    id: 'RG-5', name: 'Independent production QA',
    prerequisites: ['RG-4'], engine_specific: true, prompt_applicable: true, independent_reviewer_required: true,
    per_condition_results_required: false,
    sub_controls: Object.freeze([
      sc('RG-5.1', 'Independent QA of the authorized production deployment', ['INDEPENDENT_QA'], ['qa_report']),
    ]),
  }),
]);

export const GATE_IDS = Object.freeze(GATES.map((g) => g.id));
export const gateDef = (id) => GATES.find((g) => g.id === id) || null;

// The only owner decision value that authorizes anything, and only on RG-4.
export const OWNER_DECISIONS = Object.freeze(['release_authorized', 'release_refused', 'gate_accepted', 'gate_rejected']);

// The fixed statement every report carries. Its absence makes a report invalid.
export const NOT_A_CLEARANCE = 'This record is internal engineering documentation. It is not a legal, privacy, security or commercial clearance, it is not the public Decision Reconstruction Manifest, and it creates no production, licensing, sale, evaluation or real-record authorization.';
