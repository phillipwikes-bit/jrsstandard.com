// 0.3.4 repair package: mutation tests 2.0 of the research profile and the research path of the compiler.
// Each mutant is one exact text replacement in research-profile.mjs (R) or compiler.mjs (C), applied to its own
// isolated copy of the 0.3.4 candidate (candidate/ is never touched).
//   MU-xx-p  the study's 1.0 mutants (research/study-156-2026-10-27/tools/mutation-tests.mjs), PORTED: same intent,
//            search text updated where 0.3.4 changed the line; MU ids whose code no longer exists are listed as retired
//   MV-xx    new mutants: each switches off or weakens one 0.3.4 repair
// A mutant is killed by:
//   probes       research probes 1.0 (study, unchanged) or regression probes 2.0 fail
//   paired       the paired relations on development records: irrelevant date or identifier added to a flawed record
//                (ADV and OVERCLAIM-R) must not improve E1 or lose a rule gap; a clean record with its evidence removed
//                must not be CLEAR; the injected-instruction cases of the injection suite on two records
//   dev_labels   on development records, an agreement count gets worse (fewer FLAG on UNGROUNDED, more FLAG on
//                GROUNDED, more CLEAR on UNGROUNDED, fewer question checks passing)
//   any_change   any development graph differs from the unmutated baseline (behaviour digest)
// Development partition and originals only. Every study record is exposed; kill rates measure how much of the code
// the tests exercise, not accuracy.
// Usage: node tools/mutation-tests-v2.mjs <scratch>   (writes out/mutations-v2/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { isolate, loadEngine, VERSIONS, PKG } from './harness/engines.mjs';
import { runResearchProbes } from '../../study-156-2026-10-27/tools/research-probes.mjs';
import { runRegressionProbesV2 } from './regression-probes-v2.mjs';
import { substantive, recordText, designedOf, referenceOf, armsFor, score, storedMock, relabel, MOCK_OF_ARM, sha } from './lib.mjs';
import { POOLS, insert } from '../tests/paired-suite.mjs';
import { buildVariant } from './variant-spec-v2.mjs';
import { CASES } from '../tests/injection-suite.mjs';
import { alignedCandidate } from '../../study-156-2026-10-27/tools/mock-aligned.mjs';
import { sentences } from './variant-spec-v2.mjs';

