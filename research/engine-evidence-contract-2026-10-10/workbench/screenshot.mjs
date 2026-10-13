#!/usr/bin/env node
// Captures static screenshots of the rendered workbench pages with a local
// headless Chromium. Every request whose URL is not file: is aborted and
// counted; the script fails if any was attempted. No server is started.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const CASES = ['EC-001', 'EC-002', 'EC-003'];

const browser = await chromium.launch({ args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--disable-default-apps'] });
const blocked = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, offline: true });
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith('file:')) return route.continue(); blocked.push(u); return route.abort(); });
  mkdirSync(join(HERE, 'screenshots'), { recursive: true });
  for (const id of CASES) {
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(HERE, 'rendered', id + '.html')).href);
    await page.screenshot({ path: join(HERE, 'screenshots', id + '.png'), fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
if (blocked.length) { console.error('non-file requests attempted and blocked: ' + blocked.join(', ')); process.exit(1); }
console.log('captured ' + CASES.length + ' screenshots; non-file requests: 0');
