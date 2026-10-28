// 0.3.4 repair package: variant runner 2.0. Offline only, like tools/run-scored.mjs. Derived from the study's
// tools/run-variants.mjs 1.0 (unchanged there). For each constructible variant of variant set 2.0 and each arm, it
// compiles the base record and the variant with the same arm on 0.3.4 and checks the variant's pre-specified expected
// relation (tools/variant-spec-v2.mjs; relations unchanged from 1.0).
//   A2 (no candidate), A3 ORACLE, A4 OVERCLAIM (heuristic quotations), A3R ORACLE-R, A4R OVERCLAIM-R (rule-aligned on
//   0.3.4 units), ADV (V2 and V6 only: the adversarial citer, quoting the inserted sentence for every condition it can)
// Each run label vrun-N refuses to start unless this package's freeze seal (with pins), the study's corpus and freeze
// seals and the 0.3.4 candidate manifest verify.
// Usage: node tools/run-variants-v2.mjs <vrun-N> <scratch> [--clock=<ISO-8601 UTC>]
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG } from './harness/engines.mjs';
import { verifySeals } from './verify-seal.mjs';
import { verifySeals as verifyStudySeals } from '../../study-156-2026-10-27/tools/verify-seal.mjs';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { ARMS_V2, PROFILE, declare, compileRow, CANDIDATE } from './compile-row-v2.mjs';
import { expectedRelation, VARIANT_TYPES, VARIANT_SPEC_VERSION } from './variant-spec-v2.mjs';
import { byId, recordText, sha } from './lib.mjs';

const [LABEL, SCRATCH, ...OPTS] = process.argv.slice(2);
const CLOCK = ((OPTS.find((o) => o.startsWith('--clock=')) || '').slice(8)) || '2026-10-27T12:00:00.000Z';
if (!/^vrun-\d+$/.test(LABEL || '') || !SCRATCH || !Number.isFinite(Date.parse(CLOCK))) { console.error('usage: run-variants-v2.mjs <vrun-N> <scratch> [--clock=<ISO-8601 UTC>]'); process.exit(2); }
const OUT = join(PKG, 'out', LABEL);
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }

const pre = [...V.checkNetworkMarkers(process.env, {})];
const fz = verifySeals(['freeze']); if (!fz.ok) pre.push(...(fz.problems.length ? fz.problems : ['freeze_seal_missing']));
const st = verifyStudySeals(['corpus', 'freeze']); if (!st.ok) pre.push(...st.problems.map((p) => 'study ' + p));
if (!existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt'))) pre.push('candidate_0.3.4_manifest_missing');
const indexPath = join(PKG, 'variants-v2', 'VARIANT_INDEX_V2.json');
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : null;
let vfile = null; const vm = {};
const MOCK_POLICY = { A3: 'ORACLE', A4: 'OVERCLAIM', A3R: 'ORACLE-R', A4R: 'OVERCLAIM-R', ADV: 'ADV' };
if (!index) pre.push('variant_index_v2_missing');
else {
  vfile = readFileSync(join(PKG, 'variants-v2', 'VARIANTS_V2.jsonl'), 'utf8');
  if (sha(vfile) !== index.variants_file.sha256) pre.push('variants_file_hash_mismatch');
  for (const p of Object.values(MOCK_POLICY)) {
    const b = readFileSync(join(PKG, 'mocks-variants-v2', p + '.jsonl'), 'utf8');
    if (sha(b) !== index.mock_files[p].sha256) pre.push('variant_mock_file_hash_mismatch:' + p);
    vm[p] = new Map(b.split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.variant_id, o]; }));
  }
}
const mockIndex = existsSync(join(PKG, 'mocks-v2', 'MOCK_INDEX.json')) ? JSON.parse(readFileSync(join(PKG, 'mocks-v2', 'MOCK_INDEX.json'), 'utf8')) : null;
if (!mockIndex) pre.push('mocks_v2_index_missing');
mkdirSync(OUT, { recursive: true });
if (pre.length) { writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify({ stopped_before_execution: true, problems: pre }, null, 2)); console.error('stopped:', pre.join('; ')); process.exit(3); }

const mockSha = Object.fromEntries(mockIndex.rows.map((r) => [r.policy + '/' + r.id, r.sha256]));
const baseMock = (policy, id) => { const body = readFileSync(join(PKG, 'mocks-v2', policy, id + '.json'), 'utf8'); if (sha(body) !== mockSha[policy + '/' + id]) throw new Error('mock_hash_mismatch:' + policy + '/' + id); return JSON.parse(body).envelope.content[0].text; };
const variants = vfile.split('\n').filter(Boolean).map((l) => JSON.parse(l));
const iso = isolate(CANDIDATE, SCRATCH, { requireManifest: true });
const Ex = await loadEngine(iso);
const RPV = Ex.research.RESEARCH_PROMPT_VERSION;
const arms = ARMS_V2.filter((a) => ['A2', 'A3', 'A4', 'A3R', 'A4R', 'ADV'].includes(a.id));
const view = (r) => ({ e1: r.e1 || null, disposition: r.disposition, conflicts: r.conflicts_detail || [], statuses: (r.observed && r.observed.statuses) || {}, instruction_risk: r.observed ? r.observed.instruction_risk : null,
  guards: r.guards || [], quote_statuses: (r.observed && r.observed.quote_statuses) || {}, mechanical: r.mechanical || [], graph_digest: r.graph_digest || null, error: r.error || null });
