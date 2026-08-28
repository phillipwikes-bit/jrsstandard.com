export const config = { runtime: 'edge' };

// Owner-only reader for the blind second-read submissions.
//
// WHY IT EXISTS. api/recheck.js writes the second reader's ten answers into
// pilot_contacts.message as JSON. pilot_contacts has RLS on with no anon read,
// and no deployed surface returned that column, so a completed second read was
// visible as a count and unreadable as data. api/asset-stats reports
// complete_returns; it deliberately publishes no label, because it is a public
// endpoint. This one is not public.
//
// WHAT IT DELIBERATELY DOES NOT CONTAIN: THE ANSWER KEY. The original reads live
// in research/Blind_Recheck_KEY_E08.md, which is never deployed. Agreement is
// computed off-server against that file. If this slug leaked, a reader would see
// one person's ten labels and would still have nothing to score them against,
// and the blind for the two unissued packets would survive.
//
// Secured by its own opaque URL and no token, matching
// api/people-9dd1ecdf6f8cdfd4.js and api/leads-4b7e2c9af106d385.js. Never linked
// from a public page, never given an analytics tag. If it leaks, rename the file
// to rotate it.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function json(body, status) {
  return new Response(JSON.stringify(body, null, 2), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow'
    }
  });
}

export default async function handler(req) {
  const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!SERVICE) return json({ ok: false, error: 'service_key_missing' }, 503);

  const url = SB + '/rest/v1/pilot_contacts'
            + '?source=eq.recheck-submit'
            + '&select=name,email,organization,message,created_at'
            + '&order=created_at.asc';

  let rows;
  try {
    const res = await fetch(url, {
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE }
    });
    if (!res.ok) {
      return json({ ok: false, error: 'db_read_failed', status: res.status }, 502);
    }
    rows = await res.json();
  } catch (e) {
    return json({ ok: false, error: 'db_unreachable' }, 502);
  }

  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    let m = null;
    try { m = JSON.parse(r.message || '{}'); } catch (e) { m = null; }
    if (!m) {
      out.push({ name: r.name || '', email: r.email || '',
                 submitted_at: r.created_at || '', parse_error: true });
      continue;
    }
    const answers = Array.isArray(m.answers) ? m.answers : [];
    out.push({
      name: r.name || '',
      email: r.email || '',
      organization: r.organization || '',
      submitted_at: r.created_at || '',
      slot: m.slot || '',
      study: m.study || '',
      prior_familiarity: m.prior_familiarity || '',
      consent_named_in_paper: m.consent_named_in_paper === true,
      country: m.country || '',
      answered_count: typeof m.answered_count === 'number' ? m.answered_count : null,
      total_cases: typeof m.total_cases === 'number' ? m.total_cases : null,
      // The reader's own labels and reasons. No original read, no outcome, no
      // agreement figure: none of those values exists in this file.
      answers: answers.map(function (a) {
        return {
          n: a.n,
          label: a.label || '',
          reason: a.reason || '',
          knew_outcome: a.knew_outcome === true
        };
      })
    });
  }

  return json({
    ok: true,
    generated_at: new Date().toISOString(),
    submissions: out.length,
    note: 'Second-reader answers only. The original reads are in '
        + 'research/Blind_Recheck_KEY_E08.md, which is never deployed, so this '
        + 'endpoint cannot be used to reconstruct the answer key.',
    readers: out
  });
}
