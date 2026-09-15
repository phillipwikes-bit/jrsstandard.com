# Database Access and Exposure Review

**Blockers:** B-013 / D-19 · **Date:** 2026-09-15 · **Method:** read-only inspection of the
live Postgres catalog and aggregate queries. **No grant was altered. No schema was changed.
No personal data is reproduced in this document.**

**Status: OWNER ACTION REQUIRED.** Nothing was remediated, because changing a database
grant is a production operation and is not authorised.

---

## 1. What was actually checked

`pg_class` for RLS state, `has_table_privilege('anon', ...)` for table grants, `pg_policies`
for the policies that govern them, and aggregate counts. Table-level grants to `anon` are
SELECT/INSERT/UPDATE/DELETE on **every** public table, which is the Supabase default and is
**not** itself the access decision. **RLS is enabled on all 21 public tables**, so the
policies decide.

## 2. The result, stated in both directions

**THE LARGEST PERSONAL-DATA STORE IS NOT READABLE.** `pilot_contacts` holds **59 rows** of
names, email addresses, organisations and free-text messages. It has **INSERT policies only
and no SELECT policy**. With RLS enabled and no SELECT policy, anonymous read is denied.
**This is the correct posture and it is worth stating as plainly as the problems.**

`bench_experts` and `guide_downloads` have **zero policies**, so anonymous access to them is
denied entirely.

**THREE TABLES ARE ANONYMOUSLY READABLE WITH `qual = true`:**

| Table | Rows | What a reader gets |
|---|---|---|
| `interaction_events` | **2,280** | Page paths, link labels, `country`, truncated `user_agent`, download `file`/`edition`, training module completions, one observational survey |
| `bench_outcomes` | **54** | Study records, `record` free text, **avg 570 chars, max 2,358** |
| `engine_reviews` | **0** | Nothing today. Would hold per-condition notes grounded in record text and a `compliant_version` rewrite |

`bench_labels` (129), `findings_history` (61) and `study_runs` (70) are also anon-readable.
These are research outputs that the public research pages read by design.

## 3. A false alarm, corrected here rather than left standing

An initial pattern scan reported email addresses inside `interaction_events` payloads across
`pdf-dl`, `kit-dl` and `guide-dl`, which would have meant visitor email addresses were world
readable. **That was wrong, and the correction matters more than the alarm.**

Aggregating the matches produced **one distinct external address**, 18 occurrences, all on
**2026-08-14**, local part beginning `+c`, domain `anthropic.com`. That is a **crawler
contact address inside a `user_agent` string**, of the form `ClaudeBot/1.0; +...@anthropic.com`.

**FACT: no visitor email address is stored in `interaction_events`.** `bench_outcomes`
returns **0 email-pattern hits and 0 SSN-pattern hits** across all 54 rows.

## 4. What the real exposure is

**FACT.** Anyone holding the publishable key can read 2,280 rows of visitor behavioural
telemetry and 54 study records. The key ships in **22 pages of HTML** and is public by
design, so the unlinked `noindex` status of `engine-activity.html` is not the control.

**This is metadata and study material, not identities.** It is still a disclosure: page
paths, countries, user-agents and download history describe behaviour, and the study records
are contributor-supplied text.

**`engine_reviews` remains the forward-looking one.** It is empty, so nothing is exposed
today, and it is one paid engine call away from holding model-written text derived from a
customer record.

## 5. Options, none implemented

| # | Option | Effect | Cost |
|---|---|---|---|
| 1 | Revoke the `SELECT` policy on `engine_reviews` | Closes the forward-looking exposure before any row exists | `engine-activity.html` stops working until it reads through a server route |
| 2 | Move public activity reads behind a server route | Same, and gives one place to control what is shown | One new edge function |
| 3 | Stop persisting `compliant_version` and the per-condition notes | Removes record-derived content at the source | Loses the telemetry the reproducibility reporting uses |
| 4 | Narrow `interaction_events` read to aggregates via a view | Keeps the public research pages working, stops row-level reads | A view plus policy change |
| 5 | Leave as-is and disclose | No engineering change | The public pages must say so |

**Option 1 is the cheapest thing that closes the only exposure that has not happened yet.**
That is a RECOMMENDATION, not a decision.

## 6. What is NOT established

Whether the anon read on `bench_outcomes` is intended. Contributors submitted those records
under a research protocol; whether that protocol contemplated world-readable raw records is
**NOT ESTABLISHED** from repository evidence and is an owner question.
