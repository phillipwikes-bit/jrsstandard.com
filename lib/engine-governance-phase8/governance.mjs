// JRS PHASE 8: cross-package test governance.
//
// Earlier package results remain historically recorded results for their sealed
// package scope. A later whole-worktree run may show a declared compatibility
// condition without establishing a defect in the earlier package.
//
// This module never edits, skips or reinterprets an earlier test. It reads what an
// earlier suite reported, recomputes independently which later files trip each
// declared file-ownership check, and classifies every failing check. Anything it
// cannot place in the compatibility manifest fails closed. A declared condition is
// never called a pass.

import { PACKAGES, CURRENT_PACKAGE, ownsPath, packageOf } from './registry.mjs';

export const LANGUAGE_RULE = 'Earlier package results remain historically recorded results for their sealed package scope. A later whole-worktree run may show a declared compatibility condition without establishing a defect in the earlier package.';
export const CLASSES = Object.freeze(['declared_compatibility_condition', 'genuine_regression', 'unexplained_conflict', 'missing_package', 'changed_protected_file',
  'incomplete_test_record', 'package_outside_registry', 'condition_description_inconsistent', 'unsupported_pass_claim',
  // Phase 8.3: registry-derived classes for admitted later packages (see later-packages.laterCompatibilityContext).
  'declared_composition_condition', 'declared_incomplete_construction', 'undeclared_affected_check', 'admitted_package_integrity_failure', 'missing_or_invalid_registry_reservation',
  'files_before_admission', 'package_state_not_determined']);
export const DECLARED_CLASSES = Object.freeze(['declared_compatibility_condition', 'declared_composition_condition', 'declared_incomplete_construction']);
export const FAIL_CLOSED = Object.freeze(CLASSES.filter((c) => !DECLARED_CLASSES.includes(c)));

export const SUITES = Object.freeze({
  'v0.1-assurance': 'tests/engine-assurance/run.mjs',
  'v0.2-evidence-contract': 'tests/engine-evidence-contract/run.mjs',
  'v0.3-evidence-graph': 'tests/engine-evidence-graph/run.mjs',
  'phase4-change-control': 'tests/engine-adaptive-reliability/run.mjs',
  'phase6-reliability': 'tests/engine-reliability/run.mjs',
  'phase7-candidate': 'tests/engine-remediation-phase7/run.mjs',
});

const pkg = (id) => [...PACKAGES, CURRENT_PACKAGE].find((p) => p.id === id);
const inTrigger = (f, t) => (t.path.endsWith('/') ? f.startsWith(t.path) : f === t.path);

// Independent re-implementations of the earlier file-ownership predicates (read from the earlier suites, not imported).
export const OFFENDING_RULES = Object.freeze({
  untracked_under_tools: (u) => u.filter((f) => f.startsWith('tools/')),
  untracked_outside_phase6: (u) => u.filter((f) => !ownsPath(pkg('phase6-reliability'), f)),
  untracked_outside_phase6_and_phase7: (u, ctx) => u.filter((f) => !ctx.phase6Files.has(f) && !ownsPath(pkg('phase7-candidate'), f)),
  untracked_non_phase6_under_restricted_roots: (u, ctx) => u.filter((f) => !ctx.phase6Files.has(f) && /^(?:tools|api|docs|\.jrs|\.github)\/|^[^/]+\.html$/.test(f)),
});

const REQUIRED = ['condition_id', 'name', 'originating_package', 'originating_suite', 'exact_check', 'check_source', 'offending_rule', 'triggering_paths',
  'protected_packages_confirmed_unchanged', 'first_observed', 'meaning', 'why_visible_not_rewritten', 'owner_decision_before_redesign'];
const CAUSES = ['existing', 'additional_phase8', 'new_phase8'];

