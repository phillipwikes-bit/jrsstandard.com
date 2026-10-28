// JRS EVIDENCE GRAPH 0.3.3-research-candidate: rule-pack loading and validation (0.3.2 logic; the implemented-rule
// list is a parameter so the research profile can validate its own packs against its own rules).
//
// A Phase 7 rule is active only when it is listed in a valid rule pack. A pack
// set is rejected as a whole if any pack is malformed, unsigned or carries a
// wrong signature, duplicates a pack or rule identifier, is incomplete, names
// another candidate version, names a rule this candidate does not implement,
// or tries to carry a release, approval or production designation. A rejected
// set makes the compiler refuse every record (fail closed); it never falls back
// to a partial set.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPILER_VERSION } from './contract.mjs';

export const IMPLEMENTED_RULES = Object.freeze(['RP-STR-01', 'RP-CHR-01', 'RP-CHR-02', 'RP-CHR-03', 'RP-CHR-04', 'RP-NEG-01', 'RP-EVL-01', 'RP-CON-01', 'RP-SCO-01', 'RP-CON-02']);
export const PACK_FIELDS = Object.freeze(['pack_id', 'pack_version', 'candidate_version', 'purpose', 'rules', 'signature']);
export const RULE_FIELDS = Object.freeze(['rule_id', 'purpose', 'trigger', 'expected_safe_outcome', 'limitation', 'false_positive_risk', 'linked_scenarios', 'owner_decision_for_expansion']);
export const SAFE_OUTCOMES = Object.freeze(['review_required', 'refusal', 'conflict_and_review', 'assertion_withheld_and_review']);
const FORBIDDEN_DESIGNATION = /(?:release|auto[-_ ]?approv|approve|production|deploy|go[-_ ]?live|ready)/i;
const DIR = fileURLToPath(new URL('./rule-packs/', import.meta.url));

function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map((x) => canonical(x === undefined ? null : x)).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
}
export const contentSeal = (pack) => 'sha256:' + createHash('sha256').update(canonical(Object.assign({}, pack, { signature: undefined })), 'utf8').digest('hex');

export function validateRulePacks(packs, implemented = IMPLEMENTED_RULES) {
  const p = [], packIds = new Set(), ruleIds = new Set();
  if (!Array.isArray(packs) || !packs.length) return { ok: false, problems: ['no rule packs supplied'], active: new Set(), identity: [] };
  packs.forEach((k, i) => {
    const at = 'pack ' + (k && k.pack_id ? k.pack_id : i);
    if (!k || typeof k !== 'object' || Array.isArray(k)) { p.push(at + ': not an object'); return; }
    for (const f of PACK_FIELDS) if (k[f] === undefined || k[f] === null || k[f] === '') p.push(at + ': missing ' + f);
    for (const f of Object.keys(k)) if (!PACK_FIELDS.includes(f)) p.push(at + ': undeclared field ' + f);
    if (packIds.has(k.pack_id)) p.push(at + ': duplicate pack_id'); packIds.add(k.pack_id);
    if (k.candidate_version !== COMPILER_VERSION) p.push(at + ': candidate_version ' + JSON.stringify(k.candidate_version) + ' does not match ' + COMPILER_VERSION);
    if (typeof k.pack_version !== 'string' || !/^\d+\.\d+\.\d+$/.test(k.pack_version)) p.push(at + ': pack_version malformed');
    if (!k.signature || k.signature.method !== 'sha256-canonical-content-seal' || typeof k.signature.content_sha256 !== 'string') p.push(at + ': unsigned');
    else if (k.signature.content_sha256 !== contentSeal(k)) p.push(at + ': signature does not match content');
    if (!Array.isArray(k.rules) || !k.rules.length) { p.push(at + ': no rules'); return; }
    for (const r of k.rules) {
      const rid = r && r.rule_id;
      if (!r || typeof r !== 'object') { p.push(at + ': rule not an object'); continue; }
      for (const f of RULE_FIELDS) if (r[f] === undefined || r[f] === null || r[f] === '' || (Array.isArray(r[f]) && !r[f].length)) p.push(at + ' ' + rid + ': missing ' + f);
      for (const f of Object.keys(r)) { if (!RULE_FIELDS.includes(f)) p.push(at + ' ' + rid + ': undeclared field ' + f); if (FORBIDDEN_DESIGNATION.test(f)) p.push(at + ' ' + rid + ': forbidden designation field ' + f); }
      if (!implemented.includes(rid)) p.push(at + ': rule ' + rid + ' is not implemented by this candidate');
      if (ruleIds.has(rid)) p.push(at + ': duplicate rule ' + rid); ruleIds.add(rid);
      if (!SAFE_OUTCOMES.includes(r.expected_safe_outcome)) p.push(at + ' ' + rid + ': expected_safe_outcome must be one of ' + SAFE_OUTCOMES.join(', '));
    }
  });
  const ok = p.length === 0;
  return { ok, problems: p, active: ok ? ruleIds : new Set(), identity: ok ? packs.map((k) => ({ pack_id: k.pack_id, pack_version: k.pack_version, content_sha256: k.signature.content_sha256 })).sort((a, b) => (a.pack_id < b.pack_id ? -1 : 1)) : [] };
}

let cache = null;
export function loadRulePacks() {
  if (!cache) {
    try { cache = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(DIR + f, 'utf8'))); }
    catch { cache = []; }
  }
  return cache;
}
