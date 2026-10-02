// Clean-install test: unpack the built tarball into an empty temporary folder
// and run it there, exactly as a licensee would. No network call is made.
// Usage: node test-clean-install.mjs <path/to/jrs-eval-*.tar.gz>

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tarball = path.resolve(process.argv[2] || '');
if (!fs.existsSync(tarball)) { console.error('usage: node test-clean-install.mjs <tarball>'); process.exit(4); }
let passed = 0, failed = 0;
const check = (name, ok, detail) => { ok ? passed++ : failed++; console.log((ok ? 'PASS  ' : 'FAIL  ') + name + (ok || !detail ? '' : '  ' + detail)); };
const env = Object.assign({}, process.env); delete env.ANTHROPIC_API_KEY;
const run = (cmd, args, cwd, extraEnv) => spawnSync(cmd, args, { cwd, env: Object.assign({}, env, extraEnv || {}), encoding: 'utf8' });

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jrs-clean-'));
check('tarball unpacks', run('tar', ['-xzf', tarball, '-C', root]).status === 0);
const dir = path.join(root, fs.readdirSync(root)[0]);
check('every file matches SHA256SUMS.txt', run('sha256sum', ['-c', '--quiet', 'SHA256SUMS.txt'], dir).status === 0);

const t = run('node', ['tools/test-run-smoke.mjs'], dir);
check('packaged offline tests pass from the clean folder', t.status === 0, (t.stdout || '').trim().split('\n').pop());

const ep = run('node', ['--input-type=module', '-e', "import('./tools/run-smoke.mjs').then(m=>console.log(m.ENGINE_PATH))"], dir);
check('runner loads the packaged Engine, not a repository copy', (ep.stdout || '').trim() === path.join(dir, 'engine/api/review-engine.js'), (ep.stdout || '').trim());

const nokey = run('node', ['tools/run-smoke.mjs', '--live', '--out', 'runs/x1'], dir);
check('live run without a key blocks with exit 3', nokey.status === 3 && /provider_key_absent/.test(nokey.stdout), nokey.stdout);

fs.copyFileSync(path.join(dir, 'entitlement.example.json'), path.join(dir, 'entitlement.json'));
const tmpl = run('node', ['tools/run-smoke.mjs', '--live', '--out', 'runs/x2', '--entitlement', 'entitlement.json'], dir, { ANTHROPIC_API_KEY: 'not-a-real-key' });
check('unfilled entitlement blocks with exit 3 before any call', tmpl.status === 3 && /entitlement_not_filled_in/.test(tmpl.stdout), tmpl.stdout);

const big = path.join(root, 'records'); fs.mkdirSync(big); fs.writeFileSync(path.join(big, 'long.txt'), 'x'.repeat(8001));
const over = run('node', ['tools/run-smoke.mjs', '--live', '--out', 'runs/x3', '--records', big], dir, { ANTHROPIC_API_KEY: 'not-a-real-key' });
check('over-length customer record blocks with exit 3 before any call', over.status === 3 && /input_out_of_bounds/.test(over.stdout), over.stdout);

check('no ledger was written by blocked runs', !fs.existsSync(path.join(dir, 'ledger.json')));
check('package contains no environment or key file', !fs.readdirSync(dir).some((f) => /^\.env|key/i.test(f)));
console.log('\n' + passed + ' checks, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
