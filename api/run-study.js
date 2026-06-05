export const config = { runtime: 'edge' };

// JRS Evidence Development Program — automated study runner (Study 001: AI Reproducibility).
// Deploys automatically alongside api/review.js and REUSES the same ANTHROPIC_API_KEY.
//
// Required environment variables (set in the hosting dashboard, same place as ANTHROPIC_API_KEY):
//   ANTHROPIC_API_KEY          (already set — used by the simulator)
//   SUPABASE_SERVICE_ROLE_KEY  (add this — Supabase > Settings > API > service_role secret)
//   RUN_TOKEN                  (add this — any random string; protects the endpoint from cost abuse)
//
// Trigger (after deploy + research SQL run):
//   https://www.jrsstandard.com/api/run-study?token=YOUR_RUN_TOKEN
//
// Nothing runs until ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY + RUN_TOKEN are set
// and the research tables exist (supabase-research-setup.sql).

const SUPABASE_URL = 'https://pjzxkeviouofdseagvpf.supabase.co';

const RECORDS = [
  { id: 'weak', text: 'Michael has demonstrated increasingly unprofessional conduct over the last several weeks. His poor attitude has negatively affected team morale and productivity. Despite previous coaching conversations, meaningful improvement has not been observed.' },
  { id: 'moderate', text: 'Over the past quarter the employee submitted several reports after the deadline. A meeting was held in March to discuss timeliness. Some improvement was observed, though issues reportedly continued.' },
  { id: 'strong', text: 'On March 4, 11, and 18 the weekly report was submitted after the Friday 5:00 PM deadline (timestamps in the shared drive). On March 20 the manager met with the employee; notes are on file. Training was scheduled for March 27; from March 27 to April 30 all reports were on time (shared-drive log).' },
];

const QUESTION =
  'Could an independent reviewer determine how the conclusion was reached based solely on this documentation? ' +
  'Respond ONLY with JSON: {"answer":"Yes|Partially|No"}.';

async function askClaude(record, key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [{ role: 'user', content: `RECORD:\n${record}\n\n${QUESTION}` }],
    }),
  });
  const j = await res.json();
  const txt = (j && j.content && j.content[0] && j.content[0].text || '').trim();
  const m = txt.match(/"answer"\s*:\s*"(Yes|Partially|No)"/i);
  return m ? m[1] : 'Unparsed';
}

function modalAgreement(answers) {
  const counts = {};
  for (const a of answers) counts[a] = (counts[a] || 0) + 1;
  const top = Math.max.apply(null, Object.values(counts));
  return answers.length ? top / answers.length : 0;
}

export default async function handler(req) {
  const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const k = Math.min(Math.max(parseInt(url.searchParams.get('k') || '5', 10) || 5, 1), 10);

    const ANTHROPIC = (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) || '';
    const SERVICE = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
    const RUN_TOKEN = (typeof process !== 'undefined' && process.env && process.env.RUN_TOKEN) || '';

    if (!ANTHROPIC) return json({ error: 'ANTHROPIC_API_KEY not set' }, 400);
    if (!SERVICE) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, 400);
    if (!RUN_TOKEN || token !== RUN_TOKEN) return json({ error: 'invalid or missing token' }, 401);

    const perRecord = {};
    for (const rec of RECORDS) {
      const answers = [];
      for (let i = 0; i < k; i++) answers.push(await askClaude(rec.text, ANTHROPIC));
      perRecord[rec.id] = modalAgreement(answers);
    }
    const vals = Object.values(perRecord);
    const overall = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const metrics = { study: 'STUDY-001', model: 'claude-haiku-4-5-20251001', k, per_record: perRecord, overall_agreement: Number(overall.toFixed(3)) };

    const headers = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
    await fetch(SUPABASE_URL + '/rest/v1/study_runs', { method: 'POST', headers, body: JSON.stringify({ study_id: 'STUDY-001', model: metrics.model, metrics }) });
    await fetch(SUPABASE_URL + '/rest/v1/findings', {
      method: 'POST', headers,
      body: JSON.stringify({
        study_id: 'STUDY-001',
        headline: `Reproducibility run: ${(overall * 100).toFixed(0)}% self-consistency across ${RECORDS.length} records (k=${k})`,
        body: 'Automated reproducibility check: the same record was reviewed multiple times by one model; the figure is the share of runs matching the most common answer. Reproducibility is not accuracy and not validation.',
        metrics, published: true, evidence_class: 'reproducibility',
      }),
    });
    await fetch(SUPABASE_URL + '/rest/v1/studies?id=eq.STUDY-001', { method: 'PATCH', headers, body: JSON.stringify({ status: 'active' }) });

    return json({ ok: true, metrics });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
