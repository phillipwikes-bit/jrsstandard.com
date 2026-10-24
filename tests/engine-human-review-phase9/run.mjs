#!/usr/bin/env node
// JRS PHASE 9: human evidence adjudication layer, test suite.
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-human-review-phase9/run.mjs [--record] [--only <group>]
//
// Groups: preservation, scope, direct, adversarial, rehearsal, stability, determinism, content, workbench, documents, manifest, mutation.
// Offline: refuses to start with provider configuration; traps every network API. Every check has a
// kind (direct, adversarial, mutation, stability, determinism, structural). --record writes the
// execution record; it is run before the Phase 9 manifest is written, never after.

import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync, statSync, symlinkSync } = await import('node:fs');
const { join, dirname } = await import('node:path');
const { tmpdir } = await import('node:os');
const { createHash } = await import('node:crypto');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath, pathToFileURL } = await import('node:url');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const PKG = 'phase9-human-evidence-adjudication';
const LIB = 'lib/engine-human-review-phase9';
const RES = 'research/engine-human-review-phase9-2026-10-20';
const PATHS = ['lib/engine-human-review-phase9/', 'tests/engine-human-review-phase9/', 'tools/engine-human-review-phase9-replay.mjs', 'research/engine-human-review-phase9-2026-10-20/'];
const MANIFEST = RES + '/PHASE9_FILE_MANIFEST_SHA256.txt';
const START = '428c307af510ff7378615777251fe252dab2dac7';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const RECORD = process.argv.includes('--record');
const want = (g) => !ONLY || ONLY === g;
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const fsha = (p) => createHash('sha256').update(readFileSync(join(REPO, p))).digest('hex');
const readText = (p) => { try { return readFileSync(join(REPO, p), 'utf8'); } catch { return null; } };
const counts = { direct: 0, adversarial: 0, mutation: 0, stability: 0, determinism: 0, structural: 0 };
let pass = 0, fail = 0, skipped = 0; const failed = [], rows = [];
const t = (kind, name, ok, detail) => {
  rows.push({ kind, name, result: ok ? 'pass' : 'fail' });
  if (ok) { pass++; counts[kind]++; console.log('PASS  [' + kind + '] ' + name); }
  else { fail++; failed.push(name); console.log('FAIL  [' + kind + '] ' + name + (detail ? '\n        ' + String(detail).slice(0, 700) : '')); }
};
const skip = (kind, name, why) => { skipped++; rows.push({ kind, name, result: 'skipped', reason: why }); console.log('SKIP  [' + kind + '] ' + name + ' (' + why + ')'); };
const throwsRefused = (f) => { try { f(); return false; } catch (e) { return /REFUSED/.test(String(e.message)); } };

const load = async (base, tag = '') => {
  const u = (f) => pathToFileURL(join(base, LIB, f)).href + tag;
  return { contract: await import(u('contract.mjs')), dossier: await import(u('dossier.mjs')), controls: await import(u('controls.mjs')), decision: await import(u('decision-model.mjs')),
    protocol: await import(u('protocol.mjs')), rehearsal: await import(u('rehearsal.mjs')), stability: await import(u('stability.mjs')) };
};
const REAL = await load(REPO);
const { makeProbes, MUTATIONS } = await import('./probes.mjs');
const T9 = await import('../../research/engine-human-review-phase9-2026-10-20/stability/transforms.mjs');
const { scanClaims } = await import('../../lib/engine-governance-phase8/claims.mjs');
const { scanProvider, scanExecution } = await import('../engine-governance-phase8/harness-scan.mjs');
const LP = await import('../../lib/engine-governance-phase8/later-packages.mjs');

const J = (p) => JSON.parse(readFileSync(join(REPO, p), 'utf8'));
const CASE_DIR = join(REPO, RES, 'rehearsal/cases');
const X = {
  cases: readdirSync(CASE_DIR).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(CASE_DIR, f), 'utf8'))),
  expectations: J(RES + '/rehearsal/EXPECTATIONS.json').expectations,
  seal: J(RES + '/rehearsal/SEAL.json'),
  firstRun: J(RES + '/rehearsal/FIRST_EVALUATOR_RUN.json'),
  transforms: T9.TRANSFORMS, bases: T9.BASES,
};
const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean).sort();
const ownsP9 = (f) => PATHS.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p));
const P9_FILES = untracked.filter(ownsP9);
const registry = J('research/engine-governance-phase8-2026-10-19/governance/LATER_PACKAGE_REGISTRY.json');
const entry = (registry.packages || []).find((e) => e.package_id === PKG);

