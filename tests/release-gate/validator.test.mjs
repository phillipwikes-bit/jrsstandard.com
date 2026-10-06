// Release-gate validator: schema, gate rules, fault injection. Local only.
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { t, done, net, V, validateRecord, schemaErrors, SCHEMA, currentRecord, passingFixture, clone, gate, subc, ev, rejects, errorsOf, supportWith, addEvidence, ROOT, LIB } from './_helpers.mjs';
import { CANDIDATE_VERSION, PROMPT_VERSION, PROMPT_SHA256 } from '../../lib/engine-candidate/review-candidate.js';

const cur = currentRecord();
const fx = passingFixture();
const OPEN = ['NOT_ASSESSED', 'PENDING', 'BLOCKED'];

// ---- the current record is honest ----------------------------------------------------------------
const vc = validateRecord(cur, { expectEngineVersion: CANDIDATE_VERSION, expectPromptSha256: PROMPT_SHA256 });
t('current record is structurally valid', vc.valid, vc.errors.join('; '));
t('current record concludes INCOMPLETE_GATES_OPEN', vc.conclusion === 'INCOMPLETE_GATES_OPEN');
t('current record has all five gates, each open', V.GATE_IDS.every((id) => gate(cur, id) && OPEN.includes(gate(cur, id).status)));
t('no gate or sub-control in the current record is PASS', cur.gates.every((g) => g.status !== 'PASS' && g.sub_controls.every((s) => s.status !== 'PASS')));
t('current record names the candidate version and prompt actually in the code', cur.engine.engine_version === CANDIDATE_VERSION && cur.engine.prompt_version === PROMPT_VERSION && cur.engine.prompt_sha256 === PROMPT_SHA256);
const lastCandidateCommit = execFileSync('git', ['log', '-1', '--format=%H', '--', 'lib/engine-candidate/*.js'], { cwd: ROOT, encoding: 'utf8' }).trim();
t('current record names the commit that last changed the candidate source code (lib/engine-candidate/*.js)', cur.engine.candidate_source_commit === lastCandidateCommit, lastCandidateCommit);
t('current record creates no authorization of any kind', Object.values(cur.authorizations_created).every((x) => x === false));
t('current record holds only constructed, mocked, local or source-reported evidence', cur.evidence.every((e) => !V.EVIDENCE_CLASSES[e.evidence_class].production_evidence));
t('no owner decision, independent reviewer, result or evidence date is recorded on any gate', cur.gates.every((g) => g.owner_decision === null && g.independent_reviewer === null && g.actual_result === null && g.evidence_date === null));
t('the record says the candidate is a controlled development candidate, not that it is deficient', cur.package_limitations.some((l) => /controlled local-development candidate/.test(l) && /not findings that the candidate is defective/.test(l)));
let hashesOk = true; const bad = [];
for (const e of cur.evidence) {
  const m = /^git:([0-9a-f]{40}):(.+)$/.exec(e.reference);
  if (!m) { hashesOk = false; bad.push(e.evidence_id + ' not a git reference'); continue; }
  const body = execFileSync('git', ['show', m[1] + ':' + m[2]], { cwd: ROOT });
  const h = (await import('node:crypto')).createHash('sha256').update(body).digest('hex');
  if (h !== e.sha256) { hashesOk = false; bad.push(e.evidence_id); }
}
t('every evidence hash in the current record matches the referenced file at its pinned commit', hashesOk, bad.join(', '));
t('the CLI expect-version check refuses the current record for another Engine version', rejects(cur, /expected Engine version/, { expectEngineVersion: '0.6.0-local.1' }));

// ---- the rules can be met: the synthetic fixture passes ---------------------------------------------
const vf = validateRecord(fx);
t('synthetic all-pass fixture is accepted (PASS rules are satisfiable)', vf.valid && vf.conclusion === 'ALL_GATES_RECORDED_PASS', vf.errors.slice(0, 3).join('; '));

const partial = clone(fx); { const g = gate(partial, 'RG-5'); g.status = 'PENDING'; g.missing_dependencies = ['QA not yet performed']; }
const vp = validateRecord(partial);
t('four of five gates passing still concludes INCOMPLETE_GATES_OPEN', vp.valid && vp.conclusion === 'INCOMPLETE_GATES_OPEN', vp.errors.slice(0, 2).join('; '));

