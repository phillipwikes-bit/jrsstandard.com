#!/usr/bin/env python3
"""Verify the CEP prep outline against its declared figure sheet.

Two directions, because either one alone is a hole:

  FORWARD   every value declared in cep-article-prep/FIGURES.tsv must appear
            verbatim in the source file that row names. A figure sheet whose
            values are not in the manuscript is a second copy of a fact, which
            is the defect this repository has spent months removing.

  BACKWARD  the outline may reference only keys that FIGURES.tsv declares, and
            it may not contain a bare decimal figure typed inline. Keys are
            written in backticks and substituted at final draft, so a literal
            number in the outline is a figure that escaped the sheet.

Exit 0 when both hold. Anything else prints what failed and exits 1.
"""

from __future__ import annotations

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, "cep-article-prep", "FIGURES.tsv")
OUTLINE = os.path.join(ROOT, "cep-article-prep", "OUTLINE_Detection_Feature.md")

# Numbers the outline is allowed to write out inline, with the reason each is not
# a study figure. Word counts, section counts and issue years are structure, not
# evidence, and keying them would make the outline unreadable for no gain.
INLINE_ALLOWED: dict[str, str] = {
    "24": "the corpus size, stated as a plain count of records",
    "16": "the panel size, written into the working title",
    "95": "the confidence level, not an estimate",
    "100": "the top of the reviewer range and the perfect-scorer figure",
    "2026": "a calendar year",
    "2": "section and list counts",
    "3": "section and list counts",
    "4": "section and list counts",
    "5": "the five review conditions, and list counts",
    "1": "list counts",
    "180": "a target word count",
    "200": "a target word count",
    "160": "a target word count",
    "240": "a target word count",
    "260": "a target word count",
    "1,700": "a target word count",
    "1,900": "a target word count",
    "1,731": "the accepted piece's word count",
    "07": "a date fragment",
    "16.": "a date fragment",
    "21.": "a date fragment",
}

Row = tuple[str, str, str, str]


def read_text(path: str) -> str:
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def load_sheet(path: str) -> list[Row]:
    rows: list[Row] = []
    for lineno, raw in enumerate(read_text(path).splitlines(), start=1):
        line = raw.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 4:
            raise SystemExit(
                "FIGURES.tsv line %d has %d tab-separated fields, expected 4: %r"
                % (lineno, len(parts), line[:80])
            )
        rows.append((parts[0].strip(), parts[1].strip(), parts[2].strip(), parts[3].strip()))
    return rows


def check_forward(rows: list[Row]) -> list[str]:
    problems: list[str] = []
    cache: dict[str, str] = {}
    for key, value, source, _what in rows:
        full = os.path.join(ROOT, source)
        if not os.path.exists(full):
            problems.append("%s: source %s does not exist" % (key, source))
            continue
        if source not in cache:
            cache[source] = read_text(full)
        if value not in cache[source]:
            problems.append("%s: %r does not appear in %s" % (key, value, source))
    return problems


def check_backward(rows: list[Row], outline: str) -> list[str]:
    problems: list[str] = []
    declared = {key for key, _v, _s, _w in rows}

    used = set(re.findall(r"`([a-z_][a-z0-9_]*)`", outline))
    for key in sorted(used - declared):
        problems.append("outline references `%s`, which FIGURES.tsv does not declare" % key)

    unused = sorted(declared - used)
    if unused:
        problems.append(
            "declared but unused in the outline, so the sheet and the draft have "
            "diverged: %s" % ", ".join(unused)
        )

    # A bare decimal is always a study figure in this corpus. Integers are
    # ambiguous, so they are checked against the allowlist instead.
    body = re.sub(r"`[^`]*`", " ", outline)
    for match in re.finditer(r"(?<![\w.])(\d+\.\d+)(?![\w.])", body):
        problems.append(
            "outline types the figure %s inline; use a key from FIGURES.tsv"
            % match.group(1)
        )
    # A thousands separator must not split a number into two tokens: "1,700"
    # was being read as 700, which is not a figure anyone wrote.
    for match in re.finditer(r"(?<![\w.,])(\d{1,3}(?:,\d{3})+|\d{2,4})(?![\w.,%])", body):
        token = match.group(1)
        if token not in INLINE_ALLOWED:
            problems.append(
                "outline types %s inline and it is not on the allowlist" % token
            )
    return problems


def main() -> int:
    for path in (SHEET, OUTLINE):
        if not os.path.exists(path):
            print("FAIL  missing %s" % os.path.relpath(path, ROOT))
            return 1

    rows = load_sheet(SHEET)
    outline = read_text(OUTLINE)

    forward = check_forward(rows)
    backward = check_backward(rows, outline)

    print("%-58s %s" % ("figure sheet rows loaded", len(rows)))
    if forward:
        print("FAIL  every declared figure appears in its source")
        for line in forward:
            print("        %s" % line)
    else:
        print("PASS  every declared figure appears verbatim in its source")

    if backward:
        print("FAIL  the outline uses only declared figures")
        for line in backward:
            print("        %s" % line)
    else:
        print("PASS  the outline uses only declared figures, and uses all of them")

    failed = len(forward) + len(backward)
    print("\n%d row(s) checked, %d problem(s)" % (len(rows), failed))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
