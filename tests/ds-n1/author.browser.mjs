#!/usr/bin/env node
// Browser checks for the DS-N1 authoring screen (/author). Chromium emulation
// only; not a real-device or assistive-technology test.
// Usage: node tests/ds-n1/author.browser.mjs [--shots dir]
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { start } from '../../lib/ds-n1/serve.mjs';
import { validateRecord, openReview, deriveState, STATUS } from '../../lib/ds-n1/index.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
const PORT = 4393;
const server = await start(PORT);
const browser = await chromium.launch();
const results = [];
const check = (name, fn) => fn().then(() => results.push(['ok', name]), (e) => results.push(['FAIL', name, e.message.split('\n')[0]]));
const statusText = (page) => page.textContent('#check .status');
const select = (page, sel, text) => page.evaluate(([s, t]) => { const ta = document.querySelector(s); const i = ta.value.indexOf(t); if (i < 0) throw new Error('text not found: ' + t); ta.focus(); ta.setSelectionRange(i, i + t.length); }, [sel, text]);
const RECORD = 'Bluefin Metrics requested SFTP access to the billing export on 2026-08-04.';
const SOURCE = 'Ticket T-551. Bluefin Metrics requested SFTP access to the billing export on 2026-08-04.';

try {
  for (const [label, opts] of [['desktop', { viewport: { width: 1366, height: 900 }, acceptDownloads: true }], ['iphone-emulated', { ...devices['iPhone 13'], acceptDownloads: true }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${PORT}/`) && !r.url().startsWith('blob:')) external.push(r.url()); });
    await page.goto(`http://127.0.0.1:${PORT}/author`);
    await page.waitForSelector('#check .status');
    let downloaded = null;

    await check(`${label}: unconfirmed records are refused and cannot be saved`, async () => {
      assert.equal(await statusText(page), 'REFUSED_SCOPE');
      await page.click('#download');
      assert.match(await page.textContent('#msg'), /Not saved: confirm/);
    });

    await check(`${label}: write a record by typing and selecting; status moves HOLD -> READY`, async () => {
      await page.check('#rec-fictional');
      await page.fill('#rec-text', RECORD);
      await page.fill('#ent-name', 'Bluefin Metrics');
      await page.click('#add-entity');
      await page.click('#add-source');
      await page.fill('#src-text-S1', SOURCE);
      await page.fill('input[aria-label="Event role in S1"]', 'request');
      await page.fill('input[aria-label="Event date in S1"]', '2026-08-04');
      await page.click('#sources button:text-is("Add event")');
      await page.selectOption('#claim-kind', 'chronology');
      await select(page, '#rec-text', RECORD);
      await page.click('#mark-claim');
      await page.fill('input[aria-label="Event role claimed in C1"]', 'request');
      await page.fill('input[aria-label="Event date claimed in C1"]', '2026-08-04');
      assert.equal(await statusText(page), 'HOLD', 'a claim with no citation must hold');
      assert.match(await page.textContent('#check'), /UNSUPPORTED_CLAIM/);
      await select(page, '#src-text-S1', 'requested SFTP access to the billing export');
      await page.click('#claim-C1 button:text-is("Cite selected passage")');
      await page.waitForFunction(() => document.querySelector('#check .status').textContent === 'READY_FOR_HUMAN_FINALIZATION');
      assert.match(await page.textContent('#check'), /this is not approval/);
      assert.match(await page.textContent('#check'), /Sufficiency is never decided/);
    });
    if (shots) await page.screenshot({ path: `${shots}/ds-n1-author-${label}.png`, fullPage: true });

    await check(`${label}: no control overflows its panel`, async () => {
      const bad = await page.evaluate(() => [...document.querySelectorAll('section')].filter((s) => s.scrollWidth > s.clientWidth + 1).map((s) => s.getAttribute('aria-labelledby')));
      assert.deepEqual(bad, []);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 1, `page overflow ${over}px`);
    });

    await check(`${label}: downloaded record validates in the engine and reviews READY`, async () => {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
      downloaded = JSON.parse(readFileSync(await dl.path(), 'utf8'));
      assert.equal(validateRecord(downloaded).status, null);
      assert.equal(downloaded.data_classification, 'constructed_fictional');
      assert.deepEqual(downloaded.claims[0].citations, [{ source_id: 'S1', quote: 'requested SFTP access to the billing export' }]);
      assert.equal(downloaded.claims[0].actor, undefined);
      assert.equal(deriveState(openReview(downloaded, { at: '2026-11-03T18:00:00Z' })).status, STATUS.READY);
    });

    await check(`${label}: the reviewer screen opens the authored file`, async () => {
      const rp = await ctx.newPage();
      await rp.goto(`http://127.0.0.1:${PORT}/`);
      await rp.waitForFunction(() => document.getElementById('statusbox').textContent !== 'No record');
      await rp.setInputFiles('#upload', { name: 'authored.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(downloaded)) });
      await rp.waitForFunction(() => /Bluefin Metrics requested SFTP/.test(document.getElementById('record').textContent));
      assert.equal(await rp.textContent('#statusbox'), 'READY_FOR_HUMAN_FINALIZATION');
      await rp.close();
    });

    await check(`${label}: identifier-like content is refused and not saved`, async () => {
      await page.fill('#src-text-S1', SOURCE + ' Contact ops@bluefin.example for access.');
      assert.equal(await statusText(page), 'REFUSED_SCOPE');
      assert.match(await page.textContent('#check'), /PERSONAL_IDENTIFIER_PATTERN/);
      assert.ok(!/ops@bluefin/.test(await page.textContent('#check')), 'value not echoed');
      await page.click('#download');
      assert.match(await page.textContent('#msg'), /Not saved: the record is REFUSED_SCOPE/);
      await page.fill('#src-text-S1', SOURCE);
    });

    await check(`${label}: reopening a file never inherits the fictional confirmation`, async () => {
      await page.setInputFiles('#load', { name: 'authored.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(downloaded)) });
      await page.waitForFunction(() => document.getElementById('rec-text').value.length > 0);
      assert.equal(await page.isChecked('#rec-fictional'), false);
      assert.equal(await statusText(page), 'REFUSED_SCOPE');
      await page.check('#rec-fictional');
      assert.equal(await statusText(page), 'READY_FOR_HUMAN_FINALIZATION');
    });

    await check(`${label}: hostile text in the record is rendered inert`, async () => {
      await page.fill('#rec-text', RECORD + ' <img src=x onerror="window.__pwned=1">');
      await select(page, '#rec-text', '<img src=x onerror="window.__pwned=1">');
      await page.click('#mark-claim');
      assert.equal(await page.evaluate(() => window.__pwned), undefined);
      assert.equal(await page.locator('#claims img').count(), 0);
    });

    await check(`${label}: no console errors and no external requests`, async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
    });
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
for (const r of results) console.log(r.join(' | '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} authoring checks passed (Chromium emulation; not a real-device test)`);
process.exit(failed ? 1 : 0);
