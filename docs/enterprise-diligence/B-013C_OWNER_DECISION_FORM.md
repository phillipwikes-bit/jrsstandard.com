# B-013C — Owner Decision Form

**Lowest of the three. Tick one.**

---

## The situation

`interaction_events` holds **2,280 rows** readable by anyone with the publishable key: page and
link paths, country from the edge header, user-agent truncated to 300 characters, download
metadata, training completions, and one survey row carrying answer codes.

**Classification: behavioural telemetry and metadata. Not record content, and not identities.**

## A correction preserved rather than quietly dropped

A pattern scan of mine reported email addresses across ~1,200 download rows, which would have
meant visitor emails were world-readable. **Aggregating instead of assuming gave one distinct
external address, 18 occurrences, one day: a crawler contact string inside a `user_agent`
field.** **No visitor email is stored.** The original alarm is preserved in the record with this
correction attached, because a future reader who finds the alarm needs the correction with it.

## Options

**[ ] 1 — Accept and disclose.** `privacy.html` already states that paths, country and a
truncated user-agent are held. **The disclosure is already accurate.** No change.

**[ ] 2 — Restrict row-level reads; expose an aggregate view.** Keeps the public research and
stats pages working. Moderate engineering.

**[ ] 3 — Shorten retention.** There is **no stated retention** on these tables today, so
"indefinitely" is the current position and nobody chose it. **Worth doing on its own merits
whichever else you pick.**

**[ ] 4 — Aggregate exposure only.** Strongest, highest cost.

**[ ] OTHER:** ______________________________________________

## Engineering recommendation

**1 is substantially already in place. 3 is worth doing regardless**, because an unchosen
indefinite retention is a decision by default.

> **ENGINEERING RECOMMENDATION — NOT OWNER DECISION. NOT IMPLEMENTED.**

**Signed:** ____________________  **Date:** ____________
