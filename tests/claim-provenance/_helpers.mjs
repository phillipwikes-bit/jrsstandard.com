// Shared helpers for the claim-provenance tests. Local only: no network, no model, no real record.
// CP_ROOT points the suite at a mutated overlay of the repository (mutation run).
import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

export const REPO = new URL('../../', import.meta.url).pathname;
export const ROOT = process.env.CP_ROOT ? process.env.CP_ROOT.replace(/\/?$/, '/') : REPO;
export const TOOL = ROOT + 'tools/claim-provenance/';
export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in claim-provenance tests'); };

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const exists = (p) => existsSync(join(ROOT, p));
export const clone = (o) => JSON.parse(JSON.stringify(o));

export const build = await import(TOOL + 'build.mjs');
export const rules = await import(TOOL + 'lib/rules.js');
export const scan = await import(TOOL + 'lib/scan.js');
export const checker = await import(TOOL + 'lib/schema-check.js');
export const repairs = await import(TOOL + 'lib/repairs.js');
export const scanCli = await import(TOOL + 'scan.mjs');
export const FRESH = build.buildAll(ROOT);
export const REGISTER = JSON.parse(read('tools/claim-provenance/current-claim-evidence-register.json'));
export const ctx = { schema: build.SCHEMA, evidence: FRESH.evidence };
export const claim = (id) => clone(REGISTER.claims.find((c) => c.claim_id === id));
export const byTopic = (topic) => clone(REGISTER.claims.find((c) => c.claim_topic === topic && ['SUPPORTED_WITH_LIMITATION', 'SOURCE_REPORTED_NOT_REPRODUCED'].includes(c.status)));
export const problems = (r) => rules.validateClaim(r, ctx);

// A synthetic public site: one page, written to a throwaway directory. Never a real page.
export function syntheticSite(bodyHtml, name = 'synthetic-claims.html') {
  const dir = mkdtempSync(join(tmpdir(), 'jrs-cp-site-'));
  mkdirSync(join(dir, 'api'));
  writeFileSync(join(dir, name), '<!doctype html><html><head><title>SYNTHETIC</title></head><body><main>\n' + bodyHtml + '\n</main></body></html>\n');
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
export function scanSynthetic(bodyHtml) {
  const site = syntheticSite(bodyHtml);
  try { return scan.scanRepository(site.dir, REGISTER.claims, []); } finally { site.cleanup(); }
}
export const worst = (r) => r.findings.map((f) => f.disposition);