// ---- structural rejections --------------------------------------------------------------------------
const mut = (base, f) => { const r = clone(base); f(r); return r; };
t('rejects: omitted gate ID', rejects(mut(cur, (r) => { delete r.gates[2].gate_id; }), /missing required field gate_id/));
t('rejects: a missing required gate', rejects(mut(cur, (r) => { r.gates = r.gates.filter((g) => g.gate_id !== 'RG-3'); }), /required gate RG-3 is missing/));
t('rejects: an unrecognized gate ID', rejects(mut(cur, (r) => { r.gates[0].gate_id = 'RG-6'; }), /gate_id/));
t('rejects: a duplicate gate', rejects(mut(cur, (r) => { r.gates.push(clone(r.gates[0])); }), /duplicate gate RG-1/));
t('rejects: a missing sub-control', rejects(mut(cur, (r) => { gate(r, 'RG-2').sub_controls.splice(2, 1); }), /sub-control RG-2\.3 .* is missing/));
t('rejects: an unsupported schema version', rejects(mut(cur, (r) => { r.schema_version = 'jrs-release-gate-record/9.9.9'; }), /unsupported version/));
t('rejects: an unknown field', rejects(mut(cur, (r) => { r.gates[0].readiness = 'ready'; }), /unknown field readiness/));
t('rejects: the record presented as a public Manifest', rejects(mut(cur, (r) => { r.release_package.is_public_manifest = true; }), /is_public_manifest: must be false/));
for (const k of ['production', 'licensing', 'sale', 'evaluation', 'real_record_use']) t('rejects: an authorization created for ' + k, rejects(mut(cur, (r) => { r.authorizations_created[k] = true; }), new RegExp(k + ': must be false')));
for (const s of ['READY', 'ready', 'VALIDATED', 'APPROVED', 'PRODUCTION', 'LICENSED', 'SALE_READY', 'sale-ready', 'COMPLETE']) {
  t('rejects: gate status ' + s, rejects(mut(cur, (r) => { r.gates[1].status = s; }), /is not one of/));
}
t('rejects: a sub-control status outside the vocabulary', rejects(mut(cur, (r) => { r.gates[1].sub_controls[0].status = 'DONE'; }), /is not one of/));
t('rejects: a blank evidence hash', rejects(mut(cur, (r) => { r.evidence[0].sha256 = ''; }), /sha256: does not match/));
t('rejects: a malformed evidence hash (63 characters)', rejects(mut(cur, (r) => { r.evidence[0].sha256 = r.evidence[0].sha256.slice(1); }), /sha256: does not match/));
t('rejects: an uppercase evidence hash', rejects(mut(cur, (r) => { r.evidence[0].sha256 = r.evidence[0].sha256.toUpperCase(); }), /sha256: does not match/));
t('rejects: a placeholder hash of zeros', rejects(mut(cur, (r) => { r.evidence[0].sha256 = '0'.repeat(64); }), /placeholder/));
t('rejects: a malformed candidate commit', rejects(mut(cur, (r) => { r.engine.candidate_source_commit = 'afd6b44'; }), /candidate_source_commit: does not match/));
t('rejects: an unknown evidence class', rejects(mut(cur, (r) => { r.evidence[0].evidence_class = 'SELF_ATTESTED'; }), /evidence_class: "SELF_ATTESTED" is not one of/));
t('rejects: an undocumented provenance', rejects(mut(cur, (r) => { r.evidence[0].provenance = 'trusted'; }), /provenance/));
t('rejects: an evidence reference that is neither a pinned git path nor external', rejects(mut(cur, (r) => { r.evidence[0].reference = 'lib/retention/policy.js'; }), /reference: does not match/));
t('rejects: an impossible calendar date', rejects(mut(cur, (r) => { r.evidence[0].evidence_date = '2026-02-30'; }), /not a real calendar date/));
t('rejects: evidence dated after the record', rejects(mut(cur, (r) => { r.evidence[0].evidence_date = '2026-12-01'; }), /after the record date/));
t('rejects: an open gate that lists nothing missing', rejects(mut(cur, (r) => { r.gates[2].missing_dependencies = []; }), /must list what is missing/));
t('rejects: an open sub-control that lists nothing missing', rejects(mut(cur, (r) => { r.gates[2].sub_controls[0].missing_dependencies = []; }), /must list what is missing/));
t('rejects: a required gate recorded NOT_APPLICABLE', rejects(mut(cur, (r) => { r.gates[2].status = 'NOT_APPLICABLE'; }), /NOT_APPLICABLE is not permitted/));
t('rejects: a gate referencing unknown evidence', rejects(mut(cur, (r) => { r.gates[0].evidence_refs.push('E-777'); }), /unknown evidence E-777/));

