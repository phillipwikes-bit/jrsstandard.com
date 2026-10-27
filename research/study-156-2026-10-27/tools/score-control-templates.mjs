// 156-record study: pre-specified, AI-applied rubric for the cognitive-control templates (DETECT, REFLECT, CORRECT,
// LEARN). Under the research profile every control's text is a fixed template chosen by its defect, so the four
// fields are scored once per template; per-graph measures (detect validity, burden, redundancy, traceability,
// contradiction) are in tools/analyze.mjs. Lexical checks only; usefulness to a reviewer is NOT ESTABLISHED here.
//   DETECT   declarative statement of something observable in the record, ends with a full stop
//   REFLECT  states a consequence for a later reviewer or for reconstruction
//   CORRECT  asks the record owner a question (neutral; does not assert the fix)
//   LEARN    an imperative process change that applies beyond this record (template, field, each, every)
// Usage: node tools/score-control-templates.mjs <scratch>   (writes out/controls/TEMPLATE_RUBRIC.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(PKG, 'out', 'controls', 'TEMPLATE_RUBRIC.json');
if (existsSync(OUT)) { console.error(OUT + ' exists'); process.exit(2); }
const scratch = process.argv[2];
if (!scratch) { console.error('usage: score-control-templates.mjs <scratch>'); process.exit(2); }
mkdirSync(scratch, { recursive: true });
const iso = isolate('0.3.3-research-candidate', scratch, { requireManifest: existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt')) });
const E = await loadEngine(iso);
const T = E.research.RESEARCH_DEFECT_TEMPLATES;
const RESEARCH = ['no_locatable_conclusion', 'no_explicit_dates', 'no_identifiable_basis_evidence', 'authority_reference_without_linked_facts', 'conclusion_restated_as_basis', 'conclusion_without_stated_basis', 'conclusion_without_identifiable_basis', 'same_event_date_conflict', 'decision_outcome_conflict'];
const rubric = {
  detect: (s) => /\.$/.test(s) && !/\?$/.test(s) && /\b(?:record|decision|conclusion|reason|event|date|section|authority|source|outcome|control|exception|quotation|span)\b/i.test(s),
  reflect: (s) => /\b(?:reviewer|reconstruct\w*|cannot|does not show|may not|unable|checked)\b/i.test(s),
  correct: (s) => /\?$/.test(s.trim()),
  learn: (s) => /^(?:Add|Ask|Pair|Give|Record|Require|Use|Name|State)\b/.test(s.trim()) && /\b(?:template|field|each|every)\b/i.test(s),
};
const rows = Object.entries(T).map(([defect, t]) => { const [condition, detect, reflect, correct, learn] = t; const sc = { detect: rubric.detect(detect), reflect: rubric.reflect(reflect), correct: rubric.correct(correct), learn: rubric.learn(learn) };
  return { defect, condition, research_wording: RESEARCH.includes(defect), scores: sc, all_four: Object.values(sc).every(Boolean), words: [detect, reflect, correct, learn].join(' ').split(/\s+/).length, fields: { detect, reflect, correct, learn } }; });
const rel = iso.release();
const research = rows.filter((r) => r.research_wording);
const out = { results_format: 'jrs-study-156-control-template-rubric/1.0.0', rater: 'AI-applied lexical rubric (this study); not a human rating', engine_manifest_sha256: iso.manifest_sha256, isolated_copy: rel, network_attempts: attempts.length,
  totals: { templates: rows.length, research_templates: research.length, research_all_four: research.filter((r) => r.all_four).length, all_templates_all_four: rows.filter((r) => r.all_four).length,
    by_field_research: Object.fromEntries(Object.keys(rubric).map((k) => [k, research.filter((r) => r.scores[k]).length])) }, rows };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(out.totals), 'network', attempts.length);
