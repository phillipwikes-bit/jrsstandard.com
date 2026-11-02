export const config = { runtime: 'edge' };

// Historical reviewer evaluation receipt rendering.
// A JRS-R- code is a reference to an issuer record, not proof of completed
// training or demonstrated competence. A certificate may be rendered only when
// a matching private reviewer-cert contact record is read successfully. Request
// parameters cannot supply or modify the verified name, title or issuance date.
// The underlying evaluation answers remain anonymous and are never fetched.
 
const SB = 'https://pjzxkeviouofdseagvpf.supabase.co';

const SIGNER = 'Phillip Wikes';
const SIGN_LN = 'Phillip Wikes, Creator, JRS';
const FOOTER = '© 2026 Phillip Wikes   ·   JRS   ·   jrsstandard.com';

// WHAT THIS CERTIFICATE MAY ASSERT IS BOUNDED BY WHAT THE COMPLETION CODE
// PROVES, AND THAT IS THE EVALUATION SUBMISSION AND NOTHING ELSE.
//
// CORRECTED 2026-08-16. This read "completed the six-module JRS Reviewer
// Training and submitted the reviewer evaluation". The training clause was an
// overclaim: /api/reviewer-eval issues a JRS-R- code on submission of the
// evaluation, and the evaluation is reachable without enrolling in the
// training at all. On the day this was found, the one person holding a
// rendered certificate had no training-enroll row and no training-complete row
// in pilot_contacts. The certificate asserted a credential the database
// contradicted.
//
// That is the exact defect this programme measures in other people's records:
// a document stating a conclusion its own evidence does not support. Issuing
// one would have been indefensible.
//
// Do not restore the training clause here. This endpoint is credential-free by
// design and cannot look up a training completion, so it cannot condition on
// one. If a training-inclusive certificate is ever wanted, it needs its own
// endpoint reading training_completions, and its own code prefix.
const BODY = 'submitted the JRS reviewer evaluation, applying the five review '
           + 'conditions of the Justification Review Standard to the question of '
           + 'whether a consequential record can still explain, on its own terms, '
           + 'how and why a decision was reached.';

function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function clean(v, n){ return (v == null ? '' : String(v)).trim().slice(0, n || 200); }

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
function longDate(iso){
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear();
}
function sameName(a,b){
  const norm = v => String(v||'').normalize('NFKC').trim().replace(/\\s+/g,' ').toLowerCase();
  return !!norm(a) && norm(a) === norm(b);
}

