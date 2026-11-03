#!/usr/bin/env node
// Local-only static server for the DS-N1 reviewer interface. Binds to
// 127.0.0.1, serves only lib/ds-n1/ and the constructed fixtures, GET only.
// Usage: node lib/ds-n1/serve.mjs [port]   then open http://127.0.0.1:<port>/
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join, extname, sep } from 'node:path';

const root = fileURLToPath(new URL('./', import.meta.url));
const fixtures = fileURLToPath(new URL('../../tests/ds-n1/fixtures/', import.meta.url));
const port = Number(process.argv[2] || 4317);
const TYPES = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function within(base, rel) {
  const p = resolve(base, '.' + sep + rel);
  return p.startsWith(base) ? p : null;
}

export function start(p = port) {
  const server = createServer(async (req, res) => {
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    const url = new URL(req.url, 'http://127.0.0.1');
    let file = null;
    if (url.pathname === '/' ) file = join(root, 'ui', 'reviewer.html');
    else if (url.pathname === '/author') file = join(root, 'ui', 'author.html');
    else if (url.pathname.startsWith('/fixtures/')) file = within(fixtures, decodeURIComponent(url.pathname.slice(10)));
    else if (url.pathname.startsWith('/lib/')) file = within(root, decodeURIComponent(url.pathname.slice(5)));
    if (!file || !TYPES[extname(file)]) { res.writeHead(404).end('not found'); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' blob: data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
      });
      res.end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((ok) => server.listen(p, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  start().then(() => console.log(`DS-N1 reviewer (constructed records only): http://127.0.0.1:${port}/`));
}
