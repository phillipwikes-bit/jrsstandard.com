// JRS Review Engine local candidate: human-review explanations.
// LOCAL DEVELOPMENT ONLY.
//
// Each flagged condition or flaw carries a plain explanation for the person
// reviewing it: what the flag means, what to look for in the record, and the
// question to answer. The explanation describes the record. It never describes
// the writer, and it is not a decision.
//
// CANDIDATE-INTERNAL VOCABULARY. The five explanation categories and the table
// below that assigns engine keys and flaw types to them are a review aid for
// this candidate only. They are NOT a mapping to the JRS Codebook. Under
// docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md (owner
// decisions D-2 and D-3) the Codebook is the methodological authority, only
// basis_identification has an exact Codebook correspondence, and
// cold_reviewer_clarity has no established correspondence. Nothing here
// changes that, so cold_reviewer_clarity is deliberately given no category.

export const EXPLANATION_SET_VERSION = 'explanations/0.1.0';
export const CODEBOOK_CORRESPONDENCE = 'not_asserted';

export const CATEGORIES = {
  missing_logical_bridge: {
    label: 'Missing logical bridge',
    meaning: 'The record states facts and a conclusion, but not the step that connects them.',
    look_for: 'A sentence that says why the stated facts lead to the conclusion reached.',
    question: 'Could a later reader explain, from the record alone, how the facts led to the conclusion?',
  },
  missing_identifiable_basis: {
    label: 'Missing identifiable basis',
    meaning: 'A conclusion is stated, but the record does not identify what it rests on.',
    look_for: 'The document, observation, rule or fact the conclusion relies on, named in the record.',
    question: 'Can the basis for this conclusion be pointed to in the record itself?',
  },
  chronology_gap: {
    label: 'Chronology gap',
    meaning: 'The order or timing of events cannot be rebuilt from the dates the record gives.',
    look_for: 'A date or interval for each step, and steps given in an order that matches those dates.',
    question: 'Could a later reader put every step in order, with dates, from the record alone?',
  },
  unsupported_conclusion: {
    label: 'Unsupported conclusion',
    meaning: 'The record asserts something that goes beyond what its own content shows.',
    look_for: 'Material in the record that shows the asserted point, not only a statement that it is so.',
    question: 'Does anything in the record show this point, or is it only asserted?',
  },
  insufficient_evidence: {
    label: 'Insufficient evidence',
    meaning: 'Some evidence is recorded, but not enough to carry the conclusion reached.',
    look_for: 'Whether the recorded evidence covers each part of the conclusion, or only some of it.',
    question: 'Would the recorded evidence, on its own, be enough for a later reader to accept this conclusion?',
  },
};

// Engine condition keys, as this candidate's prompt defines them.
export const CONDITION_CATEGORY = {
  basis_identification: 'missing_identifiable_basis',
  reasoning_traceability: 'missing_logical_bridge',
  temporal_reconstructability: 'chronology_gap',
  accountability_support: 'insufficient_evidence',
  cold_reviewer_clarity: null,
};

export const FLAW_CATEGORY = {
  reasoning_elision: 'missing_logical_bridge',
  evidentiary_overreach: 'unsupported_conclusion',
  chronology_collapse: 'chronology_gap',
  unsupported_content: 'unsupported_conclusion',
  extraction_omission: null,
  truncation: null,
};

// Flags with no category get their own text, so every flag is explained.
const UNCATEGORISED = {
  cold_reviewer_clarity: {
    label: 'Reviewer reconstruction (candidate-internal)',
    meaning: 'The model judged that a reader with no prior knowledge might not be able to reconstruct the basis from the record alone. This key has no established Codebook correspondence.',
    look_for: 'Terms, references or context the record assumes a reader already has.',
    question: 'Would a reader new to this matter need anything not in the record to follow it?',
  },
  extraction_omission: {
    label: 'Content left out',
    meaning: 'The model reported that something the record refers to, or needs, is not present in it.',
    look_for: 'The referenced item, or the missing element, in the record.',
    question: 'Is the referenced or needed material actually present in the record?',
  },
  truncation: {
    label: 'Record appears cut short',
    meaning: 'The model reported that part of the record seems to be missing.',
    look_for: 'Whether the record reaches its end, and whether every section it starts is complete.',
    question: 'Is this the complete record?',
  },
};

