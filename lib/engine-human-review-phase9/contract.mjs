// JRS PHASE 9: human evidence adjudication layer, contract constants.
//
// The boundary this package exists to keep: a quotation may be present, accurate
// and linked to a condition without semantically supporting the finding. The Engine
// verifies text and routes; a qualified human reviewer determines semantic support.
// Nothing in this package makes, infers, approves or fills in that determination.

export const PHASE9_STATEMENTS = Object.freeze(['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO RELEASE, DEPLOYMENT OR COMMERCIAL READINESS DETERMINATION']);
export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';
export const DOSSIER_FORMAT = 'jrs-phase9-human-evidence-dossier/1.0.0';
export const PACKAGE_ID = 'phase9-human-evidence-adjudication';
export const PRESENCE_STATEMENT = 'Textual presence is not semantic support. The quotation below occurs in the record at the stated offsets; whether it supports the finding is for the human reviewer to determine.';
export const ENGINE_RESULT_STATEMENT = 'The Engine result is a routing aid, not a conclusion, approval or recommendation.';
export const BOUNDARY_STATEMENT = 'This package does not label, score, approve, validate, release, deploy or commercialize the Engine.';

export const CONDITIONS = Object.freeze({
  reconstructability: { name: 'Reconstructability', question: 'Does the quoted text, read in its section, show what was decided and on what stated basis, or does it leave the decision unreconstructable from the record?' },
  identifiable_basis: { name: 'Identifiable basis', question: 'Does the quoted text identify the authority or source the record relies on, or does it only mention one without showing that it was the basis?' },
  chronology_integrity: { name: 'Chronology integrity', question: 'Do the quoted dates, read with their roles (event, document, decision), give a consistent sequence, or is the sequence uncertain or conflicting?' },
  reasoning_traceability: { name: 'Reasoning traceability', question: 'Can the stated reasoning be followed from the quoted text to the decision, or is a step missing, negated or only implied?' },
  sufficiency: { name: 'Sufficiency', question: 'Is the quoted material enough for a reviewer to reconstruct the decision without information outside the record, or is material information missing?' },
});

// The only admissible reviewer outcomes. The dossier lists them; it never selects one.
export const OUTCOMES = Object.freeze(['supports_finding', 'does_not_support_finding', 'insufficient_context', 'ambiguous', 'record_conflict', 'outside_authorized_scope', 'abstain_and_escalate']);
export const ESCALATING_OUTCOMES = Object.freeze(['insufficient_context', 'ambiguous', 'record_conflict', 'outside_authorized_scope', 'abstain_and_escalate']);

// The five layers that must not be collapsed into one another.
export const EVIDENCE_LAYERS = Object.freeze([
  { layer: 'quote_presence', determined_by: 'Engine (exact text match)', meaning: 'The quoted characters occur in the record.' },
  { layer: 'quote_accuracy', determined_by: 'Engine (offsets and uniqueness)', meaning: 'The quotation is reproduced exactly and located unambiguously.' },
  { layer: 'section_linkage', determined_by: 'Engine (section role)', meaning: 'The quotation sits in a section whose role relates to the condition.' },
  { layer: 'semantic_support', determined_by: 'Human reviewer only', meaning: 'What the quoted words actually say bears on and supports the finding.' },
  { layer: 'decision_validity', determined_by: 'Out of scope for this package', meaning: 'Whether the underlying decision was right. Not assessed by the Engine or by this review.' },
]);

// Questions the review must never ask.
export const PROHIBITED_QUESTIONS = Object.freeze(['legal liability', 'discrimination', 'policy compliance', 'whether an employment decision was correct']);

// Escalation triggers derived from Engine output only (never from any expected answer).
export const ESCALATION_TRIGGERS = Object.freeze({
  ET1: 'No verified quotation is cited for this condition.',
  ET2: 'A conflict indicator applies to this condition.',
  ET3: 'The condition was not assessed or the record was refused.',
});
