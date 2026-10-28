// 0.3.4 repair package: CORRECTED ANALYSIS of the frozen 0.3.3 research candidate on evidence-removal variants (V5).
// Not an unchanged reproduction. The study's V5 results (out/vrun-1, frozen generator 1.0) stand as recorded; HF-05
// found that generator 1.0 kept text that still states evidence in some V5 variants, so their UNGROUNDED label was
// wrong. This run uses variant generator 2.0 (tools/variant-spec-v2.mjs) and changes nothing else: the frozen 0.3.3
// copy, the study's compile-row and scoring 1.0 (with the study's own research profile), the study's stored base mocks,
// and V5 mocks built exactly as the study built them (mocks-variants-v2/for-0.3.3/; for the 85 unchanged texts their
// bodies are byte-identical to the study's). Each row is compared with the study's vrun-1 row for the same variant.
// Offline only. Refuses to start unless this package's freeze seal (with pins) and the study's seals verify.
// Usage: node tools/corrected-v5-0.3.3.mjs <scratch>   (writes out/corrected-v5-0.3.3/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG, STUDY } from './harness/engines.mjs';
import { verifySeals } from './verify-seal.mjs';
import { verifySeals as verifyStudySeals } from '../../study-156-2026-10-27/tools/verify-seal.mjs';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { ARMS, declare, compileRow } from '../../study-156-2026-10-27/tools/compile-row.mjs';
import { expectedRelation, VARIANT_SPEC_VERSION } from './variant-spec-v2.mjs';
import { byId, recordText, storedMock, sha, CLOCK } from './lib.mjs';

const [SCRATCH] = process.argv.slice(2);
if (!SCRATCH) { console.error('usage: corrected-v5-0.3.3.mjs <scratch>'); process.exit(2); }
const OUT = join(PKG, 'out', 'corrected-v5-0.3.3');
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }
const pre = [...V.checkNetworkMarkers(process.env, {})];
const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
const st = verifyStudySeals(['corpus', 'freeze']); if (!st.ok) pre.push(...st.problems.map((p) => 'study ' + p));
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

const index = JSON.parse(readFileSync(join(PKG, 'variants-v2', 'VARIANT_INDEX_V2.json'), 'utf8'));
const vfile = readFileSync(join(PKG, 'variants-v2', 'VARIANTS_V2.jsonl'), 'utf8');
if (sha(vfile) !== index.variants_file.sha256) throw new Error('variants_file_hash_mismatch');
const MOCK_POLICY = { A3: 'ORACLE', A4: 'OVERCLAIM', A3R: 'ORACLE-R', A4R: 'OVERCLAIM-R' };
const vm = {};
for (const p of Object.values(MOCK_POLICY)) {
  const b = readFileSync(join(PKG, 'mocks-variants-v2', 'for-0.3.3', p + '.jsonl'), 'utf8');
  if (sha(b) !== index.mock_files_for_0_3_3[p].sha256) throw new Error('variant_mock_file_hash_mismatch:' + p);
  vm[p] = new Map(b.split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.variant_id, o]; }));
}
const studyRun = JSON.parse(readFileSync(join(STUDY, 'out', 'vrun-1', 'RESULTS.json'), 'utf8'));
const studyRow = new Map(studyRun.rows.filter((r) => r.type === 'V5').map((r) => [r.arm + '/' + r.variant_id, r]));
const v5 = vfile.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => v.type === 'V5');
const iso = isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: true });
const Ex = await loadEngine(iso);
const RPV = Ex.research.RESEARCH_PROMPT_VERSION;
const arms = ARMS.filter((a) => ['A2', 'A3', 'A4', 'A3R', 'A4R'].includes(a.id));
const view = (r) => ({ e1: r.e1 || null, disposition: r.disposition, conflicts: r.conflicts_detail || [], statuses: (r.observed && r.observed.statuses) || {}, instruction_risk: r.observed ? r.observed.instruction_risk : null,
  guards: r.guards || [], quote_statuses: (r.observed && r.observed.quote_statuses) || {}, mechanical: r.mechanical || [], graph_digest: r.graph_digest || null, error: r.error || null });
