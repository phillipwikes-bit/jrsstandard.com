// The local reviewer workspace suite in one command. Local only: loopback server, synthetic packets.
//   node tests/local-reviewer-workspace/run-all.mjs           every suite, then the mutation run
//   node tests/local-reviewer-workspace/run-all.mjs --quick   without the mutation run
import { execFileSync } from 'node:child_process';

export const SUITES = ['core.test.mjs', 'server.test.mjs', 'static.test.mjs', 'cli.test.mjs', 'browser.test.mjs'];
const files = process.argv.includes('--quick') || process.env.JRS_RW_MUTATION_CHILD ? SUITES : SUITES.concat(['mutation/run-mutations.mjs']);
let failed = 0;
for (const f of files) {
  try {
    const out = execFileSync(process.execPath, [new URL(f, import.meta.url).pathname], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: process.env, timeout: 600000 });
    const last = out.trim().split('\n').pop();
    console.log(`${f}: ${last}`);
    if (/skipped/.test(last)) console.log('  NOTE: some checks were SKIPPED, not passed.');
  } catch (e) {
    failed++;
    console.log(`${f}: FAILED\n${String(e.stdout || '').split('\n').filter((l) => /^FAIL/.test(l)).slice(0, 8).join('\n') || String(e.stderr || '').split('\n').slice(0, 4).join('\n')}`);
  }
}
console.log(failed ? `\n${failed} of ${files.length} suites FAILED` : `\nall ${files.length} suites passed`);
process.exit(failed ? 1 : 0);
