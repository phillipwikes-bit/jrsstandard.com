// Methodology integrity: methodology source definitions. INTERNAL, LOCAL ONLY.
//
// Each entry records what the repository itself says about a source. A status of CANONICAL is
// given only where repository evidence names the source as authoritative; a promising filename
// is not evidence. reviewed_sha256 is the hash of the file as reviewed for this register; the
// builder refuses to run when the file no longer has that hash, so a changed source is reviewed
// again before any record is re-bound to it.

export const SOURCE_STATUSES = Object.freeze(['CANONICAL', 'HISTORICAL', 'DRAFT', 'UNKNOWN', 'NOT_ASSESSED']);
export const CONDITION_NAMES = Object.freeze(['Reconstructability', 'Basis Identification', 'Chronology', 'Decision-Process Traceability', 'Evidentiary Sufficiency']);

export const SOURCES = Object.freeze([
  {
    id: 'SRC-CODEBOOK', name: 'JRS Codebook', path: 'codebook.html', reviewed_sha256: 'f70d1cf403f1c5adae5e02629e4b9e0862331cad257b999accd2bc632994afbb', role: 'METHODOLOGY_TEXT',
    version: '1.0 (2026-06-03), Status: Experimental', classification: 'PUBLIC (deployed page)', status: 'CANONICAL',
    evidence: 'The page calls itself "The authoritative definition of the five components of decision defensibility" and "the measurement instrument". Owner decision D-3 (docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md) records "THE JRS CODEBOOK IS THE METHODOLOGICAL AUTHORITY", and the correspondence control names codebook.html version 1.0 as the Codebook source.',
    limitations: ['Canonical status rests on the page\'s own statement and the recorded D-3 decision (source-reported); no separately signed Codebook document is tracked.', 'All five conditions are classified Experimental on the page.', 'It is a deployed HTML page; a later edit changes its hash, and this register must then be rebuilt and reviewed.'],
    condition_locations: { 'Reconstructability': 'RC 1 heading and definition', 'Basis Identification': 'RC 2 heading and definition', 'Chronology': 'RC 3 heading and definition', 'Decision-Process Traceability': 'RC 4 heading and definition', 'Evidentiary Sufficiency': 'RC 5 heading and definition ("The aggregate condition")' },
  },
  {
    id: 'SRC-STANDARD-PDF', name: 'Justification Review Standard (PDF)', path: 'JRS-Standard.pdf', reviewed_sha256: 'aa52b8e06663cd1bb29ea7b66a8f9483d49491275ab2f1e027a1a427459f91fd', role: 'METHODOLOGY_TEXT',
    version: 'Version 2.0, 2026', classification: 'PUBLIC (deployed file)', status: 'CANONICAL',
    evidence: 'CLAUDE.md 36.1 lists JRS-Standard.pdf as the single canonical main PDF, and all public PDF links point to it. The document carries "Version 2.0".',
    limitations: ['Canonical as the published Standard document under CLAUDE.md 36.1; that table governs link targets, and no separate instrument declares the PDF methodologically authoritative over the Codebook.', 'Its "Core review requirements" section calls Reconstructability "the whole-record requirement the other four serve", while Codebook v1.0 calls Evidentiary Sufficiency "the aggregate condition". This register records the difference and does not resolve it.', 'It calls the five items "requirements"; the Codebook calls them "conditions".'],
    condition_locations: { 'Reconstructability': 'Core review requirements, 01', 'Basis Identification': 'Core review requirements, 02', 'Chronology': 'Core review requirements, 03', 'Decision-Process Traceability': 'Core review requirements, 04', 'Evidentiary Sufficiency': 'Core review requirements, 05' },
  },
  {
    id: 'SRC-STANDARD-HTML', name: 'JRS Standard page', path: 'jrsstandard.html', reviewed_sha256: '165f0da5c70492ef62127afa53efc71d981d8b58a2261256194ca8a7e82748ee', role: 'METHODOLOGY_TEXT',
    version: 'Documentation Review Methodology v1.0, May 2026', classification: 'PUBLIC (deployed page)', status: 'NOT_ASSESSED',
    evidence: 'The page presents the methodology as v1.0. Its relation to JRS-Standard.pdf Version 2.0 is not recorded anywhere in the repository.',
    limitations: ['Its version notes read "Initial release. Four review conditions established.", while other text on the page refers to five review conditions.', 'It uses "ten conditions" for a separate list of documentation failure conditions, which is a different vocabulary from the five review conditions.', 'Which of this page and the PDF governs is NOT ESTABLISHED.'],
  },
  {
    id: 'SRC-METHODOLOGY-HTML', name: 'Methodology page', path: 'methodology.html', reviewed_sha256: 'a787e782e59826a6169368df3c52a539dbd43cb4264add9835174a1f27d6793a', role: 'PUBLIC_PAGE', version: 'not stated', classification: 'PUBLIC (deployed page)', status: 'NOT_ASSESSED',
    evidence: 'A public page about the method; it does not identify itself as the Standard or the Codebook.', limitations: ['Not assessed against the Standard or the Codebook.'],
  },
  {
    id: 'SRC-CONDITIONS-JSON', name: 'Derived conditions file', path: 'standard/jrs-conditions.json', reviewed_sha256: '71a40590d37fe4882c52826181cd90055678e14a47210e21bcad3d2e2e18828c', role: 'DERIVED_ARTIFACT', version: 'jrs_version 1.0, 2026-09-14', classification: 'INTERNAL (excluded from deployment, unpublished)', status: 'DRAFT',
    evidence: 'Its own provenance says it was "derived from api/review.js SYSTEM_PROMPT", the historical engine prompt, with document_status "DERIVED, NOT PUBLISHED".',
    limitations: ['Derived from an engine prompt, not from the Standard or the Codebook, so it cannot be an independent methodology source.', 'Every engine_key_mapping in it reads NOT ESTABLISHED.'],
  },
  {
    id: 'SRC-MANIFEST-SCHEMA', name: 'Decision Reconstruction Manifest schema', path: 'schemas/jrs-decision-reconstruction-manifest.schema.json', reviewed_sha256: '214b4b6f67fcc6ec7426c5005bf90a16d959ef2ec866c81448f95581fe4d5ed8', role: 'SCHEMA', version: 'Manifest 1.0 schema', classification: 'INTERNAL copy (schemas/ excluded); published copies at the site root', status: 'NOT_ASSESSED',
    evidence: 'Defines condition_vocabulary ("jrs_codebook_1.0" or "review_engine_keys") and states that a generator without an owner-declared mapping must emit review_engine_keys.', limitations: ['A schema is not a methodology source; its field names are implementation vocabulary.'],
  },
  {
    id: 'SRC-DRR-PAGE', name: 'Decision Reconstruction Risk definition page', path: 'decision-reconstruction-risk.html', reviewed_sha256: 'f1ba6a3bd5c3f1dfb6e33a601df60ce70fdba4a873cd79688ca3ef7250665d8d', role: 'RESEARCH_TERM_SOURCE', version: 'not stated', classification: 'PUBLIC (deployed page)', status: 'NOT_ASSESSED',
    evidence: 'Defines Decision Reconstruction Risk (DRR) as a concept term.', limitations: ['A research and public term source, not a methodology condition source.'],
  },
  {
    id: 'SRC-RESEARCH-CVP', name: 'Construct-validity data package', path: 'research/CONSTRUCT_VALIDITY_PACKAGE.md', reviewed_sha256: '86ecb48536d254acda128392526c96fa12c321db5e44f51546a76c31f03b8019', role: 'RESEARCH_SUMMARY', version: 'not stated', classification: 'INTERNAL (research/ excluded from deployment)', status: 'NOT_ASSESSED',
    evidence: 'Carries a data-key to condition crosswalk it calls "authoritative".', limitations: ['The crosswalk has no owner approval, and its cold_reviewer_clarity row conflicts with owner decision D-2. It is not a methodology source.'],
  },
]);

