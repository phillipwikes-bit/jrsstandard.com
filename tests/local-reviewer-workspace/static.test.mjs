// Static controls: no network, persistence, analytics, URL loading, HTML injection, scores,
// verdicts, Codebook mapping or inference language; synthetic marking; deployment exclusion.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { t, done, DIR, ROOT, C } from './_helpers.mjs';
import { PROHIBITED_INFERENCE } from '../../lib/engine-candidate/review-candidate.js';

const APP = DIR + 'app/';
const read = (f) => readFileSync(APP + f, 'utf8');
// Comments are stripped before scanning, so a sentence that explains a prohibition is not mistaken for a use.
export const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
const code = ['workspace.js', 'core.js', 'correspondence.js'].map(read).map(stripComments).join('\n');
const html = read('index.html');
const page = code + '\n' + html + '\n' + read('workspace.css');
const BANNED_API = [
  ['fetch', /\bfetch\s*\(/], ['XMLHttpRequest', /XMLHttpRequest/], ['WebSocket', /WebSocket/], ['EventSource', /EventSource/], ['sendBeacon', /sendBeacon/],
  ['localStorage', /localStorage/], ['sessionStorage', /sessionStorage/], ['indexedDB', /indexedDB/i], ['document.cookie', /document\.cookie|cookieStore/],
  ['Cache API', /\bcaches\./], ['service worker', /serviceWorker/], ['Worker', /new\s+(Shared)?Worker/], ['File System Access', /showSaveFilePicker|showOpenFilePicker|getDirectory|navigator\.storage/],
  ['dynamic import', /import\s*\(/], ['URL loading', /location\.(search|hash|href)|URLSearchParams|window\.location/], ['postMessage', /postMessage|BroadcastChannel/],
  ['HTML injection', /innerHTML|outerHTML|insertAdjacentHTML|document\.write|DOMParser|createContextualFragment/], ['eval', /\beval\s*\(|new Function\s*\(/],
  ['console', /console\./], ['analytics', /gtag|googletagmanager|analytics|telemetry/i], ['analytics tag', /\bG-[A-Z0-9]{6,}\b/], ['remote URL', /https?:\/\//],
];
for (const [name, re] of BANNED_API) t('workspace page code uses no ' + name, !re.test(code + '\n' + read('workspace.css')));
t('index.html loads no remote script, stylesheet or font', !/(src|href)\s*=\s*["']\s*(https?:)?\/\//i.test(html) && !/fonts\.(googleapis|gstatic)/.test(html));
t("index.html carries a CSP meta tag with connect-src 'none'", /http-equiv="Content-Security-Policy"[^>]*connect-src 'none'/.test(html) && /default-src 'none'/.test(html));
t('index.html has no form element and no submit control', !/<form\b/i.test(html) && !/type=["']submit/i.test(html));
t('the packet file input is the only way to open a packet (plus the built-in synthetic demo)', (html.match(/type="file"/g) || []).length === 2 && /id="packet-file"/.test(html));

// Language: the workspace's own words.
const own = (html.replace(/<[^>]+>/g, ' ') + ' ' + [...code.matchAll(/'([^'\\]|\\.)*'/g)].map((m) => m[0]).join(' ')).replace(/\s+/g, ' ');
t('no score, rating or percentage in the workspace text', !/\b(score|scored|rating|percent|percentage|grade)\b/i.test(own));
t('no readiness or approval verdict in the workspace text', !/\b(is|are|marked|deemed|as)\s+(ready|approved|compliant|defensible|validated|verified)\b/i.test(own) && !/\b(VERIFIED|VALIDATED|APPROVED|READY)\b/.test(own));
t('no "verified" or "validated" badge text', !/\bverified\b|\bvalidated\b/i.test(html));
t('no claim that a candidate key is a JRS or Codebook condition', !/\b(is|are|maps? to|corresponds? to)\s+(a\s+|the\s+)?(JRS|Codebook)\s+condition/i.test(own) && /not JRS conditions and not Codebook conditions/.test(own));
t('no prohibited-inference vocabulary in the workspace text', Object.entries(PROHIBITED_INFERENCE).every(([, re]) => !re.test(own)), Object.entries(PROHIBITED_INFERENCE).filter(([, re]) => re.test(own)).map(([k]) => k).join(','));
t('the confidentiality notice on the page is the core notice', html.includes(C.CONFIDENTIALITY_NOTICE));
t('the quotation notice says location, not support or correctness', /shows where the text sits/.test(C.QUOTATION_NOTICE) && /does not show that the text supports the finding/.test(C.QUOTATION_NOTICE));
t('the disposition vocabulary is exactly the permitted five', C.DISPOSITIONS.join() === 'CONFIRMED_FOR_FURTHER_REVIEW,NOT_CONFIRMED,NEEDS_CLARIFICATION,OUT_OF_SCOPE,NO_DISPOSITION');
t('the page uses no em dash', !/—/.test(html + code));

// Synthetic marking.
const demo = await import(APP + 'demo-packet.js');
t('the demo packet is marked synthetic in its record reference and its notice', /^SYNTHETIC-/.test(demo.SYNTHETIC_DEMO_PACKET.record_ref) && /^SYNTHETIC DEMONSTRATION PACKET/.test(demo.SYNTHETIC_DEMO_NOTICE));
t('the demo packet opens and every section is populated', C.verifyPacket(demo.SYNTHETIC_DEMO_PACKET).ok && ['source_preparation', 'candidate_prompts', 'model_output_checks'].every((s) => C.listFindings(demo.SYNTHETIC_DEMO_PACKET).some((f) => f.section === s)));
t('the demo source is a SYNTHETIC fixture already registered as development material', /fixtures\/SYNTHETIC-SAE-03-GAPS\.txt/.test(readFileSync(ROOT + 'lib/engine-candidate/dev-material.js', 'utf8')) && /SYNTHETIC-SAE-03-GAPS\.txt/.test(readFileSync(DIR + 'make-demo-packet.mjs', 'utf8')));
const regen = execFileSync(process.execPath, [DIR + 'make-demo-packet.mjs', '--check'], { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
t('the committed demo packet is exactly what the generator produces', /^PASS/.test(regen));
const testFiles = readdirSync(ROOT + 'tests/local-reviewer-workspace').filter((f) => f.endsWith('.mjs')).map((f) => readFileSync(ROOT + 'tests/local-reviewer-workspace/' + f, 'utf8')).join('\n');
t('every record reference used by the tests is SYNTHETIC-', [...testFiles.matchAll(/'(SYNTHETIC-[A-Z0-9-]+|[A-Z]{2,}-TEST-[A-Z]+)'/g)].every((m) => m[1].startsWith('SYNTHETIC-')));

// Deployment exclusion.
const ignore = readFileSync(ROOT + '.vercelignore', 'utf8').split('\n').map((l) => l.trim());
t('.vercelignore excludes tools/ (the workspace) and tests/ (its tests)', ignore.includes('tools/') && ignore.includes('tests/'));
t('.vercelignore excludes the protocol document (*.md)', ignore.includes('*.md'));
const vercel = readFileSync(ROOT + 'vercel.json', 'utf8');
t('vercel.json has no route, rewrite or header naming the workspace', !/tools\/|local-reviewer|reviewer-workspace/.test(vercel));
const tracked = execFileSync('git', ['ls-files', '--others', '--cached', '--exclude-standard', 'tools/local-reviewer-workspace', 'tests/local-reviewer-workspace'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
t('every workspace file sits under an excluded top-level directory', tracked.length > 0 && tracked.every((f) => ['tools', 'tests'].includes(f.split('/')[0])));
let linked = '';
try { linked = execFileSync('git', ['grep', '-l', '-I', '-e', 'local-reviewer-workspace', '-e', 'reviewer-workspace', '--', '*.html', 'api', 'vercel.json', 'sitemap.xml', 'openapi.json'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { linked = e.status === 1 ? '' : 'git grep failed'; }
t('no public page, API route, sitemap, OpenAPI file or Vercel configuration names the workspace', linked === '', linked);
done();
