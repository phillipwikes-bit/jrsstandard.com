// Capability matrix, evidence record (JSON and Markdown), replay protocol, and the release-gate
// record: nothing claims more than exact replay, and no gate is advanced.
import { t, done, read, json, exists, V } from './_helpers.mjs';

const MX = read(V.MATRIX);
t('the capability matrix uses exactly the required header', MX.includes(V.MATRIX_HEADER + '\n|---|---|---|---|---|'));
const rows = MX.split('\n').filter((l) => /^\| /.test(l) && l !== V.MATRIX_HEADER).map((l) => l.slice(2, -2).split(' | '));
t('the matrix has every required capability row', V.MATRIX_ROWS.every((n) => rows.some((r) => r[0] === n)) && V.MATRIX_ROWS.length === 11);
for (const r of rows) {
  t('matrix row "' + r[0] + '" names its synthetic case and what the replay shows', r.length === 5 && r[1].length > 5 && r[2].length > 20);
  t('matrix row "' + r[0] + '" states what it does not show', V.MATRIX_LIMITS.some((l) => r[3].toLowerCase().includes(l)));
  t('matrix row "' + r[0] + '" carries no release state', !/\bPASS(?:ED)?\b|\bready\b|approved|validated|released\b/i.test(r[4]));
}
for (const l of V.MATRIX_LIMITS) t('the matrix states "' + l + '"', MX.toLowerCase().includes(l));
t('the release-gate row says the gates are not advanced', /\| Release-gate status \|[^\n]*\| Not advanced: RG-1 to RG-5 remain open \|/.test(MX));

const E = json(V.EVIDENCE);
t('the evidence record names this package and status', E.package_id === 'JRS-FROZEN-DEMO-20261007-PR39' && E.status === V.STATUS);
const S = E.statements;
t('evidence: all cases synthetic, all output mocked or local', S.all_cases_synthetic === true && S.all_output_mocked_or_local === true);
t('evidence: repeatable only within its fixed local configuration', S.repeatable_only_within_fixed_local_configuration === true);
t('evidence: not independent evaluation and not a sealed holdout', S.independent_evaluation === false && S.sealed_holdout === false);
t('evidence: no release gate advanced and no owner release decision recorded', Array.isArray(S.release_gates_advanced) && S.release_gates_advanced.length === 0 && S.owner_release_decision_recorded === false && E.owner_decision === null);
t('evidence: no public or customer demonstration, no real record, no provider call', S.public_or_customer_demonstration_occurred === false && S.real_records_processed === false && S.provider_calls_made === false);
t('evidence: what the replay shows is limited to exact replay of the fixed local package', /^Exact replay of the fixed local package/.test(E.what_the_replay_shows));
t('evidence: no claim that the demonstration proves anything', !/\bprove[sd]?\b/i.test(JSON.stringify(E)));
const EM = read('docs/architecture/FROZEN_DEMONSTRATION_EVIDENCE_RECORD.md');
t('the evidence record document states every required point', ['All cases are synthetic', 'All output is mocked or local', 'Only within its fixed local configuration', 'Independent evaluation | No', 'Sealed holdout | No', 'Release gates advanced | None', 'Owner release decision recorded | No', 'Public or customer demonstration | None has occurred'].every((p) => EM.includes(p)));
t('the evidence record document claims no proof', !/\bprove[sd]?\b/i.test(EM));
t('the evidence record document lists the frozen packet digests', E.cases.every((c) => EM.includes(c.expected_digests.packet_digest.slice(0, 16))));
const PR = read('docs/architecture/FROZEN_DEMONSTRATION_REPLAY_PROTOCOL.md');
t('the replay protocol names the status and says it is not a release', PR.includes(V.STATUS) && /not a public demonstration, a pilot, a production deployment or a release authorization/.test(PR));
for (const f of [V.MATRIX, 'docs/architecture/FROZEN_DEMONSTRATION_EVIDENCE_RECORD.md', 'docs/architecture/FROZEN_DEMONSTRATION_REPLAY_PROTOCOL.md', 'tools/frozen-demo/README.md']) {
  t(f + ' uses no em dash and no prohibited status', exists(f) && !/—/.test(read(f)) && V.PROHIBITED_STATUSES.every((s) => !new RegExp('(?<!NOT )\\b' + s + '\\b').test(read(f))));
  t(f + ' uses no promotional or certainty wording', !/\b(guaranteed|eliminates|prevents|court-proof|liability-proof|industry standard|enterprise-grade|next-generation|production-ready|proven)\b/i.test(read(f)));
}

// The release-gate record: no gate passes, no authorization, and the package is recorded as not satisfying any gate.
const RG = json(V.RELEASE_GATE_RECORD);
t('no release gate or sub-control is PASS', RG.gates.every((g) => g.status !== 'PASS' && (g.sub_controls || []).every((s) => s.status !== 'PASS')));
t('the gate statuses are unchanged: RG-1 BLOCKED, RG-2 BLOCKED, RG-3 NOT_ASSESSED, RG-4 BLOCKED, RG-5 BLOCKED', RG.gates.map((g) => g.gate_id + '=' + g.status).join() === 'RG-1=BLOCKED,RG-2=BLOCKED,RG-3=NOT_ASSESSED,RG-4=BLOCKED,RG-5=BLOCKED');
t('the release-gate record creates no authorization', Object.values(RG.authorizations_created).every((v) => v === false));
const rep = read('docs/architecture/CURRENT_RELEASE_GATE_REPORT.md');
t('the release-gate report notes the package and that it satisfies no gate', /frozen synthetic demonstration package/i.test(rep) && /does not satisfy the independent holdout, operator-control, counsel, owner-authorization or independent production-QA gates/.test(rep));
t('the release-gate report still concludes that every gate is open', /\*\*INCOMPLETE_GATES_OPEN\.\*\*/.test(rep));
done();
