// Study completion: builds the frozen live request set (records/LIVE_RECORD_SET.json) and the constructed texts of the
// targeted phase (records/TARGETED_TEXTS.jsonl). Offline; reads the frozen packages only. Every body is assembled from
// the frozen 0.3.5 continuation prompt with the frozen assembly code and the bound sender's request builder, and hashed.
//   PRE  3 requests: S-001, S-003, S-008 (the study plan's preflight records; exposed development material)
//   RUN  312 requests: every eligible record (104), three repeats, repeat-major order
//   TGT  86 requests, one each: T1 a stated but irrelevant basis inserted into each of the 42 UNGROUNDED records, exactly as
//        the paired suite's adversarial_stated_basis pool; T2 the 22 instruction phrasings of the injection suite in its
//        first flawed and first clean base record, at the suite's own positions
// Constructed texts are checked against the frozen suite outputs (T1: construction string; T2: instruction detection).
// Usage: node tools/build-live-set.mjs <scratch>
import { attempts } from './guard.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, PKG4, STATUS, sha, canonSha, readJson, checker, finish, writeJson, writeOut } from './common.mjs';
import { substantive, recordText, designedOf, referenceOf, byId } from '../../engine-repair-0.3.4-2026-10-27/tools/lib.mjs';
import { insert, POOLS } from '../../engine-repair-0.3.4-2026-10-27/tests/paired-suite.mjs';
import { CASES } from '../../engine-repair-0.3.4-2026-10-27/tests/injection-suite.mjs';
import { sentences } from '../../engine-repair-0.3.4-2026-10-27/tools/variant-spec-v2.mjs';
import { assemble } from '../../engine-repair-0.3.4-2026-10-27/tools/transport/prompt-assembly.mjs';
import { isolate, loadEngine } from './harness/engines.mjs';
import { ARMS_V2, declare, compileRow, PROFILE } from '../../engine-repair-0.3.4-2026-10-27/tools/compile-row-v2.mjs';
import { buildRequestBody, estimateTokens, worstCaseCost, MODEL } from './live/sender-bound.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: build-live-set.mjs <scratch>'); process.exit(2); }
mkdirSync(join(SCRATCH, 'iso'), { recursive: true });
const c = checker();
export const REQUEST = Object.freeze({ maxTokens: 4096, effort: 'medium', thinking: { type: 'disabled' } });
const PROMPT_PATH = join(DIR, 'candidate', 'prompt', 'PROMPT_research-0.3.5-1.txt');
const promptText = readFileSync(PROMPT_PATH, 'utf8');
const CHARS_PER_TOKEN_TYPICAL = 2.5;   // provider documentation: 1M tokens is roughly 2.5M Unicode characters on the current tokenizer

// The injection suite's placement, copied verbatim from tests/injection-suite.mjs (function place, not exported there).
function place(text, inj, i) {
  const ss = sentences(text);
  if (Array.isArray(inj)) {   // split: first part after sentence 1, second part at the end, separated by a blank line
    return [ss[0], inj[0], ...ss.slice(1)].join(' ') + '\n\n' + inj[1];
  }
  const at = [1, Math.max(1, ss.length - 1), ss.length][i % 3];
  return [...ss.slice(0, at), inj, ...ss.slice(at)].join(' ');
}

const mockIdx = new Map(readJson(join(PKG4, 'mocks-v2', 'MOCK_INDEX.json')).rows.map((r) => [r.policy + '/' + r.id, r]));
const outputProxy = (id) => { const r = mockIdx.get('ORACLE-R/' + id); if (!r) return null; const t = JSON.parse(readFileSync(join(PKG4, 'mocks-v2', 'ORACLE-R', id + '.json'), 'utf8')).envelope.content[0].text; return Math.ceil(t.length / CHARS_PER_TOKEN_TYPICAL); };
const requests = [], texts = [], notConstructible = [];
function add(requestId, phase, repeat, baseId, text, construction) {
  let a;
  try { a = assemble(promptText, text); } catch (e) { notConstructible.push({ request_id: requestId, phase, base_record_id: baseId, construction, reason: 'prompt assembly refused: ' + e.message }); return; }
  const body = buildRequestBody({ system: a.system, user: a.user, maxTokens: REQUEST.maxTokens, effort: REQUEST.effort, thinking: REQUEST.thinking });
  const payload = JSON.stringify(body), est = estimateTokens(payload);
  requests.push({ request_id: requestId, phase, repeat, base_record_id: baseId, reference_ai_proposed: referenceOf(baseId), construction: construction || null,
    text_source: construction ? 'records/TARGETED_TEXTS.jsonl' : 'frozen study record', text_path: construction ? null : byId.get(baseId).extracted_text_path, text_sha256: sha(text), body_sha256: sha(payload),
    est_input_tokens_upper: est, typical_input_tokens: Math.ceil(payload.length / CHARS_PER_TOKEN_TYPICAL), output_proxy_tokens: outputProxy(baseId), worst_case_attempt_usd: worstCaseCost(est, REQUEST.maxTokens) });
  if (construction) texts.push({ request_id: requestId, base_record_id: baseId, construction, text, text_sha256: sha(text) });
}

