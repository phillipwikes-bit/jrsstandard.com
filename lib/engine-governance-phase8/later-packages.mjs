// JRS PHASE 8.1: controlled later-package registry and dual-context results.
//
// Earlier package results remain historically recorded results for their sealed
// package scope. A later whole-worktree run may show a declared compatibility
// condition without establishing a defect in the earlier package.
//
// The earlier suites are frozen, so the set of earlier file-ownership checks a later
// package can trip is fixed (EARLIER_CHECKS). Later packages are open-ended: each one
// is a registry entry with approved paths and the earlier checks it affects. A
// composition condition is derived from the registry, never maintained by hand. Any
// later file outside a registered package, any affected check a package did not
// declare, any stale manifest, any missing owner reference or any changed protected
// file fails closed. No status here is a validation, release, ownership, commercial
// or deployment statement.

import { OFFENDING_RULES, SUITES } from './governance.mjs';
import { hashOf, STATUS_LINES, RELEASE_STATUS } from './registry.mjs';
import { scanClaims } from './claims.mjs';

export const REGISTRY_VERSION_RE = /^\d+\.\d+\.\d+$/;
export const LATER_STATUSES = Object.freeze(['reserved_not_present', 'present_local_only', 'preserved_local_only', 'retired', 'local_construction_only']);
// Phase 8.2 admission correction: statuses an admitted future package may hold.
export const ADMITTED_STATUSES = Object.freeze(['local_construction_only', 'reserved_not_present', 'retired']);
export const COMPOSITION_LABEL = 'declared composition condition, not a historical-package defect';

