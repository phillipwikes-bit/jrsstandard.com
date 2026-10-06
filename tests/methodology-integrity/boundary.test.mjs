// Deployment exclusion, no network or model dependency, and the report: it exists, uses the
// required phrase, and its numbers equal the register and the scan it describes.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, REPO, TOOL, REGISTER, SOURCE_REGISTER, read, exists, readJson } from './_helpers.mjs';

const walk = (dir) => readdirSync(join(REPO, dir)).flatMap((n) => statSync(join(REPO, dir, n)).isDirectory() ? walk(dir + '/' + n) : [dir + '/' + n]);
const PACKAGE = [...walk('tools/methodology-integrity'), ...walk('tests/methodology-integrity'), 'docs/architecture/METHODOLOGY_SOURCE_REGISTER.md', 'docs/architecture/METHODOLOGY_CORRESPONDENCE_REGISTER.md',
  'docs/architecture/METHODOLOGY_VOCABULARY_INTEGRITY_REPORT.md', 'tools/local-reviewer-workspace/app/correspondence.js', 'research/CONSTRUCT_VALIDITY_PACKAGE.md'];
const out = execFileSync('git', ['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '-v', '--stdin'], { cwd: REPO, input: PACKAGE.join('\n') + '\n', encoding: 'utf8' });
const excluded = new Map(out.trim().split('\n').filter(Boolean).map((l) => { const [src, path] = l.split('\t'); return [path, src]; }));
const notExcluded = PACKAGE.filter((p) => !excluded.has(p) || !/\.vercelignore:/.test(excluded.get(p)));
t('every file of this package is excluded from deployment by .vercelignore', notExcluded.length === 0, notExcluded.join(', '));
t('no package output is JSON under docs/architecture (which .vercelignore would not exclude)', !PACKAGE.some((p) => /^docs\/architecture\/.*\.json$/.test(p)));

const toolCode = walk('tools/methodology-integrity').filter((p) => /\.(js|mjs)$/.test(p)).map((p) => read(p)).join('\n');
t('the tool makes no network request and loads no network module', !/\bfetch\s*\(|node:(http|https|net|dgram|tls)|XMLHttpRequest|WebSocket/.test(toolCode));
t('the tool calls no model and reads no credential', !/anthropic|openai|API_KEY|process\.env\.(?!MI_ROOT)/i.test(toolCode.replace(/\/\/.*$/gm, '')));
t('the tool reads the working tree only (no git, no child process)', !/child_process|execFile|spawn/.test(toolCode));
t('the workspace snapshot makes no request and uses no storage', !/fetch|XMLHttpRequest|localStorage|sessionStorage|https?:\/\//.test(read('tools/local-reviewer-workspace/app/correspondence.js')));

// ---- the report ---------------------------------------------------------------------------------------
const REPORT = 'docs/architecture/METHODOLOGY_VOCABULARY_INTEGRITY_REPORT.md';
t('the report exists', exists(REPORT));
const rep = exists(REPORT) ? read(REPORT) : '';
t('the report uses the phrase "no correspondence asserted"', /no correspondence asserted/.test(rep));
t('the report names every source in the source register', SOURCE_REGISTER.sources.every((s) => rep.includes(s.id)));
t('the report states the status counts of the register exactly', Object.entries(REGISTER.status_summary).every(([k, v]) => new RegExp('\\| ' + k + ' \\| ' + v + ' \\|').test(rep)) && rep.includes(REGISTER.record_count + ' records'));
const committedScan = readJson('tools/methodology-integrity/generated/scan-results.json');
const { runScan } = await import(TOOL + 'scan.mjs');
const freshScan = runScan(ROOT, TOOL);
t('documentation drift: the committed scan results equal a fresh scan', JSON.stringify(committedScan) === JSON.stringify(freshScan));
t('the report states the scan counts exactly', Object.entries(committedScan.summary).every(([k, v]) => new RegExp('\\| ' + k + ' \\| ' + v + ' \\|').test(rep)) && rep.includes(committedScan.files_scanned + ' files'));
t('the report explains why the register does not validate the Engine', /does not validate the Engine/.test(rep));
t('the report explains why the absence of a mapping is not a defect in the Standard', /absence of a mapping is not a defect in the Standard/i.test(rep));
t('the report records what could and could not be classified canonical', /could not be classified canonical/i.test(rep) && /CANONICAL/.test(rep));
for (const p of [REPORT, 'docs/architecture/METHODOLOGY_SOURCE_REGISTER.md', 'docs/architecture/METHODOLOGY_CORRESPONDENCE_REGISTER.md', 'tools/methodology-integrity/README.md'])
  t(p + ' uses no em dash and no banned claim word', exists(p) && !/—/.test(read(p)) && !/\b(guaranteed|eliminates|court-proof|liability-proof|industry standard)\b/i.test(read(p)));
done();
