export const config = { runtime: 'edge' };

// Private training roster viewer. Secured by this opaque, unlinked, noindex URL
// (same model as the acquisition page), so it needs NO token. Reads pilot_contacts
// with the server-side service-role key and renders name, title, email,
// organization, consents, enrolled date, country, and completion status. If this
// URL ever leaks, rename this file to rotate it.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

// Known completers from the reviewer records, keyed by SHA-256 of the lowercased
// email (no raw address stored). Two uses: backfill the country for completions
// that predate geo capture (2026-07-17), and mark reviewers who completed per our
// records but enrolled via ?src=panel and never wrote a training-complete row.
// Kept in sync with the same map in api/enroll-stats.js. Prune an entry once its
// completion row carries a real country.
const RECORDS = {
  '7f86332345224f64ba2908c402bc289d492903d7eac9f794d7e3983cfabbebc4': 'US', // Nicholas Evans (has complete row)
  '77d8d7d39070b21e741964745127596924a42140c10cc967faecda9fe7a977cc': 'PL', // Andrey Ekhmenin (has complete row)
  'f148f56cc11fdee6017ec1a103be7edaa3aed0a9855de3bfafea609b94c054f9': 'US', // Jake McDonough (panel, no complete row)
  'c883d56fa7ef4d012574bdc1bbfcd372c54f4c111985070e606ce827be65411b': 'NG', // Olabanji Lawal (panel, no complete row)
  '7fec46f29356da7d765afb4cd1f47776e24b0d237ee3e6801d620f3cbbb993ee': 'US', // Boris Khazin (panel, no complete row)
  'deb4d4bf1f481e75ac94bc2433e34fc9822b8529a85cd0c0f44d05b59b4d5673': 'KR'  // SungSoo In (panel, enrolled 2026-07-19, no complete row)
};

function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function d(s){ return s ? String(s).slice(0,10) : ''; }
async function sha256hex(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
}

export default async function handler(req){
  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const H = { 'Content-Type':'text/html; charset=utf-8', 'X-Robots-Tag':'noindex, nofollow', 'Cache-Control':'no-store' };
  if (!SERVICE) return new Response('<p>service key missing</p>', { status:503, headers:H });

  const AH = { 'apikey':SERVICE, 'Authorization':'Bearer '+SERVICE };
  let enroll, done;
  try {
    const er = await fetch(SB + "/rest/v1/pilot_contacts?select=name,email,organization,message,created_at&source=eq.training-enroll&order=created_at.asc&limit=10000", { headers:AH });
    enroll = await er.json();
    const cr = await fetch(SB + "/rest/v1/pilot_contacts?select=email,message,created_at&source=eq.training-complete&limit=10000", { headers:AH });
    done = cr.ok ? await cr.json() : [];
  } catch(e){ return new Response('<p>database unreachable</p>', { status:502, headers:H }); }
  if (!Array.isArray(enroll)) enroll = [];
  if (!Array.isArray(done)) done = [];

  const doneMap = {}, doneCountry = {};
  done.forEach(function(x){
    const e=(x.email==null?'':String(x.email)).trim().toLowerCase();
    if(!e) return;
    if(!doneMap[e] || x.created_at < doneMap[e]) doneMap[e]=x.created_at;
    let cc=''; try { cc=(JSON.parse(x.message||'{}')||{}).country||''; } catch(err){ cc=''; }
    if(cc && !doneCountry[e]) doneCountry[e]=String(cc).toUpperCase().slice(0,2);
  });

  // Resolve completion + country per enrollee (records map fills the gaps).
  const resolved = [];
  const countrySet = {};
  let completed = 0;
  for (let i=0; i<enroll.length; i++){
    const r = enroll[i] || {};
    let p = {}; try { p = JSON.parse(r.message||'{}') || {}; } catch(e){ p = {}; }
    const email = (r.email==null?'':String(r.email)).trim();
    const key = email.toLowerCase();
    const hash = key ? await sha256hex(key) : '';
    const storedDate = doneMap[key] || null;
    const inRecords = !!RECORDS[hash];
    const isComplete = !!storedDate || inRecords;
    const country = doneCountry[key] || RECORDS[hash] || '';
    let compCell;
    if (storedDate) compCell = 'yes '+d(storedDate)+(country?(' ('+esc(country)+')'):'');
    else if (inRecords) compCell = 'yes (records)';
    else compCell = 'no';
    if (isComplete){ completed++; if (country) countrySet[country]=(countrySet[country]||0)+1; }
    resolved.push({ i:i+1, name:r.name, title:p.title, email:email, org:r.organization, chan:p.page_source,
      contact:p.consent_contact===true, transfer:p.consent_transfer===true, enrolled:r.created_at,
      country:country, comp:compCell });
  }

  let rows = '';
  resolved.forEach(function(x){
    rows += '<tr>'
      + '<td>'+x.i+'</td>'
      + '<td>'+esc(x.name)+'</td>'
      + '<td>'+esc(x.title)+'</td>'
      + '<td>'+esc(x.email)+'</td>'
      + '<td>'+esc(x.org)+'</td>'
      + '<td>'+esc(x.chan)+'</td>'
      + '<td>'+(x.contact?'yes':'no')+'</td>'
      + '<td>'+(x.transfer?'yes':'no')+'</td>'
      + '<td>'+d(x.enrolled)+'</td>'
      + '<td>'+(x.country?esc(x.country):'&mdash;')+'</td>'
      + '<td>'+x.comp+'</td>'
      + '</tr>';
  });
  if (!rows) rows = '<tr><td colspan="11" style="color:#888">No enrollments yet.</td></tr>';

  const countryList = Object.keys(countrySet).sort();
  const countryCount = countryList.length;
  const countryLine = completed ? ('Completions by country: '+(countryCount?countryList.map(function(c){return esc(c)+' '+countrySet[c];}).join(' &middot; '):'(country not recorded for earlier completions)')) : '';

  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Roster (private)</title>'
    + '<style>body{background:#0a0a0a;color:#e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0;padding:20px}'
    + 'h1{font-size:18px;margin:0 0 4px}.sub{color:#888;margin:0 0 14px}'
    + 'table{border-collapse:collapse;width:100%;font-size:12.5px}'
    + 'th,td{border:1px solid #262626;padding:7px 9px;text-align:left;vertical-align:top}'
    + 'th{background:#161616;color:#c4963d;font-weight:600;white-space:nowrap}'
    + 'tr:nth-child(even) td{background:#0f0f0f}.note{color:#666;font-size:11px;margin-top:14px;max-width:640px}</style></head><body>'
    + '<h1>Training Roster</h1>'
    + '<p class="sub">'+enroll.length+' enrolled &middot; '+completed+' completed from '+countryCount+' '+(countryCount===1?'country':'countries')+' &middot; private, do not share this link</p>'
    + (countryLine ? ('<p class="sub" style="color:#c4963d">'+countryLine+'</p>') : '')
    + '<table><thead><tr><th>#</th><th>Name</th><th>Title</th><th>Email</th><th>Organization</th><th>Channel</th>'
    + '<th>Contact</th><th>Transfer</th><th>Enrolled</th><th>Country</th><th>Completed</th></tr></thead><tbody>'+rows+'</tbody></table>'
    + '<p class="note">This page is the private, consented list of people who enrolled in the JRS training. It is secured by this unlisted URL. If it ever leaks, ask to have it rotated. Completion is recorded when someone finishes all six modules; entries marked "(records)" are reviewers who completed through the panel and whose completion and country are taken from the reviewer records.</p>'
    + '</body></html>';

  return new Response(html, { status:200, headers:H });
}
