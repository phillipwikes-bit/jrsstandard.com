// Scanner accuracy on synthetic public pages, the repository gate, and proof that every proposed
// repair resolves the findings it claims to. Synthetic pages are written to a temporary directory
// and are never real pages.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, REGISTER, scan, repairs, scanCli, scanSynthetic, read, exists } from './_helpers.mjs';

// [statement, expected disposition] inserted into a synthetic public page, one at a time.
export const PROHIBITED_STATEMENTS = [
  ['The panel reached 83.9% reliability.', 'UNSUPPORTED', 'detection labelled reliability'],
  ['Three AI vendors were 85.3 percent accurate across 61 recorded runs of raw agreement, 66.7 to 93.3 percent.', 'UNSUPPORTED', 'cross-model agreement labelled accuracy'],
  ['Reviewers detected unsupported records at 83.9% accuracy on real records (16 reviewers).', 'UNSUPPORTED', 'constructed result presented as real-world'],
  ['The Review Engine is backed by the 83.9% detection accuracy of our research.', 'UNSUPPORTED', 'research transferred to the Engine'],
  ['Our Review Engine is in production use for enterprise clients.', 'UNSUPPORTED', 'local development presented as production'],
  ['The JRS Review Engine is licensing-ready and sale-ready.', 'UNSUPPORTED', 'licensing-ready or sale-ready status'],
  ['JRS is a validated standard.', 'UNSUPPORTED', 'methodology presented as validated'],
  ['The Engine is compliant with the EU AI Act.', 'UNSUPPORTED', 'compliance claim'],
  ['JRS is available for licensing to platform providers.', 'UNSUPPORTED', 'licensing offer'],
  ['Panel accuracy was 88.4% on the 24-record constructed corpus with 16 reviewers.', 'UNSUPPORTED', 'a changed figure no claim owns'],
  ['The Review Engine reflects the reliability shown in our research.', 'UNSUPPORTED', 'research reliability transferred to the Engine, with no figure'],
  ['Every candidate quotation occurs in the record, so the Review Engine findings are semantically correct.', 'UNSUPPORTED', 'source grounding presented as semantic validation'],
  ['Across 37 runs, agreement ranged from 66.7 to 93.3 percent, mean 85.3 percent; this is raw agreement.', 'UNSUPPORTED', 'a denominator swapped between windows'],
  ['16 reviewers reached 83.9% accuracy against a verified key.', 'REQUIRES_REPAIR', 'the constructed-corpus qualifier dropped'],
  ['Gwet\'s AC1 was 0.739 for experts and 0.623 for trained reviewers.', 'REQUIRES_REPAIR', 'the ten-record sample and failed criterion dropped'],
  ['Raw agreement across three models ranged from 66.7 to 93.3 percent, mean 85.3 percent.', 'REQUIRES_REPAIR', 'the 61-run denominator dropped'],
  ['The range is 82.2 to 93.3 percent across 37 runs at the full 15-record set, raw agreement.', 'REQUIRES_REPAIR', 'the 37-run window date dropped'],
  ['Latest cross-model agreement: 86.7%.', 'REQUIRES_REPAIR', 'a historical figure presented as current'],
  ['All five conditions separate a reconstructable record from an unreconstructable one at p between 1.0e-08 and 1.5e-11.', 'REQUIRES_REPAIR', 'a circular association presented as discrimination'],
];
const dispositionsOf = (html) => scanSynthetic('<p>' + html + '</p>').findings.map((f) => f.disposition);
for (const [s, expected, what] of PROHIBITED_STATEMENTS) {
  const r = scanSynthetic('<p>' + s + '</p>');
  t('synthetic page rejects ' + what + ' (' + expected + ', gate fails)', r.findings.some((f) => f.disposition === expected) && r.gate.unproposed > 0, r.findings.map((f) => f.disposition + ': ' + f.reasons.join('; ')).join(' | '));
}

