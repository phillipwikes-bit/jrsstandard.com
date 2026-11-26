#!/usr/bin/env node
// Proof 1: same input, same answer, with no network. Runs the DS-N1 adapter
// twice in fresh processes with every network door in Node shut (fetch, http,
// https, net, tls, dns, WebSocket all throw if touched), and compares the
// byte-exact output. Also lists any network API named in the runtime code.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const adapter = new URL('../adapters/ds-n1.mjs', import.meta.url).pathname;
const guard = join(mkdtempSync(join(tmpdir(), 'ds-guard-')), 'no-network.cjs');
writeFileSync(guard, `
const deny = (what) => () => { throw new Error('NETWORK USE ATTEMPTED: ' + what); };
for (const m of ['http', 'https', 'net', 'tls', 'dns', 'dgram', 'http2']) {
  const mod = require(m);
  for (const k of Object.keys(mod)) if (typeof mod[k] === 'function' && /request|get|connect|lookup|resolve|createConnection|createSocket/i.test(k)) mod[k] = deny(m + '.' + k);
}
globalThis.fetch = deny('fetch'); globalThis.WebSocket = deny('WebSocket'); globalThis.XMLHttpRequest = deny('XMLHttpRequest');
`);
const run = () => execFileSync(process.execPath, ['--require', guard, adapter], { maxBuffer: 1 << 28 });
const a = run(), b = run();
const ha = createHash('sha256').update(a).digest('hex'), hb = createHash('sha256').update(b).digest('hex');
const libDir = new URL('../../../lib/ds-n1/', import.meta.url);
const runtime = readdirSync(libDir).filter((f) => f.endsWith('.mjs') && !['serve.mjs'].includes(f));
const NET = /\bfetch\s*\(|XMLHttpRequest|WebSocket|from ['"]node:(http|https|net|tls|dns|dgram|http2)['"]|require\(['"](http|https|net|tls|dns)['"]\)/;
const netNamed = runtime.filter((f) => NET.test(readFileSync(new URL(f, libDir), 'utf8')));
const out = { run_1_sha256: ha, run_2_sha256: hb, identical: ha === hb && a.equals(b), network_blocked_during_runs: true, completed_without_network: true,
  runtime_files_checked: runtime.length, runtime_files_naming_a_network_api: netNamed,
  note: 'serve.mjs (the optional local web server for the pages) is excluded: it listens on localhost and is not used by the checks.' };
console.log(JSON.stringify(out, null, 2));
if (!out.identical || netNamed.length) process.exit(1);
