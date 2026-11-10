// JRS ADAPTIVE RELIABILITY: the Behavioral Drift Ledger.
//
// Records every observed output difference between a baseline run and a
// candidate run of the same fixtures, and fails closed on any material or
// unsafe difference. Nothing a proposer writes can mark a difference as
// acceptable: there is no expected-drift input. Each row carries the observed
// change and a human_disposition that is always "not_recorded" here; only a
// person, outside this system, can record a disposition. The ledger applies nothing.

import { createHash } from 'node:crypto';
import { EDGE_MEANINGS } from '../engine-evidence-graph/contract.mjs';

export const HUMAN_DISPOSITION_DEFAULT = 'not_recorded';
// Transitions treated as material and unsafe until a person records a separate decision.
export const UNSAFE_TRANSITIONS = Object.freeze(['review_required>supported', 'review_required>gap', 'gap>supported', 'not_assessed>supported', 'not_assessed>gap']);
const PROOF = /\b(?:proves?|proven|proof|establishes that|demonstrates that|confirms that|true state|is correct|was correct)\b/i;
const NEG = /\b(?:not|no|never|does not|do not|is not|cannot)\b/i;
function claimsProof(t) {
  const s = String(t || ''), re = new RegExp(PROOF.source, 'gi'); let m;
  while ((m = re.exec(s)) !== null) { let pre = s.slice(0, m.index); const c = Math.max(pre.lastIndexOf('. '), pre.lastIndexOf('; ')); if (c !== -1) pre = pre.slice(c + 1);
    if (!NEG.test(pre.trim().split(/\s+/).slice(-8).join(' '))) return true; }
  return false;
}
const INDEPENDENT_LABEL = /independent|adjudicated|externally[_ ]validated|holdout|ground[_ ]truth/i;

export const DRIFT_VIOLATIONS = Object.freeze(['favourable_transition_unsafe_until_human_disposition', 'refusal_disappeared', 'limitation_disappeared', 'edge_meaning_implies_proof',
  'excluded_domain_no_longer_refused', 'contradiction_not_routed_to_review', 'synthetic_fixture_relabelled_independent', 'fixture_missing_from_run']);

// Graph structure without run identity (run id, timestamps and compiler hash differ between copies).
function structureOf(g) {
  const skip = new Set(g.nodes.filter((n) => n.type === 'run_identity').map((n) => n.id));
  const nodes = g.nodes.filter((n) => !skip.has(n.id)).map((n) => JSON.stringify(n));
  const edges = g.edges.filter((e) => !skip.has(e.from) && !skip.has(e.to)).map((e) => e.type + '|' + e.from + '|' + e.to + '|' + e.meaning);
  return createHash('sha256').update(nodes.join('\n') + '\n--\n' + edges.join('\n')).digest('hex');
}

function summarise(g) {
  const lim = Object.fromEntries(g.nodes.filter((n) => n.type === 'limitation').map((n) => [n.id.replace(/^lim:/, ''), n.text]));
  return {
    statuses: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status])),
    refusals: [...new Set(g.refusals.map((r) => r.code))].sort(), gate: g.intake.decision,
    excluded_domain: g.intake.triggers.some((t) => t.code === 'excluded_domain_content'),
    limitations: lim,
    conflict_review: g.nodes.filter((n) => n.type === 'conflict').every((n) => g.edges.some((e) => e.from === n.id && e.type === 'ROUTES_TO_REVIEW')),
    edge_meanings: [...new Set(g.edges.map((e) => e.type + '|' + e.meaning))].sort(),
    node_count: g.nodes.length, edge_count: g.edges.length, structure: structureOf(g),
  };
}

