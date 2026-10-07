// End-to-end in headless Chromium against the loopback viewer. Synthetic cases only. Records every
// request, console message, storage use and page error; any request off loopback is aborted and fails.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { t, done, skipped, PKG, json } from './_helpers.mjs';

const load = () => {
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  try { const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); return createRequire(join(root, 'noop.js'))('playwright'); } catch { return null; }
};
const chromium = process.env.FD_MUTATION_CHILD ? null : (load() || {}).chromium || null;
if (!chromium) { skipped('browser checks', process.env.FD_MUTATION_CHILD ? 'not run inside the mutation overlay' : 'playwright is not installed in this environment'); done(); }

const S = await import(PKG + 'serve-viewer.mjs');
const D = (await import(PKG + 'viewer/demo-data.js')).FROZEN_DEMO;
const server = await S.startViewer({ port: 0 }), origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  const requests = [], offsite = [], errors = [], consoleMsgs = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => consoleMsgs.push(m.text()));
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith(origin + '/')) return route.continue(); offsite.push(u); return route.abort(); });
  await page.goto(origin + '/');
  t('the page loads without errors or console output', errors.length === 0 && consoleMsgs.length === 0, errors.concat(consoleMsgs).join(' | '));
  t('the synthetic banner and the not-live statement are visible', /SYNTHETIC CASES/.test(await page.textContent('#synthetic-banner')) && /not running against a live model/.test(await page.textContent('#not-live')));
  t('the package status is shown exactly', (await page.textContent('#package-status')) === 'DEMO_PREPARATION_COMPLETE_NOT_RELEASED');
  const ident = await page.textContent('#identity-list');
  t('package, candidate, prompt and adapter identities are visible', [D.package.package_id, D.package.candidate_version, D.package.prompt_version, 'deterministic_mock', 'mock-frozen-demo'].every((s) => ident.includes(s)));
  t('the case selector lists the five synthetic cases', (await page.locator('#case-select option').count()) === 5 && (await page.locator('#case-select option').allTextContents()).every((x, i) => x.startsWith('FD-0' + (i + 1))));
  t('the scope and limitations panel lists every limitation', (await page.locator('#limitations-list li').count()) === Object.keys(D.scope_and_limitations.limitations).length && /supplier-access exception drafts only/.test(await page.textContent('#scope-text')));
  t('the record identity is shown for the selected case', (await page.textContent('#case-summary')).includes('SYNTHETIC-FD-01') && (await page.textContent('#case-summary')).includes(D.cases[0].source_sha256.slice(0, 16)));

  // Tabs and keyboard.
  await page.focus('#tab-source'); await page.keyboard.press('ArrowRight');
  t('ArrowRight moves to the candidate findings tab and shows only its panel', (await page.getAttribute('#tab-candidate', 'aria-selected')) === 'true' && await page.isVisible('#panel-candidate') && await page.isHidden('#panel-source'));
  await page.keyboard.press('End');
  t('End moves to the last tab', (await page.getAttribute('#tab-limits', 'aria-selected')) === 'true' && await page.isVisible('#panel-limits'));
  await page.keyboard.press('Home');
  t('Home returns to the first tab', (await page.getAttribute('#tab-source', 'aria-selected')) === 'true');

  // Every case and every section.
  for (let i = 0; i < 5; i++) {
    const c = D.cases[i];
    await page.selectOption('#case-select', String(i));
    for (const tab of ['source', 'candidate', 'packet', 'human', 'limits']) {
      await page.click('#tab-' + tab);
      const txt = await page.textContent('#panel-' + tab);
      t(c.record_id + ' ' + tab + ' section renders content', txt.trim().length > 40);
    }
    const body = (await page.textContent('#main')).replace(/\bno (score|rating|percentage)\b/gi, '');   // a negated mention is a limitation
    t(c.record_id + ': no score, percentage or final decision shown', !/\b(score|rating|percent)\b|\d+\s*%|\b(?:overall|final)\s+(?:result|decision|verdict)\b|\b(?:record|case|package)\s+(?:is|are)\s+(?:ready|approved|passed)\b/i.test(body));
    await page.click('#tab-limits');
    t(c.record_id + ': what the case does not establish lists every record limitation', (await page.locator('#panel-limits li').count()) === c.does_not_establish.length);
  }

  // The refusal case.
  await page.selectOption('#case-select', '4');
  t('FD-05 shows the refusal banner', await page.isVisible('#refusal-banner') && /refused before any model review \(partial_input\)/.test(await page.textContent('#refusal-banner')));
  await page.click('#tab-candidate');
  t('FD-05 candidate section says nothing was reviewed and the adapter was called 0 times', /Not reviewed/.test(await page.textContent('#panel-candidate')) && /called 0 times/.test(await page.textContent('#panel-candidate')));
  await page.click('#tab-source');
  t('FD-05 source section shows the partial-input refusal codes', /pages_missing/.test(await page.textContent('#panel-source')) && /ends_mid_sentence/.test(await page.textContent('#panel-source')));
  await page.selectOption('#case-select', '1');
  t('the refusal banner is hidden for an examined case', await page.isHidden('#refusal-banner'));
  await page.click('#tab-candidate');
  t('FD-02 candidate findings show the quotation with the location-not-support notice and no Codebook correspondence', /the supplier is low risk/.test(await page.textContent('#panel-candidate')) && /does not show that the text supports the finding/.test(await page.textContent('#panel-candidate')) && /No Codebook correspondence asserted/.test(await page.textContent('#panel-candidate')));
  await page.click('#tab-human');
  t('FD-02 human disposition example is labelled illustrative and the reviewer unauthenticated', /ILLUSTRATIVE EXAMPLE/.test(await page.textContent('#panel-human')) && /not authenticated/.test(await page.textContent('#panel-human')));

  // Local manifest check.
  await page.click('#check-btn');
  t('the local manifest check matches every item (27 checks) and says what that shows', /matches the frozen manifest \(27 checks\)/.test(await page.textContent('#check-status')) && (await page.locator('#check-list li.bad').count()) === 0);

  // Isolation.
  const storage = await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]);
  t('nothing was written to storage or cookies', storage[0] === 0 && storage[1] === 0 && storage[2] === '');
  t('no request left loopback', offsite.length === 0 && requests.every((u) => u.startsWith(origin + '/')), offsite.join(', '));
  t('only the fixed viewer files were requested', requests.every((u) => ['/', '/viewer.css', '/viewer.js', '/demo-data.js', '/core.js', '/correspondence.js'].includes(new URL(u).pathname)));
  const width = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  t('no horizontal scroll at 375px', width[0] <= width[1], width.join(' > '));
  const blocked = await page.evaluate(async () => { try { await fetch('/demo-data.js'); return false; } catch { return true; } });
  t("the page's own CSP blocks even a same-origin fetch", blocked);
} finally { await browser.close(); server.close(); }
done();
