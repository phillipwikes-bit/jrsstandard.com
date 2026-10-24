#!/usr/bin/env node
// JRS PHASE 8: governance, preservation and evaluation-readiness suite.
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-governance-phase8/run.mjs [--record] [--only <group>]
//
// Groups: safety, registry, governance, records, phase81, phase82, probes, documents, manifest, mutation.
// Offline: refuses provider configuration; traps every network API. Never runs or edits an earlier suite;
// the whole-worktree run is made by tools/engine-governance-phase8-replay.mjs and read here as a record.

import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync, existsSync, readdirSync, statSync } = await import('node:fs');
const { join } = await import('node:path');
const { tmpdir } = await import('node:os');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath, pathToFileURL } = await import('node:url');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const P8 = join(REPO, 'research/engine-governance-phase8-2026-10-19');
const LIB = 'lib/engine-governance-phase8';
const SCAN = 'tests/engine-governance-phase8/harness-scan.mjs';
// Phase 8 file manifest exclusions: the manifest itself, the two files this suite writes with --record, and the later-package registry (which binds the manifest by hash).
export const MANIFEST_EXCLUDED = ['research/engine-governance-phase8-2026-10-19/PHASE8_FILE_MANIFEST_SHA256.txt', 'research/engine-governance-phase8-2026-10-19/execution-record/PHASE8_TEST_RESULTS.json', 'research/engine-governance-phase8-2026-10-19/execution-record/MUTATION_EVIDENCE.json', 'research/engine-governance-phase8-2026-10-19/governance/LATER_PACKAGE_REGISTRY.json', 'research/engine-governance-phase8-2026-10-19/execution-record/WORKTREE_RUN_RECORD.json'];
const MANIFEST_EXCLUDED_PREFIX = 'research/engine-governance-phase8-2026-10-19/execution-record/worktree-output/';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const RECORD = process.argv.includes('--record');
const want = (g) => !ONLY || ONLY === g;
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const git = (a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let pass = 0, fail = 0; const failed = [], counts = { direct: 0, negative: 0, mutation: 0 }, records = {};
const t = (name, ok, detail, kind = 'direct') => { counts[kind] = (counts[kind] || 0) + 1; if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; failed.push(name); console.log('FAIL  ' + name + (detail ? '\n        ' + String(detail).slice(0, 600) : '')); } };

const load = async (base) => { const u = (f) => pathToFileURL(join(base, LIB, f)).href; return { registry: await import(u('registry.mjs')), governance: await import(u('governance.mjs')), qualification: await import(u('qualification.mjs')),
  protocol: await import(u('evaluation-protocol.mjs')), change: await import(u('change-impact.mjs')), decisions: await import(u('decisions.mjs')), claims: await import(u('claims.mjs')),
  scan: await import(pathToFileURL(join(base, SCAN)).href), later: await import(u('later-packages.mjs')), admission: await import(u('admission.mjs')), iso: await import(u('isolated-replay.mjs')), freeze: await import(u('handoff-freeze.mjs')) }; };
const REAL = await load(REPO);
const { PACKAGES, CURRENT_PACKAGE, STATUS_LINES, BASELINE_COMMIT, verifyPackage, buildManifest, sha256, parseManifestText } = REAL.registry;
const { makeProbes, MUTATIONS } = await import('./probes.mjs');
const manifests = Object.fromEntries(PACKAGES.map((p) => [p.id, existsSync(join(P8, 'registry/manifests', p.id + '.sha256')) ? readFileSync(join(P8, 'registry/manifests', p.id + '.sha256'), 'utf8') : '']));
const untracked = git(['ls-files', '--others', '--exclude-standard']).trim().split('\n').filter(Boolean);
const compat = J('governance/COMPATIBILITY_MANIFEST.json');
const runRec = existsSync(join(P8, 'execution-record/WORKTREE_RUN_RECORD.json')) ? J('execution-record/WORKTREE_RUN_RECORD.json') : null;
const verification = PACKAGES.map((p) => verifyPackage(REPO, p, manifests[p.id], null));
const { DECISIONS: P7D } = await import('../../research/engine-remediation-phase7-2026-10-19/workbench/decisions.mjs');
const P8_SOURCES = untracked.filter((f) => REAL.registry.ownsPath(CURRENT_PACKAGE, f) && /\.m?js$/.test(f)).map((f) => [f, readFileSync(join(REPO, f), 'utf8')]);
const { registryContext } = await import('../../research/engine-governance-phase8-2026-10-19/governance/build-later-registry.mjs');
const RC = registryContext(REPO);
const laterRegistry = existsSync(join(P8, 'governance/LATER_PACKAGE_REGISTRY.json')) ? J('governance/LATER_PACKAGE_REGISTRY.json') : { packages: [] };
const regCtx = Object.assign({}, RC, { filesByPackage: Object.fromEntries(laterRegistry.packages.map((e) => [e.package_id, untracked.filter((f) => REAL.later.ownsLater(e, f))])) });
const trackedBaseline = new Set(git(['ls-tree', '-r', '--name-only', BASELINE_COMMIT]).trim().split('\n'));
const freezeInputs = existsSync(join(P8, 'evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json')) ? { versionRegistry: J('registry/VERSION_REGISTRY.json'), laterRegistry, qualification: J('qualification/CANDIDATE_QUALIFICATION_RECORD.json'),
  protocol: J('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json'), changeModel: J('change-model/CHANGE_IMPACT_MODEL.json'), decisions: J('decisions/OWNER_DECISIONS.json'), phase7Seal: JSON.parse(readFileSync(join(REPO, 'research/engine-remediation-phase7-2026-10-19/SEAL.json'), 'utf8')) } : null;
