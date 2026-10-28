// Irrelevant-basis investigation and 0.3.6 research candidate (2026-10-28): shared helpers. No network, no credential.
// Offline tools import ../../study-continuation-0.3.5-2026-10-28/tools/guard.mjs first (network guard, provider variables refused).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const RESEARCH = join(DIR, '..');
export const CONT = join(RESEARCH, 'study-continuation-0.3.5-2026-10-28');   // frozen 0.3.5 continuation (read only)
export const PKG4 = join(RESEARCH, 'engine-repair-0.3.4-2026-10-27');        // frozen 0.3.4 package (read only)
export const STATUS = Object.freeze({ release_status: 'NO_GO_NOT_VERIFIED', b018: 'OPEN', candidate_adopted: false, engine_of_record: '0.3.1-candidate' });
export const sha = (s) => createHash('sha256').update(s).digest('hex');
export const shaFile = (p) => sha(readFileSync(p));
export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export function writeOut(p, text) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text.endsWith('\n') ? text : text + '\n'); }
export const writeJson = (p, o) => writeOut(p, JSON.stringify(o, null, 2));
