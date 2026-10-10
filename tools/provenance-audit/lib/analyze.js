// Provenance audit: analysis. INTERNAL, LOCAL ONLY. Pure: a function of the collected facts.
//
// It classifies repository evidence. It makes no legal determination: repository metadata
// records contribution activity, and a deployment-exclusion rule records routing, not secrecy.
// Nothing here reads the network, the environment or the working tree.
import { PY_STDLIB } from './py-stdlib.js';

export const AUDIT_VERSION = 'jrs-provenance-audit/0.1.0';
export const BOUNDARIES = Object.freeze(['PUBLIC_SITE', 'PUBLIC_ROUTE', 'CONTROLLED_OR_CLOSED_ROUTE', 'DEPLOYED_SERVER_MODULE', 'LOCAL_INTERNAL', 'TEST_OR_SYNTHETIC', 'INTERNAL_DOCUMENTATION', 'CONFIGURATION', 'UNKNOWN']);
export const DEP_STATUSES = Object.freeze(['RECORDED', 'MISSING_LOCAL_LICENSE_METADATA', 'UNKNOWN', 'REQUIRES_REVIEW']);
export const ORIGIN_LABELS = Object.freeze(['AI_ASSISTED_RECORDED', 'GENERATED', 'IMPORTED_THIRD_PARTY', 'UNKNOWN']);
export const ROUTING_NOTE = 'Exclusion from the Vercel deployment records routing only: the file is not uploaded to the site. It is not a confidentiality control. The repository itself is recorded as public on GitHub (B-018), so excluded files can still be read there.';
export const METADATA_NOTE = 'Repository metadata records contribution activity. It does not determine legal authorship, employment ownership, work-for-hire status, assignment, license grant, or transfer rights.';

// Opaque slugs (restricted owner and admin surfaces, CLAUDE.md 36.3) are not repeated in reports.
export const redact = (p) => String(p).replace(/-[0-9a-f]{10,}(?=\.|\/|$)/g, '-<slug>');

