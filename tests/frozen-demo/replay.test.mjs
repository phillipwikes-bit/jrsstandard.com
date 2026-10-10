// Exact replay: each case's behaviour, the refusal case, scope probes, separation of findings,
// anchors, the disposition workflow, no score, no verdict and no Codebook mapping.
import { t, done, IDS, json, read, record, R, PKG } from './_helpers.mjs';
import { CODEBOOK_CORRESPONDENCE_RECORD } from '../../lib/engine-candidate/explanations.js';
import { verifyResultIntegrity } from '../../lib/engine-candidate/contract.js';
import * as W from '../../tools/local-reviewer-workspace/app/core.js';

const m = json('tools/frozen-demo/demo-manifest.json');
const a = await R.replayAll(), b = await R.replayAll();
t('two replays are byte-identical', JSON.stringify(a) === JSON.stringify(b));
const { renderOutputs } = await import(PKG + 'lib/render.js');
t('the committed replay output and viewer data are exactly a fresh replay', Object.entries(renderOutputs(a, m, json('tools/frozen-demo/demo-evidence-record.json'))).every(([p, x]) => read(p) === x));
const C = Object.fromEntries(a.cases.map((c) => [c.record_id, c]));
for (const id of IDS) {
  const c = C[id], r = record(id), mr = m.records.find((x) => x.record_id === id);
  t(id + ': input preparation equals the frozen expectation', JSON.stringify(c.observed.input_preparation) === JSON.stringify(r.expected.input_preparation));
  t(id + ': candidate behaviour equals the frozen expectation', JSON.stringify(c.observed.candidate) === JSON.stringify(r.expected.candidate));
  t(id + ': review, result and packet digests equal the frozen manifest', JSON.stringify(c.digests) === JSON.stringify(mr.expected_digests));
  t(id + ': adapter identity is the approved mock', c.adapter_identity.model_id === 'mock-frozen-demo' && c.adapter_identity.model_version === 'frozen-demo-0.1.0' && c.result.review_identity.model === 'mock-frozen-demo@frozen-demo-0.1.0');
  t(id + ': the result keeps its integrity and is bound to one review version', verifyResultIntegrity(c.result).ok);
  t(id + ': no score, verdict or validation claim in the result or packet', !/"(score|rating|grade|verdict|overall|drr_score)"\s*:/.test(JSON.stringify([c.result, c.packet])) && c.result.validated === false);
  t(id + ': every explanation states that no Codebook correspondence is asserted', JSON.stringify(c.packet).match(/"codebook_correspondence":"[^"]*"/g)?.every((x) => x === '"codebook_correspondence":"not_asserted"') ?? true);
  t(id + ': human review is required and the packet is labelled a local candidate output', c.packet.status.human_review_required === true && /LOCAL CANDIDATE, NOT VALIDATED/.test(c.packet.status.standing));
  t(id + ': the workspace opens the packet with its source text, and the example export verifies', c.human_disposition_example.opened && c.human_disposition_example.source_text_checked && c.human_disposition_example.export_verification.ok);
  t(id + ': the example disposition is labelled illustrative, with a fictional self-entered reviewer', /^ILLUSTRATIVE EXAMPLE/.test(c.human_disposition_example.standing) && c.human_disposition_example.export_record.reviewer.reference === 'SYNTHETIC-REVIEWER-EXAMPLE' && c.human_disposition_example.export_record.reviewer.authenticated === false);
}
t('no Codebook correspondence record exists', CODEBOOK_CORRESPONDENCE_RECORD === null);

// The refusal case.
const r5 = C['FD-05'];
t('FD-05 is refused as partial input before model review', r5.result.status === 'refused' && r5.result.reason === 'partial_input');
t('FD-05 never reached the adapter (0 calls)', r5.adapter_calls === 0);
t('FD-05 carries no candidate findings at all', r5.result.contextual_findings === null && r5.packet.model_findings.findings.length === 0);
t('FD-05 still yields a packet a reviewer can read, with its deterministic refusal findings', r5.packet.deterministic_findings.map((f) => f.code).sort().join() === 'ends_mid_sentence,pages_missing');
t('the refused case example asks for the complete record and confirms nothing', r5.human_disposition_example.export_record.dispositions.every((d) => d.disposition === 'NEEDS_CLARIFICATION'));

// Scope refusal.
t('the three scope probes are refused before the adapter', C['FD-01'].scope_probes.length === 3 && C['FD-01'].scope_probes.every((p) => p.observed.result_status === 'refused' && p.observed.adapter_called === false));

// Separation of deterministic and candidate findings, and anchors.
const p2 = C['FD-02'].packet;
t('FD-02 shows a deterministic finding and candidate findings in separate sections', p2.deterministic_findings.length === 1 && p2.deterministic_findings[0].id.startsWith('X-') && p2.model_findings.findings.every((f) => f.id.startsWith('C-')) && p2.model_findings.findings.length === 2);
t('FD-03 and FD-04 show candidate findings only', ['FD-03', 'FD-04'].every((id) => C[id].packet.deterministic_findings.length === 0 && C[id].packet.model_findings.findings.length > 0));
t('FD-01 shows nothing to dispose of', C['FD-01'].packet.deterministic_findings.length === 0 && C['FD-01'].packet.model_findings.findings.length === 0 && C['FD-01'].result.human_review.disposition.status === 'nothing_to_dispose');
for (const id of ['FD-02', 'FD-03', 'FD-04']) {
  const c = C[id], text = record(id).text;
  const flaws = c.packet.model_findings.findings.filter((f) => f.kind === 'flaw');
  t(id + ': every candidate quotation anchor slices back to its exact text', flaws.length > 0 && flaws.every((f) => f.anchors.every((x) => text.slice(x.start, x.end) === f.quotation)));
}
t('every double-quoted span is located with offset, line and column', C['FD-02'].source_preparation.quotations.length === 1 && C['FD-02'].source_preparation.quotations.every((q) => record('FD-02').text.slice(q.start, q.end) === q.text && q.line === 3));
t('the uncertain FD-03 finding is given NEEDS_CLARIFICATION in the example, the others CONFIRMED_FOR_FURTHER_REVIEW', C['FD-03'].human_disposition_example.export_record.dispositions.map((d) => d.disposition).join() === 'CONFIRMED_FOR_FURTHER_REVIEW,CONFIRMED_FOR_FURTHER_REVIEW,NEEDS_CLARIFICATION');

// The replay's adapter cannot be anything but the mock.
const ad = R.approvedAdapter(record('FD-02'));
t('the approved adapter describes itself as the mock and keeps a call log', ad.describe().model_id === 'mock-frozen-demo' && Array.isArray(ad.calls));
t('the refusal case adapter answers nothing, so a call would be rejected rather than used', (await R.approvedAdapter(record('FD-05')).examine({})) === null);
t('an altered export is refused by the workspace verifier', (() => { const x = JSON.parse(JSON.stringify(C['FD-02'].human_disposition_example.export_record)); x.dispositions[0].disposition = 'NOT_CONFIRMED'; return !W.verifyExport(x, C['FD-02'].packet).ok; })());
done();
