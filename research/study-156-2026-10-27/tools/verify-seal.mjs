// 156-record study: verify every seal under seals/. Exit 0 only if every listed file matches its hash
// and no sealed directory root has gained a file. Usage: node tools/verify-seal.mjs [name...]
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const sha = (b) => createHash('sha256').update(b).digest('hex');
const walk = (p) => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((n) => walk(join(p, n))) : [p];

export function verifySeals(names) {
  const root = join(PKG, 'seals');
  const all = existsSync(root) ? readdirSync(root).sort() : [];
  const problems = [], checked = [];
  for (const name of names && names.length ? names : all) {
    const sealPath = join(root, name, 'SEAL.json');
    if (!existsSync(sealPath)) { problems.push(name + ': seal missing'); continue; }
    const seal = JSON.parse(readFileSync(sealPath, 'utf8'));
    const manifest = readFileSync(join(PKG, seal.manifest_file));
    if (sha(manifest) !== seal.manifest_sha256) problems.push(name + ': manifest hash mismatch');
    const listed = new Set();
    for (const l of manifest.toString('utf8').split('\n')) {
      if (!l || l.startsWith('#')) continue;
      const f = l.slice(66); listed.add(f);
      if (!existsSync(join(PKG, f))) problems.push(name + ': missing ' + f);
      else if (sha(readFileSync(join(PKG, f))) !== l.slice(0, 64)) problems.push(name + ': modified ' + f);
    }
    for (const r of seal.roots) {
      const p = join(PKG, r);
      if (existsSync(p) && statSync(p).isDirectory()) for (const f of walk(p).map((x) => relative(PKG, x))) if (!listed.has(f)) problems.push(name + ': added ' + f);
    }
    checked.push({ name, files: listed.size, sealed_at_utc: seal.sealed_at_utc });
  }
  return { ok: problems.length === 0, problems, checked };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const r = verifySeals(process.argv.slice(2));
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}
