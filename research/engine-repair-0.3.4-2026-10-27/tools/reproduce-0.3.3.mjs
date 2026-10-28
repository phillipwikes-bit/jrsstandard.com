// 0.3.4 repair package: reproduce the documented failures on the FROZEN 0.3.3-research-candidate and record the
// causal path of each. Offline only: network guard first, provider variables stop the run, the 0.3.3 copy is
// isolated and verified against its pinned manifest (fad69b62...). Study files are read, never written.
// Usage: node tools/reproduce-0.3.3.mjs <scratch>     (writes out/reproduction-0.3.3/RESULTS.json)
import { attempts, installNetGuard } from '../../validation-readiness-gate-v0-2026-10-25/tools/harness/net-guard.mjs';
installNetGuard();
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as V from '../../validation-readiness-gate-v0-2026-10-25/tools/controls.mjs';
import { isolate, loadEngine, PKG, STUDY } from './harness/engines.mjs';
import { ARMS, declare, compileRow } from '../../study-156-2026-10-27/tools/compile-row.mjs';
import { classifyE1 } from '../../study-156-2026-10-27/tools/scoring.mjs';

const sha = (s) => createHash('sha256').update(s).digest('hex');
const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: reproduce-0.3.3.mjs <scratch>'); process.exit(2); }
const OUT = join(PKG, 'out', 'reproduction-0.3.3');
if (existsSync(OUT)) { console.error('output exists; runs start clean: ' + OUT); process.exit(2); }
const pre = V.checkNetworkMarkers(process.env, {});
if (pre.length) { console.error('stopped:', pre.join('; ')); process.exit(3); }

const iso = isolate('0.3.3-research-candidate', SCRATCH, { requireManifest: true });
const E = await loadEngine(iso);
const R = E.research;
const RPV = R.RESEARCH_PROMPT_VERSION;
const rules = new Set(R.RESEARCH_RULES);
const CLOCK = '2026-10-27T12:00:00.000Z';
const inv = JSON.parse(readFileSync(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json'), 'utf8'));
const byId = new Map(inv.entries.map((e) => [e.source_id, e]));
const register = JSON.parse(readFileSync(join(STUDY, 'records', 'synthetic', 'CONSTRUCTION_REGISTER.json'), 'utf8'));
const designedOf = (id) => { const r = register.records.find((x) => x.id === id); return r ? r.designed : null; };
const rec = (id) => readFileSync(join(STUDY, 'records', id.startsWith('R') ? 'original' : 'synthetic', id + '.txt'), 'utf8');
const variants = readFileSync(join(STUDY, 'variants', 'VARIANTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const vmock = (policy) => new Map(readFileSync(join(STUDY, 'mocks-variants', policy + '.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.variant_id, JSON.parse(o.body).envelope.content[0].text]; }));
const bmock = (policy, id) => JSON.parse(readFileSync(join(STUDY, 'mocks', policy, id + '.json'), 'utf8')).envelope.content[0].text;
const arm = (id) => ARMS.find((a) => a.id === id);
const compile = (a, text, cand, id) => compileRow(E, arm(a), { text, declaration: declare(byId.get(id.split('~')[0])), cand, designed: designedOf(id.split('~')[0]), eligible: true, clock: CLOCK, fixtureId: id, rpv: RPV });
const graphOf = (text, cand, id) => E.compiler.compileEvidenceGraph({ submission: { submission_metadata: { submission_id: id }, scope_declaration: declare(byId.get(id.split('~')[0])),
  declared_versions: Object.assign({}, E.declaredVersions, { prompt_version: RPV }), requested_outputs: ['condition_findings', 'evidence_graph', 'cognitive_controls'], record_text: text },
  candidateResponseText: cand, executionMode: cand ? 'local_mocked' : 'local_deterministic', clock: CLOCK, fixtureId: id, researchProfile: { profile_id: 'jrs-study-research-profile/1', enabled: true, authorization_ref: '0.3.4 repair assignment; offline reproduction on 0.3.3' } });
