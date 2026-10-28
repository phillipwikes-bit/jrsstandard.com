// Study completion: builds the human-review batches for the 44 Part 1 records (blind codes B-001 to B-044) in four
// batches of 11: a fillable HTML form (works offline, saves answers as a CSV or JSON download, uses no browser
// storage), a CSV for a spreadsheet, and a printable Markdown copy. Nothing is filled in. No Engine output, AI-proposed
// label, score, cohort, partition or construction detail appears in any batch. Record texts are checked against the
// blind key and the inventory before they are written.
// Usage: node tools/human-review/build-batches.mjs
import { attempts } from '../guard.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIR, ROOT, STUDY, STATUS, sha, readJson, checker, finish, writeJson, writeOut } from '../common.mjs';

// 1.1 (2026-10-28): the judgement options carry plain gap wording ("no gap identified", "gap identified"), a
// documentation-gap instruction is added, and a free-text gap_findings column is added. Stored values are unchanged,
// so answers on a 1.0 form still import. No reviewer had used 1.0 when it was replaced.
export const FORM_VERSION = 'S156-COMPLETION-REVIEW-1.1';
export const ACCEPTED_FORM_VERSIONS = Object.freeze(['S156-COMPLETION-REVIEW-1.0', FORM_VERSION]);
export const E1_LABELS = Object.freeze({ GROUNDED: 'GROUNDED: no gap identified', UNGROUNDED: 'UNGROUNDED: gap identified', UNCERTAIN: 'UNCERTAIN: cannot tell' });
export const OPTIONS = Object.freeze({
  e1: ['GROUNDED', 'UNGROUNDED', 'UNCERTAIN'],
  link: ['stated link', 'plain link', 'no supporting passage'],
  q1_authority: ['authority only', 'authority with linked facts', 'no authority cited'],
  q2_reason: ['restates the conclusion', 'gives a separate basis', 'no reason stated'],
  q3_dates: ['one event given two different dates', 'different events, consistent', 'no dated events', 'cannot tell'],
  q4_outcomes: ['separate items, no contradiction', 'the same item, contradiction', 'no opposite outcomes'],
  confidence: ['confident', 'somewhat uncertain', 'very uncertain'],
  disputed: ['no', 'yes'],
});
export const COLUMNS = ['form_version', 'batch', 'reviewer', 'blind_id', 'record_text_sha256', 'e1', 'conclusion_1', 'passage_1', 'link_1', 'conclusion_2', 'passage_2', 'link_2', 'conclusion_3', 'passage_3', 'link_3',
  'unsupported_conclusion', 'gap_findings', 'q1_authority', 'q2_reason', 'q3_dates', 'q4_outcomes', 'confidence', 'disputed', 'dispute_reason', 'rationale', 'minutes'];
