// Study completion (0.3.4): failure diagnosis and count reconciliation for live run RUN-LIVE-AUTH-20261028-01.
// Reads the private run directory (journal and captures, outside git) and the original results/LIVE_RESULTS.json.
// Changes neither: it verifies their hashes before and after. It writes derived fields only (request and record
// identifiers, validator reasons, identifier lengths, counts); no record text, quotation or response text is written.
//   reports/FAILURE_DIAGNOSIS_2026-10-28.json and .md     why each unusable response failed, traced stage by stage
//   reports/LIVE_RESULTS_CORRECTION_2026-10-28.json and .md  corrected counts derived from the raw captures
// The sensitivity replay (identifiers renamed, nothing else changed) is labelled as such and never reclassifies the
// original run: LIVE_RESULTS.json stays the record of what the frozen pipeline decided.
// Usage: node tools/diagnosis/diagnose-live.mjs <run-dir> <scratch>
import { attempts } from '../guard.mjs';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, PKG4, STATUS, sha, shaFile, readJson, writeJson, writeOut, checker, finish } from '../common.mjs';
import { createJournal, MODEL } from '../live/sender-bound.mjs';
import { privateLocationProblems } from '../live/runner.mjs';
import { compileCapture, textFor } from '../live/score-live.mjs';
import { extractCandidate } from '../../../engine-repair-0.3.4-2026-10-27/tools/transport/study-adapter.mjs';
import { parseCandidateResponse } from '../../../engine-repair-0.3.4-2026-10-27/candidate/lib/engine-evidence-contract/strict-json.mjs';
import { validateCandidate } from '../../../engine-repair-0.3.4-2026-10-27/candidate/lib/engine-evidence-graph-v0.3.4-research-candidate/response.mjs';
import { CONDITION_IDS } from '../../../engine-repair-0.3.4-2026-10-27/candidate/lib/engine-evidence-graph-v0.3.4-research-candidate/contract.mjs';
import { isolate, loadEngine } from '../../../engine-repair-0.3.4-2026-10-27/tools/harness/engines.mjs';

export const RUN_ID = 'RUN-LIVE-AUTH-20261028-01';
export const DATE = '2026-10-28';
const ID_RE = /^[A-Za-z0-9_-]{1,24}$/;            // response.mjs, observation_id rule (frozen)
const PROMPT_REL = 'candidate/prompt/PROMPT_research-0.3.4-1.txt';

// Why a response failed, traced through every stage. Pure: takes the capture text, returns derived fields only.
export function traceCapture(capText) {
  const cap = JSON.parse(capText); const body = JSON.parse(cap.response_body);
  const x = extractCandidate(cap, MODEL);
  const t = { http_status: cap.status, stop_reason: body.stop_reason, text_blocks: (body.content || []).filter((b) => b.type === 'text').length, adapter: x.ok ? 'ok' : x.code };
  if (!x.ok) return t;
  const p = parseCandidateResponse(x.text);
  t.strict_parser = p.ok ? 'ok' : p.reason; t.fence_removed = (p.notes || []).includes('markdown_fence_removed');
  if (!p.ok) return t;
  const v = validateCandidate(x.text, { promptVersion: p.value.prompt_version });
  const obs = Array.isArray(p.value.observations) ? p.value.observations : [];
  const ids = obs.map((o) => o && o.observation_id);
  t.validator = v.ok ? 'ok' : v.reason;
  t.prompt_version_returned = p.value.prompt_version;
  t.observations = obs.length;
  t.quotations = obs.filter((o) => typeof o.quote === 'string').length;
  t.observation_id_lengths = ids.map((i) => String(i).length);
  t.observation_ids_over_24 = ids.filter((i) => typeof i === 'string' && i.length > 24 && /^[A-Za-z0-9_-]+$/.test(i)).length;
  t.observation_ids_bad_characters = ids.filter((i) => typeof i !== 'string' || !/^[A-Za-z0-9_-]*$/.test(i)).length;
  t.observation_ids_duplicated = ids.length - new Set(ids).size;
  t.unrecognised_condition_ids = [...new Set(obs.map((o) => o.condition_id).filter((c) => !CONDITION_IDS.includes(c)))];
  return t;
}
// The one change the sensitivity replay makes: observation identifiers renamed o1..oN. Quotations, conditions,
// statuses, assertion types, disambiguators and notes are untouched. Returns a new capture text.
export function renameIds(capText) {
  const cap = JSON.parse(capText); const body = JSON.parse(cap.response_body);
  const blk = body.content.find((b) => b.type === 'text'); const v = parseCandidateResponse(blk.text).value;
  v.observations.forEach((o, i) => { o.observation_id = 'o' + (i + 1); });
  blk.text = JSON.stringify(v); cap.response_body = JSON.stringify(body);
  return JSON.stringify(cap);
}
const cause = (t) => (t.validator === 'observation_id_invalid_or_duplicate' && t.observation_ids_over_24 > 0 && !t.observation_ids_bad_characters && !t.observation_ids_duplicated
  ? 'C1_unstated_identifier_length_limit' : t.validator === 'unrecognised_condition_id' ? 'C2_model_noncompliance_condition_id' : 'UNRESOLVED');
