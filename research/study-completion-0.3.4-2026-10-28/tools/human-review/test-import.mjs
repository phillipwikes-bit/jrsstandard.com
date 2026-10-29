// Study completion: tests of the review batches and the label importer. Every answer here is a TEST FIXTURE written
// to scratch (reviewer "TEST FIXTURE (not a review)"); nothing is imported into human-review/HUMAN_LABELS.json and no
// judgement is made for the reviewer. The browser test loads a batch form from disk in headless Chromium with every
// network request aborted, fills one record, downloads the CSV and imports it into a scratch label file.
// Writes out/IMPORT_TESTS.json. Exits 1 if any test fails or any network attempt is recorded.
// Usage: node tools/human-review/test-import.mjs <scratch>
import { attempts } from '../guard.mjs';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { DIR, STUDY, STATUS, shaFile, readJson, writeJson } from '../common.mjs';
import { importFiles, applyAdjudication, emptyLabels, loadContext, parseCsv } from './import-labels.mjs';
import { COLUMNS, FORM_VERSION } from './build-batches.mjs';

const SCRATCH = process.argv[2];
if (!SCRATCH) { console.error('usage: test-import.mjs <scratch>'); process.exit(2); }
rmSync(SCRATCH, { recursive: true, force: true }); mkdirSync(SCRATCH, { recursive: true });
const ctx = loadContext(), NOW = '2026-10-28T12:00:00.000Z';
const REAL_LABELS = join(DIR, 'human-review', 'HUMAN_LABELS.json');
const realBefore = existsSync(REAL_LABELS) ? shaFile(REAL_LABELS) : null;
const frozenBefore = [join(STUDY, 'sealed', 'AI_PROPOSED_REFERENCE.json'), join(STUDY, 'sealed', 'BLIND_KEY.json')].map(shaFile);
const T = [];
async function test(id, name, fn) { let ok = false, observed = null; try { const r = await fn(); ok = r === true || !!(r && r.ok === true); observed = r && r.observed !== undefined ? r.observed : null; } catch (e) { observed = 'threw: ' + String(e && e.message).slice(0, 300); } T.push({ id, name, ok, observed }); }
const csvCell = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const firstSentence = (id) => { const t = ctx.texts.get(id); return t.split(/(?<=\.)\s+/)[1] || t.split(/(?<=\.)\s+/)[0]; };
const aiOf = (id) => ctx.ai.get(ctx.key.get(id).source_id);
const other = (e1) => (e1 === 'GROUNDED' ? 'UNGROUNDED' : 'GROUNDED');
function answer(id, o = {}) { const e1 = o.e1 || aiOf(id);
  return Object.assign({ form_version: FORM_VERSION, batch: 'BATCH_01', reviewer: 'TEST FIXTURE (not a review)', blind_id: id, record_text_sha256: ctx.key.get(id).text_sha256, e1, conclusion_1: 'test conclusion', passage_1: firstSentence(id), link_1: 'stated link',
    unsupported_conclusion: e1 === 'UNGROUNDED' ? 'test conclusion' : '', q1_authority: 'no authority cited', q2_reason: 'gives a separate basis', q3_dates: 'no dated events', q4_outcomes: 'no opposite outcomes', confidence: 'confident', disputed: 'no', dispute_reason: '', rationale: 'TEST FIXTURE', minutes: '3' }, o); }
function writeCsv(name, answers) { const p = join(SCRATCH, name); writeFileSync(p, COLUMNS.join(',') + '\r\n' + answers.map((a) => COLUMNS.map((c) => csvCell(a[c] === undefined ? '' : a[c])).join(',')).join('\r\n') + '\r\n'); return p; }
const run = (files, labels = emptyLabels()) => ({ labels, rep: importFiles({ files, labels, ...ctx, now: NOW }) });

