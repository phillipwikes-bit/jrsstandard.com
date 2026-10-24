// JRS ENGINE RELIABILITY: append-only, hash-chained engineering knowledge register.
//
// One JSON object per line. Each entry carries the hash of the previous entry
// and its own hash over everything else, so an edit, deletion, insertion or
// reordering anywhere breaks the chain. New knowledge is appended; an earlier
// entry is never rewritten, and a later entry may supersede it by reference.
// The register holds engineering observations about synthetic scenarios only:
// no real record, customer data, external claim, personal data or contributor
// information.

import { REGISTER_FORMAT_VERSION, REGISTER_STATES, ENGINE_LAYERS, RISK_CATEGORIES, findForbiddenStatusWord } from './vocab.mjs';
import { hashOf } from './canonical.mjs';

export const GENESIS = 'sha256:' + '0'.repeat(64);
export const ENTRY_FIELDS = Object.freeze(['register_format_version', 'entry_id', 'date', 'origin', 'engine_layer', 'risk_category', 'scenarios', 'expected_behavior',
  'limitation', 'state', 'required_regression_suite', 'future_independent_evaluation_required', 'prev_hash', 'entry_hash']);
const OPTIONAL = ['supersedes', 'observed', 'note'];
const FORBIDDEN_KEYS = /^(?:contributor|author|author_name|email|phone|customer|employer|person|personal_data|real_record|claimant|address)$/i;
const PERSONAL = [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, /\+\d{1,3}[ -]?\(?\d{2,4}\)?[ -]?\d{3,4}[ -]?\d{3,4}\b/, /\b(?:Mr|Mrs|Ms|Dr)\.\s+[A-Z][a-z]+/, /https?:\/\//i];

export const entryHash = (e) => hashOf(Object.assign({}, e, { entry_hash: undefined }));

export function parseRegister(text) {
  return String(text).split('\n').filter((l) => l.trim()).map((l, i) => { try { return JSON.parse(l); } catch { return { __unparseable: i + 1 }; } });
}

export function validateEntry(e) {
  const p = [];
  if (!e || typeof e !== 'object' || Array.isArray(e)) return ['entry is not an object'];
  if (e.__unparseable) return ['line ' + e.__unparseable + ' is not JSON'];
  for (const k of ENTRY_FIELDS) if (e[k] === undefined || e[k] === null || e[k] === '') p.push('missing ' + k);
  for (const k of Object.keys(e)) { if (!ENTRY_FIELDS.includes(k) && !OPTIONAL.includes(k)) p.push('undeclared field ' + k); if (FORBIDDEN_KEYS.test(k)) p.push('forbidden field ' + k); }
  if (e.register_format_version !== REGISTER_FORMAT_VERSION) p.push('register format version mismatch');
  if (!/^P6K-\d{3}$/.test(String(e.entry_id))) p.push('entry_id must look like P6K-001');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date))) p.push('date must be YYYY-MM-DD');
  if (!ENGINE_LAYERS.includes(e.engine_layer)) p.push('unknown engine_layer');
  if (!RISK_CATEGORIES.includes(e.risk_category)) p.push('unknown risk_category');
  if (!REGISTER_STATES.includes(e.state)) p.push('unknown state');
  if (!Array.isArray(e.scenarios)) p.push('scenarios must be a list');
  else for (const s of e.scenarios) if (!/^(?:P6-[A-Z]{2}-\d{2}|P6-ST-\d{2}|P6-MU-\d{2}|proposed:[A-Za-z0-9 _-]{3,80})$/.test(s)) p.push('scenario reference not recognised: ' + s);
  if (typeof e.future_independent_evaluation_required !== 'boolean') p.push('future_independent_evaluation_required must be true or false');
  if (typeof e.limitation === 'string' && e.limitation.length < 20) p.push('limitation too short');
  const text = JSON.stringify(Object.assign({}, e, { prev_hash: undefined, entry_hash: undefined }));
  const w = findForbiddenStatusWord(text); if (w) p.push('forbidden status word ' + w);
  for (const re of PERSONAL) if (re.test(text)) p.push('personal-data-like or external reference text (' + re.source.slice(0, 16) + ')');
  return p;
}

export function validateRegister(text) {
  const entries = parseRegister(text), p = [];
  let prev = GENESIS; const ids = new Set();
  entries.forEach((e, i) => {
    for (const x of validateEntry(e)) p.push('entry ' + (i + 1) + ': ' + x);
    if (e.prev_hash !== prev) p.push('entry ' + (i + 1) + ': chain broken (prev_hash)');
    if (e.entry_hash !== entryHash(e)) p.push('entry ' + (i + 1) + ': entry hash does not match its content');
    if (ids.has(e.entry_id)) p.push('entry ' + (i + 1) + ': duplicate entry_id ' + e.entry_id);
    if (e.supersedes && !ids.has(e.supersedes)) p.push('entry ' + (i + 1) + ': supersedes an entry that is not earlier in the register');
    ids.add(e.entry_id); prev = e.entry_hash;
  });
  return p;
}

// Returns the new register text. Refuses if the existing register is invalid or the entry is invalid.
export function appendEntry(text, entry) {
  const existing = validateRegister(text);
  if (existing.length) throw new Error('register invalid before append: ' + existing[0]);
  const entries = parseRegister(text);
  const e = Object.assign({ register_format_version: REGISTER_FORMAT_VERSION }, entry, { prev_hash: entries.length ? entries[entries.length - 1].entry_hash : GENESIS });
  delete e.entry_hash; e.entry_hash = entryHash(e);
  const p = validateEntry(e); if (p.length) throw new Error('entry refused: ' + p.join('; '));
  if (entries.some((x) => x.entry_id === e.entry_id)) throw new Error('entry refused: duplicate entry_id ' + e.entry_id);
  const base = String(text); const next = (base && !base.endsWith('\n') ? base + '\n' : base) + JSON.stringify(e) + '\n';
  const after = validateRegister(next); if (after.length) throw new Error('entry refused: ' + after.join('; '));
  return next;
}

// A later register is acceptable only if it begins with every byte of the earlier one.
export function isAppendOnly(before, after) { return String(after).startsWith(String(before)) && validateRegister(after).length === 0; }