const P82C = existsSync(join(P8, 'execution-record/PHASE8_2_ADMISSION_CORRECTION_RECORD.json')) ? J('execution-record/PHASE8_2_ADMISSION_CORRECTION_RECORD.json') : null;
const X = { root: REPO, manifests, laterRegistry, regCtx, decisionsEvidencePath: 'research/engine-governance-phase8-2026-10-19/OWNER_DECISION_REGISTER.md', p82hist: P82C ? P82C.phase8_2_historical_state : null, mtimeOf: (f) => statSync(join(REPO, f)).mtimeMs,
  p8hist: existsSync(join(P8, 'execution-record/PHASE8_HISTORICAL_RECORD.json')) ? J('execution-record/PHASE8_HISTORICAL_RECORD.json') : null,
  p8histManifestHash: existsSync(join(P8, 'registry/manifests/phase8-governance-8.1-historical.sha256')) ? 'sha256:' + sha256(readFileSync(join(P8, 'registry/manifests/phase8-governance-8.1-historical.sha256'))) : null, trackedBaseline, freezeInputs, versionRegistry: J('registry/VERSION_REGISTRY.json'),
  isoRecord: existsSync(join(P8, 'execution-record/ISOLATED_REPLAY_RECORD.json')) ? J('execution-record/ISOLATED_REPLAY_RECORD.json') : null,
  freezeFile: existsSync(join(P8, 'evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json')) ? J('evaluation/INDEPENDENT_EVALUATION_HANDOFF_FREEZE.json') : null, libSources: P8_SOURCES.filter(([f]) => f.startsWith(LIB + '/')), harnessSources: P8_SOURCES, phase7FileCount: parseManifestText(manifests['phase7-candidate']).length, manifest: compat, run: runRec ? { suites: runRec.suites } : { suites: {} },
  allUntracked: untracked, ctx: { manifest: compat, untracked: untracked.filter((f) => REAL.later.inPhase8Scope(f)), phase6Files: new Set(parseManifestText(manifests['phase6-reliability']).map((r) => r.path)), verification }, phase7Decisions: P7D,
  protocolSeal: existsSync(join(P8, 'evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json')) ? J('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json').seal_sha256 : null };
// Phase 8.3: the pre-correction state preserved before the classifier correction, and the whole-worktree context the replay uses.
const P83F = 'execution-record/PHASE8_3_CLASSIFIER_CORRECTION_RECORD.json';
X.p83 = existsSync(join(P8, P83F)) ? J(P83F) : null;
X.p83PreManifestHash = existsSync(join(P8, 'registry/manifests/phase8-governance-8.2c-historical.sha256')) ? 'sha256:' + sha256(readFileSync(join(P8, 'registry/manifests/phase8-governance-8.2c-historical.sha256'))) : null;
X.p83PreRecordHashes = X.p83 ? Object.fromEntries(X.p83.pre_correction_state.preserved_records.map((r) => [r.file, existsSync(join(P8, r.file)) ? 'sha256:' + sha256(readFileSync(join(P8, r.file))) : null])) : {};
X.runRec = runRec;
X.ctxFull = Object.assign({}, X.ctx, { untracked, later: REAL.later.laterCompatibilityContext(untracked, { registry: laterRegistry, registryProblems: REAL.later.validateLaterRegistry(laterRegistry, regCtx), packageStates: regCtx.packageStates, mtimeOf: X.mtimeOf }) });

