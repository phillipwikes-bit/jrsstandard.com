// JRS local reviewer workspace: core logic. LOCAL AND OFFLINE ONLY.
//
// One dependency-free module used by the browser page and by the Node command-line tools, so
// both apply the same rules. It makes no network request, reads no storage and keeps nothing:
// every function is a pure function of its arguments.
//
// It does NOT run the Engine and does NOT judge the record. It checks that a reviewer packet
// produced by lib/engine-candidate/reviewer-packet.js is intact and belongs to one review
// version, and it holds the reviewer's own dispositions apart from the packet.
//
// It cannot import the candidate's modules (they use node:crypto), so it carries its own
// SHA-256 and canonical JSON. tests/local-reviewer-workspace/core.test.mjs proves both agree
// byte for byte with the candidate's sha256 and canonicalJson on real packets.
//
// Codebook wording comes only from ./correspondence.js, generated from the methodology
// correspondence register: a mapped label renders only from an owner-approved record with its
// source hash and approval date. No such record exists, so every term shows the unmapped notice.
import { NO_CORRESPONDENCE, codebookCorrespondenceText } from './correspondence.js';
export { NO_CORRESPONDENCE, codebookCorrespondenceText };

export const WORKSPACE_VERSION = 'jrs-local-reviewer-workspace/0.1.0';
export const EXPORT_FORMAT = 'jrs-local-disposition-record/0.1.0';
export const SUPPORTED_PACKET_VERSIONS = Object.freeze(['jrs-candidate-reviewer-packet/0.1.0']);
export const SUPPORTED_CONTRACT_VERSIONS = Object.freeze(['jrs-candidate-result/0.3.0']);
export const DISPOSITIONS = Object.freeze(['CONFIRMED_FOR_FURTHER_REVIEW', 'NOT_CONFIRMED', 'NEEDS_CLARIFICATION', 'OUT_OF_SCOPE', 'NO_DISPOSITION']);
export const SECTIONS = Object.freeze({
  source_preparation: 'Source-preparation findings',
  candidate_prompts: 'Candidate review prompts and findings',
  model_output_checks: 'Model-output checks',
});
export const CONFIDENTIALITY_NOTICE = 'A reviewer packet can contain quotations from the record. Treat the packet, this window and any export as confidential as the record itself.';
export const QUOTATION_NOTICE = 'An exact quotation shows where the text sits in the record. It does not show that the text supports the finding, or that the candidate finding is correct.';
export const CODEBOOK_NOTICE = NO_CORRESPONDENCE + ' Candidate review keys are internal prompts of the local candidate, not JRS conditions.';
// The register term category of each kind of item the workspace shows.
export const TERM_CATEGORY = Object.freeze({ source_preparation: 'SOURCE_PREP_CHECK', model_output_checks: 'MODEL_OUTPUT_CHECK', condition: 'CANDIDATE_KEY', flaw: 'CANDIDATE_FLAW_TYPE' });
export function termOf(f) {
  const it = f.item;
  if (f.section === 'candidate_prompts') return it.kind === 'flaw' ? [TERM_CATEGORY.flaw, it.type] : [TERM_CATEGORY.condition, it.condition];
  return [TERM_CATEGORY[f.section], it.code];
}
export function codebookTextFor(f) { const [c, t] = termOf(f); return codebookCorrespondenceText(c, t); }
export const LIMITATION = 'This is a reviewer-created local disposition record. It is bound to the identified packet and version. It does not authenticate the reviewer, establish legal validity, establish semantic correctness, or authorize production use.';
export const SIGN_OFF_STATEMENT = 'I reviewed every finding listed in this packet and recorded a disposition for each. This sign-off is not an approval of the record, not an access decision and not a validation of the candidate.';
const MAX_NOTE = 2000;

// ---- SHA-256 over UTF-8 (FIPS 180-4) ---------------------------------------------------------
const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
export function sha256(text) {
  const msg = new TextEncoder().encode(String(text));
  const len = msg.length, padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(msg); padded[len] = 0x80;
  const bits = len * 8, dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(bits / 0x100000000)); dv.setUint32(padded.length - 4, bits >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}

