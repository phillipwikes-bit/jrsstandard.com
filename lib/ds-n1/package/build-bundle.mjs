// Builds a standalone, source-only Decision Spellchecker (DS-N1) technical
// package outside the working tree, with a SHA-256 manifest of every file.
// Allowlist only: the engine, its reviewer and author pages, the unit tests and
// the developer fixtures. Sealed evaluation sets (holdout2, isolation, stress),
// results, labelling packets, Git history and every other project file are
// excluded. Building a package is not a release, a licence or a rights transfer.
//
// Usage: node lib/ds-n1/package/build-bundle.mjs <empty-output-dir>
import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANDIDATE, ALLOWED_RECORD_CLASSES } from '../identity.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
export const PACKAGE_SCHEMA = 'ds-n1.package-manifest/1.0';

const flat = (dir, ext) => readdirSync(join(root, dir)).filter((f) => ext.some((e) => f.endsWith(e))
  && statSync(join(root, dir, f)).isFile()).map((f) => `${dir}/${f}`);

export function allowlist() {
  return [
    ...flat('lib/ds-n1', ['.mjs']),
    ...flat('lib/ds-n1/ui', ['.mjs', '.html']),
    ...flat('lib/ds-n1/enterprise', ['.mjs']),
    ...flat('lib/ds-n1/package', ['.mjs', '.md']),
    ...flat('lib/ds-n1/demo', ['.mjs', '.md']),
    ...flat('lib/ds-n1/demo/case-harbourline', ['.txt']),
    'tests/ds-n1/eval-extract.mjs',
    'tests/ds-n1/EXTRACT_EVAL.json',
    'tests/ds-n1/eval-omissions.mjs',
    'tests/ds-n1/OMISSION_EVAL.json',
    'tests/ds-n1/eval-practitioner-gaps.mjs',
    'tests/ds-n1/PRACTITIONER_GAPS_EVAL.json',
    ...flat('tests/ds-n1/practitioner-gaps-eval', ['.json', '.sha256']),
    'tests/ds-n1/eval-eu-ai-act.mjs',
    'tests/ds-n1/EU_AI_ACT_EVAL.json',
    'tests/ds-n1/EU_AI_ACT_EVAL_2.json',
    ...flat('tests/ds-n1/eu-ai-act-eval', ['.json', '.sha256']),
    ...flat('tests/ds-n1/eu-ai-act-eval-2', ['.json', '.sha256']),
    ...flat('tests/ds-n1/omission-eval', ['.json', '.sha256']),
    ...flat('tests/ds-n1', ['.test.mjs']),
    'tests/ds-n1/expectations.json',
    ...flat('tests/ds-n1/practitioner', ['.mjs', '.md']),
    ...flat('tests/ds-n1/fixtures', ['.json']),
    ...flat('tests/ds-n1/fixtures-partner', ['.json']),
    ...flat('tests/ds-n1/fixtures-docx', ['.docx']),
  ].sort();
}

const EXCLUDED = /(^|\/)(holdout2|isolation|stress|results|labelling|node_modules)(\/|$)|\.env|\.pem$|\.key$/;
const SECRET = /(sk-ant-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

export function buildBundle(out, { generatedAt = new Date().toISOString() } = {}) {
  if (!out) throw new Error('output directory required');
  if (existsSync(out) && readdirSync(out).length) throw new Error('output directory must be empty');
  if (!relative(root, out).startsWith('..')) throw new Error('output directory must be outside the repository');
  const files = [];
  for (const rel of allowlist()) {
    if (EXCLUDED.test(rel)) throw new Error(`excluded path in allowlist: ${rel}`);
    const buf = readFileSync(join(root, rel));
    if (SECRET.test(buf.toString('utf8'))) throw new Error(`secret-like content in ${rel}`);
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), buf);
    files.push({ path: rel.split(sep).join('/'), bytes: buf.length, sha256: sha(buf) });
  }
  const pkg = { name: 'decision-spellchecker-ds-n1', version: CANDIDATE.version, private: true, type: 'module',
    description: 'Decision Spellchecker DS-N1 experimental candidate. Constructed fictional records only.',
    engines: { node: '>=20' }, scripts: { test: 'node --test tests/ds-n1/*.test.mjs', verify: 'node lib/ds-n1/package/verify-bundle.mjs .' } };
  const pkgText = JSON.stringify(pkg, null, 2) + '\n';
  writeFileSync(join(out, 'package.json'), pkgText);
  files.push({ path: 'package.json', bytes: Buffer.byteLength(pkgText), sha256: sha(pkgText) });
  const manifest = {
    schema: PACKAGE_SCHEMA, generated_at: generatedAt,
    candidate: `${CANDIDATE.candidate_id}@${CANDIDATE.version}`, rule_version: CANDIDATE.rule_version,
    record_classes: [...ALLOWED_RECORD_CLASSES], runtime_dependencies: [], optional_dependencies: { playwright: 'PDF export and browser tests only' },
    status: {
      validation: 'NOT ESTABLISHED: developer-constructed fictional fixtures only; no independent or field evaluation',
      rights: 'NOT ESTABLISHED: see ASSET_BOUNDARY.md; no assignment or licence is conveyed by this package',
      production: 'NOT A PRODUCTION RELEASE',
    },
    files,
  };
  writeFileSync(join(out, 'ASSET_MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const m = buildBundle(process.argv[2]);
  console.log(`Wrote ${m.files.length} files and ASSET_MANIFEST.json to ${process.argv[2]}`);
}
