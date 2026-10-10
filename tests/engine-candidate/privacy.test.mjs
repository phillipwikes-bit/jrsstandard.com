// Privacy and isolation controls for the local candidate. Mocked only. Added 2026-10-06.
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { t, done, fixture, net, ROOT, PROFILE, IDS, NOW, cond, reply, rawReply } from './_harness.mjs';
import { runCandidate } from '../../lib/engine-candidate/review-candidate.js';
import { runConsistencyHarness } from '../../lib/engine-candidate/harness.js';
import { recordDisposition, signOff } from '../../lib/engine-candidate/contract.js';

const DIR = join(ROOT, 'lib/engine-candidate');
const MODULES = readdirSync(DIR).filter((f) => f.endsWith('.js'));
const src = (f) => readFileSync(join(DIR, f), 'utf8');
const code = (f) => src(f).replace(/^\s*\/\/.*$/gm, '');
const MARK = 'PRIVACY-CANARY-7f3e9a';
const REF = 'REF-CANARY-41c2';
const RECORD = fixture('SYNTHETIC-SAE-01.txt').replace('Northgate Fabrication Ltd', 'Northgate ' + MARK + ' Ltd');
const input = { text: RECORD, profile: PROFILE, record_ref: REF };
const good = { conditions: cond(), flaws: [{ type: 'reasoning_elision', excerpt: 'section 4 (data retention) was blank', explanation: 'Not resolved.' }] };

// ---- imports: no public handlers, Vercel, Supabase or provider SDKs ----------------------------
const specs = MODULES.flatMap((f) => [...code(f).matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gm)].map((m) => m[1]));
t('candidate modules import only each other and node:crypto', specs.every((s) => /^\.\/[\w-]+\.js$/.test(s) || s === 'node:crypto'), JSON.stringify([...new Set(specs)]));
t('no module reaches outside its own directory (no ../, so no api/ handler can be imported)', specs.every((s) => !s.includes('..')));
t('no Vercel, Supabase, provider SDK or HTTP client is named in any module',
  MODULES.every((f) => !/@vercel|@supabase|supabase|@anthropic-ai|anthropic|openai|@google|generativelanguage|axios|node-fetch|undici|node:https?|node:net|node:tls|node:dns|node:dgram|node:child_process|node:worker_threads/i.test(code(f))));
