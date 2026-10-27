// 156-record study: inventory version 2. Version 1 (sealed) is copied unchanged except that each of the
// 100 MISSING synthetic slots is replaced by its disclosed replacement record from the sealed construction
// register. Writes registers/RECORD_INVENTORY_V2.json and registers/RECORD_INVENTORY.md.
// Usage: node tools/build-inventory-v2.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifySeals } from './verify-seal.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const seal = verifySeals(['corpus']);
if (!seal.ok) { console.error('corpus seal does not verify', seal.problems); process.exit(3); }
const OUT = join(PKG, 'registers', 'RECORD_INVENTORY_V2.json');
if (existsSync(OUT)) { console.error('inventory v2 exists'); process.exit(2); }
mkdirSync(join(PKG, 'registers'), { recursive: true });
const v1 = JSON.parse(readFileSync(join(PKG, 'inventory', 'RECORD_INVENTORY_V1.json'), 'utf8'));
const reg = JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
const byId = Object.fromEntries(reg.records.map((r) => [r.id, r]));

const entries = v1.entries.map((e) => {
  if (e.cohort !== 'synthetic_record') return e;
  const r = byId[e.source_id];
  const path = 'records/synthetic/' + r.id + '.txt';
  const text = readFileSync(join(PKG, path), 'utf8');
  if (sha(Buffer.from(text, 'utf8')) !== r.text_sha256) throw new Error('text hash mismatch ' + r.id);
  return {
    study_id: e.study_id, cohort: 'synthetic_record', source_id: r.id, status: 'REPLACEMENT_CREATED_DISCLOSED',
    replaces: 'Slot ' + e.source_id + ', MISSING in inventory v1',
    original_source: { path: 'research/study-156-2026-10-27/' + path, spec_locator: 'tools/synthetic-spec.mjs ' + r.family + '.' + r.type, construction_register: 'records/synthetic/CONSTRUCTION_REGISTER.json' },
    full_text_available: true, extracted_text_path: 'research/study-156-2026-10-27/' + path, extracted_text_sha256: r.text_sha256,
    document_type: text.split('. ')[0], source_domain_label: r.context, language: 'en', length: r.length,
    extraction_limits: 'Constructed record. Every document, ticket, minute and log it cites is fictional and cannot be inspected.',
    permission_and_confidentiality: { classification: 'Constructed; no third-party content; never published.', rights: 'NOT ESTABLISHED. AI-assisted authorship is provenance only (CLAUDE.md Rule 7); no ownership conclusion is drawn.', personal_data: 'None. No real person is named.' },
    reference_findings: [{ kind: 'designed_construction_label', value: r.designed.e1, targeted_question: r.designed.q1 || r.designed.q2 || r.designed.q3 || r.designed.q4 || null,
      provenance: 'AI-authored construction intent (type ' + r.type + '). Not a human reference finding; requires the development reviewer\'s blinded review.', human_review: 'NOT ESTABLISHED' }],
    prior_exposure: { public_web: false, study_participants: 'none', developer: 'Authored by the developer, who also builds the research profile.', engine_or_model_runs: 'none before the corpus seal' },
    links: { family: r.family, type: r.type, same_family_dependent: r.links.same_family_dependent, same_type_template: r.links.same_type_template, near_duplicates_ge_0_5: r.links.near_duplicates_ge_0_5 },
    scope_class: r.pre_seal_lexical_observation.excluded_domain_pattern_matches.length ? 'AMBIGUOUS' : 'NOT_EXCLUDED', scope_domain: null,
    scope_reason: 'Constructed outside the handoff excluded domains (' + r.context + ').',
    eligibility: {
      default_profile_refusal_test: 'ELIGIBLE',
      research_profile_substantive: 'ELIGIBLE (' + r.partition + ' partition)',
      evaluation_partition: r.partition === 'evaluation' ? 'ELIGIBLE as a developer-exposed evaluation partition record; not a holdout' : 'NOT ELIGIBLE: development partition',
    },
    partition: r.partition,
    missing_materials: ['Human reference finding (development reviewer, blinded form)'], remediation: ['Phillip completes the blinded reference form for the development partition; an independent author for any future holdout'],
  };
});
const runnable = entries.filter((e) => e.full_text_available);
const inv = Object.assign({}, v1, {
  version: 2, built_at_utc: new Date().toISOString(), supersedes: { file: 'inventory/RECORD_INVENTORY_V1.json', sealed_in: 'seals/corpus', change: '100 MISSING synthetic slots replaced by disclosed replacement records; every other entry unchanged' },
  purpose: 'Inventory after disclosed replacement of the missing synthetic slots, before any study code or Engine run.',
  totals: Object.assign({}, v1.totals, { full_text_held: runnable.length, missing_text: entries.length - runnable.length, synthetic_replacements_created: reg.records.length }),
  eligibility_summary: {
    research_profile_substantive_now: runnable.filter((e) => /^ELIGIBLE/.test(e.eligibility.research_profile_substantive)).map((e) => e.source_id),
    blocked_by_scope_decision_SC1: entries.filter((e) => e.cohort === 'original_study_record' && e.scope_class !== 'NOT_EXCLUDED').map((e) => e.source_id),
    not_runnable_text_missing: entries.filter((e) => !e.full_text_available).map((e) => e.source_id),
    evaluation_partition: entries.filter((e) => e.partition === 'evaluation').map((e) => e.source_id),
    development_partition: entries.filter((e) => e.partition === 'development' || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED')).map((e) => e.source_id),
  },
  entries,
});
writeFileSync(OUT, JSON.stringify(inv, null, 2) + '\n', { flag: 'wx' });

// Human-readable view.
const L = ['# Record Inventory (version 2)', '', '**' + inv.built_at_utc.slice(0, 10) + '. Built from the sealed corpus (seals/corpus). Offline.** Version 1 is sealed and unchanged. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.', '',
  '## Totals', '', '| Measure | Count |', '|---|---|',
  '| Study slots | ' + entries.length + ' |', '| Original study records (text held) | 24 |', '| Public cases (metadata only, text not held) | 32 |',
  '| Synthetic slots, MISSING before replacement | 100 |', '| Disclosed synthetic replacements created before the freeze | ' + reg.records.length + ' |',
  '| Records with text, runnable offline | ' + runnable.length + ' |', '| Eligible for substantive research-profile runs now | ' + inv.eligibility_summary.research_profile_substantive_now.length + ' (4 originals + 100 replacements) |',
  '| Blocked by owner scope decision SC-1 | ' + inv.eligibility_summary.blocked_by_scope_decision_SC1.length + ' originals |', '| Not runnable: text missing | ' + inv.eligibility_summary.not_runnable_text_missing.length + ' public cases |', '',
  '## Originals', '', '| ID | Domain label | Verified key (LLM raters) | Scope class | Research profile now | Template cue |', '|---|---|---|---|---|---|',
  ...entries.filter((e) => e.cohort === 'original_study_record').map((e) => '| ' + [e.source_id, e.source_domain_label, e.reference_findings[0].value, e.scope_class + (e.scope_domain ? ' (' + e.scope_domain + ')' : ''), /^ELIGIBLE/.test(e.eligibility.research_profile_substantive) ? 'eligible (development)' : 'blocked: SC-1', e.links.template_family.split(' ')[0]].join(' | ') + ' |'),
  '', '## Public cases', '', '| ID | Source type | JRS read (S.Y.) | Second reader | Scope class | Text |', '|---|---|---|---|---|---|',
  ...entries.filter((e) => e.cohort === 'public_case').map((e) => '| ' + [e.source_id, e.document_type, e.reference_findings[0].value, e.reference_findings[3].value, e.scope_class + ' (' + e.scope_domain + ')', 'not held'].join(' | ') + ' |'),
  '', '## Synthetic replacements', '', '| Family | Context | Partition | Records | Designed GROUNDED / UNGROUNDED |', '|---|---|---|---|---|',
  ...[...new Set(reg.records.map((r) => r.family))].map((f) => { const rs = reg.records.filter((r) => r.family === f); return '| ' + [f, rs[0].context, rs[0].partition, rs[0].id + ' to ' + rs[rs.length - 1].id, rs.filter((r) => r.designed.e1 === 'GROUNDED').length + ' / ' + rs.filter((r) => r.designed.e1 === 'UNGROUNDED').length].join(' | ') + ' |'; }),
  '', '## Findings recorded at inventory', '',
  '- **INV-F1 (surface cue).** All 12 grounded originals end with a sentence naming their basis, such as "rests on", "Supported by", "traceable to" or "Based on". None of the 12 ungrounded originals does. A detector keyed on that sentence alone would match the verified key on all 24. Agreement on the originals cannot separate that cue from documentation-quality detection.',
  '- **INV-F2 (matched pairs).** Seven pairs of originals share an opening phrase and contrast a grounded with an ungrounded version, for example R08 and R15. They are dependent observations.',
  '- **INV-F3 (scope).** 13 originals are in excluded domains, 7 are in classes the repository does not settle, and 4 are not excluded. All 32 public cases are court decisions, commission or advisory determinations, or programme audits: 18 EXCLUDED and 14 AMBIGUOUS.',
  '- **INV-F4 (labels).** The originals\' only reference is a binary key reproduced by three LLM instances. No human label and no condition-level reference exists. The public cases carry human documentation-quality reads, on a different scale.',
  '- **INV-F5 (exposure).** Every original is public and was read by earlier participants, LLM raters and the developer. No original can enter an evaluation partition.',
  '- **INV-F6 (missing synthetic set).** No 100-record study-type synthetic set existed. The replacements were written by the developer of the profile under test: developer-exposed, dependent by family and type, and not a holdout.', ''];
writeFileSync(join(PKG, 'registers', 'RECORD_INVENTORY.md'), L.join('\n'), { flag: 'wx' });
console.log(JSON.stringify({ totals: inv.totals, eligible_now: inv.eligibility_summary.research_profile_substantive_now.length, sc1: inv.eligibility_summary.blocked_by_scope_decision_SC1.length, missing: inv.eligibility_summary.not_runnable_text_missing.length }));
