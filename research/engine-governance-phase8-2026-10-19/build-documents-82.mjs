#!/usr/bin/env node
// JRS PHASE 8.2: generates the three Phase 8.2 Markdown records from recorded artifacts.
//   node research/engine-governance-phase8-2026-10-19/build-documents-82.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATUS_LINES } from '../../lib/engine-governance-phase8/registry.mjs';
import { LANGUAGE_RULE } from '../../lib/engine-governance-phase8/governance.mjs';
import { ENTRY_CLASSES, SEED_IDS, COMPOSITION_LABEL } from '../../lib/engine-governance-phase8/later-packages.mjs';
import { AUTHORIZATION_SCOPE_KEYS } from '../../lib/engine-governance-phase8/decisions.mjs';

const P8 = fileURLToPath(new URL('./', import.meta.url));
const J = (p) => JSON.parse(readFileSync(join(P8, p), 'utf8'));
const reg = J('governance/LATER_PACKAGE_REGISTRY.json'), run = J('execution-record/WORKTREE_RUN_RECORD.json'), hist = J('execution-record/PHASE8_HISTORICAL_RECORD.json');
const od = J('decisions/OWNER_DECISIONS.json'), mut = J('execution-record/MUTATION_EVIDENCE.json');
const tr = existsSync(join(P8, 'execution-record/PHASE8_TEST_RESULTS.json')) ? J('execution-record/PHASE8_TEST_RESULTS.json') : null;
const HEAD = '**' + STATUS_LINES.join('. ') + '.**\n\n';
const cell = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (h, rows) => '| ' + h.join(' | ') + ' |\n|' + h.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.map(cell).join(' | ') + ' |').join('\n') + '\n';
const AMEND = 'Phase 8.2 is an amendment to local governance. It does not alter any Engine conclusion, any external evaluation status (no independent evaluation is authorized or conducted) or the release status.';
const auth = od.owner_authorizations[0];
const pc = run.phase8_composition;
const m82 = mut.results.filter((r) => +r.id.slice(3) >= 68);
const docs = {};

docs['PHASE8_2_GOVERNANCE_AMENDMENT.md'] = '# Phase 8.2 Governance Amendment\n\n' + HEAD + '**' + AMEND + '**\n\n**Language rule.** ' + LANGUAGE_RULE + '\n\n'
  + '## Why\n\nThe Phase 8.1 registry and the Phase 8 suite assumed exactly three retroactive seed entries and treated any file outside Phase 8 scope as undeclared. A future package could therefore not be admitted without Phase 8 appearing defective. A simulation before Phase 9 showed 5 Phase 8 checks failing on a registry reservation alone and 15 with one placeholder file present. Phase 9 was stopped before any file was created.\n\n'
  + '## Amendment\n\n' + table(['Area', 'Before', 'After'], [
    ['Registry membership', 'Exactly three entries assumed by tests', 'Entry classes ' + ENTRY_CLASSES.map((c) => '`' + c + '`').join(' and ') + '; statuses as before; counts derived from entries (`summary`). Retroactive seeds are limited to ' + SEED_IDS.join(', ') + '.'],
    ['Admitted future packages', 'Not representable', 'Require an admission record tied to a recorded owner decision, gate result admissible, zero files at admission'],
    ['Status claims', 'Claim guard only', 'An entry using a status word such as `deployed`, `validated`, `licensed` or `ready` is rejected'],
    ['Phase 8 itself', 'Not in the dual-context model', 'Governed historical package: historical 370/370 (8.1 scope), isolated replay 370/370, current composition reported separately'],
    ['Phase 8 location check', '"every Phase 8 file is inside the four Phase 8 locations" (any other file failed)', '"every untracked file belongs to a registered package or a declared later package", classified from the registry'],
    ['Phase 8 scope classes', 'none', 'declared future path (composition condition, "' + COMPOSITION_LABEL + '"); undeclared future path; missing or invalid reservation; files before admission; changed Phase 8 protected file (all but the first fail)'],
    ['Earlier-check catalogue', 'Four checks (CPC-01 to CPC-04)', 'Adds EC-P8-SCOPE, reported by the Phase 8 scope classifier and included in the admission analysis of any future package'],
    ['Legacy CPC classification', 'Over every untracked file', 'Over Phase 8 scope; later packages are governed by the registry-derived classification'],
    ['Evaluation handoff freeze', 'Listed every registry entry', 'Lists retroactive seeds only; admitted future packages never alter the freeze'],
    ['Owner authorization', 'none recorded', '`' + auth.id + '` recorded as decided, local package construction only; no reservation created'],
    ['Phase 8 manifest', 'Covered the whole-worktree run record', 'Excludes the whole-worktree run record and its suite outputs, which every run regenerates and the suite recomputes']])
  + '\n## Detection kept\n\nAn undeclared later path, a changed protected file (earlier packages and Phase 8), a missing owner reference, a package with files before admission and a stale manifest binding all still fail closed; each is covered by a direct adversarial probe and by a mutation that a named probe catches.\n\n'
  + '## Owner authorization\n\n' + table(['Scope item', 'Authorized'], AUTHORIZATION_SCOPE_KEYS.map((k) => [k.replace(/_/g, ' '), auth.scope[k] ? 'yes' : 'no'])) + '\nReservation created: no. The authorization is a reference the admission gate can accept; it does not admit Phase 9.\n\n'
  + '## Phase 9 representability\n\nWith the reference recorded, a Phase 9 proposal for the four approved paths is admissible to the gate (probe `p82.future_admission_representable`), with computed affected checks EC-P4-TOOLS, EC-P6-OWNERSHIP, EC-P7-OWNERSHIP, EC-P7-TOOLS and EC-P8-SCOPE. Once admitted and present, its files would be declared composition conditions for Phase 4, Phase 6, Phase 7 and Phase 8, never historical defects (probe `p82.phase8_scope_declared_condition`). No Phase 9 reservation or file was created.\n';