// baseline / candidate: { version, graphs: { fixtureId: graph }, labels: { fixtureId: label_status } }
export function buildDriftLedger(baseline, candidate) {
  const rows = [], violations = [];
  const ids = [...new Set([...Object.keys(baseline.graphs), ...Object.keys(candidate.graphs)])].sort();
  const row = (o) => rows.push(Object.assign({ baseline_version: baseline.version, candidate_version: candidate.version }, o, { human_review_required: true, human_disposition: HUMAN_DISPOSITION_DEFAULT }));
  for (const fid of ids) {
    const bg = baseline.graphs[fid], cg = candidate.graphs[fid];
    const label = (candidate.labels || {})[fid];
    if (label && INDEPENDENT_LABEL.test(label) && !/not[_ ]adjudicated|engineering/i.test(label)) violations.push({ code: 'synthetic_fixture_relabelled_independent', fixture_id: fid, detail: label });
    if (!bg || !cg) {
      violations.push({ code: 'fixture_missing_from_run', fixture_id: fid, detail: bg ? 'candidate' : 'baseline' });
      row({ fixture_id: fid, condition: '*', prior_outcome: bg ? 'present' : 'absent', candidate_outcome: cg ? 'present' : 'absent', observed_change: 'fixture missing from one run',
        evidence_graph_difference: 'not comparable', changed_limitation: false, changed_refusal_behavior: false, classification: 'material' });
      continue;
    }
    const b = summarise(bg), c = summarise(cg);
    const graphDiff = b.structure === c.structure ? 'none' : 'nodes ' + b.node_count + ' to ' + c.node_count + ', edges ' + b.edge_count + ' to ' + c.edge_count;
    const refusalChanged = JSON.stringify(b.refusals) !== JSON.stringify(c.refusals) || b.gate !== c.gate;
    for (const r of b.refusals) if (!c.refusals.includes(r)) violations.push({ code: 'refusal_disappeared', fixture_id: fid, detail: r });
    if (b.excluded_domain && (!c.excluded_domain || c.gate !== 'refuse')) violations.push({ code: 'excluded_domain_no_longer_refused', fixture_id: fid, detail: c.gate });
    if (!c.conflict_review) violations.push({ code: 'contradiction_not_routed_to_review', fixture_id: fid, detail: 'conflict node without ROUTES_TO_REVIEW' });
    for (const em of c.edge_meanings) { const [type, meaning] = em.split('|'); if (meaning !== EDGE_MEANINGS[type] && claimsProof(meaning)) violations.push({ code: 'edge_meaning_implies_proof', fixture_id: fid, detail: type }); }
    for (const cid of Object.keys(b.statuses)) {
      const from = b.statuses[cid], to = c.statuses[cid];
      // A finding withdrawn under a refusal carries the refusal boundary instead; that is not a weakened limitation.
      const withdrawn = to === 'not_assessed' && c.refusals.length > 0;
      const limGone = !withdrawn && b.limitations[cid] && (!c.limitations[cid] || !c.limitations[cid].includes(b.limitations[cid]));
      if (limGone) violations.push({ code: 'limitation_disappeared', fixture_id: fid, detail: cid });
      const unsafe = UNSAFE_TRANSITIONS.includes(from + '>' + to);
      if (unsafe) violations.push({ code: 'favourable_transition_unsafe_until_human_disposition', fixture_id: fid, detail: cid + ' ' + from + ' to ' + to });
      if (from === to && !limGone && !refusalChanged && graphDiff === 'none') continue;
      const observed = from !== to ? from + ' to ' + to : limGone ? 'limitation weakened or removed' : refusalChanged ? 'refusal behaviour changed' : 'graph structure changed; outcome unchanged';
      row({ fixture_id: fid, condition: cid, prior_outcome: from, candidate_outcome: to, observed_change: observed, evidence_graph_difference: graphDiff,
        changed_limitation: Boolean(limGone), changed_refusal_behavior: refusalChanged,
        classification: unsafe || limGone ? 'material_unsafe_until_human_disposition' : from !== to || refusalChanged ? 'material' : 'non_material' });
    }
  }
  return { rows, violations, fail: violations.length > 0, statement: 'Records observed differences. Does not accept, apply or approve any of them. human_disposition is recorded only by a person, outside this system.' };
}
