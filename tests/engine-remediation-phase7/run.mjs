#!/usr/bin/env node
// JRS PHASE 7: remediation candidate test suite.
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-remediation-phase7/run.mjs [--record] [--only <group>]
//
// Groups: preservation, seal, scenarios, qualification, packs, stability, overrefusal, backlog, determinism, mutation, workbench, documents.
// Offline: refuses to start with provider configuration; traps every network API.

import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync } = await import('node:fs');
const { join } = await import('node:path');
const { tmpdir } = await import('node:os');
const { createHash } = await import('node:crypto');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath, pathToFileURL } = await import('node:url');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const P7 = join(REPO, 'research/engine-remediation-phase7-2026-10-19');
const CAND = 'lib/engine-evidence-graph-v0.3.1-candidate';
const START = '428c307af510ff7378615777251fe252dab2dac7';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const RECORD = process.argv.includes('--record');
const want = (g) => !ONLY || ONLY === g;
const J = (p) => JSON.parse(readFileSync(join(P7, p), 'utf8'));
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const fsha = (p) => createHash('sha256').update(readFileSync(join(REPO, p))).digest('hex');
let pass = 0, fail = 0; const failed = [], records = {};
const t = (name, ok, detail) => { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; failed.push(name); console.log('FAIL  ' + name + (detail ? '\n        ' + String(detail).slice(0, 700) : '')); } };

const { compileEvidenceGraph: v03 } = await import('../../lib/engine-evidence-graph/compiler.mjs');
const { compileEvidenceGraph: cand } = await import('../../lib/engine-evidence-graph-v0.3.1-candidate/compiler.mjs');
const RP = await import('../../lib/engine-evidence-graph-v0.3.1-candidate/rule-packs.mjs');
const C = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/candidate.mjs');
const I = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/inputs.mjs');
const SS = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/scenario-schema.mjs');
const Q = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/qualify.mjs');
const BL = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/backlog.mjs');
const { verifySeal } = await import('../../research/engine-remediation-phase7-2026-10-19/tooling/verify-seal.mjs');
const BA = await import('../../research/engine-remediation-phase7-2026-10-19/build-artifacts.mjs');
const { recordFromGraph } = await import('../../lib/engine-reliability/baseline.mjs');
const { universalInvariants } = await import('../../lib/engine-reliability/library.mjs');
const { scanUnsupportedClaims } = await import('../../lib/engine-assurance/content-guard.mjs');
const { makeProbes, MUTATIONS } = await import('./probes.mjs');
const SCEN = I.phase7Inputs();
const ICS = J('INTENDED_CHANGE_SET.json');

