export const config = { runtime: 'edge' };

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
  card:     'JRS_Rapid_Review_Card.pdf'
};

// Whitelisted training-kit files (and the gated reference). Only these exact
// basenames are honored via ?f= , so the endpoint cannot be turned into an open
// redirect. Downloads log to interaction_events (source 'kit-dl').
const KITS = new Set([
  'JRS_Kit_A1_Worksheet.pdf',
  'JRS_Kit_A2_Escalation_Form.pdf',
  'JRS_Kit_A3_Signoff_Template.pdf',
  'JRS_Kit_B1_Onboarding_Guide.pdf',
  'JRS_Kit_C1_AI_Checklist.pdf',
  'JRS_Kit_D1_Redlined_Examples.pdf',
  'JRS_Kit_E1_Implementation_Playbook.pdf',
  'JRS_Kit_E1A_Secondary_Review_Triggers.pdf',
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

  const target = url.origin + '/' + (edition ? FILES[edition] : doc ? DOCS[doc] : kit);

  const env = (typeof process!=='undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (SERVICE) {
    const H = {'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,'Content-Type':'application/json','Prefer':'return=minimal'};
    const country = String(req.headers.get('x-vercel-ip-country')||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2) || null;
    try {
      if (edition) {
        await Promise.all([
          fetch(SB+'/rest/v1/guide_downloads',{ method:'POST', headers:H,
            body:JSON.stringify({ edition: edition, src: src }) }),
          fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
            body:JSON.stringify({ source:'guide-dl', type:'download', payload:{ edition: edition, src: src, country: country } }) })
        ]);
      } else if (doc) {
        await fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
          body:JSON.stringify({ source:'pdf-dl', type:'download', payload:{ doc: doc, file: DOCS[doc], src: src, country: country } }) });
      } else {
        await fetch(SB+'/rest/v1/interaction_events',{ method:'POST', headers:H,
          body:JSON.stringify({ source:'kit-dl', type:'download', payload:{ file: kit, src: src, country: country } }) });
      }
    } catch(e){ /* swallow: the file must still be served */ }
  }

  return Response.redirect(target, 302);
}
