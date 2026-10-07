// JRS frozen synthetic demonstration: replay core. LOCAL ONLY. SYNTHETIC RECORDS ONLY.
//
// Replays the frozen corpus (corpus/v0.1.0/) through the local Engine candidate with the one
// approved adapter: the candidate's deterministic mock (lib/engine-candidate/mock-adapter.js),
// scripted with the response frozen in each record. Nothing here calls a model, opens a network
// connection, reads an environment variable, reads a clock or writes a file. The same frozen
// inputs always give byte-identical output, which is all the replay shows.
//
// For every record it produces: the source-preparation report, the candidate result, the
// reviewer packet, and an illustrative human-disposition session run through the local reviewer
// workspace's own core (tools/local-reviewer-workspace/app/core.js), signed off and exported,
// and the export checked with the workspace's verifyExport. The disposition example is an
// example of the workflow, written by the package author. It is not a correct answer, not an
// independent label and not a decision about any record.
import { readFileSync } from 'node:fs';
import { runCandidate, CANDIDATE_VERSION, PROMPT_VERSION, PROMPT_SHA256, SCOPE_PROFILE } from '../../../lib/engine-candidate/review-candidate.js';
import { prepareSource, sha256, SOURCE_PREP_VERSION } from '../../../lib/engine-candidate/source-prep.js';
import { EXPLANATION_SET_VERSION } from '../../../lib/engine-candidate/explanations.js';
import { CONTRACT_VERSION } from '../../../lib/engine-candidate/contract.js';
import { ADAPTER_CONTRACT } from '../../../lib/engine-candidate/adapter.js';
import { buildReviewerPacket, PACKET_VERSION } from '../../../lib/engine-candidate/reviewer-packet.js';
import { createMockAdapter } from '../../../lib/engine-candidate/mock-adapter.js';
import * as W from '../../local-reviewer-workspace/app/core.js';

export const REPLAY_VERSION = 'jrs-frozen-demo-replay/0.1.0';
export const PACKAGE_DIR = new URL('../', import.meta.url).pathname;          // tools/frozen-demo/
export const CORPUS_DIR = PACKAGE_DIR + 'corpus/v0.1.0/';
// The fixed local configuration. Changing any of these is a new package version.
export const FIXED_NOW = '2026-10-07T00:00:00Z';
export const EXAMPLE_REVIEWER = 'SYNTHETIC-REVIEWER-EXAMPLE';
export const EXAMPLE_REVIEW_DATE = '2026-10-07';
export const APPROVED_ADAPTER = Object.freeze({
  module: 'lib/engine-candidate/mock-adapter.js', factory: 'createMockAdapter', kind: 'deterministic_mock',
  model_id: 'mock-frozen-demo', model_version: 'frozen-demo-0.1.0',
});

export function versions() {
  return { candidate_version: CANDIDATE_VERSION, prompt_version: PROMPT_VERSION, prompt_sha256: PROMPT_SHA256, scope_profile: SCOPE_PROFILE,
           source_prep_version: SOURCE_PREP_VERSION, explanation_set_version: EXPLANATION_SET_VERSION, contract_version: CONTRACT_VERSION,
           adapter_contract: ADAPTER_CONTRACT, packet_version: PACKET_VERSION, workspace_version: W.WORKSPACE_VERSION, export_format: W.EXPORT_FORMAT };
}

export function loadCorpus(dir = CORPUS_DIR) {
  const index = JSON.parse(readFileSync(dir + 'INDEX.json', 'utf8'));
  const records = index.records.map((e) => {
    const raw = readFileSync(dir + e.record_id + '.json', 'utf8');
    return { file_sha256: sha256(raw), record: JSON.parse(raw) };
  });
  return { index, records };
}

// The only adapter the package uses. A record with no frozen response (the refusal case) gets
// a mock that answers nothing; the replay proves it was never called.
export function approvedAdapter(record) {
  const response = record.expected.mock_response;
  return createMockAdapter({ model_id: APPROVED_ADAPTER.model_id, model_version: APPROVED_ADAPTER.model_version, prompt_version: PROMPT_VERSION,
                             respond: () => (response === null ? null : JSON.parse(JSON.stringify(response))) });
}

// An illustrative disposition for each finding: confirmed for further review, or needs
// clarification where the scripted finding is marked uncertain or the record was refused.
function exampleDisposition(result, f) {
  if (result.status !== 'examined') return ['NEEDS_CLARIFICATION', 'Example: obtain the complete record. Nothing was examined.'];
  if (f.item.uncertain === true) return ['NEEDS_CLARIFICATION', 'Example: the scripted finding is marked uncertain; ask for the missing detail.'];
  return ['CONFIRMED_FOR_FURTHER_REVIEW', 'Example: the quoted text is present; whether the finding holds is for the reviewer.'];
}

