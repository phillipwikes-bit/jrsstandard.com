// DS-N1 experimental SP-07 extension (directive v2.1 sections 8.4 and 8.5). Read-only cognitive observations.
// This is NOT recovered DS-A source, NOT a JRS condition, NOT a scoring rule and NOT an approval gate.
// Each observation is a documentary mismatch between the wording of the record and the deterministic
// findings already recorded for it. It never changes a finding, a status, the event log or the report,
// never assesses a reviewer's state of mind, and never supplies a fact. No model or network calls.
export const COGNITIVE_OBSERVATION_VERSION = 'ds-n1.cognitive-observations/0.1.0-dev';

export const OBSERVATION_LIMITATION =
  'Documentary wording check only. It does not diagnose a reviewer, establish bias, assess sufficiency, or approve the record.';

// Categorical wording that expresses certainty. Lexical: a hit means the wording is categorical, not that it is wrong.
const CERTAINTY = /\b(clearly|undoubtedly|unquestionably|definitely|definitively|certainly|conclusively|obviously|indisputabl[ey]|beyond (?:any |all )?doubt|without (?:any )?doubt|beyond question|proves?|proven|it is certain)\b/gi;
// Wording that closes or finalises the record.
const CLOSURE = /\b(finali[sz](?:e|ed|ation|ing)|can proceed|may proceed|no further (?:action|review|information|evidence)|is (?:now )?closed|case closed|concluded|is complete|review complete|approved for release)\b/gi;
// A marker directly negated ("not clearly", "cannot be finalised") lowers rather than asserts certainty or closure.
const NEGATED = /\b(not|no|never|cannot|can't|unable to|without)\s+(?:yet\s+|be\s+|been\s+)?$/i;

const UNRESOLVED = new Set(['OPEN', 'AWAITING_EVIDENCE', 'ESCALATED']);

function sentenceAround(text, start, end) {
  const before = text.lastIndexOf('.', start - 1);
  const from = before < 0 ? 0 : before + 1;
  const stop = text.indexOf('.', end);
  const to = stop < 0 ? text.length : stop + 1;
  const raw = text.slice(from, to);
  const lead = raw.length - raw.trimStart().length;
  return { text: raw.trim(), start: from + lead, end: from + lead + raw.trim().length };
}

function hits(re, text) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text))) {
    if (NEGATED.test(text.slice(Math.max(0, m.index - 24), m.index))) continue;
    out.push({ marker: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

// Input: a normal deriveState result. Output: a list of observations, deterministic for a given state.
export function buildCognitiveObservations(state) {
  if (!state || !Array.isArray(state.findings) || !Array.isArray(state.claims)) {
    throw new TypeError('A deriveState result with claims and findings is required');
  }
  if (!state.record || typeof state.record.text !== 'string' || state.status === 'ERROR' || state.status === 'REFUSED_SCOPE') return [];
  const active = state.findings.filter((f) => f && f.status !== 'SUPERSEDED' && typeof f.finding_id === 'string');
  const unresolved = active.filter((f) => UNRESOLVED.has(f.status));
  const out = [];

  // 8.5 Unsupported certainty: a claim worded categorically while it has unresolved findings or no citation.
  for (const c of state.claims) {
    if (!c || typeof c.text !== 'string') continue;
    const markers = hits(CERTAINTY, c.text);
    if (!markers.length) continue;
    const open = unresolved.filter((f) => f.claim_id === c.claim_id);
    const cited = Array.isArray(c.citations) && c.citations.length > 0;
    if (!open.length && cited) continue;
    out.push({
      version: COGNITIVE_OBSERVATION_VERSION,
      kind: 'unsupported_certainty',
      claim_id: c.claim_id,
      passage: c.text,
      markers: markers.map((m) => m.marker),
      concern: open.length
        ? `The claim is worded with certainty (${markers.map((m) => `"${m.marker}"`).join(', ')}) while ${open.length} finding(s) on it remain unresolved.`
        : `The claim is worded with certainty (${markers.map((m) => `"${m.marker}"`).join(', ')}) but cites no source.`,
      related_findings: open.map((f) => f.finding_id),
      conditions: [...new Set(open.map((f) => f.condition).filter(Boolean))],
      question: 'Does the evidence support the certainty expressed in this statement?',
      unresolved: true,
      changes_review_status: false,
      action_surface: 'existing_findings_and_actions',
      limitation: OBSERVATION_LIMITATION,
    });
  }

  // 8.4 Premature closure: the record states closure while critical or blocking findings remain unresolved.
  const gating = unresolved.filter((f) => f.severity === 'critical' || f.severity === 'blocking');
  if (gating.length) {
    const seen = new Set();
    for (const m of hits(CLOSURE, state.record.text)) {
      const s = sentenceAround(state.record.text, m.start, m.end);
      if (seen.has(s.start)) continue;
      seen.add(s.start);
      out.push({
        version: COGNITIVE_OBSERVATION_VERSION,
        kind: 'premature_closure',
        claim_id: null,
        passage: s.text,
        record_span: { start: s.start, end: s.end },
        markers: [m.marker],
        concern: `The record states closure ("${m.marker}") while ${gating.length} critical or blocking finding(s) remain unresolved.`,
        related_findings: gating.map((f) => f.finding_id),
        conditions: [...new Set(gating.map((f) => f.condition).filter(Boolean))],
        question: 'What information remains necessary before this conclusion can be finalized?',
        unresolved: true,
        changes_review_status: false,
        action_surface: 'existing_findings_and_actions',
        limitation: OBSERVATION_LIMITATION,
      });
    }
  }
  return out;
}
