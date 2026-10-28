// 0.3.4 repair package: variant set 2.0 and its mock candidates. NOT MODEL OUTPUT. Written before the freeze. Offline.
//   variants-v2/VARIANTS_V2.jsonl   the study's 832 variant rows. V1 to V4 and V6 to V8 lines are copied from the
//       study's frozen file and checked byte-identical; V5 lines are rebuilt by variant generator 2.0
//       (tools/variant-spec-v2.mjs, HF-05 correction), which marks a record not constructible rather than keep a
//       clause that still states evidence.
//   mocks-variants-v2/<POLICY>.jsonl   0.3.4 research prompt version. ORACLE and OVERCLAIM: the study's heuristic
//       generator (observations checked equal to the study's stored variant mock wherever the variant text is
//       unchanged); ORACLE-R and OVERCLAIM-R: the study's rule-aligned generator on 0.3.4 units (circular, a ceiling);
//       ADV (V2 and V6 only): the adversarial citer quoting the INSERTED sentence for every condition it can.
//   mocks-variants-v2/for-0.3.3/<POLICY>.jsonl   V5 2.0 rows only, built exactly as the study built them for 0.3.3
//       (0.3.3 prompt version, aligned on 0.3.3 units), for the corrected analysis of 0.3.3 on V5. A corrected
//       analysis, not an unchanged reproduction.
//   variants-v2/VARIANT_INDEX_V2.json  counts, file hashes, V5 changes.
// V8 mocks carry the extra AMB-1 observation, as in the study (tools/build-variants.mjs 1.0).
// Usage: node tools/build-variants-v2.mjs <scratch>
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { isolate, loadEngine, PKG, STUDY } from './harness/engines.mjs';
import { substantive, recordText, storedVariantMock, sha } from './lib.mjs';
import { buildVariant, VARIANT_NAMES, VARIANT_SPEC_VERSION } from './variant-spec-v2.mjs';
import { mockCandidate } from '../../study-156-2026-10-27/tools/mock-candidates.mjs';
import { alignedCandidate } from '../../study-156-2026-10-27/tools/mock-aligned.mjs';
import { advCandidate } from '../tests/paired-suite.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: build-variants-v2.mjs <scratch>'); process.exit(2); }
for (const d of ['variants-v2', 'mocks-variants-v2']) if (existsSync(join(PKG, d))) { console.error(d + ' exists; it is preserved, not rebuilt'); process.exit(2); }
mkdirSync(SCRATCH, { recursive: true });
const i4 = isolate('0.3.4-research-candidate', SCRATCH, { requireManifest: false }), i3 = isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: true });
const E4 = await loadEngine(i4), E3 = await loadEngine(i3);
const V4 = { contractVersion: E4.contract.CONTRACT_VERSION, promptVersion: E4.research.RESEARCH_PROMPT_VERSION };
const V3 = { contractVersion: E3.contract.CONTRACT_VERSION, promptVersion: E3.research.RESEARCH_PROMPT_VERSION };
const SIZE_LIMIT = 8000;
const studyLines = readFileSync(join(STUDY, 'variants', 'VARIANTS.jsonl'), 'utf8').split('\n').filter(Boolean);
const studyRows = new Map(studyLines.map((l) => { const o = JSON.parse(l); return [o.variant_id, { line: l, row: o }]; }));
const POL4 = ['ORACLE', 'OVERCLAIM', 'ORACLE-R', 'OVERCLAIM-R', 'ADV'], POL3 = ['ORACLE', 'OVERCLAIM', 'ORACLE-R', 'OVERCLAIM-R'];
const mock4 = Object.fromEntries(POL4.map((p) => [p, []])), mock3 = Object.fromEntries(POL3.map((p) => [p, []]));
const lines = [], table = {}, v5changes = [];
const checks = { non_v5_lines_identical: 0, non_v5_lines_compared: 0, heuristic_equal_to_study: 0, heuristic_compared: 0, heuristic_differing: [], for033_equal_to_study_body: 0, for033_compared: 0, for033_differing: [] };
// The study's V8 rule: AMB-1 quotes the repeated sentence without a disambiguator.
const withAmb = (c, v, p, ref) => { const o = JSON.parse(c); const st = p.startsWith('OVERCLAIM') ? 'supported' : ref.e1 === 'GROUNDED' ? 'supported' : 'gap';
  o.observations = o.observations.slice(0, 24).concat([{ observation_id: 'AMB-1', condition_id: 'identifiable_basis', proposed_status: st, quote: v.quote.text, assertion_type: v.quote.assertion_type }]); return JSON.stringify(o, null, 2); };
