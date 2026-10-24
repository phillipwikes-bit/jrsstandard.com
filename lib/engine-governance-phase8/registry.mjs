// JRS PHASE 8: local version registry and package manifests.
//
// Records what each earlier Engine package is, where it lives, the SHA-256 of
// every file and one package hash. It describes; it never certifies. A package
// whose files differ from its recorded manifest is reported as changed and the
// caller fails closed. No status here is a readiness, validation, ownership,
// commercial or release statement.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

export const STATUS_LINES = Object.freeze(['LOCAL ENGINEERING MATERIAL ONLY', 'INDEPENDENT EVALUATION NOT AUTHORIZED OR CONDUCTED', 'NO_GO_NOT_VERIFIED REMAINS IN EFFECT']);
export const RELEASE_STATUS = 'NO_GO_NOT_VERIFIED';
export const BASELINE_COMMIT = '428c307af510ff7378615777251fe252dab2dac7';
export const PACKAGE_STATUSES = Object.freeze(['frozen', 'candidate_only', 'local_only']);

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v);
}
export const hashOf = (v) => 'sha256:' + sha256(canonical(v));

// Each package is identified by the paths it owns. Paths ending in "/" are directories.
export const PACKAGES = Object.freeze([
  { id: 'v1-historical', title: 'Frozen v1 Review Engine handler (historical reference)', status: 'frozen', eligible_for_future_owner_review: false, kind: 'git_object',
    git_object: { commit: '0177c5184182b5b1f51ff18c80da29f668996e49', path: 'api/v1/review-engine.js', blob: 'baebb512e5f296e1b41da138b7868aae4b6098fc' },
    paths: ['research/engine-evidence-contract-2026-10-10/historical-reference/v1-review-engine.0177c51.js.txt'], shared_with: 'v0.2-evidence-contract',
    test_command: 'none of its own; source identity is checked by tests/engine-assurance/run.mjs ("candidate core is byte-identical to the last executable v1 handler")',
    recorded_result: { result: 'no suite of its own', source: 'lib/engine-assurance/provenance.mjs' },
    limitations: 'Historical only. The public v1 route now returns a refusal-only response; the historical handler is not executed by any later package.' },
  { id: 'v0.1-assurance', title: 'v0.1 Engine assurance package', status: 'frozen', eligible_for_future_owner_review: false, kind: 'tracked',
    paths: ['lib/engine-assurance/', 'tests/engine-assurance/', 'tools/engine-assurance-replay.mjs', 'research/engine-assurance-2026-10-10/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-assurance/run.mjs',
    recorded_result: { result: '148/148', date: '2026-10-17', source: 'research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json', replay: '31/31 fixtures (research/engine-assurance-2026-10-10/execution-record/EXECUTION_RECORD.json)' },
    limitations: 'research/engine-assurance-2026-10-10/FAILURE_MODE_REGISTER.md and INHERITED_FAILURES.md' },
  { id: 'v0.2-evidence-contract', title: 'v0.2 evidence contract', status: 'frozen', eligible_for_future_owner_review: false, kind: 'tracked',
    paths: ['lib/engine-evidence-contract/', 'tests/engine-evidence-contract/', 'tools/engine-evidence-contract-replay.mjs', 'research/engine-evidence-contract-2026-10-10/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-evidence-contract/run.mjs',
    recorded_result: { result: '123/123', date: '2026-10-17', source: 'research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json', replay: '52/52 cases (research/engine-evidence-contract-2026-10-10/execution-record/EXECUTION_RECORD.json)' },
    limitations: 'research/engine-evidence-contract-2026-10-10/KNOWN_FAILURE_MODES_AND_STOP_CONDITIONS.md' },
  { id: 'v0.3-evidence-graph', title: 'v0.3 evidence graph compiler (frozen local baseline)', status: 'frozen', eligible_for_future_owner_review: false, kind: 'tracked',
    paths: ['lib/engine-evidence-graph/', 'tests/engine-evidence-graph/', 'tools/engine-evidence-graph-replay.mjs', 'research/evidence-graph-compiler-2026-10-10/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-evidence-graph/run.mjs',
    recorded_result: { result: '140/140', date: '2026-10-17', source: 'research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json', replay: '35/35 cases (research/evidence-graph-compiler-2026-10-10/execution-record/EXECUTION_RECORD.json)' },
    limitations: 'research/evidence-graph-compiler-2026-10-10/FAILURE_MODE_REGISTER.md' },
  { id: 'phase4-change-control', title: 'Phase 4 adaptive reliability and change-control package', status: 'frozen', eligible_for_future_owner_review: false, kind: 'tracked',
    paths: ['lib/engine-change-control/', 'tests/engine-adaptive-reliability/', 'research/adaptive-reliability-2026-10-13/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-adaptive-reliability/run.mjs',
    recorded_result: { result: '269/269', date: '2026-10-17', source: 'research/engine-reliability-phase6-2026-10-17/execution-record/PRIOR_SUITE_RESULTS.json' },
    limitations: 'research/adaptive-reliability-2026-10-13/ADAPTIVE_FAILURE_MODE_REGISTER.md' },
  { id: 'phase6-reliability', title: 'Phase 6 reliability, regression and adaptation framework', status: 'local_only', eligible_for_future_owner_review: true, kind: 'untracked',
    paths: ['lib/engine-reliability/', 'tests/engine-reliability/', 'tools/engine-reliability-replay.mjs', 'research/engine-reliability-phase6-2026-10-17/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-reliability/run.mjs',
    recorded_result: { result: '316/316', date: '2026-10-19T11:13:53.182Z', source: 'research/engine-reliability-phase6-2026-10-17/execution-record/TEST_RESULTS.json' },
    limitations: 'research/engine-reliability-phase6-2026-10-17/KNOWN_FAILURE_MODES.md' },
  { id: 'phase7-candidate', title: 'Phase 7 v0.3.1 remediation candidate', status: 'candidate_only', eligible_for_future_owner_review: true, kind: 'untracked',
    paths: ['lib/engine-evidence-graph-v0.3.1-candidate/', 'tests/engine-remediation-phase7/', 'research/engine-remediation-phase7-2026-10-19/'],
    test_command: 'env -u ANTHROPIC_BASE_URL node tests/engine-remediation-phase7/run.mjs',
    recorded_result: { result: '328/328', date: '2026-10-19T13:57:52.546Z', source: 'research/engine-remediation-phase7-2026-10-19/execution-record/TEST_RESULTS.json', mutations: '79/79 killed directly (execution-record/MUTATION_EVIDENCE.json)' },
    limitations: 'research/engine-remediation-phase7-2026-10-19/KNOWN_LIMITATIONS.md' },
]);
// Phase 8 itself: registered so its files are not "outside the registry", never protected by its own registry.
export const CURRENT_PACKAGE = Object.freeze({ id: 'phase8-governance', status: 'local_only', kind: 'untracked',
  paths: ['lib/engine-governance-phase8/', 'tests/engine-governance-phase8/', 'tools/engine-governance-phase8-replay.mjs', 'research/engine-governance-phase8-2026-10-19/'] });

export const ownsPath = (pkg, f) => pkg.paths.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p));
export function packageOf(f, packages = [...PACKAGES, CURRENT_PACKAGE]) {
  const own = packages.filter((p) => ownsPath(p, f) && !p.shared_with);
  return own.length === 1 ? own[0].id : own.length ? 'ambiguous' : null;
}

function walk(root, rel) {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return [rel];
  return readdirSync(abs).sort().flatMap((n) => walk(root, rel.replace(/\/$/, '') + '/' + n));
}
export function listFiles(root, pkg) { return [...new Set(pkg.paths.flatMap((p) => walk(root, p.replace(/\/$/, ''))))].sort(); }

// A manifest is the sha256sum text of every file, sorted by path; the package hash is the hash of that text.
export function buildManifest(root, pkg) {
  const files = listFiles(root, pkg).map((f) => ({ path: f, sha256: sha256(readFileSync(join(root, f))) }));
  const text = files.map((f) => f.sha256 + '  ' + f.path).join('\n') + (files.length ? '\n' : '');
  const out = { package: pkg.id, file_count: files.length, files, manifest_text: text, package_sha256: 'sha256:' + sha256(text) };
  if (pkg.git_object) {
    try {
      const blob = execFileSync('git', ['cat-file', '-p', pkg.git_object.commit + ':' + pkg.git_object.path], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
      const id = execFileSync('git', ['rev-parse', pkg.git_object.commit + ':' + pkg.git_object.path], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      out.git_object = { blob: id, blob_matches_record: id === pkg.git_object.blob, content_sha256: sha256(blob) };
    } catch { out.git_object = { blob: null, blob_matches_record: false, content_sha256: null }; }
  }
  return out;
}
export function parseManifestText(text) {
  return String(text).split('\n').filter(Boolean).map((l) => { const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(l); return m ? { sha256: m[1], path: m[2] } : { malformed: l }; });
}

// Compare a package on disk with its recorded manifest. Any difference, malformed line or missing record is a failure.
export function verifyPackage(root, pkg, recordedText, recordedPackageHash) {
  const problems = [];
  if (typeof recordedText !== 'string' || !recordedText.length) return { package: pkg.id, ok: false, problems: ['missing_recorded_manifest'], changed: [], missing: [], added: [] };
  const rec = parseManifestText(recordedText);
  if (rec.some((r) => r.malformed)) problems.push('malformed_manifest_line');
  if (recordedPackageHash && recordedPackageHash !== 'sha256:' + sha256(recordedText)) problems.push('recorded_package_hash_mismatch');
  const now = buildManifest(root, pkg);
  const recMap = new Map(rec.filter((r) => !r.malformed).map((r) => [r.path, r.sha256]));
  const nowMap = new Map(now.files.map((f) => [f.path, f.sha256]));
  const missing = [...recMap.keys()].filter((f) => !nowMap.has(f));
  const added = [...nowMap.keys()].filter((f) => !recMap.has(f));
  const changed = [...recMap.keys()].filter((f) => nowMap.has(f) && nowMap.get(f) !== recMap.get(f));
  if (missing.length) problems.push('protected_file_missing');
  if (added.length) problems.push('unrecorded_file_in_protected_package');
  if (changed.length) problems.push('protected_file_changed');
  if (!rec.length) problems.push('empty_manifest');
  if (now.git_object && !now.git_object.blob_matches_record) problems.push('historical_git_object_mismatch');
  return { package: pkg.id, ok: problems.length === 0, problems, changed, missing, added, recorded_count: rec.length, package_sha256: now.package_sha256 };
}
