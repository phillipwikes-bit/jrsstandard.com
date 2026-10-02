// OPENAI_API_KEY stays server-side — development only. Added 2026-10-03.
// The real handler in api/run-study.js is exercised with every network call stubbed: no provider is
// called and nothing is written anywhere. A canary value stands in for the key.
// Invariants: the key reaches OpenAI only in the Authorization header; it never appears in the HTTP
// response or in any Supabase write (study_runs, findings and findings_history feed public pages),
// including when OpenAI echoes it in an error body or the request throws with it in the message.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let pass = 0, fail = 0;
const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
// Built at runtime so no key-shaped literal is committed (secret scanners match the shape, not the intent).
const CANARY = ['sk', 'proj', 'CANARYcanary0123456789abcdefTEST'].join('-');

// The route returns early while the studies are closed, so a copy runs with the closure stubbed open.
const src = readFileSync(new URL('../../api/run-study.js', import.meta.url), 'utf8');
const dir = mkdtempSync(join(tmpdir(), 'jrs-openai-'));
writeFileSync(join(dir, '_study-status.js'), "export const STUDIES_CLOSED = false; export const CLOSED_AT = '';\n");
writeFileSync(join(dir, 'run-study.js'), src);

async function run(openaiMode) {
  const seen = { openaiAuth: [], supabaseBodies: [], urls: [] };
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url); seen.urls.push(u);
    const h = init.headers || {};
    if (u.includes('api.openai.com')) {
      seen.openaiAuth.push(h.Authorization || h.authorization || '');
      if (openaiMode === 'throws') throw new Error('connect failed while sending Bearer ' + CANARY);
      if (openaiMode === 'echo') return new Response(JSON.stringify({ error: { message: 'Incorrect API key provided: ' + CANARY } }), { status: 401 });
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"answer":"Partially"}' } }] }), { status: 200 });
    }
    if (u.includes('api.anthropic.com')) return new Response(JSON.stringify({ content: [{ type: 'text', text: '{"answer":"Yes"}' }] }), { status: 200 });
    if (u.includes('supabase.co')) { seen.supabaseBodies.push(String(init.body || '')); return new Response('[]', { status: 201 }); }
    if (u.includes('generativelanguage')) return new Response('{}', { status: 200 });
    return new Response('', { status: 404 });
  };
  for (const k of ['GEMINI_API_KEY', 'CRON_SECRET']) delete process.env[k];
  Object.assign(process.env, { ANTHROPIC_API_KEY: 'test-anthropic-not-a-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service-not-a-key',
                               RUN_TOKEN: 'test-run-token', OPENAI_API_KEY: CANARY });
  const mod = await import(join(dir, 'run-study.js') + '?v=' + Math.random());
  const res = await mod.default(new Request('https://x/api/run-study?token=test-run-token'));
  return { seen, status: res.status, body: await res.text() };
}

for (const mode of ['ok', 'echo', 'throws']) {
  const r = await run(mode);
  t(`${mode}: OpenAI was called server-side with the key in the Authorization header`,
    r.seen.openaiAuth.length > 0 && r.seen.openaiAuth.every((a) => a === 'Bearer ' + CANARY), `${r.seen.openaiAuth.length} calls`);
  t(`${mode}: the key is not in the HTTP response`, !r.body.includes(CANARY) && !r.body.includes('CANARY'));
  t(`${mode}: the key is not in any Supabase write`, r.seen.supabaseBodies.length > 0 && r.seen.supabaseBodies.every((b) => !b.includes('CANARY')),
    `${r.seen.supabaseBodies.length} writes`);
  t(`${mode}: the key is never placed in a URL`, r.seen.urls.every((u) => !u.includes('CANARY')));
  if (mode === 'ok') t('ok: the run is cross-vendor once OpenAI answers', /"cross_vendor":true/.test(r.body));
}

// The deployed route, with the real closure flag: it returns before reading any key.
const real = await import('../../api/run-study.js?v=' + Math.random());
let calls = 0; globalThis.fetch = async () => { calls++; return new Response('{}'); };
const rr = await real.default(new Request('https://x/api/run-study'));
const rb = await rr.text();
t('deployed route (studies closed): no provider call and no key in the response', calls === 0 && !rb.includes('CANARY'), rb.slice(0, 80));

console.log(`\n${pass + fail} checks, ${fail} failed`);
process.exit(fail ? 1 : 0);
