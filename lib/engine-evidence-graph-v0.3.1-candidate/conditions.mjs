// JRS EVIDENCE GRAPH 0.3.0: condition rules.
//
// Each rule reads only (a) the record's section map and explicitly dated events
// and (b) the candidate quotations the compiler has verified for that
// condition. It returns:
//   requirement_visible : the structural elements the rule needs are visibly present
//   visible_gaps        : elements visibly missing from the record
//   review_reasons      : reasons a human must decide
//   anchor              : a section to anchor the finding to when no evidence is cited
//   explanation         : a plain-English note for the reviewer
//
// Rules can only keep or lower a candidate's proposed status; they never raise it.
// None of them decides whether the decision was right or whether its support was
// substantively sufficient.

const ID = /\b[A-Z]{2,}(?:-[A-Z0-9]+)*-\d+\b|§\s*\d|\bsection\s+\d|\bitem\s+\d/i;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const RATIONALE = /\b(?:because|based on|found that|needs?|in order to|to reconcile|requires?)\b/i;
const NONE = /\b(?:none|not identified|n\/a|not applicable|no compensating)\b/i;
const OPEN_ENDED = /\b(?:until further notice|indefinite(?:ly)?|no expiry|open-ended)\b/i;

// RP-NEG-01 (Phase 7): a rationale negated within two words of its reason word is not counted.
export const NEGATED_RATIONALE = /\b(?:not|no|never|without)\s+(?:[A-Za-z]+\s+){0,2}?(?:need|needs|needed|require|requires|required|because|based on)\b/i;

const sectionText = (record, s) => (s ? record.slice(s.content_start, s.content_end) : '');
const byRole = (sections, role) => sections.find((s) => s.role === role) || null;

export function evaluateConditions(record, sections, events, verifiedByCondition, rules = new Set()) {
  const decision = byRole(sections, 'decision');
  const basis = byRole(sections, 'basis');
  const authority = byRole(sections, 'authority');
  const controls = byRole(sections, 'controls');
  const expiry = byRole(sections, 'expiry');
  const chronology = byRole(sections, 'chronology');
  const ev = (c) => verifiedByCondition[c] || [];
  const has = (c, types) => ev(c).some((e) => types.includes(e.assertion_type));

  const authorityText = sectionText(record, authority);
  const authorityIdentified = !!authority && (ID.test(authorityText) || DATE.test(authorityText));
  const controlsStated = !!controls && !NONE.test(sectionText(record, controls)) && sectionText(record, controls).length >= 12;
  const expiryText = sectionText(record, expiry);
  const expiryStated = !!expiry && /\b(?:expir\w*|valid until)\b/i.test(expiryText) && DATE.test(expiryText) && !OPEN_ENDED.test(expiryText);
  const basisText = sectionText(record, basis);

  const out = {};
  // Reconstructability.
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: decision || basis || null };
    if (!decision) r.visible_gaps.push('no_locatable_conclusion');
    else if (!basis) r.review_reasons.push('conclusion_without_traceable_basis');
    r.requirement_visible = !!decision && !!basis && has('reconstructability', ['stated_decision']) && ev('reconstructability').length >= 2;
    if (decision && basis && !r.requirement_visible) r.review_reasons.push('decision_and_linked_content_not_both_cited');
    r.explanation = !decision ? 'No section states a decision or conclusion, so what is to be reconstructed cannot be located.'
      : !basis ? 'A decision is stated but no section sets out a basis for it.'
        : 'A decision section and a basis section are both visible in the record.';
    out.reconstructability = r;
  }
  // Identifiable basis.
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: basis || authority || null };
    if (!authority) r.visible_gaps.push('no_authority_section');
    else if (!authorityIdentified) r.visible_gaps.push('authority_source_not_identified');
    if (!basis) r.review_reasons.push('no_basis_section');
    const cited = ev('identifiable_basis').filter((e) => ['stated_authority', 'stated_rationale', 'stated_source_reference'].includes(e.assertion_type));
    r.requirement_visible = cited.some((e) => ID.test(e.quote) || DATE.test(e.quote)) && authorityIdentified;
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push('no_cited_basis_with_identifier_or_date');
    r.explanation = !authority ? 'No section identifies who authorised the exception.'
      : !authorityIdentified ? 'An authority is named without a document identifier, item or date that would let a reviewer locate it.'
        : 'An authority with a locatable reference is visible in the record.';
    out.identifiable_basis = r;
  }
  // Chronology integrity.
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: chronology || expiry || null };
    if (!events.length) r.visible_gaps.push('no_explicit_dates');
    if (!expiryStated) r.visible_gaps.push('no_stated_expiry_date');
    // RP-CHR-03 (Phase 7): no dated decision anywhere in the record is a visible gap.
    if (rules.has('RP-CHR-03') && !events.some((e) => e.role === 'decision')) r.visible_gaps.push('no_dated_decision');
    r.requirement_visible = events.length >= 2 && has('chronology_integrity', ['stated_date', 'stated_expiry']);
    if (!r.requirement_visible && !r.visible_gaps.length) r.review_reasons.push('dated_sequence_not_cited');
    r.explanation = !events.length ? 'No explicitly dated event appears in the record; the sequence cannot be built.'
      : !expiryStated ? 'Dated events appear, but no expiry date is stated.'
        : events.length + ' explicitly dated events appear in the record.';
    out.chronology_integrity = r;
  }
  // Reasoning traceability.
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: [], anchor: basis || decision || null };
    const negated = (e) => rules.has('RP-NEG-01') && e.assertion_type === 'stated_rationale' && NEGATED_RATIONALE.test(e.quote);
    const rationaleCited = ev('reasoning_traceability').some((e) => ['stated_rationale', 'stated_source_reference'].includes(e.assertion_type) && !negated(e));
    if (ev('reasoning_traceability').some(negated) && !rationaleCited) r.review_reasons.push('negated_rationale_not_counted');
    if (decision && !basis) r.review_reasons.push('conclusion_without_basis');
    if (basis && !decision) r.review_reasons.push('basis_without_conclusion');
    if (basis && !RATIONALE.test(basisText) && !ID.test(basisText)) r.review_reasons.push('basis_states_no_reason_or_source');
    r.requirement_visible = !!decision && !!basis && rationaleCited && (RATIONALE.test(basisText) || ID.test(basisText));
    if (!r.requirement_visible && !r.review_reasons.length) r.review_reasons.push('rationale_path_not_cited');
    r.explanation = 'Reasoning is traced only where the record visibly states a reason or source and a decision. An outcome alone is not treated as reasoning.';
    out.reasoning_traceability = r;
  }
  // Sufficiency: visible gaps only; never "supported".
  {
    const r = { requirement_visible: false, visible_gaps: [], review_reasons: ['sufficiency_not_determinable_by_engine'], anchor: controls || expiry || null };
    if (!controlsStated) r.visible_gaps.push('no_compensating_control_stated');
    if (!expiryStated) r.visible_gaps.push('no_stated_expiry_date');
    if (!authorityIdentified) r.visible_gaps.push('authority_source_not_identified');
    r.explanation = r.visible_gaps.length ? 'One or more elements needed for later reconstruction are not visible in the record.'
      : 'The checked elements are visible. Whether the support was substantively sufficient is not determined.';
    out.sufficiency = r;
  }
  return out;
}