// Record-level rule outputs with no candidate evidence: which visible gaps and review reasons the rules raise.
const ruleView = (text) => { const u = R.sentenceUnits(text); const ev = R.researchEvents(text, u); const c = R.evaluateResearchConditions(text, E.record.sectionsOf(text), u, ev, {}, rules);
  return { basis_anchor_count: u.reduce((n, x) => n + x.basis_anchors.length, 0), decision_units: u.filter((x) => x.decision).map((x) => x.index),
    gaps: Object.fromEntries(Object.entries(c).map(([k, r]) => [k, r.visible_gaps])), review: Object.fromEntries(Object.entries(c).map(([k, r]) => [k, r.review_reasons])) }; };
const out = { results_format: 'jrs-0.3.4-reproduction/1.0.0', engine: { version: iso.version, manifest_sha256: iso.manifest_sha256, files_verified: iso.files_verified }, evaluation_clock_utc: CLOCK,
  statement: 'Reproduction on the frozen 0.3.3-research-candidate with the study\'s own stored mock candidates (scripted, not model output). No network, provider or credential.', cases: {} };

// ------------------------------------------------------------------ VF-01 and VF-02: irrelevant anchors under OVERCLAIM-R
{
  const M = vmock('OVERCLAIM-R');
  const res = { by: {}, traces: [] };
  for (const v of variants.filter((x) => (x.type === 'V2' || x.type === 'V6') && x.constructible && x.base_reference === 'UNGROUNDED' && x.cohort === 'synthetic_record')) {
    const id = v.base_id; const base = rec(id);
    const bRow = compile('A4R', base, bmock('OVERCLAIM-R', id), id);
    const vRow = compile('A4R', v.text, M.get(v.variant_id), v.variant_id);
    const k = v.type + '/' + v.partition; res.by[k] = res.by[k] || { n: 0, clear: 0, base_clear: 0, flag_lost: 0 };
    res.by[k].n++; if (vRow.e1 === 'CLEAR') res.by[k].clear++; if (bRow.e1 === 'CLEAR') res.by[k].base_clear++; if (bRow.e1 === 'FLAG' && vRow.e1 !== 'FLAG') res.by[k].flag_lost++;
    if (vRow.e1 === 'CLEAR') {
      // Causal trace: the inserted sentence, its anchors, the quotations that cover it, and the rule flags before and after.
      const added = /inserted after sentence 1: "(.*)"$/.exec(v.construction) || /appended: "(.*)"$/.exec(v.construction);
      const s = v.text.indexOf(added[1]), t = s + added[1].length;
      const units = R.sentenceUnits(v.text);
      const inserted = units.filter((u) => u.start >= s && u.end <= t);
      const g = graphOf(v.text, M.get(v.variant_id), v.variant_id);
      const quotesOnInserted = g.nodes.filter((n) => n.type === 'proposed_quote' && n.quote && v.text.indexOf(n.quote) >= s && v.text.indexOf(n.quote) + n.quote.length <= t).map((n) => ({ condition: n.condition_id, assertion_type: n.assertion_type, status: n.quote_resolution_status }));
      res.traces.push({ variant_id: v.variant_id, base_e1: bRow.e1, variant_e1: vRow.e1, inserted_sentence: added[1],
        inserted_basis_anchors: inserted.flatMap((u) => u.basis_anchors.map((a) => a.kind + ':' + a.text)),
        base_rules: ruleView(base), variant_rules: ruleView(v.text), quotations_on_inserted_sentence: quotesOnInserted,
        variant_statuses: vRow.observed.statuses, variant_reasons: { identifiable_basis: vRow.reasons.identifiable_basis, reasoning_traceability: vRow.reasons.reasoning_traceability, reconstructability: vRow.reasons.reconstructability } });
    }
  }
  out.cases['VF-01_VF-02'] = res;
}

