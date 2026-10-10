// JRS Review Engine local candidate: adversarial consistency and integrity harness.
// LOCAL DEVELOPMENT ONLY. A SOFTWARE CONSISTENCY CONTROL. It runs one constructed
// record through several mocked response variants and checks that the candidate
// behaved consistently and kept its own invariants. It is NOT evidence of
// real-world reliability, accuracy or validation, and it computes no rate.
//
// It FAILS CLOSED: any failure gives status 'review_incomplete', with each failure
// recorded. The record it returns carries identifiers and hashes, never record text.
//
// Failure codes:
//   adapter_output_rejected     a variant's output failed the adapter boundary
//   unsupported_quotation       a quotation that is not in the record
//   quotation_absent            a finding with no quotation
//   adapter_call_failed         a variant's adapter threw
//   contradictory_classification  one condition is 'pass' in one variant and 'gap' in another
//   internal_contradiction      a condition is 'pass' while a finding of the same explanation category is reported
//   prep_failure_omitted        a source-preparation finding is missing from the result
//   record_text_mutated         the text examined or sent differs from the input
//   identifier_mutated          the record reference changed
//   identity_mutated            the review identity differs from the one the versions and source determine
//   input_mutated               the caller's input object changed
//   nondeterministic_output     the same variant gave different results on two runs
//   refused_but_adapter_called  a refused record reached the adapter

import { prepareSource, sha256 } from './source-prep.js';
import { reviewIdentity } from './contract.js';
import { CONDITION_CATEGORY, FLAW_CATEGORY, EXPLANATION_SET_VERSION } from './explanations.js';
import { SOURCE_PREP_VERSION } from './source-prep.js';
import { ADAPTER_CONTRACT } from './adapter.js';
import { runCandidate, checkScope, CANDIDATE_VERSION, DERIVED_FROM, PROMPT_SHA256, CONDITION_KEYS } from './review-candidate.js';

export const HARNESS_VERSION = 'consistency-harness/0.1.0';

function expectedIdentity(ids, text) {
  return reviewIdentity({ candidate_version: CANDIDATE_VERSION, source_prep_version: SOURCE_PREP_VERSION, explanation_set_version: EXPLANATION_SET_VERSION,
    prompt_sha256: PROMPT_SHA256, prompt_version: ids.prompt_version, adapter_contract: ADAPTER_CONTRACT,
    model: ids.model_id + '@' + ids.model_version, derived_from: DERIVED_FROM }, typeof text === 'string' ? sha256(text) : null);
}

// Records every request an adapter receives, without changing what it returns.
function watched(adapter) {
  var requests = [];
  return { requests: requests, adapter: {
    describe: function () { return adapter.describe(); },
    examine: function (req) { requests.push(JSON.parse(JSON.stringify(req))); return adapter.examine(req); },
  } };
}

