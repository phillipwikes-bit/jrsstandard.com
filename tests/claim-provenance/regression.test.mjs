// Public-claim regression control for the repairs implemented on 2026-10-06. Each repaired page is
// restored from the pre-repair commit (38ca6fb) into a throwaway site: the scanner and the
// regression gate must reject it. Then every repaired claim category is reintroduced into a
// synthetic page and must be rejected. No real page is modified.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { t, done, ROOT, REPO, REGISTER, scan, repairs, scanSynthetic, read, exists } from './_helpers.mjs';

const PRE_REPAIR = '38ca6fb';
const files = [...new Set(repairs.REPAIRS.map((r) => r.file))];
const site = mkdtempSync(join(tmpdir(), 'jrs-cp-regress-'));
for (const f of files) { mkdirSync(dirname(join(site, f)), { recursive: true }); writeFileSync(join(site, f), execFileSync('git', ['show', PRE_REPAIR + ':' + f], { cwd: REPO })); }
const before = scan.scanRepository(site, REGISTER.claims, repairs.REPAIRS);
rmSync(site, { recursive: true, force: true });
const withTarget = repairs.REPAIRS.filter((r) => r.target).map((r) => r.id);
t('restoring the pre-repair pages trips the regression gate for every repair that replaced wording', withTarget.every((id) => before.gate.regressions.some((g) => g.startsWith(id + ' '))), withTarget.filter((id) => !before.gate.regressions.some((g) => g.startsWith(id + ' '))).join(','));
t('restoring the pre-repair pages brings back public findings the gate rejects', before.findings.filter((f) => ['REQUIRES_REPAIR', 'UNSUPPORTED', 'AMBIGUOUS'].includes(f.disposition)).length >= 28);

// A repaired page that keeps its new wording but gets the old wording back must also be rejected.
const r04 = repairs.REPAIRS.find((r) => r.id === 'PR-04');
const site2 = mkdtempSync(join(tmpdir(), 'jrs-cp-regress2-'));
writeFileSync(join(site2, r04.file), read(r04.file).replace('</main>', '<p>' + r04.target + '</p></main>'));
const both = scan.scanRepository(site2, REGISTER.claims, repairs.REPAIRS);
rmSync(site2, { recursive: true, force: true });
t('the gate rejects a repaired page whose old wording returns beside the new wording', both.gate.regressions.some((g) => g.startsWith('PR-04 ')));

// ---- each repaired category, reintroduced into a synthetic page --------------------------------------
const REINTRODUCED = [
  ['an unqualified constructed-record finding', 'Panel detection 83.9% against a verified key, 16 independent reviewers.'],
  ['detection presented as reliability', 'The detection panel reached 83.9% reliability on the constructed corpus.'],
  ['cross-model agreement presented as accuracy', 'Across 61 recorded runs, the three models were 85.3 percent accurate, raw agreement 66.7 to 93.3 percent.'],
  ['a stale run count or ambiguous window', 'The range is 82.2 to 93.3 percent across 37 runs at the full 15-record set, raw agreement.'],
  ['a 61-run range without its denominator', 'Raw agreement across three models ranged from 66.7 to 93.3 percent, mean 85.3 percent.'],
  ['an Engine-validation claim based on JRS research', 'The Review Engine is backed by the 83.9% detection accuracy of the JRS research.'],
  ['outdated methods-paper wording without supersession context', 'The findings support reproducible application and substantial inter-rater reliability.'],
  ['superseded population labels without the criterion', 'Gwet\'s AC1 was 0.739 among experts and 0.623 among trained reviewers.'],
  ['production language', 'The Review Engine is in production use.'],
  ['licensing or sale language', 'The JRS Review Engine is licensing-ready and sale-ready.'],
  ['compliance language', 'The Review Engine is compliant with the EU AI Act.'],
  ['defensibility language', 'The Review Engine makes every record defensible.'],
  ['circular p-values presented as evidence', 'All five conditions separate a reconstructable record from an unreconstructable one at p between 1.0e-08 and 1.5e-11.'],
  ['a Study 014 reader presented as a person', 'On 29 of those texts, a reader given only the summary answered 77% of masked factual questions correctly, against 97% from the original.'],
];
for (const [what, s] of REINTRODUCED) {
  const r = scanSynthetic('<p>' + s + '</p>');
  t('regression: rejects ' + what, r.gate.unproposed > 0, r.findings.map((f) => f.disposition + ': ' + f.reasons.join('; ')).join(' | '));
}

// ---- the methods paper is reachable only through its supersession notice ---------------------------------
const pages = scan.scopeFiles(ROOT).pages;
const linking = pages.filter((p) => /e=accuracy|e=reliability|JRS_Reliability_Accuracy\.pdf/.test(read(p)));
t('only the supersession notice links to the archived methods paper', linking.length === 1 && linking[0] === 'methods-paper-notice.html', linking.join(', '));
const notice = exists('methods-paper-notice.html') ? read('methods-paper-notice.html') : '';
t('the notice names the paper as an earlier draft, says what was superseded, and links to the current research', /earlier draft methods paper/.test(notice) && /superseded or clarified/.test(notice) && /href="research\.html"/.test(notice) && /href="research-summary\.html"/.test(notice));
t('the notice keeps archival access through the existing download route', /href="\/api\/dl\?e=accuracy&amp;src=notice"/.test(notice) && /accuracy:\s*'JRS_Reliability_Accuracy\.pdf'/.test(read('api/dl.js')));
t('the notice makes no publication-status claim', !/\b(peer[- ]reviewed|published in|accepted|preprint|journal)\b/i.test(notice.replace(/<script[\s\S]*?<\/script>/g, '')));
t('research.html and research-summary.html lead to the notice, not to the PDF', /href="methods-paper-notice\.html"/.test(read('research.html')) && /href="methods-paper-notice\.html"/.test(read('research-summary.html')));
t('the archived PDF is unchanged', (await import('node:crypto')).createHash('sha256').update(readFileSync(join(ROOT, 'JRS_Reliability_Accuracy.pdf'))).digest('hex') === repairs.MANUAL_FINDINGS[0].sha256);

// ---- the repaired claims carry their repair in the register ----------------------------------------------
const cl = (id) => REGISTER.claims.find((c) => c.claim_id === id);
t('no claim remains REQUIRES_WORDING_REPAIR', REGISTER.claims.every((c) => c.status !== 'REQUIRES_WORDING_REPAIR'));
t('retired and historical claims are kept, with their repair recorded', cl('CL-011').status === 'RETIRED' && cl('CL-025').status === 'RETIRED' && cl('CL-033').status === 'HISTORICAL_ONLY' && [cl('CL-011'), cl('CL-025'), cl('CL-033')].every((c) => c.review_history.length >= 2));
t('every repaired claim names its repaired pages in its review history', ['CL-001', 'CL-004', 'CL-005', 'CL-006', 'CL-032', 'CL-013'].every((id) => cl(id).review_history.some((h) => /repaired/.test(h.change) && /\.html/.test(h.change))));
done();
