# JRS / DRR / Decision Spellchecker
## Increment 12: Original-source candidate admission and recovery custody
**Date:** 31 October 2026. **Authority:** Offline development and fabricated tests only. **Disposition:** Development evidence; website production HOLD; Decision Spellchecker original NO_GO_NOT_VERIFIED; H2/H3 NOT_ESTABLISHED; R6 transfer NOT_AUTHORIZED.

### 1. Governing scope and evidence precedence
The owner-controlled Comprehensive Integrated Master Program, Issue 3.2, sections 3.2-09 through 3.2-11, requires separate identity for DS-A (owner-reported original private v0.6.11 and later 0.7.0), DS-B (R6 constructed offline reference laboratory), and DS-C (possible utilities). This Increment 12 is a **separate admission-control utility for a future recovered DS-A candidate**. It neither reproduces the previously reported R9 source-custody toolkit nor modifies the R6 reference archive.

The supplied 186-page source is Issue 3.2 with Increments 04/05; the separately reported 223-page integrated master, primary R9 source toolkit and full Increment 10 findings archive were not made available for direct artifact validation in this work. Numerical R9 and R6 claims from the owner must remain identified as reported evidence, not rerun proof.

### 2. Direct observations in the connected systems
- GitHub PR #62 was inspected open, draft, unmerged at `ff07784c5666c6a89ea50e59b83fef2f484a8c87`.
- GitHub PR #63 was inspected open, draft, unmerged at `b2ad4a687e729c97dfd1d53613d9673d496450f9`. Its source-level continuous integration had passed; draft Vercel deployment `dpl_7gF4FsnWqiFYzedGMVpXLB6mgSbG` reported READY and the same commit, without demonstrating actual owner access or production acceptance.
- Direct read-only requests against that exact PR #63 preview returned HTTP 503 `owner_access_unavailable` for GET `/api/owner-session`, private Program Status HTML, and a restricted contacts API. This is a fail-closed negative-path observation and not a functioning owner dashboard. No secret was requested or decrypted.
- A public support statistics API returned a 200 aggregate schema including optional named public-supporter fields. The original individual public-listing permissions were not audited; do not interpret that response as proof of consent, unique supporters, or adoption.
- GitHub draft PR #64 was created on top of PR #63, containing an offline generic candidate-intake verifier and fabricated adversarial regressions, without production-facing application changes.

### 3. Implementation
`tools/check-original-source-candidate.py` accepts an owner-authorized local file or ZIP in a declared absolute secure root and relative candidate path. It never extracts or executes code, calls remote providers, reads browser or database records, or accesses GitHub/Vercel secrets.

The tool:
1. Walks every directory component using directory-relative, no-follow file descriptors; rejects dot-path traversal, symbolic-link parents and leaf, nonregular input and hard links.
2. Hashes source bytes using SHA-256 with a bounded chunked read. It compares device/inode, link count, size, mode, modification and change timestamps before and after reading, then reopens the path chain to detect directory or file substitutions.
3. For ZIP inputs, verifies each member by streaming to end, including CRC validation, and hashes the accepted member bytes. It rejects unsafe ZIP paths, ambiguous case-equivalent names, links and special members, nested archives, unreasonable expansion/compression ratio and out-of-bound file counts.
4. Provides a reference-hash check only when an independently supplied SHA-256 is present. Matching an expected digest demonstrates a match with that supplied comparator; it is not historical authentication.
5. Returns `CUSTODY_BYTES_STABLE_ONLY` for accepted files, and permanently retains `NOT_AUTHENTICATED`, `NOT_VERIFIED`, `NOT_EVALUATED` and `NOT_DETERMINED` outcome fields for original identity, source lineage, effectiveness and rights.
6. Returns machine-readable refusal codes rather than source text or upstream system diagnostics.

**Important limitations:** POSIX no-follow and pre/post metadata screening reduce known link/path and time-of-check/time-of-use hazards but cannot eliminate every concurrent modification or privileged filesystem attack. Original source identity requires external evidence, recorded source/build provenance and a separately reproducible build. File hashes, ZIP validity, original-looking filenames, and internally consistent testing are not authenticity or chain-of-title evidence.