docs['PHASE8_2_EXECUTION_RECORD.md'] = '# Phase 8.2 Execution Record\n\n' + HEAD + '**' + AMEND + '**\n\n'
  + 'Phase 8.2, 2026-10-20. Local working tree on branch `claude/engine-reliability-phase6-local` at `428c307`. Local, synthetic, offline; `ANTHROPIC_BASE_URL` unset.\n\n## Preconditions\n\n'
  + '1. All earlier package manifests and the Phase 8 manifest verified.\n2. No Phase 9 file or directory existed.\n'
  + '3. Phase 8 isolated historical replay: ' + hist.isolated_replay.result + '. ' + hist.isolated_replay.environment + '. First attempt: ' + hist.isolated_replay.first_attempt + '\n'
  + '4. Historical result preserved: ' + hist.historical_result.result + ' recorded ' + hist.historical_result.recorded_at + ' (`execution-record/PHASE8_HISTORICAL_RECORD.json`), with the 8.1-scope manifest `' + hist.historical_manifest.file + '`.\n\n'
  + '## Changes (Phase 8 locations only)\n\n- `lib/engine-governance-phase8/later-packages.mjs`: entry classes, seed set, status-claim rule, derived summary, Phase 8 scope classifier, EC-P8-SCOPE, Phase 8 dual context.\n- `lib/engine-governance-phase8/decisions.mjs`: recorded owner authorization and its scope validator.\n- `lib/engine-governance-phase8/handoff-freeze.mjs`: freeze lists retroactive seeds only.\n'
  + '- `tools/engine-governance-phase8-replay.mjs`: runs the Phase 8 suite in the current composition after recording the six earlier suites, classifies Phase 8 scope, adds Phase 8 to the dual context.\n- `tests/engine-governance-phase8/`: registry-derived forms of the pinned Phase 8 checks, a Phase 8.2 record group, 29 probes and 18 mutations (`probes-82.mjs`).\n'
  + '- Records: registry 1.1.0, owner authorization, documents, Phase 8 manifest and registry binding.\n\n'
  + '## Results\n\n' + table(['Item', 'Result'], [
    ['Whole-worktree run', run.started_at + '; six earlier suites with registry-derived composition `' + run.composition.verdict + '`'],
    ['Phase 8 in the current composition', pc ? pc.result + ', `' + pc.verdict + '`, Phase 8 scope conditions: ' + (pc.conditions.length || 'none') : 'not recorded'],
    ['Phase 8 suite', tr ? tr.passed + ' of ' + (tr.passed + tr.failed) + ' checks passed (' + tr.by_kind.direct + ' direct, ' + tr.by_kind.negative + ' negative or adversarial, ' + tr.by_kind.mutation + ' mutation)' : 'see execution-record/PHASE8_TEST_RESULTS.json'],
    ['Mutations', mut.killed + ' of ' + mut.total + ' caught directly; ' + mut.load_failures + ' load failures']])
  + '\n## Disclosures\n\n- The Phase 8 suite\'s Phase 8.2 group reads the whole-worktree record. The replay tool runs that suite after recording the six earlier suites and before adding the Phase 8 part, so during that one self-run (flagged `JRS_PHASE8_SELF_RUN=1`) the two checks about the Phase 8 part cannot yet see it; every other run asserts them.\n- Three Phase 8.1 probe expectations were updated for the new catalogue entry (EC-P8-SCOPE): the CPC-mapping probe now checks the four CPC entries and the one new entry separately, and the admission fixture lists EC-P8-SCOPE. The incomplete-analysis probe still omits a required check.\n- The tautological form of the Phase 8 location check was removed; its detection is carried by the registry-derived check.\n\n'
  + '## What did not happen\n\nNo Phase 9 reservation, file or directory. No commit, push, merge, pull-request action, deployment, provider call, network request, B-018 action, tracker or ledger update, public change or branch change. No earlier package or earlier test changed.\n';

docs['PHASE8_2_MUTATION_RECORD.md'] = '# Phase 8.2 Mutation Record\n\n' + HEAD
  + 'Source: `execution-record/MUTATION_EVIDENCE.json` (generated ' + mut.generated_at + '). Phase 8.2 added MG-68 to MG-85. A mutation counts as caught only when a named probe fails; a load failure does not count.\n\n'
  + table(['Measure', 'Phase 8.2 mutations', 'All Phase 8 mutations'], [['Introduced', m82.length, mut.total], ['Caught directly', m82.filter((r) => r.result === 'killed').length, mut.killed], ['Survived', m82.filter((r) => r.result === 'survived').length, mut.survived], ['Load failures', m82.filter((r) => r.result === 'load_failure').length, mut.load_failures]])
  + '\n' + table(['Mutation', 'Area', 'File', 'Result', 'Caught by'], m82.map((r) => [r.id, r.area, r.file, r.result, (r.killed_by || []).join(', ')]))
  + '\nMutation testing shows these probes detect these deliberate defects. It does not show the probes detect every defect.\n';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { for (const [k, v] of Object.entries(docs)) writeFileSync(join(P8, k), v.replace(/—/g, ',')); console.log('wrote ' + Object.keys(docs).length + ' Phase 8.2 documents'); }
