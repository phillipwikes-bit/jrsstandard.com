// 0.3.4 repair package: scored record runner. Offline only: the network guard is installed first, provider
// environment variables stop the run, and no transport exists. Derived from the study's tools/run-study.mjs 1.0
// (unchanged there): same records, same scoring, same dispositions; arms from compile-row 2.0.
// Every run label run-N refuses to start unless this package's freeze seal verifies (with its pins), the study's
// corpus and freeze seals verify, and the 0.3.4 candidate manifest exists and matches the isolated copy.
// For arms with the research profile off (A0c, A6c), each row also records whether its graph equals the 0.3.2 graph
// for the same record and arm (A0b, A6) after the differential's normalization.
// The evaluation clock is fixed (--clock, default 2026-10-27T12:00:00.000Z); the wall-clock start is recorded.
// Usage: node tools/run-scored.mjs <run-N> <scratch> [--clock=<ISO-8601 UTC>]
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG, STUDY } from './harness/engines.mjs';
import { verifySeals } from './verify-seal.mjs';
import { verifySeals as verifyStudySeals } from '../../study-156-2026-10-27/tools/verify-seal.mjs';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { ARMS_V2, PROFILE, declare, compileRow, CANDIDATE } from './compile-row-v2.mjs';
import { inventory, designedOf, sha } from './lib.mjs';

const ROOT = join(PKG, '..', '..');
const [LABEL, SCRATCH, ...OPTS] = process.argv.slice(2);
const CLOCK = ((OPTS.find((o) => o.startsWith('--clock=')) || '').slice(8)) || '2026-10-27T12:00:00.000Z';
if (!/^run-\d+$/.test(LABEL || '') || !SCRATCH || !Number.isFinite(Date.parse(CLOCK))) { console.error('usage: run-scored.mjs <run-N> <scratch> [--clock=<ISO-8601 UTC>]'); process.exit(2); }
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }

// ------------------------------------------------------------------ pre-run checks (any failure stops before execution)
const pre = [...V.checkNetworkMarkers(process.env, {})];
const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
const st = verifyStudySeals(['corpus', 'freeze']); if (!st.ok) pre.push(...st.problems.map((p) => 'study ' + p));
if (!existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt'))) pre.push('candidate_0.3.4_manifest_missing');
const mockIndex = existsSync(join(PKG, 'mocks-v2', 'MOCK_INDEX.json')) ? JSON.parse(readFileSync(join(PKG, 'mocks-v2', 'MOCK_INDEX.json'), 'utf8')) : null;
if (!mockIndex) pre.push('mocks_v2_index_missing');
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

// ------------------------------------------------------------------ inputs
const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const studyIndex = JSON.parse(readFileSync(join(STUDY, 'mocks', 'MOCK_INDEX.json'), 'utf8'));
const studySha = Object.fromEntries(studyIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const mockOf = (policy, id) => {
  const fromStudy = policy === 'ORACLE-default';
  const body = readFileSync(join(fromStudy ? STUDY : PKG, fromStudy ? 'mocks' : 'mocks-v2', policy, id + '.json'), 'utf8');
  if (sha(body) !== (fromStudy ? studySha : mockSha)[policy + '/' + id]) throw new Error('mock_hash_mismatch:' + policy + '/' + id);
  return JSON.parse(body).envelope.content[0].text;
};
const entries = inventory.entries;

// ------------------------------------------------------------------ engines
const versions = [...new Set(ARMS_V2.map((a) => a.engine))];
const isos = Object.fromEntries(versions.map((v) => [v, isolate(v, SCRATCH, { requireManifest: true })]));
const E = {}; for (const [v, iso] of Object.entries(isos)) E[v] = await loadEngine(iso);
const RPV = E[CANDIDATE].research.RESEARCH_PROMPT_VERSION;
const startedAt = new Date().toISOString();
const rows = [];
const t0 = Date.now();
for (const e of entries) {
  const eligible = e.full_text_available && e.scope_class === 'NOT_EXCLUDED';
  if (!e.full_text_available) { for (const a of ARMS_V2) rows.push({ arm: a.id, id: e.source_id, cohort: e.cohort, disposition: 'not_run:source_text_not_held' }); continue; }
  const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(text) !== e.extracted_text_sha256) throw new Error('record_hash_mismatch:' + e.source_id);
  const ref = e.reference_findings[0].value;
  const designed = e.cohort === 'synthetic_record' ? designedOf(e.source_id) : null;
  const byArm = {};
  for (const a of ARMS_V2) {
    const base = { arm: a.id, id: e.source_id, cohort: e.cohort, partition: e.partition || (e.cohort === 'original_study_record' ? 'original' : null), family: e.links && e.links.family || null, type: e.links && e.links.type || null, reference: ref, scope_class: e.scope_class };
    if (a.eligibleOnly && !eligible) { rows.push(byArm[a.id] = Object.assign(base, { disposition: 'not_run:scope_decision_SC1_required' })); continue; }
    const cand = a.mock ? mockOf(a.mock, e.source_id) : null;
    const normalize = !!a.equals || ARMS_V2.some((b) => b.equals === a.id);
    const r = Object.assign(base, compileRow(E[a.engine], a, { text, declaration: declare(e), cand, designed, eligible, clock: CLOCK, fixtureId: e.source_id, rpv: RPV, profile: PROFILE, normalize }));
    if (a.equals) { const o = byArm[a.equals]; r.equals_arm = a.equals; r.default_path_equal = !!o && (o.default_normalized_sha256 ? o.default_normalized_sha256 === r.default_normalized_sha256 : o.error_normalized === r.error_normalized) && o.disposition === r.disposition; }
    rows.push(byArm[a.id] = r);
  }
}
const elapsed = Date.now() - t0;
const released = Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, iso.release()]));
const count = (f) => rows.filter(f).length;
const byArm = {}; for (const r of rows) { const k = r.arm; byArm[k] = byArm[k] || {}; byArm[k][r.disposition] = (byArm[k][r.disposition] || 0) + 1; }
const out = { results_format: 'jrs-0.3.4-scored-run/1.0.0', label: LABEL, started_at_utc: startedAt, evaluation_clock_utc: CLOCK, elapsed_ms: elapsed, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: 'Offline mechanical runs with scripted candidate policies. No model, provider, credential or network was used. Every study record is exposed development material for 0.3.4; agreement figures compare outputs with AI-authored or LLM-reproduced references. They are development evidence, not accuracy and not evaluation evidence.',
  engines: Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, { snapshot_sha256: iso.snapshot_sha256, manifest_sha256: iso.manifest_sha256, files_verified: iso.files_verified, released: released[v] }])),
  environment: { node: process.version, platform: process.platform, arch: process.arch, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale, TZ: process.env.TZ || null, LANG: process.env.LANG || null, LC_ALL: process.env.LC_ALL || null },
  research_profile: PROFILE, seals: { package: fz.checked, study: st.checked }, mock_index_sha256: sha(readFileSync(join(PKG, 'mocks-v2', 'MOCK_INDEX.json'))), network_attempts: attempts.length,
  totals: { rows: rows.length, records: entries.length, by_arm: byArm, technical_failures: count((r) => r.disposition === 'technical_failure'), scope_leaks: count((r) => r.disposition === 'scope_leak'),
    default_path_rows: count((r) => r.equals_arm), default_path_equal: count((r) => r.equals_arm && r.default_path_equal) },
  rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals.by_arm), 'tech', out.totals.technical_failures, 'leaks', out.totals.scope_leaks, 'default-path equal', out.totals.default_path_equal + '/' + out.totals.default_path_rows, 'network', attempts.length, 'ms', elapsed);