// Earlier file-ownership checks a later package can trip. Fixed: their suites are frozen.
export const EARLIER_CHECKS = Object.freeze([
  { check_id: 'EC-P4-TOOLS', originating_package: 'phase4-change-control', exact_check: 'tools unchanged since 5d5374b', check_source: 'tests/engine-adaptive-reliability/run.mjs:51', offending_rule: 'untracked_under_tools', historical_example: 'CPC-01' },
  { check_id: 'EC-P6-OWNERSHIP', originating_package: 'phase6-reliability', exact_check: 'every new file is inside the four Phase 6 locations', check_source: 'tests/engine-reliability/run.mjs:64', offending_rule: 'untracked_outside_phase6', historical_example: 'CPC-02' },
  { check_id: 'EC-P7-OWNERSHIP', originating_package: 'phase7-candidate', exact_check: 'every new file is a Phase 6 file or inside the three Phase 7 locations', check_source: 'tests/engine-remediation-phase7/run.mjs:58', offending_rule: 'untracked_outside_phase6_and_phase7', historical_example: 'CPC-03' },
  { check_id: 'EC-P7-TOOLS', originating_package: 'phase7-candidate', exact_check: 'no Phase 7 file under tools/, api/, docs/, .jrs/ or a public page', check_source: 'tests/engine-remediation-phase7/run.mjs:59', offending_rule: 'untracked_non_phase6_under_restricted_roots', historical_example: 'CPC-04' },
  // Phase 8.2: Phase 8's own scope. Reported by classifyPhase8Scope as a composition condition; never a failing Phase 8 check.
  { check_id: 'EC-P8-SCOPE', originating_package: 'phase8-governance', exact_check: 'every untracked file belongs to a registered package or a declared later package', check_source: 'tests/engine-governance-phase8/run.mjs (safety group)', offending_rule: 'untracked_outside_phase8_scope', historical_example: null, reporting: 'phase8_scope_classifier' },
]);
// Package order: a check can only be affected by packages that come after its originating package.
export const PACKAGE_ORDER = Object.freeze(['v1-historical', 'v0.1-assurance', 'v0.2-evidence-contract', 'v0.3-evidence-graph', 'phase4-change-control', 'phase6-reliability', 'phase7-candidate', 'phase8-governance']);
// Roots no later package may ever claim.
export const FORBIDDEN_ROOTS = Object.freeze([/^api\//, /^docs\//, /^\.jrs\//, /^\.github\//, /^supabase\//, /^[^/]+\.html$/, /^vercel\.json$/, /^\.vercelignore$/, /^sitemap\.xml$/, /^openapi\.json$/, /^research\/(?:MASTER_TRACKER|IP_SALE_TRACKER|MASTER_DECISION_REGISTER|EVIDENCE_LEDGER)\.md$/,
  /^project_sources\//, /^lib\/(?:engine-assurance|engine-evidence-contract|engine-evidence-graph|engine-change-control|manifest|retention)\//, /^tests\/(?:engine|engine-assurance|engine-evidence-contract|engine-evidence-graph|engine-adaptive-reliability|manifest|platform-evaluation)\//]);

const REQUIRED = ['package_id', 'package_version', 'owner_decision_reference', 'approved_paths', 'manifest_binding', 'created', 'reason', 'affected_earlier_checks', 'status', 'permissions'];
export const ENTRY_CLASSES = Object.freeze(['retroactive_seed', 'admitted_future_package']);
export const SEED_IDS = Object.freeze(['phase6-reliability', 'phase7-candidate', 'phase8-governance']);
// Files Phase 8 itself owns, or that belong to the packages it registers as earlier packages.
const PHASE8_SCOPE = [/^lib\/engine-reliability\//, /^tests\/engine-reliability\//, /^tools\/engine-reliability-replay\.mjs$/, /^research\/engine-reliability-phase6-2026-10-17\//,
  /^lib\/engine-evidence-graph-v0\.3\.1-candidate\//, /^tests\/engine-remediation-phase7\//, /^research\/engine-remediation-phase7-2026-10-19\//,
  /^lib\/engine-governance-phase8\//, /^tests\/engine-governance-phase8\//, /^tools\/engine-governance-phase8-replay\.mjs$/, /^research\/engine-governance-phase8-2026-10-19\//];
export const inPhase8Scope = (f) => PHASE8_SCOPE.some((r) => r.test(f));
const STATUS_WORDS = /\b(?:deployed|in production|released|validated|licen[cs]ed|release[- ]ready|production[- ]ready|deployment[- ]ready|licen[cs]e[- ]ready|commercially ready|sale[- ]ready|ready for (?:release|production|sale|use))\b/i;
export const ownsLater = (e, f) => (e.approved_paths || []).some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p));
const order = (id) => PACKAGE_ORDER.indexOf(id);

// Phase 8.2: Phase 8's own scope rule lives here; the other rules are the frozen earlier-suite predicates.
const offendingRule = (c) => (c.offending_rule === 'untracked_outside_phase8_scope' ? (u) => u.filter((f) => !inPhase8Scope(f)) : OFFENDING_RULES[c.offending_rule]);

// Which earlier checks a set of approved paths would trip, computed from the frozen predicates.
export function affectedChecksFor(packageId, approvedPaths, phase6Files) {
  const probes = approvedPaths.map((p) => (p.endsWith('/') ? p + '__probe__.mjs' : p));
  const ctx = { phase6Files: phase6Files || new Set() };
  return EARLIER_CHECKS.filter((c) => (order(packageId) === -1 || order(c.originating_package) < order(packageId)) && offendingRule(c)(probes, ctx).length > 0).map((c) => c.check_id);
}

const B018_RESOLVED = /B-018[^.;\n]{0,80}\b(?:resolved|closed|reconciled|cleared|satisfied)\b/i;
// Descriptions of the check itself ("presented as resolved", "as resolved") are mentions, not claims.
const NEGATED = /\b(?:not|never|remains open|unresolved|no)\b|\bpresent(?:s|ed|ing)?\b|\bas (?:resolved|closed|reconciled|cleared|satisfied)\b/i;
export function claimsB018Resolved(text) {
  const s = String(text || '');
  let m; const re = new RegExp(B018_RESOLVED.source, 'gi');
  while ((m = re.exec(s)) !== null) if (!NEGATED.test(m[0])) return true;
  return false;
}

// The fields that govern composition classification; manifest bindings are integrity data checked separately.
export const governanceHash = (reg) => hashOf({ catalogue: EARLIER_CHECKS.map((c) => c.check_id), packages: (reg.packages || []).map((e) => ({ package_id: e.package_id, approved_paths: e.approved_paths, affected_earlier_checks: e.affected_earlier_checks, status: e.status, permissions: e.permissions })) });

// ctx: { manifestHashes: {id: 'sha256:..'}, filesByPackage: {id: [paths]}, evidenceExists: (path) => bool, phase6Files: Set }
export function validateLaterRegistry(reg, ctx) {
  const p = [];
  if (!reg || typeof reg !== 'object' || !Array.isArray(reg.packages)) return ['registry missing or malformed'];
  if (!REGISTRY_VERSION_RE.test(reg.registry_version || '')) p.push('registry version missing');
  if (reg.release_status !== RELEASE_STATUS) p.push('release status altered');
  if (reg.b018_status !== 'OPEN') p.push('B-018 status must be recorded as OPEN');
  if (claimsB018Resolved(JSON.stringify(reg))) p.push('a registry record presents B-018 as resolved');
  if (scanClaims(JSON.stringify(reg)).length) p.push('registry contains an unsupported claim');
  const { registry_sha256, ...rest } = reg;
  if (registry_sha256 !== hashOf(rest)) p.push('registry hash mismatch');
  if (reg.governance_sha256 !== governanceHash(reg)) p.push('registry governance hash mismatch');
  const ids = new Set();
  for (const e of reg.packages) {
    const tag = e && e.package_id ? e.package_id : '(unnamed)';
    for (const k of REQUIRED) { const v = e ? e[k] : undefined; if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length && k !== 'affected_earlier_checks')) p.push(tag + ': missing ' + k); }
    if (!e) continue;
    if (ids.has(e.package_id)) p.push(tag + ': duplicate'); ids.add(e.package_id);
    if (!LATER_STATUSES.includes(e.status)) p.push(tag + ': unknown status');
    if (!REGISTRY_VERSION_RE.test(e.package_version || '')) p.push(tag + ': package version missing');
    const ref = e.owner_decision_reference || {};
    if (!ref.reference || !ref.evidence_path || (ctx.evidenceExists && !ctx.evidenceExists(ref.evidence_path))) p.push(tag + ': owner decision reference missing or without recorded evidence');
    const perm = e.permissions || {};
    if (perm.may_affect_historical_results !== false) p.push(tag + ': may not affect historical results');
    if (perm.may_affect_public_or_deployment !== false) p.push(tag + ': may not affect public or deployment surfaces');
    if (perm.may_affect_composition_results !== true) p.push(tag + ': composition visibility must be declared');
    for (const ap of e.approved_paths || []) if (FORBIDDEN_ROOTS.some((r) => r.test(ap) || r.test(ap + 'x'))) p.push(tag + ': approved path in a protected or public area: ' + ap);
    for (const o of reg.packages) if (o !== e && o && (o.approved_paths || []).some((x) => (e.approved_paths || []).some((y) => x.startsWith(y) || y.startsWith(x)))) p.push(tag + ': approved paths overlap ' + o.package_id);
    const computed = affectedChecksFor(e.package_id, e.approved_paths || [], ctx.phase6Files);
    if (JSON.stringify([...(e.affected_earlier_checks || [])].sort()) !== JSON.stringify(computed.sort())) p.push(tag + ': affected earlier checks do not match the computed analysis');
    const files = (ctx.filesByPackage && ctx.filesByPackage[e.package_id]) || [];
    if ((e.status === 'reserved_not_present' || e.status === 'retired') && files.length) p.push(tag + ': files present for a ' + e.status + ' package');
    if ((e.status === 'present_local_only' || e.status === 'preserved_local_only') && !files.length) p.push(tag + ': no files for a present package');
    if (e.entry_class === 'admitted_future_package' && !ADMITTED_STATUSES.includes(e.status)) p.push(tag + ': an admitted package must be local_construction_only, reserved_not_present or retired');
    if (e.entry_class === 'admitted_future_package' && !manifestFileInResearchPath(e)) p.push(tag + ': package manifest must be declared inside an approved research path');
    if (e.status !== 'reserved_not_present' && e.status !== 'retired' && e.entry_class !== 'admitted_future_package') {
      const mh = e.manifest_binding && e.manifest_binding.package_sha256;
      if (!mh || !ctx.manifestHashes || mh !== ctx.manifestHashes[e.package_id]) p.push(tag + ': manifest hash does not match the package');
    }
    if (!e.seeded_retroactively && !e.admission_record) p.push(tag + ': neither an admission record nor a recorded retroactive seed');
    if (!ENTRY_CLASSES.includes(e.entry_class)) p.push(tag + ': unknown entry class');
    if (e.entry_class === 'retroactive_seed' && (!SEED_IDS.includes(e.package_id) || e.seeded_retroactively !== true)) p.push(tag + ': only Phase 6, Phase 7 and Phase 8 may be retroactive seeds');
    if (e.entry_class === 'admitted_future_package') {
      const ar = e.admission_record || {};
      if (e.seeded_retroactively !== false) p.push(tag + ': an admitted package cannot be a retroactive seed');
      if (ar.gate_result !== 'admissible' || ar.owner_decision_reference !== ref.reference || !(ctx.decidedReferences && ctx.decidedReferences.has(ref.reference))) p.push(tag + ': admission record missing, not admissible, or not tied to a recorded owner decision');
      if (ar.files_present_at_admission !== 0) p.push(tag + ': files existed before admission');
    }
    if (STATUS_WORDS.test(JSON.stringify(Object.assign({}, e, { reason: undefined })) + ' ' + (e.reason || ''))) p.push(tag + ': registry entry claims a deployed, validated, licensed or ready status');
    if (JSON.stringify(e).match(/"(?:historical_result|historical_results|recorded_result)_?(?:override|overrides|replacement)?"\s*:/)) p.push(tag + ': attempts to record or redefine a historical result');
  }
  return p;
}