t('no dynamic import, require, eval or Function constructor', MODULES.every((f) => !/\bimport\s*\(|\brequire\s*\(|\beval\s*\(|new Function\s*\(/.test(code(f))));

// ---- network ---------------------------------------------------------------------------------
t('no fetch, XMLHttpRequest, WebSocket or sendBeacon in any module', MODULES.every((f) => !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/.test(code(f))));
t('no environment read in any module', MODULES.every((f) => !/process\.env|process\.argv|Deno\.env/.test(code(f))));

// ---- disk --------------------------------------------------------------------------------------
t('no file-system, browser-storage or database access in any module',
  MODULES.every((f) => !/node:fs|\bfs\b|writeFile|appendFile|createWriteStream|localStorage|sessionStorage|indexedDB|sqlite|postgres|\bdb\./i.test(code(f))));
const tmpBefore = readdirSync(tmpdir()).sort().join('\n');
const gitBefore = execSync('git status --porcelain --untracked-files=all', { cwd: ROOT }).toString();
const scratch = mkdtempSync(join(tmpdir(), 'jrs-privacy-'));
const cwd = process.cwd(); process.chdir(scratch);

// ---- logs and streams, captured while the candidate and harness run --------------------------------
const captured = [];
const saved = { log: console.log, error: console.error, warn: console.warn, info: console.info, debug: console.debug, out: process.stdout.write, err: process.stderr.write };
for (const k of ['log', 'error', 'warn', 'info', 'debug']) console[k] = (...a) => captured.push(a.map(String).join(' '));
process.stdout.write = (c) => { captured.push(String(c)); return true; };
process.stderr.write = (c) => { captured.push(String(c)); return true; };
const errors = [];
let examined, rejected, partial, harnessRec;
try {
  examined = await runCandidate(input, { adapter: reply(good), now: NOW });
  rejected = await runCandidate(input, { adapter: rawReply('{"broken": ' + JSON.stringify(RECORD.slice(0, 80))), now: NOW });
  partial = await runCandidate({ ...input, text: RECORD.trim() + ' and then the', profile: PROFILE }, { adapter: reply(good), now: NOW });
  harnessRec = await runConsistencyHarness({ input, now: NOW, variants: [{ variant_id: 'A', adapter: reply(good) }, { variant_id: 'B', adapter: { describe: () => IDS, examine: async () => { throw new Error('leak ' + RECORD); } } }] });
  for (const fn of [
    () => runCandidate(input, {}),
    () => runCandidate(input, { adapter: { describe: () => ({}), examine: async () => ({}) } }),
    () => recordDisposition(examined, { review_id: 'wrong', finding_id: 'C-001', decision: 'confirmed', reviewer: 'R', at: 'T' }),
    () => recordDisposition(examined, { review_id: examined.review_identity.review_id, finding_id: 'C-999', decision: 'confirmed', reviewer: 'R', at: 'T' }),
    () => signOff(examined, { review_id: examined.review_identity.review_id, reviewer: 'R', at: 'T', statement: 'S' }),
  ]) { try { await fn(); } catch (e) { errors.push(String(e && e.stack || e)); } }
} finally {
  console.log = saved.log; console.error = saved.error; console.warn = saved.warn; console.info = saved.info; console.debug = saved.debug;
  process.stdout.write = saved.out; process.stderr.write = saved.err;
  process.chdir(cwd);
}
t('nothing was logged or written to stdout or stderr while the candidate ran', captured.length === 0, `${captured.length} writes`);
t('five error paths were exercised', errors.length === 5);
t('no thrown error carries record text or the record reference', errors.every((e) => !e.includes(MARK) && !e.includes(REF) && !e.includes('section 4')));
t('a rejected output does not carry the adapter’s raw text into the result', !JSON.stringify(rejected).includes(MARK));
t('a failing adapter’s error message does not reach the harness record', !JSON.stringify(harnessRec).includes(MARK) && !JSON.stringify(harnessRec).includes('leak'));
t('the harness record carries no record text', !JSON.stringify(harnessRec).includes('Northgate'));
t('nothing was written to the working directory', readdirSync(scratch).length === 0);
t('nothing was left in the system temporary directory except this test’s own scratch folder',
  readdirSync(tmpdir()).filter((f) => !tmpBefore.split('\n').includes(f)).every((f) => join(tmpdir(), f) === scratch));
t('the repository working tree is unchanged', execSync('git status --porcelain --untracked-files=all', { cwd: ROOT }).toString() === gitBefore);

// ---- refusal instead of silent partial review ----------------------------------------------------
t('partial input is refused, never examined in part', partial.status === 'refused' && partial.reason === 'partial_input' && partial.contextual_findings === null);
const spy = reply(good);
await runCandidate({ ...input, text: RECORD + ' x'.repeat(5000) }, { adapter: spy, now: NOW });
t('over-length input is refused without reaching the adapter (no silent truncation)', spy.calls.length === 0);

// ---- no mutation of the original text ---------------------------------------------------------------
const deepFreeze = (o) => { Object.freeze(o); Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v)); return o; };
const frozen = deepFreeze({ text: RECORD, profile: { ...PROFILE }, record_ref: REF });
const watch = reply(good);
const fr = await runCandidate(frozen, { adapter: watch, now: NOW });
t('a deep-frozen input is examined without error (the candidate never writes to it)', fr.status === 'examined');
t('the adapter receives the original text exactly, untrimmed', watch.calls[0].messages[0].content.includes('\n' + RECORD + '\n'));
t('the result hashes the original text exactly', fr.source.sha256 === examined.source.sha256 && fr.source.chars === RECORD.length);
t('the record reference is preserved exactly', fr.record_ref === REF);
t('the result does not carry the full record text', !JSON.stringify(fr).includes(RECORD.trim()));

t('no network call was made', net.calls === 0);
done();
