# JRS Public GitHub Visibility: Tracked-Path Baseline and Containment Decision

**Observation date:** 2026-10-30, America/New_York.  
**Baseline SHA:** `02a96f58ed56dac124394a0d005a5d3d564c71bd`, unmerged redesign base.  
**Source:** GitHub repository metadata and full recursive Git tree, obtained read-only. Tree response `truncated:false`.  
**Programme:** Decision Spellchecker integrated plan, BASE-01 / BASE-02 and public-repository P0 disclosure risk.  
**Disposition:** **PATH INVENTORY COMPLETE; CONTENT/RIGHTS/PII ASSESSMENT NOT COMPLETE. NO_PUBLIC_DISCLOSURE_CLEARANCE.**

## Visibility finding

The repository `phillipwikes-bit/jrsstandard.com` has `private:false` at the observed revision. Excluding paths from Vercel deployment does **not** remove those files from public GitHub access. A later private setting or path deletion does not necessarily undo prior disclosure or access through forks, history and external copies.

The recursive tree contained **1,451 tracked files**, totaling **47,633,698 bytes** of Git blob sizes. These numbers are about the repository source tree, not 1,451 separately reviewed sensitive documents or current deployed website assets.

| First-match path class | Tracked files | Git blob bytes | Recognizable documents/data/binary formats |
|---|---:|---:|---:|
| `research/` | 763 | 34,882,853 | 289 |
| `.jrs/` state directory | 39 | 219,830 | 0 |
| `docs/enterprise-diligence/` | 139 | 959,742 | 0 |
| `api/` | 74 | 514,680 | 0 |
| Other `docs/` | 39 | 274,356 | 0 |
| `tests/`, `fixtures/`, `test/`, `examples/`, `cases/` | 30 | 121,554 | 0 |
| Other project paths | 367 | 10,660,683 | 33 |
| **Total** | **1,451** | **47,633,698** | **322** |

The format count classifies extensions `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.csv`, `.jsonl`, `.png`, `.jpg`, `.jpeg` and `.zip`. Format is **not** a finding of personal data. A filename-based screen saw **81** candidate paths with words associated with consent, transcripts, participants, contacts, credentials, coauthors and similar concepts. This flags them for authorized review only; it does not establish the contents, rights or sensitivity of any particular item. The number 81 is a preliminary filename-matching screen and may contain false positives and omissions.

## Required P0 handling

1. **Preserve evidence.** Do not delete tracked files, rewrite Git history, rotate credentials or change repository access on the basis of this inventory alone. If an actual active credential is identified, use the established incident-response process rather than committing its value to an issue or chat.
2. **Classify the highest-risk material first.** An authorized reviewer should separately assess the research directory's contributor communications/consent, raw panels/answers, original correspondence, legacy test fixtures, source code/configuration and any exposed private API operational records. Keep raw personally identifiable information out of public PR comments, GitHub Actions logs and this document.
3. **Record a confidential evidence map.** For each candidate: exact repository object/hash, content type, source/consent, personal/restricted fields present, whether publicly disclosable, whether public GitHub was intended, rights/transfer status, effect of prior publication and approved containment action. The confidential results belong in owner-controlled storage, not this public repository.
4. **Review exposure separately from deployment.** Vercel route privacy checks cannot evaluate GitHub clone/history exposure. A Vercel `.vercelignore` file is not GitHub authorization.
5. **Choose a safe containment route with owner approval.** Potential responses include an appropriately private repository and careful separation of publicly distributable JRS site assets from controlled research/product assets. Each option requires dependencies, references, Git history, deployment link, restoration and collaboration impact assessed first. Claim no retrospective secrecy merely from changing visibility.
6. **Inspect with least privilege.** A path class does not justify a bulk export of research participants or reproduction of named communications in a buyer package. For a possible acquisition, expose a controlled *index* and rights qualifications first, then only specifically authorized evidence.
7. **Re-run at the release SHA.** Update counts and classification outcomes after every source migration; include the main branch and public clones as relevant. The P0 gate remains open until owner-approved content-level checks and an explicit containment decision.

## What this does not demonstrate

- No content-wide secret scan, PII adjudication, third-party copyright review, consent audit, data-transfer eligibility or prior-exposure determination was performed by the tree query.
- This is not evidence that all 81 filename candidates are sensitive, or that all other 1,370 files are safe.
- No project configuration, repository visibility, branches, user access, storage rows or live production data were changed by the baseline.
- Neither the rights position nor the product's `NO_GO_NOT_VERIFIED` status is altered.

**Decision:** `BASE-01` repository metadata subtask = OBSERVED / captured. `BASE-02` classified public-path inventory = STARTED, **NOT COMPLETE**. Production and unrestricted transaction disclosure remain blocked pending an independently approved assessment.
