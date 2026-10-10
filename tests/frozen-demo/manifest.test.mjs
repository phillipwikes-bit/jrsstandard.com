// Manifest structure, the one permitted status, and candidate, prompt, adapter and module binding.
import { t, done, IDS, read, json, R, V } from './_helpers.mjs';
import { sha256 } from '../../lib/engine-candidate/source-prep.js';
import { CANDIDATE_VERSION, PROMPT_VERSION, PROMPT_SHA256 } from '../../lib/engine-candidate/review-candidate.js';

const m = json('tools/frozen-demo/demo-manifest.json');
t('the manifest names the package ID and version', m.package_id === 'JRS-FROZEN-DEMO-20261007-PR39' && m.package_version === '0.1.0');
t('the status is exactly DEMO_PREPARATION_COMPLETE_NOT_RELEASED', m.status === 'DEMO_PREPARATION_COMPLETE_NOT_RELEASED' && V.STATUS === m.status);
const text = read('tools/frozen-demo/demo-manifest.json') + read('tools/frozen-demo/demo-evidence-record.json');
t('no prohibited status appears in the manifest or the evidence record', V.PROHIBITED_STATUSES.length === 8 && V.PROHIBITED_STATUSES.every((s) => !new RegExp('\\b' + s + '\\b').test(text)));
t('the manifest names the candidate version, source commit and corpus commit', m.candidate_version === CANDIDATE_VERSION && /^[0-9a-f]{40}$/.test(m.source_commit) && /^1717f1b/.test(m.corpus_commit));
t('the manifest names the prompt version and prompt hash in force', m.prompt_version === PROMPT_VERSION && m.prompt_sha256 === PROMPT_SHA256);
t('the adapter is the deterministic mock and nothing else', JSON.stringify(m.adapter) === JSON.stringify(R.APPROVED_ADAPTER) && m.adapter.kind === 'deterministic_mock' && m.adapter.module === 'lib/engine-candidate/mock-adapter.js');
t('every version the replay depends on is recorded and current', JSON.stringify(m.versions) === JSON.stringify(R.versions()));
t('every bound module is hashed, and each hash is current', Object.keys(m.bound_modules).join() === V.BOUND_MODULES.join() && V.BOUND_MODULES.every((f) => sha256(read(f)) === m.bound_modules[f]));
t('the mock adapter module is among the bound modules', 'lib/engine-candidate/mock-adapter.js' in m.bound_modules);
t('every record is listed with ID, version, hashes, expectations and digests', m.records.length === 5 && m.records.every((r, i) => r.record_id === IDS[i] && r.record_version === '1' && /^[0-9a-f]{64}$/.test(r.file_sha256)
  && /^[0-9a-f]{64}$/.test(r.source_sha256) && r.expected_input_preparation && r.expected_candidate && ['review_id', 'result_digest', 'packet_id', 'packet_digest'].every((k) => typeof r.expected_digests[k] === 'string')));
t('every record is synthetic and none is a holdout', m.records.every((r) => r.synthetic === true && r.holdout === false && r.classification === 'frozen_synthetic_demonstration_record') && m.holdout === false);
t('the package is local-only', m.local_only === true && /Local-only/.test(m.notice));
t('real data, provider calls, network access and a public route are prohibited', ['real_records', 'public_case_records', 'participant_or_pilot_material', 'sealed_holdout_material', 'provider_calls', 'network_access', 'public_route'].every((k) => m.prohibitions[k] === 'prohibited'));
t('the manifest records no release-gate effect', m.release_gate_effect === 'none');
t('every required limitation is stated', V.REQUIRED_LIMITATIONS.every((k) => typeof m.known_limitations[k] === 'string' && m.known_limitations[k].length > 40));
t('the limitations name each thing the package does not show', ['No semantic correctness', 'No real-provider behavior', 'No real-record performance', 'No independent labeling', 'No operational-control verification', 'No production or commercial readiness'].every((p) => Object.values(m.known_limitations).some((l) => l.startsWith(p))));
t('the replay configuration is named: runner, verifier, viewer, fixed time stamp', m.replay.fixed_now === R.FIXED_NOW && /run-demo\.mjs/.test(m.replay.runner) && /verify-demo-manifest\.mjs/.test(m.replay.verifier) && /serve-viewer\.mjs/.test(m.replay.viewer));
const v = await V.verifyDemoPackage();
t('the fail-closed verifier confirms exact replay of the committed package', v.ok && v.status === 'EXACT_REPLAY_CONFIRMED', v.problems.join(' | '));
t('the verifier states what a pass does not mean', /not evidence of semantic correctness, real-provider behavior, real-record performance or readiness/.test(v.statement));

// The verifier fails closed on altered inputs it is given directly (the mutation run covers files).
const altered = await V.verifyDemoPackage({ root: '/nonexistent/' });
t('a missing package fails closed', altered.ok === false);
t('the replay may import only the approved modules', V.ALLOWED_REPLAY_IMPORTS.includes('../../../lib/engine-candidate/mock-adapter.js') && !V.ALLOWED_REPLAY_IMPORTS.some((i) => /http|net|openai|anthropic|provider|live/i.test(i)));
done();
