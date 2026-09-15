#!/usr/bin/env node
// JRS MANIFEST — OFFLINE VALIDATOR
//
// THE ARCHITECTURAL POINT OF THIS FILE.
//
// The specification states that a manifest which can only be interpreted by a
// live JRS service is a receipt, not evidence. This validator therefore makes
// NO network call of any kind: no JRS API, no Anthropic, no Supabase, no
// Vercel, no schema fetch. It reads a file and a schema from disk and decides.
// That property is tested, not asserted: tests/manifest/run.mjs runs it with
// the network shims removed.
//
// WHAT IT DOES NOT CLAIM, and this matters more than what it does:
//   - it does NOT establish legal validity, admissibility or compliance
//   - it does NOT establish accuracy or validation of the evaluation
//   - it does NOT establish authenticity unless a signature is present AND
//     verified, and signature verification is NOT implemented here, so an
//     unsigned manifest is reported as SELF-CONSISTENT, never as AUTHENTIC
//
// IT IS A SUBSET VALIDATOR, SAID PLAINLY. It implements the JSON Schema
// constructs this schema actually uses (type, required, enum, const,
// additionalProperties, pattern, minProperties/maxProperties, maxLength,
// minimum, format for uuid and date-time). It is not a general JSON Schema
// implementation and must not be presented as one. It FAILS CLOSED: an
// unrecognised construct or an unknown vocabulary is a failure, never a pass.
//
// This fired for real on 2026-09-15: the schema used minLength, the validator did
// not implement it, and every manifest was rejected. The fix was to implement the
// keyword, NOT to drop it from the schema. Weakening a schema so a tool passes is
// the inversion this project exists to catch.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const KNOWN_KEYWORDS = new Set([
  '$schema', '$id', 'title', 'description', 'type', 'required', 'properties',
  'additionalProperties', 'enum', 'const', 'pattern', 'minProperties',
  'maxProperties', 'maxLength', 'minLength', 'minimum', 'items', 'format', 'default',
  'examples',
]);

