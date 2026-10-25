// Direct probes for the Gate V0 validation controls (controls.mjs). Each probe feeds one
// control a known-bad input and asserts the specific problem code it must raise; "good"
// probes assert that valid inputs raise nothing. Inputs are copies of run-1 artifacts
// (EV-01, EV-12) or small synthetic objects. No Engine code is imported.
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const clone = (x) => JSON.parse(JSON.stringify(x));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const has = (list, prefix) => list.some((x) => x === prefix || x.startsWith(prefix + ':') || x.startsWith(prefix));

function makeSealedCorpus(dir, variant) {
  rmSync(dir, { recursive: true, force: true });
  for (const d of ['cases', 'truth', 'expectations']) mkdirSync(join(dir, d), { recursive: true });
  const files = { 'cases/X.record.txt': 'SYNTHETIC DEVELOPMENT MATERIAL. NOT VALIDATION MATERIAL.\nDecision: test\n', 'truth/X.layer1.json': '{}\n', 'expectations/X.expected.json': '{"case_id":"X"}\n' };
  for (const [f, t] of Object.entries(files)) writeFileSync(join(dir, f), t);
  const manifest = '# test\n' + Object.keys(files).map((f) => sha(files[f]) + '  ' + f).join('\n') + '\n';
  writeFileSync(join(dir, 'M.txt'), variant === 'manifest_altered' ? manifest + '# tampered\n' : manifest);
  const seal = { manifest_file: 'M.txt', manifest_sha256: sha(manifest), file_count: 3, sealed_at_utc: variant === 'no_timestamp' ? '' : '2026-10-25T08:45:46.600Z' };
  if (variant !== 'no_seal') writeFileSync(join(dir, 'SEAL.json'), JSON.stringify(seal));
  if (variant === 'modified') writeFileSync(join(dir, 'expectations/X.expected.json'), '{"case_id":"X","changed":true}\n');
  if (variant === 'added') writeFileSync(join(dir, 'cases/Y.record.txt'), 'extra');
  return dir;
}

