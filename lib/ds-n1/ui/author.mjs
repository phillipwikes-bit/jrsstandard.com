// DS-N1 record authoring. Builds a ds-n1.record/1.0 package from text the
// user types and selections they make. Uses the engine's own validation and
// review status for live feedback. No storage, no network, no analytics; all
// user text is rendered with textContent.
import { validateRecord, openReview, deriveState, RECORD_SCHEMA, STATUS } from '../index.mjs';

const $ = (id) => document.getElementById(id);
const st = { sources: [], entities: [], claims: [], current: null };
const AT = () => new Date().toISOString();

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
const nextId = (prefix, list, key) => { let i = 1; while (list.some((x) => x[key] === prefix + i)) i++; return prefix + i; };

export function buildRecord() {
  const r = {
    schema: RECORD_SCHEMA,
    record_id: $('rec-id').value.trim(),
    record_version: $('rec-ver').value.trim(),
    record_class: $('rec-class').value,
    data_classification: $('rec-fictional').checked ? 'constructed_fictional' : 'unconfirmed',
    title: $('rec-title').value,
    text: $('rec-text').value,
    entities: st.entities.map((e) => ({ entity_id: e.entity_id, name: e.name, ...(e.aliases.length ? { aliases: e.aliases } : {}) })),
    sources: st.sources.map((s) => ({ source_id: s.source_id, title: s.title, version: s.version, text: s.text, ...(s.events.length ? { events: s.events } : {}) })),
    claims: st.claims.map((c) => {
      const out = { claim_id: c.claim_id, kind: c.kind, quote: c.quote, citations: c.citations.map((x) => ({ source_id: x.source_id, quote: x.quote })) };
      if (c.actor) out.actor = c.actor;
      if (c.event && c.event.role && c.event.date) out.event = { role: c.event.role, date: c.event.date };
      if (c.reasoning && c.reasoning.trim()) out.reasoning = c.reasoning;
      return out;
    }),
  };
  return r;
}

// ---- sources ----------------------------------------------------------------
function renderSources() {
  const box = $('sources'); box.replaceChildren();
  if (!st.sources.length) box.append(el('p', { class: 'muted' }, 'No sources yet. Every claim needs a source it can be checked against.'));
  for (const s of st.sources) {
    const ta = el('textarea', { id: 'src-text-' + s.source_id, 'aria-label': `Text of ${s.source_id}`, rows: '4' }); ta.value = s.text;
    ta.addEventListener('input', () => { s.text = ta.value; check(); });
    const title = el('input', { 'aria-label': `Title of ${s.source_id}`, value: s.title, style: 'flex:1' });
    title.addEventListener('input', () => { s.title = title.value; check(); });
    const ver = el('input', { 'aria-label': `Version of ${s.source_id}`, value: s.version, size: '5' });
    ver.addEventListener('input', () => { s.version = ver.value; check(); });
    const role = el('input', { 'aria-label': `Event role in ${s.source_id}`, placeholder: 'event (e.g. approval)', size: '16' });
    const date = el('input', { type: 'date', 'aria-label': `Event date in ${s.source_id}` });
    const evs = el('ul', {}, s.events.map((ev, i) => el('li', {}, `${ev.role} on ${ev.date} `, el('button', { type: 'button', onclick: () => { s.events.splice(i, 1); renderSources(); check(); } }, 'remove'))));
    box.append(el('div', { class: 'item' },
      el('div', { class: 'row' }, el('span', { class: 'lbl' }, s.source_id), title, el('span', { class: 'lbl' }, 'version'), ver,
        el('button', { type: 'button', onclick: () => { if (st.claims.some((c) => c.citations.some((x) => x.source_id === s.source_id))) { msg(`${s.source_id} is cited by a claim; remove those citations first.`); return; } st.sources = st.sources.filter((x) => x !== s); renderSources(); renderClaims(); check(); } }, 'Remove source')),
      ta,
      el('p', { class: 'lbl' }, 'Dated events recorded in this source (lets DS-N1 check dates and event roles)'), evs,
      el('div', { class: 'row' }, role, date, el('button', { type: 'button', onclick: () => {
        if (!role.value.trim() || !date.value) { msg('An event needs a role and a date.'); return; }
        s.events.push({ role: role.value.trim().replace(/\s+/g, '_').toLowerCase(), date: date.value }); renderSources(); check();
      } }, 'Add event'))));
  }
}
$('add-source').addEventListener('click', () => {
  st.sources.push({ source_id: nextId('S', st.sources, 'source_id'), title: 'Source document (fictional)', version: 'v1', text: '', events: [] });
  renderSources(); renderClaims(); check();
});

