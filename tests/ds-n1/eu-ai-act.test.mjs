// EU AI Act lens (2026-11-25): behaviour, honesty of wording, and the sealed results.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { euAiActLens, retentionMonths, EU_CHECKS } from '../../lib/ds-n1/eu-ai-act.mjs';
import { extractRecord } from '../../lib/ds-n1/extract.mjs';

const rec = (text, sources) => extractRecord({ record_id: 'T-1', title: 'T-1 (fictional)', record_class: 'ai_action_authorization', text, sources: sources.map((t, i) => ({ title: `Doc D-${i + 1}`, version: 'v1', text: t })) }).record;
const byId = (lens) => Object.fromEntries(lens.checks.map((c) => [c.id, c]));

test('never claims compliance; every check names an article and a question', () => {
  const l = euAiActLens(rec('On 2026-01-05, Ola Brandt authorized the sorting assistant to order support tickets. It is not high-risk.', ['It is not high-risk.']));
  assert.match(l.notice, /does not show that anyone complies/);
  assert.doesNotMatch(JSON.stringify({ ...l, notice: undefined }), /\b(is compliant|complies with|compliance confirmed|compliant)\b/i);
  for (const c of EU_CHECKS) { assert.ok(c.article && c.question && c.requirement); }
});

test('only runs on AI authorization records', () => {
  const r = rec('On 2026-01-05, Ola Brandt approved read access for Vexa Ltd to the archive.', ['On 2026-01-05, Ola Brandt approved read access for Vexa Ltd to the archive.']);
  r.record_class = 'supplier_access_exception';
  assert.equal(euAiActLens(r).applicable, false);
});

test('a stated point with no backing document is "stated, not supported"; a negated one is "not shown"', () => {
  const l = byId(euAiActLens(rec('On 2026-02-01, Ines Aalto authorized the ranking assistant to rank job applications. It is high-risk under Annex III. Logs are kept for twelve months. The assistant cannot be switched off during a run.', ['On 2026-02-01, Ines Aalto authorized the ranking assistant to rank job applications. It is high-risk under Annex III.'])));
  assert.equal(l.risk_classification.status, 'SHOWN_SUPPORTED');
  assert.equal(l.log_retention.status, 'STATED_UNSUPPORTED');
  assert.equal(l.stop_or_override.status, 'NOT_SHOWN');
  assert.equal(l.affected_persons_informed.status, 'NOT_SHOWN');
});

test('log retention under six months is flagged; "at least six months" is not', () => {
  assert.equal(retentionMonths('Logs are retained for 90 days.'), 3);
  const short = byId(euAiActLens(rec('On 2026-02-01, Ines Aalto authorized the ranking assistant. It is high-risk under Annex III. Logs are kept for three months.', ['Logs are kept for three months.'])));
  assert.equal(short.log_retention.flag, 'below_six_months');
  const ok = byId(euAiActLens(rec('On 2026-02-01, Ines Aalto authorized the ranking assistant. It is high-risk under Annex III. Logs are kept for at least six months.', ['Logs are kept for at least six months.'])));
  assert.equal(ok.log_retention.flag, undefined);
});

test('"training" in a job title is not evidence that staff were trained', () => {
  const l = byId(euAiActLens(rec('On 2026-02-01, the training director authorized the quiz assistant to mark practice quizzes. It is not high-risk.', ['On 2026-02-01, the training director authorized the quiz assistant to mark practice quizzes. It is not high-risk.'])));
  assert.equal(l.ai_literacy.status, 'NOT_SHOWN');
});

test('sealed evaluation set 2 reproduces its committed result', () => {
  const script = fileURLToPath(new URL('./eval-eu-ai-act.mjs', import.meta.url));
  const now = JSON.parse(execFileSync(process.execPath, [script, '--set=eu-ai-act-eval-2'], { encoding: 'utf8' }));
  assert.deepEqual(now, JSON.parse(readFileSync(new URL('./EU_AI_ACT_EVAL_2.json', import.meta.url), 'utf8')));
});

test('the lens makes no network calls and imports nothing outside DS-N1', () => {
  const src = readFileSync(new URL('../../lib/ds-n1/eu-ai-act.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|from 'node:/);
});
