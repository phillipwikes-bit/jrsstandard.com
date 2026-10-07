// Runs every frozen demonstration suite, then the mutation run (skipped with --quick, and always
// inside a mutation child). Exit 0 only when every suite passes.
import { execFileSync } from 'node:child_process';
const DIR = new URL('./', import.meta.url).pathname;
const SUITES = ['corpus.test.mjs', 'manifest.test.mjs', 'replay.test.mjs', 'documents.test.mjs', 'viewer.test.mjs', 'browser.test.mjs'];
const quick = process.argv.includes('--quick') || process.env.FD_MUTATION_CHILD;
let failed = 0;
for (const s of SUITES.concat(quick ? [] : ['mutation/run-mutations.mjs'])) {
  try { const out = execFileSync(process.execPath, [DIR + s], { encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 }); console.log(s + ': ' + out.trim().split('\n').pop()); }
  catch (e) { failed++; console.log(s + ': FAILED\n' + String(e.stdout || '').split('\n').filter((l) => /^FAIL/.test(l)).join('\n') + '\n' + String(e.stdout || '').trim().split('\n').pop()); }
}
console.log(failed ? '\n' + failed + ' suite(s) failed' : '\nall frozen demonstration suites passed');
process.exit(failed ? 1 : 0);
