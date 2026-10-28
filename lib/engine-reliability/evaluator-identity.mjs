// JRS ENGINE RELIABILITY: identity of the scenario evaluator.
//
// The expectation seal records this hash. If the evaluator code changes after
// the seal, verifySeal reports it, so an evaluation rule cannot be loosened
// silently after results are known.

import { readFileSync } from 'node:fs';
import { sha } from './canonical.mjs';

export const EVALUATOR_FILES = Object.freeze(['library.mjs', 'baseline.mjs', 'vocab.mjs', 'canonical.mjs']);
export function evaluatorSha(dir = new URL('./', import.meta.url)) {
  return sha(EVALUATOR_FILES.map((f) => f + '\n' + readFileSync(new URL(f, dir), 'utf8')).join('\n'));
}
