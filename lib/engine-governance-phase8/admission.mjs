// JRS PHASE 8.1: future-package admission gate.
//
// Decides only whether a proposed later package is admissible to the registry. It
// never authorizes work, creates files or edits the registry. A package is not
// admissible if its files already exist, if its paths leave the approved set, if it
// claims a status it cannot have, if it tries to redefine an earlier result, or if its
// affected-check analysis is not the computed one.

import { affectedChecksFor, FORBIDDEN_ROOTS, ownsLater, claimsB018Resolved } from './later-packages.mjs';
import { scanClaims } from './claims.mjs';

export const BOUNDARY_STATEMENT = 'This package cannot modify public, deployment or earlier protected paths without separate authorization.';
export const ADMISSION_FIELDS = Object.freeze(['package_id', 'package_version', 'owner_decision_reference', 'purpose', 'approved_paths', 'planned_manifest', 'affected_prior_analysis', 'regression_plan', 'rollback_plan', 'boundary_statement']);
const STATUS_CLAIM = /\b(?:validated|release[- ]ready|production[- ]ready|deployment[- ]ready|licen[cs]ed|licen[cs]e[- ]ready|licen[cs]ing[- ]ready|commercially ready|sale[- ]ready|approved for (?:release|deployment|production))\b/i;

// ctx: { registry, existingFiles: [paths in the worktree], decidedReferences: Set of recorded owner decisions, phase6Files }
export function evaluateAdmission(proposal, ctx) {
  const p = [];
  if (!proposal || typeof proposal !== 'object') return { admissible: false, authorizes_work: false, problems: ['no proposal'] };
  for (const k of ADMISSION_FIELDS) { const v = proposal[k]; if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length && k !== 'affected_prior_analysis')) p.push('missing ' + k); }
  const ref = proposal.owner_decision_reference;
  if (ref && !(ctx.decidedReferences && ctx.decidedReferences.has(ref))) p.push('owner decision reference is not a recorded decision');
  if (proposal.boundary_statement && proposal.boundary_statement !== BOUNDARY_STATEMENT) p.push('boundary statement altered');
  const paths = proposal.approved_paths || [];
  for (const ap of paths) if (FORBIDDEN_ROOTS.some((r) => r.test(ap) || r.test(ap + 'x'))) p.push('approved path in a protected or public area: ' + ap);
  const reg = (ctx.registry && ctx.registry.packages) || [];
  if (reg.some((e) => e.package_id === proposal.package_id)) p.push('package identifier already registered');
  for (const e of reg) for (const ap of paths) if ((e.approved_paths || []).some((x) => x.startsWith(ap) || ap.startsWith(x))) p.push('approved path overlaps registered package ' + e.package_id);
  const self = { approved_paths: paths };
  const existing = (ctx.existingFiles || []).filter((f) => ownsLater(self, f));
  if (existing.length) p.push('files created before admission: ' + existing.slice(0, 3).join(', '));
  for (const f of proposal.planned_manifest || []) if (!ownsLater(self, f)) p.push('planned file outside the approved paths: ' + f);
  const computed = affectedChecksFor(proposal.package_id, paths, ctx.phase6Files);
  if (JSON.stringify([...(proposal.affected_prior_analysis || [])].sort()) !== JSON.stringify(computed.sort())) p.push('affected prior-package analysis does not match the computed analysis (' + computed.join(', ') + ')');
  const perm = proposal.permissions || {};
  if (perm.may_affect_historical_results === true || proposal.historical_result_overrides || proposal.redefine_historical_results) p.push('attempts to redefine historical results');
  if (perm.may_affect_public_or_deployment === true) p.push('requests public or deployment effect');
  const text = JSON.stringify(Object.assign({}, proposal, { boundary_statement: undefined }));
  if (STATUS_CLAIM.test(text) || scanClaims(text).length) p.push('claims a validation, readiness, licensing or commercial status');
  if (claimsB018Resolved(text)) p.push('presents B-018 as resolved');
  return { admissible: p.length === 0, authorizes_work: false, problems: p, computed_affected_checks: computed };
}

// For a registered package that is present: its files must match the registry binding.
export function verifyRegisteredManifest(entry, computedPackageSha256) {
  if (!entry || !entry.manifest_binding || !entry.manifest_binding.package_sha256) return ['no manifest binding'];
  return entry.manifest_binding.package_sha256 === computedPackageSha256 ? [] : ['manifest does not match the registry entry'];
}
