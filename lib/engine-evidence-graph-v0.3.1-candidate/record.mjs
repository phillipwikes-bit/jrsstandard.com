// JRS EVIDENCE GRAPH 0.3.0: deterministic record structure.
//
// The original record is preserved exactly; every offset refers to it. Sections
// begin at lines of the form "Label: ..." (a capitalised label of 2 to 40
// characters). Section roles are assigned from the label only. Nothing here
// interprets meaning; it locates text.

const SECTION_LINE = /^([A-Z][A-Za-z0-9 /&()-]{1,39}):/;

const ROLE_RULES = [
  ['basis', /^(decision basis|basis|justification|rationale)$/i],
  ['decision', /^(decision|outcome|conclusion)$/i],
  ['authority', /^(authority|approval|approved by)$/i],
  ['controls', /^(compensating controls?|controls?)$/i],
  ['expiry', /^(expiry and renewal|expiry|renewal|valid until)$/i],
  ['risk', /^(residual risk|risk statement|risk|risk rating)$/i],
  ['chronology', /^chronology(\s*\(part \d+\))?$/i],
  ['request', /^(requested by|access requested|request)$/i],
  ['action', /^(revocation|corrective action|follow-up|follow up)$/i],
  ['identity', /^(record type|exception id|supplier)$/i],
];

export function roleOf(label) {
  for (const [role, re] of ROLE_RULES) if (re.test(label.trim())) return role;
  return 'other';
}

export function sectionsOf(record) {
  const out = [];
  let offset = 0, cur = { label: 'preamble', start: 0 };
  for (const line of record.split('\n')) {
    const m = SECTION_LINE.exec(line);
    if (m) {
      if (offset > cur.start) out.push(Object.assign(cur, { end: offset }));
      cur = { label: m[1], start: offset, label_end: offset + m[0].length };
    }
    offset += line.length + 1;
  }
  out.push(Object.assign(cur, { end: record.length }));
  return out.filter((s) => s.end > s.start).map((s, i) => {
    // Content span: after the label, without trailing whitespace.
    let cs = s.label_end || s.start, ce = s.end;
    while (cs < ce && /\s/.test(record[cs])) cs++;
    while (ce > cs && /\s/.test(record[ce - 1])) ce--;
    return { index: i, label: s.label, role: s.label === 'preamble' ? 'preamble' : roleOf(s.label), start: s.start, end: s.end, content_start: cs, content_end: ce };
  });
}

export function sectionAt(sections, i) { return sections.find((s) => i >= s.start && i < s.end) || null; }

export function utf8Offset(record, i) { return Buffer.byteLength(record.slice(0, i), 'utf8'); }

const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
function validDate(y, m, d) { const t = new Date(Date.UTC(+y, +m - 1, +d)); return t.getUTCFullYear() === +y && t.getUTCMonth() === +m - 1 && t.getUTCDate() === +d; }

export function datesIn(text) {
  const out = []; let m; ISO.lastIndex = 0;
  while ((m = ISO.exec(text)) !== null) if (validDate(m[1], m[2], m[3])) out.push({ date: m[0], index: m.index });
  return out;
}

// Clauses: a section's content split at "; " and at ". " before a capital letter.
export function clausesOf(record, section) {
  const text = record.slice(section.content_start, section.content_end);
  const out = []; const re = /;\s+|\.\s+(?=[A-Z])/g; let from = 0, m;
  const push = (a, b) => {
    let s = section.content_start + a, e = section.content_start + b;
    while (s < e && /\s/.test(record[s])) s++;
    while (e > s && /\s/.test(record[e - 1])) e--;
    if (e > s) out.push({ start: s, end: e, text: record.slice(s, e) });
  };
  while ((m = re.exec(text)) !== null) { push(from, m.index + (m[0][0] === '.' ? 1 : 0)); from = m.index + m[0].length; }
  push(from, text.length);
  return out;
}

// Explicitly stated dates with an explicit event role. Undated events are not inferred.
export function datedEvents(record, sections) {
  const events = [];
  for (const s of sections) for (const c of clausesOf(record, s)) {
    const ds = datesIn(c.text); if (!ds.length) continue;
    let role = null;
    if (s.role === 'basis') role = null;
    else if (/\b(?:expires?|expiry|valid until|end date)\b/i.test(c.text) || (s.role === 'expiry' && !/\brenew/i.test(c.text))) role = 'expiry';
    else if (s.role === 'authority' || s.role === 'decision' || /\b(?:board decision|decision recorded|decision dated|decided on|approved on|granted on)\b/i.test(c.text)) role = 'decision';
    else if (s.role === 'request' || /\b(?:request received|requested|submitted)\b/i.test(c.text)) role = 'request';
    else if (/\b(?:assessment|completed)\b/i.test(c.text)) role = 'assessment';
    if (role) events.push({ role, date: ds[0].date, start: c.start, end: c.end, text: c.text, section: s.label });
  }
  return events;
}
