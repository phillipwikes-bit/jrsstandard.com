// 156-record study, Phase 3: feature-to-test coverage matrix, built from source.
//
// Every implemented feature is enumerated from the code itself (exported constants, or literal codes
// parsed from the module source), never from documentation. Each feature is then looked up in test
// source files. A mention in a test file is recorded as a TEST REFERENCE, which is evidence that a test
// names the feature; it is not proof that the feature is exercised correctly. Capabilities the study
// needs that the code does not contain are listed as NOT IMPLEMENTED.
// Usage: node tools/build-feature-matrix.mjs <label> [extra-test-root...]   (label: pre | post)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(PKG, '..', '..');
const label = process.argv[2];
if (!/^(pre|post)$/.test(label || '')) { console.error('usage: build-feature-matrix.mjs pre|post'); process.exit(2); }
const OUT = join(PKG, 'registers', 'FEATURE_COVERAGE_MATRIX_' + label.toUpperCase() + '.json');
if (existsSync(OUT)) { console.error(OUT + ' exists'); process.exit(2); }
const G = 'lib/engine-evidence-graph-v0.3.1-candidate/';
const C = 'lib/engine-evidence-contract/';
const H = 'research/validation-readiness-gate-v0-2026-10-25/tools/harness/';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const lits = (p, re) => [...new Set([...read(p).matchAll(re)].map((m) => m[1]))];

const contract = await import(join(ROOT, G, 'contract.mjs'));
const controls = await import(join(ROOT, G, 'controls.mjs'));
const scope = await import(join(ROOT, G, 'scope.mjs'));
const packs = await import(join(ROOT, G, 'rule-packs.mjs'));
const p9 = await import(join(ROOT, 'lib/engine-human-review-phase9/controls.mjs'));
const remediation = await import(join(ROOT, C, 'remediation.mjs'));
const adapter = await import(join(ROOT, H, 'adapter.mjs'));
const boundary = await import(join(ROOT, H, 'live-boundary.mjs'));

