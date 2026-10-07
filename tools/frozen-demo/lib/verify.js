// JRS frozen synthetic demonstration: manifest and replay verifier. LOCAL ONLY. FAILS CLOSED.
//
// verifyDemoPackage() checks the frozen package against its manifest and replays it. Any
// deviation is a problem, and any problem fails the whole package. Nothing is repaired.
//   A  manifest structure, the one permitted status, local-only and prohibition statements
//   B  frozen corpus: file hashes, source hashes, versions, synthetic labels, holdout status
//   C  scope: every record is a completed, non-HR supplier-access exception draft
//   D  fictional entities: closed-world check of every capitalised word, plus real-marker screen
//   E  version binding: candidate, prompt, adapter, contract and module hashes
//   F  exact replay: observed behaviour equals the frozen expectations and the frozen digests
//   G  no score, no verdict, no legal or compliance determination, no Codebook mapping
//   H  synthetic labelling of every packet and of the viewer data
//   I  generated outputs equal a fresh rendering
//   J  evidence record honesty and release-gate status (no gate advanced)
//   K  required limitations; viewer isolation from every public page and route
// A pass shows only that the fixed local package replays exactly. It shows nothing about
// semantic correctness, any real model, any real record or any release gate.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from '../../../lib/engine-candidate/source-prep.js';
import { EXCLUDED_DOMAINS } from '../../../lib/engine-candidate/review-candidate.js';
import { DETERMINATION } from '../../../lib/engine-candidate/adapter.js';
import { CODEBOOK_CORRESPONDENCE_RECORD } from '../../../lib/engine-candidate/explanations.js';
import { isDevelopmentMaterial } from '../../../lib/engine-candidate/dev-material.js';
import { replayAll, versions, APPROVED_ADAPTER, PACKAGE_DIR } from './replay.js';
import { renderOutputs } from './render.js';

export const VERIFIER_VERSION = 'jrs-frozen-demo-verifier/0.1.0';
export const STATUS = 'DEMO_PREPARATION_COMPLETE_NOT_RELEASED';
// Status words the package may never carry. Built from parts so this file does not itself
// carry them as whole words; the honesty scan reads every package file, this one included.
export const PROHIBITED_STATUSES = Object.freeze(['DEMO', 'PRODUCTION', 'ENTERPRISE', 'LICENSE', 'SALE', 'PILOT'].map((p) => p + '_READY').concat(['VALI' + 'DATED', 'APPR' + 'OVED']));
export const ROOT = join(PACKAGE_DIR, '../../');
export const MANIFEST = 'tools/frozen-demo/demo-manifest.json';
export const EVIDENCE = 'tools/frozen-demo/demo-evidence-record.json';
export const RELEASE_GATE_RECORD = 'lib/release-gate/records/RG-RECORD_engine-0.5.0-local.1.json';
export const MATRIX = 'docs/architecture/FROZEN_DEMONSTRATION_CAPABILITY_MATRIX.md';
export const MATRIX_HEADER = '| Demonstrated capability | Synthetic case | What the replay shows | What it does not show | Status |';
export const MATRIX_ROWS = Object.freeze(['Scope refusal', 'Partial-input refusal', 'Deterministic source preparation', 'Exact quotation anchors', 'Candidate-internal review prompts',
  'Separate deterministic and candidate findings', 'Reviewer packet generation', 'Human disposition workflow in the local reviewer workspace', 'Version binding', 'Local export verification', 'Release-gate status']);
export const MATRIX_LIMITS = Object.freeze(['no semantic correctness', 'no real-provider behavior', 'no real-record performance', 'no independent labeling', 'no operational-control verification', 'no production or commercial readiness']);
// Directories that are never deployed, or are this package's own; everything else is scanned for a link to the viewer.
const NOT_PUBLIC = new Set(['.git', 'node_modules', 'tools', 'tests', 'lib', 'research', 'scripts', '.jrs', '.claude', 'supabase', 'templates', 'build', 'standard', 'schemas', 'cep-article-prep']);
export const PROFILE = Object.freeze({ record_type: 'supplier_access_exception', completion_status: 'completed', hr_related: false });
export const REQUIRED_LIMITATIONS = Object.freeze(['synthetic_only', 'mock_output_only', 'no_semantic_correctness', 'no_real_provider_behavior', 'no_real_record_performance',
  'no_independent_labeling', 'not_a_holdout', 'no_operational_control_verification', 'no_production_or_commercial_readiness', 'fixed_configuration_only', 'no_release_gate_advanced', 'fictional_names_not_exhaustively_checked']);