// ---------------------------------------------------------------- preservation
if (want('preservation')) {
  t('structural', 'HEAD is still the starting commit 428c307', git(['rev-parse', 'HEAD']).trim() === START);
  t('structural', 'no tracked or staged change from 428c307 (public routes, deployment, B-018, trackers, ledgers, PR #40 branch content)', git(['diff', '--name-only', START]).trim() === '' && git(['diff', '--cached', '--name-only']).trim() === '');
  const bl = J('.jrs/state/BLOCKERS.json'); let st = null; const w = (o) => { if (o && typeof o === 'object') { if (o.blocker_id === 'B-018') st = o.status; Object.values(o).forEach(w); } }; w(bl);
  t('structural', 'B-018 remains OPEN', st === 'OPEN');
  t('structural', 'release status remains NO_GO_NOT_VERIFIED', REAL.contract.RELEASE_STATUS === 'NO_GO_NOT_VERIFIED');
  // The version registry binds the seven earlier package manifests; Phase 8 is bound by its current file manifest. The 8.1 and 8.2
  // historical manifests record superseded Phase 8 states and are themselves Phase 8 files covered by the current Phase 8 manifest.
  const manifests = [...J('research/engine-governance-phase8-2026-10-19/registry/VERSION_REGISTRY.json').packages.map((p) => p.manifest_file), 'research/engine-governance-phase8-2026-10-19/PHASE8_FILE_MANIFEST_SHA256.txt'];
  t('structural', 'version registry binds seven earlier package manifests', manifests.length === 8 && manifests.every((m) => readText(m) !== null));
  for (const m of manifests) {
    const bad = readFileSync(join(REPO, m), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => /^([0-9a-f]{64}) {2}(.+)$/.exec(l)).filter((x) => !x || readText(x[2]) === null || fsha(x[2]) !== x[1]);
    t('structural', 'earlier package byte-identical to its manifest: ' + m.split('/').pop(), bad.length === 0, bad.slice(0, 3).map((x) => x && x[2]).join(', '));
  }
}

// ---------------------------------------------------------------- scope
if (want('scope')) {
  t('structural', 'Phase 9 registry entry is admitted, local_construction_only, with exactly the four approved paths', !!entry && entry.entry_class === 'admitted_future_package' && entry.status === 'local_construction_only' && JSON.stringify(entry.approved_paths) === JSON.stringify(PATHS));
  t('structural', 'Phase 9 registry entry binds the manifest inside the Phase 9 research directory', !!entry && entry.manifest_binding.manifest_file === MANIFEST && LP.manifestFileInResearchPath(entry));
  t('structural', 'Phase 9 registry entry requires the five declared conditions', !!entry && JSON.stringify(entry.affected_earlier_checks) === JSON.stringify(['EC-P4-TOOLS', 'EC-P6-OWNERSHIP', 'EC-P7-OWNERSHIP', 'EC-P7-TOOLS', 'EC-P8-SCOPE']));
  t('structural', 'Phase 9 registry entry restricts provider use, real records, holdouts, evaluation, deployment, commercial use and release', !!entry && ['provider', 'real records', 'holdouts', 'independent evaluation', 'deployment', 'commercial', 'release'].every((w) => entry.restrictions.includes(w)));
  const stray = untracked.filter((f) => /phase9|human-review/i.test(f) && !ownsP9(f) && !f.startsWith('research/engine-governance-phase8-2026-10-19/'));
  t('structural', 'every Phase 9 file is inside the four admitted locations', stray.length === 0, stray.join(', '));
  const at = Date.parse(entry.admission_record.admitted_at);
  const early = P9_FILES.filter((f) => statSync(join(REPO, f)).mtimeMs < at);
  t('structural', 'no Phase 9 file predates the admission record', early.length === 0, early.join(', '));
  const ctx = (files, states) => ({ registry, registryProblems: [], phase8Verification: { ok: true, problems: [] }, mtimeOf: () => at + 1000, packageStates: states });
  const ok = { [PKG]: { state: 'manifest_verified', problems: [] } };
  t('adversarial', 'a Phase 9 file outside its admitted path fails closed (sibling library directory)', LP.classifyPhase8Scope(['lib/engine-human-review-phase9-extra/x.mjs'], ctx(null, ok)).verdict === 'fail_closed');
  t('adversarial', 'a Phase 9 file outside its admitted path fails closed (research directory with a suffix)', LP.classifyPhase8Scope(['research/engine-human-review-phase9-2026-10-20x/y.md'], ctx(null, ok)).verdict === 'fail_closed');
  t('adversarial', 'a Phase 9 file outside its admitted path fails closed (second tool file)', LP.classifyPhase8Scope(['tools/engine-human-review-phase9-replay-2.mjs'], ctx(null, ok)).verdict === 'fail_closed');
  t('adversarial', 'a Phase 9 file in a public or deployment location fails closed', LP.classifyPhase8Scope(['api/human-review.js'], ctx(null, ok)).verdict === 'fail_closed');
  t('direct', 'Phase 9 files inside the admitted paths classify as declared composition conditions only', LP.classifyPhase8Scope(['lib/engine-human-review-phase9/contract.mjs', 'tools/engine-human-review-phase9-replay.mjs'], ctx(null, ok)).verdict === 'declared_composition_conditions_only');
  t('adversarial', 'a Phase 9 package integrity failure fails closed', LP.classifyPhase8Scope(['lib/engine-human-review-phase9/contract.mjs'], ctx(null, { [PKG]: { state: 'integrity_failure', problems: ['changed after manifest: x'] } })).verdict === 'fail_closed');
  t('adversarial', 'a Phase 9 file dated before admission fails closed', LP.classifyPhase8Scope(['lib/engine-human-review-phase9/contract.mjs'], Object.assign(ctx(null, ok), { mtimeOf: () => at - 1000 })).verdict === 'fail_closed');
  const P7_PATTERN = /Source_Aligned|Blueprint_Aligned|project_sources|holdout|adjudicat/i;
  t('structural', 'no present Phase 9 path matches the Phase 7 protected filename pattern', P9_FILES.every((f) => !P7_PATTERN.test(f)), P9_FILES.filter((f) => P7_PATTERN.test(f)).join(', '));
  t('adversarial', 'the Phase 7 protected filename pattern would catch the version 1 document name', P7_PATTERN.test(RES + '/DUAL_REVIEW_' + 'AND_ADJUDICATION_PROTOCOL.md'));
  t('structural', 'no Phase 10 registry entry, file or directory exists', !(registry.packages || []).some((e) => /phase10/i.test(e.package_id)) && !untracked.some((f) => /phase-?10/i.test(f)));
}

