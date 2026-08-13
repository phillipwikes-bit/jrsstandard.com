export const config = { runtime: 'edge' };

import { isNotAClick } from './_not-a-click.js';

// JRS download counter + redirect. Three tracked link shapes, one endpoint:
//   /api/dl?e=<edition>  Investigator Field Guide editions -> guide_downloads + interaction_events (source 'guide-dl')
//   /api/dl?e=standard|card  JRS Standard PDF / Rapid Review Card -> interaction_events (source 'pdf-dl')
//   /api/dl?f=<whitelisted-filename>  training kit PDFs + reference -> interaction_events (source 'kit-dl')
// Every write is best-effort via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS) and never
// blocks the 302 to the static file. Country is the edge ISO code only; no PII.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const FILES = {
  employment:   'JRS_Investigator_Field_Guide_Employment.pdf',
  fairhousing:  'JRS_Investigator_Field_Guide_FairHousing.pdf',
  international: 'JRS_Investigator_Field_Guide_International.pdf'
};

const DOCS = {
  standard: 'JRS-Standard.pdf',
  card:     'JRS_Rapid_Review_Card.pdf',
  // Added 2026-08-12. These three were linked directly from their pages, so
  // every download of them was invisible in the counts. Routing them here makes
  // them countable without changing what the reader receives.
  drr:      'DRR_Article.pdf',
  paper:    'JRS_Research_Paper.pdf',
  accuracy: 'JRS_Reliability_Accuracy.pdf'
};

// Whitelisted training-kit files (and the gated reference). Only these exact
// basenames are honored via ?f= , so the endpoint cannot be turned into an open
// redirect. Downloads log to interaction_events (source 'kit-dl').
// The 8 JRS_Kit_* implementation-kit files are intentionally NOT whitelisted:
// the training kit is retired and must not be downloadable anywhere. Only the
// standalone reference assets below remain available via ?f=.
// JRS-Reference-9d4f2a7c.pdf is served here because the 16 reference pages
// linked /JRS-Reference.pdf, a basename that DOES NOT EXIST and returned HTTP
// 404 on every one of them. Those pages now point at this endpoint, which both
// fixes the broken download and counts it.
const KITS = new Set([
  'JRS_Investigator_Field_Guide.pdf',
  'JRS_Rapid_Review_Card.pdf',
  'JRS-Reference-9d4f2a7c.pdf'
]);

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
  if (e==='drr'||e==='drrarticle') return 'drr';
  if (e==='paper'||e==='researchpaper') return 'paper';
  if (e==='accuracy'||e==='reliability') return 'accuracy';
  return '';
}

function normKit(f){
  f = String(f||'').replace(/[^A-Za-z0-9_.\-]/g,'').slice(0,80);
  return KITS.has(f) ? f : '';
}

export default async function handler(req){
  const url = new URL(req.url);
  const rawE = url.searchParams.get('e');
  const edition = normEdition(rawE);
  const doc = edition ? '' : normDoc(rawE);
  const kit = (edition || doc) ? '' : normKit(url.searchParams.get('f'));
  const src = String(url.searchParams.get('src')||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40) || null;

  // Unknown/missing token: send to the guides page rather than 404.
  if (!edition && !doc && !kit) return Response.redirect(url.origin + '/investigator-guides.html', 302);

  // CHANGED 2026-08-09: the three Investigator Field Guide editions are open
  // access again. A bare ?e= link releases the file directly, counted but not
  // gated, which is what the guides page now links to. Nobody is asked for a
  // name to read a free reference document.
  //
  // CHANGED 2026-08-11: the opt-in registration route is gone too. ?gate=1 and
  // the src=site|email|signature|footer tags used to forward an edition link to
  // the consent form; they no longer do, and every shape of ?e= link now
  // releases the file directly. Links already distributed with those tags keep
  // working and simply stop asking for a name.
  //
  // Rationale: the form took 20 opens and returned 0 completions between
  // 2026-08-02 and 2026-08-11. A gate returning zero is not capturing anything,
  // it is only losing readers.
  //
  // Measurement is unaffected. Country, edition and src are written on the
  // download itself below, not on the registration, so the geography of guide
  // readership is still counted exactly as before.
  //
  // The JRS Standard PDF, the Rapid Review Card (?e=standard|card), and the
  // whitelisted reference files (?f=) were never gated and remain open: those
  // are the public artifacts that carry citations.

  const target = url.origin + '/' + (edition ? FILES[edition] : doc ? DOCS[doc] : kit);

  // Internal smoke/deploy-test tags: never recorded, and any existing ones are
  // purged server-side so the download counts stay clean automatically.
  const isTest = !!src && (src === 'verify' || src === 'test' || src === 'selftest' || src.indexOf('deploytest') === 0);
  // A prefetched download link is not a download. Same reasoning as
  // /api/support: the file is still served, only the count is protected.
  const prefetched = isNotAClick(req);

  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
    const H = {'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json','Prefer':'return=minimal'};
    const country = String(req.headers.get('x-vercel-ip-country')||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2) || null;
    // ADDED 2026-08-11 so download counts can have crawlers filtered out of
    // them. Until now the download row carried no user agent, which meant the
    // public artifact-download figure could not be separated from search-engine
    // fetches at all. Truncated, and no other request header is read.
    const ua = String(req.headers.get('user-agent')||'').slice(0,300);

    // Self-healing purge of any test-tagged download rows already stored.
    // (deploytest* variants are also hidden by the geo-stats read filter.)
    try {
      await fetch(SB+"/rest/v1/interaction_events?source=in.(guide-dl,pdf-dl,kit-dl)&payload->>src=in.(verify,test,selftest,deploytest-geo2)",
        { method:'DELETE', headers:H });
    } catch(e){ /* best-effort */ }

    try {
      if (isTest || prefetched) {
        // skip recording internal test downloads entirely
      } else if (edition) {
        await Promise.all([
          fetch(SB+'/rest/v1/guide_downloads',{ method:'POST', headers:H,
            body:JSON.stringify({ edition: edition, src: src }) }),
          fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
            body:JSON.stringify({ source:'guide-dl', type:'download', payload:{ edition: edition, src: src, country: country, user_agent: ua } }) })
        ]);
      } else if (doc) {
        await fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
          body:JSON.stringify({ source:'pdf-dl', type:'download', payload:{ doc: doc, file: DOCS[doc], src: src, country: country, user_agent: ua } }) });
      } else {
        await fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
          body:JSON.stringify({ source:'kit-dl', type:'download', payload:{ file: kit, src: src, country: country, user_agent: ua } }) });
      }
    } catch(e){ /* swallow: the file must still be served */ }
  }

  return Response.redirect(target, 302);
}
