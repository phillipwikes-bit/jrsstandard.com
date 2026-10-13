#!/usr/bin/env node
// JRS ADAPTIVE RELIABILITY 0.4.1-local: Phase 4 test suite (with targeted control repairs).
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-adaptive-reliability/run.mjs [--record <path>] [--only <group>]
//
// Groups: preservation, knowledge, proposals, refusal, stability, corpus, drift, gate, console, performance, claims, mutation, documents.
// Offline: refuses to start with provider configuration; traps every network API.

import { detectProviderConfiguration, installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
const trap = installNetworkTrap();

const { readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, rmSync, existsSync } = await import('node:fs');
const { join } = await import('node:path');
const { tmpdir } = await import('node:os');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath } = await import('node:url');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const LIB = join(REPO, 'lib');
const PKG = join(REPO, 'research/adaptive-reliability-2026-10-13');
const GCDIR = join(REPO, 'research/evidence-graph-compiler-2026-10-10/fixtures');
const CLOCK = '2026-10-13T00:00:00Z';
const BASE_COMMIT = '5d5374b';
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
const want = (g) => !ONLY || ONLY === g;
const J = (p) => JSON.parse(readFileSync(join(PKG, p), 'utf8'));
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const { compileEvidenceGraph } = await import('../../lib/engine-evidence-graph/compiler.mjs');
const { scanUnsupportedClaims } = await import('../../lib/engine-assurance/content-guard.mjs');
const K = await import('../../lib/engine-change-control/knowledge-base.mjs');
const V = await import('../../lib/engine-change-control/vocab.mjs');
const CR = await import('../../lib/engine-change-control/corpus-replay.mjs');
const { runProbes } = await import('./probes.mjs');

let pass = 0, fail = 0, skip = 0; const failed = [];
const t = (name, ok, detail) => { if (ok) { pass++; console.log('PASS  ' + name); } else { fail++; failed.push(name); console.log('FAIL  ' + name + (detail ? '\n        ' + String(detail).slice(0, 600) : '')); } };
const skipped = (name, why) => { skip++; console.log('SKIP  ' + name + '  (' + why + ')'); };

// ---------------------------------------------------------------- A. preservation
if (want('preservation')) {
  console.log('\n# A. Prior versions and protected surfaces preserved');
  let gitOk = true; try { git(['rev-parse', BASE_COMMIT]); } catch { gitOk = false; }
  if (!gitOk) skipped('prior versions unchanged since ' + BASE_COMMIT, 'git history unavailable');
  else for (const p of ['lib/engine-assurance', 'lib/engine-evidence-contract', 'lib/engine-evidence-graph', 'lib/manifest', 'api', 'research/engine-assurance-2026-10-10',
    'research/engine-evidence-contract-2026-10-10', 'research/evidence-graph-compiler-2026-10-10', 'tests/engine-assurance', 'tests/engine-evidence-contract', 'tests/engine-evidence-graph',
    'tools', '.jrs', 'docs', 'vercel.json', 'openapi.json', 'sitemap.xml', '.vercelignore', '.github']) {
    let same = true; try { git(['diff', '--quiet', BASE_COMMIT, '--', p]); } catch { same = false; }
    const untracked = git(['ls-files', '--others', '--exclude-standard', '--', p]).trim();
    t(p + ' unchanged since ' + BASE_COMMIT, same && !untracked, untracked);
  }
  const rootHtml = readdirSync(REPO).filter((f) => f.endsWith('.html'));
  if (gitOk) { let same = true; try { git(['diff', '--quiet', BASE_COMMIT, '--', ...rootHtml]); } catch { same = false; } t('public pages unchanged (' + rootHtml.length + ' root HTML files)', same); }
  if (gitOk) t('historical v1 copy still hashes to git blob baebb512', git(['hash-object', join(REPO, 'research/engine-evidence-contract-2026-10-10/historical-reference/v1-review-engine.0177c51.js.txt')]).trim().startsWith('baebb512'));
  t('public Engine routes remain refusal-only', ['api/review.js', 'api/review-engine.js', 'api/v1/review-engine.js'].every((p) => { const s = readFileSync(join(REPO, p), 'utf8'); return s.includes('unavailable(') && !s.includes('fetch('); }));
  t('B-018 remains OPEN', (() => { let st = null; const w = (o) => { if (o && typeof o === 'object') { if (o.blocker_id === 'B-018') st = o.status; Object.values(o).forEach(w); } }; w(JSON.parse(readFileSync(join(REPO, '.jrs/state/BLOCKERS.json'), 'utf8'))); return st === 'OPEN'; })());
  t('v0.1, v0.2 and v0.3 suites remain separately identifiable', ['tests/engine-assurance/run.mjs', 'tests/engine-evidence-contract/run.mjs', 'tests/engine-evidence-graph/run.mjs'].every((p) => existsSync(join(REPO, p))));
  t('no holdout, label or adjudication file in the Phase 4 package', !git(['ls-files', '--others', '--cached', '--exclude-standard', '--', 'research/adaptive-reliability-2026-10-13']).split('\n').some((f) => /holdout|sealed-set|adjudicat|labels?\//i.test(f.replace(/proposals\/.*|knowledge-base\/.*/, ''))));
}

// ---------------------------------------------------------------- B. knowledge base
const kbText = readFileSync(join(PKG, 'knowledge-base/KNOWLEDGE_BASE.jsonl'), 'utf8');
const kb = K.parseKnowledgeBase(kbText);
if (want('knowledge')) {
  console.log('\n# B. Reliability Knowledge Base');
  t('at least 40 entries (' + kb.length + ')', kb.length >= 40);
  t('hash chain and every entry valid', K.validateKnowledgeBase(kbText).length === 0, K.validateKnowledgeBase(kbText).join('; '));
  t('all nine required failure classes covered', V.FAILURE_CLASSES.every((c) => kb.some((e) => e.failure_class === c)), V.FAILURE_CLASSES.filter((c) => !kb.some((e) => e.failure_class === c)).join(','));
  t('only permitted source types and statuses', kb.every((e) => V.SOURCE_TYPES.includes(e.source_type) && V.KB_STATUSES.includes(e.status)));
  t('no entry uses a forbidden status word', !kb.some((e) => V.findForbiddenWord(JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !['prev_hash', 'entry_hash'].includes(k)))))));
  t('every entry requires a human decision and states a limitation', kb.every((e) => e.human_decision_required === true && e.limitation.length > 20));
  t('every open failure has a knowledge entry', Object.values(Object.assign({}, J('corpus-expansion/OPEN_FAILURES.json').corpus, J('corpus-expansion/OPEN_FAILURES.json').stability)).every((o) => kb.some((e) => e.knowledge_id === o.knowledge_id)));
  t('a superseding entry names an earlier entry', kb.some((e) => e.supersedes && kb.findIndex((x) => x.knowledge_id === e.supersedes) < kb.indexOf(e)));
}

