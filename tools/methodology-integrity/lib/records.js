// Methodology integrity: the current correspondence records. INTERNAL, LOCAL ONLY.
//
// Governing rule: a shared word, a similar concept or a plausible interpretation does not
// establish a formal mapping. A record may be APPROVED_CORRESPONDENCE only with the authoritative
// source version, the exact source location, the exact candidate term, the mapping type, the
// evidence basis, the status and an owner-approved interpretation date. No record below has an
// owner approval, and none is created here: every record is UNMAPPED, PROPOSED_NOT_APPROVED,
// HISTORICAL_REFERENCE_ONLY, NOT_ASSESSED or RETIRED.
//
// The builder adds methodology_source_sha256 from the source register and checks every record
// against schema/correspondence-record.schema.json and the rules in lib/validate.js.

const CREATED = { date: '2026-10-06', change: 'Record created by the methodology vocabulary-integrity package. No owner approval exists or is implied.' };
const NO_APPROVAL = Object.freeze({ approved: false, approver: null, approval_date: null, approval_reference: null });
const EXPL = 'lib/engine-candidate/explanations.js';
const NOTICE = 'No Codebook correspondence asserted.';

let n = 0;
function rec(o) {
  n += 1;
  return {
    correspondence_id: 'MC-' + String(n).padStart(3, '0'),
    methodology_source_id: o.source || null,
    methodology_source_sha256: null,
    authoritative_source_term: o.authTerm || null,
    candidate_term: o.term,
    term_category: o.category,
    term_location: o.at,
    mapping_type: o.type || 'NO_CORRESPONDENCE_ASSERTED',
    status: o.status,
    evidence_basis: o.evidence,
    source_reference: o.sourceRef || null,
    limitation: o.limitation,
    proposal: o.proposal || null,
    owner_approval: { ...NO_APPROVAL },
    change_history: o.history || [CREATED],
  };
}

// ---- the five conditions, as the two canonical sources name them ---------------------------------
const CONDITION_REFS = {
  'Reconstructability': 'RC 1', 'Basis Identification': 'RC 2', 'Chronology': 'RC 3', 'Decision-Process Traceability': 'RC 4', 'Evidentiary Sufficiency': 'RC 5',
};
const conditions = Object.entries(CONDITION_REFS).map(([name, rc], i) => rec({
  term: name, category: 'JRS_CONDITION', status: 'NOT_ASSESSED', source: 'SRC-CODEBOOK', authTerm: name,
  at: { path: 'JRS-Standard.pdf', reference: 'Core review requirements, 0' + (i + 1) },
  sourceRef: 'codebook.html, ' + rc + ' heading and definition',
  evidence: 'The same name appears in codebook.html v1.0 (' + rc + ') and in JRS-Standard.pdf Version 2.0 (Core review requirements, 0' + (i + 1) + ').',
  limitation: 'Identical names do not establish identical definitions. Definitional alignment between the Standard PDF and the Codebook has not been assessed.'
    + (name === 'Reconstructability' ? ' The PDF calls Reconstructability "the whole-record requirement the other four serve"; the Codebook gives that aggregate role to Evidentiary Sufficiency.' : '')
    + (name === 'Evidentiary Sufficiency' ? ' The Codebook calls it "the aggregate condition"; the PDF gives the whole-record role to Reconstructability.' : ''),
}));

