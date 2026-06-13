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

// Cross-model reproducibility: each record is judged by several DIFFERENT models, and we measure
// how often they agree. This is a stronger consistency signal than one model repeating itself.
// NOTE: all three are Claude models (same provider), so this is not independent cross-vendor
// validation, and agreement is still not accuracy and not validation.
const MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-8'];

async function askModel(record, model, key) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: model,
        max_tokens: 200,
        messages: [{ role: 'user', content: `RECORD:\n${record}\n\n${QUESTION}` }],
      }),
    });
    const j = await res.json();
    let txt = '';
    if (j && Array.isArray(j.content)) for (const b of j.content) if (b && b.type === 'text' && b.text) txt += b.text;
    const m = txt.trim().match(/"answer"\s*:\s*"(Yes|Partially|No)"/i);
    return m ? m[1] : null;   // null = no usable answer from this model (excluded, never guessed)
  } catch (e) { return null; }
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

    const ANTHROPIC = (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) || '';
    const SERVICE = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_SERVICE_ROLE_KEY) || '';
    const RUN_TOKEN = (typeof process !== 'undefined' && process.env && process.env.RUN_TOKEN) || '';
    const CRON_SECRET = (typeof process !== 'undefined' && process.env && process.env.CRON_SECRET) || '';

    // Authentication / triggering:
    //  - Manual:  ?token=RUN_TOKEN (bypasses the daily guard; used for testing).
    //  - Cron:    Vercel's scheduler sends User-Agent "vercel-cron/1.0" (and, if you set
    //             CRON_SECRET, an Authorization: Bearer header). EITHER is accepted, so the
    //             nightly job works automatically WITHOUT any env var being set.
    //  Abuse guard: a cron-path run is skipped if a successful run happened in the last ~20h,
    //  so the model is called at most once per day no matter how often the endpoint is hit.
    var bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    var ua = (req.headers.get('user-agent') || '').toLowerCase();
    var okManual = RUN_TOKEN && token === RUN_TOKEN;
    var okCronSecret = CRON_SECRET && bearer === CRON_SECRET;
    var isVercelCron = ua.indexOf('vercel-cron') !== -1;

    if (!ANTHROPIC) return json({ error: 'ANTHROPIC_API_KEY not set' }, 400);
    if (!SERVICE) return json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, 400);
    if (!okManual && !okCronSecret && !isVercelCron) return json({ error: 'invalid or missing token' }, 401);

    // Daily guard for unauthenticated cron-path calls (not for an explicit RUN_TOKEN/CRON_SECRET).
    if (!okManual && !okCronSecret) {
      try {
        const lr = await fetch(SUPABASE_URL + '/rest/v1/findings?study_id=eq.STUDY-001&select=created_at&order=created_at.desc&limit=1',
          { headers: { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE } });
        const arr = await lr.json();
        if (Array.isArray(arr) && arr[0] && arr[0].created_at) {
          var ageH = (Date.now() - new Date(arr[0].created_at).getTime()) / 3.6e6;
          if (ageH < 20) return json({ ok: true, skipped: 'ran ' + ageH.toFixed(1) + 'h ago' });
        }
      } catch (e) {}
    }

    // Cross-model: ask each of the MODELS once per record, measure agreement across models.
    const perRecord = {};        // {id: agreement}  — kept numeric for the Rung 1 decomposition
    const perRecordModels = {};  // {id: {model: answer}} — the per-model detail
    let agrSum = 0, agrN = 0;
    for (const rec of RECORDS) {
      const byModel = {};
      const results = await Promise.all(MODELS.map(function (model) { return askModel(rec.text, model, ANTHROPIC); }));
      MODELS.forEach(function (model, i) { byModel[model] = results[i]; });
      const valid = MODELS.map(function (mdl) { return byModel[mdl]; }).filter(function (a) { return a; });
      const agreement = valid.length >= 2 ? modalAgreement(valid) : null;
      perRecord[rec.id] = (agreement == null) ? null : Number(agreement.toFixed(3));
      perRecordModels[rec.id] = byModel;
      if (agreement != null) { agrSum += agreement; agrN++; }
    }
    const overall = agrN ? agrSum / agrN : 0;
    const nModels = MODELS.length;
    const metrics = {
      study: 'STUDY-001', mode: 'cross_model', models: MODELS, n_models: nModels,
      model: MODELS.join(', '), per_record: perRecord, per_record_models: perRecordModels,
      overall_agreement: Number(overall.toFixed(3)),
    };

    const headers = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
    await fetch(SUPABASE_URL + '/rest/v1/study_runs', { method: 'POST', headers, body: JSON.stringify({ study_id: 'STUDY-001', model: metrics.model, metrics }) });

    // Classification reflects INDEPENDENT VARIATION, not repetition.
    // Re-running the same prompt on the same synthetic records is repetition, not a trend,
    // so it must not escalate the evidence class. Escalation requires independent signals:
    // more than one model, expert/ground-truth labels, or multiple human reviewers.
    // Escalation requires INDEPENDENT signals. Several Claude models agreeing is a stronger
    // consistency check than one model repeating itself, but they share a provider and lineage,
    // so it is not the independent (cross-vendor) signal that would justify promoting the label.
    // The honesty label therefore stays 'Observation' until a non-Claude model or human/expert data exists.
    const distinctModels = 1;       // independent providers wired today (Claude family counts as one)
    const hasExpertLabels = false;  // no ground-truth benchmark yet (STUDY-002)
    const hasMultiReviewer = false; // no human multi-reviewer data yet (STUDY-004)
    const classification =
      (hasExpertLabels && hasMultiReviewer) ? 'Supported Finding' :
      (hasExpertLabels || distinctModels > 1) ? 'Emerging Pattern' :
      'Observation';

    // Engagement bundle — no finding is published without a discussion version.
    const pct = (overall * 100).toFixed(0);
    const recs = RECORDS.length;
    const bundle = {
      observation: `On the same ${recs} constructed records, ${nModels} different Claude models (Haiku, Sonnet, Opus) gave the same answer about ${pct}% of the time. They are different models but the same provider, so this is a stronger consistency check than one model repeating itself, not independent cross-vendor validation. Agreement is not accuracy and not validation.`,
      supporting_data: `${recs} constructed (synthetic) records · ${nModels} Claude models (${MODELS.join(', ')}), one pass each · same provider, not cross-vendor · no human reviewers, no ground-truth labels`,
      research_question: `When ${nModels} different models judge the same record, does ${pct}% agreement reflect a stable signal in the record, shared model behavior, or prompt design? Reproducibility is distinct from accuracy and from validation.`,
      discussion: `${nModels} Claude models agreed about ${pct}% of the time on synthetic records. Why might models that share a provider still agree without being right, and what evidence would change your confidence?`,
      debate: 'Does agreement among same-provider models show more than shared training, short of independent cross-vendor agreement?',
      poll: { question: 'Which would raise your confidence in a review result the most?', options: ['Agreement with an expert benchmark', 'Agreement across different models', 'Agreement across repeated runs', 'Agreement with human reviewers'] },
      challenge: 'Take the One-Minute Challenge on the same kind of record and compare your read to the model’s.',
      classification,
    };

    // Replace prior STUDY-001 finding so the public page shows one current row (no pile-up across nightly runs).
    // The full per-run history is preserved in study_runs above.
    const baseFinding = {
      study_id: 'STUDY-001',
      headline: `Cross-model agreement (synthetic, ${nModels} Claude models): ${pct}% agreement across ${recs} constructed records`,
      body: `Automated reproducibility check: each constructed record was reviewed by ${nModels} different Claude models (${MODELS.join(', ')}); the figure is the share of models matching the most common answer. The models share a provider, so this is a stronger consistency signal than one model repeating itself, but not independent cross-vendor agreement. It is self-consistency on synthetic data only: not accuracy, not validation, and not evidence about real workplace records.`,
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

    // Append-only nightly record: one row per run, never overwritten. This is the
    // time series an external reviewer inspects (findings table only keeps the latest).
    await fetch(SUPABASE_URL + '/rest/v1/findings_history', {
      method: 'POST', headers,
      body: JSON.stringify({
        study_id: 'STUDY-001',
        headline: baseFinding.headline,
        classification,
        overall_agreement: Number(overall.toFixed(3)),
        per_record: perRecord,
        k: nModels, records: recs, model: metrics.model,
        metrics,
      }),
    }).catch(function(){});

    return json({ ok: true, classification, enriched: fres.ok, metrics });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
