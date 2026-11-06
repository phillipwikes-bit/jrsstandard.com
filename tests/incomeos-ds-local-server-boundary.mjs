// Negative security tests for the DS-N1 local development-only HTTP server.
// Never reads or runs sealed HOLDOUT-2, isolation, or stress evaluation cases.
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { start } from '../lib/ds-n1/serve.mjs';

let server;
before(async () => { server = await start(0); });
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
function probe(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port: server.address().port, path, method }, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}
test('local reviewer and explicitly approved demonstration records remain usable', async () => {
  for (const path of ['/', '/author', '/lib/ui/app.mjs', '/fixtures/MANIFEST.json',
    '/fixtures/D06.json', '/fixtures/P01.json']) {
    const response = await probe(path);
    assert.equal(response.status, 200, 'Expected safe demonstration path '+path);
    assert.equal(response.headers['cache-control'], 'no-store');
  }
});
test('sealed and non-demonstration evaluation locations never become web-readable', async () => {
  // Checking the route status does not read or execute the underlying files.
  for (const path of ['/fixtures/holdout2/H01.json', '/fixtures/isolation/I01.json',
    '/fixtures/stress/X01.json', '/fixtures/D20.json', '/fixtures/P06.json',
    '/fixtures/holdout2%2FH01.json', '/fixtures/%68oldout2/H01.json',
    '/fixtures/%2E%2E/holdout2/H01.json', '/fixtures/../holdout2/H01.json',
    '/fixtures/KEY_DO_NOT_SHARE.json']) {
    assert.equal((await probe(path)).status, 404, 'Evaluation route must be denied: '+path);
  }
});
test('unexpected Host headers are denied before serving files', async () => {
  const port = server.address().port;
  for (const host of ['outside.example', 'outside.example:' + port, '127.0.0.1.evil.example']) {
    const status = await new Promise((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path: '/', headers: { Host: host } }, res => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      });
      req.on('error', reject);
      req.end();
    });
    assert.equal(status, 403);
  }
});
test('unsafe methods and malformed escaped paths fail closed', async () => {
  assert.equal((await probe('/fixtures/D06.json', 'POST')).status, 405);
  assert.equal((await probe('/fixtures/%ZZ.json')).status, 400);
  assert.equal((await probe('/lib/%ZZ.mjs')).status, 400);
});
