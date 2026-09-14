import { fetchAll } from './_sb-fetch.js';
export const config = { runtime: 'edge' };

// Aggregate ALL download geography (counts only, no PII), for the
// programme status dashboard. Reads both 'guide-dl' (Investigator Guide
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
    if (p.file === 'JRS_Investigator_Field_Guide.pdf') return 'Investigator Guide (combined)';
    if (p.file === 'JRS-Reference-9d4f2a7c.pdf') return 'Reviewer Reference';
    return 'Training kit';
  }
  if (row.source === 'pdf-dl'){
    if (p.doc === 'standard') return 'JRS Standard (PDF)';
    if (p.doc === 'card')     return 'Rapid Review Card';
    return 'Document';
  }
  // guide-dl
  if (p.edition === 'employment')    return 'Investigator Guide: EEO';
  if (p.edition === 'fairhousing')   return 'Investigator Guide: Fair Housing';
  if (p.edition === 'international')  return 'Investigator Guide: International';
  return 'Investigator Guide';
}

export default async function handler(){
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[] });

  try {
    // PAGED, NOT LIMITED. The old call asked for limit=20000 and Supabase
    // returned its 1,000-row cap with HTTP 200 and no marker, so this chart
    // stopped at 31 August while the table held rows through 7 September.
    const { rows: allRows, complete } = await fetchAll(
      SB, 'interaction_events?source=in.(guide-dl,pdf-dl,kit-dl)&select=source,payload,created_at',
      {'apikey':SERVICE,'Authorization':'Bearer '+SERVICE});
    if (!complete && !allRows.length) return json({ total:0, countries:0, by_country:[], by_asset:[], by_source:[], by_day:[], assets:{ total:0, countries:0, by_country:[], by_asset:[] }, assets_detail:[] });
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
    // ONE COLUMN PER CALENDAR DAY, UTC, RUNNING TO TODAY, NOT ONE PER DAY THAT
    // HAPPENED TO HAVE A DOWNLOAD. Emitting only the days with events made a
    // quiet stretch invisible: the axis jumped 31 Aug to 4 Sep with no gap
    // drawn, so a reader could not tell a zero from a missing measurement, and
    // the chart read as broken on the days it mattered most. A zero is a
    // finding and it gets a column. This mirrors api/support-stats.js, which
    // had the same defect and the same fix.
    const seen = Object.values(gD).filter(d => d.day !== 'unknown')
                       .sort((a,b)=> a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
    const by_day = [];
    if (seen.length) {
      const todayISO = new Date().toISOString().slice(0, 10);
      const firstKey = seen[0].day, lastEvent = seen[seen.length - 1].day;
      const endKey = (todayISO > lastEvent) ? todayISO : lastEvent;
      const cur = new Date(firstKey + 'T00:00:00Z');
      const end = new Date(endKey + 'T00:00:00Z');
      while (cur <= end) {
        const k = cur.toISOString().slice(0, 10);
        by_day.push(gD[k] || { day: k, employment:0, fairhousing:0, international:0, total:0 });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
    // The questions a bare total cannot answer: how many days this covers, how
    // many were active, the busiest one, and whether it is still receiving
    // downloads at all. Stated as figures rather than left to be read off bars.
    const dl_peak = by_day.reduce((m,d)=> d.total > m ? d.total : m, 0);
    const dl_active = by_day.filter(d => d.total > 0).length;
    const dl_last = seen.length ? seen[seen.length - 1].day : null;
    const dl_today_key = new Date().toISOString().slice(0, 10);
    const dl_days_since = dl_last
      ? Math.round((Date.parse(dl_today_key + 'T00:00:00Z') - Date.parse(dl_last + 'T00:00:00Z')) / 86400000)
      : null;
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
    const ORDER = ['Investigator Guide: EEO','Investigator Guide: Fair Housing','Investigator Guide: International','JRS Standard (PDF)','Rapid Review Card','JRS Reviewer Reference','Investigator Guide (combined)'];
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
      days_span: by_day.length, days_with_activity: dl_active,
      peak_day_downloads: dl_peak, last_download_at: dl_last,
      days_since_last_download: dl_days_since,
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
