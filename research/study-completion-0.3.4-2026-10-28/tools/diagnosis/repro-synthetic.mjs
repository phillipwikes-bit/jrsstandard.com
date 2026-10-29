// Study completion (0.3.4): minimal reproductions, on synthetic text only, of the two failure causes and the scorer
// counting defect found in live run RUN-LIVE-AUTH-20261028-01. Uses an isolated copy of the frozen 0.3.4 and the
// frozen compile path; changes nothing. Writes out/SYNTHETIC_REPRO.json. Exits 1 if any reproduction does not behave
// as the diagnosis states, or on any network attempt.
// Usage: node tools/diagnosis/repro-synthetic.mjs <scratch>
import { attempts } from '../guard.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, STATUS, writeJson, checker, finish } from '../common.mjs';
import { LIVE_ARM, CLOCK } from '../live/score-live.mjs';
import { declare, compileRow, PROFILE } from '../../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { isolate, loadEngine } from '../../../engine-repair-0.3.4-2026-10-27/tools/harness/engines.mjs';
import { parseCandidateResponse } from '../../../engine-repair-0.3.4-2026-10-27/candidate/lib/engine-evidence-contract/strict-json.mjs';
import { validateCandidate } from '../../../engine-repair-0.3.4-2026-10-27/candidate/lib/engine-evidence-graph-v0.3.4-research-candidate/response.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: repro-synthetic.mjs <scratch>'); process.exit(2); }
mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const iso = isolate('0.3.4-research-candidate', join(SCRATCH, 'iso'), { requireManifest: true }); const E4 = await loadEngine(iso);
const RPV = E4.research.RESEARCH_PROMPT_VERSION;

// SYNTHETIC record: invented for this test; no study record is used.
const TEXT = ['SYNTHETIC TEST RECORD SYN-REPRO-01', 'Date: 2026-01-10', 'Decision: The synthetic vendor access request was approved.',
  'Basis: The approval rests on the signed synthetic security review dated 2026-01-08.', 'Reviewer: Synthetic Reviewer'].join('\n');
const cand = (id, condition = 'identifiable_basis') => JSON.stringify({ contract_version: 'jrs-engine-local-0.3.0-evidence-graph', prompt_version: RPV, observations: [
  { observation_id: id, condition_id: condition, proposed_status: 'supported', quote: 'The approval rests on the signed synthetic security review dated 2026-01-08.', assertion_type: 'basis' }] });
const compile = (c, id) => { const r = compileRow(E4, LIVE_ARM, { text: TEXT, declaration: declare({ cohort: 'synthetic_record' }), cand: c, designed: null, eligible: true, clock: CLOCK, fixtureId: 'SYN-' + id, rpv: RPV, profile: PROFILE });
  const refusals = (r.observed && r.observed.refusal_codes) || []; return { disposition: r.disposition, e1: r.e1, refused_invalid: refusals.includes('candidate_response_invalid'), quote_statuses: r.observed ? r.observed.quote_statuses : null }; };

const id24 = 'basis-security-review-ab', id25 = 'basis-security-review-abc';
const R = {};
R.R1_id_24_chars = { id_length: id24.length, validator: validateCandidate(cand(id24), { promptVersion: RPV }).ok ? 'ok' : 'refused', compile: compile(cand(id24), 'R1') };
R.R2_id_25_chars = { id_length: id25.length, validator: validateCandidate(cand(id25), { promptVersion: RPV }).reason || 'ok', compile: compile(cand(id25), 'R2') };
R.R3_id_renamed_o1 = { id_length: 2, validator: validateCandidate(cand('o1'), { promptVersion: RPV }).ok ? 'ok' : 'refused', compile: compile(cand('o1'), 'R3') };
R.R4_unlisted_condition = { validator: validateCandidate(cand('o1', 'identifiable_authority'), { promptVersion: RPV }).reason || 'ok', compile: compile(cand('o1', 'identifiable_authority'), 'R4') };
const fenced = '```json\n' + cand('o1') + '\n```';
let scorerParse; try { scorerParse = JSON.parse(fenced).observations.length; } catch { scorerParse = 'throws (scorer records 0 quotations)'; }
const scorerSource = readFileSync(join(DIR, 'tools', 'live', 'score-live.mjs'), 'utf8');
R.R5_fenced_response = { strict_parser: parseCandidateResponse(fenced).ok ? 'ok, fence removed and recorded' : 'refused', compile: compile(fenced, 'R5'), scorer_expression_present: scorerSource.includes('JSON.parse(x.text).observations'), scorer_expression_result: scorerParse };
iso.release();

const c = checker();
c.check('R1_24_character_identifier_accepted', R.R1_id_24_chars.validator === 'ok' && !R.R1_id_24_chars.compile.refused_invalid);
c.check('R2_25_character_identifier_refused_whole_response', R.R2_id_25_chars.validator === 'observation_id_invalid_or_duplicate' && R.R2_id_25_chars.compile.refused_invalid);
c.check('R3_identifier_carries_no_evidence', !R.R3_id_renamed_o1.compile.refused_invalid && R.R3_id_renamed_o1.compile.e1 === R.R1_id_24_chars.compile.e1 && JSON.stringify(Object.values(R.R3_id_renamed_o1.compile.quote_statuses)) === JSON.stringify(Object.values(R.R1_id_24_chars.compile.quote_statuses)));
c.check('R4_unlisted_condition_refused', R.R4_unlisted_condition.validator === 'unrecognised_condition_id' && R.R4_unlisted_condition.compile.refused_invalid);
c.check('R5_fenced_response_compiles_but_scorer_counts_zero', !R.R5_fenced_response.compile.refused_invalid && R.R5_fenced_response.scorer_expression_present && typeof R.R5_fenced_response.scorer_expression_result === 'string');
c.check('no_network_attempts', attempts.length === 0, attempts.length);
writeJson(join(DIR, 'out', 'SYNTHETIC_REPRO.json'), { format: 'jrs-study-completion-synthetic-repro/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Synthetic text only. Each case changes one thing against R1.', synthetic_record: TEXT, cases: R, checks: c.checks });
finish('synthetic reproductions', c, 'network attempts ' + attempts.length);
