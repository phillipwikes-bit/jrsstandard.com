// Export consistency verifier. Seed of PORT-02 (Evidence Integrity Verifier),
// built inside DS-N1; it is NOT a separately specified or validated PORT-02.
//
// It verifies INTERNAL CONSISTENCY of an exported package only. A matching
// checksum does not prove that any recorded event occurred, and a failure to
// read the package does not prove it is inconsistent.
import { EXPORT_SCHEMA, REPORT_SCHEMA, CANDIDATE } from './identity.mjs';
import { buildReport } from './report.mjs';
import { verifyChain } from './session.mjs';
import { validateRecord } from './record.mjs';
import { canonical, sha256 } from './text.mjs';

export const VERDICT = Object.freeze({
  CONSISTENT: 'VERIFIED_INTERNALLY_CONSISTENT',
  INCONSISTENT: 'INCONSISTENT',
  INDETERMINATE: 'INDETERMINATE',
  ERROR: 'ERROR',
});

export function verifyExport(bundleOrText) {
  let b = bundleOrText;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (err) { return { verdict: VERDICT.ERROR, checks: [{ check: 'parse', result: 'fail', detail: String(err.message) }], meaning: 'Package could not be read; no consistency conclusion is possible.' }; }
  }
  const checks = [];
  const add = (check, ok, detail) => checks.push({ check, result: ok ? 'pass' : 'fail', detail });
  if (!b || typeof b !== 'object' || b.schema !== EXPORT_SCHEMA) {
    return { verdict: VERDICT.INDETERMINATE, checks: [{ check: 'schema', result: 'unsupported', detail: `expected ${EXPORT_SCHEMA}` }], meaning: 'Unsupported package schema; not assessed.' };
  }
  if (!b.report || b.report.schema !== REPORT_SCHEMA || !b.checksums || !Array.isArray(b.events) || !b.record) {
    return { verdict: VERDICT.INCONSISTENT, checks: [{ check: 'completeness', result: 'fail', detail: 'package is missing record, events, report or checksums' }], meaning: 'Incomplete export.' };
  }
  const { checksums, ...body } = b;
  add('report_checksum', sha256(canonical(b.report)) === checksums.report_sha256, 'SHA-256 of canonical report');
  add('package_checksum', sha256(canonical(body)) === checksums.package_sha256, 'SHA-256 of canonical package body');

  const v = validateRecord(b.record);
  add('record_valid', !v.status || v.status === 'REFUSED_SCOPE', v.status ? v.errors.map((e) => e.code).join(',') : 'valid');
  if (v.record) {
    const chain = verifyChain(b.events, v.record.record_digest);
    add('event_chain', chain.ok, chain.ok ? `${b.events.length} events` : chain.problems.map((p) => `${p.code}@${p.at}`).join(','));
    const ids = new Set();
    let dup = false;
    for (const s of v.record.sources) { if (ids.has(s.source_id)) dup = true; ids.add(s.source_id); }
    add('unique_source_ids', !dup, '');
    const p1 = b.report.parts && b.report.parts['1_record_identification'];
    if (p1) add('report_binds_record', p1.record_digest === v.record.record_digest, 'report record_digest equals recomputed digest');
    const inv = (b.report.parts && b.report.parts['2_evidence_inventory']) || [];
    add('inventory_digests', inv.every((s) => { const src = v.record.sources.find((x) => x.source_id === s.source_id); return src && src.digest === s.digest; }) && inv.length === v.record.sources.length, 'every inventory digest matches its source text');
  }

  // Independent reconstruction: regenerate the report from record + events.
  const gen = b.report.generator || {};
  if (gen.version !== CANDIDATE.version || gen.rule_version !== CANDIDATE.rule_version) {
    checks.push({ check: 'reconstruction', result: 'not_run', detail: `package produced by ${gen.version}/${gen.rule_version}; this verifier is ${CANDIDATE.version}/${CANDIDATE.rule_version}` });
  } else {
    let rebuilt;
    try { rebuilt = buildReport({ input: b.record, events: b.events }, { generated_at: b.report.generated_at }); } catch (err) { rebuilt = null; checks.push({ check: 'reconstruction', result: 'fail', detail: String(err.message) }); }
    if (rebuilt) add('reconstruction', canonical(rebuilt) === canonical(b.report), 'report regenerated from record + events is byte-identical');
  }

  const failed = checks.filter((c) => c.result === 'fail');
  const notRun = checks.filter((c) => c.result === 'not_run');
  const verdict = failed.length ? VERDICT.INCONSISTENT : notRun.length ? VERDICT.INDETERMINATE : VERDICT.CONSISTENT;
  return {
    verdict, checks,
    meaning: verdict === VERDICT.CONSISTENT
      ? 'The package is internally consistent: checksums, event chain, source digests and the regenerated report agree. This does not establish that the recorded facts or events are true.'
      : verdict === VERDICT.INDETERMINATE ? 'Some checks could not be run; no consistency conclusion for those checks.'
        : 'At least one internal consistency check failed.',
  };
}
