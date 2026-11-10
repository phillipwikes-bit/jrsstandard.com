// DS-N1 experimental SP-13 / SP-14 candidate, read-only and source-bounded.
// These optional reviewer aids do not change findings, acceptance, finalization,
// Codebook rules, reviewer identity, evidence, or the signed/unsigned event log.
export const REFLECTIVE_GUIDANCE_VERSION = 'ds-n1.reflective-guidance/0.2.0-dev';

const LEARNING_NOTES = Object.freeze({
  RC1: 'Reconstructability concerns whether another reviewer can locate the relevant passage and understand the documented event without relying on recollection.',
  RC2: 'Basis identification requires an attributable source that actually addresses the claim. A citation or shared wording alone does not establish support.',
  RC3: 'Chronology requires attention to the event, the actor and its date. A matching date does not by itself establish what happened.',
  RC4: 'Decision-process traceability concerns the recorded reasoning that connects evidence to a conclusion, including material qualifications.',
  RC5: 'Sufficiency is a human judgment. An unresolved qualification or contrary passage must not disappear merely because the report is fluent.',
});

export const REFLECTIVE_GUIDANCE_LIMITATION =
  'Optional educational and reflective prompts only. No psychological assessment, independent calibration, case fact generation, learning from customer records, or approval authority.';

// Input is an already grounded buildCognitiveControls item, not raw record text.
// It is intentionally non-actionable: the established reviewer action controls
// remain the sole pathway for a reviewer disposition and its event history.
export function buildReflectiveGuidance(item) {
  if (!item || typeof item !== 'object' || !Object.hasOwn(LEARNING_NOTES, item.condition) ||
      typeof item.finding_id !== 'string' || !item.finding_id ||
      typeof item.question !== 'string' || !item.question.trim()) return null;
  const cited = Array.isArray(item.source_ids) ? item.source_ids.filter(x => typeof x === 'string' && x.trim()) : [];
  const source_context = cited.length
    ? `Claim references source IDs ${[...new Set(cited)].join(', ')}. Their evidentiary support is not established by this note.`
    : 'No source ID is identified in this prompt. Check the underlying finding before drawing a conclusion.';
  return {
    version: REFLECTIVE_GUIDANCE_VERSION,
    finding_id: item.finding_id,
    condition: item.condition,
    finding_status: item.finding_status,
    learning: {
      title: 'Why this documentation question matters',
      explanation: LEARNING_NOTES[item.condition],
      source_context,
      case_specific_issue: typeof item.finding_explanation === 'string' ? item.finding_explanation : null,
      limited_to: 'Condition-specific explanation associated with the selected finding, not case-specific adjudication.',
    },
    reflection: [
      { stage: 'Restrain', prompt: 'Do not treat the questioned statement as established merely because it appears complete.' },
      { stage: 'Reframe', prompt: item.question },
      { stage: 'Recalibrate', prompt: 'Examine the cited material, qualifications and any unresolved contrary information. Do not create missing facts.' },
      { stage: 'Release', prompt: 'Return to the existing reviewer actions and record a legitimate human disposition. This prompt cannot approve or release the record.' },
    ],
    changes_review_status: false,
    requires_additional_review_action: false,
    action_surface: 'existing_findings_and_actions',
    limitation: REFLECTIVE_GUIDANCE_LIMITATION,
  };
}
