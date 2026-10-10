// JRS local reviewer workspace: page script. LOCAL AND OFFLINE ONLY.
// Builds the page from the packet with textContent only (packet text is never parsed as HTML),
// keeps the session in memory only, and sends nothing anywhere. Errors are shown as codes; packet
// text is never written to an error message or to the console.
import * as C from './core.js';
import { SYNTHETIC_DEMO_PACKET, SYNTHETIC_DEMO_NOTICE } from './demo-packet.js';

const $ = (id) => document.getElementById(id);
const LABELS = {
  CONFIRMED_FOR_FURTHER_REVIEW: 'Confirmed for further review', NOT_CONFIRMED: 'Not confirmed',
  NEEDS_CLARIFICATION: 'Needs clarification', OUT_OF_SCOPE: 'Out of scope', NO_DISPOSITION: 'No disposition yet',
};
let packet = null, session = null;

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined && text !== null) n.textContent = String(text);
  if (cls) n.className = cls;
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function row(dl, term, value) { if (value === undefined) return; dl.appendChild(el('dt', term)); dl.appendChild(el('dd', value === null ? 'not recorded in the packet' : value)); }
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = el('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ---- opening ----------------------------------------------------------------------------------
function refuse(problems) {
  packet = null; session = null;
  $('review').hidden = true;
  const list = $('refusal-list'); clear(list);
  for (const p of problems) list.appendChild(el('li', p));
  $('refusal').hidden = false;
  $('open-status').textContent = 'Refused. See the reasons below.';
  $('refusal-h').setAttribute('tabindex', '-1'); $('refusal-h').focus();
}

function open(candidate, sourceText, label) {
  const v = C.verifyPacket(candidate, sourceText === null ? {} : { sourceText });
  if (!v.ok) return refuse(v.problems);
  packet = candidate;
  session = C.createSession(packet);
  $('refusal').hidden = true;
  render(v);
  $('review').hidden = false;
  $('open-status').textContent = label + ' Opened in memory only. ' + (v.source_text_checked ? 'Quotation anchors were checked against the source text you supplied.' : 'Anchors were checked for consistency; supply the source text to check each quotation against it.');
  $('identity-h').setAttribute('tabindex', '-1'); $('identity-h').focus();
}

async function readText(input) { const f = input.files && input.files[0]; return f ? f.text() : null; }

$('open-btn').addEventListener('click', async () => {
  const raw = await readText($('packet-file'));
  if (raw === null) { $('open-status').textContent = 'Choose a packet file first.'; return; }
  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { return refuse(['packet: the file is not readable JSON']); }
  const source = await readText($('source-file'));
  open(parsed, source, 'Packet checked.');
});
$('demo-open').addEventListener('click', () => open(JSON.parse(JSON.stringify(SYNTHETIC_DEMO_PACKET)), null, 'Synthetic demo packet checked.'));
$('demo-download').addEventListener('click', () => download('SYNTHETIC-demo-reviewer-packet.json', JSON.stringify(SYNTHETIC_DEMO_PACKET, null, 1) + '\n'));

// ---- rendering --------------------------------------------------------------------------------
function render(v) {
  const id = v.identity;
  const dl = $('identity-list'); clear(dl);
  row(dl, 'Candidate version', id.candidate_version);
  row(dl, 'Review ID', id.review_id);
  row(dl, 'Record reference', id.record_ref);
  row(dl, 'Result digest', id.result_digest);
  row(dl, 'Packet ID', id.packet_id);
  row(dl, 'Packet digest (computed here)', id.packet_digest);
  row(dl, 'Prompt', id.prompt_version);
  row(dl, 'Adapter contract', id.adapter_contract);
  row(dl, 'Model identity', id.model);
  row(dl, 'Source hash', id.source_sha256);
  row(dl, 'Generated date', id.generated_date);
  $('identity-limit').textContent = 'These identifiers bind your dispositions to this packet. They show that the packet is intact and internally consistent. They do not authenticate who produced it, and they say nothing about whether a finding is right. ' + packet.status.notice;
  const banner = $('synthetic-banner');
  banner.hidden = !id.synthetic;
  banner.textContent = id.synthetic ? SYNTHETIC_DEMO_NOTICE.replace('SYNTHETIC DEMONSTRATION PACKET.', 'SYNTHETIC packet.') : '';

  $('candidate-desc').textContent = 'Candidate-internal review prompts of the local development candidate, answered by a mocked model. They are not JRS conditions and not Codebook conditions. ' + C.CODEBOOK_NOTICE;
  const sections = { source_preparation: $('list-source'), candidate_prompts: $('list-candidate'), model_output_checks: $('list-checks') };
  for (const n of Object.values(sections)) clear(n);
  renderKeyStatus();
  const all = C.listFindings(packet);
  for (const f of all) sections[f.section].appendChild(findingCard(f));
  for (const [k, n] of Object.entries(sections)) if (!n.firstChild) n.appendChild(el('p', 'No items in this section.', 'desc'));
  renderHuman(all);
  $('signoff-statement').textContent = C.SIGN_OFF_STATEMENT;
  $('export-limit').textContent = C.LIMITATION;
  $('signoff-ack').checked = false; $('signoff-ack').disabled = false;
  $('signoff-status').textContent = '';
  $('export-btn').disabled = true;
  updateSignoff();
}

function renderKeyStatus() {
  const box = $('key-status'); clear(box);
  const keys = packet.model_findings.conditions;
  if (!keys) return;
  box.appendChild(el('h3', 'Candidate review keys as the mocked model answered them', 'small'));
  const dl = el('dl', null, 'meta');
  for (const k of Object.keys(keys)) row(dl, k, 'model status: ' + keys[k].status + (keys[k].note === null ? '; note withheld by the person-inference screen' : '; note: ' + keys[k].note) + '. ' + C.codebookCorrespondenceText(C.TERM_CATEGORY.condition, k));
  box.appendChild(dl);
}

function quotationRows(dl, quotation, anchors) {
  if (quotation === undefined) return;
  dl.appendChild(el('dt', 'Exact quotation'));
  const dd = el('dd'); dd.appendChild(el('blockquote', quotation)); dd.appendChild(el('p', C.QUOTATION_NOTICE, 'note-q')); dl.appendChild(dd);
  const list = (anchors || []).filter(Boolean);
  row(dl, 'Anchor', list.length ? list.map((a) => 'characters ' + a.start + ' to ' + a.end + ' (line ' + a.line + ', column ' + a.column + ')').join('; ') : 'none in the packet');
}

function findingCard(f) {
  const it = f.item, card = el('article', null, 'finding');
  const ex = it.explanation;
  card.appendChild(el('h3', f.id + (ex ? ' · ' + ex.label : '')));
  const dl = el('dl');
  if (f.section === 'source_preparation') {
    row(dl, 'Check', it.code + (it.element ? ' (' + it.element + ')' : ''));
    if (it.detail) row(dl, 'Detail', it.detail);
    quotationRows(dl, it.quotation, it.anchor ? [it.anchor] : []);
    if (it.anchor_note) row(dl, 'Anchor', it.anchor_note);
  } else if (f.section === 'candidate_prompts') {
    if (it.kind === 'flaw') { row(dl, 'Candidate finding type', it.type); quotationRows(dl, it.quotation, it.anchors); }
    else { row(dl, 'Candidate review key', it.condition + ' (model status: ' + it.condition_status + ')'); row(dl, 'Anchor', it.anchor_note); }
    row(dl, 'Model note', it.model_note === null ? 'withheld: the model described a person, not the record' : it.model_note);
    if (it.uncertain) row(dl, 'Model uncertainty', 'The mocked model marked this finding uncertain.');
  } else {
    row(dl, 'Check', it.code + (it.field ? ' on ' + it.field : ''));
    if (it.groups) row(dl, 'Withheld groups', it.groups.join(', '));
    if (it.rejection_codes) row(dl, 'Rejection codes', it.rejection_codes.join(', '));
  }
  if (ex) {
    row(dl, 'What it means', ex.meaning);
    if (ex.look_for) row(dl, 'Look for', ex.look_for);
    row(dl, 'Reviewer question', ex.reviewer_question);
    row(dl, 'Candidate-internal category', ex.category === null ? 'none (unmapped)' : ex.category);
  }
  row(dl, 'Codebook', C.codebookTextFor(f));
  const d = it.disposition;
  row(dl, 'Disposition history in the packet', d.status + '; ' + (d.history.length ? d.history.length + ' earlier entr' + (d.history.length === 1 ? 'y' : 'ies') + ': ' + d.history.map((h) => h.disposition || h.status || 'entry').join(', ') : 'no earlier entries'));
  card.appendChild(dl);
  return card;
}

// ---- human review -------------------------------------------------------------------------------
function renderHuman(all) {
  const box = $('disposition-list'); clear(box);
  $('reviewer-ref').value = ''; $('review-date').value = '';
  $('reviewer-ref').disabled = false; $('review-date').disabled = false;
  const short = session.identity.packet_digest.slice(0, 16);
  for (const f of all) {
    const fs = el('fieldset'); fs.appendChild(el('legend', f.id + ' · ' + C.SECTIONS[f.section]));
    const sid = 'disp-' + f.id, nid = 'note-' + f.id, aid = 'ack-' + f.id;
    const l1 = el('label', 'Disposition'); l1.htmlFor = sid;
    const sel = el('select'); sel.id = sid;
    for (const v of C.DISPOSITIONS) { const o = el('option', LABELS[v]); o.value = v; sel.appendChild(o); }
    sel.value = 'NO_DISPOSITION';
    const l2 = el('label', 'Reviewer note (optional)'); l2.htmlFor = nid;
    const note = el('textarea'); note.id = nid; note.maxLength = 2000;
    const ackWrap = el('div', null, 'field check');
    const ack = el('input'); ack.type = 'checkbox'; ack.id = aid;
    const l3 = el('label', 'This disposition applies only to packet ' + session.identity.review_id + ' (digest ' + short + '…).'); l3.htmlFor = aid;
    ackWrap.appendChild(ack); ackWrap.appendChild(l3);
    const status = el('p', 'Recorded: ' + LABELS.NO_DISPOSITION, 'recorded'); status.setAttribute('aria-live', 'polite');
    const err = el('p', '', 'error'); err.setAttribute('role', 'alert');
    const apply = () => {
      err.textContent = '';
      try {
        C.setDisposition(session, { finding_id: f.id, review_id: session.identity.review_id, packet_digest: session.identity.packet_digest, disposition: sel.value, note: note.value, acknowledged: ack.checked });
      } catch (e) {
        err.textContent = /acknowledgement_required/.test(e.message) ? 'Tick the acknowledgement to record this disposition.' : 'Not recorded (' + e.message.split(':')[0] + ').';
      }
      status.textContent = 'Recorded: ' + LABELS[session.dispositions[f.id].disposition];
      updateSignoff();
    };
    sel.addEventListener('change', apply); ack.addEventListener('change', apply); note.addEventListener('input', apply);
    for (const n of [l1, sel, l2, note, ackWrap, status, err]) fs.appendChild(n);
    box.appendChild(fs);
  }
}

function reviewerChanged() { if (session && !session.signed_off) { C.setReviewer(session, $('reviewer-ref').value, $('review-date').value.trim()); updateSignoff(); } }
$('reviewer-ref').addEventListener('input', reviewerChanged);
$('review-date').addEventListener('input', reviewerChanged);
$('signoff-ack').addEventListener('change', updateSignoff);

function updateSignoff() {
  if (!session) return;
  const list = $('blockers'); clear(list);
  const blockers = C.signOffBlockers(session);
  if (!$('signoff-ack').checked && !session.signed_off) blockers.push('Tick the sign-off confirmation.');
  for (const b of blockers) list.appendChild(el('li', b));
  if (!blockers.length) list.appendChild(el('li', session.signed_off ? 'Signed off.' : 'Nothing. Sign-off is available.'));
  $('signoff-btn').disabled = session.signed_off || blockers.length > 0;
}

$('signoff-btn').addEventListener('click', () => {
  try { C.signOff(session, $('signoff-ack').checked); }
  catch (e) { $('signoff-status').textContent = 'Sign-off refused (' + e.message.split(':')[0] + ').'; return; }
  for (const n of document.querySelectorAll('#human select, #human textarea, #human input, #signoff-ack')) n.disabled = true;
  $('export-btn').disabled = false;
  $('signoff-status').textContent = 'Signed off in this window. Export the record now; it is not kept anywhere else.';
  updateSignoff();
});

$('export-btn').addEventListener('click', () => {
  try {
    const record = C.buildExport(session);
    download('disposition-record_' + record.packet.review_id + '_' + record.packet.packet_digest.slice(0, 12) + '.json', JSON.stringify(record, null, 1) + '\n');
    $('signoff-status').textContent = 'Exported. Verify it later with tools/local-reviewer-workspace/verify-export.mjs.';
  } catch (e) { $('signoff-status').textContent = 'Export refused (' + e.message.split(':')[0] + ').'; }
});

$('version').textContent = C.WORKSPACE_VERSION;
