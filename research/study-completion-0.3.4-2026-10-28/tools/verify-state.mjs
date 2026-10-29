// Study completion: verifies the starting state from the repository itself (not from earlier reports) and writes
// state/STATE_VERIFICATION.json and .md. Read only for every frozen package. Exits 1 if any check fails.
// Usage: node tools/verify-state.mjs
import { attempts } from './guard.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, ROOT, STUDY, PKG4, CANDIDATE, ENGINE_OF_RECORD, STATUS, sha, shaFile, readJson, rel, git, listFiles, checker, finish, writeJson, writeOut } from './common.mjs';
import { verifySeals as verifySeals4 } from '../../engine-repair-0.3.4-2026-10-27/tools/verify-seal.mjs';
import { verifySeals as verifyStudySeals } from '../../study-156-2026-10-27/tools/verify-seal.mjs';
import { verifyStudyAuthorization } from '../../engine-repair-0.3.4-2026-10-27/tools/transport/study-authorization.mjs';
import * as S4 from '../../engine-repair-0.3.4-2026-10-27/tools/transport/sender.mjs';
import * as S3 from '../../study-156-2026-10-27/tools/transport/sender.mjs';

const c = checker();
const at = new Date().toISOString();

// ------------------------------------------------------------------ repository
const head = git(['rev-parse', 'HEAD']), branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const upstream = git(['rev-parse', '@{u}']);
const porcelain = (git(['status', '--porcelain']) || '').split('\n').filter(Boolean);
const outsideAll = porcelain.filter((l) => !l.slice(3).startsWith('research/study-completion-0.3.4-2026-10-28/'));
// This assignment appends dated entries to the two trackers. Those edits are allowed only if they remove nothing except
// the IP sale tracker's two revision-header lines; any other change outside this directory fails.
const TRACKERS = ['research/MASTER_TRACKER.md', 'research/IP_SALE_TRACKER.md'];
const trackerEdits = outsideAll.filter((l) => /^[ M][ M] /.test(l) && TRACKERS.includes(l.slice(3)));   // staged or not
const removedLines = (f) => (git(['diff', 'HEAD', '--unified=0', '--', f]) || '').split('\n').filter((x) => x.startsWith('-') && !x.startsWith('---'));
const trackerProblems = trackerEdits.flatMap((l) => removedLines(l.slice(3)).filter((x) => !(l.slice(3) === 'research/IP_SALE_TRACKER.md' && /^-\| \*\*(?:Last revised|Revisions)\*\* \|/.test(x))).map((x) => l.slice(3) + ': ' + x.slice(0, 80)));
c.check('tracker_edits_are_append_only', trackerProblems.length === 0, trackerProblems);
const outsideThisDir = outsideAll.filter((l) => !trackerEdits.includes(l));
const worktrees = (git(['worktree', 'list', '--porcelain']) || '').split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9));
const branches = (git(['branch', '--format=%(refname:short) %(objectname:short)']) || '').split('\n').filter(Boolean);
c.check('git_head_readable', !!head, head);
c.check('no_uncommitted_change_outside_continuation_dir', outsideThisDir.length === 0, outsideThisDir);
c.check('single_worktree', worktrees.length === 1, worktrees);

// ------------------------------------------------------------------ frozen packages
const fz4 = verifySeals4(['freeze']);
c.check('pkg_0.3.4_freeze_seal_and_pins_verify', fz4.ok, fz4.problems);
const st = verifyStudySeals(['corpus', 'freeze']);
c.check('study_corpus_and_freeze_seals_verify', st.ok, st.problems);
const manifestRows = readFileSync(join(PKG4, 'PACKAGE_MANIFEST_SHA256.txt'), 'utf8').split('\n').filter((l) => /^[0-9a-f]{64}  /.test(l));
const manifestBad = manifestRows.filter((l) => { const p = join(PKG4, l.slice(66)); return !existsSync(p) || shaFile(p) !== l.slice(0, 64); }).map((l) => l.slice(66));
c.check('pkg_0.3.4_package_manifest_rows_match', manifestBad.length === 0, { rows: manifestRows.length, mismatched: manifestBad });
const listed = new Set(manifestRows.map((l) => l.slice(66)));
const unlisted = listFiles(PKG4).filter((f) => !listed.has(f) && f !== 'PACKAGE_MANIFEST_SHA256.txt');
c.check('pkg_0.3.4_files_outside_manifest_are_known', unlisted.every((f) => f === 'reports/DECISION_RECORD.md'), unlisted);

