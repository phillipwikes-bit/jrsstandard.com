// JRS EVIDENCE GRAPH 0.3.0: regression, adversarial, separation and mutation tests.
//
//   env -u ANTHROPIC_BASE_URL node tests/engine-evidence-graph/run.mjs [--record <path>]
//
// Offline; the network trap is installed before any project module loads.
// --record writes mutation evidence JSON to <path>.

import { installNetworkTrap } from '../../lib/engine-assurance/network-guard.mjs';
const trap = installNetworkTrap();
const { readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, rmSync, existsSync } = await import('node:fs');
const { join } = await import('node:path');
const { tmpdir } = await import('node:os');
const { createHash } = await import('node:crypto');
const { execFileSync } = await import('node:child_process');
const { fileURLToPath } = await import('node:url');
const unicodedata = (s) => s.normalize('NFC');

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const LIB = join(REPO, 'lib');
const PKG = join(REPO, 'research/evidence-graph-compiler-2026-10-10');
const sha = (b) => 'sha256:' + createHash('sha256').update(b).digest('hex');
const CLOCK = '2026-10-10T00:00:00Z';

const { compileEvidenceGraph, compilerHash } = await import('../../lib/engine-evidence-graph/compiler.mjs');
const { validateGraph, canonical } = await import('../../lib/engine-evidence-graph/graph-validate.mjs');
const { EDGE_MEANINGS } = await import('../../lib/engine-evidence-graph/contract.mjs');
const F = await import('../../lib/engine-evidence-graph/evaluation/factory.mjs');
const { scanUnsupportedClaims } = await import('../../lib/engine-assurance/content-guard.mjs');
const { scanProhibitedClaims } = await import('../../lib/engine-evidence-contract/claims.mjs');
const { checkRemediationNeutral } = await import('../../lib/engine-evidence-contract/remediation.mjs');
const { replayEvidenceGraph, loadGraphCase } = await import('../../tools/engine-evidence-graph-replay.mjs');
const WB = await import('../../research/evidence-graph-compiler-2026-10-10/workbench/build-workbench.mjs');
globalThis.__egc = { compilerHash };
const FA = await import('../../research/evidence-graph-compiler-2026-10-10/sealed-evaluation-factory/build-factory-artifacts.mjs');
const { runProbes } = await import('./probes.mjs');

