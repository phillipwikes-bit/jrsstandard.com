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

export default async function handler(){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });

  try {
    const r = await fetch(SB + '/rest/v1/interaction_events?source=eq.support&select=payload&limit=20000',
      { headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
    if (!r.ok) return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });
    const rows = await r.json();

    const byC = {}, byK = {}, perK = {};
    for (const row of rows) {
      const c = (row.payload && row.payload.country) || 'unknown';
      byC[c] = (byC[c] || 0) + 1;
      const k = (row.payload && row.payload.campaign) || 'general';
      byK[k] = (byK[k] || 0) + 1;
      (perK[k] = perK[k] || {});
      perK[k][c] = (perK[k][c] || 0) + 1;
    }
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

    // Named supporters: count-only read of the private pilot_contacts table
    // (source='support'), service-role, no PII returned.
    let named = 0;
    try {
      const nr = await fetch(SB + '/rest/v1/pilot_contacts?source=eq.support&select=id', {
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Prefer': 'count=exact', 'Range': '0-0' } });
      const cr = nr.headers.get('content-range') || '';
      const m = cr.match(/\/(\d+)$/);
      if (m) named = parseInt(m[1], 10) || 0;
    } catch (e) { /* count is best-effort */ }

    return json({ total: rows.length, countries: countries, named_supporters: named, by_country: by_country, by_campaign: by_campaign, campaigns: campaigns });
  } catch (e) {
    return json({ total: 0, countries: 0, by_country: [], by_campaign: [], campaigns: [] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
  });
}