const DIR = join('lib', VERSIONS['0.3.4-research-candidate'].dir);
const FILE = { R: join(DIR, 'research-profile.mjs'), C: join(DIR, 'compiler.mjs') };
const M = (id, kind, target, file, find, replace) => ({ id, kind, target, file, find, replace });
// Equivalent by construction, recorded rather than hidden.
//   MU-27-p  restated already requires no stated-link anchor, and the requirement already needs one (as MU-27 in 1.0)
//   MU-33-p  linkage is checked after the requirement, which already needs a cited quote covering a stated-link anchor
//   MU-34-p  the compiler holds sufficiency at review_required whatever the rule says
// Run 1 of 2.0 is kept in history/mutations-v2-run-1/; the probes added after it are Part 3 of regression probes 2.0.
export const EQUIVALENT = Object.freeze(['MU-27-p', 'MU-33-p', 'MU-34-p']);
export const RETIRED = Object.freeze({ 'MU-23': 'the 0.3.3 noReason line is replaced; ported as MU-23-p', 'MU-24': 'ported as MU-24-p' });
export const MUTANTS = [
  // ------------------------------------------------------------ ported study mutants (1.0 intent, 0.3.4 text)
  M('MU-01-p', 'defect_reintroduction', 'D1', 'R', String.raw`(?:(?:was|were|been|is|are|has|have|had)\s+(?:\w+\s+){0,3}?approved|approved\s+(?:by|the|it|on|change|keeping|moving|a|an|its|CR-\d+)|(?:board|panel|manager|committee|sponsor|team|lead)\s+approved|approve|`, String.raw`(?:approved|approve|`),
  M('MU-02-p', 'defect_reintroduction', 'D9', 'R', String.raw`(?:\w+\s+){0,3}?approved|approved\s+(?:by`, String.raw`(?:\w+\s+){0}?approved|approved\s+(?:by`),
  M('MU-03-p', 'defect_reintroduction', 'D2', 'R', String.raw`['stated_absence', /\b(?:found no|`, String.raw`['stated_absence', /(?!)(?:found no|`),
  M('MU-04-p', 'defect_reintroduction', 'D3', 'R', String.raw`['D', 'award', /\baward(?:ed)?\b/i]`, String.raw`['D', 'award', /\bawarded?\b/i]`),
  M('MU-05-p', 'defect_reintroduction', 'D3', 'R', String.raw`/\b(?:was|were) published\b|\bpublished on\b/i`, String.raw`/\bpublished\b/i`),
  M('MU-06-p', 'defect_reintroduction', 'D4', 'R', String.raw`const AUTHORITY_TAIL = /^\s*(?:`, String.raw`const AUTHORITY_TAIL = /(?!)^\s*(?:`),
  M('MU-07-p', 'defect_reintroduction', 'D5', 'R', `!EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = 'decision_detail';`, `!EVIDENTIAL.test(clauseAround(text, a.start))) a.excluded = null;`),
  M('MU-08-p', 'defect_reintroduction', 'D6', 'R', String.raw`if (mod && /\b(?:the|its|their|this|that|a|an)\s+$/i.test(`, String.raw`if (mod && /(?:)/i.test(`),
  M('MU-09-p', 'defect_reintroduction', 'D7', 'R', `const ids = (pre.slice(ls).match(`, `const ids = (pre.match(`),
  M('MU-10-p', 'defect_reintroduction', 'D8', 'R', `const g = groups.find((x) => x.subjects.some((s) => u.subject_refs.includes(s)));`, `const g = null;`),
  M('MU-11-p', 'defect_reintroduction', 'D10', 'R', String.raw`\bretained (?:for|on|in)\b`, String.raw`\bretained\b`),
  M('MU-12-p', 'defect_reintroduction', 'D11', 'R', `if (!k && !contentWords) { terms = termsIn(pre,`, `if (!k) { terms = termsIn(pre,`),
  M('MU-13-p', 'defect_reintroduction', 'D13', 'R', String.raw`(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/gi;`, String.raw`(?:release|lot|version|request)\s+\d+(?:\.\d+)?)\b/g;`),
  M('MU-14-p', 'defect_reintroduction', 'D14', 'R', String.raw`['E', 'repair', /\brepair(?:ed|s)?\b/i], `, ''),
  M('MU-15-p', 'defect_reintroduction', 'D15', 'R', String.raw`['quantity', new RegExp('\\b\\d[\\d,]*\\s+(?:' + NOT_PLURAL + '[a-z-]+\\s+)?' + NOT_PLURAL + '[a-z-]+s\\b', 'g')], `, ''),
  M('MU-16-p', 'defect_reintroduction', 'D16', 'R', `const anchorText = (e) => { const [s, t] = spanOf(e);`, `const anchorText = (e) => { const [s, t] = [e.start, e.end];`),
  M('MU-17-p', 'defect_reintroduction', 'D17', 'R', `|dated|held|made|given|carried|out|issued|completed|`, `|made|given|`),
  M('MU-18-p', 'defect_reintroduction', 'D18', 'R', `return hits.length ? hits[0] : null;`, `return hits.length === 1 ? hits[0] : null;`),
  M('MU-19-p', 'operator', 'RP-SRP-03', 'R', `if (sameEvent(a, b) && !sameDay(a.date, b.date)) {`, `if (sameEvent(a, b) && sameDay(a.date, b.date)) {`),
  M('MU-20-p', 'operator', 'RP-SRP-03', 'R', `  && (!x.ids.length || !y.ids.length || x.ids.some((i) => y.ids.includes(i)));`, `  && true;`),
  M('MU-21-p', 'operator', 'RP-SRP-05', 'R', `      if (shared || obj) {`, `      if (true) {`),
  M('MU-22-p', 'operator', 'RP-SRP-07', 'R', `const restated = rules.has('RP-SRP-07') && !strong.length && restatingUnits.length > 0;`, `const restated = false;`),
  M('MU-23-p', 'operator', 'RP-SRP-07', 'R', `const noReason = rules.has('RP-SRP-07') && decisions.length > 0 && !rationaleUnits.length && !strong.length && !weak.length;`, `const noReason = false;`),
  M('MU-24-p', 'operator', 'RP-SRP-06', 'R', `const authorityOnly = rules.has('RP-SRP-06') && authorityUnits.length > 0 && !strong.length && !weak.length;`, `const authorityOnly = false;`),
  M('MU-25-p', 'operator', 'RP-SRP-08', 'R', `const unsupportedConclusion = rules.has('RP-SRP-08') && (added.length > 0 || unsupportedDecisions.length > 0);`, `const unsupportedConclusion = false;`),
  M('MU-26-p', 'operator', 'identifiable_basis', 'R', `r.requirement_visible = !!strong.length && !unsupportedConclusion && cited.some(anchorText);`, `r.requirement_visible = !!strong.length && !unsupportedConclusion;`),
  M('MU-27-p', 'operator', 'reasoning_traceability', 'R', `r.requirement_visible = !!decisions.length && !!strong.length && !restated && !unsupportedConclusion && rationaleCited;`, `r.requirement_visible = !!decisions.length && !!strong.length && !unsupportedConclusion && rationaleCited;`),
  M('MU-28-p', 'operator', 'RP-SRP-02', 'R', `else if (inRanges(a.start, subjects)) a.excluded = 'subject_reference';`, `else if (false) a.excluded = 'subject_reference';`),
  M('MU-29-p', 'operator', 'RP-SRP-02', 'R', `a.excluded = 'decision_date';`, `a.excluded = null;`),
  M('MU-30-p', 'operator', 'RP-SRP-02', 'R', `a.excluded = 'authority_citation';`, `a.excluded = null;`),
  M('MU-31-p', 'operator', 'reasoning_traceability', 'R', `const negated = (e) => e.assertion_type === 'stated_rationale' && NEGATED.test(e.quote);`, `const negated = (e) => false;`),
  M('MU-32-p', 'operator', 'chronology_integrity', 'R', `r.requirement_visible = pathEvents.length >= 2 && has('chronology_integrity', ['stated_date']);`, `r.requirement_visible = pathEvents.length >= 1;`),
  M('MU-33-p', 'operator', 'research linkage', 'R', `if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return list.some((e) => overlaps(e, (u) => u.basis_anchors.length > 0));`, `if (condition === 'identifiable_basis' || condition === 'reasoning_traceability') return true;`),
  M('MU-34-p', 'operator', 'sufficiency', 'R', `const r = { requirement_visible: false, visible_gaps: [], review_reasons: ['sufficiency_not_determinable_by_engine'], anchor: firstDecisionSection, gap_spans: gapSpans };`, `const r = { requirement_visible: true, visible_gaps: [], review_reasons: [], anchor: firstDecisionSection, gap_spans: gapSpans };`),
  M('MU-35-p', 'operator', 'profile gating', 'R', `const ok = problems.length === 0;`, `const ok = true;`),
  // ------------------------------------------------------------ new mutants: one per 0.3.4 repair
  M('MV-01', 'repair_off', 'RP-SRP-09 linkage (all anchors count, the 0.3.3 rule)', 'R', `    u.basis_anchors = u.candidate_anchors.filter((a) => a.link && !INFERRED_LINKS.includes(a.link));`, `    u.basis_anchors = u.candidate_anchors;`),
  M('MV-02', 'repair_off', 'RP-SRP-09 pass 1 (decision-sentence links)', 'R', `for (const u of decisions) for (const a of u.candidate_anchors) link(u, a, 'decision_sentence');`, `void 0;`),
  M('MV-03', 'repair_off', 'RP-SRP-09 pass 2 (reason sentences that refer to a decision)', 'R', `    if (refers) for (const a of u.candidate_anchors) link(u, a, 'basis_statement');`, `    void refers;`),
  M('MV-04', 'repair_off', 'RP-SRP-09 pass 3 (shared source)', 'R', `      if (hit) for (const a of u.candidate_anchors) if (!a.link) { a.link = 'shared_source'; changed = true; }`, `      void hit;`),
  M('MV-05', 'repair_weakened', 'RP-SRP-09 inferred authority link counted as stated', 'R', `const INFERRED_LINKS = Object.freeze(['cited_authority_condition', 'related_to_decision']);`, `const INFERRED_LINKS = Object.freeze(['related_to_decision']);`),
  M('MV-06', 'repair_weakened', 'RP-SRP-09 inferred related link counted as stated', 'R', `const INFERRED_LINKS = Object.freeze(['cited_authority_condition', 'related_to_decision']);`, `const INFERRED_LINKS = Object.freeze(['cited_authority_condition']);`),
  M('MV-07', 'repair_off', 'RP-SRP-09 title metadata', 'R', `const header = rules.has('RP-SRP-09') && raw.length > 1 && isHeaderText(`, `const header = false && isHeaderText(`),
  M('MV-08', 'repair_off', 'RP-SRP-11 research instruction screen', 'R', `  return [...base, ...detectResearchInstructionRisk(record)].map((s) => extendAddressee(record, s))`, `  return [...base].map((s) => extendAddressee(record, s))`),
  M('MV-09', 'repair_off', 'visible gaps stated while a status is held at review', 'C', `if (research && (status === 'review_required' || status === 'not_assessed') && r.visible_gaps.length`, `if (false && r.visible_gaps.length`),
  M('MV-10', 'repair_off', 'EF-02 verb forms excluded from plural quantities', 'R', `const NOT_PLURAL = '(?!(?:was|is|has|does|this|its|his|hers|ours|yours|theirs|as|us|thus|plus|less|unless|across|always|perhaps|whereas|yes|bus|gas)\\\\b)';`, `const NOT_PLURAL = '';`),
  M('MV-11', 'repair_off', 'RP-SRP-12 decision verb families', 'R', `families: rules.has('RP-SRP-12') }));`, `families: false }));`),
  M('MV-12', 'repair_off', 'RP-SRP-12 candidate-located decision routed to review', 'R', `const candidateDecision = rules.has('RP-SRP-12') && !decisions.length &&`, `const candidateDecision = false && !decisions.length &&`),
  M('MV-13', 'repair_off', 'RP-SRP-10 instance words', 'R', `events.push({ key: at.key, instance: v10 ? at.instance : null,`, `events.push({ key: at.key, instance: null,`),
  M('MV-14', 'repair_off', 'RP-SRP-10 comma inside a number', 'R', `const SPLIT = /\\b(?:and|citing|because|after|following|relies on|rests on|based on|supported by|including|so)\\b|[;:(]|,(?!\\d)/gi;`, `const SPLIT = /\\b(?:and|citing|because|after|following|relies on|rests on|based on|supported by|including|so)\\b|[,;:(]/gi;`),
  M('MV-15', 'repair_off', 'RP-SRP-10 unnumbered decision object', 'R', `const obj = !shared && rules.has('RP-SRP-10')`, `const obj = false && !shared && rules.has('RP-SRP-10')`),
  M('MV-16', 'repair_off', 'attributed cause is conclusion content', 'R', `else if (ctx.families && decision && a.start < cueAt && ATTRIBUTED_TO.test(text.slice(0, a.start))) a.excluded = 'decision_detail';`, `else if (false) a.excluded = 'decision_detail';`),
  M('MV-17', 'repair_off', 'RP-SRP-11 roles read outside instruction spans', 'R', `  const roleText = local.length ? [...text].map((ch, i) => (inRanges(i, local) ? ' ' : ch)).join('') : text;`, `  const roleText = text;`),
  M('MV-18', 'repair_off', 'RP-SRP-11 addressed note extended over its content', 'R', `  if (!ADDRESSEE_PATTERNS.includes(s.pattern_id)) return s;`, `  return s;`),
  M('MV-19', 'repair_off', 'RP-SRP-13 consolidated controls', 'C', `controls = research ? buildResearchControls(defects, RESEARCH_DEFECT_TEMPLATES) : buildControls(defects);`, `controls = research ? buildControls(defects, RESEARCH_DEFECT_TEMPLATES) : buildControls(defects);`),
  M('MV-20', 'repair_off', 'only an authority a decision cites counts', 'R', `units.filter((u) => u.authority_reference && citedAuthorityIdx.has(u.index))`, `units.filter((u) => u.authority_reference)`),
  M('MV-21', 'repair_weakened', 'restated reason ignores inferred links', 'R', `(u.decision && !weak.length));`, `u.decision);`),
  M('MV-22', 'repair_weakened', 'no-evidence gap ignores inferred links', 'R', `const noEvidence = !strong.length && !weak.length && (`, `const noEvidence = !strong.length && (`),
  M('MV-23', 'repair_off', 'RP-SRP-10 chronology on the decision path', 'R', `const pathEvents = v10 ? bodyEvents.filter((e) => path.has(e.unit)) : events;`, `const pathEvents = events;`),
  M('MV-24', 'repair_off', 'VF-04 identifiers the decision verb acts on', 'R', `&& (ID_FOLLOWED_BY_DECISION.test(text.slice(a.end)) || ID_AFTER_DECISION_VERB.test(text.slice(Math.max(0, a.start - 48), a.start)))) a.excluded = 'subject_identifier';`, `&& false) a.excluded = 'subject_identifier';`),
  M('MV-25', 'repair_off', 'inferred link: shared decision values', 'R', `      || u.candidate_anchors.some((a) => dValues.has(valueOf(a)));`, ``),
  M('MV-26', 'repair_off', 'inferred link: shared names', 'R', `|| dNames.some((n) => [...names].some((x) => n.has(x)))`, ``),
  M('MV-27', 'repair_off', 'inferred link: the record\'s only subject', 'R', `recordSubjects.size === 1 ? new Set(recordSubjects) : new Set();`, `false ? new Set(recordSubjects) : new Set();`),
  M('MV-28', 'repair_off', 'pass 2b: anaphoric source', 'R', `if (noun.test(v.text) && v.candidate_anchors.length) { for (const a of v.candidate_anchors) link(v, a, 'named_source'); break; }`, `if (false) { break; }`),
  M('MV-29', 'repair_off', 'counted noun as a measurement unit', 'R', `|| /\\b([a-z-]{4,})\\s*$/i.exec(a.text);`, `;`),
  M('MV-30', 'repair_off', 'RP-SRP-11 anchors in instruction spans excluded', 'R', `    else if (inRanges(a.start, local)) a.excluded = 'instruction_span';`, `    else if (false) a.excluded = 'instruction_span';`),
  M('MV-31', 'repair_weakened', 'shared everyday words as a link (the defect found in development)', 'R', `    const meets = citedUnits.some((a) => { const ad = dimsOf(a.anchors); return [...dims].some((x) => ad.has(x)); });`,
    `    const words = (t) => new Set((t.toLowerCase().match(/[a-z]{5,}/g) || []).map((w) => w.slice(0, 5))); const meets = units.some((a) => a.decision && [...words(u.text)].filter((w) => words(a.text).has(w)).length >= 2) || citedUnits.some((a) => { const ad = dimsOf(a.anchors); return [...dims].some((x) => ad.has(x)); });`),
];

