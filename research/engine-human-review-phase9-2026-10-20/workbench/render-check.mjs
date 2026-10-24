#!/usr/bin/env node
// JRS PHASE 9 (adapted from the Phase 7 render check). Offline render check of the static workbench at desktop and mobile widths.
// JavaScript is disabled in the rendering context; every non-file request is
// aborted and counted; horizontal overflow is measured in a separate
// measurement context. Writes execution-record/WORKBENCH_RENDER_RECORD.json and
// screenshots under workbench/screenshots/. No server is started.
//   NODE_PATH=$(npm root -g) node research/engine-human-review-phase9-2026-10-20/workbench/render-check.mjs

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 390, height: 844 } };
const pages = readdirSync(HERE).filter((f) => f.endsWith('.html')).sort();
const browser = await chromium.launch({ args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--disable-default-apps'] });
const rows = [];
try {
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const render = await browser.newContext({ viewport: size, offline: true, isMobile: vp === 'mobile', javaScriptEnabled: false });
    const measure = await browser.newContext({ viewport: size, offline: true, isMobile: vp === 'mobile' });
    for (const ctx of [render, measure]) await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('file:')) return r.continue(); ctx.__blocked = (ctx.__blocked || 0) + 1; return r.abort(); });
    for (const f of pages) {
      const url = pathToFileURL(join(HERE, f)).href;
      const before = (render.__blocked || 0) + (measure.__blocked || 0);
      const p1 = await render.newPage(); await p1.goto(url); await p1.screenshot({ path: join(HERE, 'screenshots', f.replace('.html', '') + '-' + vp + '.png'), fullPage: true }); await p1.close();
      const p2 = await measure.newPage(); await p2.goto(url);
      const overflow = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      await p2.close();
      rows.push({ page: f, viewport: vp, width: size.width, non_file_requests: (render.__blocked || 0) + (measure.__blocked || 0) - before, horizontal_overflow: overflow });
    }
    await render.close(); await measure.close();
  }
} finally { await browser.close(); }
const record = { generated_at: new Date().toISOString(), javascript_enabled: false, measurement_note: 'Overflow is measured with page evaluation in a separate offline context; the pages contain no script.', pages: rows };
mkdirSync(join(HERE, '../execution-record'), { recursive: true });
writeFileSync(join(HERE, '../execution-record/WORKBENCH_RENDER_RECORD.json'), JSON.stringify(record, null, 2) + '\n');
console.log(rows.length + ' renders; non-file requests ' + rows.reduce((a, r) => a + r.non_file_requests, 0) + '; overflow ' + rows.filter((r) => r.horizontal_overflow).map((r) => r.page + '@' + r.viewport).join(',') || 'none');
