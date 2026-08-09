export const config = { runtime: 'edge' };

// Honor certificate delivery.
//
// WHY IT EXISTS. /api/honor is an acceptance endpoint: it captures how an honoree
// wants to be named and records consent. It has never been able to give them the
// certificate. Until now that was a manual send, which is tolerable for one
// honoree and is 33 manual sends for the full roster.
//
// This renders the certificate on demand from the same unguessable key, using the
// name and title the honoree confirmed on acceptance rather than the defaults in
// the roster. If they have not accepted yet, it renders the roster defaults and
// says so, so the link is never a dead end.
//
// WHAT IT PROVES FOR THE ASSET RECORD. Every issue is logged to
// interaction_events as source='honor-cert', type='download', carrying the honor
// code and never the key. That converts a roster of names into a measured record
// of named professionals who accepted a recognition tied to this standard and
// came back for the artifact, which is a different and stronger claim than "we
// have a list".
//
// Output is a self-contained printable HTML certificate rather than a PDF: an
// edge function cannot run the reportlab generator, and every browser and phone
// can print or save an HTML page to PDF. The layout matches
// research/build_certificate.py: landscape, ivory, double gold border, name in
// Times-Bold with a gold rule, citation beneath, dated and signed.

const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const HONOR_NAME = 'Global Governance and Transparency Honor';
const HONOR_YEAR = '2026';
const SIGNER = 'Phillip Wikes';
const SIGN_LN = 'Phillip Wikes, Creator, JRS';
const FOOTER = '© 2026 Phillip Wikes   ·   JRS   ·   jrsstandard.com';

function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }

function page(o){
  const titleLine = o.title
    ? '<div class="title-line">' + esc(o.title) + '</div>'
    : '';
  const notice = o.pending
    ? '<div class="notice">This is a preview. Accept the honor on your link and the certificate below prints in the name and title you confirm.</div>'
    : '';
  return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow">'
    + '<title>' + esc(o.name) + ' · Certificate of Recognition</title>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{background:#3a3a3a;font-family:Georgia,"Times New Roman",Times,serif;padding:22px 14px 60px}'
    + '.notice{max-width:1000px;margin:0 auto 16px;background:#1A1A1A;color:#D4A055;border:1px solid #7A5E28;padding:12px 15px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.6}'
    + '.bar{max-width:1000px;margin:0 auto 16px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}'
    + '.bar button{font-family:"Courier New",monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;background:#BE9447;color:#050505;border:none;padding:12px 22px;cursor:pointer}'
    + '.cert{max-width:1000px;margin:0 auto;aspect-ratio:792/612;background:#FCFBF8;position:relative;padding:5.2% 6%;box-shadow:0 10px 40px rgba(0,0,0,.45)}'
    + '.cert::before{content:"";position:absolute;inset:3.5% 3.5%;border:2.2px solid #BE9447;pointer-events:none}'
    + '.cert::after{content:"";position:absolute;inset:4.6% 4.4%;border:.7px solid #BE9447;pointer-events:none}'
    + '.inner{position:relative;height:100%;display:flex;flex-direction:column;align-items:center;text-align:center}'
    + '.mark{font-size:2.6vw;font-weight:700;color:#BE9447;letter-spacing:.02em;margin-top:1.6%}'
    + '.wordmark{font-size:.95vw;letter-spacing:.34em;color:#7A5E28;text-transform:uppercase;margin-top:.5%}'
    + '.kind{font-style:italic;font-size:2.3vw;color:#121212;margin-top:3.4%}'
    + '.certifies{font-size:1.15vw;color:#666;margin-top:2.2%}'
    + '.name{font-size:2.7vw;font-weight:700;color:#121212;margin-top:1.6%;line-height:1.15}'
    + '.rule{width:44%;height:1.6px;background:#BE9447;margin:.9% auto 0}'
    + '.title-line{font-size:1.1vw;color:#666;margin-top:1.2%;max-width:78%}'
    + '.body{font-size:1.16vw;color:#121212;line-height:1.72;margin-top:2.4%;max-width:80%}'
    + '.feet{position:absolute;bottom:5.5%;left:0;right:0;display:flex;justify-content:space-between;padding:0 6%}'
    + '.foot{width:36%;text-align:center}'
    + '.foot .v{font-size:1.1vw;color:#121212;padding-bottom:.5%}'
    + '.foot .sig{font-style:italic;font-size:2.2vw;color:#121212}'
    + '.foot .r{border-top:1px solid #999;padding-top:.6%;font-size:.9vw;color:#666}'
    + '.credit{position:absolute;bottom:2%;left:0;right:0;text-align:center;font-size:.78vw;color:#666}'
    + '@media print{body{background:#fff;padding:0}.bar,.notice{display:none}'
    + '.cert{box-shadow:none;max-width:none;width:100%;aspect-ratio:792/612}'
    + '@page{size:letter landscape;margin:0}}'
    + '</style></head><body>'
    + notice
    + '<div class="bar"><button type="button" onclick="window.print()">Print or save as PDF</button></div>'
    + '<div class="cert"><div class="inner">'
    + '<div class="mark">JRS</div>'
    + '<div class="wordmark">Justification Review Standard</div>'
    + '<div class="kind">Certificate of Recognition</div>'
    + '<div class="certifies">This certifies that</div>'
    + '<div class="name">' + esc(o.name) + '</div>'
    + '<div class="rule"></div>'
    + titleLine
    + '<div class="body">' + esc(o.body) + '</div>'
    + '<div class="feet">'
    + '<div class="foot"><div class="v">' + esc(o.date) + '</div><div class="r">Date</div></div>'
    + '<div class="foot"><div class="sig">' + esc(SIGNER) + '</div><div class="r">' + esc(SIGN_LN) + '</div></div>'
    + '</div>'
    + '<div class="credit">' + esc(FOOTER) + '</div>'
    + '</div></div></body></html>';
}