const devRecords = substantive.filter((e) => e.partition === 'development' || e.cohort === 'original_study_record');
const ARM_IDS = ['A2', 'A3', 'A3R', 'A4R'];
function devRun(E) {
  const arms = armsFor(E.version).filter((a) => ARM_IDS.includes(a.id));
  const rows = [];
  for (const e of devRecords) {
    const text = recordText(e.source_id), designed = designedOf(e.source_id);
    for (const a of arms) {
      const cand = a.mock ? relabel(storedMock(a.mock, e.source_id), E.research.RESEARCH_PROMPT_VERSION) : null;
      const r = score(E, a, { text, id: e.source_id, cand, designed });
      rows.push({ arm: a.id, id: e.source_id, reference: referenceOf(e.source_id), e1: r.e1 || null, e2: r.e2, disposition: r.disposition, digest: r.behaviour_digest || r.error });
    }
  }
  const s = { flag_on_ungrounded: 0, flag_on_grounded: 0, clear_on_ungrounded: 0, question_checks_passed: 0, technical_failures: 0 };
  for (const r of rows) {
    if (r.disposition === 'technical_failure') s.technical_failures++;
    if (r.e1 === 'FLAG' && r.reference === 'UNGROUNDED') s.flag_on_ungrounded++;
    if (r.e1 === 'FLAG' && r.reference === 'GROUNDED') s.flag_on_grounded++;
    if (r.e1 === 'CLEAR' && r.reference === 'UNGROUNDED') s.clear_on_ungrounded++;
    for (const q of Object.values(r.e2 || {})) if (q.pass) s.question_checks_passed++;
  }
  return { rows, summary: s };
}
// The paired and injection relations, on development records.
function pairedRun(E) {
  const versions = { contractVersion: E.contract.CONTRACT_VERSION, promptVersion: E.research.RESEARCH_PROMPT_VERSION };
  const A4R = armsFor(E.version).find((a) => a.id === 'A4R');
  const RANK = { FLAG: 0, NOT_ASSESSED: 1, INDETERMINATE: 1, CLEAR: 2 };
  const fails = [];
  let pos = 0;
  for (const e of devRecords) {
    const id = e.source_id, base = recordText(id), d = designedOf(id); if (!d) { pos++; continue; }
    const ref = { e1: d.e1, chronology_conflict: d.q3 === 'same_event_two_dates' };
    const run = (t) => score(E, A4R, { text: t, id, cand: alignedCandidate(t, E.research, ref, 'OVERCLAIM-R', versions), designed: d });
    const b = run(base);
    if (d.e1 === 'UNGROUNDED') for (const k of ['irrelevant_date', 'irrelevant_identifier']) { const t = insert(base, POOLS[k][pos % POOLS[k].length], pos).text; const v = run(t); if (RANK[v.e1] > RANK[b.e1]) fails.push(id + ':' + k + ':' + b.e1 + '>' + v.e1); }
    if (d.e1 === 'GROUNDED') { const v5 = buildVariant('V5', { text: base, e1: 'GROUNDED', chronology_conflict: false }, pos); if (v5.constructible && run(v5.text).e1 === 'CLEAR') fails.push(id + ':evidence_removed:CLEAR'); }
    if (pos < 6) for (const [cid, , inj] of CASES.filter((c) => c[1] !== 'benign_discussion' && !Array.isArray(c[2])).slice(0, 8)) {
      const ss = sentences(base); const t = [...ss.slice(0, 1), inj, ...ss.slice(1)].join(' '); const v = run(t);
      if (v.observed && v.observed.instruction_risk !== 'detected' && !['IN-04', 'IN-05'].includes(cid)) fails.push(id + ':' + cid + ':not_detected');
      if (d.e1 === 'UNGROUNDED' && b.e1 === 'FLAG' && v.e1 !== 'FLAG') fails.push(id + ':' + cid + ':flag_lost');
    }
    pos++;
  }
  return fails;
}
async function evaluate(scratch, mutant) {
  const iso = isolate('0.3.4-research-candidate', scratch, { requireManifest: existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
  let applied = null;
  if (mutant) {
    const p = join(iso.root, FILE[mutant.file]); const src = readFileSync(p, 'utf8');
    const n = src.split(mutant.find).length - 1;
    if (n !== 1) { iso.release(); return { invalid: 'search text occurs ' + n + ' times' }; }
    writeFileSync(p, src.replace(mutant.find, () => mutant.replace)); applied = sha(readFileSync(p));
  }
  let E;
  try { E = await loadEngine(iso); } catch (e) { iso.release(); return { load_error: String(e && e.message).slice(0, 200), mutated_sha256: applied }; }
  let probes, regress, d, paired;
  try { probes = await runResearchProbes(E); regress = await runRegressionProbesV2(E); d = devRun(E); paired = pairedRun(E); }
  catch (e) { iso.release(); return { run_error: String(e && e.message).slice(0, 200), mutated_sha256: applied }; }
  const rel = iso.release();
  return { mutated_sha256: applied, research_probe_failures: probes.filter((r) => !r.ok).map((r) => r.id), regression_probe_failures: regress.filter((r) => !r.ok).map((r) => r.id + ':' + r.defect), dev: d, paired_failures: paired, isolated_copy_changed: rel.changed };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const scratch = process.argv[2];
  if (!scratch) { console.error('usage: mutation-tests-v2.mjs <scratch>'); process.exit(2); }
  const f = join(PKG, 'out', 'mutations-v2', 'RESULTS.json');
  if (existsSync(f)) { console.error(f + ' exists'); process.exit(2); }
  mkdirSync(scratch, { recursive: true });
  const base = await evaluate(scratch, null);
  if (base.research_probe_failures.length || base.regression_probe_failures.length || base.paired_failures.length) { console.error('baseline does not pass its own tests', base.research_probe_failures, base.regression_probe_failures, base.paired_failures); process.exit(3); }
  const baseDigest = new Map(base.dev.rows.map((r) => [r.arm + '/' + r.id, r.digest]));
  const results = [];
  for (const m of MUTANTS) {
    const r = await evaluate(scratch, m);
    const row = { id: m.id, kind: m.kind, target: m.target, file: FILE[m.file], find_sha256: sha(m.find) };
    if (r.invalid) { results.push(Object.assign(row, { status: 'invalid', reason: r.invalid })); continue; }
    if (r.load_error || r.run_error) { results.push(Object.assign(row, { status: 'killed', killed_by: [r.load_error ? 'load_error' : 'run_error'], error: r.load_error || r.run_error })); continue; }
    const s = r.dev.summary, b = base.dev.summary;
    const worse = s.flag_on_ungrounded < b.flag_on_ungrounded || s.flag_on_grounded > b.flag_on_grounded || s.clear_on_ungrounded > b.clear_on_ungrounded || s.question_checks_passed < b.question_checks_passed || s.technical_failures > b.technical_failures;
    const changed = r.dev.rows.filter((x) => baseDigest.get(x.arm + '/' + x.id) !== x.digest).length;
    const by = [];
    if (r.research_probe_failures.length || r.regression_probe_failures.length) by.push('probes');
    if (r.paired_failures.length) by.push('paired');
    if (worse) by.push('dev_labels');
    if (changed) by.push('any_change');
    results.push(Object.assign(row, { status: by.length ? 'killed' : EQUIVALENT.includes(m.id) ? 'survived_equivalent' : 'survived', killed_by: by, research_probe_failures: r.research_probe_failures, regression_probe_failures: r.regression_probe_failures,
      paired_failures: r.paired_failures.slice(0, 10), paired_failure_count: r.paired_failures.length, dev_summary: s, dev_rows_changed: changed, mutated_sha256: r.mutated_sha256 }));
  }
  const valid = results.filter((r) => r.status !== 'invalid');
  const count = (fn) => valid.filter(fn).length;
  const out = { results_format: 'jrs-0.3.4-mutations/2.0.0', target_files: FILE, retired_study_mutants: RETIRED, baseline: { dev_summary: base.dev.summary, research_probes_failed: 0, regression_probes_failed: 0, paired_failures: 0 }, network_attempts: attempts.length,
    totals: { mutants: MUTANTS.length, valid: valid.length, invalid: results.length - valid.length, killed_by_tests: count((r) => r.killed_by.some((k) => ['probes', 'paired', 'load_error', 'run_error'].includes(k))), killed_by_dev_labels: count((r) => r.killed_by.includes('dev_labels')),
      killed_any: count((r) => r.status === 'killed'), survived: count((r) => r.status === 'survived'), survived_equivalent: count((r) => r.status === 'survived_equivalent'), killed_only_by_change: count((r) => r.killed_by.length === 1 && r.killed_by[0] === 'any_change') },
    note: 'Kill rates measure how much of the research code the tests exercise. They are not accuracy.', results };
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(out.totals), 'network', attempts.length);
  for (const r of results) console.log(r.id.padEnd(8), r.status.padEnd(20), (r.killed_by || []).join('+').padEnd(30), r.reason || r.error || '', r.research_probe_failures ? 'rp:' + r.research_probe_failures.length + ' rg:' + r.regression_probe_failures.length + ' pf:' + r.paired_failure_count : '');
}
