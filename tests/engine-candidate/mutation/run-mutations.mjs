// Mutation run: each important safeguard is removed, one at a time, from a throwaway copy
// of the candidate, and the suite must then FAIL. A mutation the suite does not catch is
// reported as SURVIVED and fails this run. The working tree is never modified.
//   node tests/engine-candidate/mutation/run-mutations.mjs
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, execSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
const L = 'lib/engine-candidate/';

// [id, what the safeguard is, file, exact text, replacement]
export const MUTATIONS = [
  ['M01', 'adapter: quotation must be in the record', L + 'adapter.js', "recordText.indexOf(f.quotation) === -1) fail('quotation_not_in_record'", "false) fail('quotation_not_in_record'"],
  ['M02', 'adapter: unknown fields rejected (free-form verdicts)', L + 'adapter.js', "if (TOP.indexOf(k) === -1) fail('unknown_field', k);", ''],
  ['M03', 'adapter: numbers rejected (scores)', L + 'adapter.js', "if (hasNumber(o)) fail('numeric_value'", "if (false) fail('numeric_value'"],
  ['M04', 'adapter: determination language rejected', L + 'adapter.js', "else if (DETERMINATION.test(e.note)) fail('determination_language', 'conditions.' + k + '.note');", ''],
  ['M05', 'adapter: self-reported incomplete output rejected', L + 'adapter.js', "if (o.completion === 'incomplete') fail('adapter_reported_incomplete');", "if (o.completion === 'incomplete') {}"],
  ['M06', 'adapter: explanation id must match', L + 'adapter.js', "if (e.explanation_id !== explanationIdFor('condition', k)) fail('invalid_explanation_id', k);", ''],
  ['M07', 'candidate: rejected output is never used', L + 'review-candidate.js', 'if (!v.ok) {', 'if (!v.ok && false) {'],
  ['M08', 'candidate: person-inference screen', L + 'review-candidate.js', 'if (!g.length) return text;', 'return text;'],
  ['M09', 'candidate: excluded-domain refusal', L + 'review-candidate.js', 'for (var i = 0; i < EXCLUDED_DOMAINS.length; i++) {', 'for (var i = 0; i < 0; i++) {'],
  ['M10', 'candidate: over-length refused, not truncated', L + 'review-candidate.js', "if (n > MAX_CHARS) return ['record_too_long'", "if (false) return ['record_too_long'"],
  ['M11', 'candidate: source-preparation findings carried into the result', L + 'review-candidate.js', 'var prepFindings = extractionFromPrep(gate.prep);', 'var prepFindings = [];'],
  ['M12', 'candidate: review identity built from the real versions', L + 'review-candidate.js', "model: ids.model_id + '@' + ids.model_version, derived_from: DERIVED_FROM }, srcSha);", "model: ids.model_id, derived_from: DERIVED_FROM }, srcSha);"],
  ['M13', 'candidate: record reference preserved', L + 'review-candidate.js', "record_ref: input && typeof input.record_ref === 'string' ? input.record_ref : null", "record_ref: null"],
  ['M14', 'candidate: adapter receives the exact text', L + 'review-candidate.js', "'\\n' + text + '\\nRECORD '", "'\\n' + text.replace(/\\s+/g, ' ') + '\\nRECORD '"],
  ['M15', 'candidate: input never written to', L + 'review-candidate.js', 'var gate = checkScope(input);', 'input.examined = true; var gate = checkScope(input);'],
  ['M16', 'candidate: no network', L + 'review-candidate.js', 'export const PROMPT_SHA256', "export const probe = () => fetch('https://example.invalid');\nexport const PROMPT_SHA256"],
  ['M17', 'candidate: nothing logged', L + 'review-candidate.js', 'var gate = checkScope(input);', 'console.log(input && input.text); var gate = checkScope(input);'],
  ['M18', 'candidate: no disk access', L + 'review-candidate.js', "import { prepareSource,", "import { writeFileSync } from 'node:fs';\nimport { prepareSource,"],
  ['M19', 'candidate: failed adapter call does not echo the error', L + 'review-candidate.js', "catch (e) { return incomplete('model_call_failed', 'No result was produced.'); }", "catch (e) { return incomplete('model_call_failed', String(e && e.message)); }"],
  ['M20', 'source prep: partial input refused', L + 'source-prep.js', "report.refusal = { reason: 'partial_input'", "report.ignored = { reason: 'partial_input'"],
  ['M21', 'source prep: unreadable input refused', L + 'source-prep.js', 'if (bad.length) {', 'if (false) {'],
  ['M22', 'source prep: instruction-like text reported', L + 'source-prep.js', ".concat(scan(text, INSTRUCTION_MARKERS, 'embedded_instruction'));", ';'],
  ['M23', 'contract: disposition never changes its input', L + 'contract.js', '  var next = clone(result);\n  var entry', '  var next = result;\n  var entry'],
  ['M24', 'contract: disposition bound to one review version', L + 'contract.js', 'if (reviewId !== result.review_identity.review_id) {', 'if (false) {'],
  ['M25', 'contract: sign-off refused while findings are pending', L + 'contract.js', "if (pending.length) throw new Error('dispositions_pending: '", "if (false) throw new Error('dispositions_pending: '"],
  ['M26', 'contract: no score or verdict field', L + 'contract.js', '    validated: false,', "    validated: false, overall_verdict: 'ready',"],
  ['M27', 'harness: contradiction detection', L + 'harness.js', "if (seen.indexOf('pass') !== -1 && seen.indexOf('gap') !== -1) fail('contradictory_classification', null, k);", ''],
  ['M28', 'harness: internal-contradiction detection', L + 'harness.js', "fail('internal_contradiction', vid, k);", ''],
  ['M29', 'harness: repeat-run determinism check', L + 'harness.js', "if (JSON.stringify(r1) !== JSON.stringify(r2)) fail('nondeterministic_output', vid);", ''],
  ['M30', 'harness: omitted preparation findings detected', L + 'harness.js', "if (have.indexOf(key) === -1) fail('prep_failure_omitted', vid, f.code);", ''],
  ['M31', 'harness: identity mutation detected', L + 'harness.js', "if (JSON.stringify(r1.review_identity) !== JSON.stringify(exp)) fail('identity_mutated', vid);", ''],
  ['M33', 'harness: record-reference change detected', L + 'harness.js', "fail('identifier_mutated', vid);", ''],
  ['M34', 'harness: input mutation detected', L + 'harness.js', "if (JSON.stringify(input) !== before) fail('input_mutated');", ''],
  ['M35', 'harness: text mutation detected (source hash)', L + 'harness.js', "if (!r1.source || r1.source.sha256 !== sha256(input.text)) fail('record_text_mutated', vid, 'source hash differs from the input');", ''],
  ['M36', 'harness: refused record must not reach the adapter', L + 'harness.js', "if (w.requests.length) fail('refused_but_adapter_called', vid);", ''],
  ['M37', 'contamination: shared boilerplate ignored in the development index', L + 'contamination.js', 'return df.get(s) < BOILERPLATE_DOCS;', 'return true;'],
  ['M63', 'contamination: a long verbatim run inside new text is flagged', L + 'contamination.js', 'shared >= LONG_RUN || ', ''],
  ['M62', 'contamination: boilerplate in the screened text does not dilute detection', L + 'contamination.js', "(index.df.get(s) || 0) < BOILERPLATE_DOCS", 'true'],
  ['M38', 'contamination: edited copies flagged', L + 'contamination.js', 'if (shared >= LONG_RUN || (shared >= MIN_SHARED && Math.max(ofText, ofSource) >= SHARE_THRESHOLD)) {', 'if (false) {'],
  ['M39', 'contamination: a possible match is never called certain', L + 'contamination.js', "certainty: 'uncertain: needs human review'", "certainty: 'match'"],
  ['M40', 'contamination: embedded copies detected', L + 'contamination.js', 'Math.max(ofText, ofSource) >= SHARE_THRESHOLD', 'ofText >= SHARE_THRESHOLD'],
  ['M41', 'contamination: exact copies detected', L + 'contamination.js', "if (exact) return { version: CONTAMINATION_VERSION, status: 'exact_match'", "if (false) return { version: CONTAMINATION_VERSION, status: 'exact_match'"],
  ['M42', 'separation: confirmation corpus does not copy earlier sets', 'tests/engine-candidate/confirmation/v0.1.0/cases.json', (src, base) => {
    const conf = JSON.parse(src), reg = JSON.parse(readFileSync(join(base, 'tests/engine-candidate/regression/cases.json'), 'utf8'));
    conf.cases[41].text = reg.cases[0].text; return JSON.stringify(conf, null, 1) + '\n'; }],
  ['M43', 'packet: quotation anchors checked against the source', L + 'reviewer-packet.js', "if (typeof text !== 'string' || text.slice(loc.start, loc.end) !== quoted) throw", 'if (false) throw'],
  ['M44', 'packet: no sign-off while items are pending', L + 'reviewer-packet.js', "if (r.human_review.sign_off.status === 'signed' && pending.length) throw", 'if (false) throw'],
  ['M45', 'packet: identity follows the review version', L + 'reviewer-packet.js', 'review_id: r.review_identity.review_id, result_digest: r.result_digest,\n    history', 'history'],
  ['M46', 'packet: no model finding hidden', L + 'reviewer-packet.js', 'r.contextual_findings.findings.forEach(function (f) {', 'r.contextual_findings.findings.slice(1).forEach(function (f) {'],
  ['M47', 'packet: refuses a result failing integrity', L + 'reviewer-packet.js', "if (!v.ok) throw new Error('result_integrity_failed: '", "if (false) throw new Error('result_integrity_failed: '"],
  ['M48', 'packet: refuses a source text that was not examined', L + 'reviewer-packet.js', "sha256(sourceText) !== result.source.sha256) throw", 'false) throw'],
  ['M49', 'contract: integrity checked before disposition and sign-off', L + 'contract.js', "  if (!v.ok) throw new Error('result_integrity_failed: ' + v.problems.join('; '));\n}", '}'],
  ['M50', 'contract: digest checked', L + 'contract.js', "if (result.result_digest !== digestOf(result)) problems.push", 'if (false) problems.push'],
  ['M51', 'contract: dispositions carried from another version detected', L + 'contract.js', "if (h.review_id !== rid) problems.push('disposition history entry ' + i + ' belongs to another review version');", ''],
  ['M52', 'source prep: descriptive "clearly" not reported', L + 'source-prep.js', 'if (!sentenceOpening && m[2] && PRESENTATION.test(m[2])) continue;', ''],
  ['M53', 'source prep: inline attachment not reported as absent', L + 'source-prep.js', 'if (INLINE_COPY.test(sentence) && !NEGATED_COPY.test(sentence)) continue;', ''],
  ['M54', 'source prep: negated inline copy still reported', L + 'source-prep.js', 'INLINE_COPY.test(sentence) && !NEGATED_COPY.test(sentence)', 'INLINE_COPY.test(sentence)'],
  ['M55', 'source prep: final line ending on a function word is cut off', L + 'source-prep.js', 'if (TRAILING_FUNCTION_WORD.test(last)) return true;', ''],
  ['M56', 'source prep: ordinal and written-out dates', L + 'source-prep.js', "' + ORD + '?|' + WORD_DAYS + ')'", "' + ')'"],
  ['M57', 'source prep: varied request language', L + 'source-prep.js', 'ask(?:ed|s|ing)? for|appl(?:ied|ies|y|ying) for|sought|seek(?:s|ing)?|', ''],
  ['M58', 'source prep: conversation-based off-record references', L + 'source-prep.js', '(?:per|following|after|based on|according to|during|discussed (?:at|in|on|during)|agreed (?:at|in|on|during))', '(?:zzzz)'],
  ['M59', 'source prep: recorded conversation not reported', L + 'source-prep.js', "return f.code !== 'off_record_reference' || !REPRODUCED_HERE.test(", 'return true || !REPRODUCED_HERE.test('],
  ['M60', 'source prep: anchors use the exact record text', L + 'source-prep.js', "matched: text.slice(m.index, m.index + 7)", "matched: 'clearly'"],
  ['M61', 'dev index: confirmation corpus loaded as development material', 'tests/engine-candidate/shared/dev-index.mjs', "for (const c of JSON.parse(readFileSync(join(BASE, 'confirmation/v0.1.0/cases.json'), 'utf8')).cases) out.push", 'for (const c of []) out.push'],
  ['M32', 'dev material: every development text listed', L + 'dev-material.js', "', 'corpus/v0.1.0/CR-015'],", "', 'corpus/v0.1.0/CR-015-x'],\n  ['0000', 'x'],"],
  ['M64', 'vocabulary: the prompt does not call the keys JRS conditions', L + 'review-candidate.js', 'for record-level documentation flaws. Use the five candidate review keys below.', 'for record-level documentation flaws, against five JRS documentation review conditions. Use the five candidate review keys below.'],
  ['M65', 'vocabulary: accountability_support stays unmapped', L + 'explanations.js', 'accountability_support: null,', "accountability_support: 'insufficient_evidence',"],
  ['M66', 'vocabulary: cold_reviewer_clarity stays unmapped', L + 'explanations.js', "Object.freeze(['cold_reviewer_clarity', 'accountability_support'])", "Object.freeze(['accountability_support'])"],
  ['M67', 'vocabulary: no correspondence record asserted', L + 'explanations.js', 'export const CODEBOOK_CORRESPONDENCE_RECORD = null;', "export const CODEBOOK_CORRESPONDENCE_RECORD = { reasoning_traceability: 'Reconstructability' };"],
];

