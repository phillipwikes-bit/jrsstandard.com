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
//   OPENAI_API_KEY / GEMINI_API_KEY  (optional — adding either turns the nightly probe into a
//                               CROSS-VENDOR run; >= 2 vendors agreeing escalates the label to
//                               'Emerging Pattern'. See the provider section below.)
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

// ── Cross-vendor reproducibility ──────────────────────────────────────────────
// Each record is judged by ONE model PER PROVIDER, and we measure how often the
// providers agree. Independent providers (different vendors) agreeing is a genuinely
// stronger, INDEPENDENT signal — unlike same-provider models, which share lineage.
// Agreement is still not accuracy and not validation.
//
// Optional provider keys (set in the hosting dashboard next to ANTHROPIC_API_KEY):
//   OPENAI_API_KEY  + optional OPENAI_MODEL  (default 'gpt-5')
//   GEMINI_API_KEY  + optional GEMINI_MODEL  (default 'gemini-2.5-pro')
//   optional ANTHROPIC_MODEL (default 'claude-opus-4-8')
// The study degrades gracefully:
//   - With a non-Claude key present → CROSS-VENDOR mode; once >= 2 vendors answer,
//     the label legitimately escalates to 'Emerging Pattern'.
//   - With neither present          → same-provider mode (3 Claude models),
//     label stays 'Observation' (same provider is not independent).
// Model IDs are env-overridable so exact current IDs can be pinned without a code change;
// if a model id is wrong the call simply returns null and that provider is excluded.
function envv(name, dflt){ try { return (typeof process!=='undefined' && process.env && process.env[name]) || dflt; } catch(e){ return dflt; } }
const PROMPT = (record) => `RECORD:\n${record}\n\n${QUESTION}`;
function parseAnswer(txt){ const m=(txt||'').trim().match(/"answer"\s*:\s*"(Yes|Partially|No)"/i); return m?m[1]:null; }

async function askAnthropic(record, model, key){
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key':key, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model, max_tokens:200, messages:[{ role:'user', content:PROMPT(record) }] }),
    });
    const j = await res.json(); let txt='';
    if (j && Array.isArray(j.content)) for (const b of j.content) if (b && b.type==='text' && b.text) txt += b.text;
    return parseAnswer(txt);
  } catch(e){ return null; }
}
async function askOpenAI(record, model, key){
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{ 'Authorization':'Bearer '+key, 'content-type':'application/json' },
      body: JSON.stringify({ model, max_completion_tokens:2000, messages:[{ role:'user', content:PROMPT(record) }] }),
    });
    const j = await res.json();
    const c = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    return parseAnswer(typeof c==='string' ? c : (c?JSON.stringify(c):''));
  } catch(e){ return null; }
}
async function askGemini(record, model, key){
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(key), {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({ contents:[{ parts:[{ text:PROMPT(record) }] }], generationConfig:{ maxOutputTokens:1000 } }),
    });
    const j = await res.json(); let txt='';
    const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    if (Array.isArray(parts)) for (const p of parts) if (p && p.text) txt += p.text;
    return parseAnswer(txt);
  } catch(e){ return null; }
}

