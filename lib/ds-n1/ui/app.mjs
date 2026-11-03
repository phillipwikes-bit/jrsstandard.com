// DS-N1 reviewer interface. All record and source text is rendered with
// textContent, never innerHTML. No storage, no analytics, no external calls.
import {
  openReview, applyAction, deriveState, buildExport, serializeExport, buildReport, renderReportHtml,
  verifyExport, resumeReview, STATUS, READY_MEANING,
} from '../index.mjs';
import { codePoints } from '../text.mjs';

const $ = (id) => document.getElementById(id);
const ui = { session: null, state: null, sel: null, focus: null };

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k.nodeType ? k : String(k));
  return n;
}
const msg = (t) => { $('msg').textContent = t || ''; };
const now = () => new Date().toISOString();
function reviewer() { return { reviewer_id: $('rid').value.trim(), name: $('rname').value.trim() }; }

function act(action) {
  msg('');
  try {
    ui.session = applyAction(ui.session, { at: now(), reviewer: reviewer(), ...action });
    refresh();
  } catch (e) { msg(e.detail ? `${e.code}: ${e.detail}` : String(e.message || e)); }
}

function load(session) { ui.session = session; ui.sel = null; ui.focus = null; refresh(); }

function refresh() {
  ui.state = deriveState(ui.session);
  const st = ui.state;
  const box = $('statusbox');
  box.textContent = st.status + (st.ready_by_override_of_critical ? ' · ONLY BY CRITICAL OVERRIDE' : '');
  box.className = 'status s-' + st.status + (st.ready_by_override_of_critical ? ' s-override' : '');
  renderRecord(); renderEvidence(); renderFindings(); renderSummary();
}

function sevClass(fs) {
  const open = fs.filter((f) => ['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED'].includes(f.status));
  return open.some((f) => f.severity === 'critical') ? 'crit' : open.length ? 'rev' : '';
}

function renderRecord() {
  const box = $('record'); box.replaceChildren();
  const st = ui.state;
  if (!st.record) { box.append(el('p', { class: 'err' }, st.reasons.join(' '))); return; }
  const cps = codePoints(st.record.text);
  const spans = [];
  for (const c of st.claims) if (c.record_span) spans.push({ ...c.record_span, key: 'claim:' + c.claim_id, label: `Claim ${c.claim_id}`, cls: sevClass(st.findings.filter((f) => f.claim_id === c.claim_id && f.status !== 'SUPERSEDED')) });
  for (const f of st.findings) if (!f.claim_id && f.record_span && f.status !== 'SUPERSEDED') spans.push({ ...f.record_span, key: 'finding:' + f.finding_id, label: `Unmapped passage ${f.code}`, cls: sevClass([f]) });
  spans.sort((a, b) => a.start - b.start);
  let pos = 0;
  for (const s of spans) {
    if (s.start < pos) continue;
    box.append(cps.slice(pos, s.start).join(''));
    const m = el('mark', { class: [s.cls, ui.sel === s.key ? 'sel' : ''].join(' ').trim(), tabindex: '0', role: 'button', 'aria-label': s.label, 'aria-pressed': ui.sel === s.key ? 'true' : 'false' }, cps.slice(s.start, s.end).join(''));
    const choose = () => { ui.sel = s.key; ui.focus = s.key.startsWith('finding:') ? s.key.slice(8) : null; refresh(); };
    m.addEventListener('click', choose);
    m.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
    box.append(m);
    pos = s.end;
  }
  box.append(cps.slice(pos).join(''));
}

function selectedClaim() {
  if (!ui.sel || !ui.sel.startsWith('claim:')) return null;
  return ui.state.claims.find((c) => c.claim_id === ui.sel.slice(6)) || null;
}

