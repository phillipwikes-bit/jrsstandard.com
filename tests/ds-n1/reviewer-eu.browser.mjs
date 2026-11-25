#!/usr/bin/env node
// The step-by-step reviewer page shows the EU AI Act lens for an AI
// authorization record and the left-out check for the demo record.
// Chromium emulation only. Usage: node tests/ds-n1/reviewer-eu.browser.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { start } from '../../lib/ds-n1/serve.mjs';
import { runDemo } from '../../lib/ds-n1/demo/run-demo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4395;
const server = await start(PORT);
const browser = await chromium.launch();
const dir = mkdtempSync(join(tmpdir(), 'ds-rv-'));
const demoFile = join(dir, 'demo.json');
writeFileSync(demoFile, JSON.stringify(runDemo(fileURLToPath(new URL('../../lib/ds-n1/demo/case-harbourline/', import.meta.url))).record));
const results = [];
const check = (name, fn) => fn().then(() => results.push(['ok', name]), (e) => results.push(['FAIL', name, e.message.split('\n')[0]]));
try {
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await check('AI authorization record: EU AI Act section in the review summary', async () => {
    await page.setInputFiles('#upload', fileURLToPath(new URL('./fixtures-partner/AUTH-P01.json', import.meta.url)));
    await page.waitForSelector('#rv-eu li');
    assert.ok(await page.locator('#rv-eu li').count() >= 8);
    assert.match(await page.textContent('#sumbody'), /does not show that anyone complies/);
  });
  await check('demo record: left-out point in the review summary; no EU section for a supplier record', async () => {
    await page.setInputFiles('#upload', demoFile);
    await page.waitForSelector('#rv-omissions li');
    assert.match(await page.textContent('#rv-omissions'), /two medium findings open/);
    assert.equal(await page.locator('#rv-eu').count(), 0);
  });
  await check('no page errors', async () => assert.deepEqual(errors, []));
} finally { await browser.close(); server.close(); }
for (const r of results) console.log(r.join('  '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