// ---------------------------------------------------------------- C. proposals, impact, regression plans
const P = J('proposals/PROPOSALS.json').proposals, I = J('proposals/IMPACT_ANALYSES.json').impacts, RP = J('proposals/REGRESSION_PLANS.json').plans;
const OBS = J('proposals/OBSERVED_CHANGES.json').records;
const REQ = await import('../../research/adaptive-reliability-2026-10-13/proposals/requests.mjs');
const ALLREQ = Object.assign({}, REQ.GOOD, REQ.BAD, REQ.BYPASS);
if (want('proposals')) {
  console.log('\n# C. Change proposals, observed change, impact analysis and regression selection');
  for (const [k, [st, code]] of Object.entries(REQ.EXPECTED)) t(k + ' -> ' + st + (code ? ' (' + code + ')' : ''), P[k] && P[k].authorization_state === st && (!code || P[k].rejection_reasons.some((r) => r.code === code)),
    P[k] && (P[k].authorization_state + ' ' + JSON.stringify(P[k].rejection_reasons.map((r) => r.code)) + ' ' + JSON.stringify(P[k].observed_change_problems)));
  t('every request has an expected state', Object.keys(ALLREQ).every((k) => REQ.EXPECTED[k]) && Object.keys(ALLREQ).length === Object.keys(P).length);
  t('only the four permitted authorization states occur', Object.values(P).every((p) => V.AUTHORIZATION_STATES.includes(p.authorization_state)));
  t('every behavioural proposal awaiting review carries a verified observed-change record', Object.values(P).filter((p) => p.behavioural && p.authorization_state === 'awaiting_human_review').every((p) => p.observed_change && p.observed_change.record_sha256 && !p.observed_change_problems.length));
  const OC = await import('../../lib/engine-change-control/observed-change.mjs'), ID = await import('../../lib/engine-change-control/identity.mjs');
  const cur = { change_control_sha256: ID.changeControlHash(), baseline_sha256: ID.baselineHash() };
  t('every recorded observed-change record verifies against its request and the current packages', Object.entries(OBS).every(([k, o]) => { const pr = OC.verifyObservedChange(o, ALLREQ[k], cur);
    return pr.length === 0 || (pr.length === 1 && /failed to compile/.test(pr[0])); }), Object.entries(OBS).map(([k, o]) => k + ':' + OC.verifyObservedChange(o, ALLREQ[k], cur).join('|')).filter((x) => !/:$/.test(x)).join(' ; '));
  t('no proposal or observed record carries a human disposition', Object.values(P).every((p) => p.human_disposition === 'not_recorded') && Object.values(OBS).every((o) => o.human_disposition === 'not_recorded' && o.rows.every((r) => r.human_disposition === 'not_recorded')));
  t('no request supplies expected drift except the refused Y-11', Object.entries(ALLREQ).filter(([, r]) => 'expected_drift' in r).map(([k]) => k).join() === 'Y-11');
  t('every awaiting proposal has a traceable trigger, impact, test plan, rollback and human-review state', Object.entries(P).filter(([, p]) => p.authorization_state === 'awaiting_human_review').every(([k, p]) =>
    p.triggering_knowledge_ids.every((id) => kb.some((e) => e.knowledge_id === id)) && I[k] && RP[k] && p.rollback_requirement && p.compatibility_impact && p.human_review_required === true));
  t('behavioural proposals carry regression and mutation tests and a version increment', Object.values(P).filter((p) => p.authorization_state === 'awaiting_human_review' && p.behavioural).every((p) => p.required_regression_tests.length && p.required_mutation_tests.length && p.version_increment_required));
  t('impact is classified from observation for every behavioural proposal with a record', Object.entries(P).filter(([, p]) => p.behavioural && p.observed_change).every(([k]) => I[k].classified_from === 'observed_change_record'));
  t('behavioural proposals without a verified record are not assessed by the impact analyzer', Object.entries(P).filter(([, p]) => p.behavioural && !p.observed_change).every(([k]) => I[k].impact_class === 'not_assessed'));
  t('any favourable, scope, limitation or refusal change is at least local_behavioral_change with review', Object.values(I).filter((i) => i.condition_can_become_more_favorable === true || i.limitation_removed_or_weakened === true || !['unchanged', 'not_assessed'].includes(i.refusal_behavior)).every((i) => !['no_behavioral_change', 'not_assessed'].includes(i.impact_class) && i.human_review_required));
  t('no regression plan declares a change safe', Object.values(RP).every((r) => !Object.keys(r).some((k) => /safe|approv|ready/i.test(k)) && /does not decide that a change is safe/.test(r.statement)));
  t('behavioural plans require the full suite', Object.entries(RP).filter(([k]) => I[k].impact_class !== 'no_behavioral_change').every(([, r]) => r.full_suite_mandatory));
}

// ---------------------------------------------------------------- D. refusal regressions
if (want('refusal')) {
  console.log('\n# D. Refusal boundaries');
  const arReg = J('corpus-expansion/FIXTURE_REGISTER.json');
  const refusalCases = ['GC-008', 'GC-022', 'GC-023', 'GC-027', 'GC-028', 'GC-029', 'GC-030'].map((id) => [GCDIR + '/cases', id])
    .concat(arReg.fixtures.filter((f) => f.scope_classification === 'excluded_domain' || f.expected_refusal.includes('mismatch') || f.expected_refusal.includes('incomplete')).map((f) => [join(PKG, 'corpus-expansion/cases'), f.id]));
  const open = J('corpus-expansion/OPEN_FAILURES.json').corpus;
  for (const [dir, id] of refusalCases) {
    const c = CR.loadCase(dir, id);
    const g = compileEvidenceGraph({ submission: c.submission, candidateResponseText: c.response, executionMode: c.expected.execution_mode, clock: CLOCK, fixtureId: id });
    if (open[id]) t(id + ' is a documented open failure and still behaves as recorded (not refused)', g.intake.decision === 'proceed', g.intake.decision);
    else t(id + ' stopped at intake (' + c.expected.gate_decision + ')', g.intake.decision === c.expected.gate_decision && g.findings.every((f) => f.status === 'not_assessed'));
  }
}

