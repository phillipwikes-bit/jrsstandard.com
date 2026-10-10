// JRS EVIDENCE CONTRACT 0.2.0: long-record intake plan (NO ANALYSIS).
//
// The analysis boundary is unchanged: a record longer than 8000 characters is
// refused for analysis. This module only describes such a record so a human can
// plan. It measures length, finds candidate section boundaries, proposes a
// deterministic segmentation that keeps original offsets, and lists where human
// review is required BEFORE any future segmented analysis could be considered.
//
// It does not analyse segments, does not combine findings, and does not imply
// that any part of a long record is supported. Its output carries
// analysis_performed: false and segmented_analysis_authorized: false, and the
// result validator rejects any other value.

import { LOCAL_SIZE_LIMIT_CHARS } from './contract.mjs';
import { recordSections } from './evidence.mjs';
import { detectInstructionRisk } from './boundary.mjs';

const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;

export function longRecordPlan(record, limit = LOCAL_SIZE_LIMIT_CHARS) {
  const length = record.length;
  const status = length < limit ? 'below_limit' : length === limit ? 'at_limit' : 'above_limit';
  const plan = {
    plan_version: 'jrs-long-record-plan/0.2.0',
    length_chars: length,
    limit_chars: limit,
    length_status: status,
    analysis_boundary: status === 'above_limit' ? 'refused_for_analysis' : 'within_analysis_limit',
    analysis_performed: false,
    segmented_analysis_authorized: false,
    findings_combined: false,
    segments: [],
    human_review_points: [],
    limitation: 'This plan measures and proposes only. No segment was analysed, no finding was produced or combined, and nothing in it indicates that any part of the record is supported.',
  };
  if (status !== 'above_limit') return plan;

  // Greedy packing of whole sections into segments of at most `limit`; a single
  // section longer than the limit is split at line boundaries, then hard-split.
  const units = [];
  for (const s of recordSections(record)) {
    if (s.end - s.start <= limit) { units.push({ start: s.start, end: s.end, sections: [s.name] }); continue; }
    let a = s.start;
    while (a < s.end) {
      let b = Math.min(a + limit, s.end);
      if (b < s.end) { const nl = record.lastIndexOf('\n', b - 1); if (nl > a) b = nl + 1; }
      units.push({ start: a, end: b, sections: [s.name], split_inside_section: true });
      a = b;
    }
  }
  let cur = null;
  for (const u of units) {
    if (cur && u.end - cur.start <= limit) { cur.end = u.end; cur.sections.push(...u.sections); if (u.split_inside_section) cur.split_inside_section = true; }
    else { if (cur) plan.segments.push(cur); cur = Object.assign({}, u, { sections: [...u.sections] }); }
  }
  if (cur) plan.segments.push(cur);
  plan.segments = plan.segments.map((s, i) => ({
    segment_id: 'SEG-' + String(i + 1).padStart(2, '0'),
    start_offset: s.start, end_offset: s.end, offset_unit: 'utf16_code_unit',
    length_chars: s.end - s.start,
    sections: [...new Set(s.sections)],
    split_inside_section: !!s.split_inside_section,
    analysed: false,
  }));

  const datedSegments = plan.segments.filter((s) => (record.slice(s.start_offset, s.end_offset).match(ISO_DATE) || []).length);
  if (datedSegments.length > 1) {
    plan.human_review_points.push({ point: 'chronology_spans_segments', segment_ids: datedSegments.map((s) => s.segment_id),
      reason: 'Dated passages occur in more than one segment, so the decision sequence cannot be reconstructed from any single segment. A human must reconcile the chronology across segments before any segmented analysis.' });
  }
  const risk = detectInstructionRisk(record);
  if (risk.record_instruction_risk === 'detected') {
    const hit = new Set();
    for (const sp of risk.quarantined_instruction_spans) for (const s of plan.segments) if (sp.start >= s.start_offset && sp.start < s.end_offset) hit.add(s.segment_id);
    plan.human_review_points.push({ point: 'instruction_risk_in_segments', segment_ids: [...hit],
      reason: 'Text in these segments reads as instructions to the review tool. It is preserved as record text and not executed; a human must review it before any segmented analysis.' });
  }
  if (plan.segments.some((s) => s.split_inside_section)) {
    plan.human_review_points.push({ point: 'section_split_across_segments', segment_ids: plan.segments.filter((s) => s.split_inside_section).map((s) => s.segment_id),
      reason: 'At least one record section is longer than the limit and had to be split, so its content is not self-contained in one segment.' });
  }
  plan.human_review_points.push({ point: 'cross_segment_dependency_unassessed', segment_ids: plan.segments.map((s) => s.segment_id),
    reason: 'Whether a statement in one segment depends on another segment has not been assessed. Segmented analysis is not authorized.' });
  return plan;
}
