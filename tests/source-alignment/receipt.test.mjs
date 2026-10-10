// The integrity receipt and the controlled sources (work package A).
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { t, done, ROOT, IN_REPO, read, json, M } from './_helpers.mjs';

const R = json('tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json');
const S = M.sources.openSources(ROOT);
const handoff = read('docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md');
t('the receipt is classified not public, not a deployment input and not committed', R.classification === 'NOT PUBLIC / NOT DEPLOYMENT INPUT / NOT COMMITTED');
t('the receipt records the owner direction of 2026-10-07 to keep the sources local and untracked', R.owner_direction.date === '2026-10-07' && /stay local and untracked/.test(R.owner_direction.summary));
for (const r of R.sources) {
  const s = S[r.source_id];
  t(r.source_id + ': present locally, byte-identical to the receipt (sha256, bytes and lines)', s.present && s.ok && s.actual_sha256 === r.sha256 && s.bytes === r.bytes && M.sources.lineCount(s) === r.lines, s.problem);
  t(r.source_id + ': the receipt hash equals the value recorded in the 5 October handoff', handoff.includes('`' + r.original_workspace_path.split('/').pop() + '` | `' + r.sha256 + '`') && r.handoff_sha256 === r.sha256);
  t(r.source_id + ': the receipt records path, controlled location, size, date imported and byte identity', r.original_workspace_path.startsWith('project_sources/') && /\(local, untracked\)$/.test(r.controlled_location) && r.byte_identical === true && R.date_imported === '2026-10-07');
  t(r.source_id + ': controlling and historical line ranges cover the file', r.controlling_lines[0] === 1 && r.historical_lines[0] === r.controlling_lines[1] + 1 && r.historical_lines[1] === r.lines);
}
const zip = '/root/.claude/uploads/e62ae7e2-5754-51ff-ae2a-eeaed01e422d/8cca84cd-JRS_October_3_Source_Aligned_Control_Set.zip';
if (existsSync(zip)) t('the delivered archive still has the recorded hash', M.sources.sha256(readFileSync(zip)) === R.delivery.archive_sha256);
for (const r of R.repository_sources) t(r.source_id + ': repository source matches its receipt hash', M.sources.sha256(readFileSync(ROOT + r.path)) === r.sha256);
t('the receipt holds no source text (no field longer than a paraphrase)', JSON.stringify(R).length < 9000);
if (IN_REPO) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  t('no file under project_sources/ is tracked', git('ls-files', 'project_sources') === '');
  t('project_sources/ is excluded from git locally', readFileSync(ROOT + '.git/info/exclude', 'utf8').split('\n').includes('project_sources/'));
  t('no source file appears anywhere in this branch\'s history', git('log', '--oneline', '--', 'project_sources', 'tools/source-alignment/controlled-sources') === '');
  const importing = git('log', '--diff-filter=A', '--format=%H', '--', 'tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json');
  t('the importing commit (the one that added the receipt) is 3b66ed8', importing.startsWith('3b66ed8'), importing);
  const first = git('show', '--name-only', '--format=', importing).split('\n').filter(Boolean).sort().join();
  t('the importing commit holds only the receipt and the control-set note', first === 'docs/architecture/SOURCE_ALIGNED_CONTROL_SET_2026-10-03.md,tools/source-alignment/SOURCE_INTEGRITY_RECEIPT.json', first);
  const matrixCommit = git('log', '--diff-filter=A', '--format=%H', '--', 'tools/source-alignment/CONTROL_EXTRACTION_MATRIX.json');
  t('the matrix was committed after the receipt', matrixCommit && git('merge-base', '--is-ancestor', importing, matrixCommit) === '' );
}
done();
