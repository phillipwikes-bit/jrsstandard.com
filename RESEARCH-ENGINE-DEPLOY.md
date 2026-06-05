# JRS Automated Study Engine — Deployment Guide

The site code is built. The automated study engine is real, deployable code, but it
**runs only after you deploy it and provide a model API key** (it calls a paid API).
A **computer** is required (the Supabase CLI can't run from a phone).

## What's already done (in the repo / live site)
- `supabase-research-setup.sql` — research tables (`studies`, `study_runs`, `findings`) + security.
- `supabase/functions/run-study/index.ts` — the automated runner (Study 001 reproducibility, Anthropic).
- `research.html` — shows published findings automatically once they exist.

## Step 1 — Create the research tables
Supabase → SQL Editor → paste `supabase-research-setup.sql` → Run.

## Step 2 — Deploy the function (needs a computer)
Install the Supabase CLI, then:
```
supabase login
supabase link --project-ref pjzxkeviouofdseagvpf
supabase functions deploy run-study
supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOURKEY
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function automatically.

## Step 3 — Run it once (manual test)
```
curl -X POST https://pjzxkeviouofdseagvpf.supabase.co/functions/v1/run-study \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -H "Content-Type: application/json" \
  -d '{"study":"STUDY-001","k":5}'
```
Then refresh `research.html` — the finding should appear under "Current Findings".

## Step 4 — Schedule it (nightly)
Enable `pg_cron` and `pg_net` (Database → Extensions), then in SQL Editor:
```
select cron.schedule('jrs-study-001','0 5 * * *',
  $$ select net.http_post(
       url:='https://pjzxkeviouofdseagvpf.supabase.co/functions/v1/run-study',
       headers:='{"Authorization":"Bearer <SERVICE_ROLE_KEY>","Content-Type":"application/json"}'::jsonb,
       body:='{"study":"STUDY-001","k":5}'::jsonb) $$);
```

## Costs & controls
- Each run makes ~`k × records` model calls — a real (small) per-run cost on your API account.
- The function currently inserts findings with `published=true` (auto-publish, per your instruction). To require human approval instead, change `published: true` to `published: false` in the function and flip rows to published in the Table Editor after review. **Recommended for credibility.**
- Reproducibility ≠ accuracy ≠ validation. The finding text states this; keep it.

## Extending to more models / studies
Add OpenAI/Gemini callers alongside `askClaude` (each needs its own key/secret) and add
study branches (002 benchmark needs an expert-labeled dataset; 005 is the same runner on a schedule).
