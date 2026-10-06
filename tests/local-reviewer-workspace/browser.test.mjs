// End-to-end in headless Chromium against the loopback server. Synthetic packets only.
// Records every request, console message and storage use; any request off loopback fails.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { t, done, skipped, DIR, C, P, RECORD, GAPS, clone, quotations } from './_helpers.mjs';

let chromium;
// Playwright is a local test tool, never a workspace dependency. Look for it on the normal path,
// then in the global module root; if it is absent the browser checks are reported SKIPPED, not passed.
const loadPlaywright = () => {
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  try { const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); return createRequire(join(root, 'noop.js'))('playwright'); } catch { return null; }
};
chromium = (loadPlaywright() || {}).chromium || null;
if (!chromium) { skipped('browser checks', 'playwright is not installed in this environment (set NODE_PATH to its node_modules)'); done(); }

const S = await import(DIR + 'serve.mjs');
const demo = (await import(DIR + 'app/demo-packet.js')).SYNTHETIC_DEMO_PACKET;
const server = await S.startServer({ port: 0 });
const port = server.address().port, origin = 'http://127.0.0.1:' + port;
const tmp = mkdtempSync(join(tmpdir(), 'jrs-rw-browser-'));
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ acceptDownloads: true });
  const page = await ctx.newPage();
  const requests = [], consoleMsgs = [], errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('console', (m) => consoleMsgs.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await ctx.route('**/*', (route) => (route.request().url().startsWith(origin + '/') || route.request().url().startsWith('blob:') ? route.continue() : route.abort()));
  await page.goto(origin + '/');
  // The open button reads files asynchronously; wait until it reports an outcome.
  const clickOpen = async () => { await page.evaluate(() => { document.getElementById('open-status').textContent = ''; }); await page.click('#open-btn'); await page.waitForFunction(() => document.getElementById('open-status').textContent !== ''); };

  t('the page states it is local and offline, and states the confidentiality rule', /Local and offline/.test(await page.textContent('.eyebrow')) && (await page.textContent('#confidentiality')).includes(C.CONFIDENTIALITY_NOTICE));
  t('nothing is open until the reviewer selects a packet (no automatic loading)', await page.isHidden('#review') && await page.isHidden('#refusal'));

  // Open the synthetic demo.
  await page.click('#demo-open');
  t('the synthetic demo packet opens', await page.isVisible('#review'));
  t('the identity panel shows the review ID, digests and source hash', (await page.textContent('#identity-list')).includes(demo.review_identity.review_id) && (await page.textContent('#identity-list')).includes(C.packetDigest(demo)));
  t('a synthetic banner is shown', /SYNTHETIC packet/.test(await page.textContent('#synthetic-banner')));
  const bodyText = await page.textContent('body');
  t('no "verified" or "validated" badge is shown', !/\bverified\b|\bvalidated\b/i.test(await page.textContent('#identity')));
  t('the three finding sections are separate and each holds its own findings',
    (await page.locator('#list-source article').count()) === demo.deterministic_findings.length
    && (await page.locator('#list-candidate article').count()) === demo.model_findings.findings.length
    && (await page.locator('#list-checks article').count()) === demo.model_output_checks.length);
  t('candidate findings are labelled candidate-internal, not JRS or Codebook conditions', /not JRS conditions and not Codebook conditions/.test(await page.textContent('#candidate-desc')));
  t('every finding states that no Codebook correspondence is asserted', (await page.locator('article.finding').count()) === (await page.locator('article.finding dd', { hasText: 'No Codebook correspondence asserted.' }).count()));
  t('every candidate review key status states that no Codebook correspondence is asserted', (await page.locator('#key-status dd').count()) === 5 && (await page.locator('#key-status dd', { hasText: 'No Codebook correspondence asserted.' }).count()) === 5);
  t('quotations carry the location-not-support notice', (await page.locator('blockquote').count()) > 0 && (await page.locator('p.note-q').count()) === (await page.locator('blockquote').count()) && (await page.textContent('p.note-q')).includes('does not show that the text supports the finding'));
  t('no score, rating or percentage is shown', !/\b(score|rating|percent)\b|\d+\s*%|\d+\s*\/\s*(5|10|100)\b/i.test(bodyText));
  t('no ready, approved, compliant or defensible verdict is shown', !/\b(record|packet|finding)s?\s+(is|are)\s+(ready|approved|compliant|defensible)\b/i.test(bodyText) && !/\b(READY|APPROVED|COMPLIANT|DEFENSIBLE)\b/.test(bodyText));
  t('the withheld model text is not shown', !/frustrated/.test(bodyText));

  // Sign-off is blocked until every finding has a disposition.
  const ids = C.listFindings(demo).map((f) => f.id);
  t('sign-off starts disabled with the open findings listed', await page.isDisabled('#signoff-btn') && (await page.textContent('#blockers')).includes(ids.length + ' findings without a disposition'));
  t('export starts disabled', await page.isDisabled('#export-btn'));
  await page.fill('#reviewer-ref', 'Synthetic Reviewer (browser test)');
  await page.fill('#review-date', '2026-10-06');
  await page.selectOption('#disp-' + ids[0], 'NOT_CONFIRMED');
  t('a disposition is not recorded without the packet-binding acknowledgement', /Tick the acknowledgement/.test(await page.textContent('#disp-' + ids[0] + ' ~ p.error')) || (await page.locator('fieldset', { hasText: ids[0] }).locator('.recorded').textContent()).includes('No disposition yet'));
  for (const [n, id] of ids.entries()) {
    await page.selectOption('#disp-' + id, n % 2 ? 'NEEDS_CLARIFICATION' : 'CONFIRMED_FOR_FURTHER_REVIEW');
    if (n === 0) await page.fill('#note-' + id, 'Synthetic note.');
    await page.check('#ack-' + id);
  }
  await page.selectOption('#disp-' + ids[ids.length - 1], 'NO_DISPOSITION');
  await page.check('#signoff-ack');
  t('sign-off stays disabled while one finding has no disposition', await page.isDisabled('#signoff-btn') && /1 finding without a disposition/.test(await page.textContent('#blockers')));
  await page.selectOption('#disp-' + ids[ids.length - 1], 'OUT_OF_SCOPE');
  await page.uncheck('#ack-' + ids[ids.length - 1]); await page.check('#ack-' + ids[ids.length - 1]);
  t('sign-off becomes available once every finding has a disposition', await page.isEnabled('#signoff-btn'));
  await page.click('#signoff-btn');
  t('after sign-off the dispositions are locked', await page.isDisabled('#disp-' + ids[0]) && await page.isDisabled('#reviewer-ref'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export-btn')]);
  const exported = JSON.parse(readFileSync(await dl.path(), 'utf8'));
  t('one click exports a local JSON disposition record', /^disposition-record_/.test(dl.suggestedFilename()) && exported.export_format === C.EXPORT_FORMAT);
  t('the exported record verifies against the demo packet', C.verifyExport(exported, demo).ok, C.verifyExport(exported, demo).problems.join('; '));
  t('the exported record names the reviewer as self-entered and unauthenticated', exported.reviewer.reference === 'Synthetic Reviewer (browser test)' && exported.reviewer.authenticated === false);
  t('the exported record contains no quotation from the packet', !quotations(demo).some((q) => JSON.stringify(exported).includes(q)));

  // Demo download.
  const [dd] = await Promise.all([page.waitForEvent('download'), page.click('#demo-download')]);
  t('the demo download is the synthetic packet only', /^SYNTHETIC-/.test(dd.suggestedFilename()) && JSON.stringify(JSON.parse(readFileSync(await dd.path(), 'utf8'))) === JSON.stringify(demo));

  // A locally selected packet, with and without its source.
  const good = join(tmp, 'SYNTHETIC-gaps.json'); writeFileSync(good, JSON.stringify(P.gaps));
  const src = join(tmp, 'SYNTHETIC-gaps.txt'); writeFileSync(src, GAPS);
  await page.setInputFiles('#packet-file', good); await page.setInputFiles('#source-file', src); await clickOpen();
  t('a locally selected packet and its source text open, with anchors checked against the source', await page.isVisible('#review') && /checked against the source text/.test(await page.textContent('#open-status')));
  t('the source text itself is never shown', !(await page.textContent('body')).includes(GAPS.split('\n')[4]));

  // Refusals.
  const bad = clone(P.flaws); bad.model_findings.findings.find((f) => f.kind === 'flaw').anchors[0].end += 1;
  const badPath = join(tmp, 'SYNTHETIC-bad.json'); writeFileSync(badPath, JSON.stringify(bad));
  await page.setInputFiles('#packet-file', badPath); await page.setInputFiles('#source-file', []); await clickOpen();
  t('a packet with a misaligned anchor is refused and nothing from it is shown', await page.isVisible('#refusal') && await page.isHidden('#review') && /does not align with its quotation/.test(await page.textContent('#refusal-list')));
  const refusalText = await page.textContent('#refusal');
  t('the refusal names fields and identifiers only', !quotations(P.flaws).some((q) => refusalText.includes(q)));
  const cross = clone(P.flaws); cross.review_identity.candidate_version = '0.4.0-local.1';
  const crossPath = join(tmp, 'SYNTHETIC-cross.json'); writeFileSync(crossPath, JSON.stringify(cross));
  await page.setInputFiles('#packet-file', crossPath); await clickOpen();
  t('a cross-version packet is refused', /review_id does not match/.test(await page.textContent('#refusal-list')));
  const junk = join(tmp, 'SYNTHETIC-junk.json'); writeFileSync(junk, '{"not json');
  await page.setInputFiles('#packet-file', junk); await clickOpen();
  t('unreadable JSON is refused without echoing its content', /not readable JSON/.test(await page.textContent('#refusal-list')) && !/not json/.test(await page.textContent('#refusal-list')));
  await page.setInputFiles('#packet-file', good); await page.setInputFiles('#source-file', join(tmp, 'SYNTHETIC-bad.json')); await clickOpen();
  t('a packet opened with the wrong source text is refused', /does not match the packet source hash/.test(await page.textContent('#refusal-list')));

  // Keyboard and focus.
  const kb = await ctx.newPage();
  kb.on('request', (r) => requests.push(r.url()));
  await kb.goto(origin + '/');
  const order = [];
  for (let n = 0; n < 7; n++) { await kb.keyboard.press('Tab'); order.push(await kb.evaluate(() => document.activeElement.id || document.activeElement.className || document.activeElement.tagName)); }
  t('controls are reachable by keyboard in order', ['skip', 'packet-file', 'source-file', 'open-btn', 'demo-open', 'demo-download'].every((x) => order.includes(x)), order.join(' > '));
  t('a visible focus state is defined', /:focus-visible\s*\{[^}]*outline:\s*3px/.test(readFileSync(DIR + 'app/workspace.css', 'utf8')));
  await kb.reload();
  for (let n = 0; n < 10 && (await kb.evaluate(() => document.activeElement.id)) !== 'demo-open'; n++) await kb.keyboard.press('Tab');
  await kb.keyboard.press('Enter');
  t('the synthetic demo opens from the keyboard alone', await kb.isVisible('#review'));
  await kb.close();

  // Nothing left anywhere.
  const storage = await page.evaluate(async () => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie, idb: indexedDB.databases ? (await indexedDB.databases()).length : 0, caches: (await caches.keys()).length }));
  t('nothing was written to local storage, session storage, cookies, IndexedDB or the Cache API', storage.local === 0 && storage.session === 0 && storage.cookie === '' && storage.idb === 0 && storage.caches === 0, JSON.stringify(storage));
  const fetchBlocked = await page.evaluate(async () => { try { await fetch('/core.js'); return false; } catch { return true; } });
  t("the page's CSP blocks a network request even to its own origin", fetchBlocked);
  t('every request went to the loopback server or a local blob', requests.length > 0 && requests.every((u) => u.startsWith(origin + '/') || u.startsWith('blob:')), requests.filter((u) => !u.startsWith(origin)).join(', '));
  t('the page requested only the workspace files', [...new Set(requests.filter((u) => u.startsWith(origin)).map((u) => new URL(u).pathname))].every((p) => ['/', '/workspace.css', '/workspace.js', '/core.js', '/correspondence.js', '/demo-packet.js'].includes(p)));
  t('no script error occurred', errors.length === 0, errors.join('; '));
  t('the workspace wrote nothing to the console except the CSP refusal the test provoked', consoleMsgs.every((m) => /Content Security Policy|connect-src/.test(m)), consoleMsgs.filter((m) => !/Content Security Policy|connect-src/.test(m)).join(' | '));
} finally { await browser.close(); server.close(); rmSync(tmp, { recursive: true, force: true }); }
done();
