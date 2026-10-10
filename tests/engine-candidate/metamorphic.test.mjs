// Metamorphic and property tests: behaviour that must hold under harmless transformations. Added 2026-10-06.
// Development material and mocks only.
import { t, done, net, PROFILE, IDS, NOW, cond, reply, toAdapterOutput } from './_harness.mjs';
import { prepareSource, sha256 } from '../../lib/engine-candidate/source-prep.js';
import { runCandidate, CANDIDATE_VERSION, PROMPT_SHA256, PROMPT_VERSION, DERIVED_FROM } from '../../lib/engine-candidate/review-candidate.js';
import { reviewIdentity, verifyResultIntegrity, recordDisposition, canonicalJson } from '../../lib/engine-candidate/contract.js';
import { validateAdapterOutput, ADAPTER_CONTRACT } from '../../lib/engine-candidate/adapter.js';
import { buildReviewerPacket } from '../../lib/engine-candidate/reviewer-packet.js';
import { createMockAdapter } from '../../lib/engine-candidate/mock-adapter.js';
import { loadDevelopmentTexts } from './shared/dev-index.mjs';
import { same } from './eval/run-eval.mjs';
import { SOURCE_PREP_VERSION } from '../../lib/engine-candidate/source-prep.js';
import { EXPLANATION_SET_VERSION } from '../../lib/engine-candidate/explanations.js';

const dev = loadDevelopmentTexts().filter((d) => typeof d.text === 'string' && !/�|[\u0000-\u0008]/.test(d.text));
const substance = (r) => ({ refusal: r.refusal && r.refusal.reason, findings: r.findings.map((f) => [f.code, f.element || '', (f.matched || '').replace(/\s+/g, ' ')]).sort().map(String), quotations: r.quotations.map((q) => q.text.replace(/\s+/g, ' ')) });

// ---- whitespace-only changes preserve the substantive findings ----------------------------------------
const transforms = {
  'CRLF line endings': (s) => s.replace(/\n/g, '\r\n'),
  'trailing spaces on every line': (s) => s.replace(/\n/g, '   \n') + '   ',
  'double spaces between sentences': (s) => s.replace(/([.;:]) (?=\S)/g, '$1  '),
  'blank line added at the end': (s) => s + '\n\n',
};
for (const [name, fn] of Object.entries(transforms)) {
  const broken = dev.filter((d) => JSON.stringify(substance(prepareSource(d.text))) !== JSON.stringify(substance(prepareSource(fn(d.text))))).map((d) => d.name);
  t(`${name}: the same findings for all ${dev.length} development texts`, broken.length === 0, broken.slice(0, 4).join(', '));
}

// ---- inserting lines shifts offsets and lines exactly -------------------------------------------------
const withQuotes = dev.filter((d) => prepareSource(d.text).quotations.length && !prepareSource(d.text).refusal);
const INS = 'A line inserted for this test.\n';
let shifted = 0, wrong = [];
for (const d of withQuotes) {
  const nl = d.text.indexOf('\n') + 1, moved = d.text.slice(0, nl) + INS + d.text.slice(nl);
  const a = prepareSource(d.text).quotations, b = prepareSource(moved).quotations;
  a.forEach((q, i) => {
    const ok = q.start < nl ? (b[i].start === q.start && b[i].line === q.line) : (b[i].start === q.start + INS.length && b[i].line === q.line + 1 && b[i].column === q.column);
    if (!ok) wrong.push(d.name); else shifted++;
  });
}
t(`inserting a line before quotations moves each by one line and the inserted length, column unchanged (${shifted} quotations)`, withQuotes.length > 0 && wrong.length === 0, wrong.join(', '));

// ---- quotation anchors stay exact ---------------------------------------------------------------------
const anchorFail = dev.filter((d) => { const r = prepareSource(d.text); return r.quotations.some((q) => d.text.slice(q.start, q.end) !== q.text) || r.findings.some((f) => f.location && f.matched !== undefined && d.text.slice(f.location.start, f.location.end) !== f.matched); });
t(`every quotation and every located finding slices back exactly, across all ${dev.length} texts`, anchorFail.length === 0, anchorFail.map((d) => d.name).join(', '));
for (const [name, fn] of Object.entries(transforms)) {
  const bad = dev.filter((d) => { const x = fn(d.text), r = prepareSource(x); return r.quotations.some((q) => x.slice(q.start, q.end) !== q.text); });
  t(`anchors stay exact after: ${name}`, bad.length === 0);
}

