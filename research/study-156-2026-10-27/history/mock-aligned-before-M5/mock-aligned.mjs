// 156-record study: RULE-ALIGNED mock candidates (ORACLE-R, OVERCLAIM-R). NOT MODEL OUTPUT. CIRCULAR BY DESIGN.
//
// These quote exactly the sentences the research rules look for, using the research profile's own sentence units
// and evidence anchors. They answer one narrow question: if a candidate cites what the rules need, what do the rules
// then do? ORACLE-R shows the ceiling for a correct proposal; OVERCLAIM-R shows whether confident, well-cited
// over-claiming gets through. They say nothing about how a real model would cite.
const words = (s) => s.split(/\s+/);
// M4: when the grown window cannot satisfy the limits (a short record, where the first window is already half the
// record or more), retry from narrower windows. The first attempt is unchanged, so a quote found before M4 is kept.
function windowQuote(record, unit, from, to, markers, type) {
  for (let k = 0; k <= 3; k++) {
    const cut = Math.floor(((to - from) * k) / 8);
    if (k > 0 && to - from - 2 * cut < 12) break;
    const q = growQuote(record, unit, from + cut, to - cut, markers, type);
    if (q !== null) return q;
  }
  return null;
}
function growQuote(record, unit, from, to, markers, type) {
  const u = unit.text;
  let a = Math.max(0, from), b = Math.min(u.length, to);
  while (a > 0 && /\S/.test(u[a - 1])) a--;
  while (b < u.length && /\S/.test(u[b])) b++;
  const ok = (q) => q.length >= 12 && q.length <= 400 && q.length < record.length / 2 && q === q.trim() && record.split(q).length === 2 && !/\n/.test(q) && markers[type].test(q);
  const tidy = (q) => q.replace(/[,;.]+$/, '').replace(/^\(+/, '').replace(/\)+$/, (m) => (q.split('(').length > q.split(')').length - m.length ? m : ''));
  for (let grow = 0; grow < 40; grow++) {
    const q = tidy(u.slice(a, b).trim());
    if (ok(q)) return q;
    if (b < u.length) { b++; while (b < u.length && /\S/.test(u[b])) b++; }
    else if (a > 0) { a--; while (a > 0 && /\S/.test(u[a - 1])) a--; }
    else break;
  }
  return null;
}
export function alignedCandidate(record, R, reference, policy, { contractVersion, promptVersion }) {
  const units = R.sentenceUnits(record);
  const M = R.RESEARCH_MARKERS;
  const obs = []; let n = 0;
  const grounded = reference.e1 === 'GROUNDED';
  const st = (c) => policy === 'OVERCLAIM-R' ? 'supported'
    : c === 'sufficiency' ? (grounded ? 'review_required' : 'gap') : c === 'chronology_integrity' ? (reference.chronology_conflict ? 'gap' : 'supported') : (grounded ? 'supported' : 'gap');
  const push = (c, q, type) => { if (q && !obs.some((o) => o.condition_id === c && o.quote === q)) obs.push({ observation_id: 'R' + (++n), condition_id: c, proposed_status: st(c), quote: q, assertion_type: type }); };
  const dec = units.find((u) => u.decision);
  const decQuote = dec ? (() => { const m = /\b(?:decision|granted|approved|denied|rejected|declined|awarded|withheld|released|authori[sz]ed|affirmed|extended|moved|rated|classified|closed|confirmed|agreed|decided|concluded|determined|refused|held back|set to|raised to|kept|retained|attributes|attributed|selected|finding|determination)\b/i.exec(dec.text); return m ? windowQuote(record, dec, m.index - 40, m.index + m[0].length + 30, M, 'stated_decision') : null; })() : null;
  const anchored = units.filter((u) => u.basis_anchors.length);
  const idUnit = anchored.find((u) => u.basis_anchors.some((a) => a.kind === 'identifier'));
  const idQuote = idUnit ? (() => { const a = idUnit.basis_anchors.find((x) => x.kind === 'identifier'); return windowQuote(record, idUnit, a.start - 30, a.end + 10, M, 'stated_source_reference'); })() : null;
  const cueUnit = anchored.find((u) => u.basis_cue && M.stated_rationale.test(u.text)) || anchored.find((u) => M.stated_rationale.test(u.text));
  const ratQuote = cueUnit ? (() => { const m = M.stated_rationale.exec(cueUnit.text); const a = cueUnit.basis_anchors.find((x) => x.start > m.index) || cueUnit.basis_anchors[0]; return windowQuote(record, cueUnit, Math.min(m.index, a.start), Math.max(m.index + m[0].length, a.end), M, 'stated_rationale'); })() : null;
  const events = R.researchEvents(record, units);
  const dateQuotes = [];
  for (const e of events) { if (dateQuotes.length >= 2) break; const u = units[e.unit]; const q = windowQuote(record, u, e.date_start - u.start - 30, e.date_end - u.start, M, 'stated_date'); if (q && !dateQuotes.includes(q)) dateQuotes.push(q); }
  push('reconstructability', decQuote, 'stated_decision'); push('reconstructability', ratQuote || idQuote, ratQuote ? 'stated_rationale' : 'stated_source_reference');
  if (idQuote) push('identifiable_basis', idQuote, 'stated_source_reference'); else if (ratQuote) push('identifiable_basis', ratQuote, 'stated_rationale');
  for (const q of dateQuotes) push('chronology_integrity', q, 'stated_date');
  if (ratQuote) push('reasoning_traceability', ratQuote, 'stated_rationale'); else if (idQuote) push('reasoning_traceability', idQuote, 'stated_source_reference');
  if (idQuote) push('sufficiency', idQuote, 'stated_source_reference');
  for (const c of ['reconstructability', 'identifiable_basis', 'chronology_integrity', 'reasoning_traceability', 'sufficiency']) if (!obs.some((o) => o.condition_id === c))
    obs.push({ observation_id: 'R' + (++n), condition_id: c, proposed_status: 'not_assessed', quote: null, assertion_type: c === 'chronology_integrity' ? 'stated_date' : 'stated_rationale' });
  return JSON.stringify({ contract_version: contractVersion, prompt_version: promptVersion, observations: obs }, null, 2);
}
export const ALIGNED_POLICIES = Object.freeze(['ORACLE-R', 'OVERCLAIM-R']);
