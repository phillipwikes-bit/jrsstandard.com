#!/usr/bin/env node
// Browser checks for the "check a record from its documents" page (/read).
// Chromium emulation only; not a real-device or assistive-technology test.
// Usage: node tests/ds-n1/read.browser.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { start } from '../../lib/ds-n1/serve.mjs';
import { runDemo } from '../../lib/ds-n1/demo/run-demo.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const PORT = 4394;
const CASE = fileURLToPath(new URL('../../lib/ds-n1/demo/case-harbourline/', import.meta.url));
const expected = runDemo(CASE);
const server = await start(PORT);
const browser = await chromium.launch();
const results = [];
const check = (name, fn) => fn().then(() => results.push(['ok', name]), (e) => results.push(['FAIL', name, e.message.split('\n')[0]]));

try {
  for (const [label, opts] of [['desktop', { viewport: { width: 1366, height: 900 }, acceptDownloads: true }], ['iphone-emulated', { ...devices['iPhone 13'], acceptDownloads: true }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${PORT}/`) && !r.url().startsWith('blob:')) external.push(r.url()); });
    await page.goto(`http://127.0.0.1:${PORT}/read`);
    await page.waitForSelector('#doc-text-1');

    await check(`${label}: refuses to run without the fictional confirmation`, async () => {
      await page.fill('#rec-text', 'Bluefin Metrics requested SFTP access on 2026-08-04.');
      await page.fill('#doc-text-1', 'Bluefin Metrics requested SFTP access on 2026-08-04.');
      await page.click('#run');
      assert.match(await page.textContent('#msg'), /confirm the records are fictional/);
    });

    await check(`${label}: example case gives the same status and claims as the command-line demo`, async () => {
      await page.click('#example');
      await page.click('#run');
      await page.waitForSelector('#out .status');
      const status = (await page.textContent('#out .status')).replace(/ /g, '_');
      assert.equal(status, expected.state.status);
      assert.equal(await page.locator('#out .claim').count(), expected.extraction.claims.length);
      assert.equal(await page.locator('#omissions li').count(), expected.omissions.length);
      assert.match(await page.textContent('#omissions'), /two medium findings open/);
    });

    await check(`${label}: downloaded package is identical to the demo's record`, async () => {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
      const got = JSON.parse(readFileSync(await dl.path(), 'utf8'));
      assert.equal(got.record_digest, expected.record.record_digest);
    });

    await check(`${label}: a Word file fills the record text exactly; a PDF is refused`, async () => {
      await page.fill('#rec-text', '');
      await page.setInputFiles('#rec-file', fileURLToPath(new URL('./fixtures-docx/harbourline-record.libreoffice.docx', import.meta.url)));
      await page.waitForFunction(() => document.querySelector('#rec-text').value.length > 0);
      assert.equal(await page.inputValue('#rec-text'), expected.record.text);
      await page.setInputFiles('#doc-file-1', { name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7') });
      await page.waitForFunction(() => /PDF files cannot be read/.test(document.querySelector('#msg').textContent));
    });

    await check(`${label}: an AI authorization record shows the EU AI Act section, with no compliance claim`, async () => {
      await page.selectOption('#rec-class', 'ai_action_authorization');
      await page.fill('#rec-title', 'AI authorization EU-900 (fictional)');
      await page.fill('#rec-text', 'On 2026-09-02, Marta Lindqvist authorized the triage assistant to sort warranty claims. It is not high-risk under the AI Act. Logs are kept for three months.');
      await page.fill('#doc-text-1', 'On 2026-09-02, Marta Lindqvist authorized the triage assistant to sort warranty claims. It is not high-risk under the AI Act.');
      await page.click('#run');
      await page.waitForSelector('#eu-ai-act');
      assert.equal(await page.locator('#eu-ai-act [data-eu]').count(), 10);
      assert.match(await page.textContent('#eu-ai-act [data-eu="log_retention"]'), /under six months/);
      assert.match(await page.textContent('#eu-ai-act'), /does not show that anyone complies/);
    });

    await check(`${label}: the EU AI Act example runs and shows its gaps`, async () => {
      await page.click('#example-eu'); await page.click('#run');
      await page.waitForSelector('#eu-ai-act');
      assert.match(await page.textContent('#eu-ai-act [data-eu="log_retention"]'), /under six months/);
      assert.match(await page.textContent('#eu-ai-act [data-eu="ai_literacy"]'), /Not shown/);
      assert.match(await page.textContent('#eu-ai-act [data-eu="affected_persons_informed"]'), /no document backs it/);
    });

    await check(`${label}: a real-looking email is refused, not checked`, async () => {
      await page.fill('#rec-text', 'Contact ines.calloway@example.org approved access on 2026-07-14.');
      await page.click('#run');
      assert.match(await page.textContent('#msg'), /Not checked/);
    });

    await check(`${label}: no horizontal scroll, no errors, no outside requests`, async () => {
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 0, `page scrolls sideways by ${over}px`);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
    });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
for (const r of results) console.log(r.join('  '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
