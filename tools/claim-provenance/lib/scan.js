// Claim provenance: the public-claim scanner. INTERNAL, LOCAL ONLY.
//
// Reads public pages, public routes and readable public downloads, splits their visible text into
// sentences with raw-file line numbers, and classifies every sentence that carries a research
// figure or a status claim:
//   PERMITTED       linked to a register claim, carrying its qualifiers, or a clear limitation statement;
//   HISTORICAL      clearly placed as history (a historical marker, section or stub page);
//   AMBIGUOUS       linked to a claim the register records as NOT_ASSESSED;
//   UNSUPPORTED     a figure no claim owns, a prohibited overstatement, or a NOT_SUPPORTED claim;
//   REQUIRES_REPAIR a registered claim missing a recorded qualifier, or a claim marked for repair.
// It is a sentence-level heuristic with a fixed context window. It reads meaning only through the
// register's patterns, so what it cannot place is reported rather than passed.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { asserts, READINESS } from './rules.js';
import { resolvedBy } from './repairs.js';

export const DISPOSITIONS = Object.freeze(['PERMITTED', 'HISTORICAL', 'AMBIGUOUS', 'UNSUPPORTED', 'REQUIRES_REPAIR']);
const RANK = { PERMITTED: 0, HISTORICAL: 1, AMBIGUOUS: 2, REQUIRES_REPAIR: 3, UNSUPPORTED: 4 };
export const WINDOW = 3;
// Analytics, admin and opaque-slug routes feed the owner surface; their prose is reported, not gated.
export const OWNER_ROUTE = /(-stats|-admin)\.js$|-[0-9a-f]{12,}\.js$/;
export const REPORT_ONLY = Object.freeze(['repository-documentation', 'owner-analytics-route']);

// ---- scope ------------------------------------------------------------------------------------------
// Directories .vercelignore excludes, as tests/public-boundary-claims.mjs lists them, plus an
// untracked local directory of archived third-party pages that is not part of this repository.
const NOT_DEPLOYED = new Set(['research', 'docs', 'scripts', 'build', 'supabase', 'templates', 'standard', '.jrs', 'lib', 'tools', 'tests', 'schemas', '.claude', 'node_modules', '.git', 'cep-article-prep', 'friendlyfreelancefiles']);
// CLAUDE.md 36.3 restricted surfaces: not public, never quoted into a report.
export const RESTRICTED = new Set(['programme-status-9872fb93cc94.html', 'acquisition-9f3c2a7d4b.html', 'vp-7c1f9a4e8d2b6035.html', 'api/people-9dd1ecdf6f8cdfd4.js', 'api/leads-4b7e2c9af106d385.js']);
const NOT_DOWNLOADS = new Set(['vercel.json', 'package.json', 'package-lock.json']);
export const REPOSITORY_DOCS = Object.freeze(['docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md', 'docs/architecture/CURRENT_RELEASE_GATE_REPORT.md', 'lib/engine-candidate/README.md', 'research/JRS_Validation_Report.md']);

function walk(root, dir, keep, out) {
  for (const name of readdirSync(join(root, dir)).sort()) {
    const rel = dir ? dir + '/' + name : name, st = statSync(join(root, rel));
    if (st.isDirectory()) { if (!NOT_DEPLOYED.has(rel.split('/')[0])) walk(root, rel, keep, out); }
    else if (keep(rel) && !RESTRICTED.has(rel)) out.push(rel);
  }
  return out;
}
export function scopeFiles(root) {
  const pages = walk(root, '', (p) => p.endsWith('.html'), []);
  const routes = existsSync(join(root, 'api')) ? walk(root, 'api', (p) => p.endsWith('.js'), []) : [];
  const top = readdirSync(root).filter((f) => statSync(join(root, f)).isFile());
  const downloads = top.filter((f) => /\.(json|txt|csv)$/.test(f) && !NOT_DOWNLOADS.has(f)).sort();
  const unreadable = top.filter((f) => /\.(pdf|docx)$/.test(f)).sort();
  return { pages, routes, downloads, unreadable, docs: REPOSITORY_DOCS.filter((p) => existsSync(join(root, p))) };
}

