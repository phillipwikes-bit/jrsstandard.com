# Gate 2: B-018 Decision-Readiness Register

**NON-OPERATIVE. Prepared 2026-10-24 on the owner direction "Start all gates", read as
"Start Gate 2" for preparation only. Not a repository record. Decides nothing.**
B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.

This register checks whether each B-018 item is ready for a decision by its designated
authority. It records no disposition and recommends no option.

## 1. Evidence verified in this session (2026-10-24)

| Item | Result | Method |
|---|---|---|
| Repository HEAD | `428c307af510ff7378615777251fe252dab2dac7`, branch `claude/engine-reliability-phase6-local` | `git rev-parse HEAD` |
| Tracked and staged changes | 0 and 0 | `git status --porcelain`, `git diff --cached` |
| Untracked files | 482 (Phase 6 to 9 packages) | `git ls-files --others --exclude-standard` |
| `.jrs/state/BLOCKERS.json` | Equals commit 428c307 (hash prefix `2b6d9aab`); B-018 `"status": "OPEN"` | `sha256sum`; field read |
| B-018 reconciliation record in repository | Absent | file search |
| Gate 2 package (4 documents) | All match their manifest | `sha256sum -c B018_PACKAGE_MANIFEST_SHA256.txt` |
| B-018 preservation package (5 files) | All match their manifest | `sha256sum -c PRESERVATION_MANIFEST_SHA256.txt` |

## 2. Corrections to the Gate 2 package (the package itself is unchanged)

| OLD FINDING | NEW EVIDENCE | CORRECTED STATUS | EXPLANATION |
|---|---|---|---|
| `B018_DECISION_BRIEF.md` section 1: the reconciliation record and the B-018 additions are applied in the working tree, uncommitted | Option A rollback (2026-10-24); Gate 4A closure record; section 1 above | Neither is in the repository. Both are preserved outside it in `b018-preservation-2026-10-24/` | The brief was accurate when written on 2026-10-23 and predates the rollback |
| Decision brief and counsel brief cite `docs/enterprise-diligence/B-018_RECONCILIATION_RECORD_2026-10-23.md` as a repository path | Same | Read the citation as the preserved copy (SHA-256 `cebf8138...`), not a repository file | Restoring it to the repository requires separate owner authorization |
| Decision brief section 1 cites the BLOCKERS.json additions `scope_correction_2026_10_23` and `required_action_update_2026_10_23` | Same | These keys are not in the current BLOCKERS.json. They exist only in the preserved `BLOCKERS.json.as-applied-2026-10-23` and the patch | Same |

## 3. Readiness by item

"Ready for decision" means the decision card and the evidence it relies on are available
to the deciding authority. It does not mean any option is supported.

| ID | Item | Authority | Decision material | Evidence available | Evidence or step still missing | Ready for decision |
|---|---|---|---|---|---|---|
| B018-OD-01 | Ledger namespace and crosswalk | Owner | Decision card OD-01 | Local ledger E-001 to E-039 (repository); owner-reported source namespace E-001 to E-045 | For options A and C: the source Evidence Ledger, in an authorized workspace, to build the pairings | Yes for the choice of option; options A and C cannot be carried out in this session |
| B018-OD-02 | Controlling human-review protocol | Owner | Decision card OD-02 | Both protocols and the 2026-10-05 handoff (repository; Phase 9 protocol untracked) | None for the choice; the related decisions P9-OD-01 and P8-OD-04 remain open | Yes |
| B018-OD-03 | Source-era versus local-candidate versions | Owner | Decision card OD-03 | VERSION_REGISTRY and LATER_PACKAGE_REGISTRY (untracked packages) | For option A: source-era Engine content from an authorized workspace | Yes for the choice; option A cannot be carried out in this session |
| B018-OD-04 | Commercial-language precedence | Owner, with counsel for licensing language | Decision card OD-04 | `CURRENT_COMMERCIAL_POSTURE.md`, the 2026-10-05 handoff, the claim reconciliation log | Counsel input if option B or any licensing wording is chosen | Yes for options A and C; option B requires counsel |
| B018-CQ-05 | Rights questions | Counsel, with owner | Counsel brief | Local rights records listed in the counsel brief section 3 | Engagement of counsel (owner action); the source documents in an authorized workspace | No. No counsel is engaged, and this session may not contact counsel |

## 4. Cross-item dependencies

- B018-OD-02 interacts with the Gate 3 decisions (protocol approval at G7).
- B018-OD-03 bears on which candidate could be frozen at Gate 3 G2.
- B018-CQ-05 bears on Gate 3 G3 and G4 (data handling and counsel review).
- No item depends on the Gate 1 archive check, but Gate 1 must clear before release or
  external use.

## 5. Closure condition for B-018 (restated, unchanged)

B-018 may be considered for closure only when each of the five items has a recorded
disposition by its designated authority, including counsel where the item concerns legal
rights or legal interpretation. On the evidence in section 3, B018-CQ-05 cannot reach a
disposition until counsel is engaged. Closure is therefore NOT ESTABLISHED as reachable
within this session.

## 6. Stop conditions for Gate 2

Gate 2 stops if any of the following would be required:
- a legal, ownership, licensing or rights conclusion;
- any change to BLOCKERS.json or B-018, or restoring the preserved record to the
  repository, without separate owner authorization (a restore would also break five frozen
  package suites, as Phase 0 found on 2026-10-23);
- copying source-document content into the repository;
- contact with counsel or any external party.

## 7. What the owner may do next (no option is recommended)

1. Record a disposition on any of the cards OD-01 to OD-04 (blank disposition lines are in
   `external-gate-2-2026-10-23/B018_OWNER_DECISION_CARDS.md`), or defer it.
2. Decide whether and when to engage counsel for B018-CQ-05.
3. Separately decide whether the preserved B-018 record should ever return to the
   repository, and on what terms for the frozen package suites.

Until then Gate 2 remains OPEN with its preparation complete.
