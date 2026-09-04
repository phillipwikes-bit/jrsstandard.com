#!/usr/bin/env python3
"""A Master Tracker the owner can actually open.

WHY THIS EXISTS. research/MASTER_TRACKER.md is 1.6 MB with 634 entries and
single lines running to 6,568 characters. It is the correct permanent record
and it is not a readable document: attaching it every turn delivered a file
that clients struggle to render and a person cannot scan.

This extracts the most recent entries, rewraps the long lines, and writes a
markdown file sized to be opened. It NEVER modifies the source.

    python3 scripts/tracker_extract.py [--days 3] [--out PATH]
"""
import io
import os
import re
import sys
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "research", "MASTER_TRACKER.md")


def arg(flag, default):
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def main():
    days = int(arg("--days", "3"))
    out = arg("--out", os.path.join(ROOT, "research", "TRACKER_RECENT.md"))

    text = io.open(SRC, encoding="utf-8").read()
    entries = re.split(r"\n(?=- 20\d\d-\d\d-\d\d)", text)
    dated = [e for e in entries if re.match(r"- (20\d\d-\d\d-\d\d)", e)]
    seen, keep = [], []
    for e in reversed(dated):
        d = re.match(r"- (20\d\d-\d\d-\d\d)", e).group(1)
        if d not in seen:
            if len(seen) >= days:
                break
            seen.append(d)
        keep.append(e)
    keep.reverse()

    lines = []
    lines.append("# JRS Master Tracker, recent activity")
    lines.append("")
    lines.append("**Extract only. The permanent record is "
                 "`research/MASTER_TRACKER.md`,** %s bytes, %d entries, "
                 "committed to the development branch and never deployed to "
                 "`main` by design." % (format(len(text), ","), len(dated)))
    lines.append("")
    lines.append("Covering the %d most recent dates: %s. "
                 "Long lines are rewrapped here for reading; the source is "
                 "not modified."
                 % (len(seen), ", ".join(sorted(seen))))
    lines.append("")
    lines.append("---")
    lines.append("")

    for e in keep:
        body = e.strip()
        body = re.sub(r"^-\s*", "", body)
        m = re.match(r"(20\d\d-\d\d-\d\d)\s*(\([^)]*\))?:?\s*", body)
        head = m.group(1) if m else "undated"
        note = (m.group(2) or "").strip("()") if m else ""
        rest = body[m.end():] if m else body
        lines.append("## %s%s" % (head, " — " + note if note else ""))
        lines.append("")
        for para in rest.split("\n"):
            para = para.strip()
            if not para:
                continue
            lines.append(textwrap.fill(para, width=96,
                                       break_long_words=False,
                                       break_on_hyphens=False))
            lines.append("")
        lines.append("---")
        lines.append("")

    doc = "\n".join(lines)
    io.open(out, "w", encoding="utf-8").write(doc)
    longest = max(len(l) for l in doc.split("\n"))
    print("%s" % out)
    print("  %s bytes, %d entries, %d dates, longest line %d chars"
          % (format(len(doc), ","), len(keep), len(seen), longest))
    print("  source unchanged: %s bytes" % format(len(text), ","))
    return 0


if __name__ == "__main__":
    sys.exit(main())
