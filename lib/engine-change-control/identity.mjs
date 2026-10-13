// JRS ADAPTIVE RELIABILITY: run identity and package provenance.
//
// Every Phase 4 record that may feed a change proposal carries the hash of the
// change-control package, the hash of the baseline Engine package it ran
// against, the hash of any isolated patch, the fixture hashes, the command, a
// deterministic run id, the execution mode and a synthetic_local_only marker.
// A record missing any of these is incomplete and cannot feed a proposal.
// Hashes are computed from files beside this module, so a copied or mutated
// package hashes differently from the original.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const LIB = fileURLToPath(new URL('../', import.meta.url));
export const sha = (s) => 'sha256:' + createHash('sha256').update(s).digest('hex');
export const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((y) => [y, x[y]])) : x));

function dirHash(dirs) {
  const parts = [];
  for (const d of dirs) {
    const walk = (p, rel) => { for (const f of readdirSync(p).sort()) { const q = join(p, f); if (statSync(q).isDirectory()) walk(q, rel + f + '/'); else parts.push(d + '/' + rel + f + ':' + sha(readFileSync(q))); } };
    walk(join(LIB, d), '');
  }
  return sha(parts.join('\n'));
}
export const changeControlHash = () => dirHash(['engine-change-control']);
export const baselineHash = () => dirHash(['engine-evidence-graph', 'engine-evidence-contract', 'engine-assurance']);

export const IDENTITY_FIELDS = Object.freeze(['change_control_sha256', 'baseline_sha256', 'patch_sha256', 'fixture_set_sha256', 'fixtures', 'test_command',
  'run_id', 'execution_mode', 'synthetic_local_only', 'clock']);
export const EXECUTION_MODES = Object.freeze(['local_isolated_copy', 'local_frozen_baseline', 'local_mutation', 'local_measurement']);

// fixtures: [{ fixture_id, fixture_hash }]; patch: object or null (null hashes as 'none').
export function runIdentity({ patch = null, fixtures = [], command, mode, clock }) {
  const fx = [...fixtures].map((f) => ({ fixture_id: f.fixture_id, fixture_hash: f.fixture_hash })).sort((a, b) => (a.fixture_id < b.fixture_id ? -1 : 1));
  const id = { change_control_sha256: changeControlHash(), baseline_sha256: baselineHash(), patch_sha256: patch === null ? 'none' : sha(canon(patch)),
    fixture_set_sha256: sha(canon(fx)), fixtures: fx, test_command: command, execution_mode: mode, synthetic_local_only: true, clock };
  id.run_id = 'arr_' + sha(canon(Object.assign({}, id, { fixtures: undefined }))).slice(7, 31);
  return id;
}

// Returns a list of problems; empty means complete.
export function validateRunIdentity(id) {
  const p = [];
  if (!id || typeof id !== 'object') return ['identity missing'];
  for (const k of IDENTITY_FIELDS) if (id[k] === undefined || id[k] === null || id[k] === '') p.push('identity.' + k + ' missing');
  for (const k of ['change_control_sha256', 'baseline_sha256', 'fixture_set_sha256']) if (id[k] !== undefined && !/^sha256:[0-9a-f]{64}$/.test(id[k])) p.push('identity.' + k + ' malformed');
  if (id.patch_sha256 !== undefined && id.patch_sha256 !== 'none' && !/^sha256:[0-9a-f]{64}$/.test(id.patch_sha256)) p.push('identity.patch_sha256 malformed');
  if (id.synthetic_local_only !== undefined && id.synthetic_local_only !== true) p.push('identity.synthetic_local_only must be true');
  if (id.execution_mode !== undefined && !EXECUTION_MODES.includes(id.execution_mode)) p.push('identity.execution_mode not permitted');
  if (Array.isArray(id.fixtures) && (!id.fixtures.length || id.fixtures.some((f) => !f.fixture_id || !/^sha256:/.test(f.fixture_hash || '')))) p.push('identity.fixtures incomplete');
  if (Array.isArray(id.fixtures) && id.fixture_set_sha256 && id.fixture_set_sha256 !== sha(canon([...id.fixtures].sort((a, b) => (a.fixture_id < b.fixture_id ? -1 : 1))))) p.push('identity.fixture_set_sha256 does not match fixtures');
  if (id.run_id && id.change_control_sha256 && id.run_id !== 'arr_' + sha(canon(Object.assign({}, id, { run_id: undefined, fixtures: undefined }))).slice(7, 31)) p.push('identity.run_id does not match identity');
  return p;
}
