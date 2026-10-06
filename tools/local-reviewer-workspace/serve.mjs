#!/usr/bin/env node
// JRS local reviewer workspace: loopback-only static server. LOCAL AND OFFLINE ONLY.
//   node tools/local-reviewer-workspace/serve.mjs [--port 4317]
//
// It exists only because browsers will not load JavaScript modules from file://. It:
//   - binds to a loopback address and refuses any other host (no --host 0.0.0.0, no LAN);
//   - answers only GET and HEAD, only for the fixed list of workspace files below;
//   - refuses requests whose Host header is not loopback (DNS-rebinding defence);
//   - never reads a packet: packets are opened in the browser and never sent here;
//   - makes no outbound connection, and sends a Content-Security-Policy with connect-src 'none',
//     so the page itself cannot make a network request of any kind.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

export const LOOPBACK = Object.freeze(['127.0.0.1', '::1', 'localhost']);
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'; worker-src 'none'; manifest-src 'none'; media-src 'none'; font-src 'none'";
const APP = new URL('./app/', import.meta.url).pathname;
const FILES = Object.freeze({
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/workspace.css': ['workspace.css', 'text/css; charset=utf-8'],
  '/workspace.js': ['workspace.js', 'text/javascript; charset=utf-8'],
  '/core.js': ['core.js', 'text/javascript; charset=utf-8'],
  '/demo-packet.js': ['demo-packet.js', 'text/javascript; charset=utf-8'],
});
const HEADERS = {
  'Content-Security-Policy': CSP, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Opener-Policy': 'same-origin', 'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), usb=(), serial=(), payment=()',
};

export function assertLoopbackHost(host) {
  if (!LOOPBACK.includes(host)) throw new Error('refused: the workspace binds only to a loopback address (' + LOOPBACK.join(', ') + '), not ' + JSON.stringify(host));
  return host;
}

function hostAllowed(header, port) {
  if (typeof header !== 'string') return false;
  return ['127.0.0.1:' + port, 'localhost:' + port, '[::1]:' + port].includes(header.toLowerCase());
}

export function startServer({ host = '127.0.0.1', port = 4317 } = {}) {
  assertLoopbackHost(host);
  const server = createServer((req, res) => {
    const actual = server.address().port;
    if (!hostAllowed(req.headers.host, actual)) { res.writeHead(421, HEADERS); return res.end('Misdirected request: loopback only.'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { ...HEADERS, Allow: 'GET, HEAD' }); return res.end('Method not allowed. The workspace accepts no uploads.'); }
    const path = (req.url || '/').split('?')[0];
    const entry = Object.prototype.hasOwnProperty.call(FILES, path) ? FILES[path] : null;
    if (!entry) { res.writeHead(404, HEADERS); return res.end('Not found.'); }
    const body = readFileSync(APP + entry[0]);
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
    const port = Number(val('--port') || 4317);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('refused: invalid port');
    const server = await startServer({ host, port });
    const a = server.address();
    console.log('JRS local reviewer workspace (local, offline): http://' + (a.family === 'IPv6' ? '[' + a.address + ']' : a.address) + ':' + a.port + '/');
    console.log('Packets are opened in the browser and never sent to this server. Press Ctrl+C to stop.');
  } catch (e) { console.error(e.message); process.exit(1); }
}
