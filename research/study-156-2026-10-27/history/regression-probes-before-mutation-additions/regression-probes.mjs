// 156-record study: historical regression probes for defects D1 to D18 (DEVELOPMENT_LOG.md). Each probe asserts the
// corrected behaviour on the development record where the defect was found, or on the probe text that found it.
// Development partition only. The default-path regression suites of earlier phases are covered by the 310-input
// differential and the 343 feature probes, which show 0.3.3 with the profile off equal to 0.3.2.
// Usage: node tools/regression-probes.mjs <scratch>   (writes out/regression-probes/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolate, loadEngine } from './harness/engines.mjs';
import { classifyE1 } from './scoring.mjs';
import { PROFILE, STUDY_SCOPE } from './research-probes.mjs';
import { conflictKinds } from './compile-row.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const rec = (id) => readFileSync(join(PKG, 'records', id.startsWith('R') ? 'original' : 'synthetic', id + '.txt'), 'utf8');
const mock = (policy, id) => JSON.parse(readFileSync(join(PKG, 'mocks', policy, id + '.json'), 'utf8')).envelope.content[0].text;

export async function runRegressionProbes(E) {
  const R = E.research, out = [];
  const probe = (defect, record, expect, fn) => { let r; try { r = fn(); } catch (e) { r = { ok: false, observed: 'threw: ' + String(e && e.message).slice(0, 200) }; }
    out.push({ id: 'RG-' + String(out.length + 1).padStart(2, '0'), defect, record, expect, ok: !!r.ok, observed: r.observed === undefined ? null : r.observed }); };
  const rules = new Set(R.RESEARCH_RULES);
  const units = (t) => R.sentenceUnits(t);
  const conflicts = (t) => { const u = units(t); return R.detectResearchConflicts(t, u, R.researchEvents(t, u), rules).map((k) => k.kind); };
  const dv = Object.assign({}, E.declaredVersions, { prompt_version: R.RESEARCH_PROMPT_VERSION });
  const compile = (text, cand, profile = PROFILE) => E.compiler.compileEvidenceGraph({ submission: { submission_metadata: { submission_id: 'rg' }, scope_declaration: Object.assign({}, STUDY_SCOPE), declared_versions: dv,
    requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: text }, candidateResponseText: cand, executionMode: cand ? 'local_mocked' : 'local_deterministic', clock: '2026-10-27T12:00:00.000Z', fixtureId: 'RG', researchProfile: profile });
  const unitWith = (t, s) => units(t).find((u) => u.text.includes(s));
  const basisTexts = (t) => units(t).flatMap((u) => u.basis_anchors.map((a) => a.text));

  probe('D1', 'R08', '"approved-role mappings" is not a decision unit', () => { const u = unitWith(rec('R08'), 'approved-role'); return { ok: u && u.decision === false, observed: u && u.decision }; });
  probe('D2', 'S-009', 'a basis stated as an absence carries a stated-absence anchor', () => { const u = unitWith(rec('S-009'), 'had not been tested'); return { ok: u && u.basis_anchors.some((a) => a.kind === 'stated_absence'), observed: u && u.basis_anchors.map((a) => a.kind) }; });
  probe('D3', 'S-011', '"was awarded" makes a decision unit', () => { const u = unitWith(rec('S-011'), 'was awarded to Northline'); return { ok: u && u.decision === true, observed: u && u.decision }; });
  probe('D3', 'S-011', '"the published criteria" is not a publication event', () => { const t = rec('S-011'); const ev = R.researchEvents(t, units(t)); const e = ev.find((x) => x.raw === '18 April'); return { ok: e && e.key !== 'publication', observed: e && e.key }; });
  probe('D4', 'S-004', 'the identifier after an authority noun is an authority citation, not basis evidence', () => { const b = basisTexts(rec('S-004')); return { ok: !b.includes('CP-7') && !b.includes('section 3'), observed: b }; });
  for (const [id, s] of [['S-026', 'Two contracts'], ['S-034', '3 years'], ['S-036', '3 years']])
    probe('D5', id, 'the decided count or duration "' + s + '" is a decision detail, not basis evidence', () => { const b = basisTexts(rec(id)); return { ok: !b.includes(s), observed: b }; });
  for (const id of ['S-002', 'S-022']) probe('D6', id, 'no false same-event date conflict from a modifier reading of a date', () => { const c = conflicts(rec(id)); return { ok: !c.includes('same_event_date_conflict'), observed: c }; });
  for (const id of ['S-001', 'S-005']) probe('D7', id, 'no research conflict from identifiers taken from too wide a window', () => { const c = conflicts(rec(id)); return { ok: c.length === 0, observed: c }; });
  for (const id of ['S-022', 'S-025']) probe('D8', id, 'two subject identifiers in one decision sentence make one decision, not a contradiction', () => { const c = conflicts(rec(id)); return { ok: !c.includes('decision_outcome_conflict'), observed: c }; });
  probe('D9', 'S-003', '"reviewed thoroughly and approved" is a decision', () => { const u = unitWith(rec('S-003'), 'reviewed thoroughly and approved'); return { ok: u && u.decision === true, observed: u && u.decision }; });
  probe('D10', 'S-036', '"are to be retained" is not an on-file anchor', () => { const kinds = units(rec('S-036')).flatMap((u) => u.basis_anchors.map((a) => a.kind)); return { ok: !kinds.includes('on_file'), observed: kinds }; });
  probe('D11', 'S-011', 'no reach-back across a clause split: no false same-event date conflict', () => { const c = conflicts(rec('S-011')); return { ok: !c.includes('same_event_date_conflict'), observed: c }; });
  probe('D12', 'S-001', 'an invalid research profile gives a clean refusal graph, not an exception', () => { const g = compile(rec('S-001'), null, Object.assign({}, PROFILE, { enabled: false })); return { ok: g.intake.decision === 'refuse' && g.intake.triggers.some((x) => x.code === 'research_profile_invalid'), observed: g.intake.triggers.map((x) => x.code) }; });
  probe('D13', 'probe text', 'a subject noun before an identifier ("pump P-2") is the decided item, not evidence', () => { const t = 'Maintenance decision record. The supervisor approved the replacement of pump P-2 on 4 May.'; const b = basisTexts(t); return { ok: !b.includes('P-2'), observed: b }; });
  probe('D13', 'probe text', 'an identifier before the basis cue is the decided item ("Request AR-31")', () => { const t = 'Records request determination. Request AR-31 was refused on 2 June because register search RS-4 found no matching file.'; const u = unitWith(t, 'Request AR-31'); return { ok: u && u.decision === true && u.subject_refs.includes('AR-31') && !u.basis_anchors.some((a) => a.text === 'AR-31'), observed: u && { decision: u.decision, subjects: u.subject_refs, basis: u.basis_anchors.map((a) => a.text) } }; });
  probe('D14', 'probe text', '"the repair was completed on 9 March" has an event key', () => { const t = 'Maintenance decision record. The repair was completed on 9 March and the line was reopened on 10 March.'; const ev = R.researchEvents(t, units(t)); const e = ev.find((x) => x.raw === '9 March'); return { ok: e && e.key !== null, observed: e && e.key }; });
  probe('D15', 'probe text', 'a count followed by a plural noun ("9 faults") is a quantity anchor', () => { const t = 'Fleet decision record. The inspection of 3 May logged 9 faults on bus B-14. The manager withdrew the bus on 4 May because the inspection logged 9 faults.'; const kinds = units(t).flatMap((u) => u.anchors.filter((a) => a.text === '9 faults').map((a) => a.kind)); return { ok: kinds.includes('quantity'), observed: kinds }; });
  probe('D16', 'S-001', 'a cited quotation holding an evidence anchor supports the basis (ORACLE-R gives CLEAR)', () => { const t = rec('S-001'); const g = compile(t, mock('ORACLE-R', 'S-001')); return { ok: classifyE1(g) === 'CLEAR', observed: classifyE1(g) }; });
  probe('D17', 'S-037', '"dated" next to a date is not a content word: no false cited-date conflict (ORACLE)', () => { const g = compile(rec('S-037'), mock('ORACLE', 'S-037')); const c = conflictKinds(g); return { ok: !c.some((k) => k.startsWith('cited_evidence_conflict')) && !c.includes('same_event_date_conflict'), observed: c }; });
  probe('D18', 'S-017', 'a quotation holding two dates is compared by its first date: no false conflict (ORACLE)', () => { const g = compile(rec('S-017'), mock('ORACLE', 'S-017')); const c = conflictKinds(g); return { ok: c.length === 0, observed: c }; });
  return out;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const scratch = process.argv[2];
  if (!scratch) { console.error('usage: regression-probes.mjs <scratch>'); process.exit(2); }
  mkdirSync(scratch, { recursive: true });
  const iso = isolate('0.3.3-research-candidate', scratch, { requireManifest: existsSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt')) });
  const E = await loadEngine(iso);
  const results = await runRegressionProbes(E);
  const rel = iso.release();
  const res = { probe_format: 'jrs-study-156-regression-probes/1.0.0', engine_snapshot_sha256: iso.snapshot_sha256, engine_manifest_sha256: iso.manifest_sha256, isolated_copy: rel, network_attempts: attempts.length,
    totals: { probes: results.length, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }, results };
  const dir = join(PKG, 'out', 'regression-probes'); mkdirSync(dir, { recursive: true });
  const f = join(dir, 'RESULTS.json');
  if (existsSync(f)) { console.error(f + ' exists'); process.exit(2); }
  writeFileSync(f, JSON.stringify(res, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(res.totals), 'network', attempts.length, '\n' + results.filter((r) => !r.ok).map((r) => r.id + ' ' + r.defect + ' ' + r.record + ' ' + r.expect + ' => ' + JSON.stringify(r.observed).slice(0, 200)).join('\n'));
}
