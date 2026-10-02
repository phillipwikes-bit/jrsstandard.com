// Builds the redacted AUDIT-BUNDLE.zip for an outside AI or human reviewer.
// Excludes by default (v8.0 section 30): the Engine system-prompt text, Engine
// and runner source, the answer key (corpus/EXPECTATIONS.json), credentials,
// restricted page slugs, contributor names and private contact details. The
// build FAILS if any excluded pattern appears in an included file.
//
// Usage: node build-audit-bundle.mjs   (refuses to overwrite an existing bundle)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.resolve(HERE, '..');
const REPO = path.resolve(BASE, '../../..');
const OUT = path.join(BASE, 'AUDIT-BUNDLE.zip');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if (fs.existsSync(OUT)) { console.error('refused: AUDIT-BUNDLE.zip exists'); process.exit(3); }

const INCLUDE = [
  'READINESS-REPORT.md', 'ENGINE-DEFECT-REGISTER.md', 'SOURCE-LOCATION-MAP.json',
  'gates/GATE-DEFINITIONS.json', 'gates/GATE-RESULTS.json',
  'tools/validate-gates.mjs', 'tools/validate-order.mjs',
  'corpus/FIXTURE-PROVENANCE.json', 'runs/2026-10-01-smoke-1.BLOCKED.json', 'runs/2026-10-02-smoke-2/EXECUTION-RECORD.json', 'METRICS.json',
  'track-a/CAPABILITY-MATRIX.json', 'track-a/FROZEN-DEMO-MANIFEST.json', 'track-a/DEMO-LIMITATIONS.md',
  'track-a/DEMO-SCRIPT.md', 'track-a/BUYER-BRIEF.md', 'track-a/EVALUATION-OFFER.md',
  'track-b/CLAIM-REGISTER.md', 'track-b/DATA-FLOW-AND-LIMITATIONS.md', 'track-b/SUPPORT-AND-ACCEPTANCE.md',
  'track-b/EVALUATION-PROTOCOL.md', 'track-b/INTEGRATION-AND-QUICKSTART.md', 'track-b/EVALUATION-AGREEMENT-DRAFT.md',
  'track-b/ORDER-FORM-SPEC.json', 'track-b/INVOICE-AND-ACTIVATION.md', 'track-b/PROCUREMENT-INDEX.json',
  'track-b/LICENSE-ENCUMBRANCE-REGISTER.json', 'track-b/LICENSED-ASSET-SCHEDULE.json',
  'track-b/L2-RIGHTS-WITHOUT-COUNSEL.md', 'track-b/OWNER-ATTESTATION-2026-10-01.json',
];
for (const f of fs.readdirSync(path.join(BASE, 'corpus/records')).sort()) INCLUDE.push('corpus/records/' + f);

// Patterns that must never appear in the bundle.
const engineSrc = fs.readFileSync(path.join(REPO, 'api/review-engine.js'), 'utf8');
const prompt = (engineSrc.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/) || [])[1] || '';
const promptRuns = [];
for (let i = 0; i + 60 <= prompt.length; i += 30) promptRuns.push(prompt.slice(i, i + 60));
const FORBIDDEN = [
  /programme-status-9872fb93cc94/, /acquisition-9f3c2a7d4b/, /vp-7c1f9a4e8d2b6035/,
  /people-9dd1ecdf6f8cdfd4/, /leads-4b7e2c9af106d385/, /roster-8c3f1a9e7b2d6045/,
  /sk-ant-/, /sb_secret_/, /SUPABASE_SERVICE_ROLE_KEY=\S/, /phillipwikes@gmail\.com/i,
  /Stacyann/i, /Pokhriyal/i, /Hekim/i, /Colpan/i, /Ubayet/i, /Hossain/i,
];
const problems = [];
for (const rel of INCLUDE) {
  const p = path.join(BASE, rel);
  if (!fs.existsSync(p)) { problems.push('missing: ' + rel); continue; }
  const t = fs.readFileSync(p, 'utf8');
  for (const re of FORBIDDEN) if (re.test(t)) problems.push(rel + ' contains ' + re);
  if (promptRuns.some((r) => t.includes(r))) problems.push(rel + ' contains Engine system-prompt text');
}
if (problems.length) { console.error('BUNDLE REFUSED\n' + problems.join('\n')); process.exit(1); }

const stage = fs.mkdtempSync(path.join(BASE, '.audit-stage-'));
try {
  for (const rel of INCLUDE) { fs.mkdirSync(path.dirname(path.join(stage, rel)), { recursive: true }); fs.copyFileSync(path.join(BASE, rel), path.join(stage, rel)); }
  const omitted = [
    ['Engine source and system prompt (api/review-engine.js)', 'Protected implementation by default; the package hash is recorded in track-b/LICENSED-ASSET-SCHEDULE.json. Engine behavior claims that depend on it are NOT_CONFIRMED_FROM_SHARED_EVIDENCE.'],
    ['Runner and package source (tools/run-smoke.mjs, package tarball)', 'Implementation; the offline test results are reported in READINESS-REPORT.md but cannot be re-run from this bundle.'],
    ['corpus/EXPECTATIONS.json', 'Answer key for the frozen smoke corpus; withheld so it is never used to tune a later run.'],
    ['Creator labels', 'None exist yet.'],
  ];
  fs.writeFileSync(path.join(stage, 'README-AUDIT.md'), [
    '# Redacted audit bundle, JRS Review Engine v8.0 preparation', '',
    'Built ' + new Date().toISOString().slice(0, 10) + '. Review it under the reviewer instructions at the end of READINESS-REPORT.md.', '',
    '## Re-check offline (Node.js 22, no network, no credentials)',
    '```', 'sha256sum -c SHA256SUMS.txt', 'node tools/validate-gates.mjs            # recomputes track status from evidence hashes',
    'node tools/validate-gates.mjs --selftest', 'node tools/validate-order.mjs --selftest', '```', '',
    '## Withheld, and the effect of each omission', '', '| Withheld | Effect |', '|---|---|',
    ...omitted.map(([a, b]) => '| ' + a + ' | ' + b + ' |'), '',
  ].join('\n'));
  const files = [];
  (function walk(d) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(stage, p)); } })(stage);
  fs.writeFileSync(path.join(stage, 'SHA256SUMS.txt'), files.map((f) => sha(path.join(stage, f)) + '  ' + f).join('\n') + '\n');
  for (const f of [...files, 'SHA256SUMS.txt']) fs.utimesSync(path.join(stage, f), new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'));
  execFileSync('zip', ['-X', '-q', '-r', OUT, '.'], { cwd: stage });
} finally { fs.rmSync(stage, { recursive: true, force: true }); }
console.log(JSON.stringify({ bundle: 'AUDIT-BUNDLE.zip', files: INCLUDE.length + 2, sha256: sha(OUT) }, null, 2));
