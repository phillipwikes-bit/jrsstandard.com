# JRS / DRR / Decision Spellchecker: Comprehensive Integrated Master Program
## Increment 13. ZIP source-inventory consistency and concealed-container refusal
**Evidence cutoff:** 31 October 2026. **Scope:** Offline developer controls and fabricated regressions only. **Governing source:** Issue 3.2 §§ 3.2-09, 3.2-10, 3.2-11, and the available-source compendium through Increment 12. **Repository:** draft PR #65 stacked on draft PR #64. **Controlling decision:** original DS-A `NO_GO_NOT_VERIFIED`; website production `HOLD`; independent H2-vs-H3 `NOT_ESTABLISHED`; software transfer `NOT_AUTHORIZED`.

### 1. Purpose and controlling interpretation
The original private Decision Spellchecker (DS-A, owner-reported v0.6.11 and later 0.7.0 workflow) has not been recovered or independently authenticated from available source. The R6 class-G fictional laboratory (DS-B), the reported R9 custody work, and the public Review Engine remain distinct systems and evidence families. This Increment 13 modifies only the offline candidate intake from Increment 12. It does not establish any SP-01 through SP-18 original-product implementation, release, ownership, author identity or performance.

The master program requires SP-11 to distinguish duplicate filenames, parser failures and hashes. Source ZIP admission should also reject structurally impossible directory trees and apparent nested archives hidden by filename tricks. Acceptance remains only `CUSTODY_BYTES_STABLE_ONLY`, not original-source authentication or reconstructed build validity.

### 2. Direct current observations
- GitHub PRs #62, #63 and #64 were directly checked open, unmerged, draft at heads `ff07784c5666c6a89ea50e59b83fef2f484a8c87`, `b2ad4a687e729c97dfd1d53613d9673d496450f9` and `92971bed84254a57600d4d05de3900250f592640`.
- Increment 12 prior CI accepted 30/30 fabricated regression tests at run `41218777781` after report commit. Its prior failures remain preserved.
- Source inspection found that the Increment 12 ZIP inventory checked full-entry case collisions but did not account for implicit parent directories. A source ZIP with file `src` and file `src/a.py` was not explicitly refused by that structural check. This was established by code review, not by an independently recorded prepatch exploit run.
- The same prepatch check refused nested archive filenames by extension; a disguised embedded archive payload could bypass this extension-only test. This is an input-admission gap, not evidence of a product security compromise.
- Current Increment 13 draft PR #65 initially received automatic Vercel previews on partial source commits; a `READY` state for an earlier commit is not final-head acceptance, nor a production release.
- Previous exact Increment 11 preview read-only requests returned HTTP 503 `owner_access_unavailable` on the private owner routes. No subsequent valid owner session, Supabase RLS, fixed-cutoff historical count reconciliation or restoration evidence was established in Increment 13. The current response should not be described as a new live owner-login test.

### 3. Implemented technical correction
The offline Python source-candidate verifier `tools/check-original-source-candidate.py` now:
1. Registers explicit and implicit ZIP directory components using Unicode NFC normalization and casefold comparison. A path may not represent both a regular file and a directory. Parent directories with different case or Unicode spelling are refused, even when full member filenames differ.
2. Refuses selected nonportable path components, including control characters, trailing space or dot and common Windows device-reserved names. These are conservative source-reconstruction restrictions, not a claim that every filesystem accepts the remaining names.
3. Screens the first decompressed block of each ZIP member for selected ZIP, gzip, tar, 7z, RAR, xz, bzip2 and zstd signatures. A detected embedded container is refused even when its extension is `.dat` or `.txt`. Filename-extension nested archive refusal remains in force.
4. Preserves Increment 12 controls for anchored no-follow opening, single-link regular input, bounded SHA-256 read, pre/post metadata and path-identity comparison, ZIP CRC/integrity checks, expansion/member limits, no extraction or execution.
5. Preserves explicit result limits: a valid file remains `CUSTODY_BYTES_STABLE_ONLY` and has `NOT_AUTHENTICATED` source identity, `NOT_VERIFIED` original build lineage, `NOT_EVALUATED` effectiveness, and `NOT_DETERMINED` authorship/rights.

