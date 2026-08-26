#!/usr/bin/env python3
"""Every commit hash cited in the tracker must resolve to a real commit.

WHY THIS EXISTS. On 2026-08-26 a tracker entry cited dev commit `db2fb0c`.
That hash does not exist in this repository. It was not read from git log, it
was written from memory, and it sat in the permanent record as a reference
nobody could follow. It was caught only because CI reported the real hashes
and they did not match.

A fabricated identifier in a log whose entire purpose is traceability is worse
than a missing one: a missing hash is visibly absent, a wrong one looks fine.

Hashes quoted inside a correction are exempt. A correction that names the bad
hash is doing its job, and failing on it would force the record to hide its own
mistakes.

    python3 scripts/check_tracker_hashes.py [--all]

Exit 0 if every cited hash resolves, 1 otherwise.
"""
import io
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRACKER = os.path.join(ROOT, "research", "MASTER_TRACKER.md")

# A hash is exempt ONLY when the text immediately following it says it is
# wrong. A wide window is not good enough: the first version of this check used
# 400 characters either side and exempted the two CORRECT hashes as well,
# because they sat in the same correction sentence. That would let a genuinely
# fabricated hash pass unnoticed as long as it was written near an apology.
EXEMPT_AFTER = ("does not exist", "not exist in this repository")
WINDOW_AFTER = 80

# Words that mark a nearby hex run as a commit reference rather than a
# UUID, a slug or a date.
COMMIT_WORDS = ("dev ", "main ", "commit", "deploy", "branch", "pushed",
                "head")
CONTEXT_WINDOW = 120


def entry_bounds(text, pos):
    """The tracker entry containing pos. Entries begin with a line '- '."""
    start = text.rfind("\n- ", 0, pos)
    start = 0 if start < 0 else start + 1
    end = text.find("\n- ", pos)
    end = len(text) if end < 0 else end
    return start, end


def exempt(text, pos, hash_len):
    """A hash is exempt in exactly two situations.

    ONE, the text immediately after it says it is wrong. TWO, it sits inside an
    entry that names this script, which is an entry auditing hashes and will
    always quote the bad ones it found. Without the second rule the audit entry
    reports itself forever, and the only way to silence it would be to stop
    writing down which hashes failed, which is the opposite of the point.

    Both rules are narrow on purpose. An earlier version exempted anything
    within 400 characters of a correction and excused the two CORRECT hashes
    alongside the fabricated one.
    """
    seg = text[pos + hash_len:pos + hash_len + WINDOW_AFTER]
    if any(p in seg for p in EXEMPT_AFTER):
        return True
    start, end = entry_bounds(text, pos)
    return "check_tracker_hashes.py" in text[start:end]


def main():
    if not os.path.exists(TRACKER):
        print("tracker not found: %s" % TRACKER)
        return 1
    text = io.open(TRACKER, encoding="utf-8").read()
    scope = text if "--all" in sys.argv else text[-40000:]
    offset = 0 if "--all" in sys.argv else len(text) - len(scope)

    # ONLY HASHES IN COMMIT CONTEXT. A bare hex run is not evidence of a
    # commit: the tracker also cites file UUIDs, opaque page slugs and bare
    # dates like 20260801, and an earlier version of this check reported all
    # of them as unresolvable commits. A false alarm in a drift checker trains
    # the reader to ignore it, which is worse than not checking.
    #
    # A candidate must be 7 to 12 hex characters and sit within CONTEXT_WINDOW
    # characters of a word that means "commit" in this log.
    seen, bad, skipped, ambiguous = set(), [], [], []
    for m in re.finditer(r"`([0-9a-f]{7,40})`", scope):
        h = m.group(1)
        if h in seen:
            continue
        seen.add(h)
        if not (7 <= len(h) <= 12):
            ambiguous.append(h)
            continue
        lo = max(0, offset + m.start() - CONTEXT_WINDOW)
        hi = min(len(text), offset + m.end() + CONTEXT_WINDOW)
        window = text[lo:hi].lower()
        # A digest is not a commit. The tracker cites sha256 prefixes to prove a
        # source file was preserved unmodified, and those will never resolve
        # through git cat-file. An earlier version of this check reported two of
        # them as unresolvable commits, which is a false alarm of exactly the
        # kind that teaches a reader to stop reading the output.
        before = text[max(0, offset + m.start() - 60):offset + m.start()].lower()
        if "sha256" in before or "digest" in before or "checksum" in before:
            ambiguous.append(h)
            continue
        if not any(w in window for w in COMMIT_WORDS):
            ambiguous.append(h)
            continue
        if exempt(text, offset + m.start(), len(m.group(0))):
            skipped.append(h)
            continue
        r = subprocess.run(["git", "cat-file", "-e", h],
                           cwd=ROOT, capture_output=True)
        if r.returncode != 0:
            bad.append(h)

    checked = len(seen) - len(ambiguous) - len(skipped)
    print("%d hex runs seen%s: %d checked as commits, %d ambiguous, %d exempt"
          % (len(seen), "" if "--all" in sys.argv else " in the recent tail",
             checked, len(ambiguous), len(skipped)))
    if skipped:
        print("%d exempt (quoted inside a correction): %s"
              % (len(skipped), ", ".join(sorted(skipped))))
    if bad:
        print("UNRESOLVABLE: %s" % ", ".join(sorted(bad)))
        return 1
    print("all cited hashes resolve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
