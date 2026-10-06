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
//   instructions  text inside the record that reads as an instruction to a model -> reported
//   quotations    every double-quoted span, with exact offset, line and column -> reported

import { createHash } from 'node:crypto';

export const SOURCE_PREP_VERSION = 'source-prep/0.3.0';

// 0.3.0 (2026-10-06): general rules for the six divergences recorded on the 24-case regression set
// (tests/engine-candidate/regression/KNOWN_DIVERGENCES.json), written before the independent
// confirmation corpus (tests/engine-candidate/confirmation/) was run against them.

var MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
var ORD = '(?:st|nd|rd|th)';
var UNITS = ['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth'];
var WORD_DAYS = UNITS.concat(['tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth'])
  .concat(UNITS.map(function (u) { return 'twenty-' + u; })).concat(['thirtieth', 'thirty-first']).join('|');
// A full date: day, month and year in any common written order, with or without an ordinal suffix,
// or with the day written out as a word. An ordinal not followed by a month is not a date.
var DAY = '(?:\\d{1,2}' + ORD + '?|' + WORD_DAYS + ')';
var FULL_DATE = new RegExp('\\b(?:(?:the\\s+)?' + DAY + '\\s+(?:of\\s+)?(?:' + MONTHS + '),?\\s+\\d{4}|(?:' + MONTHS + ')\\s+' + DAY + ',?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})\\b', 'i');


const PROFILE_ELEMENTS = [
  // A request in any common form of words; asking ABOUT something is not a request for it.
  ['request', /\b(?:request(?:ed|s|ing)?|ask(?:ed|s|ing)? for|appl(?:ied|ies|y|ying) for|sought|seek(?:s|ing)?|(?:made|submitted|filed) an application for|application for (?:\w+ )?access)\b/i, 'No request is described.'],
  ['requirement', /\b(?:policy|standard|requirement|questionnaire|control|procedure)\b/i, 'No policy, standard or requirement being excepted is named.'],
  ['exception_basis', /\b(?:because|given|due to|on the basis of|justif\w*|reason)\b/i, 'No stated basis for the exception was found.'],
  ['approval', /\bapprov(?:ed|al|er)\b/i, 'No approval is recorded.'],
  ['access_period', /\b(?:until|through|expire\w*|end(?:s|ed)? on|scheduled to end|for (?:\w+ ){0,2}(?:days?|weeks?|months?))\b/i, 'No end of the access period was found.'],
  ['date', FULL_DATE, 'No full date was found.'],
];

const OMISSION_MARKERS = [
  ['placeholder', /\[(?:omitted|redacted|removed|tbd|tba|to be (?:added|confirmed)|insert[^\]]{0,40}|x{2,}|\s*)\]|\bTBD\b|\bXXX+\b|<[^>]{0,30}(?:insert|name|date)[^>]{0,30}>/gi],
];

// A reference to attached material. It is reported unless the same sentence says the material is
// reproduced or included in this record (here, below, above, as follows), and does not negate that.
var ATTACHMENT_REF = /\b(?:see|per|as shown in|as set out in)\s+(?:the\s+)?(?:attached|attachment|enclosed|enclosure|appendix|exhibit|annex)\b/gi;
var INLINE_COPY = /\b(?:reproduced|included|copied|set out|quoted|pasted)\s+(?:in full\s+)?(?:here|below|above|as follows)\b|\b(?:reproduced|included|copied)\s+in\s+this\s+record\b/i;
var NEGATED_COPY = /\bnot\s+(?:\w+\s+)?(?:reproduced|included|copied|attached|set out)\b/i;

const UNSUPPORTED_MARKERS = [
  // A source outside the record: something said rather than written, or a conversation the record
  // points to as its basis. Suppressed when the same sentence says that source is reproduced here.
  ['off_record_reference', /\b(?:as (?:discussed|agreed|mentioned|confirmed|arranged)\b|verbally|orally|by (?:tele)?phone|over the (?:tele)?phone|off the record|offline|(?:per|following|after|based on|according to|during|discussed (?:at|in|on|during)|agreed (?:at|in|on|during))\s+(?:the |a |an |our |their |my |his |her )?(?:(?:phone|telephone|video|verbal|brief|recent|earlier|informal|separate|prior)\s+)?(?:call|conversation|discussion|meeting|chat)\b(?!\s+(?:centre|center|room|notes|minutes|transcript|agenda|invite)))/gi],
  ['assertion_without_basis', /\b(?:it is (?:well )?known|as everyone knows|obviously|undoubtedly|it goes without saying|needless to say)\b/gi],
];

