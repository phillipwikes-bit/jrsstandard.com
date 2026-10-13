#!/usr/bin/env node
// Builds the Sealed Evaluation Factory's local, readiness-only artifacts:
// REGISTRY.jsonl (append-only, hash-chained), PROTOCOL_TEMPLATE.md, AUTHORITY_MATRIX.json,
// example-packages/*.json and SEPARATION_CHECK_RESULTS.json.
// No holdout, label, adjudication, authorisation or evaluation is created. Offline.
//
//   env -u ANTHROPIC_BASE_URL node research/evidence-graph-compiler-2026-10-10/sealed-evaluation-factory/build-factory-artifacts.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { installNetworkTrap, detectProviderConfiguration } from '../../../lib/engine-assurance/network-guard.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const sha = (b) => 'sha256:' + createHash('sha256').update(b).digest('hex');

export function currentHashes() {
  const { compilerHash } = globalThis.__egc;
  return {
    prompt_sha256: sha(readFileSync(join(REPO, 'research/evidence-graph-compiler-2026-10-10/prompt-contract/PROMPT_v0.3.0.txt'))),
    codebook_sha256: sha(readFileSync(join(REPO, 'codebook.html'))),
    compiler_sha256: compilerHash(),
  };
}
export function developmentHashes() {
  const dirs = ['research/engine-assurance-2026-10-10/fixtures/records', 'research/engine-evidence-contract-2026-10-10/fixtures/cases',
    'research/engine-evidence-contract-2026-10-10/fixtures/long-record', 'research/evidence-graph-compiler-2026-10-10/fixtures/cases'];
  const out = new Set();
  for (const d of dirs) for (const f of readdirSync(join(REPO, d)).filter((x) => x.endsWith('.txt') && !x.includes('response') && !x.includes('v1-output')))
    out.add(sha(readFileSync(join(REPO, d, f), 'utf8')));
  return out;
}

