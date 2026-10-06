// JRS Review Engine local candidate: deterministic source preparation.
// LOCAL DEVELOPMENT ONLY. No model, no network, no storage, no clock.
//
// Runs before any model call. The same text always gives the same report.
// Every check is a heuristic over the text alone: a finding means a pattern
// was seen, and the absence of a finding is not proof that nothing is wrong.
//
//   unreadable    the text cannot be read as text            -> refused
//   truncation    the text looks cut off or partial           -> refused (partial input)
//   omission      placeholders, or material referred to but not in the record -> reported
//   unsupported   assertions marked as resting on something off the record    -> reported
//   quotations    every double-quoted span, with exact offset, line and column -> reported

import { createHash } from 'node:crypto';

export const SOURCE_PREP_VERSION = 'source-prep/0.1.0';

const PROFILE_ELEMENTS = [
  ['request', /\brequest(?:ed|s)?\b/i, 'No request is described.'],
  ['requirement', /\b(?:policy|standard|requirement|questionnaire|control|procedure)\b/i, 'No policy, standard or requirement being excepted is named.'],
  ['exception_basis', /\b(?:because|given|due to|on the basis of|justif\w*|reason)\b/i, 'No stated basis for the exception was found.'],
  ['approval', /\bapprov(?:ed|al|er)\b/i, 'No approval is recorded.'],
  ['access_period', /\b(?:until|through|expire\w*|end(?:s|ed)? on|scheduled to end|for (?:\w+ ){0,2}(?:days?|weeks?|months?))\b/i, 'No end of the access period was found.'],
  ['date', /\b(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/, 'No full date was found.'],
];

const OMISSION_MARKERS = [
  ['placeholder', /\[(?:omitted|redacted|removed|tbd|tba|to be (?:added|confirmed)|insert[^\]]{0,40}|x{2,}|\s*)\]|\bTBD\b|\bXXX+\b|<[^>]{0,30}(?:insert|name|date)[^>]{0,30}>/gi],
  ['referenced_material_not_in_record', /\b(?:see|per|as shown in|as set out in)\s+(?:the\s+)?(?:attached|attachment|enclosed|enclosure|appendix|exhibit|annex)\b/gi],
];

const UNSUPPORTED_MARKERS = [
  ['off_record_reference', /\b(?:as (?:discussed|agreed|mentioned) (?:earlier|previously|verbally|on the call|in the meeting)|as discussed|as agreed|verbally (?:agreed|confirmed|approved)|per (?:our|the) (?:call|conversation|meeting|chat)|offline)\b/gi],
  ['assertion_without_basis', /\b(?:it is (?:well )?known|as everyone knows|obviously|undoubtedly|it goes without saying|needless to say|clearly)\b/gi],
];

const TRUNCATION_MARKERS = [
  ['explicit_truncation_marker', /\[(?:truncated|cut off|continued|text missing|end of excerpt)\]|\(continued\)|\bcontinued on (?:next|the following) page\b/gi],
];

export function sha256(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex');
}

// Line and column (1-based) of an offset in the original text.
export function position(text, offset) {
  var line = 1, col = 1;
  for (var i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') { line++; col = 1; } else { col++; }
  }
  return { line: line, column: col };
}

function span(text, start, end) {
  var p = position(text, start);
  return { start: start, end: end, line: p.line, column: p.column };
}

// Normalised view of the text with a map back to original offsets, so that a
// match found after normalising (case, curly quotes, whitespace runs) still
// reports its exact position in the original.
function normalisedWithMap(text) {
  var out = [], map = [], lastSpace = true;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === '‘' || ch === '’') ch = "'";
    else if (ch === '“' || ch === '”') ch = '"';
    if (/\s/.test(ch)) {
      if (lastSpace) continue;
      ch = ' '; lastSpace = true;
    } else {
      lastSpace = false;
    }
    out.push(ch.toLowerCase()); map.push(i);
  }
  while (out.length && out[out.length - 1] === ' ') { out.pop(); map.pop(); }
  return { norm: out.join(''), map: map };
}

function normalise(s) {
  return normalisedWithMap(String(s)).norm;
}

// Every place an excerpt occurs in the text, in original offsets.
export function locate(text, excerpt) {
  var hay = normalisedWithMap(text), needle = normalise(excerpt);
  if (!needle) return [];
  var found = [], from = 0, at;
  while ((at = hay.norm.indexOf(needle, from)) !== -1) {
    var start = hay.map[at], end = hay.map[at + needle.length - 1] + 1;
    found.push(span(text, start, end));
    from = at + 1;
  }
  return found;
}

