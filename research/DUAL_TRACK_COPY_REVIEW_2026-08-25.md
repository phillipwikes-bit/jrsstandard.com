# Dual-Track Strategy Copy: Inserted Verbatim, Four Passages Flagged

**Date:** 2026-08-25
**Instruction:** insert the supplied copy into `index.html` and `enterprise.html` exactly,
without summarising or paraphrasing.
**Status:** **DONE.** All 12 supplied passages verified byte-for-byte present in both files.
**NOT DEPLOYED to `main`.** It sits on `claude/html-pilot-L8rC3` only.

---

## Why this document exists

The copy is written in the **second person, addressed to the owner**: "You license your
underlying review engine", "your weekly time commitment", "you establish the standard". That
is the voice of an internal strategy memo, not of a page a buyer reads.

Rendered on the public site, four passages say things to buyers and to practitioners that
they were never written to say. None of this changes what was inserted. It is the record of
what was flagged before insertion, so the decision to publish is made with the consequences
visible rather than discovered afterwards.

---

## 1. The pricing bands publish your negotiating floor

> **High-Value Contracts:** Secure upfront setup fees ($7,500 to $15,000) paired with
> recurring annual software subscriptions ($15,000 to $40,000+ per year) per partner.

A GRC procurement team that reads this opens **every** negotiation at $7,500 and $15,000,
because you have published the bottom of your own range and they know you will take it. The
top of the range stops being achievable the moment the bottom is public.

There is a second problem. **No engagement has ever closed at any price on this site.** The
paid ladder is $250, $500 and $750 in `api/_offer-config.js:20-44`, all three still
unconfigured, and `interaction_events` holds 13 pay-screen arrivals and zero completed
purchases. Publishing a $40,000 figure above a $750 offer that has never been sold invites
the obvious question, and the honest answer is not one you want to give in a first call.

This is also why `scripts/check_zero_drift.py` failed on insertion: it caught `$15` and `$40`
as price literals in HTML. The guard was right. A narrowly scoped exception now covers this
one marked block and nothing else; a price literal anywhere else on either page still fails
the build, verified by planting `$999` outside the block and watching it fail.

## 2. "10 to 15 hours" tells an enterprise buyer their vendor is part-time

> **Low Volume, High Return:** Securing just one or two active enterprise partners generates
> substantial annual revenue while keeping your weekly time commitment manageable at 10 to 15
> hours.

This sentence exists to reassure **you** that the model is sustainable. To a buyer evaluating
whether to embed your engine in their product, it reads as: the vendor works part-time, has
one or two customers, and is optimising for their own hours.

Enterprise procurement asks about business continuity, support response and key-person risk.
This paragraph answers all three badly, in your own words, before they ask.

## 3. "Trojan Horse" tells the free-track audience they are the target

> **The "Trojan Horse" Authority Model:** By keeping educational resources free and open to
> individual practitioners, you establish the standard as an industry benchmark, naturally
> driving enterprise interest and inbound platform inquiries organically.

**This is the passage I would remove first.**

It sits directly beneath the promise that the guides and training are "Free, ungated, and
staying that way", and it explains to the investigators, HR officers and researchers reading
it that the free material exists as a lure to generate enterprise leads. Whether or not that
is a fair description of the strategy, saying it to the people it describes converts a gift
into a manoeuvre.

Those practitioners are the same population that supplies your reviewers. 245 PDF downloads,
195 kit downloads and 105 guide downloads sit behind that trust.

## 4. "Without triggering complex security compliance audits" is the SOC 2 claim again

> **Clean Technical Integration:** Deliver a secure, stateless API (`api/review.js`) acting as
> a pre-finalization decision gate, allowing partner platforms to embed your review logic
> without ever storing customer text or triggering complex security compliance audits.

The first half is **true and verified**: `api/review.js:177-180` and `logReview()` in both
engine routes store no record text, and the first-200-characters field was removed on
2026-08-14 while the table held zero rows.

The second half is the claim refused on 2026-08-25 in a different form. **No architecture
prevents a security review.** A vendor assessment is run by the buyer's security team on the
buyer's schedule, and holding no data at rest narrows its **scope**, to transport and access
rather than storage, retention and deletion. It does not remove the assessment.

The audience for this sentence is GRC and legal-tech platforms, which is the single audience
certain to know that. `enterprise.html` already carries the accurate version of this claim in
its own callout, so the site would be making both statements at once, on the same page.

`scripts/check_zero_drift.py` did not catch this one, because `check_no_false_assurance_claims`
matches "SOC 2 bypass" and "certified" variants, not this phrasing. That is a gap in my guard,
not an endorsement of the sentence.

---

## What is in the files right now

| File | State |
|---|---|
| `index.html` | Full section inserted, 12/12 passages verbatim |
| `enterprise.html` | Full section inserted, 12/12 passages verbatim |
| Placement | Immediately after the existing `JRS DUAL TRACK v1` band |
| Markup | `<section id="dual-track-strategy">`, one `h2`, two `h3`, two `ul`, seven `li` |
| Styling | `.dts*` classes using existing design tokens only, no hardcoded colours |
| Deployed | **No.** Dev branch only |

**Build state:** `check_zero_drift.py` 34 checks 0 failed, 866 internal link targets with 0
broken, sitemap 50 entries 50 distinct 0 duplicates, both files well formed.

---

## The three ways forward

1. **Publish as supplied.** One word from you and it deploys. The four passages go public as
   written.
2. **Publish with the four passages revised.** Same structure and same two tracks, with the
   bands, the hours, the Trojan Horse framing and the compliance-audit clause rewritten for a
   buyer audience. I can have that in front of you in one pass.
3. **Keep it internal.** The strategy stands on its own as a planning document; the public
   pages already carry the two-track positioning in buyer-facing voice via the
   `JRS DUAL TRACK v1` band deployed at `17540f8`.

Nothing goes to production until you say which.
