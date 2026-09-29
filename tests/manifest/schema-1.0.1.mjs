// Schema revision test. The released v1.0 schema remains an immutable baseline.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateManifest } from '../../tools/validate-manifest.js';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const oldSchema = read('../../jrs-decision-reconstruction-manifest-v1.0.schema.json');
const newSchema = read('../../jrs-decision-reconstruction-manifest-v1.0.1.schema.json');
const source = read('./fixtures/canonical/02-derived.manifest.json');
const forged = read('./fixtures/canonical/07-unsupported-versions-rehashed.manifest.json');

function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') return Object.fromEntries(
    Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, canon(v[k])]));
  return v;
}
function rehash(m) {
  const copy = structuredClone(m);
  delete copy.integrity;
  return 'sha256:' + createHash('sha256').update(JSON.stringify(canon(copy))).digest('hex');
}
function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log('PASS ' + message);
}
check(newSchema.$id.endsWith('v1.0.1.schema.json'), 'new schema has its own identifier');
check(oldSchema.properties.jrs_version.minLength === 1 &&
  oldSchema.properties.codebook_version.minLength === 1, 'published v1.0 baseline is unchanged');
check(validateManifest(source, oldSchema).valid && validateManifest(source, newSchema).valid,
  'supported 1.0 manifest passes both schemas');
check(rehash(forged) === forged.integrity.manifest_hash,
  'forged fixture has a valid recalculated integrity hash');
check(validateManifest(forged, oldSchema).valid,
  'old schema accepts unsupported versions even after integrity verification');
const result = validateManifest(forged, newSchema);
check(!result.valid && result.integrity.startsWith('SELF-CONSISTENT') &&
  result.errors.some(e => e.includes('$.jrs_version')) &&
  result.errors.some(e => e.includes('$.codebook_version')),
  'v1.0.1 rejects both unsupported versions independently of the hash');
for (const field of ['jrs_version', 'codebook_version']) {
  const one = structuredClone(source);
  one[field] = '9.9';
  one.integrity.manifest_hash = rehash(one);
  check(validateManifest(one, oldSchema).valid &&
    !validateManifest(one, newSchema).valid,
    'v1.0.1 rejects unsupported ' + field + ' alone');
}
