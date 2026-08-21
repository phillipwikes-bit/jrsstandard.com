// SHARED STUDY-CLOSURE STATE. Single source of truth for whether the validation
// studies are accepting data. Underscore-prefixed to match _contributor-roster.js
// and _panel-countries.js: bundled into the edge functions, never served.
//
// CLOSED 2026-08-21 at the owner's instruction: "close all studies so no more
// data can be entered at this time."
//
// WHAT THIS DOES AND, MORE IMPORTANTLY, WHAT IT DOES NOT DO.
//
// The study corpora are written CLIENT-SIDE, straight from the review pages to
// Supabase with the anon key, not only through these endpoints:
//
//   bench-review.html      -> rest/v1/bench_labels, rest/v1/bench_preflight
//   submit-validation.html -> rest/v1/bench_outcomes
//   api/submit.js          -> ai_pilot_reads
//   api/register.js        -> ai_pilot_reads, bench_experts
//
// So this flag closes the FRONT DOOR: the review pages stop offering submission
// and the endpoints refuse writes. **IT IS NOT A DATABASE LOCK.** Anyone holding
// the anon key, which is public by design and ships inside the site HTML, could
// still POST directly to the REST API. Closing that path requires revoking anon
// INSERT on the study tables in Supabase, which needs a service-role or access
// token this deployment does not hold.
//
// THE REMAINING STEP IS RECORDED RATHER THAN IMPLIED:
//   [REQUIRED_ENV_PARAM: SUPABASE_ACCESS_TOKEN] Revoke anon INSERT on
//   bench_labels, bench_preflight, bench_outcomes, ai_pilot_reads and
//   bench_experts to make the closure enforceable at the database rather than
//   in the page. Until that is done the closure is procedural, not technical.
//
// Reopening is a one-line change here plus a redeploy. Nothing else needs to
// move, which is the point of keeping the flag in one file.

export const STUDIES_CLOSED = true;
export const CLOSED_AT = '2026-08-21';
export const CLOSED_REASON =
  'The validation studies are closed to new data. Analysis is complete and the '
  + 'results are being written up.';

// Every corpus this closure covers, named so a reader does not have to infer it.
export const CLOSED_STUDIES = [
  'Arm A detection panel (ai_pilot_reads)',
  'Arm B comparison study (ai_pilot_reads)',
  'Reliability corpus (bench_labels, bench_preflight)',
  'Real-case outcomes, all domains (bench_outcomes)',
  'Reviewer registration (bench_experts)',
  'Nightly cross-vendor reproducibility run (study_runs)'
];

// Standard refusal for an endpoint that would otherwise write study data.
export function closedResponse(){
  return new Response(JSON.stringify({
    ok: false,
    error: 'studies_closed',
    closed_at: CLOSED_AT,
    message: CLOSED_REASON
  }), { status: 423, headers: { 'Content-Type': 'application/json',
                                'Cache-Control': 'no-store',
                                'Access-Control-Allow-Origin': '*' } });
}
