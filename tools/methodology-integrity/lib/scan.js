// Methodology integrity: vocabulary scanner rules. INTERNAL, LOCAL ONLY.
//
// Finds text that gives a candidate, workspace, Manifest or research term the standing of a
// methodology condition or a Codebook term, and classifies each hit. It is a line-level heuristic: it cannot read
// meaning, so anything it cannot place is AMBIGUOUS_REVIEW_REQUIRED for a person, never ALLOWED.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

export const DISPOSITIONS = Object.freeze(['ALLOWED', 'REQUIRES_APPROVED_RECORD', 'UNSUPPORTED_MAPPING', 'HISTORICAL_ONLY', 'AMBIGUOUS_REVIEW_REQUIRED']);
export const CANDIDATE_KEYS = Object.freeze(['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity', 'accountability_support', 'temporal_reconstructability']);
export const CANDIDATE_TERMS = Object.freeze([...CANDIDATE_KEYS, 'missing_logical_bridge', 'missing_identifiable_basis', 'chronology_gap', 'unsupported_conclusion', 'insufficient_evidence',
  'reasoning_elision', 'evidentiary_overreach', 'chronology_collapse', 'unsupported_content', 'extraction_omission']);
export const SOURCE_PREP_TERMS = Object.freeze(['placeholder', 'referenced_material_not_in_record', 'profile_element_not_found', 'off_record_reference', 'assertion_without_basis', 'pages_missing',
  'ends_mid_sentence', 'ends_with_ellipsis', 'explicit_truncation_marker', 'unclosed_quotation', 'instruction_like_text']);
export const CODEBOOK_LABELS = Object.freeze(['Reconstructability', 'Basis Identification', 'Chronology', 'Decision-Process Traceability', 'Evidentiary Sufficiency']);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const any = (list) => new RegExp('(?<![A-Za-z_])(' + list.map(esc).join('|') + ')(?![A-Za-z_])');
const RE_KEY = any(CANDIDATE_KEYS), RE_TERM = any(CANDIDATE_TERMS);
const RE_LABEL = new RegExp('(' + CODEBOOK_LABELS.map(esc).join('|') + ')(?![a-z])|\\bRC\\s?[1-5]\\b');
const RE_PREP = new RegExp(any(SOURCE_PREP_TERMS).source + '|source[- ]prep(aration)?\\b', 'i');
const RE_JRS_COND = /\bJRS\s+(review\s+)?conditions?\b|\bCodebook\s+(conditions?|terms?|labels?)\b/i;

// [classification, regex, applies(line, window)] in priority order.
export const RULES = Object.freeze([
  ['JRS_CONDITION_CLAIM', /\b(is|are|as|be|being|becomes?|counts? as|treated as)\s+(not\s+)?(a|an|the|one of the)?\s*(sixth\s+|five\s+)?(JRS|Codebook)\s+(review\s+)?conditions?\b/i, (l) => RE_TERM.test(l) || /\b(key|keys|candidate|prompt|engine)\b/i.test(l)],
  ['MAPPING_PHRASE', /\b(maps?|mapped|mapping)\s+(on)?to\b|\bequivalent\s+to\b|\bcorrespond(s|ing)?\s+(to|with)\b|\bcrosswalk(ed)?\s+to\b|\bsame\s+as\b|(?<!-)(→|->|=>)/i, (l) => RE_TERM.test(l) && (RE_LABEL.test(l) || RE_JRS_COND.test(l))],
  ['IMPLEMENTS_CODEBOOK_TERM', new RegExp('\\bimplements?\\s+(the\\s+)?(JRS\\s+|Codebook\\s+)?(' + CODEBOOK_LABELS.map(esc).join('|') + '|Codebook|JRS\\s+conditions?)', 'i'), () => true],
  ['FIVE_CONDITIONS_FOR_KEYS', /\b(the\s+)?(JRS\s+)?five\s+(JRS\s+)?(review\s+)?conditions\b/i, (l, w) => (w.match(new RegExp(RE_KEY.source, 'g')) || []).length >= 2],
  ['SOURCE_PREP_AS_DETERMINATION', /\bJRS\s+(finding|determination|condition|result|routing)s?\b|\b(contextual|substantive|methodological)\s+(JRS\s+)?determinations?\b/i, (l) => RE_PREP.test(l)],
  ['CORRESPONDENCE_CLAIM', /\bha(s|ve)\s+(an?\s+)?(exact|established|formal|direct|approved)\s+(Codebook\s+|JRS\s+)?(correspondence|mapping|equivalent)\b/i, (l) => RE_TERM.test(l)],
  ['KEY_BESIDE_CODEBOOK_LABEL', RE_LABEL, (l) => RE_KEY.test(l)],
]);

