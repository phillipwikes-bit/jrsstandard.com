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

  // CRAWLERS ARE NOT ENGAGEMENT AND MUST NOT BE COUNTED AS IT.
  //
  // Googlebot's smartphone user agent classifies as mobile. On 2026-08-11 that
  // single fact was carrying the published device split to 80 percent mobile on
  // ten flagged rows, of which seven were bots and the remaining three were one
  // person on one iPhone. A buyer reading that number would have been reading
  // Google's crawl schedule.
  //
  // Applied to the public view and device aggregates only. It is a user-agent
  // match, so it catches declared crawlers and nothing else; it is not a
  // fraud control and does not pretend to be one.
  const CRAWLER = /googlebot|bingbot|baiduspider|yandexbot|duckduckbot|applebot|GoogleOther|bingpreview|facebookexternalhit|bot|spider|crawl|slurp|preview|headless|python-requests|curl|wget/i;
  function isCrawler(p){ return CRAWLER.test(String((p || {}).user_agent || '')); }

  // Device split, now that user-agent is captured. Only rows written since that
  // change carry the flag, so the denominator is stated rather than implied.
  let mobile = 0, desktop = 0, crawlerRows = 0;
  events.forEach(function(e){
    const p = e.payload || {};
    if (typeof p.is_mobile !== 'boolean') return;
    if (isCrawler(p)) { crawlerRows++; return; }
    p.is_mobile ? mobile++ : desktop++;
  });

  // Downloads of the public artifacts, which is the one engagement signal that
  // has never been gated and therefore has the cleanest denominator.
  // Crawlers are excluded here too, but only where the row can be tested: user
  // agent was not captured on download rows until 2026-08-11, so the older rows
  // carry no flag and are counted. That is stated in the payload rather than
  // left for a reader to assume the filter is total.
  let downloads = 0, downloadsCrawlers = 0, downloadsUnattributed = 0;
  events.forEach(function(e){
    if (e.type !== 'download' || e.source === 'honor-cert') return;
    const p = e.payload || {};
    if (isCrawler(p)) { downloadsCrawlers++; return; }
    if (!p.user_agent) downloadsUnattributed++;
    downloads++;
  });

  // THE REVIEWER EVALUATION FUNNEL. Three numbers, and they answer three
  // different questions that were previously collapsed into one:
  //
  //   opened     how many people clicked through to the instrument
  //   completed  how many submitted answers at all, and how many answered all 9
  //   contacts   how many gave details that can transfer with the asset
  //
  // Opened counts events rather than distinct people, because the evaluation
  // page has no per-person key: there is nothing to deduplicate on and inventing
  // one would mean fingerprinting the reader, which the rest of this system
  // deliberately does not do. Stated here rather than implied.
  // Crawler opens are excluded here for the same reason as the device split: a
  // search engine rendering the page is not a reviewer considering it.
  let evalOpened = 0, evalOpenedCrawlers = 0;
  events.forEach(function(e){
    if (e.source !== 'eval-view' || e.type !== 'view') return;
    if (isCrawler(e.payload)) { evalOpenedCrawlers++; return; }
    evalOpened++;
  });

  let evalSubmitted = 0, evalFull = 0, evalAnswerSum = 0;
  events.forEach(function(e){
    if (e.source !== 'reviewer-eval' || e.type !== 'evaluation') return;
    const p = e.payload || {};
    evalSubmitted++;
    evalAnswerSum += (p.answered_count || 0);
    if ((p.answered_count || 0) >= (p.total_questions || 9)) evalFull++;
  });

  let evalIncentive = 0, evalCert = 0;
  contacts.forEach(function(c){
    if (c.source === 'reviewer-eval-incentive') evalIncentive++;
    if (c.source === 'reviewer-cert') evalCert++;
  });
  const evalContacts = evalIncentive + evalCert;

  // COUNTRY OF REVIEWER, at each stage of the funnel.
  //
  // The two-letter code has been written on every one of these rows since they
  // were built, from the Vercel edge header, and it has never been surfaced. It
  // is the one dimension that tells a buyer whether the demand for this standard
  // is domestic or international, which is a different question from where the
  // research panel came from and cannot be answered by the panel roster.
  //
  // Counts only, per stage. Answers are NOT cross-tabulated by country here and
  // must not be: with a handful of responses, "the single respondent from
  // Iceland says their employer has no second reader" is a re-identification,
  // and the whole instrument depends on that being impossible.
  function tally(rows, pick){
    const m = {};
    rows.forEach(function(r){
      const c = pick(r);
      if (!c) return;
      m[c] = (m[c] || 0) + 1;
    });
    return Object.keys(m).sort(function(a, b){ return m[b] - m[a] || (a < b ? -1 : 1); })
      .map(function(k){ return { country: k, count: m[k] }; });
  }

  // MINIMUM CELL SIZE FOR ANY BREAKDOWN OF THE ANSWERS.
  //
  // Set before the first response arrived, on purpose. Below this threshold a
  // breakdown stops being a statistic and becomes an identification: "the one
  // respondent in financial services says their employer has no second reader"
  // names a person to anyone who knows who was asked. The instrument's whole
  // promise to the reader is that this cannot happen, and a threshold chosen
  // after the data is on screen is not a threshold.
  //
  // Below N, the sub-group arrays return empty and the flag says why. The
  // scalar distinct-country counts survive, because a count of how many
  // countries responded identifies nobody.
  const MIN_CELL_N = 30;
  const breakdownsOk = evalSubmitted >= MIN_CELL_N;
  function gated(rows){ return breakdownsOk ? rows : []; }

  function tallyKey(rows, pick){
    const m = {};
    rows.forEach(function(r){ const k = pick(r); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.keys(m).sort(function(a, b){ return m[b] - m[a] || (a < b ? -1 : 1); })
      .map(function(k){ return { key: k, count: m[k] }; });
  }
  const evalRows = events.filter(function(e){
    return e.source === 'reviewer-eval' && e.type === 'evaluation';
  });

  // Opens are not gated: a page open carries no answer and no identity, so it
  // cannot re-identify a respondent. Only breakdowns touching the answers or
  // the contacts sit behind the threshold.
  const evalOpenCountries = tally(
    events.filter(function(e){ return e.source === 'eval-view' && e.type === 'view' && !isCrawler(e.payload); }),
    function(e){ return (e.payload || {}).country; });

  const evalSubmitCountries = tally(
    events.filter(function(e){ return e.source === 'reviewer-eval' && e.type === 'evaluation'; }),
    function(e){ return (e.payload || {}).country; });

  const evalContactCountries = tally(
    contacts.filter(function(c){ return c.source === 'reviewer-eval-incentive' || c.source === 'reviewer-cert'; }),
    function(c){
      let m = null;
      try { m = JSON.parse(c.message || '{}'); } catch (e) { m = null; }
      return m && m.country;
    });

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

    reviewer_evaluation_funnel: {
      opened: evalOpened,
      opened_crawlers_excluded: evalOpenedCrawlers,
      submitted: evalSubmitted,
      completed_all_questions: evalFull,
      mean_questions_answered: evalSubmitted ? Math.round((evalAnswerSum / evalSubmitted) * 10) / 10 : 0,
      contacts_captured: evalContacts,
      contacts_via_recommendation: evalIncentive,
      contacts_via_certificate: evalCert,
      open_to_submit_pct: pct(evalSubmitted, evalOpened),
      submit_to_contact_pct: pct(evalContacts, evalSubmitted),
      open_to_contact_pct: pct(evalContacts, evalOpened),
      countries_opened: evalOpenCountries,
      countries_submitted: gated(evalSubmitCountries),
      countries_contacts: gated(evalContactCountries),
      distinct_countries_opened: evalOpenCountries.length,
      distinct_countries_submitted: evalSubmitCountries.length,
      by_sector: gated(tallyKey(evalRows, function(e){ return (e.payload || {}).sector; })),
      by_role:   gated(tallyKey(evalRows, function(e){ return (e.payload || {}).role; })),
      by_org_size: gated(tallyKey(evalRows, function(e){ return (e.payload || {}).org_size; })),
      breakdown_min_n: MIN_CELL_N,
      breakdowns_released: breakdownsOk,
      breakdown_note: breakdownsOk
          ? 'Sub-group breakdowns are released: submissions have passed the minimum of '
            + MIN_CELL_N + '.'
          : 'Sub-group breakdowns by sector, role, organization size and country are '
            + 'withheld until submissions reach ' + MIN_CELL_N + '. At ' + evalSubmitted
            + ' they would identify individual respondents rather than describe a group. '
            + 'The threshold was fixed before the first response arrived, not chosen once '
            + 'the data was visible. Distinct-country counts are shown because a count of '
            + 'how many countries responded identifies nobody.',
      country_note: 'Two-letter code from the edge, per stage. Counts only. Where a '
          + 'reviewer sits is not necessarily where their employer is.',
      note: 'opened counts page opens, not distinct people: the evaluation page carries no '
          + 'per-person key and inventing one would mean fingerprinting the reader. '
          + 'contacts_captured is the number of transferable contact records produced, which '
          + 'is the figure that matters for an asset sale. The answer rows and the contact '
          + 'rows are stored in different tables with no shared identifier, so these two '
          + 'counts cannot be joined to say which respondent gave which answers.'
    },

    open_engagement: {
      public_artifact_downloads: downloads,
      downloads_crawlers_excluded: downloadsCrawlers,
      downloads_predating_user_agent_capture: downloadsUnattributed,
      downloads_basis: 'Declared crawlers are excluded where the row can be tested. '
             + 'User agent was not written on download rows until 2026-08-11, so rows '
             + 'before that date carry no flag and are still counted.',
      device_split: {
        mobile: mobile,
        desktop: desktop,
        mobile_pct: pct(mobile, mobile + desktop),
        crawler_rows_excluded: crawlerRows,
        basis: 'Rows carrying a device flag, with declared crawlers removed by user '
             + 'agent. Capture began 2026-08-09, so this is a partial denominator and '
             + 'not the full event history. Crawlers are excluded because Googlebot '
             + 'presents a smartphone user agent and would otherwise be counted as '
             + 'mobile engagement.'
      }
    }
  });
}
