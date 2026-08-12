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
// SUPERSEDED 2026-08-13. Countries and continents are now COMPUTED at request
// time from the codes that actually completed. These remain only as a fallback
// if the resolver returns nothing, and as the values the computation was
// validated against: resolving from api/_panel-countries.js reproduces 16 and 5
// exactly, which is what made the replacement safe.
const COUNTRIES_FALLBACK = 16;
const CONTINENTS_FALLBACK = 5;

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
      get('bench_labels?select=labeler_code&limit=20000')
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

  return json({
    generated_at: new Date().toISOString(),

    // The four figures the public pages render.
    reviewers: reviewers,
    completers: completers,
    countries: geo.countries || COUNTRIES_FALLBACK,
    continents: geo.continents || CONTINENTS_FALLBACK,

    // The components, so a figure can be checked without re-deriving it.
    detection_completers: completersA,
    detection_countries: geoDetection.countries,
    comparison_completers: completersB,
    registered: armA.length + armB.length,
    reliability_raters: rater.length,
    reliability_bench_reviewers: bench,
    reliability_experts_counted: newExperts,

    basis: 'reviewers counts everyone who has graded at least one record across the '
         + 'three studies. completers graded all ' + NEEDED + ' records in their set. '
         + 'Both are computed at request time from pilot_progress, armb_progress and '
         + 'bench_labels, not transcribed from a roster.',
    geo_source: 'computed',
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
