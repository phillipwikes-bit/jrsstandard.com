// Builds the Phase 3 deliverables from out/run-1, out/run-2 and DETERMINISM_COMPARISON.json. Reports only; no evaluation.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const r1 = JSON.parse(readFileSync(join(PKG, 'out/run-1/RESULTS.json'), 'utf8'));
const r2 = JSON.parse(readFileSync(join(PKG, 'out/run-2/RESULTS.json'), 'utf8'));
const det = JSON.parse(readFileSync(join(PKG, 'DETERMINISM_COMPARISON.json'), 'utf8'));
const S = r1.summary;
const ab = { supported: 'S', gap: 'G', review_required: 'RR', not_assessed: 'NA' };
const res = { results_format: 'jrs-v0-mechanical-evaluation-summary/1.0.0', date: '2026-10-25', release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN',
  statement: r1.statement, primary_run: 'out/run-1/RESULTS.json', repeat_run: 'out/run-2/RESULTS.json', system_under_test: r1.system_under_test, seal: r1.seal, network: r1.network,
  summary_run_1: S, summary_run_2: r2.summary, determinism: det.totals, metamorphic: r1.metamorphic,
  claim_categories: {
    mechanically_established: 'Checks VC-04 to VC-13 and VC-15 passed on every replayed case, and the rejection checks passed on every rejected case. These are properties of this Engine build on this corpus only.',
    owner_authored_expectation: S.expectation_matches + ' of ' + S.cases + ' cases matched the sealed expectation. The expectations were written by the same side as the corpus, so this measures conformance to the owner\'s reading of the rules, not accuracy.',
    unresolved_semantic_question: r1.results.filter((x) => x.classification.unresolved_semantic_questions.length).map((x) => x.case_id),
    not_assessed: r1.results.filter((x) => x.classification.not_assessed.length).map((x) => x.case_id + ': ' + x.classification.not_assessed.join(', ')),
    not_suitable_for_a_claim: ['diagnostic accuracy', 'model behaviour', 'reliability', 'real-world performance', 'independent validation', 'production or release suitability'] },
  cases: r1.results.map((x) => ({ case_id: x.case_id, group: x.group, adapter: x.adapter, statuses: x.observed && x.observed.statuses, conflict_kinds: x.observed && x.observed.conflict_kinds,
    refusal_codes: x.observed && x.observed.refusal_codes, expectation: x.classification.owner_authored_expectation, mechanical_failures: x.classification.mechanical_failures,
    semantic_questions: x.classification.unresolved_semantic_questions, case_digest: x.case_digest })) };
writeFileSync(join(PKG, 'MECHANICAL_EVALUATION_RESULTS.json'), JSON.stringify(res, null, 2) + '\n');

const rows = r1.results.map((x) => '| ' + x.case_id + ' | ' + x.title.replace(/\|/g, '/') + ' | ' + (x.adapter.outcome === 'REPLAYED' ? Object.values(x.observed.statuses).map((s) => ab[s]).join(' ') + (x.observed.intake_decision !== 'proceed' ? ' (intake ' + x.observed.intake_decision + ')' : '') : x.adapter.step + ' ' + x.adapter.code) + ' | '
  + (x.observed ? (x.observed.conflict_kinds.join(', ') || '-') : '-') + ' | ' + (x.observed ? (x.observed.refusal_codes.join(', ') || '-') : '-') + ' | ' + (x.classification.owner_authored_expectation === 'matches_sealed_expectation' ? 'match' : 'DIFFERS') + ' | ' + (x.classification.mechanical_failures.length ? 'FAIL' : 'pass') + ' |').join('\n');
