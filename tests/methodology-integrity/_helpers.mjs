// Shared helpers for the methodology-integrity tests. Local only: no network, no model, no real record.
// MI_ROOT points the suite at a mutated overlay of the repository (mutation run); every module
// under test is imported from that root, so a mutated copy is what gets tested.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const REPO = new URL('../../', import.meta.url).pathname;
export const ROOT = process.env.MI_ROOT ? process.env.MI_ROOT.replace(/\/?$/, '/') : REPO;
export const TOOL = ROOT + 'tools/methodology-integrity/';
export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in methodology-integrity tests'); };

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };
export const read = (p) => readFileSync(join(ROOT, p), 'utf8');
export const readJson = (p) => JSON.parse(read(p));
export const exists = (p) => existsSync(join(ROOT, p));
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };

export const build = await import(TOOL + 'build.mjs');
export const validate = await import(TOOL + 'lib/validate.js');
export const scan = await import(TOOL + 'lib/scan.js');
export const resolve = await import(TOOL + 'lib/resolve.js');
export const checker = await import(TOOL + 'lib/schema-check.js');
export const SCHEMA = readJson('tools/methodology-integrity/schema/correspondence-record.schema.json');
export const REGISTER = readJson('tools/methodology-integrity/current-correspondence-register.json');
export const SOURCE_REGISTER = readJson('tools/methodology-integrity/source-register.json');
export const ctx = { schema: SCHEMA, sources: SOURCE_REGISTER.sources, exists };

// A complete approved record, used only as an in-memory fixture. It is never written anywhere.
export function approvedFixture() {
  const src = SOURCE_REGISTER.sources.find((s) => s.id === 'SRC-CODEBOOK');
  return {
    correspondence_id: 'MC-900', methodology_source_id: 'SRC-CODEBOOK', methodology_source_sha256: src.sha256, authoritative_source_term: 'Basis Identification',
    candidate_term: 'fixture_key', term_category: 'CANDIDATE_KEY', term_location: { path: 'lib/engine-candidate/explanations.js', reference: 'fixture' },
    mapping_type: 'EXACT_LABEL', status: 'APPROVED_CORRESPONDENCE', evidence_basis: 'Test fixture only.', source_reference: 'codebook.html, RC 2 heading and definition',
    limitation: 'Test fixture only.', proposal: null,
    owner_approval: { approved: true, approver: 'FIXTURE', approval_date: '2026-10-06', approval_reference: 'tools/methodology-integrity/README.md' },
    change_history: [{ date: '2026-10-06', change: 'fixture' }],
  };
}