function humanExample(packet, result, text) {
  const opened = W.verifyPacket(packet, { sourceText: text });
  if (!opened.ok) return { opened: false, problems: opened.problems };
  const s = W.createSession(packet);
  W.setReviewer(s, EXAMPLE_REVIEWER, EXAMPLE_REVIEW_DATE);
  for (const f of W.listFindings(packet)) {
    const [disposition, note] = exampleDisposition(result, f);
    W.setDisposition(s, { review_id: s.identity.review_id, packet_digest: s.identity.packet_digest, finding_id: f.id, disposition, note, acknowledged: true });
  }
  W.signOff(s, true);
  const exported = W.buildExport(s);
  const check = W.verifyExport(exported, packet);
  return { opened: true, source_text_checked: opened.source_text_checked, standing: 'ILLUSTRATIVE EXAMPLE of the local disposition workflow, written by the package author. Not a correct answer, not an independent label, not a decision.',
           export_record: exported, export_verification: { ok: check.ok, problems: check.problems } };
}

function summarise(record, prep, result, calls) {
  const ctx = result.contextual_findings;
  return {
    input_preparation: {
      refusal: prep.refusal ? prep.refusal.reason : null,
      refusal_codes: prep.refusal && prep.refusal.codes ? prep.refusal.codes.slice().sort() : [],
      source_prep_codes: prep.findings.map((f) => f.code).sort(),
      elements_missing: prep.findings.filter((f) => f.element).map((f) => f.element).sort(),
    },
    candidate: {
      adapter_called: calls > 0,
      result_status: result.status,
      flagged_keys: ctx ? Object.fromEntries(Object.entries(ctx.conditions).filter(([, v]) => v.status !== 'pass').map(([k, v]) => [k, v.status])) : {},
      finding_types: ctx ? ctx.findings.filter((f) => f.kind === 'flaw').map((f) => f.type) : [],
      finding_quotations: ctx ? ctx.findings.filter((f) => f.kind === 'flaw').map((f) => f.quotation) : [],
      withheld_groups: result.extraction_findings.filter((f) => f.code === 'withheld_prohibited_inference').flatMap((f) => f.groups),
    },
  };
}

export async function replayRecord(entry) {
  const record = entry.record;
  const input = { text: record.text, profile: record.scope.profile, record_ref: record.record_ref };
  const adapter = approvedAdapter(record);
  const prep = prepareSource(record.text);
  const result = await runCandidate(input, { adapter, now: () => FIXED_NOW });
  const packet = buildReviewerPacket(result, record.text);
  const probes = [];
  for (const p of record.expected.scope_probes || []) {
    const a = approvedAdapter(record);
    const r = await runCandidate({ ...input, profile: { ...record.scope.profile, ...p.profile_change } }, { adapter: a, now: () => FIXED_NOW });
    probes.push({ probe_id: p.probe_id, profile_change: p.profile_change, observed: { result_status: r.status, reason: r.reason, adapter_called: a.calls.length > 0 } });
  }
  const out = {
    record_id: record.record_id, record_version: record.record_version, record_ref: record.record_ref, demonstrates: record.demonstrates,
    file_sha256: entry.file_sha256, source_sha256: sha256(record.text),
    adapter_identity: adapter.describe(), adapter_calls: adapter.calls.length,
    observed: summarise(record, prep, result, adapter.calls.length),
    scope_probes: probes,
    source_preparation: { version: prep.version, refusal: prep.refusal, findings: prep.findings, quotations: prep.quotations, source: prep.source || null },
    result, packet,
    digests: { review_id: result.review_identity.review_id, result_digest: result.result_digest, packet_id: packet.packet_id, packet_digest: W.packetDigest(packet) },
    human_disposition_example: humanExample(packet, result, record.text),
  };
  // The frozen record travels with the case for rendering, but is not part of the replay output.
  Object.defineProperty(out, '_record', { value: record, enumerable: false });
  return out;
}

export async function replayAll(dir = CORPUS_DIR) {
  const { index, records } = loadCorpus(dir);
  const cases = [];
  for (const e of records) cases.push(await replayRecord(e));
  return { replay_version: REPLAY_VERSION, corpus: { name: index.corpus, version: index.corpus_version }, versions: versions(),
           adapter: APPROVED_ADAPTER, fixed_now: FIXED_NOW, synthetic: true, local_only: true, cases };
}