// ---------------------------------------------------------------- A. preservation
if (want('preservation')) {
  console.log('\n# A. Preservation and isolation');
  t('HEAD is still ' + START.slice(0, 7) + ' (no commit)', git(['rev-parse', 'HEAD']).trim() === START);
  t('working branch unchanged (claude/engine-reliability-phase6-local)', git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() === 'claude/engine-reliability-phase6-local');
  t('PR #40 branch and its remote-tracking reference still at 428c307', git(['rev-parse', 'claude/engine-assurance-2026-10-10']).trim() === START && git(['rev-parse', 'origin/claude/engine-assurance-2026-10-10']).trim() === START);
  t('no tracked file differs from 428c307 (v1, v0.1, v0.2, v0.3, Phase 4, public routes, deployment, B-018, trackers)', git(['diff', '--name-only', START]).trim() === '', git(['diff', '--name-only', START]));
  const snap = readFileSync(join(P7, 'preservation/PHASE6_UNTRACKED_SHA256_AT_START.txt'), 'utf8').trim().split('\n').map((l) => l.split(/\s+/));
  const changed = snap.filter(([h, f]) => !existsSync(join(REPO, f)) || fsha(f) !== h).map(([, f]) => f);
  t('all ' + snap.length + ' Phase 6 files byte-identical to the Phase 7 start snapshot', !changed.length, changed.join(', '));
  const p6set = new Set(snap.map(([, f]) => f));
  const untracked = git(['ls-files', '--others', '--exclude-standard']).trim().split('\n').filter(Boolean);
  const p7ok = (f) => f.startsWith(CAND + '/') || f.startsWith('research/engine-remediation-phase7-2026-10-19/') || f.startsWith('tests/engine-remediation-phase7/');
  t('every new file is a Phase 6 file or inside the three Phase 7 locations', untracked.every((f) => p6set.has(f) || p7ok(f)), untracked.filter((f) => !p6set.has(f) && !p7ok(f)).join(', '));
  t('no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page', !untracked.some((f) => !p6set.has(f) && /^(?:tools|api|docs|\.jrs|\.github)\/|^[^/]+\.html$/.test(f)));
  t('frozen v0.3 still compiles as 0.3.0-local with its own release status', (await import('../../lib/engine-evidence-graph/contract.mjs')).COMPILER_VERSION === '0.3.0-local');
  const cd = (await import('../../research/engine-remediation-phase7-2026-10-19/tooling/seal.mjs')).candidateDiff();
  t('candidate is a separate directory; logic differs from v0.3 only in the remediated modules', JSON.stringify(cd.differing.sort()) === JSON.stringify(['assertions.mjs', 'compiler.mjs', 'conditions.mjs', 'contract.mjs', 'contradictions.mjs', 'controls.mjs', 'rule-packs.mjs', 'scope.mjs']), JSON.stringify(cd.differing));
  t('both contracts keep release status NO_GO_NOT_VERIFIED', [CAND, 'lib/engine-evidence-graph'].every((d) => readFileSync(join(REPO, d, 'contract.mjs'), 'utf8').includes("RELEASE_STATUS = 'NO_GO_NOT_VERIFIED'")));
  const bl = JSON.parse(readFileSync(join(REPO, '.jrs/state/BLOCKERS.json'), 'utf8')); let st = null; const w = (o) => { if (o && typeof o === 'object') { if (o.blocker_id === 'B-018') st = o.status; Object.values(o).forEach(w); } }; w(bl);
  t('B-018 remains OPEN', st === 'OPEN');
  t('public Engine routes remain refusal-only', ['api/review.js', 'api/review-engine.js', 'api/v1/review-engine.js'].every((p) => { const s = readFileSync(join(REPO, p), 'utf8'); return s.includes('unavailable(') && !s.includes('fetch('); }));
  t('no source-aligned controlling file, holdout or label file in the work', !untracked.some((f) => !p6set.has(f) && /Source_Aligned|Blueprint_Aligned|project_sources|holdout|adjudicat/i.test(f)));
}

// ---------------------------------------------------------------- B. seal
if (want('seal')) {
  console.log('\n# B. Frozen remediation contract and seal');
  const seal = J('SEAL.json');
  t('seal intact: contract, scenarios, transforms, rule packs, intended change set, input manifest and evaluator files unchanged', verifySeal().length === 0, verifySeal().join('; '));
  t('seal recorded the candidate logic as identical to v0.3 at sealing time', seal.candidate_logic_identical_to_v03_at_seal === true);
  const first = J('stability/FIRST_RUN_RESULTS.json');
  t('seal predates the first recorded candidate run', Date.parse(seal.sealed_at) < Date.parse(first.executed_at), seal.sealed_at + ' / ' + first.executed_at);
  t('no authoring-defect record exists, so no sealed expectation was revised', !existsSync(join(P7, 'scenarios/AUTHORING_DEFECTS.json')));
  t('intended change set covers ' + ICS.triggered + ' of ' + ICS.existing_inputs + ' existing inputs, each with named rules', ICS.changes.every((c) => c.rules.length));
}

