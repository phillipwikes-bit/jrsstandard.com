// Reviewer packet generator: mocked tests. Added 2026-10-06.
import { t, done, fixture, net, PROFILE, IDS, NOW, cond, reply, rawReply, scoreAudit } from './_harness.mjs';
import { runCandidate } from '../../lib/engine-candidate/review-candidate.js';
import { recordDisposition, signOff, canonicalJson } from '../../lib/engine-candidate/contract.js';
import { sha256 } from '../../lib/engine-candidate/source-prep.js';
import { buildReviewerPacket, PACKET_VERSION } from '../../lib/engine-candidate/reviewer-packet.js';
import { createMockAdapter } from '../../lib/engine-candidate/mock-adapter.js';
import { toAdapterOutput } from './_harness.mjs';

const GAPS = fixture('SYNTHETIC-SAE-03-GAPS.txt');
const RECORD = fixture('SYNTHETIC-SAE-01.txt');
const good = { conditions: { ...cond('pass', 'Stated.'), basis_identification: { status: 'gap', note: 'The basis rests on a call.' } },
  flaws: [{ type: 'unsupported_content', excerpt: 'As discussed on the call, the agreement will follow.', explanation: 'The commitment rests on an unrecorded call.' }],
  revision_needed: 'State what was agreed and where it is recorded.' };
const run = (text, adapter = reply(good), extra = {}) => runCandidate({ text, profile: PROFILE, record_ref: 'PKT-1', ...extra }, { adapter, now: NOW });
const throws = (fn, re) => { try { fn(); return false; } catch (e) { return re.test(e.message); } };

const r = await run(GAPS);
const before = JSON.stringify(r);
const p = buildReviewerPacket(r, GAPS);
t('packet declares its version and its standing', p.packet_version === PACKET_VERSION && p.status.human_review_required === true && p.status.standing === 'LOCAL CANDIDATE, NOT VALIDATED');
t('packet carries the review identity, result digest, record reference and source-preparation status',
  p.review_identity.review_id === r.review_identity.review_id && p.result_digest === r.result_digest && p.record_ref === 'PKT-1' && p.source_preparation.result_status === 'examined' && p.source_preparation.version === 'source-prep/0.3.0');

// ---- no record mutation -------------------------------------------------------------------------
t('building a packet never changes the result', JSON.stringify(r) === before);
const frozen = JSON.parse(before); (function f(o) { Object.freeze(o); Object.values(o).forEach((v) => v && typeof v === 'object' && f(v)); })(frozen);
t('a deep-frozen result builds a packet without error', buildReviewerPacket(frozen, GAPS).packet_id === p.packet_id);
t('the packet does not carry the full record text', !JSON.stringify(p).includes(GAPS.trim()));

// ---- no hidden model output ------------------------------------------------------------------------
t('every model finding in the result is in the packet', p.model_findings.findings.length === r.contextual_findings.findings.length &&
  r.contextual_findings.findings.every((f) => p.model_findings.findings.some((x) => x.id === f.id)));
t('every deterministic finding is in the packet, separate from model findings',
  p.deterministic_findings.length === r.extraction_findings.filter((f) => f.origin === 'source_prep').length && p.deterministic_findings.every((f) => f.id.startsWith('X-')) && p.model_findings.findings.every((f) => f.id.startsWith('C-')));
t('all five condition statuses are shown, including passes', Object.keys(p.model_findings.conditions).length === 5);
t('the model revision note is shown and labelled as not a recommendation', /Not a recommendation/.test(p.model_findings.model_revision_note.standing));
const withheld = await run(GAPS, reply({ ...good, conditions: { ...good.conditions, basis_identification: { status: 'gap', note: 'The lead deliberately avoided the call.' } } }));
const pw = buildReviewerPacket(withheld, GAPS);
t('a withheld model note is shown as a model-output check, not hidden', pw.model_output_checks.some((c) => c.code === 'withheld_prohibited_inference' && c.groups.includes('intent')));
const rejected = await run(GAPS, rawReply('{"broken":'));
const pr = buildReviewerPacket(rejected, GAPS);
t('a rejected model output is shown with its reasons', pr.model_output_checks.some((c) => c.code === 'adapter_output_rejected' && c.rejection_codes.includes('not_json')) && pr.model_findings.findings.length === 0);
t('the packet names the model findings as mocked', /mocked model/.test(p.model_findings.origin));