// ---------------------------------------------------------------- direct (named probes on the real modules)
const probes = makeProbes(REAL, X);
if (want('direct')) {
  for (const [name, fn] of Object.entries(probes)) { let ok = false, err = null; try { ok = fn() === true; } catch (e) { err = e.message; } t('direct', 'probe ' + name, ok, err); }
  const K = REAL.contract, DM = REAL.decision, CC = REAL.controls, P = REAL.protocol;
  t('direct', 'contract carries the three Phase 9 statements', JSON.stringify(K.PHASE9_STATEMENTS) === JSON.stringify(['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO RELEASE, DEPLOYMENT OR COMMERCIAL READINESS DETERMINATION']));
  t('direct', 'exactly seven admissible outcomes in the stated order', JSON.stringify(K.OUTCOMES) === JSON.stringify(['supports_finding', 'does_not_support_finding', 'insufficient_context', 'ambiguous', 'record_conflict', 'outside_authorized_scope', 'abstain_and_escalate']));
  t('direct', 'five evidence layers kept separate, decision validity out of scope', K.EVIDENCE_LAYERS.length === 5 && /Out of scope/.test(K.EVIDENCE_LAYERS[4].determined_by));
  for (const m of DM.DECISION_MODEL) t('direct', 'decision model entry complete: ' + m.outcome, ['meaning', 'minimum_basis', 'prohibited_reasoning', 'escalation_rule', 'engine_relationship'].every((k) => typeof m[k] === 'string' && m[k].length >= 15));
  for (const c of CC.CONTROLS) t('direct', 'Cognitive Control names its review risk and asks a neutral question: ' + c.id, c.review_risk.length > 20 && /\?$/.test(c.prompt) && CC.isNeutral(c.prompt) && CC.isNeutral(c.review_risk));
  for (const [cid, c] of Object.entries(K.CONDITIONS)) t('direct', 'bounded reviewer question present and asks about the record only: ' + cid, /\?$/.test(c.question) && !/liabil|discriminat|complian|lawful|employment/i.test(c.question));
  for (const m of P.MEASUREMENT_PLAN) t('direct', 'measure defined and marked not measurable locally: ' + m.id, m.status === 'not_measurable_locally' && m.value === null && m.definition.length > 30);
  t('direct', 'five review roles defined with duties and prohibitions', P.ROLES.length === 5 && P.ROLES.every((r) => r.duties && r.prohibited));
  t('direct', 'dual-review protocol: two blinded reviewers, adjudicator only on disagreement or escalation', P.DUAL_REVIEW_PROTOCOL.reviewers_per_packet === 2 && /only when the two outcomes differ or either outcome is escalating/.test(P.DUAL_REVIEW_PROTOCOL.adjudication_trigger));
  t('direct', 'dual-review protocol defines contamination controls, versioning and re-review triggers', P.DUAL_REVIEW_PROTOCOL.contamination_controls.length >= 4 && P.DUAL_REVIEW_PROTOCOL.versioning.length >= 2 && P.DUAL_REVIEW_PROTOCOL.re_review_triggers.length >= 4);
  t('direct', 'future decision ledger structure defined; a complete synthetic row validates', P.validateLedgerRow(Object.assign(Object.fromEntries(P.LEDGER_FIELDS.map((k) => [k, null])), { role: 'reviewer', source: 'human', outcome: 'ambiguous', rationale: 'Two readings of the authority line are possible.', reviewer_placeholder: 'REVIEWER-PLACEHOLDER-2', escalated: true })).length === 0);
  t('direct', 'disagreement protocol prohibits automatic modification and names the governance path', P.DISAGREEMENT_PROTOCOL.prohibited.some((x) => /Automatic modification/.test(x)) && /separately authorized governance proposal/.test(P.DISAGREEMENT_PROTOCOL.change_path));
  t('direct', 'prohibited reviewer questions are listed: liability, discrimination, policy compliance, employment-decision correctness', K.PROHIBITED_QUESTIONS.length === 4);
}

