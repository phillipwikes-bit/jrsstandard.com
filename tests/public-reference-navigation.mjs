// Public-navigation regression. Source-level only: does not certify live behavior or accessibility.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const file = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const home = file('index.html');
const tools = file('resources.html');
const evidence = file('research.html');
const contact = file('contact.html');
const routes = [
  ['01 · Start here', 'jrsstandard.html'],
  ['02 · Use the method', 'resources.html'],
  ['03 · Examine the evidence', 'research.html'],
  ['04 · Learn and practice', 'training.html']
];
for (const [label, target] of routes) {
  assert.ok(home.includes(label), 'homepage missing route ' + label);
  assert.ok(home.includes('href="' + target + '"'), 'homepage route missing destination ' + target);
  assert.ok(existsSync(new URL('../' + target, import.meta.url)), 'missing target ' + target);
}
assert.equal((home.match(/<div class="card-k">0[1-4] · (?:Start here|Use the method|Examine the evidence|Learn and practice)<\/div>/g) || []).length, 4, 'four pathways should each appear once');
for (const id of ['quick-review', 'field-guides', 'learn', 'review-references', 'supporting-detail']) {
  assert.ok(tools.includes('id="' + id + '"'), 'resources missing section ' + id);
}
for (const target of ['#quick-review', '#field-guides', '#review-references', '#supporting-detail']) {
  assert.ok(tools.includes('href="' + target + '"'), 'role selector missing ' + target);
}
for (const original of [
  'check.html?src=resources',
  '/api/dl?e=standard&amp;src=resources',
  '/api/dl?e=card&amp;src=resources',
  'investigator-guides.html',
  'training.html',
  'simulations.html',
  'reference/',
  'research.html',
  'manifest.html'
]) assert.ok(tools.includes(original), 'public asset/link lost: ' + original);
for (const target of ['research-summary.html', 'methodology.html', 'evidence-ledger.html', 'questions.html', 'research-register.html']) {
  assert.ok(evidence.includes('href="' + target + '"'), 'research traceability link lost: ' + target);
}
assert.ok(contact.includes('action="https://formspree.io/f/mreddwdg"'), 'existing inquiry workflow must remain unchanged');
assert.ok(file('review-engine.html').includes('not a public record-processing service'), 'technical release boundary removed');
console.log('JRS public navigation: 4 routes, 5 resource sections, research traceability and preserved integrations verified.');