// ---- quote anchors ---------------------------------------------------------------------------------
const flaw = p.model_findings.findings.find((f) => f.kind === 'flaw');
t('every model quotation has anchors that slice back to it exactly', flaw.anchors.length === 1 && flaw.anchors.every((a) => GAPS.slice(a.start, a.end) === flaw.quotation));
t('every deterministic quotation has an anchor that slices back to it exactly', p.deterministic_findings.filter((f) => f.quotation !== undefined).every((f) => GAPS.slice(f.anchor.start, f.anchor.end) === f.quotation));
t('absence findings say why they have no quotation', p.deterministic_findings.filter((f) => f.quotation === undefined).every((f) => /no quotation to anchor/.test(f.anchor_note)));
t('the packet refuses a source text that is not the one examined', throws(() => buildReviewerPacket(r, GAPS + ' '), /source_text_mismatch/));
const tampered = JSON.parse(before); tampered.contextual_findings.findings.find((f) => f.kind === 'flaw').locations[0].start += 1;
t('the packet refuses a result whose anchor was altered (integrity check)', throws(() => buildReviewerPacket(tampered, GAPS), /result_integrity_failed/));
// Re-sealing: result_digest is not authentication, so anyone can recompute it after an edit. The anchor
// check must then still catch a shifted quotation on its own, independent of the integrity check.
const reseal = (x) => { x.result_digest = sha256(canonicalJson({ review_identity: x.review_identity, record_ref: x.record_ref, status: x.status, source: x.source,
  extraction_findings: x.extraction_findings, contextual_findings: x.contextual_findings })); return x; };
const resealed = reseal(JSON.parse(before)); resealed.contextual_findings.findings.find((f) => f.kind === 'flaw').locations[0].start += 1; reseal(resealed);
t('a re-sealed result with a shifted model quotation is still refused by the anchor check', throws(() => buildReviewerPacket(resealed, GAPS), /quote_anchor_mismatch/));
const resealed2 = JSON.parse(before); resealed2.extraction_findings.find((f) => f.matched !== undefined).location.end += 2; reseal(resealed2);
t('a re-sealed result with a shifted deterministic quotation is still refused', throws(() => buildReviewerPacket(resealed2, GAPS), /quote_anchor_mismatch/));
const resealed3 = JSON.parse(before); delete resealed3.contextual_findings.findings.find((f) => f.kind === 'flaw').quotation; reseal(resealed3);
t('a re-sealed result with a quotation removed is refused (no missing quote anchor)', throws(() => buildReviewerPacket(resealed3, GAPS), /quote_anchor_missing/));
t('every finding has an explanation and a reviewer question', p.deterministic_findings.concat(p.model_findings.findings).every((f) => f.explanation && f.explanation.reviewer_question));

// ---- disposition and sign-off ----------------------------------------------------------------------
t('pending items are listed and sign-off is not permitted while any are pending', p.disposition.pending.length > 0 && p.sign_off.permitted_now === false && p.sign_off.status === 'not_signed');
let all = r;
for (const id of Object.keys(r.human_review.disposition.items)) all = recordDisposition(all, { review_id: r.review_identity.review_id, finding_id: id, decision: 'confirmed', reviewer: 'Reviewer A', at: '2026-10-06T10:00:00Z' });
const pa = buildReviewerPacket(all, GAPS);
t('the full disposition history is carried, per finding and overall', pa.disposition.history.length === Object.keys(r.human_review.disposition.items).length && pa.deterministic_findings[0].disposition.history.length === 1);
t('sign-off becomes permitted only when nothing is pending', pa.disposition.pending.length === 0 && pa.sign_off.permitted_now === true);
const forged = JSON.parse(JSON.stringify(r)); forged.human_review.sign_off.status = 'signed';
t('a result showing sign-off while items are pending is refused', throws(() => buildReviewerPacket(forged, GAPS), /sign_off_with_pending_items/));
const signed = signOff(all, { review_id: r.review_identity.review_id, reviewer: 'Reviewer A', at: '2026-10-06T11:00:00Z', statement: 'Reviewed every item.' });
t('a signed result shows sign-off and permits no further sign-off', buildReviewerPacket(signed, GAPS).sign_off.status === 'signed' && buildReviewerPacket(signed, GAPS).sign_off.permitted_now === false);

