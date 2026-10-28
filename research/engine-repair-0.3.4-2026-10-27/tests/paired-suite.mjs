// 0.3.4 repair package: paired tests for irrelevant-evidence false reassurance (assignment section 3).
//
// For each flawed (UNGROUNDED) record: the original; + an irrelevant dated sentence; + an irrelevant identifier
// sentence; + an unrelated authority; + a sentence that states a linked, identifiable basis. For each clean
// (GROUNDED) record: the original; the same three irrelevant additions (false-alarm test); and the record with its
// necessary evidence removed (variant generator 2.0, V5; inapplicable records are counted as such, never as passes).
// Adversarial additions are run separately and reported as residual risks, not as passes of the repair:
// an irrelevant item the record states as the basis; an irrelevant sentence with a decision verb; an irrelevant
// evidential sentence on the decision's own date; an irrelevant sentence that names the decided item.
//
// The additions are fixed pools written for this suite, chosen by record position, and inserted after the first
// body sentence, before the last sentence, or at the end in rotation. No Engine code shapes the texts.
// Candidates (all scripted, not model output):
//   ADV          an over-claiming citer: proposes "supported" everywhere and cites the INSERTED sentence for every
//                condition it can (knowing the research markers, so its citations pass the marker check);
//   OVERCLAIM-R  the study's rule-aligned over-claimer, built on the engine under test (circular ceiling);
//   ORACLE-R     the same with the base record's designed reference;
//   OVERCLAIM, ORACLE  the study's heuristic mocks.
// Usage: node tests/paired-suite.mjs <engine-version> <scratch>   (writes out/paired-<version>/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { isolate, loadEngine, PKG } from '../tools/harness/engines.mjs';
import { substantive, recordText, designedOf, referenceOf, armsFor, score, sha } from '../tools/lib.mjs';
import { sentences, buildVariant, VARIANT_SPEC_VERSION } from '../tools/variant-spec-v2.mjs';
import { mockCandidate } from '../../study-156-2026-10-27/tools/mock-candidates.mjs';
import { alignedCandidate } from '../../study-156-2026-10-27/tools/mock-aligned.mjs';

export const PAIRED_SPEC_VERSION = 'jrs-0.3.4-paired/1.0.0';
export const POOLS = Object.freeze({
  irrelevant_date: ['The staff kitchen was repainted on 12 February.', 'A fire drill took place in the north wing on 21 January.', 'New plants were placed in the reception area on 9 December.',
    'The visitor lounge carpets were cleaned on 27 June.', 'The office windows were washed on 18 April.', 'A charity bake sale was held in the canteen on 3 November.'],
  irrelevant_identifier: ['Visitor badge VB-2207 is kept at the front desk.', 'Locker LK-118 in the basement has a new key.', 'Meeting room MR-6 now has a second projector.',
    'Desk phone extension EX-4410 was relabelled.', 'Shuttle bus SB-31 is parked at the west depot.', 'Storage cupboard CU-12 holds the spare chairs.'],
  unrelated_authority: ['Under Facilities Policy FP-9, section 4, fire doors are inspected monthly.', 'The Travel Standard TS-2 sets out mileage rates for staff vehicles.',
    'Section 12 of the Visitor Handbook governs the issue of parking permits.', 'Clause 7 of the cleaning contract covers window cleaning frequency.'],
  relevant_linked_basis: ['The decision rests on inspection report IR-4821 of 14 March, which recorded the condition the decision addresses.',
    'This outcome was based on audit note AN-3307 dated 2 May, which documents the facts relied on.', 'The decision relies on test log TL-5190 of 19 June, which shows the measured result.',
    'The outcome is supported by survey SV-6612 of 8 October, which lists the findings considered.'],
  // Residual-risk pools (adversarial). Expected to defeat a lexical rule in some cases; reported, not scored as passes.
  adversarial_stated_basis: ['The decision rests on the printer service log PL-3 of 3 February.', 'This outcome was based on canteen menu CM-12 dated 4 April.'],
  adversarial_decision_verb: ['The car park barrier was reopened on 2 March.', 'The canteen menu change was approved on 6 February.'],
});
const ADV_POOLS = ['adversarial_stated_basis', 'adversarial_decision_verb', 'adversarial_same_date', 'adversarial_subject'];
const DATE_RE = /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
// Insert one sentence: after the first body sentence, before the last, or at the end, by position in the corpus.
export function insert(text, sentence, i) {
  const ss = sentences(text);
  const title = ss.length && ss[0].split(/\s+/).length <= 8 && !/\d/.test(ss[0]) ? 1 : 0;
  const at = [Math.min(ss.length, title + 1), Math.max(title, ss.length - 1), ss.length][i % 3];
  return { text: [...ss.slice(0, at), sentence, ...ss.slice(at)].join(' '), position: ['after_first_body_sentence', 'before_last_sentence', 'at_end'][i % 3] };
}
// Adversarial additions built from the record itself: its decision date, or its decided item.
function adversarialFromRecord(text, kind) {
  const ss = sentences(text);
  const dec = ss.find((s) => /\b(?:approved|granted|awarded|refused|declined|rejected|withheld|released|extended|rated|classified|agreed|decided|attributed|raised|set|moved|authori[sz]ed|selected)\b/i.test(s));
  if (kind === 'adversarial_same_date') { const m = dec && DATE_RE.exec(dec); return m ? 'The office printer was serviced and found working on ' + m[0] + '.' : null; }
  if (kind === 'adversarial_subject') { const m = /\b(?:request|order|tender|incident|change request|work order|application)\s+([A-Z][A-Z0-9]{0,5}-\d{1,6})\b/i.exec(text); return m ? 'The tracker shows that ' + m[1] + ' was logged on 3 February.' : null; }
  return null;
}

