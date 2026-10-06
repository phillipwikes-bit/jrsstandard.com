// Candidate vocabulary boundary (PR #39 source-alignment repair, 2026-10-06).
// The five engine keys are candidate-internal review prompts, not JRS Codebook conditions.
// Owner decisions D-2 and D-3 (docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md):
// cold_reviewer_clarity is not a JRS condition, the non-exact pairs are unresolved, and no
// versioned Engine-to-Codebook correspondence record exists. This test fails if the candidate
// claims otherwise. It declares the gap; it does not resolve it.
//
// Each check can be run against altered text through checkVocabulary(), which the self-test
// at the bottom uses to show that every check fires on a broken copy.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT } from './_harness.mjs';
import { SYSTEM_PROMPT, CONDITION_KEYS } from '../../lib/engine-candidate/review-candidate.js';
import { CONDITION_CATEGORY, FLAW_CATEGORY, CATEGORIES, CODEBOOK_CORRESPONDENCE, CODEBOOK_CORRESPONDENCE_RECORD,
         EXPLICITLY_UNMAPPED_KEYS, explainCondition } from '../../lib/engine-candidate/explanations.js';

// The five JRS Codebook condition names, as the correspondence review lists them.
export const CODEBOOK_NAMES = ['Basis Identification', 'Reconstructability', 'Chronology', 'Decision-Process Traceability', 'Evidentiary Sufficiency'];
// The only candidate-internal category table this test accepts. Changing it is a documented decision, not a drift.
export const DOCUMENTED_CONDITION_CATEGORY = {
  basis_identification: 'missing_identifiable_basis', reasoning_traceability: 'missing_logical_bridge',
  temporal_reconstructability: 'chronology_gap', accountability_support: null, cold_reviewer_clarity: null,
};

const CAND = join(ROOT, 'lib/engine-candidate');
const candidateFiles = () => readdirSync(CAND).filter((f) => /\.(js|md)$/.test(f)).map((f) => ({ name: f, text: readFileSync(join(CAND, f), 'utf8') }));

// Lines that name the keys as JRS or Codebook conditions, or pair a key with a Codebook condition name,
// unless the same line negates the pairing ("not", "no established", "unmapped", "removed", "no longer").
const NEGATED = /\b(not|no established|no correspondence|unmapped|removed|no longer|never|unresolved|not established|declared)\b/i;
export function mappingClaims(name, text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    const where = name + ':' + (i + 1);
    if (/\b(five|5)\s+JRS\b[^.\n]*\bconditions?\b/i.test(line) || /\bJRS (documentation )?review conditions?\b/i.test(line)) {
      if (!NEGATED.test(line)) out.push([where, 'keys called JRS conditions']);
    }
    for (const key of CONDITION_KEYS) {
      if (!line.includes(key)) continue;
      for (const n of CODEBOOK_NAMES) {
        // Whole names only: temporal_reconstructability and chronology_gap are not the Codebook names.
        const re = new RegExp('(?<![\\w-])' + n.replace(/-/g, '\\-') + '(?![\\w-])', 'i');
        if (re.test(line) && !NEGATED.test(line)) out.push([where, key + ' paired with ' + n]);
      }
      if (/\b(maps? to|mapped to|corresponds? to|equivalent to|is the JRS)\b/i.test(line) && /\b(JRS|Codebook)\b/.test(line) && !NEGATED.test(line)) out.push([where, key + ' asserted as a Codebook mapping']);
    }
  });
  return out;
}

export function checkVocabulary({ prompt, files, conditionCategory, unmapped, record, correspondence, accExplanation, crcExplanation }) {
  const r = {};
  // 1. The prompt does not call the keys JRS conditions.
  r.prompt_not_jrs_conditions = !/\bJRS (documentation |review )?(review )?conditions?\b/i.test(prompt.replace(/no established correspondence to any JRS condition/g, '').replace(/not the JRS Codebook conditions/g, ''))
    && /not the JRS Codebook conditions/.test(prompt) && /candidate review keys/.test(prompt);
  // 2. cold_reviewer_clarity is explicitly unmapped.
  r.crc_unmapped = conditionCategory.cold_reviewer_clarity === null && unmapped.includes('cold_reviewer_clarity')
    && crcExplanation.category === null && /no established Codebook correspondence/.test(crcExplanation.meaning)
    && /cold_reviewer_clarity and accountability_support have no established correspondence/.test(prompt);
  // 3. accountability_support is not an Evidentiary Sufficiency mapping, in the table, the explanation or the prompt.
  const accLine = (prompt.split('\n').find((l) => l.includes('accountability_support:')) || '');
  r.acc_not_evidentiary_sufficiency = conditionCategory.accountability_support === null && unmapped.includes('accountability_support')
    && accExplanation.category === null && !/evidence[^.]*sufficient|sufficien\w* evidence|evidentiary sufficiency/i.test(accLine + accExplanation.meaning);
  // 4. No new undocumented Engine-to-Codebook mapping.
  const claims = files.flatMap((f) => mappingClaims(f.name, f.text));
  r.no_undocumented_mapping = record === null && correspondence === 'not_asserted'
    && JSON.stringify(conditionCategory) === JSON.stringify(DOCUMENTED_CONDITION_CATEGORY) && claims.length === 0;
  r.claims = claims;
  return r;
}

