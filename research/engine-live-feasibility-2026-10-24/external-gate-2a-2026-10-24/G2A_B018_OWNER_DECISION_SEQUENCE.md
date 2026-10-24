# G2A B-018 Owner Decision Sequence

**NON-OPERATIVE. Prepared 2026-10-24. Shows dependency order only. Recommends no
decision and no timing.** B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.
Independent evaluation is not authorized.

## 1. Independent track: Gate 1 archive verification

Gate 1 is independent of every Gate 2 step below. No Gate 2 preparation or decision waits
on it, and it waits on none of them. It clears only when the owner's durable copy, or a
hash the owner computed on it, exactly matches
`3a1e2f261feafa5280d28fd99475df19b37a33192da3c2e78d5d4b405289b62e`.

Gate 1 remains mandatory before any of: release; deployment; external controlled use
(including evaluator access, if the owner decides that counts as external use under
gap PRV-03); or any durable-preservation claim. Its current status is OPEN, INPUT NOT
AVAILABLE.

## 2. Dependency-ordered sequence

| Step | Decision | Authority | Can be made now | Needs source access in an authorized workspace | Needs counsel | Affects Option B | Additionally affects Option C | Must precede a repository update |
|---|---|---|---|---|---|---|---|---|
| 1 | Whether to adopt the proposed change-control rules (CC-01 to CC-14), and whether a limited decision may count as a disposition | Owner (counsel for CQ-05's part) | Yes | No | Only for CQ-05's part | No | No | Yes |
| 2 | G1 statement: whether any B-018 item must resolve before evaluation, and which representations stay prohibited | Owner | Yes | No | No | Yes | Yes | No |
| 3 | B018-OD-02, any state (protocol designation) together with P9-OD-01 | Owner | Yes | No | Only if non-synthetic material is in scope | Yes (GOV-02) | Yes (designation must cover the C material) | Only if it is to be recorded in the repository |
| 4 | B018-OD-03, Deferred or Limited decision (description rule), or option B (parallel lineage) | Owner | Yes | No | Only if a statement bears on title | Only if results go beyond process findings | Yes (GOV-04) | Only if it is to be recorded in the repository |
| 5 | B018-OD-03 option A (single lineage including the source-era Engine) | Owner | No | Yes | Only if a statement bears on title | As step 4 | Yes (GOV-04) | Only if it is to be recorded in the repository |
| 6 | B018-OD-04 option A or C (precedence record, no text change) | Owner | Yes | No | No | No | Only through G10 claims control | Only if it is to be recorded in the repository |
| 7 | B018-OD-04 option B, or any licensing wording | Owner with counsel | No | No | Yes | No | Only through G10 claims control | Yes, if any text is to change |
| 8 | B018-OD-01 option B (alias), or Deferred | Owner | Yes | No | No | No | No | Only if it is to be recorded in the repository |
| 9 | B018-OD-01 option A or C (crosswalk; renumbering under C) | Owner | No | Yes | Only if a pairing supports a rights proposition | No | No (results may cite "local E-nnn") | Yes under option C (renumbering) |
| 10 | Engage counsel | Owner | Yes (the decision to engage) | No | n/a | Only through RTS-02, if the owner decides counsel review is needed for B | Yes (RTS-01) | No |
| 11 | B018-CQ-05, limited or full disposition | Counsel with owner | No | Possibly, as counsel requires | Yes | Only through RTS-02 | Yes (RTS-04), unless step 2 proceeds with rights open and stated limits | Yes, before any rights register changes |
| 12 | Separate authorization for any repository update (restore of the preserved record, BLOCKERS.json edit, commit, push or pull request), including a compatibility approach for the frozen Phase 6 to 9 suites | Owner | Yes (the decision itself) | No | No | No | No | Yes; it is the update's own precondition |
| 13 | B-018 status change (closure) | Owner, after all five items are disposed by their authorities | No | Depends on steps 5 and 9 if chosen | Yes (step 11 must be complete) | No | No | Yes |

## 3. Summary by category

**Can be made by the owner now (no source access, no counsel):** step 1 (owner part),
step 2, step 3 (synthetic scope), step 4, step 6, step 8, the decision to engage counsel
(step 10), and the decision whether to authorize any repository update (step 12).

**Require source access in an authorized workspace:** step 5 (OD-03 option A) and step 9
(OD-01 option A or C). Possibly step 11, as counsel requires.

**Require counsel:** step 7 (OD-04 option B or licensing wording), step 11 (CQ-05), and
therefore step 13 (closure). Counsel is also conditionally needed in steps 3, 4, 5 and 9
where shown.

**Affect Gate 3 Option B:** step 2 (G1 statement), step 3 (OD-02 with P9-OD-01), step 4
only if results go beyond process findings, and step 10 or 11 only through the disclosure
question RTS-02.

**Additionally affect Gate 3 Option C:** step 3 (designation must cover the approved
material), steps 4 or 5 (OD-03, GOV-04), steps 10 and 11 (counsel, RTS-01 and RTS-04),
and steps 6 or 7 through G10 claims control.

**Must precede any later repository update:** step 1 (rules adopted), the decision record
for the item concerned, step 12 (separate repository authorization with a compatibility
approach for the frozen suites), and, for any rights register change, step 11.

## 4. What this sequence does not do

It does not set timing, select a state for any item, engage counsel, request source
access, authorize evaluation or a repository change, or close B-018.