function renderEvidence() {
  const box = $('evidence'); box.replaceChildren();
  const st = ui.state; const c = selectedClaim();
  if (!st.record) return;
  if (!c) {
    box.append(el('p', { class: 'muted' }, 'Select a claim to see its evidence.'));
    box.append(el('p', { class: 'lbl' }, 'Source inventory'), el('ul', {}, st.record.sources.map((s) => el('li', {}, `${s.source_id}: ${s.title} (version ${s.version})`))));
    return;
  }
  box.append(el('p', {}, el('span', { class: 'lbl' }, `${c.claim_id} · ${c.kind} · ${c.support}`)));
  box.append(el('p', {}, c.text));
  if (c.text !== c.original_text) box.append(el('p', { class: 'muted' }, 'Original: ' + c.original_text));
  if (c.reasoning) box.append(el('p', {}, el('span', { class: 'lbl' }, 'Reasoning '), c.reasoning));
  box.append(el('p', { class: 'muted' }, `Sufficiency: ${c.sufficiency}`));
  if (!c.citations.length) box.append(el('p', { class: 'muted' }, 'No sources cited.'));
  for (const a of c.citations) {
    const src = st.record.sources.find((s) => s.source_id === a.source_id);
    const head = el('p', { class: 'lbl' }, `${a.source_id}${src ? ' · ' + src.title + ' · version ' + src.version : ' · NOT IN INVENTORY'} · quote ${a.quote_match} · ${a.relevance}`);
    box.append(head);
    if (a.source_sentence && a.source_span) {
      const sent = codePoints(a.source_sentence.text);
      const qs = a.source_span.start - a.source_sentence.start, qe = a.source_span.end - a.source_sentence.start;
      box.append(el('div', { class: 'src' }, sent.slice(0, qs).join(''), el('b', {}, sent.slice(qs, qe).join('')), sent.slice(qe).join('')));
    } else box.append(el('div', { class: 'src' }, `Cited: "${a.quote}"`));
  }
  // Correct: attach, revise, reasoning.
  const srcSel = el('select', { id: 'att-src', 'aria-label': 'Source to attach' }, st.record.sources.map((s) => el('option', { value: s.source_id }, `${s.source_id}: ${s.title}`)));
  const quote = el('input', { id: 'att-quote', 'aria-label': 'Exact passage from the source', placeholder: 'exact passage from the source' });
  box.append(el('p', { class: 'lbl' }, 'Attach a supporting source'), el('div', { class: 'row' }, srcSel, quote,
    el('button', { type: 'button', onclick: () => act({ type: 'attach_citation', claim_id: c.claim_id, source_id: srcSel.value, quote: quote.value }) }, 'Attach')));
  const rev = el('textarea', { id: 'rev-text', 'aria-label': 'Revised claim text' }); rev.value = c.text;
  const mode = el('select', { id: 'rev-mode', 'aria-label': 'Revision type' }, el('option', { value: 'revise' }, 'Revise from documented information'), el('option', { value: 'qualify' }, 'Qualify the statement'));
  box.append(el('p', { class: 'lbl' }, 'Revise or qualify'), rev, el('div', { class: 'row' }, mode,
    el('button', { type: 'button', onclick: () => act({ type: 'revise_claim', claim_id: c.claim_id, mode: mode.value, text: rev.value }) }, 'Record revision')));
  const rs = el('textarea', { id: 'rsn-text', 'aria-label': 'Documented reasoning' });
  box.append(el('p', { class: 'lbl' }, 'State the documented reasoning'), el('p', { class: 'guided-only muted' }, 'Refer to claim IDs (for example C2) that the reasoning relies on.'), rs,
    el('div', { class: 'row' }, el('button', { type: 'button', onclick: () => act({ type: 'add_reasoning', claim_id: c.claim_id, reasoning: rs.value }) }, 'Record reasoning')));
}

const ACTIONS = [
  ['override', 'Decline with reasoned override', 'Your rationale (recorded verbatim)'],
  ['request_evidence', 'Request missing evidence', 'Evidence requested'],
  ['record_limitation', 'Record a limitation', 'Limitation'],
  ['escalate', 'Escalate', 'Reason for escalation'],
  ['leave_pending', 'Leave pending', 'Note (optional)'],
];