// ---- candidate review keys ---------------------------------------------------------------------
const KEY_AT = { path: EXPL, reference: 'CONDITION_CATEGORY' };
const proposed = (term, proposedTerm, basis) => rec({
  term, category: 'CANDIDATE_KEY', status: 'PROPOSED_NOT_APPROVED', at: KEY_AT,
  evidence: 'The candidate declares CODEBOOK_CORRESPONDENCE "not_asserted" and CODEBOOK_CORRESPONDENCE_RECORD null. ' + basis,
  proposal: { proposed_source_id: 'SRC-CODEBOOK', proposed_source_term: proposedTerm, reference: 'docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md (BD-04); docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md (D-3)',
              note: 'The proposal concerns the historical API engine key of the same name. It was "DECLARED, not UPGRADED" and was never approved for this candidate.' },
  limitation: 'Prompt wording is not a Codebook definition. A shared or similar name is not a correspondence. ' + NOTICE,
});
const keys = [
  proposed('basis_identification', 'Basis Identification', 'D-3 classified the historical API key EXACT by name only; a name match is not an approved definitional correspondence for this candidate.'),  // a proposal, not approved: no correspondence asserted
  proposed('reasoning_traceability', 'Reconstructability', 'BD-04 declared the historical API key SEMANTIC / INFERRED as "the intended mapping".'),  // a proposal, not approved: no correspondence asserted
  proposed('temporal_reconstructability', 'Chronology', 'BD-04 declared the historical API key SEMANTIC / INFERRED as "the intended mapping".'),  // a proposal, not approved: no correspondence asserted
  rec({ term: 'accountability_support', category: 'CANDIDATE_KEY', status: 'UNMAPPED', at: KEY_AT,
    evidence: 'EXPLICITLY_UNMAPPED_KEYS in the candidate lists it, and CONDITION_CATEGORY gives it no category. BD-04 declared the historical API key of the same name SEMANTIC / INFERRED to Decision-Process Traceability; the candidate does not carry that declaration forward.',
    limitation: 'Not Evidentiary Sufficiency and not Decision-Process Traceability without an approved record. ' + NOTICE }),
  rec({ term: 'cold_reviewer_clarity', category: 'CANDIDATE_KEY', status: 'UNMAPPED', at: KEY_AT,
    evidence: 'Owner decision D-2: insufficiently established; not a JRS condition, not an aggregate, not a sixth condition, not equivalent to another condition. EXPLICITLY_UNMAPPED_KEYS in the candidate lists it.',
    limitation: 'Not a JRS condition. Intentionally unresolved under D-2. ' + NOTICE }),
];

// ---- candidate-internal explanation categories and finding types --------------------------------
const category = (term, extra) => rec({ term, category: 'CANDIDATE_EXPLANATION_CATEGORY', status: 'UNMAPPED', at: { path: EXPL, reference: 'CATEGORIES' },
  evidence: 'The candidate states the categories are "a review aid for this candidate only" and "NOT a mapping to the JRS Codebook".',
  limitation: 'Candidate-internal review aid. ' + (extra ? extra + ' ' : '') + NOTICE });
const categories = [
  category('missing_logical_bridge'), category('missing_identifiable_basis'),
  category('chronology_gap', 'Its label shares the word "Chronology" with a Codebook condition name; a shared word is not a correspondence.'),
  category('unsupported_conclusion'),
  category('insufficient_evidence', 'Its wording resembles the Codebook name "Evidentiary Sufficiency"; the resemblance is not a correspondence.'),
];
const flaw = (term) => rec({ term, category: 'CANDIDATE_FLAW_TYPE', status: 'UNMAPPED', at: { path: EXPL, reference: 'FLAW_CATEGORY' },
  evidence: 'A finding type of the candidate adapter contract (ADAPTER_FLAW_TYPES).', limitation: 'Candidate output vocabulary, not methodology vocabulary. ' + NOTICE });
const flaws = ['reasoning_elision', 'evidentiary_overreach', 'chronology_collapse', 'unsupported_content', 'extraction_omission', 'truncation'].map(flaw);

// ---- deterministic checks --------------------------------------------------------------------
export const SOURCE_PREP_CODES = Object.freeze(['placeholder', 'referenced_material_not_in_record', 'profile_element_not_found', 'off_record_reference', 'assertion_without_basis', 'pages_missing', 'ends_mid_sentence', 'ends_with_ellipsis', 'explicit_truncation_marker', 'unclosed_quotation', 'instruction_like_text']);
export const MODEL_OUTPUT_CODES = Object.freeze(['adapter_output_rejected', 'excerpt_not_in_record', 'rejected_flaw_type', 'withheld_prohibited_inference']);
const sourcePrep = SOURCE_PREP_CODES.map((term) => rec({ term, category: 'SOURCE_PREP_CHECK', status: 'UNMAPPED', at: { path: EXPL, reference: 'EXTRACTION' },
  evidence: 'A deterministic pattern check run by lib/engine-candidate/source-prep.js before any model call.',
  limitation: 'A deterministic input control. It is not a contextual JRS determination and not a JRS finding. ' + NOTICE }));
const outputChecks = MODEL_OUTPUT_CODES.map((term) => rec({ term, category: 'MODEL_OUTPUT_CHECK', status: 'UNMAPPED', at: { path: EXPL, reference: 'EXTRACTION' },
  evidence: 'A deterministic check the candidate applies to model output.', limitation: 'A check on the model output, not on the record, and not a JRS determination. ' + NOTICE }));

