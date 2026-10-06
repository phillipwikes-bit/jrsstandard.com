// Loopback-only static server. Local only: every request goes to 127.0.0.1.
import { request } from 'node:http';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { t, done, DIR } from './_helpers.mjs';

const S = await import(DIR + 'serve.mjs');
const get = (port, path, { method = 'GET', host } = {}) => new Promise((resolve, reject) => {
  const req = request({ host: '127.0.0.1', port, path, method, headers: host === undefined ? {} : { host } }, (res) => {
    let body = ''; res.on('data', (c) => { body += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', reject); req.end();
});

for (const h of ['0.0.0.0', '::', '192.168.1.10', '10.0.0.1', 'example.com', '']) {
  let refused = false; try { await S.startServer({ host: h, port: 0 }); } catch (e) { refused = /binds only to a loopback address/.test(e.message); }
  t('refuses to bind to ' + JSON.stringify(h), refused);
}
const cli = (args) => { try { execFileSync(process.execPath, [DIR + 'serve.mjs', ...args], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000 }); return 0; } catch (e) { return e.status; } };
t('the command refuses --host 0.0.0.0 and exits 1', cli(['--host', '0.0.0.0', '--port', '0']) === 1);

const server = await S.startServer({ port: 0 });
const addr = server.address(), port = addr.port;
try {
  t('binds to the loopback address', addr.address === '127.0.0.1');
  const root = await get(port, '/');
  t('serves the workspace page on loopback', root.status === 200 && /Local reviewer workspace/.test(root.body));
  const csp = root.headers['content-security-policy'] || '';
  t("sends a Content-Security-Policy with connect-src 'none'", /connect-src 'none'/.test(csp) && /default-src 'none'/.test(csp) && /form-action 'none'/.test(csp) && !/https?:/.test(csp));
  t('sends no-store, nosniff and no-referrer', root.headers['cache-control'] === 'no-store' && root.headers['x-content-type-options'] === 'nosniff' && root.headers['referrer-policy'] === 'no-referrer');
  t('sets no cookie', !('set-cookie' in root.headers));
  for (const f of ['/workspace.js', '/core.js', '/correspondence.js', '/workspace.css', '/demo-packet.js']) t('serves ' + f, (await get(port, f)).status === 200);
  for (const f of ['/serve.mjs', '/../serve.mjs', '/%2e%2e/serve.mjs', '/app/core.js', '/.vercelignore', '/README.md', '/../../../CLAUDE.md']) t('does not serve ' + f, (await get(port, f)).status === 404);
  for (const m of ['POST', 'PUT', 'DELETE', 'PATCH']) t('refuses ' + m + ' (no uploads)', (await get(port, '/', { method: m })).status === 405);
  t('refuses a non-loopback Host header (DNS rebinding)', (await get(port, '/', { host: 'evil.example:' + port })).status === 421);
  t('refuses a loopback Host header on another port', (await get(port, '/', { host: '127.0.0.1:1' })).status === 421);
  t('accepts localhost as the Host header', (await get(port, '/', { host: 'localhost:' + port })).status === 200);
} finally { server.close(); }
const src = readFileSync(DIR + 'serve.mjs', 'utf8');
t('the server imports only node:http and node:fs', [...src.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]).sort().join() === 'node:fs,node:http');
t('the server makes no outbound request', !/\brequest\s*\(|\bfetch\s*\(|\bget\s*\(|net\.connect|createConnection|https?:\/\/(?!127\.0\.0\.1|localhost|\[' \+)/.test(src.split('\n').filter((l) => !/console\.(log|error)/.test(l) && !/^\s*\/\//.test(l)).join('\n')));
done();
