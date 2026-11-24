#!/usr/bin/env node
// Builds the Decision Spellcheck starter edition (2026-11-24): one HTML file
// that runs the /read page offline by double-click, with no install and no
// network. Modules are embedded as data: URLs behind an import map, so the
// code is byte-for-byte the same modules the tests run, not a rewrite.
// HELD: the owner decided (2026-11-22) that it goes to study participants who
// asked for a copy when the study closes. Building it is not a release.
// Usage: node lib/ds-n1/package/build-starter.mjs <output.html>
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { CANDIDATE } from '../identity.mjs';

const lib = fileURLToPath(new URL('../', import.meta.url));
const IMPORT_RE = /(\bfrom\s*|\bimport\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

export function collectModules(entry) {
  const seen = new Map();
  const visit = (abs) => {
    if (seen.has(abs)) return;
    const src = readFileSync(abs, 'utf8');
    if (/from\s*['"]node:|import\(['"]node:|require\(/.test(src)) throw new Error(`${relative(lib, abs)} needs Node; it cannot run in the starter edition`);
    seen.set(abs, src);
    for (const m of src.matchAll(IMPORT_RE)) visit(resolve(dirname(abs), m[3]));
  };
  visit(entry);
  return seen;
}

export function buildStarter() {
  const entry = join(lib, 'ui', 'read.mjs');
  const mods = collectModules(entry);
  const key = (abs) => `ds/${relative(lib, abs).split('\\').join('/')}`;
  const rewrite = (abs, src) => src.replace(IMPORT_RE, (all, kw, q, spec) => `${kw}${q}${key(resolve(dirname(abs), spec))}${q}`);
  const imports = {};
  for (const [abs, src] of mods) if (abs !== entry) imports[key(abs)] = 'data:text/javascript;base64,' + Buffer.from(rewrite(abs, src)).toString('base64');
  let page = readFileSync(join(lib, 'ui', 'read.html'), 'utf8');
  const notice = `<div class="banner" style="margin-top:6px">Starter edition ${CANDIDATE.version}, built ${new Date().toISOString().slice(0, 10)}. Works offline in this file. Fictional records only. Experimental prototype: it can miss gaps and flag sound records. [Terms of use to be confirmed by the owner.] Contact: info@jrsstandard.com</div>`;
  page = page.replace('</header>', `${notice}\n</header>`)
    .replace(/\s*<a href="\/"[^>]*>Open the reviewer<\/a>/, '')
    .replace('<script type="module" src="/lib/ui/read.mjs"></script>',
      `<script type="importmap">${JSON.stringify({ imports })}</script>\n<script type="module">\n${rewrite(entry, mods.get(entry))}\n</script>`);
  if (page.includes('/lib/ui/read.mjs')) throw new Error('entry script was not replaced');
  return { html: page, modules: [...mods.keys()].map((a) => relative(lib, a)).sort(), sha256: createHash('sha256').update(page).digest('hex') };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2];
  if (!out) { console.error('Usage: build-starter.mjs <output.html>'); process.exit(2); }
  const b = buildStarter();
  writeFileSync(out, b.html);
  console.log(`${out}\n${b.modules.length} modules: ${b.modules.join(', ')}\nsha256 ${b.sha256}`);
}
