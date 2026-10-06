#!/usr/bin/env node
// JRS provenance audit: deterministic repository inventory. INTERNAL, LOCAL ONLY.
//   node tools/provenance-audit/run.mjs                  analyze HEAD and print a summary
//   node tools/provenance-audit/run.mjs --write          also write the reports and JSON outputs
//   node tools/provenance-audit/run.mjs --commit <ref>   analyze another commit
//   node tools/provenance-audit/run.mjs --check          fail unless the committed outputs equal a
//                                                        fresh run at the commit they record
//
// Reads git objects at one commit (never the working tree, never the network) and writes only to
// docs/architecture/*.md and tools/provenance-audit/generated/, both excluded from deployment. It
// refuses to write anything that fails its language, credential or copied-text guards.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { collectFacts } from './lib/collect.js';
import { analyze } from './lib/analyze.js';
import { renderAll, JSON_OUTPUTS } from './lib/render.js';
import { languageProblems, credentialProblems } from './lib/guards.js';

export const ROOT = new URL('../../', import.meta.url).pathname;
export const WRITABLE = Object.freeze([/^docs\/architecture\/[A-Z_]+\.md$/, /^tools\/provenance-audit\/generated\/[a-z-]+\.json$/]);

const canon = (v) => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);

export function audit(root = ROOT, commitRef = 'HEAD') {
  const a = analyze(collectFacts(root, commitRef));
  a.snapshot.inventory_digest = createHash('sha256').update(canon({ ...a, snapshot: { ...a.snapshot, inventory_digest: null } })).digest('hex');
  return a;
}

export function outputsFor(a) {
  const out = renderAll(a);
  const problems = [];
  for (const [path, text] of Object.entries(out)) {
    if (!WRITABLE.some((re) => re.test(path))) problems.push(path + ': not a permitted output path');
    for (const p of languageProblems(text)) problems.push(path + ':' + p.line + ': prohibited language (' + p.label + ')');
    for (const c of credentialProblems(text)) problems.push(path + ': credential-like content (' + c + ')');
    if (!text.includes(a.snapshot.source_commit)) problems.push(path + ': does not identify its source commit');
  }
  return { out, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--commit');
  let ref = i >= 0 ? args[i + 1] : 'HEAD';
  if (args.includes('--check')) ref = JSON.parse(readFileSync(join(ROOT, JSON_OUTPUTS.snapshot), 'utf8')).snapshot.source_commit;
  const a = audit(ROOT, ref);
  const { out, problems } = outputsFor(a);
  if (problems.length) { for (const p of problems) console.error('REFUSED  ' + p); process.exit(1); }
  console.log('commit ' + a.snapshot.source_commit + '  files ' + a.snapshot.tracked_files + '  digest ' + a.snapshot.inventory_digest);
  for (const [k, v] of Object.entries(a.totals.by_boundary)) console.log('  ' + k.padEnd(28) + v);
  if (args.includes('--check')) {
    const stale = Object.entries(out).filter(([p, t]) => !existsSync(join(ROOT, p)) || readFileSync(join(ROOT, p), 'utf8') !== t).map(([p]) => p);
    if (stale.length) { for (const p of stale) console.log('STALE  ' + p); process.exit(1); }
    console.log('PASS  committed outputs equal a fresh run at ' + ref.slice(0, 12));
  }
  if (args.includes('--write')) for (const [p, t] of Object.entries(out)) { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), t); console.log('wrote ' + p); }
}