// ---------------------------------------------------------------- E. stability laboratory
const stab = J('stability-laboratory/STABILITY_RESULTS.json');
if (want('stability')) {
  console.log('\n# E. Metamorphic Stability Laboratory');
  const ST = await import('../../lib/engine-change-control/stability.mjs');
  const TR = await import('../../research/adaptive-reliability-2026-10-13/stability-laboratory/transforms.mjs');
  const live = ST.runStabilityLab(TR.TRANSFORMS, TR.BASES, compileEvidenceGraph, CLOCK);
  t('at least 14 transformations (' + live.total + ')', live.total >= 14);
  const lb = TR.TRANSFORMS.filter((x) => x.lower_baseline);
  const RANKS = { not_assessed: 0, review_required: 1, gap: 2, supported: 3 };
  t('at least six lower-baseline invariant transforms (' + lb.length + ')', lb.length >= 6 && lb.every((x) => x.kind === 'invariant'));
  t('every lower-baseline base starts below maximum favourability', lb.every((x) => { const r = live.results.find((y) => y.transform_id === x.id); return Object.entries(r.base_statuses).some(([c, v]) => c !== 'sufficiency' && RANKS[v] < 3); }));
  t('lower-baseline bases cover review_required, gap, not_assessed and refusal', ['review_required', 'gap', 'not_assessed'].every((st) => lb.some((x) => Object.values(live.results.find((y) => y.transform_id === x.id).base_statuses).includes(st))));
  t('no invariant transform shows any favourable transition', live.results.filter((r) => r.kind === 'invariant').every((r) => r.favourable_transitions.length === 0));
  t('every lower-baseline transform behaves as expected', lb.every((x) => live.results.find((y) => y.transform_id === x.id).result === 'as_expected'));
  t('both invariant and changed expectations exist', TR.TRANSFORMS.some((x) => x.kind === 'invariant') && TR.TRANSFORMS.some((x) => x.kind === 'changed'));
  t('every transformation predefines review effect and limitation or graph expectation', TR.TRANSFORMS.every((x) => x.expected_review && (x.expected_graph_change || x.expected_changed || x.expected_limitation)));
  const required = ['whitespace', 'reorder', 'heading', 'irrelevant', 'paraphrase', 'moved', 'duplicated', 'authority source inserted', 'expiry date deleted', 'conflicting decision date', 'compensating control deleted', 'employment phrase', 'instruction', 'reworded'];
  t('all fourteen required transformation types present', required.every((r) => TR.TRANSFORMS.some((x) => x.name.includes(r))), required.filter((r) => !TR.TRANSFORMS.some((x) => x.name.includes(r))).join(','));
  const observed = live.results.filter((r) => r.result !== 'as_expected').map((r) => r.transform_id).sort();
  t('live run open failures equal the documented set (' + observed.join(',') + ')', JSON.stringify(observed) === JSON.stringify(Object.keys(J('corpus-expansion/OPEN_FAILURES.json').stability).sort()));
  t('recorded results match the live run', JSON.stringify(stab.results.map((r) => [r.transform_id, r.result])) === JSON.stringify(live.results.map((r) => [r.transform_id, r.result])));
  t('the one expectation correction is disclosed with its reason', TR.TRANSFORMS.filter((x) => x.expectation_correction).length === 1 && /Authoring error/.test(TR.TRANSFORMS.find((x) => x.expectation_correction).expectation_correction.reason));
  t('statement bounds the results to the synthetic context', /Not a robustness, reliability, accuracy or validation result/.test(stab.statement));
}

// ---------------------------------------------------------------- F. corpus expansion
if (want('corpus')) {
  console.log('\n# F. Synthetic corpus expansion');
  const reg = J('corpus-expansion/FIXTURE_REGISTER.json'), adm = J('corpus-expansion/ADMISSION_RESULTS.json');
  t('at least 50 new synthetic fixtures (' + reg.fixtures.length + ')', reg.fixtures.length >= 50);
  t('every fixture admitted by the expansion protocol', adm.admitted === reg.fixtures.length, JSON.stringify(Object.entries(adm.problems).filter(([, p]) => p.length)));
  t('every fixture traced to a knowledge entry or documented coverage gap', reg.fixtures.every((f) => kb.some((e) => e.knowledge_id === f.trigger) || reg.coverage_gaps[f.trigger]));
  t('all thirteen required coverage areas used', Object.keys(reg.coverage_gaps).length === 13 && Object.keys(reg.coverage_gaps).every((g) => reg.fixtures.some((f) => f.coverage_gap === g)));
  t('every expected file is engineering-authored, not adjudicated', reg.fixtures.every((f) => JSON.parse(readFileSync(join(PKG, 'corpus-expansion/cases', f.id + '.expected.json'), 'utf8')).label_status === 'engineering_authored_expected_result_not_adjudicated'));
  const exps = reg.fixtures.map((f) => JSON.parse(readFileSync(join(PKG, 'corpus-expansion/cases', f.id + '.expected.json'), 'utf8')));
  t('every fixture carries executable refusal, quote, limitation and graph expectations', exps.every((x) => Array.isArray(x.refusal_codes) && x.quote_statuses && x.limitations && Object.keys(x.limitations).length === 5 && x.graph && typeof x.graph.conflict_nodes === 'number'));
  t('control-defect expectations are executable except where labelled descriptive', exps.every((x) => Array.isArray(x.cc_defects) || (x.cc_defects === null && x.descriptive_expectations_not_executed.length > 0)));
  t('no register field claims an executed check it does not run', reg.fixtures.every((f) => /^executable: /.test(f.expected_graph_structure) && /^executable: /.test(f.expected_limitation) && Array.isArray(f.descriptive_expectation_not_executed)));
  const live = CR.replayCorpus(join(PKG, 'corpus-expansion/cases'), reg.fixtures.map((f) => f.id), compileEvidenceGraph, CLOCK);
  const failing = live.results.filter((r) => r.result !== 'pass').map((r) => r.id).sort();
  const open = J('corpus-expansion/OPEN_FAILURES.json').corpus;
  t('live corpus open failures equal the documented set (' + failing.join(',') + ')', JSON.stringify(failing) === JSON.stringify(Object.keys(open).sort()));
  t('unsafe-direction flags match the documented open failures', live.results.filter((r) => r.unsafe.length).map((r) => r.id).sort().join() === Object.entries(open).filter(([, v]) => v.unsafe_direction).map(([k]) => k).sort().join());
  t('v0.3 replay still 35/35 on the frozen fixtures', (() => { const ids = JSON.parse(readFileSync(join(GCDIR, 'FIXTURE_REGISTER.json'), 'utf8')).fixtures.map((f) => f.id); return CR.replayCorpus(join(GCDIR, 'cases'), ids, compileEvidenceGraph, CLOCK).results.every((r) => r.result === 'pass'); })());
}

// ---------------------------------------------------------------- G. drift ledger
const D = J('drift-ledger/DRIFT_LEDGER.json');
if (want('drift')) {
  console.log('\n# G. Behavioral Drift Ledger');
  const R = D.isolated_proposal_runs, IDm = await import('../../lib/engine-change-control/identity.mjs');
  t('R-01 isolated run: no violation; only AR-040 changes', !R['R-01'].fail && R['R-01'].rows.every((r) => r.fixture_id === 'AR-040'));
  t('R-02 isolated run: no violation; only AR-010 changes', !R['R-02'].fail && R['R-02'].rows.every((r) => r.fixture_id === 'AR-010'));
  t('X-02 isolated run fails closed (refusal disappeared, excluded domain no longer refused)', R['X-02'].fail && ['refusal_disappeared', 'excluded_domain_no_longer_refused'].every((c) => R['X-02'].violations.some((v) => v.code === c)));
  t('Y-03 isolated run flags the favourable transition as unsafe until a human disposition', R['Y-03'].fail && R['Y-03'].violations.some((v) => v.code === 'favourable_transition_unsafe_until_human_disposition' && v.fixture_id === 'AR-047'));
  t('Y-07 isolated run flags removed limitations', R['Y-07'].violations.some((v) => v.code === 'limitation_disappeared'));
  t('every isolated run carries complete run identity', Object.values(R).every((r) => IDm.validateRunIdentity(r.identity).length === 0 && r.identity.synthetic_local_only === true && r.identity.patch_sha256 !== 'none'));
  t('every drift row has every required field, requires human review and has no recorded disposition', Object.values(R).flatMap((r) => r.rows).concat(D.cross_version_rows).every((r) => ['baseline_version', 'candidate_version', 'fixture_id', 'condition', 'prior_outcome', 'candidate_outcome',
    'observed_change', 'evidence_graph_difference', 'changed_limitation', 'changed_refusal_behavior', 'classification', 'human_review_required', 'human_disposition'].every((k) => k in r) && r.human_review_required === true && r.human_disposition === 'not_recorded'));
  t('no drift row carries a self-declared expectation', !JSON.stringify(D).includes('expected_drift') && !/"classification":\s*"expected"/.test(JSON.stringify(D)));
  t('cross-version comparison carries complete run identity', IDm.validateRunIdentity(D.cross_version_identity).length === 0);
  t('cross-version rows explained and never migrated', D.cross_version_rows.length > 0 && D.cross_version_rows.every((r) => r.explanation.length > 10));
}

