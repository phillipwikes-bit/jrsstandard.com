// Deployment exclusion for every changed path, no public or production change, no provider, network,
// export or serving path, documentation and status vocabulary, and the verifier itself.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, IN_REPO, PKG, read, M } from './_helpers.mjs';

const v = await M.verify.verifyReadinessPackage({ root: ROOT });
t('the fail-closed verifier confirms the planning-only controls', v.ok && v.status === 'PLANNING_ONLY_CONTROLS_CONFIRMED', v.problems.join(' | '));
t('the verifier states that a pass is not an evaluation, not validation evidence and not a release step', /not an evaluation, not independent validation evidence and not a release step/.test(v.statement));
const walk = (d) => readdirSync(join(ROOT, d)).flatMap((n) => statSync(join(ROOT, d, n)).isDirectory() ? walk(d + '/' + n) : [d + '/' + n]);
const code = walk('tools/evaluation-readiness').filter((f) => /\.m?js$/.test(f)).map((f) => [f, read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1')]);
const runtime = code.filter(([f]) => !/lib\/verify\.js$/.test(f));
t('no package module opens a network connection or loads a network module', runtime.every(([, s]) => !/\bfetch\s*\(|XMLHttpRequest|WebSocket|node:(https?|net|dgram|tls|dns|http2)/.test(s)));
t('no package module calls a provider, reads a credential or the environment', code.every(([, s]) => !/api\.anthropic|api\.openai|@anthropic-ai|from 'openai'|_API_KEY|process\.env/.test(s.replace(/const PATHWAY = .*$/m, ''))));
t('no package module writes a file, starts a server or spawns a process (no export or serving path)', runtime.every(([, s]) => !/writeFileSync|writeFile\(|createWriteStream|appendFileSync|createServer|\.listen\(|child_process/.test(s)));
t('the CLIs only read: validate-intake reads one small JSON declaration; verify-readiness prints', /statSync\(path\)\.size > 32768/.test(read('tools/evaluation-readiness/validate-intake.mjs')) && !/readFileSync/.test(read('tools/evaluation-readiness/verify-readiness.mjs')));
t('no package module reads a clock', runtime.every(([, s]) => !/Date\.now\(|new Date\(\)/.test(s)));
const jsonFiles = walk('tools/evaluation-readiness').filter((f) => f.endsWith('.json'));
t('no package JSON carries a prohibited state', jsonFiles.every((f) => { const s = JSON.stringify(JSON.parse(read(f))); return M.voc.PROHIBITED_STATES.every((p) => !s.includes('"' + p + '"')); }));
t('every package JSON that has a status is PLANNING_ONLY', jsonFiles.map((f) => JSON.parse(read(f))).filter((o) => 'status' in o).every((o) => o.status === 'PLANNING_ONLY'));
t('the test files use SYNTHETIC- tokens for every reviewer, owner and reference (UNMARKED-TOKEN only to prove it is refused)', (() => { const tests = readdirSync(join(ROOT, 'tests/evaluation-readiness')).filter((f) => f.endsWith('.mjs')).map((f) => read('tests/evaluation-readiness/' + f)).join('\n'); return [...tests.matchAll(/token: '([^']+)'/g)].filter((m) => m[1] !== '([^').every((m) => m[1].startsWith('SYNTHETIC-') || m[1] === 'UNMARKED-TOKEN'); })());
t('the probes carry no record content (every string is short)', JSON.stringify(M.probes.INTAKE_PROBES).length < 60000 && M.probes.INTAKE_PROBES.every(([, , d]) => JSON.stringify(d).split('"').every((s) => s.length <= 400 || s.startsWith('x'))));

if (IN_REPO) {
  const START = '7205eeab18baa41933a41c65851ab437cb7249e8';
  const changed = [...new Set(execFileSync('git', ['diff', '--name-only', START], { cwd: ROOT, encoding: 'utf8' }).split('\n').concat(execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n')).filter(Boolean))];
  const out = execFileSync('git', ['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '-v', '--stdin'], { cwd: ROOT, input: changed.join('\n') + '\n', encoding: 'utf8' });
  const ex = new Set(out.trim().split('\n').filter(Boolean).map((l) => l.split('\t')[1]));
  t('every path changed since the start head (' + changed.length + ') is excluded from deployment by .vercelignore', changed.length > 30 && changed.every((p) => ex.has(p)), changed.filter((p) => !ex.has(p)).join(', '));
  t('no public page, API route, OpenAPI file, sitemap, Vercel or Cloudflare configuration or credential changed', !changed.some((p) => /\.html$|^api\/|^openapi.*\.json$|^sitemap\.xml$|^vercel\.json$|^\.vercelignore$|wrangler|\.env/.test(p)));
  t('the guard file is unchanged', !changed.includes('scripts/check_zero_drift.py'));
  t('no package output is a JSON file under docs/ (which .vercelignore would not exclude)', !changed.some((p) => /^docs\/.*\.json$/.test(p)));
  let linked = ''; try { linked = execFileSync('git', ['grep', '-l', '-I', '-e', 'evaluation-readiness', '--', '*.html', 'api', 'vercel.json', 'sitemap.xml', 'openapi*.json', 'robots.txt'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { linked = e.status === 1 ? '' : 'git grep failed'; }
  t('no public page, route, sitemap, OpenAPI file or Vercel configuration names the package', linked === '', linked);
}
// Documents.
for (const doc of Object.keys(M.verify.DOCS)) {
  const s = read('docs/architecture/' + doc);
  t(doc + ' distinguishes current implementation, target and absent evidence', /Current implementation/.test(s) && /Target/.test(s) && /Absent/.test(s));
  t(doc + ' uses no em dash and no promotional or certainty wording', !/—/.test(s) && !/\b(guaranteed|eliminates|prevents|court-proof|liability-proof|industry standard|enterprise-grade|next-generation|production-ready|proven)\b/i.test(s));
  t(doc + ' claims no validation, readiness, clearance or approval', !/\b(?:JRS|the Engine|the package|this package|the candidate)\s+(?:is|has been)\s+(?:now\s+)?(?:validated|independently evaluated|release-ready|production-ready|reliable|cleared|approved|owner-authorized)\b/i.test(s));
}
t('the readiness protocol states plainly that the package does not itself provide independent validation evidence', /does not itself provide independent validation evidence/.test(read('docs/architecture/CONTROLLED_INDEPENDENT_EVALUATION_READINESS_PROTOCOL.md')));
t('the contamination protocol states that digest matching does not establish independence', /Digest matching does not establish independence/.test(read('docs/architecture/INPUT_CONTAMINATION_AND_DEVELOPMENT_MATERIAL_EXCLUSION_PROTOCOL.md')));
t('the guard triage record says the suite is not green and lists 37 identified failures', (() => { const s = read('docs/architecture/LEGACY_GUARD_FAILURE_TRIAGE_RECORD.md'); return /The guard suite is not green/.test(s) && (s.match(/^\| LG-\d\d \|/gm) || []).length === 37; })());
done();