const NO_CORRESPONDENCE = /no\s+(Codebook\s+)?correspondence\s+(is\s+)?asserted|NO_CORRESPONDENCE_ASSERTED|\bnot_asserted\b|no established (Codebook )?correspondence/i;
const NEGATION = /\b(not|no|never|nor|neither|without|cannot|isn't|aren't|refuses?|refused|MUST NOT|must not|rather than|instead of)\b/i;
const HISTORICAL_MARK = /\b(HISTORICAL|SUPERSEDED)\b(?!_)|^#+.*\b[Hh]istorical\b/;
const IDENTIFIED = /[\w./-]+\.(md|html|pdf|js|json|mjs)\b|\b(B?D-\d{1,2}|BD-\d{2})\b/;
const PROPOSAL = /\b(propos(ed|al)|declared|BD-04|D-3|intended mapping)\b/i;

// The clause before the match: back to a comma on the same line, or back to the start of the
// sentence across up to two earlier lines (a sentence wrapped in a Markdown or comment block).
function clauseBefore(lines, i, idx) {
  const head = lines[i].slice(0, idx), local = Math.max(head.lastIndexOf(', '), head.lastIndexOf('|'));
  if (local >= 0) return head.slice(local + 1);
  let prefix = head;
  for (let k = i - 1; k >= Math.max(0, i - 2); k--) {
    const prev = lines[k].replace(/^\s*(\/\/|>|\*)?\s*/, '');
    if (!prev.trim() || /^\s*(#|\|)/.test(lines[k])) break;
    prefix = prev + ' ' + prefix;
  }
  const cut = Math.max(prefix.lastIndexOf('. '), prefix.lastIndexOf('; '), prefix.lastIndexOf(': '));
  return prefix.slice(cut + 1);
}
function inQuotes(line, idx) {
  const before = line.slice(0, idx);
  return ((before.match(/"/g) || []).length % 2 === 1) || (before.lastIndexOf('“') > before.lastIndexOf('”'));
}

// approvedIds: correspondence ids of APPROVED_CORRESPONDENCE records.
// A reviewed entry may permit (ALLOWED, HISTORICAL_ONLY) or acknowledge an ambiguity it cannot
// resolve (AMBIGUOUS_REVIEW_REQUIRED stays visible and is reported for owner review).
export const REVIEWABLE = Object.freeze(['ALLOWED', 'HISTORICAL_ONLY', 'AMBIGUOUS_REVIEW_REQUIRED']);
// reviewed: entries of reviewed-dispositions.json; used: a Set that collects the entries applied.
export function scanText(text, file, { approvedIds = [], reviewed = [], used = new Set() } = {}) {
  const lines = text.split('\n'), out = [];
  let historical = false;
  lines.forEach((line, i) => {
    if (HISTORICAL_MARK.test(line)) historical = true;
    const window = lines.slice(i, i + 3).join(' ');
    for (const [cls, re, applies] of RULES) {
      const m = re.exec(line);
      if (!m || !applies(line, window)) continue;
      const phrase = (cls === 'KEY_BESIDE_CODEBOOK_LABEL' ? (RE_KEY.exec(line)[0] + ' + ' + m[0]) : m[0]).trim();
      let disposition, reason;
      const approved = approvedIds.find((id) => line.includes(id));
      if (approved) { disposition = 'ALLOWED'; reason = 'cites approved record ' + approved; }
      else if (NO_CORRESPONDENCE.test(line)) { disposition = 'ALLOWED'; reason = 'states that no correspondence is asserted'; }
      else if (cls !== 'KEY_BESIDE_CODEBOOK_LABEL' && NEGATION.test(clauseBefore(lines, i, m.index + m[0].length))) { disposition = 'ALLOWED'; reason = 'negated'; }
      else if (inQuotes(line, m.index) || /^\s*>/.test(line)) {
        if (IDENTIFIED.test(line)) { disposition = 'ALLOWED'; reason = 'identified quotation of a source'; }
        else { disposition = 'AMBIGUOUS_REVIEW_REQUIRED'; reason = 'quotation without an identified source'; }
      }
      else if (historical || /\bhistorical\b/i.test(line)) { disposition = 'HISTORICAL_ONLY'; reason = 'clearly labelled historical material'; }
      else if (PROPOSAL.test(line)) { disposition = 'AMBIGUOUS_REVIEW_REQUIRED'; reason = 'refers to a proposal or declaration, not an approved record'; }
      else if (cls === 'KEY_BESIDE_CODEBOOK_LABEL') { disposition = 'REQUIRES_APPROVED_RECORD'; reason = 'a candidate key beside a Codebook label with no approved record'; }
      else { disposition = 'UNSUPPORTED_MAPPING'; reason = 'presents a mapping that no approved record supports'; }
      const lineSha = createHash('sha256').update(line).digest('hex');
      const rev = reviewed.find((e) => e.file === file && e.line_sha256 === lineSha);
      let acknowledged = false;
      if (rev && REVIEWABLE.includes(rev.disposition)) { used.add(rev); disposition = rev.disposition; reason = 'reviewed: ' + rev.reason; acknowledged = disposition === 'AMBIGUOUS_REVIEW_REQUIRED'; }
      out.push({ file, line: i + 1, phrase, classification: cls, disposition, reason, acknowledged });
      break;
    }
  });
  return out;
}

// ---- scope ------------------------------------------------------------------------------------
export const SCOPE = Object.freeze([
  { group: 'candidate', dir: 'lib/engine-candidate', ext: /\.(js|md)$/ },
  { group: 'workspace', dir: 'tools/local-reviewer-workspace', ext: /\.(js|mjs|html|md)$/ },
  { group: 'methodology-integrity', dir: 'tools/methodology-integrity', ext: /\.(js|mjs|md)$/ },
  { group: 'manifest', files: ['schemas/jrs-decision-reconstruction-manifest.schema.json', 'api/_manifest/build.js', 'tools/validate-manifest.js', 'docs/manifest-independent-review/package/README.md', 'docs/manifest-independent-review/package/EXPECTED.md'] },
  { group: 'protocol-and-internal-docs', dir: 'docs/architecture', ext: /\.md$/ },
  { group: 'research-summary', files: ['research/CONSTRUCT_VALIDITY_PACKAGE.md', 'research/JRS_Validation_Report.md', 'research/DRR_Detection_Validation_Protocol.md', 'research/JRS_PreRegistered_Analysis_Plan.md', 'research/JRS_Research_Paper.md'] },
  { group: 'correspondence-records', files: ['docs/enterprise-diligence/D-2_CODEBOOK_CORRESPONDENCE_MEMO.md', 'docs/enterprise-diligence/CODEBOOK_API_CORRESPONDENCE_REVIEW.md', 'docs/enterprise-diligence/D-3_CORRESPONDENCE_DECISION_MATRIX.md', 'docs/enterprise-diligence/METHODOLOGY_TO_API_MAPPING.md', 'standard/jrs-conditions.json'] },
]);

function walk(root, dir, ext) {
  const out = [];
  for (const name of readdirSync(join(root, dir)).sort()) {
    const rel = dir + '/' + name, st = statSync(join(root, rel));
    if (st.isDirectory()) { if (name !== 'generated' && name !== 'node_modules') out.push(...walk(root, rel, ext)); }
    else if (ext.test(name)) out.push(rel);
  }
  return out;
}
export function scopeFiles(root) {
  const out = [];
  for (const s of SCOPE) for (const f of s.files || walk(root, s.dir, s.ext)) if (existsSync(join(root, f))) out.push({ group: s.group, file: f });
  return out;
}

// Owner decision records are reported, never gated: they are preserved under CLAUDE.md Rule 10.
export const REPORT_ONLY_GROUPS = Object.freeze(['correspondence-records']);
export const GATE_PERMITS = Object.freeze(['ALLOWED', 'HISTORICAL_ONLY']);

export function scanRepository(root, opts = {}) {
  const files = scopeFiles(root), findings = [], used = new Set(), reviewed = opts.reviewed || [];
  for (const { group, file } of files) for (const f of scanText(readFileSync(join(root, file), 'utf8'), file, { ...opts, reviewed, used })) findings.push({ group, ...f });
  const summary = Object.fromEntries(DISPOSITIONS.map((d) => [d, findings.filter((f) => f.disposition === d).length]));
  const gate_failures = findings.filter((f) => !REPORT_ONLY_GROUPS.includes(f.group) && !GATE_PERMITS.includes(f.disposition) && !f.acknowledged);
  const stale_reviews = reviewed.filter((e) => !used.has(e)).map((e) => e.file + ' ' + e.line_sha256.slice(0, 12));
  const bad_reviews = reviewed.filter((e) => !REVIEWABLE.includes(e.disposition) || !e.reason).map((e) => e.file);
  return { files_scanned: files.length, scope: SCOPE.map((s) => s.group), report_only_groups: REPORT_ONLY_GROUPS, summary,
           gate: { failures: gate_failures.length, stale_reviews, bad_reviews }, findings };
}
