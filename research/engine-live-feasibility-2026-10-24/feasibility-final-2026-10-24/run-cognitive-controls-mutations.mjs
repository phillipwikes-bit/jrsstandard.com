// Mutation check for the cognitive-controls validator. Each mutation removes one
// validator control in a temporary copy and reruns the 15 tests.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2];
const V = 'COGNITIVE_CONTROLS_VALIDATOR.mjs';
const M = [
  ['CM01', 'Pair check skipped', V, '  if (!pc.ok) return', '  if (false) return', ['CC-02', 'CC-03', 'CC-04', 'CC-05']],
  ['CM02', 'Override-key check removed', V, "  if (override) return reject('engine_output_override_attempt', { at: override.path });", '', ['CC-12']],
  ['CM03', 'Unsupported support claim allowed', V, "if (s.quote_semantically_supports === 'yes' && f.status !== 'supported')", 'if (false)', ['CC-07']],
  ['CM04', 'Uncertainty treatment not required', V, "if (typeof note.uncertainty_treatment !== 'string' || !note.uncertainty_treatment.trim())", 'if (false)', ['CC-08']],
  ['CM05', 'Escalation treatment not required', V, "if (!esc || typeof esc.escalate !== 'boolean' || typeof esc.reason !== 'string' || !esc.reason.trim())", 'if (false)', ['CC-09']],
  ['CM06', 'Outcome forced to observed', V, "const outcome = states.includes('review_blocked')", "const outcome = 'observed'; const unusedOutcome = states.includes('review_blocked')", ['CC-10', 'CC-11', 'CC-15']],
  ['CM07', 'Prohibited-term check removed', V, '  if (bad) return reject(\'prohibited_characterization\');', '', ['CC-13']],
  ['CM08', 'Misreported status allowed', V, 'if (s.graph_status_observed !== f.status)', 'if (false)', ['CC-14']],
  ['CM09', 'Control presence not required', V, "    if (!c) return reject('control_missing:' + id);", "    if (!c) continue;", ['CC-06']],
];
const results = [];
for (const [id, desc, file, from, to, expect] of M) {
  const tmp = mkdtempSync(join(HERE, '..', 'mut-'));
  const h = join(tmp, 'a');
  for (const p of ['harness-v2', 'cognitive-controls-fixtures', 'COGNITIVE_CONTROLS_VALIDATOR.mjs', 'COGNITIVE_CONTROLS_REVIEW_FORM.json', 'run-cognitive-controls-tests.mjs']) cpSync(join(HERE, p), join(h, p), { recursive: true });
  const p = join(h, file);
  const t = readFileSync(p, 'utf8');
  const applied = t.includes(from);
  writeFileSync(p, t.split(from).join(to));
  let failed = [];
  try {
    execFileSync(process.execPath, [join(h, 'run-cognitive-controls-tests.mjs'), join(tmp, 'r.json')], { stdio: 'pipe', env: {} });
    failed = JSON.parse(readFileSync(join(tmp, 'r.json'), 'utf8')).tests.filter((x) => x.result !== 'pass').map((x) => x.id);
  } catch (e) { failed = ['RUN_ERROR:' + String(e.message).slice(0, 120)]; }
  results.push({ id, description: desc, applied, expected_failures: expect, observed_failures: failed, detected: applied && expect.every((x) => failed.includes(x)) });
  rmSync(tmp, { recursive: true, force: true });
  if (existsSync(tmp)) throw new Error('mutation_tmp_not_deleted');
}
writeFileSync(OUT, JSON.stringify({ mutations: results, all_detected: results.every((r) => r.detected) }, null, 2));
for (const r of results) console.log(r.id, r.detected ? 'detected' : 'NOT DETECTED', JSON.stringify(r.observed_failures));
