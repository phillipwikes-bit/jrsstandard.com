// JRS ENGINE ASSURANCE: Cognitive Controls (record controls only).
//
// SCOPE, STATED FIRST. These controls examine the DOCUMENT. They identify record
// patterns that make a later reconstruction harder and route them to a human.
// They do not assess, profile or describe the person who wrote the record: no
// statement about cognition, mental state, intent, motive, credibility, honesty
// or any need for help is made or implied. tests/engine-assurance/run.mjs fails
// if any output text uses that vocabulary.
//
// Each detection has four parts:
//   detect  : the bounded record pattern, with exact record spans where one exists
//   reflect : why a human reviewer should look at it
//   correct : a neutral documentation prompt
//   learn   : a reusable checklist or codebook improvement opportunity
//
// The detectors are lexical and deterministic. They will miss patterns phrased in
// ways they do not anticipate and will sometimes fire on acceptable text. They
// route; they never decide. A detection is not a condition finding and changes no
// condition outcome.

import { OFFSET_UNIT, countOccurrences } from './span-verify.mjs';

export const RECORD_CONTROL_SCOPE =
  'Record control only. This output describes the documentation and makes no statement about the person who wrote it.';

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const TRACEABLE_ID = /\b[A-Z]{2,}(?:-[A-Z0-9]+)*-\d+\b|§\s*\d|\bsection\s+\d|\bitem\s+\d|\b\d{4}-\d{2}-\d{2}\b/;

// Segments are lines, split further at semicolons and at ". " before a capital.
export function segments(record) {
  const out = [];
  let lineStart = 0;
  for (const line of record.split('\n')) {
    const re = /;\s+|\.\s+(?=[A-Z])/g;
    let from = 0, m;
    const push = (a, b) => {
      let s = lineStart + a, e = lineStart + b;
      while (s < e && /\s/.test(record[s])) s++;
      while (e > s && /\s/.test(record[e - 1])) e--;
      if (e - s >= 8) out.push({ start: s, end: e, text: record.slice(s, e) });
    };
    while ((m = re.exec(line)) !== null) {
      push(from, m.index + (m[0][0] === '.' ? 1 : 0));
      from = m.index + m[0].length;
    }
    push(from, line.length);
    lineStart += line.length + 1;
  }
  return out;
}

function span(record, seg) {
  return {
    quote: seg.text, start: seg.start, end: seg.end, offset_unit: OFFSET_UNIT,
    occurrence_count: countOccurrences(record, seg.text), verification: 'exact_match_record_presence_only',
  };
}

function validDate(y, m, d) {
  const dt = new Date(Date.UTC(+y, +m - 1, +d));
  return dt.getUTCFullYear() === +y && dt.getUTCMonth() === +m - 1 && dt.getUTCDate() === +d;
}

function firstDate(text) {
  ISO_DATE.lastIndex = 0;
  let m;
  while ((m = ISO_DATE.exec(text)) !== null) if (validDate(m[1], m[2], m[3])) return m[0];
  return null;
}

function control(id, name, patternId, summary, spans, reflect, correct, learn) {
  return {
    control_id: id, control_name: name, scope: RECORD_CONTROL_SCOPE,
    detect: { pattern_id: patternId, summary, spans },
    reflect, correct, learn, route: 'human_review',
  };
}

