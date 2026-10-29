// Irrelevant-basis repair (RP-SRP-14, 0.3.6): behavioural tests on SYNTHETIC records with SCRIPTED proposals. Nothing
// here is model output. Each test runs on the parent 0.3.5 ("before") and on 0.3.6 ("after").
//   kind "control": must hold on both versions (behaviour the repair must not change).
//   kind "repair":  must FAIL on 0.3.5 and PASS on 0.3.6 (failing-before, passing-after).
// Mutation: deliberately weakened copies of 0.3.6 (tools/repair-mutants.mjs) must each fail at least one test.
// Writes out/REPAIR_TESTS.json. Exits 1 on any unexpected outcome or network attempt.
// Usage: node tools/test-repair.mjs <scratch> [--no-mutants]
// Self-check of the exit code: JRS_REPAIR_TESTS_SELF_CHECK=fail|pass (see CT-14 in the continuation package).
import '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { attempts } from '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DIR, STATUS, sha, writeJson } from './common.mjs';
import { isolate, loadEngine } from './harness/engines.mjs';
import { LIVE_ARM, CLOCK } from '../../study-continuation-0.3.5-2026-10-28/tools/live/score-live-v2.mjs';
import { declare, compileRow, PROFILE } from '../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { BASIS_CONDITIONS } from '../../study-156-2026-10-27/tools/scoring.mjs';
import { MUTANTS } from './repair-mutants.mjs';

const SCRATCH = process.argv[2]; const NO_MUT = process.argv.includes('--no-mutants');
if (!SCRATCH) { console.error('usage: test-repair.mjs <scratch> [--no-mutants]'); process.exit(2); }
rmSync(SCRATCH, { recursive: true, force: true }); mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const SELF = process.env.JRS_REPAIR_TESTS_SELF_CHECK || null;
if (SELF) { const ok = SELF !== 'fail'; console.log((ok ? 'PASS' : 'FAIL') + ' SELF-1 exit-code self-check'); process.exit(ok ? 0 : 1); }

// ------------------------------------------------------------------ SYNTHETIC records (invented for these tests)
const L = { title: 'Synthetic access record SYN-IB-01', decision: 'The access request for Vendor Northwind was approved on 2 March 2026.', tail: 'The request owner was informed the same week.',
  unrelated: 'The car park barrier was serviced on 3 February.',
  shared: 'The printer log PL-3 was logged on 2 March 2026.',
  rests: 'The decision rests on the printer service log PL-3 of 3 February.',
  relevant: 'The approval rests on the signed security review SR-4 of 1 March 2026 for Vendor Northwind.',
  ambiguous: 'The approval rests on vendor file VF-9 of 1 March 2026.' };
const rec = (...extra) => [L.title, L.decision, ...extra, L.tail].join('\n');
const obs = (id, c, st, q, at) => ({ observation_id: id, condition_id: c, proposed_status: st, quote: q, assertion_type: at });
// Over-claiming: proposes "supported" for the three basis conditions, citing the given line. Gap: proposes "gap".
const overclaim = (cite, rpv) => JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: rpv, observations: [
  obs('rc-1', 'reconstructability', 'supported', L.decision, 'stated_decision'), obs('rc-2', 'reconstructability', 'supported', cite, 'stated_source_reference'),
  obs('ib-1', 'identifiable_basis', 'supported', cite, 'stated_source_reference'), obs('rt-1', 'reasoning_traceability', 'supported', cite, 'stated_rationale')] });
const gapProposal = (rpv) => JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: rpv, observations: [
  obs('rc-1', 'reconstructability', 'gap', L.decision, 'stated_decision'), obs('ib-1', 'identifiable_basis', 'gap', L.decision, 'stated_decision'), obs('rt-1', 'reasoning_traceability', 'gap', L.decision, 'stated_decision')] });

function harness(E, RP) {
  const stmtSha = (text, sentence) => { const u = RP.sentenceUnits(text).find((x) => x.text.includes(sentence.replace(/[.]$/, ''))); return u ? sha(u.text) : null; };
  const assess = (text, sentence, relevant, o = {}) => Object.assign({ statement_sha256: stmtSha(text, sentence), relevant, assessor_kind: 'human', assessor_name: 'TEST FIXTURE REVIEWER (not a real assessment)', assessed_on: '2026-10-28' }, o);
  const run = (text, cand, assessments) => { const profile = assessments ? Object.assign({}, PROFILE, { relevance_assessments: assessments }) : PROFILE;
    const r = compileRow(E, LIVE_ARM, { text, declaration: declare({ cohort: 'synthetic_record' }), cand, designed: null, eligible: true, clock: CLOCK, fixtureId: 'SYN-IB', rpv: E.research.RESEARCH_PROMPT_VERSION, profile });
    const st = r.observed ? r.observed.statuses : {}; const reasons = r.reasons || {};
    return { e1: r.e1, intake: r.intake, supported: BASIS_CONDITIONS.filter((c) => st[c] === 'supported'), statuses: st, reasons, any: (re) => BASIS_CONDITIONS.some((c) => (reasons[c] || []).some((x) => re.test(x))) }; };
  return { run, assess, rpv: E.research.RESEARCH_PROMPT_VERSION };
}
const UNRESOLVED = /stated_link_relevance_unresolved/;

