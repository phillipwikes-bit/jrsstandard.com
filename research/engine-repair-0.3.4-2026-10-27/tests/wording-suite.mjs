// 0.3.4 repair package: unfamiliar wording, title lines and date distinctions (assignment section 5).
//
// Short probe records written for this suite by the developer who wrote the rules. They are NOT independent: they
// show where the lexical rules act and where they stop. Every probe states an expected outcome and a class:
//   capability  the repaired rules are meant to handle this; a failure is a defect
//   boundary    outside the rules' word lists or patterns by design; the expected outcome is a MISS, recorded so
//               that the narrowness of the capability is measured rather than assumed
// No candidate is used except where a probe names one. Offline only.
// Usage: node tests/wording-suite.mjs <engine-version> <scratch>   (writes out/wording-<version>/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { isolate, loadEngine, PKG } from '../tools/harness/engines.mjs';

export const WORDING_SPEC_VERSION = 'jrs-0.3.4-wording/1.0.0';
const T = 'Decision record. ';
// [id, area, class, text, expectation, check]  check(E, text) -> { ok, observed }
const decides = (needle) => (E, t) => { const u = E.research.sentenceUnits(t).find((x) => x.text.includes(needle)); return { ok: !!(u && u.decision), observed: u ? u.decision : 'unit not found' }; };
const misses = (needle) => (E, t) => { const u = E.research.sentenceUnits(t).find((x) => x.text.includes(needle)); return { ok: !!(u && !u.decision), observed: u ? u.decision : 'unit not found' }; };
const gaps = (E, t) => { const R = E.research; const u = R.sentenceUnits(t); return R.evaluateResearchConditions(t, E.record.sectionsOf(t), u, R.researchEvents(t, u), {}, new Set(R.RESEARCH_RULES)); };
const linked = (anchor) => (E, t) => { const a = E.research.sentenceUnits(t).flatMap((u) => u.basis_anchors).find((x) => x.text === anchor); return { ok: !!a, observed: a ? a.link : 'not linked' }; };
const notLinked = (anchor) => (E, t) => { const u = E.research.sentenceUnits(t); const strong = u.flatMap((x) => x.basis_anchors).some((x) => x.text === anchor); const weak = u.flatMap((x) => x.weak_anchors || []).some((x) => x.text === anchor); return { ok: !strong, observed: strong ? 'stated link' : weak ? 'inferred link only' : 'unlinked' }; };
const conflict = (want) => (E, t) => { const R = E.research; const u = R.sentenceUnits(t); const k = R.detectResearchConflicts(t, u, R.researchEvents(t, u), new Set(R.RESEARCH_RULES)).map((x) => x.kind); return { ok: want ? k.includes('same_event_date_conflict') : !k.includes('same_event_date_conflict'), observed: k }; };
const outcomeConflict = (want) => (E, t) => { const R = E.research; const u = R.sentenceUnits(t); const k = R.detectResearchConflicts(t, u, R.researchEvents(t, u), new Set(R.RESEARCH_RULES)).map((x) => x.kind); return { ok: want ? k.includes('decision_outcome_conflict') : !k.includes('decision_outcome_conflict'), observed: k }; };
const notOnPath = (raw) => (E, t) => { const c = gaps(E, t).chronology_integrity; const p = (c.path_events || []).map((e) => e.raw); return { ok: !p.includes(raw), observed: p }; };
const onPath = (raw) => (E, t) => { const c = gaps(E, t).chronology_integrity; const p = (c.path_events || []).map((e) => e.raw); return { ok: p.includes(raw), observed: p }; };
const noEvidenceGap = (want) => (E, t) => { const g = gaps(E, t).identifiable_basis.visible_gaps; return { ok: want ? g.includes('no_identifiable_basis_evidence') : !g.includes('no_identifiable_basis_evidence'), observed: g }; };

