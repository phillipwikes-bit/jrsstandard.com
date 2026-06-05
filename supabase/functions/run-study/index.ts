// JRS Evidence Development Program — automated study runner (Supabase Edge Function)
// Implements STUDY-001 (AI Reproducibility): runs the same review K times per record
// with a model and measures answer consistency, then writes a published finding.
//
// DEPLOY (requires a computer + Supabase CLI):
//   supabase functions deploy run-study
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// SCHEDULE (nightly), run in SQL editor after enabling pg_cron + pg_net:
//   select cron.schedule('jrs-study-001','0 5 * * *',
//     $$ select net.http_post(
//          url:='https://<PROJECT>.supabase.co/functions/v1/run-study',
//          headers:='{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb,
//          body:='{"study":"STUDY-001","k":5}'::jsonb) $$);
//
// NOTE: this calls a paid model API. Cost is per run. Nothing runs until deployed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RECORDS = [
  { id: "weak", text: "Michael has demonstrated increasingly unprofessional conduct over the last several weeks. His poor attitude has negatively affected team morale and productivity. Despite previous coaching conversations, meaningful improvement has not been observed." },
  { id: "moderate", text: "Over the past quarter the employee submitted several reports after the deadline. A meeting was held in March to discuss timeliness. Some improvement was observed, though issues reportedly continued." },
  { id: "strong", text: "On March 4, 11, and 18 the weekly report was submitted after the Friday 5:00 PM deadline (timestamps in the shared drive). On March 20 the manager met with the employee; notes are on file. Training was scheduled for March 27; from March 27 to April 30 all reports were on time (shared-drive log)." },
];

const QUESTION =
  "Could an independent reviewer determine how the conclusion was reached based solely on this documentation? " +
  'Respond ONLY with JSON: {"answer":"Yes|Partially|No"}.';

async function askClaude(record: string, key: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 64,
      messages: [{ role: "user", content: `RECORD:\n${record}\n\n${QUESTION}` }],
    }),
  });
  const j = await res.json();
  const txt = (j?.content?.[0]?.text || "").trim();
  const m = txt.match(/"answer"\s*:\s*"(Yes|Partially|No)"/i);
  return m ? m[1] : "Unparsed";
}

function modalAgreement(answers: string[]): number {
  const counts: Record<string, number> = {};
  for (const a of answers) counts[a] = (counts[a] || 0) + 1;
  const top = Math.max(...Object.values(counts));
  return answers.length ? top / answers.length : 0;
}

Deno.serve(async (req) => {
  try {
    const { study = "STUDY-001", k = 5 } = await req.json().catch(() => ({}));
    const ANTHROPIC = Deno.env.get("ANTHROPIC_API_KEY");
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!ANTHROPIC) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), { status: 400 });

    const db = createClient(SB_URL, SB_SERVICE);
    const perRecord: Record<string, number> = {};

    for (const rec of RECORDS) {
      const answers: string[] = [];
      for (let i = 0; i < k; i++) answers.push(await askClaude(rec.text, ANTHROPIC));
      perRecord[rec.id] = modalAgreement(answers);
    }
    const vals = Object.values(perRecord);
    const overall = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);

    const metrics = { study, model: "claude-haiku-4-5-20251001", k, per_record: perRecord, overall_agreement: Number(overall.toFixed(3)) };
    await db.from("study_runs").insert({ study_id: study, model: metrics.model, metrics });

    await db.from("findings").insert({
      study_id: study,
      headline: `Reproducibility run: ${(overall * 100).toFixed(0)}% self-consistency across ${RECORDS.length} records (k=${k})`,
      body: "Automated reproducibility check: the same record was reviewed multiple times by one model; the figure is the share of runs matching the most common answer. Reproducibility is not accuracy and not validation.",
      metrics,
      published: true,
      evidence_class: "reproducibility",
    });

    await db.from("studies").update({ status: "active" }).eq("id", study);
    return new Response(JSON.stringify({ ok: true, metrics }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
