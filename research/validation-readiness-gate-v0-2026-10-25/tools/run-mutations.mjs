// Mutation check for the Gate V0 validation controls. Each mutation is one exact text
// replacement in a temporary copy of controls.mjs; the named direct probe must then fail.
// A surviving mutation is a stop condition: it is recorded, never repaired here.
// Usage: node tools/run-mutations.mjs <scratch-parent>
import { attempts, installNetGuard } from './harness/net-guard.mjs';
installNetGuard();
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { canonicalBinding } from './harness/adapter.mjs';
import { runProbes } from './probes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const SCRATCH = process.argv[2];
const SRC = readFileSync(join(HERE, 'controls.mjs'), 'utf8');
const tmp = mkdtempSync(join(SCRATCH, 'v0-mut-'));
const rd = (p) => readFileSync(join(PKG, p), 'utf8');
const golden = { graphText: rd('out/run-1/EV-01/REQ-EV-01.graph.json'), responseText: rd('out/run-1/EV-01/REQ-EV-01.response.json'), rec: JSON.parse(rd('out/run-1/EV-01/REQ-EV-01.execution-record.json')), record: rd('corpus/cases/EV-01.record.txt') };
golden.graph = JSON.parse(golden.graphText); golden.envelope = JSON.parse(golden.responseText);
const conflictGolden = { graph: JSON.parse(rd('out/run-1/EV-12/REQ-EV-12.graph.json')) };

