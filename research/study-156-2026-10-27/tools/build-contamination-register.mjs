// 156-record study: contamination and exposure register, one row per record plus study-wide disclosures.
// Facts come from the inventory's prior-exposure fields and from this study's own development record.
// Usage: node tools/build-contamination-register.mjs   (writes registers/CONTAMINATION_REGISTER.json; refuses to overwrite)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(PKG, 'registers', 'CONTAMINATION_REGISTER.json');
if (existsSync(OUT)) { console.error(OUT + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const isDev = (e) => (e.cohort === 'synthetic_record' && e.partition === 'development') || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED');
const rows = inv.entries.map((e) => {
  const pe = e.prior_exposure || {};
  const syn = e.cohort === 'synthetic_record', orig = e.cohort === 'original_study_record', pub = e.cohort === 'public_case';
  const dev = isDev(e), eligible = e.full_text_available && e.scope_class === 'NOT_EXCLUDED';
  return { source_id: e.source_id, cohort: e.cohort, partition: syn ? e.partition : orig ? (dev ? 'development' : 'outside_research_scope') : 'not_held',
    authored_by_developer: syn ? 'yes: written by the developer, who also wrote the research rules' : orig ? 'NOT ESTABLISHED (corpus construction log NOT ESTABLISHED)' : 'no (public body)',
    developer_knowledge_before_freeze: syn ? (dev ? 'full: authored and inspected during rule development' : 'full: authored; not inspected or compiled during rule development') : orig ? 'read in full during planning' : 'metadata only; text not held',
    rules_tuned_on_this_record: dev ? 'yes (development partition)' : syn ? 'no; see disclosure D13 (identifier prefixes recalled from evaluation records, removed before any scored run)' : 'no',
    variant_generator_tuned_on_this_record: dev ? 'yes (dry checks on development records)' : eligible ? 'no; patterns tuned on development records were applied unchanged' : 'no variants built',
    engine_runs_before_freeze: dev ? 'yes: development runs, variant runs, mutation tests' : eligible ? 'no compile; rule-aligned mock generation ran research-profile functions on its text (outputs written, not inspected)'
      : orig ? 'none in this package before the freeze; earlier sessions NOT ESTABLISHED' : 'none (text not held)',
    mock_circularity: eligible ? 'ORACLE mocks are told this record’s reference label; -R mocks choose quotations with the rules under test' : 'no mocks',
    public_web: pe.public_web === true ? 'yes' : pe.public_web === false ? 'no' : 'NOT ESTABLISHED',
    study_participants: pe.study_participants || (pub ? 'NOT ESTABLISHED' : 'none'),
    llm_raters: pe.llm_raters || (orig ? 'NOT ESTABLISHED' : 'none'),
    model_training_exposure: orig || pub ? 'NOT ESTABLISHED (public text; unknown whether any model was trained on it)' : 'none known (never published)',
    development_reviewer_exposure: syn ? 'none recorded; first exposure is the blinded form (package untracked and not pushed)' : orig ? 'NOT ESTABLISHED' : 'NOT ESTABLISHED',
    consequence: dev ? 'conformance evidence only' : syn ? 'conformance check by the same author; not a holdout' : orig ? 'not scored substantively (scope decision SC-1)' : 'not run (text not held)' };
});
const disclosures = [
  { id: 'CD-01', what: 'One developer wrote the 100 synthetic records, the research rules, the mock policies, the variant generator and the scoring.', effect: 'No partition is a holdout. Evaluation results are a conformance check of the rules against their author’s own construction intent.' },
  { id: 'CD-02', what: 'D13: an identifier-prefix list was written partly from memory of evaluation records (WO, INC from F05 and F08).', effect: 'Removed before any scored run and replaced by a general rule. The remaining lexicons were still written by the author of the evaluation records.' },
  { id: 'CD-03', what: 'The rule-aligned mock generator ran research-profile functions (sentenceUnits, researchEvents) on evaluation texts while building mocks before the freeze.', effect: 'Outputs were written to mock files and not inspected. No rule changed after that generation. Aggregate counts of changed mock files (M5) were seen.' },
  { id: 'CD-04', what: 'ORACLE mocks are told each record’s reference label; ORACLE-R and OVERCLAIM-R quote with the rules under test.', effect: 'Mock-arm agreement is partly circular. It shows what the rules do with a given proposal; it says nothing about how a model would propose.' },
  { id: 'CD-05', what: 'The variant generator’s decision patterns were adjusted after dry checks on development records.', effect: 'Evaluation variants use patterns tuned on development texts; constructibility on evaluation records was seen only as counts.' },
  { id: 'CD-06', what: 'The 24 originals are public, were shown to earlier study participants, and were read by three LLM raters and by the developer.', effect: 'Prior exposure is high; the originals cannot serve as unseen material.' },
  { id: 'CD-07', what: 'Variant expected relations and mock fixes M4 and M5 were set after development-partition variant runs (vdev-1 to vdev-3).', effect: 'Disclosed in DEVELOPMENT_LOG.md; evaluation-partition variants were not run before the freeze.' },
  { id: 'CD-08', what: 'No human has reviewed any reference label used in scoring.', effect: 'Every agreement figure is against an AI-authored or LLM-reproduced reference.' },
];
writeFileSync(OUT, JSON.stringify({ format: 'jrs-study-156-contamination-register/1.0.0', built_at_utc: new Date().toISOString(), holdout_claim: 'NONE. No partition supports a holdout claim.', disclosures, rows }, null, 2) + '\n', { flag: 'wx' });
console.log('rows', rows.length, 'disclosures', disclosures.length);
