// Release-gate CLI: exit codes and outputs, on the real record and on broken copies in a scratch dir.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { t, done, LIB, RECORD_PATH, REPORT_PATH, currentRecord } from './_helpers.mjs';

const CLI = LIB + 'cli.mjs';
const run = (...args) => { try { return { code: 0, out: execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status, out: String(e.stdout || '') + String(e.stderr || '') }; } };
const dir = mkdtempSync(join(tmpdir(), 'jrs-rg-cli-'));
try {
  const ok = run('validate', RECORD_PATH, '--expect-engine-version', '0.5.0-local.1');
  t('validate: the current record exits 0 and reports INCOMPLETE_GATES_OPEN', ok.code === 0 && /CONCLUSION  INCOMPLETE_GATES_OPEN/.test(ok.out));
  t('validate: missing evidence is listed', /MISSING EVIDENCE \(\d+\)/.test(ok.out) && /RG-3\.1: No counsel memo/.test(ok.out));
  t('validate: a wrong expected Engine version exits 1', run('validate', RECORD_PATH, '--expect-engine-version', '9.9.9').code === 1);
  const bad = currentRecord(); bad.gates[0].status = 'VALIDATED';
  writeFileSync(join(dir, 'bad.json'), JSON.stringify(bad));
  const b = run('validate', join(dir, 'bad.json'));
  t('validate: an invalid record exits 1 and names the error', b.code === 1 && /INVALID/.test(b.out) && /VALIDATED/.test(b.out));
  writeFileSync(join(dir, 'garbage.json'), '{not json');
  t('validate: unreadable JSON exits 1', run('validate', join(dir, 'garbage.json')).code === 1);
  t('check: the committed report is current', run('check', RECORD_PATH, REPORT_PATH).code === 0);
  writeFileSync(join(dir, 'stale.md'), readFileSync(REPORT_PATH, 'utf8') + '\nhand edit\n');
  t('check: a hand-edited report exits 1', run('check', RECORD_PATH, join(dir, 'stale.md')).code === 1);
  const r = run('report', RECORD_PATH, join(dir, 'out.md'));
  t('report: writes the same bytes as the committed report', r.code === 0 && readFileSync(join(dir, 'out.md'), 'utf8') === readFileSync(REPORT_PATH, 'utf8'));
  t('an unknown command exits 1', run('approve', RECORD_PATH).code === 1);
} finally { rmSync(dir, { recursive: true, force: true }); }
done();
