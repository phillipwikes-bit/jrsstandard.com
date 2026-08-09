export const config = { runtime: 'edge' };

// Blind second-reader endpoint for the public-records study.
//
// WHY IT EXISTS. The manuscript reports 32 reads produced by one person. The one
// weakness a referee will name is that nobody checked those reads independently.
// This serves ten of the 32 to a second reader and captures their answers, so
// the paper can report inter-rater agreement instead of conceding a single-reader
// limitation.
//
// WHAT "BLIND" MEANS HERE, AND IT IS ENFORCED BY WHAT THIS FILE DOES NOT CONTAIN.
// The ten cases below carry the public source and a short description of what the
// record is. They do NOT carry the original read, the original basis note, the
// recorded outcome, or the distribution of reads in the set. None of those values
// exists anywhere in this file, so a reader who views source cannot find them. The
// answer key lives in research/Blind_Recheck_KEY_E08.md, which is never deployed.
//
// SELECTION, for the methods section: the ten were drawn from the 32-case corpus
// stratified by the original read with a floor of one seat per category, ordered
// by case id inside each stratum, and interleaved so consecutive cases do not
// share a category. Six, three and one across the three categories. No random
// number generator is involved, so the selection is reproducible from
// research/build_blind_recheck_packet.py alone.
//
// Answers land in the existing private pilot_contacts table (RLS on, no anon
// read) tagged source='recheck-submit', matching the /api/enroll, /api/access,
// /api/contributor and /api/honor conventions.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const STUDY = 'Public-records documentation study';
const LABELS = ['Ready', 'Needs work', 'Gap'];

// One unguessable key per reader. Slots are anonymous: the endpoint never needs
// to know who holds a key, and not storing that mapping here means a leak of this
// file identifies nobody. The name-to-key mapping is kept privately in
// research/, outside the deployment.
const ROSTER = {
  'llfmfn3rb2': { slot: 'R1' },
  'swlck68d5b': { slot: 'R2' },
  'ra9rn80s5k': { slot: 'R3' }
};

const CASES = [
  { n: 1,
    source: 'FOIL AO 19721 (Apr. 12, 2019), Committee on Open Government. https://docsopengovernment.dos.ny.gov/coog/ftext/f19721.htm?',
    record: 'A requester sought multiple categories of records. The agency issued a blanket denial based on interference with law-enforcement investigations or judicial proceedings. The requester challenged the denial.' },
  { n: 2,
    source: '2025 NY Slip Op 03331   https://www.nycourts.gov/REPORTER/3dseries/2025/2025_03331.htm',
    record: 'A requester sought records concerning convictions overturned because of prosecutorial misconduct, along with related records concerning misconduct investigations and disciplinary actions. The agency did not initially respond to the FOIL request and later opposed disclosure of most of the records. The agency asserted categorical exemptions but did not provide particularized justifications or redacted versions of the responsive records.' },
  { n: 3,
    source: 'https://www.osc.ny.gov/files/state-agencies/audits/pdf/sga-2023-20s12.pdf',
    record: 'Auditors examined NYSDOT\'s claim that requested records had been provided. In at least one instance, the agency supplied an email stating that records had been sent but did not provide the actual documents it claimed were transmitted. Auditors concluded that an email alone was insufficient evidence of a completed response. The audit also stated that OSC could not conclude that the FOIL data supplied by the agency was complete.' },
  { n: 4,
    source: 'OIL AO 19746 (July 16, 2019), Committee on Open Government. https://docsopengovernment.dos.ny.gov/coog/ftext/f19746.htm?',
    record: 'A requester sought records identifying winners or recipients of a public promotional program and describing what each recipient received. The agency denied access and upheld the denial on administrative appeal.' },
  { n: 5,
    source: '2025 NY Slip Op 32688(U) https://law.justia.com/cases/new-york/other-courts/2025/2025-ny-slip-op-32688-u.html',
    record: 'A requester sought RFPs, contracts and reports concerning environmental-impact and planning work. The agency produced some records but heavily redacted portions of a contract and technical schedules, citing personal privacy, confidential commercial information and competitive injury. The requester appealed, arguing that the agency had not provided particularized and specific justifications for the redactions.' },
  { n: 6,
    source: '4 NY3d 477 (2005) https://www.nycourts.gov/reporter/3dseries/2005/2005_02357.htm',
    record: 'The request sought transcripts, recordings, and oral histories relating to a major emergency response. Certain records were withheld under the privacy, intra-agency, and law enforcement exemptions.' },
  { n: 7,
    source: '2025 NY Slip Op 30848(U)  https://law.justia.com/cases/new-york/other-courts/2025/2025-ny-slip-op-30848-u.html',
    record: 'A requester sought correspondence involving specified agency employees over a defined period. The agency repeatedly extended its estimated response date for approximately five years and had not issued a final determination. The agency later asserted that thousands of potentially responsive documents required individualized review.' },
  { n: 8,
    source: '31 NY3d 217 (2018) https://www.nycourts.gov/reporter/3dseries/2018/2018_02206.htm',
    record: 'The request sought records whose existence, if acknowledged, could reveal information protected by statutory exemptions. The agency declined to confirm or deny whether responsive records existed.' },
  { n: 9,
    source: '2025 NY Slip Op 02207 https://www.nycourts.gov/Reporter/3dseries/2025/2025_02207.htm',
    record: 'A requester sought law-enforcement disciplinary records. The agency disclosed some material but withheld records involving allegations classified as unsubstantiated, unfounded or exonerated, asserting that disclosure would constitute an unwarranted invasion of personal privacy. The requester administratively appealed.' },
  { n: 10,
    source: '2024 NY Slip Op 0407 https://www.nycourts.gov/reporter/3dseries/2024/2024_04071.htm?',
    record: 'A requester sought law-enforcement disciplinary records, including records concerning substantiated and unsubstantiated misconduct allegations and records created before repeal of the former statutory confidentiality provision. The agency withheld categories of records. The administrative appeal partially granted access but continued to deny older records and raised reasonable-description concerns.' }
];