function html(s, code){
  return new Response(s, { status: code || 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function badCode(){
  return html('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Completion code not recognised</title>'
    + '<style>body{background:#050505;color:#F2F2F2;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:60px 22px;text-align:center;line-height:1.6}'
    + 'a{color:#BE9447}</style></head><body>'
    + '<p>The submitted details could not be validated against an issued reviewer evaluation receipt. A historical reference starts with JRS-R-. It was shown '
    + 'when you submitted the reviewer evaluation.<br><br>'
    + '<a href="/reviewer/completion.html">Try again</a> or write to '
    + '<a href="mailto:info@jrsstandard.com">info@jrsstandard.com</a>.</p></body></html>', 400);
}

function page(o){
  const titleLine = o.title ? '<div class="title-line">' + esc(o.title) + '</div>' : '';
  return '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow">'
    + '<title>' + esc(o.name) + ' · JRS Reviewer Certificate</title>'
    + '<style>'
    + '*{margin:0;padding:0;box-sizing:border-box}'
    + 'body{background:#3a3a3a;font-family:Georgia,"Times New Roman",Times,serif;padding:22px 14px 60px}'
    + '.bar{max-width:1000px;margin:0 auto 16px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center}'
    + '.bar button{font-family:"Courier New",monospace;font-size:14px;letter-spacing:.04em;background:#BE9447;color:#050505;border:none;padding:14px 22px;cursor:pointer;min-height:44px}'
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
    + '.code{font-family:"Courier New",monospace;font-size:.85vw;letter-spacing:.12em;color:#7A5E28;margin-top:1.8%}'
    + '.feet{position:absolute;bottom:5.5%;left:0;right:0;display:flex;justify-content:space-between;padding:0 6%}'
    + '.foot{width:36%;text-align:center}'
    + '.foot .v{font-size:1.1vw;color:#121212;padding-bottom:.5%}'
    + '.foot .sig{font-style:italic;font-size:2.2vw;color:#121212}'
    + '.foot .r{border-top:1px solid #999;padding-top:.6%;font-size:.9vw;color:#666}'
    + '.credit{position:absolute;bottom:2%;left:0;right:0;text-align:center;font-size:.78vw;color:#666}'
    + '@media print{body{background:#fff;padding:0}.bar{display:none}'
    + '.cert{box-shadow:none;max-width:none;width:100%;aspect-ratio:792/612}'
    + '@page{size:letter landscape;margin:0}}'
    + '</style></head><body>'
    + '<div class="bar"><button type="button" onclick="window.print()">Print or save as PDF</button></div>'
    + '<div class="cert"><div class="inner">'
    + '<div class="mark">JRS</div>'
    + '<div class="wordmark">Justification Review Standard</div>'
    + '<div class="kind">Reviewer evaluation receipt</div>'
    + '<div class="certifies">Issuer record confirms</div>'
    + '<div class="name">' + esc(o.name) + '</div>'
    + '<div class="rule"></div>'
    + titleLine
    + '<div class="body">' + esc(BODY) + '</div>'
    + '<div class="code">Historical receipt code ' + esc(o.code) + '</div>'
    + '<div class="feet">'
    + '<div class="foot"><div class="v">' + esc(o.date) + '</div><div class="r">Date</div></div>'
    + '<div class="foot"><div class="sig">' + esc(SIGNER) + '</div><div class="r">' + esc(SIGN_LN) + '</div></div>'
    + '</div>'
    + '<div class="credit">' + esc(FOOTER) + '</div>'
    + '</div></div></body></html>';
}

export default async function handler(req){
  if (req.method !== 'GET') return html('Method not allowed', 405);

  const env = (typeof process !== 'undefined' && process.env) || {};
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';

  const url = new URL(req.url);
  const code  = clean(url.searchParams.get('code'), 40).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const name  = clean(url.searchParams.get('name'), 200);
  // Caller-supplied title is never authoritative. Print only the issuer record.

  if (!/^JRS-R-[A-Z0-9]{6,12}$/.test(code) || !name) return badCode();

  // Fail closed: a formatted code or a user-supplied name cannot create an
  // issuer-validated document. The only authority is pilot_contacts with the
  // historical reviewer-cert source. No evaluation answers or emails are read.
  if (!SERVICE) return html('Certificate verification is temporarily unavailable.', 503);
  let issued = null;
  try {
    const q = SB + '/rest/v1/pilot_contacts?select=name,message,created_at'
      + '&source=eq.reviewer-cert&message=ilike.*' + encodeURIComponent(code) + '*&limit=20';
    const verification = await fetch(q,{
      headers:{'apikey':SERVICE,'Authorization':'Bearer '+SERVICE,
        'Accept':'application/json'}
    });
    if (!verification.ok) return html('Certificate verification is temporarily unavailable.', 503);
    const rows = await verification.json();
    if (!Array.isArray(rows)) return html('Certificate verification is temporarily unavailable.', 503);
    for (const row of rows){
      let m=null;
      try{m=JSON.parse(row.message||'{}');}catch(e){continue;}
      if (!m || m.kind!=='reviewer-cert' || m.completion_code!==code) continue;
      const recordName=clean(m.printed_name||row.name,200);
      if (!sameName(name,recordName)) continue;
      issued={
        code, name:recordName, title:clean(m.printed_title,300),
        date:longDate(row.created_at||m.ts)
      };
      if (issued.date) break;
      issued=null;
    }
  }catch(e){return html('Certificate verification is temporarily unavailable.', 503);}
  if (!issued) return html('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Receipt not verified</title></head><body><main><h1>Receipt not verified</h1><p>The code and name could not be matched to an issued historical reviewer evaluation receipt. No certificate was produced.</p><p><a href="/reviewer/completion.html">Return to the verification form</a>.</p></main></body></html>',404);

  const tsrc = String(url.searchParams.get('src') || '').toLowerCase();
  const isCheck = tsrc === 'owner' || url.searchParams.get('owner') === '1'
               || tsrc === 'verify' || tsrc === 'test' || tsrc === 'selftest'
               || tsrc.indexOf('deploytest') === 0;

  if (SERVICE && !isCheck) {
    try {
      const ua = String(req.headers.get('user-agent') || '').slice(0, 300);
      await fetch(SB + '/rest/v1/interaction_events', {
        method: 'POST',
        headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE,
                   'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ source: 'reviewer-cert-render', type: 'download', payload: {
          completion_code: code,
          country: String(req.headers.get('x-vercel-ip-country') || '')
            .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || '',
          user_agent: ua,
          is_mobile: /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile|BlackBerry|Opera Mini/i.test(ua)
        }})
      });
    } catch (e) { /* a log write must never stop a certificate */ }
  }

  return html(page(issued));
}
