// The audit against this repository: reproducibility from the recorded commit, coverage, guards,
// no copied record text, no credential values, no slugs, outputs only in excluded paths.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { t, done, REPO, AN, G, R, IG, RUN, net } from './_helpers.mjs';

const snapPath = join(REPO, R.JSON_OUTPUTS.snapshot);
t('the committed snapshot exists', existsSync(snapPath));
const snap = JSON.parse(readFileSync(snapPath, 'utf8'));
const commit = snap.snapshot.source_commit;
t('the snapshot names a 40-character commit that exists locally', /^[0-9a-f]{40}$/.test(commit) && (() => { try { execFileSync('git', ['cat-file', '-e', commit + '^{commit}'], { cwd: REPO }); return true; } catch { return false; } })());
const a = RUN.audit(REPO, commit);
const { out, problems } = RUN.outputsFor(a);
t('a fresh run at the recorded commit passes every output guard', problems.length === 0, problems.slice(0, 3).join('; '));
const stale = Object.entries(out).filter(([p, txt]) => !existsSync(join(REPO, p)) || readFileSync(join(REPO, p), 'utf8') !== txt).map(([p]) => p);
t('every committed output equals a fresh run at the commit it records', stale.length === 0, stale.join(', '));
t('a second run gives the same digest', RUN.audit(REPO, commit).snapshot.inventory_digest === a.snapshot.inventory_digest);
t('every output identifies its source commit', Object.values(out).every((txt) => txt.includes(commit)));

// Coverage.
const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', '--full-tree', commit], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
const outputs = Object.keys(out);
const expected = tracked.filter((p) => !outputs.includes(p));
t('every tracked file at the commit is inventoried (outputs excepted)', a.files.length === expected.length, a.files.length + ' vs ' + expected.length);
t('every file has an area; unmatched files would be reported as UNCLASSIFIED', a.files.every((f) => f.area) && (a.files.some((f) => f.area === 'UNCLASSIFIED') ? out['docs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md'].includes('match no area rule') : true));
const engineCount = tracked.filter((p) => p.startsWith('lib/engine-candidate/')).length;
t('the Engine candidate directory is inventoried in full', engineCount > 0 && a.files.filter((f) => f.area === 'engine-candidate').length === engineCount);
for (const area of ['engine-candidate', 'api-routes', 'site-pages', 'tests-engine-candidate', 'local-reviewer-workspace', 'release-gate', 'research', 'provenance-audit']) t('major area present: ' + area, a.files.some((f) => f.area === area));

// Deployment exclusion matches git's own matcher on every file.
let gitOut = '';
try { gitOut = execFileSync('git', ['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '-v', '-z', '--stdin'], { cwd: REPO, input: tracked.join('\0') }).toString(); } catch (e) { gitOut = String(e.stdout || ''); }
const gf = gitOut.split('\0'), gitRule = {};
for (let i = 0; i + 3 < gf.length; i += 4) if (gf[i] === '.vercelignore' && !gf[i + 2].startsWith('!')) gitRule[gf[i + 3]] = gf[i + 1];
const rules = IG.parseIgnore(readFileSync(join(REPO, '.vercelignore'), 'utf8'));
const mismatch = tracked.filter((p) => ((IG.exclusionRule(rules, p) || '').match(/^line (\d+)/) || [])[1] !== gitRule[p]);
t('the .vercelignore matcher agrees with git on every tracked file', mismatch.length === 0, mismatch.slice(0, 3).join(', '));
t('every output path is excluded from deployment', outputs.every((p) => IG.exclusionRule(rules, p)), outputs.filter((p) => !IG.exclusionRule(rules, p)).join(', '));
t('outputs are only Markdown in docs/architecture/ or JSON in tools/provenance-audit/generated/', outputs.every((p) => RUN.WRITABLE.some((re) => re.test(p))));
for (const p of ['index.html', 'api/x.js', 'docs/architecture/generated/x.json', 'sitemap.xml', 'vercel.json']) t('a public or deployed path is not a permitted output: ' + p, !RUN.WRITABLE.some((re) => re.test(p)));

// Content.
const all = Object.values(out).join('\n');
t('no credential-like value appears in any output', G.credentialProblems(all).length === 0, G.credentialProblems(all).join(','));
t('no opaque slug appears in any output', !/-[0-9a-f]{12,}\.(html|js)/.test(all));
t('no unmasked email address appears in any output', !/[A-Za-z0-9._%+-]{2,}@(gmail|anthropic|openai|users\.noreply\.github)\.com/.test(all));
const protectedTexts = [];
const walk = (d) => { for (const n of readdirSync(join(REPO, d), { withFileTypes: true })) { const p = d + '/' + n.name; if (n.isDirectory()) walk(p); else if (/\.(txt|json)$/.test(n.name)) protectedTexts.push(readFileSync(join(REPO, p), 'utf8')); } };
for (const d of ['tests/engine-candidate/fixtures', 'tests/engine-candidate/corpus', 'tests/engine-candidate/confirmation', 'tests/engine-candidate/regression']) if (existsSync(join(REPO, d))) walk(d);
const demo = await import(join(REPO, 'tools/local-reviewer-workspace/app/demo-packet.js'));
protectedTexts.push(JSON.stringify(demo.SYNTHETIC_DEMO_PACKET, null, 1));
t('no constructed record text or packet body is copied into any output', protectedTexts.length > 5 && G.copiedTextProblems(all, protectedTexts).length === 0);
t('no output calls an excluded file secret', !/\bsecret\b/i.test(all.replace(/supabase_secret_key/g, '')));
t('every output states the non-conclusion', Object.entries(out).filter(([p]) => p.endsWith('.md')).every(([, txt]) => txt.includes(R.NON_CONCLUSION)));
t('the inventory and contribution map carry the metadata limitation', out['docs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md'].includes(AN.METADATA_NOTE) && out[R.JSON_OUTPUTS.contribution].includes(AN.METADATA_NOTE));
t('deployment exclusion is described as routing, not secrecy', out['docs/architecture/SOFTWARE_ASSET_AND_PROVENANCE_INVENTORY.md'].includes(AN.ROUTING_NOTE));
const rr = out['docs/architecture/TECHNICAL_DILIGENCE_READINESS_REPORT.md'];
t('the readiness report has its eight sections', ['## 1. Purpose and scope', '## 2. What the repository currently documents', '## 3. What a prospective technical reviewer could inspect now', '## 4. What remains unavailable, unknown, or requires separate evidence', '## 5. Public versus controlled versus local-only technical assets', '## 6. Dependency and provenance limitations', '## 7. Required future diligence items', '## 8. Explicit non-conclusions'].every((h) => rr.includes(h)));
t('the readiness report says it does not make JRS transaction-ready', /may support future diligence preparation, but it does not make JRS transaction-ready/.test(rr));
t('the readiness checklist carries the ten future items', (rr.match(/^- \[ \] /gm) || []).length === 10);
const disc = out['docs/architecture/AI_ASSISTED_DEVELOPMENT_DISCLOSURE.md'];
t('the AI disclosure distinguishes tool use from ownership and claims no assignment', /distinct from legal authorship and from ownership/.test(disc) && /does not claim that any did/.test(disc) && /transaction-specific legal review/.test(disc));
t('no dependency is RECORDED without local license evidence', JSON.parse(out[R.JSON_OUTPUTS.dependencies]).components.every((c) => c.status !== 'RECORDED' || c.local_license_evidence !== 'NONE_FOUND'));
t('the audit made no network call', net.calls === 0);
done();
