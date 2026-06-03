// Cloudflare Pages Function — records one challenge submission into KV.
// Route: POST /record   Body: { "answer": "Yes|Partially|No", "role": "..." }
// Requires a KV namespace bound to the Pages project as: JRS_RESULTS

function seed() {
  return {
    min_sample_for_comparison: 5,
    participants: 1,
    reviews_completed: 1,
    distribution: { Yes: 0, Partially: 0, No: 1 },
    roles: { "AI Governance Professional": 1 },
    updated: "2026-06-03"
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

export async function onRequestPost(context) {
  try {
    const kv = context.env.JRS_RESULTS;
    if (!kv) return json({ ok: false, reason: "no-binding" });

    const body = await context.request.json().catch(() => ({}));
    const answer = body.answer;
    const role = (body.role || "").toString().slice(0, 80).trim();
    const valid = ["Yes", "Partially", "No"];
    if (valid.indexOf(answer) < 0) return json({ ok: false, reason: "bad-answer" }, 400);

    const raw = await kv.get("aggregate");
    const d = raw ? JSON.parse(raw) : seed();
    if (!d.distribution) d.distribution = { Yes: 0, Partially: 0, No: 0 };
    if (!d.roles) d.roles = {};

    d.participants = (d.participants || 0) + 1;
    d.reviews_completed = (d.reviews_completed || 0) + 1;
    d.distribution[answer] = (d.distribution[answer] || 0) + 1;
    if (role) d.roles[role] = (d.roles[role] || 0) + 1;
    d.min_sample_for_comparison = d.min_sample_for_comparison || 5;
    d.updated = new Date().toISOString().slice(0, 10);

    await kv.put("aggregate", JSON.stringify(d));
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, reason: "error" }, 500);
  }
}
