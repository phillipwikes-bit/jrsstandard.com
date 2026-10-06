// Runs every local Engine candidate test file. Mocked only: no provider, no network.
//   node tests/engine-candidate/run-all.mjs
import { execFileSync } from 'node:child_process';

const files = ['source-prep.test.mjs', 'contract.test.mjs', 'candidate.test.mjs', 'dev-material.test.mjs', 'regression/run.mjs'];
let failed = 0;
for (const f of files) {
  try {
    const out = execFileSync(process.execPath, [new URL(f, import.meta.url).pathname], { encoding: 'utf8' });
    console.log(`${f}: ${out.trim().split('\n').pop()}`);
  } catch (e) {
    failed++;
    console.log(`${f}: FAILED\n${String(e.stdout || '').split('\n').filter((l) => l.startsWith('FAIL')).join('\n')}`);
  }
}
process.exit(failed ? 1 : 0);
