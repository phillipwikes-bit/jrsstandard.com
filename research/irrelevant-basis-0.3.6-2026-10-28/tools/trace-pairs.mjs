// Irrelevant-basis investigation: the 42 original/variant pairs of live run RUN-LIVE-AUTH-20261028-02 (arm L2, 0.3.5).
// For each UNGROUNDED record (AI-proposed reference) with a stated-irrelevant-basis variant (TGT-SB-<id>) it records:
//   RECORDED  the live result as scored (results/LIVE_RESULTS.json of the continuation, unchanged);
//   REPLAY    the same captured response compiled again offline by the frozen 0.3.5 (must equal RECORDED);
//   CONTROL   controlled offline replays: X1 the variant text with each ORIGINAL proposal (r1 to r3), X2 the original
//             text with the VARIANT proposal. These are captured responses placed on another text, not new model output.
// Derived fields only: identifiers, hashes, statuses, reasons, counts. No record text and no quotation text are written.
// The inserted sentences are the frozen synthetic pool (engine-repair-0.3.4-2026-10-27/tests/paired-suite.mjs).
// Limitation: each variant was sent once; the originals three times. Variant stability is not measured.
// Usage: node tools/trace-pairs.mjs <private run dir of RUN-LIVE-AUTH-20261028-02> <scratch>
import '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { attempts } from '../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, CONT, STATUS, sha, shaFile, readJson, writeJson, writeOut } from './common.mjs';
import { isolate, loadEngine } from '../../study-continuation-0.3.5-2026-10-28/tools/harness/engines.mjs';
import { LIVE_ARM, CLOCK } from '../../study-continuation-0.3.5-2026-10-28/tools/live/score-live-v2.mjs';
import { extractCandidate } from '../../engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs';
import { declare, compileRow, PROFILE } from '../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { byId, recordText } from '../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { isFlawReason, BASIS_CONDITIONS } from '../../study-156-2026-10-27/tools/scoring.mjs';
import { privateLocationProblems } from '../../study-continuation-0.3.5-2026-10-28/tools/live/runner.mjs';

const [RUN, SCRATCH] = process.argv.slice(2);
if (!RUN || !SCRATCH) { console.error('usage: trace-pairs.mjs <private run dir> <scratch>'); process.exit(2); }
const priv = privateLocationProblems(RUN, join(DIR, '..', '..')); if (priv.length) { console.error('stopped: ' + priv.join('; ')); process.exit(3); }
const CAP = join(RUN, 'captures');
const capsBefore = sha(readdirSync(CAP).sort().map((f) => f + ':' + shaFile(join(CAP, f))).join('\n')), journalSha = shaFile(join(RUN, 'JOURNAL.jsonl'));
mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const iso = isolate('0.3.5-research-candidate', join(SCRATCH, 'iso')); const E = await loadEngine(iso);
const RP = await import(join(iso.root, 'lib', 'engine-evidence-graph-v0.3.4-research-candidate', 'research-profile.mjs'));
const set = readJson(join(CONT, 'records', 'LIVE_RECORD_SET.json')), results = readJson(join(CONT, 'results', 'LIVE_RESULTS.json'));
const rowOf = new Map(results.rows.map((r) => [r.request_id, r]));
const tt = new Map(readFileSync(join(CONT, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o]; }));
const candOf = (rid) => { const t = readFileSync(join(CAP, rid + '.json'), 'utf8'); return { text: extractCandidate(JSON.parse(t), 'claude-haiku-5-5').text, capture_sha256: sha(t) }; };
const compile = (id, text, cand, fid) => compileRow(E, LIVE_ARM, { text, declaration: declare(byId.get(id)), cand, designed: null, eligible: true, clock: CLOCK, fixtureId: fid, rpv: E.research.RESEARCH_PROMPT_VERSION, profile: PROFILE });
const conds = (r) => Object.fromEntries(BASIS_CONDITIONS.map((c) => [c, { status: r.observed.statuses[c], proposed: r.proposed[c], flaw_reasons: (r.reasons[c] || []).filter(isFlawReason), reasons: r.reasons[c] || [] }]));
const flawCodes = (r) => new Set(BASIS_CONDITIONS.flatMap((c) => (r.reasons[c] || []).filter(isFlawReason).flatMap((x) => x.replace(/^(?:visible_gap|candidate_supported_but_visible_gap|rule):/, '').split(',')).map((x) => c + ':' + x)));

