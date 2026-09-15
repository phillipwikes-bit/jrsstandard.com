# D-2 — `cold_reviewer_clarity` Correspondence Memo

**STATUS: INSUFFICIENTLY ESTABLISHED / INTENTIONALLY UNRESOLVED.** Unchanged, and deliberately
so.

---

## The three representations

| Layer | Term | Meaning as stated in its own source |
|---|---|---|
| **Codebook** (`codebook.html` v1.0) | **Evidentiary Sufficiency** | *The aggregate condition: whether the record stands on its own as an evidentiary document for an independent reviewer with no prior knowledge* |
| **Engine** (`api/v1/review-engine.js`) | `cold_reviewer_clarity` | One of five condition keys. `deriveDetermination()` weights it **identically to the other four** |
| **Manifest** | whichever the `condition_vocabulary` field declares | Defaults to `review_engine_keys`; the builder **throws** rather than relabelling |

## The relationship

**Classification: UNRESOLVED.**

Not EXACT: the names differ and no source declares the correspondence.
Not SEMANTIC / INFERRED either, and this is the distinction that matters: *cold-reviewer
clarity* and *evidentiary sufficiency for a reviewer with no prior knowledge* read as near
paraphrases, **which is precisely why the resemblance is a trap**. The Codebook does not merely
define the idea; it assigns it a **structural role — the aggregate**. The engine assigns the key
a different structural role — **a peer**. Two terms can mean the same thing and still not
correspond, if one summarises the others and the other does not.

## Consequence of treating them as equivalent

**If it is the aggregate:** the engine is averaging a summary of the other four in alongside
them, so a record weak on several conditions is penalised twice, and the routing determination
is not the function the Codebook describes.

**If it is a distinct fifth dimension:** the Codebook's aggregate has **no engine
representation at all**, and any claim that the engine implements the five Codebook conditions
is wrong by one.

**Either way a public statement that the engine implements the Codebook's five conditions is
not supported**, which is why `CODEBOOK_API_CORRESPONDENCE_CONTROL.md` forbids it.

## What was not done

The condition was **not renamed**, **not promoted to an aggregate in code**, **not dropped**,
and the Manifest vocabulary was **not changed**. The uncertainty is carried forward in the
artifact itself: every manifest declares which vocabulary its keys belong to.

## Owner input required

> **Is `cold_reviewer_clarity` the Codebook's aggregate condition (Evidentiary Sufficiency), or
> a distinct fifth dimension?**

**This request originates in `METHODOLOGY_TO_API_MAPPING.md` and is repeated, not reopened.**
