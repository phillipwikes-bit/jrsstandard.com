import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { prepareRevisionPreview } from '../engineering/incomeos/prepare-revision-preview.mjs';

export async function verifyRevisionPreview(chromium, launchOptions) {
  const directory = await mkdtemp(join(tmpdir(), 'incomeos-staged-browser-'));
  const projectRef = 'syntheticrevisiondbx';
  const publishableKey = 'sb_publishable_synthetic_revision_fixture_key';
  const target = `https://${projectRef}.supabase.co`;
  const password = 'synthetic staging password';
  const passphrase = 'synthetic staging workspace passphrase';
  const output = join(directory, 'preview');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  const server = createServer(async (request, response) => {
    const name = new URL(request.url, 'http://localhost').pathname.slice(1) || 'index.html';
    if (!/^[a-z0-9.-]+$/.test(name) || !mime[extname(name)]) { response.writeHead(404).end(); return; }
    try {
      const bytes = await readFile(join(output, name));
      response.writeHead(200, { 'Content-Type': mime[extname(name)] }).end(bytes);
    } catch (_) { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    const options = { output, origin, projectRef, publishableKey, browserFixture: true };
    await assert.rejects(prepareRevisionPreview({ ...options, origin: 'https://incomeos-opportunity-desk.vercel.app' }), /exact protected/);
    await assert.rejects(prepareRevisionPreview({ ...options, projectRef: 'pmvqxdgvnwhckzxojioa' }), /isolated Supabase/);
    await assert.rejects(prepareRevisionPreview({ ...options, publishableKey: 'sb_secret_fixture' }), /publishable key/);
    await prepareRevisionPreview(options);
    const headers = await readFile(join(output, 'vercel.json'), 'utf8');
    assert.ok(headers.includes(target));
    assert.doesNotMatch(headers, /pmvqxdgvnwhckzxojioa/);

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const calls = [], unexpected = [], errors = [];
    let latest = null, allowlisted = false, writes = 0;
    const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'apikey,authorization,content-type',
      'access-control-allow-methods': 'POST,OPTIONS', 'content-type': 'application/json' };
    await context.route(`${target}/**`, async route => {
      const req = route.request(), path = new URL(req.url()).pathname;
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      calls.push(path);
      const reply = (status, data) => route.fulfill({ status, headers: cors, body: JSON.stringify(data) });
      if (req.headers().apikey !== publishableKey) return reply(403, {});
      if (path === '/auth/v1/token') {
        return req.postDataJSON().password === password
          ? reply(200, { access_token: 'synthetic-owner-token', expires_in: 3600, user: { id: 'synthetic-owner' } })
          : reply(400, { error_description: 'Invalid login credentials' });
      }
      if (!allowlisted || req.headers().authorization !== 'Bearer synthetic-owner-token') return reply(403, {});
      if (path === '/rest/v1/rpc/incomeos_latest_workspace_revision') return reply(200, latest);
      if (path === '/rest/v1/rpc/incomeos_append_workspace_revision') {
        const r = req.postDataJSON();
        if (r.expected_revision !== (latest?.revision ?? 0)) return reply(409, {});
        assert.doesNotMatch(req.postData(), /Synthetic staged expense|synthetic staging workspace passphrase/);
        assert.equal(createHash('sha256').update(r.encrypted_payload).digest('hex'), r.payload_sha256);
        latest = { revision: ++writes, ciphertext: r.encrypted_payload, ciphertext_sha256: r.payload_sha256 };
        return reply(200, latest.revision);
      }
      unexpected.push(path);
      return reply(404, {});
    });
    page.on('request', request => {
      if (![origin, target].includes(new URL(request.url()).origin)) unexpected.push(request.url());
    });
    page.on('pageerror', error => errors.push(error.message));
    const show = async () => {
      await page.locator('.bottomnav button[data-view="research"]').tap();
      await page.locator('#cloud-vault-panel summary').tap();
    };
    const login = async (value = password) => {
      await page.locator('#cloud-vault-email').fill('owner@example.org');
      await page.locator('#cloud-vault-password').fill(value);
      await page.locator('#cloud-vault-signin').tap();
    };
    const open = page.locator('#revision-preview-open'), status = page.locator('#cloud-vault-status');
    await page.goto(origin);
    await show();
    const layout = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth,
      outside: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > 376)
        .slice(0, 18).map(el => [el.tagName, el.id, el.className, Math.round(el.getBoundingClientRect().right)]) }));
    assert.ok(layout.viewport <= 375 && layout.page <= 376, `Staged entry fits the 375px viewport ${JSON.stringify(layout)}`);
    assert.equal(await open.isDisabled(), true);
    assert.equal(await page.locator('#cloud-vault-save').isVisible(), false);
    assert.equal(await page.locator('#briefing-file').isVisible(), false);
    assert.deepEqual(calls, [], 'Initial render cannot authenticate or fetch a revision');
    await login('synthetic rejected password');
    await page.waitForFunction(() => document.getElementById('cloud-vault-status').textContent.includes('Invalid login credentials'));
    assert.equal(await open.isDisabled(), true);
    await login();
    await page.locator('#cloud-vault-signout').waitFor();
    await page.locator('#briefing-passphrase').fill(passphrase);
    await open.tap();
    await page.waitForFunction(() => document.getElementById('cloud-vault-status').textContent.includes('access was denied'));
    assert.equal(writes, 0);
    assert.equal(await open.isDisabled(), true, 'A denied identity cannot retain an attached staging session');
    allowlisted = true;
    await login();
    await page.locator('#cloud-vault-signout').waitFor();
    await page.locator('#briefing-passphrase').fill(passphrase);
    await open.tap();
    await page.waitForFunction(() => document.getElementById('cloud-vault-status').textContent.includes('Staged vault is empty'));
    await page.locator('#briefing-new').tap();
    await page.locator('.bottomnav button[data-view="ledger"]').tap();
    await page.locator('#cost-label').fill('Synthetic staged expense');
    await page.locator('#cost-amount').fill('42.50');
    await page.locator('#cost-date').fill('2026-11-09');
    await page.locator('#cost-save').tap();
    assert.match(await page.locator('#ledger-list').textContent(), /Synthetic staged expense/);
    assert.equal(writes, 0, 'Editing the same Owner Desk does not write');
    await page.locator('.bottomnav button[data-view="research"]').tap();
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#cloud-vault-signout').tap();
    assert.equal(await page.locator('#cloud-vault-signout').isVisible(), true, 'A dirty draft warns before voluntary sign-out');
    await page.locator('#briefing-save').tap();
    await page.waitForFunction(() => document.getElementById('briefing-status').textContent === 'Encrypted revision saved.');
    assert.equal(writes, 1);
    // Simulate an expired clock at a visibility transition. Every RPC still uses the server check.
    await page.evaluate(() => {
      const now = Date.now;
      Date.now = () => now() + 4_000_000;
      document.dispatchEvent(new Event('visibilitychange'));
      Date.now = now;
    });
    assert.match(await status.textContent(), /session ended/i);
    assert.equal(await page.locator('#revision-recovery-controls').count(), 0);
    assert.equal(await open.isDisabled(), true);
    assert.equal(await page.locator('#briefing-passphrase').inputValue(), '');
    assert.doesNotMatch(await page.locator('#ledger-list').textContent(), /Synthetic staged expense/);
    await page.reload();
    await show();
    assert.equal(await open.isDisabled(), true, 'Restart cannot resume an authenticated session');
    await login();
    await page.locator('#cloud-vault-signout').waitFor();
    await page.locator('#briefing-passphrase').fill(passphrase);
    await open.tap();
    await page.waitForFunction(() => document.getElementById('cloud-vault-status').textContent.includes('Opened staged revision 1'));
    assert.match(await page.locator('#ledger-list').textContent(), /Synthetic staged expense/);
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    assert.equal(writes, 1, 'Fresh readback cannot create another revision');
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    console.log('PASS: prepared 375px Owner Desk, native staged sign-in, access denial, encrypted explicit save, expiry redaction and restart recovery');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
}