// ---------------------------------------------------------------- H. gate simulator
if (want('gate')) {
  console.log('\n# H. Local Release Candidate Gate Simulator');
  const G = J('gate-simulator/GATE_SIMULATION.json');
  t('statement present', G.statement === V.GATE_STATEMENT);
  t('external categories never satisfied locally', ['counsel_review', 'independent_holdout', 'independent_labeling', 'adjudication', 'production_qa'].every((k) => G.categories[k].state === 'external_evidence_required'));
  t('owner release authorization not_authorized', G.categories.owner_release_authorization.state === 'not_authorized');
  t('no score, green light, recommendation or readiness field', !JSON.stringify(G).match(/"(?:score|green[_ ]?light|recommendation|readiness|ready|release_ready)"/i));
  t('only permitted states used', Object.values(G.categories).every((c) => ['present_local_artifact', 'missing_local_artifact', 'external_evidence_required', 'not_assessed', 'not_authorized'].includes(c.state)));
  t('production status unchanged', G.production_status === 'NO_GO_NOT_VERIFIED');
}

// ---------------------------------------------------------------- I. operator console
if (want('console')) {
  console.log('\n# I. Operator Review Console');
  const C = await import('../../research/adaptive-reliability-2026-10-13/operator-console/build-console.mjs');
  const dir = join(PKG, 'operator-console/rendered');
  const pages = readdirSync(dir).filter((f) => f.endsWith('.html'));
  t('at least eight examples plus index (' + (pages.length - 1) + ')', pages.length >= 9 && C.EXAMPLES.length >= 8);
  const all = pages.map((f) => readFileSync(join(dir, f), 'utf8'));
  t('no script, form, input, button, iframe, storage, analytics, authentication or external URL', all.every((h) => !/<script|<form|<input|<button|<iframe|<select|<textarea|localStorage|sessionStorage|indexedDB|gtag|googletagmanager|https?:\/\/|login|password|upload/i.test(h)));
  t('no approval, deployment or authorisation control wording', all.every((h) => !/approve this|deploy now|authori[sz]e this|click to|submit/i.test(h)));
  const ex = C.EXAMPLES.map((r) => readFileSync(join(dir, r + '.html'), 'utf8'));
  t('every example shows the ten sections in order', ex.every((h) => { let at = -1; return C.SECTIONS.every((s) => { const i = h.indexOf(s); const ok = i > at; at = i; return ok; }); }));
  t('every example states the four required things', ex.every((h) => ['What the Engine can do locally', 'What changed', 'Why', 'Unresolved; needs a human decision'].every((x) => h.includes(x))));
  t('every example carries the non-authorising banner and gate statement', ex.every((h) => h.includes('authorises nothing') && h.includes(V.GATE_STATEMENT)));
  t('rendered text carries no unsupported claim', all.every((h) => !scanUnsupportedClaims(h.replace(/<[^>]+>/g, ' ')).length), all.map((h) => scanUnsupportedClaims(h.replace(/<[^>]+>/g, ' '))).flat().map((x) => x.term).join(','));
  const shots = existsSync(join(PKG, 'operator-console/screenshots/SCREENSHOT_RECORD.json')) ? J('operator-console/screenshots/SCREENSHOT_RECORD.json') : null;
  if (!shots) skipped('screenshots', 'screenshot step not run');
  else t('screenshots and rendered pages match the current examples exactly', JSON.stringify(shots.screenshots.map((x) => x.file).sort()) === JSON.stringify(C.EXAMPLES.flatMap((r) => [r + '-desktop.png', r + '-mobile.png']).sort())
    && JSON.stringify(readdirSync(join(PKG, 'operator-console/screenshots')).filter((f) => f.endsWith('.png')).sort()) === JSON.stringify(C.EXAMPLES.flatMap((r) => [r + '-desktop.png', r + '-mobile.png']).sort())
    && JSON.stringify(pages.sort()) === JSON.stringify(C.EXAMPLES.map((r) => r + '.html').concat(['index.html']).sort()));
  if (shots) t('16 screenshots (desktop and mobile), 0 non-file requests, no horizontal page overflow', shots.screenshots.length === 16 && shots.non_file_requests_aborted === 0 && shots.screenshots.every((s) => !s.horizontal_page_overflow && existsSync(join(PKG, 'operator-console/screenshots', s.file))));
  t('present_local_artifact uses a neutral label and treatment, never the ready colour', ex.every((h) => !/class="ok">[^<]*present_local_artifact/.test(h) && h.includes('local file present (not a gate result)') && !h.includes('class="ok">local file present')));
  t('every example shows the human disposition as not_recorded', ex.every((h) => h.includes('Human disposition') && h.includes('not_recorded')));
  t('console builder has no server, listener, network client or file intake', !/createServer|\.listen\(|node:http|node:net|fetch\(|upload/i.test(readFileSync(join(PKG, 'operator-console/build-console.mjs'), 'utf8')));
}

// ---------------------------------------------------------------- J. performance and determinism
if (want('performance')) {
  console.log('\n# J. Determinism and local performance budgets');
  const pr = existsSync(join(PKG, 'performance/PERFORMANCE_RECORD.json')) ? J('performance/PERFORMANCE_RECORD.json') : null;
  if (!pr) skipped('performance record', 'performance step not run');
  else {
    t('every local budget held', pr.budgets.every((b) => b.result === 'held'), pr.budgets.filter((b) => b.result !== 'held').map((b) => b.id).join(','));
    t('one output hash across repeated runs', pr.results.determinism.distinct_output_hashes === 1 && pr.results.determinism.passes >= 3);
    t('no malformed input returned a favourable finding', Object.values(pr.results.malformed).every((m) => !m.returned || !m.favourable.length));
    t('performance record bounded to local engineering language', /Not production performance, scalability, reliability or service-level evidence/.test(pr.statement));
    t('no budget failure record outstanding', J('performance/BUDGET_FAILURE_RECORDS.json').failures.length === 0);
    const IDp = await import('../../lib/engine-change-control/identity.mjs');
    t('performance record carries complete run identity', IDp.validateRunIdentity(pr.identity).length === 0 && pr.identity.execution_mode === 'local_measurement');
  }
  const { runPass } = await import('../../research/adaptive-reliability-2026-10-13/performance/run-performance.mjs');
  const c = CR.loadCase(join(GCDIR, 'cases'), 'GC-001');
  const one = [{ id: 'GC-001', submission: c.submission, response: c.response, mode: 'local_mocked' }];
  t('deterministic: same output hash on two live passes', runPass(one, compileEvidenceGraph).output_hash === runPass(one, compileEvidenceGraph).output_hash);
  t('a pass with a failing case is never complete', runPass(one, () => { throw new Error('x'); }).complete === false);
}

// ---------------------------------------------------------------- K. claims
if (want('claims')) {
  console.log('\n# K. Claim guards over Phase 4 outputs');
  for (const f of ['proposals/PROPOSALS.json', 'drift-ledger/DRIFT_LEDGER.json', 'gate-simulator/GATE_SIMULATION.json', 'stability-laboratory/STABILITY_RESULTS.json']) {
    const text = readFileSync(join(PKG, f), 'utf8');
    const goodOnly = f === 'proposals/PROPOSALS.json' ? JSON.stringify(Object.fromEntries(Object.entries(J(f).proposals).filter(([, p]) => p.authorization_state !== 'rejected_by_compiler'))) : text;
    t('no unsupported claim in ' + f + (f.startsWith('proposals') ? ' (accepted proposals)' : ''), !scanUnsupportedClaims(goodOnly).length, scanUnsupportedClaims(goodOnly).map((h) => h.term + ' :: ' + h.context).join(' || '));
  }
  t('no Phase 4 source file contains a URL host', ['lib/engine-change-control', 'tests/engine-adaptive-reliability', 'research/adaptive-reliability-2026-10-13'].every((d) => {
    const walk = (p) => readdirSync(p, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(p, e.name)) : [join(p, e.name)]);
    return walk(join(REPO, d)).filter((f) => /\.(mjs|py|html|json|jsonl)$/.test(f)).every((f) => !/https?:\/\/[A-Za-z0-9.-]+/.test(readFileSync(f, 'utf8')));
  }));
}

// ---------------------------------------------------------------- L. probes and mutations
const evidence = [];
let base = [];
if (want('mutation')) {
  console.log('\n# L. Direct probes and mutation testing');
  const gcCase = (id) => CR.loadCase(join(GCDIR, 'cases'), id);
  const arCase = (id) => CR.loadCase(join(PKG, 'corpus-expansion/cases'), id);
  const graphs = {};
  for (const [id, c] of [['GC-001', gcCase('GC-001')], ['GC-004', gcCase('GC-004')], ['GC-008', gcCase('GC-008')], ['GC-018', gcCase('GC-018')], ['AR-017', arCase('AR-017')]])
    graphs[id] = compileEvidenceGraph({ submission: c.submission, candidateResponseText: c.response, executionMode: 'local_mocked', clock: CLOCK, fixtureId: id });
  const obsCases = ['GC-001', 'GC-004', 'GC-008'].map((id) => { const c = gcCase(id); return { id, submission: c.submission, response: c.response, mode: 'local_mocked', label: c.expected.label_status }; })
    .concat([(() => { const c = arCase('AR-047'); return { id: 'AR-047', submission: c.submission, response: c.response, mode: 'local_mocked', label: c.expected.label_status }; })()]);
  const { ENTRIES } = await import('../../research/adaptive-reliability-2026-10-13/knowledge-base/kb-entries.mjs');
  const arReg = J('corpus-expansion/FIXTURE_REGISTER.json');
  const breaks = Object.assign({}, REQ.BYPASS['Y-09'], { isolated_patch: { file: 'engine-evidence-graph/compiler.mjs', from: "if (c === 'sufficiency') { status = 'review_required';", to: "if (c === 'sufficiency') { status = 'supported';" } });
  const ctx = { entry: Object.assign({}, ENTRIES[0], { knowledge_id: 'RKB-901' }), kbEntries: kb, goodRequest: REQ.GOOD['R-02'], nonBehaviouralRequest: REQ.GOOD['R-07'], graphs,
    compile: compileEvidenceGraph, obsCases, clock: CLOCK,
    obsRequests: { good: REQ.GOOD['R-02'], favourable: REQ.BYPASS['Y-03'], unrefuse: REQ.BYPASS['Y-02'], limitation: REQ.BYPASS['Y-07'], breaks },
    fixtureMeta: Object.assign({}, arReg.fixtures.find((f) => f.id === 'AR-005'), { trigger: 'RKB-001' }), expected001: gcCase('GC-001').expected, expected017: arCase('AR-017').expected };
  base = await runProbes(LIB, ctx);
  t('all ' + base.length + ' direct probes pass on the unmutated library', base.every((p) => p.ok), JSON.stringify(base.filter((p) => !p.ok)));
  const C = 'engine-change-control/';
  const MUT = [
    ['MA-01', 'kb: forbidden-word check removed', C + 'knowledge-base.mjs', "const w = findForbiddenWord(typeof v === 'string' ? v : JSON.stringify(v)); if (w)", "const w = null; if (w)"],
    ['MA-02', 'kb: status vocabulary unchecked', C + 'knowledge-base.mjs', "if (e.status !== undefined && !KB_STATUSES.includes(e.status))", "if (false)"],
    ['MA-03', 'kb: source vocabulary unchecked', C + 'knowledge-base.mjs', "if (e.source_type !== undefined && !SOURCE_TYPES.includes(e.source_type))", "if (false)"],
    ['MA-04', 'kb: human decision may be false', C + 'knowledge-base.mjs', "if (e.human_decision_required !== undefined && e.human_decision_required !== true)", "if (false)"],
    ['MA-05', 'kb: entry hash not verified', C + 'knowledge-base.mjs', "if (e.entry_hash !== sha(e.prev_hash + canonicalEntry(e)))", "if (false)"],
    ['MA-06', 'kb: chain link not verified', C + 'knowledge-base.mjs', "if (e.prev_hash !== prev)", "if (false)"],
    ['MA-07', 'kb: undeclared fields allowed', C + 'knowledge-base.mjs', "if (!KB_FIELDS.includes(k) && !CHAIN.has(k)) p.push", "if (false) p.push"],
    ['MA-08', 'pc: declared scope broadening allowed', C + 'proposal-compiler.mjs', "if (ch.scope_delta === 'broaden' ||", "if (false &&"],
    ['MA-09', 'pc: summary widening ignored', C + 'proposal-compiler.mjs', "if (wm && !/refus|exclu|reject|block|deny|out[- ]of[- ]scope/i.test(wm[0])) add(", "if (false) add("],
    ['MA-10', 'pc: refusal narrowing allowed', C + 'proposal-compiler.mjs', "if (ch.refusal_delta === 'narrow' || ch.refusal_delta === 'remove') add(", "if (ch.refusal_delta === 'remove') add("],
    ['MA-11', 'pc: evidence lowering allowed', C + 'proposal-compiler.mjs', "if (ch.evidence_delta === 'lower') add(", "if (false) add("],
    ['MA-12', 'pc: limitation weakening allowed', C + 'proposal-compiler.mjs', "if (ch.limitation_delta === 'weaken' || ch.limitation_delta === 'remove')", "if (ch.limitation_delta === 'remove')"],
    ['MA-13', 'pc: test plan needs only one kind', C + 'proposal-compiler.mjs', "(!plan.regression.length || !plan.mutation.length)", "(!plan.regression.length && !plan.mutation.length)"],
    ['MA-14', 'pc: behaviour flags ignored', C + 'proposal-compiler.mjs', "|| BEHAVIOUR_FLAGS.some((f) => ch[f] === true)\n", "|| false\n"],
    ['MA-15', 'pc: unqualified claims allowed', C + 'proposal-compiler.mjs', "const c = findUnqualifiedClaim(v); if (c) add(", "const c = null; if (c) add("],
    ['MA-16', 'pc: protected targets allowed after normalisation', C + 'proposal-compiler.mjs', "if (PROTECTED_TARGETS.some((re) => re.test(n))) return", "if (false) return"],
    ['MA-17', 'pc: rollback optional', C + 'proposal-compiler.mjs', "if (!r.rollback || !String(r.rollback).trim())", "if (!r.rollback)"],
    ['MA-18', 'pc: compatibility optional', C + 'proposal-compiler.mjs', "if (!r.compatibility_analysis || !String(r.compatibility_analysis).trim()) add(", "if (false) add("],
    ['MA-19', 'pc: synthetic may be claimed independent', C + 'proposal-compiler.mjs', "if (r.fixture_origin === 'synthetic_engineering' && r.claimed_independent === true)", "if (false)"],
    ['MA-20', 'pc: self authorisation accepted', C + 'proposal-compiler.mjs', "if (r.requested_authorization_state && r.requested_authorization_state !== 'awaiting_human_review')", "if (false)"],
    ['MA-21', 'pc: unknown triggers accepted', C + 'proposal-compiler.mjs', "for (const t of triggers) if (!kb.has(t))", "for (const t of triggers) if (false)"],
    ['MA-22', 'pc: rejections do not set the state', C + 'proposal-compiler.mjs', "  if (rej.length) state = 'rejected_by_compiler';", "  if (false) state = 'rejected_by_compiler';"],
    ['MA-23', 'vocab: negation qualifier ignored', C + 'vocab.mjs', "if (QUALIFIER.test(words[i])) { qualified = true; break; }", "if (false) { qualified = true; break; }"],
    ['MA-24', 'ia: favourability does not force review class', C + 'impact-analyzer.mjs', "if (moreFavourable || limitationWeakened || refusal !== 'unchanged') { if (cls === 'no_behavioral_change') cls = 'local_behavioral_change';", "if (moreFavourable || limitationWeakened || refusal !== 'unchanged') { if (false) cls = 'local_behavioral_change';"],
    ['MA-25', 'ia: scope class lost', C + 'impact-analyzer.mjs', "if (scopeChange) { cls = 'scope_boundary_change';", "if (scopeChange) {"],
    ['MA-26', 'ia: evidence class lost', C + 'impact-analyzer.mjs', "if (evidenceChange) { cls = 'evidence_standard_change';", "if (evidenceChange) {"],
    ['MA-27', 'ia: release class lost', C + 'impact-analyzer.mjs', "if (comps.includes('evaluation_factory')) { cls = 'release_control_change';", "if (comps.includes('evaluation_factory')) {"],
    ['MA-28', 'ia: version identity not required', C + 'impact-analyzer.mjs', "new_version_identity_required: cls !== 'no_behavioral_change',", "new_version_identity_required: false,"],
    ['MA-29', 'rs: full suite not mandatory', C + 'regression-selector.mjs', "full_suite_mandatory: Boolean(behavioural),", "full_suite_mandatory: false,"],
    ['MA-30', 'rs: plan declares change safe', C + 'regression-selector.mjs', "statement: SAFETY_STATEMENT,", "statement: SAFETY_STATEMENT, safe_to_apply: true,"],
    ['MA-31', 'rs: missing fixture not reported', C + 'regression-selector.mjs', "if (behavioural && !((proposal.required_fixtures || []).length)) gaps.push", "if (false) gaps.push"],
    ['MA-32', 'rs: refusal impact does not select refusal tests', C + 'regression-selector.mjs', "if (!why && impact && impact.refusal_behavior !== 'unchanged' && t.id === 'refusal')", "if (false)"],
    ['MA-33', 'dl: review to supported removed from the unsafe list', C + 'drift-ledger.mjs', "'review_required>supported', ", ""],
    ['MA-34', 'dl: missing fixture not flagged', C + 'drift-ledger.mjs', "violations.push({ code: 'fixture_missing_from_run', fixture_id: fid, detail: bg ? 'candidate' : 'baseline' });", ""],
    ['MA-35', 'dl: refusal disappearance allowed', C + 'drift-ledger.mjs', "for (const r of b.refusals) if (!c.refusals.includes(r)) violations.push", "for (const r of b.refusals) if (false) violations.push"],
    ['MA-36', 'dl: excluded domain may stop being refused', C + 'drift-ledger.mjs', "if (b.excluded_domain && (!c.excluded_domain || c.gate !== 'refuse'))", "if (false)"],
    ['MA-37', 'dl: limitation disappearance allowed', C + 'drift-ledger.mjs', "if (limGone) violations.push", "if (false) violations.push"],
    ['MA-38', 'dl: withdrawn-under-refusal exemption widened to any not_assessed', C + 'drift-ledger.mjs', "const withdrawn = to === 'not_assessed' && c.refusals.length > 0;", "const withdrawn = true;"],
    ['MA-39', 'dl: proof edges allowed', C + 'drift-ledger.mjs', "if (meaning !== EDGE_MEANINGS[type] && claimsProof(meaning)) violations.push", "if (false) violations.push"],
    ['MA-40', 'dl: contradiction review not checked', C + 'drift-ledger.mjs', "if (!c.conflict_review) violations.push", "if (false) violations.push"],
    ['MA-41', 'dl: independent relabelling allowed', C + 'drift-ledger.mjs', "if (label && INDEPENDENT_LABEL.test(label) && !/not[_ ]adjudicated|engineering/i.test(label)) violations.push", "if (false) violations.push"],
    ['MA-42', 'gs: external categories can be satisfied locally', C + 'gate-simulator.mjs', "for (const c of EXTERNAL_CATEGORIES) categories[c] = { state: 'external_evidence_required'", "for (const c of EXTERNAL_CATEGORIES) categories[c] = { state: artifacts[c] && artifacts[c].present ? 'present_local_artifact' : 'external_evidence_required'"],
    ['MA-43', 'gs: owner authorization can be present', C + 'gate-simulator.mjs', "for (const c of AUTHORITY_CATEGORIES) categories[c] = { state: 'not_authorized'", "for (const c of AUTHORITY_CATEGORIES) categories[c] = { state: artifacts[c] && artifacts[c].present ? 'present_local_artifact' : 'not_authorized'"],
    ['MA-44', 'gs: gate outputs a readiness score', C + 'gate-simulator.mjs', "return { statement: GATE_STATEMENT, categories,", "return { statement: GATE_STATEMENT, categories, readiness_score: 1,"],
    ['MA-45', 'cp: non-synthetic fixtures admitted', C + 'corpus-protocol.mjs', "if (meta.authoring_source !== undefined && meta.authoring_source !== 'synthetic_engineering')", "if (false)"],
    ['MA-46', 'cp: untraced triggers admitted', C + 'corpus-protocol.mjs', "if (meta.trigger !== undefined && !(knowledgeIds.has(meta.trigger) || coverageGaps.has(meta.trigger)))", "if (false)"],
    ['MA-47', 'cp: independence statement may change', C + 'corpus-protocol.mjs', "if (meta.independence_statement !== undefined && meta.independence_statement !== INDEPENDENCE_STATEMENT)", "if (false)"],
    ['MA-48', 'sm: invariant new refusals ignored', C + 'stability.mjs', "if (spec.kind === 'invariant') { const extra", "if (false) { const extra"],
    ['MA-49', 'sm: missing review route ignored', C + 'stability.mjs', "if (!graph.edges.some((e) => e.from === 'find:' + f.condition_id && e.type === 'ROUTES_TO_REVIEW')) p.push", "if (false) p.push"],
    ['MA-50', 'cr: unsafe direction not reported', C + 'corpus-replay.mjs', "if (x.statuses[f.condition_id] && RANK[f.status] > RANK[x.statuses[f.condition_id]]) out.push", "if (false) out.push"],
    // ---- 0.4.1-local repairs
    ['MB-01', 'path: percent-encoded paths accepted', C + 'proposal-compiler.mjs', "if (decoded !== t) return", "if (false) return"],
    ['MB-02', 'path: absolute paths accepted', C + 'proposal-compiler.mjs', "if (unified.startsWith('/') || /^[A-Za-z]:/.test(unified) || unified.startsWith('~')) return", "if (false) return"],
    ['MB-03', 'path: escaping paths accepted', C + 'proposal-compiler.mjs', "if (n === '..' || n.startsWith('../') || n === '.' || n === '') return", "if (false) return"],
    ['MB-04', 'path: dot segments not resolved', C + 'proposal-compiler.mjs', "const n = posix.normalize(unified).replace(/^\\.\\/+/, '');", "const n = unified.replace(/^\\.\\/+/, '');"],
    ['MB-05', 'path: Windows separators not converted', C + 'proposal-compiler.mjs', "const unified = t.replace(/\\\\/g, '/');", "const unified = t;"],
    ['MB-06', 'path: workspace boundary not enforced', C + 'proposal-compiler.mjs', "if (!PERMITTED_TARGET_ROOTS.some((r) => n.startsWith(r))) return", "if (false) return"],
    ['MB-07', 'observed: missing record not blocking', C + 'proposal-compiler.mjs', ": ['no observed-change record'];", ": [];"],
    ['MB-08', 'observed: record hash not checked', C + 'observed-change.mjs', "if (record_sha256 !== sha(canon(body))) p.push", "if (false) p.push"],
    ['MB-09', 'observed: request binding not checked', C + 'observed-change.mjs', "if (record.request_sha256 !== requestHash(request)) p.push", "if (false) p.push"],
    ['MB-10', 'observed: run identity not validated', C + 'observed-change.mjs', "for (const x of validateRunIdentity(record.identity)) p.push(x);", ""],
    ['MB-11', 'observed: compile failures not blocking', C + 'observed-change.mjs', "if (!Array.isArray(record.candidate_compile_failures) || record.candidate_compile_failures.length) p.push", "if (false) p.push"],
    ['MB-12', 'observed: human disposition in a record accepted', C + 'observed-change.mjs', "if (record.human_disposition !== 'not_recorded') p.push", "if (false) p.push"],
    ['MB-13', 'compiler: engine targets do not make a proposal behavioural', C + 'proposal-compiler.mjs', "|| normalized.some((n) => ENGINE_TARGET_ROOTS.some((root) => n.startsWith(root)));", ";"],
    ['MB-14', 'compiler: observed favourable transitions do not block', C + 'proposal-compiler.mjs', "  else if (observed && observed.favourable_transitions > 0) state = 'blocked_pending_human_disposition';\n", "\n"],
    ['MB-15', 'compiler: observed refusal removal ignored', C + 'proposal-compiler.mjs', "if (observed.refusals_removed) add(", "if (false) add("],
    ['MB-16', 'compiler: observed limitation removal ignored', C + 'proposal-compiler.mjs', "if (observed.limitations_removed) add(", "if (false) add("],
    ['MB-17', 'compiler: observed excluded-domain loss ignored', C + 'proposal-compiler.mjs', "if (observed.excluded_domain_unrefused) add(", "if (false) add("],
    ['MB-18', 'compiler: self-declared drift accepted', C + 'proposal-compiler.mjs', "if ('expected_drift' in r || 'observed_change' in r) add(", "if (false) add("],
    ['MB-19', 'compiler: human disposition in a request accepted', C + 'proposal-compiler.mjs', "if ('human_disposition' in r) add(", "if (false) add("],
    ['MB-20', 'claims: rollback text not scanned', C + 'proposal-compiler.mjs', "if (['isolated_patch', 'change',", "if (['rollback', 'isolated_patch', 'change',"],
    ['MB-21', 'claims: compatibility text not scanned', C + 'proposal-compiler.mjs', "if (['isolated_patch', 'change',", "if (['compatibility_analysis', 'isolated_patch', 'change',"],
    ['MB-22', 'claims: loose negation window', C + 'vocab.mjs', "for (let k = 0; k < 3 && i >= 0; k++, i--) { if (QUALIFIER.test(words[i])) { qualified = true; break; } if (!BRIDGE.test(words[i])) break; }", "for (let k = 0; k < 8 && i >= 0; k++, i--) { if (QUALIFIER.test(words[i])) { qualified = true; break; } }"],
    ['MB-23', 'claims: `certified` dropped from the controlled terms', C + 'vocab.mjs', "'verified', 'certified', ", "'verified', "],
    ['MB-24', 'release: release-gate targets not refused', C + 'proposal-compiler.mjs', "|| normalized.some((n) => RELEASE_TARGETS.some((re) => re.test(n)))) add(", ") add("],
    ['MB-25', 'release: advancement wording not refused', C + 'proposal-compiler.mjs', "const ra = RELEASE_ADVANCEMENT.exec(v); if (ra) add(", "const ra = null; if (ra) add("],
    ['MB-26', 'drift: gap to supported not unsafe', C + 'drift-ledger.mjs', "'gap>supported', ", ""],
    ['MB-27', 'drift: review to gap not unsafe', C + 'drift-ledger.mjs', "'review_required>gap', ", ""],
    ['MB-28', 'drift: not_assessed to supported not unsafe', C + 'drift-ledger.mjs', "'not_assessed>supported', ", ""],
    ['MB-29', 'drift: not_assessed to gap not unsafe', C + 'drift-ledger.mjs', ", 'not_assessed>gap']", "]"],
    ['MB-30', 'drift: rows carry a recorded disposition', C + 'drift-ledger.mjs', "export const HUMAN_DISPOSITION_DEFAULT = 'not_recorded';", "export const HUMAN_DISPOSITION_DEFAULT = 'accepted';"],
    ['MB-31', 'drift: favourable violation not raised', C + 'drift-ledger.mjs', "if (unsafe) violations.push", "if (false) violations.push"],
    ['MB-32', 'stability: favourable transitions not reported', C + 'stability.mjs', "for (const [c, to] of Object.entries(got)) if (RANK[to] > RANK[base0[c]]) favourable.push(", "for (const [c, to] of Object.entries(got)) if (false) favourable.push("],
    ['MB-33', 'fixtures: limitation expectations not executed', C + 'corpus-replay.mjs', "cmp('limitations.' + cid,", "void ('limitations.' + cid,"],
    ['MB-34', 'fixtures: conflict-node expectation not executed', C + 'corpus-replay.mjs', "cmp('graph.conflict_nodes',", "void ('graph.conflict_nodes',"],
    ['MB-35', 'fixtures: textual-support expectation not executed', C + 'corpus-replay.mjs', "cmp('graph.textually_supports_edges',", "void ('graph.textually_supports_edges',"],
    ['MB-36', 'identity: synthetic marker not required', C + 'identity.mjs', "if (id.synthetic_local_only !== undefined && id.synthetic_local_only !== true) p.push", "if (false) p.push"],
    ['MB-37', 'identity: run id not bound', C + 'identity.mjs', "if (id.run_id && id.change_control_sha256 && id.run_id !==", "if (false && id.run_id !=="],
    ['MB-38', 'identity: fixture set not bound', C + 'identity.mjs', "if (Array.isArray(id.fixtures) && id.fixture_set_sha256 && id.fixture_set_sha256 !==", "if (false && id.fixture_set_sha256 !=="],
    ['MB-39', 'identity: missing fields allowed', C + 'identity.mjs', "for (const k of IDENTITY_FIELDS) if (id[k] === undefined || id[k] === null || id[k] === '') p.push", "for (const k of IDENTITY_FIELDS) if (false) p.push"],
    ['MB-40', 'impact: observed favourable change does not escalate', C + 'impact-analyzer.mjs', "const evidenceChange = (ob && ob.favourable_transitions > 0) ||", "const evidenceChange ="],
    ['MB-41', 'impact: behavioural without observation is assessed anyway', C + 'impact-analyzer.mjs', "if (behavioural && !ob) return", "if (false) return"],
  ];
  for (const [id, what, file, from, to] of MUT) {
    const tmp = mkdtempSync(join(tmpdir(), 'jrs-amut-'));
    try {
      for (const d of ['engine-assurance', 'engine-evidence-contract', 'engine-evidence-graph', 'engine-change-control']) cpSync(join(LIB, d), join(tmp, d), { recursive: true });
      const p = join(tmp, file), s = readFileSync(p, 'utf8'), n = s.split(from).length - 1;
      if (n !== 1) { t(id + ' target found exactly once (' + what + ')', false, 'occurrences: ' + n); evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: false, failing_probes: [], note: 'target occurrences ' + n }); continue; }
      writeFileSync(p, s.replace(from, to));
      let res; try { res = await runProbes(tmp, ctx); } catch (e) { t(id + ' mutant loads (' + what + ')', false, String(e.message).slice(0, 120)); evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: false, failing_probes: [], note: 'mutant failed to load' }); continue; }
      const killed = res.filter((x) => !x.ok).map((x) => x.id);
      evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: killed.length > 0, failing_probes: killed });
      t(id + ' ' + what + ': killed by ' + (killed.join(', ') || 'NOTHING'), killed.length > 0);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }
  const ri = process.argv.indexOf('--record');
  if (ri > 0) {
    const { runIdentity } = await import('../../lib/engine-change-control/identity.mjs');
    const identity = runIdentity({ fixtures: Object.values(graphs).map((g) => ({ fixture_id: g.identity.fixture_id, fixture_hash: g.identity.fixture_hash })), command: 'node tests/engine-adaptive-reliability/run.mjs --record', mode: 'local_mutation', clock: CLOCK });
    writeFileSync(process.argv[ri + 1], JSON.stringify({ generated: CLOCK, identity, probes: base.map((x) => x.id), mutations: evidence }, null, 2) + '\n');
  }
}