// Run as a suite only when invoked directly, so a probe can import checkVocabulary.
if (import.meta.url === `file://${process.argv[1]}`) {
  const live = {
    prompt: SYSTEM_PROMPT, files: candidateFiles(), conditionCategory: CONDITION_CATEGORY, unmapped: EXPLICITLY_UNMAPPED_KEYS,
    record: CODEBOOK_CORRESPONDENCE_RECORD, correspondence: CODEBOOK_CORRESPONDENCE,
    accExplanation: explainCondition('accountability_support'), crcExplanation: explainCondition('cold_reviewer_clarity'),
  };
  const res = checkVocabulary(live);
  t('the prompt does not call the five keys JRS conditions, and says they are candidate keys', res.prompt_not_jrs_conditions);
  t('cold_reviewer_clarity is explicitly unmapped (D-2)', res.crc_unmapped);
  t('accountability_support is not represented as an Evidentiary Sufficiency mapping (D-3)', res.acc_not_evidentiary_sufficiency);
  t('no undocumented Engine-to-Codebook mapping in the tables or the candidate files', res.no_undocumented_mapping, res.claims.map((c) => c.join(' ')).join('; '));
  t('the correspondence gap is declared: no versioned correspondence record exists', CODEBOOK_CORRESPONDENCE_RECORD === null);
  t('no explanation category is named after a Codebook condition', Object.values(CATEGORIES).every((c) => !CODEBOOK_NAMES.some((n) => c.label.toLowerCase() === n.toLowerCase())));
  t('every flaw type still has a category or its own explanation', Object.keys(FLAW_CATEGORY).length === 6);

  // ---- self-test: every check fires on a broken copy -------------------------------------------
  const broken = (patch) => checkVocabulary({ ...live, ...patch });
  t('fires: the old prompt wording "five JRS documentation review conditions"',
    !broken({ prompt: SYSTEM_PROMPT.replace(/^[^\n]*/, 'You examine one draft against five JRS documentation review conditions:') }).prompt_not_jrs_conditions);
  t('fires: cold_reviewer_clarity given a category', !broken({ conditionCategory: { ...CONDITION_CATEGORY, cold_reviewer_clarity: 'insufficient_evidence' } }).crc_unmapped);
  t('fires: cold_reviewer_clarity dropped from the unmapped list', !broken({ unmapped: ['accountability_support'] }).crc_unmapped);
  t('fires: accountability_support given the insufficient_evidence category', !broken({ conditionCategory: { ...CONDITION_CATEGORY, accountability_support: 'insufficient_evidence' } }).acc_not_evidentiary_sufficiency);
  t('fires: the old Evidentiary Sufficiency question restored to the prompt',
    !broken({ prompt: SYSTEM_PROMPT.replace(/accountability_support:[^\n]*/, 'accountability_support: Is the evidence in the record sufficient to support the conclusion?') }).acc_not_evidentiary_sufficiency);
  t('fires: a correspondence record asserted without documentation', !broken({ record: { reasoning_traceability: 'Reconstructability' } }).no_undocumented_mapping);
  t('fires: a new pairing in the category table', !broken({ conditionCategory: { ...CONDITION_CATEGORY, reasoning_traceability: 'chronology_gap' } }).no_undocumented_mapping);
  t('fires: a candidate file that pairs a key with a Codebook condition',
    !broken({ files: live.files.concat([{ name: 'X.md', text: 'reasoning_traceability is the Reconstructability condition.' }]) }).no_undocumented_mapping);
  t('fires: a candidate file that says a key maps to a JRS condition',
    !broken({ files: live.files.concat([{ name: 'X.js', text: '// accountability_support maps to the JRS Decision-Process condition' }]) }).no_undocumented_mapping);
  t('allows: a negated statement in a candidate file',
    broken({ files: live.files.concat([{ name: 'X.md', text: 'accountability_support has no established correspondence to Evidentiary Sufficiency.' }]) }).no_undocumented_mapping);
  done();
}