### 4. Direct regression evidence and limits
- New fabricated tests: 14, numbered 31 through 44, appended without replacing the earlier 30.
- GitHub Actions run `41221085595`: `SUCCESS`. The source-admission step reported **44 tests, 44 passed, 0 failed**. The integrated release-evidence step continued to show 14/14, and all prior public-interest continuity workflow steps completed successfully.
- Test categories: reversed file/parent order, implicit directory aliases, explicit/implicit collisions, Unicode normalization, benign source tree, disguised ZIP/gzip/tar containers, Windows reserved names, trailing name ambiguity, control characters, benign "PK" text, retained extension refusal.
- No real original software, participant record, case material, owner secret, external API or live H2/H3 human study was used. A passing adversarial suite establishes behavior for the specifically constructed inputs, not sensitivity to every archive ambiguity or every attack.

**Known limitations:** Detection of concealed containers is intentionally heuristic, beginning with known header signatures. It can miss unsupported or internally encoded archives and can conservatively reject benign content sharing a signature. It does not perform extraction, formal content-type assurance, authentic original-source identification, reproducible build, signature verification, software feature testing, or independent performance validation. POSIX metadata checks cannot eliminate every privileged or rapid transient file race. No external source-origin claim follows from matching SHA-256, ZIP integrity or successful CI.

### 5. Other governing workstreams remain separate
- **DS-01 / SP-01..18:** Original private source and build must be recovered through authorized primary custody, independently corroborated, and mapped to all 18 features. None is newly verified by this patch.
- **Research:** The planned 156 original cases (24 historical constructed, 32 public originals, 100 distinct synthetic originals), H2 strong-general-AI + complete JRS method + human baseline, and H3 original-product + human comparison remain unexecuted independently. The owner-reported fictional blocked 156-record demonstration and R9 regression totals are not equivalent.
- **Rights:** Reported R6 archive checksum 71/71 and reported transfer authorization 0 of 32 are different propositions. The current transaction-specific rights determination remains `NOT_AUTHORIZED`. No sale or license is implied.
- **Program Status:** All 12 production acceptance gates require real evidence on an exact artifact; source-level CI, a Vercel `READY` preview or an anonymous 503 does not demonstrate usable owner authentication, RLS, historical count accuracy, individual consent or mobile recovery.

### 6. Evidence and disposition
- Source: GitHub draft [PR #65](https://github.com/phillipwikes-bit/jrsstandard.com/pull/65), head `c76ed70f320027178db95650890942bdbfe87df2` at first CI pass.
- Regression: [GitHub Actions run 41221085595](https://github.com/phillipwikes-bit/jrsstandard.com/actions/runs/41221085595). Final evidence-record commit and final CI should be cited separately after they are created.
- Prior controls: draft PR #64, Increment 12; source-aligned master Issue 3.2, especially SP-11.

**Decision:** The Increment 13 code correction and fabricated regression exercise passed at the stated candidate. It is not authorization to merge, promote to production, run an actual study, contact participants, process private records, assign rights, list a source asset for sale or claim original-product functionality. The governing disposition remains `NO_GO_NOT_VERIFIED` / `HOLD` / `NOT_ESTABLISHED` / `NOT_AUTHORIZED`.

### 7. Next material work
The first substantive gate remains original DS-A source and build lineage from an authorized backup or historic source record, accompanied by independent comparison evidence. The second, independent public-program gate is a securely rotated and correctly scoped owner access secret on a specifically selected exact Vercel preview, followed by positive/negative live owner-session checks, database RLS, privacy and consent audit, fixed-cutoff historical reconciliation, mobile recovery, rollback and owner acceptance. No action on these external gates was taken during this engineering increment.