// ---------------------------------------------------------------- adversarial
if (want('adversarial')) {
  const D = REAL.dossier, DM = REAL.decision, CC = REAL.controls, P = REAL.protocol, R = REAL.rehearsal, K = REAL.contract;
  const c0 = X.cases.find((c) => c.packet_id === 'R9-QNS-01');
  const graph = R.compileCase(c0), base = R.blindedPacket(c0, graph).dossier;
  const rehash = (d) => { const { dossier_sha256, ...rest } = d; d.dossier_sha256 = D.hashOf(rest); return d; };
  const tamper = (f) => { const d = JSON.parse(JSON.stringify(base)); f(d); return D.validateDossier(rehash(d)); };
  for (const k of ['outcome', 'rationale', 'cited_evidence', 'confidence', 'reviewer_placeholder']) t('adversarial', 'pre-filled reviewer field rejected: ' + k, tamper((d) => { d.reviewer_response[k] = k === 'cited_evidence' ? ['O3'] : 'x'; }).includes('reviewer response pre-filled'));
  for (const w of ['The quotation proves the finding.', 'This establishes the finding.', 'The quotation supports the finding.', 'This confirms the finding.']) t('adversarial', 'proof assertion rejected in authored text: ' + w, tamper((d) => { d.engine_result.statement = w; }).includes('dossier asserts that a quotation proves the finding'));
  for (const k of ['approved', 'approval', 'recommendation', 'recommended_outcome', 'legal_conclusion']) t('adversarial', 'approval or legal-conclusion field rejected: ' + k, tamper((d) => { d[k] = 'x'; }).some((p) => /approval, recommendation or legal conclusion/.test(p)));
  t('adversarial', 'removed limitation rejected', tamper((d) => { d.engine_limitation = null; }).includes('finding lacks its limitation'));
  t('adversarial', 'altered reviewer question rejected', tamper((d) => { d.reviewer_question = 'Was the decision lawful?'; }).includes('reviewer question missing or altered'));
  t('adversarial', 'unknown condition rejected', tamper((d) => { d.condition.condition_id = 'compliance'; }).includes('finding lacks a known condition'));
  t('adversarial', 'escalation added without an Engine trigger rejected', tamper((d) => { d.escalation = { required: true, triggers: [{ id: 'ET2', text: 'x' }], abstention_available: true }; }).includes('escalation does not follow the Engine output'));
  t('adversarial', 'Cognitive Control removed from the dossier rejected', tamper((d) => { d.cognitive_controls = d.cognitive_controls.slice(0, 7); }).includes('Cognitive Control set incomplete'));
  t('adversarial', 'assertion marked accepted on an unverified quotation rejected', tamper((d) => { d.quotations[0].verified = false; d.quotations[0].verification_state = 'absent'; d.quotations[0].assertion_accepted = true; }).includes('assertion accepted for an unverified quotation'));
  t('adversarial', 'dossier refused for non-synthetic material', throwsRefused(() => D.buildDossiers(graph, { record_id: 'x', synthetic: 'true' })));
  const E = (o) => Object.assign({ source: 'human', outcome: 'supports_finding', rationale: 'The minutes reference names the board and the item.', reviewer_placeholder: 'REVIEWER-PLACEHOLDER-1', cited_evidence: ['O3'], escalated: false }, o);
  t('adversarial', 'reviewer entry from the Engine rejected', DM.validateReviewerEntry(E({ source: 'engine' })).length > 0);
  t('adversarial', 'reviewer entry auto-filled by the system rejected', DM.validateReviewerEntry(E({ source: 'auto_fill' })).length > 0);
  t('adversarial', 'reviewer entry with an inadmissible outcome rejected', DM.validateReviewerEntry(E({ outcome: 'approved' })).includes('outcome not admissible'));
  t('adversarial', 'reviewer entry without a rationale rejected', DM.validateReviewerEntry(E({ rationale: 'ok' })).includes('rationale missing'));
  t('adversarial', 'reviewer entry with a real-looking identity rejected', DM.validateReviewerEntry(E({ reviewer_placeholder: 'A. Reviewer' })).includes('reviewer identity must be a placeholder'));
  t('adversarial', 'deriveOutcome refuses for every rehearsal dossier', X.cases.slice(0, 10).every((c) => throwsRefused(() => DM.deriveOutcome(c))));
  t('adversarial', 'decision model that asks reviewers to decide legal liability is rejected', DM.validateDecisionModel(DM.DECISION_MODEL.map((m, i) => (i ? m : Object.assign({}, m, { meaning: m.meaning + ' Reviewers decide legal liability.' })))).length > 0);
  t('adversarial', 'decision model that lets presence imply support is rejected', DM.validateDecisionModel(DM.DECISION_MODEL.map((m, i) => (i ? m : Object.assign({}, m, { prohibited_reasoning: 'None.' })))).length > 0);
  for (const [w, txt] of [['directive', 'The answer is supports_finding; is that clear?'], ['clinical', 'Does the reviewer show a cognitive disorder?']]) { const cs = JSON.parse(JSON.stringify(CC.CONTROLS)); cs[4].prompt = txt; t('adversarial', 'control with ' + w + ' wording rejected', CC.validateControls(cs).includes('control directs a result: CC-WORDS')); }
  t('adversarial', 'extra control beyond the set rejected', CC.validateControls([...CC.CONTROLS, { id: 'CC-EXTRA', name: 'x', review_risk: 'x', prompt: 'x?' }]).includes('unexpected control set size'));
  t('adversarial', 'running a dual review refuses', throwsRefused(() => P.runDualReview()));
  t('adversarial', 'calculating any reliability measure refuses', P.MEASUREMENT_PLAN.every((m) => throwsRefused(() => P.computeMeasure(m.id))));
  t('adversarial', 'applying a learning record to the Engine refuses', throwsRefused(() => P.applyToEngine({})));
  t('adversarial', 'learning record from an Engine-generated entry refuses', throwsRefused(() => P.createLearningRecord(base, E({ source: 'engine' }), graph)));
  t('adversarial', 'adjudication routing refuses a non-human entry', throwsRefused(() => P.needsAdjudication(E({ source: 'model' }), E({}))));
  t('adversarial', 'ledger row with an unknown role rejected', P.validateLedgerRow(Object.assign(Object.fromEntries(P.LEDGER_FIELDS.map((k) => [k, null])), E({ role: 'analyst' }))).length > 0);
  const caseBad = (o) => R.validateCase(Object.assign(JSON.parse(JSON.stringify(c0)), o));
  t('adversarial', 'case marked holdout-eligible rejected', caseBad({ holdout_eligible: true }).includes('not marked holdout-ineligible'));
  t('adversarial', 'case without the synthetic marker rejected', caseBad({ record_text: 'Record type: supplier access' }).includes('synthetic marker missing'));
  t('adversarial', 'case with personal-data-like text rejected', caseBad({ record_text: c0.record_text + '\nContact: someone' + String.fromCharCode(64) + 'example.org' }).includes('personal-data-like text'));
  t('adversarial', 'case in a provider execution mode rejected', caseBad({ execution_mode: 'live' }).includes('execution mode must be local_mocked'));
  const e0 = X.expectations[0];
  t('adversarial', 'expectation with an inadmissible class rejected', R.validateExpectation(Object.assign({}, e0, { expected_class: 'pass' })).some((p) => /not admissible/.test(p)));
  t('adversarial', 'expectation whose route appropriateness breaks the fixed rule rejected', R.validateExpectation(Object.assign({}, e0, { expected_route_appropriateness: e0.expected_route_appropriateness === 'appropriate' ? 'conservative_over_review' : 'appropriate' })).some((p) => /fixed rule/.test(p)));
  t('adversarial', 'seal rejects an added case', R.verifySeal(X.seal, [...X.cases, Object.assign({}, c0, { packet_id: 'R9-QNS-99' })], X.expectations).includes('sealed case set differs'));
  t('adversarial', 'seal rejects a removed expectation', R.verifySeal(X.seal, X.cases, X.expectations.slice(1)).length > 0);
  t('adversarial', 'blinding check catches an expected-class field', R.checkBlinding({ dossier: {}, expected_class: 'x' }).length > 0);
  t('adversarial', 'blinding check catches a category name', R.checkBlinding({ note: 'quote_present_not_supportive' }).length > 0);
  t('adversarial', 'provider configuration in the environment is refused (checked in-process; no variable is set)', detectProviderConfiguration({ ANTHROPIC_BASE_URL: 'x' }).length === 1 && detectProviderConfiguration({ JRS_EXECUTION_MODE: 'live' }).length === 1);
  let netBlocked = false; try { await fetch('http://127.0.0.1:9/'); } catch (e) { netBlocked = /network_access_prohibited/.test(e.message); }
  t('adversarial', 'a network attempt from the harness is trapped', netBlocked && trap.attempts.length >= 1);
  trap.attempts.length = 0;
}

