// The complete local candidate suite, in one command. Mocked only: no provider, no network.
//   node tests/engine-candidate/run-all.mjs           every suite, the regression set, the corpus evaluation, then the mutation run
//   node tests/engine-candidate/run-all.mjs --quick   the same without the mutation run
import { execFileSync } from 'node:child_process';

export const SUITES = [
  'source-prep.test.mjs', 'adapter.test.mjs', 'contract.test.mjs', 'candidate.test.mjs', 'harness.test.mjs',
  'privacy.test.mjs', 'manifest-compat.test.mjs', 'dev-material.test.mjs', 'regression/run.mjs', 'eval/run-eval.mjs',
];
const files = process.argv.includes('--quick') || process.env.JRS_MUTATION_CHILD ? SUITES : SUITES.concat(['mutation/run-mutations.mjs']);
let failed = 0;
for (const f of files) {
  try {
    const out = execFileSync(process.execPath, [new URL(f, import.meta.url).pathname], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    console.log(`${f}: ${out.trim().split('\n').pop()}`);
  } catch (e) {
    failed++;
    const lines = String(e.stdout || '').split('\n');
    console.log(`${f}: FAILED\n${lines.filter((l) => /^(FAIL|NEW|CHANGED|RECORDED|        )/.test(l)).slice(0, 12).join('\n') || lines.slice(-3).join('\n')}`);
  }
}
console.log(failed ? `\n${failed} of ${files.length} suites FAILED` : `\nall ${files.length} suites passed`);
process.exit(failed ? 1 : 0);