export function quotations(text) {
  var out = [], re = /"([^"\n]{1,600})"|“([^“”]{1,600})”/g, m;
  while ((m = re.exec(text))) {
    var inner = m[1] !== undefined ? m[1] : m[2];
    var start = m.index + 1;
    out.push(Object.assign({ text: inner }, span(text, start, start + inner.length)));
  }
  return out;
}

function unreadable(text) {
  if (typeof text !== 'string') return ['not_text'];
  var codes = [];
  if (!text.trim()) codes.push('empty');
  if (text.indexOf('\u0000') !== -1) codes.push('nul_byte');
  if (/�/.test(text)) codes.push('replacement_character');
  if (/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) codes.push('control_characters');
  if (/Ã[\u0080-¿]|â€/.test(text)) codes.push('mis_decoded_text');
  var visible = text.replace(/\s/g, '');
  if (visible.length) {
    var letters = (visible.match(/\p{L}/gu) || []).length;
    if (letters / visible.length < 0.5) codes.push('mostly_non_letter_content');
  }
  return codes;
}

function scan(text, markers, kind) {
  var out = [];
  markers.forEach(function (pair) {
    var re = new RegExp(pair[1].source, pair[1].flags.indexOf('g') === -1 ? pair[1].flags + 'g' : pair[1].flags), m;
    while ((m = re.exec(text))) {
      out.push({ kind: kind, code: pair[0], matched: m[0], location: span(text, m.index, m.index + m[0].length) });
      if (m[0] === '') re.lastIndex++;
    }
  });
  return out;
}

function truncation(text) {
  var out = scan(text, TRUNCATION_MARKERS, 'truncation');
  var pages = [], re = /\bpage\s+(\d{1,3})\s+of\s+(\d{1,3})\b/gi, m;
  while ((m = re.exec(text))) pages.push([+m[1], +m[2], m.index, m[0]]);
  if (pages.length) {
    var total = Math.max.apply(null, pages.map(function (p) { return p[1]; }));
    var seen = Math.max.apply(null, pages.map(function (p) { return p[0]; }));
    if (seen < total) {
      var last = pages[pages.length - 1];
      out.push({ kind: 'truncation', code: 'pages_missing', matched: last[3],
                 detail: 'Page ' + seen + ' of ' + total + ' is the last page present.', location: span(text, last[2], last[2] + last[3].length) });
    }
  }
  var trimmed = text.replace(/\s+$/, '');
  var end = trimmed.length;
  if (/(?:\.\.\.|…)$/.test(trimmed)) {
    out.push({ kind: 'truncation', code: 'ends_with_ellipsis', location: span(text, end - 1, end) });
  } else if (end && !/[.!?"'”’)\]:]$/.test(trimmed)) {
    out.push({ kind: 'truncation', code: 'ends_mid_sentence', location: span(text, Math.max(0, end - 1), end) });
  }
  var straight = (text.match(/"/g) || []).length;
  var open = (text.match(/“/g) || []).length, close = (text.match(/”/g) || []).length;
  if (straight % 2 === 1 || open > close) {
    var at = Math.max(text.lastIndexOf('"'), text.lastIndexOf('“'));
    out.push({ kind: 'truncation', code: 'unclosed_quotation', location: span(text, at, at + 1) });
  }
  return out;
}

function profileOmissions(text) {
  return PROFILE_ELEMENTS.filter(function (e) { return !e[1].test(text); }).map(function (e) {
    return { kind: 'omission', code: 'profile_element_not_found', element: e[0], detail: e[2] + ' (Heuristic presence check: a missing match is not proof of omission.)' };
  });
}

// Returns a full report. If refusal is set, nothing should reach a model.
export function prepareSource(text) {
  var report = { version: SOURCE_PREP_VERSION, refusal: null, findings: [], quotations: [] };
  var bad = unreadable(text);
  if (bad.length) {
    report.refusal = { reason: 'unreadable_input', codes: bad, detail: 'The input could not be read as text (' + bad.join(', ') + '). Nothing was examined.' };
    return report;
  }
  report.source = { sha256: sha256(text), chars: text.length, lines: text.split('\n').length };
  var cut = truncation(text);
  if (cut.length) {
    report.findings = cut;
    report.refusal = { reason: 'partial_input', codes: cut.map(function (f) { return f.code; }),
                       detail: 'The input appears to be incomplete (' + cut.map(function (f) { return f.code; }).join(', ') + '). A partial record is not examined.' };
    return report;
  }
  report.findings = scan(text, OMISSION_MARKERS, 'omission')
    .concat(profileOmissions(text))
    .concat(scan(text, UNSUPPORTED_MARKERS, 'unsupported_content'));
  report.quotations = quotations(text);
  return report;
}
