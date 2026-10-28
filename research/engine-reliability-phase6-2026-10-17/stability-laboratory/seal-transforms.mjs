#!/usr/bin/env node
// Seals the Phase 6 transform specifications before their first run. Refuses if a seal exists.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { sha } from '../../../lib/engine-reliability/canonical.mjs';
import { evaluatorSha } from '../../../lib/engine-reliability/evaluator-identity.mjs';
const HERE = fileURLToPath(new URL('./', import.meta.url));
const LIB = fileURLToPath(new URL('../../../lib/engine-reliability/', import.meta.url));
export const stabilityEvaluatorSha = () => sha(['stability.mjs', 'differ.mjs'].map((f) => f + '\n' + readFileSync(LIB + f, 'utf8')).join('\n') + '\n' + evaluatorSha());
export const transformsSha = () => sha(readFileSync(HERE + 'transforms.mjs', 'utf8'));
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (existsSync(HERE + 'STABILITY_SEAL.json')) { console.error('REFUSED: STABILITY_SEAL.json already exists'); process.exit(4); }
  const { TRANSFORMS } = await import('./transforms.mjs');
  const seal = { sealed_at: new Date().toISOString(), transform_count: TRANSFORMS.length, transforms_sha256: transformsSha(), stability_evaluator_sha256: stabilityEvaluatorSha(),
    transform_ids: TRANSFORMS.map((t) => t.id), compiler_executed_on_these_transforms_before_seal: false,
    statement: 'Transform specifications and expectations were hashed before their first execution. A later change breaks this seal.' };
  writeFileSync(HERE + 'STABILITY_SEAL.json', JSON.stringify(seal, null, 2) + '\n');
  console.log('sealed ' + seal.transform_count + ' transforms at ' + seal.sealed_at);
}
