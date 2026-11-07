#!/usr/bin/env node
// Offline screenshots of the rendered Evidence Graph Workbench at desktop and
// mobile widths. Every non-file: request is aborted and counted; the result is
// written to screenshots/SCREENSHOT_RECORD.json. No server is started.
//   NODE_PATH=$(npm root -g) node research/evidence-graph-compiler-2026-10-10/workbench/screenshot.mjs

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const CASES = ['GC-001', 'GC-002', 'GC-003', 'GC-004', 'GC-006', 'GC-008'];
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };

const browser = await chromium.launch({ args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--disable-default-apps'] });
const blocked = [], shots = [];
try {
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: size, offline: true, isMobile: vp === 'mobile' });
    await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('file:')) return r.continue(); blocked.push(u); return r.abort(); });
    for (const id of CASES) {
      const page = await ctx.newPage();
      await page.goto(pathToFileURL(join(HERE, 'rendered', id + '.html')).href);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const file = id + '-' + vp + '.png';
      await page.screenshot({ path: join(HERE, 'screenshots', file), fullPage: true });
      shots.push({ file, viewport: vp, width: size.width, horizontal_page_overflow: overflow });
      await page.close();
    }
    await ctx.close();
  }
} finally { await browser.close(); }
writeFileSync(join(HERE, 'screenshots', 'SCREENSHOT_RECORD.json'), JSON.stringify({ generated: new Date().toISOString(), non_file_requests_aborted: blocked.length, blocked, screenshots: shots }, null, 2) + '\n');
console.log('captured ' + shots.length + ' screenshots; non-file requests aborted: ' + blocked.length + '; pages with horizontal overflow: ' + shots.filter((s) => s.horizontal_page_overflow).length);
process.exit(blocked.length ? 1 : 0);
