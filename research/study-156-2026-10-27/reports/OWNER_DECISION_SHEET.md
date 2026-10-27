# Owner Decision Sheet (156-record study)

**For Phillip Wikes. 2026-10-27.** Nothing below has been decided. No approval is recorded anywhere in this package. B-018 OPEN. NO_GO_NOT_VERIFIED in effect.

## Decision 1 (smallest, and urgent): preserve the package

| Fact | Evidence |
|---|---|
| The whole package exists only in this session's cloud container, which is reclaimed after inactivity | Environment notice; `git status`: untracked |
| The repository `phillipwikes-bit/jrsstandard.com` is **public** on GitHub. A commit to any branch publishes the package | GitHub repository metadata (`private: false`) |
| `research/` is excluded from Vercel deployment, so it would not be served from the site | `.vercelignore` |
| The package holds no credential, capture or personal data | The records are synthetic, or public originals. Reviewer initials appear only where they already appear in committed data |
| Publishing would expose the blind key and the AI-proposed labels | Blinding is already procedural only: the designed labels are in `tools/synthetic-spec.mjs` |
| Size: 2,440 files, 110 MB (results 68 MB; largest file 12 MB, under GitHub's per-file limit) | `PACKAGE_MANIFEST_SHA256.txt`; `du` |

| Option | Effect |
|---|---|
| A. Commit and push to the development branch (not `main`) | Preserved; public on GitHub; not deployed. Publication under CLAUDE.md section 23, so it needs your approval |
| B. Keep it private: I send you an archive of the package now | Preserved outside git; you hold the only copy |
| C. Neither | The work is lost when the container is reclaimed |

**Recommendation: A**, following the practice of every earlier research package in `research/`. Choose B if you consider the research rules or the forms sensitive.

## Decision 2: proposed acceptance criteria

- **What:** `protocol/ACCEPTANCE_CRITERIA_PROPOSED.json`, 27 criteria. Results against them: 23 met, 4 not met (AC-14, AC-17, AC-18, AC-22).
- **Options:** approve as written / amend / reject.
- **Effect:** approval would not change any result. It would turn "proposed" into "owner-approved" for the next study.

## Decision 3 (SC-1): research use of the 20 originals in excluded or ambiguous domains

- **What:** 13 originals concern excluded domains (mostly employment) and 7 are ambiguous. The current handoff excludes those domains from Engine use.
- **Options:**
  - keep them excluded (current state);
  - allow offline research runs only;
  - allow offline and live research runs.
- **Recommendation:** keep them excluded until the lexical failures are repaired. They add no information about the Engine that the synthetic records do not, and they raise the scope question the handoff answered.

## Decision 4: the 32 public cases

- **What:** the source texts are not held. Retrieval needs authorization, and a rights and privacy review: court and commission decisions can name individuals.
- **Options:** authorize retrieval and a review / defer.
- **Recommendation:** defer. Their human JRS reads measure a different construct ("Ready" and similar), not the study rule E1.

## Decision 5: your blinded reference review

- **What:** `forms/BLINDED_REFERENCE_FORM.md` (or `.csv`), 124 records in three parts.
- **Recommendation:**
  - complete **Part 1** (44 development records) first;
  - save the completed copy under a new folder `reviews/`, not over the sealed form;
  - leave Part 2 until Decision 6 is settled, because labelling the evaluation records first would contaminate the reviewer-benefit sessions.

## Decision 6: reviewer-benefit sessions

- **What:** `protocol/REVIEWER_BENEFIT_PROTOCOL.md`, offline version: record only, against Engine output, against Engine output with controls; 60 records, balanced.
- **Options:** run it yourself / defer / authorize recruiting (not recommended before repairs).
- **If you run it:** you would be the only participant. Expectation and learning effects cannot be removed, and the result would be a case study.

## Decision 7: a live model run

- **What:** `authorization/STUDY156_LIVE_AUTHORIZATION_DRAFT.json`, unsigned. 1,124 requests, cap $8.00. The offline gate refuses it as written (7 problems listed in the file).
- **Recommendation:** do not sign the full run yet. Two failures make a live run unsafe to interpret:
  - VF-01 and VF-02: irrelevant anchors give false reassurance with an over-claiming candidate;
  - VF-03: an indirect injection is not detected.
- **Smallest live step worth considering after repairs:** the 3-request preflight only. Worst case under $0.02. It checks provider compatibility, not Engine quality.
- **Needed in every case:** the credential is set by you in approved session secrets under the named variable. Never paste it into a conversation.

## Decision 8: adoption

- **What:** 0.3.2-candidate and 0.3.3-research-candidate are both unadopted.
- **Recommendation:** adopt neither. Keep 0.3.1 as the engine of record. 0.3.3 is a research instrument with known failures.

## Decision 9: a repair candidate (0.3.4-research-candidate)

- **What:** the repairs proposed in `reports/FAILURE_REGISTER.md` section 6.
- **Needs from you:** permission to build it, and new evaluation records written by someone other than the rule author. The present evaluation partition is no longer unseen.
- **Recommendation:** authorize the build. Supply or commission at least 60 new records across new families before any further evaluation claim.

## Decision 10: B-018

- **What:** B-018 remains OPEN. This study does not clear it and cannot.
- **Decision:** yours, through its own process.
