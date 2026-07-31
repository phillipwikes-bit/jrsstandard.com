# Off-site placements for the two initiative support links

*Companion to the on-site support placements (homepage, field-guide page, DRR page, footer sitewide, supported.html cross-promote). This file holds the copy you paste into places the website cannot reach: LinkedIn, your email signature, and campaign-post comments. Created 2026-07-31.*

## The two one-click links (canonical)

| Initiative | One-click link |
|---|---|
| The Right to Know Why | `https://jrsstandard.com/api/support?c=rtkw&src=linkedin` |
| The Decisions You Can Defend | `https://jrsstandard.com/api/support?c=defend&src=linkedin` |

`src=` is the placement tag. It changes per surface so `pilot-status.html` and `support-stats` can tell where a supporter came from. Swap the value to match where you paste the link:

- LinkedIn Featured / About / posts: `src=linkedin`
- Email signature: `src=signature`
- Anywhere you want a separate count later: pick a short new tag (letters, digits, hyphen).

Every link resolves the same way: it records one supporter for that initiative, then lands the person on `supported.html`, which thanks them, offers the optional "add my name" form, and now cross-promotes the other initiative.

---

## 1. LinkedIn "Featured" section

Add two Featured items (Featured accepts links with a title and short description). Use the link's own preview, or the plain text below.

**Featured item A**
- Title: The Right to Know Why
- Link: `https://jrsstandard.com/api/support?c=rtkw&src=linkedin`
- Description: When a decision affects someone's rights, safety, or livelihood, they deserve a record that honestly explains how it was reached. One click backs the principle.

**Featured item B**
- Title: The Decisions You Can Defend
- Link: `https://jrsstandard.com/api/support?c=defend&src=linkedin`
- Description: Every consequential decision is eventually questioned. The record should still hold up through the complaint, the audit, and the courtroom. One click backs the standard.

---

## 2. LinkedIn "About" section (append)

Paste this block at the end of your About. It reads as a short statement of purpose, then gives both links.

> Two open initiatives I am building through the Justification Review Standard:
>
> The Right to Know Why: that when a decision changes a person's life, the record can honestly explain how it was reached. Back it here: https://jrsstandard.com/api/support?c=rtkw&src=linkedin
>
> The Decisions You Can Defend: that a record still supports a consequential decision long after the decision was made. Back it here: https://jrsstandard.com/api/support?c=defend&src=linkedin
>
> Both take one click. Adding your name is optional.

---

## 3. Email signature line

Add one line under your name and title. Pick the initiative that fits the audience you email most, or include both.

**Single line, one initiative:**

> Back the right of a person to know why a decision was made: https://jrsstandard.com/api/support?c=rtkw&src=signature

**Single line, the other initiative:**

> Back documentation that still holds up when a decision is questioned: https://jrsstandard.com/api/support?c=defend&src=signature

**Two lines, both:**

> The Right to Know Why: https://jrsstandard.com/api/support?c=rtkw&src=signature
> The Decisions You Can Defend: https://jrsstandard.com/api/support?c=defend&src=signature

Keep it plain text so it survives across mail clients. The link is safe to send: it stores no personal data on click and only counts a supporter.

---

## 4. First comment of each LinkedIn campaign post

LinkedIn currently suppresses reach on posts that carry an outbound link in the body, so the link goes in the first comment instead. Post the body with no link, then immediately add the comment below as the author. Pin the comment if you can.

### For a post about The Right to Know Why

First comment:

> If this resonates, you can back the principle in one click here: https://jrsstandard.com/api/support?c=rtkw&src=linkedin
>
> It records your support and, if you want, lets you add your name. No sign-up, no personal data required to be counted.

### For a post about The Decisions You Can Defend

First comment:

> If this resonates, you can back the standard in one click here: https://jrsstandard.com/api/support?c=defend&src=linkedin
>
> It records your support and, if you want, lets you add your name. No sign-up, no personal data required to be counted.

### If a single post covers both

First comment:

> Two ways to back this work, each one click:
>
> The right of a person to know why a decision was made: https://jrsstandard.com/api/support?c=rtkw&src=linkedin
>
> Documentation that still holds up when the decision is questioned: https://jrsstandard.com/api/support?c=defend&src=linkedin

---

## How to read the results

Every click from these placements flows into the same pipeline as the on-site links:

- Live per-initiative totals and per-country breakdowns: `https://jrsstandard.com/pilot-status.html`
- Named supporters (only those who filled the optional form) are stored privately in `pilot_contacts` and are never listed publicly without consent.
- To see how many came from off-site vs on-site, the `src` tag on each link separates them. `src=linkedin` and `src=signature` isolate these payloads from the homepage, guide, DRR, and footer placements.

One caution before you cite any public number: delete your own test clicks from `interaction_events` first (the `src=verify` rows), so the count reflects real supporters only.
