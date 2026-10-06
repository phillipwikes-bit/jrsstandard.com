// Public-boundary claim test (PR #39 source-aligned repairs, WP C, 2026-10-06).
//
// Fails if a deployed public page states, as current, any of: public record intake,
// public review execution, a public API or sandbox, token access, current model-provider
// processing of records, retention of record-derived model output, public Manifest
// generation, or production, validated, enterprise-ready, licensing-ready or sale-ready
// status. The position it enforces is the 5 October handoff
// (docs/architecture/CURRENT_ENGINE_HANDOFF_2026-10-05.md) and the owner's position of
// 2026-10-06: public review routes do not accept records and do not perform inference.
//
// Accurate historical research and negated statements are allowed: a sentence is allowed
// when it carries a negation or a historical marker (NEGATED below). Each allowance is a
// sentence-level judgement, so a page cannot pass by putting a negation in a different
// sentence from the claim.
//
// It adds no guard to scripts/check_zero_drift.py and changes no guard.
//   node tests/public-boundary-claims.mjs            check
//   node tests/public-boundary-claims.mjs --list     also print every allowed (negated) match
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url).pathname;

// Directories .vercelignore excludes (never deployed), plus tooling.
const NOT_DEPLOYED = new Set(['research', 'docs', 'scripts', 'build', 'supabase', 'templates', 'standard', '.jrs', 'lib', 'tools',
  'tests', 'schemas', '.claude', 'node_modules', '.git', 'cep-article-prep']);
// Restricted surfaces under CLAUDE.md 36.3. They are not public pages, and their content and
// access architecture are held by B-010 and the owner classification of 2026-09-14.
export const RESTRICTED = new Set(['programme-status-9872fb93cc94.html', 'acquisition-9f3c2a7d4b.html', 'vp-7c1f9a4e8d2b6035.html']);

