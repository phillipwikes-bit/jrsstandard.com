// Methodology integrity: register rules. INTERNAL, LOCAL ONLY.
//
// The schema checks shape. These rules check meaning:
//   - an approved record needs a CANONICAL source, that source's current reviewed hash, a term the
//     source actually defines, an exact source location, a real mapping type, and an owner approval
//     with an approver, a real date and an approval reference that exists in the repository;
//   - an unapproved record may not use EXACT_LABEL or DOCUMENTED_ALIAS, may not carry any approval
//     field, and may not name an authoritative term (only a JRS_CONDITION record names its own);
//   - every source-bound record carries the hash of its source as reviewed; a different hash is drift.
import { checkSchema } from './schema-check.js';

export const STATUSES = Object.freeze(['APPROVED_CORRESPONDENCE', 'UNMAPPED', 'PROPOSED_NOT_APPROVED', 'HISTORICAL_REFERENCE_ONLY', 'NOT_ASSESSED', 'RETIRED']);
export const MAPPING_TYPES = Object.freeze(['EXACT_LABEL', 'DOCUMENTED_ALIAS', 'IMPLEMENTATION_REFERENCE', 'DISPLAY_LABEL', 'NO_CORRESPONDENCE_ASSERTED']);
export const APPROVAL_ONLY_TYPES = Object.freeze(['EXACT_LABEL', 'DOCUMENTED_ALIAS']);
export const NOTICE = 'No Codebook correspondence asserted.';
export const NOT_CURRENT = Object.freeze(['RETIRED', 'HISTORICAL_REFERENCE_ONLY']);
const HEX64 = /^[0-9a-f]{64}$/;

export function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

// sources: [{ id, status, sha256, condition_locations? }]; exists(path) -> boolean.
export function validateRecord(r, { schema, sources, exists }) {
  const where = (r && r.correspondence_id) || 'record';
  const problems = checkSchema(schema, r, where);
  if (problems.length) return problems;
  const src = r.methodology_source_id ? sources.find((s) => s.id === r.methodology_source_id) : null;
  if (r.methodology_source_id && !src) problems.push(where + ': names an unknown methodology source');
  if (!r.methodology_source_id && r.methodology_source_sha256 !== null) problems.push(where + ': a source hash without a source');
  if (src && r.methodology_source_sha256 !== src.sha256) problems.push(where + ': source hash does not match the reviewed hash of ' + src.id + ' (drift)');
  const a = r.owner_approval;
  if (r.status === 'APPROVED_CORRESPONDENCE') {
    if (!src) problems.push(where + ': approved without a methodology source');
    else if (src.status !== 'CANONICAL') problems.push(where + ': approved against a source that is not CANONICAL');
    if (!HEX64.test(r.methodology_source_sha256 || '')) problems.push(where + ': approved without a source hash');
    if (!r.authoritative_source_term) problems.push(where + ': approved without an authoritative source term');
    else if (src && !(src.condition_locations && Object.prototype.hasOwnProperty.call(src.condition_locations, r.authoritative_source_term))) problems.push(where + ': approved against a term the source does not define');
    if (!r.source_reference) problems.push(where + ': approved without an exact source reference');
    if (r.mapping_type === 'NO_CORRESPONDENCE_ASSERTED') problems.push(where + ': approved with no correspondence type');
    if (a.approved !== true) problems.push(where + ': approved status without owner approval');
    if (!a.approver) problems.push(where + ': approved without an approver');
    if (!isRealDate(a.approval_date)) problems.push(where + ': approved without an owner approval date');
    if (!a.approval_reference) problems.push(where + ': approved without an approval reference');
    else if (!exists(a.approval_reference)) problems.push(where + ': approval reference is not a file in the repository');
    if (r.proposal !== null) problems.push(where + ': an approved record carries an open proposal');
  } else {
    if (APPROVAL_ONLY_TYPES.includes(r.mapping_type)) problems.push(where + ': ' + r.mapping_type + ' requires an approved record');
    if (a.approved !== false || a.approver !== null || a.approval_date !== null || a.approval_reference !== null) problems.push(where + ': owner approval fields set on an unapproved record');
    if (r.authoritative_source_term !== null && r.term_category !== 'JRS_CONDITION') problems.push(where + ': an unapproved record names an authoritative term');
    if (r.term_category !== 'JRS_CONDITION' && !r.limitation.includes(NOTICE)) problems.push(where + ': limitation must state "' + NOTICE + '"');
    if (r.status === 'PROPOSED_NOT_APPROVED') {
      if (!r.proposal) problems.push(where + ': a proposal record without its proposal');
      else if (!sources.some((s) => s.id === r.proposal.proposed_source_id)) problems.push(where + ': proposal names an unknown source');
    } else if (r.proposal !== null) problems.push(where + ': a proposal on a record that is not PROPOSED_NOT_APPROVED');
    if (r.status === 'RETIRED' && r.change_history.length < 2) problems.push(where + ': a retired record must record its retirement');
  }
  for (const h of r.change_history) if (!isRealDate(h.date)) problems.push(where + ': change history date is not a real date');
  return problems;
}

export function validateRegister(register, ctx) {
  const problems = [];
  if (!register || !Array.isArray(register.records)) return ['register: no records'];
  const ids = new Set(), current = new Map();
  for (const r of register.records) {
    problems.push(...validateRecord(r, ctx));
    if (!r || typeof r !== 'object') continue;
    if (ids.has(r.correspondence_id)) problems.push(r.correspondence_id + ': duplicate correspondence id');
    ids.add(r.correspondence_id);
    if (!NOT_CURRENT.includes(r.status)) {
      const k = r.term_category + ' ' + r.candidate_term;
      if (current.has(k)) problems.push(r.correspondence_id + ': a second current record for ' + k + ' (' + current.get(k) + ')');
      current.set(k, r.correspondence_id);
    }
  }
  return problems;
}

// vocab: { CATEGORY: [term, ...] } from the live modules. Every live term needs a current record,
// and every current record in a covered category must name a live term.
export function completeness(register, vocab) {
  const problems = [];
  for (const [cat, terms] of Object.entries(vocab)) {
    const cur = register.records.filter((r) => r.term_category === cat && !NOT_CURRENT.includes(r.status)).map((r) => r.candidate_term);
    for (const t of terms) if (!cur.includes(t)) problems.push(cat + ' ' + t + ': no current correspondence record');
    for (const t of cur) if (!terms.includes(t)) problems.push(cat + ' ' + t + ': record names a term the live module no longer has');
  }
  return problems;
}

export function statusSummary(records) {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of records) out[r.status] += 1;
  return out;
}