const pairs = [];
for (const q of set.requests.filter((x) => /^TGT-SB-/.test(x.request_id))) {
  const id = q.base_record_id, t = tt.get(q.request_id), orig = recordText(id);
  const sentence = /"(.*)"$/.exec(t.construction)[1], position = t.construction.split(':')[0].replace('stated_irrelevant_basis ', '');
  const at = t.text.indexOf(sentence.replace(/[.!?]$/, '')), end = at + sentence.length;
  const origReqs = [1, 2, 3].map((k) => set.requests.find((y) => y.request_id === 'RUN-r' + k + '-' + id));
  const vc = candOf(q.request_id), ocs = origReqs.map((r) => candOf(r.request_id));
  const vr = compile(id, t.text, vc.text, q.request_id), ors = origReqs.map((r, k) => compile(id, orig, ocs[k].text, r.request_id));
  const x1 = ocs.map((c, k) => compile(id, t.text, c.text, 'X1-' + k)), x2 = compile(id, orig, vc.text, 'X2');
  // The inserted sentence as the frozen rules read it, and the record-wide stated (strong) anchors.
  const uv = RP.sentenceUnits(t.text), uo = RP.sentenceUnits(orig);
  const iu = uv.find((u) => u.start <= at && at < u.end);
  const strongOther = uv.filter((u) => u !== iu && u.basis_anchors.length).length;
  // Model observations that quote the inserted sentence (condition, proposed status, assertion type, resolution).
  const vobs = E.strictJson.parseCandidateResponse(vc.text).value.observations;
  const qs = vr.observed.quote_statuses;
  const citing = vobs.filter((o) => typeof o.quote === 'string' && (() => { const p = t.text.indexOf(o.quote); return p >= 0 && p < end && at < p + o.quote.length; })())
    .map((o) => ({ condition_id: o.condition_id, proposed_status: o.proposed_status, assertion_type: o.assertion_type, resolution: qs[o.observation_id] || null }));
  const lost = [...ors.reduce((s, r) => { for (const x of flawCodes(r)) s.add(x); return s; }, new Set())].filter((x) => !flawCodes(vr).has(x));
  const supportedViaInserted = BASIS_CONDITIONS.filter((c) => vr.observed.statuses[c] === 'supported' && citing.some((o) => o.condition_id === c));
  const recorded = { originals: origReqs.map((r) => rowOf.get(r.request_id).engine.e1), variant: rowOf.get(q.request_id).engine.e1 };
  const replay = { originals: ors.map((r) => r.e1), variant: vr.e1 };
  const weakened = recorded.originals.every((e) => e === 'FLAG') && recorded.variant !== 'FLAG';
  // Cause classification from the controlled replays (each test is stated; no cause is assumed for all pairs).
  const causes = [];
  if (weakened) {
    if (x2.e1 !== 'FLAG') causes.push('model_changed_proposal');
    if (x1.every((r) => r.e1 !== 'FLAG') && iu && iu.basis_anchors.length && !uo.some((u) => u.basis_anchors.length) && !strongOther)
      causes.push('compiler_counted_asserted_link_as_linked_evidence:' + [...new Set(iu.basis_anchors.map((a) => a.link))].join('+'));
    if (x1.some((r) => r.e1 === 'FLAG') && citing.length) causes.push('added_quotation_changed_condition_outcome');
    if (!causes.length) causes.push('unresolved');
  }
  pairs.push({ record_id: id, reference_ai_proposed: q.reference_ai_proposed, original_requests: origReqs.map((r) => r.request_id), variant_request: q.request_id,
    original_text_sha256: sha(orig), variant_text_sha256: t.text_sha256, inserted_sentence: sentence, inserted_position: position,
    capture_sha256: { originals: ocs.map((c) => c.capture_sha256), variant: vc.capture_sha256 },
    recorded, replay, replay_equals_recorded: JSON.stringify(recorded) === JSON.stringify(replay),
    original_conditions: ors.map(conds), variant_conditions: conds(vr),
    inserted_sentence_rules: iu ? { decision: !!iu.decision, basis_cue: iu.basis_cue, anchor_links: iu.candidate_anchors.map((a) => a.kind + ':' + (a.link || 'unlinked')) } : null,
    strong_anchor_units: { original: uo.filter((u) => u.basis_anchors.length).length, variant_other_than_inserted: strongOther },
    variant_observations: { total: vobs.length, citing_inserted_sentence: citing },
    controlled: { x1_variant_text_original_proposals: x1.map((r) => r.e1), x2_original_text_variant_proposal: x2.e1 },
    weakened, flaw_codes_lost: lost, supported_via_inserted_sentence: supportedViaInserted, causes });
}
const rel = iso.release();
const capsAfter = sha(readdirSync(CAP).sort().map((f) => f + ':' + shaFile(join(CAP, f))).join('\n'));
const count = (f) => pairs.filter(f).length;
const byCause = pairs.filter((p) => p.weakened).reduce((o, p) => { for (const c of p.causes) o[c] = (o[c] || 0) + 1; return o; }, {});
const lostCodes = pairs.filter((p) => p.weakened).reduce((o, p) => { for (const c of p.flaw_codes_lost) o[c] = (o[c] || 0) + 1; return o; }, {});
const held = pairs.filter((p) => !p.weakened).map((p) => ({ record_id: p.record_id, strong_in_original: p.strong_anchor_units.original > 0, flaw_codes_kept: p.variant_conditions ? BASIS_CONDITIONS.flatMap((c) => p.variant_conditions[c].flaw_reasons) : [] }));
const summary = { pairs: pairs.length, recorded_originals_all_flag: count((p) => p.recorded.originals.every((e) => e === 'FLAG')), recorded_variant: pairs.reduce((o, p) => (o[p.recorded.variant] = (o[p.recorded.variant] || 0) + 1, o), {}),
  replay_equals_recorded: count((p) => p.replay_equals_recorded), weakened: count((p) => p.weakened), weakened_by_cause: byCause, flaw_codes_lost_in_weakened: lostCodes,
  weakened_x1_all_not_flag: count((p) => p.weakened && p.controlled.x1_variant_text_original_proposals.every((e) => e !== 'FLAG')), weakened_x2_flag: count((p) => p.weakened && p.controlled.x2_original_text_variant_proposal === 'FLAG'),
  variants_citing_inserted_sentence: count((p) => p.variant_observations.citing_inserted_sentence.length), conditions_supported_via_inserted_sentence: pairs.reduce((n, p) => n + p.supported_via_inserted_sentence.length, 0),
  held: { count: held.length, with_stated_link_already_in_original: held.filter((h) => h.strong_in_original).length, kept_flaw_reasons: held.reduce((o, h) => { for (const r of h.flaw_codes_kept) o[r] = (o[r] || 0) + 1; return o; }, {}) } };
