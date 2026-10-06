// Shared helpers for the provenance audit tests. Local only.
// JRS_PA_DIR points the suite at a mutated copy of tools/provenance-audit/ (mutation run); the
// repository being audited is always this checkout.
export const REPO = new URL('../../', import.meta.url).pathname;
export const DIR = process.env.JRS_PA_DIR || REPO + 'tools/provenance-audit/';
export const net = { calls: 0 };
globalThis.fetch = async () => { net.calls++; throw new Error('network access is prohibited in provenance tests'); };

export const AN = await import(DIR + 'lib/analyze.js');
export const G = await import(DIR + 'lib/guards.js');
export const R = await import(DIR + 'lib/render.js');
export const IG = await import(DIR + 'lib/ignore.js');
export const RUN = await import(DIR + 'run.mjs');

let pass = 0, fail = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed`); process.exit(fail ? 1 : 0); };
export const clone = (o) => JSON.parse(JSON.stringify(o));

// A fixed synthetic repository manifest. Not a real repository: every path, hash and identity is
// fictitious. Credential-like strings are assembled at run time so that no such literal is committed.
export function fixtureFacts() {
  const ignore = '# synthetic\n*.md\n!404.md\nresearch/\nlib/\ntools/\ntests/\n/docs/private/\n';
  const files = [
    ['index.html', '<html><title>Synthetic</title><script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script></html>'],
    ['404.md', 'not found'], ['README.md', 'readme'], ['vercel.json', '{"ignoreCommand":"exit 1"}'], ['.vercelignore', ignore],
    ['api/review.js', "export { config } from './_controlled-review.js';\nimport { unavailable } from './_controlled-review.js';"],
    ['api/_controlled-review.js', 'export const x = 1;'], ['api/open-route.js', "import x from 'left-pad';\nexport default () => 1;"],
    ['api/leads-0123456789abcdef.js', 'export default () => 1;'],
    ['lib/engine-candidate/review-candidate.js', "import { createHash } from 'node:crypto';\nexport const PROMPT_VERSION = 'candidate-prompt/9.9.9';"],
    ['lib/engine-candidate/dev-material.js', "export const L = [\n  ['" + 'a'.repeat(64) + "', 'fixtures/SYNTHETIC-X.txt'],\n];"],
    ['tests/engine-candidate/fixtures/SYNTHETIC-X.txt', 'SYNTHETIC CONSTRUCTED RECORD. The approver wrote that the supplier is trusted by everyone involved.'],
    ['research/notes.py', 'import os\nimport reportlab\nfrom PIL import Image\n'],
    ['tools/x/run.mjs', "import { readFileSync } from 'node:fs';"],
    ['docs/private/a.json', '{}'], ['docs/public.json', '{}'],
    ['config.js', 'const k = "' + 'sb_' + 'publishable_' + 'X'.repeat(20) + '";'],
    ['mystery.bin', null],
  ];
  const text = {}, out = [];
  files.forEach(([p, c], i) => { out.push({ path: p, mode: '100644', blob: String(i).padStart(40, 'f'), size: c ? c.length : 9 }); if (c !== null) text[p] = c; });
  out.sort((a, b) => (a.path < b.path ? -1 : 1));
  const rules = IG.parseIgnore(ignore), exclusion = {};
  for (const f of out) { const r = IG.exclusionRule(rules, f.path); if (r) exclusion[f.path] = r; }
  const commits = [
    { hash: '1'.repeat(40), author: 'Synthetic Person', email: 'person@example.invalid', committer: 'Synthetic Person', date: '2000-01-01', message: 'first', files: ['index.html', 'api/review.js'] },
    { hash: '2'.repeat(40), author: 'Claude', email: 'noreply@anthropic.com', committer: 'Claude', date: '2000-01-02', message: 'candidate\n\nCo-Authored-By: Claude <noreply@anthropic.com>', files: ['lib/engine-candidate/review-candidate.js'] },
  ];
  return { commit: 'c'.repeat(40), commit_date: '2000-01-03', shallow: true, files: out, exclusion, vercelignore: ignore, text, commits };
}
export function analyzeWithDigest(facts) {
  const a = AN.analyze(facts);
  const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);
  return { a, digest: canon(a) };
}