// ------------------------------------------------------------------ evaluation-partition failures EF-01 to EF-08 (A3R)
{
  const ef = {};
  const unitsOf = (t) => R.sentenceUnits(t);
  const row = (id, a = 'A3R') => { const r = compile(a, rec(id), bmock(a === 'A3R' ? 'ORACLE-R' : a === 'A4R' ? 'OVERCLAIM-R' : a === 'A3' ? 'ORACLE' : a === 'A4' ? 'OVERCLAIM' : 'UNDERCLAIM', id), id); return { e1: r.e1, e2: r.e2, statuses: r.observed.statuses, reasons: r.reasons }; };
  ef['EF-01'] = { record: 'S-041', designed: 'GROUNDED', a3r: row('S-041'), decision_units: unitsOf(rec('S-041')).filter((u) => u.decision).map((u) => u.text),
    decision_cue_on_priority_sentence: unitsOf(rec('S-041')).find((u) => /raised the order/.test(u.text)).decision };
  { const t = rec('S-043'); const u = unitsOf(t); ef['EF-02'] = { record: 'S-043', designed: 'UNGROUNDED', a3r: row('S-043'), all_rows: ['A3', 'A4', 'A5'].map((a) => [a, compile(a, t, bmock({ A3: 'ORACLE', A4: 'OVERCLAIM', A5: 'UNDERCLAIM' }[a], 'S-043'), 'S-043').e1]),
    false_anchor: u.flatMap((x) => x.basis_anchors.map((a) => ({ unit: x.index, kind: a.kind, text: a.text }))), rules: ruleView(t) }; }
  ef['EF-03'] = { record: 'S-063', designed: 'UNGROUNDED', a3r: row('S-063'), decision_units: unitsOf(rec('S-063')).filter((u) => u.decision).map((u) => u.text) };
  ef['EF-04'] = { record: 'S-076', designed: 'UNGROUNDED', a3r: row('S-076'), decision_units: unitsOf(rec('S-076')).filter((u) => u.decision).map((u) => u.text),
    oracle_r_observations: JSON.parse(bmock('ORACLE-R', 'S-076')).observations.map((o) => o.condition_id + ':' + o.proposed_status + ':' + (o.quote ? 'quote' : 'null')) };
  for (const [k, id] of [['EF-05', 'S-094'], ['EF-06', 'S-096']]) { const t = rec(id); const u = unitsOf(t);
    ef[k] = { record: id, designed: 'UNGROUNDED', a3r: row(id), title_unit: u[0].text, title_basis_anchors: u[0].basis_anchors.map((a) => a.kind + ':' + a.text), rules: ruleView(t),
      rules_without_title_anchor: (() => { const t2 = t.replace(/, 7 August\./, '.'); return ruleView(t2); })() }; }
  { const t = rec('S-097'); const u = unitsOf(t); const ev = R.researchEvents(t, u); ef['EF-07'] = { record: 'S-097', designed: 'GROUNDED, different events', a3r: row('S-097'),
    events: ev.map((e) => ({ unit: e.unit, raw: e.raw, key: e.key })), conflicts: R.detectResearchConflicts(t, u, ev, rules).map((c) => c.summary) }; }
  ef['EF-08'] = { record: 'S-075', designed: 'GROUNDED', a3r: row('S-075'), units: unitsOf(rec('S-075')).map((u) => ({ text: u.text, decision: u.decision, basis_cue: u.basis_cue, basis_anchors: u.basis_anchors.map((a) => a.kind + ':' + a.text) })),
    oracle_r_observations: JSON.parse(bmock('ORACLE-R', 'S-075')).observations.map((o) => o.condition_id + ':' + o.assertion_type + ':' + (o.quote || 'null')) };
  out.cases.EF = ef;
}