// Each test: (h) => { ok, observed }. h is the harness for the version under test.
const TESTS = [
  ['IB-01', 'control', 'flawed record + an unrelated sentence with no stated link: still FLAG, with the over-claimer and with a gap proposal', (h) => {
    const t = rec(L.unrelated); const a = h.run(t, overclaim(L.unrelated, h.rpv)), b = h.run(t, gapProposal(h.rpv));
    return { ok: a.e1 === 'FLAG' && b.e1 === 'FLAG' && !a.supported.length, observed: [a.e1, b.e1, a.supported] }; }],
  ['IB-02', 'control', 'flawed record + an unrelated sentence sharing the decision date and an identifier (inferred link only): never supported, never CLEAR', (h) => {
    const a = h.run(rec(L.shared), overclaim(L.shared, h.rpv)); return { ok: !a.supported.length && a.e1 !== 'CLEAR', observed: [a.e1, a.supported] }; }],
  ['IB-03', 'repair', 'flawed record + "the decision rests on" irrelevant material, over-claiming proposal: the stated link alone supports nothing; review with relevance unresolved; not CLEAR', (h) => {
    const a = h.run(rec(L.rests), overclaim(L.rests, h.rpv)); const each = BASIS_CONDITIONS.every((c) => (a.reasons[c] || []).some((x) => UNRESOLVED.test(x)));
    return { ok: !a.supported.length && a.e1 !== 'CLEAR' && each, observed: [a.e1, a.supported, a.statuses] }; }],
  ['IB-04', 'control', 'the same stated irrelevant link with a gap proposal is not turned into a defect: no FLAG without a demonstrated gap (unresolved relevance stays unresolved)', (h) => {
    const a = h.run(rec(L.rests), gapProposal(h.rpv)); return { ok: a.e1 !== 'FLAG' && a.e1 !== 'CLEAR', observed: [a.e1, a.statuses] }; }],
  ['IB-05', 'repair', 'genuinely relevant new evidence, NOT assessed by a person: no support from the stated link; review with relevance unresolved; no gap', (h) => {
    const a = h.run(rec(L.relevant), overclaim(L.relevant, h.rpv)); return { ok: !a.supported.length && a.e1 === 'INDETERMINATE' && a.any(UNRESOLVED), observed: [a.e1, a.supported] }; }],
  ['IB-06', 'repair', 'the same relevant evidence ASSESSED RELEVANT by a separately identified person: the three basis conditions may be supported (a legitimate change, recorded with the assessor)', (h) => {
    const t = rec(L.relevant); const a = h.run(t, overclaim(L.relevant, h.rpv), [h.assess(t, L.relevant, true)]);
    return { ok: a.intake === 'proceed' && a.supported.length === 3 && a.e1 === 'CLEAR', observed: [a.intake, a.e1, a.supported] }; }],
  ['IB-07', 'repair', 'the irrelevant stated link ASSESSED IRRELEVANT by a person: the link is excluded and the record\'s demonstrated absence of linked evidence is reported again (FLAG)', (h) => {
    const t = rec(L.rests); const a = h.run(t, gapProposal(h.rpv), [h.assess(t, L.rests, false)]);
    return { ok: a.intake === 'proceed' && a.e1 === 'FLAG' && a.any(/no_identifiable_basis_evidence/), observed: [a.intake, a.e1, a.reasons.identifiable_basis] }; }],
  ['IB-08', 'control', 'a sound record (decision plus its own stated, relevant basis) acquires no gap with a gap proposal, before or after: no invented defect', (h) => {
    const a = h.run(rec(L.relevant), gapProposal(h.rpv)); return { ok: a.e1 !== 'FLAG', observed: [a.e1, a.statuses] }; }],
  ['IB-09', 'repair', 'ambiguous relevance (a stated link to an unexplained file), not assessed: stays unresolved: not supported, not a gap', (h) => {
    const a = h.run(rec(L.ambiguous), overclaim(L.ambiguous, h.rpv)); return { ok: !a.supported.length && a.e1 === 'INDETERMINATE' && a.any(UNRESOLVED), observed: [a.e1, a.supported] }; }],
  ['IB-10', 'repair', 'an assessment not made by a person is refused (assessor_kind "model"; a model name as assessor): the profile fails closed and nothing is assessed', (h) => {
    const t = rec(L.relevant); const a = h.run(t, overclaim(L.relevant, h.rpv), [h.assess(t, L.relevant, true, { assessor_kind: 'model' })]);
    const b = h.run(t, overclaim(L.relevant, h.rpv), [h.assess(t, L.relevant, true, { assessor_name: 'Claude Haiku 5.5' })]);
    const c = h.run(t, overclaim(L.relevant, h.rpv), [h.assess(t, L.relevant, true)]);
    return { ok: a.intake !== 'proceed' && b.intake !== 'proceed' && c.intake === 'proceed', observed: [a.intake, b.intake, c.intake] }; }],
  ['IB-11', 'control', 'the model cannot supply a relevance judgement: a response carrying a relevance field is refused as a whole', (h) => {
    const o = JSON.parse(overclaim(L.relevant, h.rpv)); o.observations[2].relevance = 'relevant';
    const a = h.run(rec(L.relevant), JSON.stringify(o)); return { ok: a.any(/candidate_response_invalid/) && !a.supported.length, observed: [a.e1, a.reasons.identifiable_basis] }; }],
  ['IB-12', 'repair', 'an assessment of a sentence that is not in the record changes nothing (no support, no exclusion)', (h) => {
    const t = rec(L.relevant); const a = h.run(t, overclaim(L.relevant, h.rpv), [Object.assign(h.assess(t, L.relevant, true), { statement_sha256: sha('a sentence that is not in this record') })]);
    return { ok: a.intake === 'proceed' && !a.supported.length && a.any(UNRESOLVED), observed: [a.intake, a.e1, a.supported] }; }],
];

