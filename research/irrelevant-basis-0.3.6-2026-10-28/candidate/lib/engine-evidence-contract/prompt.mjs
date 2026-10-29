// JRS EVIDENCE CONTRACT 0.2.0: prompt specification loader. NEVER SENDS ANYTHING.
//
// Reads the versioned prompt text, checks it against its pinned SHA-256, and
// assembles the system and user messages for a record. There is no provider
// client here and no caller in this repository passes the result to a network
// API. Loading is lazy, so modules that do not need the prompt never read it.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const DIR = new URL('../../research/engine-evidence-contract-2026-10-10/prompt-contract/', import.meta.url);
const sha = (s) => 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');

export function loadPromptContract() {
  const manifest = JSON.parse(readFileSync(new URL('PROMPT_MANIFEST.json', DIR), 'utf8'));
  const text = readFileSync(new URL(manifest.file, DIR), 'utf8');
  if (sha(text) !== manifest.sha256) throw new Error('prompt_hash_mismatch: the prompt text differs from its pinned version');
  const i = text.indexOf('[SYSTEM]\n'), j = text.indexOf('[USER]\n');
  if (i < 0 || j < 0) throw new Error('prompt_structure_invalid');
  return { manifest, text, system: text.slice(i + 9, j).trim(), userTemplate: text.slice(j + 7).trim() };
}

// The record is inserted between fixed delimiters. A record that contains a
// delimiter could close the data block early, so it is refused, not escaped.
export function buildPromptMessages(record) {
  if (typeof record !== 'string') throw new Error('prompt_refused: record is not text');
  if (/<\/?record>/i.test(record) || record.includes('{{RECORD}}')) throw new Error('prompt_refused: record contains a prompt delimiter');
  const p = loadPromptContract();
  return { prompt_version: p.manifest.prompt_version, system: p.system, user: p.userTemplate.replace('{{RECORD}}', record), sent: false };
}
