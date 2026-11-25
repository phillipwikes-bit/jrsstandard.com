// "Check a record from its documents" page (2026-11-24). Runs entirely in the
// browser: extraction, review and advisory checks are the same modules the
// command line uses, so the page and the demo give identical results.
import { extractRecord } from '../extract.mjs';
import { openReview, deriveState } from '../index.mjs';
import { runDetectionTemplates } from '../detection-templates.mjs';
import { docxToText, browserInflateRaw } from '../docx.mjs';
import { findOmissions, findDroppedAnchors } from '../omissions.mjs';
import { euAiActLens } from '../eu-ai-act.mjs';
import { buildSafeguards } from '../cognitive-safeguards.mjs';
import { buildCognitiveObservations } from '../cognitive-observations.mjs';

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

// A fictional AI authorization record for the EU AI Act lens (not used in any evaluation set).
const EXAMPLE_EU = {
  title: 'AI authorization AA-310 (fictional)', cls: 'ai_action_authorization',
  text: "On 2026-10-06, Lena Okafor, head of talent acquisition, authorized the screening assistant to shortlist job applications for the graduate programme. The assistant is high-risk under Annex III. It is used in line with the provider's instructions for use, version 2. A recruiter reviews each shortlist and can override it. Logs are kept for four months. Applicants are told in the job advert that an AI system assists the shortlisting.",
  docs: [
    { title: 'Authorization AA-310', version: 'v1', text: 'On 2026-10-06, Lena Okafor authorized the screening assistant to shortlist job applications for the graduate programme. The assistant is high-risk under Annex III.' },
    { title: 'Operating procedure OP-310', version: 'v1', text: 'A recruiter reviews each shortlist and can override it. Logs are kept for four months.' },
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
  if (result.omissions.length) {
    out.append(el('h2', {}, 'Left out of the record (advisory)'));
    const ul = el('ul', { id: 'omissions' });
    for (const o of result.omissions) ul.append(el('li', { class: 'sev-review' }, o.question));
    out.append(ul);
  }
  if (result.dropped && result.dropped.length) {
    out.append(el('h2', {}, 'Dates and speakers the documents give but the record never mentions (advisory)'));
    const ul = el('ul', { id: 'dropped-anchors' });
    for (const o of result.dropped) ul.append(el('li', { class: 'sev-review' }, o.question));
    out.append(ul);
  }
  if (report.record_notes && report.record_notes.length) {
    out.append(el('h2', {}, 'Notes about the record itself (not checked against the documents)'));
    const ul = el('ul', { id: 'record-notes' });
    for (const n of report.record_notes) ul.append(el('li', {}, n));
    out.append(ul);
  }
  // Cognitive controls: reasoning risks the record shows, each with one neutral question. Read-only.
  const cog = result.cog;
  if (cog && (cog.lenses.length || cog.observations.length)) {
    const sec = el('div', { id: 'cognitive' });
    sec.append(el('h2', {}, 'Reasoning checks (cognitive controls)'),
      el('p', { class: 'muted' }, 'Points where the reasoning in the record needs a second look. Each asks one neutral question. They never change the result and say nothing about any person.'));
    const ul = el('ul');
    const seen = new Set();
    for (const o of cog.observations) {
      const k = `${o.kind}|${o.claim_id}`; if (seen.has(k)) continue; seen.add(k);
      ul.append(el('li', { 'data-cog': o.kind }, el('b', {}, `${o.claim_id || 'Record'} · ${o.kind.replace(/_/g, ' ')}: `), o.question));
    }
    for (const l of cog.lenses) {
      const k = `${l.lens}|${l.claim_id}`; if (seen.has(k)) continue; seen.add(k);
      const esc = cog.controls.some((c) => c.escalate && c.claim_id === l.claim_id);
      ul.append(el('li', { 'data-cog': l.lens }, el('b', {}, `${l.claim_id || 'Record'} · ${l.title}: `), l.question, esc ? el('span', { class: 'confirm' }, ' Refer to an authorised reviewer.') : ''));
    }
    sec.append(ul);
    out.append(sec);
  }
  const eu = result.eu;
  if (eu && eu.applicable) {
    const LABEL = { SHOWN_SUPPORTED: 'Shown and backed by a document', STATED_UNSUPPORTED: 'Stated, but no document backs it', NOT_SHOWN: 'Not shown', NOT_APPLICABLE: 'Not applicable' };
    const CLS = { SHOWN_SUPPORTED: 's-READY_FOR_HUMAN_FINALIZATION', STATED_UNSUPPORTED: 's-REVIEW_REQUIRED', NOT_SHOWN: 's-HOLD', NOT_APPLICABLE: 'muted' };
    const sec = el('div', { id: 'eu-ai-act' });
    sec.append(el('h2', {}, 'EU AI Act: what this record shows'),
      el('p', { class: 'muted' }, eu.notice),
      el('p', {}, `${eu.summary.shown_supported} shown and backed, ${eu.summary.stated_unsupported} stated without backing, ${eu.summary.not_shown} not shown, ${eu.summary.not_applicable} not applicable.`));
    for (const c of eu.checks) {
      const row = el('div', { class: 'claim', 'data-eu': c.id });
      row.append(el('div', {}, el('span', { class: 'tag' }, c.article), el('span', { class: `status ${CLS[c.status]}` }, LABEL[c.status]), c.flag === 'below_six_months' ? el('span', { class: 'confirm' }, ` Stated period is under six months (${Math.round(c.retention_months * 10) / 10}).`) : ''));
      row.append(el('div', { class: 'muted' }, c.requirement));
      if (c.record_sentence) row.append(el('div', {}, 'Record: ', el('q', {}, c.record_sentence)));
      if (c.source) row.append(el('div', { class: 'muted' }, `Backed by ${c.source.title}: `, el('q', {}, c.source.sentence)));
      if (c.status === 'NOT_SHOWN' || c.status === 'STATED_UNSUPPORTED') row.append(el('div', { class: 'confirm' }, `Ask: ${c.question}`));
      sec.append(row);
    }
    out.append(sec);
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
  const full = { generated_at: new Date().toISOString(), record_id: record.record_id, record_digest: record.record_digest, status: state.status,
    findings: state.findings.map((f) => ({ claim_id: f.claim_id, code: f.code, severity: f.severity, explanation: f.explanation, question: f.question })),
    advisories, omissions: result.omissions, dropped_dates_and_speakers: result.dropped || [], record_notes: report.record_notes || [], reasoning_checks: result.cog, eu_ai_act: result.eu, extraction: report };
  const blob2 = new Blob([JSON.stringify(full, null, 2) + '\n'], { type: 'application/json' });
  out.append(el('p', {}, el('a', { href: URL.createObjectURL(blob2), download: `${record.record_id}-results.json`, id: 'download-results' }, 'Download all results'), el('span', { class: 'muted' }, ' (findings, reasoning checks, left-out points and EU AI Act checks).')));
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
  render({ record, report, state, advisories: runDetectionTemplates(state).filter((h) => !h.changes_review_status), omissions: findOmissions(record), dropped: findDroppedAnchors(record), eu: euAiActLens(record),
    cog: { ...buildSafeguards(state), observations: buildCognitiveObservations(state) } });
}

$('rec-file').addEventListener('change', () => loadFile($('rec-file'), $('rec-text'), null));
$('add-doc').addEventListener('click', () => addDoc());
$('example').addEventListener('click', () => {
  $('rec-title').value = EXAMPLE.title; $('rec-class').value = EXAMPLE.cls; $('rec-text').value = EXAMPLE.text;
  $('docs').replaceChildren(); docCount = 0; for (const d of EXAMPLE.docs) addDoc(d);
  $('fictional').checked = true;
});
$('example-eu').addEventListener('click', () => {
  $('rec-title').value = EXAMPLE_EU.title; $('rec-class').value = EXAMPLE_EU.cls; $('rec-text').value = EXAMPLE_EU.text;
  $('docs').replaceChildren(); docCount = 0; for (const d of EXAMPLE_EU.docs) addDoc(d);
  $('fictional').checked = true;
});
$('run').addEventListener('click', run);
addDoc();