// Phase 8.2 admission correction: an admitted package declares where its own manifest will live; nothing is required before files exist.
export const manifestFileInResearchPath = (e) => { const mf = e && e.manifest_binding && e.manifest_binding.manifest_file; return typeof mf === 'string' && (e.approved_paths || []).some((ap) => ap.startsWith('research/') && ap.endsWith('/') && mf.startsWith(ap) && mf.length > ap.length); };
export const PACKAGE_STATES = Object.freeze(['no_files', 'incomplete_construction', 'manifest_verified', 'integrity_failure']);
// files: the package's untracked files; readText(path) returns the file text or null; shaOf(path) returns its SHA-256 hex.
export function packageStateFor(e, files, readText, shaOf) {
  const mf = e.manifest_binding && e.manifest_binding.manifest_file;
  if (!files.length) return { state: 'no_files', problems: [] };
  const text = mf ? readText(mf) : null;
  if (text === null || text === undefined) return { state: 'incomplete_construction', problems: [], note: 'files present, package manifest not yet written' };
  const histDir = mf.replace(/[^/]+$/, '') + 'manifest-history/';
  const ver = /^# manifest_version: (\d+)$/m.exec(text);
  const problems = [];
  if (!ver) problems.push('manifest_version header missing');
  const n = ver ? +ver[1] : 0;
  for (let v = 1; v < n; v++) if (readText(histDir + 'v' + v + '.sha256') === null) problems.push('prior manifest version ' + v + ' not preserved');
  const rows = String(text).split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(l); return m ? { sha: m[1], path: m[2] } : null; });
  if (rows.some((r) => !r)) problems.push('malformed manifest line');
  const covered = files.filter((f) => f !== mf && !f.startsWith(histDir)).sort();
  const listed = rows.filter(Boolean).map((r) => r.path).sort();
  if (JSON.stringify(covered) !== JSON.stringify(listed)) problems.push('manifest file set differs from the package files');
  for (const r of rows.filter(Boolean)) if (covered.includes(r.path) && shaOf(r.path) !== r.sha) problems.push('changed after manifest: ' + r.path);
  return { state: problems.length ? 'integrity_failure' : 'manifest_verified', problems, manifest_version: n };
}

