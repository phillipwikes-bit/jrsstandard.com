// The package boundary: every path this package changed is excluded from deployment, no public or
// deployment-controlling file changed, the controlled sources stay untracked, the build is
// deterministic, the tool reaches no network or model, and no output uses an em dash.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, REPO, IN_REPO, M, read, exists } from './_helpers.mjs';

const BASE = '1d5c3a7';   // the commit before this package began
const git = (args, input) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8', input });
const changed = [...new Set(git(['diff', '--name-only', BASE]).split('\n').concat(git(['ls-files', '--others', '--exclude-standard']).split('\n')).filter(Boolean))];
t('the package changed at least its own tool, tests and documents since ' + BASE, changed.some((p) => p.startsWith('tools/source-alignment/')) && changed.some((p) => p.startsWith('tests/source-alignment/')));

const out = git(['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '-v', '--stdin'], changed.join('\n') + '\n');
const ex = new Map(out.trim().split('\n').filter(Boolean).map((l) => { const [src, p] = l.split('\t'); return [p, src]; }));
const notEx = changed.filter((p) => !ex.has(p) || !/^\.vercelignore:/.test(ex.get(p)));
t('every path changed since ' + BASE + ' is excluded from deployment by .vercelignore', notEx.length === 0, notEx.join(', '));

const PUBLIC = (p) => !/^(tools|tests|docs|research|lib|scripts|\.jrs|schemas|standard)\//.test(p) && !/\.md$/.test(p);
t('no public page or served file changed since ' + BASE, !changed.some(PUBLIC), changed.filter(PUBLIC).join(', '));
t('no API route, OpenAPI, sitemap, vercel.json, .vercelignore, redirect or credential file changed', !changed.some((p) => /^api\/|^openapi\.json$|^sitemap\.xml$|^vercel\.json$|^\.vercelignore$|^_redirects$|\.env/.test(p)));
t('the guard is unchanged', !changed.includes('scripts/check_zero_drift.py'));
t('no release-gate record changed except the new source-alignment addendum', changed.filter((p) => p.startsWith('lib/release-gate/')).every((p) => p === 'lib/release-gate/records/RG-SOURCE-ALIGNMENT-ADDENDUM_2026-10-07.json'));

// ---- the controlled sources ----------------------------------------------------------------------
t('no controlled source path is tracked by git, now or in any commit since ' + BASE, !git(['ls-files', 'project_sources']).trim() && !git(['log', '--name-only', '--format=', BASE + '..HEAD']).split('\n').some((p) => p.startsWith('project_sources')));
t('project_sources/ is excluded from git locally', /project_sources/.test(git(['check-ignore', '-v', 'project_sources/x']).trim()));
t('no changed path is a .txt or other file outside an excluded directory', !changed.some((p) => /\.txt$/.test(p) && !/^(tools|tests|lib|docs\/enterprise-diligence|research|scripts)\//.test(p)));

// ---- deterministic build ------------------------------------------------------------------------------
const a = M.build.buildAll(ROOT), b = M.build.buildAll(ROOT);
t('two builds give byte-identical output', JSON.stringify(a) === JSON.stringify(b));
t('every generated output equals the committed file', Object.entries(a).every(([p, s]) => exists(p) && read(p) === s), Object.keys(a).filter((p) => !exists(p) || read(p) !== a[p]).join(', '));
t('every output path is internal (tools/, lib/release-gate/records/ or docs/architecture/*.md)', Object.keys(a).every((p) => /^(tools\/source-alignment\/|lib\/release-gate\/records\/|docs\/architecture\/.*\.md$)/.test(p)));
if (IN_REPO) {
  let ok = true; try { execFileSync(process.execPath, [join(REPO, 'tools/source-alignment/run.mjs')], { cwd: REPO, stdio: 'ignore' }); } catch (e) { ok = false; }
  t('node tools/source-alignment/run.mjs passes', ok);
}

// ---- no network, model, credential or child process in the tool -----------------------------------------
const walk = (d) => readdirSync(join(ROOT, d)).flatMap((n) => statSync(join(ROOT, d, n)).isDirectory() ? walk(d + '/' + n) : [d + '/' + n]);
const code = walk('tools/source-alignment').filter((p) => /\.(js|mjs)$/.test(p)).map(read).join('\n').replace(/\/\/.*$/gm, '');
t('the tool makes no network request and loads no network module', !/\bfetch\s*\(|node:(http|https|net|dgram|tls)|XMLHttpRequest|WebSocket/.test(code));
// A provider host may appear as cited evidence text (SAC-33 cites the outbound inventory); it is never called.
t('the tool loads no model SDK and reads no environment variable or credential', !/@anthropic-ai|from 'openai'|process\.env|_API_KEY/i.test(code));

// ---- prose -----------------------------------------------------------------------------------------------
// A file that existed before the package is checked on the lines it added: historical entries are preserved as written.
const existed = new Set(git(['ls-tree', '-r', '--name-only', BASE]).split('\n'));
for (const p of changed.filter((x) => /\.(md|json)$/.test(x) && exists(x))) {
  const text = existed.has(p) ? git(['diff', '-U0', BASE, '--', p]).split('\n').filter((l) => /^\+(?!\+\+)/.test(l)).join('\n') : read(p);
  t(p + (existed.has(p) ? ' adds' : ' uses') + ' no em dash', !/—/.test(text));
}
done();
