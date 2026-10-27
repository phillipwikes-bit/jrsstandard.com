// 156-record study runner. Offline only: the network guard is installed first, provider environment variables
// stop the run, and no transport exists. Every Engine version runs from an isolated, manifest-checked copy.
//
// Labels: dev-N runs the development partition only and needs no freeze. run-N runs every partition and refuses
// to start unless the freeze seal and the 0.3.3 candidate manifest verify.
// Arms, declarations and the per-compile scoring live in compile-row.mjs, shared with the variant runner.
// The evaluation clock is fixed (--clock, default 2026-10-27T12:00:00.000Z) so that clock-dependent rules give the
// same result on any day; the wall-clock start is recorded separately.
// Usage: node tools/run-study.mjs <dev-N|run-N> <scratch> [--clock=<ISO-8601 UTC>]
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';
import { verifySeals } from './verify-seal.mjs';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { ARMS, declare, compileRow } from './compile-row.mjs';
import { PROFILE } from './research-probes.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const [LABEL, SCRATCH, ...OPTS] = process.argv.slice(2);
const CLOCK = ((OPTS.find((o) => o.startsWith('--clock=')) || '').slice(8)) || '2026-10-27T12:00:00.000Z';
if (!/^(dev|run)-\d+$/.test(LABEL || '') || !SCRATCH || !Number.isFinite(Date.parse(CLOCK))) { console.error('usage: run-study.mjs <dev-N|run-N> <scratch> [--clock=<ISO-8601 UTC>]'); process.exit(2); }
const SCORED = LABEL.startsWith('run-');
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }

// ------------------------------------------------------------------ pre-run checks (any failure stops before execution)
const pre = [...V.checkNetworkMarkers(process.env, {})];
const corpus = verifySeals(['corpus']); if (!corpus.ok) pre.push(...corpus.problems);
if (SCORED) {
  const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
  if (!existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt'))) pre.push('candidate_0.3.3_manifest_missing');
}
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

// ------------------------------------------------------------------ records
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const devIds = new Set(inv.entries.filter((e) => (e.cohort === 'synthetic_record' && e.partition === 'development') || (e.cohort === 'original_study_record' && e.scope_class === 'NOT_EXCLUDED')).map((e) => e.source_id));
const entries = inv.entries.filter((e) => SCORED || devIds.has(e.source_id));

// ------------------------------------------------------------------ engines
const isos = { '0.3.1-candidate': isolate('0.3.1-candidate', SCRATCH), '0.3.2-candidate': isolate('0.3.2-candidate', SCRATCH), '0.3.3-research-candidate': isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: SCORED }) };
const E = {}; for (const [v, iso] of Object.entries(isos)) E[v] = await loadEngine(iso);
const RPV = E['0.3.3-research-candidate'].research.RESEARCH_PROMPT_VERSION;
const mockIndex = JSON.parse(readFileSync(join(PKG, 'mocks', 'MOCK_INDEX.json'), 'utf8'));
const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const startedAt = new Date().toISOString();
const rows = [];
const t0 = Date.now();
for (const e of entries) {
  const eligible = e.full_text_available && e.scope_class === 'NOT_EXCLUDED';
  if (!e.full_text_available) { for (const a of ARMS) rows.push({ arm: a.id, id: e.source_id, cohort: e.cohort, disposition: 'not_run:source_text_not_held' }); continue; }
  const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(text) !== e.extracted_text_sha256) throw new Error('record_hash_mismatch:' + e.source_id);
  const ref = e.reference_findings[0].value;
  const designed = e.cohort === 'synthetic_record' ? JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8')).records.find((r) => r.id === e.source_id).designed : null;
  for (const a of ARMS) {
    const base = { arm: a.id, id: e.source_id, cohort: e.cohort, partition: e.partition || (e.cohort === 'original_study_record' ? 'original' : null), family: e.links && e.links.family || null, type: e.links && e.links.type || null, reference: ref, scope_class: e.scope_class };
    if (a.eligibleOnly && !eligible) { rows.push(Object.assign(base, { disposition: 'not_run:scope_decision_SC1_required' })); continue; }
    let cand = null;
    if (a.mock) { const body = readFileSync(join(PKG, 'mocks', a.mock, e.source_id + '.json'), 'utf8'); if (sha(body) !== mockSha[a.mock + '/' + e.source_id]) throw new Error('mock_hash_mismatch:' + a.mock + '/' + e.source_id); cand = JSON.parse(body).envelope.content[0].text; }
    rows.push(Object.assign(base, compileRow(E[a.engine], a, { text, declaration: declare(e), cand, designed, eligible, clock: CLOCK, fixtureId: e.source_id, rpv: RPV })));
  }
}
const elapsed = Date.now() - t0;
const released = Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, iso.release()]));
const count = (f) => rows.filter(f).length;
const byArm = {}; for (const r of rows) { const k = r.arm; byArm[k] = byArm[k] || {}; byArm[k][r.disposition] = (byArm[k][r.disposition] || 0) + 1; }
const out = { results_format: 'jrs-study-156-run/1.0.0', label: LABEL, scored: SCORED, started_at_utc: startedAt, evaluation_clock_utc: CLOCK, elapsed_ms: elapsed, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: 'Offline mechanical runs with mock candidate policies. No model, provider, credential or network was used. Agreement figures compare outputs with AI-authored or LLM-reproduced references; they are not accuracy.',
  engines: Object.fromEntries(Object.entries(isos).map(([v, iso]) => [v, { snapshot_sha256: iso.snapshot_sha256, manifest_sha256: iso.manifest_sha256, files_verified: iso.files_verified, released: released[v] }])),
  environment: { node: process.version, platform: process.platform, arch: process.arch, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale, TZ: process.env.TZ || null, LANG: process.env.LANG || null, LC_ALL: process.env.LC_ALL || null },
  research_profile: PROFILE, corpus_seal: corpus.checked, network_attempts: attempts.length,
  totals: { rows: rows.length, records: entries.length, by_arm: byArm, technical_failures: count((r) => r.disposition === 'technical_failure'), scope_leaks: count((r) => r.disposition === 'scope_leak') },
  rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals.by_arm), 'tech', out.totals.technical_failures, 'leaks', out.totals.scope_leaks, 'network', attempts.length, 'ms', elapsed);
