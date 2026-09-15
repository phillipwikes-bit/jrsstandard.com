# B-013 — Owner Decision Package

**Three separate issues. B-013 does not close because one is fixed.**

**No production grant was altered. No row content was fetched beyond the aggregates shown.
Nothing here has been executed.**

---

## B-013A — `engine_reviews`

| | |
|---|---|
| **Current state** | RLS enabled. Anon `SELECT` policy with `qual = true`. **0 rows today** |
| **Fields** | `determination`, five `conditions` each with a `note` the prompt requires to be *grounded in the record text*, `finding.compliant_version` (**a model rewrite of the customer's passage, up to 600 characters**), `runs`, `overall_consistency`, `engine_version` |
| **Exposure** | Anyone with the publishable key, which ships in 22 pages of HTML. `engine-activity.html` reads it from the browser. The page is unlinked and `noindex`, **but the key is not secret, so the page is not the control** |
| **Intended purpose** | A public activity log showing the engine is in use |
| **Security consequence** | **Latent, not realised.** Zero rows means nothing is exposed today. **A call to a token-gated review-engine route changes that.** Corrected 2026-09-15: the free public route writes nothing, so public traffic cannot populate the table. See `B-013A_ENGINE_REVIEWS_DECISION_ANALYSIS.md` |
| **Privacy consequence** | Record-derived text becomes world-readable. Four pages publish a data-isolation statement scoped to the human-delivered work |

**Options**

| | Option | Effect | Cost |
|---|---|---|---|
| A | Revoke anon `SELECT` | Closes it before any row exists | `engine-activity.html` breaks until it reads through a server route |
| B | Server-mediated read | Same, plus one place to control what is shown | One new Edge Function |
| C | Stop persisting `compliant_version` and the notes | Removes the content at source | Loses the telemetry the reproducibility reporting uses |
| D | Disclose the exposure as intended | No engineering change | The public pages must say a rewrite of your passage will be publicly readable |

**RECOMMENDATION (engineering, not a decision): A or B, and do it while the table is empty.**
It is the only one of the three that can still be fixed before any real data exists.

**Production change required: YES.** **Owner decision required: YES.** **Verification: a
post-change probe returning 401 rather than 200.**

---

## B-013B — `bench_outcomes`

| | |
|---|---|
| **Current state** | Anon `SELECT`, `qual = true`. **54 rows**, 2 contributors, 2026-06-22 to 2026-08-08 |
| **Fields** | `record` free text, **average 570 characters, maximum 2,358**, plus `note`, `outcome`, `source`, `contributor` |
| **Sensitivity probe** | **0 email-pattern hits and 0 SSN-pattern hits across all 54 rows** |
| **Intended purpose** | Study corpus for the public-records validation study. The public research pages read these tables by design |

**This is the one that is easiest to get wrong in either direction.**

**Do not label it a breach.** It is research data in a study whose outputs are published, no
direct identifiers were detected, and contributors submitted under a protocol.

**Do not assume it is fine because it is research.** The rows are **contributor-supplied record
text**, and whether the protocol contemplated world-readable raw records is **NOT ESTABLISHED
from repository evidence**. That is a question about what the contributors were told, and the
answer is not in the code.

**Options:** confirm the exposure is intended and disclose it · restrict reads to an aggregate
view · minimise the stored `record` field going forward.

**Production change required: only if you choose to restrict.** **Owner decision required: YES
— and it turns on what contributors were told, which you know and the repository does not.**

---

## B-013C — `interaction_events`

| | |
|---|---|
| **Current state** | Anon `SELECT`, `qual = true`. **2,280 rows** |
| **Fields** | `source`, `type`, page and link paths, `country` from the edge header, `user_agent` truncated to 300 characters, download `file`/`edition`, training module completions |
| **Classification** | **Behavioural telemetry and metadata. Not record content, and not identities** |

**A false alarm of mine is recorded here rather than left in the history unqualified.** A
pattern scan suggested visitor email addresses were readable across ~1,200 download rows.
Aggregation showed **one** distinct external address, 18 occurrences, one day, local part `+c`,
domain `anthropic.com`: **a crawler contact address inside a `user_agent` string**. **No
visitor email is stored.**

**Residual consideration:** page paths, country and user-agent together describe behaviour. It
is a disclosure, of a lower class than the other two.

**Options:** accept and disclose · restrict row-level reads and expose an aggregate view ·
shorten retention.

**Production change required: only if you choose to restrict.** **Owner decision required: YES.**

---

## What is NOT in scope here, and stays protected

**`pilot_contacts` holds 59 rows of names, email addresses, organisations and free-text
messages and is NOT anonymously readable** — INSERT policies only, no SELECT policy.
`bench_experts` and `guide_downloads` have zero policies and are closed entirely. **The largest
personal-data store has the correct posture**, and that deserves stating as plainly as the
three open items.

## Decision summary

| | Decision needed | Urgency |
|---|---|---|
| **B-013A** | Revoke, mediate, stop persisting, or disclose | **Highest. Free to fix while the table is empty.** Closes on a token-holder call, not on public traffic |
| **B-013B** | Confirm intent against what contributors were told | Medium. Data already exists |
| **B-013C** | Accept, restrict, or shorten retention | Lower |

**B-013 closes only when all three are dispositioned.**
