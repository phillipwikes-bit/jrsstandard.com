#!/usr/bin/env node
// JRS PHASE 9: seal the rehearsal set before the first Phase 9 evaluator run.
//
//   env -u ANTHROPIC_BASE_URL node research/engine-human-review-phase9-2026-10-20/rehearsal/seal-rehearsal.mjs
//
// Imports no compiler. Refuses if a seal or a first evaluator run already exists.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeal } from '../../../lib/engine-human-review-phase9/rehearsal-schema.mjs';

const HERE = fileURLToPath(new URL('./', import.meta.url));
if (existsSync(join(HERE, 'SEAL.json')) || existsSync(join(HERE, 'FIRST_EVALUATOR_RUN.json'))) { console.error('REFUSED: already sealed or already evaluated'); process.exit(2); }
const cases = readdirSync(join(HERE, 'cases')).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(HERE, 'cases', f), 'utf8')));
const expectations = JSON.parse(readFileSync(join(HERE, 'EXPECTATIONS.json'), 'utf8')).expectations;
const seal = buildSeal(cases, expectations, new Date().toISOString());
writeFileSync(join(HERE, 'SEAL.json'), JSON.stringify(seal, null, 2) + '\n');
console.log('sealed ' + seal.case_count + ' cases ' + seal.seal_sha256);
