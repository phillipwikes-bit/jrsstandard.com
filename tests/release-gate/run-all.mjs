// The internal release-gate suite in one command. Local only: no provider, no network.
//   node tests/release-gate/run-all.mjs           every suite, then the mutation run
//   node tests/release-gate/run-all.mjs --quick   without the mutation run
import { execFileSync } from 'node:child_process';

export const SUITES = ['validator.test.mjs', 'evidence-classes.test.mjs', 'report.test.mjs', 'cli.test.mjs'];
const files = process.argv.includes('--quick') || process.env.JRS_RG_MUTATION_CHILD ? SUITES : SUITES.concat(['mutation/run-mutations.mjs']);
let failed = 0;
for (const f of files) {
  try {
    const out = execFileSync(process.execPath, [new URL(f, import.meta.url).pathname], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
    console.log(`${f}: ${out.trim().split('\n').pop()}`);
  } catch (e) {
    failed++;
    console.log(`${f}: FAILED\n${String(e.stdout || '').split('\n').filter((l) => /^FAIL/.test(l)).slice(0, 8).join('\n')}`);
  }
}
console.log(failed ? `\n${failed} of ${files.length} suites FAILED` : `\nall ${files.length} suites passed`);
process.exit(failed ? 1 : 0);