const INSTRUCTIONS = [
  'Read each record on its own terms. Judge whether its conclusions can be traced to evidence written in the record. Do not judge whether the decision itself was right, and do not use outside knowledge.',
  'What a documentation gap is. A gap exists when the record states a material conclusion but does not write down the evidence it rests on: no source, no fact, no document, or a reason that only repeats the outcome. A gap is about what the record shows, not whether the decision was right.',
  'Overall judgement. GROUNDED (no gap identified): every material conclusion is traceable to identifiable evidence in the record. UNGROUNDED (gap identified): at least one material conclusion is not. UNCERTAIN (cannot tell): say why in the rationale. Leaving it blank means not yet judged.',
  'Material conclusions. A material conclusion is a statement that, if wrong, would change the decision or its defensibility. List up to three, a few words each.',
  'Supporting passages. For each conclusion, copy the exact words from the record that support it (copy and paste; do not paraphrase). Choose "stated link" if the record says the conclusion rests on that evidence, "plain link" if the evidence plainly concerns the same item, or "no supporting passage".',
  'If UNGROUNDED, name the conclusion that has no basis. Under "Documentation gaps found", list each gap you see in your own words, one per line, and copy the exact passage that shows it into a supporting passage field where you can.',
  'Answer the four questions: Q1 is a rule or policy cited, and do facts show its conditions were met; Q2 does the stated reason give a separate basis or only repeat the outcome; Q3 is one event given two different dates (a next, previous or revised event is a different event); Q4 are opposite outcomes about the same item or separate items.',
  'Dispute. If the record, the questions or these instructions seem flawed or unclear for this record, choose "yes" and say why. A dispute is recorded with your answers; it is not an error.',
  'Rationale. A few sentences on how you decided. Note the minutes you spent if you can.',
  'Save your answers with the "Download answers" button (CSV or JSON) and send the file back. Nothing is saved automatically. Your answers become the human reference only when the completed file is imported; they are kept alongside, never over, the earlier AI-proposed labels.',
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const csvCell = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const sel = (name, opts) => '<select name="' + name + '"><option value="">choose</option>' + opts.map((o) => '<option>' + esc(o) + '</option>').join('') + '</select>';

function html(b) {
  const recHtml = b.records.map((r, n) => '<section class="rec" data-id="' + r.blind_id + '" data-sha="' + r.text_sha256 + '"><h2>' + (n + 1) + '. Record ' + r.blind_id + '</h2>'
    + '<blockquote class="txt">' + esc(r.text) + '</blockquote>'
    + '<div class="row"><span class="lab">Overall judgement</span>' + OPTIONS.e1.map((o) => '<label class="pill"><input type="radio" name="' + r.blind_id + '_e1" value="' + o + '"> ' + esc(E1_LABELS[o]) + '</label>').join('') + '</div>'
    + [1, 2, 3].map((k) => '<div class="grid"><label>Conclusion ' + k + '<input name="conclusion_' + k + '" placeholder="a few words"></label><label>Exact supporting passage<textarea name="passage_' + k + '" rows="2" placeholder="copy the exact words from the record"></textarea></label><label>Link' + sel('link_' + k, OPTIONS.link) + '</label></div>').join('')
    + '<label class="wide">If UNGROUNDED, the conclusion without a basis<input name="unsupported_conclusion"></label>'
    + '<label class="wide">Documentation gaps found (one per line; leave empty if none)<textarea name="gap_findings" rows="2"></textarea></label>'
    + '<div class="grid4"><label>Q1 authority' + sel('q1_authority', OPTIONS.q1_authority) + '</label><label>Q2 reason' + sel('q2_reason', OPTIONS.q2_reason) + '</label><label>Q3 dates' + sel('q3_dates', OPTIONS.q3_dates) + '</label><label>Q4 outcomes' + sel('q4_outcomes', OPTIONS.q4_outcomes) + '</label></div>'
    + '<div class="grid4"><label>Confidence' + sel('confidence', OPTIONS.confidence) + '</label><label>Dispute this record or the questions?' + sel('disputed', OPTIONS.disputed) + '</label><label class="span2">If yes, why<input name="dispute_reason"></label></div>'
    + '<label class="wide">Rationale<textarea name="rationale" rows="3"></textarea></label><label class="mins">Minutes spent<input name="minutes" inputmode="numeric"></label><p class="chk" aria-live="polite"></p></section>').join('\n');
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Record review ' + b.id.replace('_0', ' ') + '</title>\n<style>\n'
    + ':root{--bg:#050505;--surface:#121212;--surface2:#1A1A1A;--accent:#BE9447;--muted:#B3B3B3;--muted-soft:#8A8A8A;--text:#F2F2F2;--rule:#2A2A2A;--stop-text:#E88080;--ready-text:#5DBF82}\n'
    + 'body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 Inter,system-ui,sans-serif}main{max-width:860px;margin:0 auto;padding:16px}h1{font-family:"Bodoni Moda",Georgia,serif;font-weight:500;margin:.4em 0}h2{font:600 15px "JetBrains Mono",monospace;color:var(--accent);margin:0 0 .6em}\n'
    + '.intro,.rec{background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:16px;margin:16px 0}.intro li{margin:.35em 0;color:var(--muted)}.txt{background:var(--surface2);border-left:3px solid var(--accent);margin:0 0 12px;padding:12px 14px;white-space:pre-wrap}\n'
    + 'label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}input,textarea,select{background:var(--bg);color:var(--text);border:1px solid var(--rule);border-radius:6px;padding:8px;font:15px Inter,system-ui,sans-serif;min-width:0;width:100%;box-sizing:border-box}.grid>*,.grid4>*{min-width:0}.pill input{width:auto}\n'
    + '.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.lab{font-size:13px;color:var(--muted);margin-right:4px}.pill{flex-direction:row;align-items:center;gap:6px;border:1px solid var(--rule);border-radius:999px;padding:6px 12px;color:var(--text)}\n'
    + '.grid{display:grid;grid-template-columns:1fr 2fr 1fr;gap:8px;margin:8px 0}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:8px 0}.span2{grid-column:span 2}.wide{margin:8px 0}.mins{max-width:160px}\n'
    + '.bar{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--rule);padding:10px 16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;z-index:2}button{background:var(--accent);color:var(--bg);border:0;border-radius:6px;padding:9px 14px;font:600 14px Inter,system-ui,sans-serif;cursor:pointer}button.sec{background:var(--surface2);color:var(--text);border:1px solid var(--rule)}\n'
    + '.chk{margin:6px 0 0;font-size:13px}.bad{color:var(--stop-text)}.good{color:var(--ready-text)}#progress{font:13px "JetBrains Mono",monospace;color:var(--muted)}\n'
    + '@media (max-width:640px){.grid,.grid4{grid-template-columns:1fr}.span2{grid-column:auto}}\n</style></head><body>\n'
    + '<div class="bar"><span id="progress">0 of ' + b.records.length + ' judged</span><button type="button" id="check" class="sec">Check passages</button><button type="button" id="csv">Download answers (CSV)</button><button type="button" id="json" class="sec">Download answers (JSON)</button></div>\n'
    + '<main><h1>Record review, batch ' + b.id.slice(-1) + ' of 4</h1><div class="intro"><p><strong>Form ' + FORM_VERSION + '.</strong> ' + b.records.length + ' records. Nothing has been filled in on your behalf. This form shows no Engine output, no AI-proposed label and no score.</p>'
    + '<label>Reviewer name<input id="reviewer" placeholder="your name"></label><ol>' + INSTRUCTIONS.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>\n' + recHtml + '\n</main>\n<script>\n'
    + 'var BATCH = ' + JSON.stringify(b.id) + ', FORM = ' + JSON.stringify(FORM_VERSION) + ', COLS = ' + JSON.stringify(COLUMNS) + ';\n'
    + 'var dirty = false;\n'
    + 'function norm(s) { return String(s || "").replace(/\\s+/g, " ").trim(); }\n'
    + 'function val(sec, name) { var el = sec.querySelector("[name=\\"" + name + "\\"]"); return el ? el.value : ""; }\n'
    + 'function answers() {\n  var out = []; var secs = document.querySelectorAll(".rec");\n  for (var i = 0; i < secs.length; i++) { var s = secs[i]; var id = s.getAttribute("data-id"); var e1 = s.querySelector("input[name=\\"" + id + "_e1\\"]:checked");\n'
    + '    var a = { form_version: FORM, batch: BATCH, reviewer: (document.getElementById("reviewer") || {}).value || "", blind_id: id, record_text_sha256: s.getAttribute("data-sha"), e1: e1 ? e1.value : "" };\n'
    + '    for (var k = 5; k < COLS.length; k++) { var c = COLS[k]; if (c === "e1") continue; if (!(c in a)) a[c] = val(s, c); }\n    out.push(a); }\n  return out;\n}\n'
    + 'function progress() { var n = 0, all = answers(); for (var i = 0; i < all.length; i++) if (all[i].e1) n++; var p = document.getElementById("progress"); if (p) p.textContent = n + " of " + all.length + " judged"; }\n'
    + 'function checkPassages() {\n  var secs = document.querySelectorAll(".rec"), bad = 0;\n  for (var i = 0; i < secs.length; i++) { var s = secs[i], txt = norm((s.querySelector(".txt") || {}).textContent), msgs = [];\n'
    + '    for (var k = 1; k <= 3; k++) { var p = norm(val(s, "passage_" + k)); if (p && txt.indexOf(p.replace(/^["\\u201c\\u2018\']+|["\\u201d\\u2019\']+$/g, "")) < 0) msgs.push("passage " + k + " is not exact"); }\n'
    + '    var out = s.querySelector(".chk"); if (out) { out.textContent = msgs.length ? msgs.join("; ") : ""; out.className = "chk " + (msgs.length ? "bad" : "good"); } bad += msgs.length; }\n  return bad;\n}\n'
    + 'function save(name, type, text) { try { var b = new Blob([text], { type: type }); var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); dirty = false; } catch (e) { alert("The download did not start: " + e.message); } }\n'
    + 'function stamp() { return new Date().toISOString().slice(0, 10); }\n'
    + 'function toCsv() { var all = answers(), lines = [COLS.join(",")]; for (var i = 0; i < all.length; i++) { var r = []; for (var k = 0; k < COLS.length; k++) r.push("\\"" + String(all[i][COLS[k]] || "").replace(/"/g, "\\"\\"") + "\\""); lines.push(r.join(",")); } return lines.join("\\r\\n") + "\\r\\n"; }\n'
    + 'document.addEventListener("input", function () { dirty = true; progress(); });\ndocument.addEventListener("change", function () { dirty = true; progress(); });\n'
    + 'var bc = document.getElementById("check"); if (bc) bc.addEventListener("click", function () { var n = checkPassages(); alert(n ? n + " passage(s) are not exact copies of the record text. They are marked under each record." : "Every passage you entered is an exact copy of the record text."); });\n'
    + 'var bv = document.getElementById("csv"); if (bv) bv.addEventListener("click", function () { checkPassages(); save(BATCH + "_COMPLETED_" + stamp() + ".csv", "text/csv", toCsv()); });\n'
    + 'var bj = document.getElementById("json"); if (bj) bj.addEventListener("click", function () { checkPassages(); save(BATCH + "_COMPLETED_" + stamp() + ".json", "application/json", JSON.stringify({ format: "jrs-human-review-batch-answers/1.0.0", form_version: FORM, batch: BATCH, exported_at_utc: new Date().toISOString(), answers: answers() }, null, 2)); });\n'
    + 'window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });\nprogress();\n</script>\n</body></html>\n';
}
// LF line endings in the repository copy; the form's own download uses CRLF; the importer reads both.
function csv(b) { return COLUMNS.concat(['record_text']).join(',') + '\n' + b.records.map((r) => COLUMNS.map((k) => csvCell(k === 'form_version' ? FORM_VERSION : k === 'batch' ? b.id : k === 'blind_id' ? r.blind_id : k === 'record_text_sha256' ? r.text_sha256 : '')).concat([csvCell(r.text)]).join(',')).join('\n') + '\n'; }
function md(b) {
  const f = (label, opts) => '- ' + label + (opts ? ' (' + opts.join(' / ') + ')' : '') + ': ____';
  return ['# Record review, batch ' + b.id.slice(-1) + ' of 4', '', '**Form ' + FORM_VERSION + '.** ' + b.records.length + ' records. Nothing has been filled in on your behalf. No Engine output, AI-proposed label or score appears here.', '',
    '## Instructions', '', ...INSTRUCTIONS.map((x, i) => (i + 1) + '. ' + x), '', 'Reviewer name: ____', '',
    ...b.records.flatMap((r, n) => ['## ' + (n + 1) + '. Record ' + r.blind_id, '', '> ' + r.text.replace(/\n/g, '\n> '), '', f('Overall judgement', OPTIONS.e1.map((o) => E1_LABELS[o])),
      ...[1, 2, 3].flatMap((k) => [f('Conclusion ' + k), f('Exact supporting passage ' + k), f('Link ' + k, OPTIONS.link)]), f('If UNGROUNDED, the conclusion without a basis'), f('Documentation gaps found (one per line; leave empty if none)'),
      f('Q1 authority', OPTIONS.q1_authority), f('Q2 reason', OPTIONS.q2_reason), f('Q3 dates', OPTIONS.q3_dates), f('Q4 outcomes', OPTIONS.q4_outcomes), f('Confidence', OPTIONS.confidence),
      f('Dispute this record or the questions?', OPTIONS.disputed), f('If yes, why'), f('Rationale'), f('Minutes spent'), ''])].join('\n');
}

if (import.meta.url === 'file://' + process.argv[1]) {
const key = readJson(join(STUDY, 'sealed', 'BLIND_KEY.json')).rows.filter((r) => r.part === 1).sort((a, b) => a.blind_id.localeCompare(b.blind_id));
const inv = new Map(readJson(join(STUDY, 'registers', 'RECORD_INVENTORY_V2.json')).entries.map((e) => [e.source_id, e]));
const c = checker();
c.check('part_1_has_44_records', key.length === 44, key.length);
const recs = key.map((k) => { const e = inv.get(k.source_id); const text = readFileSync(join(ROOT, e.extracted_text_path), 'utf8');
  return { blind_id: k.blind_id, text, text_sha256: sha(text), ok: sha(text) === k.text_sha256 && sha(text) === e.extracted_text_sha256 }; });
c.check('every_text_matches_blind_key_and_inventory', recs.every((r) => r.ok), recs.filter((r) => !r.ok).map((r) => r.blind_id));
const batches = [0, 1, 2, 3].map((i) => ({ id: 'BATCH_0' + (i + 1), records: recs.slice(i * 11, i * 11 + 11) }));
c.check('four_batches_of_11', batches.every((b) => b.records.length === 11));

const manifest = { format: 'jrs-study-completion-review-batches/1.0.0', form_version: FORM_VERSION, ...STATUS, network_attempts: 0,
  statement: 'Part 1 of the human reference (44 records), four batches of 11. Built from the frozen blind key and record texts; nothing filled in; no Engine output or AI label included.', batches: [] };
for (const b of batches) {
  const files = { html: writeOut(join(DIR, 'human-review', 'batches', b.id + '.html'), html(b)), csv: writeOut(join(DIR, 'human-review', 'batches', b.id + '.csv'), csv(b)), md: writeOut(join(DIR, 'human-review', 'batches', b.id + '.md'), md(b)) };
  manifest.batches.push({ batch: b.id, blind_ids: b.records.map((r) => r.blind_id), text_sha256: Object.fromEntries(b.records.map((r) => [r.blind_id, r.text_sha256])), file_sha256: files });
}
// Blinding check: with the record texts removed, no batch file may contain any study source identifier or any
// reference, cohort or construction field name.
const ids = [...inv.keys()];
const leaks = batches.flatMap((b) => [html(b), csv(b), md(b)].flatMap((t) => { let x = t; for (const r of b.records) { x = x.split(esc(r.text)).join('').split(r.text).join('').split(csvCell(r.text)).join(''); }
  return ids.filter((id) => new RegExp('\\b' + id + '\\b').test(x)).concat(/reference_findings|substantive_mock|designed|cohort|partition|UNGROUNDED by|GROUNDED by/.test(x) ? ['field_name'] : []).map((v) => b.id + ':' + v); }));
c.check('no_source_ids_or_labels_in_batches', leaks.length === 0, leaks.slice(0, 5));
manifest.network_attempts = attempts.length;
writeJson(join(DIR, 'human-review', 'BATCH_MANIFEST.json'), manifest);
finish('review batches', c, '4 batches of 11; network attempts ' + attempts.length);
}