// ---------------------------------------------------------------- C. scenarios
const run = C.makeRunners(v03, cand);
if (want('scenarios')) {
  console.log('\n# C. Phase 7 regression scenarios');
  t('at least 48 sealed scenarios (' + SCEN.length + ')', SCEN.length >= 48);
  for (const [k, a] of Object.entries(SS.AREAS)) t('area ' + a.name + ' has at least ' + a.minimum + ' (' + SCEN.filter((s) => s.area === a.name).length + ')', SCEN.filter((s) => s.area === a.name).length >= a.minimum);
  const seen = new Set(); const bad = SCEN.map((s) => { const p = SS.validateP7Scenario(s, seen); seen.add(s.scenario_id); return [s.scenario_id, p]; }).filter(([, p]) => p.length);
  t('every scenario admitted (marker, provenance, rule, role, limitation, route, differential)', !bad.length, JSON.stringify(bad));
  for (const r of SS.RULE_IDS) for (const role of SS.ROLES) t(r + ' has a ' + role + ' scenario', SCEN.some((s) => s.rule_id === r && s.role === role));
  t('every scenario states an expected limitation or a refusal route', SCEN.every((s) => Object.keys(s.expected_limitation_kinds).length || s.expected_route === 'refusal'));
  const res = SCEN.map((s) => { const r = run.candidate(SS.submissionFor(s), s.candidate_response_text, s.execution_mode, s.scenario_id); return r.graph ? SS.evaluateP7(r.graph, s) : { scenario_id: s.scenario_id, result: 'unexpected', mismatches: [r.error] }; });
  for (const r of res) t('candidate: ' + r.scenario_id + ' as sealed', r.result === 'as_expected', JSON.stringify(r.mismatches) + JSON.stringify(r.universal_violations || []));
  t('P6-RT-07 family: the candidate never fails to compile', SCEN.filter((s) => s.rule_id === 'RP-STR-01').every((s) => !run.candidate(SS.submissionFor(s), s.candidate_response_text, s.execution_mode, s.scenario_id).error));
  records.scenarios = { counts: res.reduce((a, r) => { a[r.result] = (a[r.result] || 0) + 1; return a; }, {}) };
}

// ---------------------------------------------------------------- D. differential qualification
if (want('qualification')) {
  console.log('\n# D. Differential qualification: frozen v0.3 against the candidate');
  const r = await BA.runAll();
  const ok = ['no_behavioral_difference', 'intended_safe_degradation', 'intended_refusal', 'intended_safe_routing'];
  const ex = r.qExisting, p7 = r.qP7;
  t('every existing input (' + ex.length + ') is unchanged or an intended change', ex.every((q) => ok.includes(q.classification)), JSON.stringify(ex.filter((q) => !ok.includes(q.classification)).slice(0, 3)));
  t('the candidate changed exactly the ' + ICS.triggered + ' sealed existing inputs and no other', ex.filter((q) => q.classification !== 'no_behavioral_difference').map((q) => q.id).sort().join() === ICS.changes.map((c) => c.id).sort().join());
  t('every Phase 7 scenario (' + p7.length + ') is unchanged or an intended change', p7.every((q) => ok.includes(q.classification)), JSON.stringify(p7.filter((q) => !ok.includes(q.classification)).slice(0, 3)));
  t('every benign Phase 7 scenario is unchanged from v0.3', SCEN.filter((s) => s.role === 'benign').every((s) => p7.find((q) => q.id === s.scenario_id).classification === 'no_behavioral_difference'));
  const rank = { not_assessed: 0, review_required: 1, gap: 2, supported: 3 };
  t('no condition anywhere became more favourable than in v0.3', [...ex, ...p7].filter((q) => q.base_statuses && q.candidate_statuses).every((q) => Object.entries(q.candidate_statuses).every(([c, s]) => rank[s] <= rank[q.base_statuses[c]])));
  t('P6-RT-07: v0.3 fails, the candidate routes it safely', ex.find((q) => q.id === 'P6-RT-07').classification === 'intended_safe_routing');
  t('P6K-001 scenarios (P6-SP-02, P6-SP-04, P6-SP-06): no supported status from presence alone', ['P6-SP-02', 'P6-SP-04', 'P6-SP-06'].every((id) => { const q = ex.find((x) => x.id === id); return q.classification === 'intended_safe_degradation' && !Object.entries(q.candidate_statuses).some(([c, s]) => s === 'supported' && q.base_statuses[c] === 'supported' && ['identifiable_basis', 'chronology_integrity', 'reasoning_traceability'].includes(c) && ICS.changes.find((x) => x.id === id).statuses[c] !== 'supported'); }));
  t('P6K-008 cases never favourable: refused (P6-XD-03, P6-ST-17, ST-14)', ['P6-XD-03', 'P6-ST-17', 'ST-14'].every((id) => { const q = ex.find((x) => x.id === id); return q.classification === 'intended_refusal' && Object.values(q.candidate_statuses).every((s) => s === 'not_assessed'); }));
  t('Phase 6 library on the candidate: every scenario as expected or a remediated open failure', r.p6lib.every((x) => ['as_expected', 'known_open_failure_not_reproduced'].includes(x.result)));
  records.qualification = { existing: ex.reduce((a, q) => { a[q.classification] = (a[q.classification] || 0) + 1; return a; }, {}), phase7: p7.reduce((a, q) => { a[q.classification] = (a[q.classification] || 0) + 1; return a; }, {}), hash: r.hash };
}

