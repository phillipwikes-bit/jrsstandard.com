// Irrelevant-basis repair: cost and benefit of 0.3.6 against its parent 0.3.5 on the SAME available offline proposals.
//   LIVE     the 401 captured responses of run RUN-LIVE-AUTH-20261028-02, compiled again offline (replays, not new runs)
//   SCRIPTED the 624 frozen scripted proposals (6 policies x 104 records), relabelled to the 0.3.5 prompt version;
//            scripted, not model output
// No human relevance assessment exists for any study record, so none is supplied: this measures 0.3.6 as it would
// run today. Comparisons with AI-proposed references are descriptive; agreement is not accuracy.
// Writes out/COST_COMPARISON.json and reports/COST_COMPARISON.md (derived counts only; no record or quotation text).
// Usage: node tools/compare-cost.mjs <private run dir of RUN-LIVE-AUTH-20261028-02> <scratch>
import '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { attempts } from '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, CONT, PKG4, STATUS, sha, shaFile, readJson, writeJson, writeOut } from './common.mjs';
import { isolate, loadEngine } from './harness/engines.mjs';
import { LIVE_ARM, CLOCK } from '../../study-continuation-0.3.5-2026-10-28/tools/live/score-live-v2.mjs';
import { extractCandidate } from '../../engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs';
import { declare, compileRow, PROFILE } from '../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { byId, recordText, referenceOf, relabel } from '../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { isFlawReason, BASIS_CONDITIONS } from '../../study-156-2026-10-27/tools/scoring.mjs';
import { privateLocationProblems } from '../../study-continuation-0.3.5-2026-10-28/tools/live/runner.mjs';

