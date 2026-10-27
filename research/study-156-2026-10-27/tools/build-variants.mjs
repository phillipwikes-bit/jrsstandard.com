// 156-record study: writes the eight predefined variants of every eligible record, and their mock candidates, before
// the freeze, so the frozen inputs are hashed files rather than code paths. Offline; imports no Engine code except
// the research profile module, read-only, for the rule-aligned mock policies (circular by design, as in build-mocks).
//   variants/VARIANTS.jsonl                 one line per variant (text, construction, designed reference)
//   mocks-variants/<POLICY>.jsonl           one line per constructible variant (mock envelope and its hash)
//   variants/VARIANT_INDEX.json             counts, file hashes, constructibility
// V8 mocks carry one extra observation, AMB-1, quoting the repeated sentence without a disambiguator.
// Usage: node tools/build-variants.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVariant, VARIANT_TYPES, VARIANT_NAMES, VARIANT_SPEC_VERSION } from './variant-spec.mjs';
import { mockCandidate } from './mock-candidates.mjs';
import { alignedCandidate } from './mock-aligned.mjs';
const R = await import('../candidate/lib/engine-evidence-graph-v0.3.3-research-candidate/research-profile.mjs');

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
for (const d of ['variants', 'mocks-variants']) if (existsSync(join(PKG, d))) { console.error(d + ' exists; it is preserved, not rebuilt'); process.exit(2); }
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const CONTRACT = 'jrs-engine-local-0.3.0-evidence-graph', PROMPT = 'jrs-engine-local-0.3.3-research/prompt-1';
const POLICIES = ['ORACLE', 'OVERCLAIM', 'ORACLE-R', 'OVERCLAIM-R'];
const SIZE_LIMIT = 8000;
const eligible = inv.entries.filter((e) => e.full_text_available && e.scope_class === 'NOT_EXCLUDED');
const lines = [], mockLines = Object.fromEntries(POLICIES.map((p) => [p, []])), table = {};
eligible.forEach((e, index) => {
  const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(text) !== e.extracted_text_sha256) throw new Error('record hash mismatch ' + e.source_id);
  const base = { text, e1: e.reference_findings[0].value, chronology_conflict: !!(e.links && e.links.type === 'S') };
  for (const type of VARIANT_TYPES) {
    const v = buildVariant(type, base, index);
    const id = e.source_id + '~' + type;
    const row = { variant_id: id, base_id: e.source_id, type, name: VARIANT_NAMES[type], cohort: e.cohort, partition: e.partition || 'original', family: (e.links && e.links.family) || null,
      base_construction_type: (e.links && e.links.type) || null, base_reference: base.e1, constructible: v.constructible };
    table[type] = table[type] || { constructible: 0, not_constructible: [] };
    if (!v.constructible) { row.reason = v.reason; table[type].not_constructible.push(e.source_id + ': ' + v.reason); lines.push(JSON.stringify(row)); continue; }
    if (v.text.length > SIZE_LIMIT) throw new Error('variant over the local size limit ' + id);
    table[type].constructible++;
    Object.assign(row, { construction: v.construction, designed: v.designed, quote: v.quote || null, text: v.text, text_sha256: sha(v.text), length_utf16: v.text.length });
    lines.push(JSON.stringify(row));
    const ref = { e1: v.designed.e1, chronology_conflict: !!v.designed.chronology_conflict };
    for (const p of POLICIES) {
      const c = p.endsWith('-R') ? alignedCandidate(v.text, R, ref, p, { contractVersion: CONTRACT, promptVersion: PROMPT }) : mockCandidate(v.text, ref, p, { contractVersion: CONTRACT, promptVersion: PROMPT });
      let cand = c;
      if (type === 'V8') {
        const o = JSON.parse(c);
        const st = p.startsWith('OVERCLAIM') ? 'supported' : ref.e1 === 'GROUNDED' ? 'supported' : 'gap';
        o.observations = o.observations.slice(0, 24).concat([{ observation_id: 'AMB-1', condition_id: 'identifiable_basis', proposed_status: st, quote: v.quote.text, assertion_type: v.quote.assertion_type }]);
        cand = JSON.stringify(o, null, 2);
      }
      const env = { envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: cand }], model: 'MOCK-POLICY-' + p + '-NOT-A-MODEL', usage: { input_tokens: 0, output_tokens: 0 } },
        provenance: { response_origin: 'mock_policy_fixture', policy: p, generator: p.endsWith('-R') ? 'tools/mock-aligned.mjs' : 'tools/mock-candidates.mjs', variant: id, reference_used: ref } };
      const body = JSON.stringify(env);
      mockLines[p].push(JSON.stringify({ variant_id: id, sha256: sha(body), body }));
    }
  }
});
mkdirSync(join(PKG, 'variants')); mkdirSync(join(PKG, 'mocks-variants'));
const vfile = lines.join('\n') + '\n';
writeFileSync(join(PKG, 'variants', 'VARIANTS.jsonl'), vfile, { flag: 'wx' });
const mockFiles = {};
for (const p of POLICIES) { const b = mockLines[p].join('\n') + '\n'; writeFileSync(join(PKG, 'mocks-variants', p + '.jsonl'), b, { flag: 'wx' }); mockFiles[p] = { sha256: sha(b), rows: mockLines[p].length }; }
const index = { format: 'jrs-study-156-variant-index/1.0.0', spec_version: VARIANT_SPEC_VERSION, built_at_utc: new Date().toISOString(), generator_sha256: sha(readFileSync(join(PKG, 'tools', 'variant-spec.mjs'))),
  base_records: eligible.length, variant_rows: lines.length, constructible: lines.filter((l) => JSON.parse(l).constructible).length,
  variants_file: { path: 'variants/VARIANTS.jsonl', sha256: sha(vfile) }, mock_files: mockFiles, by_type: table,
  note: 'Variant texts are generated by fixed transforms that import no Engine code. Designed references for variants are AI-authored construction intent, not human findings. Mock candidates are not model output.' };
writeFileSync(join(PKG, 'variants', 'VARIANT_INDEX.json'), JSON.stringify(index, null, 2) + '\n', { flag: 'wx' });
console.log('variants', lines.length, 'constructible', index.constructible, JSON.stringify(Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v.constructible]))));
