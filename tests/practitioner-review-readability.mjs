// Practitioner review page: readability floor on a phone (added 2026-11-21).
// Objective criteria, measured in a real browser at iPhone 13 size:
//   - Apple HIG: body text 17pt; Material: body 16sp  -> reading text >= 16px
//   - small labels (eyebrow, document titles, step count) >= 13px
//   - WCAG 2.2 SC 1.4.3: text contrast >= 4.5:1
//   - WCAG 2.2 SC 2.5.8: targets >= 24x24px; buttons >= 44px tall (Apple HIG)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const html = readFileSync(new URL('../practitioner-review-f98cc6a497.html', import.meta.url), 'utf8');
const LABELS = ['div.eyebrow', 'p.docs-label', 'b', '#stepcount'];
const browser = await chromium.launch();
try {
  const page = await (await browser.newContext({ ...devices['iPhone 13'] })).newPage();
  await page.route('https://www.jrsstandard.com/**', r => r.request().url().includes('.html')
    ? r.fulfill({ status: 200, body: html, contentType: 'text/html' })
    : r.fulfill({ status: 200, body: '{"ok":true}', contentType: 'application/json' }));
  await page.goto('https://www.jrsstandard.com/practitioner-review-f98cc6a497.html');
  await page.evaluate(() => { document.querySelectorAll('fieldset.step').forEach(f => f.classList.add('on'));
    document.querySelectorAll('details').forEach(d => { d.open = true; }); document.getElementById('jump').classList.add('on'); });
  const r = await page.evaluate(() => {
    const lum = c => { const a = c.match(/[\d.]+/g).map(Number).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
    const bg = el => { while (el) { const c = getComputedStyle(el).backgroundColor; if (c && !/, 0\)$/.test(c) && c !== 'transparent') return c; el = el.parentElement; } return 'rgb(7,7,6)'; };
    const text = [];
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest('.hp')) return;
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
      if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) return;
      const s = getComputedStyle(el), a = lum(s.color), b = lum(bg(el));
      text.push({ key: el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        px: parseFloat(s.fontSize), contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) });
    });
    const targets = [...document.querySelectorAll('button, select, input:not([type=hidden]), summary, textarea')]
      .filter(e => !e.closest('.hp') && (e.offsetParent || getComputedStyle(e).position === 'fixed'))
      .map(e => { const b = e.getBoundingClientRect(); return { key: e.id || e.tagName.toLowerCase(), tag: e.tagName, w: b.width, h: b.height }; });
    return { text, targets };
  });
  for (const t of r.text) {
    const floor = LABELS.includes(t.key) ? 13 : 15;
    assert.ok(t.px >= floor, `${t.key} is ${t.px}px, floor ${floor}px`);
    assert.ok(t.contrast >= 4.5, `${t.key} contrast ${t.contrast.toFixed(2)}:1 is below 4.5:1`);
  }
  for (const t of r.text.filter(t => ['div.record', 'span', 'p.hint', 'textarea'].includes(t.key))) assert.ok(t.px >= 16, `${t.key} reading text ${t.px}px < 16px`);
  for (const t of r.targets) {
    assert.ok(t.w >= 24 && t.h >= 24, `${t.key} target ${t.w}x${t.h} below 24x24`);
    if (t.tag === 'BUTTON') assert.ok(t.h >= 44, `${t.key} button ${t.h}px tall, below 44px`);
  }
  console.log(`PASS readability: ${r.text.length} text styles and ${r.targets.length} targets meet the floors`);
} finally { await browser.close(); }
