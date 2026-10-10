// Shared helpers for the local reviewer workspace tests. Local only.
// JRS_RW_DIR points the suite at a mutated copy of tools/local-reviewer-workspace/ (mutation run).
import { fixture, PROFILE, NOW, cond, reply, net } from '../engine-candidate/_harness.mjs';
import { runCandidate } from '../../lib/engine-candidate/review-candidate.js';
import { buildReviewerPacket } from '../../lib/engine-candidate/reviewer-packet.js';

export { net };
export const ROOT = new URL('../../', import.meta.url).pathname;
export const DIR = process.env.JRS_RW_DIR || ROOT + 'tools/local-reviewer-workspace/';
export const C = await import(DIR + 'app/core.js');

let pass = 0, fail = 0, skip = 0;
export const t = (n, ok, d = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  ' + d : ''}`); };
export const skipped = (n, why) => { skip++; console.log(`SKIP  ${n}  ${why}`); };
export const done = () => { console.log(`\n${pass + fail} checks, ${fail} failed${skip ? ', ' + skip + ' skipped' : ''}`); process.exit(fail ? 1 : 0); };
export const clone = (o) => JSON.parse(JSON.stringify(o));

export const RECORD = fixture('SYNTHETIC-SAE-01.txt');
export const GAPS = fixture('SYNTHETIC-SAE-03-GAPS.txt');
const flaws = [
  { type: 'evidentiary_overreach', excerpt: "Approved given the supplier's track record.", explanation: 'The track record is asserted but not shown.' },
  { type: 'reasoning_elision', excerpt: 'section 4 (data retention) was blank', explanation: 'The resolution of the blank section is not stated.' },
];
// Synthetic packets built by the real candidate and the real packet generator, mock adapter only.
export async function packetFrom(text, legacy, ref) {
  const r = await runCandidate({ text, profile: PROFILE, record_ref: ref }, { adapter: reply(legacy), now: NOW });
  return buildReviewerPacket(r, text);
}
export const P = {
  flaws: await packetFrom(RECORD, { conditions: cond(), flaws, revision_needed: 'State the evidence.' }, 'SYNTHETIC-TEST-FLAWS'),
  gaps: await packetFrom(GAPS, { conditions: cond(), flaws: [] }, 'SYNTHETIC-TEST-GAPS'),
  withheld: await packetFrom(RECORD, { conditions: { ...cond(), basis_identification: { status: 'gap', note: 'The writer was angry about it.' } }, flaws }, 'SYNTHETIC-TEST-WITHHELD'),
};
export const quotations = (packet) => C.listFindings(packet).flatMap((f) => (typeof f.item.quotation === 'string' ? [f.item.quotation] : []));

// A complete, signed-off session for a packet.
export function signedSession(packet, disposition = 'NOT_CONFIRMED') {
  const s = C.createSession(packet);
  C.setReviewer(s, 'Synthetic Reviewer (test)', '2026-10-06');
  for (const id of Object.keys(s.dispositions)) C.setDisposition(s, { finding_id: id, review_id: s.identity.review_id, packet_digest: s.identity.packet_digest, disposition, note: 'synthetic test note', acknowledged: true });
  C.signOff(s, true);
  return s;
}