### 4. Test execution and first-failure retention
Synthetic test suite `tests/test_original_source_candidate_intake.py` contains 30 fabricated cases covering traversal, links, FIFO, ZIP CRC, archive type/expansion limits, duplicate names, expected digests, file replacement, path removal and directory swapping. The source contains no actual Decision Spellchecker code, study record or participant data.

| GitHub Actions run | Result | Description |
|---|---|---|
| 41218470659 | FAILED | 26/27 passed; directory-swap fixture tried to read from old path after rename. This was test setup, not a product-source verification failure. |
| 41218601345 | FAILED | 29/30 passed; absent-file race produced earlier `FILE_MODIFIED_DURING_READ` refusal while fixture expected later `PATH_FILE_CHANGED`; both are safe refusals. |
| 41218656743 | PASSED | 30/30 fabricated source-intake tests. Existing 14 integrated release-evidence tests and other continuity steps also passed. |

First failures are retained as linked CI runs. Do not classify this as 30 human observations or measured Decision Spellchecker accuracy.

### 5. Candidate acquisition protocol (not executed)
A future source candidate must be obtained only from an authorized owner-controlled backup, device, export or repository. Before opening, the operator should record the source's claimed origin/date, custody chain, original storage location and independently sourced expected hash if any. Run the verifier on a separate offline copy outside a public GitHub checkout; save the generated JSON in a restricted evidence location. Never commit the private original, secrets or source manifest with sensitive paths into a public repository.

Suggested offline syntax:

```sh
python3 tools/check-original-source-candidate.py \
  --root /absolute/owner-controlled/non-symlink-directory \
  --candidate source-candidate.zip --kind zip
```

That command does not assert recovery, and nothing in this increment requires its execution on real files. After custody intake, a distinct evidence review must confirm historical authoring context, prior source ID, archived build, dependency licenses, actual original product version, SP-01..SP-18 implementation, reproducible exact build and known-failure replay. If any step lacks adequate evidence, the candidate remains **unrecovered or not authenticated for the relevant claim**, not automatically approved.

### 6. Controlling risks and release gates
- **Critical: original product missing.** No original DS-A source or build was recovered during Increment 12. The tool is not the product.
- **Critical: validation absent.** No independent H2-versus-H3 product comparison was conducted. The reported 156-record fabricated demonstration blocked with 21 findings remains owner-reported, not a completed study.
- **Critical: rights unresolved.** The reported R6 71/71 checksum and 0/32 transfer authorization status are separate. No rights grant or sale occurred.
- **Critical: owner dashboard blocked.** Exact-preview signed owner login, restricted API positive tests, Supabase RLS, historical count reconciliation and owner recovery remain unverified. PR/preview success cannot bypass PST-01..PST-12.
- **High: public named supporter status.** Any public listing depends on original, provable consent for exact publication scope. No consent audit was conducted here.

### 7. Next evidence, in priority order
1. Owner-controlled recovery of exact DS-A source/build and independent prior-hash evidence, if any. Record that candidate identity remains unknown until corroborated.
2. Protected preview authentication configuration by the authorized owner, without sharing values in chat or GitHub, followed by direct valid/invalid/revoked/expired-session tests and RLS checks. Explicitly address previously exposed credentials and logout-cookie replay.
3. Exact UTC-cutoff historical Program Status count reconciliation and proof of all 12 website gates.
4. Separately funded/authorized independent H2/H3 protocol and 156-record study only when source, population rights, reader design and safe-use authorizations permit.
5. File-specific original and derivative rights schedule plus actual grant-specific review before commercial discussions.

**Final status:** Increment 12 offline intake controls developer-tested only. Source authenticity NO_GO_NOT_VERIFIED; website HOLD; independent product evidence NOT_ESTABLISHED; source transfer NOT_AUTHORIZED. No production deployment, data writes, real-record study, external contacts, payment, license or sale was performed.
