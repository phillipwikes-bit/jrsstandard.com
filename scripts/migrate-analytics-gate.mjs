/* Idempotent mechanical replacement of the existing GA4 bootstrap only.
   This script intentionally does not add tracking to untracked pages. */
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const target = '<script src="/assets/jrs-analytics-gate.js"></script>';
const bootstrap = /<script\s+async\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-NVYHJ7BJ92"><\/script>\s*<script>([\s\S]*?)<\/script>/g;
const gaInit = /^window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\];\s*function gtag\(\)\s*\{\s*dataLayer\.push\(arguments\);\s*\}\s*gtag\('js',\s*new Date\(\)\);\s*gtag\('config',\s*'G-NVYHJ7BJ92'\);\s*$/;

let changed = 0;
function* htmlFiles(folder, recursive) {
  const dir = new URL(folder + '/', root);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && recursive) yield* htmlFiles(folder + '/' + entry.name, true);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield { folder, name: entry.name, filename: new URL(entry.name, dir) };
  }
}

for (const [folder, recursive] of [['.', false], ['reviewer', false], ['reference', true]]) {
  for (const { name, filename, folder: sourceFolder } of htmlFiles(folder, recursive)) {
    const original = fs.readFileSync(filename, 'utf8');
    let replacements = 0;
    const revised = original.replace(bootstrap, (_, init) => {
      if (!gaInit.test(init.trim())) {
        throw new Error(`Refusing nonstandard GA initializer in ${path.join(sourceFolder, name)}`);
      }
      replacements += 1;
      return target;
    });
    if (original.includes('googletagmanager.com/gtag/js') && replacements !== 1) {
      throw new Error(`Expected exactly one GA bootstrap in ${path.join(sourceFolder, name)}; found ${replacements}`);
    }
    if (revised !== original) {
      fs.writeFileSync(filename, revised);
      changed += 1;
    }
  }
}
process.stdout.write(`Replaced GA4 bootstrap on ${changed} pages.\n`);
