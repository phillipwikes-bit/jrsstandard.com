// "Check a record from its documents" page (2026-11-24). Runs entirely in the
// browser: extraction, review and advisory checks are the same modules the
// command line uses, so the page and the demo give identical results.
import { extractRecord } from '../extract.mjs';
import { openReview, deriveState } from '../index.mjs';
import { runDetectionTemplates } from '../detection-templates.mjs';
import { docxToText, browserInflateRaw } from '../docx.mjs';

const $ = (id) => document.getElementById(id);
const AT = () => new Date().toISOString();

// The fictional demonstration case, the same text as lib/ds-n1/demo/case-harbourline.
const EXAMPLE = {
  title: 'Supplier access exception SAX-731 (fictional)', cls: 'supplier_access_exception',
  text: "On 2026-07-14, Ines Calloway, information security manager, approved Harbourline Data's request for read access to the customer analytics warehouse. The access is limited to the analytics warehouse for sixty days. Harbourline Data completed the supplier security assessment SSA-40 on 2026-07-09. Session logging is required for every connection. The supplier holds a current external certification. Because the assessment was completed and the access is limited in scope and time, the exception can proceed to finalisation.",
  docs: [
    { title: 'Access request AR-731', version: 'v1', text: 'Access request AR-731. On 2026-07-02, Harbourline Data requested read access to the customer analytics warehouse for a reporting project. Session logging is recommended for supplier connections.' },
    { title: 'Supplier security assessment SSA-40', version: 'v2', text: 'Supplier security assessment SSA-40. Harbourline Data completed the supplier security assessment on 2026-07-09, with two medium findings open. The assessment was submitted for approval on 2026-07-10.' },
    { title: 'Exception approval EA-731', version: 'v1', text: 'Exception approval EA-731. On 2026-07-14, Ines Calloway approved read access for Harbourline Data. The access is limited to the analytics warehouse for sixty days.' },
  ],
};

let docCount = 0;

// Fills a textarea from a chosen .docx or .txt file; PDF and anything else is
// refused with a plain message. The file is read in the browser only.
async function loadFile(input, target, titleInput) {
  const f = input.files && input.files[0];
  if (!f) return;
  $('msg').textContent = '';
  try {
    const name = f.name.toLowerCase();
    if (name.endsWith('.docx')) target.value = await docxToText(await f.arrayBuffer(), browserInflateRaw);
    else if (name.endsWith('.txt')) target.value = (await f.text()).trim();
    else throw new Error(name.endsWith('.pdf') ? 'PDF files cannot be read yet; save the PDF as text or Word first.' : 'Only Word (.docx) and text (.txt) files can be opened.');
    if (titleInput && !titleInput.value) titleInput.value = f.name.replace(/\.(docx|txt)$/i, '');
  } catch (e) {
    $('msg').textContent = `${f.name}: ${e.message}`;
  }
}

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else e.setAttribute(k, v); }
  for (const k of kids) e.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return e;
}

function addDoc(d = {}) {
  const n = ++docCount;
  const box = el('div', { class: 'doc', 'data-doc': String(n) });
  const tId = `doc-title-${n}`, vId = `doc-ver-${n}`, xId = `doc-text-${n}`;
  const title = el('input', { type: 'text', id: tId }); title.value = d.title || '';
  const ver = el('input', { type: 'text', id: vId, size: '6' }); ver.value = d.version || 'v1';
  const text = el('textarea', { id: xId, rows: '4' }); text.value = d.text || '';
  const fId = `doc-file-${n}`;
  const file = el('input', { type: 'file', id: fId, accept: '.docx,.txt,text/plain' });
  file.addEventListener('change', () => loadFile(file, text, title));
  const rm = el('button', { type: 'button' }, 'Remove');
  rm.addEventListener('click', () => box.remove());
  box.append(el('label', { for: tId }, `Document ${n} title`), title,
    el('label', { for: vId }, 'Version'), ver,
    el('label', { for: xId }, 'Text'), text,
    el('label', { for: fId }, 'Or open a Word (.docx) or text file'), file, el('div', { class: 'row' }, rm));
  $('docs').append(box);
}