export function validateCompatibilityManifest(cm) {
  const p = [];
  if (!cm || typeof cm !== 'object' || !Array.isArray(cm.conditions)) return ['manifest missing or malformed'];
  if (cm.language_rule !== LANGUAGE_RULE) p.push('language rule missing or altered');
  if (cm.never_labelled !== 'pass') p.push('pass-label prohibition missing');
  if (cm.condition_class !== 'declared_environmental_compatibility_condition') p.push('condition class missing or altered');
  if (!cm.conditions.length) p.push('no conditions declared');
  const ids = new Set(), checks = new Set();
  for (const c of cm.conditions) {
    const tag = c && c.condition_id ? c.condition_id : '(unnamed)';
    for (const k of REQUIRED) { const v = c ? c[k] : undefined; if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) p.push(tag + ': missing ' + k); }
    if (!c) continue;
    if (ids.has(c.condition_id)) p.push(tag + ': duplicate condition id'); ids.add(c.condition_id);
    const key = c.originating_suite + '::' + c.exact_check;
    if (checks.has(key)) p.push(tag + ': duplicate check'); checks.add(key);
    if (SUITES[c.originating_package] !== c.originating_suite) p.push(tag + ': originating suite does not belong to originating package');
    if (!OFFENDING_RULES[c.offending_rule]) p.push(tag + ': unknown offending rule');
    if (typeof c.check_source === 'string' && !c.check_source.startsWith(c.originating_suite + ':')) p.push(tag + ': check source inconsistent with suite');
    for (const t of c.triggering_paths || []) {
      if (!t || !t.path || !t.later_package || !CAUSES.includes(t.cause)) { p.push(tag + ': incomplete triggering path'); continue; }
      if (t.later_package === c.originating_package) p.push(tag + ': a package cannot be its own later cause');
      if (!pkg(t.later_package)) p.push(tag + ': triggering package not in the version registry');
      else if (!ownsPath(pkg(t.later_package), t.path.endsWith('/') ? t.path + 'x' : t.path)) p.push(tag + ': triggering path not owned by its later package');
    }
    for (const id of c.protected_packages_confirmed_unchanged || []) if (!PACKAGES.some((x) => x.id === id)) p.push(tag + ': unknown protected package ' + id);
    if (!(c.protected_packages_confirmed_unchanged || []).includes(c.originating_package)) p.push(tag + ': originating package not listed as confirmed unchanged');
    for (const o of c.first_observed || []) if (!o || !/^\d{4}-\d{2}-\d{2}/.test(o.date || '') || !o.record || !CAUSES.includes(o.cause)) p.push(tag + ': incomplete first-observed entry');
    if (JSON.stringify(c).match(/"(?:status|classification|result|label)"\s*:\s*"pass(?:ed)?"/i)) p.push(tag + ': condition labelled as a pass');
  }
  return p;
}

// Parses an earlier suite's console output. Only PASS/FAIL/SKIP lines and the final count line are read.
export function parseSuiteOutput(text) {
  const lines = String(text || '').split('\n');
  const failed = [], passed = [];
  for (const l of lines) { const m = /^(PASS|FAIL|SKIP)  (.+)$/.exec(l); if (m) (m[1] === 'FAIL' ? failed : passed).push(m[2]); }
  const s = lines.map((l) => /^(\d+) checks: (\d+) passed, (\d+) failed/.exec(l)).filter(Boolean).pop();
  return s ? { complete: true, total: +s[1], passed: +s[2], failed: +s[3], failed_checks: failed } : { complete: false, total: null, passed: null, failed: null, failed_checks: failed };
}

function recordComplete(r) {
  return !!r && r.complete === true && Number.isInteger(r.total) && Number.isInteger(r.passed) && Number.isInteger(r.failed) && r.passed + r.failed <= r.total
    && Array.isArray(r.failed_checks) && r.failed_checks.length === r.failed && typeof r.output_sha256 === 'string' && /^sha256:[0-9a-f]{64}$/.test(r.output_sha256);
}