// ---------------------------------------------------------------- A. safety and boundaries
if (want('safety')) {
  console.log('\n# A. Boundaries');
  t('HEAD is still ' + BASELINE_COMMIT.slice(0, 7) + ' (no commit)', git(['rev-parse', 'HEAD']).trim() === BASELINE_COMMIT);
  t('branch unchanged (claude/engine-reliability-phase6-local)', git(['rev-parse', '--abbrev-ref', 'HEAD']).trim() === 'claude/engine-reliability-phase6-local');
  t('PR #40 branch still at 428c307', git(['rev-parse', 'claude/engine-assurance-2026-10-10']).trim() === BASELINE_COMMIT);
  t('no tracked file differs from 428c307 (public routes, deployment, B-018, trackers, ledgers)', git(['diff', '--name-only', BASELINE_COMMIT]).trim() === '' && git(['diff', '--cached', '--name-only']).trim() === '');
  const bl = JSON.parse(readFileSync(join(REPO, '.jrs/state/BLOCKERS.json'), 'utf8')); let st = null; const w = (o) => { if (o && typeof o === 'object') { if (o.blocker_id === 'B-018') st = o.status; Object.values(o).forEach(w); } }; w(bl);
  t('B-018 remains OPEN', st === 'OPEN');
  const p8 = untracked.filter((f) => REAL.registry.ownsPath(CURRENT_PACKAGE, f));
  // Phase 8.2: Phase 8's location check is classified from the registry. A declared later package is a composition
  // condition, reported but not a failure; an undeclared path, invalid reservation, files before admission or a changed
  // Phase 8 protected file fail.
  const scope = REAL.later.classifyPhase8Scope(untracked, { registry: laterRegistry, registryProblems: REAL.later.validateLaterRegistry(laterRegistry, regCtx), phase8Verification: { ok: true }, packageStates: regCtx.packageStates, mtimeOf: (f) => statSync(join(REPO, f)).mtimeMs });
  t('every untracked file belongs to a registered package or a declared later package', scope.verdict !== 'fail_closed', scope.items.filter((i) => i.classification !== 'declared_composition_condition').map((i) => i.classification + ': ' + (i.path || i.detail)).slice(0, 5).join('; '));
  for (const c of scope.conditions) console.log('COND  ' + c.condition_id + ': ' + c.paths.length + ' files of ' + c.later_package + ', construction state ' + c.construction_state + ' (' + c.label + ')');
  t('no Phase 8 file name suggests source-aligned, sealed evaluation or label material', !p8.some((f) => /Source_Aligned|Blueprint_Aligned|project_sources|holdout|adjudicat/i.test(f)));
  const provFindings = p8.filter((f) => /\.m?js$/.test(f)).flatMap((f) => REAL.scan.scanProvider(readFileSync(join(REPO, f), 'utf8'), f));
  t('no provider identifier, key, key name, endpoint, environment access or SDK import in Phase 8 code', provFindings.length === 0, REAL.scan.describe(provFindings));
}

// ---------------------------------------------------------------- B. registry
if (want('registry')) {
  console.log('\n# B. Version registry and manifests');
  const reg = J('registry/VERSION_REGISTRY.json');
  t('registry lists the seven earlier packages', JSON.stringify(reg.packages.map((p) => p.id)) === JSON.stringify(PACKAGES.map((p) => p.id)));
  for (const p of reg.packages) {
    t(p.id + ': identity, paths, file count, package hash, command, recorded result, limitations and status recorded', !!(p.id && p.title && p.source_paths.length && p.file_count > 0 && /^sha256:[0-9a-f]{64}$/.test(p.package_sha256) && p.test_command && p.latest_recorded_result && p.known_limitations && REAL.registry.PACKAGE_STATUSES.includes(p.status)));
    const v = verification.find((x) => x.package === p.id);
    t(p.id + ': byte-identical to its manifest (' + p.file_count + ' files)', v.ok && v.package_sha256 === p.package_sha256, v.problems.join(','));
  }
  t('Phase 7 manifest covers every Phase 7 file (147) with SHA-256', X.phase7FileCount === 147 && parseManifestText(manifests['phase7-candidate']).every((r) => /^[0-9a-f]{64}$/.test(r.sha256)));
  t('Phase 7 manifest reproduces byte-for-byte on a second build', buildManifest(REPO, PACKAGES[6]).manifest_text === manifests['phase7-candidate'] && buildManifest(REPO, PACKAGES[6]).manifest_text === buildManifest(REPO, PACKAGES[6]).manifest_text);
  t('Phase 6 manifest equals the Phase 7 start snapshot', parseManifestText(readFileSync(join(REPO, 'research/engine-remediation-phase7-2026-10-19/preservation/PHASE6_UNTRACKED_SHA256_AT_START.txt'), 'utf8')).map((r) => r.sha256 + r.path).sort().join() === parseManifestText(manifests['phase6-reliability']).map((r) => r.sha256 + r.path).sort().join());
  t('Phase 7 corroboration: seal verifies and no file modified after the final handoff', reg.phase7_corroboration.seal_verifies === true && reg.phase7_corroboration.modified_after_handoff === false);
  t('registry hash verifies', reg.registry_sha256 === REAL.registry.hashOf((({ recorded_at, registry_sha256, ...r }) => r)(reg)));
  t('registry makes no readiness, validation, ownership, commercial or release claim', REAL.claims.scanClaims(JSON.stringify(reg)).length === 0 && reg.release_status === 'NO_GO_NOT_VERIFIED', JSON.stringify(REAL.claims.scanClaims(JSON.stringify(reg)).slice(0, 2)));
  t('Phase 6 and Phase 7 recorded results kept as time-bound records', reg.packages.find((p) => p.id === 'phase7-candidate').latest_recorded_result.result === '328/328' && reg.packages.find((p) => p.id === 'phase6-reliability').latest_recorded_result.result === '316/316');
}

