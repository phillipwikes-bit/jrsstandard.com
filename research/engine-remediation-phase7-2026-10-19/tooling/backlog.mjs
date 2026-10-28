// JRS PHASE 7: append-only, hash-chained remediation backlog.
import { canonical, sha } from '../../../lib/engine-reliability/canonical.mjs';
import { findForbiddenStatusWord } from '../../../lib/engine-reliability/vocab.mjs';

export const GENESIS = 'sha256:' + '0'.repeat(64);
export const FIELDS = Object.freeze(['entry_id', 'date', 'defect_ref', 'considered', 'decision', 'reason', 'evidence_required_for_future_change', 'regression_tests_required',
  'independent_evaluation_required_before_stronger_claim', 'owner_decision_required', 'prev_hash', 'entry_hash']);
export const DECISIONS = Object.freeze(['included', 'deferred', 'rejected', 'DEFERRED_PENDING_OWNER_DECISION']);
const hashOf = (e) => sha(canonical(Object.assign({}, e, { entry_hash: undefined })));
export const parse = (t) => String(t).split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

export function validateBacklog(text) {
  const p = []; let prev = GENESIS; const ids = new Set();
  parse(text).forEach((e, i) => {
    for (const f of FIELDS) if (e[f] === undefined || e[f] === '') p.push((i + 1) + ': missing ' + f);
    for (const f of Object.keys(e)) if (!FIELDS.includes(f)) p.push((i + 1) + ': undeclared field ' + f);
    if (!DECISIONS.includes(e.decision)) p.push((i + 1) + ': unknown decision');
    if (typeof e.independent_evaluation_required_before_stronger_claim !== 'boolean') p.push((i + 1) + ': independent evaluation flag must be boolean');
    if (e.prev_hash !== prev) p.push((i + 1) + ': chain broken');
    if (e.entry_hash !== hashOf(e)) p.push((i + 1) + ': entry hash mismatch');
    if (ids.has(e.entry_id)) p.push((i + 1) + ': duplicate id'); ids.add(e.entry_id);
    const w = findForbiddenStatusWord(JSON.stringify(Object.assign({}, e, { prev_hash: undefined, entry_hash: undefined }))); if (w) p.push((i + 1) + ': forbidden word ' + w);
    prev = e.entry_hash;
  });
  return p;
}
export function append(text, entry) {
  const es = parse(text); const e = Object.assign({}, entry, { prev_hash: es.length ? es[es.length - 1].entry_hash : GENESIS }); delete e.entry_hash; e.entry_hash = hashOf(e);
  const next = (text && !String(text).endsWith('\n') ? text + '\n' : String(text)) + JSON.stringify(e) + '\n';
  const p = validateBacklog(next); if (p.length) throw new Error('backlog entry refused: ' + p.join('; '));
  return next;
}
export const appendOnly = (before, after) => String(after).startsWith(String(before)) && validateBacklog(after).length === 0;
