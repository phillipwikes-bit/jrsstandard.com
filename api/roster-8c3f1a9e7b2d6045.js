export const config = { runtime: 'edge' };

// Private training roster viewer. Secured by this opaque, unlinked, noindex URL
// (same model as the acquisition page), so it needs NO token. Reads pilot_contacts
// with the server-side service-role key and renders name, title, email,
// organization, consents, enrolled date, and completion status. If this URL ever
// leaks, rename this file to rotate it.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function d(s){ return s ? String(s).slice(0,10) : ''; }

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
    const cr = await fetch(SB + "/rest/v1/pilot_contacts?select=email,created_at&source=eq.training-complete&limit=10000", { headers:AH });
    done = cr.ok ? await cr.json() : [];
  } catch(e){ return new Response('<p>database unreachable</p>', { status:502, headers:H }); }
  if (!Array.isArray(enroll)) enroll = [];
  if (!Array.isArray(done)) done = [];

  const doneMap = {};
  done.forEach(function(x){ const e=(x.email==null?'':String(x.email)).trim().toLowerCase(); if(e && (!doneMap[e] || x.created_at < doneMap[e])) doneMap[e]=x.created_at; });

  let rows = '';
  enroll.forEach(function(r, i){
    let p = {}; try { p = JSON.parse(r.message||'{}') || {}; } catch(e){ p = {}; }
    const email = (r.email==null?'':String(r.email)).trim();
    const comp = doneMap[email.toLowerCase()];
    rows += '<tr>'
      + '<td>'+(i+1)+'</td>'
      + '<td>'+esc(r.name)+'</td>'
      + '<td>'+esc(p.title)+'</td>'
      + '<td>'+esc(email)+'</td>'
      + '<td>'+esc(r.organization)+'</td>'
      + '<td>'+esc(p.page_source)+'</td>'
      + '<td>'+(p.consent_contact===true?'yes':'no')+'</td>'
      + '<td>'+(p.consent_transfer===true?'yes':'no')+'</td>'
      + '<td>'+d(r.created_at)+'</td>'
      + '<td>'+(comp?('yes '+d(comp)):'no')+'</td>'
      + '</tr>';
  });
  if (!rows) rows = '<tr><td colspan="10" style="color:#888">No enrollments yet.</td></tr>';

  const completed = enroll.filter(function(r){ const e=(r.email==null?'':String(r.email)).trim().toLowerCase(); return !!doneMap[e]; }).length;

  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Training Roster (private)</title>'
    + '<style>body{background:#0a0a0a;color:#e8e8e8;font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:0;padding:20px}'
    + 'h1{font-size:18px;margin:0 0 4px}.sub{color:#888;margin:0 0 14px}'
    + 'table{border-collapse:collapse;width:100%;font-size:12.5px}'
    + 'th,td{border:1px solid #262626;padding:7px 9px;text-align:left;vertical-align:top}'
    + 'th{background:#161616;color:#c4963d;font-weight:600;white-space:nowrap}'
    + 'tr:nth-child(even) td{background:#0f0f0f}.note{color:#666;font-size:11px;margin-top:14px;max-width:640px}</style></head><body>'
    + '<h1>Training Roster</h1>'
    + '<p class="sub">'+enroll.length+' enrolled &middot; '+completed+' completed &middot; private, do not share this link</p>'
    + '<table><thead><tr><th>#</th><th>Name</th><th>Title</th><th>Email</th><th>Organization</th><th>Channel</th>'
    + '<th>Contact</th><th>Transfer</th><th>Enrolled</th><th>Completed</th></tr></thead><tbody>'+rows+'</tbody></table>'
    + '<p class="note">This page is the private, consented list of people who enrolled in the JRS training. It is secured by this unlisted URL. If it ever leaks, ask to have it rotated. Completion is recorded for people who finish all six modules with the current site version.</p>'
    + '</body></html>';

  return new Response(html, { status:200, headers:H });
}