// ---- entities ---------------------------------------------------------------
function renderEntities() {
  const box = $('entities'); box.replaceChildren();
  for (const e of st.entities) box.append(el('div', { class: 'row' }, el('span', { class: 'lbl' }, e.entity_id), `${e.name}${e.aliases.length ? ' (' + e.aliases.join(', ') + ')' : ''}`,
    el('button', { type: 'button', onclick: () => { st.entities = st.entities.filter((x) => x !== e); st.claims.forEach((c) => { if (c.actor === e.entity_id) delete c.actor; }); renderEntities(); renderClaims(); check(); } }, 'remove')));
}
$('add-entity').addEventListener('click', () => {
  const name = $('ent-name').value.trim();
  if (!name) { msg('Enter a name.'); return; }
  st.entities.push({ entity_id: nextId('E', st.entities, 'entity_id'), name, aliases: $('ent-alias').value.split(',').map((x) => x.trim()).filter(Boolean) });
  $('ent-name').value = ''; $('ent-alias').value = '';
  renderEntities(); renderClaims(); check();
});

// ---- claims and citations ---------------------------------------------------
function selectionIn(ta) {
  const a = ta.selectionStart, b = ta.selectionEnd;
  return a === b ? '' : ta.value.slice(a, b).trim();
}
$('mark-claim').addEventListener('click', () => {
  msg('');
  const q = selectionIn($('rec-text'));
  if (!q) { msg('Select the statement in the record text first.'); return; }
  if (st.claims.some((c) => c.quote === q)) { msg('That statement is already a claim.'); return; }
  const c = { claim_id: nextId('C', st.claims, 'claim_id'), kind: $('claim-kind').value, quote: q, citations: [], event: { role: '', date: '' }, reasoning: '' };
  st.claims.push(c); st.current = c.claim_id;
  renderClaims(); check();
});

function renderClaims() {
  const box = $('claims'); box.replaceChildren();
  for (const c of st.claims) {
    const card = el('div', { class: 'item', 'aria-current': st.current === c.claim_id ? 'true' : 'false', id: 'claim-' + c.claim_id });
    card.append(el('p', {}, el('span', { class: 'lbl' }, `${c.claim_id} · ${c.kind} `), c.quote));
    const actor = el('select', { 'aria-label': `Who acted in ${c.claim_id}` }, el('option', { value: '' }, 'actor: not specified'), st.entities.map((e) => el('option', { value: e.entity_id, selected: c.actor === e.entity_id }, e.name)));
    actor.addEventListener('change', () => { c.actor = actor.value || undefined; check(); });
    card.append(el('div', { class: 'row' }, actor));
    if (c.kind === 'chronology' || c.kind === 'authority') {
      const role = el('input', { 'aria-label': `Event role claimed in ${c.claim_id}`, placeholder: 'event (e.g. approval)', value: c.event.role, size: '16' });
      const date = el('input', { type: 'date', 'aria-label': `Event date claimed in ${c.claim_id}`, value: c.event.date });
      role.addEventListener('input', () => { c.event.role = role.value.trim().replace(/\s+/g, '_').toLowerCase(); check(); });
      date.addEventListener('input', () => { c.event.date = date.value; check(); });
      card.append(el('div', { class: 'row' }, el('span', { class: 'lbl' }, 'claimed event'), role, date));
    }
    if (c.kind === 'conclusion') {
      const rs = el('textarea', { 'aria-label': `Reasoning for ${c.claim_id}`, rows: '2', placeholder: 'reasoning: which claims (e.g. C1, C2) does this rely on?' }); rs.value = c.reasoning;
      rs.addEventListener('input', () => { c.reasoning = rs.value; check(); });
      card.append(rs);
    }
    card.append(el('p', { class: 'lbl' }, 'Citations'));
    card.append(el('ul', {}, c.citations.length ? c.citations.map((x, i) => el('li', {}, `${x.source_id}: "${x.quote}" `, el('button', { type: 'button', onclick: () => { c.citations.splice(i, 1); renderClaims(); check(); } }, 'remove'))) : el('li', { class: 'muted' }, 'none')));
    if (st.sources.length) {
      const pick = el('select', { 'aria-label': `Source to cite for ${c.claim_id}` }, st.sources.map((s) => el('option', { value: s.source_id }, `${s.source_id}: ${s.title}`)));
      card.append(el('div', { class: 'row' }, pick, el('button', { type: 'button', onclick: () => {
        msg('');
        const ta = $('src-text-' + pick.value);
        const q = ta ? selectionIn(ta) : '';
        if (!q) { msg(`Select the supporting passage in ${pick.value}'s text first, then press this button.`); return; }
        c.citations.push({ source_id: pick.value, quote: q }); st.current = c.claim_id; renderClaims(); check();
      } }, 'Cite selected passage')));
    }
    card.append(el('div', { class: 'row' },
      el('button', { type: 'button', onclick: () => { st.claims = st.claims.filter((x) => x !== c); renderClaims(); check(); } }, 'Remove claim')));
    box.append(card);
  }
  if (!st.claims.length) box.append(el('p', { class: 'muted' }, 'No claims yet.'));
}

