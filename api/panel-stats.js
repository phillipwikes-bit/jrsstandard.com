export const config = { runtime: 'edge' };

import { resolvePanelGeo } from './_panel-countries.js';

// THE PUBLISHED REVIEWER FIGURES, COMPUTED LIVE.
//
// These four numbers appear in the credentials line on six public pages. They
// were hardcoded, and on 2026-08-11 they were found stale: a reviewer completed
// a full set and the site kept reporting the previous totals for most of a day,
// because nothing connected the sentence to the database. This endpoint is that
// connection. Every page now reads from here and keeps its hardcoded value only
// as the fallback if the fetch fails.
//
// Anon key only, and only the aggregate progress views. No name, no email, no
// country of any individual, and no per-person row leaves this function.
//
// GET only. Counts only.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';
const ANON = 'sb_publishable_mkdtg6-NgJ44_JVr9vZf6Q_30BVgY4e';
const NEEDED = 24;

// Identity resolutions, not statistics, which is why they are constants.
// Resolved from bench_experts with the service-role connection on 2026-08-06
// and fixed since: three expert-rater codes belong to people already counted as
// Arm A completers, so counting them again would double-count a human being.
const SAME_PERSON_AS_ARM_A = ['E-09', 'E-12', 'E-13'];
// One label, no identity on record, so it cannot be resolved to a person and is
// left out rather than inflating the figure by one.
const UNRESOLVABLE = ['E-11'];

// ---------------------------------------------------------------------------
// RUNG 2a INSTRUMENT EFFECT: THE LOCKED ANALYSIS SAMPLE.
//
// These SIX numbers are the sample the published statistics were computed on:
// 69.4% versus 6.2%, 95% CI 60.2 to 77.3, Fisher's exact p = 1.6e-06, rate ratio
// 11.1. They are a dated snapshot, NOT a live count, and that is deliberate.
//
// WHY THEY ARE NOT COMPUTED LIVE, WHICH IS THE OBVIOUS THING TO DO HERE.
// The structured group has grown since the analysis was run: live is 22
// reviewers and 113 labels against the locked 21 and 108. Rendering the live
// count into the sentence would put "22 reviewers" next to a confidence
// interval, a p-value and a rate ratio computed on 21, so the sentence would
// contradict its own statistics on a buyer-facing page. That is a worse defect
// than a frozen literal, because it is not visibly stale, it is internally
// inconsistent.
//
// It would also settle an open question that is not this file's to settle.
// research/Accuracy_Sweep_2026-08-01.md records a standing hold: the owner has
// not yet decided whether the Rung 2a set is still accumulating or is a curated
// locked set, and the answer moves trained-reviewer AC1 between 0.63 and 0.18,
// either side of the pre-registered 0.61 floor. That file says of these exact
// figures: "BLOCKED pending the dataset decision above. Do not touch."
//
// So they live here, as one source the pages bind to and nobody can hand-edit
// in a paragraph, carrying the date they were locked and reported alongside the
// live recount plus a drift flag. scripts/check_zero_drift.py fails when the
// two diverge, so the lock cannot rot unnoticed: today it diverges, and the
// guard says so rather than hiding it.
const R2A_LOCK_DATE = '2026-08-01';
const R2A_LOCKED_STRUCTURED_REVIEWERS = 21;
const R2A_LOCKED_STRUCTURED_LABELS = 108;
const R2A_LOCKED_STRUCTURED_GAPS = 75;
const R2A_LOCKED_UNSTRUCTURED_REVIEWERS = 3;
const R2A_LOCKED_UNSTRUCTURED_LABELS = 16;
const R2A_LOCKED_UNSTRUCTURED_GAPS = 1;

// bench_labels.mode carries the arm: 'jrs' applied the five conditions,
// 'normal' did not. determination 'gap_identified' is the unreconstructable
// call. Both mappings are confirmed by reproduction: the locked sample's
// unstructured group reproduces exactly at 3 reviewers, 16 labels, 1 gap,
// which is the 6.2% in the published sentence.
const R2A_STRUCTURED_MODE = 'jrs';
const R2A_UNSTRUCTURED_MODE = 'normal';
const R2A_UNRECONSTRUCTABLE = 'gap_identified';