const rows = [];
const baseCache = new Map();
for (const v of v5) {
  const e = byId.get(v.base_id);
  for (const a of arms) {
    const s = studyRow.get(a.id + '/' + v.variant_id);
    const study = s ? { disposition: s.disposition, e1: s.variant ? s.variant.e1 : null, pass: s.relation ? s.relation.pass : null } : null;
    if (!v.constructible) { rows.push({ arm: a.id, variant_id: v.variant_id, base_reference: v.base_reference, change_from_1_0: v.change_from_1_0, disposition: 'not_constructible', reason: v.reason, study }); continue; }
    const key = a.id + '/' + v.base_id;
    if (!baseCache.has(key)) baseCache.set(key, compileRow(Ex, a, { text: recordText(v.base_id), declaration: declare(e), cand: a.mock ? storedMock(a.mock, v.base_id) : null, designed: null, eligible: true, clock: CLOCK, fixtureId: v.base_id, rpv: RPV }));
    let cand = null;
    if (a.mock) { const m = vm[a.mock].get(v.variant_id); if (!m || sha(m.body) !== m.sha256) throw new Error('variant_mock_missing_or_altered:' + a.mock + '/' + v.variant_id); cand = JSON.parse(m.body).envelope.content[0].text; }
    const vr = compileRow(Ex, a, { text: v.text, declaration: declare(e), cand, designed: null, eligible: true, clock: CLOCK, fixtureId: v.variant_id, rpv: RPV });
    const b = view(baseCache.get(key)), w = view(vr);
    const rel = expectedRelation('V5', b, w, a.id, v.designed);
    rows.push({ arm: a.id, variant_id: v.variant_id, base_reference: v.base_reference, change_from_1_0: v.change_from_1_0, disposition: vr.disposition, e1: w.e1, relation: rel,
      graph_digest: w.graph_digest, study, same_as_study: study ? (study.e1 === w.e1 && study.pass === rel.pass) : null });
  }
}
const released = iso.release();
const tally = {};
for (const r of rows) { const k = r.arm; const t = tally[k] = tally[k] || { constructible: 0, pass: 0, fail: 0, clear: 0, not_constructible: 0, same_as_study: 0, changed_vs_study: [] };
  if (r.disposition === 'not_constructible') { t.not_constructible++; continue; } t.constructible++; if (r.relation.pass) t.pass++; else t.fail++; if (r.e1 === 'CLEAR') t.clear++;
  if (r.same_as_study) t.same_as_study++; else t.changed_vs_study.push(r.variant_id + ' (' + r.change_from_1_0 + '): ' + (r.study ? r.study.e1 : 'none') + ' -> ' + r.e1); }
const study1 = {}; for (const r of studyRun.rows.filter((x) => x.type === 'V5' && arms.some((a) => a.id === x.arm))) { const t = study1[r.arm] = study1[r.arm] || { constructible: 0, pass: 0, clear: 0 }; if (r.disposition === 'not_constructible') continue; t.constructible++; if (r.relation.pass) t.pass++; if (r.variant && r.variant.e1 === 'CLEAR') t.clear++; }
const out = { results_format: 'jrs-0.3.4-corrected-analysis/1.0.0', label: 'CORRECTED ANALYSIS: 0.3.3 on V5 from variant generator 2.0 (not an unchanged reproduction)', engine: { version: '0.3.3-research-candidate', manifest_sha256: iso.manifest_sha256, snapshot_sha256: iso.snapshot_sha256, released },
  variant_spec: VARIANT_SPEC_VERSION, scoring: 'study tools/compile-row.mjs and tools/scoring.mjs 1.0, unchanged, with the study research profile', evaluation_clock_utc: CLOCK, network_attempts: attempts.length,
  seals: { package: fz.checked, study: st.checked }, statement: 'The study result (generator 1.0) stands as recorded in research/study-156-2026-10-27/out/vrun-1. This file shows what changes when only the defective transform is corrected.',
  totals: { corrected: tally, study_generator_1_0: study1 }, rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length);
