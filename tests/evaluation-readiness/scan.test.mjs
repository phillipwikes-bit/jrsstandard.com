// The repository scan for evaluation source text (verifier section H), on the repository and on
// throwaway synthetic directories.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { t, done, ROOT, IN_REPO, M } from './_helpers.mjs';
import { materialHash } from '../../lib/engine-candidate/dev-material.js';
const S = M.scan;
if (IN_REPO) {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const r = S.scanRepository(ROOT, tracked);
  t('no tracked file (' + tracked.length + ') carries evaluation source text by any scanned sign', r.ok, JSON.stringify(r.findings.slice(0, 3)));
}
const tmp = mkdtempSync(join(tmpdir(), 'jrs-er-scan-'));
const put = (p, body) => { mkdirSync(join(tmp, p, '..'), { recursive: true }); writeFileSync(join(tmp, p), body); return p; };
const para = 'SYNTHETIC-PROBE paragraph standing in for a future evaluation record, long enough to be hashed as a paragraph.';
const files = [put('docs/ok.md', 'nothing here'), put('data/evaluation-inputs/rec.json', '{}'), put('notes/x.record.txt', 'x'), put('notes/marked.md', 'line ' + S.EVALUATION_SOURCE_MARKER + ' line'),
  put('notes/pasted.md', 'intro\n\n' + para + '\n\nend'), put('tools/evaluation-readiness/bad.json', JSON.stringify({ a: { record_text: 'x' } }))];
const r = S.scanRepository(tmp, files, { declaredDigests: [materialHash(para)] });
const by = (c) => r.findings.filter((f) => f.control === c).map((f) => f.file);
t('SCAN-01 names a file in a reserved evaluation-input location', by('SCAN-01').includes('data/evaluation-inputs/rec.json') && by('SCAN-01').includes('notes/x.record.txt'));
t('SCAN-02 names a file carrying the evaluation-source marker', by('SCAN-02').join() === 'notes/marked.md');
t('SCAN-03 names a file whose paragraph matches a declared input digest', by('SCAN-03').join() === 'notes/pasted.md');
t('SCAN-04 names a package artifact carrying a record-text field', by('SCAN-04').join() === 'tools/evaluation-readiness/bad.json');
t('a clean file is not reported', !r.findings.some((f) => f.file === 'docs/ok.md'));
t('every finding names its owning control', r.findings.every((f) => /^SCAN-0[1-4]$/.test(f.control) && f.message));
t('without a declared digest, a pasted record without the marker is not detectable (documented limit)', S.scanRepository(tmp, ['notes/pasted.md']).ok);
t('a file name that merely contains "holdout" is not mistaken for a reserved directory', S.scanRepository(tmp, [put('tools/score-engine-holdout.mjs', 'x')]).ok);
t('the scan module does not carry the marker it searches for', !String(S.EVALUATION_SOURCE_MARKER).length || !(() => { try { return execFileSync('grep', ['-c', S.EVALUATION_SOURCE_MARKER, join(ROOT, 'tools/evaluation-readiness/lib/scan.js')], { encoding: 'utf8' }).trim() !== '0'; } catch { return false; } })());
rmSync(tmp, { recursive: true, force: true });
done();
