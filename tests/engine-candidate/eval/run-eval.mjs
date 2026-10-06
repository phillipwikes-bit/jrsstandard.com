// Local evaluation runner for the constructed development corpus. Mock adapter only.
//   node tests/engine-candidate/eval/run-eval.mjs                 compare and print
//   node tests/engine-candidate/eval/run-eval.mjs --write <dir>   also write the JSON evaluation record there
//
// Compares each record's actual result with its expected-findings file, which
// was committed before this runner existed (804f313). Every mismatch is a
// failure. The record it writes holds identifiers, hashes and comparisons, never
// record text. It computes no accuracy, reliability, agreement rate or DRR score
// and makes no validation claim: it is constructed-development evidence only.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { runCandidate, CANDIDATE_VERSION, PROMPT_VERSION } from '../../../lib/engine-candidate/review-candidate.js';
import { runConsistencyHarness, HARNESS_VERSION } from '../../../lib/engine-candidate/harness.js';
import { createMockAdapter } from '../../../lib/engine-candidate/mock-adapter.js';
import { SOURCE_PREP_VERSION, sha256 } from '../../../lib/engine-candidate/source-prep.js';
import { CONTRACT_VERSION } from '../../../lib/engine-candidate/contract.js';
import { ADAPTER_CONTRACT, explanationIdFor } from '../../../lib/engine-candidate/adapter.js';

export const EVAL_RUNNER_VERSION = 'candidate-eval-runner/0.1.0';
const CORPUS = new URL('../corpus/v0.1.0/', import.meta.url).pathname;
const IDS = { model_id: 'mock-deterministic', model_version: 'corpus-0.1.0', prompt_version: PROMPT_VERSION };
const NOW = () => 'not-recorded';
const uniq = (a) => [...new Set(a)].sort();
// Key-order-independent comparison: the first run compared JSON strings and failed CR-002 on key order alone.
export const canon = (v) => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v;
export const same = (x, y) => JSON.stringify(canon(x)) === JSON.stringify(canon(y));

// Documented migration, not an edit of the corpus. The corpus v0.1.0 responses were written for
// candidate-prompt/0.3.0, when accountability_support took the insufficient_evidence explanation id
// and the extraction_omission flaw took its own type as id.
// Prompt 0.4.0 and explanation set 0.2.0 unmap that key (D-2, D-3), so the adapter boundary would
// reject every response on identity and explanation id. The corpus files are pre-registered (804f313)
// and stay unchanged; this runner re-stamps the prompt version and remaps only those two legacy ids.
// Nothing else in a response is touched, and a response for any other prompt version is not migrated.
export const LEGACY_PROMPT_VERSION = 'candidate-prompt/0.3.0';
export function migrateLegacyResponse(response) {
  if (!response || response.prompt_version !== LEGACY_PROMPT_VERSION) return response;
  const out = JSON.parse(JSON.stringify(response));
  out.prompt_version = PROMPT_VERSION;
  const acc = out.conditions && out.conditions.accountability_support;
  if (acc && acc.explanation_id === 'insufficient_evidence') acc.explanation_id = explanationIdFor('condition', 'accountability_support');
  (Array.isArray(out.findings) ? out.findings : []).forEach((f) => {
    if (f && f.type === 'extraction_omission' && f.explanation_id === 'extraction_omission') f.explanation_id = explanationIdFor('flaw', 'extraction_omission');
  });
  return out;
}
const mock = (response) => createMockAdapter({ ...IDS, respond: () => migrateLegacyResponse(response) });

