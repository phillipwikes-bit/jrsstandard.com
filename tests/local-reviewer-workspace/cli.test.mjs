// verify-export.mjs: accepts a genuine export, rejects altered, cross-version and malformed ones.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { t, done, DIR, C, P, clone, signedSession } from './_helpers.mjs';

const dir = mkdtempSync(join(tmpdir(), 'jrs-rw-cli-'));
const run = (...a) => { try { return { code: 0, out: execFileSync(process.execPath, [DIR + 'verify-export.mjs', ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status, out: String(e.stdout || '') + String(e.stderr || '') }; } };
const w = (name, obj) => { const p = join(dir, name); writeFileSync(p, typeof obj === 'string' ? obj : JSON.stringify(obj)); return p; };
try {
  const ex = C.buildExport(signedSession(P.gaps));
  const pk = w('packet.json', P.gaps), ok = run(w('ex.json', ex), pk);
  t('verify-export: a genuine export exits 0 and repeats the limitation', ok.code === 0 && /PASS/.test(ok.out) && /does not authenticate the reviewer/.test(ok.out));
  t('verify-export: an export checked against another packet exits 1', run(w('ex.json', ex), w('other.json', P.flaws)).code === 1);
  const alt = clone(ex); alt.dispositions[0].note = 'edited later';
  t('verify-export: an altered export exits 1', run(w('alt.json', alt), pk).code === 1);
  const cross = clone(ex); cross.packet.candidate_version = '0.4.0-local.1'; const { export_digest, ...rest } = cross; cross.export_digest = C.sha256(C.canonicalJson(rest));
  t('verify-export: a cross-version export exits 1 even with a recomputed digest', run(w('cross.json', cross), pk).code === 1);
  t('verify-export: malformed JSON exits 1', run(w('bad.json', '{oops'), pk).code === 1);
  const tampered = clone(P.gaps); tampered.result_digest = 'f'.repeat(64);
  t('verify-export: a tampered packet exits 1', run(w('ex.json', ex), w('tp.json', tampered)).code === 1);
  t('verify-export: missing arguments exit 1', run().code === 1);
} finally { rmSync(dir, { recursive: true, force: true }); }
done();
