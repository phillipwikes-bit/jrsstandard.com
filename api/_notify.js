// TRANSACTIONAL ALERT SENDER. Shared by every endpoint that captures a lead.
//
// PURPOSE: when a prospective client submits details or tries to pay, an email
// lands at info@jrsstandard.com immediately, carrying everything captured.
// Thirteen buyers reached the pay screen between 14 and 21 August 2026 and the
// owner learned of it weeks later by querying a table. A row in a database that
// nobody is watching is not a notification.
//
// THE ONE RULE THIS FILE EXISTS TO ENFORCE: SENDING MUST NEVER BREAK CAPTURING.
//
// The durable record is the row in pilot_contacts. The email is an alert about
// that row. If the provider is down, rate-limits, or is not configured at all,
// the lead must still be stored and the visitor must still see success. So every
// function here returns a result object and NEVER throws, and every caller is
// expected to await it AFTER the database write has already succeeded.
//
// Inverting that order would mean a mail outage silently costing leads, which is
// a strictly worse failure than a missed alert: the row can be queried later, a
// lost submission cannot be recovered at all.
//
// NO API KEY APPEARS IN THIS FILE OR IN ANY COMMITTED FILE. The key is read from
// the server environment only, exactly as SUPABASE_SERVICE_ROLE_KEY and
// ANTHROPIC_API_KEY are. Set ONE of:
//
//   RESEND_API_KEY     https://resend.com   (recommended: plain REST, edge-safe)
//   SENDGRID_API_KEY   https://sendgrid.com
//
// Optional:
//   NOTIFY_TO          explicit private owner recipient; no fallback is allowed
//   NOTIFY_FROM        explicit sender on a provider-verified domain
//                      Do not assume a valid-looking address is verified by
//                      the provider. Actual delivery must be tested.
//
// Neither provider ships an SDK here. Both are a single fetch to a documented
// REST endpoint, which matches this repository's no-dependency convention and
// keeps the function edge-compatible.

// ============================================================================
// INQUIRY EMAIL ALERTS: OWNER REQUEST, 2026-10-30.
//
// This supersedes the 2026-08-25 owner directive to use the dashboard only.
// The original disabled default is preserved as an explicit server-side gate:
// JRS_INQUIRY_ALERTS_ENABLED must be exactly "true". In addition, a configured
// RESEND_API_KEY or SENDGRID_API_KEY is required to transmit anything. NOTIFY_TO
// is a private Vercel environment setting, never a committed email address.
//
// Do not treat an inquiry as successfully emailed merely because database
// capture succeeded: notifyConfigured() requires BOTH the switch and provider.
// Every caller must still persist its database record BEFORE calling notify().
// Mail failure must not erase a lead or cause the visitor to resubmit it.
//
// Operational prerequisites before declaring Gmail notifications working:
// verified sender domain, active mail-provider key in server environment,
// preview test with a synthetic inquiry, actual inbox receipt, and a tested
// provider-failure path. Production deployment requires separate release review.
// ============================================================================
// The environment gate is read when the server module is initialized.
const ALERTS_ENABLED = ((typeof process !== 'undefined' && process.env) || {})
  .JRS_INQUIRY_ALERTS_ENABLED === 'true';

// Fail closed: destination and verified sender are explicit server settings.
// No notification is sent to a fallback mailbox, even if a provider key exists.
function configuredAddress(v) {
  const s = String(v || '').trim();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s) ? s : '';
}

function env() {
  return (typeof process !== 'undefined' && process.env) || {};
}

// Escapes for the HTML part. A prospect's free-text note is untrusted input and
// is about to be rendered in a mail client.
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// Header injection guard. A newline in a subject line can append headers, so
// every control character is stripped and the result is length-capped.
function subjectSafe(v) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, 180);
}

/**
 * Render an alert from a flat field map. Order is preserved, empty values are
 * dropped so the mail does not carry rows of blanks, and both a text and an
 * HTML part are produced because some clients render only one.
 */
export function renderAlert(title, fields) {
  const rows = [];
  for (let i = 0; i < fields.length; i++) {
    const label = fields[i][0];
    const value = fields[i][1];
    if (value === null || value === undefined || String(value).trim() === '') continue;
    rows.push([label, String(value)]);
  }

  let text = title + '\n' + '='.repeat(title.length) + '\n\n';
  let html = '<h2 style="font-family:sans-serif;font-size:16px;margin:0 0 12px">'
           + esc(title) + '</h2>'
           + '<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">';
  for (let i = 0; i < rows.length; i++) {
    text += rows[i][0] + ': ' + rows[i][1] + '\n';
    html += '<tr>'
          + '<td style="padding:4px 14px 4px 0;color:#666;vertical-align:top;white-space:nowrap">'
          + esc(rows[i][0]) + '</td>'
          + '<td style="padding:4px 0"><b>' + esc(rows[i][1]) + '</b></td>'
          + '</tr>';
  }
  html += '</table>';
  return { text: text, html: html };
}