// ---------------------------------------------------------------- rehearsal
if (want('rehearsal')) {
  const R = REAL.rehearsal;
  t('structural', 'at least 48 rehearsal packets', X.cases.length >= 48, X.cases.length);
  for (const [k, v] of Object.entries(R.CATEGORIES)) { const n = X.cases.filter((c) => c.packet_id.split('-')[1] === k).length; t('structural', 'category minimum met: ' + v.name + ' (' + n + ' >= ' + v.minimum + ')', n >= v.minimum); }
  t('structural', 'every case synthetic and holdout-ineligible, every expectation well formed', X.cases.every((c) => c.synthetic === true && c.holdout_eligible === false && !R.validateCase(c).length) && X.expectations.every((e) => !R.validateExpectation(e).length));
  t('structural', 'seal verifies and was recorded before the first evaluator run', !R.verifySeal(X.seal, X.cases, X.expectations).length && X.seal.sealed_before_first_evaluator_run === true && Date.parse(X.seal.sealed_at) < Date.parse(X.firstRun.evaluated_at) && X.firstRun.seal_sha256 === X.seal.seal_sha256);
  const out = R.evaluateAll(X.cases, X.expectations);
  t('structural', 'evaluator results identical to the first recorded evaluator run', out.results_sha256 === X.firstRun.results_sha256, out.results_sha256 + ' vs ' + X.firstRun.results_sha256);
  const differs = out.results.filter((r) => r.result !== 'as_sealed');
  const disclosed = J(RES + '/rehearsal/DISCLOSED_DIFFERENCES.json').differences;
  t('structural', 'every difference from the seal is disclosed, and only those', JSON.stringify(differs.map((r) => r.packet_id).sort()) === JSON.stringify(disclosed.map((d) => d.packet_id).sort()), differs.map((r) => r.packet_id).join(','));
  t('structural', 'every disclosed difference names its direction, cause and an unapplied learning record, and concerns an Engine prediction only', disclosed.every((d) => d.direction && d.cause && /Not applied/.test(d.learning_record))
    && differs.every((r) => Object.entries(r.checks).every(([k, v]) => v === 'pass' || ['escalation_as_sealed', 'engine_status_as_predicted', 'route_appropriateness_as_sealed'].includes(k))));
  for (const k of ['dossier_valid', 'blinded', 'outcome_unfilled', 'not_more_favourable', 'control_listed']) t('structural', 'all packets pass evaluator check: ' + k, out.results.every((r) => r.checks[k] === 'pass'));
  t('structural', 'no packet is routed away from human review', out.results.every((r) => r.route_appropriateness !== 'inappropriate_not_routed'));
  t('structural', 'favourable Engine statuses on non-supporting packets are reliant on human review and recorded as such', out.results.filter((r) => r.route_appropriateness === 'favourable_status_reliant_on_human_review').length >= 10);
}

