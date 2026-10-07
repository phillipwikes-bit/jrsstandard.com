// JRS controlled independent-evaluation readiness: future-run evidence ledger. INTERNAL. APPEND-ONLY.
//
// Each entry records who or what created an artifact, its type, version identity, digest, the
// caller-supplied time stamp, its preconditions, whether its evidence is VERIFIED, ASSERTED, MISSING or
// NOT_APPLICABLE, the human role it requires, an explicit limitation and its relation to the release
// gates. Entries are hash-chained: each carries the digest of the one before, and appendEntry() returns
// a new ledger with every earlier entry byte-identical, so an edit or removal breaks the chain.
//
// A reviewer, counsel, owner, custodian or independent-QA artifact can only be created by a person.
// A code path, a test fixture or generated text that tries to create one is refused (LED-04), and no
// entry made by code can claim to advance a release gate (LED-06).
import { sha256 } from '../../../lib/engine-candidate/source-prep.js';
import { canonicalJson } from '../../../lib/engine-candidate/contract.js';
import { HUMAN_ROLES, GATE_IDS, PROHIBITED_STATES } from './vocabulary.js';

export const LEDGER_VERSION = 'jrs-evaluation-run-ledger/0.1.0';
export const CREATOR_KINDS = Object.freeze(['human', 'code', 'test_fixture', 'generated']);
export const EVIDENCE_STATUSES = Object.freeze(['VERIFIED', 'ASSERTED', 'MISSING', 'NOT_APPLICABLE']);
// Artifacts only a person in the named role can create.
export const HUMAN_ROLE_ARTIFACTS = Object.freeze({
  independence_attestation: 'independent_reviewer', human_interpretation: 'independent_reviewer', adjudicated_conclusion: 'adjudicator',
  completion_attestation: 'record_custodian', custody_attestation: 'record_custodian', counsel_determination: 'counsel',
  owner_authorization: 'owner', freeze_record: 'owner', intake_opening_record: 'owner', independent_qa_report: 'independent_production_qa',
});
export const CODE_ARTIFACTS = Object.freeze(['planning_record', 'binding_record', 'intake_decision', 'candidate_output', 'extraction_artifact', 'repository_scan', 'verification_report']);
export const ARTIFACT_TYPES = Object.freeze(Object.keys(HUMAN_ROLE_ARTIFACTS).concat(CODE_ARTIFACTS));
const FIELDS = ['seq', 'created_by', 'artifact_type', 'version_identity', 'digest', 'timestamp', 'preconditions', 'evidence_status', 'required_human_role', 'limitation', 'release_gate_relation', 'prev_digest'];
const HEX64 = /^[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

export const entryDigest = (e) => { const { entry_digest, ...rest } = e; return sha256(canonicalJson(rest)); };

export function checkEntry(e, prev) {
  const codes = [];
  const refuse = (code, control, message) => codes.push({ code, control, message });
  if (!e || typeof e !== 'object') return [{ code: 'not_an_entry', control: 'LED-01' }];
  for (const k of FIELDS) if (!(k in e)) refuse('field_missing', 'LED-01', k);
  for (const k of Object.keys(e)) if (!FIELDS.includes(k) && k !== 'entry_digest') refuse('unexpected_field', 'LED-01', k);
  const c = e.created_by || {};
  if (!CREATOR_KINDS.includes(c.kind) || typeof c.identity !== 'string' || !c.identity) refuse('creator_malformed', 'LED-02');
  if (!ARTIFACT_TYPES.includes(e.artifact_type)) refuse('artifact_type_unknown', 'LED-02', String(e.artifact_type));
  if (!EVIDENCE_STATUSES.includes(e.evidence_status)) refuse('evidence_status_invalid', 'LED-03', String(e.evidence_status));
  if (!ISO.test(e.timestamp || '')) refuse('timestamp_malformed', 'LED-01');
  if (!Array.isArray(e.preconditions)) refuse('preconditions_malformed', 'LED-01');
  if (typeof e.limitation !== 'string' || e.limitation.trim().length < 20) refuse('limitation_missing', 'LED-05', 'Every entry states its limitation.');
  if (!(e.digest === null || HEX64.test(e.digest))) refuse('digest_malformed', 'LED-01');
  if (JSON.stringify(e).match(new RegExp('"(' + PROHIBITED_STATES.join('|') + ')"'))) refuse('prohibited_state', 'LED-03');
  // LED-04 role substitution.
  const role = HUMAN_ROLE_ARTIFACTS[e.artifact_type];
  if (role) {
    if (c.kind !== 'human') refuse('role_substitution', 'LED-04', e.artifact_type + ' can only be created by a person in the ' + role + ' role, never by ' + c.kind + '.');
    if (e.required_human_role !== role) refuse('required_role_mismatch', 'LED-04', e.artifact_type + ' requires the ' + role + ' role.');
  } else if (e.required_human_role !== null && !HUMAN_ROLES.includes(e.required_human_role)) refuse('required_role_unknown', 'LED-04');
  if (c.kind !== 'human' && e.evidence_status === 'VERIFIED' && e.required_human_role) refuse('code_verifies_human_evidence', 'LED-04', 'Code cannot mark human-role evidence VERIFIED.');
  // LED-06 release-gate relation.
  const g = e.release_gate_relation || {};
  if (!Array.isArray(g.gates) || g.gates.some((x) => !GATE_IDS.includes(x)) || !['none', 'informs', 'required_for'].includes(g.effect)) refuse('gate_relation_malformed', 'LED-06', 'effect is none, informs or required_for; no entry advances a gate.');
  // LED-07 the chain.
  const expectSeq = prev ? prev.seq + 1 : 0, expectPrev = prev ? prev.entry_digest : null;
  if (e.seq !== expectSeq) refuse('sequence_broken', 'LED-07', 'expected seq ' + expectSeq);
  if (e.prev_digest !== expectPrev) refuse('chain_broken', 'LED-07', 'prev_digest does not name the previous entry');
  if ('entry_digest' in e && e.entry_digest !== entryDigest(e)) refuse('entry_altered', 'LED-07', 'entry_digest does not match the entry');
  return codes;
}

export function verifyLedger(ledger) {
  const problems = [];
  if (!ledger || ledger.ledger_version !== LEDGER_VERSION || !Array.isArray(ledger.entries) || !ledger.entries.length) return { ok: false, problems: [{ code: 'ledger_malformed', control: 'LED-01' }] };
  ledger.entries.forEach((e, i) => { for (const c of checkEntry(e, i ? ledger.entries[i - 1] : null)) problems.push({ ...c, entry: i }); });
  if (ledger.entries[0].artifact_type !== 'planning_record') problems.push({ code: 'genesis_not_planning_record', control: 'LED-07', entry: 0 });
  return { ok: problems.length === 0, problems };
}

// Returns a new ledger with the entry appended, or refuses. The input ledger is never changed.
export function appendEntry(ledger, entry) {
  const v = verifyLedger(ledger);
  if (!v.ok) return { ok: false, codes: v.problems };
  const prev = ledger.entries[ledger.entries.length - 1];
  const e = { ...JSON.parse(JSON.stringify(entry)), seq: prev.seq + 1, prev_digest: prev.entry_digest };
  delete e.entry_digest;
  const codes = checkEntry(e, prev);
  if (codes.length) return { ok: false, codes };
  e.entry_digest = entryDigest(e);
  return { ok: true, ledger: { ...JSON.parse(JSON.stringify(ledger)), entries: ledger.entries.concat([e]) }, codes: [] };
}

// The committed ledger's existing entries must survive unchanged into any later version.
export function isAppendOnlyExtension(before, after) {
  if (!before || !after || !Array.isArray(before.entries) || !Array.isArray(after.entries) || after.entries.length < before.entries.length) return false;
  return before.entries.every((e, i) => canonicalJson(e) === canonicalJson(after.entries[i]));
}
