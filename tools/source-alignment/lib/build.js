// JRS source alignment: deterministic builder. INTERNAL. FAILS CLOSED.
// Renders every generated output from the control data and the local sources. It refuses to build
// when a source is absent or its hash differs. Outputs carry hashes, line numbers and paraphrases,
// never source text. The same inputs always give the same bytes (no clock, no randomness).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, RECEIPT, sha256, openSources, lineHash, lineCount } from './sources.js';
import { CONTROLS, CONFLICTS } from './controls.js';
import { PACKAGES, PUBLIC_AUDIT, NO_ISSUE } from './reconciliation.js';

export const BUILDER_VERSION = 'jrs-source-alignment-builder/0.1.0';
export const PACKAGE_ID = 'JRS-SOURCE-ALIGNMENT-20261007-PR39';
export const STATUSES = Object.freeze(['ALIGNED', 'PARTIALLY_ALIGNED', 'CONFLICT', 'NOT_IMPLEMENTED', 'NOT_ASSESSED', 'REQUIRES_HUMAN_ACTION']);
export const OUT = Object.freeze({
  matrix: 'tools/source-alignment/CONTROL_EXTRACTION_MATRIX.json',
  matrixMd: 'docs/architecture/SOURCE_CONTROL_EXTRACTION_MATRIX.md',
  reconciliationMd: 'docs/architecture/SOURCE_ALIGNED_RECONCILIATION_REPORT_2026-10-07.md',
  audit: 'tools/source-alignment/PUBLIC_POSITION_AUDIT.json',
  auditMd: 'docs/architecture/PUBLIC_POSITION_SOURCE_ALIGNMENT_AUDIT_2026-10-07.md',
  addendum: 'lib/release-gate/records/RG-SOURCE-ALIGNMENT-ADDENDUM_2026-10-07.json',
  addendumMd: 'docs/architecture/SOURCE_ALIGNED_RELEASE_GATE_ADDENDUM_2026-10-07.md',
});
export const MAIN_RECORD = 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';
export const MAIN_REPORT = 'docs/architecture/CURRENT_RELEASE_GATE_REPORT.md';
const J = (o) => JSON.stringify(o, null, 1) + '\n';
const cell = (s) => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');

function locator(srcs, sourceId, a, b) {
  const s = srcs[sourceId];
  const hashes = [];
  for (let n = a; n <= b; n++) hashes.push(lineHash(s, n));
  return { source_id: sourceId, lines: [a, b], line_sha256: hashes };
}

