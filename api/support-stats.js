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
  if (!SERVICE) return json({ total: 0, countries: 0, by_country: [], by_campaign: [] });

  try {
    const r = await fetch(SB + '/rest/v1/interaction_events?source=eq.support&select=payload&limit=20000',
      { headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
    if (!r.ok) return json({ total: 0, countries: 0, by_country: [], by_campaign: [] });
    const rows = await r.json();

    const byC = {}, byK = {};
    for (const row of rows) {
      const c = (row.payload && row.payload.country) || 'unknown';
      byC[c] = (byC[c] || 0) + 1;
      const k = (row.payload && row.payload.campaign) || 'general';
      byK[k] = (byK[k] || 0) + 1;
    }
    const by_country = Object.entries(byC)
      .map(([country, supporters]) => ({ country, supporters }))
      .sort((a, b) => b.supporters - a.supporters);
    const by_campaign = Object.entries(byK)
      .map(([key, supporters]) => ({ campaign: CAMPAIGN_LABEL[key] || key, supporters }))
      .sort((a, b) => b.supporters - a.supporters);
    const countries = by_country.filter(x => x.country !== 'unknown').length;

    return json({ total: rows.length, countries: countries, by_country: by_country, by_campaign: by_campaign });
  } catch (e) {
    return json({ total: 0, countries: 0, by_country: [], by_campaign: [] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }
  });
}