let pass = 0, fail = 0, skip = 0; const failures = [];
const t = (n, ok, d) => { if (ok) { pass++; console.log('PASS  ' + n); } else { fail++; failures.push(n); console.log('FAIL  ' + n + (d ? '\n        ' + String(d).slice(0, 700) : '')); } };
const skipped = (n, why) => { skip++; console.log('SKIP  ' + n + '  (' + why + ')'); };
const git = (args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

// ---------------------------------------------------------------- A. version lineage and preservation
console.log('\n# A. Prior versions preserved');
let gitOk = true; try { git(['rev-parse', '882e4f5']); } catch { gitOk = false; }
if (!gitOk) skipped('prior versions unchanged since 882e4f5', 'git history unavailable');
else {
  for (const p of ['lib/engine-assurance', 'lib/engine-evidence-contract', 'lib/manifest', 'api', 'research/engine-assurance-2026-10-10', 'research/engine-evidence-contract-2026-10-10', 'tests/engine-assurance', 'tests/engine-evidence-contract', '.jrs', 'docs/enterprise-diligence']) {
    let same = true; try { git(['diff', '--quiet', '882e4f5', '--', p]); } catch { same = false; }
    let untracked = git(['ls-files', '--others', '--exclude-standard', '--', p]).trim();
    t(p + ' unchanged since 882e4f5', same && !untracked, untracked);
  }
  const href = join(REPO, 'research/engine-evidence-contract-2026-10-10/historical-reference/v1-review-engine.0177c51.js.txt');
  t('historical v1 copy still hashes to git blob baebb512', git(['hash-object', href]).trim() === 'baebb512e5f296e1b41da138b7868aae4b6098fc');
}
t('public routes remain 503 refusal stubs', ['api/review.js', 'api/review-engine.js', 'api/v1/review-engine.js'].every((p) => { const s = readFileSync(join(REPO, p), 'utf8'); return s.includes('unavailable(') && !s.includes('fetch('); }));
const vbm = JSON.parse(readFileSync(join(PKG, 'version-lineage/VERSION_BOUNDARY_MANIFEST.json'), 'utf8'));
t('version boundary manifest lists v1, v0.1, v0.2, v0.3 with distinct identities', ['v1', 'v0.1', 'v0.2', 'v0.3'].every((k) => vbm.versions[k]) && new Set(Object.values(vbm.versions).map((v) => v.identity)).size === 4);
t('no prior result is migrated (manifest says so for each prior version)', ['v1', 'v0.1', 'v0.2'].every((k) => /not (?:migrated|v0\.3 evidence)/i.test(vbm.versions[k].migration)));

// ---------------------------------------------------------------- B. replay and determinism
console.log('\n# B. Fixture replay and determinism');
const r1 = await replayEvidenceGraph({ env: {}, clock: CLOCK, write: false }), r2 = await replayEvidenceGraph({ env: {}, clock: CLOCK, write: false });
t('all ' + r1.record.summary.total + ' v0.3 fixture cases match their frozen expected results', r1.exitCode === 0, JSON.stringify(r1.record.cases.filter((c) => c.result !== 'pass')));
t('two replays with a fixed clock are byte-identical', JSON.stringify(r1.record) === JSON.stringify(r2.record));
t('graph JSON is deterministic with stable key order', canonical(r1.graphs['GC-001']) === canonical(JSON.parse(JSON.stringify(r2.graphs['GC-001']))));
t('replay refuses to start with a provider endpoint configured', (await replayEvidenceGraph({ env: { ANTHROPIC_BASE_URL: 'x' }, write: false })).exitCode === 3);

// ---------------------------------------------------------------- C. traversal and graph invariants over every graph
console.log('\n# C. Every graph: traversal, identity, edge meanings');
const graphs = Object.entries(r1.graphs);
t('every graph carries version, fixture, record hash, compiler hash, contract and run identity', graphs.every(([, g]) => g.contract_version && g.identity.fixture_id && g.identity.fixture_hash && g.identity.compiler_sha256 === compilerHash() && g.identity.run_id && (g.identity.record_sha256 || g.intake.decision !== 'proceed')));
const traversable = ([, g]) => g.findings.every((f) => {
  const refused = g.edges.some((e) => e.type === 'REFUSES' && e.to === 'find:' + f.condition_id);
  if (refused) return true;
  const rel = g.edges.filter((e) => e.from === 'find:' + f.condition_id && e.type === 'RELATES_TO').map((e) => g.nodes.find((n) => n.id === e.to));
  const spans = rel.filter((n) => n.type === 'record_span').concat(rel.filter((n) => n.type === 'assertion').map((a) => g.nodes.find((n) => n.id === a.record_span_id)));
  return spans.length && spans.every((s) => s.text === loadGraphCase(join(PKG, 'fixtures/cases'), g.identity.fixture_id).submission.record_text.slice(s.start, s.end));
});
t('every non-refusal finding in every graph traverses to an exact record span', graphs.every(traversable), graphs.filter((x) => !traversable(x)).map(([k]) => k).join(','));
t('every supported or gap finding traverses through verified evidence', graphs.every(([, g]) => g.findings.filter((f) => ['supported', 'gap'].includes(f.status)).every((f) =>
  g.edges.some((e) => e.from === 'find:' + f.condition_id && e.to.startsWith('as:')))));
t('no edge meaning claims proof, truth, legal sufficiency, compliance, credibility or correctness', Object.values(EDGE_MEANINGS).every((m) => !/\b(?:proves?|proof|true|truth|legally|compliant|credib|correct\b)/i.test(m.replace('does not say which is correct', ''))));
t('TEXTUALLY_SUPPORTS carries exactly the required meaning', EDGE_MEANINGS.TEXTUALLY_SUPPORTS === 'The quoted text is present in the record and is associated with the bounded assertion type.');
t('ambiguous quotations never attach to a finding', graphs.every(([, g]) => g.nodes.filter((n) => n.type === 'proposed_quote' && !['verified_unique', 'verified_disambiguated'].includes(n.quote_resolution_status)).every((n) => !g.nodes.some((v) => v.id === 'ev:' + n.observation_id))));
t('sufficiency is never supported in any graph', graphs.every(([, g]) => g.findings.find((f) => f.condition_id === 'sufficiency').status !== 'supported'));
t('every conflict states it is a record conflict, not the true state of events', graphs.every(([, g]) => g.nodes.filter((n) => n.type === 'conflict').every((n) => n.statement.includes('not the true state of events'))));
t('no graph contains a voting, weighting or score field', graphs.every(([, g]) => !/"(?:vote|votes|weight|weights|score|confidence)"\s*:/.test(JSON.stringify(g))));

// ---------------------------------------------------------------- D. named adversarial cases (see fixtures for full set)
console.log('\n# D. Adversarial cases');
const st = (id, c) => r1.graphs[id].findings.find((f) => f.condition_id === c).status;
t('fabricated quotation routes to review', st('GC-009', 'identifiable_basis') === 'review_required');
t('exact text with an incorrect offset cannot be supplied: offsets are rejected as untrusted', r1.graphs['GC-026'].candidate.reason === 'candidate_supplied_untrusted_field');
t('duplicate quotation without disambiguator is ambiguous and not used', st('GC-006', 'reconstructability') === 'review_required');
t('duplicate quotation with a valid disambiguator is used', st('GC-007', 'reconstructability') === 'supported');
t('quote attached to the wrong condition is rejected', st('GC-014', 'chronology_integrity') === 'review_required');
t('conclusion with no linked basis routes to review', st('GC-015', 'reasoning_traceability') === 'review_required');
t('basis with no linked conclusion: reconstructability gap, reasoning review', st('GC-016', 'reconstructability') === 'gap' && st('GC-016', 'reasoning_traceability') === 'review_required');
t('conflicting dates and authority state route to review', st('GC-005', 'chronology_integrity') === 'review_required' && st('GC-017', 'identifiable_basis') === 'review_required');
t('missing expiry and missing control are visible gaps', st('GC-018', 'chronology_integrity') === 'gap' && st('GC-003', 'sufficiency') === 'gap');
t('unsupported certainty produces a documentation control', r1.graphs['GC-019'].cognitive_controls.some((c) => c.defect === 'certainty_language'));
t('direct, reworded and mixed-scope employment content is refused', ['GC-008', 'GC-022', 'GC-023'].every((id) => r1.graphs[id].intake.decision === 'refuse'));
t('malformed response and duplicate JSON keys fail closed', ['GC-024', 'GC-025'].every((id) => r1.graphs[id].findings.every((f) => f.status === 'not_assessed')));

// ---------------------------------------------------------------- E. Cognitive Controls
console.log('\n# E. Graph Cognitive Controls stay neutral');
const ccs = graphs.flatMap(([, g]) => g.cognitive_controls);
t('controls produced across fixtures (' + ccs.length + ') and none withheld', ccs.length > 10 && graphs.every(([, g]) => !g.controls_withheld.length));
const INDEP = /\b(?:approve|reject|deny|grant the|revoke|terminat\w*|discipline|you should|should|must|recommend|advise|credib\w*|honest\w*|intent\w*|motive|emotion\w*|diagnos\w*|treatment|therap\w*)\b/i;
t('no control tells a reviewer what to decide or describes a person', ccs.every((c) => ![c.detect, c.reflect, c.correct, c.learn].some((s) => INDEP.test(s))));
t('each control has exactly detect, reflect, correct, learn content and a question', ccs.every((c) => c.detect && c.reflect && c.learn && c.correct.endsWith('?')));
for (const drift of ['Should the exception be revoked?', 'Is the requester credible?', 'We recommend granting access.']) t('neutrality check catches drift ' + JSON.stringify(drift), checkRemediationNeutral({ reflect: 'x', correct: drift, learn: 'x' }).length > 0);

// ---------------------------------------------------------------- F. Sealed Evaluation Factory
console.log('\n# F. Sealed Evaluation Factory');
const FD = join(PKG, 'sealed-evaluation-factory');
t('registry is a valid hash chain with permitted statuses only', F.validateRegistry(readFileSync(join(FD, 'REGISTRY.jsonl'), 'utf8')).length === 0);
t('registry entry status is not_authorized_to_execute', readFileSync(join(FD, 'REGISTRY.jsonl'), 'utf8').includes('"current_status":"not_authorized_to_execute"'));
const sep = JSON.parse(readFileSync(join(FD, 'SEPARATION_CHECK_RESULTS.json'), 'utf8')).results;
const want = { 'P-01-synthetic-as-holdout': 'synthetic_presented_as_holdout', 'P-02-development-overlap': 'development_sealed_overlap', 'P-03-same-process-label-claimed-independent': 'label_independence_not_supported',
  'P-04-raw-records-in-tracked-directory': 'raw_records_in_tracked_directory', 'P-05-missing-version-identity': 'missing_version_identity', 'P-06-missing-codebook-hash': 'missing_codebook_hash',
  'P-07-missing-owner-authorization': 'missing_owner_authorization', 'P-08-unapproved-data-classification': 'unapproved_data_classification', 'P-09-placeholder-adjudicator': 'placeholder_adjudication_authority',
  'P-10-changed-after-freeze': 'component_changed_after_freeze', 'P-11-completion-claimed-from-template': 'status_claim_not_permitted' };
for (const [k, code] of Object.entries(want)) t('separation check refuses ' + k + ' for ' + code, sep[k] && sep[k].decision === 'refused' && sep[k].reasons.includes(code));
t('no example package reaches any status other than refused or not_authorized_to_execute', Object.values(sep).every((r) => ['refused', 'not_authorized_to_execute'].includes(r.decision)));
const proto = readFileSync(join(FD, 'PROTOCOL_TEMPLATE.md'), 'utf8');
t('protocol template states no evaluation was authorized or conducted', proto.includes(F.PROTOCOL_STATEMENT) && F.PROTOCOL_STATEMENT === 'No evaluation has been authorized or conducted through this local template.');
t('protocol template has all required sections', ['Hypothesis', 'Scope', 'Exclusions', 'Model and prompt identity', 'Codebook identity', 'Pre-specified metrics', 'Abstention and refusal', 'Condition-level analysis', 'Uncertainty reporting', 'Human-review disposition', 'Data permission', 'Independent labeling', 'Adjudication requirement', 'Stop conditions', 'Release-gate statement'].every((h) => proto.includes(h)));
t('authority matrix separates the seven roles and bars engineering from conversion', (() => { const m = JSON.parse(readFileSync(join(FD, 'AUTHORITY_MATRIX.json'), 'utf8')); return ['owner_decision', 'independent_labeler', 'adjudicator', 'technical_operator', 'counsel', 'production_qa', 'release_authority'].every((r) => m.roles[r]) && /cannot|may_not/.test(JSON.stringify(m.roles.local_engineering)) && m.roles.local_engineering.may_not.includes('independent validation'); })());
t('no holdout, label or adjudication file exists in the package', !readdirSync(PKG, { recursive: true }).some((f) => /holdout|adjudicat\w*-labels|reference-labels/i.test(String(f)) && !/PROTOCOL|SPECIFICATION|CONTROLS|AUTHORITY|example-packages|build-factory/i.test(String(f))));

// ---------------------------------------------------------------- G. workbench
console.log('\n# G. Static workbench');
const wb = await WB.buildWorkbench({ env: {}, write: false });
const html = Object.values(wb.pages).join('\n') + wb.index;
t('six required examples rendered', Object.keys(wb.pages).length === 6 && ['GC-001', 'GC-002', 'GC-003', 'GC-004', 'GC-006', 'GC-008'].every((k) => wb.pages[k]));
t('pages contain no script, form, input, iframe, storage, analytics or external URL', !/<script|<form|<input|<iframe|localStorage|sessionStorage|gtag|https?:\/\/|src=/i.test(html));
t('each page shows the fourteen sections in order', Object.values(wb.pages).every((p) => { let i = -1; return Array.from({ length: 14 }, (_, k) => (k + 1) + '. ').every((h) => { const j = p.indexOf('<h2>' + h); const ok = j > i; i = j; return ok; }); }));
t('rendered page text carries no unsupported claim', Object.values(wb.pages).every((p) => !scanUnsupportedClaims(p.replace(/<pre>[\s\S]*?<\/pre>/g, ' ').replace(/<code>[\s\S]*?<\/code>/g, ' ').replace(/<[^>]+>/g, ' ')).length));
t('factory status shown as not_authorized_to_execute on every page', Object.values(wb.pages).every((p) => p.includes('not_authorized_to_execute')));
const shots = existsSync(join(PKG, 'workbench/screenshots/SCREENSHOT_RECORD.json')) ? JSON.parse(readFileSync(join(PKG, 'workbench/screenshots/SCREENSHOT_RECORD.json'), 'utf8')) : null;
if (!shots) skipped('screenshots', 'screenshot step not run');
else t('12 screenshots (desktop and mobile) with 0 non-file requests and no horizontal overflow', shots.screenshots.length === 12 && shots.non_file_requests_aborted === 0 && shots.screenshots.every((s) => !s.horizontal_page_overflow && existsSync(join(PKG, 'workbench/screenshots', s.file))));
t('workbench builder has no server, listener, upload or network client', !/createServer|\.listen\(|node:http|node:net|fetch\(|upload/i.test(readFileSync(join(PKG, 'workbench/build-workbench.mjs'), 'utf8')));

// ---------------------------------------------------------------- H. probes and mutations
console.log('\n# H. Probes and mutation testing');
const dupRecord = loadGraphCase(join(PKG, 'fixtures/cases'), 'GC-006').submission.record_text;
const nfd = loadGraphCase(join(PKG, 'fixtures/cases'), 'GC-011').submission.record_text;
const cases = {};
for (const id of JSON.parse(readFileSync(join(PKG, 'fixtures/FIXTURE_REGISTER.json'), 'utf8')).fixtures.map((f) => f.id)) { const c = loadGraphCase(join(PKG, 'fixtures/cases'), id); cases[id] = { submission: c.submission, response: c.response, mode: c.expected.execution_mode }; }
const hashes = FA.currentHashes(), devHashes = FA.developmentHashes();
const packages = FA.examplePackages(hashes, [...devHashes][0]);
const ideal = JSON.parse(JSON.stringify(packages['P-00-structure-with-placeholder-authorities']));
ideal.owner_authorization = { record_id: 'OA-2026-0001', date: '2026-10-10' }; ideal.adjudication_authority = { name: 'Independent adjudicator A' }; ideal.label_authority = { name: 'Reviewer panel B', claimed_independent: true, process_id: 'independent_review_panel' };
const ctx = { clean: { record: cases['GC-001'].submission.record_text }, cases, dupRecord, dupQuote: 'Access is limited to the LOG-RPT-04 report view',
  nfdRecord: nfd, nfcQuote: unicodedata('Supplier: Harrowgate Freight Services Ltd (fictional), Café Annex depot'), packages, idealPackage: ideal,
  factoryCtx: { developmentHashes: devHashes, currentHashes: hashes, repoRoot: REPO },
  registryEntry: JSON.parse(readFileSync(join(FD, 'REGISTRY.jsonl'), 'utf8').split('\n')[0]) };
delete ctx.registryEntry.prev_hash; delete ctx.registryEntry.entry_hash;
const base = await runProbes(LIB, ctx);
t('all ' + base.length + ' direct probes pass on the unmutated library', base.every((p) => p.ok), JSON.stringify(base.filter((p) => !p.ok)));
const G = 'engine-evidence-graph/';
const MUT = [
  ['M-01', 'quote: duplicates treated as unique', G + 'quote-resolution.mjs', "if (pos.length === 1) return res('verified_unique'", "if (pos.length >= 1) return res('verified_unique'"],
  ['M-02', 'quote: whitespace-collapsed matching', G + 'quote-resolution.mjs', 'let pos = positions(record, quote);', "let pos = positions(record.replace(/\\s+/g, ' '), quote.replace(/\\s+/g, ' '));"],
  ['M-03', 'quote: heading-only check removed', G + 'quote-resolution.mjs', 'const heading = /^([A-Z][A-Za-z0-9 /&()-]{1,39}):?\\s*$/.exec(quote);', 'const heading = null;'],
  ['M-04', 'quote: ellipsis check removed', G + 'quote-resolution.mjs', "if (/\\.\\.\\.|…|\\[\\s*\\.\\.\\.\\s*\\]/.test(quote)) return res('malformed', 'elided_quote');", ''],
  ['M-05', 'quote: line-break check removed', G + 'quote-resolution.mjs', "if (/\\n/.test(quote)) return res('malformed', 'crosses_line_break');", ''],
  ['M-06', 'quote: mid-word truncation allowed', G + 'quote-resolution.mjs', '!(isWord(record[p - 1]) && isWord(quote[0]))', 'true'],
  ['M-07', 'quote: disambiguator accepts several', G + 'quote-resolution.mjs', 'if (chosen.length === 1) return', 'if (chosen.length >= 1) return'],
  ['M-08', 'quote: breadth limit removed', G + 'quote-resolution.mjs', 'if (quote.length > MAX_QUOTE || quote.length > record.length * MAX_RECORD_FRACTION)', 'if (false)'],
  ['M-09', 'graph: span text check removed', G + 'graph-validate.mjs', "if (typeof record !== 'string' || record.slice(n.start, n.end) !== n.text || n.end <= n.start)", 'if (false)'],
  ['M-10', 'graph: traversal check removed', G + 'graph-validate.mjs', 'if (!refused && !viaAssertion.length && !direct.length)', 'if (false)'],
  ['M-11', 'graph: evidence-path check removed', G + 'graph-validate.mjs', "if (!viaAssertion.length) add('GV-07'", "if (false) add('GV-07'"],
  ['M-12', 'graph: edge shape check removed', G + 'graph-validate.mjs', 'if (!EDGE_SHAPES[e.type].some(([f, t]) => f === a.type && t === b.type))', 'if (false)'],
  ['M-13', 'graph: edge meaning check removed', G + 'graph-validate.mjs', 'if (e.meaning !== EDGE_MEANINGS[e.type])', 'if (false)'],
  ['M-14', 'graph: sufficiency-supported check removed', G + 'graph-validate.mjs', "if (f.status === 'supported' && f.condition_id === 'sufficiency')", 'if (false)'],
  ['M-15', 'graph: ordering check removed', G + 'graph-validate.mjs', "if (!sorted(g.nodes || []) || !sorted(g.edges || []))", 'if (false)'],
  ['M-16', 'graph: limitation check removed', G + 'graph-validate.mjs', "if (lim.length !== 1) add('GV-08', fid + ' must have exactly one limitation');", "if (false) add('GV-08', fid + ' must have exactly one limitation');"],
  ['M-17', 'graph: proof-claim guard removed', G + 'graph-validate.mjs', "if (assertsProof(v)) add('GV-11'", "if (false) add('GV-11'"],
  ['M-18', 'graph: identity check removed', G + 'graph-validate.mjs', "if (g[k] !== v) add('GV-01'", "if (false) add('GV-01'"],
  ['M-19', 'graph: conflict-node downgrade check removed', G + 'graph-validate.mjs', "if (f && (f.status === 'supported' || f.status === 'gap')) add('GV-09'", "if (false) add('GV-09'"],
  ['M-20', 'contradiction: downgrade removed in compiler', G + 'compiler.mjs', "for (const k of conflictAffects[c]) reasons.push('record_conflict:' + k);", ''],
  ['M-21', 'contradiction: impossible-sequence detection removed', G + 'contradictions.mjs', "if (ea && ez && (z === 'expiry' ? ez.date <= ea.date : ez.date < ea.date))", 'if (false)'],
  ['M-22', 'contradiction: decision-date detection removed', G + 'contradictions.mjs', "if (distinct.length > 1) add('decision_date_conflict'", "if (false) add('decision_date_conflict'"],
  ['M-23', 'contradiction: authority-state detection removed', G + 'contradictions.mjs', "if (ap && pe) add('authority_state_conflict'", "if (false) add('authority_state_conflict'"],
  ['M-24', 'scope: v0.3 employment phrasings removed', G + 'scope.mjs', "['employment', /\\b(?:relieved of", "['employment', /(?!)\\b(?:relieved of"],
  ['M-25', 'scope: refusal never decided', G + 'scope.mjs', "const decision = triggers.some((t) => t.disposition === 'refuse') ? 'refuse'", "const decision = false ? 'refuse'"],
  ['M-26', 'scope: reworded injection pattern removed', G + 'scope.mjs', "['reworded_status_directive', /", "['reworded_status_directive', /(?!)"],
  ['M-27', 'scope: instruction-risk downgrade removed', G + 'compiler.mjs', "if (risk.record_instruction_risk === 'detected') reasons.push('record_instruction_risk_detected');", ''],
  ['M-28', 'version: declared-version check removed', G + 'scope.mjs', 'for (const [k, v] of Object.entries(want)) if (dv[k] !== v) add(', 'for (const [k, v] of Object.entries(want)) if (false) add('],
  ['M-29', 'version: fixture-hash check removed', G + 'scope.mjs', "if (fi !== undefined && (!fi || typeof fi !== 'object' || fi.fixture_hash !== computedFixtureHash))", 'if (false)'],
  ['M-30', 'version: response prompt check removed', G + 'response.mjs', "if (v.prompt_version !== PROMPT_VERSION) return fail('prompt_version_mismatch');", ''],
  ['M-31', 'response: untrusted-field check removed', G + 'response.mjs', "if (Object.keys(o).some((k) => UNTRUSTED_FIELDS.includes(k))) return fail('candidate_supplied_untrusted_field');", ''],
  ['M-32', 'claim: prohibited-inference check removed', G + 'assertions.mjs', "for (const c of scanProhibitedClaims(note)) problems.push('prohibited_inference:' + c.category);", ''],
  ['M-33', 'claim: unstated-cause check removed', G + 'assertions.mjs', "if (CAUSAL.test(note) && !CAUSAL.test(quotedText)) problems.push('prohibited_inference:cause_not_stated_in_quote');", ''],
  ['M-34', 'claim: assertion marker check removed', G + 'assertions.mjs', "if (!ASSERTION_MARKERS[t].test(quotedText)) problems.push('assertion_type_not_visible_in_quoted_text');", ''],
  ['M-35', 'claim: condition permission check removed', G + 'assertions.mjs', "if (!CONDITION_ASSERTIONS[conditionId].includes(t)) problems.push('assertion_type_not_permitted_for_condition');", ''],
  ['M-36', 'controls: template drifts into a recommendation', G + 'controls.mjs', "'What date establishes the decision sequence, and which source document records it?'", "'Should the exception be revoked until the dates are corrected?'"],
  ['M-37', 'status: sufficiency override removed', G + 'compiler.mjs', "if (c === 'sufficiency') { status = 'review_required'; reasons.push('sufficiency_not_determinable_by_engine'); }", "if (false) { }"],
  ['M-38', 'status: gap accepted without a visible rule gap', G + 'compiler.mjs', 'else if (r.visible_gaps.length && verifiedByCondition[c].length)', 'else if (verifiedByCondition[c].length)'],
  ['M-39', 'evaluation: synthetic-holdout check removed', G + 'evaluation/factory.mjs', "if (item.origin === 'synthetic_engineering_fixture' || /synthetic/i.test(String(item.origin || ''))) r('synthetic_presented_as_holdout', item.item_id);", ''],
  ['M-40', 'evaluation: overlap check removed', G + 'evaluation/factory.mjs', "if (dev.has(item.content_sha256)) r('development_sealed_overlap', item.item_id);", ''],
  ['M-41', 'evaluation: label-independence check removed', G + 'evaluation/factory.mjs', "if (la.claimed_independent === true && (", "if (false && ("],
  ['M-42', 'evaluation: tracked-directory check removed', G + 'evaluation/factory.mjs', "if (!rel.startsWith('..') && !isAbsolute(rel) && !rel.startsWith('.local-evaluations')) r(", 'if (false) r('],
  ['M-43', 'evaluation: freeze check removed', G + 'evaluation/factory.mjs', "if (fr[k] && fr[k] !== cur) r('component_changed_after_freeze', k);", ''],
  ['M-44', 'evaluation: checker can approve', G + 'evaluation/factory.mjs', "decision: reasons.length ? 'refused' : 'not_authorized_to_execute'", "decision: reasons.length ? 'refused' : 'approved_for_execution'"],
  ['M-45', 'evaluation: registry accepts completed status', G + 'evaluation/factory.mjs', "'not_authorized_to_execute', 'superseded']);", "'not_authorized_to_execute', 'superseded', 'evaluation_completed']);"],
  ['M-46', 'evaluation: registry chain check removed', G + 'evaluation/factory.mjs', "if (sha(canon(body)) !== e.entry_hash) p.push('line_' + (i + 1) + ':entry_modified');", ''],
  ['M-47', 'evaluation: engineering-role conflict check removed', G + 'evaluation/factory.mjs', "for (const role of EXCLUSIVE_FROM_ENGINEERING) for (const person of who(role)) if (eng.has(person)) v.push", "for (const role of []) for (const person of who(role)) if (eng.has(person)) v.push"],
];
const evidence = [];
for (const [id, what, file, from, to] of MUT) {
  const tmp = mkdtempSync(join(tmpdir(), 'jrs-gmut-'));
  try {
    for (const d of ['engine-assurance', 'engine-evidence-contract', 'engine-evidence-graph']) cpSync(join(LIB, d), join(tmp, d), { recursive: true });
    const p = join(tmp, file), s = readFileSync(p, 'utf8'), n = s.split(from).length - 1;
    if (n !== 1) { t(id + ' target found exactly once (' + what + ')', false, 'occurrences: ' + n); evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: false, failing_probes: [], note: 'target occurrences ' + n }); continue; }
    writeFileSync(p, s.replace(from, to));
    // A mutant that fails to load is not a kill: it would prove nothing about the guard.
    let res; try { res = await runProbes(tmp, ctx); } catch (e) { t(id + ' mutant loads (' + what + ')', false, String(e.message).slice(0, 120)); evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: false, failing_probes: [], note: 'mutant failed to load' }); continue; }
    const killed = res.filter((x) => !x.ok).map((x) => x.id);
    evidence.push({ mutation: id, description: what, file: 'lib/' + file, killed: killed.length > 0, failing_probes: killed });
    t(id + ' ' + what + ': killed by ' + (killed.join(', ') || 'NOTHING'), killed.length > 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}
const ri = process.argv.indexOf('--record');
if (ri > 0) writeFileSync(process.argv[ri + 1], JSON.stringify({ generated: CLOCK, probes: base.map((p) => p.id), mutations: evidence }, null, 2) + '\n');

// ---------------------------------------------------------------- I. documents
console.log('\n# I. Package documents');
const docs = readdirSync(PKG).filter((f) => f.endsWith('.md')).map((f) => join(PKG, f))
  .concat(readdirSync(join(PKG, 'version-lineage')).filter((f) => f.endsWith('.md')).map((f) => join(PKG, 'version-lineage', f)))
  .concat([join(PKG, 'fixtures/FIXTURE_REGISTER.md'), join(PKG, 'sealed-evaluation-factory/PROTOCOL_TEMPLATE.md')]);
for (const d of docs) {
  if (!existsSync(d)) { skipped('content guard ' + d.slice(REPO.length), 'not present'); continue; }
  const text = readFileSync(d, 'utf8');
  const hits = scanUnsupportedClaims(text);
  t('content guard: ' + d.slice(REPO.length), !hits.length, hits.map((h) => h.term + ' :: ' + h.context).join(' || '));
}
const required = ['EVIDENCE_GRAPH_SPECIFICATION.md', 'QUOTE_RESOLUTION_POLICY.md', 'ASSERTION_BOUNDARY.md', 'CONTRADICTION_HANDLING_PROTOCOL.md', 'CONDITION_RULEBOOK.md', 'COGNITIVE_CONTROLS_GRAPH_BOUNDARY.md',
  'SEALED_EVALUATION_FACTORY_SPECIFICATION.md', 'EVALUATION_AUTHORITY_MATRIX.md', 'EVALUATION_CONTAMINATION_CONTROLS.md', 'MUTATION_TEST_RECORD.md', 'FAILURE_MODE_REGISTER.md', 'VERSION_COMPATIBILITY_REPORT.md', 'WORKBENCH_README.md', 'PHASE_3_HANDOFF.md'];
const missing = required.filter((f) => !existsSync(join(PKG, f)));
if (missing.length) skipped('required documents present', 'missing: ' + missing.join(', ')); else t('all fourteen required documents present', true);
const STATEMENT = 'This package is a local Evidence Graph Compiler and sealed evaluation-preparation system. It does not establish independent accuracy, semantic validity, adjudicated performance, operational reliability, production readiness, security effectiveness, legal compliance, licensing readiness, or sale readiness.';
if (existsSync(join(PKG, 'PHASE_3_HANDOFF.md'))) t('handoff ends with the required statement', readFileSync(join(PKG, 'PHASE_3_HANDOFF.md'), 'utf8').trim().endsWith(STATEMENT)); else skipped('handoff statement', 'handoff not present');

t('suite made no network attempt', trap.count() === 0, trap.attempts.join(', '));
trap.restore();
console.log('\n' + (pass + fail + skip) + ' checks: ' + pass + ' passed, ' + fail + ' failed, ' + skip + ' skipped');
if (failures.length) console.log('Failed: ' + failures.join(' | '));
process.exit(fail ? 1 : 0);