// ---- live check -------------------------------------------------------------
function check() {
  const box = $('check'); box.replaceChildren();
  const r = buildRecord();
  if (!$('rec-fictional').checked) box.append(el('p', { class: 'err' }, 'Confirm the record is constructed and fictional before it can be checked or saved.'));
  const v = validateRecord(r);
  if (v.status) {
    box.append(el('p', {}, el('span', { class: 'status s-' + v.status }, v.status)));
    box.append(el('ul', {}, v.errors.map((e) => el('li', {}, `${e.code} at ${e.path}: ${e.detail}`))));
    return { record: r, ok: false, status: v.status };
  }
  const s = deriveState(openReview(r, { at: AT() }));
  box.append(el('p', {}, el('span', { class: 'status s-' + s.status }, s.status), ' ', s.reasons.join(' ')));
  const open = s.findings.filter((f) => f.status !== 'SUPERSEDED');
  if (open.length) box.append(el('p', { class: 'lbl' }, 'What a reviewer will be asked'), el('ul', {}, open.map((f) => el('li', {}, el('span', { class: 'sev-' + f.severity }, f.severity.toUpperCase()), ` ${f.claim_id || 'record'} · ${f.code}: ${f.question}`))));
  else box.append(el('p', { class: 'muted' }, 'No findings. Sufficiency is never decided by DS-N1.'));
  return { record: r, ok: true, status: s.status };
}
for (const id of ['rec-id', 'rec-ver', 'rec-title', 'rec-text']) $(id).addEventListener('input', () => check());
$('rec-fictional').addEventListener('change', () => check());

// ---- save / load ------------------------------------------------------------
$('download').addEventListener('click', () => {
  msg('');
  const res = check();
  if (!$('rec-fictional').checked) { msg('Not saved: confirm the record is constructed and fictional.'); return; }
  if (!res.ok && (res.status === STATUS.ERROR || res.status === STATUS.REFUSED)) { msg(`Not saved: the record is ${res.status}. Fix the listed problems first.`); return; }
  const url = URL.createObjectURL(new Blob([JSON.stringify(res.record, null, 2) + '\n'], { type: 'application/json' }));
  const a = el('a', { href: url, download: `${res.record.record_id || 'record'}.json` }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('load').addEventListener('change', async (e) => {
  msg('');
  const f = e.target.files && e.target.files[0]; if (!f) return;
  try {
    if (f.size > 5_000_000) throw new Error('File too large (5 MB limit).');
    const r = JSON.parse(await f.text());
    if (!r || r.schema !== RECORD_SCHEMA) throw new Error(`Not a ${RECORD_SCHEMA} record.`);
    $('rec-id').value = r.record_id || ''; $('rec-ver').value = r.record_version || ''; $('rec-title').value = r.title || ''; $('rec-text').value = r.text || '';
    $('rec-fictional').checked = false; // must be re-confirmed by the person, never inherited from a file
    st.entities = (r.entities || []).map((x) => ({ entity_id: x.entity_id, name: x.name, aliases: x.aliases || [] }));
    st.sources = (r.sources || []).map((x) => ({ source_id: x.source_id, title: x.title, version: x.version, text: x.text, events: x.events || [] }));
    st.claims = (r.claims || []).map((x) => ({ claim_id: x.claim_id, kind: x.kind, quote: x.quote, actor: x.actor, citations: x.citations || [], event: x.event ? { ...x.event } : { role: '', date: '' }, reasoning: x.reasoning || '' }));
    renderSources(); renderEntities(); renderClaims(); check();
  } catch (err) { msg(String(err.message || err)); }
});

renderSources(); renderEntities(); renderClaims(); check();