export function publicPages(root = ROOT) {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name), rel = relative(root, p);
      if (statSync(p).isDirectory()) { if (!NOT_DEPLOYED.has(rel.split('/')[0])) walk(p); continue; }
      if (name.endsWith('.html') && !RESTRICTED.has(rel)) out.push(rel);
    }
  };
  walk(root);
  return out.sort();
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '→', mdash: '—', ndash: '–', middot: '·', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…' };
export function visibleSentences(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ')
    .replace(/<(textarea|input|button)\b[^>]*\bplaceholder="([^"]*)"[^>]*>/gi, ' $2 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
  return text.split(/(?<=[.!?])\s+|\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

// [category, pattern]. Each pattern names a claim that is false if read as current.
export const CLAIMS = [
  ['public_record_intake', /\b(paste|submit|upload|send|enter)\b[^.]{0,40}\b(any|a|an|one|your|five of your|the)?\s*(organizational |closed |own )?records?\b(?! keeping| retention)[^.]{0,60}\b(below|here|for review|to (be )?(review|assess)|and receive)\b/i],
  ['public_record_intake', /\brun (one|a|your) records?\b|\brun the (mini-pilot|diagnostic)\b|\bdiagnostic on my records\b|\benter record text for review\b/i],
  // The old workspace button label, matched case-sensitively so "assess record visibility" in prose is not caught.
  ['public_record_intake', /(?:^|\s)Assess Record(?:\s|$)/],
  ['public_review_execution', /\b(this|the) (review|workspace|engine|tool|page)\b[^.]{0,30}\b(reads|evaluates|assesses|examines|returns)\b[^.]{0,40}\b(your|the|any)\b[^.]{0,20}\brecords?\b/i],
  ['public_review_execution', /\breceive (reconstruction-oriented )?review observations\b|\bone record in, a structured determination\b|\bto submitted record text\b|\breturns routing guidance\b|\bopen (the )?ai-assisted record reviewer\b/i],
  ['public_api_or_sandbox', /\b(API licensing|B2B API|integration schema|technical integration inquiry|sandbox access|API access|request API|embed a pre-finalization decision gate)\b/i],
  ['token_access', /\b(bearer token|per-partner tokens?|per-organisation (allow list|tokens?)|tokens are issued|request a token|your-token)\b/i],
  ['current_provider_processing', /\b(transmitted|sent|posted|passed)\b[^.]{0,60}\b(to|from there to)\b[^.]{0,40}\b(Anthropic|OpenAI|the model provider)\b|\b(Anthropic|OpenAI)\b[^.]{0,40}\b(receives|processes|provides the model behind)\b|\bperformed by a hosted model\b/i],
  ['record_truncation', /\btruncated (to|at) 8,000\b|\blonger input is truncated\b/i],
  ['derived_output_retention', /\bkept for \d+ days\b|\bwhat the model writes about the record\b[^.]{0,40}\b(is|are)\b[^.]{0,10}\b(stored|kept)\b|\bmodel-written text about the record\b|\bkept as (programme )?telemetry\b/i],
  ['public_manifest_generation', /\b(generate|download|produce|issue)s? (a |your )?(decision reconstruction )?manifest (for|from) (your|a|the) record\b/i],
  ['status_claim', /\b(production[- ]ready|enterprise[- ]ready|licensing[- ]ready|sale[- ]ready|acquisition[- ]ready|ready for (sale|licensing|acquisition|production|deployment)|validated (review )?engine|engine is validated)\b/i],
];

// A sentence is allowed when a negation or a historical marker comes before the end of the matched claim.
// A marker that only follows the claim ("truncated before evaluation, not rejected") does not negate it.
export const NEGATED = /\b(not|never|none|nothing|nor|without|cannot|no longer|retired|historical(ly)?|previously|formerly|earlier versions?|is closed|are closed|now closed|was|were|did|until|prior to|no (public|record|records|api|sandbox|token|tokens|provider|model|inference|evaluation|review|manifest|intake|submission|licensing|production|sale))\b|n['’]t\b/i;

export function scan(pages, readPage) {
  const violations = [], allowed = [];
  for (const page of pages) {
    for (const s of visibleSentences(readPage(page))) {
      for (const [cat, re] of CLAIMS) {
        const m = s.match(re);
        if (!m) continue;
        (NEGATED.test(s.slice(0, m.index + m[0].length)) ? allowed : violations).push({ page, category: cat, sentence: s.slice(0, 240) });
      }
    }
  }
  return { violations, allowed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = publicPages();
  const { violations, allowed } = scan(pages, (p) => readFileSync(join(ROOT, p), 'utf8'));
  let failed = 0;
  const t = (n, ok, d = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
  for (const [cat] of CLAIMS.filter((c, i, a) => a.findIndex((x) => x[0] === c[0]) === i)) {
    const v = violations.filter((x) => x.category === cat);
    t(`no public page states ${cat.replace(/_/g, ' ')} as current`, v.length === 0);
    for (const x of v) console.log(`        ${x.page}: ${x.sentence}`);
  }
  // Self-test: the scanner fires on the stale wording and allows negated and historical statements.
  const probe = (html) => scan(['probe.html'], () => html);
  t('fires: stale provider sentence', probe('<p>Record text is sent over TLS to this endpoint and from there to <b>Anthropic</b>, the model provider.</p>').violations.length > 0);
  t('fires: stale retention sentence', probe('<p>It is kept for 90 days and then removed.</p>').violations.length > 0);
  t('fires: record intake invitation', probe('<p>Paste any organizational record below and receive review observations.</p>').violations.length > 0);
  t('fires: token instructions', probe('<pre>Authorization: Bearer &lt;your-token&gt;</pre>').violations.length > 0);
  t('fires: the old reviewer card', probe('<p>The AI-assisted record reviewer applies the framework to submitted record text and returns routing guidance.</p>').violations.length > 0);
  t('fires: readiness claim', probe('<p>The engine is production-ready.</p>').violations.length > 0);
  t('fires: a negation in a different sentence does not excuse the claim', probe('<p>Records are not stored. It is transmitted to Anthropic, the model provider, to be assessed.</p>').violations.length > 0);
  t('fires: a negation after the claim does not excuse it', probe('<p>Longer input is truncated before evaluation, not rejected.</p>').violations.length > 0
    && probe('<p>Tokens are issued per organisation, so one can be revoked without affecting any other partner.</p>').violations.length > 0);
  t('fires: a closed-records phrase is not a negation', probe('<p>This review reads five of your closed records and returns a written finding.</p>').violations.length > 0);
  t('allows: a negated statement', probe('<p>Public review routes do not accept record submissions and do not perform inference.</p>').violations.length === 0
    && probe('<p>No record text is sent to Anthropic or any other model provider.</p>').violations.length === 0);
  t('allows: a historical research statement', probe('<p>In the 2026 research studies, constructed records were sent to Anthropic, OpenAI and Google models.</p>').violations.length === 0);
  if (process.argv.includes('--list')) for (const a of allowed) console.log(`ALLOWED  ${a.page} [${a.category}]: ${a.sentence}`);
  console.log(`\n${pages.length} public pages scanned, ${violations.length} violations, ${allowed.length} negated or historical matches allowed`);
  console.log(`${CLAIMS.length} claim patterns; checks ${failed ? failed + ' failed' : 'all passed'}`);
  process.exitCode = failed ? 1 : 0;
}