// Key-order-independent JSON: the same algorithm as lib/engine-candidate/contract.js.
export function canonicalJson(v) {
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.length > 0;
const isInt = (v) => Number.isInteger(v) && v >= 0;
const HEX64 = /^[0-9a-f]{64}$/, ID24 = /^[0-9a-f]{24}$/, FID = /^(X|C)-[0-9]{3}$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
export function isRealDate(s) {
  const m = DATE.exec(s || ''); if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
function exactKeys(o, keys, where, problems) {
  if (!isObj(o)) { problems.push(where + ': not an object'); return false; }
  for (const k of keys) if (!(k in o)) problems.push(where + ': missing ' + k);
  for (const k of Object.keys(o)) if (!keys.includes(k)) problems.push(where + ': unexpected field ' + k);
  return true;
}

// The packet digest binds a disposition to the exact packet content, not only to its review id.
export function packetDigest(packet) { return sha256(canonicalJson(packet)); }

// Rebuilds review_id the way lib/engine-candidate/contract.js reviewIdentity() builds it.
function recomputeReviewId(identity, sourceSha) {
  const base = {
    contract_version: identity.contract_version, candidate_version: identity.candidate_version,
    source_prep_version: identity.source_prep_version, explanation_set_version: identity.explanation_set_version,
    prompt_sha256: identity.prompt_sha256 || null, prompt_version: identity.prompt_version || null,
    adapter_contract: identity.adapter_contract || null, model: identity.model || null, derived_from: identity.derived_from,
  };
  return sha256(JSON.stringify(base) + '|' + (sourceSha || 'no-source')).slice(0, 24);
}

// Every reviewable item in the packet, tagged with the section it belongs to. Order is the packet's.
export function listFindings(packet) {
  const out = [];
  for (const f of packet.deterministic_findings) out.push({ section: 'source_preparation', id: f.id, item: f });
  for (const f of packet.model_findings.findings) out.push({ section: 'candidate_prompts', id: f.id, item: f });
  for (const f of packet.model_output_checks) out.push({ section: 'model_output_checks', id: f.id, item: f });
  return out;
}

// Problems are reported as codes and identifiers only, never as packet text, so a refusal
// shown on screen cannot leak a quotation from the record.
export function verifyPacket(packet, options = {}) {
  const problems = [];
  const fail = () => ({ ok: false, problems });
  if (!isObj(packet)) { problems.push('packet: not a JSON object'); return fail(); }
  if (!SUPPORTED_PACKET_VERSIONS.includes(packet.packet_version)) { problems.push('packet_version: unsupported'); return fail(); }
  exactKeys(packet, ['packet_version', 'status', 'review_identity', 'result_digest', 'record_ref', 'source_preparation', 'deterministic_findings', 'model_findings', 'model_output_checks', 'disposition', 'sign_off', 'packet_id'], 'packet', problems);
  if (problems.length) return fail();
  if (!isObj(packet.status) || packet.status.human_review_required !== true) problems.push('status: human review must be required');
  const id = packet.review_identity;
  if (!exactKeys(id, ['contract_version', 'candidate_version', 'source_prep_version', 'explanation_set_version', 'prompt_sha256', 'prompt_version', 'adapter_contract', 'model', 'derived_from', 'review_id'], 'review_identity', problems)) return fail();
  if (!SUPPORTED_CONTRACT_VERSIONS.includes(id.contract_version)) problems.push('review_identity.contract_version: unsupported');
  if (!isText(id.candidate_version)) problems.push('review_identity.candidate_version: missing');
  if (!ID24.test(id.review_id || '')) problems.push('review_identity.review_id: malformed');
  if (!HEX64.test(packet.result_digest || '')) problems.push('result_digest: malformed');
  if (!(packet.record_ref === null || typeof packet.record_ref === 'string')) problems.push('record_ref: malformed');
  const sp = packet.source_preparation;
  if (!exactKeys(sp, ['version', 'result_status', 'reason', 'detail', 'refusal_codes', 'source'], 'source_preparation', problems)) return fail();
  const src = sp.source;
  if (src !== null && (!exactKeys(src, ['sha256', 'chars', 'lines'], 'source_preparation.source', problems) || !HEX64.test(src.sha256 || '') || !isInt(src.chars) || !isInt(src.lines))) problems.push('source_preparation.source: malformed');
  if (sp.version !== id.source_prep_version) problems.push('source_preparation.version: differs from the review identity');
  if (!Array.isArray(packet.deterministic_findings) || !Array.isArray(packet.model_output_checks) || !isObj(packet.model_findings) || !Array.isArray(packet.model_findings.findings)) { problems.push('findings: malformed sections'); return fail(); }
  if (!isObj(packet.disposition) || !Array.isArray(packet.disposition.history) || !Array.isArray(packet.disposition.pending)) { problems.push('disposition: malformed'); return fail(); }
  if (!isObj(packet.sign_off)) { problems.push('sign_off: malformed'); return fail(); }
  if (problems.length) return fail();

  // Identity: the review id must be the one this identity and source produce.
  if (recomputeReviewId(id, src ? src.sha256 : null) !== id.review_id) problems.push('review_identity: review_id does not match the identity it claims (cross-version or altered)');

  // Findings: unique, well formed, and anchored consistently with their quotations.
  const all = listFindings(packet), ids = all.map((f) => f.id);
  if (new Set(ids).size !== ids.length) problems.push('findings: duplicate identifiers');
  const text = typeof options.sourceText === 'string' ? options.sourceText : null;
  if (text !== null) {
    if (!src) problems.push('source text: the packet records no source to compare');
    else if (sha256(text) !== src.sha256 || text.length !== src.chars) problems.push('source text: does not match the packet source hash');
  }
  const textUsable = text !== null && src && sha256(text) === src.sha256;
  const checkAnchor = (f, a, where) => {
    if (!isObj(a) || !isInt(a.start) || !isInt(a.end) || !isInt(a.line) || !isInt(a.column) || a.line < 1 || a.column < 1) { problems.push(where + ': anchor malformed'); return; }
    if (a.end <= a.start || (src && a.end > src.chars)) problems.push(where + ': anchor outside the source');
    if (a.end - a.start !== f.quotation.length) problems.push(where + ': anchor does not align with its quotation');
    if (textUsable && text.slice(a.start, a.end) !== f.quotation) problems.push(where + ': anchor does not slice to its quotation in the source text');
  };
  for (const { section, id: fid, item: f } of all) {
    const where = 'finding ' + fid;
    if (!isObj(f) || !FID.test(fid || '')) { problems.push('finding: malformed identifier'); continue; }
    if (section === 'candidate_prompts' ? fid[0] !== 'C' : fid[0] !== 'X') problems.push(where + ': identifier in the wrong section');
    if (!isObj(f.disposition) || !Array.isArray(f.disposition.history)) problems.push(where + ': disposition malformed');
    if (f.explanation !== null && (!isObj(f.explanation) || f.explanation.codebook_correspondence !== 'not_asserted')) problems.push(where + ': explanation must state that no Codebook correspondence is asserted');
    if (section === 'source_preparation' && 'quotation' in f) {
      if (!isText(f.quotation)) problems.push(where + ': quotation malformed');
      else if (f.anchor === null) { if (src) problems.push(where + ': quotation without an anchor'); }
      else checkAnchor(f, f.anchor, where);
    }
    if (section === 'candidate_prompts' && f.kind === 'flaw') {
      if (!isText(f.quotation) || !Array.isArray(f.anchors) || !f.anchors.length) problems.push(where + ': quotation or anchors missing');
      else f.anchors.forEach((a, i) => checkAnchor(f, a, where + ' anchor ' + (i + 1)));
    }
  }

  // Disposition history and sign-off belong to this review version.
  packet.disposition.history.forEach((h, i) => {
    if (!isObj(h) || h.review_id !== id.review_id) problems.push('disposition history entry ' + (i + 1) + ': belongs to another review version');
    else if (!ids.includes(h.finding_id)) problems.push('disposition history entry ' + (i + 1) + ': names an unknown finding');
  });
  for (const p of packet.disposition.pending) if (!ids.includes(p)) problems.push('disposition: pending item names an unknown finding');
  if (packet.sign_off.status === 'signed' && packet.disposition.pending.length) problems.push('sign_off: signed while findings are pending');

  // packet_id: recomputed exactly as the generator computes it.
  const { permitted_now, ...signOff } = packet.sign_off;
  const pid = sha256(canonicalJson({ review_id: id.review_id, result_digest: packet.result_digest, history: packet.disposition.history, sign_off: signOff, packet_version: packet.packet_version })).slice(0, 24);
  if (pid !== packet.packet_id) problems.push('packet_id: does not match the packet contents (altered)');

  if (problems.length) return fail();
  return { ok: true, problems: [], identity: identityOf(packet), source_text_checked: Boolean(textUsable) };
}

export function identityOf(packet) {
  const id = packet.review_identity, src = packet.source_preparation.source;
  return {
    candidate_version: id.candidate_version, review_id: id.review_id, record_ref: packet.record_ref, result_digest: packet.result_digest,
    packet_id: packet.packet_id, packet_digest: packetDigest(packet), packet_version: packet.packet_version,
    prompt_version: id.prompt_version, adapter_contract: id.adapter_contract, model: id.model,
    source_sha256: src ? src.sha256 : null, generated_date: null, synthetic: typeof packet.record_ref === 'string' && /^SYNTHETIC-/.test(packet.record_ref),
  };
}

// ---- reviewer session (memory only) ---------------------------------------------------------------
export function createSession(packet) {
  const v = verifyPacket(packet);
  if (!v.ok) throw new Error('packet_refused');
  const dispositions = {};
  for (const f of listFindings(packet)) dispositions[f.id] = { section: f.section, disposition: 'NO_DISPOSITION', note: '', acknowledged: false };
  return { identity: v.identity, reviewer_reference: '', review_date: '', dispositions, signed_off: false, sign_off_date: null };
}

export function setReviewer(session, reference, date) {
  if (session.signed_off) throw new Error('signed_off: the session is closed');
  session.reviewer_reference = typeof reference === 'string' ? reference.trim().slice(0, 200) : '';
  session.review_date = typeof date === 'string' ? date : '';
}

export function setDisposition(session, d) {
  if (session.signed_off) throw new Error('signed_off: the session is closed');
  if (!d || d.review_id !== session.identity.review_id) throw new Error('review_version_mismatch: this disposition names another review');
  if (d.packet_digest !== session.identity.packet_digest) throw new Error('packet_mismatch: this disposition names another packet');
  if (!Object.prototype.hasOwnProperty.call(session.dispositions, d.finding_id)) throw new Error('unknown_finding');
  if (!DISPOSITIONS.includes(d.disposition)) throw new Error('invalid_disposition');
  if (d.disposition !== 'NO_DISPOSITION' && d.acknowledged !== true) throw new Error('acknowledgement_required: confirm that this disposition applies only to this packet');
  const note = typeof d.note === 'string' ? d.note : '';
  if (note.length > MAX_NOTE) throw new Error('note_too_long');
  const entry = session.dispositions[d.finding_id];
  entry.disposition = d.disposition; entry.note = note; entry.acknowledged = d.disposition !== 'NO_DISPOSITION';
}

export function signOffBlockers(session) {
  const b = [];
  if (!session.reviewer_reference) b.push('Enter a reviewer reference.');
  if (!isRealDate(session.review_date)) b.push('Enter the review date as YYYY-MM-DD.');
  const open = Object.keys(session.dispositions).filter((k) => session.dispositions[k].disposition === 'NO_DISPOSITION');
  if (open.length) b.push(open.length + ' finding' + (open.length === 1 ? '' : 's') + ' without a disposition: ' + open.join(', '));
  return b;
}

export function signOff(session, acknowledged) {
  if (session.signed_off) throw new Error('signed_off: already signed off');
  const b = signOffBlockers(session);
  if (b.length) throw new Error('sign_off_blocked: ' + b.join(' '));
  if (acknowledged !== true) throw new Error('acknowledgement_required: confirm the sign-off statement');
  session.signed_off = true; session.sign_off_date = session.review_date;
}

// ---- export and verification ----------------------------------------------------------------------
export function buildExport(session) {
  if (!session.signed_off) throw new Error('not_signed_off: export is available only after sign-off');
  const i = session.identity;
  const record = {
    export_format: EXPORT_FORMAT, workspace_version: WORKSPACE_VERSION,
    packet: { packet_version: i.packet_version, review_id: i.review_id, result_digest: i.result_digest, packet_id: i.packet_id, packet_digest: i.packet_digest,
              candidate_version: i.candidate_version, source_sha256: i.source_sha256, record_ref: i.record_ref },
    reviewer: { reference: session.reviewer_reference, self_entered: true, authenticated: false },
    review_date: session.review_date,
    dispositions: Object.keys(session.dispositions).map((fid) => {
      const d = session.dispositions[fid];
      return { finding_id: fid, section: d.section, review_id: i.review_id, packet_digest: i.packet_digest, disposition: d.disposition, note: d.note, applies_only_to_this_packet: true };
    }),
    sign_off: { statement: SIGN_OFF_STATEMENT, signed: true, date: session.sign_off_date },
    limitation: LIMITATION,
  };
  record.export_digest = sha256(canonicalJson(record));
  return record;
}

export function verifyExport(record, packet) {
  const problems = [];
  const pv = verifyPacket(packet);
  if (!pv.ok) return { ok: false, problems: ['packet: refused (' + pv.problems.length + ' problem(s))'] };
  const i = pv.identity;
  if (!exactKeys(record, ['export_format', 'workspace_version', 'packet', 'reviewer', 'review_date', 'dispositions', 'sign_off', 'limitation', 'export_digest'], 'export', problems)) return { ok: false, problems };
  if (problems.length) return { ok: false, problems };
  if (record.export_format !== EXPORT_FORMAT) problems.push('export_format: unsupported');
  const { export_digest, ...rest } = record;
  if (!HEX64.test(export_digest || '') || sha256(canonicalJson(rest)) !== export_digest) problems.push('export_digest: does not match the record (altered)');
  const p = record.packet;
  if (!exactKeys(p, ['packet_version', 'review_id', 'result_digest', 'packet_id', 'packet_digest', 'candidate_version', 'source_sha256', 'record_ref'], 'export.packet', problems)) return { ok: false, problems };
  for (const k of ['packet_version', 'review_id', 'result_digest', 'packet_id', 'packet_digest', 'candidate_version', 'source_sha256', 'record_ref']) if (p[k] !== i[k]) problems.push('export.packet.' + k + ': does not match the packet (cross-version or another packet)');
  if (!exactKeys(record.reviewer, ['reference', 'self_entered', 'authenticated'], 'export.reviewer', problems) || !isText(record.reviewer.reference) || record.reviewer.self_entered !== true || record.reviewer.authenticated !== false) problems.push('export.reviewer: must be a self-entered, unauthenticated reference');
  if (!isRealDate(record.review_date)) problems.push('export.review_date: not a real date');
  if (record.limitation !== LIMITATION) problems.push('export.limitation: missing or altered');
  if (!exactKeys(record.sign_off, ['statement', 'signed', 'date'], 'export.sign_off', problems) || record.sign_off.statement !== SIGN_OFF_STATEMENT || record.sign_off.signed !== true || !isRealDate(record.sign_off.date)) problems.push('export.sign_off: missing or altered');
  const expected = listFindings(packet);
  if (!Array.isArray(record.dispositions)) problems.push('export.dispositions: malformed');
  else {
    const seen = new Set();
    record.dispositions.forEach((d, n) => {
      const where = 'export.dispositions[' + n + ']';
      if (!exactKeys(d, ['finding_id', 'section', 'review_id', 'packet_digest', 'disposition', 'note', 'applies_only_to_this_packet'], where, problems)) return;
      const f = expected.find((x) => x.id === d.finding_id);
      if (!f) problems.push(where + ': names a finding not in the packet');
      else if (f.section !== d.section) problems.push(where + ': wrong section');
      if (seen.has(d.finding_id)) problems.push(where + ': duplicate finding'); seen.add(d.finding_id);
      if (d.review_id !== i.review_id) problems.push(where + ': belongs to another review version');
      if (d.packet_digest !== i.packet_digest) problems.push(where + ': belongs to another packet');
      if (!DISPOSITIONS.includes(d.disposition) || d.disposition === 'NO_DISPOSITION') problems.push(where + ': not a completed disposition');
      if (typeof d.note !== 'string' || d.note.length > MAX_NOTE) problems.push(where + ': note malformed');
      if (d.applies_only_to_this_packet !== true) problems.push(where + ': binding acknowledgement missing');
    });
    for (const f of expected) if (!seen.has(f.id)) problems.push('export.dispositions: no disposition for ' + f.id);
  }
  return { ok: problems.length === 0, problems };
}