export function examplePackages(hashes, devSample) {
  const good = {
    evaluation_id: 'EVAL-LW-EXAMPLE', version_identity: { engine_version: '0.3.0-local', compiler_version: '0.3.0-local', prompt_contract_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0', codebook_sha256: hashes.codebook_sha256 },
    freeze: Object.assign({ freeze_date: '2026-10-10' }, hashes),
    data_classification: 'authorized_independent_non_hr_supplier_records_with_counsel_review',
    owner_authorization: { record_id: 'OWNER-AUTH-PLACEHOLDER-NOT-ISSUED', date: '2026-10-10' },
    adjudication_authority: { name: 'Named independent adjudicator (example structure only)' },
    label_authority: { name: 'Two named independent reviewers (example structure only)', claimed_independent: true, process_id: 'independent_review_panel' },
    sealed_set: [{ item_id: 'H-001', content_sha256: 'sha256:' + '1'.repeat(64), origin: 'independent_authorised_source' }],
    data_location: '/secure-store/not-in-repository', engineering_process_id: 'claude_code_session',
  };
  const mut = (f) => { const p = JSON.parse(JSON.stringify(good)); f(p); return p; };
  return {
    'P-00-structure-with-placeholder-authorities': good,
    'P-01-synthetic-as-holdout': mut((p) => { p.sealed_set[0].origin = 'synthetic_engineering_fixture'; }),
    'P-02-development-overlap': mut((p) => { p.sealed_set[0].content_sha256 = devSample; }),
    'P-03-same-process-label-claimed-independent': mut((p) => { p.label_authority = { name: 'Fixture generator', claimed_independent: true, process_id: 'engineering_authored' }; }),
    'P-04-raw-records-in-tracked-directory': mut((p) => { p.data_location = 'research/evaluation-raw-records/'; }),
    'P-05-missing-version-identity': mut((p) => { delete p.version_identity.compiler_version; }),
    'P-06-missing-codebook-hash': mut((p) => { delete p.version_identity.codebook_sha256; }),
    'P-07-missing-owner-authorization': mut((p) => { delete p.owner_authorization; }),
    'P-08-unapproved-data-classification': mut((p) => { p.data_classification = 'customer_records_unreviewed'; }),
    'P-09-placeholder-adjudicator': mut((p) => { p.adjudication_authority = { name: 'TBD' }; }),
    'P-10-changed-after-freeze': mut((p) => { p.freeze.compiler_sha256 = 'sha256:' + 'f'.repeat(64); }),
    'P-11-completion-claimed-from-template': mut((p) => { p.material_origin = 'local_protocol_template'; p.claimed_status = 'evaluation completed'; }),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (detectProviderConfiguration(process.env).length) { console.error('REFUSED: provider configuration present'); process.exit(3); }
  const trap = installNetworkTrap();
  try {
    const F = await import('../../../lib/engine-evidence-graph/evaluation/factory.mjs');
    globalThis.__egc = await import('../../../lib/engine-evidence-graph/compiler.mjs');
    const hashes = currentHashes();
    const dev = developmentHashes();
    // A. registry: append once; never rewrite an existing file.
    const regPath = join(HERE, 'REGISTRY.jsonl');
    const existing = existsSync(regPath) ? readFileSync(regPath, 'utf8') : '';
    if (!existing.includes('"EVAL-LW-001"')) {
      writeFileSync(regPath, F.appendRegistryEntry(existing, {
        evaluation_id: 'EVAL-LW-001', engine_version: '0.3.0-local', compiler_version: '0.3.0-local', codebook_version: '1.0', codebook_sha256: hashes.codebook_sha256,
        prompt_contract_version: 'jrs-engine-local-0.3.0/prompt-1', scope: 'Completed non-HR supplier-access exception drafts; documentation integrity only; mandatory human review.',
        permitted_data_category: 'none_authorized', proposed_label_authority: 'not_assigned', proposed_adjudication_authority: 'not_assigned',
        proposed_holdout_status: 'none_exists', required_permissions: ['recorded owner authorization', 'counsel review of data flows', 'named independent labelers', 'named independent adjudicator'],
        preregistration_state: 'draft_only', current_status: 'not_authorized_to_execute',
        stop_conditions: ['any contamination finding', 'any change to prompt, codebook or compiler after freeze', 'any missing permission', 'any out-of-scope record', 'B-018 unresolved'],
        recorded_at: '2026-10-10', note: 'Readiness record only. No evaluation has been authorized or conducted.',
      }));
    }
    const regProblems = F.validateRegistry(readFileSync(regPath, 'utf8'));
    // C. protocol template.
    writeFileSync(join(HERE, 'PROTOCOL_TEMPLATE.md'), F.generateProtocol({ evaluation_id: 'EVAL-LW-001', engine_version: '0.3.0-local', compiler_version: '0.3.0-local',
      prompt_contract_version: 'jrs-engine-local-0.3.0/prompt-1', codebook_version: '1.0', codebook_sha256: hashes.codebook_sha256 }));
    // D. authority matrix.
    writeFileSync(join(HERE, 'AUTHORITY_MATRIX.json'), JSON.stringify({
      status: 'NON-CANONICAL local working matrix', roles: {
        owner_decision: { may: 'authorise or decline a proposed evaluation; set scope', may_not: 'act as independent labeler or adjudicator of work they commissioned', produces: 'recorded owner decision' },
        independent_labeler: { may: 'assign reference labels independently', may_not: 'have built or tuned the candidate', produces: 'reference labels' },
        adjudicator: { may: 'resolve labeler disagreements under a recorded procedure', may_not: 'be a labeler on the same items or have built the candidate', produces: 'adjudicated labels' },
        technical_operator: { may: 'run the frozen candidate under the protocol', may_not: 'change prompt, codebook or compiler after freeze', produces: 'run records' },
        counsel: { may: 'review data flows, privacy and claims', may_not: 'be replaced by engineering documentation', produces: 'counsel disposition' },
        production_qa: { may: 'independently test a deployed build', may_not: 'be the developer of the build', produces: 'production QA record' },
        release_authority: { may: 'record a release decision after gates 1 to 4 and production QA', may_not: 'treat local tests as release evidence', produces: 'release authorisation' },
        local_engineering: { may: 'build and test local candidates on synthetic material', may_not: 'convert local work into independent validation, counsel disposition, production evidence or release authorisation', produces: 'local engineering evidence only' },
      }, exclusive_from_local_engineering: F.EXCLUSIVE_FROM_ENGINEERING,
    }, null, 2) + '\n');
    // B. separation checks over example packages.
    mkdirSync(join(HERE, 'example-packages'), { recursive: true });
    const results = {};
    for (const [name, pkg] of Object.entries(examplePackages(hashes, [...dev][0]))) {
      writeFileSync(join(HERE, 'example-packages', name + '.json'), JSON.stringify(pkg, null, 2) + '\n');
      const r = F.checkEvaluationPackage(pkg, { developmentHashes: dev, currentHashes: hashes, repoRoot: REPO });
      results[name] = { decision: r.decision, reasons: [...new Set(r.reasons.map((x) => x.code))] };
    }
    writeFileSync(join(HERE, 'SEPARATION_CHECK_RESULTS.json'), JSON.stringify({ generated: '2026-10-10', statement: 'No package here is authorised. The best possible result is not_authorized_to_execute.', registry_problems: regProblems, results }, null, 2) + '\n');
    console.log('registry problems: ' + regProblems.length + '; packages checked: ' + Object.keys(results).length + '; network attempts trapped: ' + trap.count());
    for (const [n, r] of Object.entries(results)) console.log(n + ': ' + r.decision + ' ' + r.reasons.join(','));
  } finally { trap.restore(); }
}
