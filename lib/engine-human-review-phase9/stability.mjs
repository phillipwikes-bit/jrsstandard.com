// JRS PHASE 9: stability of the human-review packet under transforms that should not change it.
//
// For each transform the target dossier is rebuilt and compared with its base. The review rank is
// 0 (escalation required), 1 (Engine status not supported, no escalation) or 2 (Engine status
// supported, no escalation). An invariant transform must not raise the rank, change the Engine
// status, drop an escalation trigger or change the route. Synthetic metamorphic checks only; not a
// robustness or reliability result.

import { compileCase, blindedPacket, reviewRank } from './rehearsal.mjs';
import { validateDossier } from './dossier.mjs';

export const STABILITY_STATEMENT = 'Synthetic metamorphic checks in a limited local context. Not a robustness, reliability, accuracy or validation result.';

function view(c, compile) {
  const g = compileCase(c, compile), d = blindedPacket(c, g).dossier;
  return { rank: reviewRank(d), status: d.engine_result.status, triggers: d.escalation.triggers.map((t) => t.id), routed: d.engine_result.routed_to_review, route: d.review_route, valid: !validateDossier(d).length };
}

// transforms: [{ id, name, base, make(case) -> case }]; bases: { packet_id: case }
export function runStability(transforms, bases, compile) {
  const cache = {};
  const results = transforms.map((t) => {
    const b = bases[t.base];
    if (!b) return { transform_id: t.id, result: 'unexpected', mismatches: ['base not found'] };
    let v0, v1;
    try { v0 = cache[t.base] || (cache[t.base] = view(b, compile)); v1 = view(t.make(JSON.parse(JSON.stringify(b))), compile); }
    catch (e) { return { transform_id: t.id, result: 'unexpected', mismatches: ['compile error: ' + String(e.message).slice(0, 200)] }; }
    const P = [];
    if (v1.rank > v0.rank) P.push('more favourable human-review class (' + v0.rank + ' -> ' + v1.rank + ')');
    if (v1.status !== v0.status) P.push('Engine status changed ' + v0.status + ' -> ' + v1.status);
    if (v0.triggers.some((x) => !v1.triggers.includes(x))) P.push('escalation trigger dropped');
    if (JSON.stringify(v0.triggers) !== JSON.stringify(v1.triggers)) P.push('escalation triggers changed');
    if (v1.routed !== v0.routed || v1.route !== v0.route) P.push('route changed');
    if (!v1.valid) P.push('transformed dossier invalid');
    return { transform_id: t.id, name: t.name, base: t.base, base_rank: v0.rank, base_unfavourable_or_escalation: v0.rank < 2, rank: v1.rank, more_favourable: v1.rank > v0.rank,
      result: P.length ? 'unexpected' : 'as_expected', mismatches: P };
  });
  return { statement: STABILITY_STATEMENT, total: results.length, as_expected: results.filter((r) => r.result === 'as_expected').length,
    from_unfavourable_or_escalation: results.filter((r) => r.base_unfavourable_or_escalation).length, more_favourable: results.filter((r) => r.more_favourable).length, results };
}
