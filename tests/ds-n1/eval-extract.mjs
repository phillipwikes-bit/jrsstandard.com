// Evaluate DS-N1 extraction against the developer-built fixtures.
//
// For each fixture, only the plain text is given to the extractor: the record
// text and each source's title, version and text. Its hand-built claims, events,
// entities and citations are withheld and used only for comparison. The sealed
// holdout, isolation and stress sets and the practitioner-study records are
// never read.
//
// Reported: claim segmentation agreement, kind agreement, event-date agreement,
// citation-source agreement (where the fixture cites a source), and whether the
// review reaches the same status (READY / HOLD) from the extracted package as
// from the hand-built one. The fixtures contain deliberate defects, including
// wrong citations, so citation disagreement is not always an extraction error.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extractRecord, EXTRACTOR_VERSION } from '../../lib/ds-n1/extract.mjs';
import { openReview, deriveState } from '../../lib/ds-n1/index.mjs';

const dirs = ['fixtures', 'fixtures-partner'];
const rows = [];
for (const d of dirs) {
  const dir = new URL(`./${d}/`, import.meta.url);
  for (const f of readdirSync(dir).filter((x) => /^[A-Z][A-Z0-9-]*\.json$/.test(x) && x !== 'MANIFEST.json').sort()) {
    const hand = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    if (!Array.isArray(hand.claims) || !hand.claims.every((c) => c && typeof c === 'object')) continue;
    const at = '2026-11-24T00:00:00Z';
    let handStatus;
    try { handStatus = deriveState(openReview(hand, { at })).status; } catch (e) { continue; }
    if (!['READY_FOR_HUMAN_FINALIZATION', 'HOLD', 'REVIEW_REQUIRED'].includes(handStatus)) continue;
    const { record, report } = extractRecord({
      record_id: hand.record_id, title: hand.title, record_class: hand.record_class, text: hand.text,
      sources: hand.sources.map((s) => ({ source_id: s.source_id, title: s.title, version: s.version, text: s.text })),
    });
    let exStatus;
    try { exStatus = deriveState(openReview(record, { at })).status; } catch (e) { exStatus = 'ERROR'; }
    const exByQuote = new Map(record.claims.map((c) => [c.quote.trim(), c]));
    let seg = 0, kind = 0, evTotal = 0, evDate = 0, citTotal = 0, citSrc = 0;
    for (const c of hand.claims) {
      const e = exByQuote.get(String(c.quote).trim());
      if (!e) continue;
      seg++;
      if (e.kind === c.kind) kind++;
      if (c.event) { evTotal++; if (e.event && e.event.date === c.event.date) evDate++; }
      if (c.citations && c.citations.length) { citTotal++; if (e.citations.length && e.citations[0].source_id === c.citations[0].source_id) citSrc++; }
    }
    rows.push({ file: `${d}/${f}`, hand_claims: hand.claims.length, extracted_claims: record.claims.length, seg, kind, evTotal, evDate, citTotal, citSrc,
      hand_status: handStatus, extracted_status: exStatus, to_confirm: report.summary.to_confirm });
  }
}
// Every status disagreement, checked by hand on 2026-11-24 against the fixture's
// own source text. "metadata" means the fixture's defect lives only in its
// hand-built citation data (a wrong, missing, misquoted or nonexistent citation,
// or an omitted reasoning field) while the record text is supported by its
// sources; an extractor reading the text has no author citation to get wrong.
const EXPLAINED = {
  'fixtures/D01.json': 'metadata: hand citation points to the wrong source (S1); S2 supports the claim',
  'fixtures/D06.json': 'metadata: hand claim has no citation; S2 supports it',
  'fixtures/D07.json': 'metadata: hand citation names a source (S9) that does not exist; S3 supports the claim',
  'fixtures/D09.json': 'metadata: hand claim C2 has no citation; the instruction-like sentence is still flagged for review',
  'fixtures/D10.json': 'metadata: hand citation misquotes S2; S3 supports the claim',
  'fixtures/D12.json': 'stricter: an unsupported sentence becomes an uncited claim (critical, HOLD) instead of an unmapped-assertion review note',
  'fixtures/D13.json': 'metadata: hand conclusion omits the reasoning the record text states ("Because ...")',
};
for (const r of rows) if (r.hand_status !== r.extracted_status) r.explanation = EXPLAINED[r.file] || 'UNEXPLAINED';
const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
const agree = rows.filter((r) => r.hand_status === r.extracted_status).length;
const out = {
  extractor: EXTRACTOR_VERSION, records: rows.length,
  claim_segmentation: { matched: sum('seg'), of: sum('hand_claims') },
  kind_agreement: { matched: sum('kind'), of: sum('seg') },
  event_date_agreement: { matched: sum('evDate'), of: sum('evTotal') },
  citation_source_agreement: { matched: sum('citSrc'), of: sum('citTotal') },
  status_agreement: { matched: agree, of: rows.length,
    hand_hold_extracted_ready: rows.filter((r) => r.hand_status !== 'READY_FOR_HUMAN_FINALIZATION' && r.extracted_status === 'READY_FOR_HUMAN_FINALIZATION').length,
    hand_ready_extracted_hold: rows.filter((r) => r.hand_status === 'READY_FOR_HUMAN_FINALIZATION' && r.extracted_status !== 'READY_FOR_HUMAN_FINALIZATION').length },
  unexplained_disagreements: rows.filter((r) => r.explanation === 'UNEXPLAINED').map((r) => r.file),
  rows,
};
if (process.argv.includes('--write')) writeFileSync(new URL('./EXTRACT_EVAL.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ ...out, rows: undefined }, null, 2));
for (const r of rows) if (r.hand_status !== r.extracted_status || r.seg < r.hand_claims) console.log(r.file, r.hand_status, '->', r.extracted_status, `seg ${r.seg}/${r.hand_claims}`, `kind ${r.kind}`, `cit ${r.citSrc}/${r.citTotal}`);
