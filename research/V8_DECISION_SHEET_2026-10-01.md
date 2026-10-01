# JRS Engine v8.0: decision sheet

Prepared 2026-10-01 by Claude Code as advice. Nothing here is an approval until Phillip replies. Per v8.0 section 3, an AI-generated file is never his approval.

**How to answer:** reply with one line, for example `Approve all recommendations`, or `Approve all except O-01: B`.

---

## Part 1. Settled by evidence (no decision needed; reply only if you disagree)

| ID | Question | Resolution | Evidence |
|---|---|---|---|
| E-01 | Which Engine is licensed? | `api/review-engine.js`. `api/review.js` remains the training-page engine and is not licensed. | FACT: `api/review-engine.js` carries the v8 keys (`basis_identification` to `temporal_reconstructability`), gap/review/ready routing, `jrsModel()` and the `REVIEW_API_TOKEN` gate, and is the file the vendor preview page describes. `api/review.js` uses a different set of five conditions and Low to Critical routing, and is called by `training.html`. |
| E-02 | Is the model about to retire? | No. Keep `claude-haiku-4-5-20251001` and freeze evidence on it. | FACT (Anthropic model deprecations page, read 2026-10-01): status **Active**, deprecated **N/A**, tentative retirement "Not sooner than October 15, 2026". The same page commits to at least 60 days' notice and lists no notice for this model, so the earliest possible retirement is 2026-11-30 (INFERENCE from those two statements). Re-check if a deprecation email arrives. |
| E-03 | Would a later model switch break the Engine? | Not on sampling parameters. | FACT: `api/review-engine.js` sends no `temperature`, `top_p` or `top_k`. The deprecations page says those parameters return 400 on Claude 4.7 and later when set to a non-default value. |
| E-04 | Output truncation risk in the smoke run | Check offline first. | FACT: `api/review-engine.js:122` sets `max_tokens: 900`. `api/review.js` records hitting the cap at 1,024 and 2,048 tokens before moving to 4,096. INFERENCE: five conditions with quotations may approach 900. Measure the output length offline before spending live calls. |
| E-05 | Where does the demo come from? | The demo is a recorded replay of the frozen v8 smoke run. Its manifest is frozen with the smoke corpus. A live demo needs its own budget. | Removes the conflict between the ten-call budget and D3. |
| E-06 | What goes in the ChatGPT audit bundle? | A redacted copy of the task prompt, with buyer-page slugs, contributor names and deal terms removed. No Engine system-prompt text. | CLAUDE.md 36.3 (slug rotation on leak); v8.0 section 30. |
| E-07 | Byte mismatch after a deploy | Stale but healthy production: **re-trigger** the deploy and re-verify. Confirmed harmful build: revert that release only and redeploy. | Reconciles the owner's deployment protocol with CLAUDE.md 36.8 ("RE-TRIGGER, never revert" for a silent skip). |
| E-08 | How much to build before selling | First stopping point is MINIMUM_SENDABLE: capability matrix, buyer brief, offer and recorded demo. Track C is prepared only once a named counterparty shows interest. | CLAUDE.md Rule 11; zero buyer conversations recorded (IP_SALE_TRACKER rev 27). |

## Part 2. Your decisions, with my recommendation

| ID | Decision | Recommended | Alternatives | Why |
|---|---|---|---|---|
| O-01 | First workflow domain | **A: non-HR supplier-access exception approvals**, with results labelled fixture-only. | **B:** employment documentation QA, which needs counsel on HR scope first. | A can start now with nothing blocking it. B uses the estate's strongest evidence but is blocked until counsel answers. Recommended path: A for the evaluation offer, with the employment evidence presented in the sale (Track C) story. |
| O-02 | Error weights | **Approve as written in v8.0 section 16** (missed gap 10; other errors 1 to 2). | Different weights now, or a buyer's weights later. | They put false-ready first, which is the right priority. |
| O-03 | Price and support | **Approve USD 1,000 as an unvalidated test price, with 2 hours of support.** | A lower price (USD 500 to 750, matching the two earlier checkout intents), or a fee credited against a later licence only. | The earlier interest was at USD 500 and USD 750 on different offers. USD 1,000 is a test. Measure the response and adjust. |
| O-04 | Spend ceiling for the ten smoke calls | **Approve USD 5.** | None needed. | Ten Haiku calls cost well under that. |
| O-05 | Send or hold | **HOLD until MINIMUM_SENDABLE exists.** Then you name one recipient. | Send the brief now, before the package. | A brief without a working demo invites a request that can't be met yet. |
| O-06 | Baseline in the other workspace | **You push `codex/manifest-x9-release`, including the untracked `tools/run-engine-evaluation.mjs`, to GitHub from that workspace.** | Export a git bundle and upload it here. | FACT: that branch and commit `1b02434` are not on origin. Only that workspace can push them. |
| O-07 | Canonical tracker branch | **Use `claude/tracker-log-2026-09-30` (draft PR #37) until you approve merging it into `main`.** | Merge PR #37 now. | Merging into `main` is a production merge and triggers a deploy, even though `research/` isn't served. |
| O-08 | Has the v8.0 prompt been pasted into ChatGPT or any other service? | **Tell me yes or no.** If yes, I rotate both confidential buyer-page slugs, then deploy and byte-verify. | If no, nothing to do. | CLAUDE.md 36.3 requires rotation if a slug leaks. |

## Part 3. Only you can do these, at the time shown

| ID | Item | When |
|---|---|---|
| H-01 | Blind reference labels on the frozen rubric | After the review packet is prepared |
| H-02 | Approve the hash of the gate definitions | After `GATE-DEFINITIONS.json` exists |
| H-03 | D5: approve the demonstration package | After the replay demo exists |
| H-04 | Re-label the re-test subset | At least 14 full days after H-01 |

## Part 4. Needs outside authority (not on the critical path for Track A or B under O-01 = A)

| ID | Item | Trigger |
|---|---|---|
| X-01 | Counsel on HR applicability | Only if O-01 = B, or a buyer proposes HR records |
| X-02 | Selling entity, insurance, tax forms | When a named buyer's procurement asks for them |
| X-03 | Contributor rights for any conveyance (C1) | Track C only, on a named counterparty |

---

## Owner decisions recorded 2026-10-01

Phillip Wikes, in chat: **"For 2 whatever you recommend."** That was in reply to the unblock list whose item 2 was "Answer the decision sheet in one line", so it is read as approving every Part 2 recommendation.

| ID | Recorded decision |
|---|---|
| O-01 | A: non-HR supplier-access exception approvals, fixture-only for now |
| O-02 | Error weights approved as written in v8.0 section 16 |
| O-03 | USD 1,000 approved as an unvalidated test price, with 2 hours of support |
| O-04 | USD 5 ceiling for the ten smoke calls |
| O-05 | HOLD until MINIMUM_SENDABLE exists, then Phillip names one recipient |
| O-06 | Phillip pushes `codex/manifest-x9-release` from that workspace (action outstanding; only Phillip can do it) |
| O-07 | Trackers stay on the working branch until Phillip approves a merge into `main` |
| O-08 | **NOT ANSWERED.** It is a yes or no question, so no recommendation covers it. Still needed: has the v8.0 prompt been pasted into ChatGPT or any other service? |

Not covered by this approval: Part 3 (H-01 to H-04), which needs specific acts by Phillip at the stated time, including approval of the gate-definitions hash.

L2 (item 3): Phillip has no attorney. The recommendation and an unsigned owner attestation are in `research/engine-buyer-readiness-2026-10-01/evaluation-license-v8/track-b/L2-RIGHTS-WITHOUT-COUNSEL.md`.