export async function runConsistencyHarness(spec) {
  var input = spec.input, variants = spec.variants || [], now = spec.now;
  // The candidate under check. Defaults to this candidate; any implementation with the same
  // interface can be checked, which is also how each detector is shown to fire in the tests.
  var run = typeof spec.candidate === 'function' ? spec.candidate : runCandidate;
  var before = JSON.stringify(input);
  var failures = [];
  var fail = function (code, variant, detail) { failures.push({ code: code, variant_id: variant || null, detail: detail || null }); };
  var outcomes = [], examined = [];
  var gate = checkScope(input);

  for (var i = 0; i < variants.length; i++) {
    var vid = variants[i].variant_id, w = watched(variants[i].adapter), ids = w.adapter.describe();
    var r1, r2;
    try { r1 = await run(input, { adapter: w.adapter, now: now }); r2 = await run(input, { adapter: w.adapter, now: now }); }
    catch (e) { fail('adapter_call_failed', vid, 'the candidate threw'); outcomes.push({ variant_id: vid, status: 'error' }); continue; }
    outcomes.push({ variant_id: vid, status: r1.status, reason: r1.reason, review_id: r1.review_identity.review_id });
    if (JSON.stringify(r1) !== JSON.stringify(r2)) fail('nondeterministic_output', vid);

    if (gate.refusal) {
      if (w.requests.length) fail('refused_but_adapter_called', vid);
      if (r1.status !== 'refused') fail('record_text_mutated', vid, 'a refused record was examined');
      continue;
    }
    var exp = expectedIdentity(ids, input.text);
    if (JSON.stringify(r1.review_identity) !== JSON.stringify(exp)) fail('identity_mutated', vid);
    if (!r1.source || r1.source.sha256 !== sha256(input.text)) fail('record_text_mutated', vid, 'source hash differs from the input');
    if (w.requests.some(function (q) { return q.messages[0].content.indexOf('\n' + input.text + '\n') === -1; })) fail('record_text_mutated', vid, 'the adapter did not receive the exact record');
    if (r1.record_ref !== (typeof input.record_ref === 'string' ? input.record_ref : null)) fail('identifier_mutated', vid);

    var prep = prepareSource(input.text);
    var have = r1.extraction_findings.filter(function (f) { return f.origin === 'source_prep'; }).map(function (f) { return f.code + '@' + (f.location ? f.location.start : '') + '#' + (f.element || ''); });
    prep.findings.forEach(function (f) {
      var key = f.code + '@' + (f.location ? f.location.start : '') + '#' + (f.element || '');
      if (have.indexOf(key) === -1) fail('prep_failure_omitted', vid, f.code);
    });

    if (r1.status === 'incomplete') {
      var rej = r1.extraction_findings.find(function (f) { return f.code === 'adapter_output_rejected'; });
      if (rej) {
        fail('adapter_output_rejected', vid, rej.rejection_codes.join(', '));
        if (rej.rejection_codes.indexOf('quotation_not_in_record') !== -1) fail('unsupported_quotation', vid);
        if (rej.rejection_codes.indexOf('missing_quotation') !== -1) fail('quotation_absent', vid);
      } else fail('adapter_call_failed', vid, r1.reason);
      continue;
    }
    var flaws = r1.contextual_findings.findings.filter(function (f) { return f.kind === 'flaw'; });
    flaws.forEach(function (f) {
      if (!f.quotation) fail('quotation_absent', vid);
      else if (input.text.indexOf(f.quotation) === -1) fail('unsupported_quotation', vid);
    });
    CONDITION_KEYS.forEach(function (k) {
      if (r1.contextual_findings.conditions[k].status !== 'pass' || !CONDITION_CATEGORY[k]) return;
      if (flaws.some(function (f) { return FLAW_CATEGORY[f.type] === CONDITION_CATEGORY[k]; })) fail('internal_contradiction', vid, k);
    });
    examined.push({ variant_id: vid, conditions: r1.contextual_findings.conditions });
  }

  var disagreements = [];
  CONDITION_KEYS.forEach(function (k) {
    var seen = examined.map(function (e) { return e.conditions[k].status; });
    if (new Set(seen).size > 1) disagreements.push(k);
    if (seen.indexOf('pass') !== -1 && seen.indexOf('gap') !== -1) fail('contradictory_classification', null, k);
  });
  if (JSON.stringify(input) !== before) fail('input_mutated');

  var codes = Array.from(new Set(failures.map(function (f) { return f.code; }))).sort();
  return {
    harness_version: HARNESS_VERSION,
    record_ref: typeof input.record_ref === 'string' ? input.record_ref : null,
    status: gate.refusal && !codes.length ? 'not_examined' : codes.length ? 'review_incomplete' : 'consistent',
    failure_codes: codes, failures: failures, disagreements: disagreements.sort(), variant_outcomes: outcomes,
    statement: 'Software consistency control on constructed development data. Not evidence of real-world reliability, accuracy or validation.',
  };
}