// Counts are derived from valid entries, never fixed.
export function registrySummary(reg) {
  const es = (reg && reg.packages) || [];
  const n = (f) => es.filter(f).length;
  return { entries: es.length, retroactive_seeds: n((e) => e.entry_class === 'retroactive_seed'), admitted_future_packages: n((e) => e.entry_class === 'admitted_future_package'),
    reserved_not_present: n((e) => e.status === 'reserved_not_present'), local_construction_only: n((e) => e.status === 'local_construction_only'), present: n((e) => e.status === 'present_local_only' || e.status === 'preserved_local_only'), retired: n((e) => e.status === 'retired') };
}

// Phase 8's own location and registry check, classified from the registry.
// ctx: { registry, registryProblems: [..], phase8Verification: {ok, problems}, mtimeOf: (path) => ms|null }
export function classifyPhase8Scope(untracked, ctx) {
  const items = [];
  const entries = (ctx.registry && ctx.registry.packages) || [];
  if (ctx.phase8Verification && !ctx.phase8Verification.ok) items.push({ classification: 'changed_phase8_protected_file', detail: (ctx.phase8Verification.problems || []).join(',') });
  const byPkg = {};
  for (const f of untracked || []) {
    if (inPhase8Scope(f)) continue;
    const e = entries.find((x) => x.entry_class === 'admitted_future_package' && ownsLater(x, f));
    if (!e) { items.push({ classification: entries.some((x) => ownsLater(x, f)) ? 'missing_or_invalid_registry_reservation' : 'undeclared_future_path', path: f }); continue; }
    const invalid = (ctx.registryProblems || []).some((m) => m.startsWith(e.package_id + ':'));
    if (invalid) { items.push({ classification: 'missing_or_invalid_registry_reservation', path: f, later_package: e.package_id }); continue; }
    const at = Date.parse((e.admission_record || {}).admitted_at || '');
    const mt = ctx.mtimeOf ? ctx.mtimeOf(f) : null;
    if (e.status === 'reserved_not_present' || e.status === 'retired' || (mt !== null && !(at <= mt))) { items.push({ classification: 'files_before_admission', path: f, later_package: e.package_id }); continue; }
    const st = ctx.packageStates ? ctx.packageStates[e.package_id] : null;
    if (!st || !PACKAGE_STATES.includes(st.state)) { items.push({ classification: 'package_state_not_determined', path: f, later_package: e.package_id }); continue; }
    if (st.state === 'integrity_failure') { items.push({ classification: 'admitted_package_integrity_failure', path: f, later_package: e.package_id, detail: st.problems.slice(0, 3).join('; ') }); continue; }
    (byPkg[e.package_id] = byPkg[e.package_id] || []).push(f);
  }
  for (const lp of Object.keys(byPkg)) if (ctx.packageStates[lp].state === 'incomplete_construction') items.push({ classification: 'declared_incomplete_construction', later_package: lp, note: 'files present, package manifest not yet written; not a historical defect and not release-capable' });
  const conditions = Object.entries(byPkg).map(([lp, files]) => ({ condition_id: 'DCC-EC-P8-SCOPE-' + lp, construction_state: ctx.packageStates[lp].state, affected_historical_package: 'phase8-governance', check_id: 'EC-P8-SCOPE', later_package: lp, paths: files,
    governing_registry_entry: lp, earlier_protected_file_changed: !!(ctx.phase8Verification && !ctx.phase8Verification.ok), historical_example: null, label: COMPOSITION_LABEL }));
  for (const c of conditions) items.push(Object.assign({ classification: 'declared_composition_condition' }, c));
  const fail = items.filter((i) => i.classification !== 'declared_composition_condition' && i.classification !== 'declared_incomplete_construction');
  return { items, conditions, verdict: fail.length ? 'fail_closed' : 'declared_composition_conditions_only' };
}