// ---- local reviewer workspace ----------------------------------------------------------------
const CORE = 'tools/local-reviewer-workspace/app/core.js', WS = 'tools/local-reviewer-workspace/app/workspace.js';
const wsLabel = (term, path, reference) => rec({ term, category: 'WORKSPACE_LABEL', status: 'UNMAPPED', at: { path, reference },
  evidence: 'A label the workspace displays.', limitation: 'Display vocabulary of the local workspace. ' + NOTICE });
const workspace = [
  wsLabel('Source-preparation findings', CORE, 'SECTIONS.source_preparation'),
  wsLabel('Candidate review prompts and findings', CORE, 'SECTIONS.candidate_prompts'),
  wsLabel('Model-output checks', CORE, 'SECTIONS.model_output_checks'),
  wsLabel('Candidate review key', WS, 'findingCard'),
  wsLabel('Candidate finding type', WS, 'findingCard'),
  wsLabel('Candidate-internal category', WS, 'findingCard'),
  ...['CONFIRMED_FOR_FURTHER_REVIEW', 'NOT_CONFIRMED', 'NEEDS_CLARIFICATION', 'OUT_OF_SCOPE', 'NO_DISPOSITION'].map((term) => rec({ term, category: 'WORKSPACE_DISPOSITION', status: 'UNMAPPED',
    at: { path: CORE, reference: 'DISPOSITIONS' }, evidence: 'A reviewer disposition value of the local workspace.',
    limitation: 'A reviewer\'s disposition on a candidate finding. It is not a JRS determination, an approval or a routing value. ' + NOTICE })),
];

// ---- Decision Reconstruction Manifest ------------------------------------------------------------
const MS = 'schemas/jrs-decision-reconstruction-manifest.schema.json';
const manifest = [
  rec({ term: 'jrs_codebook_1.0', category: 'MANIFEST_VALUE', status: 'NOT_ASSESSED', type: 'IMPLEMENTATION_REFERENCE', at: { path: MS, reference: 'properties.condition_vocabulary.enum' },
    evidence: 'The schema allows the value; api/_manifest/build.js refuses it unless an owner-declared mapping is supplied.',
    limitation: 'Names a vocabulary; it does not establish that any emitted key is a Codebook condition. No owner-declared mapping exists. ' + NOTICE }),
  rec({ term: 'review_engine_keys', category: 'MANIFEST_VALUE', status: 'UNMAPPED', at: { path: MS, reference: 'properties.condition_vocabulary.enum' },
    evidence: 'The schema states a generator without an owner-declared mapping MUST emit review_engine_keys.', limitation: 'Declares implementation keys, not methodology terms. ' + NOTICE }),
  rec({ term: 'conditions', category: 'MANIFEST_FIELD', status: 'NOT_ASSESSED', at: { path: MS, reference: 'properties.conditions' },
    evidence: 'A Manifest field holding five keyed statuses.', limitation: 'A field name, not a methodology term. Its keys are interpreted only through condition_vocabulary. ' + NOTICE }),
  ...['pass', 'review', 'gap'].map((term) => rec({ term, category: 'MANIFEST_VALUE', status: 'NOT_ASSESSED', at: { path: MS, reference: 'properties.conditions.additionalProperties.properties.status.enum' },
    evidence: 'A Manifest condition status value. The research datasets use the same three words.', limitation: 'A shared word across the Manifest and the research data is not a shared definition. ' + NOTICE })),
  ...[['jrs_version', 'The JRS version the Manifest names.'], ['codebook_version', 'The Codebook version the Manifest names.']].map(([term, what]) => rec({ term, category: 'MANIFEST_FIELD', status: 'NOT_ASSESSED',
    at: { path: MS, reference: 'properties.' + term }, evidence: what, limitation: 'Naming a version is not a correspondence between any emitted key and that version. ' + NOTICE })),
  rec({ term: 'routing', category: 'MANIFEST_FIELD', status: 'NOT_ASSESSED', at: { path: MS, reference: 'properties.routing' },
    evidence: 'A Manifest field holding a value and its vocabulary.', limitation: 'A field name, not a methodology term. ' + NOTICE }),
  ...['openapi_1.0_routing', 'engine_determination'].map((term) => rec({ term, category: 'MANIFEST_VALUE', status: 'NOT_ASSESSED', at: { path: MS, reference: 'properties.routing.properties.vocabulary.enum' },
    evidence: 'A routing vocabulary value; api/_manifest/build.js records routing with its vocabulary and never translates it.', limitation: 'Implementation vocabulary. ' + NOTICE })),
];