// Build the active roster from whatever provider keys are present.
function buildRoster(anthropicKey){
  const openaiKey = envv('OPENAI_API_KEY','');
  const geminiKey = envv('GEMINI_API_KEY','');
  const roster = [];
  if (openaiKey || geminiKey){
    roster.push({ provider:'anthropic', model:envv('ANTHROPIC_MODEL','claude-opus-4-8'), ask:(r,m)=>askAnthropic(r,m,anthropicKey) });
    if (openaiKey) roster.push({ provider:'openai', model:envv('OPENAI_MODEL','gpt-5'), ask:(r,m)=>askOpenAI(r,m,openaiKey) });
    if (geminiKey) roster.push({ provider:'google', model:envv('GEMINI_MODEL','gemini-2.5-pro'), ask:(r,m)=>askGemini(r,m,geminiKey) });
  } else {
    ['claude-haiku-4-5','claude-sonnet-4-6','claude-opus-4-8'].forEach(function(m){
      roster.push({ provider:'anthropic', model:m, ask:(r,mm)=>askAnthropic(r,mm,anthropicKey) });
    });
  }
  return roster;
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

    // Build the roster from available provider keys (cross-vendor if a non-Claude key is set).
    const roster = buildRoster(ANTHROPIC);
    const rosterModels = roster.map(function (e) { return e.provider + ':' + e.model; });

    const perRecord = {};         // {id: agreement} — numeric for the Rung 1 decomposition
    const perRecordModels = {};   // {id: {"provider:model": answer}}
    const providersAnswered = {}; // distinct providers that returned >= 1 valid answer
    let agrSum = 0, agrN = 0;
    for (const rec of RECORDS) {
      const byKey = {};
      const results = await Promise.all(roster.map(function (e) { return e.ask(rec.text, e.model); }));
      roster.forEach(function (e, i) {
        byKey[e.provider + ':' + e.model] = results[i];
        if (results[i]) providersAnswered[e.provider] = true;
      });
      const valid = results.filter(function (a) { return a; });
      const agreement = valid.length >= 2 ? modalAgreement(valid) : null;
      perRecord[rec.id] = (agreement == null) ? null : Number(agreement.toFixed(3));
      perRecordModels[rec.id] = byKey;
      if (agreement != null) { agrSum += agreement; agrN++; }
    }
    const overall = agrN ? agrSum / agrN : 0;
    const nModels = roster.length;
    const providers = Object.keys(providersAnswered);
    const distinctProviders = providers.length;
    const crossVendor = distinctProviders >= 2; // >= 2 DIFFERENT vendors actually answered
    const mode = crossVendor ? 'cross_vendor' : 'cross_model_same_provider';
    const metrics = {
      study: 'STUDY-001', mode, providers, n_providers: distinctProviders,
      models: rosterModels, n_models: nModels, model: rosterModels.join(', '),
      per_record: perRecord, per_record_models: perRecordModels,
      overall_agreement: Number(overall.toFixed(3)),
    };

    const headers = { 'apikey': SERVICE, 'Authorization': 'Bearer ' + SERVICE, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' };
    await fetch(SUPABASE_URL + '/rest/v1/study_runs', { method: 'POST', headers, body: JSON.stringify({ study_id: 'STUDY-001', model: metrics.model, metrics }) });

    // Escalation requires INDEPENDENT signals. Agreement among models from the SAME provider is a
    // stronger consistency check than one model repeating itself, but is not independent. Agreement
    // among models from DIFFERENT vendors (>= 2 distinct providers actually answering) is independent
    // cross-vendor agreement, which legitimately escalates the label to 'Emerging Pattern'.
    const hasExpertLabels = false;  // no ground-truth benchmark yet (STUDY-002)
    const hasMultiReviewer = false; // no human multi-reviewer data yet (STUDY-004)
    const classification =
      (hasExpertLabels && hasMultiReviewer) ? 'Supported Finding' :
      (hasExpertLabels || crossVendor) ? 'Emerging Pattern' :
      'Observation';

    // Engagement bundle — no finding is published without a discussion version.
    const pct = (overall * 100).toFixed(0);
    const recs = RECORDS.length;
    const provLabel = crossVendor
      ? `${distinctProviders} independent providers (${providers.join(', ')})`
      : `${nModels} Claude models (same provider)`;
    const modelList = rosterModels.join(', ');
    const indepNote = crossVendor
      ? 'These are different vendors, so this is independent cross-vendor agreement.'
      : 'These are the same provider, so this is a stronger consistency check than one model repeating itself, not independent cross-vendor agreement.';
    const bundle = {
      observation: `On the same ${recs} constructed records, ${provLabel} gave the same answer about ${pct}% of the time. ${indepNote} Agreement is not accuracy and not validation.`,
      supporting_data: `${recs} constructed (synthetic) records · ${provLabel} (${modelList}), one pass each · no human reviewers, no ground-truth labels`,
      research_question: `When ${provLabel} judge the same record, does ${pct}% agreement reflect a stable signal in the record, shared behavior, or prompt design? Reproducibility is distinct from accuracy and from validation.`,
      discussion: `${provLabel} agreed about ${pct}% of the time on synthetic records. ${crossVendor ? 'Why might independent models still agree without being right' : 'Why might same-provider models agree without being right'}, and what evidence would change your confidence?`,
      debate: crossVendor ? 'Does independent cross-vendor agreement on synthetic records tell us anything about real-record accuracy?' : 'Does agreement among same-provider models show more than shared training?',
      poll: { question: 'Which would raise your confidence in a review result the most?', options: ['Agreement with an expert benchmark', 'Agreement across different models', 'Agreement across repeated runs', 'Agreement with human reviewers'] },
      challenge: 'Take the One-Minute Challenge on the same kind of record and compare your read to the model’s.',
      classification,
    };

    // Replace prior STUDY-001 finding so the public page shows one current row (no pile-up across nightly runs).
    // The full per-run history is preserved in study_runs above.
    const baseFinding = {
      study_id: 'STUDY-001',
      headline: crossVendor
        ? `Cross-vendor agreement (synthetic, ${distinctProviders} providers): ${pct}% across ${recs} constructed records`
        : `Cross-model agreement (synthetic, ${nModels} Claude models): ${pct}% across ${recs} constructed records`,
      body: `Automated reproducibility check: each constructed record was judged by ${provLabel} (${modelList}); the figure is the share matching the most common answer. ${indepNote} It is consistency on synthetic data only: not accuracy, not validation, and not evidence about real workplace records.`,
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

    return json({ ok: true, mode, classification, providers, cross_vendor: crossVendor, enriched: fres.ok, metrics });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