// ---------------------------------------------------------------- E. rule packs
if (want('packs')) {
  console.log('\n# E. Rule packs');
  const packs = RP.loadRulePacks();
  const v = RP.validateRulePacks(packs);
  t('six packs, nine rules, all valid and active', packs.length === 6 && v.ok && v.active.size === 9, JSON.stringify(v.problems));
  t('the five required pack families are present', ['RPK-CHR', 'RPK-NEG', 'RPK-EVL', 'RPK-CON', 'RPK-SCO'].every((id) => packs.some((k) => k.pack_id === id)));
  t('every rule carries every schema field', packs.every((k) => k.rules.every((r) => RP.RULE_FIELDS.every((f) => r[f] !== undefined && r[f] !== ''))));
  t('register matches the pack files', JSON.stringify(J('RULE_PACK_REGISTER.json').packs.map((p) => p.content_sha256).sort()) === JSON.stringify(packs.map((k) => k.signature.content_sha256).sort()));
  t('no pack field carries a release, approval or production designation', !packs.some((k) => /release|approv|production|deploy/i.test(JSON.stringify(Object.keys(k)) + JSON.stringify(k.rules.map((r) => Object.keys(r))) + JSON.stringify(k.rules.map((r) => r.expected_safe_outcome)))));
  const g = cand({ submission: C.forCandidate(JSON.parse(JSON.stringify(SS.submissionFor(SCEN[0])))), candidateResponseText: SCEN[0].candidate_response_text, executionMode: 'local_mocked', clock: '2026-10-19T00:00:00Z', fixtureId: 'x' });
  t('every candidate graph records its pack identity and active rules', g.rule_packs.valid === true && g.rule_packs.packs.length === 6 && g.rule_packs.active_rules.length === 9);
}

