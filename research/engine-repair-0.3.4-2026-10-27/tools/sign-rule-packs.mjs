// 0.3.4 repair package: re-binds the seven 0.3.2 rule packs to 0.3.4-research-candidate (candidate_version only;
// rule content unchanged), writes the research pack RPK-SRP 2.0.0 (RP-SRP-01 to RP-SRP-13) into
// rule-packs-research/, and signs every pack with the candidate's own content seal.
// Version 2.0 of the study signer (research/study-156-2026-10-27/tools/sign-rule-packs.mjs, unchanged).
// Linked scenarios name the study's development partition and the probes of this package. Every study record is
// now exposed development material (registers/EXPOSURE_REGISTER.json), so no link implies an unseen test.
// Usage: node tools/sign-rule-packs.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'candidate', 'lib', 'engine-evidence-graph-v0.3.4-research-candidate');
const { contentSeal, validateRulePacks } = await import(pathToFileURL(join(PK, 'rule-packs.mjs')).href);
const V = '0.3.4-research-candidate';
const DIR = join(PK, 'rule-packs');
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const k = JSON.parse(readFileSync(join(DIR, f), 'utf8'));
  k.candidate_version = V;
  k.signature = { method: 'sha256-canonical-content-seal', content_sha256: contentSeal(k) };
  writeFileSync(join(DIR, f), JSON.stringify(k, null, 2) + '\n');
}
const dev = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => 'S-' + String(a + i).padStart(3, '0'));
const OWNER = 'Not adopted. Any use outside this study, any widening of a trigger, or any change of outcome requires a recorded owner decision and a new sealed scenario set.';
const rule = (rule_id, purpose, trigger, expected_safe_outcome, limitation, false_positive_risk, linked_scenarios) =>
  ({ rule_id, purpose, trigger, expected_safe_outcome, limitation, false_positive_risk, linked_scenarios, owner_decision_for_expansion: OWNER });
