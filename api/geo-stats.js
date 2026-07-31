export const config = { runtime: 'edge' };

// Aggregate ALL download geography (counts only, no PII), for the
// pilot-status dashboard. Reads both 'guide-dl' (Investigator Field Guide
// editions) and 'pdf-dl' (JRS Standard PDF, Rapid Review Card) rows from
// interaction_events via the service role and returns
// { total, countries, by_country, by_asset }.
// Same public-aggregate policy as /api/enroll-stats.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Internal smoke/deploy-test tags. Downloads recorded during development
// verification, excluded from every count so the dashboard shows real traffic.
function isTestSrc(s){
  s = String(s || '');
  return s === 'verify' || s === 'test' || s === 'selftest' || s.indexOf('deploytest') === 0;
}

function assetOf(row){
  const p = row.payload || {};
  if (row.source === 'kit-dl'){
    if (p.file === 'JRS_Rapid_Review_Card.pdf') return 'Rapid Review Card';
    if (p.file === 'JRS_Investigator_Field_Guide.pdf') return 'Field Guide (combined)';
    if (p.file === 'JRS-Reference-9d4f2a7c.pdf') return 'Reviewer Reference';
    return 'Training kit';
  }
  if (row.source === 'pdf-dl'){
    if (p.doc === 'standard') return 'JRS Standard (PDF)';
    if (p.doc === 'card')     return 'Rapid Review Card';
    return 'Document';
  }
  // guide-dl
  if (p.edition === 'employment')    return 'Field Guide: EEO';
  if (p.edition === 'fairhousing')   return 'Field Guide: Fair Housing';
  if (p.edition === 'international')  return 'Field Guide: International';
  return 'Field Guide';
}

export default async function handler(){
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[] });

  try {
    const r = await fetch(SB+'/rest/v1/interaction_events?source=eq.guide-dl&select=source,payload,created_at&limit=20000',
      { headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE} });
    if (!r.ok) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[] });
    const allRows = await r.json();
    // Drop internal test/deploy download rows so every total is real traffic.
    const rows = allRows.filter(row => !isTestSrc(row.payload && row.payload.src));

    const byC = {}, byA = {}, byS = {}, byD = {};
    for (const row of rows){
      const c = (row.payload && row.payload.country) || 'unknown';
      byC[c] = (byC[c]||0)+1;
      const a = assetOf(row);
      byA[a] = (byA[a]||0)+1;
      const s = (row.payload && row.payload.src) || 'unknown';
      byS[s] = (byS[s]||0)+1;

      // Per-day stack: guide editions kept separate, every other asset -> 'other'.
      const day = String(row.created_at || '').slice(0, 10) || 'unknown';
      if (!byD[day]) byD[day] = { day: day, employment:0, fairhousing:0, international:0, other:0, total:0 };
      let series = 'other';
      if (row.source === 'guide-dl'){
        const ed = row.payload && row.payload.edition;
        if (ed === 'employment' || ed === 'fairhousing' || ed === 'international') series = ed;
      }
      byD[day][series] += 1;
      byD[day].total += 1;
    }
    const by_country = Object.entries(byC)
      .map(([country,downloads])=>({country,downloads}))
      .sort((a,b)=>b.downloads-a.downloads);
    const by_asset = Object.entries(byA)
      .map(([asset,downloads])=>({asset,downloads}))
      .sort((a,b)=>b.downloads-a.downloads);
    const by_source = Object.entries(byS)
      .map(([source,downloads])=>({source,downloads}))
      .sort((a,b)=>b.downloads-a.downloads);
    const by_day = Object.values(byD)
      .filter(d => d.day !== 'unknown')
      .sort((a,b)=> a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
    const countries = by_country.filter(x=>x.country!=='unknown').length;

    return json({ total: rows.length, countries: countries, by_country: by_country, by_asset: by_asset, by_source: by_source, by_day: by_day });
  } catch(e){
    return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}
  });
}