const out = { format: 'jrs-irrelevant-basis-pair-comparison/1.0.0', ...STATUS, run: 'RUN-LIVE-AUTH-20261028-02', candidate: '0.3.5-research-candidate', network_attempts: attempts.length,
  statement: 'RECORDED is the live result; REPLAY recompiles the same captures offline; CONTROL places captured proposals on the other text. Agreement with AI-proposed references is not accuracy. Each variant was sent once (originals three times): variant stability is not measured.',
  inputs: { journal_sha256: journalSha, captures_sha256: capsBefore, captures_unchanged: capsBefore === capsAfter, results_sha256: shaFile(join(CONT, 'results', 'LIVE_RESULTS.json')), engine_copy_unchanged: rel.unchanged },
  summary, pairs };
writeJson(join(DIR, 'out', 'PAIR_COMPARISON.json'), out);
const md = ['# 42-pair comparison: stated-irrelevant-basis variants, run RUN-LIVE-AUTH-20261028-02 (0.3.5)', '', 'Generated by `tools/trace-pairs.mjs` from the private captures. Derived fields only. Full detail: `out/PAIR_COMPARISON.json`. Each variant was sent once and each original three times, so variant stability is **not** measured. AI-proposed references are not human labels.', '',
  '| Record | Recorded originals | Recorded variant | Replay = recorded | X1 variant text + original proposals | X2 original text + variant proposal | Inserted sentence read as | Flaw codes lost | Cause |', '|---|---|---|---|---|---|---|---|---|',
  ...pairs.map((p) => '| ' + p.record_id + ' | ' + p.recorded.originals.join('/') + ' | ' + p.recorded.variant + ' | ' + (p.replay_equals_recorded ? 'yes' : '**no**') + ' | ' + p.controlled.x1_variant_text_original_proposals.join('/') + ' | ' + p.controlled.x2_original_text_variant_proposal
    + ' | ' + (p.inserted_sentence_rules ? (p.inserted_sentence_rules.decision ? 'decision sentence' : 'reason sentence') + ' (' + [...new Set(p.inserted_sentence_rules.anchor_links.map((x) => x.split(':')[1]))].join(', ') + ')' : 'n/a') + ' | ' + (p.flaw_codes_lost.join(', ') || '-') + ' | ' + (p.causes.join('; ') || 'held') + ' |'), '',
  '## Summary', '', '```json', JSON.stringify(summary, null, 2), '```', ''];
writeOut(join(DIR, 'reports', 'PAIR_COMPARISON.md'), md.join('\n'));
const ok = out.inputs.captures_unchanged && rel.unchanged && summary.replay_equals_recorded === 42 && attempts.length === 0;
console.log('pair comparison: ' + JSON.stringify({ pairs: summary.pairs, weakened: summary.weakened, byCause, replay_equal: summary.replay_equals_recorded, ok }));
process.exit(ok ? 0 : 1);
