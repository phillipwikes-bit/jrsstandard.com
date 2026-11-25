# Decision Spellcheck (DS-N1): ownership and AI-provenance statement, DRAFT

Date: 24 November 2026. Status: **DRAFT for the owner and an attorney.** This is a record of facts and open questions, assembled from the repository so a buyer's lawyer does not have to reconstruct them. It is not a legal opinion, a warranty of title, an assignment or a licence. Nothing in it decides who legally owns anything; that is for the owner and counsel.

Each statement is labelled FACT (checked in the named source), OWNER TO CONFIRM (only the owner can say), or QUESTION FOR COUNSEL.

## 1. What the asset is

| Item | Status | Evidence |
|---|---|---|
| DS-N1 is a deterministic checker for decision records: no AI model calls and no network calls at run time. | FACT | `lib/ds-n1/identity.mjs` (`model_calls: 0`, `network_access: false`); `tests/ds-n1/extract.test.mjs` asserts no network use by the extractor |
| It was started on 3 November 2026 as a new candidate. It is not the earlier Decision Spellchecker (DS-A), the R6 laboratory (LAB-R6 / DS-B) or the JRS Review Engine, and states that no DS-A or LAB-R6 source was available or used. | FACT as recorded | `lib/ds-n1/identity.mjs` `provenance`, `not_identical_to` |
| The package boundary lists exactly which files make up the asset. | FACT | `lib/ds-n1/package/ASSET_BOUNDARY.md`, `build-bundle.mjs` (allowlist with SHA-256 manifest) |

## 2. How it was made

| Item | Status | Evidence |
|---|---|---|
| The code was written by an AI development agent (Claude Code, Anthropic) working at the owner's direction in development sessions. | FACT as recorded; consistent with commit metadata | `identity.mjs` `provenance`; commit trailers |
| 57 commits touch `lib/ds-n1` or `tests/ds-n1` (5 Nov to 25 Nov 2026, counting this one): 46 are recorded with the author "Claude", 11 under the owner's GitHub account. Many carry a `Co-Authored-By` line naming the AI model. | FACT | `git log -- lib/ds-n1 tests/ds-n1` on branch `claude/ds-n1-cognitive-safeguards` |
| A commit's author field shows which account made the commit. It does not show who conceived, directed or reviewed the work, and it is not evidence of ownership. | FACT (about what the record can show) | repository policy, `CLAUDE.md` rule 4 |
| The owner conceived the product, set its scope and priorities, chose which record types it covers, reviewed results, and decided what was kept, changed or dropped. | **OWNER TO CONFIRM** (draft attestation in section 6) | Partly reflected in the owner instructions recorded in `engineering/incomeos/EXECUTION-EVIDENCE-2026-11-18-B.md` and `-D.md` |
| The owner's attestation of 18 September 2026 (ledger entry E-029) covers AI-assisted development of the JRS estate. Whether it extends to DS-N1 has not been recorded. | FACT; extension is **OWNER TO CONFIRM** | `docs/enterprise-diligence/EVIDENCE_LEDGER.md` E-029; master register addition of 19 Nov 2026, row "DS-N1 code" |

## 3. What else is inside

| Item | Status | Evidence |
|---|---|---|
| No third-party runtime packages; Node.js standard library only. Playwright is used only by optional PDF export and by browser tests, and is not shipped. | FACT | `SECURITY_OVERVIEW.md` section 6; `docx.mjs` test asserts no imports |
| Every test record, demo case and evaluation set is fictional and written by the developer (the AI agent at the owner's direction). | FACT | `tests/ds-n1/fixtures/MANIFEST.json` (`classification`), demo and evaluation READMEs |
| Practitioners' study answers are **not** in the package. They were given under a page notice that they would be used only to evaluate Decision Spellcheck, with quoting and credit only where the person ticked the boxes. | FACT | `practitioner-review-f98cc6a497.html` (notice text); `build-bundle.mjs` allowlist excludes all study data |
| The earlier 24-record study's expert judgments are covered by a consent that does not extend to commercial products. | FACT (consent scope) | master register, 19 Nov 2026 addition, row "Use of the 24-record study's expert judgments" |
| No open-source or other licence has been granted for DS-N1. | FACT | `ASSET_BOUNDARY.md`; no licence file in the repository |

## 4. Where it lives, and why that matters

| Item | Status | Evidence |
|---|---|---|
| The code sits on branches of `phillipwikes-bit/jrsstandard.com`, a **public** GitHub repository. It has not been merged into the website's main branch. | FACT | GitHub repository listing (visibility: public); `git log origin/main -- lib/ds-n1` returns nothing |
| Because the repository is public, anyone can read the code today. This may affect what a buyer will pay for and how the asset can be protected (for example, as a trade secret). | INFERENCE | |
| Moving development to a private repository is a recorded owner-level option. | FACT | `ASSET_BOUNDARY.md` "Owner-level steps" |

## 5. Questions for counsel

1. **AI-generated code.** How the AI provider's terms, as they applied to the account and plan used, allocate rights in output; and how copyright law in the relevant countries treats code produced by an AI agent under a person's direction. What evidence of the owner's direction and selection would help.
2. **Public visibility.** Whether the code's presence in a public repository since November 2026 limits trade-secret protection or affects a sale or licence, and whether moving it to a private repository now changes anything.
3. **The JRS relationship.** Whether DS-N1 is separate from JRS for sale purposes, given that JRS's own chain of title has open questions (master register F-4). Whether the product should avoid the JRS name.
4. **Practitioner material.** Whether aggregate study results (counts and percentages, no words or names) may appear in sale material under the page notice given, and whether any quoted feedback needs fresh written consent.
5. **The owner's other relationships.** Whether any employer, client or other agreement of the owner's could claim an interest in work done during this period. **OWNER TO CONFIRM** the facts first.
6. **Form of transfer.** What documents a buyer will expect: assignment, warranties and their limits, and the treatment of the AI-provenance record.

## 6. Draft owner attestation (for the owner to edit, sign and date only if true)

> I, Phillip Wikes, state the following facts about Decision Spellcheck (DS-N1):
> 1. I conceived Decision Spellcheck and directed its development from 3 November 2026, using an AI development agent (Claude Code) that wrote code at my direction.
> 2. I set its purpose and scope, chose the record types it covers, reviewed its outputs and test results, and decided what was kept, changed or removed.
> 3. To my knowledge, no other person wrote its code, and no code was copied into it from the earlier Decision Spellchecker (DS-A), the R6 laboratory, or any third party.
> 4. [Owner to complete: whether any employer, client or other agreement could give anyone else an interest in this work.]
> 5. This statement records facts. It is not a legal conclusion about ownership.
>
> Signed: ______________________  Date: ____________

The facts in this statement are the owner's to give. Nothing above has been confirmed by the owner yet. If any line is not accurate it should be changed or removed, not signed.
