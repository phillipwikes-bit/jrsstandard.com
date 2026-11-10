#!/usr/bin/env node
// JRS ENGINE ASSURANCE: deterministic replay harness.
//
//   node tools/engine-assurance-replay.mjs [--clock 2026-10-10T00:00:00Z] [--only SAE-001]
//                                          [--out <dir>] [--no-write]
//
// One command that, for every registered synthetic fixture:
//   1. validates the fixture files and, after the run, the envelope;
//   2. runs the existing candidate in local_mocked or local_deterministic mode only;
//   3. captures normalised output;
//   4. re-verifies every source span against the record at its offsets;
//   5. compares the output with the frozen, engineering-authored expected result;
//   6. writes a JSON and a Markdown execution record;
//   7. hashes the fixture, expected output, actual output and run envelope;
//   8. fails if a favourable result survives a refusal, a missing anchor, an
//      invalid span or a schema error.
//
// It REFUSES TO START if a provider credential or endpoint is configured in the
// environment, and it traps every Node network API for the whole run. It makes no
// network request; the execution record states the trapped-attempt count.
//
// Exit codes: 0 all fixtures matched; 1 a fixture failed; 2 usage or fixture
// error; 3 network-capable provider configuration detected (nothing ran).

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { detectProviderConfiguration, installNetworkTrap } from '../lib/engine-assurance/network-guard.mjs';

const REPO = fileURLToPath(new URL('../', import.meta.url));
const PKG = join(REPO, 'research/engine-assurance-2026-10-10');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const value = (f) => { const i = args.indexOf(f); return i < 0 ? null : args[i + 1]; };

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');

