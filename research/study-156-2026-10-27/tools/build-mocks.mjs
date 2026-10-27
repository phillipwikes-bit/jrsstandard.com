// 156-record study: writes every mock candidate used by the scored runs, before the freeze, so the frozen inputs
// are files with hashes rather than code paths. Offline; imports no Engine code.
//   mocks/<POLICY>/<id>.json          research prompt label (research-profile arms A3 to A5)
//   mocks/ORACLE-default/<id>.json    default prompt label (counterfactual default-profile arm A6)
//   mocks/ORACLE-R, OVERCLAIM-R       rule-aligned quotations, circular by design (arms A3R, A4R)
// Only records eligible for substantive research-profile runs get mocks (scope class NOT_EXCLUDED).
// Usage: node tools/build-mocks.mjs
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mockCandidate, POLICIES } from './mock-candidates.mjs';
import { alignedCandidate, ALIGNED_POLICIES } from './mock-aligned.mjs';
// The rule-aligned policies read the research profile module (read-only) to choose their quotations.
const R = await import('../candidate/lib/engine-evidence-graph-v0.3.3-research-candidate/research-profile.mjs');

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const sha = (s) => createHash('sha256').update(s).digest('hex');
if (existsSync(join(PKG, 'mocks'))) { console.error('mocks exist; they are preserved, not rebuilt'); process.exit(2); }
const inv = JSON.parse(readFileSync(join(PKG, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const CONTRACT = 'jrs-engine-local-0.3.0-evidence-graph', RESEARCH_PROMPT = 'jrs-engine-local-0.3.3-research/prompt-1', DEFAULT_PROMPT = 'jrs-engine-local-0.3.0/prompt-1';
const eligible = inv.entries.filter((e) => e.full_text_available && e.scope_class === 'NOT_EXCLUDED');
const rows = [];
for (const e of eligible) {
  const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  if (sha(text) !== e.extracted_text_sha256) throw new Error('record hash mismatch ' + e.source_id);
  const ref = { e1: e.reference_findings[0].value, chronology_conflict: !!(e.links && e.links.type === 'S') };
  const out = [...POLICIES.map((p) => [p, RESEARCH_PROMPT]), ['ORACLE-default', DEFAULT_PROMPT], ...ALIGNED_POLICIES.map((p) => [p, RESEARCH_PROMPT])];
  for (const [label, prompt] of out) {
    const policy = label.replace('-default', '');
    const c = ALIGNED_POLICIES.includes(label) ? alignedCandidate(text, R, ref, label, { contractVersion: CONTRACT, promptVersion: prompt }) : mockCandidate(text, ref, policy, { contractVersion: CONTRACT, promptVersion: prompt });
    const dir = join(PKG, 'mocks', label); mkdirSync(dir, { recursive: true });
    const env = { envelope: { status: 'ok', stop_reason: 'end_turn', content: [{ type: 'text', text: c }], model: 'MOCK-POLICY-' + label + '-NOT-A-MODEL', usage: { input_tokens: 0, output_tokens: 0 } },
      provenance: { response_origin: 'mock_policy_fixture', policy: label, generator: 'tools/mock-candidates.mjs', reference_used: ref } };
    const body = JSON.stringify(env, null, 2) + '\n';
    writeFileSync(join(dir, e.source_id + '.json'), body, { flag: 'wx' });
    rows.push({ id: e.source_id, policy: label, sha256: sha(body), observations: JSON.parse(c).observations.length });
  }
}
writeFileSync(join(PKG, 'mocks', 'MOCK_INDEX.json'), JSON.stringify({ format: 'jrs-study-156-mock-index/1.0.0', built_at_utc: new Date().toISOString(), records: eligible.length, policies: [...POLICIES, 'ORACLE-default', ...ALIGNED_POLICIES], files: rows.length,
  note: 'Mock policy fixtures, not model output. ORACLE is told the reference label; OVERCLAIM and UNDERCLAIM are told nothing but their policy. The -R policies choose quotations with the research rules themselves (circular, a ceiling only).', rows }, null, 2) + '\n', { flag: 'wx' });
console.log('mocks', rows.length, 'for', eligible.length, 'records');
