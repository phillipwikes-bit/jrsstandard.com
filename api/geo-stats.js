export const config = { runtime: 'edge' };

// Aggregate guide-download geography (counts only, no PII), for the
// pilot-status dashboard. Reads the 'guide-dl' rows from interaction_events
// via the service role and returns { total, countries, by_country }.
// Same public-aggregate policy as /api/enroll-stats.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

export default async function handler(){
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total:0, countries:0, by_country:[] });

  try {
    const r = await fetch(SB+'/rest/v1/interaction_events?source=eq.guide-dl&select=payload&limit=10000',
      { headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE} });
    if (!r.ok) return json({ total:0, countries:0, by_country:[] });
    const rows = await r.json();
    const by = {};
    for (const row of rows){
      const c = (row.payload && row.payload.country) || 'unknown';
      by[c] = (by[c]||0)+1;
    }
    const by_country = Object.entries(by)
      .map(([country,downloads])=>({country,downloads}))
      .sort((a,b)=>b.downloads-a.downloads);
    const countries = by_country.filter(x=>x.country!=='unknown').length;
    return json({ total: rows.length, countries: countries, by_country: by_country });
  } catch(e){
    return json({ total:0, countries:0, by_country:[] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}
  });
}