// ctx: { manifest, untracked: [paths], phase6Files: Set, verification: [{package, ok, problems}], later?: laterCompatibilityContext(...) }
// Phase 8.3: without ctx.later the classification is exactly the original one. With it, a path outside the statically
// registered packages is placed by the later-package registry: accepted only for a valid admitted package in a declared
// state, and every failing check its files trip must be one that package declared.
export function classifyRun(run, ctx) {
  const items = [];
  const add = (cls, o) => items.push(Object.assign({ classification: cls }, o));
  const mp = validateCompatibilityManifest(ctx.manifest);
  for (const m of mp) add('condition_description_inconsistent', { detail: m });
  for (const v of ctx.verification || []) {
    if (v.ok) continue;
    if (v.problems.includes('missing_recorded_manifest') || (v.missing && v.missing.length && v.missing.length === v.recorded_count)) add('missing_package', { package: v.package, detail: v.problems.join(',') });
    else add('changed_protected_file', { package: v.package, detail: v.problems.join(','), files: [...(v.changed || []), ...(v.missing || []), ...(v.added || [])] });
  }
  for (const id of PACKAGES.map((p) => p.id)) if (!(ctx.verification || []).some((v) => v.package === id)) add('missing_package', { package: id, detail: 'no verification result' });
  const later = ctx.later || null;
  const placed = (f) => { const a = later && later.files[f]; return a && (a.classification === 'accepted' || a.classification === 'declared_incomplete_construction') ? a : null; };
  const incomplete = new Set();
  for (const f of ctx.untracked || []) {
    const o = packageOf(f);
    if (o && o !== 'ambiguous') continue;
    const a = later && later.files[f];
    if (!a) { add('package_outside_registry', { file: f }); continue; }
    if (a.classification === 'accepted') continue;
    if (a.classification === 'declared_incomplete_construction') { if (!incomplete.has(a.package_id)) { incomplete.add(a.package_id); add('declared_incomplete_construction', { later_package: a.package_id, note: 'files present, package manifest not yet written; not a historical defect and not release-capable' }); } continue; }
    add(a.classification, { file: f, path: f, later_package: a.package_id, detail: a.detail });
  }
  // Registry-derived attribution of the later files a failing check trips (Phase 8.3).
  const attribute = (pid, suite, name, files) => {
    const checkId = later ? later.checkIds[pid + '::' + name] : null;
    const byPkg = {};
    for (const f of files) {
      const a = placed(f);
      if (!a || !checkId || !(later.declares[a.package_id] || []).includes(checkId)) { add('undeclared_affected_check', { package: pid, suite, check: name, later_package: a ? a.package_id : null, file: f }); continue; }
      (byPkg[a.package_id] = byPkg[a.package_id] || []).push(f);
    }
    return Object.entries(byPkg).map(([lp, fs]) => { const cond = { condition_id: 'DCC-' + checkId + '-' + lp, package: pid, suite, check: name, later_package: lp, later_files: fs.length, label: later.label }; add('declared_composition_condition', cond); return cond.condition_id; });
  };
  const conditions = (ctx.manifest && ctx.manifest.conditions) || [];
  const suites = {};
  for (const [pid, suite] of Object.entries(SUITES)) {
    const r = run && run.suites ? run.suites[pid] : undefined;
    if (!recordComplete(r)) { add('incomplete_test_record', { package: pid, suite, detail: r ? 'record incomplete or inconsistent' : 'no run record' }); suites[pid] = { suite, worktree_result: null, conditions: [] }; continue; }
    const present = [], composition = [];
    for (const name of r.failed_checks) {
      const c = conditions.find((x) => x.originating_package === pid && x.exact_check === name);
      if (!c) {
        // Phase 8.3: a check outside the compatibility manifest is declared only when every later file it trips belongs to an admitted package that declared it.
        const ec = later && later.checkIds[pid + '::' + name] ? OFFENDING_RULES[later.ruleOf[later.checkIds[pid + '::' + name]]] : null;
        const offL = ec ? ec(ctx.untracked || [], ctx) : [];
        if (offL.length && offL.every((f) => placed(f))) { composition.push(...attribute(pid, suite, name, offL)); continue; }
        add(/new file|unchanged since|file under|Phase \d+ file|locations/i.test(name) ? 'unexplained_conflict' : 'genuine_regression', { package: pid, suite, check: name }); continue;
      }
      const rule = OFFENDING_RULES[c.offending_rule];
      const off = rule ? rule(ctx.untracked || [], ctx) : [];
      const legacyOff = off.filter((f) => !placed(f)), laterOff = off.filter((f) => placed(f));
      const outside = legacyOff.filter((f) => !c.triggering_paths.some((t) => inTrigger(f, t)));
      if (!off.length) add('genuine_regression', { package: pid, suite, check: name, condition_id: c.condition_id, detail: 'declared check failed but no later file trips it' });
      else if (outside.length) add('unexplained_conflict', { package: pid, suite, check: name, condition_id: c.condition_id, files: outside });
      else {
        if (legacyOff.length) { present.push(c.condition_id); add('declared_compatibility_condition', { package: pid, suite, check: name, condition_id: c.condition_id, later_files: legacyOff.length }); }
        if (laterOff.length) composition.push(...attribute(pid, suite, name, laterOff));
      }
    }
    // A declared condition whose later files exist must be visible in the run; if it is not, the description no longer matches the suite.
    for (const c of conditions.filter((x) => x.originating_package === pid)) {
      const rule = OFFENDING_RULES[c.offending_rule];
      const off = rule ? rule(ctx.untracked || [], ctx) : [];
      if (off.length && !r.failed_checks.includes(c.exact_check)) add('condition_description_inconsistent', { package: pid, condition_id: c.condition_id, detail: 'later files exist but the declared check did not report them' });
    }
    suites[pid] = { suite, worktree_result: r.passed + '/' + r.total, failed: r.failed, conditions: present, composition_conditions: composition };
  }
  const failClosed = items.filter((i) => FAIL_CLOSED.includes(i.classification));
  return { language_rule: LANGUAGE_RULE, items, suites, verdict: failClosed.length ? 'fail_closed' : 'declared_conditions_only', fail_closed_items: failClosed.length };
}

