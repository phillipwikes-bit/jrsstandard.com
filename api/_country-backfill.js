// SHARED COUNTRY BACKFILL. Single source of truth for both /api/enroll-stats
// and /api/people-9dd1ecdf6f8cdfd4, which previously would have had to carry
// two copies of the same map and drift apart.
//
// Keyed by SHA-256 of the lowercased, trimmed email so no raw address sits in
// source. Values are ISO 3166-1 alpha-2.
//
// WHY THIS EXISTS: geo capture was added on 2026-07-17. Every enrolment and
// support row written before that date carries no country, and /api/complete
// writes the completion row with no name, so neither row alone can say who was
// where. The countries below are not guesses: each is read from a dated
// research artifact in the repository, cited per entry.
//
// PROVENANCE: research/Expert_Roster_All_Studies_2026-08-06.csv, the reviewer
// roster built from the study records, column `country`.
//
// RULE: an entry is pruned once the person's own row carries a real country.
// Row-captured country ALWAYS wins over anything in this map.
export const COMPLETION_COUNTRY_BACKFILL = {
  // Nicholas Evans, RR-106, roster country "US" (completed 2026-07-14)
  '7f86332345224f64ba2908c402bc289d492903d7eac9f794d7e3983cfabbebc4': 'US',
  // Andrey Ekhmenin, V-AI-11, roster country "Poland" (completed 2026-07-17)
  '77d8d7d39070b21e741964745127596924a42140c10cc967faecda9fe7a977cc': 'PL',
  // Jake McDonough, V-AI-01, roster country "US" (panel completer, no complete row)
  'f148f56cc11fdee6017ec1a103be7edaa3aed0a9855de3bfafea609b94c054f9': 'US',
  // Olabanji Lawal, V-AI-10, roster country "Nigeria" (panel completer, no complete row)
  'c883d56fa7ef4d012574bdc1bbfcd372c54f4c111985070e606ce827be65411b': 'NG',
  // Boris Khazin, RR-101, roster country "US (North Carolina)" (panel completer, no complete row)
  '7fec46f29356da7d765afb4cd1f47776e24b0d237ee3e6801d620f3cbbb993ee': 'US',
  // SungSoo In, V-AI-24, roster country "South Korea" (enrolled 2026-07-19, no complete row)
  'deb4d4bf1f481e75ac94bc2433e34fc9822b8529a85cd0c0f44d05b59b4d5673': 'KR',
  // Sagarika Banerjee, RR-128, roster country "Canada (Toronto)" (endorsed 2026-08-02, pre-geo row)
  'c5dcaf40ebce570624518e963d3cc924eab1179951039e50866b4a5fe93c9a00': 'CA'
};

// People whose country is genuinely not established anywhere in the repository.
// Listed by hash so the endpoint can say "asked for, not on file" instead of
// showing a blank that reads like a bug. An inferred country is never invented
// to fill one of these.
export const COUNTRY_NOT_ON_FILE = {
  // Tanvi Pokhriyal: appears in research/ as a pilot contributor but carries no
  // country in any roster, message or row. REQUIRES USER INPUT.
  'f0d55578ea6444100a57993ea610f3065f38743c0879a532f5f9074e59938ab9': true
};

export async function sha256hex(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
}

// Resolve one country per PERSON (keyed by lowercased email) across every row
// that person owns, in a fixed precedence order. Returns
//   { code: {email: 'US'}, source: {email: 'captured'|'reviewer records'|'not on file'} }
// so a caller can always show whether a country was measured or inferred, and
// never presents the second as the first.
export async function resolveCountries(rows){
  const code = {}, source = {};

  // 1. A country captured at submission on ANY row this person owns. A person
  //    who enrolled before geo capture and completed after it has the country on
  //    the completion row only, so the person is resolved, not the single row.
  for (let i = 0; i < rows.length; i++){
    const r = rows[i] || {};
    const em = String(r.email || '').trim().toLowerCase();
    if (!em || code[em]) continue;
    let p = {};
    try { p = JSON.parse(r.message || '{}') || {}; } catch(e){ p = {}; }
    const c = String(p.country || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    if (c) { code[em] = c; source[em] = 'captured'; }
  }

  // 2. The documented backfill, for people every one of whose rows predates geo
  //    capture. Only consulted when nothing was captured anywhere.
  const emails = {};
  for (let i = 0; i < rows.length; i++){
    const em = String((rows[i] || {}).email || '').trim().toLowerCase();
    if (em && !code[em]) emails[em] = true;
  }
  const pending = Object.keys(emails);
  for (let i = 0; i < pending.length; i++){
    const h = await sha256hex(pending[i]);
    if (COMPLETION_COUNTRY_BACKFILL[h]) { code[pending[i]] = COMPLETION_COUNTRY_BACKFILL[h]; source[pending[i]] = 'reviewer records'; }
    else if (COUNTRY_NOT_ON_FILE[h]) { source[pending[i]] = 'not on file'; }
  }

  return { code: code, source: source };
}