async function runSuite(version, src = null) {
  const iso = isolate(version, join(SCRATCH, 'iso'), src ? { requireManifest: false, src } : {});   // frozen candidates: manifest-verified; mutants: scratch copies
  const E = await loadEngine(iso);
  const RP = await import(join(iso.root, 'lib', 'engine-evidence-graph-v0.3.4-research-candidate', 'research-profile.mjs') + '?v=' + encodeURIComponent(iso.root));
  const h = harness(E, RP); const out = [];
  for (const [id, kind, name, fn] of TESTS) { let r; try { r = fn(h); } catch (e) { r = { ok: false, observed: 'threw: ' + String(e.message).slice(0, 200) }; } out.push({ id, kind, name, ok: !!r.ok, observed: r.observed }); }
  iso.release(); return out;
}

const before = await runSuite('0.3.5-research-candidate'), after = await runSuite('0.3.6-research-candidate');
const rows = TESTS.map(([id, kind, name], i) => { const b = before[i], a = after[i];
  const expected = kind === 'control' ? b.ok && a.ok : !b.ok && a.ok;
  return { id, kind, name, before_0_3_5: b.ok, after_0_3_6: a.ok, as_expected: expected, observed_before: b.observed, observed_after: a.observed }; });
const mutants = [];
if (!NO_MUT) for (const m of MUTANTS) {
  const dir = join(SCRATCH, 'mutant-' + m.id); rmSync(dir, { recursive: true, force: true }); cpSync(join(DIR, 'candidate'), dir, { recursive: true });
  const f = join(dir, m.file); const text = readFileSync(f, 'utf8'); const applied = text.includes(m.from);
  if (applied) writeFileSync(f, text.replace(m.from, m.to));
  const res = applied ? await runSuite('0.3.6-research-candidate', dir) : [];
  const failed = res.filter((r) => !r.ok).map((r) => r.id);
  mutants.push({ id: m.id, what: m.what, applied, killed: applied && failed.length > 0, failed_tests: failed });
}
for (const r of rows) console.log((r.as_expected ? 'PASS ' : 'FAIL ') + r.id + ' [' + r.kind + '] before=' + r.before_0_3_5 + ' after=' + r.after_0_3_6 + '  ' + r.name);
for (const m of mutants) console.log((m.killed ? 'KILLED ' : 'SURVIVED ') + m.id + ' ' + m.what + (m.killed ? ' (' + m.failed_tests.join(',') + ')' : ''));
// Exit-code self-check: a child with a deliberate failure exits 1, one without exits 0.
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
const sc = (mode) => spawnSync(process.execPath, [join(DIR, 'tools', 'test-repair.mjs'), join(SCRATCH, 'self-' + mode)], { env: Object.assign({}, env, { JRS_REPAIR_TESTS_SELF_CHECK: mode }), encoding: 'utf8' }).status;
const selfCheck = { fail_exit: sc('fail'), pass_exit: sc('pass') };
const ok = rows.every((r) => r.as_expected) && mutants.every((m) => m.killed) && selfCheck.fail_exit === 1 && selfCheck.pass_exit === 0 && attempts.length === 0;
writeJson(join(DIR, 'out', 'REPAIR_TESTS.json'), { format: 'jrs-irrelevant-basis-repair-tests/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Synthetic records and scripted proposals only; no model output. "before" is the frozen 0.3.5, "after" is 0.3.6.', totals: { tests: rows.length, as_expected: rows.filter((r) => r.as_expected).length, mutants: mutants.length, killed: mutants.filter((m) => m.killed).length }, self_check: selfCheck, tests: rows, mutants });
console.log('repair tests: ' + rows.filter((r) => r.as_expected).length + ' of ' + rows.length + ' as expected; mutants killed ' + mutants.filter((m) => m.killed).length + ' of ' + mutants.length + '; self-check ' + JSON.stringify(selfCheck) + '; network attempts ' + attempts.length);
process.exit(ok ? 0 : 1);