const inserted = (v) => { const m = /"(.*)"$/.exec(v.construction || ''); return m ? m[1].replace(/[.!?]$/, '') : null; };
// Conditions whose candidate quotations overlap the inserted sentence (V2 and V6).
const citesInserted = (v, cand) => { const s = inserted(v); if (!s || !cand) return []; const s0 = v.text.indexOf(s), s1 = s0 + s.length;
  return [...new Set(JSON.parse(cand).observations.filter((o) => o.quote && (() => { const at = v.text.indexOf(o.quote); return at >= 0 && at < s1 && s0 < at + o.quote.length; })()).map((o) => o.condition_id))].sort(); };
const startedAt = new Date().toISOString();
const t0 = Date.now();
const baseCache = new Map();
const rows = [];
for (const v of variants) {
  const e = byId.get(v.base_id);
  const armsHere = arms.filter((a) => a.id !== 'ADV' || v.type === 'V2' || v.type === 'V6');
  if (!v.constructible) { for (const a of armsHere) rows.push({ arm: a.id, variant_id: v.variant_id, base_id: v.base_id, type: v.type, partition: v.partition, family: v.family, base_construction_type: v.base_construction_type, disposition: 'not_constructible', reason: v.reason }); continue; }
  if (sha(v.text) !== v.text_sha256) throw new Error('variant_text_hash_mismatch:' + v.variant_id);
  const baseText = recordText(v.base_id);
  for (const a of armsHere) {
    const key = a.id + '/' + e.source_id;
    if (!baseCache.has(key)) baseCache.set(key, compileRow(Ex, a, { text: baseText, declaration: declare(e), cand: a.mock ? baseMock(a.mock, e.source_id) : null, designed: null, eligible: true, clock: CLOCK, fixtureId: e.source_id, rpv: RPV, profile: PROFILE }));
    let vcand = null;
    if (a.mock) { const m = vm[a.mock].get(v.variant_id); if (!m || sha(m.body) !== m.sha256) throw new Error('variant_mock_missing_or_altered:' + a.mock + '/' + v.variant_id); vcand = JSON.parse(m.body).envelope.content[0].text; }
    const vr = compileRow(Ex, a, { text: v.text, declaration: declare(e), cand: vcand, designed: null, eligible: true, clock: CLOCK, fixtureId: v.variant_id, rpv: RPV, profile: PROFILE });
    const b = view(baseCache.get(key)), w = view(vr);
    const newly = Object.keys(w.statuses).filter((c) => w.statuses[c] === 'supported' && b.statuses[c] !== 'supported').sort();
    const via = (v.type === 'V2' || v.type === 'V6') ? citesInserted(v, vcand) : [];
    rows.push({ arm: a.id, variant_id: v.variant_id, base_id: v.base_id, type: v.type, partition: v.partition, family: v.family, base_construction_type: v.base_construction_type, base_reference: v.base_reference, designed: v.designed,
      disposition: vr.disposition, base: b, variant: Object.assign(w, { controls: vr.controls, control_defects: vr.control_defects, candidate_sha256: vr.candidate_sha256, ms: vr.ms }),
      newly_supported: newly, cites_inserted: via, newly_supported_via_inserted: newly.filter((c) => via.includes(c)), relation: expectedRelation(v.type, b, w, a.id, v.designed) });
  }
}
const elapsed = Date.now() - t0;
const released = iso.release();
const table = {};
for (const r of rows) { const k = r.type + '/' + r.arm; table[k] = table[k] || { pass: 0, fail: 0, not_constructible: 0, technical_failure: 0 };
  if (r.disposition === 'not_constructible') table[k].not_constructible++; else { if (r.disposition === 'technical_failure') table[k].technical_failure++; if (r.relation.pass) table[k].pass++; else table[k].fail++; } }
const out = { results_format: 'jrs-0.3.4-variants-run/2.0.0', label: LABEL, started_at_utc: startedAt, evaluation_clock_utc: CLOCK, elapsed_ms: elapsed, release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: 'Offline variant runs with scripted candidate policies. No model, provider, credential or network was used. Expected relations were fixed in tools/variant-spec-v2.mjs (unchanged from 1.0) before this run. Every variant is exposed development material.',
  engine: { version: CANDIDATE, snapshot_sha256: iso.snapshot_sha256, manifest_sha256: iso.manifest_sha256, released }, variant_spec: VARIANT_SPEC_VERSION,
  environment: { node: process.version, platform: process.platform, arch: process.arch, time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale, TZ: process.env.TZ || null, LANG: process.env.LANG || null, LC_ALL: process.env.LC_ALL || null },
  variant_index_sha256: sha(readFileSync(indexPath)), seals: { package: fz.checked, study: st.checked }, network_attempts: attempts.length,
  totals: { rows: rows.length, variants: variants.length, by_type_arm: table, technical_failures: rows.filter((r) => r.disposition === 'technical_failure').length }, rows };
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(VARIANT_TYPES.map((t) => t + ' ' + arms.map((a) => { const c = table[t + '/' + a.id]; return c ? a.id + ':' + c.pass + '/' + (c.pass + c.fail) : null; }).filter(Boolean).join(' ')).join('\n'), '\ntech', out.totals.technical_failures, 'network', attempts.length, 'ms', elapsed);