function html(s, code){
  return new Response(s, { status: code || 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function notFound(){
  return html('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Link not recognised</title>'
    + '<style>body{background:#050505;color:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:60px 22px;text-align:center;line-height:1.6}'
    + 'a{color:#BE9447}</style></head><body>'
    + '<p>This link is not recognised. Check that you copied the whole link, or write to '
    + '<a href="mailto:info@jrsstandard.com">info@jrsstandard.com</a>.</p></body></html>', 404);
}

// Month names rather than a locale call: an edge runtime's locale data is not
// guaranteed and a certificate must not print a different date by region.
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
function longDate(iso){
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return '';
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
}

export default async function handler(req){
  if (req.method !== 'GET') return html('Method not allowed', 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  const url = new URL(req.url);
  const key = clean(url.searchParams.get('k'), 40);
  if (!key) return notFound();

  // The roster is the authority on who a key belongs to, and it lives in
  // /api/honor. Reusing it over HTTP keeps one roster rather than two that can
  // drift apart, which is the failure this whole session has been correcting.
  let person = null;
  try {
    const r = await fetch(url.origin + '/api/honor?k=' + encodeURIComponent(key) + '&src=selftest');
    if (r.ok) {
      const d = await r.json();
      if (d && d.found) person = d;
    }
  } catch (e) { /* fall through to notFound */ }
  if (!person) return notFound();

  // Accepted details override the roster defaults, because the honoree corrected
  // them for exactly this reason. Falls back to the roster when they have not
  // accepted yet, so the link previews rather than failing.
  let printedName = person.name;
  let printedTitle = person.title;
  let issuedOn = '';
  let pending = true;

  if (SERVICE) {
    try {
      const H = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE };
      const q = SB + '/rest/v1/pilot_contacts?select=name,message,created_at'
              + '&source=eq.honor-accept&order=created_at.desc&limit=200';
      const r = await fetch(q, { headers: H });
      if (r.ok) {
        const rows = await r.json();
        for (const row of rows) {
          let m = null;
          try { m = JSON.parse(row.message || '{}'); } catch (e) { m = null; }
          if (m && m.honor_code === person.code) {
            printedName = clean(m.printed_name, 200) || printedName;
            printedTitle = clean(m.printed_title, 300) || '';
            issuedOn = row.created_at || '';
            pending = false;
            break;
          }
        }
      }
    } catch (e) { /* preview rather than fail */ }
  }

  const body = 'was named the recipient of the ' + HONOR_NAME + ' (' + HONOR_YEAR + '), '
             + (person.order ? person.order + ', ' : '')
             + person.citation.charAt(0).toLowerCase() + person.citation.slice(1);

  // Issue log. Records the honor code and never the key, so the event table
  // cannot be turned back into a set of working links. Deploy checks are skipped
  // by the same convention used across the other endpoints.
  const tsrc = String(url.searchParams.get('src') || '').toLowerCase();
  const isCheck = tsrc === 'verify' || tsrc === 'test' || tsrc === 'selftest' || tsrc.indexOf('deploytest') === 0;
  if (SERVICE && !isCheck) {
    try {
      const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: 'honor-cert', type: 'download', payload: {
          honor_code: person.code,
          study: person.study || '',
          accepted: !pending,
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
          user_agent: ua,
          is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
        }})
      });
    } catch (e) { /* a log write must never stop a certificate */ }
  }

  return html(page({
    name: printedName,
    title: printedTitle,
    body: body,
    date: longDate(issuedOn),
    pending: pending
  }));
}