const [RUN, SCRATCH] = process.argv.slice(2);
if (!RUN || !SCRATCH) { console.error('usage: compare-cost.mjs <private run dir> <scratch>'); process.exit(2); }
const priv = privateLocationProblems(RUN, join(DIR, '..', '..')); if (priv.length) { console.error('stopped: ' + priv.join('; ')); process.exit(3); }
mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const i5 = isolate('0.3.5-research-candidate', join(SCRATCH, 'iso')), i6 = isolate('0.3.6-research-candidate', join(SCRATCH, 'iso'));
const E5 = await loadEngine(i5), E6 = await loadEngine(i6);
const RPV = E5.research.RESEARCH_PROMPT_VERSION;
if (E6.research.RESEARCH_PROMPT_VERSION !== RPV) throw new Error('prompt versions differ: the comparison would not use identical proposals');
const CAP = join(RUN, 'captures'), capsBefore = sha(readdirSync(CAP).sort().map((f) => f + ':' + shaFile(join(CAP, f))).join('\n'));
const set = readJson(join(CONT, 'records', 'LIVE_RECORD_SET.json'));
const tt = new Map(readFileSync(join(CONT, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
const compile = (E, id, text, cand, fid) => compileRow(E, LIVE_ARM, { text, declaration: declare(byId.get(id)), cand, designed: null, eligible: true, clock: CLOCK, fixtureId: fid, rpv: RPV, profile: PROFILE });
const view = (r) => ({ e1: r.e1, st: r.observed ? r.observed.statuses : {}, flaw: Object.fromEntries(BASIS_CONDITIONS.map((c) => [c, ((r.reasons || {})[c] || []).filter(isFlawReason)])),
  unresolved: BASIS_CONDITIONS.filter((c) => ((r.reasons || {})[c] || []).some((x) => /stated_link_relevance_unresolved/.test(x))).length,
  quotes: JSON.stringify((r.observed && r.observed.quote_statuses) || {}), intake: r.intake || null, controls: (r.control_defects || []).length, controls_repeated: (r.control_defects || []).length - new Set(r.control_defects || []).size, guards: (r.guards || []).length, mechanical: (r.mechanical || []).length });
const items = [];
for (const q of set.requests) {
  const text = q.construction ? tt.get(q.request_id) : recordText(q.base_record_id);
  const cand = extractCandidate(JSON.parse(readFileSync(join(CAP, q.request_id + '.json'), 'utf8')), 'claude-haiku-5-5').text;
  items.push({ set: 'LIVE', phase: q.phase, construction: q.construction ? q.construction.split(' ')[0] : null, id: q.request_id, ref: q.reference_ai_proposed,
    a: view(compile(E5, q.base_record_id, text, cand, q.request_id)), b: view(compile(E6, q.base_record_id, text, cand, q.request_id)) });
}
for (const m of readJson(join(PKG4, 'mocks-v2', 'MOCK_INDEX.json')).rows) {
  const body = readFileSync(join(PKG4, 'mocks-v2', m.policy, m.id + '.json'), 'utf8'); if (sha(body) !== m.sha256) throw new Error('mock hash ' + m.policy + '/' + m.id);
  const cand = relabel(JSON.parse(body).envelope.content[0].text, RPV), text = recordText(m.id);
  items.push({ set: 'SCRIPTED', phase: m.policy, construction: null, id: m.policy + '/' + m.id, ref: referenceOf(m.id), a: view(compile(E5, m.id, text, cand, m.id)), b: view(compile(E6, m.id, text, cand, m.id)) });
}
const r5 = i5.release(), r6 = i6.release();
const capsAfter = sha(readdirSync(CAP).sort().map((f) => f + ':' + shaFile(join(CAP, f))).join('\n'));
function metrics(list) {
  const n = list.length, cnt = (f) => list.filter(f).length;
  const trans = {}; for (const x of list) { const k = x.a.e1 + '->' + x.b.e1; trans[k] = (trans[k] || 0) + 1; }
  const condPairs = list.flatMap((x) => BASIS_CONDITIONS.map((c) => ({ x, c })));
  const gapsLost = condPairs.filter(({ x, c }) => x.a.st[c] === 'gap' && x.b.st[c] !== 'gap').length;
  const flawLost = condPairs.filter(({ x, c }) => x.a.flaw[c].some((r) => !x.b.flaw[c].includes(r))).length;
  const flawNew = condPairs.filter(({ x, c }) => x.b.flaw[c].some((r) => !x.a.flaw[c].includes(r))).length;
  return { items: n, e1_transitions: trans,
    flag_lost: cnt((x) => x.a.e1 === 'FLAG' && x.b.e1 !== 'FLAG'), flag_new: cnt((x) => x.a.e1 !== 'FLAG' && x.b.e1 === 'FLAG'),
    flag_new_on_ai_grounded: cnt((x) => x.ref === 'GROUNDED' && x.a.e1 !== 'FLAG' && x.b.e1 === 'FLAG'), clear: { before: cnt((x) => x.a.e1 === 'CLEAR'), after: cnt((x) => x.b.e1 === 'CLEAR') },
    clear_on_ai_ungrounded: { before: cnt((x) => x.ref === 'UNGROUNDED' && x.a.e1 === 'CLEAR'), after: cnt((x) => x.ref === 'UNGROUNDED' && x.b.e1 === 'CLEAR') },
    indeterminate_rate: { before: +(cnt((x) => x.a.e1 === 'INDETERMINATE') / n).toFixed(4), after: +(cnt((x) => x.b.e1 === 'INDETERMINATE') / n).toFixed(4) },
    condition_gaps_lost: gapsLost, condition_flaw_reasons_lost: flawLost, condition_flaw_reasons_new: flawNew,
    supported_basis_conditions: { before: condPairs.filter(({ x, c }) => x.a.st[c] === 'supported').length, after: condPairs.filter(({ x, c }) => x.b.st[c] === 'supported').length },
    supported_basis_conditions_on_ai_ungrounded: { before: condPairs.filter(({ x, c }) => x.ref === 'UNGROUNDED' && x.a.st[c] === 'supported').length, after: condPairs.filter(({ x, c }) => x.ref === 'UNGROUNDED' && x.b.st[c] === 'supported').length },
    review_basis_conditions: { before: condPairs.filter(({ x, c }) => x.a.st[c] === 'review_required').length, after: condPairs.filter(({ x, c }) => x.b.st[c] === 'review_required').length },
    unresolved_relevance_reasons_after: list.reduce((s, x) => s + x.b.unresolved, 0),
    controls: { before: list.reduce((s, x) => s + x.a.controls, 0), after: list.reduce((s, x) => s + x.b.controls, 0), repeated_before: list.reduce((s, x) => s + x.a.controls_repeated, 0), repeated_after: list.reduce((s, x) => s + x.b.controls_repeated, 0),
      items_with_changed_control_count: cnt((x) => x.a.controls !== x.b.controls) },
    quote_status_changes: cnt((x) => x.a.quotes !== x.b.quotes), intake_changes: cnt((x) => x.a.intake !== x.b.intake),
    guards_or_mechanical_failures: { before: list.reduce((s, x) => s + x.a.guards + x.a.mechanical, 0), after: list.reduce((s, x) => s + x.b.guards + x.b.mechanical, 0) } };
}
const groups = { LIVE_all: items.filter((x) => x.set === 'LIVE'), LIVE_RUN: items.filter((x) => x.set === 'LIVE' && x.phase === 'RUN'), LIVE_TGT_stated_irrelevant_basis: items.filter((x) => x.construction === 'stated_irrelevant_basis'),
  LIVE_TGT_instruction: items.filter((x) => x.construction === 'instruction'), SCRIPTED_all: items.filter((x) => x.set === 'SCRIPTED'),
  ...Object.fromEntries([...new Set(items.filter((x) => x.set === 'SCRIPTED').map((x) => x.phase))].map((p) => ['SCRIPTED_' + p, items.filter((x) => x.set === 'SCRIPTED' && x.phase === p)])) };
const out = { format: 'jrs-irrelevant-basis-cost-comparison/1.0.0', ...STATUS, before: '0.3.5-research-candidate', after: '0.3.6-research-candidate', network_attempts: attempts.length,
  statement: 'Same proposals compiled by both versions. LIVE = offline replays of captured responses; SCRIPTED = frozen scripted proposals, not model output. No human relevance assessment supplied. AI-proposed references are not human labels.',
  inputs: { captures_unchanged: capsBefore === capsAfter, captures_sha256: capsBefore, engine_copies_unchanged: r5.unchanged && r6.unchanged },
  metrics: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, metrics(v)])),
  changed_items: items.filter((x) => JSON.stringify(x.a) !== JSON.stringify(x.b)).map((x) => ({ set: x.set, id: x.id, ref: x.ref, e1: x.a.e1 + '->' + x.b.e1 })) };