// ---- fabricated PASS ------------------------------------------------------------------------------
t('rejects: a fabricated PASS (status flipped, nothing else)', rejects(mut(cur, (r) => { gate(r, 'RG-3').status = 'PASS'; gate(r, 'RG-3').missing_dependencies = []; }), /PASS needs actual_result/));
t('rejects: a fabricated sub-control PASS with no evidence', rejects(mut(cur, (r) => { const s = subc(r, 'RG-3.1'); s.status = 'PASS'; s.missing_dependencies = []; }), /PASS needs evidence/));
t('rejects: a PASS gate whose sub-control is still open', rejects(mut(fx, (r) => { const s = subc(r, 'RG-3.4'); s.status = 'PENDING'; s.missing_dependencies = ['x']; }), /PASS while sub-control RG-3\.4 is PENDING/));
for (const f of ['actual_result', 'evidence_date']) t('rejects: PASS without ' + f, rejects(mut(fx, (r) => { gate(r, 'RG-2')[f] = null; }), new RegExp('PASS needs ' + f)));
t('rejects: PASS without a limitation statement', rejects(mut(fx, (r) => { gate(r, 'RG-2').limitation_statement = ''; }), /limitation_statement: shorter than 1/));
t('rejects: PASS without an acceptance criterion', rejects(mut(fx, (r) => { delete gate(r, 'RG-2').acceptance_criterion; }), /missing required field acceptance_criterion/));
t('rejects: PASS without the required independent reviewer', rejects(mut(fx, (r) => { gate(r, 'RG-3').independent_reviewer = null; }), /PASS needs an independent_reviewer/));
t('rejects: the record author as the independent reviewer', rejects(mut(fx, (r) => { gate(r, 'RG-5').independent_reviewer.identity = r.record_author; }), /cannot be the record author/));
t('rejects: RG-1 PASS without per-condition results and uncertainty', rejects(mut(fx, (r) => { gate(r, 'RG-1').per_condition_results = []; }), /per_condition_results with uncertainty/));
t('rejects: a per-condition result resting on mocked evidence', rejects(mut(fx, (r) => { const id = addEvidence(r, 'MOCKED_TEST', 'test_output'); gate(r, 'RG-1').evidence_refs.push(id); gate(r, 'RG-1').per_condition_results[0].evidence_id = id; }), /must rest on independent labeling/));
t('rejects: PASS with gate evidence dated after the gate evidence date', rejects(mut(fx, (r) => { r.evidence[0].evidence_date = '2000-02-01'; }), /dated after the gate evidence_date/));
t('rejects: PASS that still lists missing dependencies', rejects(mut(fx, (r) => { gate(r, 'RG-2').missing_dependencies = ['still missing']; }), /PASS with missing dependencies/));

// ---- PASS on non-production evidence ---------------------------------------------------------------
t('rejects: PASS based only on constructed evidence', rejects(supportWith(clone(fx), 'RG-1.2', 'CONSTRUCTED_FIXTURE', 'constructed_dataset'), /can never pass a release gate/));
t('rejects: PASS based only on mocked evidence', rejects(supportWith(clone(fx), 'RG-1.4', 'MOCKED_TEST', 'test_output'), /can never pass a release gate/));
t('rejects: one valid and one invalid item on the same PASS sub-control', rejects(mut(fx, (r) => { const id = addEvidence(r, 'MOCKED_TEST', 'test_output'); gate(r, 'RG-1').evidence_refs.push(id); subc(r, 'RG-1.2').evidence_refs.push(id); }), /E-9\d\d is MOCKED_TEST, which cannot satisfy/));

