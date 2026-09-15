# B-013C — `interaction_events` Telemetry

**STATUS: OPEN / OWNER ACTION REQUIRED.** Lowest of the three.

**Classification: BEHAVIOURAL TELEMETRY / METADATA.** Not identity data, and not reclassified
without evidence.

---

## Current state

| | |
|---|---|
| Policy | anon `SELECT`, `qual = true`; INSERT constrained on `type` length |
| **Rows** | **2,280** |
| Contents | `source`, `type`, page and link paths, `country` from `x-vercel-ip-country`, `user_agent` truncated to 300 chars, download `file`/`edition`, training module completions, one observational survey |

## The false positive, preserved as history

A pattern scan reported email addresses across `pdf-dl`, `kit-dl` and `guide-dl` — which would
have meant **visitor email addresses were world-readable across ~1,200 rows**.

**Aggregating instead of assuming gave one distinct external address, 18 occurrences, all on
2026-08-14, local part beginning `+c`, domain `anthropic.com`: a crawler contact address inside
a `user_agent` string.**

**FACT: no visitor email address is stored in `interaction_events`.**

**This record is preserved deliberately.** The alarm was mine, the correction is mine, and a
future reader who finds the original alarm in the history needs the correction attached to it.

## Actual exposure

Page paths, countries, truncated user-agents and download history, readable by anyone with the
publishable key. **Behaviour, not identity.** It is still a disclosure: a sufficiently
distinctive sequence of paths and a rare user-agent is not nothing.

**No record content.** The one survey row carries answer codes `q1`–`q5`, not free text.

## Options

| | Option | Effect |
|---|---|---|
| A | Accept and disclose | `privacy.html` already names Supabase and states that paths, country and truncated user-agent are held. **The disclosure is already accurate** |
| B | Restrict row-level reads, expose an aggregate view | Keeps the public research and stats pages working |
| C | Shorten retention | Reduces the window; the tables have no stated retention today |
| D | Aggregate exposure only | Strongest, highest engineering cost |

**Engineering recommendation: A is already substantially in place; C is worth doing on its own
merits, because "kept indefinitely" is the current de facto position and nobody chose it.**

**RECOMMENDATION ≠ DECISION.** No grant altered, no row touched, no retention changed.
