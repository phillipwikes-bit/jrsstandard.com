// The future-run evidence ledger (verifier section F).
import { execFileSync } from 'node:child_process';
import { t, done, ROOT, IN_REPO, json, M, has, clone } from './_helpers.mjs';
const L = M.ledger, E = M.probes.ledgerEntry;
const led = json('tools/evaluation-readiness/ledger/future-run-ledger.json');
t('the committed ledger verifies', L.verifyLedger(led).ok, JSON.stringify(L.verifyLedger(led).problems));
t('the committed ledger holds only the genesis planning record', led.entries.length === 1 && led.entries[0].artifact_type === 'planning_record' && led.entries[0].seq === 0 && led.entries[0].prev_digest === null && led.status === 'PLANNING_ONLY');
t('the genesis entry records every required field', ['created_by', 'artifact_type', 'version_identity', 'digest', 'timestamp', 'preconditions', 'evidence_status', 'required_human_role', 'limitation', 'release_gate_relation'].every((k) => k in led.entries[0]));
t('the genesis entry relates to no gate and claims no evidence', led.entries[0].release_gate_relation.effect === 'none' && led.entries[0].evidence_status === 'NOT_APPLICABLE');
const a = L.appendEntry(led, E());
t('a well-formed code entry appends, chained to the one before', a.ok && a.ledger.entries[1].prev_digest === led.entries[0].entry_digest && a.ledger.entries[1].seq === 1 && L.verifyLedger(a.ledger).ok);
t('appending returns a new ledger and leaves the given one unchanged', a.ok && led.entries.length === 1 && L.isAppendOnlyExtension(led, a.ledger));
for (const [type, role] of Object.entries(L.HUMAN_ROLE_ARTIFACTS)) for (const kind of ['code', 'test_fixture', 'generated'])
  t(type + ' created by ' + kind + ' is refused as role substitution', has(L.appendEntry(led, E({ artifact_type: type, created_by: { kind, identity: 'SYNTHETIC' }, required_human_role: role })), 'role_substitution', 'LED-04'));
t('a person-created owner authorization is structurally accepted (the person, not code, is the authority)', L.appendEntry(led, E({ artifact_type: 'owner_authorization', created_by: { kind: 'human', identity: 'SYNTHETIC-OWNER' }, required_human_role: 'owner', evidence_status: 'ASSERTED' })).ok);
t('a human-role artifact naming the wrong role is refused', has(L.appendEntry(led, E({ artifact_type: 'counsel_determination', created_by: { kind: 'human', identity: 'SYNTHETIC' }, required_human_role: 'owner' })), 'required_role_mismatch', 'LED-04'));
t('code cannot mark human-role evidence VERIFIED', has(L.appendEntry(led, E({ evidence_status: 'VERIFIED', required_human_role: 'counsel' })), 'code_verifies_human_evidence', 'LED-04'));
for (const s of L.EVIDENCE_STATUSES) t('evidence status ' + s + ' is a permitted value', L.appendEntry(led, E({ evidence_status: s })).ok);
t('an unknown evidence status is refused', has(L.appendEntry(led, E({ evidence_status: 'CONFIRMED' })), 'evidence_status_invalid', 'LED-03'));
t('an entry without a limitation is refused', has(L.appendEntry(led, E({ limitation: 'short' })), 'limitation_missing', 'LED-05'));
t('an entry that claims to advance a gate is refused', has(L.appendEntry(led, E({ release_gate_relation: { gates: ['RG-4'], effect: 'advances' } })), 'gate_relation_malformed', 'LED-06'));
t('an entry naming an unknown gate is refused', has(L.appendEntry(led, E({ release_gate_relation: { gates: ['RG-9'], effect: 'informs' } })), 'gate_relation_malformed', 'LED-06'));
t('an entry carrying a prohibited state is refused', has(L.appendEntry(led, E({ version_identity: 'VALI' + 'DATED' })), 'prohibited_state', 'LED-03'));
t('an unknown artifact type or extra field is refused', has(L.appendEntry(led, E({ artifact_type: 'evaluation_result' })), 'artifact_type_unknown') && has(L.appendEntry(led, E({ record_text: 'x' })), 'unexpected_field'));
t('a malformed timestamp is refused (the ledger reads no clock)', has(L.appendEntry(led, E({ timestamp: '7 October' })), 'timestamp_malformed'));
const two = L.appendEntry(a.ledger, E()).ledger;
const edited = clone(two); edited.entries[1].limitation += ' edited';
t('editing an earlier entry breaks the chain', !L.verifyLedger(edited).ok && L.verifyLedger(edited).problems.some((p) => p.code === 'entry_altered'));
const removed = clone(two); removed.entries.splice(1, 1);
t('removing an entry breaks the chain', !L.verifyLedger(removed).ok);
const reordered = clone(two); [reordered.entries[1], reordered.entries[2]] = [reordered.entries[2], reordered.entries[1]];
t('reordering entries breaks the chain', !L.verifyLedger(reordered).ok);
t('isAppendOnlyExtension rejects a rewrite and a truncation', !L.isAppendOnlyExtension(two, edited) && !L.isAppendOnlyExtension(two, removed));
t('appending to a tampered ledger is refused', !L.appendEntry(edited, E()).ok);
if (IN_REPO) {
  let atHead = null; try { atHead = JSON.parse(execFileSync('git', ['show', 'HEAD:tools/evaluation-readiness/ledger/future-run-ledger.json'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); } catch (e) {}
  t('the working ledger is an append-only extension of the ledger committed at HEAD', atHead === null || L.isAppendOnlyExtension(atHead, led));
}
done();