const M = [
  ['M01', 'Remove the graph-hash check from the provenance pair', "if (sha256(graphText) !== rec.graph_sha256) p.push('graph_sha256_mismatch');", '', 'P-PAIR-GRAPH'],
  ['M02', 'Permit a graph-hash mismatch (compare the hash with itself)', 'sha256(graphText) !== rec.graph_sha256', 'sha256(graphText) !== sha256(graphText)', 'P-PAIR-GRAPH'],
  ['M03', 'Remove the captured-response hash check', "if (sha256(responseText) !== rec.captured_response_sha256) p.push('captured_response_sha256_mismatch');", '', 'P-PAIR-RESP'],
  ['M04', 'Remove the binding-digest comparison', "if (digest !== null && digest !== rec.binding_digest) p.push('binding_digest_mismatch');", '', 'P-PAIR-DIGEST'],
  ['M05', 'Swallow an invalid binding field', "p.push('binding_fields_invalid');", '', 'P-PAIR-BINDFIELD'],
  ['M06', 'Permit an incorrect model identity in the execution record', "if (!rec || rec.model_identifier !== expected) p.push('execution_record_model_mismatch');", '', 'P-MODEL-REC'],
  ['M07', 'Permit an incorrect model identity in the captured envelope', "if (!envelope || envelope.model !== expected) p.push('captured_model_mismatch');", '', 'P-MODEL-ENV'],
  ['M08', 'Compare the record model with itself', 'rec.model_identifier !== expected', 'rec.model_identifier !== rec.model_identifier', 'P-MODEL-REC'],
  ['M09', 'Accept altered expected results', "if (sha256(expectedText) !== sealedHash) p.push('expectation_not_sealed_version');", '', 'P-EXP-ALTERED'],
  ['M10', 'Accept an expectation for another case', "if (e.case_id !== caseId) p.push('expectation_case_id_mismatch');", '', 'P-EXP-CASEID'],
  ['M11', 'Allow an unsealed corpus', "if (!existsSync(sealPath)) return { ok: false, problems: ['seal_missing'] };", "if (!existsSync(sealPath)) return { ok: true, problems: [] };", 'P-SEAL-MISSING'],
  ['M12', 'Allow post-seal modification', "else if (sha256(readFileSync(p)) !== h) problems.push('post_seal_modification:' + f);", '', 'P-SEAL-MODIFIED'],
  ['M13', 'Allow an unsealed file to be added', "if (!listed.has(d + '/' + f)) problems.push('unsealed_file_added:' + d + '/' + f);", '', 'P-SEAL-ADDED'],
  ['M14', 'Ignore a seal-manifest hash mismatch', "if (sha256(manifest) !== seal.manifest_sha256) problems.push('seal_manifest_hash_mismatch');", '', 'P-SEAL-MANIFEST'],
  ['M15', 'Allow a seal without a timestamp', "problems.push('seal_timestamp_missing');", '', 'P-SEAL-TIMESTAMP'],
  ['M16', 'Allow missing Layer 1 facts', "if (!Array.isArray(truth.facts) || truth.facts.length === 0) p.push('layer1_facts_missing');", '', 'P-L1-FACTS'],
  ['M17', 'Allow Layer 1 not declared synthetic', "p.push('layer1_not_declared_synthetic');", '', 'P-L1-SYNTH'],
  ['M18', 'Allow an ambiguous quotation to be selected', "if (ev.has(n.observation_id)) p.push('ambiguous_quote_selected:' + n.observation_id);", '', 'P-AMB-SELECT'],
  ['M19', 'Allow an ambiguous quotation without candidate locations', "if ((n.candidate_locations || []).length < 2) p.push('ambiguous_quote_without_locations:' + n.observation_id);", '', 'P-AMB-LOCATIONS'],
  ['M20', 'Permit an unsupported status increase to supported', "if (f.status === 'supported' && f.proposed_status !== 'supported') p.push('status_raised_to_supported:' + f.condition_id);", '', 'P-MONO-RAISE'],
  ['M21', 'Permit a status change to gap', "if (f.status === 'gap' && f.proposed_status !== 'gap') p.push('status_changed_to_gap:' + f.condition_id);", '', 'P-MONO-GAP'],
  ['M22', 'Permit sufficiency to be supported', "if (f.condition_id === 'sufficiency' && f.status === 'supported') p.push('sufficiency_supported');", '', 'P-MONO-SUFF'],
  ['M23', 'Remove the status-rank check', "if (RANK[f.proposed_status] !== undefined && RANK[f.status] > RANK[f.proposed_status]) p.push('status_rank_increased:' + f.condition_id);", '', 'P-MONO-RANK'],
  ['M24', 'Permit a status with no candidate proposal', "p.push('status_without_proposal:' + f.condition_id);", '', 'P-MONO-NOPROP'],
  ['M25', 'Suppress a required finding route to human review', "if (!routed.has('find:' + f.condition_id)) p.push('finding_not_routed:' + f.condition_id);", '', 'P-ROUTE-FIND'],
  ['M26', 'Accept a missing human-review route', "p.push('review_route_missing');", '', 'P-ROUTE-MISSING'],
  ['M27', 'Suppress conflict routing', "if (!routed.has(c.id)) p.push('conflict_not_routed:' + c.id);", '', 'P-ROUTE-CONF'],
  ['M28', 'Conceal an execution error as a normal result', "catch (e) { return { outcome: 'ERROR', error: String(e && e.message ? e.message : e).slice(0, 300) }; }", "catch (e) { return { outcome: 'REPLAYED' }; }", 'P-ERR-GUARD'],
  ['M29', 'Stop counting execution errors as failures', "if (result.outcome === 'ERROR' && result.counted_as !== 'failure') p.push('execution_error_not_counted_as_failure');", '', 'P-ERR-COUNT'],
  ['M30', 'Permit a network-related configuration key', 'const NET_KEY = /(?:base_?url|endpoint|api_?key|auth_?token|proxy|host)/i;', 'const NET_KEY = /(?!)/;', 'P-NET-KEY'],
  ['M31', 'Permit a network URL in configuration', 'const NET_VALUE = /\\b(?:https?|wss?):\\/\\//i;', 'const NET_VALUE = /(?!)/;', 'P-NET-VALUE'],
  ['M32', 'Permit forbidden provider environment variables', "export const FORBIDDEN_ENV = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'OPENAI_BASE_URL', 'OPENAI_API_KEY'];", 'export const FORBIDDEN_ENV = [];', 'P-NET-ENV'],
  ['M33', 'Ignore network attempts', "export function checkNetworkAttempts(attempts) { return attempts.length ? ['network_attempts:' + attempts.length] : []; }", 'export function checkNetworkAttempts(attempts) { return []; }', 'P-NET-ATTEMPTS'],
  ['M34', 'Permit forbidden validation or release language', "if (!NEG.test(pre.trim().split(/\\s+/).slice(-10).join(' ')) && !/[\"`“]$/.test(pre)) p.push('forbidden_language:' + m[0]);", '', 'P-LANG'],
  ['M35', 'Treat every mention as negated', 'const NEG = /\\b(?:not|no|never|cannot|nor|without|neither|does not|do not|is not|are not|must not|never be)\\b/i;', 'const NEG = /./;', 'P-LANG'],
  ['M36', 'Drop "ready for release" from the forbidden terms', '|ready for release|', '|', 'P-LANG-RELEASE'],
  ['M37', 'Remove the span-text offset check', "if (record.slice(n.start, n.end) !== n.text) p.push('span_text_mismatch:' + n.id);", '', 'P-OFF-SPAN'],
  ['M38', 'Remove the evidence offset check', "if (n.type === 'verified_evidence' && record.slice(n.start, n.end) !== n.quote) p.push('evidence_offset_mismatch:' + n.id);", '', 'P-OFF-EV'],
  ['M39', 'Remove the assertion-to-evidence linkage check', "p.push('assertion_without_matching_evidence:' + a.id);", '', 'P-LINK-ASSERT'],
  ['M40', 'Permit a favourable finding without an assertion', "if (!linked) p.push('favourable_finding_without_assertion:' + f.condition_id);", '', 'P-LINK-FAV'],
  ['M41', 'Ignore recorded provider or network calls', "if (id.provider_calls !== 0 || id.network_calls !== 0) p.push('provider_or_network_calls_recorded');", '', 'P-ID-CALLS'],
  ['M42', 'Ignore an unexpected execution mode', "if (id.execution_mode !== 'local_mocked') p.push('graph_execution_mode_unexpected');", '', 'P-ID-MODE'],
  ['M43', 'Ignore live provenance labels', "p.push('provenance_labels_unexpected');", '', 'P-ID-LABELS'],
  ['M44', 'Permit an unlowered chronology conflict', "if (chronoConflict && ch && (ch.status === 'supported' || ch.status === 'gap')) p.push('chronology_conflict_not_lowered');", '', 'P-CHRONO'],
  ['M45', 'Discard graph-validity problems', "return problems.map((x) => 'graph_invalid:' + x);", 'return [];', 'P-GV'],
  ['M46', 'Stop comparing statuses with the sealed expectation', "for (const [c, s] of Object.entries(expected.statuses)) if (observed.statuses[c] !== s) m.push('status:' + c + ':' + observed.statuses[c] + '!=' + s);", '', 'P-CMP-STATUS'],
  ['M47', 'Stop comparing conflict kinds', "if (canonical(observed.conflict_kinds) !== canonical(expected.conflict_kinds)) m.push('conflicts:' + observed.conflict_kinds.join(',') + '!=' + expected.conflict_kinds.join(','));", '', 'P-CMP-CONFLICT'],
  ['M48', 'Stop comparing refusal codes', "if (canonical(observed.refusal_codes) !== canonical(expected.refusal_codes)) m.push('refusals:' + observed.refusal_codes.join(',') + '!=' + expected.refusal_codes.join(','));", '', 'P-CMP-REFUSAL'],
  ['M49', 'Stop comparing quotation statuses', "for (const [o, s] of Object.entries(expected.quote_statuses)) if (observed.quote_statuses[o] !== s) m.push('quote:' + o + ':' + observed.quote_statuses[o] + '!=' + s);", '', 'P-CMP-QUOTE'],
  ['M50', 'Accept any adapter outcome', "if (observed.outcome !== expected.outcome) return ['adapter_outcome:' + observed.outcome + '!=' + expected.outcome];", '', 'P-CMP-ADAPTER'],
];

