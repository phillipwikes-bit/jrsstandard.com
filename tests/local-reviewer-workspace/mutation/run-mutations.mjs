// Mutation run for the local reviewer workspace: each critical control is removed, one at a time,
// from a throwaway copy of tools/local-reviewer-workspace/, and the suite (pointed at the copy
// through JRS_RW_DIR) must then FAIL. A mutation no suite catches is SURVIVED and fails the run.
// The working tree is never modified.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../../', import.meta.url).pathname;
const SRC = join(ROOT, 'tools/local-reviewer-workspace');
const A = 'app/core.js', W = 'app/workspace.js', V = 'serve.mjs';
// [id, control, file, exact text, replacement]
export const MUTATIONS = [
  ['W01', 'packet integrity check', A, "  if (problems.length) return fail();\n  return { ok: true,", "  return { ok: true,"],
  ['W02', 'sign-off blocked while a finding has no disposition', A, "if (open.length) b.push(", "if (false) b.push("],
  ['W03', "a disposition must name this packet's review ID", A, "if (!d || d.review_id !== session.identity.review_id) throw", "if (!d) throw"],
  ['W04', "a disposition must name this packet's digest", A, "if (d.packet_digest !== session.identity.packet_digest) throw", "if (false) throw"],
  ['W05', 'exported dispositions carry this review ID', A, "return { finding_id: fid, section: d.section, review_id: i.review_id,", "return { finding_id: fid, section: d.section, review_id: 'f'.repeat(24),"],
  ['W06', 'the packet digest is computed from the packet', A, "packet_id: packet.packet_id, packet_digest: packetDigest(packet),", "packet_id: packet.packet_id, packet_digest: packetDigest({}),"],
  ['W07', 'export digest verified', A, "if (!HEX64.test(export_digest || '') || sha256(canonicalJson(rest)) !== export_digest)", "if (!HEX64.test(export_digest || ''))"],
  ['W08', 'no score displayed', W, "  row(dl, 'Candidate version', id.candidate_version);", "  row(dl, 'Candidate version', id.candidate_version);\n  row(dl, 'Score', '3 of 5');"],
  ['W09', 'no approved verdict', A, "export const SIGN_OFF_STATEMENT = 'I reviewed every finding", "export const SIGN_OFF_STATEMENT = 'The record is approved. I reviewed every finding"],
  ['W10', 'no browser persistence', W, "$('version').textContent = C.WORKSPACE_VERSION;", "$('version').textContent = C.WORKSPACE_VERSION;\ntry { localStorage.setItem('jrs-rw-draft', JSON.stringify(session)); } catch (e) {}"],
  ['W11', 'no network request', W, "$('version').textContent = C.WORKSPACE_VERSION;", "$('version').textContent = C.WORKSPACE_VERSION;\nfetch('/core.js').catch(() => {});"],
  ['W12', 'no automatic loading from a URL', W, "$('version').textContent = C.WORKSPACE_VERSION;", "$('version').textContent = C.WORKSPACE_VERSION;\nif (location.hash.length > 1) open(JSON.parse(decodeURIComponent(location.hash.slice(1))), null, 'Loaded from the address.');"],
  ['W13', 'loopback-only binding', V, "if (!LOOPBACK.includes(host)) throw", "if (false) throw"],
  ['W14', "CSP connect-src 'none'", V, "connect-src 'none'; form-action", "connect-src *; form-action"],
  ['W15', 'loopback Host header required', V, "if (!hostAllowed(req.headers.host, actual))", "if (false)"],
  ['W16', 'anchor must align with its quotation', A, "if (a.end - a.start !== f.quotation.length) problems.push(", "if (false) problems.push("],
  ['W17', 'history entries must belong to this review version', A, "if (!isObj(h) || h.review_id !== id.review_id) problems.push(", "if (!isObj(h)) problems.push("],
  ['W18', 'packet_id recomputed', A, "if (pid !== packet.packet_id) problems.push(", "if (false) problems.push("],
  ['W19', 'packet-binding acknowledgement required', A, "if (d.disposition !== 'NO_DISPOSITION' && d.acknowledged !== true) throw", "if (false) throw"],
  ['W20', 'packet text never parsed as HTML', W, "if (text !== undefined && text !== null) n.textContent = String(text);", "if (text !== undefined && text !== null) n.innerHTML = String(text);"],
  ['W21', 'export holds no quotation', A, "note: d.note, applies_only_to_this_packet: true };", "note: d.note, applies_only_to_this_packet: true, quotation: 'copied excerpt' };"],
  ['W22', 'source text must match the packet hash', A, "else if (sha256(text) !== src.sha256 || text.length !== src.chars) problems.push(", "else if (false) problems.push("],
  ['W23', 'export bound to the packet it is verified against', A, "if (p[k] !== i[k]) problems.push(", "if (false) problems.push("],
  ['W24', 'uploads refused', V, "if (req.method !== 'GET' && req.method !== 'HEAD') {", "if (false) {"],
  ['W25', 'refusals never echo packet text', A, "problems.push(where + ': anchor does not align with its quotation');", "problems.push(where + ': anchor does not align with its quotation ' + f.quotation);"],
  ['W26', 'review identity recomputed (cross-version packets refused)', A, "if (recomputeReviewId(id, src ? src.sha256 : null) !== id.review_id) problems.push(", "if (false) problems.push("],
  ['W27', 'sign-off refused without confirmation', A, "if (acknowledged !== true) throw new Error('acknowledgement_required: confirm the sign-off statement');", ""],
  ['W28', 'Codebook correspondence must not be asserted', A, "f.explanation.codebook_correspondence !== 'not_asserted')", "false)"],
];