// ---- areas -------------------------------------------------------------------------------------
// [id, label, test(path), asset class, default boundary when excluded, purpose]
const A = (id, label, test, asset_class, purpose) => ({ id, label, test, asset_class, purpose });
const under = (...prefixes) => (p) => prefixes.some((x) => p.startsWith(x));
const rootFile = (re) => (p) => !p.includes('/') && re.test(p);
export const AREAS = Object.freeze([
  A('provenance-audit', 'Provenance audit tool (this package)', under('tools/provenance-audit/'), 'LOCAL_TOOL', 'Deterministic repository inventory and provenance map'),
  A('local-reviewer-workspace', 'Local reviewer workspace', under('tools/local-reviewer-workspace/'), 'LOCAL_TOOL', 'Offline human review of candidate reviewer packets'),
  A('other-tools', 'Other local tools', under('tools/'), 'LOCAL_TOOL', 'Manifest validation and evaluation scripts'),
  A('engine-candidate', 'Review Engine local candidate', under('lib/engine-candidate/'), 'ENGINE_CANDIDATE', 'Local development candidate of the Review Engine (mock adapter only)'),
  A('release-gate', 'Internal release-gate package', under('lib/release-gate/'), 'SCHEMA_OR_PROTOCOL', 'Release-gate record schema, validator and report'),
  A('manifest-library', 'Manifest library', under('lib/manifest/', 'api/_manifest/', 'schemas/'), 'SCHEMA_OR_PROTOCOL', 'Decision Reconstruction Manifest schema and builder'),
  A('retention-policy', 'Retention policy module', under('lib/retention/'), 'LOCAL_TOOL', 'Retention computation (computes, does not delete)'),
  A('other-lib', 'Other library code', under('lib/'), 'LOCAL_TOOL', 'Library code'),
  A('api-server-modules', 'API server modules (not routes)', (p) => /^api\/(_[^/]*$|_[^/]+\/)/.test(p), 'API_SERVER_MODULE', 'Shared server code deployed with the functions; not addressable as a route'),
  A('api-routes', 'API routes', under('api/'), 'API_ROUTE', 'Vercel function routes'),
  A('tests-engine-candidate', 'Tests: engine candidate', under('tests/engine-candidate/'), 'TEST_OR_FIXTURE', 'Candidate tests, constructed corpora and fixtures'),
  A('tests-release-gate', 'Tests: release gate', under('tests/release-gate/'), 'TEST_OR_FIXTURE', 'Release-gate tests'),
  A('tests-local-reviewer-workspace', 'Tests: local reviewer workspace', under('tests/local-reviewer-workspace/'), 'TEST_OR_FIXTURE', 'Workspace tests'),
  A('tests-provenance-audit', 'Tests: provenance audit', under('tests/provenance-audit/'), 'TEST_OR_FIXTURE', 'Provenance audit tests'),
  A('tests-other', 'Tests: other', under('tests/'), 'TEST_OR_FIXTURE', 'Manifest, route and boundary tests'),
  A('scripts', 'Repository scripts and guard suite', under('scripts/'), 'LOCAL_TOOL', 'Build, audit, guard and maintenance scripts'),
  A('research', 'Research corpus', under('research/'), 'RESEARCH_OR_DOCUMENTATION', 'Research studies, data, trackers and analyses'),
  A('docs-architecture', 'Architecture documents', under('docs/architecture/'), 'RESEARCH_OR_DOCUMENTATION', 'Internal architecture and control documents'),
  A('docs-other', 'Diligence and audit documents', under('docs/'), 'RESEARCH_OR_DOCUMENTATION', 'Diligence, audit, licensing and research-operations documents'),
  A('control-state', 'JRS control state', under('.jrs/'), 'SCHEMA_OR_PROTOCOL', 'Registries, blockers, gates and reports of the asset orchestrator'),
  A('agent-config', 'Claude Code agent configuration', under('.claude/'), 'CONFIGURATION', 'Agent and command definitions for local tooling'),
  A('ci-config', 'CI workflows', under('.github/'), 'CONFIGURATION', 'GitHub Actions workflows'),
  A('unpublished-standard', 'Unpublished derived materials', under('standard/', 'templates/', 'cep-article-prep/', 'content/'), 'RESEARCH_OR_DOCUMENTATION', 'Derived or draft materials not approved for publication'),
  A('site-reference', 'Public reference library pages', under('reference/'), 'PUBLIC_SITE_SOURCE', 'Public reference pages'),
  A('site-reviewer', 'Public reviewer pages', under('reviewer/'), 'PUBLIC_SITE_SOURCE', 'Reviewer evaluation and completion pages'),
  A('deploy-config', 'Deployment and repository configuration', rootFile(/^(vercel\.json|\.vercelignore|\.gitignore|CNAME)$/), 'CONFIGURATION', 'Deployment routing, exclusion and repository settings'),
  A('instructions', 'Repository instructions', rootFile(/^CLAUDE\.md$/), 'RESEARCH_OR_DOCUMENTATION', 'Operating instructions for the asset orchestrator'),
  A('database-schema', 'Database schema and policy files', rootFile(/\.sql$/), 'CONFIGURATION', 'Supabase schema and row-level policy definitions'),
  A('office-documents', 'Office documents', rootFile(/\.docx$/), 'RESEARCH_OR_DOCUMENTATION', 'Word documents (excluded from deployment)'),
  A('site-pages', 'Public site pages', rootFile(/\.html?$/), 'PUBLIC_SITE_SOURCE', 'Public website pages'),
  A('site-assets', 'Public site assets and data', rootFile(/\.(css|svg|png|jpe?g|pdf|json|xml|txt|ico|webp)$/), 'PUBLIC_SITE_SOURCE', 'Stylesheets, images, PDFs, schemas, sitemap and robots'),
  A('root-markdown', 'Root Markdown', rootFile(/\.md$/), 'RESEARCH_OR_DOCUMENTATION', 'Repository-level Markdown'),
]);
export const areaOf = (p) => AREAS.find((a) => a.test(p)) || null;

