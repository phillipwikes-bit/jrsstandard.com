# index.html surgical change list, five priorities

Proposed only. Nothing has been modified. No change will be made outside this list.

Constraints observed in drafting it:

* The **dual-track block at 977-993** is marked in-file `CANONICAL BLOCK. Byte-identical
  on every page that carries it.` It is **not touched**; editing it would break parity
  across every page carrying it.
* `programme-status-9872fb93cc94.html` is **not touched**.
* No roster, contact, inbox, honor, dossier or buyer-archetype content is moved,
  duplicated or referenced.
* Every change is validated against the 121 checks in `scripts/check_zero_drift.py`,
  including `check_homepage_is_a_landing_page`, `check_revenue_model_is_licensing_only`,
  `check_engine_ladder_is_intact` and `check_pricing_is_published`.

---

## What already exists, and therefore is NOT being rebuilt

| Your item | Status on index.html |
|---|---|
| What JRS is | line **1016**, present |
| What JRS is not | line **1020**, present |
| Who it is for | line **1024**, present |
| Commercial Inquiries heading | line **1030**, present |
| Licensing / Integration / Acquisition options | lines **1039-1042**, present and already limited to those three plus neutral fallbacks |

**Priority 5 needs almost nothing.** The section is already correct and already scoped
to the three pathways. One sentence is proposed below and nothing else.

---

## CHANGE 1, priority 1: add a programme status line

**Location:** insert immediately after line **1027** (the origin sentence), before the
Commercial Inquiries block at 1030.

**Nothing is moved or deleted.** One new short block, using your item 5 wording:

> **Current Programme Status.** JRS is in an active stage of operational development and
> validation. Current findings, practitioner exercises, and technical demonstrations
> should be interpreted according to their stated methods and limitations.

**Why here:** the four-part opening you describe is present except for the status
statement. This completes it without reordering anything.

---

## CHANGE 2, priority 2: label the open-access resources

**Location:** insert after the new status block, before Commercial Inquiries at 1030.

The resources already exist but are split between line **993** (inside the untouchable
canonical block) and the Explore strip at **1003-1006**. Neither is labelled as
open-access, and the strip leads with "Pilot Program", which is not a resource.

**Proposed:** one new section, `Open-Access Practitioner Resources`, with three items
linking to pages that already exist. Field Guides, Reviewer Training, Simulations and
Exercises, each with your one-line description from item 3.

**Not done:** the Explore strip at 1003-1006 is **left in place**. Removing it would be
reorganisation beyond refinement and it carries the by-Role entry that the new block
does not.

---

## CHANGE 3, priority 3: pilot language, two edits only

**3a. Line 2129**, Deployment Kit access flow. Current text contains
`Scope is defined collaboratively`, and step 4 at line **2131** is titled
`Begin implementation`. Together these read as an offer to scope and implement with the
organisation.

Proposed: `Scope is defined collaboratively` becomes `Scope is defined by the
participating organisation`. Step 4 title `Begin implementation` becomes
`Begin internal use`.

**3b. Line 1352**, Pilot Program block. Current text ends
`before broader deployment`. Proposed addition of one sentence at the end of that
paragraph, using your item 9 wording:

> These resources support independent examination of documentation review practices and
> do not, by themselves, create a consulting or commercial engagement.

**Not done:** the Pilot Program block is **not renamed** to Operational Exploration. It
is a real programme with a live intake path and a named scope list at 1354-1359;
renaming it would misdescribe what a reader can actually do. Say the word if you want
the rename and I will do it as a separate change.

---

## CHANGE 4, priority 4: prevalence and effectiveness language, seven lines

Each is site voice making a prevalence claim. Quoted specimen records are **excluded**:
lines 1525, 2930, 2955, 2978 are examples of bad documentation and changing them would
destroy the teaching point, and line 2703 names the words as things a reviewer looks for.

| Line | Current | Proposed |
|---|---|---|
| **1464** | These failure modes appear **routinely** across HR, legal, compliance… | …**can arise** across HR, legal, compliance… |
| **1474** | Chronology gaps appeared **repeatedly** in HR review discussions | Chronology gaps **were raised** in HR review discussions |
| **1482** | …a condition surfacing **repeatedly** across compliance and HR documentation contexts | …a condition **observed** across compliance and HR documentation contexts |
| **1486** | Reviewer disagreement emerged **consistently** in comparator exercises | Reviewer disagreement **emerged in** comparator exercises |
| **1501** | These are not unusual. They appear **routinely** across… The file looks complete at drafting because **the author's context fills the gaps.** | They **can arise** across… The file looks complete at drafting because **the author's contextual knowledge may supply information that is not preserved within the record itself.** |
| **2846** | Conditions **commonly present** at intake review | Conditions **that can be present** at intake review |
| **2895** | Records as they **commonly arrive** for review | Records as they **arrive** for review |

Line 1501 carries both of your item 6 examples verbatim, so both of your replacements are
used as written.

---

## CHANGE 5, priority 5: one sentence

**Location:** line **1031**, the supporting sentence under Commercial Inquiries.

Current: `For organisations and professionals interested in discussing potential
licensing, integration, or acquisition involving JRS. No confidential records or
sensitive information should be included.`

Proposed: keep the second sentence exactly. Replace the first with your item 13 wording,
lightly fitted:

> JRS is maintained as an independently developed intellectual-property and professional
> resource asset. Organisations or professionals with a serious interest in discussing
> potential licensing, technology integration, or acquisition may make an inquiry here.

No pricing, no for-sale language, no new commercial claim. The three pathways at
1039-1042 are unchanged.

---

## Total footprint

Two insertions, both in the 1027-1030 gap. Nine in-place sentence edits at lines 1031,
1352, 1464, 1474, 1482, 1486, 1501, 2129, 2131, 2846, 2895. No deletions, no moves, no
section reordering, no change to the canonical dual-track block, no change to any other
file.
