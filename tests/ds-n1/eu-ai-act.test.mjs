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
  // The sealed file is kept as committed. Every result must still match; only
  // the lens version label may differ (0.2.0 sealed, 0.3.0 after the
  // 2026-11-26 audit fixes, which changed no result in this set).
  const sealed = JSON.parse(readFileSync(new URL('./EU_AI_ACT_EVAL_2.json', import.meta.url), 'utf8'));
  assert.deepEqual({ ...now, lens: null }, { ...sealed, lens: null });
});

test('a source that says the opposite is never credited as backing the record (2026-11-26 audit)', () => {
  const l = byId(euAiActLens({ record_class: 'ai_action_authorization', text: 'The AI system is high-risk. Workers have been informed.', sources: [{ source_id: 'SYN', title: 'Fictional source', text: 'The AI system is high-risk. Workers have not been informed.' }] }));
  assert.equal(l.workers_informed.status, 'CONTRADICTED');
  assert.equal(l.workers_informed.source.contradicts, true);
});

test('an undecided risk class is never read as high-risk or as not applicable (2026-11-26 audit)', () => {
  const u = euAiActLens({ record_class: 'ai_action_authorization', text: 'The AI system evaluates workers and applicants. No risk status has been decided.', sources: [] });
  assert.equal(u.high_risk, null);
  assert.equal(byId(u).workers_informed.status, 'NEEDS_REVIEW');
  assert.equal(byId(u).affected_persons_informed.status, 'NEEDS_REVIEW');
  const p = euAiActLens({ record_class: 'ai_action_authorization', text: 'Risk classification is pending. The system screens job applicants.', sources: [] });
  assert.equal(p.high_risk, null);
  assert.equal(byId(p).risk_classification.flag, 'classification_pending');
});