// Modules whose bytes the package is bound to. A change to any is a new package version.
export const BOUND_MODULES = Object.freeze(['adapter.js', 'contamination.js', 'contract.js', 'dev-material.js', 'explanations.js', 'harness.js', 'mock-adapter.js', 'review-candidate.js', 'reviewer-packet.js', 'source-prep.js']
  .map((f) => 'lib/engine-candidate/' + f).concat(['tools/local-reviewer-workspace/app/core.js', 'tools/local-reviewer-workspace/app/correspondence.js', 'tools/frozen-demo/lib/replay.js']));
// Imports the replay may make. Anything else, a provider adapter above all, fails.
export const ALLOWED_REPLAY_IMPORTS = Object.freeze(['node:fs', '../../../lib/engine-candidate/review-candidate.js', '../../../lib/engine-candidate/source-prep.js', '../../../lib/engine-candidate/explanations.js',
  '../../../lib/engine-candidate/contract.js', '../../../lib/engine-candidate/adapter.js', '../../../lib/engine-candidate/reviewer-packet.js', '../../../lib/engine-candidate/mock-adapter.js', '../../local-reviewer-workspace/app/core.js']);
// Network, provider, credential, clock and storage access, in any package code file.
const PROVIDER_OR_NETWORK = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|node:(?:https?|net|dgram|tls|dns|child_process)|api\.anthropic|api\.openai|@anthropic-ai|from ['"]openai['"]|_API_KEY|process\.env|localStorage|sessionStorage|indexedDB|document\.cookie|gtag|googletagmanager|\bG-[A-Z0-9]{6,}\b|Date\.now\(|new Date\(\)/;
// Organisations and people that are real, and markers of real contact details. The closed-world
// check below is the main control; this list makes the commonest substitutions fail by name.
export const REAL_MARKERS = Object.freeze([/\b(?:Microsoft|Google|Alphabet|Amazon|Apple|Meta|Facebook|IBM|Oracle|SAP|Salesforce|Anthropic|OpenAI|Vercel|Cloudflare|Supabase|GitHub|Siemens|Bosch|Deloitte|KPMG|PwC|Accenture|Boeing|Airbus|Tesla|Walmart|Unilever|Nestl[eé]|Shell|BP)\b/,
  /\bPhillip\s+Wikes\b|\bWikes\b/i, /jrsstandard/i, /[\w.+-]+@[\w-]+\.[\w.]+/, /https?:\/\/|www\./i, /\+?\d[\d ()-]{8,}\d/]);
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SCORE_KEY = /^(score|scores|rating|grade|drr_score|overall|overall_verdict|verdict|final_verdict|ready|approval_status|decision)$/i;
// A determination, not a description: 'the approval' names a step in the record, 'is approved' decides it.
const LEGAL_OR_VERDICT = /\b(?:is|are|was|were|be|been|not)\s+(?:non-)?compliant\b|\bcompl(?:y|ies) with\b|\b(?:lawful|unlawful|illegal|legally (?:required|valid|binding|sufficient))\b|\bliab(?:le|ility)\b|\bin breach\b|\bviolat(?:es|ed|ion)\b|\bcertif(?:ied|ies)\b|\bverdict\b|\boverall\b|\b(?:i|we)\s+approve\b|\b(?:record|exception|request|draft|access)\s+(?:is|are|should be|can be|may be)\s+(?:approved|granted|refused|ready)\b|\bready\b|\bpass(?:es|ed)?\b/i;
const CODEBOOK_ASSERTION = /\b(?:is|are|maps?\s+to|mapped\s+to|corresponds?\s+to|equivalent\s+to)\s+(?:a\s+|the\s+)?(?:JRS|Codebook)\s+(?:review\s+)?condition/i;

const read = (root, p) => readFileSync(join(root, p), 'utf8');
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function walkKeys(v, fn, path = '$') {
  if (Array.isArray(v)) v.forEach((x, i) => walkKeys(x, fn, path + '[' + i + ']'));
  else if (isObj(v)) for (const k of Object.keys(v)) { fn(k, v[k], path + '.' + k); walkKeys(v[k], fn, path + '.' + k); }
}
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (isObj(v)) Object.values(v).forEach((x) => strings(x, out));
  return out;
}
function codeFiles(root) {
  const dir = join(root, 'tools/frozen-demo');
  const walk = (d) => readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
  return walk(dir).filter((f) => /\.(js|mjs|html|css)$/.test(f)).map((f) => [f.slice(root.length), readFileSync(f, 'utf8')]);
}
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');