export async function replay(options = {}) {
  const env = options.env || process.env;
  const fixturesDir = options.fixturesDir || join(PKG, 'fixtures');
  const outDir = options.outDir || join(PKG, 'execution-record');
  const write = options.write !== false;
  const clock = options.clock || null;
  const only = options.only || null;

  // Control 1: refuse to start with a network-capable provider configuration.
  const providerConfig = detectProviderConfiguration(env);
  if (providerConfig.length) {
    return { exitCode: 3, refused: true, providerConfig,
      message: 'REFUSED: network-capable provider configuration present (' + providerConfig.map((p) => p.name).join(', ')
        + '). Unset these variables for the local run. Nothing was executed.' };
  }

  // Control 2: trap every network API before any project module loads.
  const trap = installNetworkTrap();
  try {
    const { runAssurance } = await import('../lib/engine-assurance/run.mjs');
    const { validateEnvelope, normalizeEnvelope } = await import('../lib/engine-assurance/envelope.mjs');
    const { checkCandidateProvenance } = await import('../lib/engine-assurance/provenance.mjs');
    const { scanUnsupportedClaims, scanObject } = await import('../lib/engine-assurance/content-guard.mjs');
    const { canonicalize } = await import('../lib/manifest/canonicalize.js');
    const { CONDITION_KEYS } = await import('../lib/engine-assurance/candidate-core.mjs');

    const codeFiles = [
      ...readdirSync(join(REPO, 'lib/engine-assurance')).filter((f) => f.endsWith('.mjs')).sort().map((f) => 'lib/engine-assurance/' + f),
      'api/_manifest/build.js', 'api/_manifest/from-engine.js', 'api/_manifest/canonicalize.js', 'api/_manifest/hash.js',
      'tools/validate-manifest.js', 'tools/engine-assurance-replay.mjs',
      'schemas/jrs-decision-reconstruction-manifest.schema.json',
      'research/engine-assurance-2026-10-10/contracts/review-run-envelope.schema.json',
    ];
    const codeHashes = Object.fromEntries(codeFiles.map((p) => [p, sha(readFileSync(join(REPO, p), 'utf8'))]));
    const provenance = checkCandidateProvenance();

    const register = JSON.parse(readFileSync(join(fixturesDir, 'FIXTURE_REGISTER.json'), 'utf8'));
    const results = [];
    const envelopes = {};
    for (const entry of register.fixtures) {
      if (only && entry.fixture_id !== only) continue;
      const fid = entry.fixture_id;
      const problems = [];
      const r = { fixture_id: fid, category: entry.category, result: 'fail', mismatches: problems };
      results.push(r);
      // Step 1: fixture validation.
      let request, record, expected, provider = null;
      try {
        request = JSON.parse(readFileSync(join(fixturesDir, entry.files.request), 'utf8'));
        record = readFileSync(join(fixturesDir, entry.files.record), 'utf8');
        expected = JSON.parse(readFileSync(join(fixturesDir, entry.files.expected), 'utf8'));
        if (entry.files.provider_mock) provider = JSON.parse(readFileSync(join(fixturesDir, entry.files.provider_mock), 'utf8'));
      } catch (e) { problems.push('fixture file unreadable: ' + e.message); continue; }
      if (request.fixture_format_version !== 'jrs-assurance-fixture/0.1.0') problems.push('unsupported fixture format');
      if (expected.expected_format_version !== 'jrs-assurance-expected/0.1.0') problems.push('unsupported expected format');
      if (request.fixture_id !== fid || expected.fixture_id !== fid) problems.push('fixture id mismatch across files');
      if (!/Synthetic and engineering-authored/.test(entry.synthetic_statement || '')) problems.push('register entry lacks the synthetic statement');
      if (!record.startsWith('SYNTHETIC ENGINEERING FIXTURE.')) problems.push('record lacks the synthetic header');
      if (expected.label_status !== 'engineering_authored_expected_result_not_adjudicated') problems.push('expected file is not labelled as engineering-authored');
      if (expected.execution_mode !== request.execution_mode) problems.push('execution mode differs between request and expected');
      if (problems.length) continue;

      // Step 2: run the candidate locally.
      let envelope;
      try {
        envelope = await runAssurance({ fixtureId: fid, record, request, providerResponse: provider,
          executionMode: request.execution_mode, clock: clock || undefined, sourceIdentity: provenance, codeHashes });
      } catch (e) { problems.push('run error: ' + e.message); continue; }
      envelopes[fid] = envelope;

      // Steps 3-4: normalise and independently re-validate, including every span.
      const v = validateEnvelope(envelope, record);
      for (const e of [...v.structural, ...v.semantic]) problems.push('envelope: ' + e);

      // Step 8: favourable-after-refusal invariant, checked independently of the expected file.
      const favourable = envelope.findings.condition_findings.filter((f) => f.outcome === 'supported' || f.outcome === 'gap');
      if (envelope.gate.decision !== 'proceed' && favourable.length) problems.push('INVARIANT: favourable or gap result after a ' + envelope.gate.decision);
      const withheld = new Set(envelope.refusals.filter((x) => x.stage === 'post_analysis' && x.condition_id).map((x) => x.condition_id));
      for (const f of favourable) {
        if (withheld.has(f.condition_id)) problems.push('INVARIANT: ' + f.condition_id + ' favourable after a withheld citation or note');
        if (!f.source_spans.length) problems.push('INVARIANT: ' + f.condition_id + ' favourable without a span');
      }
      if (envelope.execution_mode !== 'local_mocked' && envelope.execution_mode !== 'local_deterministic' && favourable.length) problems.push('INVARIANT: result under an unauthorized mode');

      // Step 5: compare with the frozen expected result.
      const cmp = (label, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(label + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); };
      cmp('gate_decision', envelope.gate.decision, expected.gate_decision);
      cmp('refusal_codes', envelope.refusals.map((x) => x.code).sort(), [...expected.expected_refusal_codes].sort());
      cmp('record_controls', envelope.findings.record_controls.map((c) => c.control_id + ':' + c.detect.pattern_id).sort(), [...expected.record_controls].sort());
      cmp('manifest_produced', envelope.manifest_reference.produced, expected.manifest_produced);
      cmp('provider_invocations', envelope.provider_invocations, expected.provider_invocations);
      cmp('execution_mode', envelope.execution_mode, expected.execution_mode);
      for (const k of CONDITION_KEYS) {
        const got = envelope.findings.condition_findings.find((f) => f.condition_id === k);
        const want = expected.conditions[k];
        if (!got || !want) { problems.push(k + ': missing in output or expected'); continue; }
        cmp(k + '.outcome', got.outcome, want.outcome);
        cmp(k + '.outcome_basis', got.outcome_basis, want.outcome_basis);
        cmp(k + '.span_quotes', got.source_spans.map((s) => s.quote).sort(), [...want.span_quotes].sort());
      }

      // Step 7: hashes.
      const normalized = normalizeEnvelope(envelope);
      r.hashes = {
        fixture_content: envelope.fixture_content_hash,
        expected_output: sha(canonicalize(expected)),
        actual_normalized_output: sha(normalized),
        run_envelope: sha(canonicalize(envelope)),
      };
      r.run_id = envelope.run_id;
      r.gate_decision = envelope.gate.decision;
      r.outcomes = Object.fromEntries(envelope.findings.condition_findings.map((f) => [f.condition_id, f.outcome]));
      if (!problems.length) r.result = 'pass';
    }

    const passed = results.filter((x) => x.result === 'pass').length;
    const record = {
      record_type: 'jrs-engine-assurance-execution-record/0.1.0',
      generated_at: clock || new Date().toISOString(),
      clock_mode: clock ? 'fixed_clock_' + clock : 'wall_clock',
      command: 'node tools/engine-assurance-replay.mjs' + (clock ? ' --clock ' + clock : '') + (only ? ' --only ' + only : ''),
      environment: { node: process.version, platform: process.platform + '-' + process.arch },
      repository: { head: provenance.repository_head || 'unknown', working_tree: provenance.working_tree },
      candidate_source_identity: { status: provenance.status, checks: provenance.checks },
      network: {
        provider_configuration_detected: [],
        trap_installed: true,
        trapped_attempts: trap.count(),
        note: 'Every Node fetch, http(s), net, tls and dns entry point was replaced for the duration of the run. The count above is the number of attempts the trap intercepted.',
      },
      code_executed: Object.entries(codeHashes).map(([path, hash]) => ({ path, sha256: hash })),
      fixtures_used: results,
      summary: { fixtures_total: results.length, passed, failed: results.length - passed, skipped: 0 },
      known_limitations: [
        'Every fixture and every expected result is synthetic and engineering-authored by the same session that wrote the code. Agreement shows the code does what its author intended; it does not show the intent is right.',
        'Candidate output came from fixed mock provider responses. The model, its prompt-following, and the quality of its findings were not exercised.',
        'Source-span verification establishes record presence only, not semantic support (SAE-027 demonstrates a supported chronology finding on a record whose dates conflict).',
        'The pre-analysis gate and record controls are lexical; they will miss phrasings they do not anticipate and will sometimes fire on acceptable text.',
        'Condition identifiers are Engine keys; the Engine-to-Codebook mapping is not established.',
      ],
      not_tested: [
        'Any live provider call, model version, or prompt variant, including whether a model will supply exact quotations when asked.',
        'Any real, customer, practitioner or independently authored record.',
        'Accuracy, sensitivity, specificity, inter-rater agreement, or any comparison with adjudicated reference labels.',
        'Any deployed route, operator workflow, access control, retention, or recovery behaviour.',
        'Non-ASCII records, very long single lines, and adversarial Unicode (homoglyphs, zero-width characters) in quotations or injection text.',
      ],
      remains_unverified: [
        'Independent accuracy of the candidate (release gate 1: independent labelled and adjudicated holdout).',
        'Operator-control evidence (release gate 2), counsel review (gate 3), owner release authorisation (gate 4) and independent production QA.',
        'Contents of the three source-aligned files named in CURRENT_ENGINE_HANDOFF_2026-10-05.md, which were not available in this session (NOT ESTABLISHED).',
      ],
      status_statement: 'This work supports local engineering assurance and validation preparation only. It does not establish independent accuracy, production readiness, legal compliance, security effectiveness, commercial readiness, licensing readiness, or sale readiness.',
    };
    record.network.trapped_attempts = trap.count();

    // Content guard over everything this run generates.
    const md = renderMarkdown(record);
    const guard = [...scanObject(record), ...scanUnsupportedClaims(md)];
    for (const [fid, env] of Object.entries(envelopes)) {
      // quote fields are verbatim record text and are verified against the record instead.
      const strip = JSON.parse(JSON.stringify(env, (k, v) => (k === 'quote' || k === 'matched_text' ? undefined : v)));
      for (const g of scanObject(strip)) guard.push(Object.assign({ fixture_id: fid }, g));
    }
    record.content_guard = { findings: guard.length, detail: guard.slice(0, 20) };

    if (write) {
      mkdirSync(join(outDir, 'envelopes'), { recursive: true });
      for (const [fid, env] of Object.entries(envelopes)) {
        writeFileSync(join(outDir, 'envelopes', fid + '.envelope.json'), JSON.stringify(env, null, 2) + '\n');
      }
      writeFileSync(join(outDir, 'EXECUTION_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
      writeFileSync(join(outDir, 'EXECUTION_RECORD.md'), renderMarkdown(record));
    }
    const exitCode = (record.summary.failed || guard.length || trap.count()) ? 1 : 0;
    return { exitCode, record, envelopes };
  } finally {
    trap.restore();
  }
}

function renderMarkdown(r) {
  const lines = [];
  lines.push('# Engine Assurance Execution Record', '');
  lines.push('**Status.** ' + r.status_statement, '');
  lines.push('| Item | Value |', '|---|---|');
  lines.push('| Generated | ' + r.generated_at + ' (' + r.clock_mode + ') |');
  lines.push('| Command | `' + r.command + '` |');
  lines.push('| Node | ' + r.environment.node + ' on ' + r.environment.platform + ' |');
  lines.push('| Repository HEAD | `' + r.repository.head + '` (' + r.repository.working_tree + ') |');
  lines.push('| Candidate source identity | ' + r.candidate_source_identity.status + ' |');
  lines.push('| Network attempts trapped | ' + r.network.trapped_attempts + ' |');
  lines.push('| Fixtures | ' + r.summary.fixtures_total + ' total, ' + r.summary.passed + ' passed, ' + r.summary.failed + ' failed, ' + r.summary.skipped + ' skipped |');
  if (r.content_guard) lines.push('| Content guard findings | ' + r.content_guard.findings + ' |');
  lines.push('', '## Code executed', '', '| File | SHA-256 |', '|---|---|');
  for (const c of r.code_executed) lines.push('| `' + c.path + '` | `' + c.sha256.slice(7, 23) + '...` |');
  lines.push('', '## Fixtures used', '', '| Fixture | Category | Gate | Outcomes (5 Engine keys, in key order) | Result |', '|---|---|---|---|---|');
  for (const f of r.fixtures_used) {
    lines.push('| ' + f.fixture_id + ' | ' + f.category + ' | ' + (f.gate_decision || '-') + ' | ' + (f.outcomes ? Object.values(f.outcomes).join(', ') : '-') + ' | ' + f.result.toUpperCase() + (f.mismatches.length ? ': ' + f.mismatches.join('; ').replace(/\|/g, '/') : '') + ' |');
  }
  lines.push('', '## Known limitations', '');
  for (const x of r.known_limitations) lines.push('- ' + x);
  lines.push('', '## What was not tested', '');
  for (const x of r.not_tested) lines.push('- ' + x);
  lines.push('', '## What remains unverified', '');
  for (const x of r.remains_unverified) lines.push('- ' + x);
  lines.push('', 'Per-fixture hashes (fixture, expected, actual normalised output, envelope) are in `EXECUTION_RECORD.json`.', '');
  return lines.join('\n');
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (flag('--help')) {
    console.log('usage: node tools/engine-assurance-replay.mjs [--clock ISO] [--only FIXTURE] [--out DIR] [--no-write]');
    process.exit(0);
  }
  const res = await replay({ clock: value('--clock'), only: value('--only'), outDir: value('--out') ? resolve(value('--out')) : undefined, write: !flag('--no-write') });
  if (res.refused) { console.error(res.message); process.exit(res.exitCode); }
  const s = res.record.summary;
  for (const f of res.record.fixtures_used) {
    console.log((f.result === 'pass' ? 'PASS  ' : 'FAIL  ') + f.fixture_id + '  ' + f.category + (f.mismatches.length ? '\n        ' + f.mismatches.join('\n        ') : ''));
  }
  console.log('\n' + s.fixtures_total + ' fixtures, ' + s.passed + ' passed, ' + s.failed + ' failed, ' + s.skipped + ' skipped; network attempts trapped: '
    + res.record.network.trapped_attempts + '; content guard findings: ' + res.record.content_guard.findings);
  if (res.record.content_guard.findings) console.log(JSON.stringify(res.record.content_guard.detail, null, 2));
  process.exit(res.exitCode);
}
