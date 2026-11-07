// JRS ADAPTIVE RELIABILITY: the Reliability Knowledge Base.
//
// An append-only, hash-chained JSONL log of local engineering observations. An
// entry records what was seen and what safe behaviour would be. It is never a
// claim that anything is correct, and never a status that reads as approval.

import { createHash } from 'node:crypto';
import { SOURCE_TYPES, KB_STATUSES, FAILURE_CLASSES, EVIDENCE_LEVELS, CONDITIONS, findForbiddenWord } from './vocab.mjs';

export const KB_FIELDS = Object.freeze(['knowledge_id', 'created_at', 'source_type', 'source_reference', 'engine_version', 'contract_version', 'graph_version',
  'fixture_id', 'failure_class', 'observed_behavior', 'expected_safe_behavior', 'risk_description', 'affected_conditions', 'scope_boundary',
  'proposed_control', 'status', 'evidence_level', 'limitation', 'human_decision_required', 'supersedes']);
const OPTIONAL = new Set(['fixture_id', 'supersedes']);
const CHAIN = new Set(['prev_hash', 'entry_hash']);

const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
export function canonicalEntry(e) { return JSON.stringify(Object.fromEntries(Object.keys(e).filter((k) => !CHAIN.has(k)).sort().map((k) => [k, e[k]]))); }

export function validateKnowledgeEntry(e) {
  const p = [];
  if (!e || typeof e !== 'object' || Array.isArray(e)) return ['entry is not an object'];
  for (const k of KB_FIELDS) if (!OPTIONAL.has(k) && (e[k] === undefined || e[k] === null || e[k] === '')) p.push('missing ' + k);
  for (const k of Object.keys(e)) if (!KB_FIELDS.includes(k) && !CHAIN.has(k)) p.push('undeclared field ' + k);
  if (e.knowledge_id !== undefined && !/^RKB-\d{3,}$/.test(e.knowledge_id)) p.push('knowledge_id must look like RKB-001');
  if (e.created_at !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(e.created_at)) p.push('created_at must be a date');
  if (e.source_type !== undefined && !SOURCE_TYPES.includes(e.source_type)) p.push('source_type not permitted: ' + e.source_type);
  if (e.status !== undefined && !KB_STATUSES.includes(e.status)) p.push('status not permitted: ' + e.status);
  if (e.failure_class !== undefined && !FAILURE_CLASSES.includes(e.failure_class)) p.push('failure_class not permitted: ' + e.failure_class);
  if (e.evidence_level !== undefined && !EVIDENCE_LEVELS.includes(e.evidence_level)) p.push('evidence_level not permitted: ' + e.evidence_level);
  if (e.affected_conditions !== undefined && (!Array.isArray(e.affected_conditions) || e.affected_conditions.some((c) => !CONDITIONS.includes(c) && c !== 'none')))
    p.push('affected_conditions must list known conditions or "none"');
  if (e.human_decision_required !== undefined && e.human_decision_required !== true) p.push('human_decision_required must be true');
  if (e.supersedes !== undefined && e.supersedes !== null && !/^RKB-\d{3,}$/.test(e.supersedes)) p.push('supersedes must name a knowledge_id');
  for (const [k, v] of Object.entries(e)) {
    if (CHAIN.has(k)) continue;
    const w = findForbiddenWord(typeof v === 'string' ? v : JSON.stringify(v)); if (w) p.push(k + ' uses forbidden wording "' + w + '"');
  }
  return p;
}

export function appendKnowledgeEntry(existingText, entry) {
  const problems = validateKnowledgeEntry(entry);
  if (problems.length) throw new Error('knowledge entry refused: ' + problems.join('; '));
  const lines = existingText.split('\n').filter(Boolean);
  const prev = lines.length ? JSON.parse(lines[lines.length - 1]).entry_hash : 'sha256:' + '0'.repeat(64);
  if (lines.some((l) => JSON.parse(l).knowledge_id === entry.knowledge_id)) throw new Error('knowledge entry refused: duplicate ' + entry.knowledge_id);
  const out = Object.assign({}, entry, { prev_hash: prev });
  out.entry_hash = sha(prev + canonicalEntry(entry));
  return existingText + JSON.stringify(out) + '\n';
}

export function parseKnowledgeBase(text) { return text.split('\n').filter(Boolean).map((l) => JSON.parse(l)); }

export function validateKnowledgeBase(text) {
  const p = []; let prev = 'sha256:' + '0'.repeat(64); const seen = new Set();
  const entries = parseKnowledgeBase(text);
  entries.forEach((e, i) => {
    for (const x of validateKnowledgeEntry(Object.fromEntries(Object.entries(e).filter(([k]) => !CHAIN.has(k))))) p.push('line ' + (i + 1) + ': ' + x);
    if (seen.has(e.knowledge_id)) p.push('line ' + (i + 1) + ': duplicate ' + e.knowledge_id); seen.add(e.knowledge_id);
    if (e.prev_hash !== prev) p.push('line ' + (i + 1) + ': chain broken (prev_hash)');
    if (e.entry_hash !== sha(e.prev_hash + canonicalEntry(e))) p.push('line ' + (i + 1) + ': entry hash mismatch (entry edited)');
    if (e.supersedes && !seen.has(e.supersedes)) p.push('line ' + (i + 1) + ': supersedes unknown or later entry ' + e.supersedes);
    prev = e.entry_hash;
  });
  return p;
}
