// JRS PHASE 7: scenario schema, admission and evaluation.
//
// Phase 7 scenarios use the Phase 6 expectation vocabulary and universal
// invariants unchanged (imported, not copied), plus a rule link, a role
// (positive, benign, malformed, duplicate_or_reordered), an expected
// limitation, an expected route and a differential expectation against frozen
// v0.3. Expectations are sealed before the candidate is run.

import { checkExpectation, universalInvariants, submissionFor } from '../../../lib/engine-reliability/library.mjs';
import { findForbiddenStatusWord, RANK } from '../../../lib/engine-reliability/vocab.mjs';
import { recordFromGraph } from '../../../lib/engine-reliability/baseline.mjs';

export const P7_FORMAT = 'jrs-phase7-scenario/0.7.0';
export const P7_MARKER = 'SYNTHETIC ENGINEERING FIXTURE.';
export const P7_PROVENANCE = 'Authored for local engineering only by the Phase 7 session on 2026-10-19. Synthetic; no real person, employer, customer or case. Not independent, real-world or holdout material.';
export const AREAS = Object.freeze({ R07: { name: 'p6_rt_07_safe_routing', minimum: 6 }, CHR: { name: 'chronology_controls', minimum: 14 }, NEG: { name: 'negated_and_ambiguous_reasoning', minimum: 8 },
  EVL: { name: 'evidence_link_abstention', minimum: 8 }, CON: { name: 'conflict_controls', minimum: 6 }, SCO: { name: 'scope_excluded_domain', minimum: 6 } });
export const ROLES = Object.freeze(['positive', 'benign', 'malformed', 'duplicate_or_reordered']);
export const RULE_IDS = Object.freeze(['RP-STR-01', 'RP-CHR-01', 'RP-CHR-02', 'RP-CHR-03', 'RP-CHR-04', 'RP-NEG-01', 'RP-EVL-01', 'RP-CON-01', 'RP-SCO-01']);
const KEYS = ['library_format_version', 'scenario_id', 'area', 'rule_id', 'role', 'synthetic_marker', 'provenance_note', 'expected_safe_behavior', 'limitation', 'expected_limitation_kinds',
  'expected_route', 'differential', 'record_text', 'candidate_response_text', 'execution_mode', 'expected'];

export function validateP7Scenario(s, seen = new Set()) {
  const p = [];
  for (const k of KEYS) if (s[k] === undefined) p.push('missing ' + k);
  if (s.library_format_version !== P7_FORMAT) p.push('format mismatch');
  const m = /^P7-([A-Z0-9]{3})-(\d{2})$/.exec(String(s.scenario_id));
  if (!m || !AREAS[m[1]]) p.push('scenario_id not P7-<area>-NN'); else if (AREAS[m[1]].name !== s.area) p.push('area does not match the identifier');
  if (seen.has(s.scenario_id)) p.push('duplicate scenario_id');
  if (!RULE_IDS.includes(s.rule_id)) p.push('unknown rule_id');
  if (!ROLES.includes(s.role)) p.push('unknown role');
  if (s.synthetic_marker !== P7_MARKER || typeof s.record_text !== 'string' || !s.record_text.startsWith(P7_MARKER)) p.push('synthetic marker missing');
  if (s.provenance_note !== P7_PROVENANCE) p.push('provenance note altered');
  for (const f of ['expected_safe_behavior', 'limitation']) { if (typeof s[f] !== 'string' || s[f].length < 20) p.push(f + ' too short'); const w = findForbiddenStatusWord(s[f]); if (w) p.push(f + ' uses ' + w); }
  if (!['human_review', 'refusal'].includes(s.expected_route)) p.push('expected_route must be human_review or refusal');
  if (!s.differential || !['unchanged', 'intended', 'base_error'].includes(s.differential.mode) || !Array.isArray(s.differential.rules)) p.push('differential malformed');
  else if (s.differential.mode !== 'unchanged' && !s.differential.rules.length) p.push('intended differential names no rule');
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(s.record_text || '')) p.push('personal-data-like text');
  return p;
}

export function evaluateP7(g, s) {
  const mismatches = checkExpectation(g, s.expected), violations = universalInvariants(g);
  const rec = recordFromGraph(g, { scenarioId: s.scenario_id, pkg: 'phase7-candidate' });
  for (const [c, kinds] of Object.entries(s.expected_limitation_kinds)) for (const k of kinds) if (!rec.conditions[c] || !rec.conditions[c].limitation_kinds.includes(k)) mismatches.push('expected limitation ' + c + ':' + k + ' missing');
  const refused = g.intake.decision !== 'proceed' || g.candidate.valid === false;
  if (s.expected_route === 'refusal' && !(refused && Object.values(rec.conditions).every((f) => f.status === 'not_assessed'))) mismatches.push('expected a refusal route');
  if (s.expected_route === 'human_review' && refused) mismatches.push('expected a human-review route, got a refusal');
  return { scenario_id: s.scenario_id, rule_id: s.rule_id, role: s.role, result: mismatches.length || violations.length ? 'unexpected' : 'as_expected', mismatches, universal_violations: violations,
    statuses: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status])), gate: g.intake.decision, conflicts: g.conflicts.map((k) => k.kind), graph_sha256: g.identity.graph_sha256 };
}

export { submissionFor, RANK };