const KEY = {
  candidate_0_3_4_manifest: join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt'),
  prompt_0_3_4: join(PKG4, 'candidate', 'prompt', 'PROMPT_research-0.3.4-1.txt'),
  pkg_0_3_4_freeze_seal: join(PKG4, 'seals', 'freeze', 'SEAL.json'),
  pkg_0_3_4_package_manifest: join(PKG4, 'PACKAGE_MANIFEST_SHA256.txt'),
  pkg_0_3_4_decision_record: join(PKG4, 'reports', 'DECISION_RECORD.md'),
  pkg_0_3_4_criteria_v2: join(PKG4, 'protocol', 'ACCEPTANCE_CRITERIA_V2_PROPOSED.json'),
  pkg_0_3_4_preflight_proposal: join(PKG4, 'protocol', 'LIVE_PREFLIGHT_PROPOSAL.md'),
  pkg_0_3_4_preflight_authorization_draft: join(PKG4, 'authorization', 'LIVE_PREFLIGHT_AUTHORIZATION_DRAFT.json'),
  pkg_0_3_4_human_form_v2_md: join(PKG4, 'forms', 'HUMAN_REFERENCE_FORM_V2.md'),
  pkg_0_3_4_human_form_v2_csv: join(PKG4, 'forms', 'HUMAN_REFERENCE_FORM_V2.csv'),
  pkg_0_3_4_label_status_register: join(PKG4, 'registers', 'LABEL_STATUS_REGISTER.json'),
  pkg_0_3_4_exposure_register: join(PKG4, 'registers', 'EXPOSURE_REGISTER.json'),
  pkg_0_3_4_analysis_v2: join(PKG4, 'reports', 'ANALYSIS_V2.json'),
  study_record_inventory_v2: join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json'),
  study_blind_key: join(STUDY, 'sealed', 'BLIND_KEY.json'),
  study_ai_proposed_reference: join(STUDY, 'sealed', 'AI_PROPOSED_REFERENCE.json'),
  study_request_and_cost_plan: join(STUDY, 'protocol', 'REQUEST_AND_COST_PLAN.json'),
  study_provider_compatibility_record: join(STUDY, 'protocol', 'PROVIDER_COMPATIBILITY_RECORD.md'),
  study_live_authorization_draft: join(STUDY, 'authorization', 'STUDY156_LIVE_AUTHORIZATION_DRAFT.json'),
  study_decision_record: join(STUDY, 'reports', 'DECISION_RECORD.md'),
};
const hashes = {};
for (const [k, p] of Object.entries(KEY)) { const ok = existsSync(p); c.check('present:' + k, ok, rel(p)); if (ok) hashes[k] = { path: rel(p), sha256: shaFile(p) }; }
const promptText = readFileSync(KEY.prompt_0_3_4, 'utf8');
const promptVersion = (/^prompt_version:\s*(\S+)/m.exec(promptText) || [])[1] || null;
c.check('prompt_version_is_0.3.4', promptVersion === 'jrs-engine-local-0.3.4-research/prompt-1', promptVersion);
const candManifest = readFileSync(KEY.candidate_0_3_4_manifest, 'utf8');
c.check('prompt_listed_in_candidate_manifest_with_same_hash', candManifest.includes(hashes.prompt_0_3_4.sha256), hashes.prompt_0_3_4.sha256);