// ---------------------------------------------------------------- stability
let stab = null;
if (want('stability')) {
  stab = REAL.stability.runStability(X.transforms, X.bases);
  for (const r of stab.results) t('stability', r.transform_id + ' ' + r.name + ' on ' + r.base + (r.base_unfavourable_or_escalation ? ' (unfavourable or escalation base)' : ''), r.result === 'as_expected' && !r.more_favourable, r.mismatches.join('; '));
  t('structural', 'at least 30 stability transforms, at least 12 from an unfavourable or escalation baseline', stab.total >= 30 && stab.from_unfavourable_or_escalation >= 12, stab.total + ' / ' + stab.from_unfavourable_or_escalation);
  t('structural', 'no invariant transform produced a more favourable human-review class', stab.more_favourable === 0);
}

// ---------------------------------------------------------------- determinism
let det = null;
if (want('determinism')) {
  const R = REAL.rehearsal;
  const passes = [];
  for (let i = 0; i < 5; i++) {
    const ev = R.evaluateAll(X.cases, X.expectations), st = REAL.stability.runStability(X.transforms, X.bases);
    passes.push({ evaluator: ev.results_sha256, stability: R.hashCanonical(st.results), dossiers: R.hashCanonical(X.cases.map((c) => R.blindedPacket(c, R.compileCase(c)).dossier.dossier_sha256)) });
  }
  det = { passes };
  for (const k of ['evaluator', 'stability', 'dossiers']) t('determinism', 'five-pass determinism: ' + k, new Set(passes.map((p) => p[k])).size === 1);
}