await test('TI-01', 'a CSV with two answered records imports both; an equal label is human-reviewed, a different one is disputed; untouched records are not imported; the AI label is kept', () => {
  const blank = { blind_id: 'B-003' }; const p = writeCsv('t1.csv', [answer('B-001'), answer('B-002', { e1: other(aiOf('B-002')) }), blank]);
  const { labels, rep } = run([p]); const r1 = labels.records[ctx.key.get('B-001').source_id], r2 = labels.records[ctx.key.get('B-002').source_id];
  return { ok: rep.imported.length === 2 && rep.rejected.length === 0 && r1.status === 'human-reviewed' && r2.status === 'disputed' && r2.ai_proposed === aiOf('B-002') && r2.human.e1 === other(aiOf('B-002')) && !labels.records[ctx.key.get('B-003').source_id], observed: [r1.status, r2.status] };
});
await test('TI-02', 'the JSON export format imports; an unknown format is rejected', () => {
  const p = join(SCRATCH, 't2.json'); writeFileSync(p, JSON.stringify({ format: 'jrs-human-review-batch-answers/1.0.0', form_version: FORM_VERSION, batch: 'BATCH_01', answers: [answer('B-004')] }));
  const q = join(SCRATCH, 't2b.json'); writeFileSync(q, JSON.stringify({ format: 'other', answers: [answer('B-004')] }));
  const a = run([p]).rep, b = run([q]).rep;
  return { ok: a.imported.length === 1 && b.rejected[0].problem === 'unknown_format', observed: [a.imported.length, b.rejected] };
});
await test('TI-03', 'an unknown blind code, a Part 2 or 3 record, an invalid judgement or option, a changed record hash: each rejected', () => {
  const p2 = [...ctx.key.values()].find((k) => k.part !== 1).blind_id;
  const p = writeCsv('t3.csv', [answer('B-001', { blind_id: 'B-999' }), Object.assign(answer('B-001'), { blind_id: p2, record_text_sha256: '' }), answer('B-005', { e1: 'MAYBE' }), answer('B-006', { q3_dates: 'sometimes' }), answer('B-007', { record_text_sha256: '0'.repeat(64) })]);
  const { rep } = run([p]); const probs = rep.rejected.map((r) => r.problems.join('|'));
  return { ok: rep.imported.length === 0 && rep.rejected.length === 5 && /unknown_blind_id/.test(probs[0]) && /not_a_part_1_record/.test(probs[1]) && /e1_missing_or_invalid/.test(probs[2]) && /q3_dates_invalid/.test(probs[3]) && /record_text_hash_differs/.test(probs[4]), observed: probs };
});
await test('TI-04', 'passages: an exact copy (with or without quotation marks) is exact; a paraphrase is imported but listed as not exact', () => {
  const p = writeCsv('t4.csv', [answer('B-008'), answer('B-009', { passage_1: '"' + firstSentence('B-009') + '"' }), answer('B-010', { passage_1: 'a paraphrase that is not in the record' })]);
  const { labels, rep } = run([p]); const ex = (id) => labels.records[ctx.key.get(id).source_id].human.passages[0].exact;
  return { ok: rep.imported.length === 3 && ex('B-008') && ex('B-009') && !ex('B-010') && rep.passages_not_exact.length === 1 && rep.passages_not_exact[0].blind_id === 'B-010', observed: rep.passages_not_exact };
});
await test('TI-05', 'UNGROUNDED without the conclusion named, and a dispute without a reason, are rejected; UNCERTAIN is recorded as uncertain', () => {
  const p = writeCsv('t5.csv', [answer('B-011', { e1: 'UNGROUNDED', unsupported_conclusion: '' }), answer('B-012', { disputed: 'yes', dispute_reason: '' }), answer('B-013', { e1: 'UNCERTAIN' })]);
  const { labels, rep } = run([p]);
  return { ok: rep.rejected.length === 2 && /ungrounded_without_named_conclusion/.test(rep.rejected[0].problems) && /dispute_without_reason/.test(rep.rejected[1].problems) && labels.records[ctx.key.get('B-013').source_id].status === 'uncertain', observed: rep.rejected.map((r) => r.problems) };
});
await test('TI-06', 'a corrected answer appends a "corrected" event and keeps the earlier answer; re-importing the same answer adds nothing', () => {
  const a = writeCsv('t6a.csv', [answer('B-014')]), b = writeCsv('t6b.csv', [answer('B-014', { e1: other(aiOf('B-014')), unsupported_conclusion: 'x' })]);
  const labels = emptyLabels(); importFiles({ files: [a], labels, ...ctx, now: NOW }); importFiles({ files: [a], labels, ...ctx, now: NOW }); importFiles({ files: [b], labels, ...ctx, now: NOW });
  const r = labels.records[ctx.key.get('B-014').source_id];
  return { ok: r.history.length === 2 && r.history[0].event === 'imported' && r.history[1].event === 'corrected' && r.history[1].previous_human.e1 === aiOf('B-014') && r.status === 'disputed', observed: r.history.map((h) => h.event + ':' + h.new_status) };
});
await test('TI-07', 'adjudication: refused without a named adjudicator or date, refused for a record not in dispute, applied with history when complete', () => {
  const p = writeCsv('t7.csv', [answer('B-015', { e1: other(aiOf('B-015')), unsupported_conclusion: 'x' }), answer('B-016')]); const { labels } = run([p]);
  const bad = applyAdjudication({ adj: { format: 'jrs-human-review-adjudication/1.0.0', adjudicator: '', date_utc: 'x', decisions: [] }, labels, key: ctx.key, now: NOW, fileSha: 'f' });
  const none = applyAdjudication({ adj: { format: 'jrs-human-review-adjudication/1.0.0', adjudicator: 'TEST ADJUDICATOR', date_utc: NOW, decisions: [{ blind_id: 'B-016', e1: 'GROUNDED', reason: 'x' }] }, labels, key: ctx.key, now: NOW, fileSha: 'f' });
  const good = applyAdjudication({ adj: { format: 'jrs-human-review-adjudication/1.0.0', adjudicator: 'TEST ADJUDICATOR', date_utc: NOW, decisions: [{ blind_id: 'B-015', e1: 'GROUNDED', reason: 'TEST' }] }, labels, key: ctx.key, now: NOW, fileSha: 'f' });
  const r = labels.records[ctx.key.get('B-015').source_id];
  return { ok: bad.problems.includes('adjudicator_not_named') && bad.problems.includes('adjudication_date_invalid') && none.problems[0] === 'nothing_to_adjudicate:B-016' && good.applied[0] === 'B-015' && r.status === 'adjudicated' && r.ai_proposed === aiOf('B-015') && r.human.e1 === other(aiOf('B-015')),
    observed: [bad.problems, none.problems, r.status] };
});
await test('TI-08', 'a file carrying label or Engine columns, or another form version, is rejected', () => {
  const p = join(SCRATCH, 't8.csv'); writeFileSync(p, COLUMNS.concat(['ai_label']).join(',') + '\r\n' + COLUMNS.map((c) => csvCell(answer('B-017')[c])).concat(['"GROUNDED"']).join(',') + '\r\n');
  const q = writeCsv('t8b.csv', [answer('B-018', { form_version: 'S156-FORM-2.0' })]);
  const a = run([p]).rep, b = run([q]).rep;
  return { ok: a.rejected[0].problems[0] === 'file_contains_label_or_engine_columns' && b.rejected[0].problems[0] === 'form_version_differs', observed: [a.rejected, b.rejected] };
});
await test('TI-09', 'the untouched batch CSVs import nothing and reject nothing', () => {
  const files = [1, 2, 3, 4].map((n) => join(DIR, 'human-review', 'batches', 'BATCH_0' + n + '.csv')); const { rep } = run(files);
  return { ok: rep.imported.length === 0 && rep.rejected.length === 0 && files.every((f) => parseCsv(readFileSync(f, 'utf8')).length === 11), observed: [rep.imported.length, rep.rejected.length] };
});
await test('TI-10', 'static checks of every batch form: 11 records, the answer columns, no browser storage, no network call, no external resource', () => {
  const r = [1, 2, 3, 4].map((n) => { const h = readFileSync(join(DIR, 'human-review', 'batches', 'BATCH_0' + n + '.html'), 'utf8');
    return { recs: (h.match(/<section class="rec"/g) || []).length, cols: h.includes('COLS = ' + JSON.stringify(COLUMNS)), storage: /localStorage|sessionStorage|indexedDB|document\.cookie/.test(h), net: /\bfetch\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket/.test(h), ext: /(?:src|href)="https?:/.test(h) }; });
  return { ok: r.every((x) => x.recs === 11 && x.cols && !x.storage && !x.net && !x.ext), observed: r };
});
await test('TI-11', 'browser: the batch 1 form loads from disk with all network aborted, takes an answer, checks passages, downloads a CSV that the importer accepts', async () => {
  const require = createRequire(import.meta.url); let pw; try { pw = require('playwright'); } catch { return { ok: false, observed: 'playwright not available' }; }
  const browser = await pw.chromium.launch(); const blocked = [];
  try {
    const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
    await page.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('file://')) return route.continue(); blocked.push(u); return route.abort(); });
    const dialogs = []; page.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });
    await page.goto('file://' + join(DIR, 'human-review', 'batches', 'BATCH_01.html'));
    const sec = page.locator('section.rec[data-id="B-001"]');
    await page.fill('#reviewer', 'TEST FIXTURE (not a review)');
    await sec.locator('input[value="' + aiOf('B-001') + '"]').check();
    await sec.locator('[name="conclusion_1"]').fill('test conclusion');
    await sec.locator('[name="passage_1"]').fill(firstSentence('B-001'));
    await sec.locator('[name="link_1"]').selectOption('stated link');
    if (aiOf('B-001') === 'UNGROUNDED') await sec.locator('[name="unsupported_conclusion"]').fill('test conclusion');
    for (const [k, v] of [['q1_authority', 'no authority cited'], ['q2_reason', 'gives a separate basis'], ['q3_dates', 'no dated events'], ['q4_outcomes', 'no opposite outcomes'], ['confidence', 'confident'], ['disputed', 'no']]) await sec.locator('[name="' + k + '"]').selectOption(v);
    await sec.locator('[name="rationale"]').fill('TEST FIXTURE');
    await sec.locator('[name="gap_findings"]').fill('TEST gap finding');
    const sec2 = page.locator('section.rec[data-id="B-002"]'); await sec2.locator('[name="passage_1"]').fill('words that are not in the record');
    await page.click('#check');
    const marked = await sec2.locator('.chk').textContent();
    const progress = await page.locator('#progress').textContent();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
    const saved = join(SCRATCH, 'browser.csv'); await dl.saveAs(saved);
    const { labels, rep } = run([saved]);
    const r = labels.records[ctx.key.get('B-001').source_id];
    return { ok: r.human.gap_findings[0] === 'TEST gap finding' && blocked.length === 0 && /not exact/.test(marked) && /^1 of 11/.test(progress) && rep.imported.length === 1 && rep.rejected.length === 1 && rep.rejected[0].blind_id === 'B-002' && r.status === 'human-reviewed' && r.human.passages[0].exact === true && r.human.reviewer === 'TEST FIXTURE (not a review)',
      observed: { blocked: blocked.length, marked, progress, imported: rep.imported, rejected: rep.rejected.map((x) => x.blind_id + ':' + x.problems.join('|')), dialogs: dialogs.length } };
  } finally { await browser.close(); }
});
await test('TI-12', 'the command line refuses no arguments (exit 2), writes only to the --out file, and exits 1 when an answer is rejected', () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ANTHROPIC_/.test(k)));
  const cli = (args) => spawnSync(process.execPath, [join(DIR, 'tools', 'human-review', 'import-labels.mjs'), ...args], { env, encoding: 'utf8' });
  const a = cli([]); const out = join(SCRATCH, 'cli', 'LABELS.json'); mkdirSync(join(SCRATCH, 'cli'), { recursive: true });
  const b = cli(['--out', out, writeCsv('t12.csv', [answer('B-019')])]); const c = cli(['--out', out, writeCsv('t12b.csv', [answer('B-020', { e1: 'MAYBE' })])]);
  return { ok: a.status === 2 && b.status === 0 && existsSync(out) && readJson(out).summary.records_with_human_answer === 1 && c.status === 1, observed: [a.status, b.status, c.status] };
});
await test('TI-14', 'form 1.1: an answer from a 1.0 form (no gap_findings column) still imports; gap findings from a 1.1 form are kept one per line; the AI label is untouched', () => {
  const COLS10 = COLUMNS.filter((c) => c !== 'gap_findings'); const p = join(SCRATCH, 't14a.csv');
  writeFileSync(p, COLS10.join(',') + '\r\n' + COLS10.map((c) => csvCell(c === 'form_version' ? 'S156-COMPLETION-REVIEW-1.0' : answer('B-021')[c] === undefined ? '' : answer('B-021')[c])).join(',') + '\r\n');
  const q = writeCsv('t14b.csv', [answer('B-022', { e1: 'UNGROUNDED', unsupported_conclusion: 'test conclusion', gap_findings: 'TEST gap one\r\nTEST gap two' })]);
  const { labels, rep } = run([p, q]); const a = labels.records[ctx.key.get('B-021').source_id], b = labels.records[ctx.key.get('B-022').source_id];
  return { ok: rep.imported.length === 2 && rep.rejected.length === 0 && a.human.gap_findings.length === 0 && b.human.gap_findings.join('|') === 'TEST gap one|TEST gap two' && b.ai_proposed === aiOf('B-022'), observed: [rep.imported, a.human.gap_findings, b.human.gap_findings] };
});
await test('TI-15', 'static: every batch form shows the record ID and full record text for 11 records, offers "no gap identified" and "UNCERTAIN", has the gap findings field, and is blank (nothing checked, selected or typed)', () => {
  const man = readJson(join(DIR, 'human-review', 'BATCH_MANIFEST.json'));
  const r = [1, 2, 3, 4].map((n) => { const h = readFileSync(join(DIR, 'human-review', 'batches', 'BATCH_0' + n + '.html'), 'utf8'); const b = man.batches[n - 1];
    const textsShown = b.blind_ids.every((id) => h.includes('Record ' + id + '</h2>') && h.includes('data-sha="' + b.text_sha256[id] + '"'));
    const fullText = b.blind_ids.every((id) => { const t = ctx.texts.get(id).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); return h.includes('<blockquote class="txt">' + t + '</blockquote>'); });
    const form = h.replace(/<blockquote class="txt">[\s\S]*?<\/blockquote>/g, '');   // record text may contain any word
    const blank = !/\schecked\b|\sselected\b/.test(form) && !/<textarea[^>]*>[^<]+<\/textarea>/.test(form) && !/<input(?![^>]*type="radio")[^>]*\svalue="[^"]+"/.test(form);
    return { n, textsShown, fullText, blank, noGap: (h.match(/GROUNDED: no gap identified/g) || []).length === 11, uncertain: (h.match(/UNCERTAIN: cannot tell/g) || []).length === 11, gapField: (h.match(/name="gap_findings"/g) || []).length === 11, version: h.includes('S156-COMPLETION-REVIEW-1.1') }; });
  return { ok: r.every((x) => x.textsShown && x.fullText && x.blank && x.noGap && x.uncertain && x.gapField && x.version), observed: r };
});
await test('TI-16', 'browser: each of the four forms loads with every judgement empty; the downloaded untouched CSV imports nothing', async () => {
  const require = createRequire(import.meta.url); let pw; try { pw = require('playwright'); } catch { return { ok: false, observed: 'playwright not available' }; }
  const browser = await pw.chromium.launch(); const out = [];
  try {
    for (const n of [1, 2, 3, 4]) {
      const page = await (await browser.newContext({ acceptDownloads: true })).newPage(); const blocked = [];
      await page.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('file://')) return route.continue(); blocked.push(u); return route.abort(); });
      page.on('dialog', (d) => d.accept());
      await page.goto('file://' + join(DIR, 'human-review', 'batches', 'BATCH_0' + n + '.html'));
      const filled = await page.evaluate(() => answers().filter((a) => Object.keys(a).some((k) => !['form_version', 'batch', 'reviewer', 'blind_id', 'record_text_sha256'].includes(k) && a[k])).length);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]); const saved = join(SCRATCH, 'blank_' + n + '.csv'); await dl.saveAs(saved);
      const { rep } = run([saved]); out.push({ n, filled, blocked: blocked.length, imported: rep.imported.length, rejected: rep.rejected.length, rows: parseCsv(readFileSync(saved, 'utf8')).length });
    }
  } finally { await browser.close(); }
  return { ok: out.every((x) => x.filled === 0 && x.blocked === 0 && x.imported === 0 && x.rejected === 0 && x.rows === 11), observed: out };
});
await test('TI-13', 'no test wrote the real label file, and the frozen blind key and AI proposals are unchanged', () => {
  const after = [join(STUDY, 'sealed', 'AI_PROPOSED_REFERENCE.json'), join(STUDY, 'sealed', 'BLIND_KEY.json')].map(shaFile);
  return { ok: (existsSync(REAL_LABELS) ? shaFile(REAL_LABELS) : null) === realBefore && JSON.stringify(after) === JSON.stringify(frozenBefore), observed: realBefore };
});

const failed = T.filter((t) => !t.ok);
writeJson(join(DIR, 'out', 'IMPORT_TESTS.json'), { results_format: 'jrs-study-completion-import-tests/1.0.0', ...STATUS, network_attempts: attempts.length,
  statement: 'Every answer in these tests is a TEST FIXTURE written to scratch. No human judgement was recorded or invented.', totals: { tests: T.length, passed: T.length - failed.length, failed: failed.length }, results: T });
for (const t of T) console.log((t.ok ? 'PASS ' : 'FAIL ') + t.id + ' ' + t.name + (t.ok ? '' : '  observed: ' + JSON.stringify(t.observed).slice(0, 500)));
console.log('import tests: ' + (T.length - failed.length) + ' of ' + T.length + ' passed; network attempts ' + attempts.length);
process.exit(failed.length || attempts.length ? 1 : 0);
