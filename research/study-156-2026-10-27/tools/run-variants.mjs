// 156-record study: variant runner. Offline only, like run-study.mjs: the network guard is installed first, provider
// environment variables stop the run, and every Engine version runs from an isolated, manifest-checked copy.
// For each constructible variant and each arm below, it compiles the base record and the variant with the same arm
// and checks the variant's pre-specified expected relation (tools/variant-spec.mjs).
//   A2 (no candidate), A3 ORACLE, A4 OVERCLAIM (heuristic quotations), A3R ORACLE-R, A4R OVERCLAIM-R (rule-aligned)
// Labels: vdev-N runs development-partition variants only and needs no freeze. vrun-N runs every variant and
// refuses to start unless the freeze seal and the 0.3.3 candidate manifest verify.
// Usage: node tools/run-variants.mjs <vdev-N|vrun-N> <scratch> [--clock=<ISO-8601 UTC>]
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
import { expectedRelation, VARIANT_TYPES } from './variant-spec.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const [LABEL, SCRATCH, ...OPTS] = process.argv.slice(2);
const CLOCK = ((OPTS.find((o) => o.startsWith('--clock=')) || '').slice(8)) || '2026-10-27T12:00:00.000Z';
if (!/^(vdev|vrun)-\d+$/.test(LABEL || '') || !SCRATCH || !Number.isFinite(Date.parse(CLOCK))) { console.error('usage: run-variants.mjs <vdev-N|vrun-N> <scratch> [--clock=<ISO-8601 UTC>]'); process.exit(2); }
const SCORED = LABEL.startsWith('vrun-');
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }

const pre = [...V.checkNetworkMarkers(process.env, {})];
const corpus = verifySeals(['corpus']); if (!corpus.ok) pre.push(...corpus.problems);
if (SCORED) {
  const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
  if (!existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt'))) pre.push('candidate_0.3.3_manifest_missing');
}
const index = JSON.parse(readFileSync(join(PKG, 'variants', 'VARIANT_INDEX.json'), 'utf8'));
const vfile = readFileSync(join(PKG, 'variants', 'VARIANTS.jsonl'), 'utf8');
if (sha(vfile) !== index.variants_file.sha256) pre.push('variants_file_hash_mismatch');
const MOCK_POLICY = { A3: 'ORACLE', A4: 'OVERCLAIM', A3R: 'ORACLE-R', A4R: 'OVERCLAIM-R' };
const vm = {};
for (const p of Object.values(MOCK_POLICY)) {
  const b = readFileSync(join(PKG, 'mocks-variants', p + '.jsonl'), 'utf8');
  if (sha(b) !== index.mock_files[p].sha256) pre.push('variant_mock_file_hash_mismatch:' + p);
  vm[p] = new Map(b.split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.variant_id, o]; }));
}
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const byId = new Map(inv.entries.map((e) => [e.source_id, e]));
const register = JSON.parse(readFileSync(join(PKG, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
const designedOf = (id) => { const r = register.records.find((x) => x.id === id); return r ? r.designed : null; };
const mockIndex = JSON.parse(readFileSync(join(PKG, 'mocks', 'MOCK_INDEX.json'), 'utf8'));
const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const variants = vfile.split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((v) => SCORED || v.partition === 'development' || v.partition === 'original');

const isos = { '0.3.3-research-candidate': isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: SCORED }) };
const Ex = await loadEngine(isos['0.3.3-research-candidate']);
const RPV = Ex.research.RESEARCH_PROMPT_VERSION;
const arms = ARMS.filter((a) => ['A2', 'A3', 'A4', 'A3R', 'A4R'].includes(a.id));
const view = (r) => ({ e1: r.e1 || null, disposition: r.disposition, conflicts: r.conflicts_detail || [], statuses: (r.observed && r.observed.statuses) || {}, instruction_risk: r.observed ? r.observed.instruction_risk : null,
  guards: r.guards || [], quote_statuses: (r.observed && r.observed.quote_statuses) || {}, mechanical: r.mechanical || [], graph_digest: r.graph_digest || null, error: r.error || null });
const startedAt = new Date().toISOString();
const t0 = Date.now();
const baseCache = new Map();
const rows = [];
for (const v of variants) {
  const e = byId.get(v.base_id);
  if (!v.constructible) { for (const a of arms) rows.push({ arm: a.id, variant_id: v.variant_id, base_id: v.base_id, type: v.type, partition: v.partition, family: v.family, base_construction_type: v.base_construction_type, disposition: 'not_constructible', reason: v.reason }); continue; }
  if (sha(v.text) !== v.text_sha256) throw new Error('variant_text_hash_mismatch:' + v.variant_id);
  const baseText = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(baseText) !== e.extracted_text_sha256) throw new Error('record_hash_mismatch:' + e.source_id);
  for (const a of arms) {
    const key = a.id + '/' + e.source_id;
    if (!baseCache.has(key)) {
      let cand = null;
      if (a.mock) { const body = readFileSync(join(PKG, 'mocks', a.mock, e.source_id + '.json'), 'utf8'); if (sha(body) !== mockSha[a.mock + '/' + e.source_id]) throw new Error('mock_hash_mismatch:' + key); cand = JSON.parse(body).envelope.content[0].text; }
      baseCache.set(key, compileRow(Ex, a, { text: baseText, declaration: declare(e), cand, designed: designedOf(e.source_id), eligible: true, clock: CLOCK, fixtureId: e.source_id, rpv: RPV }));
    }
    let vcand = null;
    if (a.mock) { const m = vm[a.mock].get(v.variant_id); if (!m || sha(m.body) !== m.sha256) throw new Error('variant_mock_missing_or_altered:' + a.mock + '/' + v.variant_id); vcand = JSON.parse(m.body).envelope.content[0].text; }
    const vr = compileRow(Ex, a, { text: v.text, declaration: declare(e), cand: vcand, designed: null, eligible: true, clock: CLOCK, fixtureId: v.variant_id, rpv: RPV });
    const b = view(baseCache.get(key)), w = view(vr);
    rows.push({ arm: a.id, variant_id: v.variant_id, base_id: v.base_id, type: v.type, partition: v.partition, family: v.family, base_construction_type: v.base_construction_type, base_reference: v.base_reference, designed: v.designed,
      disposition: vr.disposition, base: b, variant: Object.assign(w, { controls: vr.controls, control_defects: vr.control_defects, candidate_sha256: vr.candidate_sha256, ms: vr.ms }), relation: expectedRelation(v.type, b, w, a.id, v.designed) });
  }
}
const elapsed = Date.now() - t0;
const released = { '0.3.3-research-candidate': isos['0.3.3-research-candidate'].release() };
const table = {};
for (const r of rows) { const k = r.type + '/' + r.arm; table[k] = table[k] || { pass: 0, fail: 0, not_constructible: 0, technical_failure: 0 };
  if (r.disposition === 'not_constructible') table[k].not_constructible++; else { if (r.disposition === 'technical_failure') table[k].technical_failure++; if (r.relation.pass) table[k].pass++; else table[k].fail++; } }
const out = { results_format: 'jrs-study-156-variants-run/1.0.0', label: LABEL, scored: SCORED, started_at_utc: startedAt, evaluation_clock_utc: CLOCK, elapsed_ms: elapsed, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: 'Offline variant runs with mock candidate policies. No model, provider, credential or network was used. Expected relations were fixed in tools/variant-spec.mjs before this run.',
  engine: { version: '0.3.3-research-candidate', snapshot_sha256: isos['0.3.3-research-candidate'].snapshot_sha256, manifest_sha256: isos['0.3.3-research-candidate'].manifest_sha256, released: released['0.3.3-research-candidate'] },
  environment: { node: process.version, platform: process.platform, arch: process.arch, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale, TZ: process.env.TZ || null, LANG: process.env.LANG || null, LC_ALL: process.env.LC_ALL || null },
  variant_index_sha256: sha(readFileSync(join(PKG, 'variants', 'VARIANT_INDEX.json'))), corpus_seal: corpus.checked, network_attempts: attempts.length,
  totals: { rows: rows.length, variants: variants.length, by_type_arm: table, technical_failures: rows.filter((r) => r.disposition === 'technical_failure').length }, rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(VARIANT_TYPES.map((t) => t + ' ' + arms.map((a) => { const c = table[t + '/' + a.id] || {}; return a.id + ':' + (c.pass || 0) + '/' + ((c.pass || 0) + (c.fail || 0)); }).join(' ')).join('\n'), '\ntech', out.totals.technical_failures, 'network', attempts.length, 'ms', elapsed);
