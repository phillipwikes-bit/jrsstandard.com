# Inventory across all branches, 2026-10-27

Method: `git fetch --all --prune`; per-branch divergence, changed paths and tracker entries read from each branch; open and closed pull requests read from GitHub. Labels: FACT (read from a branch or PR), OWNER ATTESTATION (the owner said so, no record), NOT ESTABLISHED.

## 1. Branches that carry live work

| Branch | PR | Last commit | Holds | State |
|---|---|---|---|---|
| `claude/aie-rejection-2026-10-26` | #43 draft | 2026-10-27 | AIE rejection record, SEC detection package, ISACA notice and status | FACT: checks passing, mergeable |
| `claude/tracker-2026-10-21` | #41 draft | 2026-10-23 | Young and Wikes SEC package, Stacyann approval (2026-10-23), Lina's conditions, HJOLT abstract draft, LinkedIn drafts | FACT: not merged to main |
| `claude/engine-reliability-phase6-local` | #42 draft | 2026-10-25 | Engine Phases 6 to 9, validation-readiness gate, 4,081 changed paths | FACT: not merged |
| `claude/engine-assurance-2026-10-10` | #40 draft, "DO NOT MERGE without owner decision" | 2026-10-13 | Engine assurance package, v0.2 contract, v0.3 evidence graph, Phase 4 | FACT: not merged |
| `claude/engine-local-candidate-2026-10-06` | #39 draft | 2026-10-10 | Engine candidate, October tracker entries (AIE resubmission, commercial evaluation) | FACT: not merged |
| `codex/private-owner-workbench-2026-10-04` | none seen | 2026-10-04 | One change to `programme-status-9872fb93cc94.html` | FACT: 49 commits behind main |
| `claude/tracker-log-2026-09-30` | #37 draft, open | 2026-10-01 | FriendlyFreelanceFiles prompt log | FACT: no merge base with main |

## 2. Older and historical branches

Eleven branches (`engine-eval-v8-2026-10-01` PR #38 closed; `html-pilot-L8rC3` PRs #34 to #36 closed; `enterprise-polish-2026-09-20`; two `backup/main-pre-*` branches; `mobile-site-responsive-xg5tT`; `jrs-standard-training-EAZAP`; `jrs-website-deployment-JrAgJ`; `simulator-attachment-assessment-0OHF0`) share no merge base with current `main` (history was rebuilt). They are historical records. The October 2 manuscript review (including the ISACA text-recycling finding) lives on `engine-eval-v8-2026-10-01`, not on main.

**Cloudflare PRs #3, #4, #6, #7, #8 are still open.** They add Cloudflare Workers configuration. CLAUDE.md says Cloudflare has been severed since 2026-08-18 and a wrangler config was deliberately not added, because a successful Workers deploy could activate a route against a domain that serves from Vercel. REQUIRES HUMAN DECISION: close them, do not merge them. Closing is the owner's call.

## 3. Publication inventory (what each branch says)

| Item | Status | Source |
|---|---|---|
| Detection study (Wikes and Hossain) | AIE REJECTED 2026-10-26 (earlier 51f28685 on identity grounds). Rebuilt for SEC; Ubayet approved 2026-10-26; sent to Lina; she acknowledged 2026-10-26 6:15 pm (scope fit, will assess) | #43 |
| Young and Wikes public-records paper | SSRN preprint live (abstract_id 7591521, OWNER ATTESTATION). SEC version approved by Stacy 2026-10-23, submitted; Lina's conditions were identical author order, send both files, name the platform. RMJ, JOCI, JCAS declined | #41, #43 |
| ISACA article (Pokhriyal and Wikes) | Owner says submitted after 2026-08-27, no reply past the stated 8 weeks. No submission date, acknowledgement or follow-up in any branch. Tanvi's approval of the final text NOT ESTABLISHED. Status notice drafted | #43, `engine-eval-v8` |
| CEP Magazine "When the Record Cannot Speak for Itself" | Accepted 2026-07-16 for the November issue | main tracker |
| CCI Evidentiary Deficit (Colpan and Wikes) | Recorded as published 2026-09-29 | `engine-eval-v8` tracker |
| HJOLT "Disciplining AI" (Harvard) | **Abstract and CV were due 2026-10-26, which has passed.** Abstract drafted 2026-10-21, never sent. Whether the deadline was extended is NOT ESTABLISHED | #41 |
| SAA Government Records Case Studies | Options file says "ALREADY SENT"; inquiry or full manuscript NOT ESTABLISHED. Withdraw before duplicate submission | #41 |
| Joseph Mungai (detection panel) | Asked for a publication update; his naming consent NOT in the repository, owner check required | #41 |

## 4. Gaps and inconsistencies

1. HJOLT deadline passed one day ago with no recorded send. If still wanted, email the organisers to ask whether late abstracts are accepted.
2. The Young and Wikes manuscript says its data will be deposited in Zenodo before publication; the detection manuscript says data on request (owner decision: no Zenodo). Different papers, but the owner may want the Young and Wikes statement kept consistent with what Stacy approved.
3. Text overlap across CEP, ISACA and the Business Ethics draft (2026-10-02 review) is unresolved and matters because CEP prints in November.
4. The branch records are split across seven unmerged PRs. A future review must read all of them; main alone is wrong (this is the recorded 2026-10-21 correction).