// Correspondence decision records: evidence about correspondence, not methodology sources.
export const DECISION_RECORDS = Object.freeze([
  { id: 'DEC-D2', path: 'docs/enterprise-diligence/D-2_CODEBOOK_CORRESPONDENCE_MEMO.md', reviewed_sha256: '31d794afa3b62faccb60ddcabb3ae0f3c22443af38804a069d0de6419bc70ed3', summary: 'D-2: cold_reviewer_clarity is insufficiently established; not a JRS condition, not an aggregate, not a sixth condition, not equivalent to another condition. Intentionally unresolved.' },
  { id: 'DEC-D3-REVIEW', path: 'docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md', reviewed_sha256: '963275e9a44a28f62e345b7db21bfd548e115fec0b006d5586629b50a9949358', summary: 'D-3: the Codebook is the methodological authority. Classifies basis_identification as EXACT by name, two pairs as SEMANTIC, one UNRESOLVED, and cold_reviewer_clarity as not established, for the historical API engine keys.' },
  { id: 'DEC-D3-MATRIX', path: 'docs/enterprise-diligence/D-3_CORRESPONDENCE_DECISION_MATRIX.md', reviewed_sha256: 'c998014966fd00506ffe574fef9be6e3850f27badc5038761be9cf961b48ea76', summary: 'D-3 matrix, stamped superseded in part by BD-04 (2026-09-20).' },
  { id: 'DEC-BD04', path: 'docs/enterprise-diligence/JRS_BOARD_DECISION_REGISTER_2026-09-16.md', reviewed_sha256: '4ff61f565c93c5d48ab0eeaea21aba4afa4b6c419d793eeca64179c49f96dc55', summary: 'BD-04 (2026-09-16), a Board decision "taken under the owner\'s express delegation": declares three historical API key pairs SEMANTIC / INFERRED "as the intended mapping" (reasoning_traceability to Reconstructability, temporal_reconstructability to Chronology, accountability_support to Decision-Process Traceability), keeps basis_identification EXACT, and leaves cold_reviewer_clarity UNRESOLVED.' },
  { id: 'DEC-MAPPING', path: 'docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md', reviewed_sha256: '90a4db44e51f855447acef47b2906cc1cb9e18cf21796a6efdadb9e69fb27b43', summary: 'Mapping record for the historical API engine, carrying the BD-04 section: "DECLARED, not UPGRADED".' },
]);
