// JRS PHASE 7: the candidate input manifest.
//
// Every existing v0.3-family synthetic input, read without modification:
// GC (v0.3 fixtures), AR (Phase 4 corpus), Phase 4 stability transforms,
// Phase 6 regression library and Phase 6 input-level stability transforms,
// plus the Phase 7 scenarios. Output-damage transforms are not inputs.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, sha } from '../../../lib/engine-reliability/canonical.mjs';

export const REPO = fileURLToPath(new URL('../../../', import.meta.url));
export const P7 = join(REPO, 'research/engine-remediation-phase7-2026-10-19');
const readCase = (dir, id) => {
  const sub = JSON.parse(readFileSync(join(dir, id + '.submission.json'), 'utf8'));
  if (typeof sub.record_text === 'string' && sub.record_text.startsWith('@file:')) sub.record_text = readFileSync(join(dir, sub.record_text.slice(6)), 'utf8');
  let response = null; try { response = readFileSync(join(dir, id + '.candidate-response.txt'), 'utf8'); } catch { /* deterministic case */ }
  return { submission: sub, response, expected: JSON.parse(readFileSync(join(dir, id + '.expected.json'), 'utf8')) };
};

export async function existingInputs() {
  const out = [];
  const add = (id, family, submission, response, mode) => out.push({ id, family, submission, response, mode });
  const GC = join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures');
  for (const f of JSON.parse(readFileSync(join(GC, 'FIXTURE_REGISTER.json'), 'utf8')).fixtures) { const c = readCase(join(GC, 'cases'), f.id); add(f.id, 'v0.3-fixture', c.submission, c.response, c.expected.execution_mode); }
  const AR = join(REPO, 'research/adaptive-reliability-2026-10-13/corpus-expansion');
  for (const f of JSON.parse(readFileSync(join(AR, 'FIXTURE_REGISTER.json'), 'utf8')).fixtures) { const c = readCase(join(AR, 'cases'), f.id); add(f.id, 'phase4-corpus', c.submission, c.response, c.expected.execution_mode); }
  // Phase 4 stability transforms: inputs captured through the laboratory's own runner.
  const ST4 = await import('../../../lib/engine-change-control/stability.mjs');
  const TR4 = await import('../../adaptive-reliability-2026-10-13/stability-laboratory/transforms.mjs');
  const ids4 = new Set(TR4.TRANSFORMS.map((t) => t.id)), cap4 = [];
  ST4.runStabilityLab(TR4.TRANSFORMS, TR4.BASES, (a) => { if (ids4.has(a.fixtureId)) cap4.push(JSON.parse(JSON.stringify(a))); return stub(a); }, '2026-10-13T00:00:00Z');
  for (const a of cap4) add(a.fixtureId, 'phase4-stability', a.submission, a.candidateResponseText, a.executionMode);
  // Phase 6 library.
  const L = await import('../../../lib/engine-reliability/library.mjs');
  const LIB = join(REPO, 'research/engine-reliability-phase6-2026-10-17/regression-library/scenarios');
  for (const f of readdirSync(LIB).filter((x) => x.endsWith('.json')).sort()) { const s = JSON.parse(readFileSync(join(LIB, f), 'utf8')); add(s.scenario_id, 'phase6-library', L.submissionFor(s), s.candidate_response_text, s.execution_mode); }
  // Phase 6 input-level stability transforms.
  const TR6 = await import('../../engine-reliability-phase6-2026-10-17/stability-laboratory/transforms.mjs');
  for (const t of TR6.TRANSFORMS.filter((x) => x.make)) {
    const b = TR6.BASES[t.base]; const m = t.make({ record: b.record_text, response: b.candidate_response_text });
    add(t.id, 'phase6-stability', Object.assign(L.submissionFor(b), { record_text: m.record !== undefined ? m.record : b.record_text }), m.response !== undefined ? m.response : b.candidate_response_text, b.execution_mode);
  }
  return out;
}

// A stub graph lets the Phase 4 laboratory runner complete while inputs are captured; its results are discarded.
function stub(a) {
  return { findings: [], refusals: [], conflicts: [], cognitive_controls: [], nodes: [], edges: [], intake: { decision: 'proceed' }, record_instruction_risk: 'not_detected', identity: { graph_sha256: 'stub' } };
}

export function phase7Inputs() {
  const D = join(P7, 'scenarios/cases');
  const L = { submissionFor: null };
  return readdirSync(D).filter((x) => x.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(D, f), 'utf8')));
}

export const inputHash = (i) => sha(canonical({ submission: i.submission, response: i.response, mode: i.mode }));
