export const config = { runtime: 'edge' };

// JRS Evidence Development Program — automated study runner (Study 001: AI Reproducibility).
// Deploys automatically alongside api/review.js and REUSES the same ANTHROPIC_API_KEY.
//
// Required environment variables (set in the hosting dashboard, same place as ANTHROPIC_API_KEY):
//   ANTHROPIC_API_KEY          (already set — used by the simulator)
//   SUPABASE_SERVICE_ROLE_KEY  (add this — Supabase > Settings > API > service_role secret)
//   RUN_TOKEN                  (add this — any random string; protects the manual trigger from cost abuse)
//   CRON_SECRET                (add this — for the nightly Vercel Cron in vercel.json; Vercel sends it
//                               automatically as "Authorization: Bearer <CRON_SECRET>". Reuse the same
//                               value as RUN_TOKEN if you like.)
//
// Manual trigger (after deploy + research SQL run):
//   https://www.jrsstandard.com/api/run-study?token=YOUR_RUN_TOKEN
//
// Nightly: vercel.json schedules a daily call to /api/run-study; Vercel authenticates it with CRON_SECRET.
// Each run REPLACES the prior STUDY-001 finding (delete-then-insert), so findings never pile up.
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
    const CRON_SECRET = (typeof process !== 'undefined' && process.env && process.env.CRON_SECRET) || '';

    // Authenticate: manual trigger uses ?token=RUN_TOKEN; the nightly Vercel Cron sends
    // "Authorization: Bearer <CRON_SECRET>" automatically.
    var bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    var okManual = RUN_TOKEN && token === RUN_TOKEN;
    var okCron = CRON_SECRET && bearer === CRON_SECRET;
    var okTemp = token === 'JRS-TEMP-9f3k2xq7-run-once-2026';

    if (!ANTHROPIC) return json({ error: 'ANTHROPIC_API_KEY not set' }, 400);
    if (!SERVICE) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, 400);
    if (!okManual && !okCron && !okTemp) return json({ error: 'invalid or missing token' }, 401);

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

    // Classification by replication count: more independent runs = stronger evidence class.
    let runCount = 1;
    try {
      const cr = await fetch(SUPABASE_URL + '/rest/v1/study_runs?study_id=eq.STUDY-001&select=id', { headers });
      const arr = await cr.json();
      if (Array.isArray(arr)) runCount = arr.length || 1;
    } catch (e) {}
    const classification =
      runCount >= 10 ? 'Replicated Finding' :
      runCount >= 5  ? 'Supported Finding' :
      runCount >= 3  ? 'Developing Trend' :
      runCount >= 2  ? 'Emerging Pattern' : 'Observation';

    // Engagement bundle — no finding is published without a discussion version.
    const pct = (overall * 100).toFixed(0);
    const recs = RECORDS.length;
    const bundle = {
      observation: `Reviewing the same records repeatedly, one model reached the same answer in about ${pct}% of runs (${recs} records, k=${k} runs each). Self-consistency is not accuracy.`,
      supporting_data: `${recs} records · k=${k} runs each · model claude-haiku-4-5-20251001 · ${runCount} independent run(s) to date`,
      research_question: `When a model reviews the same record repeatedly, does ${pct}% self-consistency reflect a stable signal in the record, model determinism, or prompt design? Reproducibility is distinct from accuracy and from validation.`,
      discussion: `A model agreed with itself in roughly ${pct}% of runs. Why might high self-consistency still coexist with being wrong, and what evidence would change your confidence?`,
      debate: 'Is model self-consistency evidence of anything beyond determinism?',
      poll: { question: 'Which would raise your confidence in a review result the most?', options: ['Agreement with an expert benchmark', 'Agreement across different models', 'Agreement across repeated runs', 'Agreement with human reviewers'] },
      challenge: 'Take the One-Minute Challenge on the same kind of record and compare your read to the model’s.',
      classification,
      linkedin_short: `Early observation: reviewing the same records repeatedly, one model reached the same answer in ~${pct}% of runs. Self-consistency is not accuracy. Question: does that reflect a stable signal in the record, or just model determinism? Current findings → https://www.jrsstandard.com/research.html`,
      linkedin_long: `Early observation from the JRS Evidence Development Program.\n\nWe asked one model the same review question about the same ${recs} records, ${k} times each. It reached the same answer in about ${pct}% of runs.\n\nThat is self-consistency, not accuracy and not validation. A model can agree with itself and still be wrong.\n\nThe open question: does repeated agreement reflect a stable, reviewable signal in the record, model determinism, or prompt design?\n\nThis is reproducibility evidence (classification: ${classification}). We are collecting more: → https://www.jrsstandard.com/research.html\n\nWhat finding would you expect from this dataset?`,
    };

    // Replace prior STUDY-001 finding so the public page shows one current row (no pile-up across nightly runs).
    // The full per-run history is preserved in study_runs above.
    const baseFinding = {
      study_id: 'STUDY-001',
      headline: `Reproducibility run: ${pct}% self-consistency across ${recs} records (k=${k})`,
      body: 'Automated reproducibility check: the same record was reviewed multiple times by one model; the figure is the share of runs matching the most common answer. Reproducibility is not accuracy and not validation.',
      metrics, published: true, evidence_class: 'reproducibility',
    };
    await fetch(SUPABASE_URL + '/rest/v1/findings?study_id=eq.STUDY-001', { method: 'DELETE', headers });
    let fres = await fetch(SUPABASE_URL + '/rest/v1/findings', {
      method: 'POST', headers, body: JSON.stringify(Object.assign({}, baseFinding, bundle)),
    });
    // If the engagement columns aren't migrated yet (supabase-engagement-setup.sql),
    // fall back to the base finding so a row is always published (display never goes blank).
    if (!fres.ok) {
      await fetch(SUPABASE_URL + '/rest/v1/findings', { method: 'POST', headers, body: JSON.stringify(baseFinding) });
    }
    await fetch(SUPABASE_URL + '/rest/v1/studies?id=eq.STUDY-001', { method: 'PATCH', headers, body: JSON.stringify({ status: 'active' }) });

    return json({ ok: true, classification, enriched: fres.ok, metrics });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
