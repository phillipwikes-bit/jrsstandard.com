// JRS MODEL CONFIGURATION — single source of truth for the model identifier.
//
// WHY THIS EXISTS (blocker B-005).
// The identifier was a string literal at six sites across five files. A model
// reaching end of life would then read as a change to the JRS methodology,
// which it is not: the five Review Conditions are stated in natural language
// and are model-independent by construction. The model is VERSIONED
// INFRASTRUCTURE, not part of the standard.
//
// BEHAVIOUR IS PRESERVED BY CONSTRUCTION. With no environment override set,
// this returns exactly the identifier that was previously hard-coded, so the
// deployed behaviour is unchanged unless someone deliberately sets the
// variable. There is no fallback chain and no automatic substitution: an
// override is used verbatim or the default is used verbatim.
//
// THIS DOES NOT IMPLY MODEL EQUIVALENCE. Changing the identifier changes the
// system under test. Any change requires re-running the reproducibility
// evidence before any claim derived from engine output is repeated.
//
// The override is read from the server environment only. It is never sent to
// a client and never read from a request, so it cannot be set by a caller.

// Pinned default. This is the identifier that was hard-coded at all six sites
// before 2026-09-14 and remains the deployed default.
export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

// Recorded review date. Anthropic lists this model as active with a stated
// retirement not sooner than 2026-10-15, so the identifier is to be reviewed
// before that date rather than discovered to be retired.
export const MODEL_REVIEW_BY = '2026-10-15';

// Change record. Append a row when the default changes; do not rewrite rows.
//   2026-09-14  claude-haiku-4-5-20251001  initial extraction from six literal
//                                          sites; no behaviour change
export const MODEL_CHANGE_RECORD = [
  { date: '2026-09-14', model: DEFAULT_MODEL, note: 'Extracted from six hard-coded sites. Behaviour unchanged.' },
];

export function jrsModel() {
  const env = (typeof process !== 'undefined' && process.env) || {};
  const override = String(env.JRS_MODEL_ID || '').trim();
  return override || DEFAULT_MODEL;
}
