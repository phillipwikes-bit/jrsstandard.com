export const config = { runtime: 'edge' };

// Aggregate ALL download geography (counts only, no PII), for the
// programme status dashboard. Reads both 'guide-dl' (Investigator Field Guide
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
    if (p.file === 'JRS_Investigator_Field_Guide.pdf') return 'Investigator Field Guide (combined)';
    if (p.file === 'JRS-Reference-9d4f2a7c.pdf') return 'Reviewer Reference';
    return 'Training kit';
  }
  if (row.source === 'pdf-dl'){
    if (p.doc === 'standard') return 'JRS Standard (PDF)';
    if (p.doc === 'card')     return 'Rapid Review Card';
    return 'Document';
  }
  // guide-dl
  if (p.edition === 'employment')    return 'Investigator Field Guide: EEO';
  if (p.edition === 'fairhousing')   return 'Investigator Field Guide: Fair Housing';
  if (p.edition === 'international')  return 'Investigator Field Guide: International';
  return 'Investigator Field Guide';
}

export default async function handler(){
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[] });

  try {
    const r = await fetch(SB+'/rest/v1/interaction_events?source=in.(guide-dl,pdf-dl,kit-dl)&select=source,payload,created_at&limit=20000',
      { headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE} });
    if (!r.ok) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[], assets:{ total:0, countries:0, by_country:[], by_asset:[] }, assets_detail:[] });
    const allRows = await r.json();
    // Drop internal test/deploy download rows so every total is real traffic.
    const clean = allRows.filter(row => !isTestSrc(row.payload && row.payload.src));

    // Split: guide editions (top-level, the "Investigator Guide Downloads"
    // section) vs every other asset (JRS Standard PDF, Rapid Review Card,
    // training kit, reviewer reference) which drive enterprise value.
    const guideRows = clean.filter(row => row.source === 'guide-dl');
    // Enterprise assets exclude the retired training kit (no longer downloadable).
    const assetRows = clean.filter(row => row.source !== 'guide-dl' && assetOf(row) !== 'Training kit');

    // ---- Guide group (3 editions only): total, by_country, by_asset, by_day ----
    const gC = {}, gA = {}, gS = {}, gD = {};
    for (const row of guideRows){
      const c = (row.payload && row.payload.country) || 'unknown';
      gC[c] = (gC[c]||0)+1;
      gA[assetOf(row)] = (gA[assetOf(row)]||0)+1;
      const s = (row.payload && row.payload.src) || 'unknown';
      gS[s] = (gS[s]||0)+1;
      const day = String(row.created_at || '').slice(0, 10) || 'unknown';
      if (!gD[day]) gD[day] = { day: day, employment:0, fairhousing:0, international:0, total:0 };
      const ed = row.payload && row.payload.edition;
      if (ed === 'employment' || ed === 'fairhousing' || ed === 'international'){ gD[day][ed] += 1; gD[day].total += 1; }
    }
    const by_country = Object.entries(gC).map(([country,downloads])=>({country,downloads})).sort((a,b)=>b.downloads-a.downloads);
    const by_asset = Object.entries(gA).map(([asset,downloads])=>({asset,downloads})).sort((a,b)=>b.downloads-a.downloads);
    const by_source = Object.entries(gS).map(([source,downloads])=>({source,downloads})).sort((a,b)=>b.downloads-a.downloads);
    const by_day = Object.values(gD).filter(d => d.day !== 'unknown').sort((a,b)=> a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
    const countries = by_country.filter(x=>x.country!=='unknown').length;

    // ---- Enterprise asset group: JRS Standard PDF, Rapid Card, kit, reference ----
    const aC = {}, aA = {};
    for (const row of assetRows){
      const c = (row.payload && row.payload.country) || 'unknown';
      aC[c] = (aC[c]||0)+1;
      aA[assetOf(row)] = (aA[assetOf(row)]||0)+1;
    }
    const a_by_country = Object.entries(aC).map(([country,downloads])=>({country,downloads})).sort((a,b)=>b.downloads-a.downloads);
    const a_by_asset = Object.entries(aA).map(([asset,downloads])=>({asset,downloads})).sort((a,b)=>b.downloads-a.downloads);
    const a_countries = a_by_country.filter(x=>x.country!=='unknown').length;

    // ---- Per-item detail: every asset on its own, with its own country split ----
    // Nothing shared into a common total. Guides listed first, then the rest.
    const ORDER = ['Investigator Field Guide: EEO','Investigator Field Guide: Fair Housing','Investigator Field Guide: International','JRS Standard (PDF)','Rapid Review Card','JRS Reviewer Reference','Investigator Field Guide (combined)'];
    const perItem = {};
    for (const row of clean){
      const a = assetOf(row);
      if (a === 'Training kit') continue; // retired, not shown
      const label = a === 'Reviewer Reference' ? 'JRS Reviewer Reference' : a;
      if (!perItem[label]) perItem[label] = { asset: label, group: (row.source === 'guide-dl' ? 'guide' : 'asset'), total: 0, byC: {} };
      const c = (row.payload && row.payload.country) || 'unknown';
      perItem[label].total += 1;
      perItem[label].byC[c] = (perItem[label].byC[c] || 0) + 1;
    }
    const assets_detail = Object.values(perItem).map(it => ({
      asset: it.asset,
      group: it.group,
      total: it.total,
      countries: Object.keys(it.byC).filter(c => c !== 'unknown').length,
      by_country: Object.entries(it.byC).map(([country,downloads])=>({country,downloads})).sort((a,b)=>b.downloads-a.downloads)
    })).sort((a,b)=>{
      const ia = ORDER.indexOf(a.asset), ib = ORDER.indexOf(b.asset);
      return (ia<0?99:ia) - (ib<0?99:ib);
    });

    return json({
      total: guideRows.length, countries: countries,
      by_country: by_country, by_asset: by_asset, by_source: by_source, by_day: by_day,
      assets: { total: assetRows.length, countries: a_countries, by_country: a_by_country, by_asset: a_by_asset },
      assets_detail: assets_detail
    });
  } catch(e){
    return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[], assets:{ total:0, countries:0, by_country:[], by_asset:[] }, assets_detail:[] });
  }
}

function json(obj){
  return new Response(JSON.stringify(obj), {
    headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}
  });
}
