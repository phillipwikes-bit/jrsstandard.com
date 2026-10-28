// 156-record study: UNSIGNED draft of the live-run authorization, filled with the frozen values. Written after the
// freeze because it must carry the frozen hashes. It authorizes nothing; the offline gate refuses it as written.
// Usage: node post-freeze/build-authorization-draft.mjs   (writes authorization/STUDY156_LIVE_AUTHORIZATION_DRAFT.json)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStudyAuthorization, authorizationSha256, REQUIRED_FIELDS } from '../tools/transport/study-authorization.mjs';
import { MODEL, DESTINATION } from '../tools/transport/sender.mjs';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(PKG, 'authorization', 'STUDY156_LIVE_AUTHORIZATION_DRAFT.json');
if (existsSync(OUT)) { console.error(OUT + ' exists'); process.exit(2); }
const sha = (b) => createHash('sha256').update(b).digest('hex');
const plan = JSON.parse(readFileSync(join(PKG, 'protocol', 'REQUEST_AND_COST_PLAN.json'), 'utf8'));
const canon = (v) => (v && typeof v === 'object' ? (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}') : JSON.stringify(v));
const base = plan.requests.base;
const draft = {
  authorization_id: 'S156-LIVE-AUTH-DRAFT-01',
  study: '156-record study',
  model_identifier: MODEL,
  candidate_version: '0.3.3-research-candidate',
  candidate_manifest_sha256: sha(readFileSync(join(PKG, 'CANDIDATE_0.3.3_MANIFEST_SHA256.txt'))),
  prompt_sha256: plan.prompt.sha256,
  record_set_sha256: sha(canon(base.map((r) => [r.request_id, r.body_sha256]))),
  authorized_record_ids: [...new Set(base.map((r) => r.unit_id))],
  max_requests: base.length,
  max_budget_usd: 8.0,
  expiry_utc: null,
  retention_location: null,
  retention_deletion_rule: 'PROPOSED: raw captures kept outside the public repository and deleted 90 days after the study report unless extended in writing; hashes and the journal kept in the repository.',
  credential_environment_variable_name: 'JRS_STUDY156_PROVIDER_KEY',
  destination: DESTINATION.url,
  stop_rules_approved: false,
  owner_signature: null,
  signed_at_utc: null,
};
const expected = { authorizationSha256: authorizationSha256(draft), model: MODEL, candidate_version: draft.candidate_version, candidate_manifest_sha256: draft.candidate_manifest_sha256, prompt_sha256: draft.prompt_sha256, record_set_sha256: draft.record_set_sha256, destination: DESTINATION.url };
const first = base[0];
const gate = verifyStudyAuthorization(draft, { recordId: first.unit_id, body: { model: MODEL }, worstCaseUsd: first.worst_case_usd_all_attempts }, '2026-10-27T13:30:00.000Z', expected);
const doc = { status: 'UNSIGNED DRAFT. Authorizes nothing. The offline gate refuses it as written (see gate_check).', record_set_definition: 'sha256 of the canonical JSON list of [request_id, body_sha256] for every base request in protocol/REQUEST_AND_COST_PLAN.json',
  owner_fields_to_complete: ['expiry_utc', 'retention_location', 'retention_deletion_rule (accept or amend)', 'stop_rules_approved (after reading section 4 of protocol/REQUEST_AND_COST_PLAN.md)', 'owner_signature', 'signed_at_utc'],
  still_required_after_signature: ['A live sender build (dispatch lock released only in that build, after its offline tests pass), in a new session', 'Day-of checks: model availability and snapshot, current prices, API version and thinking rules (protocol/PROVIDER_COMPATIBILITY_RECORD.md section 4)',
    'The credential set by the owner in approved session secrets under the named variable; never pasted into a conversation', 'A decision on B-018 and on whether a live run may proceed while it is OPEN'],
  required_fields: REQUIRED_FIELDS, gate_check: { checked_at_utc: '2026-10-27T13:30:00.000Z', problems: gate }, draft };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(doc, null, 2) + '\n', { flag: 'wx' });
console.log('draft written; gate problems:', gate.length, gate.slice(0, 8).join('; '));