export async function verifyDemoPackage({ root = ROOT } = {}) {
  const problems = [];
  const fail = (section, msg) => problems.push(section + ': ' + msg);
  let manifest, evidence;
  try { manifest = JSON.parse(read(root, MANIFEST)); } catch (e) { return { ok: false, problems: ['A: manifest missing or not JSON'] }; }
  try { evidence = JSON.parse(read(root, EVIDENCE)); } catch (e) { fail('J', 'evidence record missing or not JSON'); evidence = {}; }

  // ---- A manifest structure ------------------------------------------------------------------------
  const KEYS = ['manifest_version', 'package_id', 'package_version', 'status', 'created', 'candidate_version', 'source_commit', 'corpus_commit', 'prompt_version', 'prompt_sha256',
    'adapter', 'versions', 'bound_modules', 'corpus', 'records', 'known_limitations', 'local_only', 'prohibitions', 'release_gate_effect', 'holdout', 'replay', 'notice'];
  for (const k of KEYS) if (!(k in manifest)) fail('A', 'missing ' + k);
  for (const k of Object.keys(manifest)) if (!KEYS.includes(k)) fail('A', 'unexpected field ' + k);
  if (manifest.status !== STATUS) fail('A', 'status must be ' + STATUS);
  if (manifest.local_only !== true) fail('A', 'local_only must be true');
  if (manifest.holdout !== false) fail('A', 'the package is not a holdout');
  if (manifest.release_gate_effect !== 'none') fail('A', 'release_gate_effect must be none');
  const P = manifest.prohibitions || {};
  for (const k of ['real_records', 'public_case_records', 'participant_or_pilot_material', 'sealed_holdout_material', 'provider_calls', 'network_access', 'public_route'])
    if (P[k] !== 'prohibited') fail('A', 'prohibitions.' + k + ' must be prohibited');
  if (!/^\d+\.\d+\.\d+$/.test(manifest.package_version || '')) fail('A', 'package_version malformed');
  if (!/^[0-9a-f]{40}$/.test(manifest.source_commit || '') || !/^[0-9a-f]{40}$/.test(manifest.corpus_commit || '')) fail('A', 'source_commit and corpus_commit must be full commit hashes');

  // ---- B corpus ------------------------------------------------------------------------------------
  const corpusDir = 'tools/frozen-demo/corpus/v0.1.0/';
  let index = null;
  try { index = JSON.parse(read(root, corpusDir + 'INDEX.json')); } catch (e) { fail('B', 'corpus INDEX missing'); }
  const records = {};
  const listed = (manifest.records || []).map((r) => r.record_id);
  if (index && !same(index.records.map((r) => r.record_id), listed)) fail('B', 'manifest records differ from the corpus index');
  if (!same(listed, ['FD-01', 'FD-02', 'FD-03', 'FD-04', 'FD-05'])) fail('B', 'the package holds exactly FD-01 to FD-05');
  if (index && sha256(read(root, corpusDir + 'INDEX.json')) !== (manifest.corpus || {}).index_sha256) fail('B', 'corpus INDEX changed since the manifest was frozen');
  for (const m of manifest.records || []) {
    const id = m.record_id, path = corpusDir + id + '.json';
    if (!existsSync(join(root, path))) { fail('B', id + ' file missing'); continue; }
    const raw = read(root, path), r = JSON.parse(raw);
    records[id] = r;
    if (sha256(raw) !== m.file_sha256) fail('B', id + ' record file changed (hash differs from the manifest)');
    if (sha256(r.text) !== r.source_sha256 || r.source_sha256 !== m.source_sha256) fail('B', id + ' source hash differs');
    const ie = index && index.records.find((x) => x.record_id === id);
    if (!ie || ie.source_sha256 !== m.source_sha256 || ie.record_version !== m.record_version) fail('B', id + ' index entry differs');
    if (r.record_id !== id || r.record_version !== m.record_version || r.created !== '2026-10-07') fail('B', id + ' identity, version or creation date differs');
    if (r.synthetic !== true || m.synthetic !== true) fail('H', id + ' is not marked synthetic');
    if (!/^SYNTHETIC DEMONSTRATION RECORD\. /.test(r.synthetic_label || '')) fail('H', id + ' synthetic label missing');
    if (!r.text.startsWith('SYNTHETIC DEMONSTRATION RECORD ' + id + '. Fictional organisations, people, dates and facts. Not a real record.')) fail('H', id + ' text does not open with its synthetic label');
    if (r.record_ref !== 'SYNTHETIC-' + id) fail('H', id + ' record_ref must be SYNTHETIC-' + id);
    if (r.classification !== 'frozen_synthetic_demonstration_record' || m.classification !== 'frozen_synthetic_demonstration_record') fail('B', id + ' must be classified as a frozen synthetic demonstration record');
    if (r.holdout !== false || m.holdout !== false) fail('B', id + ' is reclassified as a holdout');
    if (!isDevelopmentMaterial(r.text)) fail('B', id + ' is not registered as development material (it could enter a holdout)');
    if (!Array.isArray(r.limitations) || r.limitations.length < 5) fail('K', id + ' limitations missing');
    // ---- C scope
    if (!same(r.scope && r.scope.profile, PROFILE) || r.scope.domain !== 'supplier_access_exception' || r.scope.excluded_domains_present !== false) fail('C', id + ' is outside the supplier-access scope');
    const hit = EXCLUDED_DOMAINS.filter(([, re]) => re.test(r.text)).map(([d]) => d);
    if (hit.length) fail('C', id + ' text indicates an excluded domain: ' + hit.join(', '));
    // ---- D fictional entities
    const ents = r.fictional_entities || {};
    const entityWords = new Set([...(ents.organisations || []), ...(ents.people || [])].flatMap((n) => n.split(/\s+/)));
    const allowed = new Set([...(manifest.corpus.allowed_capitalised_words || []), ...MONTHS]);
    const unknown = [...new Set([...r.text.matchAll(/\b[A-Z][A-Za-z]*\b/g)].map((x) => x[0]))].filter((w) => !entityWords.has(w) && !allowed.has(w));
    if (unknown.length) fail('D', id + ' names something outside its declared fictional entities: ' + unknown.join(', '));
    for (const re of REAL_MARKERS) if (re.test(r.text) || strings(ents).some((s) => re.test(s))) fail('D', id + ' carries a real-person, real-organisation or contact marker (' + re.source.slice(0, 24) + ')');
    for (const o of ents.organisations || []) if (!r.text.includes(o)) fail('D', id + ' declares an entity not in the text: ' + o);
  }
  for (const w of (manifest.corpus || {}).allowed_capitalised_words || []) if (REAL_MARKERS.some((re) => re.test(w))) fail('D', 'allowed vocabulary carries a real marker: ' + w);

  // ---- E version binding ---------------------------------------------------------------------------
  const live = versions();
  if (!same(manifest.versions, live)) fail('E', 'candidate, prompt, contract or workspace versions differ from the manifest: ' + Object.keys(live).filter((k) => !manifest.versions || manifest.versions[k] !== live[k]).join(', '));
  if (manifest.candidate_version !== live.candidate_version) fail('E', 'candidate_version differs');
  if (manifest.prompt_version !== live.prompt_version || manifest.prompt_sha256 !== live.prompt_sha256) fail('E', 'prompt version or prompt hash differs');
  if (!same(manifest.adapter, APPROVED_ADAPTER)) fail('E', 'adapter identity differs from the approved mock adapter');
  if ((manifest.adapter || {}).kind !== 'deterministic_mock' || (manifest.adapter || {}).module !== 'lib/engine-candidate/mock-adapter.js') fail('E', 'the only approved adapter is the deterministic mock');
  if (!same(Object.keys(manifest.bound_modules || {}), BOUND_MODULES)) fail('E', 'bound module list differs');
  for (const f of BOUND_MODULES) {
    if (!existsSync(join(root, f))) { fail('E', f + ' missing'); continue; }
    if (sha256(read(root, f)) !== (manifest.bound_modules || {})[f]) fail('E', f + ' changed since the manifest was frozen');
  }
  const replaySrc = read(root, 'tools/frozen-demo/lib/replay.js');
  const imports = [...replaySrc.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((x) => x[1]);
  const extra = imports.filter((i) => !ALLOWED_REPLAY_IMPORTS.includes(i));
  if (extra.length) fail('E', 'the replay imports a module outside the approved set (adapter substitution?): ' + extra.join(', '));
  if (/import\s*\(/.test(stripComments(replaySrc))) fail('E', 'the replay uses a dynamic import');
  // The verifier itself is excluded: it names the patterns it screens for.
  // The verifier itself is excluded (it names the patterns it screens for), and so is the loopback
  // viewer server, which is checked on its own terms below: inbound loopback only, no outbound call.
  for (const [f, src] of codeFiles(root).filter(([f]) => !/lib\/verify\.js$|serve-viewer\.mjs$/.test(f))) if (PROVIDER_OR_NETWORK.test(stripComments(src))) fail('E', f + ' contains a network, provider, credential, clock or storage pathway');
  const serveSrc = existsSync(join(root, 'tools/frozen-demo/serve-viewer.mjs')) ? stripComments(read(root, 'tools/frozen-demo/serve-viewer.mjs')) : '';
  const serveImports = [...serveSrc.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((x) => x[1]).sort();
  if (!same(serveImports, ['node:fs', 'node:http'])) fail('E', 'the viewer server imports more than node:http and node:fs');
  if (/\b(?:request|get|connect)\s*\(|fetch\s*\(|process\.env/.test(serveSrc.replace(/req\.headers\.host/g, ''))) fail('E', 'the viewer server makes or could make an outbound call');
  if (!/LOOPBACK = Object\.freeze\(\['127\.0\.0\.1', '::1', 'localhost'\]\)/.test(serveSrc) || !/connect-src 'none'/.test(serveSrc)) fail('E', 'the viewer server is not loopback-only with connect-src none');

  // ---- F exact replay ------------------------------------------------------------------------------
  let replay = null;
  try { replay = await replayAll(join(root, corpusDir)); } catch (e) { fail('F', 'replay threw: ' + e.message); }
  if (replay) {
    for (const c of replay.cases) {
      const m = (manifest.records || []).find((x) => x.record_id === c.record_id), r = records[c.record_id];
      if (!m || !r) { fail('F', c.record_id + ' replayed but not in the manifest'); continue; }
      if (!same(c.adapter_identity, { model_id: APPROVED_ADAPTER.model_id, model_version: APPROVED_ADAPTER.model_version, prompt_version: live.prompt_version })) fail('F', c.record_id + ' adapter identity differs');
      if (!same(c.observed.input_preparation, r.expected.input_preparation)) fail('F', c.record_id + ' input preparation differs from the frozen expectation');
      if (!same(c.observed.candidate, r.expected.candidate)) fail('F', c.record_id + ' candidate behaviour differs from the frozen expectation');
      if (!same(r.expected.input_preparation, m.expected_input_preparation) || !same(r.expected.candidate, m.expected_candidate)) fail('F', c.record_id + ' manifest expectation differs from the frozen record');
      if (!same(c.digests, m.expected_digests)) fail('F', c.record_id + ' result or packet digest differs from the frozen replay');
      if ((c.adapter_calls === 0) !== (r.expected.candidate.result_status === 'refused')) fail('F', c.record_id + ' adapter call count is wrong for its status');
      if (c.result.status === 'refused' && c.adapter_calls !== 0) fail('F', c.record_id + ' a refused record reached the adapter');
      const probes = (r.expected.scope_probes || []).map((p) => ({ probe_id: p.probe_id, profile_change: p.profile_change, observed: p.expected }));
      if (!same(c.scope_probes, probes)) fail('F', c.record_id + ' scope probe behaviour differs');
      const h = c.human_disposition_example;
      if (!h.opened || !h.export_verification.ok) fail('F', c.record_id + ' the workspace example did not open, sign off and verify');
      // ---- G no score, verdict, legal determination or Codebook mapping
      walkKeys([c.result, c.packet], (k, v, p) => { if (SCORE_KEY.test(k)) fail('G', c.record_id + ' result carries a ' + k + ' field at ' + p); });
      if (c.result.validated !== false) fail('G', c.record_id + ' result claims validation');
      const authored = c.result.contextual_findings ? Object.values(c.result.contextual_findings.conditions).map((x) => x.note).concat(c.result.contextual_findings.findings.map((f) => f.model_note || f.note), [c.result.contextual_findings.revision_needed]) : [];
      for (const s of authored.filter((x) => typeof x === 'string')) if (DETERMINATION.test(s) || LEGAL_OR_VERDICT.test(s)) fail('G', c.record_id + ' model-authored text carries a verdict, legal or compliance determination');
      walkKeys(c.packet, (k, v, p) => { if (k === 'codebook_correspondence' && v !== 'not_asserted') fail('G', c.record_id + ' asserts a Codebook correspondence at ' + p); if (/codebook_mapping|maps_to_condition/i.test(k)) fail('G', c.record_id + ' carries a Codebook mapping field'); });
      // ---- H synthetic packets
      if (c.packet.record_ref !== 'SYNTHETIC-' + c.record_id || !/LOCAL CANDIDATE/.test(c.packet.status.standing)) fail('H', c.record_id + ' packet lacks its synthetic label');
      if (h.export_record && h.export_record.packet.record_ref !== 'SYNTHETIC-' + c.record_id) fail('H', c.record_id + ' example export lacks its synthetic label');
    }
  }
  if (CODEBOOK_CORRESPONDENCE_RECORD !== null) fail('G', 'a Codebook correspondence record now exists; the package asserts none and must be re-reviewed');
  const textual = [manifest, evidence, ...Object.values(records)];
  walkKeys(textual, (k, v, p) => { if (SCORE_KEY.test(k) && v !== null && v !== false) fail('G', 'package file carries a ' + k + ' field at ' + p); });
  for (const s of strings(textual)) if (CODEBOOK_ASSERTION.test(s)) fail('G', 'package text asserts a Codebook mapping');

  // ---- I generated outputs ---------------------------------------------------------------------------
  if (replay) {
    const outs = renderOutputs(replay, manifest, evidence);
    for (const [p, text] of Object.entries(outs)) if (!existsSync(join(root, p)) || read(root, p) !== text) fail('I', p + ' is stale or missing; run node tools/frozen-demo/run-demo.mjs');
  }

  // ---- J evidence record and release gates -------------------------------------------------------------
  const S = evidence.statements || {};
  const EXPECT = { all_cases_synthetic: true, all_output_mocked_or_local: true, repeatable_only_within_fixed_local_configuration: true, independent_evaluation: false,
    sealed_holdout: false, release_gates_advanced: [], owner_release_decision_recorded: false, public_or_customer_demonstration_occurred: false, real_records_processed: false, provider_calls_made: false };
  for (const [k, v] of Object.entries(EXPECT)) if (!same(S[k], v)) fail('J', 'evidence statement ' + k + ' must be ' + JSON.stringify(v));
  if (evidence.status !== STATUS || evidence.package_id !== manifest.package_id || evidence.package_version !== manifest.package_version) fail('J', 'evidence record does not name this package and status');
  if (!/^Exact replay of the fixed local package/.test(evidence.what_the_replay_shows || '')) fail('J', 'evidence record must limit what the replay shows to exact replay of the fixed local package');
  for (const s of strings(evidence)) if (/\b(?:the\s+)?demonstration\s+(?:proves|validates|shows\s+that\s+the\s+engine)|\bproves\b/i.test(s) && !/does not prove|not proof/i.test(s)) fail('J', 'evidence record claims proof');
  try {
    const rg = JSON.parse(read(root, RELEASE_GATE_RECORD));
    const passed = rg.gates.filter((g) => g.status === 'PASS' || (g.sub_controls || []).some((s) => s.status === 'PASS'));
    if (passed.length) fail('J', 'a release gate is marked PASS: ' + passed.map((g) => g.gate_id).join(', '));
    if (Object.values(rg.authorizations_created || {}).some((v) => v !== false)) fail('J', 'the release-gate record creates an authorization');
  } catch (e) { fail('J', 'release-gate record unreadable'); }

  // ---- K limitations, prohibited statuses and viewer isolation ---------------------------------------------
  const lim = manifest.known_limitations || {};
  for (const k of REQUIRED_LIMITATIONS) if (typeof lim[k] !== 'string' || lim[k].length < 20) fail('K', 'known limitation ' + k + ' missing');
  for (const [f, src] of [[MANIFEST, JSON.stringify(manifest)], [EVIDENCE, JSON.stringify(evidence)], ...codeFiles(root)]) {
    // A negated use ('NOT VALIDATED', the candidate's own packet notice) is not a status claim.
    for (const s of PROHIBITED_STATUSES) if (new RegExp('(?<!NOT )\\b' + s + '\\b').test(src)) fail('K', f + ' carries the prohibited status ' + s);
  }
  const walkPublic = (rel) => readdirSync(join(root, rel)).flatMap((n) => {
    const p = rel ? rel + '/' + n : n;
    if (!rel && NOT_PUBLIC.has(n)) return [];
    let st; try { st = statSync(join(root, p)); } catch (e) { return []; }
    return st.isDirectory() ? walkPublic(p) : /\.md$/.test(n) ? [] : [p];
  });
  const linked = walkPublic('').filter((f) => /\.(html?|xml|json|js|mjs|txt|webmanifest)$/.test(f) && /frozen-demo|frozen_demo|demo-viewer|serve-viewer/i.test(read(root, f)));
  if (linked.length) fail('K', 'a public page, route or configuration names the viewer: ' + linked.join(', '));

  // The capability matrix: exact header, every required row, a limitation in every row, no release state.
  let matrix = '';
  try { matrix = read(root, MATRIX); } catch (e) { fail('K', 'capability matrix missing'); }
  if (matrix) {
    if (!matrix.includes(MATRIX_HEADER + '\n|---|---|---|---|---|')) fail('K', 'capability matrix header differs');
    const rows = matrix.split('\n').filter((l) => /^\| /.test(l) && l !== MATRIX_HEADER).map((l) => l.slice(2, -2).split(' | '));
    for (const name of MATRIX_ROWS) {
      const r = rows.find((x) => x[0] === name);
      if (!r || r.length !== 5) { fail('K', 'capability matrix row missing or malformed: ' + name); continue; }
      if (!MATRIX_LIMITS.some((l) => r[3].toLowerCase().includes(l))) fail('K', 'capability matrix row "' + name + '" states no limitation');
      if (/\bPASS(?:ED)?\b|\bready\b|approved|validated|released\b/i.test(r[4])) fail('K', 'capability matrix row "' + name + '" carries a release state');
    }
    for (const l of MATRIX_LIMITS) if (!matrix.toLowerCase().includes(l)) fail('K', 'capability matrix never states: ' + l);
  }

  return { ok: problems.length === 0, verifier_version: VERIFIER_VERSION, status: problems.length ? 'VERIFICATION_FAILED' : 'EXACT_REPLAY_CONFIRMED', problems,
           statement: 'A pass confirms exact replay of the fixed local synthetic package only. It is not evidence of semantic correctness, real-provider behavior, real-record performance or readiness of any kind.' };
}
