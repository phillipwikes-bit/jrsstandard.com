// Deployment exclusion, no network or model dependency, no public change, and the integrity report:
// it exists and its numbers equal the register and the scan it describes.
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { t, done, ROOT, REPO, REGISTER, read, exists } from './_helpers.mjs';

const walk = (dir) => readdirSync(join(REPO, dir)).flatMap((n) => statSync(join(REPO, dir, n)).isDirectory() ? walk(dir + '/' + n) : [dir + '/' + n]);
const PACKAGE = [...walk('tools/claim-provenance'), ...walk('tests/claim-provenance'), ...walk('docs/architecture/claim-cards'), 'docs/architecture/CLAIM_EVIDENCE_REGISTER.md', 'docs/architecture/PUBLIC_CLAIM_LIMITATION_MATRIX.md',
  'docs/architecture/CLAIM_PROVENANCE_INTEGRITY_REPORT.md', 'docs/architecture/PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md'];
const out = execFileSync('git', ['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '-v', '--stdin'], { cwd: REPO, input: PACKAGE.join('\n') + '\n', encoding: 'utf8' });
const ex = new Map(out.trim().split('\n').filter(Boolean).map((l) => { const [src, p] = l.split('\t'); return [p, src]; }));
const notEx = PACKAGE.filter((p) => !ex.has(p) || !/\.vercelignore:/.test(ex.get(p)));
t('every file of this package is excluded from deployment by .vercelignore', notEx.length === 0, notEx.join(', '));
t('no package output is JSON under docs/architecture (which .vercelignore would not exclude)', !PACKAGE.some((p) => /^docs\/architecture\/.*\.json$/.test(p)));

const code = walk('tools/claim-provenance').filter((p) => /\.(js|mjs)$/.test(p)).map((p) => read(p)).join('\n');
t('the tool makes no network request and loads no network module', !/\bfetch\s*\(|node:(http|https|net|dgram|tls)|XMLHttpRequest|WebSocket/.test(code));
t('the tool calls no model, reads no credential and runs no child process', !/api\.anthropic|api\.openai|_API_KEY|@anthropic-ai|from 'openai'|child_process|execFile|spawn/i.test(code.replace(/\/\/.*$/gm, '')) && !/process\.env/.test(code));
const { OUTPUTS } = await import(ROOT + 'tools/claim-provenance/build.mjs');
const { RESULTS, PROPOSALS } = await import(ROOT + 'tools/claim-provenance/scan.mjs');
t('the tool never writes to a public file: every output path is under tools/claim-provenance/ or docs/architecture/', Object.values(OUTPUTS).concat([RESULTS, PROPOSALS]).every((p) => /^(tools\/claim-provenance\/|docs\/architecture\/)/.test(p)));

// ---- no public change in the working tree --------------------------------------------------------------
if (ROOT === REPO) {
  const changed = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: REPO, encoding: 'utf8' }).split('\n').filter(Boolean).map((l) => l.slice(3));
  const PUBLIC = (p) => !/^(tools|tests|docs|research|lib|scripts|\.jrs|schemas|standard)\//.test(p) && !/\.md$/.test(p);
  // The owner authorized public research-claim repairs on 2026-10-06 (draft branch only). Only the
  // pages those repairs name, and the methods-paper supersession notice, may differ.
  const { REPAIRS, MANUAL_FINDINGS } = await import(ROOT + 'tools/claim-provenance/lib/repairs.js');
  const AUTHORIZED = new Set(REPAIRS.map((r) => r.file).concat(MANUAL_FINDINGS.map((m) => m.notice).filter(Boolean)));
  t('no public file changes except the authorized repaired pages and the supersession notice', changed.filter(PUBLIC).every((p) => AUTHORIZED.has(p)), changed.filter(PUBLIC).filter((p) => !AUTHORIZED.has(p)).join(', '));
  t('no API route, OpenAPI, sitemap, Vercel configuration or credential file is changed', !changed.some((p) => /^api\/|^openapi\.json$|^sitemap\.xml$|^vercel\.json$|\.env/.test(p)));
  t('no release-gate record or guard file is changed', !changed.some((p) => /^lib\/release-gate\/|^scripts\/check_zero_drift\.py$|CURRENT_RELEASE_GATE_REPORT|^\.jrs\/registries\/RELEASE/.test(p)));
}

// ---- the integrity report ---------------------------------------------------------------------------------
const REPORT = 'docs/architecture/CLAIM_PROVENANCE_INTEGRITY_REPORT.md';
t('the integrity report exists', exists(REPORT));
const rep = exists(REPORT) ? read(REPORT) : '';
const scanRes = JSON.parse(read('tools/claim-provenance/generated/scan-results.json'));
t('the report states the number of claims registered', rep.includes(REGISTER.claim_count + ' claims'));
t('the report states the status counts exactly', Object.entries(REGISTER.status_summary).every(([k, v]) => new RegExp('\\| ' + k + ' \\| ' + v + ' \\|').test(rep)));
const byTopic = {}; for (const c of REGISTER.claims) byTopic[c.claim_topic] = (byTopic[c.claim_topic] || 0) + 1;
t('the report states the claims by category exactly', Object.entries(byTopic).every(([k, v]) => new RegExp('\\| ' + k + ' \\| ' + v + ' \\|').test(rep)));
t('the report states the scan counts exactly', Object.entries(scanRes.summary).every(([k, v]) => new RegExp('\\| ' + k + ' \\| ' + v + ' \\|').test(rep)));
const repro = REGISTER.claims.filter((c) => c.reproduction === 'REPRODUCED_IN_REPOSITORY').length, reported = REGISTER.claims.filter((c) => c.reproduction === 'SOURCE_REPORTED').length;
t('the report distinguishes source-reported from reproduced claims, with counts', rep.includes(reported + ' source-reported claims') && rep.includes(repro + ' claims reproduced in the repository'));
t('the report names every proposal and the manual PDF finding', ['PR-01', 'PR-17', 'PD-01'].every((id) => rep.includes(id)));
t('the report says what the package does not validate', /does not validate the research, the Engine, privacy controls, commercial readiness or production use/.test(rep));
for (const p of [REPORT, 'docs/architecture/PUBLIC_CLAIM_REPAIR_PROPOSALS_2026-10-06.md', 'docs/architecture/CLAIM_EVIDENCE_REGISTER.md', 'docs/architecture/PUBLIC_CLAIM_LIMITATION_MATRIX.md', 'tools/claim-provenance/README.md'])
  t(p + ' uses no em dash', exists(p) && !/—/.test(read(p)));
done();