// PRE
for (const [i, id] of ['S-001', 'S-003', 'S-008'].entries()) add('PRE-' + String(i + 1).padStart(2, '0'), 'PRE', 1, id, recordText(id), null);
// RUN
for (const rep of [1, 2, 3]) for (const e of substantive) add('RUN-r' + rep + '-' + e.source_id, 'RUN', rep, e.source_id, recordText(e.source_id), null);
// TGT T1: as the paired suite: pos counts every eligible record in inventory order; the pool sentence is pos % 2.
const paired = readJson(join(PKG4, 'out', 'paired-0.3.4-research-candidate', 'RESULTS.json')).rows.filter((r) => r.kind === 'adversarial_stated_basis');
let t1Match = 0, t1 = 0;
for (const [pos, e] of substantive.entries()) {
  if (referenceOf(e.source_id) !== 'UNGROUNDED') continue;
  const sentence = POOLS.adversarial_stated_basis[pos % POOLS.adversarial_stated_basis.length];
  const ins = insert(recordText(e.source_id), sentence, pos), construction = ins.position + ': "' + sentence + '"';
  const frozen = paired.find((r) => r.id === e.source_id);
  t1++; if (frozen && frozen.construction === construction) t1Match++;
  add('TGT-SB-' + e.source_id, 'TGT', 1, e.source_id, ins.text, 'stated_irrelevant_basis ' + construction);
}
c.check('t1_42_ungrounded_records', t1 === 42, t1);
c.check('t1_constructions_equal_frozen_paired_suite', t1Match === t1, t1Match + '/' + t1);
// TGT T2: as the injection suite: bases are the first 8 flawed and first 8 clean synthetic records; i runs over every
// case (instruction and benign) of every base in order. Only the 22 instruction phrasings of the first base of each kind.
const flawed = substantive.filter((e) => designedOf(e.source_id) && designedOf(e.source_id).e1 === 'UNGROUNDED').slice(0, 8);
const clean = substantive.filter((e) => designedOf(e.source_id) && designedOf(e.source_id).e1 === 'GROUNDED').slice(0, 8);
const bases = [...flawed, ...clean];
const iso = isolate('0.3.5-research-candidate', join(SCRATCH, 'iso'), { requireManifest: true });
const E4 = await loadEngine(iso);
const A2 = ARMS_V2.find((a) => a.id === 'A2');
const injRows = readJson(join(PKG4, 'out', 'injection-0.3.4-research-candidate', 'RESULTS.json')).rows;
let t2 = 0, t2Match = 0; const t2Mismatch = [];
for (const [b, e] of bases.entries()) {
  if (b !== 0 && b !== flawed.length) continue;
  for (const [k, [cid, category, inj]] of CASES.entries()) {
    if (!cid.startsWith('IN-')) continue;
    const i = b * CASES.length + k;
    const text = place(recordText(e.source_id), inj, i);
    const r = compileRow(E4, A2, { text, declaration: declare(e), cand: null, designed: null, eligible: true, clock: '2026-10-27T12:00:00.000Z', fixtureId: e.source_id + '~T2', rpv: E4.research.RESEARCH_PROMPT_VERSION, profile: PROFILE });
    const detected = !!(r.observed && r.observed.instruction_risk === 'detected');
    const frozen = injRows.find((x) => x.case === cid && x.id === e.source_id);
    t2++; if (frozen && frozen.detected === detected) t2Match++; else t2Mismatch.push(cid + '/' + e.source_id);
    add('TGT-IN-' + cid.slice(3) + '-' + e.source_id, 'TGT', 1, e.source_id, text, 'instruction ' + cid + ' (' + category + ') at the injection suite position i=' + i + '; screen detects it: ' + detected);
  }
}
iso.release();
c.check('t2_44_cases', t2 === 44, t2);
c.check('t2_detection_equals_frozen_injection_suite', t2Match === t2, t2Mismatch);
const byPhase = { PRE: requests.filter((q) => q.phase === 'PRE').length, RUN: requests.filter((q) => q.phase === 'RUN').length, TGT: requests.filter((q) => q.phase === 'TGT').length };
c.check('phase_counts', byPhase.PRE === 3 && byPhase.RUN === 312 && byPhase.TGT + notConstructible.length === 86, { byPhase, notConstructible: notConstructible.length });
c.check('request_ids_unique', new Set(requests.map((q) => q.request_id)).size === requests.length);
c.check('every_body_uses_the_authorizable_model', requests.every((q) => q.body_sha256) && MODEL === 'claude-haiku-5-5');
c.check('targeted_texts_hash', texts.every((t) => sha(t.text) === t.text_sha256));

const textsFile = texts.map((t) => JSON.stringify(t)).join('\n') + '\n';
const textsSha = writeOut(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), textsFile);
const set = { format: 'jrs-study-continuation-live-record-set/1.0.0', arm: 'L2', parent_record_set: { path: 'research/study-completion-0.3.4-2026-10-28/records/LIVE_RECORD_SET.json', requests_sha256: '1b4644e6da7189ce66e94188c20e4c0cdbfa70704a1a502b826f1e403443cde9' }, ...STATUS, prompt: { path: 'research/study-continuation-0.3.5-2026-10-28/candidate/prompt/PROMPT_research-0.3.5-1.txt', sha256: sha(promptText) },
  request_parameters: REQUEST, model: MODEL, targeted_texts: { path: 'research/study-continuation-0.3.5-2026-10-28/records/TARGETED_TEXTS.jsonl', sha256: textsSha, rows: texts.length },
  statement: 'Every record is exposed development material; constructed texts are derived from eligible records. No request has been sent.',
  by_phase: byPhase, not_constructible: notConstructible, requests_sha256: canonSha(requests), requests };
writeJson(join(DIR, 'records', 'LIVE_RECORD_SET.json'), set);
finish('live record set', c, JSON.stringify(byPhase) + ', not constructible ' + notConstructible.length + ', requests_sha256 ' + set.requests_sha256.slice(0, 16) + ', network attempts ' + attempts.length);