// What a later package may say about an earlier package's result.
// Allowed: the recorded result exactly as registered, or a fresh whole-worktree result with its declared conditions.
// Refused: "passed" without a fresh complete run that has zero failures, and any declared condition relabelled as a pass.
export function earlierPackageStatement(pid, claim, run, classification) {
  const reg = PACKAGES.find((p) => p.id === pid);
  if (!reg || !claim) return { ok: false, reason: 'unknown package or empty claim' };
  if (claim.kind === 'recorded') return reg.recorded_result && claim.result === reg.recorded_result.result && claim.source === reg.recorded_result.source
    ? { ok: true, text: reg.recorded_result.result + ' (recorded ' + (reg.recorded_result.date || 'n/a') + ', ' + reg.recorded_result.source + ', for its sealed package scope)' } : { ok: false, reason: 'recorded result does not match the registry' };
  if (claim.kind === 'worktree') {
    const r = run && run.suites ? run.suites[pid] : null;
    if (!recordComplete(r)) return { ok: false, reason: 'no complete fresh run record' };
    if (/^pass(ed)?$/i.test(claim.status || '') && r.failed > 0) return { ok: false, reason: 'cannot call a run with failing checks passed' };
    const conds = classification && classification.suites[pid] ? classification.suites[pid].conditions : [];
    if ((claim.relabel || []).length) return { ok: false, reason: 'declared conditions cannot be relabelled' };
    return { ok: true, text: r.passed + '/' + r.total + ' in a whole-worktree run' + (conds.length ? ', with declared compatibility condition ' + conds.join(', ') + ' visible' : '') };
  }
  return { ok: false, reason: 'claim must cite the recorded result or a fresh run record' };
}