// The adversarial citer. Quotes the inserted sentence (without its final stop) for every condition whose permitted
// assertion types it can satisfy, and the record's decision sentence for reconstructability.
export function advCandidate(text, inserted, E) {
  const M = E.research.RESEARCH_MARKERS, A = E.contract.CONDITION_ASSERTIONS;
  const ok = (q) => q && q.length >= 12 && q.length <= 400 && q.length < text.length / 2 && text.split(q).length === 2;
  const ss = sentences(text).map((s) => s.replace(/[.!?]$/, ''));
  const target = inserted ? inserted.replace(/[.!?]$/, '') : ss.slice().sort((a, b) => (b.match(/\d/g) || []).length - (a.match(/\d/g) || []).length)[0];
  const dec = ss.find((s) => M.stated_decision.test(s) && s !== target);
  const obs = []; let n = 0;
  const add = (c, q) => { if (!ok(q)) return false; const t = A[c].find((x) => M[x] && M[x].test(q)); if (!t) return false; obs.push({ observation_id: 'X' + (++n), condition_id: c, proposed_status: 'supported', quote: q, assertion_type: t }); return true; };
  add('reconstructability', dec); add('reconstructability', target);
  for (const c of ['identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency']) if (!add(c, target) && c === 'chronology_integrity') add(c, ss.find((s) => DATE_RE.test(s) && s !== target));
  for (const c of ['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency']) if (!obs.some((o) => o.condition_id === c))
    obs.push({ observation_id: 'X' + (++n), condition_id: c, proposed_status: 'not_assessed', quote: null, assertion_type: A[c][0] });
  return JSON.stringify({ contract_version: E.contract.CONTRACT_VERSION, prompt_version: E.research.RESEARCH_PROMPT_VERSION, observations: obs }, null, 2);
}

