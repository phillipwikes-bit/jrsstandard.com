export const config = { runtime: 'edge' };

// Aggregate initiative-support endorsements (counts only, no PII) for the
// pilot-status dashboard. Reads the 'support' rows from interaction_events via
// the service role and returns { total, countries, by_country, by_campaign }.
// Same public-aggregate policy as /api/geo-stats and /api/enroll-stats.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const CAMPAIGN_LABEL = {
  rtkw: 'The Right to Know Why',
  defend: 'The Decisions You Can Defend',
  general: 'General'
};

// Internal test/smoke-test click tags. Rows tagged with these src values were
// generated during development verification, not by real supporters, so they
// are excluded from every count the dashboard reports.
const TEST_SOURCES = { verify: true, test: true, selftest: true };

export default async function handler(){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });

  try {
    const r = await fetch(SB + '/rest/v1/interaction_events?source=eq.support&select=payload,created_at&order=created_at.asc&limit=20000',
      { headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
    if (!r.ok) return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });
    const rows = await r.json();

    const byC = {}, byK = {}, perK = {}, byS = {}, byDay = {};
    let counted = 0;
    for (const row of rows) {
      const rawSrc = (row.payload && row.payload.src) || 'none';
      // Suppressed at write time too; filtered here as well so any row that
      // predates the write guard stays out of the public count.
      if (TEST_SOURCES[rawSrc] || String(rawSrc).indexOf('deploytest') === 0) continue;
      counted++;
      const c = (row.payload && row.payload.country) || 'unknown';
      byC[c] = (byC[c] || 0) + 1;
      const k = (row.payload && row.payload.campaign) || 'general';
      byK[k] = (byK[k] || 0) + 1;
      (perK[k] = perK[k] || {});
      perK[k][c] = (perK[k][c] || 0) + 1;
      const s = (row.payload && row.payload.src) || 'none';
      byS[s] = (byS[s] || 0) + 1;
      // Endorsements per calendar day, UTC. The endorsement is a single GET with
      // no form behind it, so one row is one click and the daily series needs no
      // deduplication to mean what it says.
      const day = String(row.created_at || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    }

    // Dense series: every date between the first and last endorsement is present,
    // zeros included. A sparse series drawn as a bar chart silently closes the
    // gaps and makes a quiet week look like a busy one.
    const days = Object.keys(byDay).sort();
    const by_day = [];
    if (days.length) {
      const cur = new Date(days[0] + 'T00:00:00Z');
      const end = new Date(days[days.length - 1] + 'T00:00:00Z');
      while (cur <= end) {
        const k = cur.toISOString().slice(0, 10);
        by_day.push({ day: k, endorsements: byDay[k] || 0 });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    const peak = by_day.reduce((m, d) => d.endorsements > m ? d.endorsements : m, 0);
    const activeDays = by_day.filter(d => d.endorsements > 0).length;

    // WHEN DID THE LAST ONE ACTUALLY ARRIVE. A total with no date attached
    // cannot answer "is this thing still receiving clicks", which is the
    // question that matters and the one this endpoint kept failing to answer.
    const lastAt = days.length ? days[days.length - 1] : null;
    const todayKey = new Date().toISOString().slice(0, 10);
    const daysSince = lastAt
      ? Math.round((Date.parse(todayKey + 'T00:00:00Z') - Date.parse(lastAt + 'T00:00:00Z')) / 86400000)
      : null;

    // THE OUTAGE, PUBLISHED RATHER THAN LEFT AS A GAP IN THE SERIES.
    //
    // /api/support stopped writing on 2026-08-02 and handed the write to the
    // registration form. That form was removed on 2026-08-11 at 03:45Z, and
    // from then until the write was restored at 08:30Z the campaign screen told
    // every reader "Your support is recorded" and recorded nothing. Those
    // clicks are real and they are gone.
    //
    // Counted from the arrival log rather than reconstructed into this table:
    // a gate-view row carrying a campaign is one browser loading the campaign
    // screen, which is one click. They are NOT written back as endorsements,
    // because a derived row and a recorded row must never sit in the same
    // column of the same total.
    const OUTAGE_FROM = '2026-08-11T03:45:00Z';
    const OUTAGE_TO   = '2026-08-11T08:30:00Z';
    let lostClicks = 0;
    const lostDevices = {};
    try {
      const gr = await fetch(SB + '/rest/v1/interaction_events'
        + '?source=eq.gate-view&select=payload,created_at'
        + '&created_at=gte.' + encodeURIComponent(OUTAGE_FROM)
        + '&created_at=lt.' + encodeURIComponent(OUTAGE_TO) + '&limit=5000',
        { headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
      if (gr.ok) {
        const grows = await gr.json();
        for (const g of grows) {
          const gp = g.payload || {};
          if (!gp.campaign) continue;
          lostClicks++;
          lostDevices[String(gp.user_agent || 'unknown')] = 1;
        }
      }
    } catch (e) { /* the rest of the payload must still return */ }
    const by_source = Object.entries(byS)
      .map(([src, hits]) => ({ src, hits }))
      .sort((a, b) => b.hits - a.hits);
    const by_country = Object.entries(byC)
      .map(([country, supporters]) => ({ country, supporters }))
      .sort((a, b) => b.supporters - a.supporters);
    const by_campaign = Object.entries(byK)
      .map(([key, supporters]) => ({ campaign: CAMPAIGN_LABEL[key] || key, supporters }))
      .sort((a, b) => b.supporters - a.supporters);
    const countries = by_country.filter(x => x.country !== 'unknown').length;

    // Per-initiative breakdown: total + by-country, for every campaign that has
    // at least one supporter. Order rtkw, defend, then anything else.
    const campaigns = [];
    const order = ['rtkw', 'defend', 'general'];
    const keys = Object.keys(perK).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    for (const k of keys) {
      const cm = perK[k];
      const bc = Object.entries(cm)
        .map(([country, supporters]) => ({ country, supporters }))
        .sort((a, b) => b.supporters - a.supporters);
      const total = bc.reduce((s, x) => s + x.supporters, 0);
      campaigns.push({
        key: k,
        label: CAMPAIGN_LABEL[k] || k,
        total: total,
        countries: bc.filter(x => x.country !== 'unknown').length,
        by_country: bc
      });
    }

    // Named supporters: count-only read of the private pilot_contacts table,
    // service-role, no PII returned. Both the legacy source='support' rows and
    // the registration-gate rows (source='support-register') count, because a
    // person who registered by name through the gate is a named supporter by
    // exactly the same standard as one who came through the older route.
    let named = 0;
    try {
      const nr = await fetch(SB + '/rest/v1/pilot_contacts?source=in.(support,support-register)&select=id', {
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Prefer': 'count=exact', 'Range': '0-0' } });
      const cr = nr.headers.get('content-range') || '';
      const m = cr.match(/\/(\d+)$/);
      if (m) named = parseInt(m[1], 10) || 0;
    } catch (e) { /* count is best-effort */ }

    // Public supporter wall: ONLY rows whose supporter explicitly ticked the
    // "list my name publicly" box (payload.consent_public_list === true).
    // Project name + organization + initiative ONLY. Email is never selected,
    // never returned, never shown. This is the no-token public list: it holds
    // exactly the people who asked to be listed, and nobody else.
    let public_supporters = [];
    try {
      const pr = await fetch(SB + '/rest/v1/pilot_contacts?source=in.(support,support-register,guide-register,training-enroll)&select=name,organization,message&order=created_at.asc', {
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
      if (pr.ok) {
        const prows = await pr.json();
        for (const row of prows) {
          let p = {};
          try { p = JSON.parse(row.message || '{}'); } catch (e) { p = {}; }
          if (p.consent_public_list === true && row.name) {
            const camp = p.campaign || 'general';
            public_supporters.push({
              name: row.name,
              organization: row.organization || '',
              initiative: CAMPAIGN_LABEL[camp] || camp
            });
          }
        }
      }
    } catch (e) { /* public wall is best-effort */ }

    return json({ total: counted, countries: countries, named_supporters: named, public_supporters: public_supporters, by_country: by_country, by_campaign: by_campaign, by_source: by_source, campaigns: campaigns,
      by_day: by_day,
      days_span: by_day.length,
      days_with_activity: activeDays,
      peak_day_endorsements: peak,
      mean_per_active_day: activeDays ? Math.round((counted / activeDays) * 10) / 10 : 0,
      last_endorsement_at: lastAt,
      days_since_last_endorsement: daysSince,
      outage: {
        from: OUTAGE_FROM,
        to: OUTAGE_TO,
        clicks_not_recorded: lostClicks,
        distinct_devices: Object.keys(lostDevices).length,
        note: 'The endorsement write was broken across this window: the campaign '
            + 'screen told readers their support was recorded and nothing was '
            + 'written. These clicks are counted from the arrival log and are '
            + 'deliberately NOT added to the endorsement total, because a derived '
            + 'figure and a recorded one must not share a column. Before '
            + '2026-08-11T03:45Z a campaign click landed on a registration form, '
            + 'so an arrival there is not a lost endorsement: the reader saw a '
            + 'form and chose not to complete it.'
      },
      day_note: 'One row is one endorsement click, counted by UTC calendar day. The '
              + 'endorsement is a bare GET with no form behind it, so no deduplication '
              + 'is applied and none is needed. Days with no endorsements are present '
              + 'with a zero rather than omitted.' });
  } catch (e) {
    return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
  });
}
