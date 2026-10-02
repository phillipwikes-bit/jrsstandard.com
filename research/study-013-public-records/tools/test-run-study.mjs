#!/usr/bin/env node
// Offline tests for the Study 013 runner and scorer. No network call is made.
// RUNNER env var lets a deliberately broken copy be tested (fault test).
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const R = await import(pathToFileURL(process.env.RUNNER || path.join(HERE, 'run-study.mjs')).href);
const S = await import(pathToFileURL(path.join(HERE, 'score-study.mjs')).href);
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
const throwsAsync = async (f) => { try { await f(); return false; } catch (e) { return true; } };

const tmp = mkdtempSync(path.join(tmpdir(), 's013-'));
const out = path.join(tmp, 'dry');
const code = await R.main({ out, arms: 'A,B,C,C0,D', runs: 3, limit: 0, dry: true }, {});
ok('dry run exits 0', code === 0);
const rows = readFileSync(path.join(out, 'results.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
ok('450 results', rows.length === 450);
ok('all parsed ok', rows.every((r) => r.outcome === 'ok'));
ok('every arm present', ['A', 'B', 'C', 'C0', 'D'].every((a) => rows.some((r) => r.arm === a)));
ok('no compliant_version stored for C', !readFileSync(path.join(out, 'results.jsonl'), 'utf8').includes('compliant_version'));
ok('refuses to overwrite', await throwsAsync(() => R.main({ out, arms: 'A', runs: 1, limit: 1, dry: true }, {})));
ok('call cap enforced', await throwsAsync(() => R.main({ out: path.join(tmp, 'cap'), arms: 'A,B,C,C0,D', runs: 4, limit: 0, dry: true }, {})));
ok('live without key is blocked', (await R.main({ out: path.join(tmp, 'nokey'), arms: 'A', runs: 1, limit: 1, dry: false }, {})) === 2);
ok('destination lock', await throwsAsync(() => R.guardedFetch('https://example.com/v1/messages', {}, async () => ({ ok: true }))));
ok('allowed destination passes', !(await throwsAsync(() => R.guardedFetch('https://api.anthropic.com/v1/messages', {}, async () => ({ ok: true })))));
ok('refusal recorded', R.parseResponse('A', { stop_reason: 'refusal', content: [] }).outcome === 'refusal');
ok('truncation recorded', R.parseResponse('B', { stop_reason: 'max_tokens', content: [] }).outcome === 'truncated');
ok('thinking block before text is handled', R.parseResponse('A', { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '{"route":"gap","reason":"r"}' }] }).route === 'gap');
const bad = { conditions: { rc1: { status: 'maybe', note: '' }, rc2: { status: 'pass', note: '' }, rc3: { status: 'pass', note: '' }, rc4: { status: 'pass', note: '' }, rc5: { status: 'pass', note: '' } } };
ok('invalid status rejected', R.parseResponse('B', { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(bad) }] }).outcome === 'invalid_output');
ok('C0 prompt-only JSON with prose parsed', R.parseResponse('C0', { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Here: {"conditions":{"basis_identification":{"status":"pass"},"reasoning_traceability":{"status":"review"},"cold_reviewer_clarity":{"status":"pass"},"accountability_support":{"status":"pass"},"temporal_reconstructability":{"status":"pass"}}}' }] }).route === 'review');
ok('modal tie counts as review', S.modal(['gap', 'ready', 'review']) === 'review');
ok('modal majority', S.modal(['gap', 'gap', 'ready']) === 'gap');
const w = S.wilson(15, 15);
ok('wilson 15/15 lower bound about 0.796', Math.abs(w[0] - 0.796) < 0.002 && w[1] === 1);
const s = S.score(out);
ok('scorer covers all arms', Object.keys(s.arms).length === 5);
ok('scorer n=15 per label', s.arms.A.primary_flag.sensitivity[1] === 15 && s.arms.A.primary_flag.specificity[1] === 15);
ok('paired tables present', Object.keys(s.paired).length === 4);
rmSync(tmp, { recursive: true, force: true });
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