const baseline = await runProbes(await import(pathToFileURL(join(HERE, 'controls.mjs')).href), { golden, conflictGolden, canonicalBinding, tmp: join(tmp, 'base') });
const baselineFailures = baseline.filter((p) => !p.pass);
const results = [];
for (const [id, description, find, replace, target] of M) {
  const occurrences = SRC.split(find).length - 1;
  if (occurrences !== 1) { results.push({ id, description, target_probe: target, applied: false, detected: false, problem: 'find_text_occurs_' + occurrences + '_times' }); continue; }
  const file = join(tmp, 'controls-' + id + '.mjs');
  // An emptied statement becomes ';' so the mutated module still parses.
  writeFileSync(file, SRC.replace(find, replace === '' ? ';' : replace));
  let probes, error = null;
  try { probes = await runProbes(await import(pathToFileURL(file).href + '?' + id), { golden, conflictGolden, canonicalBinding, tmp: join(tmp, id) }); }
  catch (e) { error = e.message; probes = []; }
  const t = probes.find((p) => p.id === target);
  results.push({ id, description, target_probe: target, applied: true, detected: !!t && t.pass === false, failing_probes: probes.filter((p) => !p.pass).map((p) => p.id), load_error: error });
}
rmSync(tmp, { recursive: true, force: true });
const survivors = results.filter((r) => !r.detected);
const out = { results_format: 'jrs-v0-mutation-results/1.0.0', date: new Date().toISOString(), target: 'tools/controls.mjs', statement: 'Mutations against the Gate V0 validation controls. A mutation is detected only when its named direct probe fails. Detection shows the probes catch these faults; it does not show the absence of other faults.',
  baseline: { probes: baseline.length, passing: baseline.length - baselineFailures.length, failures: baselineFailures },
  totals: { mutations: results.length, applied: results.filter((r) => r.applied).length, detected: results.filter((r) => r.detected).length, survivors: survivors.map((r) => r.id) },
  network_attempts: attempts.length, mutations: results, probes: baseline.map((p) => ({ id: p.id, control: p.control })) };
writeFileSync(join(PKG, 'MUTATION_RESULTS.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out.baseline.passing + '/' + out.baseline.probes), JSON.stringify(out.totals), 'network', attempts.length);
if (baselineFailures.length) console.log('BASELINE FAILURES', JSON.stringify(baselineFailures));
if (survivors.length) { console.log('SURVIVORS (stop condition)', JSON.stringify(survivors)); process.exitCode = 4; }