// ------------------------------------------------------------------ VF-03: injection phrasing 2 is not detected
{
  const v7 = variants.filter((x) => x.type === 'V7' && x.constructible);
  const p2 = v7.filter((x) => /phrasing 2/.test(x.construction)), p1 = v7.filter((x) => /phrasing 1/.test(x.construction));
  const det = (x) => E.scope.detectInstructionRisk(x.text).record_instruction_risk === 'detected';
  const sample = p2[0];
  const phrase = /"(.*)"$/.exec(sample.construction)[1];
  out.cases['VF-03'] = { phrasing_1: { n: p1.length, detected: p1.filter(det).length }, phrasing_2: { n: p2.length, detected: p2.filter(det).length }, phrasing_2_text: phrase,
    pattern_ids_tried: E.scope.INSTRUCTION_PATTERNS.map(([id]) => id), nearest_pattern: 'addressed_to_tool requires "note to"; the phrasing says "Note for"',
    flag_lost_when_detected: (() => { // phrasing 1 is detected; does detection keep the flaw signal on ungrounded records under A3R?
      const M = vmock('ORACLE-R'); let n = 0, lost = 0;
      for (const x of p1.filter((y) => y.base_reference === 'UNGROUNDED' && y.cohort === 'synthetic_record')) { const b = compile('A3R', rec(x.base_id), bmock('ORACLE-R', x.base_id), x.base_id); if (b.e1 !== 'FLAG') continue; n++;
        const w = compile('A3R', x.text, M.get(x.variant_id), x.variant_id); if (w.e1 !== 'FLAG') lost++; }
      return { base_flag: n, flag_lost_after_detected_injection: lost };
    })() };
}

// ------------------------------------------------------------------ VF-05: contradictions the record rules miss (A2)
{
  const v4 = variants.filter((x) => x.type === 'V4' && x.constructible && x.cohort === 'synthetic_record');
  const missed = [];
  for (const x of v4) { const g = graphOf(x.text, null, x.variant_id); const kinds = g.conflicts.map((k) => k.kind);
    const sig = x.designed.contradiction === 'date' ? kinds.some((k) => ['same_event_date_conflict', 'decision_date_conflict', 'impossible_sequence'].includes(k)) : kinds.includes('decision_outcome_conflict');
    if (!sig) { const u = R.sentenceUnits(x.text); const ev = R.researchEvents(x.text, u); const last = ev.filter((e) => e.unit === u.length - 1);
      missed.push({ variant_id: x.variant_id, partition: x.partition, contradiction: x.designed.contradiction, appended_events: last.map((e) => e.raw + ':' + e.key) }); } }
  out.cases['VF-05'] = { n: v4.length, missed: missed.length, by_partition: missed.reduce((m, x) => (m[x.partition] = (m[x.partition] || 0) + 1, m), {}), detail: missed };
}

// ------------------------------------------------------------------ CF-01: control redundancy (A3R, evaluation)
{
  let graphs = 0, repeats = 0; const worst = [];
  for (const e of inv.entries.filter((x) => x.cohort === 'synthetic_record' && x.partition === 'evaluation')) {
    const r = compile('A3R', rec(e.source_id), bmock('ORACLE-R', e.source_id), e.source_id); graphs++; repeats += r.controls.redundant_same_defect;
    if (r.controls.redundant_same_defect >= 2) worst.push(e.source_id + ':' + r.control_defects.join(','));
  }
  out.cases['CF-01'] = { graphs, repeated_controls: repeats, examples: worst.slice(0, 5) };
}

// ------------------------------------------------------------------ HF-05: evidence-removal variants that keep evidence
{
  const ids = ['S-090', 'S-079', 'S-030', 'S-025'];
  out.cases['HF-05'] = ids.map((id) => { const v = variants.find((x) => x.type === 'V5' && x.base_id === id); return { variant_id: v.variant_id, text: v.text, designed: v.designed.e1 }; });
}
out.network_attempts = attempts.length;
out.engine.released = iso.release();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'RESULTS.json'), JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
const f = out.cases['VF-01_VF-02'].by;
console.log('VF-01/02', JSON.stringify(f), '| VF-03', JSON.stringify({ p1: out.cases['VF-03'].phrasing_1, p2: out.cases['VF-03'].phrasing_2, lost: out.cases['VF-03'].flag_lost_when_detected }),
  '| VF-05 missed', out.cases['VF-05'].missed, JSON.stringify(out.cases['VF-05'].by_partition), '| CF-01', out.cases['CF-01'].repeated_controls, '| network', attempts.length, '| released', JSON.stringify(out.engine.released));