// ---------------------------------------------------------------- F. stability
if (want('stability')) {
  console.log('\n# F. Stability (Phase 6 runner, unchanged, with the candidate)');
  const T7 = await import('../../research/engine-remediation-phase7-2026-10-19/stability/transforms.mjs');
  const ST = await import('../../lib/engine-reliability/stability.mjs');
  const r = ST.runTransforms(T7.TRANSFORMS, T7.BASES, run.candidateCompile, BA.CLOCK);
  t('at least 30 transforms (' + r.total + ')', r.total >= 30);
  t('at least 12 from non-favourable bases (' + r.results.filter((x) => x.base_state === 'non_favorable').length + ')', r.results.filter((x) => x.base_state === 'non_favorable').length >= 12);
  t('at least half of the invariant transforms from non-favourable bases (' + r.invariant_non_favorable_base + ' of ' + r.invariant_total + ')', r.invariant_non_favorable_base * 2 >= r.invariant_total);
  t('every transform as expected', r.as_expected === r.total, JSON.stringify(r.results.filter((x) => x.result !== 'as_expected').map((x) => x.transform_id + ' ' + x.mismatches.join('; '))));
  t('no favourable transition on any invariant transform', r.results.filter((x) => x.kind === 'invariant').every((x) => !x.favourable_transitions.length));
  const names = T7.TRANSFORMS.map((x) => x.name).join(' | ');
  for (const [label, re] of [['wording', /wording/], ['punctuation', /punctuation/], ['section reorder', /reorder/], ['duplicate dates', /duplicate date/], ['omitted dates', /omitted dates/], ['negated language', /negated/],
    ['unrelated quotations', /unrelated quotation/], ['paraphrased conflict', /paraphrased conflict/], ['reworded excluded-domain', /reworded excluded/], ['benign pattern words', /benign pattern word/], ['multiple defects', /multiple defects/]]) t('family present: ' + label, re.test(names));
  t('results reproduce the recorded and first runs', r.results_hash === J('stability/STABILITY_RESULTS.json').results_hash && r.results_hash === J('stability/FIRST_RUN_RESULTS.json').results_hash);
}

// ---------------------------------------------------------------- G. over-refusal
if (want('overrefusal')) {
  console.log('\n# G. Over-refusal review');
  const rows = J('results/OVER_REFUSAL_TABLE.json').rows;
  t('one row per implemented rule (' + rows.length + ')', rows.length === 9 && SS.RULE_IDS.every((r) => rows.some((x) => x.rule_id === r)));
  for (const x of rows) t(x.rule_id + ': ' + x.target_cases_routed_as_sealed + '/' + x.target_cases + ' target cases as sealed; ' + x.benign_cases_refused_or_degraded + '/' + x.benign_cases + ' benign cases refused or degraded', x.benign_cases >= 1 && x.benign_cases_refused_or_degraded === 0 && x.target_cases_routed_as_sealed === x.target_cases);
}

// ---------------------------------------------------------------- H. backlog
if (want('backlog')) {
  console.log('\n# H. Remediation backlog');
  const text = readFileSync(join(P7, 'backlog/REMEDIATION_BACKLOG.jsonl'), 'utf8'); const es = BL.parse(text);
  t('hash chain and every entry valid (' + es.length + ' entries)', BL.validateBacklog(text).length === 0, BL.validateBacklog(text).join('; '));
  for (const d of ['P6-RT-07', 'P6K-001', 'P6K-002', 'P6K-003', 'P6K-004', 'P6K-005', 'P6K-006', 'P6K-007', 'P6K-008']) t('separate backlog entry for ' + d, es.filter((e) => e.defect_ref.startsWith(d) && e.decision !== 'rejected').length === 1 && es.every((e) => !(e.defect_ref.startsWith(d) && /P6K-00[1-8]|P6-RT-07/.test(e.defect_ref.slice(d.length)))));
  t('included, deferred and rejected decisions all recorded', ['included', 'deferred', 'rejected', 'DEFERRED_PENDING_OWNER_DECISION'].every((d) => es.some((e) => e.decision === d)));
  const tampered = text.replace('"decision":"included"', '"decision":"rejected"');
  t('an edited entry breaks the chain', BL.validateBacklog(tampered).length > 0);
}

// ---------------------------------------------------------------- I. determinism
if (want('determinism')) {
  console.log('\n# I. Determinism: five full candidate runs');
  const hashes = []; for (let i = 0; i < 5; i++) hashes.push((await BA.runAll()).hash);
  t('five full runs (scenarios, qualification of every input, stability, Phase 6 library on the candidate) give one hash', new Set(hashes).size === 1, hashes.join(' '));
  records.determinism = { passes: hashes };
}