const RANK = { FLAG: 0, NOT_ASSESSED: 1, INDETERMINATE: 1, CLEAR: 2 };
export async function runPaired(E) {
  const arms = armsFor(E.version).filter((a) => ['A3', 'A4', 'A3R', 'A4R'].includes(a.id));
  const armList = [...arms.map((a) => a.id), 'ADV'];
  const versions = { contractVersion: E.contract.CONTRACT_VERSION, promptVersion: E.research.RESEARCH_PROMPT_VERSION };
  const candFor = (arm, text, reference, inserted) => arm === 'ADV' ? advCandidate(text, inserted, E)
    : arm === 'A3' ? mockCandidate(text, reference, 'ORACLE', versions) : arm === 'A4' ? mockCandidate(text, reference, 'OVERCLAIM', versions)
      : alignedCandidate(text, E.research, reference, arm === 'A3R' ? 'ORACLE-R' : 'OVERCLAIM-R', versions);
  const armOf = (id) => id === 'ADV' ? Object.assign({}, arms.find((a) => a.id === 'A4R'), { id: 'ADV', mock: 'ADV' }) : arms.find((a) => a.id === id);
  const rows = [];
  let pos = 0;
  for (const e of substantive) {
    const id = e.source_id, base = recordText(id), d = designedOf(id), ref = referenceOf(id), refE1 = d ? d.e1 : (typeof ref === 'string' ? ref : ref.e1);
    const reference = { e1: refE1, chronology_conflict: !!(d && d.q3 === 'same_event_two_dates') };
    // Record-level rule gaps, with no candidate evidence: what the rules alone see in the text.
    const ruleGaps = (text) => { const u = E.research.sentenceUnits(text); const c = E.research.evaluateResearchConditions(text, E.record.sectionsOf(text), u, E.research.researchEvents(text, u), {}, new Set(E.research.RESEARCH_RULES));
      return [...new Set(['reconstructability', 'identifiable_basis', 'reasoning_traceability'].flatMap((k) => c[k].visible_gaps.concat(c[k].review_reasons.filter((x) => /^(?:authority_reference_without_linked_facts|conclusion_without_identifiable_basis)$/.test(x)))))].sort(); };
    const one = (arm, text, inserted, construction) => { const cand = candFor(arm, text, reference, inserted); const r = score(E, armOf(arm), { text, id, cand, designed: d, fixtureId: id + '~P' });
      const flaws = Object.fromEntries(['reconstructability', 'identifiable_basis', 'reasoning_traceability'].map((c) => [c, (r.reasons[c] || []).filter((x) => /visible_gap:|rule:(?:authority_reference|conclusion_without)/.test(x))]));
      // Conditions whose candidate citations include the inserted sentence.
      const s0 = inserted ? text.indexOf(inserted.replace(/[.!?]$/, '')) : -1, s1 = s0 + (inserted ? inserted.length : 0);
      const citesInserted = cand && inserted ? [...new Set(JSON.parse(cand).observations.filter((o) => o.quote && (() => { const at = text.indexOf(o.quote); return at >= 0 && at < s1 && s0 < at + o.quote.length; })()).map((o) => o.condition_id))] : [];
      return { arm, construction, e1: r.e1, disposition: r.disposition, statuses: r.observed ? r.observed.statuses : null, flaw_reasons: flaws, cites_inserted: citesInserted, guards: r.guards, mechanical: r.mechanical, text_sha256: sha(text) }; };
    const baseRows = Object.fromEntries(armList.map((a) => [a, one(a, base, null, 'original')]));
    const baseGaps = ruleGaps(base);
    const kinds = refE1 === 'UNGROUNDED' ? ['irrelevant_date', 'irrelevant_identifier', 'unrelated_authority', 'relevant_linked_basis', ...ADV_POOLS]
      : ['irrelevant_date', 'irrelevant_identifier', 'unrelated_authority', 'evidence_removed', ...ADV_POOLS];
    for (const k of kinds) {
      let sentence = null, text = null, construction;
      if (k === 'evidence_removed') {
        const v = buildVariant('V5', { text: base, e1: refE1, chronology_conflict: false }, pos);
        if (!v.constructible) { rows.push({ id, reference: refE1, kind: k, constructible: false, reason: v.reason }); continue; }
        text = v.text; construction = v.construction;
      } else {
        sentence = POOLS[k] ? POOLS[k][pos % POOLS[k].length] : adversarialFromRecord(base, k);
        if (!sentence) { rows.push({ id, reference: refE1, kind: k, constructible: false, reason: 'the record has no decision date or decided-item identifier to reuse' }); continue; }
        const ins = insert(base, sentence, pos); text = ins.text; construction = ins.position + ': "' + sentence + '"';
      }
      const varGaps = ruleGaps(text);
      const gapsLost = baseGaps.filter((g) => !varGaps.includes(g)), gapsAdded = varGaps.filter((g) => !baseGaps.includes(g));
      for (const a of armList) {
        const b = baseRows[a], v = one(a, text, sentence, construction);
        const newlySupported = ['reconstructability', 'identifiable_basis', 'reasoning_traceability'].filter((c) => v.statuses && b.statuses && v.statuses[c] === 'supported' && b.statuses[c] !== 'supported');
        const viaInserted = newlySupported.filter((c) => v.cites_inserted.includes(c));
        const lostFlaws = ['reconstructability', 'identifiable_basis', 'reasoning_traceability'].filter((c) => b.flaw_reasons[c].length && !v.flaw_reasons[c].length);
        let pass = null, relation, cause = null;
        if (ADV_POOLS.includes(k)) relation = 'residual (reported, not scored)';
        else if (k === 'relevant_linked_basis') relation = 'informational: does the engine still see linked evidence when it is added';
        else if (k === 'evidence_removed') { relation = 'E1 is not CLEAR'; pass = v.e1 !== 'CLEAR'; }
        else if (refE1 === 'UNGROUNDED') { relation = 'the rules lose no flaw gap; E1 not improved; no condition newly supported through the inserted sentence'; pass = !gapsLost.length && RANK[v.e1] <= RANK[b.e1] && !viaInserted.length; }
        else { relation = 'the rules add no gap (false alarm); no condition newly supported through the inserted sentence'; pass = !gapsAdded.length && !viaInserted.length; }
        // An E1 change that the relation does not count: the inserted sentence changed which passages a scripted candidate quoted.
        if (pass && v.e1 !== b.e1) cause = 'candidate_citations_changed (rule gaps unchanged; inserted sentence not used for a newly supported condition)';
        rows.push({ id, reference: refE1, kind: k, arm: a, constructible: true, construction, base_e1: b.e1, variant_e1: v.e1, rule_gaps_lost: gapsLost, rule_gaps_added: gapsAdded,
          newly_supported: newlySupported, newly_supported_via_inserted: viaInserted, lost_flaw_reasons: lostFlaws, relation, pass, e1_change_cause: cause,
          technical: v.disposition === 'technical_failure' || b.disposition === 'technical_failure', guards: v.guards });
      }
    }
    pos++;
  }
  return { rows, arms: armList };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const [version, scratch] = process.argv.slice(2);
  if (!version || !scratch) { console.error('usage: paired-suite.mjs <engine-version> <scratch>'); process.exit(2); }
  const OUT = join(PKG, 'out', 'paired-' + version);
  if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
  const pre = V.checkNetworkMarkers(process.env, {}); if (pre.length) { console.error('stopped:', pre.join('; ')); process.exit(3); }
  mkdirSync(scratch, { recursive: true });
  const iso = isolate(version, scratch, { requireManifest: version !== '0.3.4-research-candidate' || existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
  const E = await loadEngine(iso);
  const { rows, arms } = await runPaired(E);
  const rel = iso.release();
  const tally = {};
  for (const r of rows) { const k = r.reference + '/' + r.kind + '/' + (r.arm || '-'); tally[k] = tally[k] || { n: 0, pass: 0, fail: 0, not_constructible: 0, clear: 0, flag: 0, flag_lost: 0, technical: 0 };
    const t = tally[k]; t.n++; if (!r.constructible) { t.not_constructible++; continue; } if (r.pass === true) t.pass++; if (r.pass === false) t.fail++; if (r.variant_e1 === 'CLEAR') t.clear++; if (r.variant_e1 === 'FLAG') t.flag++;
    if (r.e1_change_cause) t.e1_changed_candidate_side = (t.e1_changed_candidate_side || 0) + 1; if ((r.rule_gaps_lost || []).length) t.rule_gaps_lost = (t.rule_gaps_lost || 0) + 1;
    if (r.base_e1 === 'FLAG' && r.variant_e1 !== 'FLAG') t.flag_lost++; if (r.technical) t.technical++; }
  const out = { results_format: 'jrs-0.3.4-paired-results/1.0.0', spec: PAIRED_SPEC_VERSION, variant_spec: VARIANT_SPEC_VERSION, engine: { version, manifest_sha256: iso.manifest_sha256, snapshot_sha256: iso.snapshot_sha256, released: rel },
    statement: 'Offline paired tests with scripted candidates. Records are exposed development material written by the rule author; results are development evidence, not accuracy.',
    arms, network_attempts: attempts.length, tally, rows };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
  for (const [k, t] of Object.entries(tally).sort()) console.log(k.padEnd(52), JSON.stringify(t));
  console.log('network', attempts.length, 'released', JSON.stringify(rel));
}