export function buildAll(root = ROOT) {
  const srcs = openSources(root);
  const bad = Object.values(srcs).filter((s) => !s.ok);
  if (bad.length) throw new Error('sources_not_verified: ' + bad.map((s) => s.source_id + ' (' + s.problem + ')').join(', ') + '. The three October 3 files must be present in project_sources/ with their receipt hashes.');
  const receiptSha = sha256(readFileSync(join(root, RECEIPT)));

  // ---- matrix -----------------------------------------------------------------------------------------
  const controls = CONTROLS.map((c) => ({
    control_id: c.id, topic: c.topic, source_id: c.source_id, source_sha256: srcs[c.source_id].sha256, tier: c.tier,
    locator: locator(srcs, c.source_id, c.lines[0], c.lines[1]),
    also_at: (c.also_at || []).map(([id, a, b]) => locator(srcs, id, a, b)),
    control_type: c.control_type, requirement_paraphrase: c.requirement, required_interpretation: c.interpretation,
    current_repository_status: c.repository_status, evidence: c.evidence, status: c.status, limitation: c.limitation,
    conflict_ids: c.conflict_ids || [], human_action: c.human_action || null, no_october_3_control: c.no_october_3_control === true,
  }));
  const totals = Object.fromEntries(STATUSES.map((s) => [s, controls.filter((c) => c.status === s).length]));
  const matrix = {
    matrix_version: 'jrs-source-control-extraction-matrix/0.1.0', package_id: PACKAGE_ID, builder: BUILDER_VERSION, receipt_sha256: receiptSha,
    sources: Object.values(srcs).map((s) => ({ source_id: s.source_id, sha256: s.sha256, local: s.local, controlling_lines: s.controlling_lines || null })),
    quotation_policy: 'No source text is reproduced (owner direction, 2026-10-07). Each locator carries the SHA-256 of every cited line, so it can be checked against the local source without committing it.',
    control_count: controls.length, totals, controls, conflicts: CONFLICTS,
    mapping_statement: 'No approved mapping between Engine candidate keys and Codebook conditions is created or implied. Owner decisions D-2 and D-3 are preserved.',
  };

  // ---- public audit -------------------------------------------------------------------------------------
  const audit = { audit_version: 'jrs-public-position-source-alignment-audit/0.1.0', package_id: PACKAGE_ID, documentation_only: true, pages_edited: [], items: PUBLIC_AUDIT, no_issue_categories: NO_ISSUE,
    rule: 'Already repaired claims are not reopened because a sentence is cautious; a claim that exceeds the source-aligned evidence is flagged.' };

  // ---- release-gate addendum ---------------------------------------------------------------------------------
  const rg = JSON.parse(readFileSync(join(root, MAIN_RECORD), 'utf8'));
  const GATE_SOURCE = {
    'RG-1': ['SAC-08', 'S01', 21, 21, 'Before production, unused holdout records must be labelled and adjudicated independently, with results and uncertainty reported for each condition.', 'The structure: development-material registration and refusal by digest, a closed intake, run bindings, blind workspaces and a ledger that refuses code-authored judgments.', 'An unused sealed holdout; independent labelers and adjudication; owner authorization for provider calls on it; per-condition results with uncertainty against thresholds fixed before the run.'],
    'RG-2': ['SAC-09', 'S01', 21, 21, 'Production requires operator evidence for access and database grants, credential rotation, retention and execution policies, backup restoration and compatible rollback.', 'Static review of repository code, such as retention-policy code that selects candidates and routes that refuse requests.', 'Operator exports and records from the environment the Engine would run in: access review, rotation record, deletion execution log, restore record, rollback record, monitoring.'],
    'RG-3': ['SAC-10', 'S01', 21, 21, 'Before production, counsel must dispose of the real data flows, the storage arrangements, privacy duties and any evaluation or licensing statements.', 'Data-flow records and questions for counsel.', 'A counsel disposition on the release as proposed.'],
    'RG-4': ['SAC-38', 'S03', 110, 110, 'Machine-readable gates carry an owner decision and date; general approval does not fill a missing dated gate record.', 'An owner decision package listing what is open.', 'A signed, dated owner release authorization naming the Engine version, after RG-1 to RG-3 have evidence.'],
    'RG-5': ['SAC-12', 'S01', 21, 21, 'Quality assurance of production by an independent party is a release gate of its own.', 'Nothing beyond drafting a test plan.', 'An independent QA report on an authorized production deployment.'],
  };
  const addendum = {
    addendum_version: 'jrs-release-gate-source-alignment-addendum/0.1.0', package_id: PACKAGE_ID, record_kind: 'internal_source_alignment_addendum',
    binds: { main_record: MAIN_RECORD, main_record_sha256: sha256(readFileSync(join(root, MAIN_RECORD))), main_report: MAIN_REPORT, main_report_sha256: sha256(readFileSync(join(root, MAIN_REPORT))),
             receipt_sha256: receiptSha, sources: Object.fromEntries(Object.values(srcs).map((s) => [s.source_id, s.sha256])) },
    advances_any_gate: false, gates_changed: [], statement: 'This reconciliation does not advance any gate. Every status below is copied unchanged from the main record.',
    gates: rg.gates.map((g) => { const x = GATE_SOURCE[g.gate_id]; return { gate_id: g.gate_id, gate_name: g.gate_name, status: g.status, source_control: x[0], source_locator: locator(srcs, x[1], x[2], x[3]),
      source_aligned_reason: x[4], local_work_can_establish: x[5], only_external_human_evidence_can_establish: x[6] }; }),
    conflicts_affecting_the_record: ['CF-SA-01', 'CF-SA-04', 'CF-SA-05'],
    superseded_limitation: { old_finding: rg.package_limitations.find((l) => /3 October/.test(l)) || null,
      new_evidence: 'The three October 3 sources were supplied on 2026-10-07 and matched their recorded hashes; this package compared the record with them.',
      corrected_status: 'Comparison performed. Conflicts CF-SA-01, CF-SA-04 and CF-SA-05 recorded. The main record is not edited; this addendum carries the correction.',
      explanation: 'Recorded beside the original finding, not over it (CLAUDE.md Rule 10).' },
  };

  // ---- Markdown -------------------------------------------------------------------------------------------
  const N = (s) => s.replace(/—/g, ',');
  const srcRows = Object.values(srcs).map((s) => '| ' + s.source_id + ' | `' + s.path + '` | `' + s.sha256.slice(0, 16) + '…` | ' + (s.local ? 'local, untracked' : 'committed') + ' | ' + (s.controlling_lines ? s.controlling_lines.join(' to ') : 'whole file') + ' |');
  const totalsRows = STATUSES.map((s) => '| ' + s + ' | ' + totals[s] + ' |');
  const md = [
    '# Source control extraction matrix (internal)', '',
    '**Package `' + PACKAGE_ID + '`. Generated by `tools/source-alignment/run.mjs --write`; do not edit by hand.** Machine-readable form: `' + OUT.matrix + '`. No source text is reproduced, on the owner\'s direction of 2026-10-07: each locator is a line range, and the JSON carries the SHA-256 of every cited line so the locator can be checked against the local source.', '',
    '## Current implementation, target and absent evidence', '- **Current implementation:** the repository state each control is compared with, named by file and checked text.', '- **Target:** what each control requires; where the repository falls short the gap is named.', '- **Absent:** every item marked REQUIRES_HUMAN_ACTION needs evidence only a named person can supply; none is marked completed.', '',
    '## Sources', '| ID | Path | SHA-256 | Held | Controlling lines |', '|---|---|---|---|---|', ...srcRows, '',
    '## Totals (' + controls.length + ' controls)', '| Status | Controls |', '|---|---|', ...totalsRows, '',
    '## Controls', '| ID | Locator | Tier | Type | Requirement (paraphrase) | Status | Evidence | Limitation |', '|---|---|---|---|---|---|---|---|',
    ...controls.map((c) => '| ' + c.control_id + ' | ' + c.source_id + ' ' + c.locator.lines.join('-') + (c.also_at.length ? ' (also ' + c.also_at.map((a) => a.source_id + ' ' + a.lines.join('-')).join(', ') + ')' : '') + ' | ' + c.tier + ' | ' + c.control_type + ' | ' + cell(c.requirement_paraphrase) + ' | **' + c.status + '**' + (c.conflict_ids.length ? ' (' + c.conflict_ids.join(', ') + ')' : '') + ' | ' + (c.evidence.length ? c.evidence.map((e) => '`' + e.path + '` (' + e.class + ')').join('; ') : 'none') + ' | ' + cell(c.limitation) + ' |'),
    '', '## Conflicts', '| ID | Controls | Source | Repository location | Finding | Decision |', '|---|---|---|---|---|---|',
    ...CONFLICTS.map((x) => '| ' + x.id + ' | ' + x.controls.join(', ') + ' | ' + x.source + ' | ' + cell(x.repository_location) + ' | ' + cell(x.finding) + ' | ' + x.decision_owner + ' |'),
    '', 'No approved mapping between Engine candidate keys and Codebook conditions is created or implied. Owner decisions D-2 and D-3 are preserved. A source citation shows only that the source says it; it validates nothing and closes no gate.', '',
  ].join('\n');

  const rec = [
    '# Source-aligned reconciliation report, 2026-10-07 (internal)', '',
    '**Package `' + PACKAGE_ID + '`. Generated by `tools/source-alignment/run.mjs --write`; do not edit by hand.** It reconciles the existing packages on PR #39 against the ' + controls.length + ' controls in `SOURCE_CONTROL_EXTRACTION_MATRIX.md`. Nothing in the Engine, the public pages or the sources was changed.', '',
    '## Current implementation, target and absent evidence', '- **Current implementation:** each package as it stands on this branch.', '- **Target:** the October 3 controls.', '- **Absent:** independent evaluation, operator, counsel, owner and independent-QA evidence.', '',
    '## The rule applied', 'A test proves only the tested local control. A synthetic corpus proves only behaviour on that constructed corpus. A source citation proves only that the cited source says it. None of these proves operational validity, independent evaluation, market readiness, legal sufficiency, licensing readiness, sale readiness or production safety.', '',
    '## Control totals', '| Status | Controls |', '|---|---|', ...totalsRows, '',
    '## Packages', '| Package | Applicable source controls | Aligned evidence | Gap or conflict | Classification | Exact next action |', '|---|---|---|---|---|---|',
    ...PACKAGES.map((p) => '| ' + cell(p.package) + ' | ' + p.controls.join(', ') + ' | ' + cell(p.aligned) + ' | ' + cell(p.gap) + ' | **' + p.classification + '** | ' + cell(p.next_action) + ' |'),
    '', '## Conflicts (none resolved here)', ...CONFLICTS.map((x) => '- **' + x.id + '** (' + x.controls.join(', ') + '; source ' + x.source + '). Repository location: ' + x.repository_location + '. ' + x.finding + ' Decision: ' + x.decision_owner + '.'),
    '', '## Previously recorded conflicts and limits, still open', '- Readiness baseline CF-01 to CF-06 (`EVALUATION_READINESS_BASELINE_2026-10-07.md`), including the frozen-demo manifest `source_commit` label.',
    '- Legacy guard: 164 checks, 37 failed, 1 skipped, triaged in `LEGACY_GUARD_FAILURE_TRIAGE_RECORD.md`; two failures were introduced on this branch by `3758d76` (one is public audit PPA-09).',
    '- The release-gate record limitation that the October 3 comparison is pending is superseded by `SOURCE_ALIGNED_RELEASE_GATE_ADDENDUM_2026-10-07.md`, not edited.', '',
  ].join('\n');

  const auditMd = [
    '# Public position source-alignment audit, 2026-10-07 (internal, documentation only)', '',
    '**Package `' + PACKAGE_ID + '`. Generated by `tools/source-alignment/run.mjs --write`; do not edit by hand.** No public page was edited. Machine-readable form: `' + OUT.audit + '`. Public page text quoted below is already published on the site; no source text is quoted.', '',
    '## Current implementation, target and absent evidence', '- **Current implementation:** the served pages on this branch.', '- **Target:** the October 3 controls and the handoff public position.', '- **Absent:** owner and counsel review of the items marked for it.', '',
    '## Issues', '| ID | Category | Disposition | Controls | Source-aligned | Finding |', '|---|---|---|---|---|---|',
    ...PUBLIC_AUDIT.map((i) => '| ' + i.id + ' | ' + cell(i.category) + ' | **' + i.disposition + '**' + (i.review ? ' (' + i.review + ')' : '') + ' | ' + i.controls.join(', ') + ' | ' + (i.source_aligned ? 'yes' : 'no') + ' | ' + cell(i.finding) + ' |'),
    '', '## Where each issue appears', ...PUBLIC_AUDIT.map((i) => '- ' + i.id + ': ' + i.present.map(([p, t]) => '`' + p + '` ("' + t + '")').join('; ')),
    '', '## Categories examined with no issue', ...NO_ISSUE.map((x) => '- ' + x.category + ': ' + x.basis + ' (`' + x.evidence[0] + '`)'),
    '', 'Already repaired claims are not reopened because a sentence is cautious. A claim that exceeds the source-aligned evidence is flagged for the owner, and counsel where noted.', '',
  ].join('\n');

  const addMd = [
    '# Source-aligned release-gate addendum, 2026-10-07 (internal)', '',
    '**This reconciliation does not advance any gate.** Record: `' + OUT.addendum + '`, bound by hash to `' + MAIN_RECORD + '` and `' + MAIN_REPORT + '`. Every status is copied unchanged from the main record; no status is PASS.', '',
    '## Current implementation, target and absent evidence', '- **Current implementation:** the main release-gate record as it stands.', '- **Target:** the October 3 production requirements.', '- **Absent:** every piece of external human evidence listed in the last column.', '',
    '| Gate | Status | Source-aligned reason | What local work can establish | What only external human evidence can establish |', '|---|---|---|---|---|',
    ...addendum.gates.map((g) => '| ' + g.gate_id + ' ' + g.gate_name + ' | **' + g.status + '** | ' + cell(g.source_aligned_reason) + ' (' + g.source_control + ', ' + g.source_locator.source_id + ' line ' + g.source_locator.lines[0] + ') | ' + cell(g.local_work_can_establish) + ' | ' + cell(g.only_external_human_evidence_can_establish) + ' |'),
    '', '## Conflicts affecting the record', '- CF-SA-01: evidence identifiers E-001 to E-009 reuse the canonical ledger namespace.', '- CF-SA-04: the record uses BLOCKED where the source vocabulary is pass, fail or not assessed, and records no numeric thresholds.', '- CF-SA-05: the October 3 gate statement includes creator review of the development package and does not list owner release authorization as a gate; the record follows the handoff.',
    '', '## Superseded limitation', '- **Old finding:** ' + (addendum.superseded_limitation.old_finding || 'none'), '- **New evidence:** ' + addendum.superseded_limitation.new_evidence, '- **Corrected status:** ' + addendum.superseded_limitation.corrected_status, '- **Explanation:** ' + addendum.superseded_limitation.explanation, '',
  ].join('\n');

  return { [OUT.matrix]: J(matrix), [OUT.matrixMd]: N(md), [OUT.reconciliationMd]: N(rec), [OUT.audit]: J(audit), [OUT.auditMd]: N(auditMd), [OUT.addendum]: J(addendum), [OUT.addendumMd]: N(addMd) };
}
