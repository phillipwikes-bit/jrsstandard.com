// JRS controlled independent-evaluation readiness: repository scan for evaluation source text.
// INTERNAL. Reads only; the caller supplies the list of tracked files.
//
// Future evaluation records are held outside this repository and named here only by digest. The scan
// fails, naming the owning control, when a tracked file could be one:
//   SCAN-01  a tracked path in a location reserved for evaluation inputs or holdouts
//   SCAN-02  a tracked file carrying the evaluation-source marker
//   SCAN-03  a tracked text whose paragraph digest equals a declared evaluation input digest
//   SCAN-04  a package artifact (tools/evaluation-readiness) that carries a record-text field
// A clean scan shows only that none of these signs is present. It cannot prove that no record text
// is anywhere, since a pasted record without the marker and without a declared digest is not detectable.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { materialHash } from '../../../lib/engine-candidate/dev-material.js';
import { RECORD_TEXT_FIELDS } from './vocabulary.js';

export const SCAN_VERSION = 'jrs-evaluation-source-scan/0.1.0';
// Built from parts so this file does not carry the marker it searches for.
export const EVALUATION_SOURCE_MARKER = 'JRS-EVALUATION' + '-SOURCE';
export const RESERVED_SEGMENTS = Object.freeze(['evaluation-inputs', 'evaluation-input', 'eval-records', 'evaluation-records', 'holdout', 'holdouts', 'sealed-holdout', 'sealed']);
export const RESERVED_SUFFIXES = Object.freeze(['.record.txt', '.eval.txt', '.evaluation-record.json']);
const TEXT = /\.(md|txt|json|js|mjs|cjs|html|csv|yml|yaml|py|ts|sql|xml)$/i;

function paragraphs(text) { return text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length >= 40); }

export function scanRepository(root, trackedFiles, { declaredDigests = [] } = {}) {
  const findings = [];
  const add = (control, file, message) => findings.push({ control, file, message });
  const digests = new Set(declaredDigests);
  for (const f of trackedFiles) {
    const segs = f.split('/');
    if (segs.slice(0, -1).some((s) => RESERVED_SEGMENTS.includes(s.toLowerCase())) || RESERVED_SUFFIXES.some((s) => f.toLowerCase().endsWith(s)))
      add('SCAN-01', f, 'Tracked file in a location reserved for evaluation inputs; evaluation records are never committed.');
    if (!TEXT.test(f)) continue;
    let body;
    try { if (statSync(join(root, f)).size > 4_000_000) continue; body = readFileSync(join(root, f), 'utf8'); } catch (e) { continue; }
    if (body.includes(EVALUATION_SOURCE_MARKER)) add('SCAN-02', f, 'Carries the evaluation-source marker.');
    if (digests.size && paragraphs(body).some((p) => digests.has(materialHash(p)))) add('SCAN-03', f, 'A paragraph matches a declared evaluation input digest.');
    if (f.startsWith('tools/evaluation-readiness/') && f.endsWith('.json')) {
      let o; try { o = JSON.parse(body); } catch (e) { continue; }
      const bad = [];
      (function walk(v, p) { if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) { if (RECORD_TEXT_FIELDS.includes(k)) bad.push(p + '.' + k); walk(v[k], p + '.' + k); } })(o, '$');
      if (bad.length) add('SCAN-04', f, 'Package artifact carries a record-text field: ' + bad.join(', '));
    }
  }
  return { scan_version: SCAN_VERSION, files_scanned: trackedFiles.length, declared_digests: digests.size, ok: findings.length === 0, findings };
}
