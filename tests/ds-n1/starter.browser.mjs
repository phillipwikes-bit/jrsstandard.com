#!/usr/bin/env node
// The single-file starter edition works offline when opened from disk
// (file://), gives the same result as the command-line demo, and makes no
// network request. Chromium emulation only.
// Usage: node tests/ds-n1/starter.browser.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStarter } from '../../lib/ds-n1/package/build-starter.mjs';
import { runDemo } from '../../lib/ds-n1/demo/run-demo.mjs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const file = join(mkdtempSync(join(tmpdir(), 'ds-starter-')), 'decision-spellcheck-starter.html');
writeFileSync(file, buildStarter().html);
const expected = runDemo(fileURLToPath(new URL('../../lib/ds-n1/demo/case-harbourline/', import.meta.url)));
const browser = await chromium.launch();
const results = [];
const check = (name, fn) => fn().then(() => results.push(['ok', name]), (e) => results.push(['FAIL', name, e.message.split('\n')[0]]));
try {
  for (const [label, opts] of [['desktop', { viewport: { width: 1366, height: 900 }, acceptDownloads: true }], ['iphone-emulated', { ...devices['iPhone 13'], acceptDownloads: true }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [], external = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u); });
    await page.goto('file://' + file);
    await check(`${label}: example case matches the command-line demo, opened from disk`, async () => {
      await page.click('#example'); await page.click('#run');
      await page.waitForSelector('#out .status');
      assert.equal((await page.textContent('#out .status')).replace(/ /g, '_'), expected.state.status);
      assert.equal(await page.locator('#out .claim').count(), expected.extraction.claims.length);
      assert.equal(await page.locator('#omissions li').count(), expected.omissions.length);
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#download')]);
      assert.equal(JSON.parse(readFileSync(await dl.path(), 'utf8')).record_digest, expected.record.record_digest);
    });
    await check(`${label}: opens a Word file offline`, async () => {
      await page.setInputFiles('#rec-file', fileURLToPath(new URL('./fixtures-docx/harbourline-record.libreoffice.docx', import.meta.url)));
      await page.waitForFunction((t) => document.querySelector('#rec-text').value === t, expected.record.text);
    });
    await check(`${label}: no errors, no network requests, no sideways scroll`, async () => {
      assert.deepEqual(errors, []); assert.deepEqual(external, []);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    });
    await ctx.close();
  }
} finally { await browser.close(); }
for (const r of results) console.log(r.join('  '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
