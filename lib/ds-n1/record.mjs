// Input validation and scope gate for a ds-n1.record/1.0 package.
// Record text and source text are UNTRUSTED DATA. Nothing here executes,
// interprets or follows instructions found inside them.
import {
  RECORD_SCHEMA, LIMITS, ALLOWED_RECORD_CLASSES, EXCLUDED_RECORD_CLASSES,
  ALLOWED_DATA_CLASSIFICATIONS, STATUS,
} from './identity.mjs';
import { nfc, sha256, canonical } from './text.mjs';

const ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLAIM_KINDS = ['fact', 'conclusion', 'chronology', 'authority'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';

function validDate(s) {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Returns { status, errors[], record? }. status is null when the package is
// structurally valid and in scope; detection then decides the review status.
export function validateRecord(input) {
  const errors = [];
  const err = (code, path, detail) => errors.push({ code, path, detail });
  if (!isObj(input)) return { status: STATUS.ERROR, errors: [{ code: 'NOT_AN_OBJECT', path: '$', detail: 'Record package must be a JSON object' }] };
  if (input.schema !== RECORD_SCHEMA) {
    return { status: STATUS.ERROR, errors: [{ code: 'UNSUPPORTED_SCHEMA', path: '$.schema', detail: `Expected ${RECORD_SCHEMA}, received ${JSON.stringify(input.schema)}` }] };
  }

  // Scope gate first: an out-of-scope record is refused before any analysis.
  if (EXCLUDED_RECORD_CLASSES.includes(input.record_class)) {
    return { status: STATUS.REFUSED, errors: [{ code: 'EXCLUDED_RECORD_CLASS', path: '$.record_class', detail: `${input.record_class} records are excluded from DS-N1 scope` }] };
  }
  if (!ALLOWED_RECORD_CLASSES.includes(input.record_class)) {
    return { status: STATUS.REFUSED, errors: [{ code: 'UNSUPPORTED_RECORD_CLASS', path: '$.record_class', detail: `Supported classes: ${ALLOWED_RECORD_CLASSES.join(', ')}` }] };
  }
  if (!ALLOWED_DATA_CLASSIFICATIONS.includes(input.data_classification)) {
    return { status: STATUS.REFUSED, errors: [{ code: 'DATA_CLASSIFICATION_NOT_PERMITTED', path: '$.data_classification', detail: 'DS-N1 processes constructed fictional records only. Real, confidential or regulated records are not authorised.' }] };
  }

  const idOk = (v, path) => {
    if (!isStr(v) || !v || v.length > LIMITS.id_max || !ID.test(v)) { err('INVALID_ID', path, 'IDs are 1-64 characters [A-Za-z0-9._-]'); return false; }
    return true;
  };
  idOk(input.record_id, '$.record_id');
  if (!isStr(input.record_version) || !input.record_version) err('MISSING_FIELD', '$.record_version', 'record_version is required');
  if (!isStr(input.title)) err('MISSING_FIELD', '$.title', 'title is required');
  if (!isStr(input.text)) err('MISSING_FIELD', '$.text', 'text is required');
  else if (input.text.length > LIMITS.record_text_max) err('TOO_LARGE', '$.text', `record text exceeds ${LIMITS.record_text_max} characters`);

  const entities = input.entities === undefined ? [] : input.entities;
  const entityIds = new Set();
  if (!Array.isArray(entities)) err('INVALID_TYPE', '$.entities', 'entities must be an array');
  else entities.forEach((e, i) => {
    const p = `$.entities[${i}]`;
    if (!isObj(e)) return err('INVALID_TYPE', p, 'entity must be an object');
    if (idOk(e.entity_id, p + '.entity_id')) {
      if (entityIds.has(e.entity_id)) err('DUPLICATE_ID', p + '.entity_id', `duplicate entity ${e.entity_id}`);
      entityIds.add(e.entity_id);
    }
    if (!isStr(e.name) || !e.name.trim()) err('MISSING_FIELD', p + '.name', 'entity name is required');
    if (e.aliases !== undefined && (!Array.isArray(e.aliases) || !e.aliases.every(isStr))) err('INVALID_TYPE', p + '.aliases', 'aliases must be strings');
  });

  const sourceIds = new Set();
  if (!Array.isArray(input.sources)) err('INVALID_TYPE', '$.sources', 'sources must be an array');
  else {
    if (input.sources.length > LIMITS.sources_max) err('TOO_LARGE', '$.sources', `more than ${LIMITS.sources_max} sources`);
    input.sources.forEach((s, i) => {
      const p = `$.sources[${i}]`;
      if (!isObj(s)) return err('INVALID_TYPE', p, 'source must be an object');
      if (idOk(s.source_id, p + '.source_id')) {
        if (sourceIds.has(s.source_id)) err('DUPLICATE_ID', p + '.source_id', `duplicate source ${s.source_id}`);
        sourceIds.add(s.source_id);
      }
      if (!isStr(s.title)) err('MISSING_FIELD', p + '.title', 'source title is required');
      if (!isStr(s.version) || !s.version) err('MISSING_FIELD', p + '.version', 'source version identity is required');
      if (!isStr(s.text)) err('MISSING_FIELD', p + '.text', 'source text is required');
      else if (s.text.length > LIMITS.source_text_max) err('TOO_LARGE', p + '.text', 'source text too large');
      if (s.events !== undefined) {
        if (!Array.isArray(s.events)) err('INVALID_TYPE', p + '.events', 'events must be an array');
        else s.events.forEach((ev, j) => {
          if (!isObj(ev) || !isStr(ev.role) || !ev.role || !isStr(ev.date) || !validDate(ev.date)) err('INVALID_EVENT', `${p}.events[${j}]`, 'event needs role and a valid YYYY-MM-DD date');
          if (isObj(ev) && ev.actor !== undefined && !entityIds.has(ev.actor)) err('UNKNOWN_REFERENCE', `${p}.events[${j}].actor`, `unknown entity ${ev.actor}`);
        });
      }
    });
  }

  const claimIds = new Set();
  if (!Array.isArray(input.claims)) err('INVALID_TYPE', '$.claims', 'claims must be an array');
  else {
    if (input.claims.length > LIMITS.claims_max) err('TOO_LARGE', '$.claims', `more than ${LIMITS.claims_max} claims`);
    input.claims.forEach((c, i) => {
      const p = `$.claims[${i}]`;
      if (!isObj(c)) return err('INVALID_TYPE', p, 'claim must be an object');
      if (idOk(c.claim_id, p + '.claim_id')) {
        if (claimIds.has(c.claim_id)) err('DUPLICATE_ID', p + '.claim_id', `duplicate claim ${c.claim_id}`);
        claimIds.add(c.claim_id);
      }
      if (!isStr(c.quote) || !c.quote.trim()) err('MISSING_FIELD', p + '.quote', 'claim quote (exact text in the record) is required');
      if (!CLAIM_KINDS.includes(c.kind)) err('INVALID_VALUE', p + '.kind', `kind must be one of ${CLAIM_KINDS.join(', ')}`);
      if (c.actor !== undefined && !entityIds.has(c.actor)) err('UNKNOWN_REFERENCE', p + '.actor', `unknown entity ${c.actor}`);
      if (c.event !== undefined && (!isObj(c.event) || !isStr(c.event.role) || !c.event.role || !isStr(c.event.date) || !validDate(c.event.date))) err('INVALID_EVENT', p + '.event', 'event needs role and a valid YYYY-MM-DD date');
      if (c.reasoning !== undefined && !isStr(c.reasoning)) err('INVALID_TYPE', p + '.reasoning', 'reasoning must be a string');
      const cites = c.citations === undefined ? [] : c.citations;
      if (!Array.isArray(cites)) err('INVALID_TYPE', p + '.citations', 'citations must be an array');
      else {
        if (cites.length > LIMITS.citations_per_claim_max) err('TOO_LARGE', p + '.citations', 'too many citations');
        cites.forEach((ct, j) => {
          if (!isObj(ct) || !isStr(ct.source_id) || !isStr(ct.quote) || !ct.quote.trim()) err('INVALID_CITATION', `${p}.citations[${j}]`, 'citation needs source_id and a non-empty quote');
        });
      }
    });
  }

  if (errors.length) return { status: STATUS.ERROR, errors };

  // Normalised, frozen working copy. The original input is preserved by the
  // caller; digests here are over the canonical normalised form.
  const record = {
    schema: input.schema,
    record_id: input.record_id,
    record_version: input.record_version,
    record_class: input.record_class,
    data_classification: input.data_classification,
    title: nfc(input.title),
    text: nfc(input.text),
    entities: entities.map((e) => ({ entity_id: e.entity_id, name: nfc(e.name), aliases: (e.aliases || []).map(nfc) })),
    sources: input.sources.map((s) => ({
      source_id: s.source_id, title: nfc(s.title), version: s.version, text: nfc(s.text),
      events: (s.events || []).map((ev) => ({ role: ev.role, date: ev.date, ...(ev.actor ? { actor: ev.actor } : {}) })),
      digest: sha256(nfc(s.text)),
    })),
    claims: input.claims.map((c) => ({
      claim_id: c.claim_id, quote: nfc(c.quote), kind: c.kind,
      ...(c.actor ? { actor: c.actor } : {}),
      ...(c.event ? { event: { role: c.event.role, date: c.event.date } } : {}),
      ...(isStr(c.reasoning) && c.reasoning.trim() ? { reasoning: nfc(c.reasoning) } : {}),
      citations: (c.citations || []).map((ct) => ({ source_id: ct.source_id, quote: nfc(ct.quote) })),
    })),
  };
  record.record_digest = sha256(canonical({ ...record, record_digest: undefined }));
  return { status: null, errors: [], record };
}