test('the lens makes no network calls and imports nothing outside DS-N1', () => {
  const src = readFileSync(new URL('../../lib/ds-n1/eu-ai-act.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|from 'node:/);
});

test('every article the lens cites is stored verbatim from the official consolidated text', () => {
  const off = JSON.parse(readFileSync(new URL('../../lib/ds-n1/package/eu-ai-act-official-text.json', import.meta.url), 'utf8'));
  assert.match(off.source, /as at 27 July 2026/);
  assert.match(off.official_journal_verification.result, /All 11 paragraphs identical/);
  const verified = Object.entries(off.official_journal_verification).filter(([k]) => k.startsWith('Regulation')).flatMap(([, v]) => v);
  assert.deepEqual(verified.sort(), Object.keys(off.text).sort());
  assert.match(off.text['Article 4(1)'], /support the development of AI literacy/);
  assert.match(off.text['Article 26(6) first subparagraph'], /at least six months/);
  assert.match(off.text['Article 14(4)(e)'], /stop/);
  assert.match(off.text['Article 113(c)'], /2 December 2027/);
  const lit = EU_CHECKS.find((c) => c.id === 'ai_literacy');
  assert.match(lit.requirement, /support the development of AI literacy/);
});

test('Annex III areas now run end to end: credit, insurance and tenancy AI authorizations (owner decision 2026-11-25)', () => {
  const cases = [
    'On 2026-03-01, Ana Duarte authorized the scoring assistant to assess creditworthiness for loan applications. It is high-risk under Annex III. A credit officer reviews each score and can override it.',
    'On 2026-03-01, Ana Duarte authorized the pricing assistant to set life insurance premiums for policyholder renewals. It is high-risk under Annex III. An underwriter reviews each price and can override it.',
    'On 2026-03-01, Ana Duarte authorized the screening assistant to score tenancy applications from each tenant. It is high-risk under Annex III. A lettings officer reviews each score and can override it.',
  ];
  for (const text of cases) {
    const { record, validation } = extractRecord({ record_id: 'T-9', title: 'T-9 (fictional)', record_class: 'ai_action_authorization', text, sources: [{ title: 'Doc D-1', version: 'v1', text }] });
    assert.equal(validation.status, null, text.slice(30, 80));
    const l = euAiActLens(record);
    assert.equal(l.high_risk, true);
    assert.equal(byId(l).affected_persons_informed.status, 'NOT_SHOWN');
  }
});

test('other record classes still refuse those domains', () => {
  const { validation } = extractRecord({ record_id: 'T-8', title: 'T-8 (fictional)', record_class: 'supplier_access_exception', text: 'On 2026-03-01, Ana Duarte approved read access for Vexa Ltd to the loan application archive and mortgage files.', sources: [{ title: 'Doc D-1', version: 'v1', text: 'On 2026-03-01, Ana Duarte approved read access for Vexa Ltd to the archive.' }] });
  assert.equal(validation.status, 'REFUSED_SCOPE');
});

test('practitioner gaps: a cited policy counts as supplied only when a document titled with it is supplied', async () => {
  const m = await import('../../lib/ds-n1/index.mjs');
  const r = { schema: 'ds-n1.record/1.0', record_id: 'X-1', record_version: '1', record_class: 'supplier_access_exception', data_classification: 'constructed_fictional', title: 'X-1 (fictional)',
    text: 'The exception was granted under section 4 of the access policy.', entities: [],
    sources: [{ source_id: 'S1', title: 'Approval AP-1', version: 'v1', text: 'The exception was granted under section 4 of the access policy.' }],
    claims: [{ claim_id: 'C1', kind: 'authority', quote: 'The exception was granted under section 4 of the access policy.', citations: [{ source_id: 'S1', quote: 'The exception was granted under section 4 of the access policy.' }] }] };
  const codes = () => m.deriveState(m.openReview(r, { at: '2026-11-25T00:00:00Z' })).findings.map((f) => f.code);
  assert.deepEqual(codes(), ['AUTHORITY_TEXT_NOT_SUPPLIED']);
  r.sources.push({ source_id: 'S2', title: 'Access policy, section 4', version: 'v1', text: 'Section 4. The head of IT may approve exceptions.' });
  assert.deepEqual(codes(), []);
});

test('practitioner-gap sealed set reproduces its committed result', () => {
  const script = fileURLToPath(new URL('./eval-practitioner-gaps.mjs', import.meta.url));
  const now = JSON.parse(execFileSync(process.execPath, [script], { encoding: 'utf8' }));
  assert.deepEqual(now, JSON.parse(readFileSync(new URL('./PRACTITIONER_GAPS_EVAL.json', import.meta.url), 'utf8')));
});

test('practitioner-gap set 2 reproduces its committed result; set 1 first run is kept unchanged', () => {
  const script = fileURLToPath(new URL('./eval-practitioner-gaps.mjs', import.meta.url));
  const now = JSON.parse(execFileSync(process.execPath, [script, '--set=practitioner-gaps-eval-2'], { encoding: 'utf8' }));
  assert.deepEqual(now, JSON.parse(readFileSync(new URL('./PRACTITIONER_GAPS_EVAL_2.json', import.meta.url), 'utf8')));
  const first = JSON.parse(readFileSync(new URL('./PRACTITIONER_GAPS_EVAL.first-run.json', import.meta.url), 'utf8'));
  assert.deepEqual(first.gap_point_agreement, { k: 50, n: 50 });
});

test('every review finding code has a reasoning lens, a safeguard and a reviewer prompt', async () => {
  const { RULES } = await import('../../lib/ds-n1/assess.mjs');
  const m = await import('../../lib/ds-n1/index.mjs');
  const { buildSafeguards } = await import('../../lib/ds-n1/cognitive-safeguards.mjs');
  const { buildCognitiveControls } = await import('../../lib/ds-n1/cognitive-controls.mjs');
  const r = JSON.parse(readFileSync(new URL('./practitioner-gaps-eval/records.json', import.meta.url), 'utf8'));
  const { extractRecord: ex } = await import('../../lib/ds-n1/extract.mjs');
  const NEW = ['RECOMMENDATION_STATED_AS_REQUIREMENT', 'CONCLUSORY_ASSESSMENT', 'AUTHORITY_TEXT_NOT_SUPPLIED', 'CONCLUSION_ON_UNRESOLVED_BASIS', 'BROAD_ACCESS_NOT_JUSTIFIED'];
  for (const c of NEW) assert.ok(RULES[c], c);
  const seen = new Set();
  for (const rec of r.records) {
    const { record, validation } = ex({ record_id: rec.id, title: rec.title, record_class: rec.class, text: rec.text, sources: rec.sources.map((s) => ({ ...s, version: 'v1' })) });
    if (validation.status) continue;
    const st = m.deriveState(m.openReview(record, { at: '2026-11-25T00:00:00Z' }));
    const sg = buildSafeguards(st), cc = buildCognitiveControls(st);
    for (const f of st.findings.filter((x) => NEW.includes(x.code))) {
      seen.add(f.code);
      assert.ok(sg.lenses.some((l) => l.trigger === f.code), `lens for ${f.code}`);
      assert.ok(sg.controls.some((l) => l.trigger === f.code), `safeguard for ${f.code}`);
      assert.ok(cc.some((p) => p.finding_id === f.finding_id), `prompt for ${f.code}`);
    }
  }
  assert.ok(seen.size >= 4);
});