// ---- JSON key order never changes a comparison --------------------------------------------------------
const shuffle = (v) => Array.isArray(v) ? v.map(shuffle) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, shuffle(v[k])])) : v;
const text = loadDevelopmentTexts().find((d) => d.name === 'fixtures/SYNTHETIC-SAE-03-GAPS.txt').text;
const good = { conditions: cond('review', 'Partial.'), flaws: [{ type: 'unsupported_content', excerpt: 'As discussed on the call, the agreement will follow.', explanation: 'Rests on a call.' }] };
const r = await runCandidate({ text, profile: PROFILE }, { adapter: reply(good), now: NOW });
const rs = shuffle(r);
t('evaluation comparison ignores key order', same(r, rs) && same({ a: 1, b: [{ x: 1, y: 2 }] }, { b: [{ y: 2, x: 1 }], a: 1 }) && !same({ a: [1, 2] }, { a: [2, 1] }));
t('canonical JSON ignores key order', canonicalJson(r) === canonicalJson(rs));
t('a result with its keys reordered still passes the integrity check', verifyResultIntegrity(rs).ok);
t('a reordered result gives the same reviewer packet identity', buildReviewerPacket(rs, text).packet_id === buildReviewerPacket(r, text).packet_id);
t('adapter output is accepted whatever its key order', validateAdapterOutput(shuffle(toAdapterOutput(good)), text, IDS).ok);

// ---- review identity changes with record, prompt, adapter contract and candidate version ------------
const v = { candidate_version: CANDIDATE_VERSION, source_prep_version: SOURCE_PREP_VERSION, explanation_set_version: EXPLANATION_SET_VERSION,
            prompt_sha256: PROMPT_SHA256, prompt_version: PROMPT_VERSION, adapter_contract: ADAPTER_CONTRACT, model: IDS.model_id + '@' + IDS.model_version, derived_from: DERIVED_FROM };
const id0 = reviewIdentity(v, sha256(text)).review_id;
t('the identity is reproducible from the same inputs', reviewIdentity({ ...v }, sha256(text)).review_id === id0 && r.review_identity.review_id === id0);
t('a different record gives a different identity', reviewIdentity(v, sha256(text + 'x')).review_id !== id0);
for (const k of ['prompt_sha256', 'prompt_version', 'adapter_contract', 'candidate_version', 'source_prep_version', 'model'])
  t(`a different ${k} gives a different identity`, reviewIdentity({ ...v, [k]: v[k] + '-changed' }, sha256(text)).review_id !== id0);
t('the identity does not depend on key order', reviewIdentity(shuffle(v), sha256(text)).review_id === id0);

// ---- a finding cannot be copied into another version ------------------------------------------------
const otherIds = { ...IDS, model_version: '2' };
const r2 = await runCandidate({ text, profile: PROFILE }, { adapter: createMockAdapter({ ...otherIds, respond: () => toAdapterOutput(good, otherIds) }), now: NOW });
t('two versions of the same review have different identities', r2.review_identity.review_id !== r.review_identity.review_id);
const copied = JSON.parse(JSON.stringify(r2)); copied.contextual_findings.findings.push({ ...JSON.parse(JSON.stringify(r.contextual_findings.findings[0])), id: 'C-099' });
t('a finding copied from another version fails the integrity check', !verifyResultIntegrity(copied).ok && verifyResultIntegrity(copied).problems.some((p) => /another review version|changed since/.test(p)));
const relabelled = JSON.parse(JSON.stringify(copied)); relabelled.contextual_findings.findings.at(-1).review_id = r2.review_identity.review_id;
t('relabelling the copied finding does not help: the digest no longer matches', !verifyResultIntegrity(relabelled).ok && verifyResultIntegrity(relabelled).problems.some((p) => /changed since/.test(p)));
const fid = Object.keys(r2.human_review.disposition.items)[0];
const dis = (x) => { try { recordDisposition(x, { review_id: r2.review_identity.review_id, finding_id: fid, decision: 'confirmed', reviewer: 'R', at: 'T' }); return 'accepted'; } catch (e) { return e.message; } };
t('no disposition can be recorded on a result carrying a copied finding', /result_integrity_failed/.test(dis(copied)));

// ---- a human disposition cannot carry across versions ------------------------------------------------
const fid1 = Object.keys(r.human_review.disposition.items)[0];
const r1d = recordDisposition(r, { review_id: r.review_identity.review_id, finding_id: fid1, decision: 'confirmed', reviewer: 'Reviewer A', at: '2026-10-06T10:00:00Z' });
const carried = JSON.parse(JSON.stringify(r2)); carried.human_review = JSON.parse(JSON.stringify(r1d.human_review));
t('a disposition history carried from another version fails the integrity check', !verifyResultIntegrity(carried).ok && verifyResultIntegrity(carried).problems.some((p) => /another review version/.test(p)));
t('no further disposition can be recorded on it', /result_integrity_failed/.test(dis(carried)));
t('and no reviewer packet can be built from it', (() => { try { buildReviewerPacket(carried, text); return false; } catch (e) { return /result_integrity_failed/.test(e.message); } })());
const oneForeign = JSON.parse(JSON.stringify(r2)); oneForeign.human_review.disposition.history.push({ ...r1d.human_review.disposition.history[0], finding_id: fid });
t('a single disposition history entry from another version is detected, even with correct items', !verifyResultIntegrity(oneForeign).ok && verifyResultIntegrity(oneForeign).problems.some((p) => /history entry 0 belongs to another review version/.test(p)));
t('the new version starts with every finding pending', Object.values(r2.human_review.disposition.items).every((i) => i.status === 'pending'));

t('no network call was made', net.calls === 0);
done();