const base = mkdtempSync(join(tmpdir(), 'jrs-rw-mutation-'));
const copy = join(base, 'tools/local-reviewer-workspace');
mkdirSync(join(base, 'tools'), { recursive: true });
symlinkSync(join(ROOT, 'lib'), join(base, 'lib'));          // the demo generator imports the candidate by relative path
symlinkSync(join(ROOT, 'tests'), join(base, 'tests'));
const runSuite = () => {
  try { execFileSync(process.execPath, [join(ROOT, 'tests/local-reviewer-workspace/run-all.mjs'), '--quick'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, JRS_RW_DIR: copy + '/', JRS_RW_MUTATION_CHILD: '1' }, timeout: 900000 }); return { failed: false, suites: [] }; }
  catch (e) { return { failed: true, suites: String(e.stdout || '').split('\n').filter((l) => /: FAILED$/.test(l)).map((l) => l.split(':')[0]) }; }
};
let survived = 0;
try {
  cpSync(SRC, copy, { recursive: true });
  const baseline = runSuite();
  console.log(`${baseline.failed ? 'FAIL' : 'PASS'}  baseline: the unmutated copy passes${baseline.failed ? ' (' + baseline.suites.join(', ') + ')' : ''}`);
  if (baseline.failed) survived++;
  for (const [id, what, file, find, repl] of MUTATIONS) {
    rmSync(copy, { recursive: true, force: true }); cpSync(SRC, copy, { recursive: true });
    const p = join(copy, file), src = readFileSync(p, 'utf8'), count = src.split(find).length - 1;
    if (count !== 1) { survived++; console.log(`FAIL  ${id} ${what}: the mutation text occurs ${count} times, so it was not applied`); continue; }
    writeFileSync(p, src.replace(find, repl));
    const r = runSuite();
    if (!r.failed) survived++;
    console.log(`${r.failed ? 'PASS' : 'FAIL'}  ${id} ${what}: ${r.failed ? 'caught by ' + r.suites.join(', ') : 'SURVIVED'}`);
  }
} finally { rmSync(base, { recursive: true, force: true }); }
console.log(`\n${MUTATIONS.length} mutations, ${MUTATIONS.length - survived} caught, ${survived} survived`);
process.exit(survived ? 1 : 0);
