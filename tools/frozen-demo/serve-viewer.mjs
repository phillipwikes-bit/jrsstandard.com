#!/usr/bin/env node
// JRS frozen synthetic demonstration viewer: loopback-only static server. LOCAL AND OFFLINE ONLY.
//   node tools/frozen-demo/serve-viewer.mjs [--port 4318]
// It exists only because browsers will not load JavaScript modules from file://. It binds to a
// loopback address, refuses non-loopback Host headers, answers only GET and HEAD for the fixed
// files below, accepts no upload and makes no outbound connection. The page is sent with
// connect-src 'none', so it cannot make a network request of any kind. core.js and
// correspondence.js are served read-only from the local reviewer workspace, unchanged.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

export const LOOPBACK = Object.freeze(['127.0.0.1', '::1', 'localhost']);
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; worker-src 'none'; manifest-src 'none'; media-src 'none'; font-src 'none'";
const VIEWER = new URL('./viewer/', import.meta.url).pathname;
const WORKSPACE = new URL('../local-reviewer-workspace/app/', import.meta.url).pathname;
export const FILES = Object.freeze({
  '/': [VIEWER + 'index.html', 'text/html; charset=utf-8'],
  '/index.html': [VIEWER + 'index.html', 'text/html; charset=utf-8'],
  '/viewer.css': [VIEWER + 'viewer.css', 'text/css; charset=utf-8'],
  '/viewer.js': [VIEWER + 'viewer.js', 'text/javascript; charset=utf-8'],
  '/demo-data.js': [VIEWER + 'demo-data.js', 'text/javascript; charset=utf-8'],
  '/core.js': [WORKSPACE + 'core.js', 'text/javascript; charset=utf-8'],
  '/correspondence.js': [WORKSPACE + 'correspondence.js', 'text/javascript; charset=utf-8'],
});
const HEADERS = {
  'Content-Security-Policy': CSP, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Opener-Policy': 'same-origin', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=(), serial=(), payment=()',
};

export function assertLoopbackHost(host) {
  if (!LOOPBACK.includes(host)) throw new Error('refused: the viewer binds only to a loopback address (' + LOOPBACK.join(', ') + '), not ' + JSON.stringify(host));
  return host;
}
const hostAllowed = (header, port) => typeof header === 'string' && ['127.0.0.1:' + port, 'localhost:' + port, '[::1]:' + port].includes(header.toLowerCase());

export function startViewer({ host = '127.0.0.1', port = 4318 } = {}) {
  assertLoopbackHost(host);
  const server = createServer((req, res) => {
    const actual = server.address().port;
    if (!hostAllowed(req.headers.host, actual)) { res.writeHead(421, HEADERS); return res.end('Misdirected request: loopback only.'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { ...HEADERS, Allow: 'GET, HEAD' }); return res.end('Method not allowed. The viewer accepts no submission.'); }
    const path = (req.url || '/').split('?')[0];
    const entry = Object.prototype.hasOwnProperty.call(FILES, path) ? FILES[path] : null;
    if (!entry) { res.writeHead(404, HEADERS); return res.end('Not found.'); }
    const body = readFileSync(entry[0]);
    res.writeHead(200, { ...HEADERS, 'Content-Type': entry[1], 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => resolve(server)); });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const val = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  try {
    const host = assertLoopbackHost(val('--host') || '127.0.0.1');
    const port = Number(val('--port') || 4318);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('refused: invalid port');
    const server = await startViewer({ host, port });
    const a = server.address();
    console.log('JRS frozen synthetic demonstration viewer (local, offline, synthetic cases only): http://' + (a.family === 'IPv6' ? '[' + a.address + ']' : a.address) + ':' + a.port + '/');
    console.log('Press Ctrl+C to stop.');
  } catch (e) { console.error(e.message); process.exit(1); }
}
