# RESEARCH INTEGRITY AND RECOVERY REPORT

**Date:** 2026-09-14 · **Authority:** JRS Research Recovery and Integrity Directive
**Scope:** research estate integrity, recoverability and continuity. **Phase advancement stopped.**

---

## INCIDENT

On 2026-09-14 I committed a change that blanked a research dataset.

`research/_inventory_live_snapshot.json` lost **118 lines** and its entire `runs` array in commit **`a48dbb7`**, falling from 4,332 bytes to 660.

**How it happened, in sequence.** Running the guard suite invokes `research/build_participant_inventory.py`, which refreshes the snapshot from Supabase. The live `study_runs` read returned empty while `realcase` returned rows. The builder's overwrite guard was `or`, so a **partial** failure passed it and the file was rewritten with `runs` emptied. I then staged with `git add -A` and committed.

**The compounding error was mine and is worth stating plainly.** Earlier in the same session I checked that file's status, saw it clean, and reported it clean. I then ran a further guard pass, which re-blanked it, and committed without re-checking. The check was real; repeating it before the commit was the step I skipped.

---

## AFFECTED ARTIFACT

| | |
|---|---|
| Path | `research/_inventory_live_snapshot.json` |
| Damaged in | `a48dbb7` (2026-09-14) |
| Restored in | `94af3fb` (2026-09-14) |

## LAST KNOWN GOOD VERSION

**`ac074a3`** (2026-08-21) — 4,332 bytes, `realcase=2`, `runs=1`, sha256 prefix `7480db1e8948`.

Full history of the file, every commit that touched it:

| Commit | Date | realcase | runs | bytes | sha256(16) |
|---|---|---|---|---|---|
| `47a6395` | 2026-08-13 | 2 | 1 | 4,343 | `ca8850a9f7ce` |
| `5058c38` | 2026-08-15 | 2 | 1 | 4,372 | `f430959b27bb` |
| `354e39c` | 2026-08-18 | 2 | 1 | 4,344 | `39bb9d3c8fc3` |
| `5eeaf8e` | 2026-08-19 | 2 | 1 | 4,327 | `c3216548068d` |
| `c86b182` | 2026-08-21 | 2 | 1 | 4,344 | `c531834b7037` |
| **`ac074a3`** | **2026-08-21** | **2** | **1** | **4,332** | **`7480db1e8948`** |
| `a48dbb7` | 2026-09-14 | 2 | **0** | **660** | `a5348a97db12` |
| **`94af3fb`** | **2026-09-14** | **2** | **1** | **4,332** | **`7480db1e8948`** |

## CURRENT VERSION AND RECOVERY

**RESTORED, and the restoration is proven rather than asserted.**

`CURRENT HASH 7480db1e8948` · `LAST KNOWN GOOD HASH 7480db1e8948` · **MATCH: byte-identical.**

Restored via `git checkout 11f48bb -- <path>`; `11f48bb` did not modify the file, so its content is `ac074a3`'s. The damaged version remains in history at `a48dbb7` and was not rewritten.

**The 2026-08-21 cross-vendor study run is PRESENT and COMPLETE:**

- `created_at` 2026-08-21T06:22:29.97549+00:00
- 3 models: `anthropic:claude-opus-4-8`, `openai:gpt-5`, `google:gemini-flash-latest`
- 3 providers, `mode: cross_vendor`
- metrics intact: `overall_agreement`, `per_record`, `per_record_models`, `n_models`, `n_providers`, `study`

**Independent confirmation:** re-running `build_participant_inventory.py` against the restored file produces **no diff** in `research/PARTICIPANT_INVENTORY_BY_RUNG.md`, so the dependent document agrees with the recovered data.

## ROOT CAUSE, FIXED

`research/build_participant_inventory.py` guarded its overwrite with `or`, beneath a comment reading *"A failed read must not silently blank the document."* **The comment asserted a guarantee the code did not provide.**

Replaced with a per-key merge that never lets an empty read overwrite a populated key. **Proven:** the builder was run with live `study_runs` still returning empty and `runs=1` was preserved.

---

## OTHER AFFECTED ARTIFACTS

The directive says not to assume the snapshot was the only one. **Forty commits were scanned for any research file losing more lines than it gained.** Six results, all assessed:

| Artifact | Commit | Verdict |
|---|---|---|
| `_inventory_live_snapshot.json` | `a48dbb7` | **The incident. RESTORED, byte-verified** |
| `field-guide-src/{employment,fairhousing,general,international}.md` | `44eb2af` | Deliberate. **Derived**, not original research: text extracted from the shipped PDFs, which are intact. Fully recoverable from `44eb2af^` (199/203/320/213 lines confirmed) |
| `01_Blinded_Manuscript.pdf.src.html` | `7281b54` | Deliberate. A **generated render wrapper** (file begins with `<style>`). Upstream `.md` intact at 577 lines / 44 headings; `.docx` and `.pdf` both present |
| `03_Cover_Letter.md` | `b53ee5a` | Deliberate content edit, net −6 lines, bringing the letter to one page |

**No original research content was lost other than the snapshot record, and that is restored.**

## ESTATE-WIDE INTEGRITY CHECKS

| Check | Result |
|---|---|
| Tracked research files | **755** |
| Tracked but missing from disk | **0** |
| Zero-byte files | **0** |
| JSON files / parse failures | 11 / **0** |
| JSON with an empty top-level array | **0** |
| Research files with net line loss in 40 commits | 6, all assessed above |
| `research/MASTER_TRACKER.md` | **Append-only** in every commit examined. No historical entry deleted or rewritten |

## DOWNSTREAM IMPACT

**No JRS claim depended on the lost record.** The snapshot caches the single most recent study run (`limit=1`) as an **offline build input** for `PARTICIPANT_INVENTORY_BY_RUNG.md`. The public cross-vendor figures cite *"86.7% cross-vendor agreement on the latest nightly run, range 82.2 to 93.3 percent across 37 runs"* and are served from live endpoints, not from this file.

Consumers of the file: `build_participant_inventory.py`, `PARTICIPANT_INVENTORY_BY_RUNG.md`, `scripts/check_zero_drift.py`. All three are consistent with the restored content.

**No claim is moved to UNVERIFIED by this incident.**

## NEW FINDING, UNRELATED TO THE INCIDENT

**There are two tracked Master Trackers and they have diverged.**

| Path | Size | Last commit |
|---|---|---|
| `research/MASTER_TRACKER.md` | 2,150,762 bytes | `94af3fb`, 2026-09-14 |
| `MASTER_TRACKER.md` (repo root) | 223,714 bytes | `bb0e8c0`, **2026-08-14** |

The root copy is **a month stale**, roughly a tenth the size, and is **not** a prefix of the research copy, so the two have genuinely diverged rather than one being an older snapshot of the other. CLAUDE.md 36.9 names `research/MASTER_TRACKER.md` as the tracker.

**Nothing was deleted.** A stale duplicate of the authoritative record is a drift hazard: a future reader or tool could take the wrong one. Recorded as blocker **B-012** for an owner decision.

---

## INTEGRITY STATUS

| Artifact | Status |
|---|---|
| `_inventory_live_snapshot.json` | **RESTORED** (byte-identical to last known good) |
| 2026-08-21 cross-vendor study run | **INTACT** |
| `research/MASTER_TRACKER.md` | **INTACT** |
| Research estate, 751 other tracked files | **INTACT** |
| `field-guide-src/*.md`, manuscript render wrapper | **RECOVERY AVAILABLE, not required** |

## TESTS PERFORMED

Full `git log --all --follow` on the affected file; sha256 at all eight versions; record and byte counts at each; 40-commit net-loss scan across `research/`; tracked-versus-present reconciliation; zero-byte scan; JSON parse of all 11 files; empty-array scan; dependent-document rebuild producing no diff; builder fix proven against empty live data.

## REMAINING UNCERTAINTY

1. **Why the live `study_runs` read returns empty.** Supabase credentials are unset in this session, so the read may be failing rather than the table being empty. **NOT ESTABLISHED.** It does not affect recovery, because the snapshot no longer depends on the read succeeding.
2. **Whether anything was lost before 2026-08-13**, the earliest commit touching this file. Not examined; no indication of loss.
3. **Which Master Tracker the owner intends to keep.**

## HUMAN REVIEW REQUIRED

1. Confirm the restored snapshot is the intended content.
2. **B-012:** decide the fate of the stale root `MASTER_TRACKER.md`. I will not delete a tracked record without instruction.
3. Gate 1 remains **FAILED** and is not closed by this report.