// Derive composition conditions from the registry. run.suites[pkg] = { complete, total, passed, failed, failed_checks, output_sha256 }.
// ctx: { registry, untracked, phase6Files, verification: [{package, ok, problems}] }
export function deriveComposition(run, ctx) {
  const items = [];
  const add = (cls, o) => items.push(Object.assign({ classification: cls }, o));
  for (const v of ctx.verification || []) if (!v.ok) add('changed_protected_file', { package: v.package, detail: v.problems.join(',') });
  const entries = (ctx.registry && ctx.registry.packages) || [];
  const live = entries.filter((e) => e.status === 'present_local_only' || e.status === 'preserved_local_only' || e.status === 'local_construction_only');
  for (const f of ctx.untracked || []) if (!live.some((e) => ownsLater(e, f))) add('undeclared_later_path', { path: f });
  const conditions = [];
  for (const [pid, suite] of Object.entries(SUITES)) {
    const r = run && run.suites ? run.suites[pid] : undefined;
    if (!r || r.complete !== true || !Array.isArray(r.failed_checks) || r.failed_checks.length !== r.failed) { add('incomplete_test_record', { package: pid, suite }); continue; }
    for (const name of r.failed_checks) {
      const c = EARLIER_CHECKS.find((x) => x.originating_package === pid && x.exact_check === name);
      if (!c) { add('genuine_regression_or_unexplained', { package: pid, suite, check: name }); continue; }
      const off = OFFENDING_RULES[c.offending_rule](ctx.untracked || [], ctx);
      if (!off.length) { add('genuine_regression_or_unexplained', { package: pid, suite, check: name, detail: 'no later file trips this check' }); continue; }
      const byPkg = {};
      for (const f of off) {
        const e = live.find((x) => ownsLater(x, f));
        if (!e) { add('undeclared_later_path', { path: f, check: c.check_id }); continue; }
        if (!(e.affected_earlier_checks || []).includes(c.check_id)) { add('undeclared_affected_check', { later_package: e.package_id, check: c.check_id, path: f }); continue; }
        (byPkg[e.package_id] = byPkg[e.package_id] || []).push(f);
      }
      for (const [lp, files] of Object.entries(byPkg)) {
        const cond = { condition_id: 'DCC-' + c.check_id + '-' + lp, affected_historical_package: pid, check_id: c.check_id, exact_check: name, later_package: lp,
          paths: files, governing_registry_entry: lp, earlier_protected_file_changed: (ctx.verification || []).some((v) => v.package === pid && !v.ok), historical_example: c.historical_example, label: COMPOSITION_LABEL };
        conditions.push(cond); add('declared_composition_condition', cond);
      }
    }
    for (const c of EARLIER_CHECKS.filter((x) => x.originating_package === pid)) {
      const off = OFFENDING_RULES[c.offending_rule](ctx.untracked || [], ctx);
      if (off.length && !r.failed_checks.includes(c.exact_check)) add('condition_description_inconsistent', { package: pid, check: c.check_id });
    }
  }
  const fail = items.filter((i) => i.classification !== 'declared_composition_condition');
  return { items, conditions, verdict: fail.length ? 'fail_closed' : 'declared_composition_conditions_only', fail_closed_items: fail.length };
}