// ---------------------------------------------------------------- content
if (want('content')) {
  const files = P9_FILES.filter((f) => !f.endsWith('.png'));
  const code = files.filter((f) => /\.m?js$/.test(f));
  const prov = code.flatMap((f) => scanProvider(readFileSync(join(REPO, f), 'utf8'), f));
  t('structural', 'no provider model identifier, key, key name, endpoint, environment access or SDK import in any Phase 9 script', prov.length === 0, prov.map((x) => x.file + ':' + x.rule).join('; '));
  const ex = code.filter((f) => f.startsWith(LIB)).flatMap((f) => scanExecution(readFileSync(join(REPO, f), 'utf8'), f));
  t('structural', 'no process execution, fetch or network URL in the Phase 9 library', ex.length === 0, ex.map((x) => x.file + ':' + x.rule).join('; '));
  const CRED = /(?:sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/;
  t('structural', 'no credential-like value in any Phase 9 file', files.every((f) => !CRED.test(readFileSync(join(REPO, f), 'utf8'))));
  t('structural', 'no email address in any Phase 9 file', files.every((f) => !/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(readFileSync(join(REPO, f), 'utf8'))));
  t('structural', 'no Phase 9 item is marked holdout-eligible or non-synthetic', files.filter((f) => f.endsWith('.json')).every((f) => !/"holdout_eligible"\s*:\s*true|"synthetic"\s*:\s*false/.test(readFileSync(join(REPO, f), 'utf8'))));
  t('structural', 'every rehearsal record is the fictional GC-001 derivative with the synthetic marker', X.cases.every((c) => c.record_text.startsWith('SYNTHETIC ENGINEERING FIXTURE.') && c.record_text.includes('(fictional)')));
  const prose = files.filter((f) => /\.(?:md|html)$/.test(f));
  const claims = prose.flatMap((f) => scanClaims(readFileSync(join(REPO, f), 'utf8')).map((c) => f + ': ' + (c.term || c.kind) + ' :: ' + String(c.context || '').slice(0, 80)));
  t('structural', 'no readiness, compliance, licensing, commercial, validation or production claim in Phase 9 records or the workbench', claims.length === 0, claims.slice(0, 5).join('\n'));
  t('structural', 'no Phase 9 record presents B-018 as resolved', prose.every((f) => !LP.claimsB018Resolved(readFileSync(join(REPO, f), 'utf8'))));
  t('structural', 'no Phase 9 record asks a reviewer to decide liability, discrimination, policy compliance or an employment decision', prose.every((f) => !/\breviewers? (?:must|should|will) decide (?:legal liability|discrimination|policy compliance|whether an employment)/i.test(readFileSync(join(REPO, f), 'utf8'))));
}

// ---------------------------------------------------------------- workbench
if (want('workbench')) {
  const wb = RES + '/workbench';
  const pages = existsSync(join(REPO, wb)) ? readdirSync(join(REPO, wb)).filter((f) => f.endsWith('.html')) : [];
  t('structural', 'static workbench present', pages.includes('index.html'));
  const h = pages.map((f) => readFileSync(join(REPO, wb, f), 'utf8')).join('\n');
  t('structural', 'workbench: no script, form, input, upload, iframe, authentication or network URL', !!h && !/<script|<form|<input|<textarea|<button|<iframe|<object|<embed|type=["']?file|https?:\/\/|@import|url\(|password|login|sign[- ]in/i.test(h));
  for (const [label, re] of [['dossier boundary', /Textual presence is not semantic support/], ['decision model', /abstain_and_escalate/], ['Cognitive Controls', /CC-ESCALATE/], ['disagreement example', /candidate learning record/i],
    ['limitations and escalation', /Limitations and escalation/], ['unresolved decisions', /Unresolved owner decisions/], ['B-018 OPEN', /B-018[^<]{0,40}OPEN/], ['NO_GO_NOT_VERIFIED', /NO_GO_NOT_VERIFIED/]]) t('structural', 'workbench shows ' + label, re.test(h));
  t('structural', 'workbench shows six blinded examples', (h.match(/class="example"/g) || []).length === 6 && !/R9-[A-Z]{3}-\d{2}/.test(h.split('id="examples"')[1] || 'R9-X-00'));
  const rr = readText(RES + '/execution-record/WORKBENCH_RENDER_RECORD.json');
  const rec = rr ? JSON.parse(rr) : null;
  t('structural', 'workbench rendered at desktop and mobile with zero non-file requests and zero overflow', !!rec && rec.pages.length >= 2 && ['desktop', 'mobile'].every((v) => rec.pages.some((p) => p.viewport === v)) && rec.pages.every((p) => p.non_file_requests === 0 && p.horizontal_overflow === false));
}

// ---------------------------------------------------------------- documents
const DOCS = ['PHASE9_HANDOFF.md', 'PHASE9_EXECUTION_RECORD.md', 'HUMAN_EVIDENCE_DOSSIER_CONTRACT.md', 'REVIEWER_DECISION_MODEL.md', 'COGNITIVE_CONTROLS_FOR_REVIEWERS.md', 'BLINDED_SYNTHETIC_REHEARSAL_PROTOCOL.md',
  'DUAL_REVIEW_PROTOCOL.md', 'RELIABILITY_MEASUREMENT_PLAN.md', 'ENGINE_HUMAN_DISAGREEMENT_PROTOCOL.md', 'KNOWN_LIMITATIONS_AND_STOP_CONDITIONS.md', 'OWNER_DECISION_REGISTER.md', 'CHANGELOG.md'];
if (want('documents')) {
  for (const d of DOCS) {
    const s = readText(RES + '/' + d);
    t('structural', 'document present with the three required statements: ' + d, !!s && /local engineering material only/i.test(s) && /independent evaluation not authorized or conducted/i.test(s) && /no release, deployment,? or commercial readiness determination/i.test(s));
  }
  t('structural', 'no em-dash in Phase 9 document prose', DOCS.every((d) => !(readText(RES + '/' + d) || '').includes('—')));
}

// ---------------------------------------------------------------- manifest
if (want('manifest')) {
  const shaOf = (p) => fsha(p);
  const map = JSON.parse(readText(RES + '/historical/FILENAME_MAPPING.json') || 'null');
  const v1 = readText(RES + '/manifest-history/v1.sha256');
  t('structural', 'Phase 9 manifest version 1 preserved and readable at manifest-history/v1.sha256', !!v1 && !!map && /^# manifest_version: 1$/m.test(v1) && 'sha256:' + fsha(RES + '/manifest-history/v1.sha256') === 'sha256:' + map.manifest_v1.sha256 && v1.split('\n').filter((l) => /^[0-9a-f]{64} {2}/.test(l)).length === map.manifest_v1.files);
  t('structural', 'original document preserved byte for byte under a neutral name', !!map && fsha(RES + '/historical/DOCUMENT_07_V1.md') === map.original_sha256 && !/adjudicat|holdout|label/i.test(map.preserved_original_copy));
  t('structural', 'renamed document content equals the original (no substantive change)', !!map && map.substantive_content_changed === false && readText(RES + '/DUAL_REVIEW_PROTOCOL.md') !== null && fsha(RES + '/DUAL_REVIEW_PROTOCOL.md') === map.original_sha256);
  t('structural', 'mapping record names original, replacement, hashes, reason and the Phase 7 rule', !!map && ['original_filename', 'replacement_filename', 'original_sha256', 'replacement_sha256_at_rename', 'reason', 'phase7_rule_triggered'].every((k) => map[k]) && readText(map.original_filename) === null);
  if (readText(MANIFEST) === null) skip('structural', 'Phase 9 manifest integrity enforced after creation', 'manifest not yet written; recorded runs precede it');
  else {
    const st = LP.packageStateFor(entry, P9_FILES, readText, shaOf);
    t('structural', 'Phase 9 manifest integrity enforced after creation', st.state === 'manifest_verified', st.problems.join('; '));
    t('structural', 'current Phase 9 manifest is version 2 and version 1 is preserved', st.manifest_version === 2 && /^# manifest_version: 2$/m.test(readText(MANIFEST)));
    const st4 = LP.packageStateFor(entry, P9_FILES, (p) => (p === RES + '/manifest-history/v1.sha256' ? null : readText(p)), shaOf);
    t('adversarial', 'a version 2 manifest without the preserved version 1 is an integrity failure', st4.state === 'integrity_failure' && st4.problems.some((x) => /prior manifest version 1 not preserved/.test(x)));
    const st2 = LP.packageStateFor(entry, P9_FILES, readText, (p) => (p === P9_FILES.find((f) => f !== MANIFEST) ? '0'.repeat(64) : shaOf(p)));
    t('adversarial', 'a Phase 9 file changed after the manifest is an integrity failure', st2.state === 'integrity_failure');
    const st3 = LP.packageStateFor(entry, [...P9_FILES, LIB + '/unlisted.mjs'], (p) => (p === LIB + '/unlisted.mjs' ? '' : readText(p)), (p) => (p === LIB + '/unlisted.mjs' ? '0'.repeat(64) : shaOf(p)));
    t('adversarial', 'a Phase 9 file added after the manifest is an integrity failure', st3.state === 'integrity_failure');
  }
}

// ---------------------------------------------------------------- mutation
const mutationRows = [];
if (want('mutation')) {
  const tmp = mkdtempSync(join(tmpdir(), 'p9-mut-'));
  try {
    let n = 0;
    for (const [id, file, from, to, names] of MUTATIONS) {
      n++;
      const dir = join(tmp, 'm' + n); mkdirSync(join(dir, LIB), { recursive: true });
      for (const f of readdirSync(join(REPO, LIB))) cpSync(join(REPO, LIB, f), join(dir, LIB, f));
      for (const d of readdirSync(join(REPO, 'lib'))) if (d !== 'engine-human-review-phase9') symlinkSync(join(REPO, 'lib', d), join(dir, 'lib', d));
      symlinkSync(join(REPO, 'research'), join(dir, 'research'));
      const src = readFileSync(join(dir, LIB, file), 'utf8');
      if (src.split(from).length !== 2) { mutationRows.push({ id, file, result: 'not_applied' }); t('mutation', id + ' applies exactly once in ' + file, false, 'target not unique or missing'); continue; }
      writeFileSync(join(dir, LIB, file), src.replace(from, to));
      let M;
      try { M = await load(dir, '?m=' + n); } catch (e) { mutationRows.push({ id, file, result: 'load_failure', detail: e.message }); t('mutation', id + ' loads (a load failure is never a catch)', false, e.message); continue; }
      const pr = makeProbes(M, X);
      const caught = names.filter((nm) => { try { return pr[nm]() !== true; } catch (e) { return true; } });
      mutationRows.push({ id, file, probes: names, caught_by: caught, result: caught.length ? 'caught' : 'survived' });
      t('mutation', id + ' (' + file + ') caught by named probe ' + (caught.join(', ') || names.join(', ')), caught.length > 0);
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

t('structural', 'no network attempt during the suite', trap.attempts.length === 0, trap.attempts.join(', '));
const summary = { total: pass + fail, pass, fail, skipped, counts, network_attempts: trap.attempts.length };
console.log('\n' + JSON.stringify(summary));
if (RECORD && !ONLY) {
  if (readText(MANIFEST) !== null) { console.error('REFUSED: --record after the Phase 9 manifest would change a manifested file'); process.exit(7); }
  mkdirSync(join(REPO, RES, 'execution-record'), { recursive: true });
  writeFileSync(join(REPO, RES, 'execution-record/PHASE9_TEST_RESULTS.json'), JSON.stringify({ statements: REAL.contract.PHASE9_STATEMENTS, summary, failed, rows, determinism: det, stability: stab ? { total: stab.total, as_expected: stab.as_expected, from_unfavourable_or_escalation: stab.from_unfavourable_or_escalation, more_favourable: stab.more_favourable } : null }, null, 2) + '\n');
  writeFileSync(join(REPO, RES, 'execution-record/MUTATION_EVIDENCE.json'), JSON.stringify({ statements: REAL.contract.PHASE9_STATEMENTS, note: 'Each mutation is one exact-once source change in a copy of the Phase 9 library. Caught means a named probe returned false; a load failure is never counted as a catch.', mutations: mutationRows }, null, 2) + '\n');
}
process.exit(fail ? 1 : 0);
