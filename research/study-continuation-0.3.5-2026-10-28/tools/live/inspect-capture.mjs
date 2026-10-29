// Study continuation (0.3.5), ported from study-completion-0.3.4-2026-10-28: child process for tools/live/child-inspector.mjs. Reads one capture on stdin, compiles it
// offline with the frozen 0.3.5 continuation candidate (isolated copy, manifest required) and prints the derived fields as one JSON line.
// The network guard is installed first; provider variables stop it (the parent removes them).
import { attempts } from '../guard.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIR } from '../common.mjs';
import { isolate, loadEngine } from '../harness/engines.mjs';
import { makeInspector } from './score-live-v2.mjs';

const x = JSON.parse(readFileSync(0, 'utf8'));
const scratch = join(x.scratch, 'inspect-' + process.pid + '-' + Date.now());
mkdirSync(scratch, { recursive: true });
const targeted = new Map(readFileSync(join(DIR, 'records', 'TARGETED_TEXTS.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { const o = JSON.parse(l); return [o.request_id, o.text]; }));
const iso = isolate('0.3.5-research-candidate', scratch, { requireManifest: true });
const E4 = await loadEngine(iso);
const out = makeInspector(E4, targeted)(x.capture_text, { request_id: x.request_id, base_record_id: x.base_record_id });
iso.release();
if (attempts.length) { console.error('network attempts ' + attempts.length); process.exit(9); }
console.log(JSON.stringify(out));