// Dual-context result: historical record and current composition, never merged.
// Phase 8 itself as a governed historical package (Phase 8.2). Its historical result is fixed to the 8.1 scope.
export function dualContextPhase8(historical, phase8Composition) {
  if (!historical) return null;
  return { package: 'phase8-governance',
    historical: { result: historical.historical_result.result, recorded: historical.historical_result.recorded_at, source: 'execution-record/PHASE8_HISTORICAL_RECORD.json', scope: historical.scope },
    isolated_replay: { result: historical.isolated_replay.result, run_at: historical.isolated_replay.date, environment: historical.isolated_replay.environment },
    composition: phase8Composition ? { result: phase8Composition.result, conditions: (phase8Composition.conditions || []).map((c) => ({ condition_id: c.condition_id, later_package: c.later_package, paths: c.paths.length, historical_example: null, label: c.label })) } : null,
    earlier_protected_file_changed: !!(phase8Composition && phase8Composition.changed_protected_file) };
}

export function dualContext(versionRegistry, run, composition, isolated) {
  return versionRegistry.packages.filter((p) => SUITES[p.id]).map((p) => {
    const r = run && run.suites ? run.suites[p.id] : null;
    const conds = composition.conditions.filter((c) => c.affected_historical_package === p.id);
    const iso = isolated && isolated.replays ? isolated.replays.find((x) => x.package === p.id) : null;
    return {
      package: p.id,
      historical: { result: p.latest_recorded_result.result, recorded: p.latest_recorded_result.date || null, source: p.latest_recorded_result.source, scope: 'sealed package scope' },
      isolated_replay: iso ? { result: iso.passed + '/' + iso.total, run_at: iso.finished_at, environment: 'baseline commit plus recorded manifests only' } : null,
      composition: r ? { result: r.passed + '/' + r.total, conditions: conds.map((c) => ({ condition_id: c.condition_id, later_package: c.later_package, paths: c.paths.length, historical_example: c.historical_example, label: c.label })) } : null,
      earlier_protected_file_changed: conds.some((c) => c.earlier_protected_file_changed),
    };
  });
}
// Phase 8.3 classifier correction: the registry-derived view the compatibility-manifest classifier (governance.classifyRun)
// uses for paths outside the statically registered packages. Every file is placed by classifyPhase8Scope, so the same
// fail-closed rules apply: an undeclared path stays unplaced (and becomes package_outside_registry), an invalid
// reservation, files before admission, an undetermined state or an integrity failure stay failures. A registry-level
// problem (for example a hash mismatch after an altered admission record) invalidates every admitted package.
// ctx: { registry, registryProblems, packageStates, mtimeOf }
export const ACCEPTED_STATES = Object.freeze(['manifest_verified', 'incomplete_construction']);
export function laterCompatibilityContext(untracked, ctx) {
  const reg = ctx && ctx.registry; const problems = (ctx && ctx.registryProblems) || [];
  const entries = ((reg && reg.packages) || []).filter((e) => e.entry_class === 'admitted_future_package');
  const ids = ((reg && reg.packages) || []).map((e) => e.package_id);
  const registryInvalid = !reg || problems.some((m) => !ids.some((id) => m.startsWith(id + ':')));
  const files = {};
  const scope = classifyPhase8Scope(untracked, { registry: reg, registryProblems: problems, phase8Verification: { ok: true }, packageStates: (ctx && ctx.packageStates) || {}, mtimeOf: ctx && ctx.mtimeOf });
  for (const i of scope.items) if (i.path && i.classification !== 'undeclared_future_path') files[i.path] = { package_id: i.later_package || null, classification: i.classification, detail: i.detail || null };
  for (const c of scope.conditions) for (const f of c.paths) files[f] = { package_id: c.later_package, classification: c.construction_state === 'incomplete_construction' ? 'declared_incomplete_construction' : 'accepted', construction_state: c.construction_state };
  if (registryInvalid) for (const f of Object.keys(files)) files[f] = { package_id: files[f].package_id, classification: 'missing_or_invalid_registry_reservation', detail: 'the later-package registry failed validation' };
  const declares = Object.fromEntries(entries.map((e) => [e.package_id, [...(e.affected_earlier_checks || [])]]));
  const checkIds = Object.fromEntries(EARLIER_CHECKS.map((c) => [c.originating_package + '::' + c.exact_check, c.check_id]));
  const ruleOf = Object.fromEntries(EARLIER_CHECKS.map((c) => [c.check_id, c.offending_rule]));
  return { files, declares, checkIds, ruleOf, registry_invalid: registryInvalid, label: COMPOSITION_LABEL };
}

