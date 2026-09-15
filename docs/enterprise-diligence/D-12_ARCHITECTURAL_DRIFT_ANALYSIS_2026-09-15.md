# D-12 — `verify-drift` Architectural Drift Analysis

**The endpoint was NOT created. The references were NOT deleted.**

---

## Dependency trace

| Location | Reference |
|---|---|
| `CLAUDE.md` §36.1 | Listed as the canonical **"Backend endpoint"** |
| `docs/repository-operations/OPERATIONS_ANNEX.md` | Same, plus `submitSurvey()` described as posting to it |
| `index.html:5601` | `fetch(POST)` carrying `obsPayload`, **including the visitor's free-text note** |
| `pilot.html:790` | `fetch(POST)` carrying `selection`, `source` |
| `training.html:3048` | `fetch(POST)` carrying survey answers `q1`–`q5` |
| `.github/workflows/maintenance.yml:41` | Named in maintenance text |
| `JRS_FINAL_INDEPENDENT_FULL_SITE_AUDIT.md` | Describes the observation widget as posting to it |

**Implementations found: ZERO.** `api/v1/` contains only `review-engine.js`. No file implements
`verify-drift`. `vercel.json` declares no rewrite and no domain mapping for the subdomain.

## DNS and runtime

**FACT: `api.jrsstandard.com` has no A record.** `getent hosts` returns nothing; a POST returns
**HTTP 000**, a connection failure. `www.jrsstandard.com` resolves normally on the same
resolver.

## CORRECTION 2026-09-15 — the "material finding" below was FALSE

**ORIGINAL FINDING (mine, and it reached a commit message and the tracker):** `index.html`
does not write to Supabase before calling the dead endpoint, so the visitor's free-text
observation note "reaches nobody".

**NEW EVIDENCE.** `index.html:5600`, immediately before the `verify-drift` call:

```js
fetch(SBU+'/rest/v1/interaction_events',{ ... body:JSON.stringify({source:'index',
  type:'operational_observation',payload:{selection:...,note:noteVal}})})
```

**The note DOES reach Supabase.** All three pages write to `interaction_events` first.

**CORRECTED STATUS.** There is **no data loss**. The disposition D-12.1 below — "point
`index.html` at Supabase, as the other two already do" — **recommends work that is already
done**, and is therefore withdrawn as a disposition.

**EXPLANATION.** I traced the `.catch()` fallback and the confirmation logic and did not read
the six lines above the `fetch` I was looking at. The claim was then repeated in a commit
message, which is why it is corrected here in full rather than quietly amended.

**WHAT SURVIVES, and it is still worth an owner decision:** the endpoint has no DNS record and
no implementation; three live pages POST to a host that cannot answer; and `index.html` shows
a submission confirmation **outside the promise chain**, so the confirmation is unconditional
even though that particular transmission always fails. **The architectural finding stands. The
data-loss finding does not.**

---

## Actual runtime dependency — ORIGINAL TEXT, PRESERVED AND SUPERSEDED BY THE CORRECTION ABOVE

| Page | Also writes to Supabase first? | Consequence |
|---|---|---|
| `pilot.html` | **Yes**, `interaction_events` before the call | Data survives |
| `training.html` | **Yes**, survey answers before the call | Data survives |
| **`index.html`** | **NO** | **The visitor's free-text observation note reaches nobody** |

On `index.html` the note goes only to the unreachable endpoint. The `.catch()` hands it back as
a file download on the visitor's own machine, **and the page then displays a confirmation
regardless**, because the confirmation is set outside the promise chain.

**So the homepage tells a visitor their observation was submitted, and it was not.** That is the
real cost of the drift, and it is larger than the architectural untidiness.

## Classification

**ATTEMPTED / UNREACHABLE.** The application attempts transmission; the destination cannot
complete it. Recorded in the outbound inventory as such.

## Conclusion

**REMOVE REFERENCE — OWNER AUTHORIZATION REQUIRED**, with a qualification that changes what
"remove" should mean.

The reference is not merely stale documentation. **Three live pages POST to it**, and one of
them loses data doing so. Four dispositions exist and only the owner can choose:

| | Disposition | Effect |
|---|---|---|
| 1 | **Point `index.html` at Supabase, as the other two already do** | Fixes the data loss without deciding the endpoint's fate. **Smallest correct change** |
| 2 | Remove the `verify-drift` calls entirely | Consistent, but discards a declared architecture |
| 3 | Implement the endpoint | **Separate authorization required.** Not done, and not to be done to make documentation true |
| 4 | Retain as future architecture and document it as unbuilt | Honest, leaves the data loss in place |

**Engineering recommendation: disposition 1 first, regardless of the endpoint's fate**, because
the homepage data loss is real today and is independent of the architectural question.

**NOT DONE.** It changes a live page's data destination, which is an owner decision.

**The CLAUDE.md §36.1 entry was not edited**, because deleting a canonical architecture record
to make the repository tidy is exactly what the preservation rule forbids. It is now
contradicted by evidence in this document, which is the correct resolution.
