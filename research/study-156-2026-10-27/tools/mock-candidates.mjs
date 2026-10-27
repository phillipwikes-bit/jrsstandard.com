// 156-record study: deterministic MOCK candidate responses. NOT MODEL OUTPUT.
//
// Three policies stand in for a model so that the compiler, the research rules and the status ceilings can be
// exercised offline:
//   ORACLE      proposes the reference status for each condition (the designed label for synthetic records, the
//               LLM-reproduced key for originals). It shows what the rules do to a correct proposal.
//   OVERCLAIM   proposes "supported" for every condition. It shows whether the rules stop false reassurance.
//   UNDERCLAIM  proposes "gap" for every condition. It shows whether the rules stop false alarms.
// Quotations are chosen by simple text heuristics written here, independently of research-profile.mjs, so the
// rules under test do not choose their own evidence. A heuristic quote can be mistyped or weak; the compiler is
// expected to withhold such quotes, and that behaviour is part of what is measured.
// The mocks never see the record's construction type except through the reference status they are told to propose.

const MON = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const DATE = new RegExp('\\b\\d{1,2}\\s+(?:' + MON + ')\\b|\\b(?:' + MON + ')\\s+\\d{1,2}\\b|\\b\\d{4}-\\d{2}-\\d{2}\\b');
const ID = /\b[A-Z][A-Z0-9]{0,5}-\d{1,6}\b|#\d{2,}|\bEx\.\s*[A-Z]\b|\b(?:item|entry|row|section|clause|paragraph|table)\s+\d/i;
const CUE = /\b(?:because|based on|rests on|relies on|citing|supported by|after the|on the strength of|traceable to|shows|measured|found|scored|lists)\b/i;
const DEC = /\b(?:approved|granted|awarded|denied|declined|refused|rejected|withheld|released|authori[sz]ed|extended|moved|rated|classified|closed|agreed|decided|concluded|determined|kept|set to|raised to|selected|attributes|attributed|affirmed|finding|determination)\b/i;
const AUTH = /\b(?:under|policy|rule|section|clause|standard|procedure|exemption|terms of reference)\b/i;

function sentences(record) {
  const out = [];
  const re = /(?<!\b(?:Ex|sec|No|vs|e\.g|i\.e))[.!?](?=\s+[A-Z0-9("']|\s*$)/g;
  for (const line of record.split('\n')) { let from = 0, m; re.lastIndex = 0; const cuts = []; while ((m = re.exec(line)) !== null) cuts.push(m.index); if (!cuts.length || cuts[cuts.length - 1] < line.length - 1) cuts.push(line.length);
    for (const c of cuts) { const t = line.slice(from, c).trim(); if (t) out.push(t); from = c + 1; } }
  return out;
}
// A quotation: the clause of the sentence that matches, widened to its neighbours until it is at least 24
// characters, unique in the record, and within the 0.3.x limits (<= 400 characters, < half the record).
function quoteFor(record, sentence, re) {
  const parts = sentence.split(/(?<=[,;])\s+/);
  let i = Math.max(0, parts.findIndex((p) => re.test(p)));
  let lo = i, hi = i;
  const text = () => parts.slice(lo, hi + 1).join(' ').replace(/[,;.]$/, '').trim();
  const ok = (q) => q.length >= 24 && q.length <= 400 && q.length < record.length / 2 && record.split(q).length === 2;
  while (!ok(text()) && (lo > 0 || hi < parts.length - 1)) { if (hi < parts.length - 1) hi++; else lo--; }
  const q = text();
  if (ok(q)) return q;
  const m = new RegExp(re.source, re.flags.replace('g', '')).exec(sentence);
  if (m) { const w = sentence.split(/\s+/); let pos = 0, at = 0; for (let k = 0; k < w.length; k++) { if (pos <= m.index) at = k; pos += w[k].length + 1; }
    for (let span = 4; span <= 18; span++) { const lo2 = Math.max(0, at - Math.floor(span / 2)), cand = w.slice(lo2, lo2 + span).join(' ').replace(/[,;.()]+$/, '').replace(/^[(]+/, ''); if (ok(cand)) return cand; } }
  return q.length >= 12 && q.length <= 400 && q.length < record.length / 2 && record.split(q).length === 2 ? q : null;
}
const first = (ss, re, not) => ss.find((s) => re.test(s) && !(not && not.test(s))) || null;

// reference: { e1: 'GROUNDED' | 'UNGROUNDED', chronology_conflict: bool }
export function mockCandidate(record, reference, policy, { contractVersion, promptVersion }) {
  const ss = sentences(record);
  const obs = [];
  let n = 0;
  const add = (condition_id, status, sentence, re, assertion_type) => {
    const quote = sentence ? quoteFor(record, sentence, re) : null;
    if (quote === null) { obs.push({ observation_id: 'M' + (++n), condition_id, proposed_status: 'not_assessed', quote: null, assertion_type }); return; }
    obs.push({ observation_id: 'M' + (++n), condition_id, proposed_status: status, quote, assertion_type });
  };
  const grounded = reference.e1 === 'GROUNDED';
  const st = (c) => policy === 'OVERCLAIM' ? 'supported' : policy === 'UNDERCLAIM' ? 'gap'
    : c === 'sufficiency' ? (grounded ? 'review_required' : 'gap')
      : c === 'chronology_integrity' ? (reference.chronology_conflict ? 'gap' : 'supported')
        : (grounded ? 'supported' : 'gap');
  const dec = first(ss, DEC), cue = first(ss, CUE), idNonDec = first(ss, ID, DEC) || first(ss, ID), auth = first(ss, AUTH);
  const dated = ss.filter((s) => DATE.test(s));
  add('reconstructability', st('reconstructability'), dec, DEC, 'stated_decision');
  if (cue) add('reconstructability', st('reconstructability'), cue, CUE, 'stated_rationale');
  else if (idNonDec) add('reconstructability', st('reconstructability'), idNonDec, ID, 'stated_source_reference');
  if (idNonDec) add('identifiable_basis', st('identifiable_basis'), idNonDec, ID, 'stated_source_reference');
  else if (cue) add('identifiable_basis', st('identifiable_basis'), cue, CUE, 'stated_rationale');
  else add('identifiable_basis', st('identifiable_basis'), auth || dec, auth ? AUTH : DEC, 'stated_authority');
  if (dated.length) for (const s of dated.slice(0, 2)) add('chronology_integrity', st('chronology_integrity'), s, DATE, 'stated_date');
  else add('chronology_integrity', 'not_assessed', null, DATE, 'stated_date');
  if (cue) add('reasoning_traceability', st('reasoning_traceability'), cue, CUE, 'stated_rationale');
  else add('reasoning_traceability', st('reasoning_traceability'), dec, DEC, 'stated_rationale');
  if (idNonDec) add('sufficiency', st('sufficiency'), idNonDec, ID, 'stated_source_reference');
  else add('sufficiency', st('sufficiency'), dec, DEC, 'stated_source_reference');
  // Duplicate quotation for one condition is merged away: identical quotes in one condition add nothing.
  const seen = new Set();
  const dedup = obs.filter((o) => { const k = o.condition_id + '|' + o.quote; if (o.quote !== null && seen.has(k)) return false; seen.add(k); return true; });
  return JSON.stringify({ contract_version: contractVersion, prompt_version: promptVersion, observations: dedup }, null, 2);
}
export const POLICIES = Object.freeze(['ORACLE', 'OVERCLAIM', 'UNDERCLAIM']);
