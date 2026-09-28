import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'jrs-score-'));
const keys = ['basis_identification', 'reasoning_traceability', 'cold_reviewer_clarity',
  'accountability_support', 'temporal_reconstructability'];
const all = (value) => Object.fromEntries(keys.map((key) => [key, value]));
const base = { protocol_id: 'synthetic-test', locked_at: '2026-09-28T00:00:00Z', cases: [
  { id: 'a', split: 'holdout', reference: { conditions: all('gap'), determination: 'gap_identified' },
    prediction: { conditions: all('gap'), determination: 'gap_identified' } },
  { id: 'b', split: 'holdout', reference: { conditions: all('pass'), determination: 'ready' },
    prediction: { conditions: all('review'), determination: 'review_required' } },
] };
function score(data) {
  const path = join(dir, 'holdout.json');
  writeFileSync(path, JSON.stringify(data));
  return spawnSync(process.execPath, ['tools/score-engine-holdout.mjs', path], { encoding: 'utf8' });
}
try {
  const ok = score(base);
  if (ok.status !== 0) throw new Error(ok.stderr);
  const report = JSON.parse(ok.stdout);
  const gap = report.results.basis_identification.per_label.gap;
  if (report.cases !== 2 || gap.tp !== 1 || gap.tn !== 1 || gap.sensitivity !== 1
    || report.results.routing.confusion_matrix.ready.review_required !== 1) {
    throw new Error('Incorrect confusion counts or rates');
  }
  if (score({ ...base, cases: [...base.cases, base.cases[0]] }).status === 0) throw new Error('Duplicate accepted');
  const missing = structuredClone(base); delete missing.cases[0].reference.conditions.basis_identification;
  if (score(missing).status === 0) throw new Error('Missing reference label accepted');
  const conflict = structuredClone(base); conflict.cases[0].prediction.determination = 'ready';
  if (score(conflict).status === 0) throw new Error('Conflicting route accepted');
  console.log('4 holdout scoring checks passed on synthetic labels; no Engine performance measured.');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