export const CAUSES = Object.freeze({
  C1_unstated_identifier_length_limit: { category: 'conflicting_or_underspecified_instructions (prompt and validator disagree); the model output is the proximate trigger',
    explanation: 'The validator (response.mjs) accepts an observation_id only if it matches ^[A-Za-z0-9_-]{1,24}$. The frozen prompt (Q2) asks only for an identifier that is "short and unique" and states no length or character limit. The model wrote descriptive identifiers of 25 to 35 characters, with no duplicate and no invalid character. The whole response is then refused, including quotations that resolve in the record.' },
  C2_model_noncompliance_condition_id: { category: 'model_noncompliance',
    explanation: 'The prompt (Q3) lists the five condition identifiers explicitly. The response used one that is not on the list. The validator refuses the whole response.' },
  UNRESOLVED: { category: 'unresolved', explanation: 'The trace does not establish the cause.' },
});

if (import.meta.url === 'file://' + process.argv[1]) {
  const [RUN_DIR, SCRATCH] = process.argv.slice(2);
  if (!RUN_DIR || !SCRATCH) { console.error('usage: diagnose-live.mjs <run-dir> <scratch>'); process.exit(2); }
  const priv = privateLocationProblems(RUN_DIR, join(DIR, '..', '..')); if (priv.length) { console.error('stopped: ' + priv.join('; ')); process.exit(3); }
  const c = checker();
  const RESULTS = join(DIR, 'results', 'LIVE_RESULTS.json');
  const capDir = join(RUN_DIR, 'captures');
  const snap = () => ({ journal: shaFile(join(RUN_DIR, 'JOURNAL.jsonl')), captures: sha(readdirSync(capDir).sort().map((f) => f + ':' + shaFile(join(capDir, f))).join('\n')), results: shaFile(RESULTS),
    candidate_manifest: shaFile(join(PKG4, 'CANDIDATE_0.3.4_MANIFEST_SHA256.txt')), prompt: shaFile(join(PKG4, PROMPT_REL)) });
  const before = snap();
  const res = readJson(RESULTS); const set = readJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'));
  const targeted = new Map(readFileSync(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
  const J = createJournal(readFileSync(join(RUN_DIR, 'JOURNAL.jsonl'), 'utf8').split('\n').filter(Boolean));
  const qOf = new Map(set.requests.map((q) => [q.request_id, q])); const rowOf = new Map(res.rows.map((r) => [r.request_id, r]));
  const prompt = readFileSync(join(PKG4, PROMPT_REL), 'utf8');
  c.check('prompt_sha256_is_the_authorized_prompt', before.prompt === '94429a1404c1c3cc80ce40d3ed41f1211b0473939fc8f07227ff41247ababec2', before.prompt);
  c.check('candidate_manifest_is_the_authorized_candidate', before.candidate_manifest === 'b454d4b858c81655b6ff56bde27a68c1ead9639305e2600a6fcf1746c8c304ad', before.candidate_manifest);
  const promptQ2 = (prompt.split('\n').find((l) => /^Q2\./.test(l)) || '');
  c.check('prompt_q2_states_no_identifier_length_or_character_limit', /"observation_id" \(short and unique\)/.test(promptQ2) && !/24|character|\[A-Za-z/.test(promptQ2), promptQ2.slice(0, 120));

  // Every captured request, traced from the raw capture; the capture must be the one the journal recorded.
  const captured = J.entries.filter((e) => e.state === 'captured');
  const traces = captured.map((e) => { const txt = readFileSync(join(capDir, e.request_id + '.json'), 'utf8'); c.check('capture_hash_matches_journal:' + e.request_id, sha(txt) === e.capture_sha256);
    return { request_id: e.request_id, txt, t: traceCapture(txt) }; });
  c.check('journal_hash_chain_valid', J.entries.length > 0 && J.entries.every((e, i) => i === 0 || e.prev_sha256 === J.entries[i - 1].entry_sha256));

  // Sensitivity replay of the identifier-length failures through the frozen compiler (isolated copy).
  mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
  const iso = isolate('0.3.4-research-candidate', join(SCRATCH, 'iso'), { requireManifest: true }); const E4 = await loadEngine(iso);
  const failures = traces.filter((x) => rowOf.get(x.request_id).classification === 'contract_failure').map((x) => {
    const q = qOf.get(x.request_id), k = cause(x.t), row = rowOf.get(x.request_id);
    const orig = compileCapture(E4, x.txt, q, textFor(q, targeted));
    const f = { request_id: x.request_id, record_id: q.base_record_id, phase: q.phase, repeat: q.repeat, reference_ai_proposed: q.reference_ai_proposed, trace: x.t,
      original_classification: row.classification, reproduced_by_frozen_compiler: orig.stage === 'contract' && (orig.refusal_codes || []).includes('candidate_response_invalid'), cause: k, cause_category: CAUSES[k].category };
    if (k === 'C1_unstated_identifier_length_limit') {
      const z = compileCapture(E4, renameIds(x.txt), q, textFor(q, targeted));
      f.sensitivity_identifiers_renamed = { label: 'SENSITIVITY ONLY: identifiers renamed o1..oN; not a result of the run and not a reclassification', stage: z.stage, e1: z.e1 || null, disposition: z.disposition || null,
        quotations: z.quotes_total, quote_status_counts: z.quote_status_counts || {}, guards: (z.guards || []).length, mechanical: (z.mechanical || []).length };
    } else f.sensitivity_identifiers_renamed = { label: 'not applicable: renaming identifiers would not address this failure, and dropping or repairing an observation would change evidence', stage: null };
    return f; });
  iso.release();
  c.check('seventeen_contract_failures_in_results', failures.length === 17, failures.length);
  c.check('every_failure_reproduced_by_frozen_compiler', failures.every((f) => f.reproduced_by_frozen_compiler));
  c.check('every_failure_transport_ok', failures.every((f) => f.trace.http_status === 200 && f.trace.stop_reason === 'end_turn' && f.trace.adapter === 'ok' && f.trace.strict_parser === 'ok'));
  const byCause = failures.reduce((o, f) => (o[f.cause] = (o[f.cause] || 0) + 1, o), {});
  const passing = traces.filter((x) => rowOf.get(x.request_id).engine && rowOf.get(x.request_id).engine.stage === 'compiled');
  const idLen = (xs) => xs.flatMap((x) => x.t.observation_id_lengths || []);
  const sens = failures.filter((f) => f.sensitivity_identifiers_renamed.stage);
  const sensE1 = sens.reduce((o, f) => { const s = f.sensitivity_identifiers_renamed; const key = s.stage === 'compiled' ? s.e1 + '_on_' + String(f.reference_ai_proposed).toLowerCase() : 'not_compiled:' + s.stage; o[key] = (o[key] || 0) + 1; return o; }, {});
  const diagnosis = { format: 'jrs-study-completion-failure-diagnosis/1.0.0', ...STATUS, run: RUN_ID, date: DATE, network_attempts: attempts.length,
    statement: 'Derived fields only; no record, quotation or response text. The original results stay as recorded. The sensitivity replay is not a result of the run.',
    causes: CAUSES, by_cause: byCause,
    identifier_lengths: { failing_responses_max: Math.max(...idLen(failures.map((f) => ({ t: f.trace })))), compiled_responses_max: Math.max(...idLen(passing)),
      compiled_responses_with_identifier_over_24: passing.filter((x) => x.t.observation_ids_over_24 > 0).length },
    prompt_q2: promptQ2, validator_rule: 'observation_id must match ^[A-Za-z0-9_-]{1,24}$ and be unique (response.mjs)',
    sensitivity_summary: { replayed: sens.length, outcome: sensE1, label: 'SENSITIVITY ONLY; descriptive; agreement with AI-proposed references is not accuracy' },
    failures, inputs_sha256: before };

  // Count reconciliation from the raw captures.
  const phaseRows = (ph) => set.requests.filter((q) => q.phase === ph);
  const tr = new Map(traces.map((x) => [x.request_id, x.t]));
  const sentIds = new Set(J.entries.filter((e) => e.state === 'sent').map((e) => e.request_id));
  const counts = {};
  for (const ph of ['PRE', 'RUN', 'TGT']) {
    const qs = phaseRows(ph), sent = qs.filter((q) => sentIds.has(q.request_id));
    const usable = sent.filter((q) => rowOf.get(q.request_id).engine && rowOf.get(q.request_id).engine.stage === 'compiled'), unusable = sent.filter((q) => !usable.includes(q));
    const sum = (xs, f) => xs.reduce((n, q) => n + f(q), 0);
    const statusSum = (xs) => xs.reduce((o, q) => { for (const [k, v] of Object.entries(rowOf.get(q.request_id).engine.quote_status_counts)) o[k] = (o[k] || 0) + v; return o; }, {});
    const st = statusSum(usable);
    counts[ph] = { planned: qs.length, sent: sent.length, attempts: J.entries.filter((e) => e.state === 'sent' && qs.some((q) => q.request_id === e.request_id)).length,
      http_200: sent.filter((q) => tr.get(q.request_id) && tr.get(q.request_id).http_status === 200).length,
      unique_records_sent: new Set(sent.map((q) => q.base_record_id)).size, repeats_sent: [...new Set(sent.map((q) => q.repeat))].sort(),
      usable_results: usable.length, unique_records_usable: new Set(usable.map((q) => q.base_record_id)).size, unusable_results: unusable.length,
      usable: { observations: sum(usable, (q) => tr.get(q.request_id).observations), quotations_proposed: sum(usable, (q) => tr.get(q.request_id).quotations),
        observations_without_quotation: sum(usable, (q) => tr.get(q.request_id).observations - tr.get(q.request_id).quotations),
        fenced_responses: usable.filter((q) => tr.get(q.request_id).fence_removed).length, status_counts_by_observation: st },
      unusable: { observations: sum(unusable, (q) => tr.get(q.request_id).observations), quotations_proposed_not_assessed: sum(unusable, (q) => tr.get(q.request_id).quotations) },
      original_report: res.summary.phases[ph] ? { quotations_total: res.summary.phases[ph].quotations.total, by_status: res.summary.phases[ph].quotations.by_status } : null };
    if (usable.length) {
      const u = counts[ph].usable;
      c.check('status_counts_cover_every_observation:' + ph, Object.values(st).reduce((a, b) => a + b, 0) === u.observations);
      c.check('not_assessed_equals_observations_without_quotation:' + ph, (st.not_assessed || 0) === u.observations_without_quotation, [st.not_assessed, u.observations_without_quotation]);
      const missed = sum(usable.filter((q) => tr.get(q.request_id).fence_removed), (q) => tr.get(q.request_id).quotations);
      c.check('original_total_equals_quotations_minus_fenced:' + ph, res.summary.phases[ph].quotations.total === u.quotations_proposed - missed, [res.summary.phases[ph].quotations.total, u.quotations_proposed, missed]);
    }
  }
  const pre = new Set(phaseRows('PRE').filter((q) => sentIds.has(q.request_id)).map((q) => q.base_record_id)), run = new Set(phaseRows('RUN').filter((q) => sentIds.has(q.request_id)).map((q) => q.base_record_id));
  const overall = { requests_sent: sentIds.size, attempts: J.entries.filter((e) => e.state === 'sent').length, unique_records_sent: new Set([...pre, ...run]).size, records_in_both_pre_and_run: [...pre].filter((r) => run.has(r)).length,
    unique_records_usable: new Set(['PRE', 'RUN'].flatMap((ph) => phaseRows(ph).filter((q) => sentIds.has(q.request_id) && rowOf.get(q.request_id).engine && rowOf.get(q.request_id).engine.stage === 'compiled').map((q) => q.base_record_id))).size,
    usable_results: counts.PRE.usable_results + counts.RUN.usable_results, unusable_results: counts.PRE.unusable_results + counts.RUN.unusable_results,
    cost_usd: res.summary.total_cost_usd };
  const fencedRows = traces.filter((x) => x.t.fence_removed).map((x) => ({ request_id: x.request_id, usable: rowOf.get(x.request_id).engine.stage === 'compiled', quotations: x.t.quotations, reported_quotes_total: rowOf.get(x.request_id).engine.quotes_total, reported_cited_spans: rowOf.get(x.request_id).engine.cited_spans.length }));
  const correction = { format: 'jrs-study-completion-live-results-correction/1.0.0', ...STATUS, run: RUN_ID, date: DATE, network_attempts: attempts.length, corrects: 'results/LIVE_RESULTS.json (kept unchanged)',
    statement: 'Counts derived from the raw captures and the journal. Agreement with AI-proposed references is not accuracy. No human label exists.',
    counting_units: { request: 'one planned request identifier; one HTTP exchange per attempt', record: 'a base record identifier; PRE and RUN can send the same record', usable_result: 'a captured response the frozen compiler accepted (stage compiled)',
      observation: 'one entry in the response observations array', quotation: 'an observation whose quote is text (not null)', status_count: 'one quote-resolution status per observation, including not_assessed for an observation without a quotation' },
    defects_found: [
      { id: 'D1', what: 'quotations.total and quotations.by_status count different units', detail: 'total counts quotations (observations with text quotes); by_status counts every observation, including not_assessed for observations without a quotation.' },
      { id: 'D2', what: 'score-live.mjs reads quotations with JSON.parse on the raw text', detail: 'A response in one exact markdown fence, which the frozen strict parser accepts and records, fails JSON.parse, so its quotes_total and cited_spans are recorded as 0 and empty. Compilation and E1 are unaffected (the compiler uses the strict parser). cited_spans feeds the TGT stated-irrelevant-basis measure, so a fenced TGT response would be scored as not citing the inserted sentence.', rows: fencedRows } ],
    overall, by_phase: counts, inputs_sha256: before };
  const after = snap();
  c.check('originals_unchanged', JSON.stringify(after) === JSON.stringify(before));
  c.check('no_network_attempts', attempts.length === 0, attempts.length);
  correction.checks = c.checks.filter((x) => !/^capture_hash_matches_journal:/.test(x.id)).concat([{ id: 'capture_hashes_match_journal', ok: c.checks.filter((x) => /^capture_hash_matches_journal:/.test(x.id)).every((x) => x.ok), detail: traces.length }]);
  diagnosis.checks = correction.checks;
  writeJson(join(DIR, 'reports', 'FAILURE_DIAGNOSIS_' + DATE + '.json'), diagnosis);
  writeJson(join(DIR, 'reports', 'LIVE_RESULTS_CORRECTION_' + DATE + '.json'), correction);
  writeOut(join(DIR, 'reports', 'FAILURE_DIAGNOSIS_' + DATE + '.md'), diagnosisMd(diagnosis));
  writeOut(join(DIR, 'reports', 'LIVE_RESULTS_CORRECTION_' + DATE + '.md'), correctionMd(correction));
  finish('diagnosis and reconciliation', c, JSON.stringify(byCause) + '; network attempts ' + attempts.length);
}

function diagnosisMd(d) {
  const s = d.sensitivity_summary, sv = d.failures.filter((f) => f.sensitivity_identifiers_renamed.stage).reduce((o, f) => { for (const [k, v] of Object.entries(f.sensitivity_identifiers_renamed.quote_status_counts)) o[k] = (o[k] || 0) + v; return o; }, {});
  return ['# Failure diagnosis: the 17 unusable responses of ' + d.run, '', 'Dated ' + d.date + '. Written by `tools/diagnosis/diagnose-live.mjs` from the private captures; derived fields only (no record, quotation or response text). ' + d.release_status + '; B-018 ' + d.b018 + '; candidate not adopted.', '',
    '## Finding', '', '| Cause | Responses | Category |', '|---|---|---|', ...Object.entries(d.by_cause).map(([k, n]) => '| ' + k + ' | ' + n + ' | ' + d.causes[k].category + ' |'), '',
    ...Object.entries(d.by_cause).map(([k]) => '**' + k + '.** ' + d.causes[k].explanation), '',
    'Every one of the 17 arrived with HTTP 200 and stop reason end_turn, passed the transport adapter and the frozen strict JSON parser, and was refused by the frozen validator (`response.mjs`) with refusal code `candidate_response_invalid`. Re-compiling each capture through an isolated copy of the frozen 0.3.4 reproduces the refusal. No transport, parser or compiler defect caused any of them.', '',
    '- Validator rule: ' + d.validator_rule + '.', '- Prompt Q2 (frozen, SHA-256 ' + d.inputs_sha256.prompt.slice(0, 16) + '): `' + d.prompt_q2.slice(0, 160) + '...`', '- Longest identifier in a refused response: ' + d.identifier_lengths.failing_responses_max + ' characters. Longest in an accepted response: ' + d.identifier_lengths.compiled_responses_max + '. Accepted responses with an identifier over 24: ' + d.identifier_lengths.compiled_responses_with_identifier_over_24 + '.', '',
    '## Per response', '', '| Request | Record | AI-proposed ref. | Validator reason | IDs over 24 | Observations | Quotations not assessed | Cause |', '|---|---|---|---|---|---|---|---|',
    ...d.failures.map((f) => '| ' + f.request_id + ' | ' + f.record_id + ' | ' + f.reference_ai_proposed + ' | ' + f.trace.validator + ' | ' + f.trace.observation_ids_over_24 + ' | ' + f.trace.observations + ' | ' + f.trace.quotations + ' | ' + f.cause.split('_')[0] + ' |'), '',
    '## Were usable findings discarded?', '', 'Yes, in the sense that each refusal discards the whole response: ' + d.failures.reduce((n, f) => n + f.trace.quotations, 0) + ' proposed quotations across the 17 were never assessed. That is the designed fail-closed behaviour and is kept.', '',
    'Sensitivity replay (**not a result of the run; not a reclassification**): with only the identifiers renamed o1..oN in the ' + s.replayed + ' C1 responses, the frozen compiler accepts all ' + s.replayed + '. Outcome against the AI-proposed references: ' + Object.entries(s.outcome).map(([k, v]) => k + ' ' + v).join(', ') + '. Quotation statuses: ' + Object.entries(sv).map(([k, v]) => k + ' ' + v).join(', ') + '. Agreement with AI-proposed references is not accuracy. The C2 response is not replayed: making it pass would mean dropping or repairing an observation.', '',
    '## Checks', '', ...d.checks.map((c) => '- ' + (c.ok ? 'PASS' : 'FAIL') + ' ' + c.id), ''].join('\n');
}
function correctionMd(c) {
  const P = c.by_phase.PRE, R = c.by_phase.RUN, o = c.overall;
  const row = (k, a, b, t) => '| ' + k + ' | ' + a + ' | ' + b + ' | ' + t + ' |';
  return ['# Correction to the live results of ' + c.run, '', 'Dated ' + c.date + '. Written by `tools/diagnosis/diagnose-live.mjs` from the raw captures and journal. The original `results/LIVE_RESULTS.json` is kept unchanged (SHA-256 ' + c.inputs_sha256.results.slice(0, 16) + '). ' + c.release_status + '; B-018 ' + c.b018 + '.', '',
    '## Old finding, new evidence, corrected status', '',
    '- **Old finding:** compatibility check "12 quotations in total but 18 by status"; full run "289 quotations" beside "300 verified, 5 not assessed, 1 absent".',
    '- **New evidence:** the two figures count different units (D1), and the scorer recorded 0 quotations for every response in a markdown fence (D2): PRE-02, RUN-r1-S-044 and RUN-r1-S-052 among the usable ones.',
    '- **Corrected status:** compatibility check ' + P.usable.quotations_proposed + ' quotations in ' + P.usable.observations + ' observations; full run ' + R.usable.quotations_proposed + ' quotations in ' + R.usable.observations + ' observations (table below).',
    '- **Explanation:** ' + c.defects_found.map((d) => d.id + ': ' + d.detail).join(' '), '',
    '## Corrected counts', '', '| Item | Compatibility check (PRE) | Full run (RUN) | Total |', '|---|---|---|---|',
    row('Planned requests', P.planned, R.planned, P.planned + R.planned + ' (+86 TGT not sent)'), row('Requests sent', P.sent, R.sent, o.requests_sent), row('Attempts', P.attempts, R.attempts, o.attempts), row('HTTP 200', P.http_200, R.http_200, P.http_200 + R.http_200),
    row('Unique records sent', P.unique_records_sent, R.unique_records_sent, o.unique_records_sent + ' (' + o.records_in_both_pre_and_run + ' records sent in both)'), row('Repeats sent', P.repeats_sent.join(', '), R.repeats_sent.join(', ') + ' (repeats 2 and 3 not reached)', ''),
    row('Usable results', P.usable_results, R.usable_results, o.usable_results), row('Unique records with a usable result', P.unique_records_usable, R.unique_records_usable, o.unique_records_usable), row('Unusable results', P.unusable_results, R.unusable_results, o.unusable_results),
    row('Observations in usable results', P.usable.observations, R.usable.observations, P.usable.observations + R.usable.observations), row('Quotations proposed (usable results)', P.usable.quotations_proposed + ' (reported 12)', R.usable.quotations_proposed + ' (reported 289)', P.usable.quotations_proposed + R.usable.quotations_proposed),
    row('Observations without a quotation (not_assessed)', P.usable.observations_without_quotation, R.usable.observations_without_quotation, P.usable.observations_without_quotation + R.usable.observations_without_quotation),
    row('Quotations verified_unique', P.usable.status_counts_by_observation.verified_unique || 0, R.usable.status_counts_by_observation.verified_unique || 0, (P.usable.status_counts_by_observation.verified_unique || 0) + (R.usable.status_counts_by_observation.verified_unique || 0)),
    row('Quotations absent from the record', P.usable.status_counts_by_observation.absent || 0, R.usable.status_counts_by_observation.absent || 0, (P.usable.status_counts_by_observation.absent || 0) + (R.usable.status_counts_by_observation.absent || 0)),
    row('Quotations in unusable results (never assessed)', P.unusable.quotations_proposed_not_assessed, R.unusable.quotations_proposed_not_assessed, P.unusable.quotations_proposed_not_assessed + R.unusable.quotations_proposed_not_assessed), row('Cost (USD)', '', '', o.cost_usd), '',
    'The 49 usable full-run results are 49 distinct records (repeat 1 only). Across both stages, ' + o.unique_records_usable + ' distinct records have at least one usable result.', '',
    '## Effect', '', 'E1 outcomes, compilation and cost are unaffected: the compiler reads responses with the frozen strict parser. Only the quotation totals and `cited_spans` in the scorer output are wrong for fenced responses. `cited_spans` feeds the TGT stated-irrelevant-basis measure (not yet run), so D2 must be corrected in the scorer before TGT is scored; that change alters a plan-bound file and so needs a new plan and authorization.', '',
    '## Checks', '', ...c.checks.map((x) => '- ' + (x.ok ? 'PASS' : 'FAIL') + ' ' + x.id), ''].join('\n');
}
