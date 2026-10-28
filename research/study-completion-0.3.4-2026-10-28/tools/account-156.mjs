// Study completion: machine-generated accounting of all 156 study records, from the frozen inventory, label register,
// exposure register, blind key and the raw rows of the scored offline runs (study run-1 on 0.3.3; 0.3.4 run-1).
// Writes accounting/ACCOUNTING_156.json and .md. Every count in the .md is computed here. Exits 1 if any check fails.
// Usage: node tools/account-156.mjs
import { attempts } from './guard.mjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, STUDY, PKG4, STATUS, readJson, checker, finish, writeJson, writeOut } from './common.mjs';

const c = checker();
const inv = readJson(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json'));
const labels = new Map(readJson(join(PKG4, 'registers', 'LABEL_STATUS_REGISTER.json')).rows.map((r) => [r.source_id, r]));
const exposure = new Map(readJson(join(PKG4, 'registers', 'EXPOSURE_REGISTER.json')).rows.map((r) => [r.source_id, r]));
const blind = new Map(readJson(join(STUDY, 'sealed', 'BLIND_KEY.json')).rows.map((r) => [r.source_id, r]));
const run4 = readJson(join(PKG4, 'out', 'run-1', 'RESULTS.json'));
const run3 = readJson(join(STUDY, 'out', 'run-1', 'RESULTS.json'));
const liveSetPath = join(DIR, 'records', 'LIVE_RECORD_SET.json');
const liveSet = existsSync(liveSetPath) ? readJson(liveSetPath) : null;

// Candidate arms whose disposition says whether the three basis conditions were all assessed. The study's five arms
// (A3, A4, A5, A3R, A4R) define depth for both versions, as in the study's and 0.3.4's own analyses; ADV is reported apart.
const CAND_ARMS = ['A3', 'A4', 'A5', 'A3R', 'A4R'];
const byRec = (rows) => { const m = new Map(); for (const r of rows) { if (!m.has(r.id)) m.set(r.id, {}); m.get(r.id)[r.arm] = r.disposition; } return m; };
const d4 = byRec(run4.rows), d3 = byRec(run3.rows);
const depth = (d, arms) => { const v = arms.map((a) => d[a]).filter(Boolean); if (!v.length) return 'no_candidate_arm';
  if (v.every((x) => x === 'substantive_mock')) return 'substantive_in_every_candidate_arm'; if (v.some((x) => x === 'partial')) return 'partial_in_at_least_one_candidate_arm'; return 'other:' + [...new Set(v)].join('+'); };

const rows = inv.entries.map((e) => {
  const eligible = e.full_text_available && e.scope_class === 'NOT_EXCLUDED';
  const category = eligible ? 'eligible_text_held_in_scope' : e.full_text_available ? 'outside_research_scope_refused' : 'public_case_text_not_held';
  const l = labels.get(e.source_id) || {}, x = exposure.get(e.source_id) || {}, b = blind.get(e.source_id) || {};
  const liveReqs = liveSet ? liveSet.requests.filter((q) => q.base_record_id === e.source_id) : [];
  return { source_id: e.source_id, blind_id: b.blind_id || null, form_part: b.part || null, cohort: e.cohort, partition: e.partition || null, scope_class: e.scope_class, scope_domain: e.scope_domain || null,
    full_text_available: !!e.full_text_available, text_sha256: e.extracted_text_sha256 || null, category,
    reference: { value: l.reference_value || null, provenance: l.status || null, human_reviewed: !!l.human_reviewed, human_label: l.human_label || null },
    exposure_for_0_3_4: x.exposure_for_0_3_4 || null,
    offline_0_3_3_study_run_1: { dispositions: d3.get(e.source_id) || {}, depth: eligible ? depth(d3.get(e.source_id) || {}, CAND_ARMS) : null },
    offline_0_3_4_run_1: { dispositions: d4.get(e.source_id) || {}, depth: eligible ? depth(d4.get(e.source_id) || {}, CAND_ARMS) : null, depth_adv: eligible ? depth(d4.get(e.source_id) || {}, ['ADV']) : null },
    live: { eligible, planned_requests: liveReqs.length, phases: [...new Set(liveReqs.map((q) => q.phase))] } };
});

const n = (f) => rows.filter(f).length;
const cats = Object.fromEntries(['eligible_text_held_in_scope', 'outside_research_scope_refused', 'public_case_text_not_held'].map((k) => [k, n((r) => r.category === k)]));
const elig = rows.filter((r) => r.live.eligible);
c.check('total_156', rows.length === 156, rows.length);
c.check('categories_sum_to_156', Object.values(cats).reduce((a, b) => a + b, 0) === 156, cats);
c.check('eligible_104_is_100_synthetic_plus_4_originals', elig.length === 104 && n((r) => r.live.eligible && r.cohort === 'synthetic_record') === 100 && n((r) => r.live.eligible && r.cohort === 'original_study_record') === 4);
c.check('outside_scope_20_are_originals', cats.outside_research_scope_refused === 20 && rows.filter((r) => r.category === 'outside_research_scope_refused').every((r) => r.cohort === 'original_study_record'));
c.check('public_32_not_held', cats.public_case_text_not_held === 32 && rows.filter((r) => r.category === 'public_case_text_not_held').every((r) => r.cohort === 'public_case' && !r.full_text_available));
// Excluded domains stay excluded: every research-arm row of the 20 is a correct refusal or not run; none is assessed.
const RESEARCH_ARMS = ['A2', 'A3', 'A4', 'A5', 'A3R', 'A4R', 'ADV'];
const outside = rows.filter((r) => r.category === 'outside_research_scope_refused');
const outsideBad = outside.filter((r) => RESEARCH_ARMS.some((a) => r.offline_0_3_4_run_1.dispositions[a] && !/^(?:correct_refusal|not_run:)/.test(r.offline_0_3_4_run_1.dispositions[a])));
c.check('outside_scope_never_assessed_in_0.3.4_run_1', outsideBad.length === 0, outsideBad.map((r) => r.source_id));
const pubBad = rows.filter((r) => r.category === 'public_case_text_not_held' && Object.values(r.offline_0_3_4_run_1.dispositions).some((v) => v !== 'not_run:source_text_not_held'));
c.check('public_cases_never_run', pubBad.length === 0, pubBad.map((r) => r.source_id));
c.check('all_eligible_exposed_development', elig.every((r) => r.exposure_for_0_3_4 === 'exposed_development'), elig.filter((r) => r.exposure_for_0_3_4 !== 'exposed_development').map((r) => r.source_id));
c.check('no_human_label_recorded', rows.every((r) => !r.reference.human_reviewed));
if (liveSet) {
  c.check('live_set_uses_only_eligible_records', liveSet.requests.every((q) => elig.some((r) => r.source_id === q.base_record_id)), null);
  c.check('live_set_covers_every_eligible_record', elig.every((r) => r.live.planned_requests > 0), elig.filter((r) => !r.live.planned_requests).map((r) => r.source_id));
}
const depthCounts = (key) => { const o = {}; for (const r of elig) { const k = r[key].depth; o[k] = (o[k] || 0) + 1; } return o; };
const dep4 = depthCounts('offline_0_3_4_run_1'), dep3 = depthCounts('offline_0_3_3_study_run_1');
const depAdv = {}; for (const r of elig) { const k = r.offline_0_3_4_run_1.depth_adv; depAdv[k] = (depAdv[k] || 0) + 1; }
c.check('depth_matches_study_accounting_71_33', dep3.substantive_in_every_candidate_arm === 71 && dep3.partial_in_at_least_one_candidate_arm === 33, dep3);
c.check('depth_matches_0.3.4_analysis_51_53', dep4.substantive_in_every_candidate_arm === 51 && dep4.partial_in_at_least_one_candidate_arm === 53, dep4);
const refCounts = { UNGROUNDED: n((r) => r.live.eligible && r.reference.value === 'UNGROUNDED'), GROUNDED: n((r) => r.live.eligible && r.reference.value === 'GROUNDED') };
c.check('eligible_references_42_ungrounded_62_grounded', refCounts.UNGROUNDED === 42 && refCounts.GROUNDED === 62, refCounts);

const out = { format: 'jrs-study-completion-accounting/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Accounting of all 156 records. "Substantive" means all three basis conditions were assessed in a scripted offline compile; it is not a model result. Every eligible record is exposed development material: none is a holdout.',
  categories: cats, eligible_by_cohort: { synthetic_record: n((r) => r.live.eligible && r.cohort === 'synthetic_record'), original_study_record: n((r) => r.live.eligible && r.cohort === 'original_study_record') },
  eligible_reference_counts_ai_proposed: refCounts, offline_depth_0_3_4_run_1: dep4, offline_depth_0_3_4_run_1_adv_arm: depAdv, offline_depth_0_3_3_study_run_1: dep3, depth_arms: CAND_ARMS,
  live_population: liveSet ? { records: elig.length, requests: liveSet.requests.length, by_phase: liveSet.by_phase } : { records: elig.length, requests: null, note: 'records/LIVE_RECORD_SET.json not built yet' },
  checks: c.checks, rows };
writeJson(join(DIR, 'accounting', 'ACCOUNTING_156.json'), out);

const md = ['# Accounting of the 156 study records', '', 'Generated by `tools/account-156.mjs` from the frozen inventory, registers and raw run rows. Do not edit by hand.', '',
  '| Category | Records | Live study |', '|---|---|---|',
  '| Text held, inside the research scope (100 synthetic, 4 originals) | ' + cats.eligible_text_held_in_scope + ' | Eligible: the live population |',
  '| Originals outside the research scope (excluded or ambiguous domain) | ' + cats.outside_research_scope_refused + ' | Not eligible; stay excluded; refused in every offline run |',
  '| Public cases (text not held in the repository) | ' + cats.public_case_text_not_held + ' | Not eligible; not retrieved (needs specific authorization and a rights and privacy disposition) |',
  '| **Total** | **' + rows.length + '** | |', '',
  '**References for the 104 eligible records are AI-proposed** (' + refCounts.UNGROUNDED + ' UNGROUNDED, ' + refCounts.GROUNDED + ' GROUNDED). No human label is recorded for any record. All 104 are exposed development material, so none can serve as a holdout.', '',
  '## Offline review depth (scripted candidates, not model output)', '',
  '| Run | Substantive in every candidate arm | Partial in at least one candidate arm | Other |', '|---|---|---|---|',
  '| Study run-1 on 0.3.3 (arms A3, A4, A5, A3R, A4R) | ' + (dep3.substantive_in_every_candidate_arm || 0) + ' | ' + (dep3.partial_in_at_least_one_candidate_arm || 0) + ' | ' + (elig.length - (dep3.substantive_in_every_candidate_arm || 0) - (dep3.partial_in_at_least_one_candidate_arm || 0)) + ' |',
  '| 0.3.4 run-1 (same five arms) | ' + (dep4.substantive_in_every_candidate_arm || 0) + ' | ' + (dep4.partial_in_at_least_one_candidate_arm || 0) + ' | ' + (elig.length - (dep4.substantive_in_every_candidate_arm || 0) - (dep4.partial_in_at_least_one_candidate_arm || 0)) + ' |',
  '| 0.3.4 run-1, adversarial citer ADV alone | ' + (depAdv.substantive_in_every_candidate_arm || 0) + ' | ' + (depAdv.partial_in_at_least_one_candidate_arm || 0) + ' | ' + (elig.length - (depAdv.substantive_in_every_candidate_arm || 0) - (depAdv.partial_in_at_least_one_candidate_arm || 0)) + ' |', '',
  'More partial rows under 0.3.4 is expected from its repairs (it withholds support it cannot verify); it is not a measure of model behaviour.', '',
  '## Live study population', '',
  liveSet ? '- ' + elig.length + ' eligible records; ' + liveSet.requests.length + ' planned requests (' + Object.entries(liveSet.by_phase).map(([k, v]) => k + ' ' + v).join(', ') + '). Constructed texts in the targeted phase are derived from eligible records, not new records.' : '- 104 eligible records; request set not built yet.',
  '- No live request has been sent. Whether any record "received substantive review" by a real model is **not established** until an authorized run is scored.', '',
  '## Checks', '', ...c.checks.map((x) => '- ' + (x.ok ? 'PASS' : '**FAIL**') + ' `' + x.id + '`'), ''];
writeOut(join(DIR, 'accounting', 'ACCOUNTING_156.md'), md.join('\n'));
finish('156 accounting', c, 'eligible ' + elig.length + '; substantive in every candidate arm (scripted): 0.3.3 ' + dep3.substantive_in_every_candidate_arm + ', 0.3.4 ' + dep4.substantive_in_every_candidate_arm);