// ---- text with raw line numbers -------------------------------------------------------------------------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '->', mdash: '-', ndash: '-', middot: '·', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', hellip: '...', plusmn: '±', times: '×', radic: '√' };
const blank = (m) => m.replace(/[^\n]/g, ' ');
export function sentencesOf(text, kind) {
  let t = text;
  const headings = [];
  const meta = [];
  if (kind === 'html') {
    // Text a reader or a search engine sees outside the body copy: meta and Open Graph descriptions,
    // structured-data strings, and alt, aria-label and title attributes. Each is scanned at its line.
    const at = (i) => t.slice(0, i).split('\n').length;
    for (const m of t.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = m[0], key = /(?:name|property)="([^"]+)"/i.exec(tag), val = /content="([^"]*)"/i.exec(tag);
      if (key && val && /^(description|og:description|og:title|twitter:description|twitter:title)$/i.test(key[1])) meta.push({ line: at(m.index), text: val[1] });
    }
    for (const m of t.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi))
      for (const v of m[1].matchAll(/"(?:description|name|headline|abstract|text|alternateName|creativeWorkStatus)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) meta.push({ line: at(m.index + m[0].indexOf(v[0])), text: v[1] });
    for (const m of t.matchAll(/\s(?:alt|aria-label|title)="([^"]{12,})"/gi)) meta.push({ line: at(m.index), text: m[1] });
    t = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, blank);
    for (const m of t.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>|<(section|article)\b/gi)) headings.push({ line: t.slice(0, m.index).split('\n').length, text: (m[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
    t = t.replace(/<[^>]*>/g, blank).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
  }
  const out = [];
  t.split('\n').forEach((raw, i) => {
    for (const s of raw.split(/(?<=[.!?])\s+/)) { const v = s.replace(/\s+/g, ' ').trim(); if (v) out.push({ line: i + 1, text: v }); }
  });
  const dec = (v) => v.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
  for (const m of meta) for (const x of dec(m.text).split(/(?<=[.!?])\s+/)) { const v = x.replace(/\s+/g, ' ').trim(); if (v) out.push({ line: m.line, text: v, metadata: true }); }
  out.sort((a, b) => a.line - b.line);
  for (const s of out) { const h = headings.filter((x) => x.line <= s.line).pop(); s.heading = h ? h.text : ''; s.section = h ? h.line : 0; }
  return out;
}

// ---- patterns ----------------------------------------------------------------------------------------------
export const NUM_TOKEN = /\b\d+(?:\.\d+)?\s?(?:%|percent\b)|\b\d+\.\d+e-\d+\b|\b0\.\d{2,3}\b|\b\d+\.\d\b(?=\s+(?:to|percent|%))|\b\d[\d,]*\s+(?:(?:independent|international|distinct|detection-panel|individual|recorded|dated|nightly|analysed|shared|scored|graded|submitted|constructed|mixed-denominator)\s+)*(?:records|reviewers|raters|runs|reads|participants|countries|continents|labels|determinations|judgments|judgements|experts|completers|people|studies|texts|participations)\b|\b\d+-record\b|\b\d+ of \d+ (?:records|reviewers|raters)\b/g;
const NEG = /\b(not|no|never|nor|neither|without|cannot|isn't|aren't|doesn't|does not|is not|are not|was not|were not|none|nothing)\b/i;
const LIMITATION_SENTENCE = /^(the |this |that )?(?:[^.;]|\.(?=\d)){0,60}\b(figure|result|estimate|coefficient|number|interval)s? (is|are|was|were) not\b|^it is not\b/i;
const GUIDANCE = /\b(recommend\w*|start with|starting with|begin with|practical way|format|guidance|suggest\w*)\b/i;
const HIST = /\b(historical|previously|formerly|earlier implementation|earlier versions?|(the |this )?(earlier |archived )?draft (reports|said|says|states|treats|calls)|no longer|closed on|superseded|archived|retired|at the time|was dropped|has been dropped)\b/i;
const HIST_SECTION = /\b(history|historical|earlier|previous|archive|closed)\b/i;
const EXAMPLE = /\b(example|illustrative|illustration|sample (record|report|finding)|sampling (finding|example)|simulation|simulated|fictional|worked example|scenario|before and after|after revision)\b/i;
const SUBJECT = /\b(JRS|the standard|the method(ology)?|Review Engine|the Engine|engine candidate|this (tool|check|service|product|method)|our (tool|service|method|standard|engine))\b/i;
// [rule, pattern, linked claim topic] for status claims that need no figure.
export const STATUS_RULES = Object.freeze([
  ['READINESS_OR_COMPLIANCE', READINESS, 'ENGINE_STATUS'],
  ['VALIDATED_STATUS', /\b(is|are|has been|have been|was|were|been)\s+(fully |independently |empirically |scientifically |externally |psychometrically )?validated\b|\bvalidated (standard|method|methodology|instrument|tool|engine|framework|scale|model)\b|\b(independent|external|empirical) validation (of|shows|confirms|demonstrates|establishes)\b|\bvalidation (is|was) complete\b/i, 'METHODOLOGY'],
  ['PRODUCTION_OR_OPERATIONAL', /\b(production (use|deployment|system|service|grade)|operationally deployed|live (service|deployment)|operational (capability|deployment|system))\b/i, 'ENGINE_STATUS'],
  ['SOURCE_GROUNDING_AS_SEMANTIC', /\b(semantically (correct|supported|verified|valid)|hallucination[- ]free|quotations? (proves?|verif(y|ies)|confirms?) (the|each|every)|every finding is (verified|correct|supported))\b/i, 'ENGINE_STATUS'],
  ['SUPERSEDED_METHODS_WORDING', /\b(supports? reproducible application|substantial (inter-rater )?(agreement|reliability)|reproducib(le|ility) (is |was |has been )?(established|demonstrated|shown|confirmed))\b/i, 'RELIABILITY', false],
  ['LICENSING_OR_SALE_OFFER', /\b(available (for|to) licens\w*|licens(e|ing) (is )?(available|offered)|for sale|can be (licensed|purchased|acquired)|acquisition (pathway|opportunity) (is )?(open|available))\b/i, 'COMMERCIAL'],
]);
const ENGINE_TERM = /\b(Review Engine|the Engine|engine candidate|automated reviewer|AI reviewer)\b/i;
const RESEARCH_TERM = /\b(83\.9|AC1|detection (study|panel|accuracy|result)|reliab\w*|accura\w*|validat\w*|research (shows|finding|result)s?|studies (show|found)|study (shows|found))\b/i;

const re = (s) => new RegExp(s, 'i');
const reG = (s) => new RegExp(s, 'gi');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// ---- classify one sentence ------------------------------------------------------------------------------------
export function classify(sentences, i, claims, ctx = {}) {
  const s = sentences[i], text = s.text;
  // Qualifier context: the sentence and its neighbours. A whole section is deliberately not used: on a
  // grid of result cards, one card's scope ("constructed") must not satisfy another card's figure.
  const win = sentences.slice(Math.max(0, i - WINDOW), i + WINDOW + 1).map((x) => x.text).join(' ');
  const back = sentences.slice(Math.max(0, i - 12), i + 1).map((x) => x.text).join(' ');
  const tokens = [...text.matchAll(NUM_TOKEN)].map((m) => ({ text: m[0], start: m.index, end: m.index + m[0].length }));
  const results = [];
  const historical = HIST.test(text) || HIST_SECTION.test(s.heading || '') || ctx.historicalPage;
  const example = EXAMPLE.test(back) || EXAMPLE.test(s.heading || '');

  for (const [rule, pat, topic, needsSubject = true] of STATUS_RULES) {
    if (!pat.test(text) || (needsSubject && !SUBJECT.test(text))) continue;
    if (!asserts(text, pat)) { results.push({ kind: rule, disposition: 'PERMITTED', reason: 'a limitation or negated statement' }); continue; }
    if (historical) { results.push({ kind: rule, disposition: 'HISTORICAL', reason: 'clearly placed as history' }); continue; }
    const c = claims.find((x) => x.claim_topic === topic && x.status === 'NOT_SUPPORTED') || claims.find((x) => x.status === 'NOT_SUPPORTED');
    results.push({ kind: rule, disposition: 'UNSUPPORTED', claim: c && c.claim_id, reason: 'asserts a status no evidence supports' });
  }
  if (ENGINE_TERM.test(text) && asserts(text, RESEARCH_TERM) && !historical) {
    const c = claims.find((x) => /validate the Review Engine/.test(x.claim_text));
    const negated = NEG.test(text);
    results.push({ kind: 'ENGINE_TRANSFER', disposition: negated ? 'PERMITTED' : 'UNSUPPORTED', claim: c && c.claim_id, reason: negated ? 'states that research does not carry to the Engine' : 'transfers research language to the Engine' });
  }

  if (tokens.length) {
    const linked = claims.filter((c) => c.scan.signatures.some((p) => re(p).test(text)));
    const spans = (list) => list.flatMap((c) => c.scan.figures.flatMap((p) => [...text.matchAll(reG(p))].map((m) => [m.index, m.index + m[0].length])));
    // A token is covered when its leading number lies inside a span a claim's figure pattern matched.
    const covered = (tk, sp) => { const core = /^\d[\d.,]*(?:e-\d+)?/.exec(tk.text)[0].replace(/[.,]$/, ''); return sp.some(([a, b]) => tk.start >= a && tk.start + core.length <= b); };
    let sp = spans(linked);
    const extra = claims.filter((c) => !linked.includes(c) && tokens.some((tk) => !covered(tk, sp) && covered(tk, spans([c]))));
    sp = sp.concat(spans(extra));
    const uncovered = tokens.filter((tk) => !covered(tk, sp));
    if (uncovered.length) {
      if (example) results.push({ kind: 'FIGURE', disposition: 'PERMITTED', reason: 'illustrative example, not a research figure', figures: uncovered.map((u) => u.text) });
      else if (historical) results.push({ kind: 'FIGURE', disposition: 'HISTORICAL', reason: 'figure in a historical context', figures: uncovered.map((u) => u.text) });
      else results.push({ kind: 'FIGURE', disposition: 'UNSUPPORTED', reason: 'a figure no register claim owns (new, changed or unrecorded)', figures: uncovered.map((u) => u.text) });
    }
    for (const c of linked) {
      const sigs = c.scan.signatures.map(re);
      // A sentence that carries a negation about the figure is a limitation statement ("the 83.9 percent
      // figure is not a reliability measure"); qualifiers are required of assertions, not of limitations.
      const limitationOnly = LIMITATION_SENTENCE.test(text) || sigs.every((p) => !p.test(text) || !asserts(text, p));
      const bad = c.scan.prohibited.filter(([, p]) => asserts(text, re(p))).map(([name]) => name);
      // A qualifier marked 'sentence' (a run count's window, say) must sit in the same sentence as the figure.
      const missing = c.scan.qualifiers.filter(([, p, scope]) => !re(p).test(scope === 'sentence' ? text : win)).map(([name]) => name);
      let d, reason;
      if (bad.length && historical) { d = 'HISTORICAL'; reason = 'a withdrawn characterisation reported as history: ' + bad.join('; '); }
      else if (bad.length) { d = 'UNSUPPORTED'; reason = 'prohibited overstatement: ' + bad.join('; '); }
      else if (c.status === 'NOT_SUPPORTED') { d = limitationOnly ? 'PERMITTED' : 'UNSUPPORTED'; reason = 'a NOT_SUPPORTED claim'; }
      else if (c.status === 'REQUIRES_WORDING_REPAIR') { d = missing.length ? 'REQUIRES_REPAIR' : 'PERMITTED'; reason = missing.length ? 'the register marks this claim for wording repair (missing: ' + missing.join('; ') + ')' : 'carries the repaired wording the register requires'; }
      else if (c.status === 'HISTORICAL_ONLY') { d = historical ? 'HISTORICAL' : 'REQUIRES_REPAIR'; reason = historical ? 'historical figure in a historical context' : 'a historical figure presented as current'; }
      else if (c.status === 'NOT_ASSESSED' && c.claim_topic === 'PROCEDURAL_GUIDANCE' && GUIDANCE.test(text)) { d = 'PERMITTED'; reason = 'a guidance quantity worded as guidance, not as a finding'; }
      else if (c.status === 'NOT_ASSESSED') { d = 'AMBIGUOUS'; reason = 'the register records this claim as NOT_ASSESSED'; }
      else if (c.status === 'RETIRED') { d = 'REQUIRES_REPAIR'; reason = 'a retired claim'; }
      else if (missing.length && !limitationOnly) { d = 'REQUIRES_REPAIR'; reason = 'missing qualifier: ' + missing.join('; '); }
      else { d = 'PERMITTED'; reason = limitationOnly ? 'a limitation statement' : 'carries the recorded qualifiers'; }
      results.push({ kind: 'CLAIM', claim: c.claim_id, status: c.status, disposition: d, reason, missing_qualifiers: missing });
    }
  }
  if (!results.length) return null;
  const worst = results.reduce((a, b) => (RANK[b.disposition] > RANK[a.disposition] ? b : a));
  return {
    line: s.line, text, text_sha256: sha(text), disposition: worst.disposition,
    claim_ids: [...new Set(results.map((r) => r.claim).filter(Boolean))],
    missing_qualifiers: [...new Set(results.flatMap((r) => r.missing_qualifiers || []))],
    reasons: results.map((r) => r.kind + ': ' + r.reason + (r.figures ? ' [' + r.figures.join(', ') + ']' : '')),
  };
}

export function scanText(text, file, kind, claims) {
  const sents = sentencesOf(text, kind);
  // A historical stub: a short noindex page that says it is historical or closed.
  const historicalPage = kind === 'html' && text.length < 2000 && /<meta[^>]+noindex/i.test(text) && /\b(historical|closed|not active)\b/i.test(text);
  const out = [];
  sents.forEach((_, i) => { const f = classify(sents, i, claims, { historicalPage }); if (f) out.push({ file, ...f }); });
  return out;
}

export const normVisible = (t) => String(t).replace(/\s+/g, ' ').replace(/\s+([,.;:)])/g, '$1').replace(/\(\s+/g, '(').trim();
const kindOf = (f) => (f.endsWith('.html') ? 'html' : f.endsWith('.js') ? 'js' : 'text');

// A route's public text is its prose string literals. Comments and source code are not served to
// a visitor, and CSS or JSON fragments are not prose, so neither is scanned.
export function routeProse(src) {
  const lines = src.split('\n');
  return lines.map((l) => {
    const code = l.replace(/^\s*\/\/.*$/, '').replace(/\s\/\/\s.*$/, '');
    const lits = [...code.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
    return lits.filter((t) => /[A-Za-z]{2,}\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(t) && !/[{};]\s*$|^[\s.#][\w-]+\{|:\s*[\d#]/.test(t)).map((t) => t.replace(/<[^>]+>/g, ' ')).join(' ');
  }).join('\n');
}
export function scanRepository(root, claims, repairs = []) {
  const scope = scopeFiles(root), findings = [];
  const groups = [['public-page', scope.pages], ['public-route', scope.routes.filter((f) => !OWNER_ROUTE.test(f))], ['owner-analytics-route', scope.routes.filter((f) => OWNER_ROUTE.test(f))], ['public-download', scope.downloads], ['repository-documentation', scope.docs]];
  for (const [group, files] of groups) for (const f of files) {
    const raw = readFileSync(join(root, f), 'utf8'), kind = kindOf(f);
    for (const x of scanText(kind === 'js' ? routeProse(raw) : raw, f, kind === 'js' ? 'text' : kind, claims)) findings.push({ group, ...x });
  }
  const used = new Set();
  for (const f of findings) {
    const r = ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition) ? repairs.find((p) => p.file === f.file && resolvedBy(p).includes(f.text)) : null;
    f.repair_id = r ? r.id : null; f.repair_target = r ? r.target : null; f.proposed_replacement = r ? r.replacement : null; if (r) used.add(r);
  }
  // A proposal is stale when its target sentence is no longer in the file, or it resolves nothing.
  // An implemented repair is a regression check: its target must stay absent and its applied text
  // present in the file's visible text (whitespace before punctuation ignored).
  const sentenceSets = {}, visible = {};
  const textOf = (f) => (sentenceSets[f] ||= new Set(sentencesOf(readFileSync(join(root, f), 'utf8'), kindOf(f) === 'html' ? 'html' : 'text').map((x) => x.text)));
  const visibleOf = (f) => (visible[f] ??= normVisible([...textOf(f)].join(' ')));
  const regressions = repairs.filter((r) => r.status === 'IMPLEMENTED').filter((r) => !existsSync(join(root, r.file))
    || (r.target && visibleOf(r.file).includes(normVisible(r.target))) || !visibleOf(r.file).includes(normVisible(r.applied))).map((r) => r.id + ' ' + r.file);
  const gated = findings.filter((f) => !REPORT_ONLY.includes(f.group));
  const summary = Object.fromEntries(DISPOSITIONS.map((d) => [d, findings.filter((f) => f.disposition === d).length]));
  const unproposed = gated.filter((f) => ['UNSUPPORTED', 'REQUIRES_REPAIR'].includes(f.disposition) && !f.proposed_replacement);
  return {
    scope: { public_pages: scope.pages.length, public_routes: scope.routes.length, public_downloads: scope.downloads, not_text_readable: scope.unreadable, repository_docs: scope.docs, restricted_excluded: [...RESTRICTED].length },
    summary, gate: { unproposed: unproposed.length, stale_proposals: repairs.filter((r) => r.status !== 'IMPLEMENTED').filter((r) => !used.has(r) || !existsSync(join(root, r.file)) || !textOf(r.file).has(r.target)).map((r) => r.id), regressions }, findings,
  };
}