function json(o, s){
  return new Response(JSON.stringify(o), {
    status: s || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }

export default async function handler(req){
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  const url = new URL(req.url);
  const key = clean(url.searchParams.get('k'), 40);
  const person = ROSTER[key];

  if (req.method === 'GET') {
    if (!person) return json({ ok: false, found: false }, 404);

    // Link-open ping, so an unopened packet can be told apart from one that
    // opened and was abandoned. Records the anonymous slot, never the key.
    // Deploy checks are skipped, matching the convention used elsewhere.
    const tsrc = String(url.searchParams.get('src') || '').toLowerCase();
    const isCheck = tsrc === 'verify' || tsrc === 'test' || tsrc === 'selftest' || tsrc.indexOf('deploytest') === 0;
    if (SERVICE && !isCheck) {
      try {
        const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
        await fetch(SB + '/rest/v1/interaction_events', {
          method: 'POST',
          headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                     'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ source: 'recheck-link', type: 'view', payload: {
            slot: person.slot,
            country: String(req.headers.get('x-vercel-ip-country') || '')
              .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
            user_agent: ua,
            is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
          }})
        });
      } catch (e) { /* never block the packet */ }
    }

    return json({ ok: true, found: true, study: STUDY, slot: person.slot,
                  labels: LABELS, cases: CASES });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!person) return json({ error: 'unknown_link' }, 404);
  if (!SERVICE) return json({ error: 'service_key_missing' }, 503);

  let b; try { b = await req.json(); } catch(e){ return json({ error: 'invalid_json' }, 400); }

  const name  = clean(b.name, 200);
  const email = clean(b.email, 200);
  if (!name) return json({ error: 'name_required' }, 400);
  if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
    return json({ error: 'valid_email_required' }, 400);
  }
  if (b.consent_core !== true) return json({ error: 'consent_required' }, 400);

  // Answers. One per case, each a label plus a short reason. Unanswered cases are
  // accepted rather than rejected: a partial return is data, and forcing ten
  // before anything can be saved risks losing all ten.
  const answers = [];
  const src = Array.isArray(b.answers) ? b.answers : [];
  for (let i = 0; i < CASES.length; i++) {
    const a = src[i] || {};
    const label = LABELS.indexOf(clean(a.label, 20)) >= 0 ? clean(a.label, 20) : '';
    answers.push({ n: CASES[i].n, label: label, reason: clean(a.reason, 1200),
                   knew_outcome: a.knew_outcome === true });
  }
  const answered = answers.filter(function(a){ return a.label; }).length;

  const payload = {
    kind: 'recheck-submit',
    study: STUDY,
    slot: person.slot,
    reviewer_name: name,
    prior_familiarity: clean(b.familiarity, 400),
    answers: answers,
    answered_count: answered,
    total_cases: CASES.length,
    country: String(req.headers.get('x-vercel-ip-country') || '')
      .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
    consent_contact: true,
    consent_named_in_paper: b.consent_named_in_paper === true,
    ts: new Date().toISOString()
  };

  const res = await fetch(SB + '/rest/v1/pilot_contacts', {
    method: 'POST',
    headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
               'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ name: name, email: email, organization: clean(b.organization, 200),
                           message: JSON.stringify(payload), source: 'recheck-submit' })
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error: 'db_insert_failed', status: res.status, detail: String(t).slice(0, 300) }, 502);
  }

  return json({ ok: true, answered: answered, total: CASES.length });
}