function findingCard(f) {
  const card = el('div', { class: 'finding', 'aria-current': ui.focus === f.finding_id ? 'true' : 'false', id: 'card-' + f.finding_id });
  card.append(el('p', { class: 'lbl' }, el('span', { class: 'sev-' + f.severity }, f.severity.toUpperCase()), ` · ${f.condition} ${f.condition_name} · ${f.code} · ${f.status}`));
  card.append(el('p', { class: 'q' }, f.question));
  card.append(el('p', { class: 'expl' }, f.explanation));
  for (const a of f.actions) card.append(el('p', { class: 'muted' }, `${a.at} ${a.reviewer.name}: ${a.type}${a.rationale ? ': ' + a.rationale : ''}${a.request ? ': ' + a.request : ''}${a.limitation ? ': ' + a.limitation : ''}${a.reason ? ': ' + a.reason : ''}${a.note ? ': ' + a.note : ''}`));
  // SP-18: feedback about the finding itself. Separate from the decision
  // actions below; it never changes the finding or the review status.
  for (const fb of f.feedback || []) card.append(el('p', { class: 'muted' }, `${fb.at} ${fb.reviewer.name}: finding marked ${fb.usefulness}${fb.reason ? ' (' + fb.reason + ')' : ''}`));
  const fbReason = el('input', { 'aria-label': 'Why (required unless useful) for ' + f.code, placeholder: 'why (required unless useful)' });
  const fbGo = (usefulness) => { ui.focus = f.finding_id; act({ type: 'finding_feedback', finding_id: f.finding_id, usefulness, ...(fbReason.value.trim() ? { reason: fbReason.value } : {}) }); };
  card.append(el('div', { class: 'row fb', role: 'group', 'aria-label': 'Feedback on this finding (does not change the review)' },
    el('span', { class: 'lbl' }, 'Was this finding useful?'),
    el('button', { type: 'button', onclick: () => fbGo('useful') }, 'Useful'),
    el('button', { type: 'button', onclick: () => fbGo('not_useful') }, 'Not useful'),
    el('button', { type: 'button', onclick: () => fbGo('wrong') }, 'Wrong'),
    fbReason));
  if (f.status === 'SUPERSEDED') return card;
  const kind = el('select', { 'aria-label': 'Action for ' + f.code }, ACTIONS.map(([v, l]) => el('option', { value: v }, l)));
  const text = el('textarea', { 'aria-label': 'Action text for ' + f.code });
  const to = el('input', { 'aria-label': 'Escalate to (role)', placeholder: 'escalate to (role)' });
  const go = () => {
    const t = kind.value, v = text.value;
    const a = { type: t, finding_id: f.finding_id };
    if (t === 'override') a.rationale = v; if (t === 'request_evidence') a.request = v; if (t === 'record_limitation') a.limitation = v;
    if (t === 'escalate') { a.reason = v; a.to = to.value; } if (t === 'leave_pending' && v.trim()) a.note = v;
    ui.focus = f.finding_id; act(a);
  };
  card.append(el('div', { class: 'row' }, kind, to), text, el('div', { class: 'row' }, el('button', { type: 'button', onclick: go }, 'Record action')));
  return card;
}

function renderFindings() {
  const box = $('findings'); box.replaceChildren();
  const st = ui.state; if (!st.record) return;
  const c = selectedClaim();
  let list;
  if (c) list = st.findings.filter((f) => f.claim_id === c.claim_id);
  else if (ui.focus) list = st.findings.filter((f) => f.finding_id === ui.focus);
  else { box.append(el('p', { class: 'muted' }, 'Select a claim or an unresolved item in the summary.')); return; }
  list.sort((a, b) => (a.status === 'SUPERSEDED') - (b.status === 'SUPERSEDED'));
  if (!list.length) box.append(el('p', { class: 'muted' }, 'DS-N1 raised no finding for this claim. That is not a judgment of sufficiency.'));
  for (const f of list) box.append(findingCard(f));
}

