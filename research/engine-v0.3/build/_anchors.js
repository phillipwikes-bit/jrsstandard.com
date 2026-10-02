// JRS anchor profile (Engine 0.3.0-validation). Deterministic; no model involved.
//
// A JavaScript port of the DRR Test Suite v0.9 extractor (research/drr-suite-v0.9/lib/anchors_v12.py):
// dates and attributions follow anchors_v10.py, record citations and quotations follow anchors_v12.py.
// Parity with the Python is tested by research/study-014-drr/tools/test_anchor_parity.mjs.
//
// INFORMATIONAL ONLY. The counts are reported to the caller and never set a flag, change a condition
// or change the determination. The speaker pattern recognizes role labels used in federal-sector
// decisions (Complainant, S1, RMO2, Supervisor and similar), so a record that names people would
// count zero attributed speakers even when every statement is attributed. Treating a zero as a gap
// would therefore raise false alarms on ordinary records.

var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'];
var MON = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan\\.|Feb\\.|Mar\\.|Apr\\.|Jun\\.|Jul\\.|Aug\\.|Sept?\\.|Oct\\.|Nov\\.|Dec\\.)';
var ROLE = '(Complainant|Petitioner|the Agency|Agency|S\\d{1,2}|RMO\\s?\\d{0,2}|RMO|CW\\s?\\d{1,2}|C\\d{1,2}|Witness\\s?\\d{1,2}|W\\d{1,2}|' +
  'Supervisor\\s?\\d{1,2}|Supervisor|Manager\\s?\\d{1,2}|Manager|Coworker\\s?\\d{1,2}|Coworker|Director|Chief|' +
  'Specialist\\s?\\d{1,2}|Official\\s?\\d{1,2}|Investigator|Selecting Official|SO\\d{0,2}|HR\\s?\\d{0,2})';
var VERB = '(stated|states|averred|avers|testified|asserted|asserts|alleged|alleges|denied|denies|explained|explains|maintained|maintains|indicated|indicates|affirmed|affirms|contended|contends|claimed|claims|noted|notes|reported|reports|attested|attests|recalled|recalls|acknowledged|acknowledges|confirmed|confirms|averred)';
var SEP = '(?:[ \\t]*[,;][ \\t]*(?:and[ \\t]+)?|[ \\t]+and[ \\t]+|[ \\t]*\\()';
var CIT_KIND = '(Report of Investigation[ \\t]*\\(ROI\\)|ROI\\d?|IR|Report of Investigation|Exhibit|Ex\\.|Tab|Id\\.)';
var CIT_REF = '((?:[A-Z]?\\d+[A-Za-z]?(?:[ \\t]*[-–][ \\t]*\\d+)?)(?:' + SEP + '\\d+(?:[ \\t]*[-–][ \\t]*\\d+)?)*|[A-Z])\\b';
var MARKS = '"“”';

function mon(m) {
  m = m.toLowerCase().replace(/\.$/, '');
  for (var i = 0; i < MONTHS.length; i++) if (MONTHS[i].indexOf(m.slice(0, 3)) === 0) return i + 1;
  return 0;
}
function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

function dates(text) {
  var out = new Set(), spans = [], m;
  var mdy = new RegExp(MON + '\\s+(\\d{1,2}),?\\s+(\\d{4})', 'g');
  while ((m = mdy.exec(text))) {
    out.add(pad(+m[3], 4) + '-' + pad(mon(m[1]), 2) + '-' + pad(+m[2], 2));
    spans.push([m.index, m.index + m[0].length]);
  }
  var my = new RegExp(MON + '\\s+(\\d{4})', 'g');
  while ((m = my.exec(text))) {
    var s = m.index;
    if (spans.some(function (sp) { return sp[0] <= s && s < sp[1]; })) continue;
    out.add(pad(+m[2], 4) + '-' + pad(mon(m[1]), 2));
  }
  var num = /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g;
  while ((m = num.exec(text))) {
    var y = +m[3]; if (y < 100) y += 2000;
    var mo = +m[1], d = +m[2];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) out.add(pad(y, 4) + '-' + pad(mo, 2) + '-' + pad(d, 2));
  }
  return out;
}

function citations(text) {
  var out = new Set(), m;
  var re = new RegExp('\\b' + CIT_KIND + '(?![A-Za-z0-9])\\)?[ \\t]*,?[ \\t]*(?:at[ \\t]*)?(?:pp?\\.[ \\t]*)?' + CIT_REF, 'g');
  while ((m = re.exec(text))) {
    var kind = m[1].toLowerCase().replace(/\.$/, '');
    if (kind.indexOf('report of investigation') === 0 || /^(roi\d?|id)$/.test(kind)) kind = 'roi';
    if (kind === 'ex') kind = 'exhibit';
    var ref = m[2];
    if (/^[A-Z]$/.test(ref)) { out.add(kind + ':' + ref); continue; }
    ref.split(new RegExp(SEP)).forEach(function (part) {
      var f = part.trim().match(/^[A-Z]?\d+/);
      if (f) out.add(kind + ':' + (f[0].replace(/^0+/, '') || '0'));
    });
  }
  return out;
}

function attributions(text) {
  var out = new Set(), m;
  var re = new RegExp('\\b' + ROLE + '\\b[^.;:]{0,40}?\\b' + VERB + '\\b', 'g');
  while ((m = re.exec(text))) {
    var r = m[1].replace(/\s+/g, '').toLowerCase();
    out.add(r === 'theagency' ? 'agency' : r);
  }
  return out;
}

function qnorm(q) { return q.toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim(); }

function quotes(text) {
  var pos = [], out = new Set();
  for (var i = 0; i < text.length; i++) if (MARKS.indexOf(text[i]) !== -1) pos.push(i);
  var k = 0;
  while (k < pos.length - 1) {
    var o = pos[k], c = pos[k + 1], body = text.slice(o + 1, c);
    if (text[o] === '”' || text[c] === '“' || !body || /^\s/.test(body) || body.length > 400) { k += 1; continue; }
    if (body.trim().split(/\s+/).length >= 3) out.add(qnorm(body));
    k += 2;
  }
  return out;
}

export function anchorProfile(text) {
  return {
    dates: dates(text).size,
    record_citations: citations(text).size,
    attributed_speakers: attributions(text).size,
    quotations: quotes(text).size,
    basis: 'deterministic pattern count; informational only; role-label speakers only',
  };
}

export const _internal = { dates: dates, citations: citations, attributions: attributions, quotes: quotes };
