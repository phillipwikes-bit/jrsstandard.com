// Package reconciliation, the release-gate addendum and the public-position audit (work packages C, D, E).
import { readFileSync } from 'node:fs';
import { t, done, ROOT, read, json, M } from './_helpers.mjs';

const X = json('tools/source-alignment/CONTROL_EXTRACTION_MATRIX.json');
const ids = new Set(X.controls.map((c) => c.control_id));
const P = M.rec.PACKAGES, rep = read('docs/architecture/SOURCE_ALIGNED_RECONCILIATION_REPORT_2026-10-07.md');
for (const name of ['lib/engine-candidate/', 'lib/release-gate/', 'tools/evaluation-readiness/', 'tools/methodology-integrity/', 'tools/claim-provenance/', 'tools/frozen-demo/', 'tools/local-reviewer-workspace/', 'Public-claim repairs', 'Trackers'])
  t('the reconciliation covers ' + name, P.some((p) => p.package.startsWith(name)));
t('every package row names existing controls, evidence, a gap, a classification and a next action', P.every((p) => p.controls.length && p.controls.every((c) => ids.has(c)) && p.aligned && p.gap && ['ALIGNED', 'PARTIALLY_ALIGNED', 'CONFLICT', 'NOT_IMPLEMENTED', 'NOT_ASSESSED', 'REQUIRES_HUMAN_ACTION'].includes(p.classification) && p.next_action));
t('the report uses the exact table header', rep.includes('| Package | Applicable source controls | Aligned evidence | Gap or conflict | Classification | Exact next action |'));
t('the report states the strict evidence rule', /A test proves only the tested local control\. A synthetic corpus proves only behaviour on that constructed corpus\. A source citation proves only that the cited source says it\./.test(rep));
t('the report names every conflict with its repository location', X.conflicts.every((x) => rep.includes('**' + x.id + '**') && rep.includes(x.repository_location)));
t('the report lists previously recorded conflicts (readiness CF-01 to CF-06, the guard triage)', /CF-01 to CF-06/.test(rep) && /164 checks, 37 failed, 1 skipped/.test(rep));

// Release-gate addendum.
const A = json('lib/release-gate/records/RG-SOURCE-ALIGNMENT-ADDENDUM_2026-10-07.json'), RG = json('lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json');
t('the addendum is bound to the current main record and report by hash', A.binds.main_record_sha256 === M.sources.sha256(readFileSync(ROOT + 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json')) && A.binds.main_report_sha256 === M.sources.sha256(readFileSync(ROOT + 'docs/architecture/CURRENT_RELEASE_GATE_REPORT.md')));
t('the addendum is bound to the three source hashes and the receipt', ['S01', 'S02', 'S03'].every((id) => A.binds.sources[id] === M.verify.HANDOFF_HASHES[id]) && A.binds.receipt_sha256 === M.sources.sha256(readFileSync(ROOT + 'tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json')));
t('every addendum status equals the unchanged main-record status, and none is PASS', A.gates.every((g) => g.status === RG.gates.find((x) => x.gate_id === g.gate_id).status && g.status === M.verify.EXPECTED_GATES[g.gate_id] && g.status !== 'PASS'));
t('the addendum advances no gate and says so', A.advances_any_gate === false && A.gates_changed.length === 0 && /does not advance any gate/.test(A.statement));
t('each gate states what local work can establish and what only external human evidence can', A.gates.every((g) => g.local_work_can_establish && g.only_external_human_evidence_can_establish && g.source_locator.line_sha256.length));
t('the superseded record limitation is recorded beside the original, not edited', A.superseded_limitation.old_finding && RG.package_limitations.includes(A.superseded_limitation.old_finding) && /Rule 10/.test(A.superseded_limitation.explanation));
const addMd = read('docs/architecture/SOURCE_ALIGNED_RELEASE_GATE_ADDENDUM_2026-10-07.md');
t('the addendum document uses the exact table header and states no gate advanced', addMd.includes('| Gate | Status | Source-aligned reason | What local work can establish | What only external human evidence can establish |') && /This reconciliation does not advance any gate\./.test(addMd));
const V = await import(ROOT + 'lib/release-gate/validator.js');
const VR = V.validateRecord(RG);
t('the main release-gate record still validates, and its conclusion is INCOMPLETE_GATES_OPEN', VR.valid === true && VR.errors.length === 0 && VR.conclusion === 'INCOMPLETE_GATES_OPEN', JSON.stringify(VR.errors));

// Public-position audit.
const AU = json('tools/source-alignment/PUBLIC_POSITION_AUDIT.json');
t('the audit is documentation only and edited no page', AU.documentation_only === true && AU.pages_edited.length === 0);
const CATS = ['Engine status and scope', 'Research limitations', 'Study claims', 'API, sandbox, licence', 'Data handling and privacy', 'Manifest claims', '"validation" and "operational"'];
for (const c of CATS) t('the audit covers: ' + c, AU.items.some((i) => i.category.startsWith(c)));
t('"defensible", "accuracy", "reliability" and "compliance" phrasing was examined', ['"defensible"', '"compliance"', '"accuracy"'].every((c) => AU.no_issue_categories.some((x) => x.category.startsWith(c))));
t('every item has a permitted disposition and cites existing controls', AU.items.every((i) => M.verify.DISPOSITIONS.includes(i.disposition) && i.controls.every((c) => ids.has(c))));
t('no still-present or not-assessable item is marked source-aligned', AU.items.filter((i) => ['STILL_PRESENT', 'NOT_ASSESSABLE_FROM_SOURCE_SET'].includes(i.disposition)).every((i) => i.source_aligned === false));
t('every cited public text is still on its page', AU.items.every((i) => i.present.every(([p, s]) => read(p).includes(s))));
t('items needing owner or counsel review say so', ['PPA-03', 'PPA-06', 'PPA-08', 'PPA-09'].every((id) => AU.items.find((i) => i.id === id).review === 'REQUIRES_OWNER_OR_COUNSEL_REVIEW'));
done();
