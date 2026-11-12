import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Source guard for the solid iOS status-edge treatment, not a substitute for
   physical iPhone Safari or Home Screen acceptance testing. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const css = read('assets/jrs-institutional-reference.css');
const collect = (directory) => readdirSync(join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const rel = join(directory, entry.name);
  if (entry.isDirectory()) return collect(rel);
  return entry.isFile() && /\\.html?$/.test(entry.name) ? [rel] : [];
});
const files = collect('');
// Root scan includes nested directories. Remove duplicate paths deterministically.
const paths = [...new Set(files)].filter(p => !p.startsWith('tests/') && !p.startsWith('research/'));
const institutional = paths.filter((p) => /<body\\b[^>]*\\bclass=["'][^"']*\\bjrs-institutional\\b/i.test(read(p)));
assert.equal(institutional.length, 68, 'Expected 68 institutional site routes; update scope deliberately if the published inventory changes');
assert.match(css, /body\\.jrs-institutional:not\\(\\.jrs-home\\):not\\(\\.jrs-campaign-page\\)\\s*\\{\\s*padding-top:14px!important;/);
assert.match(css, /body\\.jrs-institutional > \\.jrs-ios-status-surface\\s*\\{/);
assert.match(css, /background:#f5f7f8!important;/);
assert.match(css, /-webkit-backdrop-filter:none!important;/);
for (const path of institutional) {
  const html = read(path);
  assert.ok(html.includes('jrs-institutional-reference.css'), path + ' must load common status-edge CSS');
  assert.match(html, /<body\\b[^>]*\\bjrs-institutional[^>]*>\\s*<div class="jrs-ios-status-surface" aria-hidden="true"><\\/div>/i, path + ' must paint solid status-bar element as first body child');
  assert.equal((html.match(/class="jrs-ios-status-surface"/g)||[]).length, 1, path + ' must contain one status surface');
}
console.log('iOS top-edge source check passed across ' + institutional.length + ' JRS institutional pages');
