// Seals the corpus: SHA-256 manifest of every corpus, truth and expectation file, plus SEAL.json.
// Refuses to run twice. Post-seal modification is prohibited; the evaluator checks the seal before any run.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
if (existsSync(join(HERE, 'SEAL.json'))) { console.error('already sealed'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const files = ['build-corpus.mjs', 'CONSTRUCTION_LOG.md', 'CORPUS_INDEX.json',
  ...['cases', 'truth', 'expectations'].flatMap((d) => readdirSync(join(HERE, d)).sort().map((f) => d + '/' + f))];
const manifest = '# CORPUS_SEAL_MANIFEST v1: sealed owner-authored synthetic validation-readiness corpus, V0\n' + files.map((f) => sha(readFileSync(join(HERE, f))) + '  ' + f).join('\n') + '\n';
writeFileSync(join(HERE, 'CORPUS_SEAL_MANIFEST_SHA256.txt'), manifest);
const seal = { seal_format: 'jrs-v0-corpus-seal/1.0.0', corpus: 'sealed owner-authored synthetic validation-readiness corpus', sealed_at_utc: new Date().toISOString(),
  file_count: files.length, manifest_file: 'CORPUS_SEAL_MANIFEST_SHA256.txt', manifest_sha256: sha(manifest),
  rule: 'Post-seal modification is prohibited. The evaluator refuses to run unless every listed file verifies and no file is added to cases/, truth/ or expectations/.',
  engine_runs_before_seal: 0 };
writeFileSync(join(HERE, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n');
console.log('sealed', files.length, 'files at', seal.sealed_at_utc, 'manifest', seal.manifest_sha256);