// ---- packet identity follows the review version ----------------------------------------------------
const otherIds = { ...IDS, model_version: '1' };
const r2 = await runCandidate({ text: GAPS, profile: PROFILE, record_ref: 'PKT-1' }, { adapter: createMockAdapter({ ...otherIds, respond: () => toAdapterOutput(good, otherIds) }), now: NOW });
t('the packet identity changes when the review version changes', buildReviewerPacket(r2, GAPS).packet_id !== p.packet_id && r2.review_identity.review_id !== r.review_identity.review_id);
t('the packet identity changes when a disposition is recorded', pa.packet_id !== p.packet_id);
t('the same result gives the same packet identity', buildReviewerPacket(r, GAPS).packet_id === p.packet_id);
const mixed = JSON.parse(before); mixed.contextual_findings.findings.push(JSON.parse(JSON.stringify(r2.contextual_findings.findings[0])));
t('a finding copied in from another review version makes the packet refuse to build', throws(() => buildReviewerPacket(mixed, GAPS), /result_integrity_failed/));

// ---- refused results ---------------------------------------------------------------------------------
const partialText = RECORD.trim() + ' The office then asked whether the';
const refused = await run(partialText);
const pf = buildReviewerPacket(refused, partialText);
t('a refused result gives a packet with its refusal, its truncation findings and no model findings',
  pf.source_preparation.result_status === 'refused' && pf.source_preparation.refusal_codes.includes('ends_mid_sentence') && pf.model_findings.findings.length === 0 && pf.deterministic_findings.length > 0);
const unreadable = await run('�'.repeat(60));
t('an unreadable input gives a packet without a source and without anchors', buildReviewerPacket(unreadable, '�'.repeat(60)).source_preparation.source === null);

// ---- nothing that decides --------------------------------------------------------------------------
const all4 = [p, pa, pf, pr];
t('no score, verdict or "ready" anywhere in any packet', all4.every((x) => scoreAudit(x).length === 0), JSON.stringify(all4.map(scoreAudit).flat().slice(0, 3)));
// The human disposition history legitimately records each reviewer's decision on a finding (first run of this
// test flagged exactly that). The check therefore covers everything the CANDIDATE writes, with human history removed.
const candidatePart = (x) => JSON.stringify({ ...x, disposition: null, deterministic_findings: x.deterministic_findings.map((f) => ({ ...f, disposition: null })),
  model_findings: { ...x.model_findings, findings: x.model_findings.findings.map((f) => ({ ...f, disposition: null })) }, model_output_checks: x.model_output_checks.map((f) => ({ ...f, disposition: null })) });
t('no routing, decision, recommendation or compliance field in anything the candidate writes', all4.every((x) => !/"(routing|decision|recommendation|recommended_action|compliance|compliant|approved|determination)"\s*:/.test(candidatePart(x))));
t('the only decisions in a packet are a named human reviewer\'s, inside disposition history', pa.disposition.history.every((h) => typeof h.reviewer === 'string' && h.reviewer && ['confirmed', 'not_confirmed', 'needs_more_information'].includes(h.decision)));
t('no packet text recommends an action or states compliance', all4.every((x) => !/\b(we recommend|should be approved|is compliant|is defensible|grant the exception|deny the exception)\b/i.test(JSON.stringify(x))));

t('no network call was made', net.calls === 0);
done();
