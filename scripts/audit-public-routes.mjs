#!/usr/bin/env node
// Read-only public route audit. No credentials, submissions, or production mutations.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urls = [...sitemap.matchAll(/<loc>\s*(https:\/\/[^<\s]+)\s*<\/loc>/g)].map(m => m[1]);
const expected = Number(process.env.EXPECTED_SITEMAP_URLS || 55);
const unique = new Set(urls);
const findings = [];
if (urls.length !== expected) findings.push({ type: 'inventory_count', expected, actual: urls.length });
if (unique.size !== urls.length) findings.push({ type: 'duplicate_sitemap_urls', duplicates: urls.length - unique.size });
const results = [];
for (const url of urls) {
  const entry = { url, status: null, finalUrl: null, contentType: null, error: null };
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'JRS-Website-Acceptance-Audit/1.0' } });
    entry.status = response.status;
    entry.finalUrl = response.url;
    entry.contentType = response.headers.get('content-type');
    if (!response.ok) findings.push({ type: 'route_http_failure', url, status: response.status });
    if (!String(entry.contentType || '').toLowerCase().includes('text/html')) findings.push({ type: 'unexpected_content_type', url, contentType: entry.contentType });
    if (new URL(response.url).origin !== new URL(url).origin) findings.push({ type: 'cross_origin_redirect', url, finalUrl: response.url });
    await response.body?.cancel();
  } catch (error) {
    entry.error = String(error?.message || error);
    findings.push({ type: 'route_request_error', url, error: entry.error });
  }
  results.push(entry);
  console.log(`${entry.status ?? 'ERROR'} ${url}${entry.finalUrl && entry.finalUrl !== url ? ' -> ' + entry.finalUrl : ''}`);
}
const report = { generatedAt: new Date().toISOString(), scope: 'Sitemap routes, GET and response metadata only', expected, counted: urls.length, unique: unique.size, passedHttp: results.filter(r => r.status >= 200 && r.status < 300).length, findings, results, notTested: ['mobile viewport layout', 'WCAG conformance', 'primary-action interaction', 'download file integrity and edition', 'visitor comprehension', 'authenticated journeys'] };
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/jrs-route-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(`Route audit: ${report.passedHttp}/${urls.length} HTTP 2xx; ${findings.length} findings. Report: artifacts/jrs-route-audit.json`);
if (findings.length) process.exitCode = 1;
