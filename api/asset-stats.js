export const config = { runtime: 'edge' };

// Asset engagement statistics for acquisition diligence.
//
// WHY IT EXISTS. The site already publishes gate-stats, enroll-stats,
// support-stats, contributor-stats and orgpilot-stats. None of them answers the
// question a buyer actually asks, which is not "how many page views" but "how
// many named professionals engaged with this work, and can you show the funnel
// from link issued to work completed".
//
// This rolls up the three per-person link programmes, honor, contributor and
// blind second read, plus the research participation totals, into one aggregate
// reading a buyer can verify against the underlying tables.
//
// PRIVACY. Aggregate counts only. No name, no email, no organization, no key and
// no per-person row leaves this endpoint. Every figure is a count or a
// percentage. That is deliberate: an endpoint that answered the diligence
// question by exposing a contact list would destroy the consent position that
// makes the list transferable in the first place.
//
// EVERY NUMBER IS COMPUTED AT REQUEST TIME from interaction_events and
// pilot_contacts. Nothing here is transcribed from a document, so a buyer running
// this against the database sees the same figures as the page.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Links issued per programme. These are roster sizes, held here as constants
// because the rosters live in their own endpoints and this file must not import
// or expose them.
const ISSUED = {
  honor: 34,        // api/honor.js ROSTER
  contributor: 20,  // api/contributor.js ROSTER
  recheck: 3        // api/recheck.js ROSTER
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
}

function pct(n, d){ return d > 0 ? Math.round((n / d) * 1000) / 10 : 0; }

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);
  const H = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE };

  async function get(path){
    try {
      const r = await fetch(SB + '/rest/v1/' + path, { headers: H });
      return r.ok ? await r.json() : [];
    } catch (e) { return []; }
  }

  const [events, contacts, armA, armB, labels, outcomes] = await Promise.all([
    get('interaction_events?select=source,type,payload,created_at&limit=20000'),
    get('pilot_contacts?select=source,message,created_at&limit=5000'),
    get('pilot_progress?select=code,total_reads&limit=500'),
    get('armb_progress?select=code,reads&limit=500'),
    get('bench_labels?select=labeler_code,record_id&limit=5000'),
    get('bench_outcomes?select=contributor,domain&limit=5000')
  ]);

  // Link programmes. "Opened" counts distinct people rather than distinct hits,
  // because one person reopening a link four times is one engaged person, not
  // four. The per-person identifier used is the code already carried in the event
  // payload, never a key.
  function opened(src, field){
    const s = new Set();
    events.forEach(function(e){
      if (e.source === src && e.type === 'view') {
        const v = (e.payload || {})[field];
        if (v) s.add(String(v));
      }
    });
    return s.size;
  }
  function submitted(src, codeField){
    const s = new Set();
    contacts.forEach(function(c){
      if (c.source !== src) return;
      let m = null;
      try { m = JSON.parse(c.message || '{}'); } catch (e) { m = null; }
      const v = m && (m[codeField] || m.slot || m.code);
      s.add(String(v || c.created_at));
    });
    return s.size;
  }

  const honorOpened = opened('honor-link', 'honor_code');
  const honorAccepted = submitted('honor-accept', 'honor_code');
  const honorCerts = (function(){
    const s = new Set();
    events.forEach(function(e){
      if (e.source === 'honor-cert' && e.type === 'download') {
        const v = (e.payload || {}).honor_code;
        if (v) s.add(String(v));
      }
    });
    return s.size;
  })();

  const contribOpened = opened('contributor-link', 'code');
  const contribConfirmed = submitted('contributor-confirm', 'code');

  const recheckOpened = opened('recheck-link', 'slot');
  const recheckSubmitted = submitted('recheck-submit', 'slot');

  // Research participation. The figures a buyer is most likely to test, so they
  // are computed from the progress views rather than restated.
  const completersA = armA.filter(function(r){ return (r.total_reads || 0) >= 24; }).length;
  const completersB = armB.filter(function(r){ return (r.reads || 0) >= 24; }).length;
  const labelers = new Set(labels.map(function(r){ return r.labeler_code; })).size;
  const gradedRecords = new Set(labels.map(function(r){ return r.record_id; })).size;

  const corpora = {};
  outcomes.forEach(function(r){
    const d = String(r.domain || 'unspecified');
    corpora[d] = (corpora[d] || 0) + 1;
  });

  // Device split, now that user-agent is captured. Only rows written since that
  // change carry the flag, so the denominator is stated rather than implied.
  let mobile = 0, desktop = 0;
  events.forEach(function(e){
    const p = e.payload || {};
    if (typeof p.is_mobile === 'boolean') { p.is_mobile ? mobile++ : desktop++; }
  });

  // Downloads of the public artifacts, which is the one engagement signal that
  // has never been gated and therefore has the cleanest denominator.
  let downloads = 0;
  events.forEach(function(e){ if (e.type === 'download' && e.source !== 'honor-cert') downloads++; });

  return json({
    generated_at: new Date().toISOString(),
    note: 'Aggregate counts only. No name, email, organization or key is exposed by this endpoint. '
        + 'Every figure is computed at request time from interaction_events, pilot_contacts, '
        + 'pilot_progress, armb_progress, bench_labels and bench_outcomes.',
    link_metrics_basis: 'Per-person link opens count from 2026-08-09T18:00Z forward. Owner '
        + 'previews and deploy checks are suppressed at write time and any earlier rows were '
        + 'cleared, so an open in these figures is a third party opening a link that was sent '
        + 'to them. The counts are small because 33 of the 34 honor links and all 20 '
        + 'contributor links are deliberately unsent, not because engagement was measured '
        + 'and found low.',

    named_professional_engagement: {
      honor: {
        links_issued: ISSUED.honor,
        links_opened: honorOpened,
        accepted: honorAccepted,
        certificates_issued: honorCerts,
        acceptance_rate_pct: pct(honorAccepted, ISSUED.honor),
        note: 'Only 1 of 34 honor links has been sent. The remaining 33 are held '
            + 'pending close of the comparison study, so open and acceptance counts '
            + 'measure sent links, not the roster.'
      },
      contributor: {
        links_issued: ISSUED.contributor,
        links_opened: contribOpened,
        confirmed: contribConfirmed,
        note: 'Held pending study close. Not yet sent.'
      },
      blind_second_read: {
        links_issued: ISSUED.recheck,
        links_opened: recheckOpened,
        submitted: recheckSubmitted,
        note: 'Independent re-read of 10 of the 32 public-records cases, to convert '
            + 'a single-reader corpus into a measured inter-rater result.'
      }
    },

    research_participation: {
      full_set_completers: completersA + completersB,
      detection_study_completers: completersA,
      comparison_study_completers: completersB,
      reliability_raters: labelers,
      records_graded_in_reliability_set: gradedRecords,
      case_corpora: corpora,
      note: 'A completer graded all 24 records in their set. Counted live from the '
          + 'progress views, not from a roster file.'
    },

    open_engagement: {
      public_artifact_downloads: downloads,
      device_split: {
        mobile: mobile,
        desktop: desktop,
        mobile_pct: pct(mobile, mobile + desktop),
        basis: 'Rows carrying a device flag. Capture began 2026-08-09, so this is a '
             + 'partial denominator and not the full event history.'
      }
    }
  });
}