// ---------------------------------------------------------------- M. documents
const DOCS = ['ADAPTIVE_RELIABILITY_ARCHITECTURE.md', 'RELIABILITY_KNOWLEDGE_BASE_SPECIFICATION.md', 'CHANGE_PROPOSAL_COMPILER_SPECIFICATION.md', 'CHANGE_IMPACT_ANALYSIS_PROTOCOL.md',
  'METAMORPHIC_STABILITY_LAB_PROTOCOL.md', 'BEHAVIORAL_DRIFT_LEDGER_SPECIFICATION.md', 'SYNTHETIC_CORPUS_EXPANSION_PROTOCOL.md', 'REGRESSION_SELECTION_POLICY.md', 'LOCAL_GATE_SIMULATOR_SPECIFICATION.md',
  'OPERATOR_REVIEW_CONSOLE_GUIDE.md', 'DETERMINISM_AND_PERFORMANCE_RECORD.md', 'ADAPTIVE_FAILURE_MODE_REGISTER.md', 'PHASE_4_HANDOFF.md'];
const STATEMENT = 'This package is a controlled local adaptive-reliability system. It accumulates engineering knowledge through versioned, reviewable synthetic evidence and regression controls. It does not self-modify, establish independent accuracy, establish semantic validity, authorize release, or establish production, licensing, or sale readiness.';
if (want('documents')) {
  console.log('\n# M. Package documents');
  const missing = DOCS.filter((d) => !existsSync(join(PKG, d)));
  if (missing.length) skipped('required documents present', 'missing: ' + missing.join(', '));
  else {
    t('thirteen required documents present', true);
    const heads = ['## Local engineering claim', '## Local evidence', '## Interpretation', '## Limitation', '## External evidence still required'];
    t('every document separates claim, evidence, interpretation, limitation and external evidence', DOCS.every((d) => heads.every((h) => readFileSync(join(PKG, d), 'utf8').includes(h))),
      DOCS.filter((d) => !heads.every((h) => readFileSync(join(PKG, d), 'utf8').includes(h))).join(','));
    for (const d of DOCS) { const text = readFileSync(join(PKG, d), 'utf8'); const h = scanUnsupportedClaims(text); t('content guard: ' + d, !h.length, h.map((x) => x.term + ' :: ' + x.context).join(' || ')); }
    t('no em-dash in any document', DOCS.every((d) => !readFileSync(join(PKG, d), 'utf8').includes('—')));
    t('no canonical Evidence Ledger ID created', DOCS.every((d) => !/\bE-\d{3}\b/.test(readFileSync(join(PKG, d), 'utf8').replace(/E-038/g, ''))));
    t('change log present, content-guarded and discloses the post-run R-02 edit', existsSync(join(PKG, 'CHANGELOG.md')) && !scanUnsupportedClaims(readFileSync(join(PKG, 'CHANGELOG.md'), 'utf8')).length
      && /R-02/.test(readFileSync(join(PKG, 'CHANGELOG.md'), 'utf8')) && /post-run edit/i.test(readFileSync(join(PKG, 'CHANGELOG.md'), 'utf8')) && /R-02/.test(readFileSync(join(PKG, 'PHASE_4_HANDOFF.md'), 'utf8')));
    t('no document says a proposal cannot loosen a boundary', DOCS.concat(['CHANGELOG.md']).every((d) => !/proposal cannot loosen a boundary/i.test(readFileSync(join(PKG, d), 'utf8'))));
    t('handoff ends with the required statement', readFileSync(join(PKG, 'PHASE_4_HANDOFF.md'), 'utf8').trim().endsWith(STATEMENT));
  }
}

t('suite made no network attempt', trap.count() === 0, trap.attempts.join(', '));
trap.restore();
console.log('\n' + (pass + fail + skip) + ' checks: ' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
if (fail) console.log('Failed: ' + failed.join(' | '));
process.exit(fail ? 1 : 0);
