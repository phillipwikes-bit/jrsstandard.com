# AI-Assisted Creation Provenance Record

Classifications used here are strictly: **VERIFIED**, **PARTIALLY ESTABLISHED**,
**NOT ESTABLISHED FROM AVAILABLE CORPUS**.

## Search provenance

Commands: `git log --format='%an <%ae>'`, `git log --format=%B | grep -ci`,
`git blame --line-porcelain <file> | grep '^author '`, corpus scan of 1,153 files
including 259 extracted binaries.

## Human vs AI contribution matrix

| Asset | Surviving-line attribution | Human specification evidence | Human review/iteration evidence | Human acceptance evidence | Classification |
|---|---|---|---|---|---|
| `jrsstandard.html` (canonical standard) | **3,839 of 4,314 human (89%)** | Direct human authorship of the majority of lines | Repository history | Committed under human identity | **VERIFIED** that a human authored the majority |
| `index.html` | 2,937 of 5,882 human (50%) | Mixed | Repository history | Mixed | **PARTIALLY ESTABLISHED** |
| `codebook.html` | **0 of 360 human** | **The conceptual content, five conditions and detection criteria, is not traceable to a human-authored source file in this corpus** | Extensive commit-message review discussion | Committed and retained | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |
| `api/v1/review-engine.js` | **0 of 259 human** | Specification appears in commit messages and source comments | Iterative commits | Deployed to production | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |
| `api/review.js` | **0 of 280 human** | as above | as above | Deployed | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |
| `api/review-engine.js` | **0 of 266 human** | as above | as above | Deployed | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |
| `openapi.json` | **0 of 220 human** | as above | as above | Published | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |
| `training.html` | **0 of 3,579 human** | as above | as above | Published | **NOT ESTABLISHED FROM AVAILABLE CORPUS** |

## Aggregate

| Measure | Value | Classification |
|---|---|---|
| Commits under the `Claude` identity | **1,737 of 2,031 (85.5%)** | **VERIFIED** |
| Commits with explicit `Co-Authored-By: Claude` | **1,100** | **VERIFIED** |
| Distinct human commit identities | 1 person, 2 git identities | **VERIFIED** |
| Repository span | 2026-04-14 to 2026-09-08 | **VERIFIED** |

## Human specification, review and acceptance markers

**PARTIALLY ESTABLISHED, and this is the honest ceiling.** The corpus contains
extensive evidence of human direction in the form of commit messages recording
instructions, corrections and refusals, and `research/MASTER_TRACKER.md` records
decisions in the owner's voice across the whole period. **What the corpus does not
contain is a record tying a specific human instruction to a specific generated
artifact for the assets above.**

**What is established:** AI assistance was used at scale and was disclosed in the
repository's own record rather than concealed. The disclosure is systematic across
1,100 commits.

**What is not established:** who conceived, specified, reviewed and accepted the
content of each asset. Commit metadata records the identity that authored a commit.
**NOT ESTABLISHED FROM AVAILABLE CORPUS.**

This is answerable only by the owner, and it is question B1 of the questionnaire.


---

# AMENDMENT, 2026-09-09: corrected classification

**Prior wording preserved above.** The matrix classified human review, selection and
acceptance as "NOT ESTABLISHED FROM AVAILABLE CORPUS". **That phrasing risked reading as
an assertion that human involvement was absent. It is not, and the corrected
classification is EVIDENTIARY LIMITATION AT ARTIFACT LEVEL.**

**Human conception is now VERIFIED** on evidence that did not exist in this file when it
was written: three published articles attributed to Phillip Wikes, the earliest
**2026-06-02**, naming JRS and describing its four assessment dimensions, externally
timestamped and not dependent on any record he controls.

**What remains a limitation is narrow:** the corpus does not tie a specific human review
event to each individual generated artifact. **That is a property of how the record was
kept, not a finding about whether review occurred.**