// ---------------------------------------------------------------- C. governance on the recorded whole-worktree run
if (want('governance')) {
  console.log('\n# C. Cross-package governance');
  t('compatibility manifest defines exactly four conditions CPC-01 to CPC-04', JSON.stringify(compat.conditions.map((c) => c.condition_id)) === JSON.stringify(['CPC-01', 'CPC-02', 'CPC-03', 'CPC-04']));
  t('compatibility manifest carries the language rule verbatim', compat.language_rule === REAL.governance.LANGUAGE_RULE);
  for (const c of compat.conditions) {
    const src = readFileSync(join(REPO, c.originating_suite), 'utf8');
    const line = +c.check_source.split(':')[1].split(' ')[0];
    t(c.condition_id + ': originating check exists at ' + c.check_source + ' and the suite file is unchanged', src.split('\n')[line - 1] !== undefined && (src.includes(c.exact_check) || /unchanged since ' \+ BASE_COMMIT/.test(src.split('\n')[line - 1])) && verification.find((v) => v.package === c.originating_package).ok);
  }
  t('whole-worktree run record exists and is complete for all six earlier suites', !!runRec && Object.keys(REAL.governance.SUITES).every((k) => runRec.suites[k] && runRec.suites[k].complete));
  // Phase 8.3: recomputed over the whole worktree with the registry context, exactly as the replay classifies.
  const cls = runRec ? REAL.governance.classifyRun({ suites: runRec.suites }, X.ctxFull) : null;
  t('recomputed classification: declared conditions only', cls && cls.verdict === 'declared_conditions_only', cls && JSON.stringify(cls.items.filter((i) => REAL.governance.FAIL_CLOSED.includes(i.classification))).slice(0, 500));
  t('recorded run verdict matches recomputation', runRec && runRec.classification.verdict === (cls && cls.verdict));
  t('v0.1, v0.2 and v0.3 show no failing check in the whole-worktree run', runRec && ['v0.1-assurance', 'v0.2-evidence-contract', 'v0.3-evidence-graph'].every((k) => runRec.suites[k].failed === 0));
  t('Phase 4 shows only CPC-01, Phase 6 only CPC-02, Phase 7 only CPC-03 and CPC-04', cls && JSON.stringify(cls.suites['phase4-change-control'].conditions) === '["CPC-01"]' && JSON.stringify(cls.suites['phase6-reliability'].conditions) === '["CPC-02"]' && JSON.stringify(cls.suites['phase7-candidate'].conditions.sort()) === '["CPC-03","CPC-04"]');
  t('packages unchanged by the whole-worktree run', runRec && runRec.packages_unchanged_by_run === true);
  t('whole-worktree run made no network attempt', runRec && runRec.network_attempts === 0);
}

// ---------------------------------------------------------------- D. structured records
if (want('records')) {
  console.log('\n# D. Qualification, protocol, change model and decisions as recorded');
  const q = J('qualification/CANDIDATE_QUALIFICATION_RECORD.json');
  const fresh = REAL.qualification.buildQualificationRecord(REPO, manifests['phase7-candidate'], P7D);
  t('qualification record matches a fresh build from the recorded Phase 7 artifacts', q.record_sha256 === fresh.record_sha256);
  t('qualification record validates', REAL.qualification.validateQualificationRecord(q).length === 0, REAL.qualification.validateQualificationRecord(q).join('; '));
  t('qualification record states what local checks do not establish', REAL.qualification.NOT_ESTABLISHED.every((x) => q.not_established.includes(x)) && /not an independent evaluation/.test(q.statement));
  const pr = J('evaluation/INDEPENDENT_EVALUATION_PROTOCOL.json');
  t('protocol file is sealed and unchanged', pr.seal_sha256 === REAL.protocol.sealProtocol().seal_sha256);
  t('protocol is execution-disabled, not authorized, not conducted', pr.execution_enabled === false && pr.authorization === 'not_authorized' && pr.conducted === false);
  t('protocol defines eight measures, none calculated', pr.measures.length === 8 && pr.measures.every((m) => m.calculated === false && !('value' in m)));
  const cm = J('change-model/CHANGE_IMPACT_MODEL.json');
  t('change model records the conservative rule and ten classes', cm.conservative_rule === REAL.change.CONSERVATIVE_RULE && cm.classes.length === 10);
  const od = J('decisions/OWNER_DECISIONS.json');
  t('owner-decision register validates and carries all Phase 7 decisions', REAL.decisions.validateDecisionRegister(od.decisions).length === 0 && od.phase7_decisions_carried.length === 8);
  const execFindings = readdirSync(join(REPO, LIB)).flatMap((f) => REAL.scan.scanExecution(readFileSync(join(REPO, LIB, f), 'utf8'), LIB + '/' + f));
  t('no Phase 8 module can start a process (other than read-only git), fetch, or reach a URL', execFindings.length === 0, REAL.scan.describe(execFindings));
}

// ---------------------------------------------------------------- D2. Phase 8.1 records
if (want('phase81')) {
  console.log('\n# D2. Phase 8.1 registry, composition, isolated replay and handoff freeze as recorded');
  t('later-package registry file present and valid (three retroactive seeds; counts derived)', REAL.later.registrySummary(laterRegistry).retroactive_seeds === 3 && REAL.later.validateLaterRegistry(laterRegistry, regCtx).length === 0, REAL.later.validateLaterRegistry(laterRegistry, regCtx).join('; '));
  t('registry is excluded from the Phase 8 manifest and binds its hash', MANIFEST_EXCLUDED.includes('research/engine-governance-phase8-2026-10-19/governance/LATER_PACKAGE_REGISTRY.json') && laterRegistry.packages[2].manifest_binding.package_sha256 === RC.manifestHashes['phase8-governance']);
  t('historical compatibility manifest (CPC-01 to CPC-04) retained', compat.conditions.length === 4 && compat.conditions.every((c, i) => c.condition_id === 'CPC-0' + (i + 1)));
  const comp = runRec && runRec.composition;
  t('whole-worktree record carries a registry-derived composition bound to this registry\'s governance content', !!comp && comp.registry_governance_sha256 === laterRegistry.governance_sha256 && laterRegistry.governance_sha256 === REAL.later.governanceHash(laterRegistry));
  t('recorded composition verdict: declared composition conditions only', !!comp && comp.verdict === 'declared_composition_conditions_only' && comp.fail_closed_items === 0);
  t('recorded composition: seed-derived conditions are six and cover CPC-01 to CPC-04; the total is derived from the registry', !!comp && comp.conditions.filter((c) => REAL.later.SEED_IDS.includes(c.later_package)).length === 6 && comp.conditions.every((c) => laterRegistry.packages.some((e) => e.package_id === c.later_package)) && JSON.stringify([...new Set(comp.conditions.map((c) => c.historical_example))].sort()) === '["CPC-01","CPC-02","CPC-03","CPC-04"]');
  t('recomputed composition equals the recorded composition', !!comp && JSON.stringify(REAL.later.deriveComposition({ suites: runRec.suites }, { registry: laterRegistry, untracked, phase6Files: X.ctx.phase6Files, verification }).conditions.map((c) => c.condition_id).sort()) === JSON.stringify(comp.conditions.map((c) => c.condition_id).sort()));
  t('recorded dual context keeps historical, isolated and composition results separate for six packages', !!runRec && Array.isArray(runRec.dual_context) && ['v0.1-assurance', 'v0.2-evidence-contract', 'v0.3-evidence-graph', 'phase4-change-control', 'phase6-reliability', 'phase7-candidate'].every((id) => runRec.dual_context.some((d) => d.package === id)) && runRec.dual_context.every((d) => d.historical && 'composition' in d && !('result' in d)));
  const iso = X.isoRecord;
  t('isolated replay record: Phase 4, 6 and 7 replayed, clean, temporary copies deleted, no network', !!iso && iso.replays.map((r) => r.package).join() === 'phase4-change-control,phase6-reliability,phase7-candidate' && iso.replays.every((r) => !r.refused && r.contamination.clean) && iso.temporary_copies_deleted && iso.network_attempts === 0);
  t('isolated replay results equal the historical records (269/269, 316/316, 328/328)', !!iso && iso.replays.map((r) => r.passed + '/' + r.total).join() === '269/269,316/316,328/328');
  t('no isolated replay temporary directory remains', !readdirSync(tmpdir()).some((f) => f.startsWith('p8-iso-')));
  t('handoff freeze file validates and is execution-disabled', !!X.freezeFile && REAL.freeze.validateHandoffFreeze(X.freezeFile).length === 0 && X.freezeFile.execution_enabled === false);
  t('handoff freeze records B-018 as OPEN', !!X.freezeFile && X.freezeFile.b018.status === 'OPEN');
  t('no Phase 8 record presents B-018 as resolved', untracked.filter((f) => REAL.registry.ownsPath(CURRENT_PACKAGE, f) && /\.(?:json|md)$/.test(f) && !/worktree-output/.test(f)).every((f) => !REAL.later.claimsB018Resolved(readFileSync(join(REPO, f), 'utf8'))));
}

// ---------------------------------------------------------------- D3. Phase 8.2 governance amendment as recorded
if (want('phase82')) {
  console.log('\n# D3. Phase 8.2 amendment: Phase 8 as a governed historical package');
  const h = X.p8hist;
  t('Phase 8 historical record: 370/370 at 2026-10-20T03:38:10.929Z, time-bound to the 8.1 scope', !!h && h.historical_result.result === '370/370' && h.historical_result.recorded_at === '2026-10-20T03:38:10.929Z' && /before the Phase 8.2/.test(h.scope));
  t('Phase 8 historical manifest present and bound to the historical record', !!h && h.historical_manifest.sha256 === X.p8histManifestHash);
  t('Phase 8 isolated replay recorded separately (370/370, first attempt disclosed)', !!h && h.isolated_replay.result === '370/370' && /369\/370/.test(h.isolated_replay.first_attempt));
  const od = J('decisions/OWNER_DECISIONS.json');
  const auth = (od.owner_authorizations || []).find((a) => a.id === 'OWNER_WORK_ASSIGNMENT_2026-10-20_PHASE9_HUMAN_ADJUDICATION_LAYER');
  t('owner authorization recorded with local-construction scope only', !!auth && REAL.decisions.validateAuthorization(auth).length === 0);
  // Phase 8.2 admission correction: these were permanent-absence checks; they are historical-scope checks against the recorded Phase 8.2 state.
  const h82 = P82C && P82C.phase8_2_historical_state;
  t('at Phase 8.2 completion no Phase 9 reservation existed (historical scope)', !!h82 && h82.phase9_admitted === false && h82.registry_summary.admitted_future_packages === 0 && /^sha256:[0-9a-f]{64}$/.test(h82.registry_governance_sha256));
  t('at Phase 8.2 completion no Phase 9 path existed (historical scope)', !!h82 && h82.phase9_paths_present === 0);
  t('Phase 8.2 historical result preserved (435/435, 85/85; isolated replay 435/435)', !!h82 && h82.result === '435/435' && h82.mutations === '85/85' && h82.isolated_replay.result === '435/435' && h82.historical_manifest.sha256 === 'sha256:' + sha256(readFileSync(join(P8, h82.historical_manifest.file))));
  const p9 = laterRegistry.packages.filter((e) => (e.owner_decision_reference || {}).reference === (auth || {}).id);
  t('any reservation under the Phase 9 authorization exists only through a valid admission after Phase 8.2 completed', p9.every((e) => e.entry_class === 'admitted_future_package' && e.admission_record && e.admission_record.owner_decision_reference === e.owner_decision_reference.reference && Date.parse(e.admission_record.admitted_at) > Date.parse((h82 || {}).completed_at)) && REAL.later.validateLaterRegistry(laterRegistry, regCtx).length === 0);
  t('every Phase 9 path is permitted only through the registry (an unadmitted path fails closed)', untracked.filter((f) => /human-review-phase9/.test(f)).every((f) => laterRegistry.packages.some((e) => e.entry_class === 'admitted_future_package' && REAL.later.ownsLater(e, f))));
  t('registry records entry classes and derived counts', laterRegistry.packages.every((e) => REAL.later.ENTRY_CLASSES.includes(e.entry_class)) && JSON.stringify(laterRegistry.summary) === JSON.stringify(REAL.later.registrySummary(laterRegistry)));
  // The replay tool runs this suite after writing the six-suite record, then adds the Phase 8 part; during that self-run the Phase 8 part is not yet recorded.
  const selfRun = process.env.JRS_PHASE8_SELF_RUN === '1';
  const pc = runRec && runRec.phase8_composition;
  t('whole-worktree record carries the Phase 8 composition result' + (selfRun ? ' (self-run: recorded after this run)' : ''), selfRun ? !pc || !!pc : !!pc && pc.complete && pc.verdict === 'declared_composition_conditions_only' && pc.failed === 0);
  const d8 = runRec && runRec.dual_context ? runRec.dual_context.find((d) => d.package === 'phase8-governance') : null;
  t('dual context includes Phase 8 with its historical result unchanged' + (selfRun ? ' (self-run)' : ''), selfRun ? true : !!d8 && d8.historical.result === '370/370' && d8.isolated_replay.result === '370/370' && !!d8.composition);
}

// ---------------------------------------------------------------- E. probes (direct and negative)
if (want('probes') || want('mutation')) {
  var PROBES = makeProbes(X);
}
if (want('probes')) {
  console.log('\n# E. Direct and adversarial probes');
  for (const p of PROBES) { let ok; try { ok = p.run(REAL) === true; } catch (e) { ok = false; } t(p.name, ok, null, p.kind); }
}

// ---------------------------------------------------------------- F. documents
const DOCS = ['PHASE8_HANDOFF.md', 'VERSION_REGISTRY.md', 'CROSS_PACKAGE_TEST_GOVERNANCE.md', 'CANDIDATE_QUALIFICATION_RECORD.md', 'INDEPENDENT_EVALUATION_PROTOCOL.md', 'EVALUATION_MEASUREMENT_DICTIONARY.md',
  'CHANGE_IMPACT_AND_ROLLBACK_MODEL.md', 'KNOWN_LIMITATIONS_AND_OPEN_ISSUES.md', 'OWNER_DECISION_REGISTER.md', 'EXECUTION_RECORD.md', 'MUTATION_TEST_RECORD.md', 'PHASE8_FILE_MANIFEST_SHA256.txt',
  'TEST_GOVERNANCE_SCALABILITY_MODEL.md', 'LATER_PACKAGE_REGISTRY.md', 'DUAL_CONTEXT_RESULT_MODEL.md', 'ISOLATED_HISTORICAL_REPLAY_PROTOCOL.md', 'FUTURE_PACKAGE_ADMISSION_GATE.md', 'INDEPENDENT_EVALUATION_HANDOFF_FREEZE.md', 'PHASE8_1_EXECUTION_RECORD.md', 'PHASE8_1_MUTATION_RECORD.md',
  'PHASE8_2_GOVERNANCE_AMENDMENT.md', 'PHASE8_2_EXECUTION_RECORD.md', 'PHASE8_2_MUTATION_RECORD.md', 'CHANGELOG.md', 'PHASE8_2_ADMISSION_CORRECTION_HANDOFF.md', 'PHASE8_3_CLASSIFIER_CORRECTION.md'];
if (want('documents')) {
  console.log('\n# F. Required documents');
  for (const d of DOCS) {
    if (!existsSync(join(P8, d))) { t(d + ' exists', false); continue; }
    const s = readFileSync(join(P8, d), 'utf8');
    t(d + ': carries the three required statements', STATUS_LINES.every((x) => s.includes(x)));
    if (d.endsWith('.md')) {
      t(d + ': no unsupported claim', REAL.claims.scanClaims(s).length === 0, JSON.stringify(REAL.claims.scanClaims(s).slice(0, 2)));
      t(d + ': no em-dash', !s.includes('—'));
    }
  }
  const h = existsSync(join(P8, 'PHASE8_HANDOFF.md')) ? readFileSync(join(P8, 'PHASE8_HANDOFF.md'), 'utf8') : '';
  t('handoff carries the language rule', h.includes(REAL.governance.LANGUAGE_RULE));
  t('governance record names all four conditions and calls none a pass', (() => { const g = existsSync(join(P8, 'CROSS_PACKAGE_TEST_GOVERNANCE.md')) ? readFileSync(join(P8, 'CROSS_PACKAGE_TEST_GOVERNANCE.md'), 'utf8') : ''; return ['CPC-01', 'CPC-02', 'CPC-03', 'CPC-04'].every((c) => g.includes(c)) && !/CPC-0\d[^\n]*\|\s*pass\s*\|/i.test(g); })());
}

// ---------------------------------------------------------------- G. Phase 8 file manifest
if (want('manifest')) {
  console.log('\n# G. Phase 8 file manifest');
  const mf = join(P8, 'PHASE8_FILE_MANIFEST_SHA256.txt');
  if (!existsSync(mf)) t('PHASE8_FILE_MANIFEST_SHA256.txt exists', false);
  else {
    const rows = parseManifestText(readFileSync(mf, 'utf8').split('\n').filter((l) => !l.startsWith('#')).join('\n'));
    const files = REAL.registry.listFiles(REPO, CURRENT_PACKAGE).filter((f) => !MANIFEST_EXCLUDED.includes(f) && !f.startsWith(MANIFEST_EXCLUDED_PREFIX));
    t('manifest lists every Phase 8 file except the declared exclusions', JSON.stringify(rows.map((r) => r.path)) === JSON.stringify(files), files.filter((f) => !rows.some((r) => r.path === f)).concat(rows.filter((r) => !files.includes(r.path)).map((r) => 'extra ' + r.path)).join(', '));
    const bad = rows.filter((r) => r.malformed || !existsSync(join(REPO, r.path)) || sha256(readFileSync(join(REPO, r.path))) !== r.sha256);
    t('every Phase 8 file matches its manifest hash', !bad.length, bad.map((r) => r.path).join(', '));
  }
}

// ---------------------------------------------------------------- H. mutation
if (want('mutation')) {
  console.log('\n# H. Mutation tests (' + MUTATIONS.length + ' deliberate defects in copies)');
  const base = PROBES.map((p) => { try { return p.run(REAL) === true; } catch { return false; } });
  t('every probe passes on the unmutated modules (' + base.length + ')', base.every(Boolean), PROBES.filter((p, i) => !base[i]).map((p) => p.name).join(','));
  const results = [];
  for (const [id, file, find, repl, area] of MUTATIONS) {
    const rel = file.startsWith('tests/') ? file : LIB + '/' + file;
    const src = readFileSync(join(REPO, rel), 'utf8'); const n = src.split(find).length - 1;
    if (n !== 1) { results.push({ id, file, area, result: 'setup_error', detail: 'target occurs ' + n + ' times' }); continue; }
    const dir = mkdtempSync(join(tmpdir(), 'p8-mut-'));
    try {
      cpSync(join(REPO, LIB), join(dir, LIB), { recursive: true });
      cpSync(join(REPO, 'lib/engine-assurance'), join(dir, 'lib/engine-assurance'), { recursive: true });
      cpSync(join(REPO, SCAN), join(dir, SCAN));
      writeFileSync(join(dir, rel), src.replace(find, repl));
      let M; try { M = await load(dir); } catch (e) { results.push({ id, file, area, result: 'load_failure', detail: String(e.message).slice(0, 160) }); continue; }
      const killers = PROBES.filter((p) => { try { return p.run(M) !== true; } catch { return true; } }).map((p) => p.name);
      results.push({ id, file, area, result: killers.length ? 'killed' : 'survived', killed_by: killers });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  for (const r of results) t(r.id + ' (' + r.area + ') ' + r.result + (r.killed_by && r.killed_by.length ? ' by ' + r.killed_by.slice(0, 3).join(', ') + (r.killed_by.length > 3 ? ' (+' + (r.killed_by.length - 3) + ')' : '') : ''), r.result === 'killed', r.detail, 'mutation');
  const killed = results.filter((r) => r.result === 'killed').length;
  t('at least 15 mutations, all killed by a direct probe, none a load failure (' + killed + '/' + results.length + ')', results.length >= 15 && killed === results.length);
  t('mutation temporary directories cleaned up', !readdirSync(tmpdir()).some((f) => f.startsWith('p8-mut-') || f.startsWith('p8-reg-')));
  records.mutation = { total: results.length, killed, survived: results.filter((r) => r.result === 'survived').length, load_failures: results.filter((r) => r.result === 'load_failure').length, setup_errors: results.filter((r) => r.result === 'setup_error').length, probes: PROBES.length, results };
}

t('suite made no network attempt', trap.count() === 0, trap.count());
console.log('\n' + (pass + fail) + ' checks: ' + pass + ' passed, ' + fail + ' failed');
console.log('by kind: direct ' + counts.direct + ', negative ' + counts.negative + ', mutation ' + counts.mutation);
if (fail) console.log('failed: ' + failed.join('; '));
if (RECORD) {
  const out = join(P8, 'execution-record'); mkdirSync(out, { recursive: true });
  const stamp = { generated_at: new Date().toISOString(), command: 'node tests/engine-governance-phase8/run.mjs --record' + (ONLY ? ' --only ' + ONLY : ''), node: process.version, network_attempts: trap.count(), repository_head: git(['rev-parse', 'HEAD']).trim() };
  if (records.mutation) writeFileSync(join(out, 'MUTATION_EVIDENCE.json'), JSON.stringify(Object.assign({}, stamp, records.mutation), null, 2) + '\n');
  if (!ONLY) writeFileSync(join(out, 'PHASE8_TEST_RESULTS.json'), JSON.stringify(Object.assign({}, stamp, { passed: pass, failed: fail, by_kind: counts, failed_checks: failed }), null, 2) + '\n');
}
process.exit(fail ? 1 : 0);