// ---------------------------------------------------------------- J. mutation
if (want('mutation')) {
  console.log('\n# J. Mutation tests (' + MUTATIONS.length + ' deliberate defects in copies)');
  const L = BA; // keep the real modules for the fixed context
  const BASE_REC = readFileSync(join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures/cases/GC-001.record.txt'), 'utf8');
  const BASE_RESP = readFileSync(join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures/cases/GC-001.candidate-response.txt'), 'utf8');
  const lines = BASE_REC.split('\n');
  const baseSub = Object.assign(SS.submissionFor({ scenario_id: 'probe', record_text: BASE_REC }), {});
  const snapshot = (g) => { const r = recordFromGraph(g, { scenarioId: 'x', pkg: 'p' });
    return { gate: g.intake.decision, valid: g.candidate.valid, reason: g.candidate.reason, statuses: Object.fromEntries(g.findings.map((f) => [f.condition_id, f.status])), conflicts: g.conflicts.map((k) => k.kind).sort(),
      refusals: [...new Set(g.refusals.map((x) => x.code))].sort(), cc: [...new Set(g.cognitive_controls.map((x) => x.defect))].sort(), lims: Object.fromEntries(Object.entries(r.conditions).map(([c, f]) => [c, f.limitation_kinds])) }; };
  const p6dir = join(REPO, 'research/engine-reliability-phase6-2026-10-17/regression-library/scenarios');
  const p6 = Object.fromEntries(readdirSync(p6dir).map((f) => { const s = JSON.parse(readFileSync(join(p6dir, f), 'utf8')); return [s.scenario_id, s]; }));
  const existing = (await I.existingInputs()).map((i) => {
    const ch = ICS.changes.find((c) => c.id === i.id); const b = run.base(i.submission, i.response, i.mode, i.id);
    const expect = !ch ? { mode: 'unchanged', snapshot: snapshot(b.graph) } : ch.base_error ? { mode: 'base_error', check: Q.phase6Check(p6[i.id]) }
      : { mode: 'intended', statuses: ch.statuses, conflicts_gained: ch.conflicts_gained, gate: ch.gate, base_conflicts: b.graph.conflicts.map((k) => k.kind) };
    return Object.assign({}, i, { expect });
  });
  const pair = (sub, resp) => ({ base: run.base(sub, resp, 'local_mocked', 'q').graph, cand: run.candidate(sub, resp, 'local_mocked', 'q').graph });
  const chr01 = SCEN.find((s) => s.scenario_id === 'P7-CHR-01');
  const X = { v03, scenarios: SCEN, submissionFor: SS.submissionFor, evaluateP7: SS.evaluateP7, families: [...new Set(existing.map((e) => e.family))], existing, universal: universalInvariants, completeRefusal: Q.completeRefusal,
    snapshot, baseSubmission: baseSub, baseResponse: BASE_RESP, baseRecord: BASE_REC, baseSnapshot: snapshot(run.base(baseSub, BASE_RESP, 'local_mocked', 'q').graph),
    lines: { DEC: lines[10], AUTH: lines[9], CHRON: lines[13], REVOKE: lines[12], CTRL: lines[8], EXPIRY: lines[11] }, packs: RP.loadRulePacks(), contentSeal: RP.contentSeal,
    gc001: pair(baseSub, BASE_RESP), chr01: pair(SS.submissionFor(chr01), chr01.candidate_response_text) };
  const PROBES = makeProbes(X);
  const REAL = { compile: cand, packs: RP, runners: C, qualify: Q };
  const runProbes = (M) => PROBES.map((p) => { let ok; try { ok = p.run(M) === true; } catch { ok = false; } return { name: p.name, ok }; });
  const base = runProbes(REAL);
  t('every probe passes on the unmutated candidate and tooling (' + base.length + ')', base.every((r) => r.ok), base.filter((r) => !r.ok).map((r) => r.name).join(','));
  const results = [];
  for (const [id, file, find, repl, area] of MUTATIONS) {
    const src = readFileSync(join(REPO, file), 'utf8'); const n = src.split(find).length - 1;
    if (n !== 1) { results.push({ id, file, area, result: 'setup_error', detail: 'target occurs ' + n + ' times' }); continue; }
    const dir = mkdtempSync(join(tmpdir(), 'p7-mut-'));
    try {
      cpSync(join(REPO, 'lib'), join(dir, 'lib'), { recursive: true });
      cpSync(join(P7, 'tooling'), join(dir, 'research/engine-remediation-phase7-2026-10-19/tooling'), { recursive: true });
      writeFileSync(join(dir, file), src.replace(find, repl));
      let M;
      try {
        const u = (p) => pathToFileURL(join(dir, p)).href;
        M = { compile: (await import(u(CAND + '/compiler.mjs'))).compileEvidenceGraph, packs: await import(u(CAND + '/rule-packs.mjs')),
          runners: await import(u('research/engine-remediation-phase7-2026-10-19/tooling/candidate.mjs')), qualify: await import(u('research/engine-remediation-phase7-2026-10-19/tooling/qualify.mjs')) };
      } catch (e) { results.push({ id, file, area, result: 'load_failure', detail: String(e.message).slice(0, 160) }); continue; }
      const pr = runProbes(M); const killers = pr.filter((r) => !r.ok).map((r) => r.name);
      results.push({ id, file, area, description: find.slice(0, 90), result: killers.length ? 'killed' : 'survived', killed_by: killers });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  for (const r of results) t(r.id + ' (' + r.area + ') ' + r.result + (r.killed_by && r.killed_by.length ? ' by ' + r.killed_by.slice(0, 3).join(', ') + (r.killed_by.length > 3 ? ' (+' + (r.killed_by.length - 3) + ')' : '') : ''), r.result === 'killed', r.detail);
  const killed = results.filter((r) => r.result === 'killed').length;
  t('at least 60 mutations, all killed by a direct probe, none a load failure (' + killed + '/' + results.length + ')', results.length >= 60 && killed === results.length);
  const areas = ['negation handling', 'date parsing and date-role logic', 'contradiction detection', 'candidate output validation', 'refusal preservation', 'limitation preservation', 'rule-pack validation', 'baseline comparison', 'version and hash mismatches'];
  t('every required mutation area covered, and every rule trigger', areas.every((a) => results.some((r) => r.area === a)) && SS.RULE_IDS.every((rid) => results.some((r) => r.area === 'rule trigger: ' + rid)));
  t('mutation temporary directories cleaned up', !readdirSync(tmpdir()).some((f) => f.startsWith('p7-mut-')));
  records.mutation = { total: results.length, killed, survived: results.filter((r) => r.result === 'survived').length, load_failures: results.filter((r) => r.result === 'load_failure').length,
    setup_errors: results.filter((r) => r.result === 'setup_error').length, probes: base.length, results };
}

// ---------------------------------------------------------------- K. workbench
const STATEMENTS = ['LOCAL ENGINEERING CANDIDATE ONLY', 'NOT INDEPENDENTLY EVALUATED', 'NO RELEASE OR DEPLOYMENT AUTHORIZATION'];
if (want('workbench')) {
  console.log('\n# K. Static workbench');
  const W = join(P7, 'workbench'); const pages = existsSync(W) ? readdirSync(W).filter((f) => f.endsWith('.html')) : [];
  t('workbench pages present (' + pages.length + ')', pages.length >= 8);
  for (const f of pages) {
    const h = readFileSync(join(W, f), 'utf8');
    t(f + ': three required statements', STATEMENTS.every((s) => h.includes(s)));
    t(f + ': no script, form, input, upload, iframe or network URL', !/<script|<form|<input|<textarea|<button|<iframe|<object|<embed|type=["']?file|https?:\/\/|@import|url\(/i.test(h));
    t(f + ': links only to local workbench pages', [...h.matchAll(/href="([^"]+)"/g)].every((m) => /^[a-z0-9-]+\.html$/.test(m[1])));
    t(f + ': no unnegated readiness or validation claim', scanUnsupportedClaims(h.replace(/<[^>]+>/g, ' ')).length === 0);
  }
  const rr = existsSync(join(P7, 'execution-record/WORKBENCH_RENDER_RECORD.json')) ? J('execution-record/WORKBENCH_RENDER_RECORD.json') : null;
  t('render record: every page at desktop and mobile, 0 non-file requests, no overflow, JavaScript disabled', !!rr && rr.pages.length === pages.length * 2 && rr.pages.every((p) => p.non_file_requests === 0 && !p.horizontal_overflow) && rr.javascript_enabled === false);
}

// ---------------------------------------------------------------- L. documents
const DOCS = ['PHASE7_HANDOFF.md', 'REMEDIATION_CONTRACT.md', 'RULE_PACK_SPECIFICATION.md', 'RULE_PACK_REGISTER.json', 'DIFFERENTIAL_QUALIFICATION_RECORD.md', 'REGRESSION_SCENARIO_REGISTER.md', 'MUTATION_EVIDENCE.md',
  'STABILITY_AND_OVER_REFUSAL_RECORD.md', 'REMEDIATION_BACKLOG.md', 'KNOWN_LIMITATIONS.md', 'OWNER_DECISION_REGISTER.md', 'EXECUTION_RECORD.md'];
if (want('documents')) {
  console.log('\n# L. Required documents');
  for (const d of DOCS) {
    if (!existsSync(join(P7, d))) { t(d + ' exists', false); continue; }
    const s = readFileSync(join(P7, d), 'utf8');
    t(d + ': carries the three required statements', STATEMENTS.every((x) => s.includes(x)));
    t(d + ': no unnegated readiness or validation claim', scanUnsupportedClaims(s).length === 0, JSON.stringify(scanUnsupportedClaims(s).slice(0, 2)));
    t(d + ': no em-dash', !s.includes('—'));
  }
  const h = existsSync(join(P7, 'PHASE7_HANDOFF.md')) ? readFileSync(join(P7, 'PHASE7_HANDOFF.md'), 'utf8') : '';
  t('handoff states NO_GO_NOT_VERIFIED is unchanged', /NO_GO_NOT_VERIFIED/.test(h));
}

t('suite made no network attempt', trap.count() === 0, trap.count());
console.log('\n' + (pass + fail) + ' checks: ' + pass + ' passed, ' + fail + ' failed');
if (fail) console.log('failed: ' + failed.join('; '));
if (RECORD) {
  const out = join(P7, 'execution-record'); mkdirSync(out, { recursive: true });
  const stamp = { generated_at: new Date().toISOString(), command: 'node tests/engine-remediation-phase7/run.mjs --record' + (ONLY ? ' --only ' + ONLY : ''), node: process.version, network_attempts: trap.count(), repository_head: git(['rev-parse', 'HEAD']).trim() };
  if (records.mutation) writeFileSync(join(out, 'MUTATION_EVIDENCE.json'), JSON.stringify(Object.assign({}, stamp, records.mutation), null, 2) + '\n');
  if (records.determinism) writeFileSync(join(out, 'DETERMINISM_RECORD.json'), JSON.stringify(Object.assign({}, stamp, records.determinism), null, 2) + '\n');
  if (!ONLY) writeFileSync(join(out, 'TEST_RESULTS.json'), JSON.stringify(Object.assign({}, stamp, { passed: pass, failed: fail, failed_checks: failed, scenarios: records.scenarios || null, qualification: records.qualification || null }), null, 2) + '\n');
}
trap.restore();
process.exit(fail ? 1 : 0);