function sh(cmd, cwd) { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

const base = mkdtempSync(join(tmpdir(), 'jrs-mutation-'));
try {
  // tools/frozen-demo/corpus holds development material (the frozen demonstration records) that the loader reads.
  for (const p of ['lib/engine-candidate', 'tests/engine-candidate', 'api', 'schemas', '.vercelignore', 'tools/frozen-demo/corpus']) cpSync(join(ROOT, p), join(base, p), { recursive: true });
  sh('git init -q && git -c user.name=mutation -c user.email=mutation@invalid add -A && git -c user.name=mutation -c user.email=mutation@invalid commit -qm base', base);
  const runSuite = () => {
    try { execFileSync(process.execPath, [join(base, 'tests/engine-candidate/run-all.mjs'), '--quick'], { cwd: base, encoding: 'utf8', env: { ...process.env, JRS_MUTATION_CHILD: '1' }, stdio: ['ignore', 'pipe', 'pipe'] }); return { failed: false, suites: [] }; }
    catch (e) { return { failed: true, suites: String(e.stdout || '').split('\n').filter((l) => / FAILED$|: FAILED/.test(l)).map((l) => l.split(':')[0]) }; }
  };
  const baseline = runSuite();
  console.log(`${baseline.failed ? 'FAIL' : 'PASS'}  baseline: the unmutated copy passes${baseline.failed ? ' (it did not: ' + baseline.suites.join(', ') + ')' : ''}`);
  let survived = baseline.failed ? 1 : 0;
  for (const [id, what, file, find, repl] of MUTATIONS) {
    sh('git checkout -q -- . && git clean -fdq', base);
    const path = join(base, file), src = readFileSync(path, 'utf8');
    if (typeof find === 'function') { const out = find(src, base); if (out === src) { survived++; console.log(`FAIL  ${id} ${what}: the mutation changed nothing`); continue; } writeFileSync(path, out); }
    else {
      const count = src.split(find).length - 1;
      if (count !== 1) { survived++; console.log(`FAIL  ${id} ${what}: the mutation text occurs ${count} times, so it was not applied`); continue; }
      writeFileSync(path, src.replace(find, repl));
    }
    const r = runSuite();
    if (!r.failed) survived++;
    console.log(`${r.failed ? 'PASS' : 'FAIL'}  ${id} ${what}: ${r.failed ? 'caught by ' + r.suites.join(', ') : 'SURVIVED, no suite failed'}`);
  }
  console.log(`\n${MUTATIONS.length} mutations, ${MUTATIONS.length - survived + (baseline.failed ? 1 : 0)} caught, ${survived - (baseline.failed ? 1 : 0)} survived${baseline.failed ? '; BASELINE FAILED' : ''}`);
  process.exit(survived ? 1 : 0);
} finally {
  rmSync(base, { recursive: true, force: true });
}