function readForm() {
  const docs = [...document.querySelectorAll('[data-doc]')].map((b) => ({
    title: b.querySelector('input[id^="doc-title"]').value.trim(),
    version: b.querySelector('input[id^="doc-ver"]').value.trim() || 'v1',
    text: b.querySelector('textarea').value.trim(),
  })).filter((d) => d.text);
  return { title: $('rec-title').value.trim(), record_class: $('rec-class').value, text: $('rec-text').value.trim(), sources: docs };
}

function render(result) {
  const out = $('out'); out.replaceChildren();
  const { record, report, state, advisories } = result;
  const s = report.summary;
  out.append(el('p', {}, el('span', { class: `status s-${state.status}` }, state.status.replace(/_/g, ' '))));
  out.append(el('p', { class: 'muted' }, `Found ${s.claims} claims; ${s.cited} linked to a supporting passage (${s.explicit_citations} named in the record). ${s.to_confirm} have a detail you should confirm.`));
  if (state.findings.length) {
    out.append(el('h2', {}, 'What a later reviewer could not rely on'));
    const ul = el('ul');
    for (const f of state.findings) ul.append(el('li', { class: `sev-${f.severity}` }, `${f.claim_id || 'Record'}: ${f.explanation}`, f.question ? el('div', { class: 'muted' }, `Ask: ${f.question}`) : ''));
    out.append(ul);
  }
  if (advisories.length) {
    out.append(el('h2', {}, 'Advisory notes (do not change the result)'));
    const ul = el('ul');
    for (const h of advisories) ul.append(el('li', { class: 'sev-advisory' }, `${h.claim_id || 'Record'}: ${h.detail || h.template.replace(/_/g, ' ')}`));
    out.append(ul);
  }
  out.append(el('h2', {}, 'Claims found'));
  for (const c of report.claims) {
    const div = el('div', { class: 'claim' });
    div.append(el('div', {}, el('span', { class: 'tag' }, c.claim_id), el('span', { class: 'tag' }, c.kind), el('q', {}, c.quote)));
    if (c.citation) div.append(el('div', { class: 'muted' }, `Supported by ${c.citation.title} (${c.citation.basis === 'explicit' ? 'named in the record' : 'found by matching'})`));
    else if (c.kind !== 'conclusion') div.append(el('div', { class: 'err' }, 'No supporting passage found in the documents.'));
    if (c.needs_confirmation.length) div.append(el('div', { class: 'confirm' }, `Please confirm: ${c.needs_confirmation.join(', ')}`));
    out.append(div);
  }
  const blob = new Blob([JSON.stringify(record, null, 2) + '\n'], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `${record.record_id}.json`, id: 'download' }, 'Download the record package');
  out.append(el('p', {}, a, el('span', { class: 'muted' }, ' and open it in the reviewer for a step-by-step review.')));
}

function run() {
  $('msg').textContent = '';
  if (!$('fictional').checked) { $('msg').textContent = 'Please confirm the records are fictional.'; return; }
  const input = readForm();
  if (!input.text) { $('msg').textContent = 'Please paste the record text.'; return; }
  if (!input.sources.length) { $('msg').textContent = 'Please add at least one document.'; return; }
  const id = (input.title.match(/[A-Z]+-\d+/) || ['RECORD-1'])[0];
  const { record, report, validation } = extractRecord({ ...input, record_id: id });
  if (validation.errors && validation.errors.length) { $('msg').textContent = 'Not checked: ' + validation.errors.map((e) => e.detail).join(' '); $('out').replaceChildren(); return; }
  const state = deriveState(openReview(record, { at: AT() }));
  render({ record, report, state, advisories: runDetectionTemplates(state).filter((h) => !h.changes_review_status) });
}

$('rec-file').addEventListener('change', () => loadFile($('rec-file'), $('rec-text'), null));
$('add-doc').addEventListener('click', () => addDoc());
$('example').addEventListener('click', () => {
  $('rec-title').value = EXAMPLE.title; $('rec-class').value = EXAMPLE.cls; $('rec-text').value = EXAMPLE.text;
  $('docs').replaceChildren(); docCount = 0; for (const d of EXAMPLE.docs) addDoc(d);
  $('fictional').checked = true;
});
$('run').addEventListener('click', run);
addDoc();