export const PROBES = Object.freeze([
  // ---------------------------------------------------------------- A. decision verbs and structures
  ['WD-01', 'decision_verbs', 'capability', T + 'The panel endorsed the proposal on 4 May.', 'decision unit', decides('endorsed')],
  ['WD-02', 'decision_verbs', 'capability', T + 'The board resolved to fund the pilot.', 'decision unit', decides('resolved')],
  ['WD-03', 'decision_verbs', 'capability', T + 'The committee voted against the change.', 'decision unit', decides('voted')],
  ['WD-04', 'decision_verbs', 'capability', T + 'The deadline was moved to 12 May by the sponsor.', 'decision unit', decides('moved')],
  ['WD-05', 'decision_verbs', 'capability', T + 'The supplier contract was terminated on 1 July.', 'decision unit', decides('terminated')],
  ['WD-06', 'decision_verbs', 'capability', T + 'Funding was reallocated to the materials line.', 'decision unit', decides('reallocated')],
  ['WD-07', 'decision_verbs', 'capability', T + 'The trial was paused on 8 August.', 'decision unit', decides('paused')],
  ['WD-08', 'decision_verbs', 'capability', T + 'The manager signed off the budget for 2027.', 'decision unit', decides('signed off')],
  ['WD-09', 'decision_verbs', 'capability', T + 'The steering group was content to extend the pilot.', 'decision unit', decides('content to extend')],
  ['WD-10', 'decision_verbs', 'capability', T + 'The award to Delta Ltd was issued on 2 June.', 'decision unit (a decision noun issued)', decides('award to Delta')],
  ['WD-11', 'decision_verbs', 'capability', T + 'The safety lead prioritised the east wing repairs.', 'decision unit', decides('prioritised')],
  ['WD-12', 'decision_verbs', 'boundary', T + 'The request was turned down on 9 June.', 'missed: "turned down" is not in the lists', misses('turned down')],
  ['WD-13', 'decision_verbs', 'boundary', T + 'The proposal goes ahead from next month.', 'missed: "goes ahead"', misses('goes ahead')],
  ['WD-14', 'decision_verbs', 'boundary', T + 'Permission stands for the second phase.', 'missed: "stands"', misses('Permission stands')],
  ['WD-15', 'decision_verbs', 'boundary', T + 'The appeal was successful.', 'missed: outcome as an adjective', misses('appeal was successful')],
  ['WD-16', 'decision_verbs', 'boundary', T + 'The vendor got the contract.', 'missed: "got"', misses('vendor got')],
  ['WD-17', 'decision_verbs', 'boundary', T + 'Go-ahead given for phase 2.', 'missed: verbless go-ahead', misses('Go-ahead given')],
  // Added before the freeze, found while writing the MV-25 regression probe: an active "approved" whose actor is not in
  // the role list and whose object starts with a number.
  ['WD-41', 'decision_verbs', 'boundary', T + 'The librarian approved 18 metres of new shelving for the reading room.', 'missed: actor outside the role list, object starting with a number', misses('librarian approved')],
  // ---------------------------------------------------------------- B. headings and section order
  ['WD-18', 'structure', 'capability', 'Decision record.\nDecision: The board approved change CR-7 on 6 March because test report TR-3 of 4 March shows the rollback passing.', 'labelled line still links TR-3', linked('TR-3')],
  ['WD-19', 'structure', 'capability', 'Decision record. Test report TR-3 of 4 March shows the rollback passing. The board approved change CR-7 on 6 March. The approval relies on test report TR-3.', 'evidence before the decision, linked by the stated reliance', linked('TR-3')],
  ['WD-20', 'structure', 'capability', 'Decision record. The board approved change CR-7 on 6 March. The approval relies on test report TR-3. Test report TR-3 of 4 March shows the rollback passing.', 'evidence after the decision, linked through the shared identifier', linked('4 March')],
  ['WD-21', 'structure', 'capability', 'Background\nThe rollback was rehearsed.\nBasis\nTest report TR-3 of 4 March shows the rollback passing.\nOutcome\nThe board approved change CR-7 on 6 March, citing test report TR-3.', 'headings on their own lines; TR-3 linked', linked('TR-3')],
  ['WD-22', 'structure', 'capability', 'Change approval summary, version 2, 4 March. The board approved change CR-7 on 6 March.', 'a title with a version and a date is metadata: no evidence', noEvidenceGap(true)],
  // ---------------------------------------------------------------- C. explicit and implicit references
  ['WD-23', 'references', 'capability', T + 'The survey of 9 May (report SV-2) measured 2 litres per hour of ingress. The order was raised to priority 1 on the strength of that survey.', 'anaphoric source ("that survey") is a stated link', linked('SV-2')],
  ['WD-24', 'references', 'capability', T + 'The survey of 9 May (report SV-2) measured 2 litres per hour of ingress. The order was raised to priority 1.', 'facts not linked in words: no stated link', notLinked('SV-2')],
  ['WD-25', 'references', 'boundary', T + 'The survey of 9 May (report SV-2) measured 2 litres per hour of ingress. As noted above, the order was raised to priority 1.', 'missed: "as noted above" is not read as a link', notLinked('SV-2')],
  ['WD-26', 'references', 'capability', T + 'Work order WO-55 was raised to priority 1 on 9 May. Work order WO-55 was surveyed on 8 May and the survey measured 2 litres per hour.', 'facts naming the decided item are an inferred link: they stop the no-evidence flag', noEvidenceGap(false)],
  ['WD-27', 'references', 'capability', T + 'Work order WO-55 was raised to priority 1 on 9 May. Locker LK-4 was cleaned on 3 February.', 'an unrelated identifier does not stop the no-evidence flag', noEvidenceGap(true)],
  // ---------------------------------------------------------------- D. dates
  ['WD-28', 'dates', 'capability', T + 'The committee meeting was held on 7 August. The minutes record that the committee meeting was held on 9 August.', 'same event, two dates: conflict', conflict(true)],
  ['WD-29', 'dates', 'capability', T + 'The request was received on 3 May. The request was approved on 9 May.', 'different events: no conflict', conflict(false)],
  ['WD-30', 'dates', 'capability', T + 'Request RQ-1 was received on 3 May. Request RQ-2 was received on 9 May.', 'different requests: no conflict', conflict(false)],
  ['WD-31', 'dates', 'capability', 'Meeting summary, steering committee, 7 August. The next committee meeting is on 4 September.', 'title date and the next meeting: no conflict', conflict(false)],
  ['WD-32', 'dates', 'capability', T + 'The original deadline was 3 May. The revised deadline was 10 May.', 'original and revised instances: no conflict', conflict(false)],
  ['WD-33', 'dates', 'capability', T + 'The previous review took place on 2 March. The review took place on 6 April and found no defects. The board approved the change on 8 April because the review found no defects.', 'previous and current review: no conflict', conflict(false)],
  ['WD-34', 'dates', 'capability', 'Committee summary, 7 August. The pilot was extended to 30 November under paragraph 4.', 'a title date is not on the decision path', notOnPath('7 August')],
  ['WD-35', 'dates', 'capability', T + 'The manager approved the repair on 5 April because inspection report IR-9 of 2 April found a cracked weld.', 'decision date and linked evidence date are both on the path', onPath('2 April')],
  ['WD-36', 'dates', 'capability', T + 'This summary was extracted from the case system on 30 October. The manager approved the repair on 5 April because inspection report IR-9 of 2 April found a cracked weld.', 'an extraction date is not on the decision path', notOnPath('30 October')],
  ['WD-37', 'dates', 'capability', T + 'Policy P-3, published 1 May, sets out repair limits. The manager approved the repair on 5 April under Policy P-3 because inspection report IR-9 of 2 April found a cracked weld.', 'a publication date inside an authority citation is not linked evidence', notLinked('1 May')],
  ['WD-38', 'dates', 'boundary', T + 'The vendor report is due on 29 August. The vendor report was received on 3 September.', 'a planned and an actual mention of one report are not compared', conflict(false)],
  ['WD-39', 'dates', 'capability', T + 'The release manager authorized deployment on 19 September. The release manager refused deployment on 19 September.', 'opposite outcomes for the same unnumbered object: conflict', outcomeConflict(true)],
  ['WD-40', 'dates', 'capability', T + 'Release 5.2 was approved on 19 September because run RS-1 passed. Release 5.3 was refused on 19 September because scan SC-4 failed.', 'opposite outcomes for different items: no conflict', outcomeConflict(false)],
]);

