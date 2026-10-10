// JRS internal release-gate package: structural check against the record schema.
// INTERNAL ONLY. No network, no environment, no file access beyond the schema beside this file.
//
// A SUBSET JSON Schema checker, said plainly. It implements only the keywords the release-gate
// schema uses and FAILS CLOSED on any other keyword, so the schema cannot quietly gain a rule
// this checker ignores. It is not a general JSON Schema implementation.
import { readFileSync } from 'node:fs';

export const SCHEMA = JSON.parse(readFileSync(new URL('./schema/release-gate-record.schema.json', import.meta.url), 'utf8'));

const KNOWN = new Set(['$schema', '$id', 'title', 'description', '$defs', '$ref', 'type', 'required', 'properties',
  'additionalProperties', 'enum', 'const', 'pattern', 'minLength', 'maxLength', 'minItems', 'items', 'oneOf']);

const typeOf = (v) => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'number' ? (Number.isInteger(v) ? 'integer' : 'number') : typeof v;

function resolve(root, ref) {
  if (!/^#\/\$defs\/[A-Za-z0-9_]+$/.test(ref)) throw new Error('unsupported $ref ' + ref);
  const def = root.$defs && root.$defs[ref.slice(8)];
  if (!def) throw new Error('unresolved $ref ' + ref);
  return def;
}

function check(root, node, value, path, errors) {
  for (const k of Object.keys(node)) if (!KNOWN.has(k)) { errors.push(path + ': schema uses unsupported keyword ' + k); return; }
  if (node.$ref) return check(root, resolve(root, node.$ref), value, path, errors);
  if (node.oneOf) {
    const passing = node.oneOf.filter((alt) => { const e = []; check(root, alt, value, path, e); return e.length === 0; });
    if (passing.length !== 1) {
      // Report the closest alternative's errors so a malformed object says why.
      const scored = node.oneOf.map((alt) => { const e = []; check(root, alt, value, path, e); return e; }).sort((a, b) => a.length - b.length);
      errors.push(...(passing.length > 1 ? [path + ': matches more than one alternative'] : scored[0]));
    }
    return;
  }
  const t = typeOf(value);
  if (node.type) {
    const allowed = Array.isArray(node.type) ? node.type : [node.type];
    if (!allowed.includes(t) && !(t === 'integer' && allowed.includes('number'))) { errors.push(path + ': expected ' + allowed.join(' or ') + ', got ' + t); return; }
  }
  if ('const' in node && value !== node.const) errors.push(path + ': must be ' + JSON.stringify(node.const));
  if (node.enum && !node.enum.includes(value)) errors.push(path + ': ' + JSON.stringify(value) + ' is not one of ' + node.enum.join(', '));
  if (t === 'string') {
    if (node.minLength !== undefined && value.length < node.minLength) errors.push(path + ': shorter than ' + node.minLength);
    if (node.maxLength !== undefined && value.length > node.maxLength) errors.push(path + ': longer than ' + node.maxLength);
    if (node.pattern && !new RegExp(node.pattern).test(value)) errors.push(path + ': does not match ' + node.pattern);
  }
  if (t === 'array') {
    if (node.minItems !== undefined && value.length < node.minItems) errors.push(path + ': fewer than ' + node.minItems + ' items');
    if (node.items) value.forEach((v, i) => check(root, node.items, v, path + '[' + i + ']', errors));
  }
  if (t === 'object') {
    for (const r of node.required || []) if (!(r in value)) errors.push(path + ': missing required field ' + r);
    const props = node.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) check(root, props[k], v, path + '.' + k, errors);
      else if (node.additionalProperties === false) errors.push(path + ': unknown field ' + k);
    }
  }
}

export function schemaErrors(record, schema = SCHEMA) {
  const errors = [];
  try { check(schema, schema, record, '$', errors); } catch (e) { errors.push('$: ' + e.message); }
  return errors;
}
