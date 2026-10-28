# G2A B-018 Change-Control Rules (Proposed)

**PROPOSAL. NON-OPERATIVE. Prepared 2026-10-24. These rules take effect only if the owner
adopts them in a dated record.** They govern any future, separately authorized update to
B-018 or its related records. They authorize no update. B-018 remains OPEN. Release
status remains NO_GO_NOT_VERIFIED.

## 1. Rules

| ID | Rule | Requirement |
|---|---|---|
| CC-01 | Designated authority | Each update names the authority for the item it touches: owner for B018-OD-01 to OD-04 (with counsel for licensing wording under OD-04), counsel with owner for B018-CQ-05. An update made by any other person or process is void. |
| CC-02 | Dated decision record | Each update is preceded by a dated decision record, signed by the designated authority, giving the item identifier, the state (Deferred, Limited decision, Full disposition, Insufficient evidence) and the card option where one applies. |
| CC-03 | Evidence basis | The decision record lists every record relied on, each with its path or location and SHA-256. Owner-reported findings are marked as such. Source content held outside the repository is cited by SHA-256 and is never copied in. |
| CC-04 | Scope and limitations | The decision record states what it authorizes, what it does not, and whether it is intended as the item's disposition for the closure rule. A limited decision that does not say so does not count toward closure. |
| CC-05 | Preservation of prior wording and history | No existing `description` or `required_action` text is rewritten. Changes are added as dated keys using OLD FINDING, NEW EVIDENCE, CORRECTED STATUS and EXPLANATION. Status changes are added to `prior_status_history`. Superseded records are marked, not deleted. |
| CC-06 | Affected gates and manifests | Before any change, the change record lists every gate (Gates 1 to 5 and evaluation gates G1 to G10) and every package manifest the change could affect. On present evidence this includes the frozen Phase 6 to 9 package suites, which pin commit 428c307 and fail on any tracked change, and the Phase 9 owner decision register, which is manifest-bound and carries a known stale B-018 description. |
| CC-07 | Pre-change checks | Immediately before the change: record HEAD, branch, tracked and untracked fingerprints; run the whole-worktree composition check; run each affected package suite; run the drift guard offline and record its counts. A pre-existing failure is recorded, not repaired, under this rule. |
| CC-08 | Post-change checks | Immediately after the change: repeat every CC-07 check. Any new failure, any composition verdict other than declared conditions only, or any new drift-guard failure stops the change and triggers CC-10. A compatibility approach for the frozen suites needs its own owner authorization before the change, not after. |
| CC-09 | Claim-control review | Before the change is retained, every added or changed sentence is checked against the publication and commercial claim policies and against the prohibited inferences in the B-018 evidence and boundary matrix. Any sentence that states or implies ownership, licensing, validation, release, deployment or commercial availability is removed or the change stops. |
| CC-10 | Rollback method | Each change record names its rollback before the change is made: restore each changed file to its recorded pre-change SHA-256, preserve the changed versions outside the repository with a manifest, then rerun the CC-07 checks and confirm the fingerprints match the pre-change record. The 2026-10-24 Option A rollback is the precedent. |
| CC-11 | No conclusion by implication | A B-018 decision is never used as a release, deployment, licensing, ownership or validation conclusion unless that conclusion is separately supported by evidence and separately authorized by its own authority. Disposition of one item never implies disposition of another. |
| CC-12 | Separate authorization for repository effects | Recording a decision outside the repository does not authorize a repository change. Restoring the preserved B-018 record, editing `.jrs/state/BLOCKERS.json`, committing, pushing or opening a pull request each require their own explicit owner authorization. |
| CC-13 | Closure | B-018 status changes only when every item has a recorded disposition by its designated authority (CC-04), and only through a dated status change under CC-05. Closure does not change release status. |
| CC-14 | Gate 1 interaction | Gate 1 archive verification is independent of B-018 updates. It remains mandatory before release, deployment, external controlled use or any durable-preservation claim, whatever state B-018 is in. |

## 2. Minimum contents of a change record

1. Change identifier and date.
2. Item or items affected, with state and decision record reference (CC-02).
3. Evidence basis with SHA-256 values (CC-03).
4. Scope, limitations and closure intent (CC-04).
5. Exact text to be added, with dated key names (CC-05).
6. Affected gates and manifests (CC-06).
7. Pre-change check results (CC-07).
8. Post-change check results (CC-08).
9. Claim-control review result (CC-09).
10. Rollback method and pre-change hashes (CC-10).
11. Repository authorization reference, if any (CC-12).
12. Statement: this change is not a release, deployment, licensing, ownership, commercial
    or validation decision (CC-11).

## 3. What these rules do not do

They do not adopt themselves, authorize a change, choose a compatibility approach for the
frozen suites, decide whether a limited decision counts as a disposition, or substitute
for counsel on B018-CQ-05 or licensing wording.