export function runCognitiveControls(record) {
  const segs = segments(record);
  const out = [];

  // CC-01 conclusion stated before the supporting basis is visible.
  const conclusionLabel = /^[ \t]*(?:decision|conclusion|outcome)[ \t]*:/im;
  const conclusionPhrase = /\b(?:exception|access)\s+(?:is\s+|was\s+|has been\s+)?(?:approved|granted)\b/i;
  const basisLabel = /^[ \t]*(?:decision basis|basis|justification|evidence|rationale)[ \t]*:/im;
  const basisPhrase = /\b(?:because|based on|on the basis of)\b/i;
  const firstSeg = (res) => segs.find((s) => res.some((re) => re.test(s.text)));
  const c = firstSeg([conclusionLabel, conclusionPhrase]);
  const b = firstSeg([basisLabel, basisPhrase]);
  if (c && (!b || c.start < b.start)) {
    out.push(control('CC-01', 'Conclusion before visible basis',
      b ? 'conclusion_precedes_basis' : 'conclusion_without_labelled_basis',
      b ? 'A conclusion is stated before any passage that sets out its basis.'
        : 'A conclusion is stated and no passage is labelled or phrased as its basis.',
      b ? [span(record, c), span(record, b)] : [span(record, c)],
      'A later reviewer reading in order meets the outcome before the reasons, so the reasons can read as justification added afterwards even when they were not.',
      'Place the decision basis, with its sources, before the decision statement, or reference the basis explicitly from the decision line.',
      'Checklist candidate: "Is the basis visible before, or explicitly linked from, the stated decision?"'));
  }

  // CC-02 authority or evidence referenced without a traceable source.
  const authority = /\b(?:per (?:the )?(?:policy|standard|CISO|CIO|director|board|management|security team)|as required by (?:the )?(?:policy|standard|regulation|management)|in line with (?:the )?policy|according to (?:the )?(?:policy|standard|guidance)|approved by (?:senior )?(?:management|leadership)|(?:management|leadership) (?:approved|agreed|signed off)|standard practice|industry standard|best practice|as agreed)\b/i;
  const evidenceRef = /\bthe (?:assessment|review|evidence|analysis|report|audit) (?:shows|showed|confirms|confirmed|found|indicates|indicated)\b/i;
  const untraced = segs.filter((s) => (authority.test(s.text) || evidenceRef.test(s.text)) && !TRACEABLE_ID.test(s.text));
  if (untraced.length) {
    out.push(control('CC-02', 'Authority or evidence without traceable source', 'reference_without_identifier',
      untraced.length + ' passage(s) cite an authority or evidence without a document identifier, section, item or date that would let a reviewer locate it.',
      untraced.slice(0, 5).map((s) => span(record, s)),
      'A reference that cannot be located cannot be checked, so a reviewer cannot tell whether it says what the record relies on it for.',
      'Add the identifier of the policy, minutes, assessment or ticket relied on (number, section or item, and date).',
      'Codebook candidate: treat an authority reference without a locator as a basis-identification prompt.'));
  }

  // CC-03 chronology that prevents reconstruction.
  const relative = /\b(?:recently|last (?:week|month)|next (?:week|month)|soon|shortly|in due course|until further notice|as soon as possible|ASAP|a few (?:days|weeks) ago)\b/i;
  const rel = segs.filter((s) => relative.test(s.text));
  if (rel.length) {
    out.push(control('CC-03', 'Chronology that prevents reconstruction', 'relative_time_without_anchor',
      'Timing is expressed relative to an unstated point ("' + relative.exec(rel[0].text)[0] + '").',
      rel.slice(0, 5).map((s) => span(record, s)),
      'Relative timing is only meaningful to someone who knows when the record was written; a later reviewer cannot place the event.',
      'Replace relative timing with calendar dates, and state the end date or review date for any open-ended condition.',
      'Checklist candidate: "Does every time reference resolve to a calendar date?"'));
  }
  if (!firstDate(record)) {
    out.push(control('CC-03', 'Chronology that prevents reconstruction', 'no_absolute_dates',
      'The record contains no calendar date in YYYY-MM-DD form.', [],
      'Without dates the order of request, assessment, decision and expiry cannot be reconstructed from the record alone.',
      'Add the date of each step: request, assessment, decision, and expiry.',
      'Checklist candidate: "Are request, decision and expiry each dated?"'));
  } else {
    // A "Decision basis:" passage dates the evidence, not the decision, so it has
    // no role here. (Defect found on the first replay, 2026-10-10: it was read as
    // the decision date and masked a decision dated before its request.)
    const role = (t) => /^\s*(?:decision basis|basis|justification|rationale)\s*:/i.test(t) ? null
      : /\b(?:expir\w*|valid until|end date)\b/i.test(t) ? 'expiry'
      // Explicit decision wording only. A conditional clause such as "unless a
      // renewal is approved before that date" is not a decision date (second
      // false positive found on the same replay).
      : /^\s*(?:decision|authority)\s*:|\b(?:decided on|board decision|decision recorded|decision dated|approved on|granted on)\b/i.test(t) ? 'decision'
        : /\b(?:request(?:ed)?|received|submitted)\b/i.test(t) ? 'request' : null;
    const firsts = {};
    for (const s of segs) {
      const d = firstDate(s.text); const r = role(s.text);
      if (d && r && !firsts[r]) firsts[r] = { date: d, seg: s };
    }
    const conflicts = [];
    const before = (a, z, strict) => firsts[a] && firsts[z] && (strict ? firsts[z].date <= firsts[a].date : firsts[z].date < firsts[a].date);
    if (before('request', 'decision', false)) conflicts.push(['request', 'decision']);
    if (before('decision', 'expiry', true)) conflicts.push(['decision', 'expiry']);
    else if (before('request', 'expiry', true)) conflicts.push(['request', 'expiry']);
    if (conflicts.length) {
      const [a, z] = conflicts[0];
      out.push(control('CC-03', 'Chronology that prevents reconstruction', 'date_order_conflict',
        'The ' + z + ' date (' + firsts[z].date + ') does not follow the ' + a + ' date (' + firsts[a].date + ').',
        [span(record, firsts[a].seg), span(record, firsts[z].seg)],
        'Two dated steps appear in an order that cannot both be correct as written, so the sequence cannot be reconstructed without outside information.',
        'Confirm each date against its source document and correct the record, or explain the sequence if it is intended.',
        'Checklist candidate: "Do request, decision and expiry dates appear in a possible order?"'));
    }
  }

  // CC-04 unsupported certainty language.
  const certainty = /\b(?:clearly|obviously|undoubtedly|certainly|definitely|no risk|zero risk|risk-free|fully secure|completely secure|guaranteed?|cannot fail|beyond doubt|without question|always safe)\b/i;
  const cert = segs.filter((s) => certainty.test(s.text));
  if (cert.length) {
    out.push(control('CC-04', 'Unsupported certainty language', 'absolute_or_certainty_term',
      cert.length + ' passage(s) use absolute or certainty terms (first: "' + certainty.exec(cert[0].text)[0] + '").',
      cert.slice(0, 5).map((s) => span(record, s)),
      'Absolute terms state a degree of confidence that the record does not show the basis for, which a later reviewer may read as overstatement.',
      'Replace the term with the specific finding and its source, or state the residual uncertainty.',
      'Codebook candidate: list certainty terms that should prompt a request for the supporting measurement.'));
  }

  // CC-05 missing alternative explanation or unresolved contradiction.
  const levelRe = /\b(low|medium|moderate|high|critical)[- ]risk\b|\brisk(?: rating| level| score)?\s*(?:is|:|of)\s*(low|medium|moderate|high|critical)\b/i;
  const levels = new Map();
  for (const s of segs) {
    if (/\b(?:inherent|residual|before controls|after controls|prior to controls)\b/i.test(s.text)) continue;
    const m = levelRe.exec(s.text);
    if (m) {
      const lv = (m[1] || m[2]).toLowerCase().replace('moderate', 'medium');
      if (!levels.has(lv)) levels.set(lv, s);
    }
  }
  if (levels.size > 1) {
    out.push(control('CC-05', 'Unresolved contradiction', 'conflicting_risk_statements',
      'The record states more than one unqualified risk level (' + [...levels.keys()].join(', ') + ').',
      [...levels.values()].map((s) => span(record, s)),
      'A reviewer cannot tell which risk level the decision relied on, or whether the difference was considered and resolved.',
      'State one risk level and its source, or distinguish the levels explicitly (for example inherent versus residual) and explain the difference.',
      'Checklist candidate: "If more than one risk level appears, is each qualified and reconciled?"'));
  }
  const ro = segs.find((s) => /\bread-only\b/i.test(s.text));
  const rw = segs.find((s) => /\b(?:write access|read-write|read\/write|administrative access|admin access)\b/i.test(s.text));
  if (ro && rw) {
    out.push(control('CC-05', 'Unresolved contradiction', 'conflicting_access_statements',
      'The record describes the access as read-only in one passage and as write or administrative access in another.',
      [span(record, ro), span(record, rw)],
      'The scope of the exception cannot be reconstructed when two passages describe different access.',
      'State the single access level granted and remove or explain the other description.',
      'Checklist candidate: "Is the access level stated once and consistently?"'));
  }

  // CC-06 corrective action without owner, deadline or follow-up point.
  const action = /\b(?:will be (?:remediated|addressed|reviewed|monitored|fixed|implemented|enforced|revoked|removed|completed)|corrective action|remediation (?:plan|action|step)|will (?:implement|remediate|monitor|review|follow up|revoke|remove|enforce))\b/i;
  const owner = /\b(?:owner\s*:|owned by|responsible\s*:|assigned to|accountable\s*:)|\b[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)* (?:Manager|Lead|Officer|Team|Administrator|Analyst|Owner|Engineer)\b/;
  const deadline = /\b\d{4}-\d{2}-\d{2}\b|\bby (?:the )?(?:end of )?(?:Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December)\b|\bwithin \d+ (?:business |calendar )?(?:days|weeks)\b/i;
  const incomplete = segs.filter((s) => action.test(s.text) && (!owner.test(s.text) || !deadline.test(s.text)));
  if (incomplete.length) {
    const missing = [];
    if (incomplete.some((s) => !owner.test(s.text))) missing.push('owner');
    if (incomplete.some((s) => !deadline.test(s.text))) missing.push('deadline or follow-up date');
    out.push(control('CC-06', 'Corrective action without owner or deadline', 'action_missing_' + missing.map((x) => x.split(' ')[0]).join('_and_'),
      incomplete.length + ' corrective or follow-up action(s) lack a documented ' + missing.join(' and ') + ' in the same passage.',
      incomplete.slice(0, 5).map((s) => span(record, s)),
      'An action without an owner and a date cannot be followed up, so a later reviewer cannot tell whether it was expected to happen or did.',
      'Name the role responsible for each action and the date by which it is due or will be checked.',
      'Checklist candidate: "Does every stated action have an owner and a date?"'));
  }

  return out;
}
