// 156-record study: re-binds the seven 0.3.2 rule packs to 0.3.3-research-candidate (candidate_version only; rule
// content unchanged), writes the research pack RPK-SRP into rule-packs-research/ (loaded only by an enabled research
// profile), and signs every pack with the candidate's own content seal. Linked scenarios name development-partition
// records only; no evaluation-partition record is linked to any rule.
// Usage: node tools/sign-rule-packs.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'candidate', 'lib', 'engine-evidence-graph-v0.3.3-research-candidate');
const { contentSeal, validateRulePacks } = await import(pathToFileURL(join(PK, 'rule-packs.mjs')).href);
const V = '0.3.3-research-candidate';
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
const srp = { candidate_version: V, pack_id: 'RPK-SRP', pack_version: '1.0.0',
  purpose: 'Study research profile for prose decision records (156-record study assignment). Active only through an enabled research profile.',
  rules: [
    rule('RP-SRP-01', 'Read study records that have no "Label:" headings.', 'Split the record into sentence units and mark each with lexical roles: decision, basis cue, authority reference, added conclusion.',
      'review_required', 'Lexical role words only; a decision or reason phrased without the listed words is missed.', 'Descriptive sentences that use a decision word are treated as decision units.', ['R03', 'R08', 'R15', 'R22', ...dev(1, 10)]),
    rule('RP-SRP-02', 'Find identifiable evidence in prose.', 'Count dates, identifiers, quantities and on-file documents as evidence anchors, excluding the identifier of the thing decided, the figures inside an authority statement, and the date attached to a decision verb.',
      'review_required', 'An anchor shows that something specific is cited, not that it supports the conclusion.', 'An irrelevant dated or numbered sentence counts as an anchor.', ['R08', 'R15', ...dev(1, 20)]),
    rule('RP-SRP-03', 'Question 3: do two dates concern the same event or different events?', 'Give each date an event key from the nearest event word. Two dates conflict only when their keys and any identifiers match. In K6, two cited dates with different known keys are not compared; an unknown key keeps the comparison.',
      'conflict_and_review', 'Event words are a fixed list; an unlisted event gets no key.', 'Two different events named with the same word are flagged as one event with two dates.', ['S-007', 'S-008', 'S-017', 'S-018', 'S-027', 'S-028', 'S-037', 'S-038']),
    rule('RP-SRP-04', 'Question 4: do apparent contradictions concern separate requests?', 'In K6, opposite cited decisions are not compared when their units name different subject identifiers, when the record marks several decisions and the units differ, or when one unit records a partial outcome.',
      'conflict_and_review', 'Subject identifiers and multi-decision markers are lexical.', 'A real contradiction between two differently numbered items for the same request would be missed.', ['S-009', 'S-019', 'S-029', 'S-039']),
    rule('RP-SRP-05', 'Flag opposite outcomes for the same item.', 'Two decision units with opposite outcomes that share a subject identifier, neither partial, raise a decision_outcome_conflict affecting reconstructability and reasoning traceability.',
      'conflict_and_review', 'Needs a shared identifier; a contradiction about an unnumbered item is not detected.', 'A record that reverses an outcome on appeal is flagged.', ['S-009', 'S-019', 'S-029', 'S-039']),
    rule('RP-SRP-06', 'Question 1: does an authority reference establish the basis?', 'When the record cites an authority and contains no evidence anchor outside the authority statement, identifiable basis is routed to review with authority_reference_without_linked_facts; it can never be supported.',
      'review_required', 'Whether the cited authority itself settles the outcome is a judgement the rule cannot make.', 'A record whose authority alone settles the outcome, with the facts described in words, is flagged.', ['S-004', 'S-005', 'S-014', 'S-015', 'S-024', 'S-025', 'S-034', 'S-035']),
    rule('RP-SRP-07', 'Question 2: does a repeated conclusion explain the decision?', 'With no evidence anchor in the record, a reason that repeats the decision or uses a listed restatement phrase is a visible gap conclusion_restated_as_basis; a decision with no reason at all is conclusion_without_stated_basis.',
      'review_required', 'The restatement phrase list is short and lexical.', 'A brief but genuine reason without a date or identifier is flagged.', ['S-003', 'S-006', 'S-013', 'S-016', 'S-023', 'S-026', 'S-033', 'S-036']),
    rule('RP-SRP-08', 'Apply only the checks that fit study records.', 'Expiry, compensating-control and labelled-section linkage rules are not applied. An added conclusion, or one of several decisions about different subjects, needs evidence of its own; otherwise a visible gap conclusion_without_identifiable_basis is recorded.',
      'review_required', 'Which checks fit a record type is a design choice, not a finding.', 'A secondary decision whose basis is an absence (for example "no test report was submitted") is flagged.', ['S-009', 'S-010', 'S-019', 'S-020', 'S-029', 'S-030', 'S-039', 'S-040']),
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