// Deterministic findings from source preparation and from output checks.
const EXTRACTION = {
  placeholder: ['Placeholder left in the record', 'The record contains a placeholder where content was meant to go.', 'Is the placeholder meant to be filled before the record is complete?'],
  referenced_material_not_in_record: ['Referenced material not in the record', 'The record points to an attachment, exhibit or appendix that is not part of the text examined.', 'Is the referenced material part of the record a later reader will have?'],
  profile_element_not_found: ['Expected element not found', 'A supplier-access exception record usually states this element, and no match was found. This is a pattern check, not proof of omission.', 'Does the record state this element in words the check did not recognise, or is it absent?'],
  off_record_reference: ['Reference to something off the record', 'The record relies on a conversation, call or agreement that is not itself recorded.', 'Is what was said or agreed written down anywhere a later reader can see?'],
  assertion_without_basis: ['Assertion presented as self-evident', 'The record uses wording that presents a point as obvious instead of showing its basis.', 'Is the basis for this point shown in the record?'],
  pages_missing: ['Pages missing', 'The record numbers its pages and the last page present is not the last page.', 'Where are the remaining pages?'],
  ends_mid_sentence: ['Record ends mid-sentence', 'The text stops without closing its last sentence.', 'Is this the complete record?'],
  ends_with_ellipsis: ['Record ends with an ellipsis', 'The text ends with "...", which usually marks text left out.', 'Is this the complete record?'],
  explicit_truncation_marker: ['Record marked as cut or continued', 'The text says it is truncated or continued elsewhere.', 'Where is the rest of the record?'],
  unclosed_quotation: ['Quotation not closed', 'A quotation opens and never closes, which usually means text was cut.', 'Is the quoted passage complete?'],
  instruction_like_text: ['Instruction-like text inside the record', 'The record contains text that reads as an instruction to an automated reviewer. It was treated as record content, not followed.', 'Is this text genuinely part of the record, and does it change how the record should be read?'],
  adapter_output_rejected: ['Model output rejected at the adapter boundary', 'The model output did not meet the adapter contract, so none of it was used and the review is incomplete.', 'No action on the record. The review must be run again or done by a person.'],
  excerpt_not_in_record: ['Model quotation not found in the record', 'The model quoted words that do not appear in the record, so its finding was not shown.', 'No action on the record. This is a check on the model output.'],
  rejected_flaw_type: ['Model used a finding type outside the permitted list', 'The finding was not shown.', 'No action on the record. This is a check on the model output.'],
  withheld_prohibited_inference: ['Model text withheld', 'The model described a person rather than the record, so that text was withheld.', 'No action on the record. This is a check on the model output.'],
};

function pack(category, text) {
  return { category: category, label: text.label, meaning: text.meaning, look_for: text.look_for, question: text.question,
           codebook_correspondence: CODEBOOK_CORRESPONDENCE, set_version: EXPLANATION_SET_VERSION };
}

export function explainCondition(key) {
  var cat = CONDITION_CATEGORY[key];
  if (cat) return pack(cat, CATEGORIES[cat]);
  if (UNCATEGORISED[key]) return pack(null, UNCATEGORISED[key]);
  return null;
}

export function explainFlaw(type) {
  var cat = FLAW_CATEGORY[type];
  if (cat) return pack(cat, CATEGORIES[cat]);
  if (UNCATEGORISED[type]) return pack(null, UNCATEGORISED[type]);
  return null;
}

export function explainExtraction(code) {
  var e = EXTRACTION[code];
  if (!e) return null;
  return { category: null, label: e[0], meaning: e[1], look_for: null, question: e[2],
           codebook_correspondence: CODEBOOK_CORRESPONDENCE, set_version: EXPLANATION_SET_VERSION };
}

export function allExplanationTexts() {
  var out = [];
  Object.values(CATEGORIES).concat(Object.values(UNCATEGORISED)).forEach(function (t) { out.push(t.label, t.meaning, t.look_for, t.question); });
  Object.values(EXTRACTION).forEach(function (e) { out.push(e[0], e[1], e[2]); });
  return out;
}