writeJson(join(DIR, 'out', 'COST_COMPARISON.json'), out);
const M = out.metrics, rowOf = (k) => { const m = M[k]; return '| ' + k + ' | ' + m.items + ' | ' + m.flag_lost + ' | ' + m.flag_new + ' (' + m.flag_new_on_ai_grounded + ') | ' + m.clear.before + ' → ' + m.clear.after + ' | ' + m.clear_on_ai_ungrounded.before + ' → ' + m.clear_on_ai_ungrounded.after
  + ' | ' + m.supported_basis_conditions.before + ' → ' + m.supported_basis_conditions.after + ' | ' + m.indeterminate_rate.before + ' → ' + m.indeterminate_rate.after + ' | ' + m.condition_gaps_lost + ' / ' + m.condition_flaw_reasons_lost + ' / ' + m.condition_flaw_reasons_new
  + ' | ' + m.controls.before + ' → ' + m.controls.after + ' | ' + m.guards_or_mechanical_failures.before + ' / ' + m.guards_or_mechanical_failures.after + ' |'; };
writeOut(join(DIR, 'reports', 'COST_COMPARISON.md'), ['# Cost and benefit of 0.3.6 against 0.3.5 (same proposals)', '', out.statement, '',
  '| Set | Items | FLAG lost | New FLAG (on AI-grounded) | CLEAR | CLEAR on AI-ungrounded | Supported basis conditions | INDETERMINATE rate | Condition gaps lost / flaw reasons lost / new | Controls | Guard or mechanical failures (before / after) |', '|---|---|---|---|---|---|---|---|---|---|---|',
  ...Object.keys(M).map(rowOf), '', 'Full detail, including the E1 transition matrix for every set and every changed item: `out/COST_COMPARISON.json`.', ''].join('\n'));
const s = M.LIVE_all, t = M.SCRIPTED_all;
console.log('cost comparison: ' + JSON.stringify({ live: { trans: s.e1_transitions, flag_lost: s.flag_lost, flag_new: s.flag_new, supported: s.supported_basis_conditions, controls: s.controls }, scripted: { trans: t.e1_transitions, flag_lost: t.flag_lost, flag_new: t.flag_new, supported: t.supported_basis_conditions }, captures_unchanged: out.inputs.captures_unchanged }));
process.exit(out.inputs.captures_unchanged && out.inputs.engine_copies_unchanged && attempts.length === 0 ? 0 : 1);
