// Methodology integrity: a small JSON-schema subset checker. INTERNAL, LOCAL ONLY.
// Supports exactly: type (one or a list), enum, pattern, minLength, minItems, required,
// properties, additionalProperties:false, items. Any other keyword fails closed, so a schema
// cannot quietly carry a rule this checker does not enforce.
const KNOWN = new Set(['$schema', '$id', 'title', 'description', 'type', 'enum', 'pattern', 'minLength', 'minItems', 'required', 'properties', 'additionalProperties', 'items']);
const typeOf = (v) => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

export function checkSchema(schema, value, where = '$', problems = []) {
  for (const k of Object.keys(schema)) if (!KNOWN.has(k)) { problems.push(where + ': schema keyword not supported (' + k + ')'); return problems; }
  if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) problems.push(where + ': only additionalProperties:false is supported');
  if (schema.type) {
    const types = [].concat(schema.type), t = typeOf(value);
    if (!types.includes(t) && !(t === 'integer' && types.includes('number'))) { problems.push(where + ': expected ' + types.join(' or ') + ', found ' + t); return problems; }
  }
  if (schema.enum && !schema.enum.includes(value)) problems.push(where + ': not an allowed value');
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) problems.push(where + ': too short');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) problems.push(where + ': does not match its pattern');
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) problems.push(where + ': too few items');
    if (schema.items) value.forEach((v, i) => checkSchema(schema.items, v, where + '[' + i + ']', problems));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const r of schema.required || []) if (!(r in value)) problems.push(where + ': missing ' + r);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      if (props[k]) checkSchema(props[k], v, where + '.' + k, problems);
      else if (schema.additionalProperties === false) problems.push(where + ': unexpected field ' + k);
    }
  }
  return problems;
}