// ---- owner authorization before prerequisites --------------------------------------------------------
t('rejects: owner release authorization while RG-2 is open', rejects(mut(fx, (r) => { const g = gate(r, 'RG-2'); g.status = 'BLOCKED'; g.missing_dependencies = ['x']; }), /owner release authorization refused: prerequisite RG-2/));
t('rejects: owner release authorization recorded on the current record', rejects(mut(cur, (r) => { const id = addEvidence(r, 'OWNER_AUTHORIZATION', 'signed_authorization'); gate(r, 'RG-4').evidence_refs.push(id); gate(r, 'RG-4').owner_decision = { decision: 'release_authorized', decided_by: 'Owner', decision_date: '2026-10-06', evidence_id: id }; }), /owner release authorization refused: prerequisite RG-1, RG-2, RG-3/));
t('rejects: owner release authorization when a prerequisite PASS is itself invalid', rejects(mut(fx, (r) => { gate(r, 'RG-1').independent_reviewer = null; }), /owner release authorization refused: prerequisite RG-1/));
t('rejects: RG-5 PASS before RG-4 has passed', rejects(mut(fx, (r) => { const g = gate(r, 'RG-4'); g.status = 'PENDING'; g.missing_dependencies = ['x']; }), /RG-5: PASS while prerequisite RG-4/));
t('rejects: release_authorized recorded on a gate other than RG-4', rejects(mut(fx, (r) => { const id = gate(r, 'RG-4').owner_decision.evidence_id; gate(r, 'RG-3').owner_decision = { decision: 'release_authorized', decided_by: 'Fixture Owner', decision_date: '2000-01-31', evidence_id: id }; gate(r, 'RG-3').evidence_refs.push(id); }), /only recorded on RG-4/));
t('rejects: an owner decision resting on non-owner evidence', rejects(mut(fx, (r) => { gate(r, 'RG-4').owner_decision.evidence_id = gate(r, 'RG-3').evidence_refs[0]; }), /must rest on OWNER_AUTHORIZATION evidence/));
t('rejects: RG-4 PASS without a release_authorized decision', rejects(mut(fx, (r) => { gate(r, 'RG-4').owner_decision = null; }), /PASS needs an owner_decision of release_authorized/));

// ---- copied between Engine versions ---------------------------------------------------------------------
t('rejects: a record copied to another Engine version (top-level identity changed only)', rejects(mut(fx, (r) => { r.engine.engine_version = 'fixture-engine-0.0.1'; }), /a gate record cannot be copied between versions/));
t('rejects: a copied record whose gates were edited but whose evidence still names the old version', rejects(mut(fx, (r) => { r.engine.engine_version = 'fixture-engine-0.0.1'; r.gates.forEach((g) => { g.engine_version = 'fixture-engine-0.0.1'; }); }), /applies to Engine fixture-engine-0\.0\.0, not fixture-engine-0\.0\.1/));
t('rejects: a record copied to another source commit', rejects(mut(fx, (r) => { r.engine.candidate_source_commit = 'a'.repeat(40); }), /names source commit/));
t('rejects: a record whose prompt identity differs from the Engine prompt', rejects(mut(fx, (r) => { gate(r, 'RG-1').prompt_identity.prompt_sha256 = 'b'.repeat(64); }), /prompt_identity does not match/));

// ---- fail-closed schema checker -------------------------------------------------------------------------
const extra = clone(SCHEMA); extra.properties.as_of = { $ref: '#/$defs/date', format: 'date' };
t('schema checker fails closed on a keyword it does not implement', schemaErrors(cur, extra).some((e) => /unsupported keyword format/.test(e)));
t('schema status vocabulary equals the controlled vocabulary exactly', JSON.stringify(SCHEMA.$defs.status.enum) === JSON.stringify(V.STATUSES));
t('schema evidence classes equal the controlled vocabulary exactly', JSON.stringify(SCHEMA.$defs.evidence_item.properties.evidence_class.enum) === JSON.stringify(Object.keys(V.EVIDENCE_CLASSES)));
t('schema provenances and artifact kinds equal the vocabulary exactly', JSON.stringify(SCHEMA.$defs.evidence_item.properties.provenance.enum) === JSON.stringify(V.PROVENANCES) && JSON.stringify(SCHEMA.$defs.evidence_item.properties.artifact_kind.enum) === JSON.stringify(V.ARTIFACT_KINDS));
t('schema gate IDs equal the defined gates exactly', JSON.stringify(SCHEMA.$defs.gate.properties.gate_id.enum) === JSON.stringify(V.GATE_IDS));
t('no readiness word is a permitted status', V.STATUSES.every((s) => !/READY|VALID|APPROV|PRODUCTION|LICENS|SALE/i.test(s)));

// ---- isolation ------------------------------------------------------------------------------------------
const src = readdirSync(LIB).filter((f) => /\.(js|mjs)$/.test(f)).map((f) => readFileSync(LIB + f, 'utf8')).join('\n');
t('package source imports no network, process or child-process module', !/from ['"]node:(http|https|net|tls|dgram|dns|child_process|worker_threads)['"]/.test(src));
t('package source reads no environment variable and calls no fetch', !/process\.env|\bfetch\s*\(/.test(src));
t('validator and report never attempted a network call', net.calls === 0);

done();