// ------------------------------------------------------------------ feature enumeration from source
const F = [];
const add = (area, id, source, kind = 'implemented', note = null) => F.push({ area, id, source, kind, note });
for (const c of contract.CONDITION_IDS) add('condition', c, G + 'contract.mjs CONDITION_IDS');
for (const s of contract.STATUSES) add('status', s, G + 'contract.mjs STATUSES');
for (const g of lits(G + 'conditions.mjs', /visible_gaps\.push\('([a-z_]+)'\)/g)) add('condition_failure_mode:visible_gap', g, G + 'conditions.mjs');
for (const r of lits(G + 'conditions.mjs', /review_reasons\.push\('([a-z_]+)'\)/g)) add('condition_failure_mode:review_reason', r, G + 'conditions.mjs');
for (const r of lits(G + 'compiler.mjs', /reasons\.push\('([a-z_:]+)'/g)) add('status_transition_reason', r.replace(/:$/, ''), G + 'compiler.mjs');
for (const k of Object.keys(controls.DEFECT_TEMPLATES)) add('cognitive_control_template:graph', k, G + 'controls.mjs DEFECT_TEMPLATES');
for (const k of Object.keys(remediation.CORRECTIVE_QUESTIONS)) add('cognitive_control_template:v0.2_remediation', k, C + 'remediation.mjs CORRECTIVE_QUESTIONS');
for (const k of p9.CONTROL_IDS) add('human_review_safeguard', k, 'lib/engine-human-review-phase9/controls.mjs CONTROL_IDS');
for (const k of lits(G + 'scope.mjs', /add\('([a-z_]+)'/g)) add('intake_trigger', k, G + 'scope.mjs runIntake');
for (const k of ['non_synthetic_record_not_authorized', 'invalid_scope_declaration']) if (!F.some((f) => f.id === k)) add('intake_trigger', k, G + 'scope.mjs runIntake');
for (const [d] of scope.REGULATED) if (!F.some((f) => f.area === 'excluded_domain_lexicon' && f.id === d)) add('excluded_domain_lexicon', d, G + 'scope.mjs REGULATED');
add('excluded_domain_lexicon', 'reworded_employment (RP-SCO-01)', G + 'scope.mjs REWORDED_EMPLOYMENT');
for (const o of scope.PROHIBITED_OUTPUTS) add('prohibited_output', o, G + 'scope.mjs PROHIBITED_OUTPUTS');
for (const [id] of scope.INSTRUCTION_PATTERNS) add('instruction_quarantine_pattern', id, G + 'scope.mjs INSTRUCTION_PATTERNS');
for (const k of lits(G + 'compiler.mjs', /refusal\('([a-z_]+)'/g)) add('compiler_refusal', k, G + 'compiler.mjs');
for (const k of lits(C + 'strict-json.mjs', /reason: '([a-z_]+)'/g).concat(lits(C + 'strict-json.mjs', /'(duplicate_json_key|malformed_json)'/g))) add('strict_json', k, C + 'strict-json.mjs');
for (const k of lits(G + 'response.mjs', /fail\('([a-z_]+)'\)/g)) add('candidate_contract', k, G + 'response.mjs validateCandidate');
for (const s of contract.QUOTE_STATUSES) add('quotation_status', s, G + 'contract.mjs QUOTE_STATUSES');
for (const k of lits(G + 'quote-resolution.mjs', /res\('[a-z_]+', '([a-z_]+)'/g)) add('quotation_reason', k === 'disambiguated_by_' ? 'disambiguated_by_<key>' : k, G + 'quote-resolution.mjs');
for (const k of lits(G + 'quote-resolution.mjs', /'disambiguated_by_' \+ k|DISAMBIGUATOR_KEYS = \[([^\]]+)\]/g)) if (k) for (const d of k.split(',').map((x) => x.trim().replace(/'/g, ''))) add('quotation_disambiguator', d, G + 'quote-resolution.mjs DISAMBIGUATOR_KEYS');
add('offsets', 'utf16_and_utf8_offsets_computed_locally', G + 'quote-resolution.mjs loc / record.mjs utf8Offset');
for (const t of contract.ASSERTION_TYPES) add('assertion_type_marker', t, G + 'assertions.mjs ASSERTION_MARKERS');
for (const k of lits(G + 'assertions.mjs', /\['([a-z_]+)', \/\\b/g)) add('prohibited_inference_screen', k, G + 'assertions.mjs EXTRA_INFERENCE');
add('prohibited_inference_screen', 'cause_not_stated_in_quote', G + 'assertions.mjs CAUSAL');
add('linkage', 'RP-EVL-01 linked section roles', G + 'compiler.mjs LINKED_SECTION_ROLES');
add('negation', 'RP-NEG-01 negated rationale', G + 'conditions.mjs NEGATED_RATIONALE');
for (const k of lits(G + 'contradictions.mjs', /add\('([a-z_]+)'/g)) add('conflict_or_chronology_detector', k, G + 'contradictions.mjs detectRecordConflicts');
add('conflict_or_chronology_detector', 'cited_evidence_conflict (K6)', G + 'contradictions.mjs detectEvidenceConflicts');
add('conflict_or_chronology_detector', 'timeline TEMPORALLY_PRECEDES / TEMPORALLY_CONFLICTS edges', G + 'compiler.mjs');
add('conflict_or_chronology_detector', 'certainty_language spans', G + 'controls.mjs certaintySpans');
for (const r of packs.IMPLEMENTED_RULES) add('rule_pack_rule', r, G + 'rule-packs.mjs IMPLEMENTED_RULES');
for (const k of lits(G + 'rule-packs.mjs', /p\.push\(at \+ '[^']*?: ([a-z_ ]+)/g)) add('rule_pack_seal_check', k.trim(), G + 'rule-packs.mjs validateRulePacks');
add('rule_pack_seal_check', 'signature does not match content', G + 'rule-packs.mjs contentSeal');
for (const k of [...new Set(lits(G + 'graph-validate.mjs', /add\('(GV-\d\d)'/g))].sort()) add('graph_validation', k, G + 'graph-validate.mjs');
for (const [step] of [['V1'], ['V2'], ['V3'], ['V4'], ['V5'], ['V6'], ['V7'], ['V8'], ['V9']]) add('adapter_response_check', step, H + 'adapter.mjs validate');
for (const k of lits(H + 'adapter.mjs', /reject: '([a-z_]+)'/g)) add('adapter_pre_request', k, H + 'adapter.mjs preRequest');
for (const k of Object.keys(adapter.PROVENANCE)) add('provenance_label', k + ' -> ' + adapter.PROVENANCE[k].response_origin, H + 'adapter.mjs PROVENANCE');
for (const k of adapter.BINDING_FIELDS) add('capture_binding_field', k, H + 'adapter.mjs BINDING_FIELDS');
for (const k of lits(H + 'adapter.mjs', /code: '([a-z0-9_]+)'/g).filter((k) => !/^(transport_timeout|provider_error|response_truncated|unexpected_content_type|response_too_large|model_refusal|quote_null_requires_not_assessed)$/.test(k))) add('capture_pairing', k, H + 'adapter.mjs pairCheck');
for (const k of lits(H + 'live-boundary.mjs', /refusals\.push\('([a-z0-9_]+)/g)) add('live_boundary_refusal', k, H + 'live-boundary.mjs checkLiveAuthorization');
add('live_boundary_refusal', 'live_dispatch_not_enabled_in_this_build', H + 'live-boundary.mjs LIVE_DISPATCH_ENABLED=' + boundary.LIVE_DISPATCH_ENABLED);
add('live_boundary_refusal', 'credential_value_in_output / credential_shaped_value_in_output', H + 'live-boundary.mjs createSafeWriter');
add('transport', 'request cap MAX_REQUESTS=' + adapter.MAX_REQUESTS, H + 'adapter.mjs');
add('transport', 'timeout -> V1 transport_timeout', H + 'adapter.mjs / transport.mjs');
add('transport', 'write-once raw capture (flag wx)', H + 'adapter.mjs capture');
add('transport', 'forbidden provider environment names refused', H + 'adapter.mjs FORBIDDEN_ENV_NAMES');
add('transport', 'network guard traps fetch/net/tls/http/https/dns', H + 'net-guard.mjs');
add('size', 'explicit refusal above ' + contract.LOCAL_SIZE_LIMIT_CHARS + ' characters (record_exceeds_local_size_limit)', G + 'scope.mjs');

// Required by the study, absent from 0.3.1, 0.3.2 and adapter 0.2.0 (checked by source search below).
const ABSENT = [
  ['circular_reasoning', 'conclusion restated as its own basis', /circular|restat/i, [G + 'conditions.mjs', G + 'compiler.mjs']],
  ['authority_only_basis', 'authority reference without linked facts is not a basis', /authority_reference_without|linked_facts/i, [G + 'conditions.mjs']],
  ['prose_dates', 'dates written as words ("4 March", "March 4")', /January|February|March/, [G + 'record.mjs']],
  ['multiple_decisions', 'several decision units in one record', /decision_unit|multiple decisions/i, [G + 'compiler.mjs', G + 'conditions.mjs']],
  ['separate_requests', 'opposite outcomes for separate requests not treated as a contradiction', /separate request|separate_request/i, [G + 'contradictions.mjs']],
  ['prose_records', 'records without "Label:" section headings', /prose/i, [G + 'record.mjs', G + 'conditions.mjs']],
  ['segmentation', 'segmenting an over-length record with coverage reporting', /segment/i, [G + 'scope.mjs', G + 'compiler.mjs']],
  ['transport_retries', 'bounded retries with backoff', /retry|backoff/i, [H + 'adapter.mjs', H + 'transport.mjs', H + 'live-boundary.mjs']],
  ['transport_cancellation', 'cancellation of an in-flight request', /abort|cancel/i, [H + 'adapter.mjs', H + 'transport.mjs']],
  ['cost_accounting', 'token and cost accounting against a budget', /cost|budget_spent|usd/i, [H + 'adapter.mjs']],
  ['recovery_resume', 'resume after interruption from a journal', /journal|resume/i, [H + 'adapter.mjs']],
  ['destination_allow_list', 'one-host destination restriction for a live sender', /allow.?list|api\.anthropic\.com/i, [H + 'adapter.mjs', H + 'live-boundary.mjs']],
  ['live_sender', 'provider wire mapping and dispatch', /messages|anthropic-version/i, [H + 'adapter.mjs', H + 'transport.mjs']],
];
for (const [id, what, re, files] of ABSENT) {
  const found = files.filter((f) => re.test(read(f)));
  add('required_capability', id, files.join(', '), found.length ? 'REVIEW: pattern found in ' + found.join(', ') : 'not_implemented', what);
}

// ------------------------------------------------------------------ test references
const extra = process.argv.slice(3);
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (/(^|\/)(out|candidate|node_modules|history|cases|truth|expectations|records)$/.test(p) ? [] : walk(p)) : [p]; });
const testRoots = ['tests', ...readdirSync(join(ROOT, 'research')).filter((d) => /^(engine-|evidence-graph|validation-readiness|stage-a|live-pilot|adaptive-)/.test(d)).map((d) => 'research/' + d), ...extra];
const testFiles = testRoots.flatMap((r) => existsSync(join(ROOT, r)) ? walk(join(ROOT, r)) : []).filter((p) => p.endsWith('.mjs') && /(test|probe|run|evaluate|mutation|suite|check)/i.test(relative(ROOT, p)));
const testText = testFiles.map((p) => [relative(ROOT, p), readFileSync(p, 'utf8')]);
// Sealed expectation and fixture files are tests too: a sealed expected trigger, status, reason or code.
const walkAll = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (/(^|\/)(out|candidate|node_modules|history)$/.test(p) ? [] : walkAll(p)) : [p]; });
const expFiles = testRoots.flatMap((r) => existsSync(join(ROOT, r)) ? walkAll(join(ROOT, r)) : []).filter((p) => p.endsWith('.json') && /(expect|truth|scenario|fixture|regression|corpus|cases|probe)/i.test(relative(ROOT, p)));
const expText = expFiles.map((p) => [relative(ROOT, p), readFileSync(p, 'utf8')]);
const needle = (f) => f.id.split(' ')[0].replace(/[()]/g, '').replace('<key>', '');
for (const f of F) {
  const n = needle(f);
  const hits = n.length >= 3 ? testText.filter(([, t]) => t.includes(n)).map(([p]) => p) : [];
  const ex = n.length >= 3 ? expText.filter(([, t]) => t.includes(n)).map(([p]) => p) : [];
  f.test_reference_files = hits.length;
  f.test_reference_examples = hits.slice(0, 3);
  f.expectation_reference_files = ex.length;
  f.expectation_reference_examples = ex.slice(0, 2);
  f.coverage = f.kind === 'not_implemented' ? 'NOT IMPLEMENTED' : hits.length && ex.length ? 'TEST CODE AND SEALED EXPECTATION REFERENCES' : hits.length ? 'TEST CODE REFERENCE ONLY' : ex.length ? 'SEALED EXPECTATION REFERENCE ONLY' : 'NO TEST REFERENCE FOUND';
}
const byArea = {};
for (const f of F) { const a = (byArea[f.area] ||= { features: 0, with_any_reference: 0, without_reference: 0, not_implemented: 0 }); a.features++; if (f.coverage === 'NOT IMPLEMENTED') a.not_implemented++; else if (f.coverage !== 'NO TEST REFERENCE FOUND') a.with_any_reference++; else a.without_reference++; }
const out = { matrix_format: 'jrs-study-156-feature-matrix/1.0.0', label, built_at_utc: new Date().toISOString(),
  method: 'Features enumerated from source constants and literal codes; references found by searching ' + testFiles.length + ' test, probe and runner files and ' + expFiles.length + ' sealed expectation, truth, scenario and fixture files for each identifier. A reference is not proof of correct behaviour.',
  engine_source: G, adapter_source: H, test_files_searched: testFiles.length, expectation_files_searched: expFiles.length, totals: { features: F.length, by_area: byArea }, features: F };
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ features: F.length, files: testFiles.length, exp_files: expFiles.length, not_implemented: F.filter((f) => f.coverage === 'NOT IMPLEMENTED').map((f) => f.id), no_ref: F.filter((f) => f.coverage === 'NO TEST REFERENCE FOUND').map((f) => f.area + ':' + f.id), review: F.filter((f) => /^REVIEW/.test(f.kind)).map((f) => f.id + ' ' + f.kind) }, null, 0));
