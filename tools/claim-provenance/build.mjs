#!/usr/bin/env node
// JRS claim provenance: register builder. INTERNAL, LOCAL ONLY.
//   node tools/claim-provenance/build.mjs           validate and print a summary
//   node tools/claim-provenance/build.mjs --write   write the register, its Markdown, the matrix and the claim cards
//   node tools/claim-provenance/build.mjs --check   fail unless every committed output equals a fresh build
//
// Reads the working tree only (no git, no network, no model). Refuses to build when an evidence
// source no longer has its reviewed hash, or when any claim breaks a governing claim rule.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { EVIDENCE } from './lib/evidence.js';
import { CLAIMS } from './lib/claims.js';
import { validateRegister, statusSummary } from './lib/rules.js';
import { renderRegisterMd, renderMatrix, renderCards } from './lib/render.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const REGISTER_VERSION = 'jrs-claim-evidence-register/0.1.0';
export const OUTPUTS = Object.freeze({ register: 'tools/claim-provenance/current-claim-evidence-register.json', registerMd: 'docs/architecture/CLAIM_EVIDENCE_REGISTER.md', matrix: 'docs/architecture/PUBLIC_CLAIM_LIMITATION_MATRIX.md', cards: 'docs/architecture/claim-cards/' });
export const SCHEMA = JSON.parse(readFileSync(new URL('./schema/claim-record.schema.json', import.meta.url), 'utf8'));
const sha = (b) => createHash('sha256').update(b).digest('hex');
export const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);

// The current hash of each evidence source, by its binding.
export function currentEvidence(root = ROOT) {
  return EVIDENCE.map((e) => {
    let current = null, problem = null;
    if (e.binding === 'FILE') current = existsSync(join(root, e.path)) ? sha(readFileSync(join(root, e.path))) : null;
    if (e.binding === 'LINE' && existsSync(join(root, e.path))) {
      const lines = readFileSync(join(root, e.path), 'utf8').split('\n').filter((l) => l.includes(e.anchor));
      if (lines.length === 1) current = sha(lines[0]); else problem = e.id + ': anchor found ' + lines.length + ' times';
    }
    if (e.binding !== 'NONE' && current === null && !problem) problem = e.id + ': ' + e.path + ' not found';
    if (e.binding !== 'NONE' && current !== null && current !== e.reviewed_sha256) problem = e.id + ': ' + e.path + ' has changed since it was reviewed; review the source before re-binding its claims';
    return { id: e.id, path: e.path, binding: e.binding, anchor: e.anchor || null, evidence_class: e.evidence_class, level: e.level, version: e.version, measures: e.measures, limitations: e.limitations, reviewed_hash: e.reviewed_sha256, current_hash: current, problem };
  });
}

export function buildRegister(evidence) {
  const claims = CLAIMS.map((c) => {
    const e = evidence.find((x) => x.id === c.evidence_id) || {};
    return { ...c, source_path: e.path ?? null, source_hash: e.binding && e.binding !== 'NONE' ? e.binding + ':' + e.reviewed_hash : null, evidence_class: e.evidence_class || 'NONE' };
  });
  const ev = evidence.map(({ current_hash, problem, ...rest }) => rest);
  return { register_version: REGISTER_VERSION, record_schema: 'tools/claim-provenance/schema/claim-record.schema.json',
    standing: 'An internal claim-control register. It records what repository-visible evidence supports and how a claim may be worded. It is not new evidence and does not validate the research, the Engine, privacy controls, commercial readiness or production use.',
    claim_count: claims.length, status_summary: statusSummary(claims), claims_digest: sha(canon(claims)), evidence: ev, claims };
}

export function buildAll(root = ROOT) {
  const evidence = currentEvidence(root);
  const reg = buildRegister(evidence);
  const problems = evidence.filter((e) => e.problem).map((e) => e.problem).concat(validateRegister(reg, { schema: SCHEMA, evidence }));
  const out = { [OUTPUTS.register]: JSON.stringify(reg, null, 1) + '\n', [OUTPUTS.registerMd]: renderRegisterMd(reg), [OUTPUTS.matrix]: renderMatrix(reg) };
  for (const [name, text] of Object.entries(renderCards(reg))) out[OUTPUTS.cards + name] = text;
  for (const [p, t] of Object.entries(out)) if (/—/.test(t)) problems.push(p + ': contains an em dash');
  return { problems, out, register: reg, evidence };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const { problems, out, register } = buildAll(ROOT);
  if (problems.length) { for (const p of problems) console.error('REFUSED  ' + p); process.exit(1); }
  console.log(register.claim_count + ' claims  ' + Object.entries(register.status_summary).map(([k, v]) => k + '=' + v).join(' '));
  if (args.includes('--check')) {
    const stale = Object.entries(out).filter(([p, t]) => !existsSync(join(ROOT, p)) || readFileSync(join(ROOT, p), 'utf8') !== t).map(([p]) => p);
    if (stale.length) { for (const p of stale) console.log('STALE  ' + p); process.exit(1); }
    console.log('PASS  committed register, Markdown, matrix and claim cards equal a fresh build');
  }
  if (args.includes('--write')) for (const [p, t] of Object.entries(out)) { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), t); console.log('wrote ' + p); }
}