// ------------------------------------------------------------------ transport (two byte-identical copies, dispatch disabled)
const T = ['sender.mjs', 'prompt-assembly.mjs', 'study-adapter.mjs', 'study-authorization.mjs', 'test-transport.mjs'];
const transport = T.map((f) => ({ file: f, study: shaFile(join(STUDY, 'tools', 'transport', f)), pkg_0_3_4: shaFile(join(PKG4, 'tools', 'transport', f)) }));
c.check('transport_copies_byte_identical', transport.every((t) => t.study === t.pkg_0_3_4), transport.filter((t) => t.study !== t.pkg_0_3_4).map((t) => t.file));
c.check('live_dispatch_disabled_in_both_frozen_senders', S4.LIVE_DISPATCH_ENABLED === false && S3.LIVE_DISPATCH_ENABLED === false);

// ------------------------------------------------------------------ authorization drafts: both must be refused as written
const drafts = {};
for (const k of ['pkg_0_3_4_preflight_authorization_draft', 'study_live_authorization_draft']) {
  const a = readJson(KEY[k]);
  const problems = verifyStudyAuthorization(a, { recordId: 'S-001', body: { model: S4.MODEL }, worstCaseUsd: 0 }, at, null);
  drafts[k] = { authorization_id: a.authorization_id || null, signed: !!a.owner_signature, refused: problems.length > 0, problems };
  c.check('draft_refused_as_written:' + k, problems.length > 0, problems.slice(0, 4));
}

// ------------------------------------------------------------------ labels, captures, blockers, B-018 limitation
const lsr = readJson(KEY.pkg_0_3_4_label_status_register);
const humanReviewed = lsr.rows.filter((r) => r.human_reviewed).length;
c.check('label_register_rows_156', lsr.rows.length === 156, lsr.rows.length);
const reviewsDirs = [join(STUDY, 'reviews'), join(PKG4, 'reviews'), join(DIR, 'human-review', 'completed')].filter((p) => existsSync(p) && listFiles(p).length).map(rel);
const captureLike = [STUDY, PKG4].flatMap((d) => listFiles(d).filter((f) => /(?:^|\/)(?:captures?|journal)[^/]*$/i.test(f) || /JOURNAL.*\.jsonl$/i.test(f)).map((f) => rel(join(d, f))));
c.check('no_live_capture_or_journal_in_frozen_packages', captureLike.length === 0, captureLike);
const blockers = readJson(join(ROOT, '.jrs', 'state', 'BLOCKERS.json'));
const open = (blockers.blockers || blockers).filter((b) => /^OPEN/.test(String(b.status))).map((b) => ({ id: b.blocker_id, status: b.status }));
c.check('b018_open', open.some((b) => b.id === 'B-018'), open);
const b018Files = ['project_sources/01-01_JRS_Master_Asset_Register_Source_Aligned_2026-10-03.md', 'project_sources/02-02_JRS_Evidence_Ledger_Source_Aligned_2026-10-03.md', 'project_sources/03-03_JRS_Master_Architectural_Blueprint_Aligned_2026-10-03.txt'];
const b018Present = b018Files.filter((f) => existsSync(join(ROOT, f)));

