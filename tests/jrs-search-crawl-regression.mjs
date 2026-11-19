// Ensure public links use preferred URLs and browser data requests keep their
// intended upstream origin. This does not assert that Google indexed a page.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const aliases = new Set(['/index.html', '/privacy.html', '/reference/', '/reference/ai-verification-controls/']);
for (const page of urls) {
  const path = new URL(page).pathname.slice(1);
  const filename = !path ? 'index.html' : path.endsWith('.html') ? path : path.replace(/\/$/, '') + '/index.html';
  const html = read(filename);
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const target = new URL(match[1].replaceAll('&amp;', '&'), page);
    assert.ok(target.origin !== 'https://www.jrsstandard.com' || !aliases.has(target.pathname),
      `${filename} links to non-preferred ${target.pathname}`);
  }
}

const upstream = 'https://pjzxkeviouofdseagvpf.supabase.co';
function scriptWith(page, marker) {
  return [...read(page).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]).find(script => script.includes(marker));
}
function context() {
  const calls = [];
  const elements = {
    'resp-text': { value: 'example response' },
    'resp-btn': {},
    'resp-status': { style: {} },
    questions: { innerHTML: '' },
  };
  const sandbox = {
    window: {}, location: { search: '' }, URLSearchParams,
    document: { getElementById: id => elements[id] || null, createElement: () => ({ textContent: '', innerHTML: '' }) },
    localStorage: { getItem: () => null, setItem: () => {} },
    fetch: (url, options = {}) => {
      calls.push({ url, method: options.method || 'GET' });
      return Promise.resolve({ ok: true, json: async () => [] });
    },
  };
  vm.createContext(sandbox);
  return { sandbox, calls };
}

const questions = context();
vm.runInContext(scriptWith('questions.html', '/rest/v1/research_questions'), questions.sandbox);
assert.equal(questions.calls[0].url, `${upstream}/rest/v1/research_questions?select=question,status,related_study,evidence,dataset_size&order=sort.asc`);

const finding = context();
vm.runInContext(scriptWith('finding.html', '/rest/v1/finding_poll_votes'), finding.sandbox);
finding.sandbox.jrsLoadResults();
finding.sandbox.window.jrsVote('A');
finding.sandbox.window.submitResponse();
assert.deepEqual(finding.calls.map(({ url, method }) => [new URL(url).pathname, method]), [
  ['/rest/v1/findings', 'GET'],
  ['/rest/v1/finding_poll_votes', 'GET'],
  ['/rest/v1/finding_poll_votes', 'POST'],
  ['/rest/v1/finding_responses', 'POST'],
]);
for (const call of finding.calls) assert.equal(new URL(call.url).origin, upstream);
console.log(`PASS: ${urls.length} sitemap pages link to preferred destinations; data requests retain their upstream URLs.`);