// ---- permitted forms --------------------------------------------------------------------------------------
const PERMITTED = [
  'On a constructed 24-record corpus, 16 reviewers matched the reference classification at a mean accuracy of 83.9 percent (95 percent CI 72.7 to 95.1, participant level; 384 graded reads).',
  'In a separate sample of 10 records, Gwet\'s AC1 was 0.739 and 0.623, and the pre-registered criterion was not met.',
  'Across 61 recorded runs between 12 June and 21 August 2026, raw agreement across three models ranged from 66.7 to 93.3 percent, mean 85.3 percent.',
  'The 83.9 percent figure is not a reliability measure.',
  'The research does not validate the Review Engine.',
  'The Review Engine is not production-ready and is not validated.',
  'No licensing, sale or acquisition pathway is offered for JRS.',
  'Earlier versions of this work placed 0.739 in the substantial band.',
];
for (const s of PERMITTED) { const d = dispositionsOf(s); t('synthetic page permits: "' + s.slice(0, 70) + '"', d.every((x) => ['PERMITTED', 'HISTORICAL'].includes(x)), d.join(',')); }
t('a historical section heading places its figures as history', dispositionsOf('</p><h2>Historical data flow</h2><p>Record text was truncated to 8,000 characters and kept for 90 days.').every((x) => x === 'HISTORICAL'));
t('an illustrative example places its figures as an illustration', dispositionsOf('</p><h3>Audit Sampling Example</h3><p>Finding: 8 of 12 records contained pattern conduct claims.').every((x) => x === 'PERMITTED'));
t('a short page that merely mentions "closed" is not a historical stub unless it is noindex', dispositionsOf('The JRS Review Engine is licensing-ready; the old enquiry route is closed.').includes('UNSUPPORTED'));
t('an unrecorded figure with no context is UNSUPPORTED, never ignored', dispositionsOf('Reviewers flagged 42 records as unsupported.').includes('UNSUPPORTED'));
t('a NOT_ASSESSED claim is reported as AMBIGUOUS, not passed', dispositionsOf('First gaps visible in 1-3 records.').includes('AMBIGUOUS'));
t('every finding reports file, line, text, claim, status, missing qualifiers and disposition', (() => { const f = scanSynthetic('<p>16 reviewers reached 83.9% accuracy against a verified key.</p>').findings[0]; return ['file', 'line', 'text', 'claim_ids', 'missing_qualifiers', 'disposition', 'reasons', 'proposed_replacement'].every((k) => k in f) && f.claim_ids.includes('CL-001') && f.missing_qualifiers.includes('constructed corpus'); })());

// ---- route prose and scope ---------------------------------------------------------------------------------
const prose = scan.routeProse("// 83.9% in a comment is not public\nconst css = 'width:100%;padding:5px';\nreturn json({ note: 'The panel reached 83.9% reliability on records.' });");
t('route scanning reads prose string literals only: no comments, no CSS', !/comment/.test(prose) && !/width/.test(prose) && /83\.9% reliability/.test(prose));
const scope = scan.scopeFiles(ROOT);
t('restricted surfaces (CLAUDE.md 36.3) are excluded from the scan and never quoted', [...scan.RESTRICTED].every((f) => !scope.pages.includes(f) && !scope.routes.includes(f)));
t('the scan covers public pages, public routes and readable public downloads', scope.pages.length >= 60 && scope.routes.length >= 40 && scope.downloads.includes('openapi.json'));
t('PDFs are listed as not text-readable rather than silently passed', scope.unreadable.includes('JRS_Reliability_Accuracy.pdf'));

// ---- the repository gate and the proposals ------------------------------------------------------------------
const r = scanCli.runScan(ROOT);
t('every UNSUPPORTED or REQUIRES_REPAIR public finding has a proposed repair', r.gate.unproposed === 0, r.findings.filter((f) => !scan.REPORT_ONLY.includes(f.group) && ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition) && !f.repair_id).map((f) => f.file + ':' + f.line).join(', '));
t('no proposal is stale (each target sentence exists and each proposal resolves a finding)', r.gate.stale_proposals.length === 0, r.gate.stale_proposals.join(','));
t('documentation drift: committed scan results and repair proposals equal a fresh scan', Object.entries(scanCli.outputs(r)).every(([p, text]) => exists(p) && read(p) === text));
// Apply each proposal to the page's sentences in memory and re-classify: its findings must clear.
for (const p of repairs.REPAIRS) {
  const raw = readFileSync(join(ROOT, p.file), 'utf8');
  const sents = scan.sentencesOf(raw, 'html');
  const idx = sents.findIndex((x) => x.text === p.target);
  const fixed = sents.map((x, i) => (i === idx ? { ...x, text: p.replacement } : x));
  const after = fixed.map((_, i) => scan.classify(fixed, i, REGISTER.claims)).filter(Boolean);
  const still = repairs.resolvedBy(p).map((txt) => (txt === p.target ? p.replacement : txt)).filter((txt) => after.some((f) => f.text === txt && ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition)));
  t(p.id + ' resolves its findings when applied (' + p.file + ')', idx >= 0 && still.length === 0, still.join(' | '));
  t(p.id + ' changes no figure: every number in the target survives in the replacement', (p.target.match(/\d+(\.\d+)?/g) || []).every((n) => p.replacement.includes(n)) || p.id === 'PR-05');
}
t('PR-05 removes the circular p-values rather than altering them', !/1\.0e-08|1\.5e-11/.test(repairs.REPAIRS.find((p) => p.id === 'PR-05').replacement));
for (const m of repairs.MANUAL_FINDINGS) t(m.id + ' manual finding is bound to the current file hash (a changed file reopens it)', (await import('node:crypto')).createHash('sha256').update(readFileSync(join(ROOT, m.file))).digest('hex') === m.sha256);
done();