const out = { format: 'jrs-study-completion-state/1.0.0', verified_at_utc: at, network_attempts: attempts.length, ...STATUS,
  statement: 'Starting state verified from the repository by this tool. Nothing in the frozen study package or the frozen 0.3.4 package was modified.',
  repository: { head, branch, upstream, head_equals_upstream: !!head && head === upstream, uncommitted_outside_continuation_dir: outsideThisDir, tracker_entries_appended: trackerEdits.map((l) => l.slice(3)), worktrees: worktrees.map((w) => rel(w) || '.'), local_branches: branches },
  engine_of_record: { version: ENGINE_OF_RECORD, basis: 'Owner instruction in the 2026-10-28 assignment ("Keep 0.3.1 as the engine of record"); 0.3.4 DECISION_RECORD.md records 0.3.4 as not adopted' },
  study_candidate: { version: CANDIDATE, adopted: false, manifest_sha256: hashes.candidate_0_3_4_manifest.sha256, prompt_sha256: hashes.prompt_0_3_4.sha256, prompt_version: promptVersion },
  seals: { pkg_0_3_4_freeze: { ok: fz4.ok, checked: fz4.checked }, study: { ok: st.ok, checked: st.checked } },
  pkg_0_3_4_package_manifest: { rows: manifestRows.length, mismatched: manifestBad, files_outside_manifest: unlisted },
  key_artifacts: hashes, transport: { files: transport, live_dispatch_enabled: { study: S3.LIVE_DISPATCH_ENABLED, pkg_0_3_4: S4.LIVE_DISPATCH_ENABLED }, sender_version: S4.SENDER_VERSION, model: S4.MODEL, api_version: S4.API_VERSION },
  authorization_drafts: drafts, spent_authorization_not_reusable: 'STAGE-A-AUTH-20261025-01',
  human_labels: { register_rows: lsr.rows.length, human_reviewed: humanReviewed, completed_review_files_found: reviewsDirs },
  live_captures_found: captureLike, open_blockers: open,
  b018_limitation: { source_aligned_files_present: b018Present, statement: b018Present.length ? 'Some B-018 files are present; inspect before relying on them.' : 'None of the three source-aligned files is present. Any statement that would depend on them is NOT ESTABLISHED. B-018 stays OPEN; this work does not clear it.' },
  checks: c.checks };
writeJson(join(DIR, 'state', 'STATE_VERIFICATION.json'), out);

const md = ['# State verification', '', 'Generated by `tools/verify-state.mjs` at ' + at + '. Do not edit by hand; rerun the tool.', '',
  '| Item | Value |', '|---|---|',
  '| Branch and commit | `' + branch + '` at `' + (head || '').slice(0, 12) + '`; equals its upstream: ' + (head === upstream) + ' |',
  '| Uncommitted changes outside this directory | ' + (outsideThisDir.length || 'none') + (trackerEdits.length ? '; tracker entries appended by this work: ' + trackerEdits.map((l) => l.slice(3)).join(', ') : '') + ' |',
  '| Worktrees | ' + worktrees.length + ' |',
  '| Engine of record | ' + ENGINE_OF_RECORD + ' (owner instruction); 0.3.4 not adopted |',
  '| Study candidate | ' + CANDIDATE + '; candidate manifest `' + hashes.candidate_0_3_4_manifest.sha256.slice(0, 16) + '…`; prompt `' + hashes.prompt_0_3_4.sha256.slice(0, 16) + '…` (' + promptVersion + ') |',
  '| 0.3.4 freeze seal with pins | ' + (fz4.ok ? 'verifies' : 'FAILS') + ' |',
  '| Study corpus and freeze seals | ' + (st.ok ? 'verify' : 'FAIL') + ' |',
  '| 0.3.4 package manifest | ' + manifestRows.length + ' rows, ' + manifestBad.length + ' mismatched; outside it: ' + (unlisted.join(', ') || 'none') + ' |',
  '| Transport copies | byte-identical: ' + transport.every((t) => t.study === t.pkg_0_3_4) + '; live dispatch disabled in both |',
  '| Authorization drafts | ' + Object.entries(drafts).map(([k, d]) => k + ': refused (' + d.problems.length + ' problems)').join('; ') + ' |',
  '| Human labels recorded | ' + humanReviewed + ' of ' + lsr.rows.length + '; completed review files: ' + (reviewsDirs.length || 'none') + ' |',
  '| Live captures or journals | ' + (captureLike.length || 'none') + ' |',
  '| Open blockers | ' + open.map((b) => b.id).join(', ') + ' |',
  '| B-018 source-aligned files | ' + (b018Present.length ? b018Present.join(', ') : 'none present: dependent statements are NOT ESTABLISHED') + ' |',
  '', '## Checks', '', ...c.checks.map((x) => '- ' + (x.ok ? 'PASS' : '**FAIL**') + ' `' + x.id + '`'), ''];
writeOut(join(DIR, 'state', 'STATE_VERIFICATION.md'), md.join('\n'));
finish('state verification', c, 'network attempts ' + attempts.length);