// 'clearly' is descriptive when it qualifies how something is presented or perceived ('clearly printed',
// 'not clearly explained'), and an assertion otherwise ('clearly trustworthy', a sentence-opening 'Clearly,').
var CLEARLY = /\bclearly\b(,)?\s*(\w+)?/gi;
var PRESENTATION = /^(?:printed|visible|invisible|marked|labell?ed|legible|illegible|readable|shown|written|stated|displayed|stamped|signed|dated|identified|explained|described|recorded|indicated|noted|set|headed|titled|numbered|highlighted|underlined|typed|handwritten|audible|seen|heard|defined|referenced|separated|laid)$/i;
var REPRODUCED_HERE = /\breproduced\s+(?:in full\s+)?(?:here|below|above)\b|\b(?:minutes|notes|transcript)\s+(?:are|is)\s+(?:attached and\s+)?reproduced\b/i;

function sentenceAround(text, start, end) {
  var a = Math.max(text.lastIndexOf('. ', start), text.lastIndexOf('\n', start), text.lastIndexOf('; ', start)) + 1;
  var rest = text.slice(end), m = rest.search(/[.!?](?:\s|$)|\n/);
  return text.slice(a, m === -1 ? text.length : end + m + 1);
}

// Text inside a record that reads as an instruction to a model. The record is still
// examined (a real record can quote such text), but a reviewer must see that it is there.
const INSTRUCTION_MARKERS = [
  ['instruction_like_text', /\b(?:ignore (?:all |any )?(?:previous|prior|above|earlier) instructions|disregard (?:all |the )?(?:previous|prior|above) (?:instructions|text)|you are now (?:a|an|the)\b|new instructions:|system prompt|mark (?:every|all|each) conditions? as (?:pass|passed)|(?:output|return|give) (?:a |the )?(?:verdict|score|approval)|respond only with)|^\s*(?:system|assistant|developer)\s*:/gim],
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
  } else if (end && !/[.!?"'”’)\]:]$/.test(trimmed) && endsIncomplete(trimmed)) {
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

// A final line without closing punctuation is complete when it is a label and value ('Access end: 31 May'),
// a bullet item or a short heading, unless it ends on a word that cannot end a sentence ('the', 'that').
var TRAILING_FUNCTION_WORD = /\b(?:the|a|an|and|or|but|nor|of|to|that|whether|with|for|by|because|if|which|who|whom|whose|in|on|at|from|as|than|into|onto|was|were|is|are|be|been|being|has|have|had|will|would|should|could|can|may|must|not|no|its|their|his|her|our|your|this|these|those|such)$/i;
function endsIncomplete(trimmed) {
  var last = trimmed.slice(trimmed.lastIndexOf('\n') + 1).trim();
  if (TRAILING_FUNCTION_WORD.test(last)) return true;
  if (/^(?:[-*\u2022]\s+)?[A-Z][\w ()\/&'-]{0,40}:\s+\S/.test(last)) return false;
  if (/^[-*\u2022]\s+\S/.test(last)) return false;
  if (last.split(/\s+/).length <= 8) return false;
  return true;
}

function attachmentReferences(text) {
  var out = [], m, re = new RegExp(ATTACHMENT_REF.source, 'gi');
  while ((m = re.exec(text))) {
    var sentence = sentenceAround(text, m.index, m.index + m[0].length);
    if (INLINE_COPY.test(sentence) && !NEGATED_COPY.test(sentence)) continue;
    out.push({ kind: 'omission', code: 'referenced_material_not_in_record', matched: m[0], location: span(text, m.index, m.index + m[0].length) });
  }
  return out;
}

function clearlyAssertions(text) {
  var out = [], m, re = new RegExp(CLEARLY.source, 'gi');
  while ((m = re.exec(text))) {
    var sentenceOpening = !m[1] ? false : /(?:^|[.!?;]\s+|\n)$/.test(text.slice(0, m.index));
    if (!sentenceOpening && m[2] && PRESENTATION.test(m[2])) continue;
    out.push({ kind: 'unsupported_content', code: 'assertion_without_basis', matched: 'clearly', location: span(text, m.index, m.index + 7) });
  }
  return out;
}

function unsupported(text) {
  return scan(text, UNSUPPORTED_MARKERS, 'unsupported_content').filter(function (f) {
    return f.code !== 'off_record_reference' || !REPRODUCED_HERE.test(sentenceAround(text, f.location.start, f.location.end));
  }).concat(clearlyAssertions(text));
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
    .concat(attachmentReferences(text))
    .concat(profileOmissions(text))
    .concat(unsupported(text))
    .concat(scan(text, INSTRUCTION_MARKERS, 'embedded_instruction'));
  report.quotations = quotations(text);
  return report;
}