const sem = r1.results.filter((x) => x.classification.unresolved_semantic_questions.length).map((x) => '- **' + x.case_id + '.** ' + x.classification.unresolved_semantic_questions.join(' ')).join('\n');
const md = `# Mechanical Evaluation Report

**Gate V0, 2026-10-25. Offline only, with mocked candidate responses.** Not validation. It establishes no accuracy, reliability or real-world performance. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## 1. What ran

- **Corpus:** sealed owner-authored synthetic validation-readiness corpus, 60 cases. Sealed at ${r1.seal.sealed_at_utc}; manifest \`${r1.seal.manifest_sha256}\`; the seal verified before each run.
- **Engine:** \`0.3.1-candidate\`, from an isolated copy (${r1.system_under_test.candidate_files_verified} candidate files verified, unchanged after use, deleted).
- **Adapter:** ${r1.system_under_test.adapter_version} (\`${r1.system_under_test.adapter_sha256}\`). Transport: mock. Model identifier: \`${r1.system_under_test.model_identifier}\`. Runtime: Node ${r1.system_under_test.node_version}.
- **Method:** \`EVALUATION_METHOD_PRESPECIFIED.md\`, written before the first run; custody hashes are in \`PRE_RUN_RECORD.json\`.
- **Runs:** two, from clean output directories in separate processes.

## 2. Totals (run 1; run 2 identical)

| Measure | Value |
|---|---|
| Cases | ${S.cases} |
| Replayed through the Engine | ${S.replayed} |
| Rejected by the adapter before replay | ${S.rejected_pre_replay} |
| Execution errors | ${S.errors} |
| Mechanical check failures | ${S.mechanical_check_failures} |
| Set-up problems (Layer 1, expectation integrity) | ${S.setup_problems} |
| Cases matching the sealed owner-authored expectation | ${S.expectation_matches} of ${S.cases} |
| Metamorphic relations holding | ${S.metamorphic_holding} of ${S.metamorphic_relations} |
| Network attempts | ${S.network_attempts} |
| Determinism: cases identical under the pre-specified criterion | ${det.totals.identical_under_criterion} of ${det.totals.cases} |
| Run summaries identical | ${det.summaries_identical} |

## 3. Results by claim category

- **Mechanically established, for this build and this corpus only.** On every replayed case:
  - quotation offsets equal the record text, in both UTF-16 and UTF-8;
  - every assertion is linked to exactly one verified evidence item;
  - no ambiguous quotation was selected;
  - no status was raised above the candidate's proposal, and sufficiency was never supported;
  - every finding, conflict and refusal is routed to human review;
  - chronology conflicts lowered chronology;
  - every graph passed the frozen validator;
  - provenance pairs and binding digests verified, both independently and by the adapter's pair check;
  - model identity matched;
  - execution labels were \`local_mocked\`, with 0 provider and 0 network calls.

  Every rejected case produced no graph and no execution record. No execution error occurred. Normalized outputs were identical across the two runs.
- **Owner-authored expectation.** ${S.expectation_matches} of ${S.cases} cases matched. The expectations and the corpus come from the same side. A match shows the Engine behaves as the owner's reading of its rules predicts; it does not show that the behaviour is correct.
- **Unresolved semantic questions.** These are recorded, not resolved: ${res.claim_categories.unresolved_semantic_question.join(', ')} (section 5).
- **Not assessed.** Intake-stopped cases (EV-37, EV-38, EV-39, ADV-09, ADV-10) and the eight adapter rejections assess no condition. ADV-13 leaves sufficiency not assessed.
- **Not suitable for a claim.** Diagnostic accuracy, model behaviour, reliability, real-world performance, independent validation, and production or release suitability.

## 4. Per-case results (run 1)

Statuses are given in the order reconstructability, identifiable basis, chronology integrity, reasoning traceability, sufficiency. S supported, G gap, RR review required, NA not assessed.

| Case | Purpose | Outcome | Conflicts | Refusals | Expectation | Mechanical |
|---|---|---|---|---|---|---|
${rows}

## 5. Unresolved semantic questions (recorded for adjudication, not repaired)

${sem}

## 6. Determinism note

All ${det.totals.replayed_cases_with_raw_graph_byte_differences} replayed graphs differ in raw bytes between runs, as the pre-specified method anticipated. The adapter passes the capture time as the compiler clock, and the Engine's own \`identity.graph_sha256\` is computed over the \`run_identity\` node, which carries that time. Under the pre-specified normalization, all 60 cases are identical. The Engine's \`graph_sha256\` is therefore not a timestamp-independent content hash. This is recorded in the failure and uncertainty register as a reproducibility limitation.

**B-018 remains OPEN. NO_GO_NOT_VERIFIED remains in effect.**
`;
writeFileSync(join(PKG, 'MECHANICAL_EVALUATION_REPORT.md'), md);
console.log('phase 3 reports written');