export function observe(result, adapterCalls, harness) {
  const prep = result.extraction_findings.filter((f) => f.origin === 'source_prep');
  const rej = result.extraction_findings.find((f) => f.code === 'adapter_output_rejected');
  const flagged = {};
  for (const f of (result.contextual_findings?.findings || []).filter((x) => x.kind === 'condition')) flagged[f.condition] = f.status;
  const flaws = (result.contextual_findings?.findings || []).filter((x) => x.kind === 'flaw');
  return {
    refusal: result.status === 'refused' ? result.reason : null,
    refusal_codes: uniq(result.refusal_codes),
    source_prep_codes: uniq(prep.filter((f) => f.code !== 'profile_element_not_found').map((f) => f.code)),
    elements_missing: uniq(prep.filter((f) => f.code === 'profile_element_not_found').map((f) => f.element)),
    adapter_called: adapterCalls > 0,
    result_status: result.status,
    adapter_rejection_codes: rej ? uniq(rej.rejection_codes) : [],
    flagged_conditions: flagged,
    finding_types: uniq(flaws.map((f) => f.type)),
    uncertain_finding_types: uniq(flaws.filter((f) => f.uncertain).map((f) => f.type)),
    withheld_groups: uniq(result.extraction_findings.filter((f) => f.code === 'withheld_prohibited_inference').flatMap((f) => f.groups)),
    harness: { status: harness.status, failure_codes: harness.failure_codes, disagreements: harness.disagreements },
  };
}

export async function evaluate() {
  const index = JSON.parse(readFileSync(join(CORPUS, 'INDEX.json'), 'utf8'));
  const rows = [];
  for (const id of index.records) {
    const rec = JSON.parse(readFileSync(join(CORPUS, 'records', id + '.json'), 'utf8'));
    const exp = JSON.parse(readFileSync(join(CORPUS, 'expected', id + '.expected.json'), 'utf8'));
    const input = { text: rec.text, profile: rec.profile, record_ref: rec.record_id };
    const primary = mock(rec.mock_responses[0].response);
    const result = await runCandidate(input, { adapter: primary, now: NOW });
    const harness = await runConsistencyHarness({ input, now: NOW, variants: rec.mock_responses.map((v) => ({ variant_id: v.variant_id, adapter: mock(v.response) })) });
    const got = observe(result, primary.calls.length, harness);
    const want = exp.expected;
    const mismatches = Object.keys(want).filter((k) => !same(want[k], got[k]))
      .map((k) => ({ field: k, expected: want[k], actual: got[k] }));
    rows.push({ record_id: id, record_version: rec.record_version, text_sha256: sha256(rec.text), scenario: rec.scenario,
                review_id: result.review_identity.review_id, outcome: mismatches.length ? 'FAIL' : 'PASS', mismatches });
  }
  return {
    evaluation_record: 'jrs-candidate-local-evaluation/0.1.0',
    label: 'CONSTRUCTED-DEVELOPMENT EVIDENCE ONLY. Mock adapter, constructed records. Not a measure of accuracy, reliability or validity, not a DRR score, and not evidence about any real model or real record.',
    corpus: { id: index.corpus, version: index.corpus_version, records: index.records.length },
    versions: { eval_runner: EVAL_RUNNER_VERSION, candidate: CANDIDATE_VERSION, source_prep: SOURCE_PREP_VERSION, result_contract: CONTRACT_VERSION,
                adapter_contract: ADAPTER_CONTRACT, harness: HARNESS_VERSION, prompt: PROMPT_VERSION, adapter: IDS.model_id + '@' + IDS.model_version, response_migration: LEGACY_PROMPT_VERSION + ' -> ' + PROMPT_VERSION },
    records: rows,
    failures: rows.filter((r) => r.outcome === 'FAIL').map((r) => r.record_id),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ev = await evaluate();
  for (const r of ev.records) {
    console.log(`${r.outcome}  ${r.record_id}  ${r.scenario}`);
    for (const m of r.mismatches) console.log(`        ${m.field}: expected ${JSON.stringify(m.expected)} got ${JSON.stringify(m.actual)}`);
  }
  const w = process.argv.indexOf('--write');
  if (w !== -1) {
    const dir = process.argv[w + 1]; mkdirSync(dir, { recursive: true });
    const file = join(dir, `EVAL_corpus-${ev.corpus.version}_candidate-${ev.versions.candidate}.json`);
    writeFileSync(file, JSON.stringify(ev, null, 1) + '\n'); console.log(`wrote ${file}`);
  }
  console.log(`\n${ev.label}\n${ev.records.length} records, ${ev.failures.length} failed${ev.failures.length ? ': ' + ev.failures.join(', ') : ''}`);
  process.exit(ev.failures.length ? 1 : 0);
}