export async function runWording(E) {
  return PROBES.map(([id, area, cls, text, expectation, check]) => { let r; try { r = check(E, text); } catch (e) { r = { ok: false, observed: 'threw: ' + String(e.message).slice(0, 160) }; }
    return { id, area, class: cls, expectation, ok: !!r.ok, observed: r.observed, text }; });
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const [version, scratch] = process.argv.slice(2);
  if (!version || !scratch) { console.error('usage: wording-suite.mjs <engine-version> <scratch>'); process.exit(2); }
  const OUT = join(PKG, 'out', 'wording-' + version);
  if (existsSync(OUT)) { console.error('exists: ' + OUT); process.exit(2); }
  const pre = V.checkNetworkMarkers(process.env, {}); if (pre.length) { console.error('stopped:', pre.join('; ')); process.exit(3); }
  mkdirSync(scratch, { recursive: true });
  const iso = isolate(version, scratch, { requireManifest: version !== '0.3.4-research-candidate' || existsSync(join(PKG, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')) });
  const E = await loadEngine(iso);
  const rows = await runWording(E);
  const rel = iso.release();
  const by = {}; for (const r of rows) { const k = r.area + '/' + r.class; by[k] = by[k] || { n: 0, as_expected: 0 }; by[k].n++; if (r.ok) by[k].as_expected++; }
  const out = { results_format: 'jrs-0.3.4-wording-results/1.0.0', spec: WORDING_SPEC_VERSION, engine: { version, manifest_sha256: iso.manifest_sha256, released: rel },
    statement: 'Probe texts were written by the rule author. "boundary" probes record expected misses. Nothing here measures performance on wording the author did not anticipate.', network_attempts: attempts.length, by, rows };
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(by), 'network', attempts.length);
  for (const r of rows.filter((x) => !x.ok)) console.log(r.id, r.class, r.expectation, '=>', JSON.stringify(r.observed).slice(0, 160));
}
