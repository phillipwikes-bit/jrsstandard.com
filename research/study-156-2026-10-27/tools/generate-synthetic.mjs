// 156-record study: writes the disclosed replacement records S-001 to S-100 from tools/synthetic-spec.mjs
// and their construction register. Offline. Refuses to overwrite. Runs no compiler: the only Engine code
// imported is the 0.3.1 intake lexicon (scope.mjs), used to RECORD (not to repair) which records its
// excluded-domain, instruction and placeholder patterns would match.
// Usage: node tools/generate-synthetic.mjs
import { createHash } from 'node:crypto';
import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, TYPES, DESIGN, PARTITION } from './synthetic-spec.mjs';
import { REGULATED, REWORDED_EMPLOYMENT, detectInstructionRisk } from '../../../lib/engine-evidence-graph-v0.3.1-candidate/scope.mjs';
import { LOCAL_SIZE_LIMIT_CHARS } from '../../../lib/engine-evidence-graph-v0.3.1-candidate/contract.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(PKG, 'records', 'synthetic');
const REG = join(DIR, 'CONSTRUCTION_REGISTER.json');
if (existsSync(REG) || readdirSync(DIR).length) { console.error('synthetic records exist; they are preserved, not regenerated'); process.exit(2); }
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const PLACEHOLDER = /\[(?:TBD|TBC|TODO|PENDING|INSERT[^\]]*)\]|\bTBD\b|<insert[^>]*>|\?\?\?/;
const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const shingles = (t) => { const w = words(t), s = new Set(); for (let i = 0; i + 3 <= w.length; i++) s.add(w.slice(i, i + 3).join(' ')); return s; };
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1); };

const rows = [];
let n = 0;
for (const f of FAMILIES) for (const t of TYPES) {
  const text = f.records[t];
  if (typeof text !== 'string' || !text) throw new Error('missing ' + f.id + ' ' + t);
  const id = 'S-' + String(++n).padStart(3, '0');
  writeFileSync(join(DIR, id + '.txt'), text, { flag: 'wx' });
  const domainHits = [...REGULATED, ['employment', REWORDED_EMPLOYMENT]].filter(([, re]) => new RegExp(re.source, re.flags.replace('g', '')).test(text)).map(([d]) => d);
  rows.push({ id, family: f.id, context: f.context, type: t, partition: PARTITION[f.id], designed: DESIGN[t], text_sha256: sha(text),
    length: { utf16_chars: text.length, utf8_bytes: Buffer.byteLength(text, 'utf8'), words: words(text).length },
    pre_seal_lexical_observation: { excluded_domain_pattern_matches: [...new Set(domainHits)], instruction_risk: detectInstructionRisk(text).record_instruction_risk,
      placeholder: PLACEHOLDER.test(text), over_size_limit: text.length > LOCAL_SIZE_LIMIT_CHARS } });
}
const texts = rows.map((r) => FAMILIES.find((f) => f.id === r.family).records[r.type]);
if (new Set(texts).size !== texts.length) throw new Error('duplicate synthetic text');
const sh = texts.map(shingles);
let maxWithin = 0, maxAcross = 0; const high = [];
for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
  const s = jac(sh[i], sh[j]);
  if (rows[i].family === rows[j].family) maxWithin = Math.max(maxWithin, s); else maxAcross = Math.max(maxAcross, s);
  if (s >= 0.5) high.push({ a: rows[i].id, b: rows[j].id, jaccard_3gram: Number(s.toFixed(3)) });
}
for (const r of rows) r.links = {
  same_family_dependent: rows.filter((x) => x !== r && x.family === r.family).map((x) => x.id),
  same_type_template: rows.filter((x) => x !== r && x.type === r.type).map((x) => x.id),
  near_duplicates_ge_0_5: high.filter((h) => h.a === r.id || h.b === r.id),
};
const register = {
  register_format: 'jrs-study-156-synthetic-construction/1.0.0', built_at_utc: new Date().toISOString(),
  author: 'Developer (this Claude Code session). AI-authored constructed records; not human-authored, not independent, not reviewed.',
  disclosure: 'Disclosed replacement for the 100 synthetic slots, which held no record before this file. Constructed in ten families outside the handoff excluded domains, so that they can be processed under the current scope. They are structural analogues of the study document types, not records of those types, and they share facts within a family and construction patterns within a type.',
  method: 'Hand-written per family and type in tools/synthetic-spec.mjs before any research-profile code existed. No compiler or model was run on any record before the seal. The only Engine code used is the 0.3.1 intake lexicon, to record pattern matches; no record was rewritten because of a match.',
  partition_rule: 'By family, fixed in synthetic-spec.mjs before generation: F01 to F04 development (40), F05 to F10 evaluation (60). The evaluation partition is developer-exposed: the developer wrote it. It is not a holdout and supports no holdout claim.',
  counts: { records: rows.length, families: FAMILIES.length, types: TYPES.length,
    by_partition: Object.fromEntries(['development', 'evaluation'].map((p) => [p, rows.filter((r) => r.partition === p).length])),
    designed_e1: Object.fromEntries(['GROUNDED', 'UNGROUNDED'].map((v) => [v, rows.filter((r) => r.designed.e1 === v).length])),
    lexical_excluded_domain_matches: rows.filter((r) => r.pre_seal_lexical_observation.excluded_domain_pattern_matches.length).map((r) => r.id + ':' + r.pre_seal_lexical_observation.excluded_domain_pattern_matches.join('+')),
    instruction_risk: rows.filter((r) => r.pre_seal_lexical_observation.instruction_risk === 'detected').map((r) => r.id),
    placeholder: rows.filter((r) => r.pre_seal_lexical_observation.placeholder).map((r) => r.id) },
  similarity: { max_within_family_jaccard_3gram: Number(maxWithin.toFixed(3)), max_across_family_jaccard_3gram: Number(maxAcross.toFixed(3)), pairs_ge_0_5: high.length, exact_duplicates: 0 },
  records: rows,
};
writeFileSync(REG, JSON.stringify(register, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ counts: register.counts, similarity: register.similarity }));