const envelope = (cand, p, id, ref, generator) => JSON.stringify({ envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: cand }], model: 'MOCK-POLICY-' + p + '-NOT-A-MODEL', usage: { input_tokens: 0, output_tokens: 0 } },
  provenance: { response_origin: 'mock_policy_fixture', policy: p, generator, variant: id, reference_used: ref } });
const inserted = (v) => { const m = /"(.*)"$/.exec(v.construction || ''); return m ? m[1] : null; };

substantive.forEach((e, index) => {
  const text = recordText(e.source_id);
  const base = { text, e1: e.reference_findings[0].value, chronology_conflict: !!(e.links && e.links.type === 'S') };
  for (const type of ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8']) {
    const id = e.source_id + '~' + type, s = studyRows.get(id);
    if (!s) throw new Error('study variant row missing ' + id);
    let row, line;
    if (type !== 'V5') { row = s.row; line = JSON.stringify(row); checks.non_v5_lines_compared++; if (line === s.line) checks.non_v5_lines_identical++; else throw new Error('non-V5 line differs ' + id); }
    else {
      const v = buildVariant('V5', base, index);
      row = { variant_id: id, base_id: e.source_id, type, name: VARIANT_NAMES[type], cohort: e.cohort, partition: e.partition || 'original', family: (e.links && e.links.family) || null,
        base_construction_type: (e.links && e.links.type) || null, base_reference: base.e1, constructible: v.constructible, variant_spec: VARIANT_SPEC_VERSION };
      if (!v.constructible) row.reason = v.reason;
      else { if (v.text.length > SIZE_LIMIT) throw new Error('variant over the local size limit ' + id); Object.assign(row, { construction: v.construction, designed: v.designed, quote: v.quote || null, text: v.text, text_sha256: sha(v.text), length_utf16: v.text.length }); }
      const was = s.row;
      const change = !was.constructible && !row.constructible ? 'not_constructible_in_both' : was.constructible && !row.constructible ? 'newly_not_constructible' : !was.constructible && row.constructible ? 'newly_constructible'
        : was.text === row.text ? 'text_unchanged' : 'text_changed';
      row.change_from_1_0 = change;
      if (change !== 'text_unchanged' && change !== 'not_constructible_in_both') v5changes.push({ variant_id: id, change, v1_text: was.text || null, v2_text: row.text || null, v2_reason: row.reason || null });
      line = JSON.stringify(row);
    }
    lines.push(line);
    table[type] = table[type] || { constructible: 0, not_constructible: [] };
    if (!row.constructible) { table[type].not_constructible.push(e.source_id + ': ' + row.reason); continue; }
    table[type].constructible++;
    const ref = { e1: row.designed.e1, chronology_conflict: !!row.designed.chronology_conflict };
    const textSame = type !== 'V5' || row.change_from_1_0 === 'text_unchanged';
    for (const p of POL4) {
      if (p === 'ADV' && type !== 'V2' && type !== 'V6') continue;
      let c = p === 'ADV' ? advCandidate(row.text, inserted(row), E4) : p.endsWith('-R') ? alignedCandidate(row.text, E4.research, ref, p, V4) : mockCandidate(row.text, ref, p, V4);
      if (type === 'V8' && p !== 'ADV') c = withAmb(c, row, p, ref);
      if ((p === 'ORACLE' || p === 'OVERCLAIM') && textSame) { const st = storedVariantMock(p, id); checks.heuristic_compared++;
        if (JSON.stringify(JSON.parse(c).observations) === JSON.stringify(JSON.parse(st).observations)) checks.heuristic_equal_to_study++; else checks.heuristic_differing.push(p + '/' + id); }
      const body = envelope(c, p, id, p === 'ADV' ? null : ref, p === 'ADV' ? 'tests/paired-suite.mjs advCandidate (0.3.4 markers)' : p.endsWith('-R') ? 'study tools/mock-aligned.mjs on 0.3.4 units' : 'study tools/mock-candidates.mjs');
      mock4[p].push(JSON.stringify({ variant_id: id, sha256: sha(body), body }));
    }
    if (type === 'V5') for (const p of POL3) {
      let c = p.endsWith('-R') ? alignedCandidate(row.text, E3.research, ref, p, V3) : mockCandidate(row.text, ref, p, V3);
      const body = envelope(c, p, id, ref, p.endsWith('-R') ? 'tools/mock-aligned.mjs' : 'tools/mock-candidates.mjs');   // the study's own provenance strings
      if (textSame) { checks.for033_compared++; const st = studyMockBody(p, id); if (st === body) checks.for033_equal_to_study_body++; else checks.for033_differing.push(p + '/' + id); }
      mock3[p].push(JSON.stringify({ variant_id: id, sha256: sha(body), body }));
    }
  }
});
function studyMockBody(p, id) {
  if (!studyMockBody.cache) studyMockBody.cache = {};
  if (!studyMockBody.cache[p]) studyMockBody.cache[p] = new Map(readFileSync(join(STUDY, 'mocks-variants', p + '.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.variant_id, o.body]; }));
  return studyMockBody.cache[p].get(id) || null;
}
const r4 = i4.release(), r3 = i3.release();
mkdirSync(join(PKG, 'variants-v2')); mkdirSync(join(PKG, 'mocks-variants-v2', 'for-0.3.3'), { recursive: true });
const vfile = lines.join('\n') + '\n';
writeFileSync(join(PKG, 'variants-v2', 'VARIANTS_V2.jsonl'), vfile, { flag: 'wx' });
const mockFiles = {}, mockFiles033 = {};
for (const p of POL4) { const b = mock4[p].join('\n') + '\n'; writeFileSync(join(PKG, 'mocks-variants-v2', p + '.jsonl'), b, { flag: 'wx' }); mockFiles[p] = { sha256: sha(b), rows: mock4[p].length }; }
for (const p of POL3) { const b = mock3[p].join('\n') + '\n'; writeFileSync(join(PKG, 'mocks-variants-v2', 'for-0.3.3', p + '.jsonl'), b, { flag: 'wx' }); mockFiles033[p] = { sha256: sha(b), rows: mock3[p].length }; }
const index = { format: 'jrs-0.3.4-variant-index/2.0.0', spec_version: VARIANT_SPEC_VERSION, built_at_utc: new Date().toISOString(),
  generator_sha256: sha(readFileSync(join(PKG, 'tools', 'variant-spec-v2.mjs'))), study_variants_file_sha256: sha(studyLines.join('\n') + '\n'),
  base_records: substantive.length, variant_rows: lines.length, constructible: lines.filter((l) => JSON.parse(l).constructible).length,
  variants_file: { path: 'variants-v2/VARIANTS_V2.jsonl', sha256: sha(vfile) }, mock_files: mockFiles, mock_files_for_0_3_3: mockFiles033, by_type: table, v5_changes: v5changes, checks,
  engines: { '0.3.4-research-candidate': { snapshot_sha256: i4.snapshot_sha256, released: r4 }, '0.3.3-research-candidate': { manifest_sha256: i3.manifest_sha256, released: r3 } }, network_attempts: attempts.length,
  note: 'Variant texts come from fixed transforms that import no Engine code. Designed references for variants are AI-authored construction intent, not human findings. Mock candidates are not model output. Every variant is exposed development material for 0.3.4.' };
writeFileSync(join(PKG, 'variants-v2', 'VARIANT_INDEX_V2.json'), JSON.stringify(index, null, 2) + '\n', { flag: 'wx' });
console.log('variants', lines.length, 'constructible', index.constructible, JSON.stringify(Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v.constructible]))), 'V5 changes', v5changes.length, JSON.stringify(checks).slice(0, 400), 'network', attempts.length);
