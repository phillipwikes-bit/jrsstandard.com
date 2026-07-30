export const config = { runtime: 'edge' };

// JRS Investigator Field Guide — download counter + redirect.
// A click on /api/dl?e=<edition>&src=<channel> records one append-only row in
// public.guide_downloads, then 302-redirects to the static PDF. The DB write is
// best-effort: if Supabase is unreachable or the service key is unset, the user
// still gets the file. Writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
// Country tracking: a second best-effort row goes to public.interaction_events
// (source 'guide-dl', payload {edition, src, country}) using the table's existing
// jsonb payload column, so no schema change is required anywhere.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// edition token -> static PDF filename (served from the site root)
const FILES = {
  employment:   'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:  'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

// Generic tracked documents (standard PDF, rapid-review card). These are logged
// to interaction_events only (source 'pdf-dl'), NOT to guide_downloads, so the
// field-guide download metric stays clean while every PDF pull is still captured.
const DOCS = {
  standard: 'JRS-Standard.pdf',
  card:     'JRS_Rapid_Review_Card.pdf'
};

function normEdition(e){
  e = String(e||'').toLowerCase().replace(/[^a-z]/g,'');
  if (e==='eeo'||e==='employment') return 'employment';
  if (e==='fairhousing'||e==='housing'||e==='fh') return 'fairhousing';
  if (e==='international'||e==='intl'||e==='int') return 'international';
  return '';
}

function normDoc(e){
  e = String(e||'').toLowerCase().replace(/[^a-z]/g,'');
  if (e==='standard'||e==='std'||e==='jrs') return 'standard';
  if (e==='card'||e==='rapidcard'||e==='rrc'||e==='reviewcard') return 'card';
  return '';
}

export default async function handler(req){
  const url = new URL(req.url);
  const rawE = url.searchParams.get('e');
  const edition = normEdition(rawE);
  const doc = edition ? '' : normDoc(rawE);
  const src = String(url.searchParams.get('src')||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40) || null;

  // Unknown/missing token: send to the guides page rather than 404.
  if (!edition && !doc) return Response.redirect(url.origin + '/investigator-guides.html', 302);

  const target = url.origin + '/' + (edition ? FILES[edition] : DOCS[doc]);

  // Best-effort append-only records. Never block the download on them.
  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
    const H = {'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json','Prefer':'return=minimal'};
    const country = String(req.headers.get('x-vercel-ip-country')||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2) || null;
    try {
      if (edition) {
        // Field-guide pull: keep the dedicated guide_downloads metric plus a geo event.
        await Promise.all([
          fetch(SB+'/rest/v1/guide_downloads',{ method:'POST', headers:H,
            body:JSON.stringify({ edition: edition, src: src }) }),
          fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
            body:JSON.stringify({ source:'guide-dl', type:'download', payload:{ edition: edition, src: src, country: country } }) })
        ]);
      } else {
        // Generic document pull (standard PDF, rapid-review card): event log only.
        await fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
          body:JSON.stringify({ source:'pdf-dl', type:'download', payload:{ doc: doc, file: DOCS[doc], src: src, country: country } }) });
      }
    } catch(e){ /* swallow: the file must still be served */ }
  }

  return Response.redirect(target, 302);
}