function renderSummary() {
  const box = $('sumbody'); box.replaceChildren();
  const st = ui.state;
  box.append(el('p', {}, el('span', { class: 'status s-' + st.status }, st.status), ' ', st.reasons.join(' ')));
  if (st.status === STATUS.READY) box.append(el('p', { class: 'muted' }, READY_MEANING));
  if (!st.record) return;
  const counts = {};
  for (const f of st.findings) counts[f.status] = (counts[f.status] || 0) + 1;
  box.append(el('p', { class: 'muted' }, Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'No findings.'));
  const open = st.findings.filter((f) => ['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED'].includes(f.status));
  if (open.length) box.append(el('p', { class: 'lbl' }, 'Outstanding'), el('ul', {}, open.map((f) => el('li', {}, el('button', { type: 'button', onclick: () => { ui.sel = f.claim_id ? 'claim:' + f.claim_id : 'finding:' + f.finding_id; ui.focus = f.finding_id; refresh(); const n = $('card-' + f.finding_id); if (n) n.scrollIntoView({ block: 'nearest' }); } }, `${f.claim_id || 'record'} · ${f.code} · ${f.status}`)))));
  if (st.overrides_of_critical && st.overrides_of_critical.length) box.append(el('p', { class: 'sev-critical' }, `${st.overrides_of_critical.length} critical finding(s) overridden by a reviewer.`));
  const fd = st.final_disposition;
  box.append(el('p', {}, 'Final disposition: ', fd ? `${fd.disposition} by ${fd.reviewer.name} at ${fd.at}${fd.stale ? ' (STALE: later actions recorded)' : ''}` : 'not recorded'));
  const disp = el('select', { 'aria-label': 'Final disposition' }, el('option', { value: 'accepted_for_finalization' }, 'Accept for finalisation'), el('option', { value: 'returned_to_author' }, 'Return to author'));
  const note = el('input', { 'aria-label': 'Disposition note', placeholder: 'note (required)' });
  const ack = st.ready_by_override_of_critical ? el('input', { type: 'checkbox', id: 'ack-override' }) : null;
  if (ack) box.append(el('p', { class: 'sev-critical' }, el('label', { for: 'ack-override' }, ack, ` I acknowledge this record is READY only because ${st.overrides_of_critical.length} critical finding(s) were overridden, and that overrides are not evidence.`)));
  box.append(el('div', { class: 'row' }, disp, note, el('button', { type: 'button', onclick: () => act({ type: 'final_disposition', disposition: disp.value, note: note.value, ...(ack ? { acknowledge_critical_overrides: ack.checked } : {}) }) }, 'Record final disposition')));
}

function download(name, type, text) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('exp-json').addEventListener('click', () => {
  if (!ui.session) return;
  download(`${ui.state.record ? ui.state.record.record_id : 'record'}-ds-n1-export.json`, 'application/json', serializeExport(buildExport(ui.session, { generated_at: now() })));
});
$('exp-html').addEventListener('click', () => {
  if (!ui.session) return;
  download(`${ui.state.record ? ui.state.record.record_id : 'record'}-ds-n1-report.html`, 'text/html', renderReportHtml(buildReport(ui.session, { generated_at: now() })));
});
$('mode').addEventListener('change', (e) => { document.body.classList.toggle('pro', e.target.value === 'pro'); });

async function loadFixture(id) {
  msg('');
  try {
    const r = await fetch(`/fixtures/${encodeURIComponent(id)}.json`);
    if (!r.ok) throw new Error(`fixture ${id} could not be loaded (${r.status})`);
    load(openReview(await r.json(), { at: now() }));
  } catch (e) { msg(String(e.message || e)); }
}
$('fixture').addEventListener('change', (e) => loadFixture(e.target.value));
$('upload').addEventListener('change', async (e) => {
  msg('');
  const file = e.target.files && e.target.files[0]; if (!file) return;
  try {
    if (file.size > 5_000_000) throw new Error('File too large for DS-N1 (5 MB limit).');
    const data = JSON.parse(await file.text());
    if (data && data.schema === 'ds-n1.export/1.0') {
      const v = verifyExport(data);
      if (v.verdict !== 'VERIFIED_INTERNALLY_CONSISTENT') throw new Error(`Export not resumed: ${v.verdict}. ${v.meaning}`);
      load(resumeReview(data.record, data.events));
    } else load(openReview(data, { at: now() }));
  } catch (err) { msg(String(err.message || err)); }
});

(async () => {
  try {
    const r = await fetch('/fixtures/MANIFEST.json');
    const m = await r.json();
    for (const f of m.fixtures) $('fixture').append(el('option', { value: f.id }, `${f.id}: ${f.mutation}`));
    await loadFixture(m.fixtures[0].id);
  } catch (e) { msg('Fixture list unavailable: ' + (e.message || e)); }
})();
