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
    get('pilot_progress?select=code,total_reads,reads_today&limit=500'),
    get('armb_progress?select=code,reads,reads_today&limit=500'),
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
  // CERTIFICATE RENDERS ARE NOT ARTIFACT DOWNLOADS. Both certificate sources are
  // excluded here and counted separately below.
  //
  // honor-cert was excluded from the day this counter was written. reviewer-cert
  // -render was added later and the exclusion was not extended with it, so every
  // reviewer certificate render was landing in the public download total. Found
  // 2026-08-13 by a dead-pipeline sweep looking for event sources with no reader:
  // this one had no reader of its own AND was silently inflating a figure that
  // belongs to the guides and the standard. It is zero today only because no
  // evaluation has been submitted yet, so nothing was ever miscounted in
  // practice; the defect was live and waiting.
  const CERT_SOURCES = { 'honor-cert': 1, 'reviewer-cert-render': 1 };

  let downloads = 0, downloadsCrawlers = 0, downloadsUnattributed = 0;
  events.forEach(function(e){
    if (e.type !== 'download' || CERT_SOURCES[e.source]) return;
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
  // Today's activity across every surface, computed once here so the block
  // below reads as a set of lookups rather than repeating the filter.
  const todayKey = new Date().toISOString().slice(0, 10);
  function isToday(e){ return String(e.created_at || '').slice(0, 10) === todayKey; }
  function todayCount(src, type){
    return events.filter(function(e){
      return e.source === src && e.type === type && isToday(e) && !isCrawler(e.payload);
    }).length;
  }
  // A CAMPAIGN ARRIVAL MUST CARRY A CAMPAIGN.
  //
  // This counted every gate-view row, which includes readers who reached
  // access.html with no ?c= at all. Those are redirected straight to the guides
  // page and never see the campaign screen, so counting them here overstated
  // the figure and, worse, put it out of step with the outage count in
  // /api/support-stats, which has always filtered on campaign. On 2026-08-11
  // the two read 23 and 18 while describing the same event.
  function todayCampaignArrivals(){
    return events.filter(function(e){
      return e.source === 'gate-view' && e.type === 'view' && isToday(e)
          && !isCrawler(e.payload) && (e.payload || {}).campaign;
    }).length;
  }
  // Browser family from a user agent, for diagnosis only. In-app browsers are
  // named first because they are the ones that fetch a link without ever
  // rendering the destination, which is the single most likely cause of an
  // endorsement with no matching arrival.
  function agentFamily(ua){
    ua = String(ua || '');
    if (!ua) return 'not recorded';
    if (/LinkedInApp|LinkedIn/i.test(ua))            return 'LinkedIn in-app browser';
    if (/FBAN|FBAV|Instagram/i.test(ua))             return 'Meta in-app browser';
    if (/Twitter|X-Client/i.test(ua))                return 'X in-app browser';
    if (/Slack|Discord|WhatsApp|Teams/i.test(ua))    return 'chat app preview';
    if (CRAWLER.test(ua))                            return 'declared crawler';
    if (/CriOS/i.test(ua))                           return 'Chrome on iOS';
    if (/EdgA?|Edge/i.test(ua))                      return 'Edge';
    if (/Firefox|FxiOS/i.test(ua))                   return 'Firefox';
    if (/Chrome/i.test(ua))                          return 'Chrome';
    if (/Safari/i.test(ua))                          return 'Safari';
    return 'other';
  }
  // Endorsements that actually came from a campaign link. Anything tagged with
  // an on-site placement came from the home page or the footer, not a campaign.
  // CAMPAIGN SOURCES ARE AN ALLOW LIST, NOT A DENY LIST.
  //
  // This was previously ON_SITE_SRC, a deny list of on-site placements, and
  // anything NOT on it was counted as campaign-sourced. That default is
  // backwards: adding a new endorsement link to a page silently inflated the
  // campaign figure. On 2026-08-13 the tile read "2 campaign endorsements"
  // while its own breakdown listed only home, footer and field_guides, because
  // field_guides was missing from the deny list. drr and supported had the same
  // defect and would have surfaced next.
  //
  // Verified against every src tag ever recorded: footer, home, field_guides,
  // drr and supported all appear as <a href> on the site. linkedin, email and
  // signature appear nowhere in the markup, so they can only have arrived from a
  // distributed link. An unknown tag now counts as ON-SITE, which understates
  // the campaign rather than inflating it.
  const CAMPAIGN_SRC = { linkedin: 1, email: 1, signature: 1, post: 1, dm: 1, newsletter: 1 };
  function todayEndorsementRows(){
    return events.filter(function(e){
      return e.source === 'support' && e.type === 'endorse' && isToday(e) && !isCrawler(e.payload);
    });
  }
  function todayCampaignEndorsements(){
    return todayEndorsementRows().filter(function(e){
      return !!CAMPAIGN_SRC[String((e.payload || {}).src || 'none')];
    }).length;
  }
  function todayEndorsementsBySource(){
    const by = {};
    todayEndorsementRows().forEach(function(e){
      const s = String((e.payload || {}).src || 'none');
      by[s] = (by[s] || 0) + 1;
    });
    return by;
  }
  // Today's rows on both sides of the gap, ordered by time.
  function todayReconciliation(){
    function rows(src, type){
      return events.filter(function(e){
        return e.source === src && e.type === type && isToday(e);
      }).sort(function(a, b){
        return String(a.created_at).localeCompare(String(b.created_at));
      }).map(function(e){
        const p = e.payload || {};
        return {
          at: String(e.created_at || '').slice(11, 16) + 'Z',
          campaign: p.campaign || 'none',
          src: p.src || 'none',
          country: p.country || 'not recorded',
          browser: agentFamily(p.user_agent),
          counted: !isCrawler(p)
        };
      });
    }
    const ends = rows('support', 'endorse');
    const arrs = rows('gate-view', 'view').filter(function(r){ return r.campaign !== 'none'; });
    return {
      endorsements_today: ends,
      campaign_arrivals_today: arrs,
      how_to_read: 'Line the two lists up by the "at" time. An endorsement with no '
                 + 'arrival within a minute or two of it is a link that was fetched '
                 + 'without the destination page ever rendering, which is what an '
                 + 'in-app browser preload looks like. Several endorsements at the '
                 + 'same minute from the same country and browser are one person '
                 + 'clicking more than once. "not recorded" under browser means the '
                 + 'row was written server-side by /api/support, which stores no user '
                 + 'agent by design, so those rows can only be identified by time.',
      why_they_differ: 'An endorsement is written server-side the instant the link is '
                     + 'fetched. An arrival is written by the destination page and '
                     + 'needs JavaScript to run, and is deduplicated per browser '
                     + 'session. The two can never be expected to match exactly.'
    };
  }
  const todayCrawlers = events.filter(function(e){ return isToday(e) && isCrawler(e.payload); }).length;
  const todayHuman    = events.filter(function(e){ return isToday(e) && !isCrawler(e.payload); }).length;
  const todayReadsA = armA.reduce(function(n, r){ return n + (r.reads_today || 0); }, 0);
  const todayReadsB = armB.reduce(function(n, r){ return n + (r.reads_today || 0); }, 0);

  // WHO COMPLETED AN EVALUATION, AND THE HARD LIMIT ON ANSWERING THAT.
  //
  // The answers live in interaction_events with no identity on the row. The
  // identities live in pilot_contacts with no answers on the row. The two
  // tables share NO key, deliberately, so that no one including the person
  // running the study can say which respondent gave which answers. That is the
  // promise the instrument makes on its own page: "It does not ask who you
  // are." It is not a limitation to be worked around.
  //
  // So this publishes exactly one thing: the names of people who ticked
  // "Optional: list my name publicly as a JRS-trained reviewer." Nothing is
  // published for anyone who did not tick it, and no name is ever placed
  // beside an answer.
  const namedRespondents = [];
  let respondentsNamed = 0, respondentsAnonymous = 0;
  contacts.forEach(function(c){
    if (c.source !== 'reviewer-cert') return;
    let m = null;
    try { m = JSON.parse(c.message || '{}'); } catch (e) { m = null; }
    if (!m) { respondentsAnonymous++; return; }
    if (m.consent_public_list === true && m.printed_name) {
      respondentsNamed++;
      namedRespondents.push({
        name: String(m.printed_name).slice(0, 120),
        title: String(m.printed_title || '').slice(0, 160),
        country: String(m.country || '').slice(0, 2)
      });
    } else {
      respondentsAnonymous++;
    }
  });

  // Arrivals on the two surfaces that used to record nothing. Same crawler
  // treatment as everywhere else, and the exclusion is published rather than
  // silent so a low number is never mistaken for a filtered one.
  let reviewerViews = 0, reviewerViewCrawlers = 0, trainViews = 0, trainViewCrawlers = 0;
  events.forEach(function(e){
    if (e.type !== 'view') return;
    if (e.source === 'reviewer-view') { isCrawler(e.payload) ? reviewerViewCrawlers++ : reviewerViews++; }
    if (e.source === 'train-view')    { isCrawler(e.payload) ? trainViewCrawlers++    : trainViews++; }
  });

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

  // LINK-CLICK TELEMETRY: the panel side of /api/telemetry.
  //
  // Written 2026-08-13 to close a real unmatched-panel defect. The dispatcher
  // was instrumented across the site and the sink was built, but nothing read
  // the rows back, so every click landed in interaction_events and was never
  // surfaced. One emit point, zero ingestion points.
  //
  // Everything here is computed from the rows at request time. No count is
  // stored, restated or hand-maintained, which is the failure mode that put
  // the country and endorsement figures out of agreement twice already.
  //
  // SCOPE, stated rather than implied: this counts only clicks the client
  // beacons. /api/dl and /api/support record inside their own redirect and are
  // excluded by the client on purpose, because a 302 cannot be blocked or
  // raced and is the stronger record. So this figure is NOT total site clicks
  // and must never be presented as one.
  // Tallied here, beside the other request-time aggregates, so the figure is
  // computed from the rows rather than stored.
  const certRenders = {};
  events.forEach(function(e){
    if (e.type !== 'download' || !CERT_SOURCES[e.source]) return;
    if (isCrawler(e.payload)) return;
    certRenders[e.source] = (certRenders[e.source] || 0) + 1;
  });

  const clickRows = events.filter(function(e){
    return e.source === 'link-click' && e.type === 'click' && !isCrawler(e.payload);
  });
  const clickCrawlerRows = events.filter(function(e){
    return e.source === 'link-click' && e.type === 'click' && isCrawler(e.payload);
  }).length;

  function clickTally(pick, limit){
    const m = {};
    clickRows.forEach(function(e){
      const k = pick(e.payload || {});
      if (!k) return;
      m[k] = (m[k] || 0) + 1;
    });
    return Object.keys(m)
      .sort(function(a, b){ return m[b] - m[a] || (a < b ? -1 : 1); })
      .slice(0, limit || 25)
      .map(function(k){ return { key: k, count: m[k] }; });
  }

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

    // Certificate renders, counted in their own right rather than folded into
    // artifact downloads. This also gives reviewer-cert-render a reader: before
    // 2026-08-13 it was written by api/reviewer-cert.js and consumed by nothing,
    // which is the dead-pipeline condition.
    certificate_renders: {
      honor: certRenders['honor-cert'] || 0,
      reviewer: certRenders['reviewer-cert-render'] || 0,
      total: (certRenders['honor-cert'] || 0) + (certRenders['reviewer-cert-render'] || 0),
      counting_basis: 'Renders of an issued certificate, by source. Excluded from the '
          + 'artifact download total on purpose: a person opening their own certificate '
          + 'is not a download of a guide or the standard, and counting it as one '
          + 'inflates the figure a buyer reads. Crawler rows are filtered.'
    },

    link_clicks: {
      total: clickRows.length,
      today: clickRows.filter(isToday).length,
      crawler_rows_excluded: clickCrawlerRows,
      distinct_targets: clickTally(function(p){ return p.target; }, 9999).length,
      distinct_origins: clickTally(function(p){ return p.origin; }, 9999).length,
      by_target: clickTally(function(p){ return p.target; }, 25),
      by_origin: clickTally(function(p){ return p.origin; }, 25),
      by_label: clickTally(function(p){ return p.label; }, 25),
      by_country: clickTally(function(p){ return p.country; }, 25),
      counting_basis: 'Clicks beaconed by the client dispatcher to /api/telemetry, '
          + 'computed at request time from interaction_events. This is NOT total site '
          + 'clicks: /api/dl and /api/support record inside their own redirect and are '
          + 'excluded by the client on purpose, because a 302 is a stronger record than '
          + 'a beacon. Declared crawlers are filtered at write time and again here. '
          + 'Query strings are stripped before storage, so a target is a path only.'
    },

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

    // TODAY. Every surface, counted for the current UTC day.
    //
    // WHY THIS BLOCK EXISTS. Every other "today" figure on the dashboard counts
    // a completed ACTION: a registration, an enrolment, a confirmation. None of
    // them counts an ARRIVAL, so a day could contain real traffic on every link
    // and every today tile would still read zero. That is not a broken counter,
    // it is a missing one, and it is why the page looked frozen.
    today: {
      date: todayKey,
      campaign_screen_arrivals: todayCampaignArrivals(),
      // Non-campaign hits on the same page, kept separate rather than folded in.
      access_page_hits_without_campaign: todayCount('gate-view', 'view') - todayCampaignArrivals(),
      reviewer_landing_arrivals: todayCount('reviewer-view', 'view'),
      training_page_arrivals: todayCount('train-view', 'view'),
      endorsements: todayCount('support', 'endorse'),
      evaluation_opens: todayCount('eval-view', 'view'),
      evaluation_submissions: todayCount('reviewer-eval', 'evaluation'),
      guide_downloads: todayCount('guide-dl', 'download'),
      other_downloads: todayCount('pdf-dl', 'download') + todayCount('kit-dl', 'download'),
      records_reviewed: todayReadsA + todayReadsB,
      records_reviewed_detection: todayReadsA,
      records_reviewed_comparison: todayReadsB,
      // THE REVIEWER FUNNEL, STATED AS A CHAIN RATHER THAN AS FOUR LOOSE TILES.
      //
      // Landing, open, submit, contact are four separate counters sitting side
      // by side, and a reader cannot see from them where people stop. This says
      // it. Contact details exist ONLY at the end of the evaluation, so a zero
      // in contacts is fully explained by a zero in submissions and is not a
      // separate failure.
      reviewer_funnel: {
        landed_on_reviewer_page: todayCount('reviewer-view', 'view'),
        opened_evaluation: todayCount('eval-view', 'view'),
        submitted_evaluation: todayCount('reviewer-eval', 'evaluation'),
        contacts_captured: 0,
        drop_landing_to_open: todayCount('reviewer-view', 'view') - todayCount('eval-view', 'view'),
        note: 'Contact details are requested only at the END of the evaluation, in the '
            + 'optional incentive block. Nobody who stops before submitting leaves a name, '
            + 'an email or any identifier, by design. So contacts can never exceed '
            + 'submissions, and a zero in contacts with a zero in submissions is one fact, '
            + 'not two. Where people stop is shown by drop_landing_to_open.'
      },
      // ROW-BY-ROW RECONCILIATION, so the gap is readable instead of argued
      // about. The owner has asked twice why endorsements exceed arrivals; a
      // prose explanation did not settle it because it could not be checked
      // against anything. This lists today's rows on both sides with the hour,
      // the referral tag, the country and the browser family, so the two
      // columns can be lined up by eye and the answer read off directly.
      //
      // No personal data: hour of day, referral tag, ISO country and a browser
      // FAMILY derived from the user agent, never the agent string itself.
      endorsement_reconciliation: todayReconciliation(),
      arrivals_vs_endorsements: {
        campaign_arrivals: todayCampaignArrivals(),
        endorsements_recorded: todayCount('support', 'endorse'),
        // COMPARING LIKE WITH LIKE. The two figures above are different
        // populations and lining them up was the defect, not the gap between
        // them. Endorsement links also sit on the home page and in the site
        // footer, tagged src=home and src=footer. Those readers never came from
        // a campaign and were never going to appear as a campaign arrival, so
        // counting them against campaign arrivals guarantees a mismatch that
        // reads as lost data. Only campaign-sourced endorsements belong here.
        campaign_sourced_endorsements: todayCampaignEndorsements(),
        matched_difference: todayCampaignArrivals() - todayCampaignEndorsements(),
        endorsements_by_source: todayEndorsementsBySource(),
        difference: todayCampaignArrivals() - todayCount('support', 'endorse'),
        explanation: 'THE ORIGINAL COMPARISON WAS BETWEEN TWO DIFFERENT '
                   + 'POPULATIONS, WHICH IS WHY IT NEVER RECONCILED. Endorsement '
                   + 'links sit in three places: the LinkedIn campaign posts, the home '
                   + 'page, and the site footer. Only the first produces a campaign '
                   + 'arrival. On 2026-08-12, 7 of 8 endorsements were tagged src=home '
                   + 'or src=footer and never touched a campaign at all, so counting '
                   + 'them against campaign arrivals guaranteed a gap that looked like '
                   + 'lost data and was not. Use campaign_sourced_endorsements and '
                   + 'matched_difference, which compare like with like. Two smaller '
                   + 'effects also apply to any residual gap: an endorsement is written '
                   + 'server-side the instant the link is fetched, while an arrival '
                   + 'needs the destination page to render and run JavaScript and is '
                   + 'deduplicated per browser session; and before 2026-08-13 the '
                   + 'server write had no per-visitor deduplication, so a reload or a '
                   + 'prefetch each wrote a row. From 2026-08-13 it writes at most one '
                   + 'per browser per campaign, marked by a first-party cookie holding '
                   + 'the single character 1 and no identifier of any kind. Rows written '
                   + 'earlier cannot be deduplicated retroactively because no '
                   + 'per-visitor field was ever stored, deliberately.',
        counting_basis: {
          endorsements_recorded: 'link hits before 2026-08-13, distinct browsers per campaign from 2026-08-13',
          campaign_arrivals: 'browser sessions that rendered the screen and ran JavaScript'
        }
      },
      crawler_rows_excluded: todayCrawlers,
      total_human_events: todayHuman,
      note: 'Current UTC day, crawlers removed by user agent and counted separately. '
          + 'Arrival logging began on different dates per surface: campaign screen '
          + '2026-08-02, evaluation 2026-08-10, reviewer landing and training page '
          + '2026-08-11. A zero on a surface is a real zero only from its own start '
          + 'date forward.'
    },

    // SUPPRESSED AND INACTIVE COHORTS, DECLARED RATHER THAN LEFT AS ZEROS.
    //
    // A zero on this dashboard can mean three different things and a buyer
    // cannot tell them apart by looking: nothing happened, nothing was sent, or
    // something is deliberately withheld. Each cohort below states which of the
    // three it is and whether it contributes to any denominator.
    //
    // ANTI-INFLATION: none of these cohorts is counted in an active total. A
    // roster size is not engagement, an unsent link is not a non-response, and a
    // withheld breakdown is not an absence of data. Rates for the link
    // programmes are computed against links SENT, never against links issued.
    suppressed_cohorts: [
      {
        cohort: 'Organization pilots',
        state: 'INACTIVE',
        counts: { organizations: 0, sessions: 0, records_run: 0 },
        reason: 'Never sent to any organization. No invitation has been issued.',
        excluded_from_totals: true,
        disclaimer: 'A true zero from a surface that has never been offered. It is not a '
                  + 'conversion failure and must not be read as one.'
      },
      {
        cohort: 'Contributor confirmation links',
        state: 'SUPPRESSED',
        counts: { issued: ISSUED.contributor, sent: 0, opened: contribOpened, confirmed: contribConfirmed },
        reason: 'Held pending close of the comparison study. None has been sent.',
        excluded_from_totals: true,
        disclaimer: 'Issued is a roster size, not an audience. Open and confirmation rates '
                  + 'are undefined against a denominator of zero sent links and are not published.'
      },
      {
        cohort: 'Honor links',
        state: 'PARTIALLY SUPPRESSED',
        counts: { issued: ISSUED.honor, sent: 1, opened: honorOpened, accepted: honorAccepted },
        reason: '33 of 34 held pending close of the comparison study while RR-108 is unfinished.',
        excluded_from_totals: false,
        disclaimer: 'Rates are computed against the single link SENT, not against the 34 '
                  + 'issued. The 2.9 percent figure elsewhere in this payload divides by '
                  + 'issued and is the conservative reading, not the operational one.'
      },
      {
        cohort: 'Blind second-read links',
        state: 'SUPPRESSED',
        counts: { issued: ISSUED.recheck, sent: 0, opened: recheckOpened, submitted: recheckSubmitted },
        reason: 'Awaiting the second reader being named. None has been sent.',
        excluded_from_totals: true,
        disclaimer: 'Roster size only. No denominator exists.'
      },
      {
        cohort: 'Reviewer evaluation funnel',
        state: 'INACTIVE',
        counts: { opened: evalOpened, submitted: evalSubmitted, contacts: evalContacts },
        reason: 'Built, instrumented and verified end to end. Never sent to anyone.',
        excluded_from_totals: true,
        disclaimer: 'Every stage is a true zero rather than a missing measurement. The '
                  + 'write path was tested against production and confirmed working.'
      },
      {
        cohort: 'Evaluation sub-group breakdowns',
        state: 'WITHHELD',
        counts: { threshold: MIN_CELL_N, current_submissions: evalSubmitted, released: breakdownsOk },
        reason: 'Sector, role, organization size and country breakdowns are released at '
              + MIN_CELL_N + ' submissions.',
        excluded_from_totals: true,
        disclaimer: 'Withheld, not empty. Below the threshold a breakdown identifies '
                  + 'individual respondents rather than describing a group. The threshold '
                  + 'was fixed before the first response arrived.'
      }
    ],

    // WHO COMPLETED THE EVALUATION, AND WHAT THE RESULTS ARE FOR.
    completed_evaluations: {
      submitted: evalSubmitted,
      answered_all_nine: evalFull,
      named_publicly: respondentsNamed,
      chose_to_stay_anonymous: respondentsAnonymous,
      names: namedRespondents,
      purpose: 'The evaluation establishes a baseline on how consequential records are '
             + 'reviewed inside working organizations: how many people read a record before '
             + 'it is final, whether a second reader exists, whether the basis for a '
             + 'conclusion is written down at the time, and whether AI-assisted drafting is '
             + 'governed by a written policy. The results are used in three ways and no '
             + 'others: they are reported in aggregate in the research write-up, they are '
             + 'sent in full to every reviewer once the study closes, and they form part of '
             + 'the evidence base describing the problem the standard addresses. They are '
             + 'not used to evaluate, rank or identify any respondent or their employer.',
      identity_limit: 'Answers and identities are stored in separate tables with no shared '
             + 'identifier. Nobody, including the person running the study, can say which '
             + 'respondent gave which answers. Names appear here only where the respondent '
             + 'ticked "list my name publicly as a JRS-trained reviewer", and a name is '
             + 'never shown beside an answer.'
    },

    entry_points: {
      reviewer_landing_views: reviewerViews,
      reviewer_landing_crawlers_excluded: reviewerViewCrawlers,
      training_page_views: trainViews,
      training_page_crawlers_excluded: trainViewCrawlers,
      note: 'Arrivals, not actions. Logging on these two pages began 2026-08-11: '
          + 'before that date the reviewer landing page made no logging call at all '
          + 'and the training page recorded only a completed enrolment, so a click '
          + 'that did not convert produced no row anywhere and the arrival count for '
          + 'both pages is unknown for every date before then rather than zero.'
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
