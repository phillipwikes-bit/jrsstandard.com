export const config = { runtime: 'edge' };

// JRS guide-download geography viewer (no token; secured only by this opaque,
// unlinked, noindex URL — same model as the roster viewer). Reads the
// 'guide-dl' rows from public.interaction_events via the service role and
// renders download counts by country, edition, and channel.
// If the URL ever leaks, rotate it by renaming this file.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

export default async function handler(){
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return new Response('Service unavailable', { status: 503 });

  const H = {'apikey':SERVICE,'Authorization':'Bearer '+SERVICE};
  let rows = [];
  try {
    const r = await fetch(SB+'/rest/v1/interaction_events?source=eq.guide-dl&select=payload,created_at&order=created_at.desc&limit=10000',{headers:H});
    if (!r.ok) return new Response('Upstream error', { status: 502 });
    rows = await r.json();
  } catch(e){ return new Response('Upstream error', { status: 502 }); }

  const total = rows.length;
  const byCountry = {}, byEdition = {}, bySrc = {};
  for (const row of rows){
    const p = row.payload || {};
    const c = p.country || '(unknown)';
    const ed = p.edition || '(unknown)';
    const s = p.src || '(untagged)';
    byCountry[c] = (byCountry[c]||0)+1;
    byEdition[ed] = (byEdition[ed]||0)+1;
    bySrc[s] = (bySrc[s]||0)+1;
  }
  const countries = Object.keys(byCountry).filter(c => c !== '(unknown)').length;

  function table(title, obj){
    const tr = Object.entries(obj).sort((a,b)=>b[1]-a[1])
      .map(([k,v])=>'<tr><td>'+String(k).replace(/[<>&]/g,'')+'</td><td>'+v+'</td></tr>').join('');
    return '<h2>'+title+'</h2><table><tr><th>Value</th><th>Downloads</th></tr>'+tr+'</table>';
  }

  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
    +'<title>Guide Download Geography</title>'
    +'<style>body{font-family:Inter,Arial,sans-serif;background:#050505;color:#F2F2F2;padding:28px;max-width:760px;margin:0 auto}'
    +'h1{font-size:20px}h2{font-size:14px;color:#BE9447;margin-top:26px}'
    +'table{border-collapse:collapse;width:100%;font-size:13px}'
    +'td,th{border:1px solid #2A2A2A;padding:6px 10px;text-align:left}th{color:#B3B3B3}'
    +'.note{color:#8A8A8A;font-size:12px;margin-top:6px}</style></head><body>'
    +'<h1>Guide Download Geography</h1>'
    +'<p>Geo-tracked downloads: <b>'+total+'</b> &middot; Countries represented: <b>'+countries+'</b></p>'
    +'<p class="note">Counts cover downloads since geo tracking went live (2026-07-17). Earlier downloads exist in the edition counter without location. Country is the downloader\'s ISO code from the edge network.</p>'
    +table('By country', byCountry)
    +table('By edition', byEdition)
    +table('By channel (src tag)', bySrc)
    +'</body></html>';

  return new Response(html, { headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'} });
}