// The six separately reported result kinds. A declared condition is never a historical-package defect.
export const INTEGRITY_CLASSES = Object.freeze(['changed_protected_file', 'missing_package', 'admitted_package_integrity_failure', 'changed_phase8_protected_file']);
export function buildCompatibilityReport(record) {
  const all = [...((record.classification && record.classification.items) || []), ...((record.composition && record.composition.items) || []), ...((record.phase8_composition && record.phase8_composition.items) || [])];
  const declared = all.filter((i) => ['declared_compatibility_condition', 'declared_composition_condition', 'declared_incomplete_construction'].includes(i.classification));
  const integrity = all.filter((i) => INTEGRITY_CLASSES.includes(i.classification));
  const undeclared = all.filter((i) => !declared.includes(i) && !integrity.includes(i));
  const dc = record.dual_context || [];
  return {
    historical_package_results: dc.map((d) => ({ package: d.package, result: d.historical.result, recorded: d.historical.recorded, source: d.historical.source, scope: d.historical.scope })),
    isolated_replay_results: dc.map((d) => ({ package: d.package, result: d.isolated_replay ? d.isolated_replay.result : null, environment: d.isolated_replay ? d.isolated_replay.environment : null })),
    current_composition_results: dc.map((d) => ({ package: d.package, result: d.composition ? d.composition.result : null })),
    declared_composition_conditions: [...new Map(declared.map((i) => [(i.condition_id || i.classification) + '|' + (i.later_package || i.package || ''), { classification: i.classification, condition_id: i.condition_id || null, package: i.package || i.affected_historical_package || null, later_package: i.later_package || null, label: i.classification === 'declared_compatibility_condition' ? 'historical compatibility reference' : COMPOSITION_LABEL }])).values()],
    undeclared_failures: undeclared.map((i) => ({ classification: i.classification, package: i.package || i.later_package || null, check: i.check || null, path: i.path || i.file || null, detail: i.detail || null })),
    integrity_failures: integrity.map((i) => ({ classification: i.classification, package: i.package || i.later_package || null, path: i.path || null, detail: i.detail || null })),
    historical_defect_count_from_declared_conditions: 0,
  };
}
export const STATUS = STATUS_LINES;