async function sendViaResend(key, to, from, subject, body, replyTo) {
  const payload = {
    from: from,
    to: [to],
    subject: subject,
    text: body.text,
    html: body.html
  };
  // Reply-To is set to the prospect so the owner can answer the alert directly
  // instead of copying an address out of it.
  if (replyTo) payload.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const detail = await res.text().catch(function () { return ''; });
    return { sent: false, provider: 'resend', status: res.status,
             detail: String(detail).slice(0, 200) };
  }
  return { sent: true, provider: 'resend', status: res.status };
}

async function sendViaSendGrid(key, to, from, subject, body, replyTo) {
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: subject,
    content: [
      { type: 'text/plain', value: body.text },
      { type: 'text/html', value: body.html }
    ]
  };
  if (replyTo) payload.reply_to = { email: replyTo };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  // SendGrid returns 202 on success with an empty body.
  if (res.status !== 202) {
    const detail = await res.text().catch(function () { return ''; });
    return { sent: false, provider: 'sendgrid', status: res.status,
             detail: String(detail).slice(0, 200) };
  }
  return { sent: true, provider: 'sendgrid', status: res.status };
}

/**
 * Send one alert. NEVER throws and NEVER rejects.
 *
 * Returns { sent, provider, status?, detail? }. A caller may log the result but
 * must not change its own response based on it: the lead is already stored by
 * the time this runs, and telling a visitor their submission failed because an
 * email did not go out would be false.
 *
 * @param {string} subject
 * @param {{text:string, html:string}} body   from renderAlert()
 * @param {string} [replyTo]                  the prospect's own address
 */
export async function notify(subject, body, replyTo) {
  // Explicit owner-controlled gate, before reading any provider key.
  if (!ALERTS_ENABLED) {
    return { sent: false, provider: 'disabled',
             detail: 'alerts_disabled_by_environment_gate' };
  }

  const E = env();
  const to = configuredAddress(E.NOTIFY_TO);
  const from = configuredAddress(E.NOTIFY_FROM);
  if (!to || !from) {
    return { sent: false, provider: 'none',
             detail: 'recipient_or_verified_sender_not_configured' };
  }
  const subj = subjectSafe(subject);

  const resendKey = E.RESEND_API_KEY || '';
  const sendgridKey = E.SENDGRID_API_KEY || '';

  // [REQUIRED_ENV_PARAM] RESEND_API_KEY or SENDGRID_API_KEY.
  // Not configured is reported as a distinct state rather than as a failure, so
  // a deploy check can tell "no provider set up yet" apart from "the provider
  // rejected the message". Those need different actions from the owner.
  if (!resendKey && !sendgridKey) {
    return { sent: false, provider: 'none', detail: 'no_provider_configured' };
  }

  try {
    if (resendKey) {
      return await sendViaResend(resendKey, to, from, subj, body, replyTo);
    }
    return await sendViaSendGrid(sendgridKey, to, from, subj, body, replyTo);
  } catch (e) {
    // A provider outage, a DNS failure, an edge timeout. The lead is already
    // safe in the database; this is the alert failing, not the capture.
    return { sent: false, provider: resendKey ? 'resend' : 'sendgrid',
             detail: String((e && e.message) || e).slice(0, 200) };
  }
}

/**
 * True when a mail provider is configured. Used by status endpoints so the owner
 * can see at a glance whether alerts are actually going out, rather than
 * assuming they are because the code exists.
 */
export function notifyConfigured() {
  // False whenever alerts are disabled, regardless of environment. A status
  // surface must report what the system will actually DO, not what it could do
  // if a flag were flipped.
  if (!ALERTS_ENABLED) return false;
  const E = env();
  return !!(configuredAddress(E.NOTIFY_TO)
    && configuredAddress(E.NOTIFY_FROM)
    && (E.RESEND_API_KEY || E.SENDGRID_API_KEY));
}

// Exposes whether the explicit environment gate is on, not delivery success.
// Use notifyConfigured() to require both gate and provider.
export function alertsEnabled() {
  return ALERTS_ENABLED;
}
