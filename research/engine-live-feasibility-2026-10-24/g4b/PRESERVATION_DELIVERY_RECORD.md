# Preservation Delivery Record

External Gate 4B. Date: 2026-10-24. Owner-authorized private preservation.
B-018 remains OPEN. Release status remains NO_GO_NOT_VERIFIED.

## Archive

| Item | Value |
|---|---|
| Filename | JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24.tar.gz |
| SHA-256 | 3a1e2f261feafa5280d28fd99475df19b37a33192da3c2e78d5d4b405289b62e |
| Size | 20160720 bytes |
| Companion file | JRS_CONTROLLED_LOCAL_ARCHIVE_2026-10-24.tar.gz.sha256 |
| Files in archive | 502 (501 listed in ARCHIVE_MANIFEST_SHA256.txt, plus the manifest) |

Contents: the B-018 preservation package (6 files, under OUTSIDE_REPOSITORY_B018/); the
External Gate 2 (5), Gate 3 (6) and Gate 4A (1) records under gate-records/; the 482
local-only Phase 6 to Phase 9 files under local-packages/ (lib 47, research 420, tests 12,
tools 3); RESTORATION_NOTE.md; ARCHIVE_MANIFEST_SHA256.txt.

The archive SHA-256 is recorded here and in the companion file rather than inside the
restoration note, because no file in an archive can contain the archive's own hash.

## Verification

| Check | Result |
|---|---|
| Preconditions (Gate 4A BASELINE RESTORED; no tracked or staged changes; BLOCKERS.json equals 428c307; no B-018 record in the worktree; only the known 482 package files untracked; B-018 OPEN; all source packages present and their own manifests verify) | All held |
| Exclusion screen of the 482 local files (excluded names, credential-like values, assigned secrets) | None found |
| Manifest against original source files | 500 of 500 match |
| Manifest against staged copies | All OK |
| Manifest against extracted archive | All OK |
| Extracted structure | Only the five approved top-level entries; no excluded or unexpected path |
| Local-package set against repository untracked set | Identical |

## Fingerprints

| | Before | After |
|---|---|---|
| Repository tracked files | 20bba1b61f9543c4b2b3bb44437af3c45bf860ae210670a2c9bc0c899ab72056 | same |
| Repository untracked files | e93fed1d3fa1b4e65d85fa3551ad1e97760a7c0f54ce81e7a6bf3e0e6b705b76 | same |
| Scratchpad source packages (per-file hash list) | recorded | byte-identical |

## Confirmations

- No original file was deleted or modified. The original scratchpad packages and the local
  packages remain in place. Only the temporary staging and extraction directories were
  deleted after verification.
- No source document, project_sources directory, version-control metadata, credential,
  token or provider configuration entered the archive.
- No repository change, commit, push, merge, deployment, PR action, provider call, network
  request or external contact occurred. The only external act is private delivery of the
  archive to the owner as a file attachment.