function validate(node, schema, path, errs) {
  for (const kw of Object.keys(schema)) {
    if (!KNOWN_KEYWORDS.has(kw)) {
      errs.push(`${path}: schema uses unsupported keyword '${kw}'; this validator fails closed`);
      return;
    }
  }
  if ('const' in schema && node !== schema.const) {
    errs.push(`${path}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(node)) {
    errs.push(`${path}: ${JSON.stringify(node)} is not one of ${JSON.stringify(schema.enum)}`);
  }
  const t = schema.type;
  if (t === 'object') {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      errs.push(`${path}: expected object`); return;
    }
    for (const r of schema.required || []) {
      if (!(r in node)) errs.push(`${path}.${r}: required field missing`);
    }
    const props = schema.properties || {};
    const keys = Object.keys(node);
    if (schema.minProperties != null && keys.length < schema.minProperties) {
      errs.push(`${path}: ${keys.length} properties, minimum ${schema.minProperties}`);
    }
    if (schema.maxProperties != null && keys.length > schema.maxProperties) {
      errs.push(`${path}: ${keys.length} properties, maximum ${schema.maxProperties}`);
    }
    for (const k of keys) {
      if (props[k]) validate(node[k], props[k], `${path}.${k}`, errs);
      else if (schema.additionalProperties === false) {
        errs.push(`${path}.${k}: field not permitted by the schema`);
      } else if (typeof schema.additionalProperties === 'object') {
        validate(node[k], schema.additionalProperties, `${path}.${k}`, errs);
      }
    }
  } else if (t === 'array') {
    if (!Array.isArray(node)) { errs.push(`${path}: expected array`); return; }
    if (schema.items) node.forEach((v, i) => validate(v, schema.items, `${path}[${i}]`, errs));
  } else if (t === 'string') {
    if (typeof node !== 'string') { errs.push(`${path}: expected string`); return; }
    if (schema.pattern && !new RegExp(schema.pattern).test(node)) {
      errs.push(`${path}: does not match ${schema.pattern}`);
    }
    if (schema.maxLength != null && node.length > schema.maxLength) {
      errs.push(`${path}: ${node.length} chars exceeds maxLength ${schema.maxLength}`);
    }
    if (schema.minLength != null && node.length < schema.minLength) {
      errs.push(`${path}: ${node.length} chars below minLength ${schema.minLength}`);
    }
    if (schema.format === 'uuid' && !UUID_RE.test(node)) errs.push(`${path}: not a UUID`);
    if (schema.format === 'date-time' && !DATE_RE.test(node)) errs.push(`${path}: not an RFC 3339 timestamp`);
  } else if (t === 'integer') {
    if (!Number.isInteger(node)) { errs.push(`${path}: expected integer`); return; }
    if (schema.minimum != null && node < schema.minimum) errs.push(`${path}: below minimum`);
  } else if (t === 'boolean') {
    if (typeof node !== 'boolean') errs.push(`${path}: expected boolean`);
  }
}

// Mirrors lib/manifest/canonicalize.js. Duplicated deliberately: this tool must
// run from a copied directory with nothing else present, which is the portability
// property being demonstrated. The test harness asserts the two agree.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) if (v[k] !== undefined) o[k] = canon(v[k]);
    return o;
  }
  return v;
}

export function validateManifest(manifest, schema) {
  const errs = [];
  validate(manifest, schema, '$', errs);

  // Semantic checks the schema cannot express.
  if (manifest && typeof manifest === 'object') {
    const notes = Object.values(manifest.conditions || {}).some((c) => c && c.note);
    if (notes && manifest.content_class === 'no_record_content') {
      errs.push('$.content_class: declared no_record_content while per-condition notes '
        + 'are present. Notes are model output derived from the record.');
    }
    if (manifest.human_review && manifest.human_review.required === false
        && !manifest.human_review.reason) {
      errs.push('$.human_review: required=false without a stated reason');
    }
    if (manifest.condition_vocabulary === 'jrs_codebook_1.0') {
      errs.push('$.condition_vocabulary: jrs_codebook_1.0 asserted. Three of five '
        + 'Codebook-to-engine mappings are UNRESOLVED, so this validator cannot '
        + 'accept the claim without an owner-declared mapping it can check.');
    }
    const inp = manifest.input || {};
    // TRUNCATION AND SOURCE-HASH COHERENCE.
    // These are the fields a hand-editor would reach for to claim an evaluation
    // covered material the model never received, so they are checked against
    // each other rather than trusted individually.
    if (inp.truncated === true && !inp.source_hash) {
      errs.push('$.input: truncated=true without source_hash; the full record cannot '
        + 'then be tied to this evaluation');
    }
    if (inp.truncated === false && inp.source_hash) {
      errs.push('$.input: source_hash present while truncated=false. If nothing was '
        + 'truncated the evaluated hash already covers the whole record, so a '
        + 'second hash asserts a distinction that did not occur.');
    }
    if (inp.source_hash && inp.source_hash === inp.hash) {
      errs.push('$.input: source_hash equals hash. A distinct source hash is only '
        + 'meaningful when the evaluated text differs from the record.');
    }
    if (inp.hash_algorithm && inp.hash && !inp.hash.startsWith(inp.hash_algorithm + ':')) {
      errs.push(`$.input: hash_algorithm '${inp.hash_algorithm}' does not match the `
        + 'prefix on hash; an algorithm field that disagrees with the value is worse '
        + 'than no field at all');
    }
    if (inp.source_hash && inp.hash_algorithm
        && !inp.source_hash.startsWith(inp.hash_algorithm + ':')) {
      errs.push('$.input: source_hash prefix does not match hash_algorithm');
    }
    if (inp.truncated === true && typeof inp.length_chars === 'number'
        && inp.length_chars !== 8000) {
      errs.push(`$.input: truncated=true with length_chars ${inp.length_chars}. The `
        + 'engine truncates at 8000, so a different evaluated length contradicts the '
        + 'truncation claim.');
    }
  }

  // Integrity: self-consistency only.
  let integrity = 'NOT CHECKED';
  if (manifest && manifest.integrity && manifest.integrity.manifest_hash) {
    if (manifest.integrity.canonicalization !== 'jrs-dev-canon-1') {
      // FAIL CLOSED. Caught by a red-team case on 2026-09-15: relabeling the
      // canonicalization to 'JCS/RFC8785' previously left the integrity hash
      // unchecked while the manifest still validated. That is a compliance
      // claim passing BECAUSE it could not be verified, which is backwards.
      // This tool implements one canonicalization. Anything else is
      // unverifiable here, and unverifiable is not valid.
      integrity = `UNKNOWN CANONICALIZATION (${manifest.integrity.canonicalization}) — CANNOT VERIFY`;
      errs.push(`$.integrity.canonicalization: '${manifest.integrity.canonicalization}' `
        + 'is not implemented by this validator, so the manifest hash cannot be '
        + 'checked. Validation fails rather than passing an unverifiable claim.');
    } else {
      const copy = Object.assign({}, manifest); delete copy.integrity;
      const h = 'sha256:' + createHash('sha256').update(JSON.stringify(canon(copy)), 'utf8').digest('hex');
      integrity = h === manifest.integrity.manifest_hash
        ? 'SELF-CONSISTENT (not authenticated: unsigned)'
        : 'HASH MISMATCH';
      if (h !== manifest.integrity.manifest_hash) errs.push('$.integrity.manifest_hash: mismatch');
    }
    if (manifest.integrity.signature) {
      integrity += ' | signature present but NOT VERIFIED by this tool';
    }
  }
  return { valid: errs.length === 0, errors: errs, integrity };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const [mPath, sPath] = process.argv.slice(2);
  if (!mPath || !sPath) {
    console.error('usage: validate-manifest.js <manifest.json> <schema.json>');
    process.exit(2);
  }
  const r = validateManifest(JSON.parse(readFileSync(mPath, 'utf8')), JSON.parse(readFileSync(sPath, 'utf8')));
  console.log('integrity: ' + r.integrity);
  if (r.valid) { console.log('VALID (structurally. Not a claim of accuracy, validation, compliance or authenticity.)'); process.exit(0); }
  console.log('INVALID');
  for (const e of r.errors) console.log('  - ' + e);
  process.exit(1);
}
