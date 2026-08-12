export const config = { runtime: 'edge' };

// OWNER-ONLY view of the named initiative supporters held in the private,
// RLS-locked pilot_contacts table (source='support'). This returns PII
// (name, organization, optional email) and is therefore token-gated: the
// caller must present ?token= equal to BENCH_ADMIN_TOKEN or RUN_TOKEN (the
// same tokens already set in Vercel). Without a valid token it returns 401 and
// no data. The PUBLIC dashboard (/api/support-stats) stays counts-only, which
// is what supporters were promised on supported.html ("public status pages
// show counts only; your details stay private"). This endpoint exists so the
// owner can see and export the consented list without exposing it publicly.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const CAMPAIGN_LABEL = {
  rtkw: 'The Right to Know Why',
  defend: 'The Decisions You Can Defend',
  general: 'General'
};

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' }
  });
}

export default async function handler(req){
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers:{ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const ADMIN = env.BENCH_ADMIN_TOKEN || '';
  const RUN = env.RUN_TOKEN || '';

  let token = '';
  try { token = new URL(req.url).searchParams.get('token') || ''; } catch(e){ token = ''; }

  // Auth gate: a valid owner token is required before any PII is returned.
  // The unauthorized response reports ONLY whether a token is configured
  // server-side (booleans, never the value) so a broken gate is diagnosable.
  if (!((ADMIN && token === ADMIN) || (RUN && token === RUN))) {
    return json({ error:'unauthorized', admin_token_configured: !!ADMIN, run_token_configured: !!RUN, service_key_configured: !!SERVICE }, 401);
  }
  if (!SERVICE) return json({ error:'service_key_missing' }, 503);

  const AH = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE };

  const res = await fetch(
    SB + '/rest/v1/pilot_contacts?source=eq.support&select=name,email,organization,message,created_at&order=created_at.desc',
    { headers: AH }
  );
  if (!res.ok){ const t = await res.text(); return json({ error:'db_read_failed', status:res.status, detail:String(t).slice(0,300) }, 502); }

  // WHO ASKED FOR A LINKEDIN RECOMMENDATION, AND WHO ASKED FOR A CERTIFICATE.
  //
  // Added 2026-08-12. The public dashboard has always shown HOW MANY requested
  // one, and there was no way at all to see WHO. A count of three tells the
  // owner three people are owed a recommendation and gives him no way to write
  // any of them. This is the only place those names are exposed, it is behind
  // the same token as the supporter list, and it stays out of every public
  // endpoint.
  //
  // Answers are NOT joined in and cannot be: the answer rows carry no identity
  // and share no key with these rows. This returns who asked, never what they
  // said.
  let recommendation_requests = [], certificate_requests = [];
  try {
    const rr = await fetch(
      SB + '/rest/v1/pilot_contacts?source=in.(reviewer-eval-incentive,reviewer-cert)'
         + '&select=source,name,email,organization,message,created_at&order=created_at.desc',
      { headers: AH }
    );
    if (rr.ok) {
      const rrows = await rr.json();
      rrows.forEach(function(r){
        let p = {};
        try { p = JSON.parse(r.message || '{}'); } catch(e){ p = {}; }
        const rec = {
          name: r.name || p.printed_name || '',
          email: r.email || '',
          organization: r.organization || '',
          title: p.printed_title || '',
          linkedin_url: p.linkedin_url || '',
          country: p.country || '',
          completion_code: p.completion_code || '',
          consent_contact: p.consent_contact === true,
          consent_transfer: p.consent_transfer === true,
          consent_public_list: p.consent_public_list === true,
          consent_research_followup: p.consent_research_followup === true,
          requested_at: r.created_at || ''
        };
        if (r.source === 'reviewer-eval-incentive') recommendation_requests.push(rec);
        else certificate_requests.push(rec);
      });
    }
  } catch (e) { /* the supporter list must still return */ }

  const rows = await res.json();
  const contacts = rows.map(function(r){
    let p = {};
    try { p = JSON.parse(r.message || '{}'); } catch(e){ p = {}; }
    const camp = p.campaign || 'general';
    return {
      name: r.name || '',
      organization: r.organization || '',
      email: r.email || '',
      campaign: camp,
      campaign_label: CAMPAIGN_LABEL[camp] || camp,
      role: p.role || '',
      page_source: p.page_source || '',
      consent_contact: p.consent_contact === true,
      consent_transfer: p.consent_transfer === true,
      consent_listed: p.consent_listed === true,
      created_at: r.created_at || ''
    };
  });

  const by_campaign = {};
  contacts.forEach(function(c){ by_campaign[c.campaign] = (by_campaign[c.campaign] || 0) + 1; });

  return json({
    ok: true,
    count: contacts.length,
    by_campaign: by_campaign,
    contacts: contacts,

    // Reviewer-evaluation asks. Names only, never answers.
    recommendation_requests: recommendation_requests,
    recommendation_request_count: recommendation_requests.length,
    certificate_requests: certificate_requests,
    certificate_request_count: certificate_requests.length,
    reviewer_note: 'Anyone listed under recommendation_requests ticked "Request a LinkedIn '
                 + 'Peer Reviewer Recommendation" at the end of the evaluation and is owed '
                 + 'one. Nothing is posted for them until they have approved the exact '
                 + 'wording. Their evaluation answers are not included here and cannot be: '
                 + 'the answer rows carry no identity and share no key with these rows.'
  });
}