// COUNTRIES AND CONTINENTS CANNOT BE COMPUTED HERE AND ARE NOT PRETENDED TO BE.
//
// No country is stored in any anon-readable table: pilot_progress and
// armb_progress carry a code and a read count and nothing else, and the
// identities that carry a country live in bench_experts, which is RLS-locked
// for good reason. The reviewer countries exist only in the transcribed roster
// in research/build_expert_roster.py, which is private and never deployed.
//
// So this stays a maintained constant, and it is reported with the date it was
// last derived and a source field saying plainly that it is transcribed rather
// than live. A number that cannot refresh itself should say so instead of
// sitting next to three that can and borrowing their credibility.
// Rederive with: python3 research/build_expert_roster.py
// SUPERSEDED 2026-08-13. Countries and continents are COMPUTED at request time
// from the codes that actually completed.
//
// The transcribed constants that used to live here were kept as a fallback, and
// a standing drift check found them still in place on 2026-08-13. They were a
// hidden drift vector, not a safety net: if the resolver returned nothing, the
// endpoint published two hand-typed numbers while `geo_source` still said
// "computed", which is a stale figure wearing a live figure's clothes. That is
// the exact defect this endpoint was rewritten to remove.
//
// A figure that cannot be computed now reports null and says why, so a reader
// sees an absence rather than a number they cannot trust. The values the
// computation was validated against, 16 and 5, are recorded in the tracker and
// reproducible with: python3 research/build_expert_roster.py

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // Short cache: these move a few times a week at most, and a stale minute
      // is a far smaller problem than a stale day was.
      'Cache-Control': 'public, max-age=60, s-maxage=60'
    }
  });
}

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const H = { 'apikey': ANON, 'Authorization': 'Bearer ' + ANON };
  async function get(path){
    const r = await fetch(SB + '/rest/v1/' + path, { headers: H });
    if (!r.ok) throw new Error('read_failed');
    return r.json();
  }

  let armA, armB, labels;
  try {
    const out = await Promise.all([
      get('pilot_progress?select=code,total_reads&limit=5000'),
      get('armb_progress?select=code,reads&limit=5000'),
      get('bench_labels?select=labeler_code,mode,determination&limit=20000')
    ]);
    armA = out[0]; armB = out[1]; labels = out[2];
  } catch (e) {
    return json({ error: 'db_read_failed' }, 502);
  }

  const readsA = armA.map(function(r){ return r.total_reads || 0; });
  const readsB = armB.map(function(r){ return r.reads || 0; });

  const completersA = readsA.filter(function(n){ return n >= NEEDED; }).length;
  const completersB = readsB.filter(function(n){ return n >= NEEDED; }).length;

  // The codes that actually completed, which is what the country count is now
  // derived from. Previously this was a hand-maintained constant.
  const codesA = armA.filter(function(r){ return (r.total_reads || 0) >= NEEDED; }).map(function(r){ return r.code; });
  const codesB = armB.filter(function(r){ return (r.reads || 0) >= NEEDED; }).map(function(r){ return r.code; });
  const completerCodes = codesA.concat(codesB);
  const geo = resolvePanelGeo(completerCodes);

  // TWO SCOPES, BOTH COMPUTED, BECAUSE ATTACHING THE WRONG ONE HAS ALREADY GONE
  // WRONG ONCE. The tracker records "54 international reviewers across 16
  // countries" as a defect: 16 belongs to the full-set COMPLETERS, never to all
  // reviewers. The manuscript and research.html publish 11 for the detection
  // panel alone. Publishing both, each labelled, removes the choice.
  const geoDetection = resolvePanelGeo(codesA);

  // Everyone who has graded at least one record, which is the basis of the
  // published sentence and deliberately includes reviewers partway through.
  const graded = readsA.filter(function(n){ return n > 0; }).length
               + readsB.filter(function(n){ return n > 0; }).length;

  // Study 004, the reliability set. Its raters graded records for this work and
  // were once left out of the published figure entirely.
  const raters = {};
  labels.forEach(function(r){ if (r.labeler_code) raters[r.labeler_code] = true; });
  const rater = Object.keys(raters);
  const experts = rater.filter(function(c){ return c.indexOf('E-') === 0; });
  const bench = rater.length - experts.length;
  const newExperts = experts.filter(function(c){
    return SAME_PERSON_AS_ARM_A.indexOf(c) < 0 && UNRESOLVABLE.indexOf(c) < 0;
  }).length;

  const reviewers = graded + newExperts + bench;
  const completers = completersA + completersB;

  // Rung 2a instrument effect, recounted live so the locked sample above is
  // compared against the database on every request rather than taken on trust.
  function r2a(mode){
    const rows = labels.filter(function(r){ return r.mode === mode; });
    const who = {};
    rows.forEach(function(r){ if (r.labeler_code) who[r.labeler_code] = true; });
    const gaps = rows.filter(function(r){ return r.determination === R2A_UNRECONSTRUCTABLE; }).length;
    return { reviewers: Object.keys(who).length, labels: rows.length, gaps: gaps };
  }
  const liveStructured = r2a(R2A_STRUCTURED_MODE);
  const liveUnstructured = r2a(R2A_UNSTRUCTURED_MODE);
  const r2aDrift = (liveStructured.reviewers !== R2A_LOCKED_STRUCTURED_REVIEWERS
                 || liveStructured.labels !== R2A_LOCKED_STRUCTURED_LABELS
                 || liveStructured.gaps !== R2A_LOCKED_STRUCTURED_GAPS
                 || liveUnstructured.reviewers !== R2A_LOCKED_UNSTRUCTURED_REVIEWERS
                 || liveUnstructured.labels !== R2A_LOCKED_UNSTRUCTURED_LABELS
                 || liveUnstructured.gaps !== R2A_LOCKED_UNSTRUCTURED_GAPS);

  // null, never a substituted constant, when resolution produced nothing.
  const countriesAll  = geo.resolved > 0 ? geo.countries : null;
  const continentsAll = geo.resolved > 0 ? geo.continents : null;
  const registered    = armA.length + armB.length;

  return json({
    generated_at: new Date().toISOString(),

    // ---------------------------------------------------------------------
    // SCOPED KEYS. Added 2026-08-14, and every published figure should use
    // these rather than the aliases below.
    //
    // WHY. `countries` meant "countries of all completers" in one paragraph
    // and "countries of the detection panel" in another, and a reader could
    // not tell which from the sentence. That ambiguity is the whole of the
    // top-versus-bottom mismatch documented in
    // research/FIGURE_DRIFT_ROOT_CAUSE.md: research.html said 36 completers
    // across 16 countries at the top and 16 completers across 11 countries
    // further down, both true, neither naming its population.
    //
    // No new figure is computed here. Every value below already existed under
    // a less precise name. The `_scope` strings travel with the numbers so a
    // page can print the denominator instead of leaving it to be inferred.
    // ---------------------------------------------------------------------
    completers_all: completers,
    completers_detection: completersA,
    completers_comparison: completersB,
    countries_all: countriesAll,
    countries_detection: geoDetection.countries,
    continents_all: continentsAll,
    // The manuscript and several public pages state the detection panel's
    // continent span in prose. It was the one figure of the set with no key, so
    // it stayed hardcoded. It is the same resolver call already made above.
    continents_detection: geoDetection.continents,
    reviewers_all: reviewers,
    registered_all: registered,

    // RUNG 2a INSTRUMENT EFFECT. The LOCKED analysis sample, which is what the
    // published sentence and its statistics rest on. Pages bind to these four.
    rung2a_structured_reviewers: R2A_LOCKED_STRUCTURED_REVIEWERS,
    rung2a_structured_labels: R2A_LOCKED_STRUCTURED_LABELS,
    rung2a_unstructured_reviewers: R2A_LOCKED_UNSTRUCTURED_REVIEWERS,
    rung2a_unstructured_labels: R2A_LOCKED_UNSTRUCTURED_LABELS,

    // The same six figures recounted from the database right now, the date the
    // lock was taken, and whether the two still agree. Bound to no page: this is
    // the material the drift guard and the owner read.
    rung2a_locked_on: R2A_LOCK_DATE,
    rung2a_live: {
      structured_reviewers: liveStructured.reviewers,
      structured_labels: liveStructured.labels,
      structured_gaps: liveStructured.gaps,
      unstructured_reviewers: liveUnstructured.reviewers,
      unstructured_labels: liveUnstructured.labels,
      unstructured_gaps: liveUnstructured.gaps
    },
    rung2a_sample_drift: r2aDrift,
    rung2a_note: 'The published rung2a_* keys are the LOCKED analysis sample of '
               + R2A_LOCK_DATE + ', not a live count, because the confidence interval, '
               + 'Fisher p and rate ratio quoted beside them were computed on it. '
               + 'rung2a_live is that same sample recounted now. '
               + (r2aDrift
                   ? 'THEY DISAGREE. The set has grown since the analysis was run, so '
                     + 'the published statistics have to be recomputed before the '
                     + 'figures beside them can move. Held pending an owner decision on '
                     + 'whether the Rung 2a set is accumulating or curated: see '
                     + 'research/Accuracy_Sweep_2026-08-01.md.'
                   : 'They agree, so the lock still describes the current database.'),

    // The words a page prints next to each figure. Held here so 18 pages
    // cannot describe the same population 18 slightly different ways.
    scope_labels: {
      completers_all: 'all completers, both arms',
      completers_detection: 'detection panel',
      completers_comparison: 'comparison study',
      countries_all: 'all completers',
      countries_detection: 'detection panel',
      continents_all: 'all completers',
      continents_detection: 'detection panel',
      reviewers_all: 'all three studies',
      registered_all: 'all three studies',
      rung2a_structured_reviewers: 'reliability set, applied the five conditions',
      rung2a_structured_labels: 'reliability set, applied the five conditions',
      rung2a_unstructured_reviewers: 'reliability set, worked without the conditions',
      rung2a_unstructured_labels: 'reliability set, worked without the conditions'
    },

    // ---------------------------------------------------------------------
    // ALIASES. The original key names, kept so nothing breaks mid-migration.
    // They are the SAME values, not a second computation. Prefer the scoped
    // names above in any new markup.
    // ---------------------------------------------------------------------
    reviewers: reviewers,
    completers: completers,
    countries: countriesAll,
    continents: continentsAll,
    detection_completers: completersA,
    detection_countries: geoDetection.countries,
    comparison_completers: completersB,
    registered: registered,
    reliability_raters: rater.length,
    reliability_bench_reviewers: bench,
    reliability_experts_counted: newExperts,

    basis: 'reviewers counts everyone who has graded at least one record across the '
         + 'three studies. completers graded all ' + NEEDED + ' records in their set. '
         + 'Both are computed at request time from pilot_progress, armb_progress and '
         + 'bench_labels, not transcribed from a roster.',
    // Never claims "computed" over a figure that was not computed. Until
    // 2026-08-13 this said computed unconditionally while the two figures beside
    // it could silently be hand-typed fallbacks.
    geo_source: geo.resolved > 0 ? 'computed' : 'unresolved',
    countries_scope: 'the ' + completers + ' reviewers who completed a full ' + NEEDED
                   + '-record set. NOT all ' + reviewers + ' reviewers: attaching this figure to the '
                   + 'reviewer total is a recorded past defect. detection_countries is the same '
                   + 'figure for the detection panel alone, which is what the manuscript publishes.',
    geo_resolved: geo.resolved,
    geo_unresolved: geo.unresolved,
    geo_note: 'countries and continents are COMPUTED at request time from the codes that '
            + 'actually completed, mapped to ISO 3166-1 alpha-2 in api/_panel-countries.js. '
            + 'They were maintained constants until 2026-08-13 and could drift; they no '
            + 'longer can. Add a completer and the count moves by itself. '
            + (geo.unresolved.length
                ? ('geo_unresolved lists ' + geo.unresolved.length + ' completer code(s) with no '
                   + 'country on file, counted as completers and never guessed: the two anonymous '
                   + 'Arm B participants and one whose country was not recorded.')
                : 'Every completer code resolved to a country.')
            + ' The map is bundled into this function and is never served, so no '
            + 'code-to-country pair leaves the server. Regenerate with research/build_expert_roster.py.'
  });
}
