export const config = { runtime: 'edge' };

// JRS Investigator Field Guide — download counter + redirect.
// A click on /api/dl?e=<edition>&src=<channel> records one append-only row in
// public.guide_downloads, then 302-redirects to the static PDF. The DB write is
// best-effort: if Supabase is unreachable or the service key is unset, the user
// still gets the file. Writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// edition token -> static PDF filename (served from the site root)
const FILES = {
  employment:   'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:  'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

function normEdition(e){
  e = String(e||'').toLowerCase().replace(/[^a-z]/g,'');
  if (e==='eeo'||e==='employment') return 'employment';
  if (e==='fairhousing'||e==='housing'||e==='fh') return 'fairhousing';
  if (e==='international'||e==='intl'||e==='int') return 'international';
  return '';
}

export default async function handler(req){
  const url = new URL(req.url);
  const edition = normEdition(url.searchParams.get('e'));
  const src = String(url.searchParams.get('src')||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40) || null;

  // Unknown/missing edition: send to the guides page rather than 404.
  if (!edition) return Response.redirect(url.origin + '/investigator-guides.html', 302);

  const target = url.origin + '/' + FILES[edition];

  // Best-effort append-only record. Never block the download on it.
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
    try {
      await fetch(SB+'/rest/v1/guide_downloads',{
        method:'POST',
        headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify({ edition: edition, src: src })
      });
    } catch(e){ /* swallow: the file must still be served */ }
  }

  return Response.redirect(target, 302);
}
