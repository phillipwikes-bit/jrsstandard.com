// Cloudflare Pages Function — returns the live aggregate results from KV.
// Route: GET /results
// Requires a KV namespace bound to the Pages project as: JRS_RESULTS
// If the binding is absent, returns the seed so the page still renders.

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

export async function onRequestGet(context) {
  let d = seed();
  try {
    const kv = context.env.JRS_RESULTS;
    if (kv) {
      const raw = await kv.get("aggregate");
      if (raw) d = JSON.parse(raw);
    }
  } catch (e) { /* fall back to seed */ }
  if (!d.min_sample_for_comparison) d.min_sample_for_comparison = 5;
  return new Response(JSON.stringify(d), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
