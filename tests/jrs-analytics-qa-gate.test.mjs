import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import test from 'node:test';

const loader = fs.readFileSync(new URL('../assets/jrs-analytics-gate.js', import.meta.url), 'utf8');
const repoRoot = new URL('../', import.meta.url);

function run(url, options = {}) {
  const requests = [];
  const values = options.values || new Map();
  const storage = options.storageBlocked ? {
    getItem() { throw new Error('Storage restricted'); },
    setItem() { throw new Error('Storage restricted'); },
    removeItem() { throw new Error('Storage restricted'); },
  } : {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
  const window = {
    location: new URL(url),
    navigator: { webdriver: !!options.webdriver },
    localStorage: storage,
  };
  const document = {
    head: { appendChild(element) { requests.push(element); } },
    createElement(tag) { assert.equal(tag, 'script'); return {}; },
  };
  vm.runInNewContext(loader, { window, document, URLSearchParams, Date });
  return { window, requests, values };
}

test('ordinary production visitors retain GA4 pageviews and interaction collection', () => {
  const { window, requests } = run('https://www.jrsstandard.com/resources.html?utm_source=outreach_email&utm_medium=email');
  assert.equal(window.jrsAnalyticsSuppressed, false);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-NVYHJ7BJ92');
  assert.equal(requests[0].async, true);
  assert.equal(window.dataLayer.length, 2);
  assert.equal(window.dataLayer[0][0], 'js');
  assert.equal(window.dataLayer[1][0], 'config');
  assert.equal(window.dataLayer[1][1], 'G-NVYHJ7BJ92');
  window.gtag('event', 'jrs_training_entry', { resource_id: 'reviewer_training' });
  assert.equal(window.dataLayer[2][0], 'event');
});

test('test URL suppresses collection and persists across other pages', () => {
  const values = new Map();
  const first = run('https://www.jrsstandard.com/?jrs_test=1', { values });
  assert.equal(first.window.jrsAnalyticsSuppressed, true);
  assert.equal(first.requests.length, 0);
  assert.equal(values.get('jrs_analytics_test_mode'), '1');
  assert.equal(typeof first.window.gtag, 'function');
  first.window.gtag('event', 'jrs_tool_open');
  assert.equal(first.window.dataLayer, undefined);
  const second = run('https://www.jrsstandard.com/training.html', { values });
  assert.equal(second.window.jrsAnalyticsSuppressed, true);
  assert.equal(second.requests.length, 0);
});

test('re-enable URL clears the persistent QA flag', () => {
  const values = new Map([['jrs_analytics_test_mode', '1']]);
  const restored = run('https://www.jrsstandard.com/?jrs_test=0', { values });
  assert.equal(restored.window.jrsAnalyticsSuppressed, false);
  assert.equal(restored.requests.length, 1);
  assert.equal(values.has('jrs_analytics_test_mode'), false);
});

test('nonproduction and WebDriver browsers do not send analytics', () => {
  for (const url of ['https://jrsstandard-example.vercel.app/', 'http://localhost:3000/']) {
    const result = run(url);
    assert.equal(result.window.jrsAnalyticsSuppressed, true);
    assert.equal(result.requests.length, 0);
  }
  const webdriver = run('https://www.jrsstandard.com/', { webdriver: true });
  assert.equal(webdriver.window.jrsAnalyticsSuppressed, true);
  assert.equal(webdriver.requests.length, 0);
});

test('explicit query parameters work when local storage is blocked', () => {
  assert.equal(run('https://www.jrsstandard.com/?jrs_test=1', { storageBlocked: true }).requests.length, 0);
  assert.equal(run('https://www.jrsstandard.com/?jrs_test=0', { storageBlocked: true }).requests.length, 1);
});

test('tracked public pages use one shared loader and no unconditional GA bootstrap', () => {
  let pageCount = 0;
  function* htmlFiles(folder, recursive) {
    const dir = new URL(folder + '/', repoRoot);
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && recursive) yield* htmlFiles(folder + '/' + entry.name, true);
      else if (entry.isFile() && entry.name.endsWith('.html')) yield { file: entry.name, dir, folder };
    }
  }
  for (const [folder, recursive] of [['.', false], ['reviewer', false], ['reference', true]]) {
    for (const { file, dir, folder: sourceFolder } of htmlFiles(folder, recursive)) {
      const html = fs.readFileSync(new URL(file, dir), 'utf8');
      assert.doesNotMatch(html, /<script\s+async\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js/i, file);
      const occurrences = html.match(/<script src="\/assets\/jrs-analytics-gate\.js"><\/script>/g) || [];
      assert.ok(occurrences.length <= 1, `Duplicate GA gate on ${path.join(sourceFolder, file)}`);
      if (occurrences.length) pageCount += 1;
    }
  }
  assert.equal(pageCount, 64);
});
