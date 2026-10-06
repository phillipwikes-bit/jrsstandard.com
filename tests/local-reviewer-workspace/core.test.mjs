// Core logic: packet integrity, version binding, dispositions, sign-off and export. Local only.
import { createHash } from 'node:crypto';
import { t, done, C, P, RECORD, GAPS, clone, quotations, signedSession, net } from './_helpers.mjs';
import { canonicalJson as candidateCanonical } from '../../lib/engine-candidate/contract.js';
import { sha256 as candidateSha } from '../../lib/engine-candidate/source-prep.js';

// ---- the workspace's own SHA-256 and canonical JSON agree with the candidate's ------------------
const samples = ['', 'abc', 'The quick brown fox', 'é ünïcode “quotes” 𝄞', 'x'.repeat(10000), RECORD, GAPS, '\n\t\r'];
t('SHA-256 agrees with node:crypto and the candidate on every sample', samples.every((s) => C.sha256(s) === createHash('sha256').update(s, 'utf8').digest('hex') && C.sha256(s) === candidateSha(s)));
t('SHA-256 of the empty string is the FIPS value', C.sha256('') === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
t('canonical JSON agrees with the candidate contract on every packet', Object.values(P).every((p) => C.canonicalJson(p) === candidateCanonical(p)));

// ---- valid packets open, in three separate sections -----------------------------------------
for (const [name, p] of Object.entries(P)) {
  const v = C.verifyPacket(p);
  t('opens the ' + name + ' packet', v.ok, v.problems.join('; '));
}
t('opens with the source text and checks every anchor against it', C.verifyPacket(P.gaps, { sourceText: GAPS }).source_text_checked === true);
const secs = (p) => [...new Set(C.listFindings(p).map((f) => f.section))].sort().join();
t('deterministic findings, candidate findings and model-output checks are listed in separate sections', secs(P.gaps).includes('source_preparation') && secs(P.withheld).includes('model_output_checks') && C.listFindings(P.withheld).every((f) => (f.section === 'candidate_prompts') === f.id.startsWith('C-')));
t('the packet identity exposes metadata only, no quotation or note', !quotations(P.gaps).some((q) => JSON.stringify(C.verifyPacket(P.gaps).identity).includes(q)));

// ---- refusals ----------------------------------------------------------------------------------
const mut = (p, f) => { const c = clone(p); f(c); return c; };
const refused = (p, re, opts) => { const v = C.verifyPacket(p, opts); return !v.ok && v.problems.some((x) => re.test(x)); };
t('refuses: not an object', refused(['x'], /not a JSON object/) && refused(null, /not a JSON object/));
t('refuses: unsupported packet version', refused(mut(P.flaws, (p) => { p.packet_version = 'jrs-candidate-reviewer-packet/9.0.0'; }), /packet_version: unsupported/));
t('refuses: a missing section', refused(mut(P.flaws, (p) => { delete p.model_output_checks; }), /missing model_output_checks/));
t('refuses: an unexpected top-level field (for example a score)', refused(mut(P.flaws, (p) => { p.score = 3; }), /unexpected field score/));
t('refuses: an unexpected field in the identity', refused(mut(P.flaws, (p) => { p.review_identity.verdict = 'approved'; }), /unexpected field verdict/));
t('refuses: human review not required', refused(mut(P.flaws, (p) => { p.status.human_review_required = false; }), /human review must be required/));
t('refuses: unsupported result contract', refused(mut(P.flaws, (p) => { p.review_identity.contract_version = 'jrs-candidate-result/0.1.0'; }), /contract_version: unsupported/));
t('refuses: a cross-version packet (identity says another candidate version)', refused(mut(P.flaws, (p) => { p.review_identity.candidate_version = '0.4.0-local.1'; }), /review_id does not match the identity/));
t('refuses: a cross-version packet (another prompt)', refused(mut(P.flaws, (p) => { p.review_identity.prompt_version = 'candidate-prompt/0.3.0'; }), /review_id does not match/));
t('refuses: a disposition history entry from another review version', refused(mut(P.flaws, (p) => { p.disposition.history.push({ finding_id: 'C-001', review_id: 'a'.repeat(24), disposition: 'confirmed' }); }), /belongs to another review version/));
t('refuses: a history entry naming an unknown finding', refused(mut(P.flaws, (p) => { p.disposition.history.push({ finding_id: 'C-999', review_id: p.review_identity.review_id }); }), /unknown finding/));
t('refuses: an altered packet (history changed, packet_id no longer matches)', refused(mut(P.flaws, (p) => { p.sign_off.status = 'signed'; p.disposition.pending = []; }), /packet_id: does not match/));
t('refuses: an altered result digest', refused(mut(P.flaws, (p) => { p.result_digest = 'b'.repeat(64); }), /packet_id: does not match/));
t('refuses: a malformed result digest', refused(mut(P.flaws, (p) => { p.result_digest = 'xyz'; }), /result_digest: malformed/));
t('refuses: signed while findings are pending', refused(mut(P.flaws, (p) => { p.sign_off.status = 'signed'; }), /signed while findings are pending/));
t('refuses: duplicate finding identifiers', refused(mut(P.flaws, (p) => { p.model_findings.findings.push(clone(p.model_findings.findings[0])); }), /duplicate identifiers/));
t('refuses: a finding identifier in the wrong section', refused(mut(P.gaps, (p) => { p.deterministic_findings[0].id = 'C-900'; }), /wrong section/));
t('refuses: an explanation that asserts a Codebook correspondence', refused(mut(P.flaws, (p) => { p.model_findings.findings[0].explanation.codebook_correspondence = 'Evidentiary Sufficiency'; }), /no Codebook correspondence/));
const flawIdx = (p) => p.model_findings.findings.findIndex((f) => f.kind === 'flaw');
t('refuses: an anchor that does not align with its quotation (no source text)', refused(mut(P.flaws, (p) => { p.model_findings.findings[flawIdx(p)].anchors[0].end += 1; }), /does not align with its quotation/));
t('refuses: an anchor outside the source', refused(mut(P.flaws, (p) => { const a = p.model_findings.findings[flawIdx(p)].anchors[0]; const L = a.end - a.start; a.start = 5000; a.end = 5000 + L; }), /outside the source/));
t('refuses: a quotation edited so it no longer matches the source (with source text)', refused(mut(P.flaws, (p) => { const f = p.model_findings.findings[flawIdx(p)]; f.quotation = f.quotation.slice(0, -1) + '?'; }), /does not slice to its quotation/, { sourceText: RECORD }));
t('refuses: a deterministic anchor shifted by one character (with source text)', refused(mut(P.gaps, (p) => { const f = p.deterministic_findings.find((x) => x.anchor); f.anchor.start += 1; f.anchor.end += 1; }), /does not slice to its quotation/, { sourceText: GAPS }));
t('refuses: a flaw with no anchors', refused(mut(P.flaws, (p) => { p.model_findings.findings[flawIdx(p)].anchors = []; }), /quotation or anchors missing/));
t('refuses: source text that is not the packet source', refused(P.flaws, /does not match the packet source hash/, { sourceText: GAPS }));
const allProblems = [mut(P.flaws, (p) => { p.model_findings.findings[flawIdx(p)].quotation += 'x'; }), mut(P.gaps, (p) => { p.deterministic_findings[0].anchor.end += 2; })].flatMap((p) => C.verifyPacket(p, { sourceText: RECORD }).problems).join(' ');
t('refusal messages never contain packet quotation text', allProblems.length > 0 && !quotations(P.flaws).concat(quotations(P.gaps)).some((q) => q.length > 4 && allProblems.includes(q)));

// ---- dispositions -------------------------------------------------------------------------------
const s = C.createSession(P.gaps);
const base = (over) => ({ finding_id: 'X-001', review_id: s.identity.review_id, packet_digest: s.identity.packet_digest, disposition: 'NEEDS_CLARIFICATION', note: '', acknowledged: true, ...over });
const throws = (f, re) => { try { f(); return false; } catch (e) { return re.test(e.message); } };
t('a session starts with every finding at NO_DISPOSITION', Object.values(s.dispositions).every((d) => d.disposition === 'NO_DISPOSITION'));
t('a session holds no reviewer identity until the reviewer enters one', s.reviewer_reference === '' && s.review_date === '');
t('the session does not change the packet', C.packetDigest(P.gaps) === s.identity.packet_digest);
t('refuses: a disposition naming another review ID', throws(() => C.setDisposition(s, base({ review_id: 'c'.repeat(24) })), /review_version_mismatch/));
t('refuses: a disposition naming another packet digest', throws(() => C.setDisposition(s, base({ packet_digest: C.packetDigest(P.flaws) })), /packet_mismatch/));
const twin = C.createSession(P.withheld);
t('refuses: a disposition from a packet with the same review ID but different content', twin.identity.review_id === C.createSession(P.flaws).identity.review_id && throws(() => C.setDisposition(C.createSession(P.flaws), { ...base(), finding_id: 'C-001', review_id: twin.identity.review_id, packet_digest: twin.identity.packet_digest }), /packet_mismatch/));
t('refuses: an unknown finding', throws(() => C.setDisposition(s, base({ finding_id: 'X-999' })), /unknown_finding/));
for (const bad of ['APPROVED', 'READY', 'COMPLIANT', 'DEFENSIBLE', 'confirmed']) t('refuses: disposition value ' + bad, throws(() => C.setDisposition(s, base({ disposition: bad })), /invalid_disposition/));
t('refuses: a disposition without the packet-binding acknowledgement', throws(() => C.setDisposition(s, base({ acknowledged: false })), /acknowledgement_required/));
t('refuses: a note longer than 2,000 characters', throws(() => C.setDisposition(s, base({ note: 'n'.repeat(2001) })), /note_too_long/));
C.setDisposition(s, base());
t('records a permitted disposition', s.dispositions['X-001'].disposition === 'NEEDS_CLARIFICATION');

// ---- sign-off ------------------------------------------------------------------------------------
t('sign-off is blocked while any finding has no disposition', C.signOffBlockers(s).some((b) => /without a disposition/.test(b)) && throws(() => C.signOff(s, true), /sign_off_blocked/));
const s2 = C.createSession(P.gaps);
for (const id of Object.keys(s2.dispositions)) C.setDisposition(s2, { finding_id: id, review_id: s2.identity.review_id, packet_digest: s2.identity.packet_digest, disposition: 'OUT_OF_SCOPE', note: '', acknowledged: true });
t('sign-off is blocked without a reviewer reference and date', throws(() => C.signOff(s2, true), /reviewer reference/));
C.setReviewer(s2, 'Synthetic Reviewer', '2026-02-30');
t('sign-off is blocked with an impossible date', throws(() => C.signOff(s2, true), /YYYY-MM-DD/));
C.setReviewer(s2, 'Synthetic Reviewer', '2026-10-06');
const lastId = Object.keys(s2.dispositions).pop();
C.setDisposition(s2, { finding_id: lastId, review_id: s2.identity.review_id, packet_digest: s2.identity.packet_digest, disposition: 'NO_DISPOSITION', note: '', acknowledged: false });
t('sign-off is blocked when one finding is reset to NO_DISPOSITION', throws(() => C.signOff(s2, true), /1 finding without a disposition/));
C.setDisposition(s2, { finding_id: lastId, review_id: s2.identity.review_id, packet_digest: s2.identity.packet_digest, disposition: 'OUT_OF_SCOPE', note: '', acknowledged: true });
t('sign-off is refused without confirming the statement', throws(() => C.signOff(s2, false), /acknowledgement_required/));
t('export is refused before sign-off', throws(() => C.buildExport(s2), /not_signed_off/));
C.signOff(s2, true);
t('sign-off succeeds once every finding has a disposition', s2.signed_off === true);
t('no disposition can change after sign-off', throws(() => C.setDisposition(s2, { finding_id: lastId, review_id: s2.identity.review_id, packet_digest: s2.identity.packet_digest, disposition: 'NOT_CONFIRMED', note: '', acknowledged: true }), /signed_off/));

// ---- export -------------------------------------------------------------------------------------
const ex = C.buildExport(s2);
t('the export carries every required field', ['export_format', 'packet', 'reviewer', 'review_date', 'dispositions', 'sign_off', 'limitation', 'export_digest'].every((k) => k in ex) && ex.packet.review_id && ex.packet.packet_digest && ex.packet.candidate_version && ex.packet.source_sha256);
t('the export carries the required limitation statement exactly', ex.limitation === 'This is a reviewer-created local disposition record. It is bound to the identified packet and version. It does not authenticate the reviewer, establish legal validity, establish semantic correctness, or authorize production use.');
t('the reviewer is marked self-entered and not authenticated', ex.reviewer.self_entered === true && ex.reviewer.authenticated === false);
t('the export digest is the digest of the record without it', ex.export_digest === C.sha256(C.canonicalJson((({ export_digest, ...r }) => r)(ex))));
const exText = JSON.stringify(ex);
t('the export holds no quotation and no source text', !quotations(P.gaps).some((q) => exText.includes(q)) && !GAPS.split('\n').filter((l) => l.length > 20).some((l) => exText.includes(l)));
t('the export holds no score, verdict or readiness field', !/"(score|verdict|ready|approved|compliant|defensible|rating)"/i.test(exText));
t('verifies a genuine export against its packet', C.verifyExport(ex, P.gaps).ok, C.verifyExport(ex, P.gaps).problems.join('; '));
const vfail = (rec, packet, re) => { const v = C.verifyExport(rec, packet); return !v.ok && v.problems.some((p) => re.test(p)); };
t('rejects: an export verified against another packet', vfail(ex, P.flaws, /does not match the packet/));
const exFlaws = C.buildExport(signedSession(P.flaws));
t('rejects: an export from a same-review-ID packet with different content', vfail(exFlaws, P.withheld, /result_digest: does not match|packet_digest: does not match/));
t('rejects: an altered disposition', vfail(((r) => { r.dispositions[0].disposition = 'CONFIRMED_FOR_FURTHER_REVIEW'; return r; })(clone(ex)), P.gaps, /export_digest: does not match/));
t('rejects: an altered disposition with its digest recomputed (cross-version review ID)', vfail(((r) => { r.dispositions[0].review_id = 'd'.repeat(24); const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /belongs to another review version/));
t('rejects: a changed packet digest with its digest recomputed', vfail(((r) => { r.packet.packet_digest = 'e'.repeat(64); const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /packet_digest: does not match/));
t('rejects: a missing finding', vfail(((r) => { r.dispositions.pop(); const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /no disposition for/));
t('rejects: a NO_DISPOSITION entry', vfail(((r) => { r.dispositions[0].disposition = 'NO_DISPOSITION'; const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /not a completed disposition/));
t('rejects: an altered limitation statement', vfail(((r) => { r.limitation = 'Approved for production.'; const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /limitation: missing or altered/));
t('rejects: a reviewer marked authenticated', vfail(((r) => { r.reviewer.authenticated = true; const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /self-entered, unauthenticated/));
t('rejects: an extra field such as a score', vfail(((r) => { r.score = 4; return r; })(clone(ex)), P.gaps, /unexpected field score/));
t('rejects: a malformed export', vfail({ export_format: 'x' }, P.gaps, /missing/) && vfail('not an object', P.gaps, /not an object/));
t('rejects: an unsupported export format', vfail(((r) => { r.export_format = 'jrs-local-disposition-record/9.0.0'; const { export_digest, ...rest } = r; r.export_digest = C.sha256(C.canonicalJson(rest)); return r; })(clone(ex)), P.gaps, /export_format: unsupported/));
t('core made no network call', net.calls === 0);
done();