// Restricted surfaces named in CLAUDE.md 36.3.
const RESTRICTED = [/^programme-status-[0-9a-f]+\.html$/, /^acquisition-[0-9a-f]+\.html$/, /^vp-[0-9a-f]+\.html$/, /^api\/people-[0-9a-f]+\.js$/, /^api\/leads-[0-9a-f]+\.js$/];

// ---- per-file classification ---------------------------------------------------------------------
const ext = (p) => { const b = p.split('/').pop(); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i + 1).toLowerCase() : (b.startsWith('.') ? b.slice(1) : 'none'); };
const GENERATED_MARK = /\bGENERATED\b|\bGenerated by\b|\bauto-generated\b|Do not edit by hand/;
function generatedInfo(text) {
  if (typeof text !== 'string') return null;
  const head = text.slice(0, 600);
  if (!GENERATED_MARK.test(head)) return null;
  const m = /(?:GENERATED|Generated) by\s+`?((?:tools|scripts|lib|research)\/[\w./-]+\.(?:mjs|js|py))/.exec(head);
  return { generated: true, source: m ? m[1] : 'NOT_RECORDED' };
}
function versionId(text) {
  if (typeof text !== 'string') return null;
  const m = /\b(jrs-[a-z-]+\/\d+\.\d+\.\d+|candidate-prompt\/\d+\.\d+\.\d+|explanations\/\d+\.\d+\.\d+|source-prep\/\d+\.\d+\.\d+)\b/.exec(text.slice(0, 4000));
  if (m) return m[1];
  const j = /"\$id"\s*:\s*"([^"]+)"/.exec(text.slice(0, 2000));
  return j ? j[1] : null;
}
function routeStatus(path, text) {
  if (!/^api\//.test(path) || !/\.(js|mjs|cjs|ts)$/.test(path)) return null;
  if (/^api\/(_[^/]*$|_[^/]+\/)/.test(path)) return 'SERVER_MODULE_NOT_A_ROUTE';
  if (typeof text === 'string' && /_controlled-review(\.js)?['"]/.test(text)) return 'CONTROLLED_REFUSAL_STUB';
  return 'DEPLOYED_ROUTE_BEHAVIOUR_NOT_ASSESSED';
}
const SYNTHETIC_PATH = /(^|\/)(fixtures|corpus|confirmation|regression)(\/|$)|SYNTHETIC/;

function boundaryOf(f, area, excluded, route) {
  if (!area) return 'UNKNOWN';
  if (excluded) {
    if (area.asset_class === 'TEST_OR_FIXTURE') return 'TEST_OR_SYNTHETIC';
    if (area.asset_class === 'CONFIGURATION') return 'CONFIGURATION';
    if (area.asset_class === 'RESEARCH_OR_DOCUMENTATION' || area.id === 'control-state') return 'INTERNAL_DOCUMENTATION';
    if (['LOCAL_TOOL', 'ENGINE_CANDIDATE', 'SCHEMA_OR_PROTOCOL'].includes(area.asset_class)) return 'LOCAL_INTERNAL';
    return 'UNKNOWN';
  }
  if (route === 'CONTROLLED_REFUSAL_STUB') return 'CONTROLLED_OR_CLOSED_ROUTE';
  if (route === 'SERVER_MODULE_NOT_A_ROUTE') return 'DEPLOYED_SERVER_MODULE';
  if (route) return 'PUBLIC_ROUTE';
  if (area.asset_class === 'PUBLIC_SITE_SOURCE') return 'PUBLIC_SITE';
  if (area.asset_class === 'CONFIGURATION') return 'CONFIGURATION';
  return 'UNKNOWN';   // deployed, but not of a kind expected on the site: requires review
}

export function classifyFile(f, facts, devMaterial) {
  const text = facts.text[f.path];
  const area = areaOf(f.path);
  const excludedBy = facts.exclusion[f.path] || null;
  const route = routeStatus(f.path, text);
  const boundary = boundaryOf(f, area, Boolean(excludedBy), route);
  const gen = generatedInfo(text);
  const synthetic = area && area.asset_class === 'TEST_OR_FIXTURE' && (SYNTHETIC_PATH.test(f.path) || (typeof text === 'string' && /SYNTHETIC|CONSTRUCTED|constructed/.test(text.slice(0, 400))));
  const registered = devMaterial.some((d) => f.path.endsWith(d) || f.path.includes(d + '.') || f.path.includes(d + '/'));
  const restricted = RESTRICTED.some((re) => re.test(f.path));
  const mayHoldExcerpts = area && (area.id === 'research' || area.id === 'docs-other' || /packet|record|corpus|confirmation|regression|fixtures/.test(f.path)) ? (synthetic ? 'SYNTHETIC_ONLY' : 'REQUIRES_REVIEW') : 'NOT_INDICATED';
  return {
    path: redact(f.path), blob: f.blob, size: f.size, type: ext(f.path),
    area: area ? area.id : 'UNCLASSIFIED', asset_class: area ? area.asset_class : 'UNKNOWN', boundary,
    deployment_exclusion: excludedBy, route_status: route,
    generated: gen ? gen.generated : false, generated_source: gen ? gen.source : null,
    version_id: area && ['SCHEMA_OR_PROTOCOL', 'ENGINE_CANDIDATE'].includes(area.asset_class) ? versionId(text) : null,
    synthetic_material: Boolean(synthetic),
    holdout_exclusion: area && area.asset_class === 'TEST_OR_FIXTURE' && synthetic ? (registered ? 'REGISTERED_DEVELOPMENT_MATERIAL' : 'NOT_REGISTERED') : null,
    may_contain_record_excerpts: mayHoldExcerpts,
    restricted_surface: restricted,
    diligence_package: !area ? 'REQUIRES_REVIEW' : mayHoldExcerpts === 'REQUIRES_REVIEW' || restricted ? 'INCLUDE_AFTER_REVIEW' : 'INCLUDE',
    exclude_from_public_release: boundary !== 'PUBLIC_SITE' && boundary !== 'PUBLIC_ROUTE' && boundary !== 'CONTROLLED_OR_CLOSED_ROUTE',
  };
}

// Development texts the candidate registers (lib/engine-candidate/dev-material.js), read as data.
export function devMaterialPaths(facts) {
  const src = facts.text['lib/engine-candidate/dev-material.js'] || '';
  return [...src.matchAll(/'[0-9a-f]{64}',\s*'([^']+)'/g)].map((m) => m[1]);
}

// ---- dependencies ----------------------------------------------------------------------------------
function jsSpecifiers(text) {
  const out = new Set();
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
  for (const m of code.matchAll(/(?:^|[\s;])(?:import\s+(?:[\w*{}\s,$]+\s+from\s+)?|export\s+[\w*{}\s,$]+\s+from\s+)['"]([^'"\n]+)['"]|\brequire\(\s*['"]([^'"\n]+)['"]\s*\)|\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g)) out.add(m[1] || m[2] || m[3]);
  return [...out];
}
function pyImports(text) {
  const out = new Set();
  for (const line of text.split('\n')) {
    const m = /^(?:import\s+([A-Za-z_][\w.]*(?:\s+as\s+\w+)?(?:\s*,\s*[A-Za-z_][\w.]*(?:\s+as\s+\w+)?)*)\s*(?:#.*)?$|from\s+([A-Za-z_][\w.]*)\s+import\s+)/.exec(line);
    if (!m) continue;
    if (m[2]) out.add(m[2].split('.')[0]);
    else m[1].split(',').forEach((x) => out.add(x.trim().split(/\s+/)[0].split('.')[0]));
  }
  return [...out];
}
const NODE_BUILTINS = new Set(['assert', 'buffer', 'child_process', 'crypto', 'dns', 'events', 'fs', 'fs/promises', 'http', 'https', 'module', 'net', 'os', 'path', 'process', 'readline', 'stream', 'string_decoder', 'timers', 'tls', 'url', 'util', 'worker_threads', 'zlib']);
const HOSTED = [
  [/https:\/\/www\.googletagmanager\.com\/gtag\/js/, 'Google Analytics 4 (gtag.js), loaded from googletagmanager.com', 'hosted script'],
  [/https:\/\/fonts\.googleapis\.com\/css2?\?/, 'Google Fonts stylesheets and font files (fonts.googleapis.com, fonts.gstatic.com)', 'hosted font service'],
  [/https:\/\/cdn\.jsdelivr\.net\//, 'jsDelivr CDN resource', 'hosted script'], [/https:\/\/unpkg\.com\//, 'unpkg CDN resource', 'hosted script'],
  [/https:\/\/cdnjs\.cloudflare\.com\//, 'cdnjs resource', 'hosted script'], [/https:\/\/esm\.sh\//, 'esm.sh module', 'hosted module'],
];

export function dependencies(facts) {
  const comps = new Map();
  const add = (key, base) => { const c = comps.get(key) || { ...base, locations: new Set() }; c.locations.add(base.location); comps.set(key, c); };
  const localPy = new Set(facts.files.filter((f) => f.path.endsWith('.py')).map((f) => f.path.split('/').pop().replace(/\.py$/, '')));
  const manifests = facts.files.filter((f) => /(^|\/)(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|requirements[^/]*\.txt|pyproject\.toml|Pipfile(\.lock)?|poetry\.lock)$/.test(f.path)).map((f) => f.path);
  const notices = facts.files.filter((f) => /(^|\/)(LICENSE|LICENCE|COPYING|NOTICE)(\.[a-z]+)?$/i.test(f.path)).map((f) => redact(f.path));
  for (const f of facts.files) {
    const text = facts.text[f.path];
    if (typeof text !== 'string') continue;
    const loc = redact(f.path);
    if (/\.(js|mjs|cjs|ts)$/.test(f.path)) for (const s of jsSpecifiers(text)) {
      if (s.startsWith('.') || s.startsWith('/')) continue;
      const bare = s.replace(/^node:/, '');
      if (s.startsWith('node:') || NODE_BUILTINS.has(bare)) { add('node:' + bare, { name: 'node:' + bare, ecosystem: 'node-builtin', kind: 'runtime built-in module', declared_version: 'NOT_DECLARED (supplied by the Node.js runtime)', location: loc }); continue; }
      const m = /^https?:\/\/([^/]+)\/(.+)$/.exec(s);
      if (m) { add('url:' + s, { name: s, ecosystem: 'url-import', kind: 'module imported by URL', declared_version: (/@([\w.^~-]+)/.exec(m[2]) || [])[1] || 'NOT_DECLARED', location: loc }); continue; }
      const name = s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0];
      add('npm:' + name, { name, ecosystem: 'npm', kind: 'third-party package import', declared_version: 'NOT_DECLARED (no package manifest tracked)', location: loc });
    }
    if (f.path.endsWith('.py')) for (const mod of pyImports(text)) {
      if (PY_STDLIB.has(mod) || mod === '__future__') continue;
      if (localPy.has(mod)) continue;
      add('py:' + mod, { name: mod, ecosystem: 'python', kind: 'third-party or unrecognized Python import', declared_version: 'NOT_DECLARED (no requirements file tracked)', location: loc });
    }
    if (/\.html?$/.test(f.path)) for (const [re, label, kind] of HOSTED) if (re.test(text)) add('hosted:' + label, { name: label, ecosystem: 'hosted', kind, declared_version: 'NOT_DECLARED (served by the provider)', location: loc });
    if (/^\.github\/workflows\/.+\.ya?ml$/.test(f.path)) for (const m of text.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
      const [name, ver] = m[1].split('@');
      add('gha:' + m[1], { name, ecosystem: 'github-actions', kind: 'workflow action', declared_version: ver || 'NOT_DECLARED', location: loc });
    }
  }
  const list = [...comps.values()].map((c) => {
    const builtin = c.ecosystem === 'node-builtin';
    return {
      name: c.name, ecosystem: c.ecosystem, kind: c.kind, declared_version: c.declared_version,
      locations: [...c.locations].sort(), location_count: c.locations.size,
      local_license_evidence: 'NONE_FOUND', license_value: null,
      status: builtin ? 'UNKNOWN' : 'MISSING_LOCAL_LICENSE_METADATA',
      note: builtin ? 'Part of the Node.js runtime, not a repository dependency. The runtime license is not recorded in this repository.' : 'No local license field, notice or package metadata for this component is tracked in the repository.',
    };
  }).sort((a, b) => (a.ecosystem + a.name < b.ecosystem + b.name ? -1 : 1));
  return { manifests: manifests.map(redact), license_files: notices, components: list,
           repository_license: notices.length ? 'REQUIRES_REVIEW (license file present; content not interpreted)' : 'UNKNOWN (no LICENSE, COPYING or NOTICE file tracked)' };
}

// ---- secret-like patterns (names and counts only, never values) -------------------------------------
export const SECRET_PATTERNS = Object.freeze([
  ['anthropic_api_key', /sk-ant-[A-Za-z0-9_-]{20,}/], ['openai_api_key', /\bsk-(?:proj-)?[A-Za-z0-9]{32,}\b/], ['github_token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['aws_access_key', /\bAKIA[0-9A-Z]{16}\b/], ['private_key_block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/], ['slack_token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['jwt', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/], ['supabase_secret_key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
  ['supabase_publishable_key', /\bsb_publishable_[A-Za-z0-9_-]{10,}/], ['vercel_token', /\b(?:vercel|vc)_[A-Za-z0-9]{24,}\b/],
]);
export function secretScan(facts) {
  const hits = {};
  for (const f of facts.files) {
    const t = facts.text[f.path];
    if (typeof t !== 'string') continue;
    for (const [name, re] of SECRET_PATTERNS) if (re.test(t)) (hits[name] = hits[name] || []).push(redact(f.path));
  }
  return Object.fromEntries(Object.keys(hits).sort().map((k) => [k, { files: hits[k].sort(), count: hits[k].length,
    note: k === 'supabase_publishable_key' ? 'A publishable (client-side) key pattern. Whether its exposure is intended is REQUIRES_REVIEW; the value is not reproduced.' : 'Pattern match only. The value is not reproduced. Whether it is a live credential, a test string or a documented example is REQUIRES_REVIEW.' }]));
}

// ---- contribution map -----------------------------------------------------------------------------
const AI_TRAILER = /co-authored-by:\s*(claude|codex|copilot|chatgpt|gemini)|claude-session:|generated with \[claude/i;
const AI_AUTHOR = /^(claude|codex|copilot|chatgpt|gemini)$/i;
export const maskEmail = (e) => { const [u, d] = String(e).split('@'); return d ? (u.length > 1 ? u[0] + '…' : u) + '@' + d : '…'; };
export function contributionMap(facts) {
  const areaFiles = {};
  for (const f of facts.files) { const a = areaOf(f.path); (areaFiles[a ? a.id : 'UNCLASSIFIED'] = areaFiles[a ? a.id : 'UNCLASSIFIED'] || new Set()).add(f.path); }
  const rows = [];
  for (const area of AREAS.map((a) => a.id).concat(areaFiles.UNCLASSIFIED ? ['UNCLASSIFIED'] : [])) {
    const files = areaFiles[area];
    if (!files) continue;
    const touching = facts.commits.filter((c) => c.files.some((p) => files.has(p) || (areaOf(p) || { id: 'UNCLASSIFIED' }).id === area));
    const ids = new Map();
    let ai = 0;
    for (const c of touching) {
      const key = c.author + ' <' + maskEmail(c.email) + '>';
      ids.set(key, (ids.get(key) || 0) + 1);
      if (AI_TRAILER.test(c.message) || AI_AUTHOR.test(c.author)) ai++;
    }
    const sorted = [...touching].sort((a, b) => (a.date + a.hash < b.date + b.hash ? -1 : 1));
    const genCount = [...files].filter((p) => generatedInfo(facts.text[p])).length;
    const origin = [];
    if (ai) origin.push('AI_ASSISTED_RECORDED');
    if (genCount) origin.push('GENERATED');
    if (!origin.length) origin.push('UNKNOWN');
    rows.push({
      area, files: files.size,
      earliest_available_commit: sorted.length ? { hash: sorted[0].hash, date: sorted[0].date } : null,
      most_recent_available_commit: sorted.length ? { hash: sorted[sorted.length - 1].hash, date: sorted[sorted.length - 1].date } : null,
      commits_touching: touching.length, commits_with_ai_tool_markers: ai, generated_files: genCount,
      contributor_identities: [...ids.entries()].map(([identity, commits]) => ({ identity, commits })).sort((a, b) => (a.identity < b.identity ? -1 : 1)),
      origin_labels: origin,
      limitation: (facts.shallow ? 'The clone is shallow, so the earliest available commit is a history boundary, not the origin of the files. ' : '') + 'An AI-tool marker (an AI author identity or an AI co-author or session trailer) records that a tool took part in a commit; its absence does not show that a person wrote the change. ' + METADATA_NOTE,
    });
  }
  return rows;
}

// ---- the whole inventory ---------------------------------------------------------------------------
export function analyze(facts) {
  const dev = devMaterialPaths(facts);
  const files = facts.files.map((f) => classifyFile(f, facts, dev)).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : (a.blob < b.blob ? -1 : 1)));
  const count = (k) => files.reduce((m, f) => { m[f[k]] = (m[f[k]] || 0) + 1; return m; }, {});
  const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  return {
    audit_version: AUDIT_VERSION,
    snapshot: { source_commit: facts.commit, commit_date: facts.commit_date, shallow_history: facts.shallow, tracked_files: files.length,
                commits_available: facts.commits.length, inventory_digest: null },
    totals: { by_boundary: sortObj(count('boundary')), by_asset_class: sortObj(count('asset_class')), by_area: sortObj(count('area')) },
    files,
    boundary_groups: boundaryGroups(files),
    dependencies: dependencies(facts),
    secret_patterns: secretScan(facts),
    contribution: contributionMap(facts),
    routing_note: ROUTING_NOTE, metadata_note: METADATA_NOTE,
  };
}

function boundaryGroups(files) {
  const g = new Map();
  for (const f of files) {
    const key = f.area + '|' + f.boundary;
    const e = g.get(key) || { area: f.area, boundary: f.boundary, files: 0, exclusion_rules: new Set(), synthetic_files: 0, may_contain_record_excerpts: new Set(), diligence: new Set(), exclude_from_public_release: f.exclude_from_public_release, restricted_files: 0 };
    e.files++; if (f.deployment_exclusion) e.exclusion_rules.add(f.deployment_exclusion); if (f.synthetic_material) e.synthetic_files++;
    e.may_contain_record_excerpts.add(f.may_contain_record_excerpts); e.diligence.add(f.diligence_package); if (f.restricted_surface) e.restricted_files++;
    g.set(key, e);
  }
  return [...g.values()].map((e) => ({ ...e, exclusion_rules: [...e.exclusion_rules].sort(), may_contain_record_excerpts: [...e.may_contain_record_excerpts].sort(), diligence: [...e.diligence].sort(),
    routing: e.exclusion_rules.size ? ROUTING_NOTE : 'Deployed with the site (no .vercelignore rule matches).' }))
    .sort((a, b) => (a.area + a.boundary < b.area + b.boundary ? -1 : 1));
}
