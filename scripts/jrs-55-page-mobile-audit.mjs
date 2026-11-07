import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.JRS_BASE_URL || 'https://www.jrsstandard.com';
const widths = [320, 375, 390, 430, 768];
const timeout = 20000;
const browser = await chromium.launch({ headless: true });
const defects = [];
const checks = [];
await mkdir('artifacts/jrs-acceptance', { recursive: true });

function record(page, width, code, detail, severity = 'high') {
  defects.push({ page, width, code, detail, severity });
}
try {
  const sitemap = await fetch(new URL('/sitemap.xml', base));
  if (!sitemap.ok) throw new Error('Sitemap HTTP ' + sitemap.status);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)]
    .map(m => m[1].trim()).filter(u => new URL(u).origin === new URL(base).origin);
  if (urls.length !== 55) record('sitemap', null, 'PAGE_COUNT', 'Expected 55 indexed URLs, found ' + urls.length);
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 812 }, deviceScaleFactor: 1, isMobile: width <= 430, hasTouch: width <= 430 });
    const page = await context.newPage();
    for (const url of urls) {
      const path = new URL(url).pathname;
      const entry = { path, width, status: null, title: '', overflowPx: null, missingMain: false, navCount: 0, clippedCandidates: [], viewportMeta: false, errors: [] };
      try {
        const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout });
        entry.status = response?.status() ?? null;
        if (!response || response.status() >= 400) record(path, width, 'HTTP', 'HTTP ' + entry.status);
        await page.waitForTimeout(500);
        entry.title = await page.title();
        const measurements = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const vw = doc.clientWidth;
          const viewportMeta = !!document.querySelector('meta[name="viewport"]');
          const candidates = [...document.querySelectorAll('body *')].filter(el => {
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            return r.width > 0 && r.right > vw + 2 && cs.position !== 'fixed' && cs.visibility !== 'hidden';
          }).slice(0, 8).map(el => ({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 90), right: Math.round(el.getBoundingClientRect().right) }));
          return { viewport: vw, scrollWidth: Math.max(doc.scrollWidth, body?.scrollWidth || 0), main: !!document.querySelector('main'), nav: document.querySelectorAll('nav').length, viewportMeta, candidates };
        });
        entry.overflowPx = Math.max(0, measurements.scrollWidth - measurements.viewport);
        entry.missingMain = !measurements.main;
        entry.navCount = measurements.nav;
        entry.viewportMeta = measurements.viewportMeta;
        entry.clippedCandidates = measurements.candidates;
        if (entry.overflowPx > 2) record(path, width, 'OVERFLOW', entry.overflowPx + 'px overflow; candidates ' + JSON.stringify(measurements.candidates));
        if (!entry.viewportMeta) record(path, width, 'NO_VIEWPORT_META', 'Missing responsive viewport declaration', 'medium');
        if (entry.clippedCandidates.length && entry.overflowPx <= 2) record(path, width, 'POSSIBLE_CLIPPED_CONTENT', 'Elements extend past viewport despite no document scrolling: ' + JSON.stringify(entry.clippedCandidates), 'medium');
        if (entry.missingMain) record(path, width, 'NO_MAIN', 'No semantic main landmark', 'medium');
        if (!entry.navCount) record(path, width, 'NO_NAV', 'No semantic nav landmark', 'medium');
        if (!entry.title.trim()) record(path, width, 'NO_TITLE', 'Missing document title', 'medium');
      } catch (err) {
        entry.errors.push(String(err));
        record(path, width, 'NAVIGATION_ERROR', String(err));
      }
      checks.push(entry);
    }
    await context.close();
  }
  const summary = { base, checkedAt: new Date().toISOString(), expectedPages: 55, discoveredPages: urls.length, widths, pageWidthChecks: checks.length, defects: defects.length, highSeverity: defects.filter(d => d.severity === 'high').length };
  await writeFile('artifacts/jrs-acceptance/results.json', JSON.stringify({ summary, checks, defects }, null, 2));
  const rows = defects.map(d => '| ' + [d.severity, d.page, d.width ?? '-', d.code, d.detail.replaceAll('|', '/').replaceAll('\n', ' ').slice(0, 180)].join(' | ') + ' |');
  await writeFile('artifacts/jrs-acceptance/report.md', [
    '# JRS automated mobile page audit', '', 'Target: ' + base, 'Timestamp: ' + summary.checkedAt,
    'Sitemap URLs: ' + urls.length + ' (expected 55)',
    'Page-width checks: ' + checks.length,
    'Defects: ' + defects.length + ' (' + summary.highSeverity + ' high)',
    '', 'This is a browser geometry and page-load smoke test, not WCAG certification, human comprehension testing, PDF byte verification, or critical journey acceptance.',
    '', '| Severity | Page | Width | Code | Detail |', '| --- | --- | --- | --- | --- |', ...rows, ''
  ].join('\n'));
  console.log(JSON.stringify(summary));
  if (summary.highSeverity > 0) process.exitCode = 1;
} finally {
  await browser.close();
}