const srp = { candidate_version: V, pack_id: 'RPK-SRP', pack_version: '2.0.0',
  purpose: 'Study research profile for prose decision records, repaired after the 156-record study (0.3.4 repair assignment). Active only through an enabled research profile.',
  rules: [
    rule('RP-SRP-01', 'Read study records that have no "Label:" headings.', 'Split the record into sentence units and mark each with lexical roles: decision, basis cue, authority reference, added conclusion. A first sentence with no verb is a title and has no role.',
      'review_required', 'Lexical role words only; a decision or reason phrased without the listed words is missed.', 'Descriptive sentences that use a decision word are treated as decision units.', ['R03', 'R08', 'R15', 'R22', ...dev(1, 10)]),
    rule('RP-SRP-02', 'Find identifiable material in prose.', 'Find dates, identifiers, quantities, measurements and on-file documents, excluding the identifier of the thing decided, the figures inside an authority statement, the date attached to a decision verb, title metadata and instruction text. Verb forms are not read as plural quantities.',
      'review_required', 'An anchor shows that something specific is mentioned, not that it supports the conclusion; whether it counts is decided by RP-SRP-09.', 'A count written as a word or an unlisted unit is missed.', ['R08', 'R15', ...dev(1, 20), 'S-043']),
    rule('RP-SRP-03', 'Question 3: do two dates concern the same event or different events?', 'Give each date an event key from the nearest event word. Two dates conflict only when their keys, instance words, planned status and any identifiers match. In K6, two cited dates with different known keys are not compared; an unknown key keeps the comparison.',
      'conflict_and_review', 'Event words are a fixed list; an unlisted event gets no key.', 'Two different events named with the same word and no instance word are flagged as one event with two dates.', ['S-007', 'S-008', 'S-017', 'S-018', 'S-027', 'S-028', 'S-037', 'S-038']),
    rule('RP-SRP-04', 'Question 4: do apparent contradictions concern separate requests?', 'In K6, opposite cited decisions are not compared when their units name different subject identifiers, when the record marks several decisions and the units differ, or when one unit records a partial outcome.',
      'conflict_and_review', 'Subject identifiers and multi-decision markers are lexical.', 'A real contradiction between two differently numbered items for the same request would be missed.', ['S-009', 'S-019', 'S-029', 'S-039']),
    rule('RP-SRP-05', 'Flag opposite outcomes for the same item.', 'Two decision units with opposite outcomes that share a subject identifier, or with no identifier share the object of the outcome verb, neither partial, raise a decision_outcome_conflict affecting reconstructability and reasoning traceability.',
      'conflict_and_review', 'Needs a shared identifier or the same verb object; other contradictions are not detected.', 'A record that reverses an outcome on appeal is flagged.', ['S-009', 'S-019', 'S-029', 'S-039']),
    rule('RP-SRP-06', 'Question 1: does an authority reference establish the basis?', 'When a decision cites an authority and no evidence is linked to the decision, stated or inferred, identifiable basis is routed to review with authority_reference_without_linked_facts; it can never be supported.',
      'review_required', 'Whether the cited authority itself settles the outcome is a judgement the rule cannot make.', 'A record whose authority alone settles the outcome, with the facts described in words, is flagged.', ['S-004', 'S-005', 'S-014', 'S-015', 'S-024', 'S-025', 'S-034', 'S-035']),
    rule('RP-SRP-07', 'Question 2: does a repeated conclusion explain the decision?', 'With no stated-link evidence, a reason that repeats the decision or uses a listed restatement phrase is a visible gap conclusion_restated_as_basis; a decision with no reason, no linked evidence and no cited authority is conclusion_without_stated_basis.',
      'review_required', 'The restatement phrase list is short and lexical.', 'A brief but genuine reason without a date or identifier is flagged.', ['S-003', 'S-006', 'S-013', 'S-016', 'S-023', 'S-026', 'S-033', 'S-036']),
    rule('RP-SRP-08', 'Apply only the checks that fit study records.', 'Expiry, compensating-control and labelled-section linkage rules are not applied. An added conclusion, or one of several decisions about different subjects, needs linked evidence of its own; otherwise a visible gap conclusion_without_identifiable_basis is recorded.',
      'review_required', 'Which checks fit a record type is a design choice, not a finding.', 'A secondary decision whose basis is an absence (for example "no test report was submitted") is flagged.', ['S-009', 'S-010', 'S-019', 'S-020', 'S-029', 'S-030', 'S-039', 'S-040']),
    rule('RP-SRP-09', 'Count only evidence the record links to a decision.', 'An anchor supports a condition only when it sits in a decision sentence, in a sentence that gives a reason and refers to a decision, in an earlier sentence that such a reason names by reference ("that survey"), or in a sentence naming the same identifier or the same dated event as linked evidence. Two kinds of inferred link prevent a no-evidence flag and never support: facts stating a measurement in the same unit as a condition of a cited authority, and a sentence reporting evidence about what a decision concerns (its subject identifier, a named party or item, or a value the decision sentence states). Shared ordinary words are not used. Other anchors are reported as unlinked and not counted. Title metadata is never evidence.',
      'review_required', 'Links are words. An irrelevant item the record explicitly states as the basis is treated as a stated basis; an irrelevant sentence that shares a decision value or names the decided subject is an inferred link and can stop a no-evidence flag; a relevant fact the record does not link is not counted.', 'A grounded record that states its evidence without linking it to the decision is flagged or routed to review.', ['S-001', 'S-004', 'S-041', 'S-075', 'S-094', 'S-096', 'TPA-01', 'TPA-02']),
    rule('RP-SRP-10', 'Tell events apart and keep chronology on the decision path.', 'Instance words (next, previous, second, revised and similar) and planned wording make a different event; a comma inside a number does not cut the event window; added process words carry event keys; chronology counts dated events in decision sentences and linked-evidence sentences only, never a title date.',
      'conflict_and_review', 'Instance and planned words are a fixed list.', 'A real conflict between a planned and a past mention of one event is not flagged.', ['S-097', 'S-009', 'S-049', 'S-062']),
    rule('RP-SRP-11', 'Screen study records for instructions to the reviewing system.', 'Text addressed to a reviewing system, or directing how the record is assessed, is quarantined: its anchors and roles are dropped, every condition is routed to review, and visible gaps in the rest of the record are still reported.',
      'review_required', 'Lexical patterns; a phrasing with no pattern is missed. The screen does not prevent a model from obeying text it misses.', 'A record that quotes or discusses an instruction (for example a phishing email) is routed to review.', ['TIN-01', 'TIN-02', 'TIN-03']),
    rule('RP-SRP-12', 'Find decisions phrased with other verbs.', 'Decision verb families (change of state with a target, endorsement by a named decision-maker, willingness or resolution to act, stopping or reversing, go-ahead) mark decision units. When the rules find none and the candidate quotes a verified decision, reconstructability is routed to review instead of a no-conclusion gap.',
      'review_required', 'Still a word list; a decision phrased outside the families is missed. The candidate-located decision is never used to link evidence.', 'A descriptive sentence using a family verb is read as a decision.', ['S-041', 'S-063', 'TWD-01']),
    rule('RP-SRP-13', 'One control per defect, traced to record passages.', 'Controls are consolidated by defect; each lists every affected condition and the record passages concerned, and labels detect as observed or absent, reflect as an inferred concern, correct as a requested clarification and learn as a template suggestion.',
      'review_required', 'Passages are the decision and anchor spans the rules used; a control does not show which fact is missing.', 'One control may group passages that a reviewer would treat separately.', ['S-029', 'TCC-01']),
  ] };
srp.signature = { method: 'sha256-canonical-content-seal', content_sha256: contentSeal(srp) };
const RDIR = join(PK, 'rule-packs-research');
mkdirSync(RDIR, { recursive: true });
writeFileSync(join(RDIR, 'RPK-SRP.json'), JSON.stringify(srp, null, 2) + '\n');
const packs = readdirSync(DIR).filter((x) => x.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')));
const v = validateRulePacks(packs);
const { RESEARCH_RULES } = await import(pathToFileURL(join(PK, 'research-profile.mjs')).href);
const r = validateRulePacks([srp], RESEARCH_RULES);
console.log('default packs', packs.length, 'valid', v.ok, [...v.active].sort().join(','), v.problems.join('; '));
console.log('research pack valid', r.ok, [...r.active].sort().join(','), r.problems.join('; '));