export async function runProbes(V, ctx) {
  const g = ctx.golden;     // { graph, graphText, responseText, rec, record, envelope }
  const c = ctx.conflictGolden;
  const out = [];
  const probe = async (id, control, fn) => { let pass = false, detail = null; try { const r = await fn(); pass = r === true; if (r !== true) detail = r; } catch (e) { detail = 'threw:' + e.message; } out.push({ id, control, pass, detail }); };
  const T = ctx.tmp;

  // VC-01 seal
  await probe('P-SEAL-GOOD', 'VC-01', () => V.verifySeal(makeSealedCorpus(join(T, 's0'), null)).ok === true);
  await probe('P-SEAL-MISSING', 'VC-01', () => has(V.verifySeal(makeSealedCorpus(join(T, 's1'), 'no_seal')).problems, 'seal_missing'));
  await probe('P-SEAL-MODIFIED', 'VC-01', () => has(V.verifySeal(makeSealedCorpus(join(T, 's2'), 'modified')).problems, 'post_seal_modification'));
  await probe('P-SEAL-ADDED', 'VC-01', () => has(V.verifySeal(makeSealedCorpus(join(T, 's3'), 'added')).problems, 'unsealed_file_added'));
  await probe('P-SEAL-MANIFEST', 'VC-01', () => has(V.verifySeal(makeSealedCorpus(join(T, 's4'), 'manifest_altered')).problems, 'seal_manifest_hash_mismatch'));
  await probe('P-SEAL-TIMESTAMP', 'VC-01', () => has(V.verifySeal(makeSealedCorpus(join(T, 's5'), 'no_timestamp')).problems, 'seal_timestamp_missing'));
  // VC-02 Layer 1
  const L1 = { case_id: 'EV-01', layer: 1, facts: ['x'], real_material: false, content_origin: 'synthetic_engineering_fixture' };
  await probe('P-L1-GOOD', 'VC-02', () => V.checkLayer1(L1, 'EV-01').length === 0);
  await probe('P-L1-FACTS', 'VC-02', () => has(V.checkLayer1(Object.assign({}, L1, { facts: [] }), 'EV-01'), 'layer1_facts_missing'));
  await probe('P-L1-SYNTH', 'VC-02', () => has(V.checkLayer1(Object.assign({}, L1, { real_material: true }), 'EV-01'), 'layer1_not_declared_synthetic'));
  // VC-03 expectation integrity
  const exp = '{"case_id":"EV-01"}';
  await probe('P-EXP-GOOD', 'VC-03', () => V.checkExpectationIntegrity(exp, sha(exp), 'EV-01').length === 0);
  await probe('P-EXP-ALTERED', 'VC-03', () => has(V.checkExpectationIntegrity('{"case_id":"EV-01","statuses":"changed"}', sha(exp), 'EV-01'), 'expectation_not_sealed_version'));
  await probe('P-EXP-CASEID', 'VC-03', () => { const t = '{"case_id":"EV-02"}'; return has(V.checkExpectationIntegrity(t, sha(t), 'EV-01'), 'expectation_case_id_mismatch'); });
  // VC-04 provenance pair
  await probe('P-PAIR-GOOD', 'VC-04', () => V.checkPair(g.rec, g.graphText, g.responseText, ctx.canonicalBinding).length === 0);
  await probe('P-PAIR-GRAPH', 'VC-04', () => has(V.checkPair(g.rec, g.graphText.replace('"supported"', '"gap"'), g.responseText, ctx.canonicalBinding), 'graph_sha256_mismatch'));
  await probe('P-PAIR-RESP', 'VC-04', () => has(V.checkPair(g.rec, g.graphText, g.responseText + ' ', ctx.canonicalBinding), 'captured_response_sha256_mismatch'));
  await probe('P-PAIR-DIGEST', 'VC-04', () => has(V.checkPair(Object.assign(clone(g.rec), { binding_digest: '0'.repeat(64) }), g.graphText, g.responseText, ctx.canonicalBinding), 'binding_digest_mismatch'));
  await probe('P-PAIR-BINDFIELD', 'VC-04', () => has(V.checkPair(Object.assign(clone(g.rec), { request_id: '' }), g.graphText, g.responseText, ctx.canonicalBinding), 'binding_fields_invalid'));
  // VC-05 model identity
  await probe('P-MODEL-GOOD', 'VC-05', () => V.checkModelIdentity(g.rec, g.envelope).length === 0);
  await probe('P-MODEL-REC', 'VC-05', () => has(V.checkModelIdentity(Object.assign(clone(g.rec), { model_identifier: 'other-model' }), g.envelope), 'execution_record_model_mismatch'));
  await probe('P-MODEL-ENV', 'VC-05', () => has(V.checkModelIdentity(g.rec, Object.assign(clone(g.envelope), { model: 'other-model' })), 'captured_model_mismatch'));
  // VC-06 identity
  await probe('P-ID-GOOD', 'VC-06', () => V.checkIdentity(g.graph, g.rec).length === 0);
  await probe('P-ID-CALLS', 'VC-06', () => { const x = clone(g.graph); x.identity.network_calls = 1; return has(V.checkIdentity(x, g.rec), 'provider_or_network_calls_recorded'); });
  await probe('P-ID-MODE', 'VC-06', () => { const x = clone(g.graph); x.identity.execution_mode = 'live_provider'; return has(V.checkIdentity(x, g.rec), 'graph_execution_mode_unexpected'); });
  await probe('P-ID-LABELS', 'VC-06', () => has(V.checkIdentity(g.graph, Object.assign(clone(g.rec), { response_origin: 'live_provider_captured' })), 'provenance_labels_unexpected'));
  // VC-07 offsets
  await probe('P-OFF-GOOD', 'VC-07', () => V.checkOffsets(g.graph, g.record).length === 0);
  await probe('P-OFF-SPAN', 'VC-07', () => { const x = clone(g.graph); const s = x.nodes.find((n) => n.type === 'record_span'); s.start += 1; s.utf8_start += 1; return has(V.checkOffsets(x, g.record), 'span_text_mismatch'); });
  await probe('P-OFF-EV', 'VC-07', () => { const x = clone(g.graph); const e = x.nodes.find((n) => n.type === 'verified_evidence'); e.start += 2; return has(V.checkOffsets(x, g.record), 'evidence_offset_mismatch'); });
  // VC-08 linkage
  await probe('P-LINK-GOOD', 'VC-08', () => V.checkLinkage(g.graph).length === 0);
  await probe('P-LINK-ASSERT', 'VC-08', () => { const x = clone(g.graph); x.edges = x.edges.filter((e) => e.type !== 'TEXTUALLY_SUPPORTS'); return has(V.checkLinkage(x), 'assertion_without_matching_evidence'); });
  await probe('P-LINK-FAV', 'VC-08', () => { const x = clone(g.graph); x.edges = x.edges.filter((e) => !(e.type === 'RELATES_TO' && e.from.startsWith('find:') && e.to.startsWith('as:'))); return has(V.checkLinkage(x), 'favourable_finding_without_assertion'); });
  // VC-09 ambiguity
  const amb = { nodes: [{ id: 'pq:O1', type: 'proposed_quote', observation_id: 'O1', quote_resolution_status: 'ambiguous', candidate_locations: [{}, {}] }, { id: 'ev:O1', type: 'verified_evidence', observation_id: 'O1' }] };
  await probe('P-AMB-SELECT', 'VC-09', () => has(V.checkAmbiguity(amb), 'ambiguous_quote_selected'));
  await probe('P-AMB-LOCATIONS', 'VC-09', () => has(V.checkAmbiguity({ nodes: [{ id: 'pq:O1', type: 'proposed_quote', observation_id: 'O1', quote_resolution_status: 'ambiguous', candidate_locations: [{}] }] }), 'ambiguous_quote_without_locations'));
  // VC-10 monotonicity
  const F = (c, s, ps) => ({ findings: [{ condition_id: c, status: s, proposed_status: ps }] });
  await probe('P-MONO-GOOD', 'VC-10', () => V.checkMonotonic(g.graph).length === 0);
  await probe('P-MONO-RAISE', 'VC-10', () => has(V.checkMonotonic(F('identifiable_basis', 'supported', 'review_required')), 'status_raised_to_supported'));
  await probe('P-MONO-GAP', 'VC-10', () => has(V.checkMonotonic(F('identifiable_basis', 'gap', 'review_required')), 'status_changed_to_gap'));
  await probe('P-MONO-SUFF', 'VC-10', () => has(V.checkMonotonic(F('sufficiency', 'supported', 'supported')), 'sufficiency_supported'));
  await probe('P-MONO-RANK', 'VC-10', () => has(V.checkMonotonic(F('identifiable_basis', 'supported', 'gap')), 'status_rank_increased'));
  await probe('P-MONO-NOPROP', 'VC-10', () => has(V.checkMonotonic(F('identifiable_basis', 'gap', null)), 'status_without_proposal'));
  // VC-11 review routing
  await probe('P-ROUTE-GOOD', 'VC-11', () => V.checkReviewRoute(c.graph).length === 0);
  await probe('P-ROUTE-MISSING', 'VC-11', () => { const x = clone(g.graph); x.human_review_route = { route: 'none' }; return has(V.checkReviewRoute(x), 'review_route_missing'); });
  await probe('P-ROUTE-FIND', 'VC-11', () => { const x = clone(g.graph); x.edges = x.edges.filter((e) => !(e.type === 'ROUTES_TO_REVIEW' && e.from === 'find:sufficiency')); return has(V.checkReviewRoute(x), 'finding_not_routed'); });
  await probe('P-ROUTE-CONF', 'VC-11', () => { const x = clone(c.graph); x.edges = x.edges.filter((e) => !(e.type === 'ROUTES_TO_REVIEW' && e.from.startsWith('conf:'))); return has(V.checkReviewRoute(x), 'conflict_not_routed'); });
  // VC-12 chronology
  await probe('P-CHRONO', 'VC-12', () => { const x = clone(c.graph); x.findings.find((f) => f.condition_id === 'chronology_integrity').status = 'supported'; return has(V.checkChronology(x), 'chronology_conflict_not_lowered'); });
  // VC-13 graph validity (stub validator; no Engine import)
  await probe('P-GV', 'VC-13', () => has(V.checkGraphValid({}, '', () => ['GV-04: span text']), 'graph_invalid'));
  // VC-14 expectation comparison
  const obs = V.observe(c.graph);
  const expG = { intake_decision: obs.intake_decision, statuses: clone(obs.statuses), conflict_kinds: clone(obs.conflict_kinds), refusal_codes: clone(obs.refusal_codes), quote_statuses: clone(obs.quote_statuses), instruction_risk: obs.instruction_risk, required_span_origins: [] };
  await probe('P-CMP-GOOD', 'VC-14', () => V.compareExpected(obs, expG).length === 0);
  await probe('P-CMP-STATUS', 'VC-14', () => has(V.compareExpected(obs, Object.assign(clone(expG), { statuses: Object.assign(clone(expG.statuses), { chronology_integrity: 'supported' }) })), 'status'));
  await probe('P-CMP-CONFLICT', 'VC-14', () => has(V.compareExpected(obs, Object.assign(clone(expG), { conflict_kinds: [] })), 'conflicts'));
  await probe('P-CMP-REFUSAL', 'VC-14', () => has(V.compareExpected(obs, Object.assign(clone(expG), { refusal_codes: ['quote_absent'] })), 'refusals'));
  await probe('P-CMP-QUOTE', 'VC-14', () => has(V.compareExpected(obs, Object.assign(clone(expG), { quote_statuses: Object.assign(clone(expG.quote_statuses), { O1: 'ambiguous' }) })), 'quote'));
  await probe('P-CMP-ADAPTER', 'VC-14', () => has(V.compareAdapter({ outcome: 'REPLAYED' }, { outcome: 'REJECT-PRE-REPLAY', step: 'V8', code: 'x' }), 'adapter_outcome'));
  // VC-15 error accounting
  await probe('P-ERR-GUARD', 'VC-15', async () => (await V.runGuarded(() => { throw new Error('graph_self_validation_failed'); })).outcome === 'ERROR');
  await probe('P-ERR-COUNT', 'VC-15', () => has(V.checkNoConcealedError({ outcome: 'ERROR', error: 'x' }), 'execution_error_not_counted_as_failure'));
  // VC-16 network markers
  await probe('P-NET-GOOD', 'VC-16', () => V.checkNetworkMarkers({}, { temperature: 0, note: 'offline mock configuration' }).length === 0);
  await probe('P-NET-ENV', 'VC-16', () => has(V.checkNetworkMarkers({ ANTHROPIC_BASE_URL: 'set' }, {}), 'forbidden_env_present'));
  await probe('P-NET-KEY', 'VC-16', () => has(V.checkNetworkMarkers({}, { base_url: 'local' }), 'network_config_key'));
  await probe('P-NET-VALUE', 'VC-16', () => has(V.checkNetworkMarkers({}, { note: 'see https://example.invalid' }), 'network_config_value'));
  await probe('P-NET-ATTEMPTS', 'VC-16', () => has(V.checkNetworkAttempts([{ kind: 'fetch' }]), 'network_attempts'));
  // VC-17 forbidden language
  await probe('P-LANG-GOOD', 'VC-17', () => V.scanForbiddenLanguage('The Engine is not validated and is not production-ready.').length === 0);
  await probe('P-LANG', 'VC-17', () => has(V.scanForbiddenLanguage('Result: the Engine is validated and production-ready.'), 'forbidden_language'));
  await probe('P-LANG-RELEASE', 'VC-17', () => has(V.scanForbiddenLanguage('The package is ready for release.'), 'forbidden_language'));
  return out;
}