// ---- research vocabulary -----------------------------------------------------------------------
const research = [
  rec({ term: 'Decision Reconstruction Risk (DRR)', category: 'RESEARCH_TERM', status: 'NOT_ASSESSED', at: { path: 'decision-reconstruction-risk.html', reference: 'page title and DefinedTerm' },
    evidence: 'Defined on the public DRR page and used across the research files.', limitation: 'A research and public term. It is not Engine vocabulary and no candidate output measures it. ' + NOTICE }),
  rec({ term: 'Ready / Needs work / Gap', category: 'RESEARCH_TERM', status: 'NOT_ASSESSED', at: { path: 'research/JRS_PreRegistered_Analysis_Plan.md', reference: 'Determination scale' },
    evidence: 'The determination scale used by human reviewers in the research programme.', limitation: 'A human-reviewer research scale. The candidate emits no determination, and this scale is not Engine vocabulary. ' + NOTICE }),
  rec({ term: 'ten conditions', category: 'RESEARCH_TERM', status: 'NOT_ASSESSED', at: { path: 'jrsstandard.html', reference: 'section "The Ten Conditions"' },
    evidence: 'A list of documentation failure conditions on the Standard page.', limitation: 'A separate vocabulary from the five review conditions. Not Engine vocabulary. ' + NOTICE }),
  rec({ term: 'five JRS conditions (as applied by human reviewers)', category: 'RESEARCH_TERM', status: 'NOT_ASSESSED', at: { path: 'research/DRR_Detection_Validation_Protocol.md', reference: 'Arm A' },
    evidence: 'Research protocols describe human reviewers applying the five conditions.', limitation: 'Describes human review in the research programme, not the Engine candidate. ' + NOTICE }),
  rec({ term: 'construct_validity_data.csv condition columns', category: 'RESEARCH_TERM', status: 'HISTORICAL_REFERENCE_ONLY', at: { path: 'research/CONSTRUCT_VALIDITY_PACKAGE.md', reference: 'Condition crosswalk' },
    evidence: 'The package carries a crosswalk from data keys to conditions that it calls "authoritative", including a row pairing cold_reviewer_clarity with Evidentiary Sufficiency; no correspondence asserted here.',
    limitation: 'The crosswalk has no owner approval and its cold_reviewer_clarity row conflicts with D-2. It is recorded as historical research labelling only and is not carried into this register. ' + NOTICE }),
];

// ---- historical engine keys and retired assignments -----------------------------------------------
// Historical API engine keys (api/v1/review-engine.js, closed): no correspondence asserted for the candidate.
const historicalKeys = [
  ['basis_identification', 'D-3 review: EXACT by name.'], ['reasoning_traceability', 'BD-04: SEMANTIC / INFERRED to Reconstructability, declared not upgraded.'],  // historical key: no correspondence asserted
  ['temporal_reconstructability', 'BD-04: SEMANTIC / INFERRED to Chronology, declared not upgraded.'], ['accountability_support', 'BD-04: SEMANTIC / INFERRED to Decision-Process Traceability, declared not upgraded.'],  // historical key: no correspondence asserted
  ['cold_reviewer_clarity', 'D-2: insufficiently established, intentionally unresolved.'],  // historical key: no correspondence asserted
].map(([term, what]) => rec({ term, category: 'HISTORICAL_ENGINE_KEY', status: 'HISTORICAL_REFERENCE_ONLY', at: { path: 'docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md', reference: 'historical API engine key set' },
  evidence: what + ' Recorded for the closed historical API engine (api/v1/review-engine.js).',
  limitation: 'Historical reference only. Not carried forward to the local candidate, and not an approved correspondence. ' + NOTICE }));
const retired = [
  rec({ term: 'accountability_support', category: 'CANDIDATE_KEY', status: 'RETIRED', at: { path: EXPL, reference: 'CONDITION_CATEGORY (explanations before 0.2.0)' },
    evidence: 'Before explanations/0.2.0 the key sat under the insufficient_evidence category, which mirrored the Codebook\'s Evidentiary Sufficiency wording.',
    limitation: 'Retired 2026-10-06 after the PR #39 source-alignment review. ' + NOTICE,
    history: [{ date: '2026-10-06', change: 'explanations/0.2.0 removed the insufficient_evidence assignment.' }, CREATED] }),
];

export const RECORDS = Object.freeze([...conditions, ...keys, ...categories, ...flaws, ...sourcePrep, ...outputChecks, ...workspace, ...manifest, ...research, ...historicalKeys, ...retired]);
