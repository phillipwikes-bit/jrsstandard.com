// Methodology integrity: the display-label resolver. INTERNAL, LOCAL ONLY.
//
// A mapped label renders only from an approved record that carries its source hash, source
// version, authoritative term and owner-approval date. Anything else, including no record at all,
// renders the unmapped notice. The function is self-contained (no imports, var style) because the
// builder copies its exact source into tools/local-reviewer-workspace/app/correspondence.js, so the
// browser and Node apply the same rule.
export function resolveCodebookLabel(approved, category, term) {
  var NONE = 'No Codebook correspondence asserted.';
  var hits = (Array.isArray(approved) ? approved : []).filter(function (x) { return x && x.term_category === category && x.candidate_term === term; });
  if (hits.length !== 1) return { asserted: false, text: NONE };
  var r = hits[0];
  if (r.status !== 'APPROVED_CORRESPONDENCE' || !/^[0-9a-f]{64}$/.test(r.methodology_source_sha256 || '') || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.approval_date || '')
      || !r.authoritative_source_term || !r.methodology_source_id || !r.source_version) return { asserted: false, text: NONE };
  return { asserted: true, text: 'Owner-approved correspondence: ' + r.authoritative_source_term + ' (' + r.methodology_source_id + ', ' + r.source_version
    + ', source hash ' + r.methodology_source_sha256.slice(0, 12) + ', owner approval ' + r.approval_date + ').' };
}

// The minimal fields a display needs, taken only from records that are approved.
export function approvedSnapshot(register, sources) {
  return register.records.filter((r) => r.status === 'APPROVED_CORRESPONDENCE').map((r) => {
    const s = sources.find((x) => x.id === r.methodology_source_id) || {};
    return { status: r.status, term_category: r.term_category, candidate_term: r.candidate_term, authoritative_source_term: r.authoritative_source_term, methodology_source_id: r.methodology_source_id,
             methodology_source_sha256: r.methodology_source_sha256, source_version: s.version || null, approval_date: r.owner_approval.approval_date, correspondence_id: r.correspondence_id };
  });
}
